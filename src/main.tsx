import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "/index.css";
import App from "/App.tsx";
import { initializeSession } from "/stores/auth.store";
import { config } from "/config.ts";
// store subscriptions: login -> pull, logout -> reset, draft pruning
import "/stores/characters.wiring";
import "/stores/simulations.wiring";

// Start cookie-based session restoration immediately on every page visit.
void initializeSession();

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {config.googleClientId ? (
      <GoogleOAuthProvider clientId={config.googleClientId}>{app}</GoogleOAuthProvider>
    ) : (
      app
    )}
  </StrictMode>,
);
