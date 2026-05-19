import { useState, useMemo } from 'react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Badge,
    Button,
    Skeleton,
} from '@/components/ui';
import { StatCard, EmptyState, DataTable } from '@/components/common';
import {
    UserCog,
    Building2,
    Users,
    TrendingUp,
    RefreshCw,
} from 'lucide-react';
import {
    useAgentRegistrations,
    useAgentsByBrokerage,
    useClientRatio,
    useAgentsList,
    defaultDateRange,
} from '@/services/hooks/useAnalytics';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';

/* ── Helpers ── */
function fmtNum(n) {
    if (n == null) return '—';
    return n.toLocaleString();
}

function monthLabel(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
    });
}

const BROKERAGE_COLORS = [
    '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444',
    '#06b6d4', '#f97316', '#8b5cf6',
];

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-border bg-navy-900 px-3 py-2 shadow-elevated text-xs">
            <p className="text-white font-medium mb-1">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: entry.color }}
                    />
                    <span className="text-muted">{entry.name}:</span>
                    <span className="text-white font-medium">
                        {entry.value?.toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ChartSkeleton({ h = 200 }) {
    return (
        <div className="flex items-end gap-1.5 px-4" style={{ height: h }}>
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1">
                    <Skeleton
                        className="w-full rounded-t"
                        style={{ height: `${25 + ((i * 19) % 55)}%` }}
                    />
                </div>
            ))}
        </div>
    );
}

/* ── Agent list columns ── */
const AGENT_COLUMNS = [
    {
        key: 'fullName',
        label: 'Name / Email',
        render: (_, row) => (
            <div>
                <p className="text-sm font-medium text-white">{row.fullName}</p>
                <p className="text-xs text-muted">{row.workEmail}</p>
            </div>
        ),
    },
    {
        key: 'brokerage',
        label: 'Brokerage',
        render: (v) => (
            <span className="text-sm text-white">{v || '—'}</span>
        ),
    },
    {
        key: 'licenseStates',
        label: 'Licensed In',
        render: (states) =>
            states?.length ? (
                <div className="flex flex-wrap gap-1">
                    {states.slice(0, 4).map((s) => (
                        <Badge key={s} variant="default">
                            {s}
                        </Badge>
                    ))}
                    {states.length > 4 && (
                        <Badge variant="default">+{states.length - 4}</Badge>
                    )}
                </div>
            ) : (
                <span className="text-xs text-muted">—</span>
            ),
    },
    {
        key: 'clientCount',
        label: 'Clients',
        render: (v) => (
            <span className="text-sm font-medium text-white">{v ?? 0}</span>
        ),
    },
    {
        key: 'workPhone',
        label: 'Phone',
        render: (v) => (
            <span className="text-sm text-muted">{v || '—'}</span>
        ),
    },
    {
        key: 'createdAt',
        label: 'Joined',
        render: (v) =>
            v
                ? new Date(v).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                  })
                : '—',
    },
];

/* ══════════════════════════════════════════════
   AGENTS PAGE
   ══════════════════════════════════════════════ */
export default function AgentsPage() {
    const [dateRange] = useState(defaultDateRange);
    const [listPage, setListPage] = useState(1);
    const [listSearch, setListSearch] = useState('');
    const PAGE_SIZE = 20;

    const regQ = useAgentRegistrations({ ...dateRange, granularity: 'month' });
    const brokQ = useAgentsByBrokerage();
    const ratioQ = useClientRatio();
    const listQ = useAgentsList({
        page: listPage,
        limit: PAGE_SIZE,
        search: listSearch,
    });

    const reg = regQ.data ?? null;
    const brok = brokQ.data ?? null;
    const ratio = ratioQ.data ?? null;

    const regChart = useMemo(() => {
        if (!reg?.buckets) return [];
        return reg.buckets.map((b) => ({
            month: monthLabel(b.period),
            agents: b.count,
        }));
    }, [reg]);

    const brokChart = useMemo(() => {
        if (!brok?.brokerages) return [];
        return brok.brokerages.slice(0, 8).map((b) => ({
            brokerage: b.brokerage,
            count: b.count,
        }));
    }, [brok]);

    const refetchAll = () => {
        regQ.refetch();
        brokQ.refetch();
        ratioQ.refetch();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Header ── */}
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Agents
                    </h1>
                    <p className="text-muted mt-1 text-sm">
                        Analytics and agent directory.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={refetchAll}>
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard
                    title="Total Agents"
                    value={fmtNum(ratio?.totalAgents ?? reg?.total)}
                    icon={UserCog}
                    accentColor="purple"
                    loading={ratioQ.isLoading}
                />
                <StatCard
                    title="Total Clients"
                    value={fmtNum(ratio?.totalClients)}
                    icon={Users}
                    accentColor="blue"
                    loading={ratioQ.isLoading}
                />
                <StatCard
                    title="Avg Clients / Agent"
                    value={
                        ratio?.avgClientsPerAgent != null
                            ? ratio.avgClientsPerAgent.toFixed(1)
                            : '—'
                    }
                    icon={Building2}
                    accentColor="green"
                    loading={ratioQ.isLoading}
                />
            </div>

            {/* ── Charts (2-column) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registrations trend */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Registrations (Monthly)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {regQ.isLoading ? (
                            <ChartSkeleton h={200} />
                        ) : !reg ? (
                            <EmptyState
                                variant={regQ.isError ? 'error' : 'empty'}
                                onRetry={regQ.refetch}
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={regChart}>
                                    <defs>
                                        <linearGradient
                                            id="agentRegGrad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#a855f7"
                                                stopOpacity={0.25}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#a855f7"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(51,65,85,0.3)"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={36}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="agents"
                                        name="Agents"
                                        stroke="#a855f7"
                                        strokeWidth={2}
                                        fill="url(#agentRegGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Top brokerages */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-primary" />
                            By Brokerage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {brokQ.isLoading ? (
                            <ChartSkeleton h={200} />
                        ) : !brok ? (
                            <EmptyState
                                variant={brokQ.isError ? 'error' : 'empty'}
                                onRetry={brokQ.refetch}
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart
                                    data={brokChart}
                                    layout="vertical"
                                    barSize={16}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(51,65,85,0.3)"
                                        horizontal={false}
                                    />
                                    <XAxis
                                        type="number"
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="brokerage"
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={90}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar
                                        dataKey="count"
                                        name="Agents"
                                        radius={[0, 4, 4, 0]}
                                    >
                                        {brokChart.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={
                                                    BROKERAGE_COLORS[
                                                        i % BROKERAGE_COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Agent Directory ── */}
            <div>
                <h2 className="text-base font-semibold text-white mb-3">
                    Agent Directory
                </h2>
                <DataTable
                    columns={AGENT_COLUMNS}
                    data={listQ.data?.agents ?? []}
                    total={listQ.data?.total ?? 0}
                    page={listPage}
                    pageSize={PAGE_SIZE}
                    totalPages={listQ.data?.totalPages ?? 1}
                    onPageChange={setListPage}
                    isLoading={listQ.isLoading}
                    searchValue={listSearch}
                    onSearchChange={(v) => {
                        setListSearch(v);
                        setListPage(1);
                    }}
                    searchPlaceholder="Search by name or email…"
                    emptyTitle={
                        listQ.isError ? "Couldn't load agents" : 'No agents found'
                    }
                />
            </div>
        </div>
    );
}
