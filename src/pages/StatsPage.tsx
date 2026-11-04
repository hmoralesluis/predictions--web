import { useState } from "react";
import { useDayStats, useMatches, useMatchStats, usePredictorStats } from "../api/hooks";

export default function StatsPage() {
  const [date, setDate] = useState("");
  const [matchId, setMatchId] = useState("");
  const { data: matches = [] } = useMatches();
  const predictors = usePredictorStats();
  const day = useDayStats(date);
  const match = useMatchStats(matchId);

  return (
    <>
      <section>
        <h2>By predictor</h2>
        <pre>{JSON.stringify(predictors.data, null, 2)}</pre>
      </section>

      <section>
        <h2>By day</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <pre>{JSON.stringify(day.data, null, 2)}</pre>
      </section>

      <section>
        <h2>By match</h2>
        <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
          <option value="">Select a match…</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>{m.home} – {m.away} ({m.date})</option>
          ))}
        </select>
        <pre>{JSON.stringify(match.data, null, 2)}</pre>
      </section>
    </>
  );
}