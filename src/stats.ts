import type { Snapshot } from "./api/types";

export interface Row { key: string; label: string; correct: number; total: number }

export function computeStats(s: Snapshot) {
  const finished = new Map(s.matches.filter((m) => m.result).map((m) => [m.id, m]));
  const byPredictor = new Map<string, Row>();
  const byDay = new Map<string, Row>();
  const byMatch = new Map<string, Row>();

  const bump = (map: Map<string, Row>, key: string, label: string, ok: boolean) => {
    const row = map.get(key) ?? { key, label, correct: 0, total: 0 };
    row.total += 1;
    if (ok) row.correct += 1;
    map.set(key, row);
  };

  for (const p of s.predictions) {
    const m = finished.get(p.matchId);
    if (!m) continue; // no real result yet
    const ok = p.pick === m.result;
    bump(byPredictor, p.predictorId, s.predictors[p.predictorId]?.name ?? "Unknown", ok);
    bump(byDay, m.date, m.date, ok);
    bump(byMatch, m.id, `${m.home} – ${m.away}`, ok);
  }

  const rate = (r: Row) => r.correct / r.total;
  return {
    predictors: [...byPredictor.values()].sort((a, b) => rate(b) - rate(a)),
    days: [...byDay.values()].sort((a, b) => b.label.localeCompare(a.label)),
    matches: [...byMatch.values()].sort((a, b) => rate(b) - rate(a)),
  };
}