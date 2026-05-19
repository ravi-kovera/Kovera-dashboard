import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton, SkeletonCard } from '@/components/ui';

/**
 * AuthSkeleton — full-page skeleton layout matching the dashboard shell.
 * Shown while auth state is resolving. Uses skeletons, never spinners.
 */
function AuthSkeleton() {
    return (
        <div className="min-h-screen bg-navy-950 flex">
            {/* Sidebar skeleton */}
            <div className="hidden lg:block w-64 bg-navy-900 border-r border-border p-4 space-y-6 shrink-0">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <div className="space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded-lg" />
                    ))}
                </div>
            </div>

            {/* Main area */}
            <div className="flex-1">
                {/* Header skeleton */}
                <div className="h-16 border-b border-border px-6 flex items-center justify-between">
                    <Skeleton className="h-5 w-40 rounded" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>

                {/* Content skeleton */}
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48 rounded-lg" />
                        <Skeleton className="h-4 w-72 rounded" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * ProtectedRoute — wraps routes that require authentication.
 * - If auth is loading → shows a skeleton layout (not a spinner)
 * - If not authenticated → redirects to /login (preserving the intended URL)
 * - If authenticated → renders children
 */
export function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Still checking auth state — show skeleton layout
    if (loading) {
        return <AuthSkeleton />;
    }

    // Not authenticated → redirect to login with return URL
    if (!isAuthenticated) {
        return (
            <Navigate to="/login" state={{ from: location.pathname }} replace />
        );
    }

    // Authenticated → render the page
    return children;
}
