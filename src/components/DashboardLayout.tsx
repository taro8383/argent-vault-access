import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TierBadge } from "@/components/TierBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useSound, useHoverSound } from "@/hooks/use-sound";
import SoundToggle from "@/components/SoundToggle";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo 1.svg";

// ─── Trade Sidebar Items ────────────────────────────────────────────────────

const TRADE_NAV = [
  { label: "Portfolio",    path: "/trade/dashboard/portfolio" },
  { label: "Events",       path: "/trade/dashboard/events" },
  { label: "Intelligence", path: "/trade/dashboard/intelligence" },
  { label: "Education",    path: "/trade/dashboard/education" },
  { label: "Orders",       path: "/trade/dashboard/orders" },
  { label: "Partner Hub",  path: "/trade/dashboard/partners" },
  { label: "Contact",      path: "/trade/dashboard/contact" },
];

const SOCIETY_TABS = [
  { label: "Allocations", path: "/society/dashboard/allocations" },
  { label: "Purchase",    path: "/society/dashboard/purchases" },
  { label: "Events",      path: "/society/dashboard/events" },
  { label: "Cellar",      path: "/society/dashboard/cellar" },
  { label: "Profile",     path: "/society/dashboard/profile" },
];

// ─── Trade Sidebar Nav Item ─────────────────────────────────────────────────

const TradeNavItem = ({ label, path, isActive }: { label: string; path: string; isActive: boolean }) => {
  const hoverSound = useHoverSound();
  return (
    <Link to={path} {...hoverSound} className="relative flex items-center gap-3 py-3 px-4 group">
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="tradeNav"
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </AnimatePresence>
      <span className={cn(
        "font-sans-nav text-xs tracking-[0.3em] uppercase transition-colors duration-200",
        isActive
          ? "text-primary"
          : "text-muted-foreground group-hover:text-foreground"
      )}>
        {label}
      </span>
    </Link>
  );
};

// ─── Trade Sidebar ──────────────────────────────────────────────────────────

