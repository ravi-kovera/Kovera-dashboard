/**
 * Detail panel for a selected network node.
 * - "Label" field removed.
 * - "Type" renamed to "Role", mapped to app nomenclature: Buyer, Seller, Landlord, Renter.
 * - A node can have multiple roles.
 * - Node display name: real name if available, otherwise "Unknown".
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNetworkContext } from '@/context/NetworkContext';
import { analyticsAPI } from '@/services/api/analytics';
import { logger } from '@/lib/logger';
import { Info, X, MapPin, Heart, ArrowDownLeft, ArrowUpRight, Link2, UserCheck, UserX } from 'lucide-react';

const PANEL_WIDTH = 'min(88vw, 300px)';

const toNodeType = (node) => String(node?.type || '').toLowerCase();
const isUserLikeNode = (node) =>
    ['user_home', 'swapper', 'pure_seller', 'pure_buyer'].includes(toNodeType(node));

// Map node data to human-readable role(s)
function getRoles(node) {
    if (!node) return [];
    const type       = toNodeType(node);
    const personType = String(node.personType || '').toLowerCase();

    // Explicit roles array from API
    if (Array.isArray(node.roles) && node.roles.length) return node.roles;

    if (type === 'pure_buyer') return ['Buyer'];
    if (type === 'pure_seller') return ['Seller'];
    if (type === 'swapper') return ['Buyer', 'Seller'];
    if (type === 'user_home') {
        if (personType === 'buyer')   return ['Buyer'];
        if (personType === 'seller')  return ['Seller'];
        if (personType === 'swapper') return ['Buyer', 'Seller'];
        if (personType === 'landlord') return ['Landlord'];
        if (personType === 'renter')  return ['Renter'];
        return ['Buyer']; // default
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

function ClusterDetail({ node, onClose, maskValue }) {
    const roles = (n) => getRoles(n);
    const sharedAddress = node._clusterNodes?.[0]?.address;
    const lat = node.lat ? Number(node.lat).toFixed(4) : null;
    const lng = node.lng ? Number(node.lng).toFixed(4) : null;

    return (
        <div className="p-5 flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold leading-tight" style={{ color: '#F0F2F7' }}>
                        {node._clusterCount} nodes here
                    </h2>
                    {sharedAddress && (
                        <div className="flex items-start gap-2 mt-1.5">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#4D5A7C' }} />
                            <p className="text-xs" style={{ color: '#8B96B8' }}>
                                {maskValue(sharedAddress)}
                            </p>
                        </div>
                    )}
                    {lat && lng && (
                        <p className="text-[10px] font-mono mt-1" style={{ color: '#4D5A7C' }}>
                            {lat}, {lng}
                        </p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
                    style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#4D5A7C' }}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-2">
                {node._clusterNodes.map((n, i) => {
                    const name = getDisplayName(n) || 'Unknown';
                    const nodeRoles = roles(n);
                    return (
                        <div
                            key={n.id || i}
                            className="p-3 rounded-xl space-y-2"
                            style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold truncate" style={{ color: '#F0F2F7' }}>
                                    {maskValue(name)}
                                </span>
                                {n.hasAgent === true ? (
                                    <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#22C98A' }} />
                                ) : n.hasAgent === false ? (
                                    <UserX className="w-3.5 h-3.5 shrink-0" style={{ color: '#EF4444' }} />
                                ) : null}
                            </div>
                            {nodeRoles.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {nodeRoles.map((role) => (
                                        <span
                                            key={role}
                                            className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                                            style={{
                                                background: 'rgba(34,201,138,0.1)',
                                                border: '1px solid rgba(34,201,138,0.2)',
                                                color: '#22C98A',
                                            }}
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {n.agentName && (
                                <p className="text-[10px]" style={{ color: '#8B96B8' }}>
                                    {maskValue(n.agentName)}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function NetworkDetailPanel() {
    const { selectedNode, setSelectedNode, detailsOpen, privacyMode } = useNetworkContext();
    const [nodeDetail, setNodeDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedNode) { setNodeDetail(null); return; }
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

    const displayNode = nodeDetail || selectedNode;

    const maskValue = (value) => {
        if (privacyMode === 'public' && value && String(value).length > 3) {
            return String(value).slice(0, 2) + '••••';
        }
        return value;
    };

    const primaryName = displayNode ? (getDisplayName(displayNode) || 'Unknown') : 'Unknown';
    const roles       = displayNode ? getRoles(displayNode) : [];
    const isCluster   = displayNode?._isCluster;

    return (
        <AnimatePresence initial={false}>
        {detailsOpen && <motion.div
            key="detail-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: PANEL_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="h-full flex flex-col shrink-0 overflow-hidden"
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
                    <ClusterDetail node={displayNode} onClose={() => setSelectedNode(null)} maskValue={maskValue} />
                ) : (
                    <div className="p-5 flex-1 overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-5">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base font-bold leading-tight truncate max-w-[180px]"
                                    style={{ color: '#F0F2F7' }}>
                                    {loading ? 'Loading…' : maskValue(primaryName)}
                                </h2>
                                <p className="text-[10px] font-mono mt-1 tracking-tight" style={{ color: '#4D5A7C' }}>
                                    id: {displayNode.id}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
                                style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#4D5A7C' }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Role */}
                            {roles.length > 0 && (
                                <section>
                                    <h4 className="text-[10px] uppercase font-semibold mb-2.5 tracking-widest"
                                        style={{ color: '#4D5A7C' }}>
                                        Role
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {roles.map((role) => (
                                            <span
                                                key={role}
                                                className="text-xs px-2.5 py-1 rounded-lg font-medium"
                                                style={{
                                                    background: 'rgba(34,201,138,0.1)',
                                                    border: '1px solid rgba(34,201,138,0.2)',
                                                    color: '#22C98A',
                                                }}
                                            >
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Agent link (user-like nodes only) */}
                            {isUserLikeNode(displayNode) && (
                                <section>
                                    <h4 className="text-[10px] uppercase font-semibold mb-2.5 tracking-widest"
                                        style={{ color: '#4D5A7C' }}>
                                        Agent Link
                                    </h4>
                                    <div className="p-3 rounded-xl flex items-center gap-3"
                                        style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        {displayNode.hasAgent === true ? (
                                            <>
                                                <UserCheck className="w-4 h-4 shrink-0" style={{ color: '#22C98A' }} />
                                                <div>
                                                    <div className="text-xs font-semibold" style={{ color: '#22C98A' }}>
                                                        Agent linked
                                                    </div>
                                                    {displayNode.agentName && (
                                                        <div className="text-[11px]" style={{ color: '#8B96B8' }}>
                                                            {maskValue(displayNode.agentName)}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : displayNode.hasAgent === false ? (
                                            <>
                                                <UserX className="w-4 h-4 shrink-0" style={{ color: '#EF4444' }} />
                                                <div className="text-xs font-semibold" style={{ color: '#EF4444' }}>
                                                    No agent
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-xs" style={{ color: '#4D5A7C' }}>Agent status unknown</div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Location */}
                            {(displayNode.address || (displayNode.lat && displayNode.lng)) && (
                                <section>
                                    <h4 className="text-[10px] uppercase font-semibold mb-2.5 tracking-widest"
                                        style={{ color: '#4D5A7C' }}>
                                        Location
                                    </h4>
                                    <div className="space-y-2">
                                        {displayNode.address && (
                                            <div className="flex items-start gap-2.5">
                                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#4D5A7C' }} />
                                                <div className="text-xs" style={{ color: '#F0F2F7' }}>
                                                    {maskValue(displayNode.address)}
                                                </div>
                                            </div>
                                        )}
                                        {displayNode.lat && displayNode.lng && (
                                            <div className="text-[10px] font-mono" style={{ color: '#4D5A7C' }}>
                                                {Number(displayNode.lat).toFixed(4)}, {Number(displayNode.lng).toFixed(4)}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Interests */}
                            {Array.isArray(displayNode.likes) && displayNode.likes.length > 0 && (
                                <section>
                                    <h4 className="text-[10px] uppercase font-semibold mb-2.5 tracking-widest"
                                        style={{ color: '#4D5A7C' }}>
                                        <Heart className="w-3 h-3 inline mr-1" />
                                        Interests ({displayNode.likes.length})
                                    </h4>
                                    <div className="space-y-1">
                                        {displayNode.likes.map((like, i) => (
                                            <div key={i} className="text-xs px-2.5 py-1.5 rounded-lg"
                                                style={{ background: '#131D32', color: '#8B96B8', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                {maskValue(like.address || like.label || like.id || 'Unknown')}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Connections — incomingLikes / outgoingLikes are counts from backend */}
                            {(displayNode.incomingLikes != null || displayNode.outgoingLikes != null) && (
                                <section>
                                    <h4 className="text-[10px] uppercase font-semibold mb-2.5 tracking-widest"
                                        style={{ color: '#4D5A7C' }}>
                                        <Link2 className="w-3 h-3 inline mr-1" />
                                        Connections
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {displayNode.incomingLikes != null && (
                                            <div className="p-2.5 rounded-xl text-center"
                                                style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <ArrowDownLeft className="w-3 h-3 mx-auto mb-1" style={{ color: '#22C98A' }} />
                                                <div className="text-lg font-bold" style={{ color: '#F0F2F7' }}>
                                                    {displayNode.incomingLikes}
                                                </div>
                                                <div className="text-[9px] uppercase" style={{ color: '#4D5A7C' }}>Incoming</div>
                                            </div>
                                        )}
                                        {displayNode.outgoingLikes != null && (
                                            <div className="p-2.5 rounded-xl text-center"
                                                style={{ background: '#131D32', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <ArrowUpRight className="w-3 h-3 mx-auto mb-1" style={{ color: '#378ADD' }} />
                                                <div className="text-lg font-bold" style={{ color: '#F0F2F7' }}>
                                                    {displayNode.outgoingLikes}
                                                </div>
                                                <div className="text-[9px] uppercase" style={{ color: '#4D5A7C' }}>Outgoing</div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Dream Addresses — returned by /node/:id endpoint */}
                            {Array.isArray(displayNode.dreamAddresses) && displayNode.dreamAddresses.length > 0 && (
                                <section>
                                    <h4 className="text-[10px] uppercase font-semibold mb-2.5 tracking-widest"
                                        style={{ color: '#4D5A7C' }}>
                                        <Heart className="w-3 h-3 inline mr-1" />
                                        Dream Addresses ({displayNode.dreamAddresses.length})
                                    </h4>
                                    <div className="space-y-1">
                                        {displayNode.dreamAddresses.map((addr, i) => (
                                            <div key={i} className="text-xs px-2.5 py-1.5 rounded-lg"
                                                style={{ background: '#131D32', color: '#8B96B8', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                {maskValue(addr.address || addr.label || addr.id || 'Unknown')}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>}
        </AnimatePresence>
    );
}
