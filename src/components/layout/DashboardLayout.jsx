import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

function LayoutContent() {
    const { collapsed, isOpen, close } = useSidebar();

    return (
        <div className="min-h-screen bg-navy-950">
            <Sidebar />

            {/* Mobile overlay backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-navy-950/60 backdrop-blur-sm lg:hidden"
                    onClick={close}
                />
            )}

            <div
                className={cn(
                    'transition-all duration-300 ease-out',
                    /* Desktop: shift content right based on sidebar width */
                    collapsed ? 'lg:ml-[72px]' : 'lg:ml-64',
                    /* Mobile: no margin shift (sidebar is overlay) */
                    'ml-0',
                )}
            >
                <Header />
                <main className="p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export function DashboardLayout() {
    return (
        <SidebarProvider>
            <LayoutContent />
        </SidebarProvider>
    );
}
