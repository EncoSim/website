import createClient from "openapi-fetch";
import type { paths } from "/generated/schemas";
import { config } from "/config";
import { retryAuthMiddleware } from "/stores/auth.store";
import { throwOnErrorMiddleware } from "./errors";

/** Client for protected application endpoints. Automatically retries requests with refreshed access token if appropriate */
export const client = createClient<
  Omit<paths, "/auth/login/google" | "/auth/refresh" | "/auth/logout">
>({
  baseUrl: config.apiUrl,
  credentials: "include",
});

client.use(throwOnErrorMiddleware);
client.use(retryAuthMiddleware); // runs first, needs to inspect response before throwing
