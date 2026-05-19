import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Badge,
    Button,
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui';
import {
    Search as SearchIcon,
    X,
    ArrowRight,
    Users,
    UserCog,
    Building2,
    Layers,
    FileSearch,
} from 'lucide-react';
import { EmptyState } from '@/components/common';
import { useSearch } from '@/services/hooks/useSearch';

/* ── Type config ── */
const SEARCH_TYPES = [
    { value: 'all', label: 'All', icon: Layers },
    { value: 'user', label: 'Users', icon: Users },
    { value: 'agent', label: 'Agents', icon: UserCog },
    { value: 'property', label: 'Properties', icon: Building2 },
];

const TYPE_CONFIG = {
    user: {
        badge: 'info',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        icon: Users,
    },
    agent: {
        badge: 'default',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        icon: UserCog,
    },
    property: {
        badge: 'success',
        color: 'text-green-400',
        bg: 'bg-primary/10',
        icon: Building2,
    },
};

/* ── Highlight matched text ── */
function HighlightText({ text, query }) {
    if (!query || query.length < 1) return <>{text}</>;

    const regex = new RegExp(
        `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
        'gi',
    );
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark
                        key={i}
                        className="bg-primary/25 text-primary-light rounded-sm px-0.5"
                    >
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                ),
            )}
        </>
    );
}

/* ── Skeleton loader ── */
function ResultSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border animate-pulse">
            <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded skeleton" />
                <div className="h-3 w-32 rounded skeleton" />
            </div>
            <div className="h-5 w-16 rounded-full skeleton" />
        </div>
    );
}

/* ── Detail Modal ── */
function DetailModal({ item, onClose }) {
    if (!item) return null;

    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.user;
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-2xl bg-navy-900 border border-border shadow-elevated animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${config.bg}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                {item.title}
                            </h2>
                            <p className="text-sm text-muted">
                                {item.subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-muted hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge variant={config.badge}>
                            {item.type.charAt(0).toUpperCase() +
                                item.type.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted">{item.meta}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-navy-950 border border-border">
                            <p className="text-xs text-muted mb-1">Type</p>
                            <p className="text-sm font-medium text-white capitalize">
                                {item.type}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-navy-950 border border-border">
                            <p className="text-xs text-muted mb-1">ID</p>
                            <p className="text-sm font-medium text-white font-mono">
                                {item.id}
                            </p>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-navy-950 border border-border">
                        <p className="text-xs text-muted mb-1">Details</p>
                        <p className="text-sm text-white">{item.meta}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Close
                    </Button>
                    <Button size="sm">
                        View Full Profile <ArrowRight className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ── Main Search Page ── */
export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [type, setType] = useState(searchParams.get('type') || 'all');
    const [selectedItem, setSelectedItem] = useState(null);

    const { results, isLoading, isFetching, isError, refetch, debouncedQuery } =
        useSearch({
            query,
            type,
        });

    // Sync query + type to URL params
    useEffect(() => {
        const params = {};
        if (query) params.q = query;
        if (type && type !== 'all') params.type = type;
        setSearchParams(params, { replace: true });
    }, [query, type, setSearchParams]);

    const clearQuery = useCallback(() => {
        setQuery('');
    }, []);

    const hasQuery = debouncedQuery.trim().length >= 1;

    // Count results per type for tab badges
    const typeCounts = {};
    if (results.length > 0) {
        results.forEach((r) => {
            typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
        });
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Page Header ── */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Search
                </h1>
                <p className="text-muted mt-1 text-sm">
                    Search across users, agents, and properties
                </p>
            </div>

            {/* ── Search Bar ── */}
            <Card className="p-0 overflow-hidden">
                <div className="flex items-center">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search users, agents, properties..."
                            className="w-full h-14 pl-13 pr-12 bg-transparent text-white placeholder:text-muted-foreground text-base focus:outline-none"
                            autoFocus
                        />
                        {query && (
                            <button
                                onClick={clearQuery}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-white transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {/* Fetching indicator */}
                    {isFetching && (
                        <div className="pr-5">
                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </Card>

            {/* ── Tabs ── */}
            <Tabs value={type} onValueChange={setType}>
                <TabsList>
                    {SEARCH_TYPES.map((t) => (
                        <TabsTrigger key={t.value} value={t.value}>
                            <t.icon className="w-4 h-4" />
                            {t.label}
                            {hasQuery &&
                                type === 'all' &&
                                typeCounts[t.value] !== undefined && (
                                    <span className="ml-1 text-[10px] bg-surface-active px-1.5 py-0.5 rounded-full text-muted">
                                        {typeCounts[t.value]}
                                    </span>
                                )}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* ── Results Area ── */}
            {!hasQuery ? (
                /* ── Idle prompt ── */
                <EmptyState
                    icon={SearchIcon}
                    title="Start typing to search"
                    message="Look up users, agents or properties from a single query."
                />
            ) : isError ? (
                <EmptyState
                    variant="error"
                    onRetry={refetch}
                    title="Search failed"
                />
            ) : isLoading ? (
                /* ── Loading Skeletons ── */
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <ResultSkeleton key={i} />
                    ))}
                </div>
            ) : results.length === 0 ? (
                /* ── No Results ── */
                <Card className="py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
                            <FileSearch className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                            No results found
                        </h3>
                        <p className="text-sm text-muted max-w-sm">
                            We couldn't find anything matching{' '}
                            <span className="text-primary font-medium">
                                "{debouncedQuery}"
                            </span>
                            . Try a different search term or filter.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={clearQuery}
                        >
                            Clear search
                        </Button>
                    </div>
                </Card>
            ) : (
                /* ── Results List ── */
                <div className="space-y-2">
                    {/* Results count */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted">
                            Showing{' '}
                            <span className="text-white font-medium">
                                {results.length}
                            </span>{' '}
                            result{results.length !== 1 ? 's' : ''} for{' '}
                            <span className="text-primary font-medium">
                                "{debouncedQuery}"
                            </span>
                        </p>
                    </div>

                    {/* Result cards */}
                    {results.map((item, idx) => {
                        const config =
                            TYPE_CONFIG[item.type] || TYPE_CONFIG.user;
                        const Icon = config.icon;

                        return (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-border-light hover:bg-surface-hover transition-all duration-200 cursor-pointer group animate-slide-up"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {/* Icon */}
                                <div
                                    className={`p-2.5 rounded-xl ${config.bg} shrink-0 group-hover:scale-105 transition-transform`}
                                >
                                    <Icon
                                        className={`w-5 h-5 ${config.color}`}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-white group-hover:text-primary-light transition-colors truncate">
                                        <HighlightText
                                            text={item.title}
                                            query={debouncedQuery}
                                        />
                                    </h3>
                                    <p className="text-xs text-muted truncate mt-0.5">
                                        <HighlightText
                                            text={item.subtitle}
                                            query={debouncedQuery}
                                        />
                                    </p>
                                </div>

                                {/* Meta */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-xs text-muted-foreground hidden sm:inline">
                                        {item.meta}
                                    </span>
                                    <Badge variant={config.badge}>
                                        {item.type.charAt(0).toUpperCase() +
                                            item.type.slice(1)}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Detail Modal ── */}
            <DetailModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </div>
    );
}
