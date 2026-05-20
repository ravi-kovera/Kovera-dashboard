import { useNetworkContext } from '@/context/NetworkContext';

// Node type swatches per filter key.
// User Homes maps to both swapper (amber) and pure_seller (orange) — backend has no "user_home" type.
const FILTER_SWATCHES = {
    'All': [
        { label: 'Swapper',            color: '#FFB300', shape: 'circle'  },
        { label: 'Home Owner',         color: '#FF5722', shape: 'circle'  },
        { label: 'Public Listing',     color: '#39FF14', shape: 'circle'  },
        { label: 'Off-Market / Pocket',color: '#9D4EDD', shape: 'circle'  },
        { label: 'Dream Anchor',       color: '#FF2A85', shape: 'diamond' },
    ],
    'User Homes': [
        { label: 'Swapper',    color: '#FFB300', shape: 'circle' },
        { label: 'Home Owner', color: '#FF5722', shape: 'circle' },
    ],
    'Swappers':              [{ label: 'Swapper',             color: '#FFB300', shape: 'circle'  }],
    'Pure Sellers':          [{ label: 'Home Owner',          color: '#FF5722', shape: 'circle'  }],
    'Public Listings':       [{ label: 'Public Listing',      color: '#39FF14', shape: 'circle'  }],
    'Off-Market Properties': [{ label: 'Off-Market / Pocket', color: '#9D4EDD', shape: 'circle'  }],
    'Dream Anchors':         [{ label: 'Dream Anchor',        color: '#FF2A85', shape: 'diamond' }],
};

function Swatch({ color, shape }) {
    if (shape === 'diamond') {
        return (
            <div style={{
                width: 10, height: 10,
                background: color,
                transform: 'rotate(45deg)',
                flexShrink: 0,
            }} />
        );
    }
    return (
        <div style={{
            width: 12, height: 12,
            borderRadius: '9999px',
            background: color,
            flexShrink: 0,
        }} />
    );
}

// Filters where nodes can have an agent (user-type nodes only)
const USER_FILTERS = new Set(['All', 'User Homes', 'Swappers', 'Pure Sellers']);

export default function NetworkLegend() {
    const { activeChain, filter, selectedNode } = useNetworkContext();
    if (activeChain?.id) return null;

    const swatches = FILTER_SWATCHES[filter] ?? FILTER_SWATCHES['All'];
    const agentLinkColor = filter === 'All' ? '#8B96B8' : swatches[0]?.color ?? '#8B96B8';
    const showAgentLink = USER_FILTERS.has(filter);
    const showLines = !!selectedNode;

    return (
        <div
            className="absolute bottom-6 left-6 p-4 rounded-2xl z-[1200] pointer-events-none shadow-2xl"
            style={{
                backdropFilter: 'blur(16px)',
                background: 'rgba(19,29,50,0.7)',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Node types for active filter */}
            <h4
                className="text-[9px] uppercase font-semibold tracking-[0.2em] mb-2.5"
                style={{ color: '#4D5A7C' }}
            >
                {filter === 'All' ? 'Node Types' : filter}
            </h4>
            <div className="space-y-2 mb-3">
                {swatches.map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                        <Swatch color={s.color} shape={s.shape} />
                        <span className="text-[10px]" style={{ color: '#8B96B8' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Agent link — only for filters that include user-type nodes */}
            {showAgentLink && (
                <div
                    className="pt-2.5 space-y-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <h4
                        className="text-[9px] uppercase font-semibold tracking-[0.2em] mb-2"
                        style={{ color: '#4D5A7C' }}
                    >
                        Agent Link
                    </h4>
                    <div className="flex items-center gap-3">
                        <div style={{ width: 12, height: 12, borderRadius: '9999px', background: agentLinkColor, flexShrink: 0 }} />
                        <span className="text-[10px]" style={{ color: '#8B96B8' }}>Linked to Agent</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div style={{
                            width: 12, height: 12, borderRadius: '9999px', background: agentLinkColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <span style={{ color: '#0F1729', fontSize: 8, fontWeight: 900, lineHeight: 1 }}>+</span>
                        </div>
                        <span className="text-[10px]" style={{ color: '#8B96B8' }}>No Agent</span>
                    </div>
                </div>
            )}

            {/* Chain line types — only visible when a node is selected */}
            {showLines && (
                <div
                    className="pt-2.5 mt-2 space-y-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div className="flex items-center gap-3">
                        <div style={{ width: 20, height: 1.5, background: '#7C7C8A', opacity: 0.7, flexShrink: 0 }} />
                        <span className="text-[10px]" style={{ color: '#8B96B8' }}>Confirmed chain</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div style={{ width: 20, height: 0, borderTop: '2px dashed #7C7C8A', opacity: 0.7, flexShrink: 0 }} />
                        <span className="text-[10px]" style={{ color: '#8B96B8' }}>Unconfirmed chain</span>
                    </div>
                </div>
            )}
        </div>
    );
}
