const BASE = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  // Explicit fields, because the Vite template enables `erasableSyntaxOnly`
  // (no constructor parameter properties).
  status: number;
  fields: Record<string, string[]>;
  constructor(status: number, message: string, fields: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text; // plain-text error body
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = await readBody(res);

  if (res.ok) return (body ?? undefined) as T; // 204 or empty 200 -> undefined

  // 400 = TypedResults.ValidationProblem
  if (res.status === 400 && body && typeof body === "object" && "errors" in body) {
    throw new ApiError(
      400,
      "Check the highlighted fields.",
      (body as { errors: Record<string, string[]> }).errors,
    );
  }

  // 409 = TypedResults.Conflict("message") -> JSON string,
  // TypedResults.Problem(...) -> ProblemDetails with detail/title
  let message = res.statusText;
  if (typeof body === "string") {
    message = body;
  } else if (body && typeof body === "object") {
    const p = body as { detail?: string; title?: string };
    message = p.detail ?? p.title ?? message;
  }
  throw new ApiError(res.status, message);
}