/**
 * Global state for the Network Map view.
 * Adapted from kovera-map/frontend/src/context/NetworkContext.tsx
 * Integrates with the dashboard's analyticsAPI instead of a standalone server.
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { analyticsAPI } from '@/services/api/analytics';
import { normalizeChainsFromApi, buildUserAgentMap } from '@/lib/chainPaths';

const NetworkContext = createContext(undefined);

function readChainStatusFilterFromStorage() {
    const raw = Number(localStorage.getItem('kovera_chain_status_filter'));
    const v = Number.isFinite(raw) ? raw : 0;
    if (v === 2 || v === 3) {
        localStorage.setItem('kovera_chain_status_filter', '0');
        return 0;
    }
    return v || 0;
}

export function NetworkProvider({ children }) {
    const [graphData, setGraphData] = useState(null);
    const [networkStats, setNetworkStats] = useState(null);
    const [clusters, setClusters] = useState([]);
    const [addressCycles, setAddressCycles] = useState([]);
    const [excludeInternal, setExcludeInternal] = useState(
        localStorage.getItem('kovera_exclude_internal') !== 'false'
    );
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedNode, setSelectedNodeState] = useState(null);
    const [activeChain, setActiveChainState] = useState(null);
    const [filter, setFilter] = useState('All');
    const [chainStatusFilter, setChainStatusFilterState] = useState(readChainStatusFilterFromStorage);
    const [privacyMode, setPrivacyMode] = useState(
        localStorage.getItem('kovera_privacy_mode') || 'private'
    );
    const [netSidebarOpen, setNetSidebarOpen] = useState(() => {
        // Start closed on mobile so the map has full canvas space
        if (typeof window !== 'undefined' && window.innerWidth < 1024) return false;
        return localStorage.getItem('kovera_sidebar_open') !== 'false';
    });
    const [detailsOpen, setDetailsOpen] = useState(
        localStorage.getItem('kovera_details_open') === 'true'
    );
    const [chainsPanelOpen, setChainsPanelOpen] = useState(false);

    const agentMetrics = useMemo(() => {
        const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
        const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];

        const fallbackAgents = new Set(
            nodes
                .filter((n) => ['user_home', 'pure_buyer'].includes(String(n.type || '').toLowerCase()))
                .map((n) => n.uid || n.userId || n.id)
        ).size;
        const fallbackLinkedClients = edges.filter((e) => String(e.type || '').toUpperCase() === 'LIKE').length;
        const fallbackOffMarket = nodes.filter(
            (n) =>
                String(n.type || '').toLowerCase() === 'seeded_listing' &&
                String(n.listingCategory || n.source || '').toLowerCase() === 'off_market'
        ).length;

        const agentsFromApi =
            typeof networkStats?.agents === 'number'
                ? networkStats.agents
                : networkStats?.agents?.signedUp ?? networkStats?.agentsSignedUp;

        const linkedClientsFromApi =
            networkStats?.clientsWithAgents ??
            networkStats?.agents?.linkedClients ??
            networkStats?.linkedClients;

        const pocketFromApi =
            networkStats?.nodes?.pocketListing ??
            networkStats?.agents?.offMarketListings ??
            networkStats?.offMarketListings;

        return {
            agentsSignedUp: Number(agentsFromApi ?? fallbackAgents ?? 0),
            linkedClients: Number(linkedClientsFromApi ?? fallbackLinkedClients ?? 0),
            offMarketListings: Number(pocketFromApi ?? fallbackOffMarket ?? 0),
        };
    }, [graphData, networkStats]);

    const toggleNetSidebar = useCallback(() => {
        setNetSidebarOpen((prev) => {
            const next = !prev;
            localStorage.setItem('kovera_sidebar_open', String(next));
            if (!next) setChainsPanelOpen(false); // close chains panel when sidebar closes
            return next;
        });
    }, []);

    const toggleChainsPanel = useCallback(() => {
        setChainsPanelOpen((prev) => {
            const next = !prev;
            // On mobile, sidebar + chain panel together exceed the screen width and
            // collapse the map to 0px — close the sidebar when chains panel opens.
            if (next && typeof window !== 'undefined' && window.innerWidth < 1024) {
                setNetSidebarOpen(false);
                localStorage.setItem('kovera_sidebar_open', 'false');
            }
            return next;
        });
    }, []);

    const toggleDetails = useCallback(() => {
        setDetailsOpen((prev) => {
            const next = !prev;
            localStorage.setItem('kovera_details_open', String(next));
            return next;
        });
    }, []);

    const setSelectedNode = useCallback((node) => {
        setSelectedNodeState(node);
        const shouldOpen = Boolean(node);
        setDetailsOpen(shouldOpen);
        localStorage.setItem('kovera_details_open', String(shouldOpen));
        // On mobile, close the sidebar when the detail panel opens to keep the map usable
        if (node && typeof window !== 'undefined' && window.innerWidth < 1024) {
            setNetSidebarOpen(false);
            setChainsPanelOpen(false);
        }
    }, []);

    const toggleExcludeInternal = useCallback(() => {
        setExcludeInternal((prev) => {
            const next = !prev;
            localStorage.setItem('kovera_exclude_internal', String(next));
            return next;
        });
    }, []);

    const togglePrivacyMode = useCallback(() => {
        setPrivacyMode((prev) => {
            const next = prev === 'private' ? 'public' : 'private';
            localStorage.setItem('kovera_privacy_mode', next);
            return next;
        });
    }, []);

    const setActiveChain = useCallback((chain) => {
        setActiveChainState(chain);
        if (chain) {
            setFilter('All');
            // On mobile, close the chain panel after selecting a chain so the map
            // has full width to display the chain polylines.
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setChainsPanelOpen(false);
            }
        }
    }, []);

    const setChainStatusFilter = useCallback((value) => {
        setChainStatusFilterState(value);
        localStorage.setItem('kovera_chain_status_filter', String(value));
    }, []);

    const fetchAllData = useCallback(async (excludeInternalVal, refresh = false) => {
        setLoading(true);
        try {
            const [graphRes, chainsRes, statsRes, clustersRes, cyclesRes] = await Promise.allSettled([
                analyticsAPI.getNetworkGraph(excludeInternalVal, refresh, 0),
                analyticsAPI.getNetworkChainsData(2),
                analyticsAPI.getNetworkStats(),
                analyticsAPI.getNetworkClusters(3),
                analyticsAPI.getAddressCycles(),
            ]);

            if (graphRes.status === 'fulfilled') {
                const payload = graphRes.value.data || {};
                const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
                const edges = Array.isArray(payload.edges) ? payload.edges : [];
                const rawChains =
                    chainsRes.status === 'fulfilled' && Array.isArray(chainsRes.value.data?.chains)
                        ? chainsRes.value.data.chains
                        : [];
                const chainsData = normalizeChainsFromApi(rawChains, nodes);

                const agentMap = buildUserAgentMap(rawChains, nodes);
                const enrichedNodes = nodes.map((n) => {
                    const info = agentMap.get(String(n.id));
                    if (!info) return n;
                    return {
                        ...n,
                        hasAgent: n.hasAgent ?? info.hasAgent,
                        agentName: n.agentName ?? info.agentName,
                        agentEmail: n.agentEmail ?? info.agentEmail,
                        optedIn: n.optedIn ?? info.optedIn,
                    };
                });

                setGraphData({ nodes: enrichedNodes, edges, chains: chainsData });
            }

            if (statsRes.status === 'fulfilled') setNetworkStats(statsRes.value.data);
            if (clustersRes.status === 'fulfilled') {
                const cl = clustersRes.value.data?.clusters;
                setClusters(Array.isArray(cl) ? cl : []);
            }
            if (cyclesRes.status === 'fulfilled') {
                const cy = cyclesRes.value.data?.cycles;
                setAddressCycles(Array.isArray(cy) ? cy : []);
            }

            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch network data');
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshGraph = useCallback(async () => {
        await fetchAllData(excludeInternal, false);
    }, [fetchAllData, excludeInternal]);

    const regenerateGraph = useCallback(async () => {
        await fetchAllData(excludeInternal, true);
    }, [fetchAllData, excludeInternal]);

    const refreshGeocode = useCallback(async () => {
        setRefreshing(true);
        try {
            await analyticsAPI.refreshNetworkGeocode();
            await fetchAllData(excludeInternal, true);
        } catch (err) {
            setError(err.response?.data?.error || 'Geocode refresh failed');
        } finally {
            setRefreshing(false);
        }
    }, [fetchAllData, excludeInternal]);

    useEffect(() => {
        fetchAllData(excludeInternal, false);
    }, [excludeInternal, fetchAllData]);

    return (
        <NetworkContext.Provider
            value={{
                graphData,
                networkStats,
                agentMetrics,
                clusters,
                addressCycles,
                excludeInternal,
                loading,
                refreshing,
                error,
                selectedNode,
                activeChain,
                filter,
                chainStatusFilter,
                privacyMode,
                netSidebarOpen,
                detailsOpen,
                chainsPanelOpen,
                toggleChainsPanel,
                toggleNetSidebar,
                toggleDetails,
                toggleExcludeInternal,
                setSelectedNode,
                setActiveChain,
                setFilter,
                setChainStatusFilter,
                togglePrivacyMode,
                refreshGraph,
                regenerateGraph,
                refreshGeocode,
            }}
        >
            {children}
        </NetworkContext.Provider>
    );
}

export function useNetworkContext() {
    const ctx = useContext(NetworkContext);
    if (!ctx) throw new Error('useNetworkContext must be used within NetworkProvider');
    return ctx;
}
