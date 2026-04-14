import { useQuery } from "@tanstack/react-query";

export const knowledgeBaseKeys = {
  all: ["/api/knowledge-base"] as const,
};

export function useKnowledgeBase<T = any>() {
  return useQuery<T>({ queryKey: knowledgeBaseKeys.all });
}
