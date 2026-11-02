import { useMemo } from "react";
import { useSnapshot } from "../api/hooks";
import { computeStats, type Row } from "../stats";

function Board({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section>
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="muted">Nothing to show until a match has a real result.</p>
      ) : (
        <ul className="board">
          {rows.map((r) => {
            const pct = Math.round((100 * r.correct) / r.total);
            return (
              <li key={r.key}>
                <span className="name">{r.label}</span>
                <span className="bar" role="img" aria-label={`${pct}% correct`}>
                  <i style={{ width: `${pct}%` }} />
                </span>
                <span className="num">{r.correct}/{r.total} · {pct}%</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function StatsPage() {
  const { data, isLoading, error } = useSnapshot();
  const stats = useMemo(() => (data ? computeStats(data) : null), [data]);

  if (isLoading) return <p className="muted">Loading stats…</p>;
  if (error || !stats) return <p className="error">Could not load stats. Is the API running?</p>;

  return (
    <>
      <Board title="Accuracy by predictor" rows={stats.predictors} />
      <Board title="Accuracy by day" rows={stats.days} />
      <Board title="Accuracy by match" rows={stats.matches} />
    </>
  );
}