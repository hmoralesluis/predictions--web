// components/MatchPredictionsTable.tsx
import { useMemo } from "react";
import { useMatchPredictions } from "../api/hooks";
import type { MatchPrediction, Outcome } from "../api/types";
import "./MatchPredictionsTable.css";

type MatchInfo = MatchPrediction["match"];
type TeamState = "win" | "lose" | "draw" | "";

const LABEL: Record<Outcome, string> = { HomeWin: "Home", Draw: "Draw", AwayWin: "Away" };

function teamStates(result: Outcome | null): { home: TeamState; away: TeamState } {
  switch (result) {
    case "HomeWin": return { home: "win", away: "lose" };
    case "AwayWin": return { home: "lose", away: "win" };
    case "Draw":    return { home: "draw", away: "draw" };
    default:        return { home: "", away: "" };
  }
}

export function MatchPredictionsTable({ date }: { date: string }) {
  const { data = [], isLoading, error } = useMatchPredictions(date);

  const { rows, predictors, score } = useMemo(() => {
    const byMatch = new Map<string, { match: MatchInfo; picks: Map<string, Outcome> }>();
    const names = new Set<string>();

    for (const r of data) {
      let entry = byMatch.get(r.match.id);
      if (!entry) {
        entry = { match: r.match, picks: new Map() };
        byMatch.set(r.match.id, entry);
      }
      if (r.prediction && r.predictorName) {
        entry.picks.set(r.predictorName, r.prediction.picked);
        names.add(r.predictorName);
      }
    }

    const predictors = [...names].sort();
    const score: Record<string, { correct: number; settled: number }> = Object.fromEntries(
      predictors.map((n) => [n, { correct: 0, settled: 0 }]),
    );
    const rows = [...byMatch.values()];

    for (const { match, picks } of rows) {
      if (!match.result) continue;
      for (const [name, pick] of picks) {
        score[name].settled++;
        if (pick === match.result) score[name].correct++;
      }
    }
    return { rows, predictors, score };
  }, [data]);

  if (isLoading) return <p className="muted">Loading predictions…</p>;
  if (error) return <p className="error">Could not load predictions.</p>;
  if (rows.length === 0) return <p className="muted">No matches on {date}.</p>;

  return (
    <div className="stats-wrap">
      <table className="stats">
        <thead>
          <tr>
            <th>Match</th>
            <th>Result</th>
            {predictors.map((p) => <th key={p}>{p}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ match, picks }) => {
            const t = teamStates(match.result);
            return (
              <tr key={match.id}>
                <td className="teams">
                  <strong className={`team ${t.home}`}>
                    {match.home}{t.home === "win" && " 🏆"}
                  </strong>
                  <span className="muted"> vs </span>
                  <strong className={`team ${t.away}`}>
                    {match.away}{t.away === "win" && " 🏆"}
                  </strong>
                </td>
                <td>
                  {match.result
                    ? <span className="badge result">{LABEL[match.result]}</span>
                    : <span className="badge pending">Pending</span>}
                </td>
                {predictors.map((p) => {
                  const pick = picks.get(p);
                  if (!pick) return <td key={p}><span className="muted">—</span></td>;
                  const state = !match.result ? "open" : pick === match.result ? "hit" : "miss";
                  return (
                    <td key={p}>
                      <span className={`badge ${state}`}>
                        {LABEL[pick]} {state === "hit" && "✓"}{state === "miss" && "✗"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}>Score</td>
            {predictors.map((p) => (
              <td key={p}>
                {score[p].settled === 0
                  ? <span className="muted">—</span>
                  : <strong>{score[p].correct}/{score[p].settled}</strong>}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}