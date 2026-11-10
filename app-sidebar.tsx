import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  FileText,
  Scale,
  Users,
  Clock,
  ShieldAlert,
  FileOutput,
  Search,
  GitCompareArrows,
  MessageSquare,
  FileStack,
  BookOpen,
  LogOut,
  Crown,
  CreditCard,
  Target,
  ListTodo,
  Video,
  Camera,
  Swords,
  Lightbulb,
  MapPin,
  DollarSign,
  ClipboardList,
  Briefcase,
  Landmark,
  Languages,
  UserCheck,
  FileUp,
  Dices,
  Bell,
  Wifi,
  BarChart3,
  ChevronDown,
  Gavel,
  Shield,
  Settings,
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/components/paywall";

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  isNew?: boolean;
};

const caseWorkItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Upload Case", url: "/upload", icon: Upload },
  { title: "Search", url: "/search", icon: Search },
];

const strategyItems: MenuItem[] = [
  { title: "Strategy Generator", url: "/strategy-generator", icon: Lightbulb, isNew: true },
  { title: "Strategy Center", url: "/strategy", icon: Target, isNew: true },
  { title: "Defense Playbooks", url: "/playbooks", icon: BookOpen },
  { title: "Case Phases", url: "/phases", icon: ListTodo, isNew: true },
];

const researchItems: MenuItem[] = [
  { title: "Legal Research", url: "/legal-research", icon: BookOpen, isNew: true },
  { title: "LA Statutes", url: "/legal-reference", icon: Scale, isNew: true },
  { title: "Court Forms", url: "/court-forms", icon: FileText, isNew: true },
  { title: "Parish Insights", url: "/parish-insights", icon: MapPin, isNew: true },
];

const analysisItems: MenuItem[] = [
  { title: "Witnesses", url: "/witnesses", icon: Users },
  { title: "Evidence", url: "/evidence", icon: FolderOpen },
  { title: "Timeline", url: "/timeline", icon: Clock },
  { title: "Weaknesses", url: "/weaknesses", icon: ShieldAlert },
  { title: "Contradictions", url: "/contradictions", icon: Swords, isNew: true },
  { title: "Contradiction Detector", url: "/contradiction-detector", icon: Search, isNew: true },
  { title: "Video Evidence", url: "/video-evidence", icon: Video, isNew: true },
  { title: "Video Analyzer", url: "/video-analyzer", icon: Camera, isNew: true },
];

const aiToolsItems: MenuItem[] = [
  { title: "Sentencing Analysis", url: "/sentencing-analysis", icon: BarChart3, isNew: true },
  { title: "Voir Dire Generator", url: "/voir-dire", icon: Gavel, isNew: true },
  { title: "Case Simulation", url: "/case-simulation", icon: Dices, isNew: true },
  { title: "Legal Translator", url: "/legal-translator", icon: Languages, isNew: true },
  { title: "Expert Witnesses", url: "/expert-directory", icon: UserCheck, isNew: true },
];

const manageItems: MenuItem[] = [
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Export", url: "/export", icon: FileOutput },
  { title: "E-Filing", url: "/e-filing", icon: FileUp, isNew: true },
  { title: "Docket Monitor", url: "/docket-monitor", icon: Bell, isNew: true },
  { title: "Collaboration", url: "/collaboration", icon: MessageSquare, isNew: true },
  { title: "Compare Cases", url: "/compare", icon: GitCompareArrows },
  { title: "Annotations", url: "/annotations", icon: MessageSquare },
  { title: "Templates", url: "/templates", icon: FileStack },
  { title: "Motion Packs", url: "/motion-packs", icon: FileStack, isNew: true },
];

const federalMenuItems: MenuItem[] = [
  { title: "Federal Case Tree", url: "/federal", icon: Landmark, isNew: true },
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Upload Case", url: "/upload", icon: Upload },
  { title: "Search", url: "/search", icon: Search },
];

const paralegalMenuItems: MenuItem[] = [
  { title: "Paralegal Dashboard", url: "/paralegal", icon: ClipboardList, isNew: true },
];

const accountsMenuItems: MenuItem[] = [
  { title: "Accounts Dashboard", url: "/accounts", icon: DollarSign, isNew: true },
];

const attorneyMenuItems: MenuItem[] = [
  { title: "Attorney Brief", url: "/attorney", icon: Briefcase, isNew: true },
];

