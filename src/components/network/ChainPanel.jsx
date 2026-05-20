import { motion, AnimatePresence } from 'motion/react';
import { useNetworkContext } from '@/context/NetworkContext';
import ChainList from './ChainList';

const PANEL_WIDTH = 'min(85vw, 240px)';

export default function ChainPanel() {
    const { chainsPanelOpen } = useNetworkContext();

    return (
        <AnimatePresence initial={false}>
            {chainsPanelOpen && (
                <motion.div
                    key="chain-panel"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: PANEL_WIDTH, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                    className="h-full flex flex-col shrink-0 overflow-hidden"
                    style={{
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(11,17,32,0.9)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <div style={{ width: PANEL_WIDTH }} className="h-full flex flex-col overflow-hidden">
                        <div className="px-3 pt-3 pb-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h3
                                className="text-[9px] uppercase tracking-[0.2em] font-semibold"
                                style={{ color: '#4D5A7C' }}
                            >
                                Chains
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3">
                            <ChainList />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