const TradeSidebar = ({
  profile,
  partnerProperty,
  onSignOut,
  showPartnerHub,
}: {
  profile: { full_name: string };
  partnerProperty?: string;
  onSignOut: () => void;
  showPartnerHub: boolean;
}) => {
  const location = useLocation();
  const hoverSound = useHoverSound();
  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const nav = showPartnerHub
    ? TRADE_NAV
    : TRADE_NAV.filter((item) => item.label !== "Partner Hub");

  return (
    <aside className="flex flex-col h-full bg-glass-strong border-r border-border w-64 shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/">
          <img src={logo} alt="GC Wines" className="w-24 h-auto" />
        </Link>
      </div>

      {/* User identity */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center bg-primary/10 shrink-0">
            <span className="font-sans-nav text-xs tracking-wider text-primary">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-serif text-base truncate">{profile.full_name}</p>
            {partnerProperty && (
              <p className="font-sans-nav text-[10px] tracking-[0.2em] text-muted-foreground truncate mt-0.5">
                {partnerProperty}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {nav.map((item) => (
          <TradeNavItem
            key={item.path}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
          />
        ))}
      </nav>

      {/* Sound + Sign out */}
      <div className="p-4 border-t border-border space-y-3">
        <SoundToggle />
        <button
          onClick={onSignOut}
          {...hoverSound}
          className="flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 w-full"
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

// ─── Society Top Bar ────────────────────────────────────────────────────────

const SocietyTopBar = ({
  profile,
  memberTier,
  sectionTitle,
  onSignOut,
}: {
  profile: { full_name: string };
  memberTier?: "founding" | "private" | "collector";
  sectionTitle: string;
  onSignOut: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hoverSound = useHoverSound();
  const activeTab = SOCIETY_TABS.find((t) => location.pathname === t.path)?.path ?? SOCIETY_TABS[0].path;

  return (
    <header className="bg-glass-strong border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <Link to="/">
          <img src={logo} alt="GC Wines" className="w-20 h-auto" />
        </Link>

        {/* Section title — desktop */}
        <p className="hidden md:block font-sans-nav text-[11px] tracking-[0.4em] uppercase text-muted-foreground">
          {sectionTitle}
        </p>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-sans-nav text-[11px] tracking-wider text-foreground/70">
              {profile.full_name}
            </span>
            {memberTier && <TierBadge tier={memberTier} />}
          </div>
          <div className="hidden md:flex">
            <SoundToggle />
          </div>
          <button
            onClick={onSignOut}
            {...hoverSound}
            className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs — desktop */}
      <div className="hidden md:block px-6 pb-0">
        <Tabs value={activeTab} onValueChange={(val) => navigate(val)}>
          <TabsList className="bg-transparent h-auto p-0 gap-0 border-b-0">
            {SOCIETY_TABS.map((tab) => (
              <TabsTrigger
                key={tab.path}
                value={tab.path}
                {...hoverSound}
                className={cn(
                  "font-sans-nav text-[10px] tracking-[0.3em] uppercase rounded-none px-5 py-3",
                  "border-b-2 border-transparent data-[state=active]:border-primary",
                  "data-[state=active]:bg-transparent data-[state=active]:text-primary",
                  "text-muted-foreground hover:text-foreground transition-colors duration-200",
                  "data-[state=active]:shadow-none"
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Select — mobile */}
      <div className="md:hidden px-4 pb-3">
        <select
          value={activeTab}
          onChange={(e) => navigate(e.target.value)}
          className="w-full bg-transparent border border-border text-foreground font-sans-nav text-xs tracking-wider py-2 px-3 focus:outline-none focus:border-primary"
        >
          {SOCIETY_TABS.map((tab) => (
            <option key={tab.path} value={tab.path}>{tab.label}</option>
          ))}
        </select>
      </div>
    </header>
  );
};

// ─── DashboardLayout ────────────────────────────────────────────────────────

interface DashboardLayoutProps {
  portal: "trade" | "society";
  children: React.ReactNode;
  sectionTitle?: string;
  showPartnerHub?: boolean;
  memberTier?: "founding" | "private" | "collector";
  partnerProperty?: string;
}

export const DashboardLayout = ({
  portal,
  children,
  sectionTitle = "",
  showPartnerHub = false,
  memberTier,
  partnerProperty,
}: DashboardLayoutProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { playAmbient } = useSound();
  const hoverSound = useHoverSound();

  // Start ambient audio on dashboard mount (mirrors HeroSection behaviour).
  // If audio is already playing from the home page, calling play() again is a no-op.
  useEffect(() => {
    const timer = setTimeout(playAmbient, 1000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await signOut();
    navigate(portal === "trade" ? "/trade" : "/society");
  };

  if (!profile) return null;

  // ── Society layout: top-bar tabs ─────────────────────────────────────────
  if (portal === "society") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SocietyTopBar
          profile={profile}
          memberTier={memberTier}
          sectionTitle={sectionTitle}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 overflow-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
          {children}
        </main>
      </div>
    );
  }

  // ── Trade layout: sidebar (desktop) + Sheet drawer (mobile) ──────────────
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <TradeSidebar
          profile={profile}
          partnerProperty={partnerProperty}
          onSignOut={handleSignOut}
          showPartnerHub={showPartnerHub}
        />
      </div>

      {/* Mobile: top bar + sheet drawer */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-glass-strong border-b border-border flex items-center justify-between px-4 py-3">
        <Link to="/">
          <img src={logo} alt="GC Wines" className="w-16 h-auto" />
        </Link>
        <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          {sectionTitle}
        </p>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button {...hoverSound} className="text-foreground/70 hover:text-foreground transition-colors">
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-background border-r border-border">
            <TradeSidebar
              profile={profile}
              partnerProperty={partnerProperty}
              onSignOut={handleSignOut}
              showPartnerHub={showPartnerHub}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto px-4 md:px-8 lg:px-12 py-8 lg:py-12 lg:mt-0 mt-14">
        {children}
      </main>
    </div>
  );
};
