import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { RoleSwitcher } from "@/components/role-switcher";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/components/paywall";
import { TrialBanner } from "@/components/trial-banner";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { Loader2, Crown, Lock } from "lucide-react";
import { HelpButton } from "@/components/help-button";
import { SentryUserContext } from "@/components/sentry-user-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isNativePlatform } from "@/lib/platform";
import { PaymentFailedBanner } from "@/components/payment-failed-banner";
import Dashboard from "@/pages/dashboard";
import EmailPreferencesPage from "@/pages/email-preferences";
import BillingPage from "@/pages/billing";
import UploadPage from "@/pages/upload";
import WitnessesPage from "@/pages/witnesses";
import EvidencePage from "@/pages/evidence";
import TimelinePage from "@/pages/timeline";
import WeaknessesPage from "@/pages/weaknesses";
import DocumentsPage from "@/pages/documents";
import ExportPage from "@/pages/export";
import SearchPage from "@/pages/search";
import ComparePage from "@/pages/compare";
import AnnotationsPage from "@/pages/annotations";
import TemplatesPage from "@/pages/templates";
import PlaybooksPage from "@/pages/playbooks";
import StrategyCenterPage from "@/pages/strategy-center";
import CasePhasesPage from "@/pages/case-phases";
import VideoEvidencePage from "@/pages/video-evidence";
import ContradictionsPage from "@/pages/contradictions";
import LegalReferencePage from "@/pages/legal-reference";
import StrategyGeneratorPage from "@/pages/strategy-generator";
import CourtFormsPage from "@/pages/court-forms";
import ParishInsightsPage from "@/pages/parish-insights";
import ContradictionDetectorPage from "@/pages/contradiction-detector";
import VideoAnalyzerPage from "@/pages/video-analyzer";
import CaseProfilePage from "@/pages/case-profile";
import FederalCaseTreePage from "@/pages/federal-case-tree";
import ParalegalDashboard from "@/pages/paralegal-dashboard";
import AccountsDashboard from "@/pages/accounts-dashboard";
import AttorneyDashboard from "@/pages/attorney-dashboard";
import PricingPage from "@/pages/pricing";
import CheckoutSuccessPage from "@/pages/checkout-success";
import CheckoutCancelPage from "@/pages/checkout-cancel";
import SentencingAnalysisPage from "@/pages/sentencing-analysis";
import LegalResearchPage from "@/pages/legal-research";
import VoirDirePage from "@/pages/voir-dire";
import CollaborationPage from "@/pages/collaboration";
import ExpertDirectoryPage from "@/pages/expert-directory";
import LegalTranslatorPage from "@/pages/legal-translator";
import EFilingPage from "@/pages/e-filing";
import CaseSimulationPage from "@/pages/case-simulation";
import DocketMonitorPage from "@/pages/docket-monitor";
import OfflineSettingsPage from "@/pages/offline-settings";
import MotionPacksPage from "@/pages/motion-packs";
import LandingPage from "@/pages/landing";
import PrivacyPolicyPage from "@/pages/privacy";
import TermsOfServicePage from "@/pages/terms";
import SupportPage from "@/pages/support";
import NativeLoginPage from "@/pages/native-login";
import SecuritySettingsPage from "@/pages/security-settings";
import TwoFactorChallengePage from "@/pages/two-factor-challenge";
import BarCapturePage from "@/pages/bar-capture";
import { isBarCaptureSkipped } from "@/lib/barCaptureSkip";
import NotFound from "@/pages/not-found";
import SettingsPage from "@/pages/settings";
import TeamSettingsPage from "@/pages/team-settings";
import AcceptInvitePage from "@/pages/accept-invite";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/witnesses" component={WitnessesPage} />
      <Route path="/evidence" component={EvidencePage} />
      <Route path="/timeline" component={TimelinePage} />
      <Route path="/weaknesses" component={WeaknessesPage} />
      <Route path="/documents" component={DocumentsPage} />
      <Route path="/export" component={ExportPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/compare" component={ComparePage} />
      <Route path="/annotations" component={AnnotationsPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/playbooks" component={PlaybooksPage} />
      <Route path="/strategy" component={StrategyCenterPage} />
      <Route path="/phases" component={CasePhasesPage} />
      <Route path="/video-evidence" component={VideoEvidencePage} />
      <Route path="/contradictions" component={ContradictionsPage} />
      <Route path="/legal-reference" component={LegalReferencePage} />
      <Route path="/strategy-generator" component={StrategyGeneratorPage} />
      <Route path="/court-forms" component={CourtFormsPage} />
      <Route path="/parish-insights" component={ParishInsightsPage} />
      <Route path="/contradiction-detector" component={ContradictionDetectorPage} />
      <Route path="/video-analyzer" component={VideoAnalyzerPage} />
      <Route path="/federal" component={FederalCaseTreePage} />
      <Route path="/case/:id" component={CaseProfilePage} />
      <Route path="/sentencing-analysis" component={SentencingAnalysisPage} />
      <Route path="/legal-research" component={LegalResearchPage} />
      <Route path="/voir-dire" component={VoirDirePage} />
      <Route path="/collaboration" component={CollaborationPage} />
      <Route path="/expert-directory" component={ExpertDirectoryPage} />
      <Route path="/legal-translator" component={LegalTranslatorPage} />
      <Route path="/e-filing" component={EFilingPage} />
      <Route path="/case-simulation" component={CaseSimulationPage} />
      <Route path="/docket-monitor" component={DocketMonitorPage} />
      <Route path="/offline-settings" component={OfflineSettingsPage} />
      <Route path="/motion-packs" component={MotionPacksPage} />
      <Route path="/paralegal" component={ParalegalDashboard} />
      <Route path="/accounts" component={AccountsDashboard} />
      <Route path="/attorney" component={AttorneyDashboard} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/checkout/cancel" component={CheckoutCancelPage} />
      <Route path="/security" component={SecuritySettingsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/settings/email-preferences" component={EmailPreferencesPage} />
      <Route path="/billing" component={BillingPage} />
      <Route path="/team-settings" component={TeamSettingsPage} />
      <Route path="/accept-invite/:token" component={AcceptInvitePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function OnboardingController() {
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && user.onboardingCompleted !== "true" && user.id !== "demo-user-001") {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!showOnboarding) return null;
  return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
}

function AuthenticatedLayout() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <SentryUserContext />
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TrialBanner />
          <PaymentFailedBanner />
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <HelpButton />
              <RoleSwitcher />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
      <OnboardingController />
    </SidebarProvider>
  );
}

function SubscriptionRequiredPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <span className="font-semibold text-lg">ObjectionReady</span>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1">
        <Switch>
          <Route path="/pricing" component={PricingPage} />
          <Route path="/checkout/success" component={CheckoutSuccessPage} />
          <Route path="/checkout/cancel" component={CheckoutCancelPage} />
          <Route path="/accept-invite/:token" component={AcceptInvitePage} />
          <Route>
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
              <Card className="max-w-lg w-full text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <Lock className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl" data-testid="text-subscription-required-title">
                    Subscription Required
                  </CardTitle>
                  <CardDescription className="text-base mt-2" data-testid="text-subscription-required-description">
                    ObjectionReady is a premium legal case analysis platform. 
                    Subscribe to unlock AI-powered document parsing, witness management, 
                    evidence tracking, and defense strategy tools.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                    <h4 className="font-medium">What you get:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="text-primary">&#10003;</span> AI-powered case document analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">&#10003;</span> Witness & evidence management
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">&#10003;</span> Prosecution weakness identification
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">&#10003;</span> Louisiana-specific defense strategies
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">&#10003;</span> Court-ready document generation
                      </li>
                    </ul>
                  </div>
                  <Button asChild className="w-full" size="lg" data-testid="button-view-pricing">
                    <a href="/pricing">View Pricing Plans</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

const PUBLIC_PATHS = ["/privacy", "/terms", "/support", "/native-login", "/2fa-challenge", "/bar-capture"];

function AppContent() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: twoFaPending } = useQuery({
    queryKey: ["/api/trust/2fa/pending"],
    queryFn: async () => {
      const r = await fetch("/api/trust/2fa/pending");
      if (!r.ok) return { pending: false };
      return r.json() as Promise<{ pending: boolean }>;
    },
    enabled: isAuthenticated,
    refetchInterval: false,
    staleTime: 10000,
  });
  
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (PUBLIC_PATHS.includes(currentPath)) {
    if (currentPath === "/privacy") return <PrivacyPolicyPage />;
    if (currentPath === "/terms") return <TermsOfServicePage />;
    if (currentPath === "/support") return <SupportPage />;
    if (currentPath === "/native-login") return <NativeLoginPage />;
    if (currentPath === "/2fa-challenge") return <TwoFactorChallengePage />;
    if (currentPath === "/bar-capture") return <BarCapturePage />;
  }

  if (currentPath.startsWith("/accept-invite/")) {
    return <AcceptInvitePage />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    if (isNativePlatform()) {
      return <NativeLoginPage />;
    }
    return <LandingPage />;
  }

  // 2FA challenge pending — redirect to challenge page
  if (twoFaPending?.pending && currentPath !== "/2fa-challenge") {
    return <TwoFactorChallengePage />;
  }

  // Bar capture onboarding — bar number + state are required before accessing the app.
  // The prompt persists until the attorney completes their profile.
  if (
    user &&
    !user.barCaptureCompleted &&
    !isBarCaptureSkipped() &&
    currentPath !== "/bar-capture" &&
    currentPath !== "/security" &&
    currentPath !== "/api/logout"
  ) {
    return <BarCapturePage />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="objection-ready-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
