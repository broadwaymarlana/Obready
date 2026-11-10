import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  Bell,
  ArrowRight,
  User,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Case } from "@shared/schema";

const STAGES = [
  { key: "lead", label: "Lead", color: "bg-slate-500" },
  { key: "retainer_sent", label: "Retainer Sent", color: "bg-blue-500" },
  { key: "retainer_signed", label: "Retainer Signed", color: "bg-indigo-500" },
  { key: "payment_pending", label: "Payment Pending", color: "bg-amber-500" },
  { key: "partial_paid", label: "Partial Paid", color: "bg-orange-500" },
  { key: "past_due", label: "Past Due", color: "bg-red-500" },
  { key: "paid_in_full", label: "Paid in Full", color: "bg-emerald-500" },
  { key: "archived", label: "Archived", color: "bg-gray-400" },
  { key: "active_case", label: "Active Case", color: "bg-teal-500" },
] as const;

interface BillingEntry {
  id: string;
  caseId: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  stage: string;
  retainerAmount: string | null;
  totalBilled: string | null;
  totalPaid: string | null;
  outstandingBalance: string | null;
  lastContactDate: string | null;
  nextFollowUpDate: string | null;
  riskLevel: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function parseAmount(val: string | null | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getRiskBadge(risk: string | null) {
  switch (risk?.toLowerCase()) {
    case "high":
      return <Badge variant="destructive">High Risk</Badge>;
    case "medium":
      return (
        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
          Medium Risk
        </Badge>
      );
    case "low":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
          Low Risk
        </Badge>
      );
    default:
      return null;
  }
}

function getStageLabel(stageKey: string): string {
  return STAGES.find((s) => s.key === stageKey)?.label || stageKey;
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  loading,
  colorClass,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  loading?: boolean;
  colorClass: string;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <span className="text-3xl font-bold">{value}</span>
            )}
          </div>
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${colorClass} shadow-lg`}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClientCard({
  entry,
  onChangeStage,
}: {
  entry: BillingEntry;
  onChangeStage: (id: string, newStage: string) => void;
}) {
  const outstanding = parseAmount(entry.outstandingBalance);
  const totalBilled = parseAmount(entry.totalBilled);

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">
              {entry.clientName || "Unknown Client"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Case: {entry.caseId?.slice(0, 8)}...
            </p>
          </div>
          {getRiskBadge(entry.riskLevel)}
        </div>

        {totalBilled > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Billed</span>
            <span className="font-medium">{formatCurrency(totalBilled)}</span>
          </div>
        )}
        {outstanding > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Outstanding</span>
            <span className="font-medium text-red-600 dark:text-red-400">
              {formatCurrency(outstanding)}
            </span>
          </div>
        )}
        {entry.retainerAmount && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Retainer</span>
            <span className="font-medium">
              {formatCurrency(parseAmount(entry.retainerAmount))}
            </span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Last contact: {formatDate(entry.lastContactDate)}
        </div>

        <Select
          value={entry.stage}
          onValueChange={(val) => onChangeStage(entry.id, val)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

function FollowUpAlerts({ entries }: { entries: BillingEntry[] }) {
  const now = new Date();
  const overdueItems = entries.filter((e) => {
    if (!e.nextFollowUpDate) return false;
    return new Date(e.nextFollowUpDate) < now;
  });

  if (overdueItems.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-600" />
          Follow-Up Alerts ({overdueItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {overdueItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {item.clientName || "Unknown Client"}
              </p>
              <p className="text-xs text-muted-foreground">
                Follow-up was due: {formatDate(item.nextFollowUpDate)}
              </p>
            </div>
            <Badge variant="destructive" className="text-xs shrink-0">
              Overdue
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AddClientDialog({
  cases,
  open,
  onOpenChange,
}: {
  cases: Case[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    caseId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    stage: "lead",
    retainerAmount: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/billing", data);
    },
    onSuccess: () => {
      toast({
        title: "Client Added",
        description: "New billing entry created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
      onOpenChange(false);
      setForm({
        caseId: "",
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        stage: "lead",
        retainerAmount: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Client to Pipeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Case</Label>
            <Select
              value={form.caseId}
              onValueChange={(val) => setForm({ ...form, caseId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.caseNumber ? ` (${c.caseNumber})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input
              value={form.clientName}
              onChange={(e) =>
                setForm({ ...form, clientName: e.target.value })
              }
              placeholder="Full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.clientEmail}
                onChange={(e) =>
                  setForm({ ...form, clientEmail: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.clientPhone}
                onChange={(e) =>
                  setForm({ ...form, clientPhone: e.target.value })
                }
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={form.stage}
                onValueChange={(val) => setForm({ ...form, stage: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Retainer Amount</Label>
              <Input
                value={form.retainerAmount}
                onChange={(e) =>
                  setForm({ ...form, retainerAmount: e.target.value })
                }
                placeholder="5000"
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => createMutation.mutate(form)}
            disabled={!form.caseId || !form.clientName || createMutation.isPending}
          >
            {createMutation.isPending ? "Adding..." : "Add to Pipeline"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountsDashboard() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: billingEntries = [], isLoading: billingLoading } = useQuery<
    BillingEntry[]
  >({
    queryKey: ["/api/billing"],
  });

  const { data: cases = [], isLoading: casesLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      return apiRequest("PATCH", `/api/billing/${id}`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
      toast({ title: "Stage Updated", description: "Client stage has been changed." });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChangeStage = (id: string, newStage: string) => {
    updateStageMutation.mutate({ id, stage: newStage });
  };

  const entriesByStage = useMemo(() => {
    const map: Record<string, BillingEntry[]> = {};
    for (const s of STAGES) {
      map[s.key] = [];
    }
    for (const entry of billingEntries) {
      const stage = entry.stage || "lead";
      if (!map[stage]) map[stage] = [];
      map[stage].push(entry);
    }
    return map;
  }, [billingEntries]);

  const stats = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let outstanding = 0;
    let pastDueAmount = 0;

    for (const entry of billingEntries) {
      totalBilled += parseAmount(entry.totalBilled);
      totalPaid += parseAmount(entry.totalPaid);
      outstanding += parseAmount(entry.outstandingBalance);
      if (entry.stage === "past_due") {
        pastDueAmount += parseAmount(entry.outstandingBalance);
      }
    }

    return { totalBilled, totalPaid, outstanding, pastDueAmount };
  }, [billingEntries]);

  const isLoading = billingLoading || casesLoading;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Accounts Receivable</h1>
          <p className="text-muted-foreground mt-1">
            Manage your billing pipeline, track payments, and follow up on
            outstanding balances.
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Billed"
          value={formatCurrency(stats.totalBilled)}
          icon={DollarSign}
          loading={isLoading}
          colorClass="from-blue-500 to-blue-600"
        />
        <SummaryCard
          title="Total Paid"
          value={formatCurrency(stats.totalPaid)}
          icon={CheckCircle}
          loading={isLoading}
          colorClass="from-emerald-500 to-emerald-600"
        />
        <SummaryCard
          title="Outstanding"
          value={formatCurrency(stats.outstanding)}
          icon={Clock}
          loading={isLoading}
          colorClass="from-amber-500 to-amber-600"
        />
        <SummaryCard
          title="Past Due"
          value={formatCurrency(stats.pastDueAmount)}
          icon={AlertTriangle}
          loading={isLoading}
          colorClass="from-red-500 to-red-600"
        />
      </div>

      <FollowUpAlerts entries={billingEntries} />

      <div>
        <h2 className="text-xl font-semibold mb-4">Billing Pipeline</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4 min-w-[1200px]">
              {STAGES.map((stage) => {
                const items = entriesByStage[stage.key] || [];
                return (
                  <div
                    key={stage.key}
                    className="flex-1 min-w-[200px] max-w-[250px]"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-3 h-3 rounded-full ${stage.color}`}
                      />
                      <h3 className="text-sm font-semibold">{stage.label}</h3>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {items.length}
                      </Badge>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 min-h-[200px]">
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          No clients
                        </p>
                      ) : (
                        items.map((entry) => (
                          <ClientCard
                            key={entry.id}
                            entry={entry}
                            onChangeStage={handleChangeStage}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <AddClientDialog
        cases={cases}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}
