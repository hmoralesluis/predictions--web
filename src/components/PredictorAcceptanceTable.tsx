import { useState } from "react";
import { usePredictorAcceptance } from "../api/hooks";
import type { Gender, MatchDayType } from "../api/types";

export default function PredictorAcceptanceTable() {
  const [gender, setGender] = useState<Gender | "">("");
  const [matchType, setMatchType] = useState<MatchDayType | "">("");

  const { data = [], isLoading } = usePredictorAcceptance(
    gender || undefined,
    matchType || undefined
  );

  return (
    <section>
      <h2>Predictor Acceptance</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender | "")}
        >
          <option value="">All genders</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>

        <select
          value={matchType}
          onChange={(e) => setMatchType(e.target.value as MatchDayType | "")}
        >
          <option value="">All types</option>
          <option value="Liga">Liga</option>
          <option value="CopaDelRey">Copa del Rey</option>
          <option value="Champions">Champions</option>
        </select>
      </div>

      {isLoading && <p>Loading...</p>}

      {!isLoading && (
        <table>
          <thead>
            <tr>
              <th>Predictor</th>
              <th>Correct</th>
              <th>Total</th>
              <th>Acceptance %</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr key={row.predictorId}>
                <td>{row.predictor}</td>
                <td>{row.correct}</td>
                <td>{row.total}</td>
                <td>{row.acceptancePercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}