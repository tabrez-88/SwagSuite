import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as requests from "./requests";

export function useSeedDummyData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requests.seedDummyData,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
