import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesAPI } from '@/services/api/analytics';

export function useProperties(params = {}) {
    return useQuery({
        queryKey: ['properties', params],
        queryFn: async () => {
            const res = await propertiesAPI.getAll(params);
            // analytics endpoint returns { listings, total, page, totalPages }
            // normalise to the shape the page expects: { properties, total, totalPages }
            const d = res.data;
            return {
                properties: d.listings ?? [],
                total: d.total ?? 0,
                page: d.page ?? 1,
                totalPages: d.totalPages ?? 1,
            };
        },
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });
}

export function useProperty(id) {
    return useQuery({
        queryKey: ['property', id],
        queryFn: async () => {
            const res = await propertiesAPI.getById(id);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useUpdatePropertyStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }) => {
            const res = await propertiesAPI.updateStatus(id, status);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            queryClient.invalidateQueries({ queryKey: ['property'] });
            window.dispatchEvent(
                new CustomEvent('kovera:toast', {
                    detail: {
                        type: 'success',
                        title: 'Success',
                        message: `Property marked as ${variables.status}`,
                    },
                }),
            );
        },
        onError: () => {
            window.dispatchEvent(
                new CustomEvent('kovera:toast', {
                    detail: {
                        type: 'error',
                        title: 'Error',
                        message: 'Failed to update property status',
                    },
                }),
            );
        },
    });
}

