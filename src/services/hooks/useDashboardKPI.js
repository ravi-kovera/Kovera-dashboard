import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '@/services/api';
import { analyticsAPI } from '@/services/api/analytics';
import { Users, UserCog, Building2, Heart, UserCheck } from 'lucide-react';

/**
 * Format a raw number into a human-readable string.
 * e.g. 12847 → "12,847" | 48200 → "48.2K"
 */
function formatValue(num) {
    if (num == null) return '—';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 10000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
}

/**
 * Fetch all KPI stats from individual endpoints (parallel).
 * Returns normalized card data.
 */
async function fetchKPIStats() {
    const [activityRes, agentsRes, propertiesRes, likesRes, activeRes] =
        await Promise.all([
            analyticsAPI.getUserActivity({}),
            statsAPI.getAgentsCount(),
            statsAPI.getPropertiesCount(),
            statsAPI.getPropertyLikes(),
            statsAPI.getActiveUsers(),
        ]);

    return [
        {
            key: 'totalUsers',
            title: 'Total Users',
            value: formatValue(activityRes.data?.totalUsers),
            change: '+0%',
            trend: 'up',
            icon: Users,
            accentColor: 'blue',
        },
        {
            key: 'totalAgents',
            title: 'Total Agents',
            value: formatValue(agentsRes.data?.count),
            change: agentsRes.data?.change || '+0%',
            trend: agentsRes.data?.trend || 'up',
            icon: UserCog,
            accentColor: 'purple',
        },
        {
            key: 'totalProperties',
            title: 'Total Properties',
            value: formatValue(propertiesRes.data?.count),
            change: propertiesRes.data?.change || '+0%',
            trend: propertiesRes.data?.trend || 'up',
            icon: Building2,
            accentColor: 'green',
        },
        {
            key: 'propertyLikes',
            title: 'Property Likes',
            value: formatValue(likesRes.data?.count),
            change: likesRes.data?.change || '+0%',
            trend: likesRes.data?.trend || 'up',
            icon: Heart,
            accentColor: 'red',
        },
        {
            key: 'activeUsers',
            title: 'Active Users (30d)',
            value: formatValue(activeRes.data?.count),
            change: activeRes.data?.change || '+0%',
            trend: activeRes.data?.trend || 'up',
            icon: UserCheck,
            accentColor: 'cyan',
        },
    ];
}

/**
 * Custom hook: fetches KPI data with auto-refresh every 60 seconds.
 * Returns the raw React Query state — callers render their own empty/error
 * UI when `data` is null. No fallback data; an unreachable API surfaces as
 * `isError`, not as fake numbers.
 */
export function useDashboardKPI() {
    const query = useQuery({
        queryKey: ['dashboard-kpi'],
        queryFn: fetchKPIStats,
        refetchInterval: 60 * 1000, // ← auto-refresh every 60s
        refetchIntervalInBackground: false,
        retry: 1,
        staleTime: 30 * 1000,
    });

    return {
        kpiCards: query.data ?? null,
        isLoading: query.isLoading,
        isError: query.isError,
        refetch: query.refetch,
        lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    };
}
