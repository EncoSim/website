import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "/index.css";
import App from "/App.tsx";
import { initializeSession } from "/stores/auth.store";
import { config } from "/config.ts";

// Start cookie-based session restoration immediately on every page visit.
void initializeSession();

const clientId = config.googleClientId;

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        {clientId ? (
            <GoogleOAuthProvider clientId={clientId}>
                <App />
            </GoogleOAuthProvider>
        ) : (
            <App />
        )}
    </StrictMode>,
);
