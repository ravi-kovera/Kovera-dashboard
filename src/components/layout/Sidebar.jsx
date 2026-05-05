import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart2,
  Search,
  Users,
  UserCheck,
  Building2,
  ArrowLeftRight,
  Settings,
  LogOut,
  ChevronLeft,
  X,
  Heart,
  Link2,
  Share2,
  UserCog,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { KoveraLogo } from "@/components/common/KoveraLogo";

/* ── Navigation Config ── */
const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { to: "/search", label: "Search", icon: Search },
  { to: "/users", label: "Users", icon: Users },
  { to: "/agents", label: "Agents", icon: UserCheck },
];

const analyticsNav = [
  { to: "/engagement", label: "Engagement", icon: Heart },
  { to: "/chains", label: "Chains", icon: Link2 },
  { to: "/referrals", label: "Referrals", icon: Share2 },
  { to: "/agent-analytics", label: "Agent Analytics", icon: UserCog },
];

const managementNav = [
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/trades", label: "Trades", icon: ArrowLeftRight },
  { to: "/chain-management", label: "Chains", icon: GitBranch },
];

const systemNav = [
  { to: "/settings", label: "Settings", icon: Settings },
];

/* ── NavItem ── */
function NavItem({ to, label, icon: Icon, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted hover:text-white hover:bg-surface-hover"
        )
      }
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
          )}
          <Icon
            className={cn(
              "w-5 h-5 shrink-0 transition-all duration-200",
              isActive
                ? "text-primary"
                : "group-hover:scale-110 group-hover:text-white"
            )}
          />
          {!collapsed && (
            <span className="animate-fade-in truncate">{label}</span>
          )}
        </>
      )}
    </NavLink>
  );
}

/* ── NavGroup ── */
function NavGroup({ title, items, collapsed, onNavigate }) {
  return (
    <div>
      {!collapsed && title && (
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 animate-fade-in">
          {title}
        </p>
      )}
      {collapsed && title && (
        <div className="mx-auto my-2 w-6 border-t border-border" />
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

/* ── Sidebar ── */
export function Sidebar() {
  const { collapsed, toggle, isOpen, close } = useSidebar();
  const { logout } = useAuth();

  // On mobile: close sidebar after navigating
  const handleNavigate = () => {
    if (window.innerWidth < 1024) close();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-navy-900 border-r border-border flex flex-col transition-all duration-300 ease-out",
        /* Desktop behavior */
        collapsed ? "lg:w-[72px]" : "lg:w-64",
        /* Mobile: off-screen by default, slide in when isOpen */
        "w-64 -translate-x-full lg:translate-x-0",
        isOpen && "translate-x-0"
      )}
    >
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          {collapsed ? (
            <KoveraLogo size={28} className="shrink-0 text-white" />
          ) : (
            <img
              src="/kovera-logo.svg"
              alt="Kovera"
              className="h-8 object-contain animate-fade-in"
            />
          )}
        </div>
        {/* Mobile close button */}
        <button
          onClick={close}
          className="p-2 rounded-xl text-muted hover:text-white hover:bg-surface-hover transition-colors cursor-pointer lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        <NavGroup title="Overview" items={mainNav} collapsed={collapsed} onNavigate={handleNavigate} />
        <NavGroup title="Analytics" items={analyticsNav} collapsed={collapsed} onNavigate={handleNavigate} />
        <NavGroup title="Management" items={managementNav} collapsed={collapsed} onNavigate={handleNavigate} />
        <NavGroup title="System" items={systemNav} collapsed={collapsed} onNavigate={handleNavigate} />
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        {/* Collapse button — desktop only */}
        <button
          onClick={toggle}
          className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-white hover:bg-surface-hover transition-all duration-200 w-full cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 shrink-0 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span className="animate-fade-in">Collapse</span>}
        </button>
        <button
          onClick={() => logout?.()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 w-full cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
