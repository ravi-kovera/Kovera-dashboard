import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Connection Lost Banner — shows at the top of the page when the browser goes offline.
 * Automatically hides when connection is restored.
 */
export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[110] bg-amber-500/90 backdrop-blur-sm text-navy-950 text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 animate-slide-down">
            <WifiOff className="w-4 h-4" />
            <span>Connection lost — some features may be unavailable</span>
        </div>
    );
}
