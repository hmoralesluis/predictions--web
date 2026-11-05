import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "./client";
import type {
  DayStats, Match, MatchStats, NewMatch, NewPrediction, PlayedDates, PredictorStats, SetResultBody, MatchPrediction,
} from "./types";

export const useMatches = () =>
  useQuery({ queryKey: ["matches"], queryFn: () => request<Match[]>("/matches") });

export const useMatchStats = (id: string) =>
  useQuery({
    queryKey: ["stats", "matches", id],
    queryFn: () => request<MatchStats>(`/stats/matches/${id}`),
    enabled: !!id, // don't fetch until a match is selected
  });

export const useDayStats = (date: string) =>
  useQuery({
    queryKey: ["stats", "days", date],
    queryFn: () => request<DayStats>(`/stats/days/${date}`),
    enabled: !!date,
  });

export const usePredictorStats = () =>
  useQuery({
    queryKey: ["stats", "predictors"],
    queryFn: () => request<PredictorStats>("/stats/predictors"),
  });

// Anything that changes matches or results must refresh both families of queries.
function useInvalidateAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["matches"] }),
      qc.invalidateQueries({ queryKey: ["stats"] }), // prefix match: all stats queries
    ]);
}

export function useCreateMatch() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (m: NewMatch) =>
      request<Match>("/matches", { method: "POST", body: JSON.stringify(m) }),
    onSuccess: invalidate,
  });
}

export function useAddPrediction(matchId: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (p: NewPrediction) =>
      request<unknown>(`/matches/${matchId}/predictions`, { method: "POST", body: JSON.stringify(p) }),
    onSuccess: invalidate,
  });
}

export function useSetResult(matchId: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (b: SetResultBody) =>
      request<unknown>(`/matches/${matchId}/result`, { method: "PUT", body: JSON.stringify(b) }),
    onSuccess: invalidate,
  });
}


export function useMatchDates() {
  return useQuery({
    queryKey: ["matches", "dates"],
    queryFn: () => request<string[]>("/matches/dates"),    
  });
}

// api/hooks.ts (add MatchPrediction to the type import)
export const useMatchPredictions = (date: string) =>
  useQuery({
    queryKey: ["matches", "predictions", date],
    queryFn: () => request<MatchPrediction[]>(`/matches/stats?date=${date}`),
    enabled: !!date,
  });