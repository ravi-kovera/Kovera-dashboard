import { useState, useMemo } from "react";
import { StatCard } from "@/components/common";
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
  UserCog,
  Building2,
  Link2,
  Share2,
  Eye,
  Heart,
  UserCheck,
  TrendingUp,
  CalendarDays,
  RefreshCw,
  Activity,
} from "lucide-react";
import {
  useDashboardSummary,
  useUserSignups,
  useOnboardingFunnel,
  useRolesDistribution,
  useUserActivity,
  useImpressions,
  useSwipeRates,
  useListingsOverview,
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
  Legend,
} from "recharts";

/* ── Helpers ── */
function fmtNum(num) {
  if (num == null) return "—";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

/** Safely compute like rate: liked / (liked + dismissed), capped at 100% */
function safeLikeRate(swipeData) {
  if (!swipeData) return 0;
  const total = (swipeData.totalLiked || 0) + (swipeData.totalDismissed || 0);
  if (total === 0) return 0;
  return Math.min(((swipeData.totalLiked / total) * 100), 100).toFixed(2);
}

function fmtPct(pct) {
  if (pct == null) return "";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
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

/* ── KPI Skeleton ── */
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

/* ── Chart Skeleton ── */
function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-[200px] px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton className="w-full rounded-t" style={{ height: `${30 + Math.random() * 60}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
    </div>
  );
}

/* ── PIE COLORS ── */
const ROLE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#a855f7"];
const SOURCE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b"];
const PRICE_COLORS = ["#818cf8", "#60a5fa", "#22d3ee", "#34d399", "#fbbf24", "#f87171"];

/* ══════════════════════════════════════════════
   DASHBOARD PAGE
   ══════════════════════════════════════════════ */
export default function Dashboard() {
  const [dateRange] = useState(() => ({
    from: "2025-01-01T00:00:00Z",
    to: new Date().toISOString(),
  }));

  // ── API Queries ──
  const dashQ = useDashboardSummary(dateRange);
  const signupsQ = useUserSignups({ ...dateRange, granularity: "month" });
  const funnelQ = useOnboardingFunnel();
  const rolesQ = useRolesDistribution();
  const activityQ = useUserActivity(dateRange);
  const swipeQ = useSwipeRates(dateRange);
  const listingsQ = useListingsOverview();

  const dash = dashQ.data ?? null;
  const signups = signupsQ.data ?? null;
  const funnel = funnelQ.data ?? null;
  const roles = rolesQ.data ?? null;
  const activity = activityQ.data ?? null;
  const swipe = swipeQ.data ?? null;
  const listings = listingsQ.data ?? null;

  const isLoading = dashQ.isLoading;

  // ── KPI Cards from dashboard summary ──
  const kpiCards = useMemo(() => {
    if (!dash) return null;
    const pc = dash.periodComparison || {};
    return [
      {
        key: "totalUsers", title: "Total Users", value: fmtNum(dash.totalUsers),
        change: fmtPct(pc.newUsers?.changePct), trend: (pc.newUsers?.changePct || 0) >= 0 ? "up" : "down",
        icon: Users, accentColor: "blue",
      },
      {
        key: "totalAgents", title: "Total Agents", value: fmtNum(dash.totalAgents),
        change: fmtPct(pc.newAgents?.changePct), trend: (pc.newAgents?.changePct || 0) >= 0 ? "up" : "down",
        icon: UserCog, accentColor: "purple",
      },
      {
        key: "totalListings", title: "Total Properties", value: fmtNum(dash.totalListings),
        change: null, trend: "up",
        icon: Building2, accentColor: "green",
      },
      {
        key: "totalChains", title: "Chains", value: fmtNum(dash.totalChains),
        change: fmtPct(pc.newChains?.changePct), trend: (pc.newChains?.changePct || 0) >= 0 ? "up" : "down",
        icon: Link2, accentColor: "amber",
      },
      {
        key: "totalReferrals", title: "Referrals", value: fmtNum(dash.totalReferrals),
        change: fmtPct(pc.newReferrals?.changePct), trend: (pc.newReferrals?.changePct || 0) >= 0 ? "up" : "down",
        icon: Share2, accentColor: "cyan",
      },
      {
        key: "impressions", title: "Impressions", value: fmtNum(pc.impressions?.current),
        change: fmtPct(pc.impressions?.changePct), trend: (pc.impressions?.changePct || 0) >= 0 ? "up" : "down",
        icon: Eye, accentColor: "red",
      },
    ];
  }, [dash]);

  // ── Signups chart data ──
  const signupsChart = useMemo(() => {
    if (!signups?.buckets) return [];
    return signups.buckets.map((b) => ({
      month: monthLabel(b.period),
      signups: b.count,
    }));
  }, [signups]);

  // ── Onboarding funnel chart data ──
  const funnelChart = useMemo(() => {
    if (!funnel?.steps) return [];
    const labels = ["Registered", "Profile", "Preferences", "Dream Board", "Location", "Budget", "Completed"];
    return funnel.steps.map((s, i) => ({
      step: labels[i] || `Step ${s.step}`,
      users: s.count,
      pct: s.pct,
    }));
  }, [funnel]);

  // ── Roles pie data ──
  const rolesPie = useMemo(() => {
    if (!roles?.roles) return [];
    return roles.roles.map((r, i) => ({
      name: r.role.charAt(0).toUpperCase() + r.role.slice(1),
      value: r.count,
      color: ROLE_COLORS[i % ROLE_COLORS.length],
    }));
  }, [roles]);

  // ── Activity pie data ──
  const activityPie = useMemo(() => {
    if (!activity) return [];
    return [
      { name: "Active", value: activity.activeUsers, color: "#22c55e" },
      { name: "Inactive", value: activity.inactiveUsers, color: "#64748b" },
      { name: "Digest Users", value: activity.recentDigestUsers, color: "#3b82f6" },
    ];
  }, [activity]);

  // ── Listings price bands ──
  const priceBandsChart = useMemo(() => {
    if (!listings?.priceBands) return [];
    return listings.priceBands.map((b) => ({
      band: b.label,
      count: b.count,
    }));
  }, [listings]);

  // ── Listings source pie ──
  const sourcePie = useMemo(() => {
    if (!listings?.bySource) return [];
    return listings.bySource.map((s, i) => ({
      name: s.sourceType.charAt(0).toUpperCase() + s.sourceType.slice(1),
      value: s.count,
      color: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }));
  }, [listings]);

  // ── Refresh all ──
  const refetchAll = () => {
    dashQ.refetch();
    signupsQ.refetch();
    funnelQ.refetch();
    rolesQ.refetch();
    activityQ.refetch();
    swipeQ.refetch();
    listingsQ.refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted mt-1 text-sm">
            Platform-wide analytics powered by the Kovera API.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetchAll} title="Refresh all analytics">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <CalendarDays className="w-4 h-4" /> Jan 2025 — Today
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <KPISkeleton key={i} />)
          : kpiCards?.map((kpi) => <StatCard key={kpi.key} {...kpi} />)}
      </div>

      {/* ══════════════════════════════════════════
          CHARTS ROW 1: User Signups + Roles Distribution
          ══════════════════════════════════════════ */}
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
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
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

        {/* Roles Distribution — Pie Chart */}
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
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
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

      {/* ══════════════════════════════════════════
          CHARTS ROW 2: Onboarding Funnel + User Activity
          ══════════════════════════════════════════ */}
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
                  <Bar dataKey="users" name="Users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* User Activity — Donut + Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" /> User Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityQ.isLoading ? <ChartSkeleton /> : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={activityPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════
          CHARTS ROW 3: Engagement Swipe + Listings
          ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swipe/Engagement Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" /> Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {swipeQ.isLoading ? <ChartSkeleton /> : swipe && (
              <>
                <div className="space-y-3">
                  {[
                    { label: "Total Swiped", value: fmtNum(swipe.totalSwiped), color: "#64748b" },
                    { label: "Total Liked", value: fmtNum(swipe.totalLiked), color: "#22c55e" },
                    { label: "Total Dismissed", value: fmtNum(swipe.totalDismissed), color: "#ef4444" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-navy-950 border border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                        <span className="text-sm text-muted">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
                {/* Like Rate Progress */}
                <div className="p-4 rounded-xl bg-navy-950 border border-border text-center">
                  <p className="text-3xl font-bold text-primary">{safeLikeRate(swipe)}%</p>
                  <p className="text-xs text-muted mt-1">Like Rate</p>
                  <div className="w-full h-2 bg-navy-800 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                      style={{ width: `${safeLikeRate(swipe)}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Listings Price Bands — Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Listings by Price
              </CardTitle>
              {listings && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted">Active: <span className="text-white font-semibold">{listings.active}</span></span>
                  <span className="text-muted">Inactive: <span className="text-white font-semibold">{listings.inactive}</span></span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {listingsQ.isLoading ? <ChartSkeleton /> : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={priceBandsChart} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
                      <XAxis dataKey="band" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Listings">
                        {priceBandsChart.map((_, i) => (
                          <Cell key={i} fill={PRICE_COLORS[i % PRICE_COLORS.length]} radius={[6, 6, 0, 0]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Source Pie (side) */}
                <div className="lg:col-span-2">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">By Source</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={sourcePie} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                        {sourcePie.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {sourcePie.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-xs text-muted">{item.name}</span>
                        <span className="text-xs font-medium text-white ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Agent vs Organic */}
                  {listings && (
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
                      <div className="flex-1 text-center">
                        <p className="text-lg font-bold text-white">{listings.agentListed}</p>
                        <p className="text-[10px] text-muted">Agent Listed</p>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="flex-1 text-center">
                        <p className="text-lg font-bold text-white">{listings.organic}</p>
                        <p className="text-[10px] text-muted">Organic</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
