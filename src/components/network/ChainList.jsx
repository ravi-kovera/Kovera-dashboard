import { useNetworkContext } from '@/context/NetworkContext';

export default function ChainList() {
    const { graphData, activeChain, setActiveChain } = useNetworkContext();

    const chains = Array.isArray(graphData?.chains) ? graphData.chains.filter(Boolean) : [];

    if (!chains.length) {
        return <div style={{ color: '#4D5A7C', fontSize: 12 }} className="italic py-2">No chains detected.</div>;
    }

    return (
        <div className="space-y-2 pt-1">
            {chains.map((chain, idx) => {
                const cid = chain.id || `chain-${idx}`;
                const mappedLen = Array.isArray(chain.path) ? chain.path.length : 0;
                const ord = Array.isArray(chain.orderedPath) ? chain.orderedPath : [];
                const pathLen = mappedLen || ord.length || 0;
                const score = typeof chain.readinessScore === 'number' ? chain.readinessScore : chain.score;
                const parts = Array.isArray(chain.participants) ? chain.participants : [];
                const head = parts[0];
                const tail = parts[parts.length - 1];
                const headLabel = head?.name?.trim() || 'Head';
                const tailLabel = tail?.name?.trim() || 'Tail';
                const routeLabel = parts.length >= 2 ? `${headLabel} → ${tailLabel}` : headLabel;
                const isActive = activeChain?.id === cid;

                return (
                    <div
                        key={cid}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setActiveChain(isActive ? null : chain);
                            }
                        }}
                        onClick={() => setActiveChain(isActive ? null : chain)}
                        className="p-3 rounded-xl transition-all cursor-pointer"
                        style={{
                            border: isActive
                                ? '1px solid #22C98A'
                                : chain.isReady
                                  ? '1px solid rgba(34,201,138,0.2)'
                                  : '1px solid rgba(255,255,255,0.06)',
                            background: isActive
                                ? 'rgba(34,201,138,0.1)'
                                : chain.isReady
                                  ? 'rgba(34,201,138,0.05)'
                                  : 'rgba(19,29,50,0.5)',
                            opacity: !chain.isReady && !isActive ? 0.6 : 1,
                        }}
                    >
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <span
                                className="text-xs font-bold font-mono truncate max-w-[140px]"
                                style={{ color: chain.isReady ? '#22C98A' : '#4D5A7C' }}
                            >
                                {cid}
                            </span>
                            {chain.isReady && (
                                <span
                                    className="text-sm px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                                    style={{ background: 'rgba(34,201,138,0.2)', color: '#22C98A' }}
                                >
                                    READY
                                </span>
                            )}
                        </div>
                        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: '#4D5A7C' }}>
                            {chain.chainType || 'chain'} · {pathLen} hop{pathLen === 1 ? '' : 's'}
                            {mappedLen > 0 && mappedLen < ord.length ? ` · ${mappedLen}/${ord.length} on map` : ''}
                        </div>
                        <div
                            className="text-sm leading-snug line-clamp-2"
                            style={{ color: '#8B96B8' }}
                            title={routeLabel}
                        >
                            {routeLabel}
                        </div>
                        {(chain.isReady || typeof score === 'number') && (
                            <div
                                className="w-full h-1.5 rounded-full overflow-hidden mt-2"
                                style={{ background: '#0B1120' }}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, Math.round((score ?? 0) * 100))}%`,
                                        background: 'linear-gradient(to right, #22C98A, #34D399)',
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
