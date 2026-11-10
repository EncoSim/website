import { create } from "zustand";
import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "/generated/schemas";
import { config } from "/config";
import { ApiError, throwOnErrorMiddleware } from "/api/errors";
import createSelectors from "./selectors";

// --- raw authentication --------------------------------------------------------------------------

const rawClient = createClient<paths>({
  baseUrl: config.apiUrl,
  credentials: "include",
});
rawClient.use(throwOnErrorMiddleware);

type AuthSession = components["schemas"]["LoginOutSchema"];

async function refreshSession(): Promise<AuthSession> {
  const { data } = await rawClient.POST("/auth/refresh");
  if (!data) throw new Error("Refresh response is empty");
  return data;
}

// --- store ---------------------------------------------------------------------------------------

/**
 * - **initial**: user was never logged in / no session to restore
 * - **logout**: user intentionally logged out
 * - **expired**: login session expired
 * - **banned**: user was banned
 */
export type Reason = "initial" | "logout" | "expired" | "banned";

export type AuthStore =
  | { status: "initializing" }
  | { status: "unauthenticated"; reason: Reason }
  | { status: "authenticated"; firstLogin: boolean; session: AuthSession };

const store = create<AuthStore>(() => ({
  status: "initializing",
}));
export const useAuthStore = createSelectors(store);

// --- actions -------------------------------------------------------------------------------------

/** shared initialization promise */
let initPromise: Promise<void> | null = null;

export async function initializeSession() {
  if (useAuthStore.getState().status !== "initializing") return;
  if (!initPromise) {
    initPromise = refreshSession()
      .then((session) => {
        if (session) setAuthenticated(session);
        else setUnauthenticated("initial");
      })
      .catch((e) => {
        if (e instanceof ApiError) {
          if (e.body.code === "banned") setUnauthenticated("banned");
          else setUnauthenticated("expired");
        } else {
          setUnauthenticated("initial");
        }
      })
      .finally(() => {
        initPromise = null;
      });
  }
  await initPromise;
}

export async function loginWithGoogle(identityToken: string) {
  try {
    const { data } = await rawClient.POST("/auth/login/google", {
      body: { id_token: identityToken },
    });
    if (data) setAuthenticated(data);
    else setUnauthenticated("expired");
  } catch (e) {
    if (e instanceof ApiError && e.body.code === "banned") setUnauthenticated("banned");
    setUnauthenticated("expired");
  }
}

export async function logout() {
  try {
    await rawClient.POST("/auth/logout");
    setUnauthenticated("logout");
  } catch (e) {
    if (e instanceof ApiError) {
      setUnauthenticated("logout");
    } else {
      // FIX: cannot delete session cookie on network errors
      alert(`Could not reach backend, cannot guarantee logout\n${e}`);
    }
  }
}

export function setAuthenticated(session: AuthSession, firstLogin: boolean = false) {
  useAuthStore.setState({ status: "authenticated", firstLogin, session }, true);
}

export function setUnauthenticated(reason: Reason = "expired") {
  useAuthStore.setState({ status: "unauthenticated", reason }, true);
}

// --- retry middleware ----------------------------------------------------------------------------

async function getCurrentAccessToken(): Promise<string | null> {
  const state = useAuthStore.getState();
  if (state.status === "authenticated") return state.session.access_token;
  if (state.status === "unauthenticated") return null;

  // During initial restoration, wait for the single initialization operation.
  // Check initialization late, because it happens rarely
  await initializeSession();
  const next = useAuthStore.getState();
  return next.status === "authenticated" ? next.session.access_token : null;
}

/** shared refresh promise */
let refreshPromise: Promise<boolean> | null = null;

async function refreshCurrentAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then((session) => {
        setAuthenticated(session);
        return true;
      })
      .catch((e) => {
        if (e instanceof ApiError) {
          if (e.body.code === "banned") setUnauthenticated("banned");
          else setUnauthenticated("expired");
        }
        // network errors do not reset auth state
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function newRequestWithAuthHeaders(request: Request, token: string): Request {
  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const requestWithAuth = new Request(request, { headers });
  return requestWithAuth;
}

export const retryAuthMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = await getCurrentAccessToken();
    if (!token) return undefined;
    return newRequestWithAuthHeaders(request, token);
  },
  async onResponse({ request, response }) {
    if (response.status !== 401) return undefined;

    await refreshCurrentAccessToken();
    const token = await getCurrentAccessToken();
    if (token) return await fetch(newRequestWithAuthHeaders(request, token));
  },
};
