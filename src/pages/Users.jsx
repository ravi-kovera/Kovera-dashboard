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
    Users,
    UserCheck,
    UserX,
    TrendingUp,
    RefreshCw,
    CalendarDays,
    Bell,
    ShieldCheck,
} from 'lucide-react';
import {
    useUserActivity,
    useUserSignups,
    useOnboardingFunnel,
    useRolesDistribution,
    useUsersList,
    defaultDateRange,
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
} from 'recharts';

/* ── Helpers ── */
function fmtNum(num) {
    if (num == null) return '—';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
}

function monthLabel(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
    });
}

const ROLE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];
const ROLE_BADGE = {
    buyer: 'info',
    seller: 'warning',
    renter: 'success',
    landlord: 'default',
};

const ACTIVITY_COLORS = {
    active: '#22c55e',
    inactive: '#64748b',
    digest: '#3b82f6',
};

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

function ChartSkeleton({ h = 220 }) {
    return (
        <div
            className="flex items-end gap-1.5 px-4"
            style={{ height: h }}
        >
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-1">
                    <Skeleton
                        className="w-full rounded-t"
                        style={{
                            height: `${25 + ((i * 17) % 55)}%`,
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

/* ── User list columns ── */
const USER_COLUMNS = [
    {
        key: 'fullName',
        label: 'Name / Email',
        render: (_, row) => (
            <div>
                <p className="text-sm font-medium text-white">
                    {row.fullName || '—'}
                </p>
                <p className="text-xs text-muted">{row.email || '—'}</p>
            </div>
        ),
    },
    {
        key: 'roles',
        label: 'Roles',
        render: (roles) =>
            roles?.length ? (
                <div className="flex flex-wrap gap-1">
                    {roles.map((r) => (
                        <Badge
                            key={r}
                            variant={ROLE_BADGE[r] ?? 'default'}
                        >
                            {r}
                        </Badge>
                    ))}
                </div>
            ) : (
                <span className="text-xs text-muted">—</span>
            ),
    },
    {
        key: 'onboardingStep',
        label: 'Onboarding',
        render: (step, row) => (
            <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(((step ?? 0) / 7) * 100, 100)}%` }}
                    />
                </div>
                {row.onboardingCompletedAt ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                    <span className="text-xs text-muted">{step ?? 0}/7</span>
                )}
            </div>
        ),
    },
    {
        key: 'hasAgent',
        label: 'Agent',
        render: (v) => (
            <Badge variant={v ? 'success' : 'default'}>
                {v ? 'Yes' : 'No'}
            </Badge>
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
   USERS PAGE
   ══════════════════════════════════════════════ */
export default function UsersPage() {
    const [dateRange] = useState(defaultDateRange);
    const [listPage, setListPage] = useState(1);
    const [listSearch, setListSearch] = useState('');
    const PAGE_SIZE = 20;

    const activityQ = useUserActivity(dateRange);
    const signupsQ = useUserSignups({ ...dateRange, granularity: 'month' });
    const funnelQ = useOnboardingFunnel();
    const rolesQ = useRolesDistribution();
    const listQ = useUsersList({
        page: listPage,
        limit: PAGE_SIZE,
        search: listSearch,
    });

    const activity = activityQ.data ?? null;
    const signups = signupsQ.data ?? null;
    const roles = rolesQ.data ?? null;
    const funnel = funnelQ.data ?? null;

    const signupsChart = useMemo(() => {
        if (!signups?.buckets) return [];
        return signups.buckets.map((b) => ({
            month: monthLabel(b.period),
            signups: b.count,
        }));
    }, [signups]);

    const rolesChart = useMemo(() => {
        if (!roles?.roles) return [];
        return roles.roles.map((r, i) => ({
            name: r.role,
            value: r.count,
            color: ROLE_COLORS[i % ROLE_COLORS.length],
        }));
    }, [roles]);

    const activityPie = useMemo(() => {
        if (!activity) return [];
        return [
            { name: 'Active', value: activity.activeUsers, color: ACTIVITY_COLORS.active },
            { name: 'Inactive', value: activity.inactiveUsers, color: ACTIVITY_COLORS.inactive },
            { name: 'Digest', value: activity.recentDigestUsers, color: ACTIVITY_COLORS.digest },
        ].filter((d) => d.value > 0);
    }, [activity]);

    const funnelChart = useMemo(() => {
        const LABELS = [
            'Registered',
            'Profile',
            'Preferences',
            'Dream Board',
            'Location',
            'Budget',
            'Completed',
        ];
        if (!funnel?.steps) return [];
        return funnel.steps.map((s) => ({
            label: LABELS[s.step] ?? `Step ${s.step}`,
            count: s.count,
            pct: s.pct,
        }));
    }, [funnel]);

    const refetchAll = () => {
        activityQ.refetch();
        signupsQ.refetch();
        funnelQ.refetch();
        rolesQ.refetch();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Header ── */}
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Users
                    </h1>
                    <p className="text-muted mt-1 text-sm">
                        Analytics and user directory.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={refetchAll}>
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    title="Total Users"
                    value={fmtNum(activity?.totalUsers)}
                    icon={Users}
                    accentColor="blue"
                    loading={activityQ.isLoading}
                />
                <StatCard
                    title="Active Users"
                    value={
                        activity
                            ? `${Math.round((activity.activeUsers / (activity.totalUsers || 1)) * 100)}%`
                            : '—'
                    }
                    subtitle={fmtNum(activity?.activeUsers)}
                    icon={UserCheck}
                    accentColor="green"
                    loading={activityQ.isLoading}
                />
                <StatCard
                    title="Onboarding Done"
                    value={
                        funnel?.completedCount != null
                            ? fmtNum(funnel.completedCount)
                            : '—'
                    }
                    subtitle={funnel ? `${funnel.completedPct}% of users` : undefined}
                    icon={CalendarDays}
                    accentColor="purple"
                    loading={funnelQ.isLoading}
                />
                <StatCard
                    title="Digest Users"
                    value={fmtNum(activity?.recentDigestUsers)}
                    icon={Bell}
                    accentColor="amber"
                    loading={activityQ.isLoading}
                />
            </div>

            {/* ── Charts (2-column) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Signups trend */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            User Signups (Monthly)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {signupsQ.isLoading ? (
                            <ChartSkeleton h={200} />
                        ) : !signups ? (
                            <EmptyState
                                variant={signupsQ.isError ? 'error' : 'empty'}
                                onRetry={signupsQ.refetch}
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={signupsChart}>
                                    <defs>
                                        <linearGradient
                                            id="usersGrad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#22c55e"
                                                stopOpacity={0.25}
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
                                        dataKey="signups"
                                        name="Signups"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        fill="url(#usersGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Roles pie */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-primary" />
                            Roles
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rolesQ.isLoading ? (
                            <ChartSkeleton h={160} />
                        ) : !roles ? (
                            <EmptyState
                                variant={rolesQ.isError ? 'error' : 'empty'}
                                onRetry={rolesQ.refetch}
                            />
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={140}>
                                    <PieChart>
                                        <Pie
                                            data={rolesChart}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {rolesChart.map((e, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={e.color}
                                                    stroke="transparent"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="grid grid-cols-2 gap-1 mt-1">
                                    {rolesChart.map((item) => (
                                        <div
                                            key={item.name}
                                            className="flex items-center gap-1.5 text-xs"
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ background: item.color }}
                                            />
                                            <span className="text-muted truncate capitalize">
                                                {item.name}
                                            </span>
                                            <span className="text-white font-medium ml-auto">
                                                {item.value.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Onboarding funnel (compact horizontal) */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        Onboarding Funnel
                        {funnel?.completedPct != null && (
                            <Badge variant="success" className="ml-auto">
                                {funnel.completedPct}% complete
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {funnelQ.isLoading ? (
                        <ChartSkeleton h={140} />
                    ) : !funnel ? (
                        <EmptyState
                            variant={funnelQ.isError ? 'error' : 'empty'}
                            onRetry={funnelQ.refetch}
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height={140}>
                            <BarChart data={funnelChart} barSize={28}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(51,65,85,0.3)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={32}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar
                                    dataKey="count"
                                    name="Users"
                                    fill="#22c55e"
                                    radius={[4, 4, 0, 0]}
                                    fillOpacity={0.85}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* ── User Directory ── */}
            <div>
                <h2 className="text-base font-semibold text-white mb-3">
                    User Directory
                </h2>
                <DataTable
                    columns={USER_COLUMNS}
                    data={listQ.data?.users ?? []}
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
                        listQ.isError ? "Couldn't load users" : 'No users found'
                    }
                />
            </div>
        </div>
    );
}
