import { cn } from '@/lib/utils';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    X,
} from 'lucide-react';

/* ── Sort Icon ── */
function SortIndicator({ field, currentSort, currentOrder }) {
    if (currentSort !== field)
        return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />;
    return currentOrder === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
        <ArrowDown className="w-3.5 h-3.5 text-primary" />
    );
}

/* ── Skeleton Rows ── */
function SkeletonRows({ rows, cols }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="border-b border-border/50">
                    {Array.from({ length: cols }).map((_, c) => (
                        <td key={c} className="px-5 py-3.5">
                            {c === 0 ? (
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-9 h-9 rounded-xl" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-28 rounded" />
                                        <Skeleton className="h-3 w-36 rounded" />
                                    </div>
                                </div>
                            ) : (
                                <Skeleton
                                    className={cn(
                                        'h-4 rounded',
                                        c === cols - 1
                                            ? 'w-14 rounded-full h-5'
                                            : 'w-20',
                                    )}
                                />
                            )}
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

/**
 * DataTable — reusable table component with sorting, pagination, filtering.
 *
 * COLUMN DEFINITION:
 * {
 *   key: string        — field key in the data row
 *   label: string      — header label
 *   sortable?: boolean — enable sorting on this column
 *   render?: (value, row) => ReactNode — custom cell renderer
 *   className?: string — extra classes for the cell
 *   headerClassName?: string — extra classes for the header
 * }
 *
 * PROPS:
 * @param {Array}    columns       - Column definitions
 * @param {Array}    data          - Row data (current page)
 * @param {boolean}  loading       - Show skeleton rows
 * @param {number}   total         - Total item count (for pagination)
 * @param {number}   page          - Current page (1-indexed)
 * @param {number}   pageSize      - Items per page
 * @param {number}   totalPages    - Total page count
 * @param {function} onPageChange  - Called with new page number
 * @param {string}   sortBy        - Current sort field
 * @param {string}   sortOrder     - "asc" | "desc"
 * @param {function} onSort        - Called with field name
 * @param {function} onRowClick    - Called with row data
 * @param {string}   emptyIcon     - Lucide icon component for empty state
 * @param {string}   emptyTitle    - Empty state title
 * @param {string}   emptyMessage  - Empty state message
 * @param {number}   skeletonRows  - Number of skeleton rows (default 6)
 */
export function DataTable({
    columns = [],
    data = [],
    loading = false,
    total = 0,
    page = 1,
    pageSize = 20,
    totalPages = 1,
    onPageChange,
    sortBy,
    sortOrder = 'asc',
    onSort,
    onRowClick,
    emptyIcon: EmptyIcon,
    emptyTitle = 'No data found',
    emptyMessage = 'Try adjusting your search or filters',
    skeletonRows = 6,
    className,
}) {
    return (
        <div
            className={cn(
                'rounded-2xl bg-surface border border-border overflow-hidden',
                className,
            )}
        >
            <div className="overflow-x-auto">
                <table className="w-full">
                    {/* ── Header ── */}
                    <thead>
                        <tr className="border-b border-border">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        'text-left px-5 py-3',
                                        col.headerClassName,
                                    )}
                                >
                                    {col.sortable && onSort ? (
                                        <button
                                            onClick={() => onSort(col.key)}
                                            className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
                                        >
                                            {col.label}
                                            <SortIndicator
                                                field={col.key}
                                                currentSort={sortBy}
                                                currentOrder={sortOrder}
                                            />
                                        </button>
                                    ) : (
                                        <span className="text-xs font-medium text-muted uppercase tracking-wider">
                                            {col.label}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* ── Body ── */}
                    <tbody>
                        {loading ? (
                            <SkeletonRows
                                rows={skeletonRows}
                                cols={columns.length}
                            />
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-5 py-16 text-center"
                                >
                                    <div className="flex flex-col items-center">
                                        {EmptyIcon && (
                                            <EmptyIcon className="w-10 h-10 text-muted-foreground mb-3" />
                                        )}
                                        <p className="text-white font-medium mb-1">
                                            {emptyTitle}
                                        </p>
                                        <p className="text-sm text-muted">
                                            {emptyMessage}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, idx) => (
                                <tr
                                    key={row.id || idx}
                                    onClick={() => onRowClick?.(row)}
                                    className={cn(
                                        'border-b border-border/50 last:border-0 transition-colors group',
                                        onRowClick &&
                                            'cursor-pointer hover:bg-surface-hover',
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                'px-5 py-3.5 text-sm text-white',
                                                col.className,
                                            )}
                                        >
                                            {col.render
                                                ? col.render(
                                                      row[col.key],
                                                      row,
                                                      idx,
                                                  )
                                                : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && onPageChange && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                    <p className="text-xs text-muted">
                        Showing{' '}
                        <span className="text-white font-medium">
                            {(page - 1) * pageSize + 1}
                        </span>
                        –
                        <span className="text-white font-medium">
                            {Math.min(page * pageSize, total)}
                        </span>{' '}
                        of{' '}
                        <span className="text-white font-medium">{total}</span>
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={page <= 1}
                            onClick={() => onPageChange(1)}
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={page <= 1}
                            onClick={() => onPageChange(page - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        {/* Page numbers */}
                        {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (page <= 3) pageNum = i + 1;
                                else if (page >= totalPages - 2)
                                    pageNum = totalPages - 4 + i;
                                else pageNum = page - 2 + i;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={
                                            page === pageNum
                                                ? 'secondary'
                                                : 'ghost'
                                        }
                                        size="icon-sm"
                                        onClick={() => onPageChange(pageNum)}
                                        className={
                                            page === pageNum
                                                ? 'border border-primary/30 text-primary'
                                                : ''
                                        }
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            },
                        )}

                        <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={page >= totalPages}
                            onClick={() => onPageChange(page + 1)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={page >= totalPages}
                            onClick={() => onPageChange(totalPages)}
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