function CollapsibleSection({
  label,
  items,
  location,
  defaultOpen = false,
}: {
  label: string;
  items: MenuItem[];
  location: string;
  defaultOpen?: boolean;
}) {
  const hasActive = items.some((item) => location === item.url);
  const [open, setOpen] = useState(defaultOpen || hasActive);

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 cursor-pointer select-none flex items-center justify-between hover:text-muted-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </SidebarGroupLabel>
      {open && (
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={location === item.url}
                  data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className="h-8"
                >
                  <Link href={item.url}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                    {item.isNew && (
                      <span className="ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                        New
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { subscriptionStatus, hasActiveSubscription } = useSubscription();
  const { activeRole } = useRole();
  const jurisdiction = location.startsWith("/federal") ? "federal" : "state";

  const handleJurisdictionChange = (newJurisdiction: "state" | "federal") => {
    if (newJurisdiction === "federal" && !location.startsWith("/federal")) {
      navigate("/federal");
    } else if (newJurisdiction === "state" && location.startsWith("/federal")) {
      navigate("/");
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return "U";
  };

  const isAccountsOnly = activeRole === "accounts";

  return (
    <Sidebar className="sidebar-luxury">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 luxury-gradient-animated blur-md opacity-60" />
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl luxury-gradient shadow-lg">
              <Scale className="w-5 h-5 text-black/80" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground font-serif">ObjectionReady</h1>
            <p className="text-xs text-muted-foreground">Premium Legal Intelligence</p>
          </div>
        </div>
        <div className="flex mt-3 rounded-lg border border-sidebar-border/50 overflow-hidden">
          <button
            onClick={() => handleJurisdictionChange("state")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              jurisdiction === "state"
                ? "bg-primary text-primary-foreground"
                : "bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-foreground"
            }`}
          >
            <MapPin className="w-3 h-3" />
            State
          </button>
          <button
            onClick={() => handleJurisdictionChange("federal")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              jurisdiction === "federal"
                ? "bg-primary text-primary-foreground"
                : "bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-foreground"
            }`}
          >
            <Landmark className="w-3 h-3" />
            Federal
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2 overflow-y-auto sidebar-scroll">
        {/* Role-specific top section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {(activeRole === "paralegal"
                ? paralegalMenuItems
                : activeRole === "accounts"
                  ? accountsMenuItems
                  : attorneyMenuItems
              ).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url} className="h-8">
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                      {item.isNew && (
                        <span className="ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                          New
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {jurisdiction === "federal" ? (
          <CollapsibleSection label="Federal Practice" items={federalMenuItems} location={location} defaultOpen />
        ) : (
          <>
            <CollapsibleSection label="Cases" items={caseWorkItems} location={location} defaultOpen />

            {!isAccountsOnly && (
              <>
                <CollapsibleSection label="Strategy" items={strategyItems} location={location} defaultOpen />
                <CollapsibleSection label="Research" items={researchItems} location={location} />
                <CollapsibleSection label="Case Analysis" items={analysisItems} location={location} />
                <CollapsibleSection label="AI Tools" items={aiToolsItems} location={location} />
                <CollapsibleSection label="Manage & Export" items={manageItems} location={location} />
              </>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/50 space-y-2">
        {hasActiveSubscription && (
          <SidebarMenuButton
            asChild
            isActive={location === "/team-settings"}
            className="w-full"
            data-testid="nav-team-settings"
          >
            <Link href="/team-settings">
              <Users className="w-4 h-4" />
              <span>Team &amp; Seats</span>
            </Link>
          </SidebarMenuButton>
        )}
        {!hasActiveSubscription && (
          <Link href="/pricing" data-testid="nav-pricing" className="block">
            <div className="relative overflow-hidden rounded-xl p-3 luxury-gradient shadow-lg hover:shadow-primary/30 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className="flex items-center gap-3 relative">
                <Crown className="w-5 h-5 text-black/80" />
                <span className="font-semibold text-black/80">Upgrade to Pro</span>
              </div>
            </div>
          </Link>
        )}
        {hasActiveSubscription && (
          <SidebarMenuButton
            asChild
            isActive={location === "/pricing"}
            className="w-full"
            data-testid="nav-manage-subscription"
          >
            <Link href="/pricing">
              <CreditCard className="w-4 h-4" />
              <span>Manage Subscription</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {subscriptionStatus === "active" ? "Pro" : subscriptionStatus}
              </Badge>
            </Link>
          </SidebarMenuButton>
        )}
        {isAuthenticated && user && (
          <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent/50">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
              <AvatarFallback className="text-xs">
                {getInitials(user.firstName, user.lastName, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-user-name">
                {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.email}
              </p>
              {user.firstName && user.email && (
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              )}
            </div>
            <Link
              href="/settings"
              data-testid="nav-settings"
              aria-label="Account settings"
              className="p-2 rounded-md hover:bg-sidebar-accent transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <a
              href="/api/logout"
              data-testid="button-logout"
              aria-label="Log out"
              className="p-2 rounded-md hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </a>
          </div>
        )}
        <Link href="/security" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
          <Shield className="w-3.5 h-3.5" />
          Security &amp; Privacy
        </Link>
        <div className="flex items-center justify-center gap-3 pt-1">
          <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
          <span className="text-muted-foreground text-xs">·</span>
          <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          <span className="text-muted-foreground text-xs">·</span>
          <a href="/support" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Support</a>
          <span className="text-muted-foreground text-xs">·</span>
          <a href="/settings/email-preferences" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Emails</a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
