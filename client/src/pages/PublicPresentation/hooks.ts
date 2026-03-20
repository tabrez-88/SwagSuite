import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PresentationData } from "./types";

export function usePublicPresentation() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data, isLoading, error } = useQuery<PresentationData>({
    queryKey: [`/api/presentation/${token}`],
    queryFn: async () => {
      const res = await fetch(`/api/presentation/${token}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load presentation");
      }
      return res.json();
    },
    retry: false,
  });

  const postCommentMutation = useMutation({
    mutationFn: async ({ orderItemId, content, clientName }: { orderItemId: number; content: string; clientName: string }) => {
      const res = await fetch(`/api/presentation/${token}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId, content, clientName }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/presentation/${token}`] });
    },
  });

  const invalidatePresentation = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/presentation/${token}`] });
  };

  return {
    token,
    data,
    isLoading,
    error,
    selectedProduct,
    setSelectedProduct,
    postCommentMutation,
    invalidatePresentation,
  };
}
