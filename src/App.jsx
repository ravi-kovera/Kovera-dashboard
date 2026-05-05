import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { publicRoutes, layoutRoute, fallbackRoute } from "@/routes";
import { Skeleton, SkeletonCard, ToastProvider } from "@/components/ui";
import { OfflineBanner, ErrorBoundary } from "@/components/common";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in p-1">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="rounded-2xl bg-surface border border-border overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border/50">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-20 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <OfflineBanner />
            <BrowserRouter>
              <AuthProvider>
                <Suspense fallback={<PageSkeleton />}>
                  <Routes>
                    {publicRoutes.map((route) => (
                      <Route key={route.path} {...route} />
                    ))}
                    <Route path={layoutRoute.path} element={layoutRoute.element}>
                      {layoutRoute.children.map((route, idx) => (
                        <Route key={route.path || idx} {...route} />
                      ))}
                    </Route>
                    <Route {...fallbackRoute} />
                  </Routes>
                </Suspense>
              </AuthProvider>
            </BrowserRouter>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
