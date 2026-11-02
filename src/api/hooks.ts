import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "./client";
import type { Match, NewMatch, Snapshot } from "./types";

interface SnapshotFilter { matchId?: string; date?: string }

export function useSnapshot(filter: SnapshotFilter = {}) {
  return useQuery({
    queryKey: ["snapshot", filter],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (filter.matchId) qs.set("matchId", filter.matchId);
      if (filter.date) qs.set("date", filter.date);
      const query = qs.toString();
      return request<Snapshot>(`/snapshot${query ? `?${query}` : ""}`);
    },
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: NewMatch) =>
      request<Match>("/matches", { method: "POST", body: JSON.stringify(m) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["snapshot"] }),
  });
}