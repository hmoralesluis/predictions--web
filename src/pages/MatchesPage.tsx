import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import { useCreateMatch, useMatches } from "../api/hooks";

import { MatchesByDate } from "../components/MatchesByDate";

type Field = "home" | "away" | "date";
const empty = { home: "", away: "", date: "" };

export default function MatchesPage() {
  console.log('init');
  const { data: matches = [], isLoading, error } = useMatches();
  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date));
  const create = useCreateMatch();
  const [form, setForm] = useState(empty);

  const apiError = create.error instanceof ApiError ? create.error : null;
  const hasFieldErrors = !!apiError && Object.keys(apiError.fields).length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ ...form, date: form.date || null }, { onSuccess: () => setForm(empty) });
  }

  // A plain function returning JSX, not a nested component (a nested component
  // would remount on every render and the input would lose focus).
  function input(name: Field, label: string, type = "text") {
    return (
      <label>
        {label}
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          aria-invalid={!!apiError?.fields[name]}
        />
        {apiError?.fields[name]?.map((msg) => (
          <small key={msg} className="error">{msg}</small>
        ))}
      </label>
    );
  }

  // const matches = [...(data?.matches ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <section>
        <h2>Add a match</h2>
        <form onSubmit={submit} className="form">
          {input("home", "Home team")}
          {input("away", "Away team")}
          {input("date", "Date", "date")}
          <button disabled={create.isPending}>{create.isPending ? "Saving…" : "Add match"}</button>
        </form>
        {apiError && !hasFieldErrors && <p className="error">{apiError.message}</p>}
      </section>

      <section>
        <h2>Matches</h2>
        {isLoading && <p className="muted">Loading matches…</p>}
        {error && <p className="error">Could not load matches. Is the API running?</p>}
        {matches.length === 0 && <p className="muted">No matches yet.</p>}
        {matches.length > 0 && (
          <table>
            <thead><tr><th>Date</th><th>Match</th><th>Result</th></tr></thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.id}>
                  <td>{m.date}</td>
                  <td>{m.home} – {m.away}</td>
                  <td>{m.result ?? <span className="muted">Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section>
        <h2>Matches</h2>
        <MatchesByDate />
      </section>
      </>
  );
}