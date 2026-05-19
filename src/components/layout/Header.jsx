import { Bell, User, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';

// Derive 1–2 character initials for the avatar from displayName or email.
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

/* ── Breadcrumb label map ── */
const pageTitles = {
    dashboard: 'Dashboard',
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
    const location = useLocation();
    const initials = initialsFor(user);
    const displayName = user?.displayName || user?.email?.split('@')[0] || '—';

    // Derive current page name from path
    const segment =
        location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
    const pageTitle = pageTitles[segment] || 'Dashboard';

    return (
        <header className="sticky top-0 z-30 h-16 bg-navy-900/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 gap-4">
            {/* Left — Mobile toggle + Breadcrumb */}
            <div className="flex items-center gap-4">
                {/* Mobile hamburger (visible only on small screens or when sidebar collapsed) */}
                <button
                    onClick={toggle}
                    className="p-2 rounded-xl text-muted hover:text-white hover:bg-surface-hover transition-colors cursor-pointer lg:hidden"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Breadcrumb */}
                <div className="hidden sm:flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Kovera</span>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="text-white font-medium">{pageTitle}</span>
                </div>
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <button className="relative p-2 rounded-xl text-muted hover:text-white hover:bg-surface-hover transition-colors cursor-pointer">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse-slow" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

                {/* User Avatar */}
                <button className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-semibold">
                        {initials || <User className="w-4 h-4" />}
                    </div>
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-medium text-white leading-tight">
                            {displayName}
                        </p>
                        {user?.email && (
                            <p className="text-xs text-muted leading-tight">
                                {user.email}
                            </p>
                        )}
                    </div>
                </button>
            </div>
        </header>
    );
}
