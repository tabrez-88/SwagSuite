import { useQuery } from "@tanstack/react-query";
import { knowledgeBaseKeys } from "./keys";

export function useKnowledgeBase<T = any>() {
  return useQuery<T>({ queryKey: knowledgeBaseKeys.all });
}
