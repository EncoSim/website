import type { Middleware } from "openapi-fetch";
import type { components } from "/generated/schemas";

type Schemas = components["schemas"];
type ApiErrorBody = Schemas[Extract<keyof Schemas, `${string}ApiErrorModel`>];

export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`HTTP ${status}\n${body}`);
    this.name = "HTTPError";
    this.status = status;
    this.body = body;
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;
  constructor(status: number, body: ApiErrorBody) {
    const detail = "detail" in body ? body.detail : "";
    super(`ApiError: HTTP ${status}\n${body.message}\n${detail}`);
    this.name = "ApiError";
  }
}

export function toApiErrorBody(value: unknown): ApiErrorBody | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof value.code === "string" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value as ApiErrorBody;
  }
  return undefined;
}

// --- middleware ----------------------------------------------------------------------------------

async function throwFromResponse(response: Response): Promise<never> {
  const body = await response.json();
  const apiErrorBody = toApiErrorBody(body);
  if (apiErrorBody) throw new ApiError(response.status, apiErrorBody);
  throw new HttpError(response.status, body);
}

export const throwOnErrorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.ok) return undefined;
    await throwFromResponse(response.clone());
  },
};
