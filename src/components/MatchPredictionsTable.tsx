// components/MatchPredictionsTable.tsx
import { useMemo } from "react";
import { useMatchPredictions, usePositionBets } from "../api/hooks";
import type { MatchBet, MatchPrediction, Outcome, PositionBet } from "../api/types";
import "./MatchPredictionsTable.css";

type MatchInfo = MatchPrediction["match"];
type TeamState = "win" | "lose" | "draw" | "";
type Score = { correct: number; settled: number };

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
  const { data: betData = [] } = usePositionBets(date);

  // Predictors: one column per predictor
  const { rows, predictors, score, tally } = useMemo(() => {
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
    const score: Record<string, Score> = Object.fromEntries(
      predictors.map((n) => [n, { correct: 0, settled: 0 }]),
    );
    const tally = { home: 0, draw: 0, away: 0 };
    const rows = [...byMatch.values()];

    for (const { match, picks } of rows) {
      if (!match.result) continue;

      if (match.result === "HomeWin") tally.home++;
      else if (match.result === "Draw") tally.draw++;
      else tally.away++;

      for (const [name, pick] of picks) {
        score[name].settled++;
        if (pick === match.result) score[name].correct++;
      }
    }
    return { rows, predictors, score, tally };
  }, [data]);

  // Position bets: one column per PositionBet ("Ai Bet", "Ai Bet 2", ...)
  const { betColumns, betsByMatch, betScore } = useMemo(() => {
    const cols = new Map<string, PositionBet>();
    const betsByMatch = new Map<string, Map<string, MatchBet>>();
    const betScore: Record<string, Score> = {};

    for (const { match, bets } of betData) {
      const perMatch = new Map<string, MatchBet>();
      for (const { positionBet, bet } of bets) {
        cols.set(positionBet.id, positionBet);
        perMatch.set(positionBet.id, bet);

        betScore[positionBet.id] ??= { correct: 0, settled: 0 };
        if (match.result) {
          betScore[positionBet.id].settled++;
          if (bet.picked === match.result) betScore[positionBet.id].correct++;
        }
      }
      betsByMatch.set(match.id, perMatch);
    }

    // numeric: true keeps "Ai Bet 2" before "Ai Bet 10"
    const betColumns = [...cols.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    return { betColumns, betsByMatch, betScore };
  }, [betData]);

  if (isLoading) return <p className="muted">Loading predictions…</p>;
  if (error) return <p className="error">Could not load predictions.</p>;
  if (rows.length === 0) return <p className="muted">No matches on {date}.</p>;

  const pct = (p: string) =>
    score[p].settled === 0 ? null : Math.round((score[p].correct / score[p].settled) * 100);

  const betPct = (id: string) => {
    const s = betScore[id];
    return !s || s.settled === 0 ? null : Math.round((s.correct / s.settled) * 100);
  };

  return (
    <div className="stats-wrap">
      <table className="stats">
        <thead>
          <tr>
            <th>
              Match
              <span className="tally" title="Results so far">
                <span className="chip">H {tally.home}</span>
                <span className="chip">D {tally.draw}</span>
                <span className="chip">A {tally.away}</span>
              </span>
            </th>
            <th>Result</th>
            {predictors.map((p) => {
              const value = pct(p);
              return (
                <th key={p}>
                  {p}
                  <span
                    className={`pct ${value === null ? "none" : value >= 50 ? "good" : "bad"}`}
                    title="Accuracy on settled matches"
                  >
                    {value === null ? "—" : `${value}%`}
                  </span>
                </th>
              );
            })}
            {betColumns.map((b, i) => {
              const value = betPct(b.id);
              return (
                <th key={b.id} className={i === 0 ? "bet-start" : undefined}>
                  {b.name}
                  <span
                    className={`pct ${value === null ? "none" : value >= 50 ? "good" : "bad"}`}
                    title="Accuracy on settled matches"
                  >
                    {value === null ? "—" : `${value}%`}
                  </span>
                </th>
              );
            })}
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
                {betColumns.map((b, i) => {
                  const bet = betsByMatch.get(match.id)?.get(b.id);
                  const cls = i === 0 ? "bet-start" : undefined;
                  if (!bet) {
                    return <td key={b.id} className={cls}><span className="muted">—</span></td>;
                  }
                  const state = !match.result ? "open" : bet.picked === match.result ? "hit" : "miss";
                  return (
                    <td key={b.id} className={cls}>
                      <span className={`badge ${state}`}>
                        {LABEL[bet.picked]} {state === "hit" && "✓"}{state === "miss" && "✗"}
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
            {betColumns.map((b, i) => (
              <td key={b.id} className={i === 0 ? "bet-start" : undefined}>
                {!betScore[b.id] || betScore[b.id].settled === 0
                  ? <span className="muted">—</span>
                  : <strong>{betScore[b.id].correct}/{betScore[b.id].settled}</strong>}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}