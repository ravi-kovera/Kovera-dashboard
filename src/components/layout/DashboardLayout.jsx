import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { ViewModeProvider, useViewMode } from '@/context/ViewModeContext';
import { NetworkProvider } from '@/context/NetworkContext';
import NetworkMap from '@/pages/NetworkMap';
import { cn } from '@/lib/utils';

function LayoutContent() {
    const { collapsed, isOpen, close } = useSidebar();
    const { mode } = useViewMode();

    return (
        <div className="min-h-screen bg-navy-950">
            {/* Sidebar is hidden in network mode — the network view has its own sidebar */}
            {mode === 'analytics' && <Sidebar />}

            {mode === 'analytics' && isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-navy-950/60 backdrop-blur-sm lg:hidden"
                    onClick={close}
                />
            )}

            <div
                className={cn(
                    'transition-all duration-300 ease-out',
                    mode === 'analytics' && (collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'),
                    'ml-0',
                )}
            >
                <Header />
                {mode === 'analytics' ? (
                    <main className="p-4 sm:p-6">
                        <Outlet />
                    </main>
                ) : (
                    <NetworkMap />
                )}
            </div>
        </div>
    );
}

export function DashboardLayout() {
    return (
        <ViewModeProvider>
            <NetworkProvider>
                <SidebarProvider>
                    <LayoutContent />
                </SidebarProvider>
            </NetworkProvider>
        </ViewModeProvider>
    );
}
