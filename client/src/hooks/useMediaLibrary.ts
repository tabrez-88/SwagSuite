import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MediaLibraryItem } from "@/lib/media-library";

interface MediaLibraryFilters {
  folder?: string;
  category?: string;
  companyId?: string;
  orderId?: string;
  search?: string;
  mimeType?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useMediaLibrary(filters: MediaLibraryFilters = {}) {
  const { enabled = true, ...rest } = filters;
  const params = new URLSearchParams();
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const queryString = params.toString();

  return useQuery<{ items: MediaLibraryItem[]; total: number }>({
    queryKey: ["/api/media-library", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/media-library?${queryString}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch media library");
      return res.json();
    },
    enabled,
  });
}

export function useUploadToMediaLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      files: File[];
      folder?: string;
      category?: string;
      orderId?: string;
      companyId?: string;
    }) => {
      const formData = new FormData();
      data.files.forEach((f) => formData.append("files", f));
      if (data.folder) formData.append("folder", data.folder);
      if (data.category) formData.append("category", data.category);
      if (data.orderId) formData.append("orderId", data.orderId);
      if (data.companyId) formData.append("companyId", data.companyId);

      const res = await fetch("/api/media-library/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try { msg = JSON.parse(text).error || text; } catch {}
        throw new Error(msg);
      }
      return res.json() as Promise<MediaLibraryItem[]>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
    },
  });
}

export function useDeleteMediaLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/media-library/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
    },
  });
}
