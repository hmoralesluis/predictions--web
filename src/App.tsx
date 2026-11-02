import { useState } from "react";
import MatchesPage from "./pages/MatchesPage";
import StatsPage from "./pages/StatsPage";

const tabs = { matches: "Matches", stats: "Stats" } as const;
type Tab = keyof typeof tabs;

export default function App() {
  const [tab, setTab] = useState<Tab>("stats");
  return (
    <main>
      <header>
        <h1>Prediction stats</h1>
        <nav>
          {(Object.keys(tabs) as Tab[]).map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {tabs[t]}
            </button>
          ))}
        </nav>
      </header>
      {tab === "matches" ? <MatchesPage /> : <StatsPage />}
    </main>
  );
}