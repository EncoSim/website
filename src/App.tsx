import { type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "/components/layout/AppShell";
import { LoginPage } from "/components/login/LoginPage";
import { CharactersPage } from "/components/characters/CharactersPage";
import { HomePage } from "/components/home/HomePage";
import { SimulationPage } from "/components/simulation/SimulationPage";
import { routes } from "/routes";
import { PrivacyPage } from "/components/legal/PrivacyPage";
import { ImprintPage } from "/components/legal/ImpressumPage";
import { AccountPage } from "/components/account/AccountPage";
import { useAuthStore } from "/stores/auth.store";

export default function App() {
  return (
    <SessionRestore>
      <Routes>
        <Route path={routes.login} element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="characters/:localId?" element={<CharactersPage />} />
          <Route path="simulation" element={<SimulationPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="imprint" element={<ImprintPage />} />
          <Route path="*" element={<Navigate to={routes.home} replace />} />
        </Route>
      </Routes>
    </SessionRestore>
  );
}

/**
 * Keep the requested URL mounted while the cookie-based session is restored.
 * On the initial page load only, send users home if there is no session to restore.
 * Later logouts do not trigger this redirect.
 */
function SessionRestore({ children }: { children: ReactNode }) {
  const status = useAuthStore.use.status();

  if (status === "initializing") {
    return <div className="grid min-h-dvh place-items-center text-white/70">Loading session…</div>;
  }
  return <>{children}</>;
}
