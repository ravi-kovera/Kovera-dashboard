import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { propertiesAPI } from "@/services/api";

export function useProperties(params = {}) {
  return useQuery({
    queryKey: ["properties", params],
    queryFn: async () => {
      const res = await propertiesAPI.getAll(params);
      return res.data;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useProperty(id) {
  return useQuery({
    queryKey: ["property", id],
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
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property"] });
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "success", title: "Success", message: `Property marked as ${variables.status}` },
      }));
    },
    onError: () => {
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "error", title: "Error", message: "Failed to update property status" },
      }));
    },
  });
}
