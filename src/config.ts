export const config = {
  mode: import.meta.env.MODE,
  isDevServer: import.meta.env.DEV,
  apiUrl: import.meta.env.VITE_API_URL ?? "",
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
  fakeAuthEnabled: import.meta.env.VITE_ENABLE_FAKE_AUTH === "true",
} as const;
