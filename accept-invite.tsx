import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  attorney: "Attorney",
  paralegal: "Paralegal",
  accounts: "Accounts Receivable",
};

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const token = params.token;

  const { data: preview, isLoading: previewLoading, error: previewError } = useQuery<{
    firmName: string;
    role: string;
    email: string | null;
  }>({
    queryKey: [`/api/firm/invite-preview/${token}`],
    enabled: !!token,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/firm/accept-invite/${token}`, undefined);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome to the team!",
        description: `You've joined ${data.firm?.name} as ${ROLE_LABELS[data.role] ?? data.role}.`,
      });
      setTimeout(() => setLocation("/dashboard"), 1500);
    },
    onError: (err: any) => {
      toast({ title: "Failed to accept invite", description: err.message, variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle>Sign in to Accept</CardTitle>
            <CardDescription>
              You need to be signed in to accept this firm invite. Sign in or create an account, then come back to this link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => {
              sessionStorage.setItem("pendingInviteToken", token);
              setLocation("/");
            }}>
              Sign in
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <Crown className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle>Firm Invite</CardTitle>
          <CardDescription>You've been invited to join a firm on ObjectionReady.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : previewError ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-700 dark:text-red-400">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              This invite link is invalid or has expired.
            </div>
          ) : preview ? (
            <>
              <div className="p-4 rounded-lg bg-muted/40 border space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-semibold">{preview.firmName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Your role:</span>
                  <Badge className="text-xs">{ROLE_LABELS[preview.role] ?? preview.role}</Badge>
                </div>
                {preview.email && (
                  <p className="text-xs text-muted-foreground">Invited to: {preview.email}</p>
                )}
              </div>

              {acceptMutation.isSuccess ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  You've joined the firm! Redirecting…
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Accept &amp; Join {preview.firmName}
                </Button>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
