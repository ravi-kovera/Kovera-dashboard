import { User, Menu, BarChart2, Network } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { useViewMode } from '@/context/ViewModeContext';
import { cn } from '@/lib/utils';

function initialsFor(user) {
    if (!user) return null;
    const source = user.displayName?.trim() || user.email || '';
    if (!source) return null;
    const parts = source.split(/[\s@.]+/).filter(Boolean);
    return parts
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');
}

const pageTitles = {
    dashboard: 'Overview',
    search: 'Search',
    users: 'Users',
    agents: 'Agents',
    properties: 'Properties',
    settings: 'Settings',
    components: 'Components',
};

export function Header() {
    const { toggle } = useSidebar();
    const { user } = useAuth();
    const { mode, setMode } = useViewMode();
    const location = useLocation();
    const initials = initialsFor(user);
    const displayName = user?.displayName || user?.email?.split('@')[0] || '—';

    const segment = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
    const pageTitle = mode === 'network' ? 'Network' : (pageTitles[segment] || 'Dashboard');

    return (
        <header className="sticky top-0 z-30 h-16 bg-navy-900/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6 gap-2 sm:gap-4">
            {/* Left — Mobile toggle + Breadcrumb */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggle}
                    className="p-2 rounded-xl text-muted hover:text-white hover:bg-surface-hover transition-colors cursor-pointer lg:hidden"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="hidden sm:flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Kovera</span>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="text-white font-medium">{pageTitle}</span>
                </div>
            </div>

            {/* Centre — Mode Toggle */}
            <div
                className="flex items-center gap-0.5 p-1 rounded-xl"
                style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.5)' }}
            >
                <button
                    onClick={() => setMode('analytics')}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        mode === 'analytics'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted hover:text-white'
                    )}
                >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Analytics</span>
                </button>
                <button
                    onClick={() => setMode('network')}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        mode === 'network'
                            ? 'text-white shadow-sm'
                            : 'text-muted hover:text-white'
                    )}
                    style={
                        mode === 'network'
                            ? { background: '#22C98A' }
                            : {}
                    }
                >
                    <Network className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Network</span>
                </button>
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-2">
                <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

                <button className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-semibold">
                        {initials || <User className="w-4 h-4" />}
                    </div>
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-medium text-white leading-tight">{displayName}</p>
                        {user?.email && (
                            <p className="text-xs text-muted leading-tight">{user.email}</p>
                        )}
                    </div>
                </button>
            </div>
        </header>
    );
}
