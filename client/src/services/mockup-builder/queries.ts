import { useQuery } from "@tanstack/react-query";
import { mockupBuilderKeys } from "./keys";

export function useMockupTemplates<T = any>() {
  return useQuery<T>({ queryKey: mockupBuilderKeys.templates });
}
