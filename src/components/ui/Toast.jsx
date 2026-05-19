import {
    useState,
    useCallback,
    useEffect,
    createContext,
    useContext,
} from 'react';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

/**
 * Toast notification system.
 *
 * Usage:
 *   const { addToast } = useToast();
 *   addToast({ type: "success", title: "Saved", message: "Changes saved" });
 */

const ToastContext = createContext(null);

let toastIdCounter = 0;

const TOAST_CONFIG = {
    success: {
        icon: CheckCircle2,
        bg: 'bg-green-500/10 border-green-500/30',
        iconColor: 'text-green-400',
        progressColor: 'bg-green-500',
    },
    error: {
        icon: XCircle,
        bg: 'bg-red-500/10 border-red-500/30',
        iconColor: 'text-red-400',
        progressColor: 'bg-red-500',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-500/10 border-amber-500/30',
        iconColor: 'text-amber-400',
        progressColor: 'bg-amber-500',
    },
    info: {
        icon: Info,
        bg: 'bg-blue-500/10 border-blue-500/30',
        iconColor: 'text-blue-400',
        progressColor: 'bg-blue-500',
    },
};

function ToastItem({ toast, onDismiss }) {
    const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
    const Icon = config.icon;
    const duration = toast.duration || 5000;

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), duration);
        return () => clearTimeout(timer);
    }, [toast.id, duration, onDismiss]);

    return (
        <div
            className={`relative flex items-start gap-3 w-80 p-4 rounded-xl border backdrop-blur-md shadow-elevated animate-slide-up ${config.bg}`}
            role="alert"
        >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconColor}`} />
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="text-sm font-semibold text-white">
                        {toast.title}
                    </p>
                )}
                {toast.message && (
                    <p className="text-xs text-muted mt-0.5">{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
                <X className="w-3.5 h-3.5" />
            </button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-xl">
                <div
                    className={`h-full ${config.progressColor} rounded-b-xl`}
                    style={{
                        animation: `shrink-width ${duration}ms linear forwards`,
                    }}
                />
            </div>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((toast) => {
        const id = ++toastIdCounter;
        setToasts((prev) => [...prev, { ...toast, id }]);
        return id;
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Listen for global custom events
    useEffect(() => {
        const handleGlobalToast = (e) => {
            addToast(e.detail);
        };
        window.addEventListener('kovera:toast', handleGlobalToast);
        return () =>
            window.removeEventListener('kovera:toast', handleGlobalToast);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, dismissToast }}>
            {children}

            {/* Toast container — fixed bottom-right */}
            {toasts.length > 0 && (
                <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
                    {toasts.map((toast) => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onDismiss={dismissToast}
                        />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
