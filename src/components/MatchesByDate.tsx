import { useEffect, useMemo, useRef, useState } from "react";
import { useMatchDates, useMatches } from "../api/hooks";
import "./MatchesByDate.css";

// "2026-10-20" -> local Date (avoids the UTC off-by-one of new Date("2026-10-20"))
const fromKey = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const month = new Intl.DateTimeFormat(undefined, { month: "short" });

export function MatchesByDate() {
  const { data: dates = [], isLoading, error } = useMatchDates();
  const { data: matches = [] } = useMatches();
  const [selected, setSelected] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // Oldest -> newest, left to right
  const sortedDates = useMemo(() => [...dates].sort(), [dates]);

  // Select the most recent date once the list arrives
  useEffect(() => {
    if (selected === null && sortedDates.length > 0) {
      setSelected(sortedDates[sortedDates.length - 1]);
    }
  }, [sortedDates, selected]);

  // Keep the selected box centered in the strip
  useEffect(() => {
    if (!selected) return;
    stripRef.current
      ?.querySelector<HTMLElement>(`[data-date="${selected}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected, sortedDates]);

  function scrollStrip(direction: -1 | 1) {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (isLoading) return <p className="muted">Loading dates…</p>;
  if (error) return <p className="error">Could not load match dates.</p>;
  if (sortedDates.length === 0) return <p className="muted">No match dates yet.</p>;

  const dayMatches = selected ? matches.filter((m) => m.date === selected) : [];

  return (
    <div>
      <div className="date-strip">
        <button type="button" className="strip-arrow" aria-label="Scroll left" onClick={() => scrollStrip(-1)}>
          ‹
        </button>

        <div className="strip-scroll" ref={stripRef} role="listbox" aria-label="Match dates">
          {sortedDates.map((d) => {
            const date = fromKey(d);
            const isSelected = d === selected;
            return (
              <button
                key={d}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-date={d}
                className={isSelected ? "date-box active" : "date-box"}
                onClick={() => setSelected(d)}
              >
                <span className="dow">{weekday.format(date)}</span>
                <span className="day">{date.getDate()}</span>
                <span className="mon">{month.format(date)} {date.getFullYear()}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="strip-arrow" aria-label="Scroll right" onClick={() => scrollStrip(1)}>
          ›
        </button>
      </div>

      {selected && (
        dayMatches.length === 0 ? (
          <p className="muted">No matches on {selected}.</p>
        ) : (
          <table>
            <thead><tr><th>Match</th><th>Result</th></tr></thead>
            <tbody>
              {dayMatches.map((m) => (
                <tr key={m.id}>
                  <td>{m.home} – {m.away}</td>
                  <td>{m.result ?? <span className="muted">Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}