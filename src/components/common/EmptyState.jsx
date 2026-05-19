import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Standard "no data" / "couldn't load" panel used by every authenticated
 * section when its underlying query returns no rows or errors. Replaces
 * the old per-page DEMO_* fallback constants so the UI never shows fake
 * numbers — empty stays empty, errors stay visibly errors.
 *
 * Props:
 * - variant:  'empty' (default) | 'error'
 * - title:    short headline. Defaults per variant.
 * - message:  one-line hint. Optional.
 * - icon:     lucide-react component override. Defaults per variant.
 * - onRetry:  if provided AND variant === 'error', renders a retry button.
 * - className: appended to the outer card so callers can tighten padding.
 */
export function EmptyState({
    variant = 'empty',
    title,
    message,
    icon: IconOverride,
    onRetry,
    className = '',
}) {
    const isError = variant === 'error';
    const Icon = IconOverride ?? (isError ? AlertTriangle : Inbox);

    const defaultTitle = isError ? "Couldn't load" : 'No data yet';
    const defaultMessage = isError
        ? 'Something went wrong fetching this. Try again in a moment.'
        : 'New data will appear here as it comes in.';

    return (
        <div
            className={`flex flex-col items-center justify-center text-center px-6 py-10 rounded-2xl border border-border bg-surface/40 ${className}`}
        >
            <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    isError
                        ? 'bg-danger/10 text-danger'
                        : 'bg-surface text-muted'
                }`}
            >
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-white">
                {title ?? defaultTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {message ?? defaultMessage}
            </p>
            {isError && onRetry && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onRetry}
                    className="mt-4"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                </Button>
            )}
        </div>
    );
}
