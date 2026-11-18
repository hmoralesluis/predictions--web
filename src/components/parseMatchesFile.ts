// components/parseMatchesFile.ts
import type { NewMatch } from "../api/types";

export type ParsedMatches = { matches: NewMatch[]; errors: string[] };

const DATE_LINE = /^date:\s*(\d{4}-\d{2}-\d{2})\s*$/i;

// Format:
//   Date: 2026-11-18
//   Home team<TAB>Away team
//   ...
// A file can hold several "Date:" blocks. Lines keep their order, which sets the table order.
export function parseMatchesFile(text: string): ParsedMatches {
  const matches: NewMatch[] = [];
  const errors: string[] = [];
  let date: string | null = null;

  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  for (const [i, raw] of lines.entries()) {
    const line = raw.trim();
    if (!line) continue;
    const n = i + 1;

    const dateLine = DATE_LINE.exec(line);
    if (dateLine) {
      date = dateLine[1];
      continue;
    }
    if (/^date:/i.test(line)) {
      errors.push(`Line ${n}: invalid date, use "Date: yyyy-MM-dd".`);
      date = null;
      continue;
    }

    // Tab between the teams (also accepts 2+ spaces, in case the editor converted the tab)
    const teams = line.split(/\t+|\s{2,}/).map((t) => t.trim()).filter(Boolean);
    if (teams.length !== 2) {
      errors.push(`Line ${n}: expected "home team, tab, away team".`);
      continue;
    }
    if (!date) {
      errors.push(`Line ${n}: no "Date:" line before this match.`);
      continue;
    }
    matches.push({ home: teams[0], away: teams[1], date });
  }

  if (matches.length === 0 && errors.length === 0) errors.push("No matches found in the file.");
  return { matches, errors };
}