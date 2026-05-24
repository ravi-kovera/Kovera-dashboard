import { useState, useMemo } from 'react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Badge,
    Skeleton,
} from '@/components/ui';
import { StatCard, EmptyState } from '@/components/common';
import {
    Link2,
    Layers,
    Timer,
    GitBranch,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Search as SearchIcon,
    Zap,
} from 'lucide-react';
import {
    useChainStatus,
    useChainTypes,
    useChainSize,
} from '@/services/hooks/useAnalytics';
import {
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
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

const STATUS_COLORS = {
    detected: '#3b82f6',
    confirmed: '#22c55e',
    completed: '#a855f7',
    broken: '#ef4444',
};

const TYPE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];
const SIZE_COLORS = ['#60a5fa', '#22d3ee', '#34d399', '#fbbf24', '#f87171'];

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

function ChartSkeleton() {
    return (
        <div className="flex items-end gap-2 h-[200px] px-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1">
                    <Skeleton
                        className="w-full rounded-t"
                        style={{ height: `${30 + Math.random() * 60}%` }}
                    />
                </div>
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════════
   CHAINS PAGE
   ══════════════════════════════════════════════ */
export default function ChainsPage() {
    const [dateRange] = useState(() => ({
        from: '2025-01-01T00:00:00Z',
        to: new Date().toISOString(),
    }));

    const statusQ = useChainStatus(dateRange);
    const typesQ = useChainTypes();
    const sizeQ = useChainSize();

    const status = statusQ.data ?? null;
    const types = typesQ.data ?? null;
    const size = sizeQ.data ?? null;

    const totalChains = status?.statuses?.reduce((s, v) => s + v.count, 0) || 0;

    // ── Status pie ──
    const statusPie = useMemo(() => {
        if (!status?.statuses) return [];
        return status.statuses.map((s) => ({
            name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
            value: s.count,
            color: STATUS_COLORS[s.status] || '#64748b',
        }));
    }, [status]);

    // ── Types bar ──
    const typesChart = useMemo(() => {
        if (!types?.types) return [];
        return types.types.map((t) => ({
            type: t.chainType
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '),
            count: t.count,
        }));
    }, [types]);

    // ── Size bar ──
    const sizeChart = useMemo(() => {
        if (!size?.distribution) return [];
        return size.distribution.map((d) => ({
            participants: `${d.size} people`,
            count: d.count,
        }));
    }, [size]);

    const refetchAll = () => {
        statusQ.refetch();
        typesQ.refetch();
        sizeQ.refetch();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Chains
                    </h1>
                    <p className="text-muted mt-1 text-sm">
                        Property chain analytics — status, types & size
                        distribution.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={refetchAll}>
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Chains"
                    value={fmtNum(totalChains)}
                    icon={Link2}
                    accentColor="blue"
                />
                <StatCard
                    title="Completed"
                    value={fmtNum(
                        status?.statuses?.find((s) => s.status === 'completed')
                            ?.count,
                    )}
                    icon={CheckCircle2}
                    accentColor="green"
                />
                <StatCard
                    title="Avg Detection → Confirmation"
                    value={
                        status
                            ? `${status.detectionToConfirmationAvgDays} days`
                            : '—'
                    }
                    icon={Timer}
                    accentColor="amber"
                />
                <StatCard
                    title="Avg Participants"
                    value={size ? size.avgParticipants.toFixed(1) : '—'}
                    icon={Layers}
                    accentColor="purple"
                />
            </div>

            {/* ── Row 1: Status + Types ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chain Status — Pie */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" /> Chain
                            Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statusQ.isLoading ? (
                            <ChartSkeleton />
                        ) : !status ? (
                            <EmptyState
                                variant={statusQ.isError ? 'error' : 'empty'}
                                onRetry={statusQ.refetch}
                            />
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={statusPie}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {statusPie.map((entry, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={entry.color}
                                                    stroke="transparent"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    {statusPie.map((item) => (
                                        <div
                                            key={item.name}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-navy-950 border border-border"
                                        >
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{
                                                    background: item.color,
                                                }}
                                            />
                                            <span className="text-xs text-muted">
                                                {item.name}
                                            </span>
                                            <span className="text-xs font-semibold text-white ml-auto">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Chain Types — Bar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-primary" /> Chain
                            Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {typesQ.isLoading ? (
                            <ChartSkeleton />
                        ) : !types ? (
                            <EmptyState
                                variant={typesQ.isError ? 'error' : 'empty'}
                                onRetry={typesQ.refetch}
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={typesChart}
                                    layout="vertical"
                                    barSize={24}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(51,65,85,0.3)"
                                        horizontal={false}
                                    />
                                    <XAxis
                                        type="number"
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="type"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={140}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="count" name="Chains">
                                        {typesChart.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={
                                                    TYPE_COLORS[
                                                        i % TYPE_COLORS.length
                                                    ]
                                                }
                                                radius={[0, 6, 6, 0]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Chain Size Distribution ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" /> Chain Size
                        Distribution
                        {size && (
                            <Badge
                                variant="outline"
                                className="ml-auto text-xs"
                            >
                                Avg: {size.avgParticipants} participants
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {sizeQ.isLoading ? (
                        <ChartSkeleton />
                    ) : !size ? (
                        <EmptyState
                            variant={sizeQ.isError ? 'error' : 'empty'}
                            onRetry={sizeQ.refetch}
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={sizeChart} barSize={40}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(51,65,85,0.3)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="participants"
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="count" name="Chains">
                                    {sizeChart.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                SIZE_COLORS[
                                                    i % SIZE_COLORS.length
                                                ]
                                            }
                                            radius={[6, 6, 0, 0]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
