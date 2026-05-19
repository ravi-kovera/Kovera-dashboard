import { cn } from '@/lib/utils';

/**
 * Skeleton — animated placeholder for loading states.
 * Use instead of spinners for content-aware loading.
 *
 * @example
 * <Skeleton className="h-4 w-32" />               // text line
 * <Skeleton className="h-10 w-10 rounded-full" />  // avatar
 * <Skeleton className="h-40 w-full" />              // image
 */
function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn('animate-pulse rounded-lg bg-navy-700/50', className)}
            {...props}
        />
    );
}

/**
 * SkeletonText — multiple skeleton lines simulating a paragraph.
 *
 * @param {number} lines - Number of lines to render (default 3)
 */
function SkeletonText({ lines = 3, className }) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        'h-3.5',
                        i === lines - 1 ? 'w-3/5' : 'w-full', // last line shorter
                    )}
                />
            ))}
        </div>
    );
}

/**
 * SkeletonCard — a complete card skeleton with icon, title, and body.
 */
function SkeletonCard({ className }) {
    return (
        <div
            className={cn(
                'rounded-2xl bg-surface border border-border p-5 space-y-4',
                className,
            )}
        >
            <div className="flex items-start justify-between">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-16 h-5 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded" />
        </div>
    );
}

/**
 * SkeletonTable — table rows skeleton.
 *
 * @param {number} rows - Number of skeleton rows
 * @param {number} cols - Number of columns
 */
function SkeletonTable({ rows = 5, cols = 5, className }) {
    return (
        <div
            className={cn(
                'rounded-2xl bg-surface border border-border overflow-hidden',
                className,
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-border">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="h-3 flex-1 max-w-[100px] rounded"
                    />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div
                    key={r}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-border/50 last:border-0"
                >
                    {r === 0 || r === 2 ? (
                        <>
                            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-4 w-28 rounded" />
                                <Skeleton className="h-3 w-40 rounded" />
                            </div>
                            {Array.from({ length: cols - 2 }).map((_, c) => (
                                <Skeleton
                                    key={c}
                                    className="h-4 w-16 rounded flex-shrink-0"
                                />
                            ))}
                        </>
                    ) : (
                        Array.from({ length: cols }).map((_, c) => (
                            <Skeleton
                                key={c}
                                className={cn(
                                    'h-4 rounded flex-1',
                                    c === 0 ? 'max-w-[140px]' : 'max-w-[80px]',
                                )}
                            />
                        ))
                    )}
                </div>
            ))}
        </div>
    );
}

/**
 * SkeletonAvatar — circular or rounded avatar skeleton.
 */
function SkeletonAvatar({ size = 'md', className }) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
    };
    return <Skeleton className={cn(sizes[size], 'rounded-xl', className)} />;
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonAvatar };
