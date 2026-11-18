// components/ImportMatchesButton.tsx
import { useRef, useState, type ChangeEvent } from "react";
import { useImportMatches } from "../api/hooks";
import { parseMatchesFile } from "./parseMatchesFile";

export function ImportMatchesButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const importMatches = useImportMatches();
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets you pick the same file again
    if (!file) return;

    importMatches.reset();
    const { matches, errors } = parseMatchesFile(await file.text());
    setParseErrors(errors);
    if (errors.length === 0) importMatches.mutate(matches);
  }

  const result = importMatches.data;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,text/plain"
        hidden
        onChange={onFile}
      />
      <button
        type="button"
        disabled={importMatches.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {importMatches.isPending ? "Importing…" : "Import matches from file"}
      </button>

      {parseErrors.length > 0 && (
        <ul className="error">
          {parseErrors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}

      {result && (
        <p className="muted">
          Created {result.created}
          {result.duplicates > 0 && `, ${result.duplicates} already existed`}
          {result.failed.length > 0 && `, ${result.failed.length} failed`}.
        </p>
      )}
      {result && result.failed.length > 0 && (
        <ul className="error">
          {result.failed.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
    </>
  );
}
