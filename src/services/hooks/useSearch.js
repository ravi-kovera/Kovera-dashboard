import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '@/services/api';
import { useDebounce } from './useDebounce';

/**
 * Search with debounce, pagination, and type filtering. Returns the raw
 * React Query state — callers render their own empty/error UI when
 * `results` is empty or `isError` is true. No demo fallback.
 */
export function useSearch({ query, type = 'all', page = 1, limit = 20 }) {
    const debouncedQuery = useDebounce(query, 300);

    const searchQuery = useQuery({
        queryKey: ['search', debouncedQuery, type, page, limit],
        queryFn: async () => {
            if (!debouncedQuery || debouncedQuery.trim().length < 1) {
                return { results: [], total: 0, page: 1 };
            }
            const res = await searchAPI.query({
                q: debouncedQuery,
                type: type !== 'all' ? type : undefined,
                page,
                limit,
            });
            return res.data;
        },
        enabled: debouncedQuery.trim().length >= 1,
        staleTime: 30 * 1000, // Cache for 30s per spec
        retry: 0,
    });

    return {
        results: searchQuery.data?.results || [],
        total: searchQuery.data?.total || 0,
        currentPage: searchQuery.data?.page || 1,
        isLoading: searchQuery.isLoading && debouncedQuery.length >= 1,
        isFetching: searchQuery.isFetching,
        isError: searchQuery.isError,
        refetch: searchQuery.refetch,
        debouncedQuery,
    };
}
