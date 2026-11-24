import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bike,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Circle,
  ClipboardList,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MonitorSmartphone,
  Moon,
  Package2,
  Settings2,
  Settings,
  ShieldCheck,
  Sun,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PaletteSwitcher from "@/components/PaletteSwitcher";
import { getApiAssetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import kabobLogo from "@/assets/logo.webp";

type AdminNavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  group: "operations" | "commerce" | "growth";
};

const navItems: AdminNavItem[] = [
  { to: "/admin/overview", label: "Overview", icon: LayoutDashboard, group: "operations" },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList, group: "operations" },
  { to: "/admin/kitchen", label: "Kitchen", icon: ChefHat, group: "operations" },
  { to: "/admin/riders", label: "Riders", icon: Bike, group: "operations" },
  { to: "/admin/branch-staff", label: "Branch & Staff", icon: ShieldCheck, group: "operations" },
  { to: "/admin/catalog", label: "Catalog", icon: BookOpen, group: "commerce" },
  { to: "/admin/inventory", label: "Inventory", icon: Package2, group: "commerce" },
  { to: "/admin/pos", label: "POS", icon: MonitorSmartphone, group: "operations" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, group: "growth" },
  { to: "/admin/marketing", label: "Marketing", icon: Megaphone, group: "growth" },
];

const navGroups: Array<{ id: AdminNavItem["group"]; label: string }> = [
  { id: "operations", label: "Operations" },
  { id: "commerce", label: "Menu & Supply" },
  { id: "growth", label: "Growth" },
];

const pageMeta: Record<string, { title: string; description: string }> = {
  "/admin/overview": {
    title: "Overview",
    description: "Monitor live operations, order flow, and branch health in one place.",
  },
  "/admin/orders": {
    title: "Orders",
    description: "Track and manage all incoming, active, and completed orders.",
  },
  "/admin/kitchen": {
    title: "Kitchen",
    description: "Real-time kitchen display for order preparation and queue management.",
  },
  "/admin/riders": {
    title: "Riders",
    description: "Monitor delivery riders, assignments, and service capacity.",
  },
  "/admin/branch-staff": {
    title: "Branch & Staff",
    description: "Manage branches, staff activation, and operational coverage.",
  },
  "/admin/catalog": {
    title: "Catalog",
    description: "Organize categories, products, modifiers, and pricing controls.",
  },
  "/admin/inventory": {
    title: "Inventory",
    description: "Track stock levels, restocks, waste, and supply continuity.",
  },
  "/admin/analytics": {
    title: "Analytics",
    description: "Review performance trends, revenue movement, and demand patterns.",
  },
  "/admin/marketing": {
    title: "Marketing",
    description: "Run offers, customer campaigns, and outbound engagement flows.",
  },
  "/admin/pos": {
    title: "Point of Sale",
    description: "Process dine-in, walk-in, and takeaway orders in real time.",
  },
  "/admin/settings": {
    title: "Settings",
    description: "Adjust admin configuration, access controls, and account preferences.",
  },
  "/admin/profile": {
    title: "User Profile",
    description: "Review account identity, session details, and administrator access context.",
  },
};

const BrandMark = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#brandGlow)" fillOpacity="0.15" />
    <circle cx="12" cy="12" r="9.5" stroke="url(#brandGlow)" strokeWidth="1.2" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="url(#brandGlow)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="brandGlow" x1="4" y1="4" x2="20" y2="20">
        <stop stopColor="#ff7a45" />
        <stop offset="1" stopColor="#ff3d6b" />
      </linearGradient>
    </defs>
  </svg>
);

const useClock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    time: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
    date: now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
};

