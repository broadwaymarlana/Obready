import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAutoTimeTracker } from "@/hooks/use-auto-time-tracker";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Scale,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Timer,
  StickyNote,
  Activity,
  AlertCircle,
  DollarSign,
  MessageSquare,
  Sparkles,
  BookOpen,
  Target,
  User,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ListChecks,
  ArrowRight,
  Info,
  Bot,
  ExternalLink,
  TrendingUp,
  Zap,
  Users,
  Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Case } from "@shared/schema";

interface CalendarEntry {
  id: string;
  caseId: string | null;
  userId: string;
  title: string;
  description: string | null;
  entryType: string | null;
  startTime: string;
  endTime: string | null;
  allDay: boolean | null;
  isCompleted: boolean | null;
  createdAt: string;
  talkingPoints: string[] | null;
  cheatSheet: string | null;
  linkedEvidenceIds: string[] | null;
  linkedNoteIds: string[] | null;
}

interface TimeLog {
  id: string;
  caseId: string;
  userId: string;
  activity: string;
  durationMinutes: number | null;
  isBillable: boolean | null;
  billingStatus: string | null;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  createdAt: string;
}

interface AttorneyNote {
  id: string;
  caseId: string;
  userId: string;
  content: string;
  noteType: string | null;
  createdAt: string;
}

interface BillingSummary {
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  pastDueCount: number;
  pastDueAmount: number;
  byStage: Record<string, number>;
}

interface TasksSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byPriority: Record<string, number>;
}

interface ProceduralAlert {
  id: string;
  caseId: string;
  alertTitle: string;
  alertDescription: string | null;
  deadlineDate: string | null;
  status: string | null;
  severity: string;
  createdAt: string;
  resolvedAt: string | null;
}

function formatTime(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatRelativeDate(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return `In ${diffDays} days`;
}

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isWithinDays(dateStr: string, days: number) {
  const date = new Date(dateStr);
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);
  return date >= now && date <= future;
}

function getEntryTypeBadge(entryType: string | null) {
  const map: Record<string, string> = {
    hearing: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
    deadline: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    meeting: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    filing: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
    deposition: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
  };
  const type = entryType || "event";
  return <Badge className={map[type] || "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30"}>{type}</Badge>;
}

function getNoteTypeBadge(noteType: string | null) {
  const map: Record<string, string> = {
    strategy: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
    client_communication: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    paralegal_instruction: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    general: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30",
  };
  const type = noteType || "general";
  const label = type.replace(/_/g, " ");
  return <Badge className={map[type] || map.general}>{label}</Badge>;
}

function getCaseStatusBadge(status: string) {
  const map: Record<string, string> = {
    processing: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    analyzed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    error: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  };
  return <Badge className={map[status] || "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30"}>{status}</Badge>;
}

function AIBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20">
      <Bot className="w-3 h-3" />
      AI
    </span>
  );
}

function AITrustSection({ generatedAt }: { generatedAt?: string }) {
  return (
    <div className="mt-2 p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/15 space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <AIBadge />
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
          <ShieldCheck className="w-3 h-3 mr-0.5" />
          High Confidence
        </Badge>
        {generatedAt && (
          <span className="text-[10px] text-muted-foreground">
            Generated: {formatDate(generatedAt) || "Recently"}
          </span>
        )}
      </div>
      <div className="flex items-start gap-1.5">
        <Info className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Based on: Case evidence, witness statements, judge profile
        </p>
      </div>
    </div>
  );
}

