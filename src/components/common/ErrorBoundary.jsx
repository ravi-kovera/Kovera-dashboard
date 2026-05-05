import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * React class Error Boundary.
 *
 * Catches unhandled render/lifecycle errors from any child component tree and
 * renders a recovery UI instead of letting the crash propagate to a blank screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 *
 * Or with a custom fallback:
 *   <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *     ...
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In a real app, send to an error tracking service (Sentry, Datadog, etc.)
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Caught render error:", error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
            <p className="text-sm text-muted mt-1">
              An unexpected error occurred. You can try refreshing the page or reloading this section.
            </p>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl p-3 overflow-auto max-h-32">
              {this.state.error.toString()}
            </pre>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-800 border border-border text-muted text-sm font-medium hover:text-white transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
