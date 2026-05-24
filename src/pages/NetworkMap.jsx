/**
 * Network Map page — renders the full Kovera network graph within the dashboard.
 * Shown when the user switches to "Network" mode in the Header toggle.
 */
import { NetworkCanvas, NetworkSidebar, NetworkDetailPanel, NetworkLegend, ChainPanel } from '@/components/network';
import { useNetworkContext } from '@/context/NetworkContext';
import { RefreshCw, Globe2, Lock, PanelLeft } from 'lucide-react';

function NetworkToolbar() {
    const {
        loading,
        refreshing,
        netSidebarOpen,
        toggleNetSidebar,
        selectedNode,
        networkStats,
        agentMetrics,
        privacyMode,
        togglePrivacyMode,
        refreshGraph,
        regenerateGraph,
        error,
    } = useNetworkContext();

    return (
        <div
            className="h-[48px] flex items-center justify-between px-4 shrink-0"
            style={{
                background: 'rgba(15,23,41,0.8)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Left */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleNetSidebar}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer"
                    style={{
                        color: netSidebarOpen ? '#22C98A' : '#4D5A7C',
                        background: netSidebarOpen ? 'rgba(34,201,138,0.1)' : 'transparent',
                    }}
                    title={netSidebarOpen ? 'Close filters' : 'Open filters'}
                >
                    <PanelLeft className="w-4 h-4" />
                </button>

                {networkStats && (
                    <div className="hidden md:flex gap-3 text-[10px] font-mono" style={{ color: '#4D5A7C' }}>
                        <span>{networkStats.nodes?.total || 0} Nodes</span>
                        <span>{networkStats.edges?.total || 0} Edges</span>
                    </div>
                )}

                <div className="hidden lg:flex gap-2 text-[10px]">
                    <span className="px-2 py-1 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#8B96B8' }}>
                        Agents: <span style={{ color: '#22C98A', fontWeight: 600 }}>{agentMetrics.agentsSignedUp}</span>
                    </span>
                    <span className="px-2 py-1 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#8B96B8' }}>
                        Clients: <span style={{ color: '#378ADD', fontWeight: 600 }}>{agentMetrics.linkedClients}</span>
                    </span>
                    <span className="px-2 py-1 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#8B96B8' }}>
                        Pocket: <span style={{ color: '#34D399', fontWeight: 600 }}>{agentMetrics.offMarketListings}</span>
                    </span>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {error && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg max-w-[200px]" style={{ background: 'rgba(212,83,126,0.1)', border: '1px solid rgba(212,83,126,0.2)' }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: '#D4537E' }} />
                        <span className="text-[10px] font-mono truncate" style={{ color: '#D4537E' }}>
                            {String(error).substring(0, 40)}
                        </span>
                    </div>
                )}

                <button
                    onClick={refreshGraph}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-[11px] transition-all disabled:opacity-50 cursor-pointer"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#8B96B8' }}
                    title="Refresh graph"
                >
                    <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin' : ''}`} style={{ color: '#22C98A' }} />
                    <span className="hidden sm:inline">{loading ? 'Syncing…' : 'Refresh'}</span>
                </button>

                <button
                    onClick={togglePrivacyMode}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer"
                    style={{
                        color: privacyMode === 'private' ? '#22C98A' : '#4D5A7C',
                        background: privacyMode === 'private' ? 'rgba(34,201,138,0.1)' : 'transparent',
                    }}
                    title={privacyMode === 'private' ? 'Private view' : 'Public view'}
                >
                    {privacyMode === 'private' ? <Lock className="w-4 h-4" /> : <Globe2 className="w-4 h-4" />}
                </button>

            </div>
        </div>
    );
}

export default function NetworkMap() {
    const { loading } = useNetworkContext();

    return (
        <div
            className="flex flex-col overflow-hidden"
            style={{ height: 'calc(100vh - 64px)', background: '#0B1120' }}
        >
            <NetworkToolbar />

            <div className="flex-1 flex overflow-hidden min-w-0">
                <NetworkSidebar />
                <ChainPanel />

                <main className="flex-1 relative flex flex-col overflow-hidden min-w-0">
                    <NetworkCanvas />
                    <NetworkLegend />

                    {loading && (
                        <div
                            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                            style={{ background: 'rgba(11,17,32,0.5)', backdropFilter: 'blur(2px)' }}
                        >
                            <div
                                className="px-6 py-4 flex items-center gap-4 rounded-2xl shadow-2xl"
                                style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <div
                                    className="w-4 h-4 border-2 rounded-full animate-spin"
                                    style={{ borderColor: '#22C98A', borderTopColor: 'transparent' }}
                                />
                                <span
                                    className="text-xs font-medium uppercase tracking-widest"
                                    style={{ color: '#8B96B8' }}
                                >
                                    Syncing Network…
                                </span>
                            </div>
                        </div>
                    )}
                </main>

                <NetworkDetailPanel />
            </div>
        </div>
    );
}