const AdminDashboard = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSiteSettings();
  const brandName = settings.siteName || "Kabob Places";
  const sidebarLogo = (settings.logoSuite?.sidebarLogo ? getApiAssetUrl(settings.logoSuite.sidebarLogo) : "") || kabobLogo;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const { time, date } = useClock();

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const activePage = pageMeta[location.pathname] ?? pageMeta["/admin/overview"];
  const isOverviewRoute = location.pathname === "/admin/overview";
  const avatarUrl = getApiAssetUrl(user?.profilePictureUrl);
  const initials = useMemo(() => {
    const source = user?.fullName?.trim() || brandName;
    const letters = source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? "")
      .join("");
    return letters || "KP";
  }, [user?.fullName, brandName]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  return (
    <div className="min-h-screen overflow-hidden bg-bg text-foreground">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--glow3))_0%,transparent_50%)]" />

      <button
        type="button"
        aria-label="Close sidebar"
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[100] flex flex-col transition-[width] duration-300 ease-out",
          "bg-[hsl(var(--sidebar-background)/0.97)] backdrop-blur-xl border-r border-border text-foreground",
          collapsed ? "w-[72px]" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "relative flex h-[60px] items-center transition-all",
          collapsed ? "justify-center px-3" : "gap-2.5 px-5",
        )}>
          <div className="flex size-9 items-center justify-center rounded-lg overflow-hidden p-0.5">
            <img src={sidebarLogo} alt={brandName} className="size-full object-contain" />
          </div>
          <span className={cn(
            "font-display text-[15px] font-semibold tracking-tight text-white/90 transition-all duration-300 truncate",
            collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100",
          )}>
            {brandName}
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {navGroups.map((group) => (
            <div key={group.id} className="mb-5">
              <div className={cn(
                "mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20 transition-all duration-300",
                collapsed ? "text-center opacity-0 h-0 mb-0" : "opacity-100",
              )}>
                {group.label}
              </div>
              <div className="space-y-0.5">
                {navItems.filter((item) => item.group === group.id).map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150",
                          collapsed ? "justify-center px-2.5 py-2.5" : "gap-2.5 px-3 py-2",
                          isActive
                            ? "bg-primary/20 text-primary font-semibold"
                            : "text-white/60 hover:bg-white/[0.06] hover:text-white",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex size-[18px] items-center justify-center flex-none">
                            <Icon size={16} strokeWidth={isActive ? 2 : 1.5} className={cn(isActive && "text-accent")} />
                          </span>
                          <span className={cn(
                            "whitespace-nowrap transition-all duration-300",
                            collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100",
                          )}>
                            {item.label}
                          </span>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-primary" />
                          )}
                          {collapsed && (
                            <span className="pointer-events-none absolute left-full top-1/2 ml-2.5 -translate-y-1/2 hidden whitespace-nowrap rounded-md bg-[#0B3D0B] px-2.5 py-1.5 text-[11px] font-medium text-white/90 shadow-lg ring-1 ring-white/10 group-hover:block">
                              {item.label}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((value) => !value)}
          className={cn(
            "hidden lg:flex items-center justify-center mx-auto mb-2 size-7 rounded-md text-white/20 transition-all hover:bg-white/[0.06] hover:text-white/50",
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Sidebar Footer */}
        <div className="border-t border-white/[0.06] px-2.5 py-2.5">
          <Link
            to="/admin/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 text-white/40 hover:text-white/80 hover:bg-white/[0.04]",
              collapsed ? "justify-center px-2.5 py-2.5" : "gap-2.5 px-3 py-2",
            )}
          >
            <Settings size={16} strokeWidth={1.5} />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Subtle divider line */}
      <div
        className={cn(
          "pointer-events-none fixed bottom-0 top-0 z-[101] hidden h-full w-px bg-white/[0.03] transition-[left] duration-300 lg:block",
          collapsed ? "left-[72px]" : "left-60",
        )}
      />

      <main className={cn("min-h-screen transition-[margin-left] duration-300", collapsed ? "lg:ml-[72px]" : "lg:ml-60")}>
        <header className="sticky top-0 z-[90] flex h-14 items-center justify-between border-b border-border bg-[hsl(var(--header-bg)/0.96)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="flex size-9 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/[0.05] hover:text-white/60 lg:hidden"
            >
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>

            <div className="hidden items-center gap-2.5 lg:flex">
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold tracking-tight text-white/80">{brandName}</span>
                <span className="text-[10px] text-white/25 font-medium">Admin Console</span>
              </div>
            </div>
          </div>

          {/* Center Section - Clock */}
          <div className="hidden items-center gap-3 xl:flex">
            <div className="flex items-center gap-1.5 rounded-md bg-white/[0.03] px-2.5 py-1.5">
              <Clock3 size={12} className="text-white/25" />
              <span className="font-mono text-[11px] font-medium text-white/40">{time}</span>
            </div>
            <span className="text-white/10">·</span>
            <div className="flex items-center gap-1.5 text-[11px] text-white/25">
              <CalendarDays size={12} />
              <span>{date}</span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* View Storefront */}
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              <ExternalLink size={12} />
              <span>Storefront</span>
            </Link>

            <PaletteSwitcher compact />
            <LanguageSwitcher compact />

            {/* Live Indicator */}
            <div className="hidden items-center gap-1.5 rounded-md bg-emerald-500/[0.06] px-2.5 py-1.5 sm:flex">
              <Circle size={5} fill="currentColor" strokeWidth={0} className="animate-pulse text-emerald-400/70" />
              <span className="text-[10px] font-semibold text-emerald-400/60 tracking-wider">LIVE</span>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="hidden sm:flex items-center justify-center size-8 rounded-md text-white/25 transition-all hover:bg-white/[0.05] hover:text-white/50"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-150",
                  profileOpen
                    ? "bg-white/[0.06]"
                    : "hover:bg-white/[0.04]",
                )}
              >
                {avatarUrl && !avatarLoadFailed ? (
                  <img
                    src={avatarUrl}
                    alt={user?.fullName ?? "Profile"}
                    className="size-7 rounded-full object-cover ring-1 ring-white/10"
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/70 text-[10px] font-bold text-white">
                    {initials}
                  </span>
                )}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-[11px] font-semibold text-white/70">{user?.fullName ?? "Admin"}</span>
                  <span className="text-[9px] text-white/25">{user?.role ?? "Administrator"}</span>
                </div>
                <ChevronDown size={12} className={cn("text-white/20 transition-transform duration-200", profileOpen && "rotate-180")} />
              </button>

              {/* Profile Dropdown Menu */}
              <div
                className={cn(
                  "absolute right-0 top-[calc(100%+6px)] z-[120] w-52 overflow-hidden rounded-lg bg-[#0B3D0B] shadow-2xl ring-1 ring-white/10 transition-all duration-150",
                  profileOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
                )}
              >
                {/* User Info */}
                <div className="border-b border-white/[0.04] px-3.5 py-3">
                  <div className="text-[12px] font-semibold text-white/80">{user?.fullName ?? `${brandName} Admin`}</div>
                  <div className="mt-0.5 text-[10px] text-white/30">{user?.email ?? "admin@kabobplaces.cl"}</div>
                  <div className="mt-1.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary/80">
                    {user?.role ?? "ADMIN"}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1.5 space-y-0.5">
                  <Link
                    to="/admin/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] text-white/40 transition-all hover:bg-white/[0.04] hover:text-white/70"
                  >
                    <User size={14} />
                    <span>Profile</span>
                  </Link>

                  <Link
                    to="/admin/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] text-white/40 transition-all hover:bg-white/[0.04] hover:text-white/70"
                  >
                    <Settings2 size={14} />
                    <span>Settings</span>
                  </Link>

                  <div className="my-1 h-px bg-white/[0.04]" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] text-red-400/60 transition-all hover:bg-red-500/[0.06] hover:text-red-400/80"
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-bg px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          {!isOverviewRoute ? (
            <div className="mb-6 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0B3D0B]/50 px-6 py-5 relative">
              <div className="relative z-10">
                <h1 className="text-2xl font-semibold tracking-tight text-white/90">{activePage.title}</h1>
                <p className="mt-1 text-[13px] text-white/30 leading-relaxed max-w-2xl">{activePage.description}</p>
              </div>
            </div>
          ) : null}

          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
