import { useMutation, useQueryClient } from "@tanstack/react-query";
import { artworkKanbanKeys } from "./keys";
import * as requests from "./requests";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: artworkKanbanKeys.columns });
    queryClient.invalidateQueries({ queryKey: artworkKanbanKeys.cards });
  };
}

export function useMoveArtworkCard() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: Record<string, unknown> }) =>
      requests.moveArtworkCard(cardId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateArtworkCard() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: Record<string, unknown> }) =>
      requests.updateArtworkCard(cardId, data),
    onSuccess: invalidate,
  });
}

export function useCreateArtworkCard() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.createArtworkCard, onSuccess: invalidate });
}

export function useCreateArtworkColumn() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.createArtworkColumn, onSuccess: invalidate });
}

export function useInitializeArtworkColumns() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: requests.initializeArtworkColumns, onSuccess: invalidate });
}
