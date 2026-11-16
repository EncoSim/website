// One place for URLs. NOTE: "/characters" and "/simulation" are also API paths: when frontend and
// API share an origin, either prefix the API (e.g. /api) or rename the page routes here.
export const routes = {
  home: "/",
  login: "/login",
  characters: "/characters",
  character: (localId: string) => `/characters/${localId}`,
  simulation: "/simulation",
  account: "/account",
  impressum: "/impressum",
  privacy: "/privacy",
} as const;
