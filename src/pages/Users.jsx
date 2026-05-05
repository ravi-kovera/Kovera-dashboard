import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Skeleton,
} from "@/components/ui";
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  RefreshCw,
  CalendarDays,
  Bell,
} from "lucide-react";
import {
  useUserActivity,
  useUserSignups,
  useOnboardingFunnel,
  useRolesDistribution,
  defaultDateRange,
} from "@/services/hooks/useAnalytics";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/* ── Helpers ── */
function fmtNum(num) {
  if (num == null) return "—";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function monthLabel(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-navy-900 px-3 py-2 shadow-elevated text-xs">
      <p className="text-white font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted">{entry.name}:</span>
          <span className="text-white font-medium">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Skeleton components ── */
function KPISkeleton() {
  return (
    <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="w-16 h-5 rounded-full skeleton" />
      </div>
      <div className="w-24 h-8 rounded-lg skeleton" />
      <div className="w-32 h-4 rounded skeleton" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-[200px] px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton className="w-full rounded-t" style={{ height: `${30 + ((i * 17) % 60)}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Stat Card ── */
const ACCENT = {
  blue:   { bg: "bg-blue-500/10",   icon: "text-blue-400",   badge: "text-blue-400 bg-blue-500/10" },
  green:  { bg: "bg-green-500/10",  icon: "text-green-400",  badge: "text-green-400 bg-green-500/10" },
  slate:  { bg: "bg-slate-500/10",  icon: "text-slate-400",  badge: "text-slate-400 bg-slate-500/10" },
  purple: { bg: "bg-purple-500/10", icon: "text-purple-400", badge: "text-purple-400 bg-purple-500/10" },
};

function StatCard({ icon: Icon, title, value, sub, accent = "blue", loading }) {
  const a = ACCENT[accent] || ACCENT.blue;
  if (loading) return <KPISkeleton />;
  return (
    <div className="rounded-2xl bg-surface border border-border p-5 space-y-4 hover:border-border-light transition-colors">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${a.icon}`} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{fmtNum(value)}</p>
        <p className="text-sm text-muted mt-0.5">{title}</p>
      </div>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

/* ── Pie colors ── */
const ROLE_COLORS  = ["#22c55e", "#3b82f6", "#f59e0b", "#a855f7"];
const FUNNEL_COLOR = "#3b82f6";

/* ══════════════════════════════════════════
   USERS PAGE
   ══════════════════════════════════════════ */
export default function UsersPage() {
  const [dateRange] = useState(() => ({
    from: "2025-01-01T00:00:00Z",
    to: new Date().toISOString(),
  }));

  const activityQ  = useUserActivity(dateRange);
  const signupsQ   = useUserSignups({ ...dateRange, granularity: "month" });
  const funnelQ    = useOnboardingFunnel();
  const rolesQ     = useRolesDistribution();

  const activity = activityQ.data ?? null;
  const signups  = signupsQ.data  ?? null;
  const funnel   = funnelQ.data   ?? null;
  const roles    = rolesQ.data    ?? null;

  /* ── Signups chart ── */
  const signupsChart = useMemo(() => {
    if (!signups?.buckets) return [];
    return signups.buckets.map((b) => ({
      month: monthLabel(b.period),
      signups: b.count,
    }));
  }, [signups]);

  /* ── Onboarding funnel chart ── */
  const funnelChart = useMemo(() => {
    if (!funnel?.steps) return [];
    const labels = ["Registered", "Profile", "Preferences", "Dream Board", "Location", "Budget", "Completed"];
    return funnel.steps.map((s, i) => ({
      step: labels[i] || `Step ${s.step}`,
      users: s.count,
    }));
  }, [funnel]);

  /* ── Roles pie ── */
  const rolesPie = useMemo(() => {
    if (!roles?.roles) return [];
    return roles.roles.map((r, i) => ({
      name: r.role.charAt(0).toUpperCase() + r.role.slice(1),
      value: r.count,
      color: ROLE_COLORS[i % ROLE_COLORS.length],
    }));
  }, [roles]);

  /* ── Activity breakdown ── */
  const activityPie = useMemo(() => {
    if (!activity) return [];
    return [
      { name: "Active",       value: activity.activeUsers,       color: "#22c55e" },
      { name: "Inactive",     value: activity.inactiveUsers,     color: "#64748b" },
      { name: "Digest Users", value: activity.recentDigestUsers, color: "#3b82f6" },
    ];
  }, [activity]);

  const refetchAll = () => {
    activityQ.refetch();
    signupsQ.refetch();
    funnelQ.refetch();
    rolesQ.refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users</h1>
          <p className="text-muted mt-1 text-sm">User activity and growth analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetchAll}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <CalendarDays className="w-4 h-4" /> Jan 2025 — Today
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="Total Users"
          value={activity?.totalUsers}
          loading={activityQ.isLoading}
          accent="blue"
        />
        <StatCard
          icon={UserCheck}
          title="Active Users"
          value={activity?.activeUsers}
          sub={activity ? `${((activity.activeUsers / activity.totalUsers) * 100).toFixed(1)}% of total` : undefined}
          loading={activityQ.isLoading}
          accent="green"
        />
        <StatCard
          icon={UserX}
          title="Inactive Users"
          value={activity?.inactiveUsers}
          sub={activity ? `${((activity.inactiveUsers / activity.totalUsers) * 100).toFixed(1)}% of total` : undefined}
          loading={activityQ.isLoading}
          accent="slate"
        />
        <StatCard
          icon={Bell}
          title="Digest Users"
          value={activity?.recentDigestUsers}
          sub="Engaged via digest"
          loading={activityQ.isLoading}
          accent="purple"
        />
      </div>

      {/* ── Row 1: Signups + Roles ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Signups — Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> User Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signupsQ.isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={signupsChart}>
                  <defs>
                    <linearGradient id="gradSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="signups" name="Signups" stroke="#22c55e" strokeWidth={2} fill="url(#gradSignups)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {signups && (
              <p className="text-xs text-muted mt-2 text-center">
                Total signups: <span className="text-white font-semibold">{fmtNum(signups.total)}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Roles Distribution — Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> User Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rolesQ.isLoading ? <ChartSkeleton /> : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={rolesPie}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {rolesPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {rolesPie.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-xs text-muted truncate">{item.name}</span>
                      <span className="text-xs font-medium text-white ml-auto">{fmtNum(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Onboarding Funnel + Activity Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Onboarding Funnel — Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Onboarding Funnel
              {funnel && (
                <Badge variant="success" className="ml-auto text-[10px]">
                  {funnel.completedPct}% completed
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnelQ.isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={funnelChart} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
                  <XAxis dataKey="step" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="users" name="Users" fill={FUNNEL_COLOR} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Activity Breakdown — Donut + Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" /> Activity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityQ.isLoading ? <ChartSkeleton /> : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={activityPie}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {activityPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {activityPie.map((item) => (
                    <div key={item.name} className="text-center p-2 rounded-xl bg-navy-950 border border-border">
                      <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ background: item.color }} />
                      <p className="text-lg font-bold text-white">{fmtNum(item.value)}</p>
                      <p className="text-[11px] text-muted">{item.name}</p>
                    </div>
                  ))}
                </div>
                {activity && (
                  <div className="mt-4 p-3 rounded-xl bg-navy-950 border border-border flex items-center justify-between">
                    <span className="text-xs text-muted">Active rate</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-navy-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all duration-1000"
                          style={{ width: `${Math.min((activity.activeUsers / activity.totalUsers) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-white">
                        {((activity.activeUsers / activity.totalUsers) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
