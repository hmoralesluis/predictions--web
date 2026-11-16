// components/AddPredictorForm.tsx
import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import { useCreatePredictor } from "../api/hooks";

export function AddPredictorForm() {
  const create = useCreatePredictor();
  const [name, setName] = useState("");

  const apiError = create.error instanceof ApiError ? create.error : null;
  const hasFieldErrors = !!apiError && Object.keys(apiError.fields).length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ name: name.trim() }, { onSuccess: () => setName("") });
  }

  return (
    <>
      <form onSubmit={submit} className="form">
        <label>
          Predictor name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!apiError?.fields.name}
          />
          {apiError?.fields.name?.map((msg) => (
            <small key={msg} className="error">{msg}</small>
          ))}
        </label>
        <button disabled={create.isPending || name.trim() === ""}>
          {create.isPending ? "Saving…" : "Add predictor"}
        </button>
      </form>
      {apiError && !hasFieldErrors && <p className="error">{apiError.message}</p>}
    </>
  );
}
