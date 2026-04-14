import { useState } from "react";
import { useParams } from "@/lib/wouter-compat";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePublicPresentation as usePublicPresentationQuery,
  usePostPresentationComment,
  approvalKeys,
} from "@/services/approvals";
import type { PresentationData } from "./types";

export function usePublicPresentation() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data, isLoading, error } = usePublicPresentationQuery<PresentationData>(token);
  const postCommentMutation = usePostPresentationComment(token ?? "");

  const invalidatePresentation = () => {
    if (token) queryClient.invalidateQueries({ queryKey: approvalKeys.publicPresentation(token) });
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
