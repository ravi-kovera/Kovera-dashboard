import { useState, useMemo } from 'react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Skeleton,
} from '@/components/ui';
import { StatCard, EmptyState } from '@/components/common';
import {
    Eye,
    Heart,
    ThumbsDown,
    MousePointerClick,
    Layers,
    Image,
    BarChart3,
    TrendingUp,
    RefreshCw,
    CalendarDays,
} from 'lucide-react';
import {
    useImpressions,
    useSwipeRates,
    useFeedDepth,
    useDreamBoard,
    usePreviewConversion,
} from '@/services/hooks/useAnalytics';
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
} from 'recharts';

/* ── Helpers ── */
function fmtNum(n) {
    if (n == null) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

/** Safely compute like rate: liked / (liked + dismissed), capped at 100% */
function safeLikeRate(swipeData) {
    if (!swipeData) return 0;
    const total = (swipeData.totalLiked || 0) + (swipeData.totalDismissed || 0);
    if (total === 0) return 0;
    return Math.min((swipeData.totalLiked / total) * 100, 100).toFixed(2);
}

function weekLabel(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

const DREAM_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'];
const FEED_COLORS = [
    '#818cf8',
    '#60a5fa',
    '#22d3ee',
    '#34d399',
    '#fbbf24',
    '#f87171',
];

/* ── Tooltip ── */
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
        <div className="space-y-3">
            <div className="flex items-end gap-2 h-[200px] px-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex-1">
                        <Skeleton
                            className="w-full rounded-t"
                            style={{ height: `${30 + Math.random() * 60}%` }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   ENGAGEMENT PAGE
   ══════════════════════════════════════════════ */
export default function EngagementPage() {
    const [dateRange] = useState(() => ({
        from: '2025-01-01T00:00:00Z',
        to: new Date().toISOString(),
    }));

    const impQ = useImpressions({ ...dateRange, granularity: 'week' });
    const swipeQ = useSwipeRates(dateRange);
    const feedQ = useFeedDepth();
    const dreamQ = useDreamBoard();
    const previewQ = usePreviewConversion(dateRange);

    const imp = impQ.data ?? null;
    const swipe = swipeQ.data ?? null;
    const feed = feedQ.data ?? null;
    const dream = dreamQ.data ?? null;
    const preview = previewQ.data ?? null;

    // ── Impressions chart: pivot buckets by period ──
    const impChart = useMemo(() => {
        if (!imp?.buckets) return [];
        const map = {};
        imp.buckets.forEach((b) => {
            const key = weekLabel(b.period);
            if (!map[key]) map[key] = { week: key };
            map[key][b.action] = b.count;
        });
        return Object.values(map);
    }, [imp]);

    // ── Feed depth chart ──
    const feedChart = useMemo(() => {
        if (!feed?.distribution) return [];
        return feed.distribution.map((d) => ({
            depth: d.bucket,
            users: d.count,
        }));
    }, [feed]);

    // ── Dream board pie ──
    const dreamPie = useMemo(() => {
        if (!dream?.byCategory) return [];
        return dream.byCategory.map((c, i) => ({
            name: c.category
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '),
            value: c.count,
            color: DREAM_COLORS[i % DREAM_COLORS.length],
        }));
    }, [dream]);

    const refetchAll = () => {
        impQ.refetch();
        swipeQ.refetch();
        feedQ.refetch();
        dreamQ.refetch();
        previewQ.refetch();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Engagement
                    </h1>
                    <p className="text-muted mt-1 text-sm">
                        Impressions, swipes, feed depth & dream board analytics.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={refetchAll}>
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* ── KPI Summary Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Impressions"
                    value={fmtNum(imp?.totals?.shown)}
                    icon={Eye}
                    accentColor="blue"
                />
                <StatCard
                    title="Total Liked"
                    value={fmtNum(swipe?.totalLiked)}
                    icon={Heart}
                    accentColor="red"
                />
                <StatCard
                    title="Like Rate"
                    value={swipe ? `${safeLikeRate(swipe)}%` : '—'}
                    icon={TrendingUp}
                    accentColor="green"
                />
                <StatCard
                    title="Preview Conversion"
                    value={preview ? `${preview.conversionRate}%` : '—'}
                    icon={MousePointerClick}
                    accentColor="purple"
                />
            </div>

            {/* ── Impressions Time Series ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />{' '}
                        Impression Volumes (Weekly)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {impQ.isLoading ? (
                        <ChartSkeleton />
                    ) : !imp ? (
                        <EmptyState
                            variant={impQ.isError ? 'error' : 'empty'}
                            onRetry={impQ.refetch}
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={impChart}>
                                <defs>
                                    <linearGradient
                                        id="gradShown"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#3b82f6"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#3b82f6"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="gradLiked"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#22c55e"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#22c55e"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(51,65,85,0.3)"
                                />
                                <XAxis
                                    dataKey="week"
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
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="shown"
                                    name="Shown"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#gradShown)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="liked"
                                    name="Liked"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    fill="url(#gradLiked)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="disliked"
                                    name="Disliked"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fillOpacity={0}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* ── Row: Feed Depth + Dream Board ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feed Depth */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" /> Feed
                            Scroll Depth
                            {feed && (
                                <div className="ml-auto flex items-center gap-3 text-xs">
                                    <span className="text-muted">
                                        Avg:{' '}
                                        <span className="text-white font-semibold">
                                            {feed.avgFeedIndex}
                                        </span>
                                    </span>
                                    <span className="text-muted">
                                        Median:{' '}
                                        <span className="text-white font-semibold">
                                            {feed.medianFeedIndex}
                                        </span>
                                    </span>
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {feedQ.isLoading ? (
                            <ChartSkeleton />
                        ) : !feed ? (
                            <EmptyState
                                variant={feedQ.isError ? 'error' : 'empty'}
                                onRetry={feedQ.refetch}
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={feedChart} barSize={32}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(51,65,85,0.3)"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="depth"
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
                                    <Bar dataKey="users" name="Users">
                                        {feedChart.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={
                                                    FEED_COLORS[
                                                        i % FEED_COLORS.length
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

                {/* Dream Board */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Image className="w-4 h-4 text-primary" /> Dream
                            Board Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dreamQ.isLoading ? (
                            <ChartSkeleton />
                        ) : !dream ? (
                            <EmptyState
                                variant={dreamQ.isError ? 'error' : 'empty'}
                                onRetry={dreamQ.refetch}
                            />
                        ) : (
                            dream && (
                                <>
                                    {/* Key metrics */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="text-center p-3 rounded-xl bg-navy-950 border border-border">
                                            <p className="text-xl font-bold text-white">
                                                {fmtNum(dream.totalPhotos)}
                                            </p>
                                            <p className="text-[11px] text-muted">
                                                Total Photos
                                            </p>
                                        </div>
                                        <div className="text-center p-3 rounded-xl bg-navy-950 border border-border">
                                            <p className="text-xl font-bold text-white">
                                                {fmtNum(dream.usersWithPhotos)}
                                            </p>
                                            <p className="text-[11px] text-muted">
                                                Users
                                            </p>
                                        </div>
                                        <div className="text-center p-3 rounded-xl bg-navy-950 border border-border">
                                            <p className="text-xl font-bold text-white">
                                                {dream.avgPhotosPerUser}
                                            </p>
                                            <p className="text-[11px] text-muted">
                                                Avg/User
                                            </p>
                                        </div>
                                    </div>
                                    {/* Category Pie */}
                                    <ResponsiveContainer
                                        width="100%"
                                        height={160}
                                    >
                                        <PieChart>
                                            <Pie
                                                data={dreamPie}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={65}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {dreamPie.map((entry, i) => (
                                                    <Cell
                                                        key={i}
                                                        fill={entry.color}
                                                        stroke="transparent"
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={<ChartTooltip />}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-1.5 mt-2">
                                        {dreamPie.map((item) => (
                                            <div
                                                key={item.name}
                                                className="flex items-center gap-2"
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{
                                                        background: item.color,
                                                    }}
                                                />
                                                <span className="text-xs text-muted">
                                                    {item.name}
                                                </span>
                                                <span className="text-xs font-medium text-white ml-auto">
                                                    {fmtNum(item.value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Preview Conversion Card ── */}
            {preview && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MousePointerClick className="w-4 h-4 text-primary" />{' '}
                            Preview → Signup Conversion
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="text-center p-6 rounded-2xl bg-navy-950 border border-border">
                                <p className="text-3xl font-bold text-white">
                                    {fmtNum(preview.totalPreviewSessions)}
                                </p>
                                <p className="text-sm text-muted mt-1">
                                    Preview Sessions
                                </p>
                            </div>
                            <div className="text-center p-6 rounded-2xl bg-navy-950 border border-border">
                                <p className="text-3xl font-bold text-white">
                                    {fmtNum(preview.totalUsers)}
                                </p>
                                <p className="text-sm text-muted mt-1">
                                    Signed Up
                                </p>
                            </div>
                            <div className="text-center p-6 rounded-2xl bg-primary/10 border border-primary/20">
                                <p className="text-3xl font-bold text-primary">
                                    {preview.conversionRate}%
                                </p>
                                <p className="text-sm text-muted mt-1">
                                    Conversion Rate
                                </p>
                                <div className="w-full h-2 bg-navy-800 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                                        style={{
                                            width: `${preview.conversionRate}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
