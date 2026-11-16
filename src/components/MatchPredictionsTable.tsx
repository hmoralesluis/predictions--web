// components/MatchPredictionsTable.tsx
import { useMemo } from "react";
import {
  useDeleteAutoBets,
  useGenerateBets,
  useMatchPredictions,
  usePositionBets,
  useSetDayTrust,
  useSetDayType,
  useSetMatchResult,
  useSetMatchTrust,
  useSetMatchType,
  useSetPrediction,
} from "../api/hooks";
import type {
  MatchBet,
  MatchDayType,
  MatchPrediction,
  Outcome,
  PositionBet,
  Trust,
} from "../api/types";
import "./MatchPredictionsTable.css";

type MatchInfo = MatchPrediction["match"];
type TeamState = "win" | "lose" | "draw" | "";
type Score = { correct: number; settled: number };

const OUTCOMES: Outcome[] = ["HomeWin", "Draw", "AwayWin"];
const LABEL: Record<Outcome, string> = {
  HomeWin: "Home",
  Draw: "Draw",
  AwayWin: "Away",
  Pending: "—",
};

const MATCH_TYPES: MatchDayType[] = ["Liga", "CopaDelRey", "Champions"];
const TYPE_LABEL: Record<MatchDayType, string> = {
  Liga: "Liga",
  CopaDelRey: "Copa del Rey",
  Champions: "Champions",
};

const TRUSTS: Trust[] = ["MuyBaja", "Baja", "MediaBaja", "Media", "MediaAlta", "Alta", "MuyAlta"];
const TRUST_LABEL: Record<Trust, string> = {
  MuyBaja: "Muy baja",
  Baja: "Baja",
  MediaBaja: "Media baja",
  Media: "Media",
  MediaAlta: "Media alta",
  Alta: "Alta",
  MuyAlta: "Muy alta",
};

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

  const setResult = useSetMatchResult();
  const setPrediction = useSetPrediction();
  const setMatchType = useSetMatchType();
  const setDayType = useSetDayType();
  const setMatchTrust = useSetMatchTrust();
  const setDayTrust = useSetDayTrust();
  const generate = useGenerateBets();
  const deleteAuto = useDeleteAutoBets();

  const saving =
    setResult.isPending ||
    setPrediction.isPending ||
    setMatchType.isPending ||
    setDayType.isPending ||
    setMatchTrust.isPending ||
    setDayTrust.isPending ||
    generate.isPending ||
    deleteAuto.isPending;
  const saveFailed =
    setResult.isError ||
    setPrediction.isError ||
    setMatchType.isError ||
    setDayType.isError ||
    setMatchTrust.isError ||
    setDayTrust.isError ||
    generate.isError ||
    deleteAuto.isError;

  // Predictors: one column per predictor
  const { rows, predictors, predictorIds, score, tally } = useMemo(() => {
    const byMatch = new Map<string, { match: MatchInfo; picks: Map<string, Outcome> }>();
    const predictorIds = new Map<string, string>(); // name -> id
    const names = new Set<string>();

    for (const r of data) {
      let entry = byMatch.get(r.match.id);
      if (!entry) {
        entry = { match: r.match, picks: new Map() };
        byMatch.set(r.match.id, entry);
      }
      if (r.prediction && r.predictorName) {
        predictorIds.set(r.predictorName, r.prediction.predictorId);
        names.add(r.predictorName);
        // "Pending" means the predictor hasn't picked yet: not a pick
        if (r.prediction.picked !== "Pending") {
          entry.picks.set(r.predictorName, r.prediction.picked);
        }
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
    return { rows, predictors, predictorIds, score, tally };
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
      <div className="toolbar">
        <button disabled={saving} onClick={() => generate.mutate(date)}>
          {generate.isPending ? "Generating…" : "Generate Ai bets"}
        </button>
        <button disabled={saving} onClick={() => deleteAuto.mutate(date)}>
          {deleteAuto.isPending ? "Deleting…" : "Delete Ai bets"}
        </button>

        {/* Always shows the placeholder, so every pick is a fresh "set all" action */}
        <select
          value=""
          disabled={saving}
          title="Set the type of every match on this date"
          onChange={(e) =>
            setDayType.mutate({ date, dayType: e.target.value as MatchDayType })
          }
        >
          <option value="" disabled>Set all type as…</option>
          {MATCH_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABEL[t]}</option>
          ))}
        </select>

        <select
          value=""
          disabled={saving}
          title="Set the trust of every match on this date"
          onChange={(e) =>
            setDayTrust.mutate({ date, trust: e.target.value as Trust })
          }
        >
          <option value="" disabled>Set all trust as…</option>
          {TRUSTS.map((t) => (
            <option key={t} value={t}>{TRUST_LABEL[t]}</option>
          ))}
        </select>

        {saveFailed && <span className="error">Could not save the change. Try again.</span>}
      </div>

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
            <th>Type</th>
            <th>Trust</th>
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

                {/* Editable result ("Pending" clears it) */}
                <td>
                  <select
                    className={`badge edit ${match.result ? "result" : "pending"}`}
                    value={match.result ?? ""}
                    disabled={saving}
                    onChange={(e) =>
                      setResult.mutate({
                        id: match.id,
                        result: e.target.value === "" ? null : (e.target.value as Outcome),
                      })
                    }
                  >
                    <option value="">Pending</option>
                    {OUTCOMES.map((o) => (
                      <option key={o} value={o}>{LABEL[o]}</option>
                    ))}
                  </select>
                </td>

                {/* Editable match type */}
                <td>
                  <select
                    className="badge edit type"
                    value={match.matchType}
                    disabled={saving}
                    onChange={(e) =>
                      setMatchType.mutate({
                        id: match.id,
                        matchType: e.target.value as MatchDayType,
                      })
                    }
                  >
                    {MATCH_TYPES.map((mt) => (
                      <option key={mt} value={mt}>{TYPE_LABEL[mt]}</option>
                    ))}
                  </select>
                </td>

                {/* Editable match trust */}
                <td>
                  <select
                    className="badge edit trust"
                    value={match.matchTrust}
                    disabled={saving}
                    onChange={(e) =>
                      setMatchTrust.mutate({
                        id: match.id,
                        trust: e.target.value as Trust,
                      })
                    }
                  >
                    {TRUSTS.map((tr) => (
                      <option key={tr} value={tr}>{TRUST_LABEL[tr]}</option>
                    ))}
                  </select>
                </td>

                {/* Editable predictions */}
                {predictors.map((p) => {
                  const pick = picks.get(p);
                  const state = !pick
                    ? "none"
                    : !match.result ? "open"
                    : pick === match.result ? "hit" : "miss";
                  return (
                    <td key={p}>
                      <select
                        className={`badge edit ${state}`}
                        value={pick ?? ""}
                        disabled={saving}
                        onChange={(e) =>
                          setPrediction.mutate({
                            matchId: match.id,
                            predictorId: predictorIds.get(p)!,
                            picked: e.target.value as Outcome,
                          })
                        }
                      >
                        {!pick && <option value="" disabled>—</option>}
                        {OUTCOMES.map((o) => (
                          <option key={o} value={o}>
                            {LABEL[o]}
                            {pick === o && state === "hit" ? " ✓" : ""}
                            {pick === o && state === "miss" ? " ✗" : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}

                {/* Position bets stay read-only (they are generated) */}
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
            <td colSpan={4}>Score</td>
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