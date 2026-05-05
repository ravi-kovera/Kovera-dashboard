import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Skeleton,
} from "@/components/ui";
import {
  UserCog,
  Users,
  BarChart2,
  RefreshCw,
  CalendarDays,
  TrendingUp,
  MapPin,
  Briefcase,
} from "lucide-react";
import {
  useClientRatio,
  useAgentRegistrations,
  useAgentsByBrokerage,
  useLicenseCoverage,
  useClientStatus,
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

/* ── Skeletons ── */
function KPISkeleton() {
  return (
    <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
      <div className="w-10 h-10 rounded-xl skeleton" />
      <div className="w-24 h-8 rounded-lg skeleton" />
      <div className="w-32 h-4 rounded skeleton" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex items-end gap-2 h-[200px] px-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-1">
          <Skeleton className="w-full rounded-t" style={{ height: `${30 + ((i * 17) % 60)}%` }} />
        </div>
      ))}
    </div>
  );
}

/* ── Stat Card ── */
const ACCENT = {
  purple: { bg: "bg-purple-500/10", icon: "text-purple-400" },
  blue:   { bg: "bg-blue-500/10",   icon: "text-blue-400"   },
  amber:  { bg: "bg-amber-500/10",  icon: "text-amber-400"  },
  green:  { bg: "bg-green-500/10",  icon: "text-green-400"  },
};

function StatCard({ icon: Icon, title, value, sub, accent = "purple", loading }) {
  const a = ACCENT[accent] || ACCENT.purple;
  if (loading) return <KPISkeleton />;
  return (
    <div className="rounded-2xl bg-surface border border-border p-5 space-y-4 hover:border-border-light transition-colors">
      <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${a.icon}`} />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value ?? "—"}</p>
        <p className="text-sm text-muted mt-0.5">{title}</p>
      </div>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

/* ── Colors ── */
const STATUS_COLORS  = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"];
const BROKERAGE_COLOR = "#a855f7";

/* ══════════════════════════════════════════
   AGENTS PAGE
   ══════════════════════════════════════════ */
export default function AgentsPage() {
  const [dateRange] = useState(() => ({
    from: "2025-01-01T00:00:00Z",
    to: new Date().toISOString(),
  }));

  const ratioQ        = useClientRatio();
  const regsQ         = useAgentRegistrations({ ...dateRange, granularity: "month" });
  const brokerageQ    = useAgentsByBrokerage();
  const licenseQ      = useLicenseCoverage();
  const clientStatusQ = useClientStatus();

  const ratio        = ratioQ.data        ?? null;
  const regs         = regsQ.data         ?? null;
  const brokerage    = brokerageQ.data    ?? null;
  const license      = licenseQ.data      ?? null;
  const clientStatus = clientStatusQ.data ?? null;

  /* ── Registrations chart ── */
  const regsChart = useMemo(() => {
    if (!regs?.buckets) return [];
    return regs.buckets.map((b) => ({
      month: monthLabel(b.period),
      agents: b.count,
    }));
  }, [regs]);

  /* ── Brokerage bar chart (top 8) ── */
  const brokerageChart = useMemo(() => {
    if (!brokerage?.brokerages) return [];
    return brokerage.brokerages.slice(0, 8).map((b) => ({
      name: b.brokerage.length > 18 ? b.brokerage.slice(0, 18) + "…" : b.brokerage,
      fullName: b.brokerage,
      count: b.count,
    }));
  }, [brokerage]);

  /* ── License coverage (top 10 states) ── */
  const licenseChart = useMemo(() => {
    if (!license?.states) return [];
    return license.states.slice(0, 10).map((s) => ({
      state: s.state || "N/A",
      count: s.count,
    }));
  }, [license]);

  /* ── Client status pie ── */
  const statusPie = useMemo(() => {
    if (!clientStatus?.statuses) return [];
    return clientStatus.statuses.map((s, i) => ({
      name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
      value: s.count,
      color: STATUS_COLORS[i % STATUS_COLORS.length],
    }));
  }, [clientStatus]);

  const statusTotal = useMemo(
    () => statusPie.reduce((s, x) => s + x.value, 0),
    [statusPie]
  );

  const refetchAll = () => {
    ratioQ.refetch();
    regsQ.refetch();
    brokerageQ.refetch();
    licenseQ.refetch();
    clientStatusQ.refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Agents</h1>
          <p className="text-muted mt-1 text-sm">Agent registrations, brokerages, and client analytics.</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={UserCog}
          title="Total Agents"
          value={fmtNum(ratio?.totalAgents)}
          loading={ratioQ.isLoading}
          accent="purple"
        />
        <StatCard
          icon={Users}
          title="Total Clients"
          value={fmtNum(ratio?.totalClients)}
          loading={ratioQ.isLoading}
          accent="blue"
        />
        <StatCard
          icon={BarChart2}
          title="Avg Clients / Agent"
          value={ratio?.avgClientsPerAgent != null ? ratio.avgClientsPerAgent.toFixed(2) : "—"}
          sub="Across all agents"
          loading={ratioQ.isLoading}
          accent="amber"
        />
      </div>

      {/* ── Row 1: Registrations + Brokerage ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Registrations — Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Agent Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {regsQ.isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={regsChart}>
                  <defs>
                    <linearGradient id="gradAgents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="agents" name="Agents" stroke="#a855f7" strokeWidth={2} fill="url(#gradAgents)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {regs && (
              <p className="text-xs text-muted mt-2 text-center">
                Total registered: <span className="text-white font-semibold">{fmtNum(regs.total)}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Agents by Brokerage — Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" /> By Brokerage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {brokerageQ.isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={brokerageChart} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Agents" fill={BROKERAGE_COLOR} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: License Coverage + Client Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Coverage — Top States */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> License Coverage
              <span className="ml-auto text-xs text-muted font-normal">Top 10 states</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {licenseQ.isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={licenseChart} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
                  <XAxis dataKey="state" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Agents">
                    {licenseChart.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} radius={[6, 6, 0, 0]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Client Status — Donut + Legend ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Client Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientStatusQ.isLoading ? <ChartSkeleton /> : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusPie}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {statusPie.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-950 border border-border">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-sm text-muted flex-1">{item.name}</span>
                      <span className="text-sm font-semibold text-white">{fmtNum(item.value)}</span>
                      {statusTotal > 0 && (
                        <span className="text-xs text-muted w-10 text-right">
                          {((item.value / statusTotal) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
