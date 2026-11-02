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

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.ok) return (res.status === 204 ? undefined : await res.json()) as T;

  const body = await res.json().catch(() => null);
  // 400 = TypedResults.ValidationProblem, 409 = TypedResults.Conflict("message")
  if (res.status === 400 && body?.errors)
    throw new ApiError(400, "Check the highlighted fields.", body.errors);
  throw new ApiError(res.status, typeof body === "string" ? body : (body?.title ?? res.statusText));
}