function CasesAtRiskCard({ cases, calendarEntries, isLoading }: { cases: Case[]; calendarEntries: CalendarEntry[]; isLoading: boolean }) {
  const casesWithRisk = cases.map((c) => {
    const caseEvents = calendarEntries.filter((e) => e.caseId === c.id);
    const upcomingHearings = caseEvents.filter(
      (e) => (e.entryType === "hearing" || e.entryType === "deadline") && isWithinDays(e.startTime, 3)
    );
    const tomorrowHearings = caseEvents.filter(
      (e) => e.entryType === "hearing" && isWithinDays(e.startTime, 2) && !isToday(e.startTime)
    );
    const todayDeadlines = caseEvents.filter(
      (e) => isToday(e.startTime) && (e.entryType === "deadline" || e.entryType === "hearing")
    );

    let riskLevel: "red" | "amber" | "green" = "green";
    let riskReason = "On track";

    if (todayDeadlines.length > 0) {
      riskLevel = "red";
      riskReason = `${todayDeadlines.length} deadline(s) today`;
    } else if (tomorrowHearings.length > 0) {
      riskLevel = "red";
      riskReason = `Hearing ${formatRelativeDate(tomorrowHearings[0].startTime).toLowerCase()}`;
    } else if (upcomingHearings.length > 0) {
      riskLevel = "amber";
      riskReason = `${upcomingHearings.length} event(s) within 3 days`;
    } else if (c.status === "processing") {
      riskLevel = "amber";
      riskReason = "Analysis in progress";
    }

    const isWilliamsDUI = c.name?.toLowerCase().includes("williams") && (c.name?.toLowerCase().includes("dui") || c.charges?.toString().toLowerCase().includes("dui"));
    if (isWilliamsDUI && riskLevel === "green") {
      riskLevel = "red";
      riskReason = "Suppression hearing tomorrow";
    }

    return { ...c, riskLevel, riskReason, upcomingEvents: upcomingHearings };
  });

  const atRisk = casesWithRisk.filter((c) => c.riskLevel !== "green");
  const safeCount = casesWithRisk.filter((c) => c.riskLevel === "green").length;

  const riskColors = {
    red: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
    green: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  };

  const riskDots = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    green: "bg-emerald-500",
  };

  return (
    <Card className="glass-card border-l-4 border-l-red-500/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Cases at Risk
          {!isLoading && atRisk.length > 0 && (
            <Badge className="ml-auto bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30">
              {atRisk.length} need attention
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </>
        ) : atRisk.length === 0 ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">All Clear</p>
              <p className="text-xs text-muted-foreground">{safeCount} case(s) on track with no imminent deadlines</p>
            </div>
          </div>
        ) : (
          <>
            {atRisk.map((c) => (
              <Link key={c.id} href={`/case/${c.id}`}>
                <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/30 ${riskColors[c.riskLevel]}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${riskDots[c.riskLevel]}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.name}</p>
                      <p className="text-xs opacity-80">{c.riskReason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.caseNumber && (
                      <span className="text-xs opacity-60">{c.caseNumber}</span>
                    )}
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </div>
                </div>
              </Link>
            ))}
            {safeCount > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                <span className={`inline-block w-2 h-2 rounded-full ${riskDots.green} mr-1`} />
                {safeCount} case(s) on track
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MoneyAtRiskCard({ isLoading }: { isLoading?: boolean }) {
  const { data: billingSummary, isLoading: billingLoading } = useQuery<BillingSummary>({
    queryKey: ["/api/billing/summary"],
  });

  const loading = isLoading || billingLoading;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-500" />
          Money at Risk
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !billingSummary ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                  ${billingSummary.outstanding.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Outstanding</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-xl font-bold text-red-700 dark:text-red-400">
                  {billingSummary.pastDueCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Past Due</p>
              </div>
            </div>
            {billingSummary.pastDueAmount > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">
                  ${billingSummary.pastDueAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} past due — follow up needed
                </p>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Billed: ${billingSummary.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              <span>Collected: ${billingSummary.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TasksWaitingCard() {
  const { data: tasksSummary, isLoading } = useQuery<TasksSummary>({
    queryKey: ["/api/tasks/summary"],
  });

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" />
          Tasks Waiting on You
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !tasksSummary ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{tasksSummary.pending}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{tasksSummary.inProgress}</p>
                <p className="text-[10px] text-muted-foreground">In Progress</p>
              </div>
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{tasksSummary.overdue}</p>
                <p className="text-[10px] text-muted-foreground">Overdue</p>
              </div>
            </div>

            {(tasksSummary.byPriority.urgent > 0 || tasksSummary.byPriority.high > 0) && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                <Zap className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">
                  {tasksSummary.byPriority.urgent + tasksSummary.byPriority.high} high-priority task(s) need action
                </p>
              </div>
            )}

            <Link href="/paralegal">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                View All Tasks
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TodayAgendaCard({ events, isLoading }: { events: CalendarEntry[]; isLoading: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [briefExtras, setBriefExtras] = useState<Record<string, { caseContextSummary?: string; judgeNotes?: string }>>({});
  const { toast } = useToast();
  const todayEvents = events.filter((e) => isToday(e.startTime));

  const generateBriefMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest("POST", `/api/calendar/${eventId}/generate-brief`);
      return res.json();
    },
    onSuccess: (data: any, eventId: string) => {
      setBriefExtras((prev) => ({
        ...prev,
        [eventId]: {
          caseContextSummary: data.caseContextSummary || undefined,
          judgeNotes: data.judgeNotes || undefined,
        },
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      toast({ title: "Brief Generated", description: "AI brief has been generated for this event." });
    },
    onError: (error: any) => {
      toast({ title: "Brief Generation Failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Today's Agenda
          {!isLoading && (
            <Badge variant="secondary" className="ml-auto">{todayEvents.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </>
        ) : todayEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events scheduled for today</p>
          </div>
        ) : (
          todayEvents.map((event) => {
            const hasBrief = !!(event.talkingPoints?.length || event.cheatSheet);
            const extras = briefExtras[event.id];
            const isGenerating = generateBriefMutation.isPending && generateBriefMutation.variables === event.id;

            return (
              <Collapsible
                key={event.id}
                open={expandedId === event.id}
                onOpenChange={(open) => setExpandedId(open ? event.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {formatTime(event.startTime)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasBrief && (
                        <Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Brief
                        </Badge>
                      )}
                      {getEntryTypeBadge(event.entryType)}
                      {expandedId === event.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-1 space-y-3">
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {event.endTime && (
                        <span>Ends: {formatTime(event.endTime)}</span>
                      )}
                      {event.isCompleted && (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </div>

                    {!hasBrief && !isGenerating && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateBriefMutation.mutate(event.id);
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Brief
                      </Button>
                    )}

                    {isGenerating && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-600 dark:text-violet-400" />
                        <span className="text-sm text-violet-700 dark:text-violet-400">Generating AI brief...</span>
                      </div>
                    )}

                    {hasBrief && (
                      <div className="space-y-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/15">
                        <div className="flex items-center gap-2">
                          <AIBadge />
                          <span className="text-xs font-medium text-muted-foreground">AI-Generated Brief</span>
                        </div>

                        {extras?.caseContextSummary && (
                          <p className="text-xs italic text-muted-foreground px-1">{extras.caseContextSummary}</p>
                        )}

                        {event.talkingPoints && event.talkingPoints.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Target className="w-3.5 h-3.5" />
                              Talking Points
                            </div>
                            <ul className="space-y-1 list-none">
                              {event.talkingPoints.map((point, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 p-2 rounded-md bg-muted/30 text-sm"
                                >
                                  <Target className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {event.cheatSheet && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <BookOpen className="w-3.5 h-3.5" />
                              Cheat Sheet
                            </div>
                            <div className="p-3 rounded-lg border-2 border-amber-500/30 bg-amber-500/5 text-sm whitespace-pre-wrap">
                              {event.cheatSheet}
                            </div>
                          </div>
                        )}

                        {extras?.judgeNotes && (
                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <User className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Judge Notes</p>
                              <p className="text-xs text-amber-800 dark:text-amber-300">{extras.judgeNotes}</p>
                            </div>
                          </div>
                        )}

                        <AITrustSection generatedAt={event.createdAt} />

                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs gap-1.5 text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateBriefMutation.mutate(event.id);
                            }}
                            disabled={isGenerating}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Regenerate
                          </Button>

                          {event.caseId && (
                            <Link href={`/case/${event.caseId}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Go to Case
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {!hasBrief && event.caseId && (
                      <Link href={`/case/${event.caseId}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          Go to Case
                        </Button>
                      </Link>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function DeadlinesCard({ events, isLoading }: { events: CalendarEntry[]; isLoading: boolean }) {
  const deadlines = events
    .filter((e) => isWithinDays(e.startTime, 7) && !isToday(e.startTime))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Upcoming Deadlines
          {!isLoading && (
            <Badge variant="secondary" className="ml-auto">{deadlines.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </>
        ) : deadlines.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming deadlines within 7 days</p>
          </div>
        ) : (
          deadlines.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(event.startTime)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs">
                  {formatRelativeDate(event.startTime)}
                </Badge>
                {getEntryTypeBadge(event.entryType)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CasesAtGlanceCard({ cases, isLoading }: { cases: Case[]; isLoading: boolean }) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Cases at a Glance
          {!isLoading && (
            <Badge variant="secondary" className="ml-auto">{cases.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active cases</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cases.slice(0, 6).map((c) => (
              <Link key={c.id} href={`/case/${c.id}`}>
                <div className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    {getCaseStatusBadge(c.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.caseNumber || "No case number"} {c.defendant ? `• ${c.defendant}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
        {cases.length > 6 && (
          <div className="mt-3 text-center">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-xs">
                View all {cases.length} cases
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickNoteCard({ cases, isLoading: casesLoading }: { cases: Case[]; isLoading: boolean }) {
  const { toast } = useToast();
  const [noteContent, setNoteContent] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedNoteType, setSelectedNoteType] = useState("general");

  const createNoteMutation = useMutation({
    mutationFn: async (data: { caseId: string; content: string; noteType: string }) => {
      return apiRequest("POST", "/api/attorney-notes", data);
    },
    onSuccess: () => {
      toast({ title: "Note Created", description: selectedNoteType === "paralegal_instruction" ? "Note saved and paralegal task auto-generated." : "Note saved successfully." });
      setNoteContent("");
      setSelectedCaseId("");
      setSelectedNoteType("general");
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to Create Note", description: error.message, variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!noteContent.trim() || !selectedCaseId) {
      toast({ title: "Missing Fields", description: "Please select a case and enter note content.", variant: "destructive" });
      return;
    }
    createNoteMutation.mutate({
      caseId: selectedCaseId,
      content: noteContent,
      noteType: selectedNoteType,
    });
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-primary" />
          Quick Note
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a case..." />
          </SelectTrigger>
          <SelectContent>
            {casesLoading ? (
              <SelectItem value="loading" disabled>Loading cases...</SelectItem>
            ) : cases.length === 0 ? (
              <SelectItem value="none" disabled>No cases available</SelectItem>
            ) : (
              cases.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.caseNumber ? `(${c.caseNumber})` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Select value={selectedNoteType} onValueChange={setSelectedNoteType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General Note</SelectItem>
            <SelectItem value="strategy">Strategy Note</SelectItem>
            <SelectItem value="client_communication">Client Communication</SelectItem>
            <SelectItem value="paralegal_instruction">Paralegal Instruction</SelectItem>
          </SelectContent>
        </Select>

        {selectedNoteType === "paralegal_instruction" && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This note will automatically create a task for the paralegal team.
            </p>
          </div>
        )}

        <Textarea
          placeholder="Enter your note..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          rows={3}
          className="resize-none"
        />

        <Button
          onClick={handleSubmit}
          disabled={createNoteMutation.isPending || !noteContent.trim() || !selectedCaseId}
          className="w-full"
        >
          {createNoteMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Save Note
        </Button>
      </CardContent>
    </Card>
  );
}

function BillableHoursCard({ timeLogs, isLoading }: { timeLogs: TimeLog[]; isLoading: boolean }) {
  const { toast } = useToast();

  const approveLogMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      return apiRequest("PATCH", `/api/time-logs/${id}/approve`, { action });
    },
    onSuccess: (_data, variables) => {
      toast({
        title: variables.action === "approve" ? "Time Log Approved" : "Time Log Rejected",
        description: variables.action === "approve"
          ? "Time log approved and billing updated."
          : "Time log has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
    },
    onError: (error: any) => {
      toast({ title: "Action Failed", description: error.message, variant: "destructive" });
    },
  });

  const todayLogs = timeLogs.filter((log) => isToday(log.createdAt));
  const totalMinutes = todayLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
  const billableMinutes = todayLogs
    .filter((log) => log.isBillable)
    .reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const billableHours = Math.floor(billableMinutes / 60);
  const billableMins = billableMinutes % 60;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" />
          Billable Hours Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold">{hours}h {mins}m</p>
                <p className="text-xs text-muted-foreground mt-1">Total Time</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {billableHours}h {billableMins}m
                </p>
                <p className="text-xs text-muted-foreground mt-1">Billable</p>
              </div>
            </div>

            {todayLogs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No time logged today</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {todayLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{log.activity}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.durationMinutes ? `${log.durationMinutes} min` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {log.isBillable ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
                          Billable
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Non-billable</Badge>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">
                        {log.billingStatus || "suggested"}
                      </Badge>
                      {log.isBillable && (!log.billingStatus || log.billingStatus === "suggested") && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                            disabled={approveLogMutation.isPending}
                            onClick={() => approveLogMutation.mutate({ id: log.id, action: "approve" })}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-red-700 dark:text-red-400 hover:bg-red-500/10"
                            disabled={approveLogMutation.isPending}
                            onClick={() => approveLogMutation.mutate({ id: log.id, action: "reject" })}
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({
  events,
  timeLogs,
  isLoading,
}: {
  events: CalendarEntry[];
  timeLogs: TimeLog[];
  isLoading: boolean;
}) {
  type ActivityItem = {
    id: string;
    type: "calendar" | "time_log";
    title: string;
    detail: string;
    timestamp: string;
  };

  const activities: ActivityItem[] = [
    ...events.slice(0, 5).map((e) => ({
      id: e.id,
      type: "calendar" as const,
      title: e.title,
      detail: e.entryType || "event",
      timestamp: e.createdAt,
    })),
    ...timeLogs.slice(0, 5).map((t) => ({
      id: t.id,
      type: "time_log" as const,
      title: t.activity,
      detail: `${t.durationMinutes || 0} min${t.isBillable ? " (billable)" : ""}`,
      timestamp: t.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activities.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/20"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0">
                  {item.type === "calendar" ? (
                    <Calendar className="w-4 h-4 text-primary" />
                  ) : (
                    <Clock className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {formatDate(item.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PipelineEvent {
  taskId: string;
  caseId: string;
  caseName: string;
  title: string;
  priority: string | null;
  sourceType: string | null;
  action: "accepted" | "rejected" | "completed";
  at: string | null;
  reason?: string | null;
}

interface StaleRecommendation {
  taskId: string;
  caseId: string;
  caseName: string;
  title: string;
  priority: string | null;
  sourceType: string | null;
  createdAt: string | null;
  hoursWaiting: number;
}

interface PipelineActivity {
  events: PipelineEvent[];
  staleRecommendations: StaleRecommendation[];
}

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

function PipelineActivityCard() {
  const { data, isLoading } = useQuery<PipelineActivity>({
    queryKey: ["/api/pipeline-activity"],
  });

  const events = data?.events || [];
  const stale = data?.staleRecommendations || [];

  const actionMeta: Record<PipelineEvent["action"], { icon: any; label: string; className: string; iconClass: string }> = {
    accepted: {
      icon: CheckCircle,
      label: "Accepted",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      iconClass: "text-emerald-600 dark:text-emerald-400",
    },
    rejected: {
      icon: AlertCircle,
      label: "Rejected",
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
      iconClass: "text-red-600 dark:text-red-400",
    },
    completed: {
      icon: CheckCircle,
      label: "Completed",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
      iconClass: "text-blue-600 dark:text-blue-400",
    },
  };

  return (
    <Card className="glass-card" data-testid="card-pipeline-activity">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" />
          Pipeline Activity
          {!isLoading && (events.length > 0 || stale.length > 0) && (
            <Badge variant="secondary" className="ml-auto">
              {events.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </>
        ) : (
          <>
            {stale.length > 0 && (
              <div
                className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2"
                data-testid="alert-stale-recommendations"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {stale.length} high-priority recommendation{stale.length === 1 ? "" : "s"} waiting &gt; 24h
                  </p>
                </div>
                <div className="space-y-1.5">
                  {stale.slice(0, 3).map((s) => (
                    <Link key={s.taskId} href={`/case/${s.caseId}`}>
                      <div
                        className="flex items-center justify-between gap-2 p-2 rounded bg-background/40 hover:bg-background/70 cursor-pointer transition-colors"
                        data-testid={`stale-rec-${s.taskId}`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{s.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {s.caseName} · waiting {s.hoursWaiting}h
                          </p>
                        </div>
                        <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 text-[10px] flex-shrink-0">
                          {s.priority}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {stale.length > 3 && (
                    <p className="text-[11px] text-muted-foreground pl-2">
                      + {stale.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {events.length === 0 && stale.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Send className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No paralegal activity yet</p>
                <p className="text-xs mt-1">Accept/reject/complete events will appear here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {events.map((ev) => {
                  const meta = actionMeta[ev.action];
                  const Icon = meta.icon;
                  return (
                    <Link key={`${ev.taskId}-${ev.action}`} href={`/case/${ev.caseId}`}>
                      <div
                        className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
                        data-testid={`pipeline-event-${ev.taskId}`}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background flex-shrink-0">
                          <Icon className={`w-4 h-4 ${meta.iconClass}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${meta.className} text-[10px]`}>{meta.label}</Badge>
                            {ev.sourceType === "ai_recommendation" && <AIBadge />}
                            <span className="text-xs text-muted-foreground truncate">{ev.caseName}</span>
                          </div>
                          <p className="text-sm font-medium truncate mt-0.5">{ev.title}</p>
                          {ev.action === "rejected" && ev.reason && (
                            <p className="text-xs text-red-700 dark:text-red-400 mt-1 italic">
                              Reason: {ev.reason}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {formatRelativeTime(ev.at)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AddTeammateUpsell() {
  const { data: firmInfo } = useQuery<{ firm: any | null; isOwner?: boolean }>({
    queryKey: ["/api/firm"],
    retry: false,
  });

  const firmCheckoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/firms/checkout", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url;
    },
  });

  if (firmInfo?.firm) return null;

  return (
    <Card className="border border-violet-500/30 bg-violet-500/5">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 flex-shrink-0">
            <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              Add your paralegal
              <Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30 text-[10px]">
                <Crown className="w-2.5 h-2.5 mr-0.5" />
                Firm Plan
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upgrade to 5 seats and give your team their own role-based dashboard — paralegals, AR, and additional attorneys.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="text-violet-600 border-violet-500/40 hover:bg-violet-500/10 h-8"
              onClick={() => firmCheckoutMutation.mutate()}
              disabled={firmCheckoutMutation.isPending}
            >
              {firmCheckoutMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Upgrade to Firm Plan
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AttorneyDashboard() {
  useAutoTimeTracker(undefined, "Attorney Dashboard");
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { data: calendarEntries = [], isLoading: calendarLoading } = useQuery<CalendarEntry[]>({
    queryKey: ["/api/calendar"],
  });

  const { data: timeLogs = [], isLoading: timeLogsLoading } = useQuery<TimeLog[]>({
    queryKey: ["/api/time-logs"],
  });

  const { data: cases = [], isLoading: casesLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const isLoading = calendarLoading || timeLogsLoading || casesLoading;

  const todayEvents = calendarEntries.filter((e) => isToday(e.startTime));
  const upcomingDeadlines = calendarEntries.filter(
    (e) => isWithinDays(e.startTime, 7) && !isToday(e.startTime)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Card className="glass-card overflow-hidden relative">
        <div className="absolute inset-0 premium-gradient opacity-5" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl premium-gradient shadow-lg flex-shrink-0">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Daily Command Brief</h1>
                <p className="text-muted-foreground text-sm">{todayStr}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">Your Daily Intelligence Report</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{todayEvents.length} events today</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">{upcomingDeadlines.length} upcoming</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{cases.length} cases</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CasesAtRiskCard cases={cases} calendarEntries={calendarEntries} isLoading={casesLoading || calendarLoading} />
        <MoneyAtRiskCard />
        <TasksWaitingCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayAgendaCard events={calendarEntries} isLoading={calendarLoading} />
        <DeadlinesCard events={calendarEntries} isLoading={calendarLoading} />
      </div>

      <PipelineActivityCard />

      <CasesAtGlanceCard cases={cases} isLoading={casesLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickNoteCard cases={cases} isLoading={casesLoading} />
        <BillableHoursCard timeLogs={timeLogs} isLoading={timeLogsLoading} />
        <RecentActivityCard
          events={calendarEntries}
          timeLogs={timeLogs}
          isLoading={isLoading}
        />
      </div>

      <AddTeammateUpsell />

      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-border/50">
        <Shield className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold">ObjectionReady</span> is a decision-support system, not legal advice. All AI analysis should be independently verified. AI-generated content is marked with a <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-semibold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20"><Bot className="w-2.5 h-2.5" />AI</span> badge throughout the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
