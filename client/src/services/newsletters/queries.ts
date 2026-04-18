import { useQuery } from "@tanstack/react-query";
import { newsletterKeys } from "./keys";
import * as requests from "./requests";

export function useNewsletters() {
  return useQuery<any[]>({ queryKey: newsletterKeys.all, queryFn: requests.fetchNewsletters });
}
