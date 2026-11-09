import { create } from "zustand";
import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "/generated/schemas";
import { config } from "/config";
import { ApiError, throwOnErrorMiddleware } from "/api/errors";

// --- raw authentication --------------------------------------------------------------------------

const rawClient = createClient<paths>({
  baseUrl: config.apiUrl,
});
rawClient.use(throwOnErrorMiddleware);

type AuthSession = components["schemas"]["LoginOutSchema"];

/** shared refresh promise */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<AuthSession | null> {
  const { data } = await rawClient.POST("/auth/refresh");
  return new Promise((_resolve, _reject) => data);
}

export async function refreshCurrentAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then((session) => {
        useAuthStore.getState().setAuthenticated(session);
        return true;
      })
      .catch((e) => {
        if (e instanceof ApiError) {
          const f = useAuthStore.getState().setUnauthenticated;
          if (e.body.code === "banned") f("banned");
          else f("expired");
        }
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function getCurrentAccessToken(): Promise<string | null> {
  const state = useAuthStore.getState();
  if (state.status === "authenticated") return state.access_token;
  if (state.status === "unauthenticated") return null;

  // During initial restoration, wait for the single initialization operation.
  // Check initialization late, because it happens rarely
  await state.initialize();
  const next = useAuthStore.getState();
  return next.status === "authenticated" ? next.access_token : null;
}

// --- store ---------------------------------------------------------------------------------------

/**
 * - **initial**: user was never logged in / no session to restore
 * - **logout**: user intentionally logged out
 * - **expired**: login session expired
 * - **banned**: user was banned
 */
export type UnauthenticatedReason = "initial" | "logout" | "expired" | "banned";

export type AuthState =
  | { status: "initializing" }
  | { status: "unauthenticated"; reason: UnauthenticatedReason }
  | ({ status: "authenticated"; firstLogin: boolean } & AuthSession);

type AuthActions = {
  /** Restore session from previous visit if possible */
  initialize: () => Promise<void>;
  loginWithGoogleIdToken: (identityToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticated: (session: AuthSession, firstLogin?: boolean) => void;
  setUnauthenticated: (reason?: UnauthenticatedReason) => void;
};

type AuthStore = AuthState & AuthActions;

/** shared initialization promise */
let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>((set, get) => ({
  status: "initializing",

  initialize: async () => {
    if (get().status !== "initializing") return;
    if (!initPromise) {
      initPromise = refreshSession()
        .then((session) => {
          if (session) set({ status: "authenticated", ...session });
          else set({ status: "unauthenticated", reason: "initial" });
        })
        .catch(() => set({ status: "unauthenticated", reason: "initial" }))
        .finally(() => {
          initPromise = null;
        });
    }
    await initPromise;
  },

  loginWithGoogleIdToken: async (identityToken) => {
    const { data } = await rawClient.POST("/auth/login/google", {
      body: { id_token: identityToken },
    });
    set({ status: "authenticated", ...data });
  },

  logout: async () => {
    try {
      await rawClient.POST("/auth/logout");
    } finally {
      set({ status: "unauthenticated" });
    }
  },

  setAuthenticated: (session, firstLogin: false) =>
    set({ status: "authenticated", firstLogin, ...session }),
  setUnauthenticated: (reason = "expired") => set({ status: "unauthenticated", reason: reason }),
}));

// --- retry middleware ----------------------------------------------------------------------------

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
