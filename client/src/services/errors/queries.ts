import { useQuery } from "@tanstack/react-query";
import { errorTrackingKeys } from "./keys";
import * as requests from "./requests";

export function useErrors() {
  return useQuery<any[]>({ queryKey: errorTrackingKeys.all, queryFn: requests.fetchErrors });
}
