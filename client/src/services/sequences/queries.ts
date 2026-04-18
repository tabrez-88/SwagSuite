import { useQuery } from "@tanstack/react-query";
import { sequenceKeys } from "./keys";
import * as requests from "./requests";

export function useSequences() {
  return useQuery<any[]>({ queryKey: sequenceKeys.all, queryFn: requests.fetchSequences });
}

export function useSequenceEnrollments() {
  return useQuery<any[]>({ queryKey: sequenceKeys.enrollments, queryFn: requests.fetchEnrollments });
}
