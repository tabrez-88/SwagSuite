import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const artworkKanbanKeys = {
  all: ["artwork-kanban"] as const,
  columns: ["/api/artwork/columns"] as const,
  cards: ["/api/artwork/cards"] as const,
};

export async function fetchArtworkColumns(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/artwork/columns");
  return res.json();
}

export async function fetchArtworkCards(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/artwork/cards");
  return res.json();
}

export async function moveArtworkCard(cardId: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("PATCH", `/api/artwork/cards/${cardId}/move`, data);
  return res.json();
}

export async function createArtworkColumn(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/artwork/columns", data);
  return res.json();
}

export async function initializeArtworkColumns(): Promise<any> {
  const res = await apiRequest("POST", "/api/artwork/columns/initialize", {});
  return res.json();
}

export async function updateArtworkCard(cardId: string, data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("PATCH", `/api/artwork/cards/${cardId}`, data);
  return res.json();
}

export async function createArtworkCard(data: Record<string, unknown>): Promise<any> {
  const res = await apiRequest("POST", "/api/artwork/cards", data);
  return res.json();
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: artworkKanbanKeys.columns });
    queryClient.invalidateQueries({ queryKey: artworkKanbanKeys.cards });
  };
}

export function useArtworkColumns() {
  return useQuery<any[]>({ queryKey: artworkKanbanKeys.columns, queryFn: fetchArtworkColumns });
}

export function useArtworkCards() {
  return useQuery<any[]>({ queryKey: artworkKanbanKeys.cards, queryFn: fetchArtworkCards });
}

export function useMoveArtworkCard() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: Record<string, unknown> }) =>
      moveArtworkCard(cardId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateArtworkCard() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: Record<string, unknown> }) =>
      updateArtworkCard(cardId, data),
    onSuccess: invalidate,
  });
}

export function useCreateArtworkCard() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: createArtworkCard, onSuccess: invalidate });
}

export function useCreateArtworkColumn() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: createArtworkColumn, onSuccess: invalidate });
}

export function useInitializeArtworkColumns() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: initializeArtworkColumns, onSuccess: invalidate });
}
