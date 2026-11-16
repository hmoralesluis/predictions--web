import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "./client";
import type {
  DayStats,
  Match,
  MatchBet,
  MatchDayType,
  MatchPrediction,
  MatchStats,
  MatchWithBets,
  NewMatch,
  NewPrediction,
  NewPredictor,
  Outcome,
  PredictorStats,
  SetResultBody,
  Trust,
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

// Refresh everything the predictions table shows: matches/predictions, bets and stats.
function useRefreshTable() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["matches"] }), // also covers ["matches","predictions",date]
      qc.invalidateQueries({ queryKey: ["positionbets"] }),
      qc.invalidateQueries({ queryKey: ["stats"] }),
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

export const useMatchPredictions = (date: string) =>
  useQuery({
    queryKey: ["matches", "predictions", date],
    queryFn: () => request<MatchPrediction[]>(`/matches/stats?date=${encodeURIComponent(date)}`),
    enabled: !!date,
  });

export function usePositionBets(date: string) {
  return useQuery({
    queryKey: ["positionbets", date],
    queryFn: () => request<MatchWithBets[]>(`/positionbets?date=${encodeURIComponent(date)}`),
    enabled: !!date,
  });
}

export function useDeleteAutoBets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) =>
      request<unknown>(`/positionbets/auto?date=${encodeURIComponent(date)}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, date) =>
      qc.invalidateQueries({ queryKey: ["positionbets", date] }),
  });
}

// ---- Editing from the predictions table ----

// Unlike useSetResult(matchId), the id is passed per call, so one hook serves every row.
// result = null sets the match back to Pending.
export function useSetMatchResult() {
  const refresh = useRefreshTable();
  return useMutation({
    mutationFn: ({ id, result }: { id: string; result: Outcome | null }) =>
      request<unknown>(`/matches/${id}/result`, {
        method: "PUT",
        body: JSON.stringify({ result }),
      }),
    onSuccess: refresh,
  });
}

// Upsert: creates or updates the prediction. The body uses "pick" to match AddPredictionRequest.
export function useSetPrediction() {
  const refresh = useRefreshTable();
  return useMutation({
    mutationFn: ({
      matchId,
      predictorId,
      picked,
    }: {
      matchId: string;
      predictorId: string;
      picked: Outcome;
    }) =>
      request<unknown>(`/predictions/${matchId}/${predictorId}`, {
        method: "PUT",
        body: JSON.stringify({ pick: picked }),
      }),
    onSuccess: refresh,
  });
}

// Regenerates the Ai bets for a date (overrides the existing ones).
export function useGenerateBets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) =>
      request<MatchBet[]>(`/matchbets/generate?date=${encodeURIComponent(date)}`),
    onSuccess: (_data, date) => qc.invalidateQueries({ queryKey: ["positionbets", date] }),
  });
}

// Sets the type of a single match (PUT /matches/{id}/type).
export function useSetMatchType() {
  const refresh = useRefreshTable();
  return useMutation({
    mutationFn: ({ id, matchType }: { id: string; matchType: MatchDayType }) =>
      request<Match>(`/matches/${id}/type`, {
        method: "PUT",
        body: JSON.stringify({ matchType }),
      }),
    onSuccess: refresh,
  });
}

// Sets the type of every match on a date (existing POST /matches/type endpoint).
// Note the body field is "dayType" here, matching UpdateMatchTypeInData.
export function useSetDayType() {
  const refresh = useRefreshTable();
  return useMutation({
    mutationFn: ({ date, dayType }: { date: string; dayType: MatchDayType }) =>
      request<boolean>("/matches/type", {
        method: "POST",
        body: JSON.stringify({ date, dayType }),
      }),
    onSuccess: refresh,
  });
}

// Sets the trust of a single match (PUT /matches/{id}/trust).
export function useSetMatchTrust() {
  const refresh = useRefreshTable();
  return useMutation({
    mutationFn: ({ id, trust }: { id: string; trust: Trust }) =>
      request<Match>(`/matches/${id}/trust`, {
        method: "PUT",
        body: JSON.stringify({ trust }),
      }),
    onSuccess: refresh,
  });
}

// Sets the trust of every match on a date (POST /matches/trust).
export function useSetDayTrust() {
  const refresh = useRefreshTable();
  return useMutation({
    mutationFn: ({ date, trust }: { date: string; trust: Trust }) =>
      request<boolean>("/matches/trust", {
        method: "POST",
        body: JSON.stringify({ date, trust }),
      }),
    onSuccess: refresh,
  });
}


export function useCreatePredictor() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (p: NewPredictor) =>
      request<unknown>("/predictors", { method: "POST", body: JSON.stringify(p) }),
    onSuccess: invalidate,
  });
}