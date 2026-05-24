/**
 * Detail panel for a selected network node.
 * Desktop: slides in from the right.
 * Mobile:  bottom sheet — collapsed bar always visible, expandable body, X deselects node.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNetworkContext } from '@/context/NetworkContext';
import { analyticsAPI } from '@/services/api/analytics';
import { logger } from '@/lib/logger';
import {
    Info, X, MapPin, Heart, ArrowDownLeft, ArrowUpRight,
    Link2, UserCheck, UserX, Phone, Mail, Building2,
    ChevronUp, ChevronDown,
} from 'lucide-react';

const PANEL_WIDTH = 'min(88vw, 300px)';

const toNodeType = (node) => String(node?.type || '').toLowerCase();

function getRoles(node) {
    if (!node) return [];
    const type       = toNodeType(node);
    const personType = String(node.personType || '').toLowerCase();

    if (Array.isArray(node.roles) && node.roles.length) return node.roles;

    if (type === 'pure_buyer') return ['Buyer'];
    if (type === 'pure_seller') return ['Seller'];
    if (type === 'swapper') return ['Buyer', 'Seller'];
    if (type === 'user_home') {
        if (personType === 'buyer')    return ['Buyer'];
        if (personType === 'seller')   return ['Seller'];
        if (personType === 'swapper')  return ['Buyer', 'Seller'];
        if (personType === 'landlord') return ['Landlord'];
        if (personType === 'renter')   return ['Renter'];
        return ['Buyer'];
    }
    if (['public_listing', 'seeded_listing', 'pocket_listing'].includes(type)) {
        const lt = String(node.listingType || node.propertyType || '').toLowerCase();
        if (lt.includes('rent') || lt.includes('lease')) return ['Landlord'];
        return ['Seller'];
    }
    if (['dream_anchor', 'dream_address'].includes(type)) return ['Buyer'];
    return [];
}

function getDisplayName(node) {
    if (!node) return 'Unknown';
    return node.name || node.displayName || node.firstName
        ? `${node.firstName || ''} ${node.lastName || ''}`.trim() || node.name || node.displayName
        : null;
}

function edgeCounts(nodeIds, edges) {
    let incoming = 0, outgoing = 0;
    const ids = new Set(nodeIds.map(String));
    edges.forEach((e) => {
        const from = String(e.source ?? e.from);
        const to   = String(e.target ?? e.to);
        if (ids.has(to)   && !ids.has(from)) incoming++;
        if (ids.has(from) && !ids.has(to))   outgoing++;
    });
    return { incoming, outgoing };
}

/* ── Cluster node list (shared by desktop & mobile) ── */
function ClusterBody({ node, focusedNodeId, edges, onSelectNode, maskValue }) {
    const clusterIds = node._clusterNodes.map((n) => n.id);
    const { incoming: totalIncoming, outgoing: totalOutgoing } = edgeCounts(clusterIds, edges);
    const hasConnections = totalIncoming > 0 || totalOutgoing > 0;

    const handleCardClick = (n) => {
        if (focusedNodeId === String(n.id)) {
            onSelectNode(node);
        } else {
            onSelectNode({ ...n, _clusterOrigin: node });
        }
    };

    return (
        <>
            {hasConnections && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2.5 rounded-xl text-center"
                        style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <ArrowDownLeft className="w-3 h-3 mx-auto mb-1" style={{ color: '#22C98A' }} />
                        <div className="text-lg font-bold" style={{ color: '#F0F2F7' }}>{totalIncoming}</div>
                        <div className="text-xs uppercase tracking-wide" style={{ color: '#4D5A7C' }}>Incoming</div>
                    </div>
                    <div className="p-2.5 rounded-xl text-center"
                        style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <ArrowUpRight className="w-3 h-3 mx-auto mb-1" style={{ color: '#378ADD' }} />
                        <div className="text-lg font-bold" style={{ color: '#F0F2F7' }}>{totalOutgoing}</div>
                        <div className="text-xs uppercase tracking-wide" style={{ color: '#4D5A7C' }}>Outgoing</div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {node._clusterNodes.map((n, i) => {
                    const name = getDisplayName(n) || 'Unknown';
                    const nodeRoles = getRoles(n);
                    const isExpanded = focusedNodeId === String(n.id);
                    return (
                        <div
                            key={n.id || i}
                            onClick={() => handleCardClick(n)}
                            className="rounded-xl overflow-hidden cursor-pointer transition-all"
                            style={{
                                background: isExpanded ? 'rgba(34,201,138,0.06)' : '#131D32',
                                border: isExpanded
                                    ? '1px solid rgba(34,201,138,0.35)'
                                    : '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <div className="p-3 flex items-center gap-2">
                                <span className="text-xs font-semibold flex-1 truncate"
                                    style={{ color: isExpanded ? '#22C98A' : '#F0F2F7' }}>
                                    {maskValue(name)}
                                </span>
                                {nodeRoles.map((role) => (
                                    <span key={role} className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                                        style={{ background: 'rgba(34,201,138,0.1)', border: '1px solid rgba(34,201,138,0.15)', color: '#22C98A' }}>
                                        {role}
                                    </span>
                                ))}
                                {n.hasAgent === true
                                    ? <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#22C98A' }} />
                                    : n.hasAgent === false
                                    ? <UserX className="w-3.5 h-3.5 shrink-0" style={{ color: '#EF4444' }} />
                                    : null}
                            </div>

                            {isExpanded && (
                                <div className="px-3 pb-3 space-y-2.5 border-t"
                                    style={{ borderColor: 'rgba(34,201,138,0.15)' }}
                                    onClick={(e) => e.stopPropagation()}>
                                    <p className="text-xs uppercase tracking-widest pt-2" style={{ color: '#4D5A7C' }}>Details</p>

                                    {(n.hasAgent != null) && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                {n.hasAgent === true
                                                    ? <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#22C98A' }} />
                                                    : <UserX className="w-3.5 h-3.5 shrink-0" style={{ color: '#EF4444' }} />}
                                                <span className="text-xs font-medium" style={{ color: n.hasAgent ? '#22C98A' : '#EF4444' }}>
                                                    {n.hasAgent === true ? 'Agent linked' : 'No agent'}
                                                </span>
                                            </div>
                                            {n.hasAgent === true && n.agentName && (
                                                <div className="flex items-center gap-2 pl-5">
                                                    <span className="text-xs" style={{ color: '#F0F2F7' }}>{maskValue(n.agentName)}</span>
                                                </div>
                                            )}
                                            {n.hasAgent === true && n.agentBrokerage && (
                                                <div className="flex items-center gap-2 pl-5">
                                                    <Building2 className="w-3 h-3 shrink-0" style={{ color: '#4D5A7C' }} />
                                                    <span className="text-xs" style={{ color: '#8B96B8' }}>{maskValue(n.agentBrokerage)}</span>
                                                </div>
                                            )}
                                            {n.hasAgent === true && n.agentEmail && (
                                                <div className="flex items-center gap-2 pl-5">
                                                    <Mail className="w-3 h-3 shrink-0" style={{ color: '#4D5A7C' }} />
                                                    <span className="text-xs" style={{ color: '#8B96B8' }}>{maskValue(n.agentEmail)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {n.address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#4D5A7C' }} />
                                            <span className="text-xs" style={{ color: '#F0F2F7' }}>{maskValue(n.address)}</span>
                                        </div>
                                    )}

                                    {(() => {
                                        const { incoming, outgoing } = edgeCounts([n.id], edges);
                                        if (incoming === 0 && outgoing === 0) return null;
                                        return (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                    <ArrowDownLeft className="w-3 h-3 mx-auto mb-0.5" style={{ color: '#22C98A' }} />
                                                    <div className="text-sm font-bold" style={{ color: '#F0F2F7' }}>{incoming}</div>
                                                    <div className="text-xs uppercase" style={{ color: '#4D5A7C' }}>In</div>
                                                </div>
                                                <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                    <ArrowUpRight className="w-3 h-3 mx-auto mb-0.5" style={{ color: '#378ADD' }} />
                                                    <div className="text-sm font-bold" style={{ color: '#F0F2F7' }}>{outgoing}</div>
                                                    <div className="text-xs uppercase" style={{ color: '#4D5A7C' }}>Out</div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <p className="text-xs font-mono" style={{ color: '#4D5A7C' }}>id: {n.id}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}

/* ── Single-node detail body (shared by desktop & mobile) ── */
function NodeBody({ node, loading, maskValue, graphData }) {
    const roles = getRoles(node);

    return (
        <div className="space-y-4">
            {/* Role */}
            {roles.length > 0 && (
                <section>
                    <h4 className="text-xs uppercase font-semibold mb-2.5 tracking-widest" style={{ color: '#4D5A7C' }}>
                        Role
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                        {roles.map((role) => (
                            <span key={role} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                                style={{ background: 'rgba(34,201,138,0.1)', border: '1px solid rgba(34,201,138,0.2)', color: '#22C98A' }}>
                                {role}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Agent */}
            {node.hasAgent != null && (
                <section>
                    <h4 className="text-xs uppercase font-semibold mb-2.5 tracking-widest" style={{ color: '#4D5A7C' }}>Agent</h4>
                    {node.hasAgent === false ? (
                        <div className="p-3 rounded-xl flex items-center gap-3"
                            style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <UserX className="w-4 h-4 shrink-0" style={{ color: '#EF4444' }} />
                            <div className="text-xs font-semibold" style={{ color: '#EF4444' }}>No agent</div>
                        </div>
                    ) : (
                        <div className="rounded-xl overflow-hidden"
                            style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="px-3 pt-3 pb-2 flex items-center gap-2.5">
                                <UserCheck className="w-4 h-4 shrink-0" style={{ color: '#22C98A' }} />
                                <span className="text-xs font-semibold" style={{ color: '#22C98A' }}>Agent linked</span>
                            </div>
                            {(node.agentName || node.agentBrokerage || node.agentEmail || node.agentPhone) && (
                                <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                    {node.agentName && (
                                        <div className="flex items-center gap-2 pt-2">
                                            <UserCheck className="w-3 h-3 shrink-0" style={{ color: '#4D5A7C' }} />
                                            <span className="text-xs font-medium" style={{ color: '#F0F2F7' }}>{maskValue(node.agentName)}</span>
                                        </div>
                                    )}
                                    {node.agentBrokerage && (
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-3 h-3 shrink-0" style={{ color: '#4D5A7C' }} />
                                            <span className="text-xs" style={{ color: '#8B96B8' }}>{maskValue(node.agentBrokerage)}</span>
                                        </div>
                                    )}
                                    {node.agentEmail && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3 h-3 shrink-0" style={{ color: '#4D5A7C' }} />
                                            <span className="text-xs" style={{ color: '#8B96B8' }}>{maskValue(node.agentEmail)}</span>
                                        </div>
                                    )}
                                    {node.agentPhone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 shrink-0" style={{ color: '#4D5A7C' }} />
                                            <span className="text-xs" style={{ color: '#8B96B8' }}>{maskValue(node.agentPhone)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* Location */}
            {(node.address || (node.lat && node.lng)) && (
                <section>
                    <h4 className="text-xs uppercase font-semibold mb-2.5 tracking-widest" style={{ color: '#4D5A7C' }}>Location</h4>
                    <div className="space-y-2">
                        {node.address && (
                            <div className="flex items-start gap-2.5">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#4D5A7C' }} />
                                <div className="text-xs" style={{ color: '#F0F2F7' }}>{maskValue(node.address)}</div>
                            </div>
                        )}
                        {node.lat && node.lng && (
                            <div className="text-xs font-mono" style={{ color: '#4D5A7C' }}>
                                {Number(node.lat)}, {Number(node.lng)}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Interests */}
            {Array.isArray(node.likes) && node.likes.length > 0 && (
                <section>
                    <h4 className="text-xs uppercase font-semibold mb-2.5 tracking-widest" style={{ color: '#4D5A7C' }}>
                        <Heart className="w-3 h-3 inline mr-1" />
                        Interests ({node.likes.length})
                    </h4>
                    <div className="space-y-1">
                        {node.likes.map((like, i) => (
                            <div key={i} className="text-xs px-2.5 py-1.5 rounded-lg"
                                style={{ background: '#131D32', color: '#8B96B8', border: '1px solid rgba(255,255,255,0.04)' }}>
                                {maskValue(like.address || like.label || like.id || 'Unknown')}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Connections */}
            {(() => {
                const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];
                const { incoming, outgoing } = edgeCounts([node.id], edges);
                if (incoming === 0 && outgoing === 0) return null;
                return (
                    <section>
                        <h4 className="text-xs uppercase font-semibold mb-2.5 tracking-widest" style={{ color: '#4D5A7C' }}>
                            <Link2 className="w-3 h-3 inline mr-1" />
                            Connections
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2.5 rounded-xl text-center"
                                style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <ArrowDownLeft className="w-3 h-3 mx-auto mb-1" style={{ color: '#22C98A' }} />
                                <div className="text-lg font-bold" style={{ color: '#F0F2F7' }}>{incoming}</div>
                                <div className="text-xs uppercase" style={{ color: '#4D5A7C' }}>Incoming</div>
                            </div>
                            <div className="p-2.5 rounded-xl text-center"
                                style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <ArrowUpRight className="w-3 h-3 mx-auto mb-1" style={{ color: '#378ADD' }} />
                                <div className="text-lg font-bold" style={{ color: '#F0F2F7' }}>{outgoing}</div>
                                <div className="text-xs uppercase" style={{ color: '#4D5A7C' }}>Outgoing</div>
                            </div>
                        </div>
                    </section>
                );
            })()}

            {/* Dream Addresses */}
            {Array.isArray(node.dreamAddresses) && node.dreamAddresses.length > 0 && (
                <section>
                    <h4 className="text-xs uppercase font-semibold mb-2.5 tracking-widest" style={{ color: '#4D5A7C' }}>
                        <Heart className="w-3 h-3 inline mr-1" />
                        Dream Addresses ({node.dreamAddresses.length})
                    </h4>
                    <div className="space-y-1">
                        {node.dreamAddresses.map((addr, i) => (
                            <div key={i} className="text-xs px-2.5 py-1.5 rounded-lg"
                                style={{ background: '#131D32', color: '#8B96B8', border: '1px solid rgba(255,255,255,0.04)' }}>
                                {maskValue(addr.address || addr.label || addr.id || 'Unknown')}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

/* ── Shared icon button style ── */
const iconBtnStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#8B96B8',
};

export default function NetworkDetailPanel() {
    const { selectedNode, setSelectedNode, detailsOpen, privacyMode, graphData } = useNetworkContext();
    const [nodeDetail, setNodeDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState(true);

    // Fetch node detail from API when a non-cluster node is selected
    useEffect(() => {
        if (!selectedNode) { setNodeDetail(null); return; }
        if (selectedNode._isCluster || selectedNode._clusterOrigin) {
            setNodeDetail(selectedNode);
            return;
        }
        const fetch = async () => {
            setLoading(true);
            try {
                const res    = await analyticsAPI.getNodeDetail(selectedNode.id);
                const detail = res.data.node || res.data;
                setNodeDetail({ ...selectedNode, ...detail });
            } catch (err) {
                logger.error('Failed to fetch node details', err);
                setNodeDetail(selectedNode);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [selectedNode]);

    // Expand the sheet whenever a new node is tapped
    useEffect(() => {
        if (selectedNode) setMobileExpanded(true);
    }, [selectedNode?.id]);

    const displayNode = nodeDetail || selectedNode;

    const maskValue = (value) => {
        if (privacyMode === 'public' && value && String(value).length > 3) {
            return String(value).slice(0, 2) + '••••';
        }
        return value;
    };

    const clusterOrigin = displayNode?._clusterOrigin;
    const isCluster     = displayNode?._isCluster || !!clusterOrigin;
    const clusterNode   = clusterOrigin ?? (displayNode?._isCluster ? displayNode : null);
    const focusedNodeId = clusterOrigin ? String(displayNode.id) : null;

    const primaryName = displayNode ? (getDisplayName(displayNode) || 'Unknown') : 'Unknown';
    const roles       = displayNode ? getRoles(displayNode) : [];

    // Title shown in the mobile collapsed bar
    const mobileTitle = isCluster
        ? `${clusterNode?._clusterCount ?? 0} nodes here`
        : loading ? 'Loading…' : maskValue(primaryName);

    const mobileSubtitle = isCluster
        ? (clusterNode?._clusterNodes?.[0]?.address ? maskValue(clusterNode._clusterNodes[0].address) : null)
        : null;

    const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];

    return (
        <>
            {/* ══════════════════════════════════════════
                DESKTOP: right side panel (lg and above)
                ══════════════════════════════════════════ */}
            <AnimatePresence initial={false}>
            {detailsOpen && (
                <motion.div
                    key="detail-panel"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: PANEL_WIDTH, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                    className="hidden lg:flex h-full flex-col shrink-0 overflow-hidden"
                    style={{
                        borderLeft: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(15,23,41,0.6)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <div style={{ width: PANEL_WIDTH }} className="h-full flex flex-col">
                        {!displayNode ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                                    style={{ background: 'rgba(34,201,138,0.1)' }}>
                                    <Info className="w-5 h-5" style={{ color: 'rgba(34,201,138,0.5)' }} />
                                </div>
                                <div className="text-sm font-medium" style={{ color: '#8B96B8' }}>Select a node</div>
                                <p className="text-xs mt-2" style={{ color: '#4D5A7C' }}>to view network metadata</p>
                            </div>
                        ) : isCluster ? (
                            <div className="p-5 flex-1 overflow-y-auto">
                                {/* Cluster header */}
                                <div className="flex items-start justify-between mb-5">
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-base font-bold leading-tight" style={{ color: '#F0F2F7' }}>
                                            {clusterNode._clusterCount} nodes here
                                        </h2>
                                        {clusterNode._clusterNodes?.[0]?.address && (
                                            <div className="flex items-start gap-2 mt-1.5">
                                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#4D5A7C' }} />
                                                <p className="text-xs" style={{ color: '#8B96B8' }}>
                                                    {maskValue(clusterNode._clusterNodes[0].address)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedNode(null)}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer"
                                        style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#4D5A7C' }}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <ClusterBody
                                    node={clusterNode}
                                    focusedNodeId={focusedNodeId}
                                    edges={edges}
                                    onSelectNode={(n) => setSelectedNode(n)}
                                    maskValue={maskValue}
                                />
                            </div>
                        ) : (
                            <div className="p-5 flex-1 overflow-y-auto">
                                {/* Single-node header */}
                                <div className="flex items-start justify-between mb-5">
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-base font-bold leading-tight truncate max-w-[180px]"
                                            style={{ color: '#F0F2F7' }}>
                                            {loading ? 'Loading…' : maskValue(primaryName)}
                                        </h2>
                                        <p className="text-xs font-mono mt-1 tracking-tight" style={{ color: '#4D5A7C' }}>
                                            id: {displayNode.id}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedNode(null)}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer"
                                        style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#4D5A7C' }}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <NodeBody node={displayNode} loading={loading} maskValue={maskValue} graphData={graphData} />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════
                MOBILE: bottom sheet (below lg)
                ══════════════════════════════════════════ */}
            <AnimatePresence initial={false}>
            {detailsOpen && (
                <motion.div
                    key="detail-panel-mobile"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="lg:hidden fixed bottom-0 inset-x-0 z-[1200] rounded-t-2xl"
                    style={{
                        background: 'rgba(13,21,40,0.97)',
                        backdropFilter: 'blur(16px)',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    {/* Drag handle */}
                    <div className="flex justify-center pt-3 pb-0">
                        <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                    </div>

                    {/* Collapsed header — always visible */}
                    <div className="flex items-center gap-2 px-4 py-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight truncate" style={{ color: '#F0F2F7' }}>
                                {mobileTitle}
                            </p>
                            {mobileSubtitle && (
                                <p className="text-xs mt-0.5 truncate" style={{ color: '#8B96B8' }}>{mobileSubtitle}</p>
                            )}
                            {!isCluster && roles.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {roles.map((role) => (
                                        <span key={role} className="text-xs px-2 py-0.5 rounded font-medium"
                                            style={{ background: 'rgba(34,201,138,0.1)', border: '1px solid rgba(34,201,138,0.2)', color: '#22C98A' }}>
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Expand / collapse — does NOT deselect the node */}
                        <button
                            onClick={() => setMobileExpanded((v) => !v)}
                            className="flex items-center justify-center w-8 h-8 rounded-xl transition-all shrink-0 cursor-pointer"
                            style={iconBtnStyle}
                            aria-label={mobileExpanded ? 'Collapse details' : 'Expand details'}
                        >
                            {mobileExpanded
                                ? <ChevronDown className="w-4 h-4" />
                                : <ChevronUp className="w-4 h-4" />}
                        </button>

                        {/* Close — deselects the node */}
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="flex items-center justify-center w-8 h-8 rounded-xl transition-all shrink-0 cursor-pointer"
                            style={iconBtnStyle}
                            aria-label="Deselect node"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Expandable body */}
                    <AnimatePresence initial={false}>
                    {mobileExpanded && (
                        <motion.div
                            key="mobile-body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div
                                className="overflow-y-auto px-4 pt-3 pb-8"
                                style={{
                                    maxHeight: '58vh',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                {isCluster && clusterNode ? (
                                    <ClusterBody
                                        node={clusterNode}
                                        focusedNodeId={focusedNodeId}
                                        edges={edges}
                                        onSelectNode={(n) => setSelectedNode(n)}
                                        maskValue={maskValue}
                                    />
                                ) : displayNode ? (
                                    <NodeBody
                                        node={displayNode}
                                        loading={loading}
                                        maskValue={maskValue}
                                        graphData={graphData}
                                    />
                                ) : null}
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </motion.div>
            )}
            </AnimatePresence>
        </>
    );
}
