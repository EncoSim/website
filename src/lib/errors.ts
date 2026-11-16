import { ApiError } from "/api/errors";

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const d = "detail" in e.body ? (e.body.detail as unknown) : undefined;
    const limit =
      typeof d === "object" && d !== null && "allowed" in d ? ` (limit: ${String(d.allowed)})` : "";
    return e.body.message + limit;
  }
  return e instanceof Error ? e.message : "Unknown error";
}
