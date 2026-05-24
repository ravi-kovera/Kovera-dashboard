/**
 * Network map sidebar: node filters, chain list, actions.
 * Chain Status removed (lines are driven by node selection, not a chain-status filter).
 * Pure Buyers removed (not visualised on map).
 * Dream Anchors added.
 */
import { useEffect, useMemo } from 'react';
import { useNetworkContext } from '@/context/NetworkContext';
import { matchesFilter, isPureBuyer } from './nodeHelpers';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Building2, Landmark, UserCheck, Repeat, Diamond, ChevronRight } from 'lucide-react';

// Filter rows — colors match the canvas palette
const filterAll      = { key: 'All',                   label: 'All Nodes',          icon: Home,      color: '#8B96B8',  shape: 'circle' };
const groupProperty  = [
    { key: 'User Homes',          label: 'User Homes',        icon: Home,      color: '#00E5FF', shape: 'circle' },
    { key: 'Public Listings',     label: 'Public Listings',   icon: Building2, color: '#39FF14', shape: 'circle' },
    { key: 'Off-Market Properties', label: 'Off-Market / Pocket', icon: Landmark, color: '#9D4EDD', shape: 'circle' },
];
const groupPeople    = [
    { key: 'Swappers',            label: 'Swappers',          icon: Repeat,    color: '#FFB300', shape: 'circle' },
    { key: 'Pure Sellers',        label: 'Pure Sellers',      icon: UserCheck, color: '#FF5722', shape: 'circle' },
    { key: 'Dream Anchors',       label: 'Dream Anchors',     icon: Diamond,   color: '#FF2A85', shape: 'diamond' },
];

const PANEL_WIDTH = 'min(85vw, 250px)';

// Tiny shape swatch used in each filter row
function NodeShape({ shape, color, size = 10 }) {
    if (shape === 'diamond') {
        return (
            <div style={{
                width: size, height: size,
                background: color,
                transform: 'rotate(45deg)',
                flexShrink: 0,
            }} />
        );
    }
    return (
        <div style={{
            width: size, height: size,
            borderRadius: '9999px',
            background: color,
            flexShrink: 0,
        }} />
    );
}

export default function NetworkSidebar() {
    const {
        filter,
        setFilter,
        graphData,
        networkStats,
        netSidebarOpen,
        setActiveChain,
        setSelectedNode,
        chainsPanelOpen,
        toggleChainsPanel,
    } = useNetworkContext();

    useEffect(() => {
        // close chains panel when sidebar closes
    }, [netSidebarOpen]);

    const totalNodes = networkStats?.nodes?.total ?? (Array.isArray(graphData?.nodes) ? graphData.nodes.length : 0);
    const totalEdges = networkStats?.edges?.total ?? (Array.isArray(graphData?.edges) ? graphData.edges.length : 0);

    // Displayed nodes (same exclusion logic as NetworkCanvas)
    const mapNodes = useMemo(() => {
        const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
        return nodes.filter(
            (n) => !isPureBuyer(n) && Number.isFinite(Number(n.lat)) && Number.isFinite(Number(n.lng))
        );
    }, [graphData]);

    const filterCount = useMemo(() => {
        const counts = { All: mapNodes.length };
        [...groupProperty, ...groupPeople].forEach(({ key }) => {
            counts[key] = mapNodes.filter((n) => matchesFilter(n, key)).length;
        });
        return counts;
    }, [mapNodes]);

    const FilterRow = ({ item }) => {
        const Icon = item.icon;
        const isActive = filter === item.key;
        const count = filterCount[item.key] ?? 0;
        return (
            <button
                onClick={() => {
                    setFilter(item.key);
                    setActiveChain(null);
                    setSelectedNode(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all"
                style={{
                    background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: isActive ? `1px solid ${item.color}33` : '1px solid transparent',
                }}
            >
                <NodeShape shape={item.shape} color={isActive ? item.color : '#4D5A7C'} size={9} />
                <span className="text-sm truncate flex-1" style={{ color: isActive ? '#F0F2F7' : '#8B96B8' }}>
                    {item.label}
                </span>
                <span
                    className="text-xs font-mono tabular-nums shrink-0"
                    style={{ color: isActive ? item.color : '#4D5A7C' }}
                >
                    {count}
                </span>
            </button>
        );
    };

    return (
        <AnimatePresence initial={false}>
            {netSidebarOpen && (
                <motion.div
                    key="net-sidebar"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: PANEL_WIDTH, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                    className="h-full flex flex-col shrink-0 overflow-hidden"
                    style={{
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(15,23,41,0.8)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <div style={{ width: PANEL_WIDTH }} className="h-full flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-3 space-y-4">
                            {/* Stats */}
                            <div
                                className="p-3 rounded-xl"
                                style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <div className="flex justify-between text-xs" style={{ color: '#4D5A7C' }}>
                                    <span>{totalNodes} nodes</span>
                                    <span>{totalEdges} edges</span>
                                </div>
                            </div>

                            {/* Node filters */}
                            <div>
                                <h3
                                    className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2 px-1"
                                    style={{ color: '#4D5A7C' }}
                                >
                                    Node Filters
                                </h3>
                                <div className="space-y-0.5">
                                    <FilterRow item={filterAll} />

                                    <div className="text-[11px] uppercase tracking-widest px-3 pt-2 pb-0.5" style={{ color: '#4D5A7C' }}>
                                        Properties
                                    </div>
                                    {groupProperty.map((f) => <FilterRow key={f.key} item={f} />)}

                                    <div className="text-[11px] uppercase tracking-widest px-3 pt-2 pb-0.5" style={{ color: '#4D5A7C' }}>
                                        People
                                    </div>
                                    {groupPeople.map((f) => <FilterRow key={f.key} item={f} />)}
                                </div>
                            </div>

                            {/* Chains — opens a sub-panel to the right */}
                            <div>
                                <button
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all"
                                    onClick={toggleChainsPanel}
                                    style={{
                                        background: chainsPanelOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
                                        border: chainsPanelOpen ? '1px solid rgba(34,201,138,0.25)' : '1px solid transparent',
                                    }}
                                >
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: chainsPanelOpen ? '#F0F2F7' : '#8B96B8' }}
                                    >
                                        Chains
                                    </span>
                                    <ChevronRight
                                        className="w-3 h-3 transition-transform"
                                        style={{
                                            color: chainsPanelOpen ? '#22C98A' : '#4D5A7C',
                                            transform: chainsPanelOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        }}
                                    />
                                </button>
                            </div>

                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
