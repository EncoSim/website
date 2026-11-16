import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { client } from "/api/client";
import type { components } from "/generated/schemas";
import { errorMessage } from "/lib/errors";
import { routes } from "/routes";
import { setUnauthenticated, useAuthStore } from "/stores/auth.store";

type Session = components["schemas"]["SessionSchema"];
type Sessions = components["schemas"]["ManySessionsSchema"];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AccountPage() {
  const auth = useAuthStore((state) => state.status === "authenticated" ? state : null);
  const [sessions, setSessions] = useState<Sessions | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void client.GET("/auth/sessions")
      .then(({ data }) => { if (active && data) setSessions(data); })
      .catch((e: unknown) => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoadingSessions(false); });
    return () => { active = false; };
  }, []);

  if (!auth) return <Navigate to={routes.login} replace />;

  async function revokeSession(session: Session, current: boolean) {
    const label = current ? "this device" : session.info;
    if (!window.confirm(`Sign out ${label}?`)) return;
    setRevoking(session.session_id);
    setError(null);
    try {
      await client.DELETE("/auth/sessions/{session_id}", {
        params: { path: { session_id: session.session_id } },
      });
      if (current) {
        setUnauthenticated("logout");
      } else {
        setSessions((previous) => previous ? {
          ...previous,
          other: previous.other.filter((item) => item.session_id !== session.session_id),
        } : previous);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRevoking(null);
    }
  }

  async function deleteAccount() {
    if (deleteConfirmation !== "DELETE") return;
    setDeletingAccount(true);
    setError(null);
    try {
      await client.DELETE("/user/profile");
      setUnauthenticated("logout");
    } catch (e) {
      setError(errorMessage(e));
      setDeletingAccount(false);
    }
  }

  const profile = auth.session.profile;
  const displayName = profile.name ?? "—";
  const email = profile.email ?? "—";
  const allSessions = sessions ? [sessions.current, ...sessions.other] : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <header className="space-y-1">
        <h1 className="font-fancy text-3xl font-semibold text-accent-2">Account</h1>
        <p className="text-white/60">Manage your profile, signed-in devices, and account data.</p>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-950/50 p-3 text-sm text-red-100">{error}</p>}

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="text-xl font-semibold">Profile information</h2>
          <p className="text-sm text-white/60">The information associated with your account.</p>
        </div>
        <div className="flex items-center gap-4">
          {profile.picture ? (
            <img
              src={profile.picture}
              alt="Profile"
              referrerPolicy="no-referrer"
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div className="grid size-16 place-items-center rounded-full bg-base-3 text-xl font-semibold">
              {(displayName !== "—" ? displayName : email).charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">{displayName}</div>
            <div className="break-all text-sm text-white/60">{email}</div>
          </div>
        </div>
        <dl className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
          <div><dt className="label">Email verification</dt><dd>{profile.email_verified ? "Verified" : "Not verified"}</dd></div>
          <div><dt className="label">Account ID</dt><dd className="break-all font-mono text-sm">{auth.session.user_id}</dd></div>
        </dl>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="text-xl font-semibold">Login sessions</h2>
          <p className="text-sm text-white/60">Review devices signed in to your account and sign out sessions you no longer recognize.</p>
        </div>
        {loadingSessions ? <p className="text-sm text-white/60">Loading sessions…</p> : sessions ? (
          <div className="divide-y divide-white/10">
            {allSessions.map((session, index) => {
              const current = index === 0;
              return (
                <div key={session.session_id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{session.info || "Unknown device"}</span>
                      {current && <span className="rounded-full bg-emerald-900/70 px-2 py-0.5 text-xs text-emerald-200">This device</span>}
                    </div>
                    <p className="text-sm text-white/60">Last active: {formatDate(session.last_used_at)}</p>
                    <p className="text-sm text-white/60">Expires: {formatDate(session.expires_at)}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger shrink-0"
                    disabled={revoking !== null}
                    onClick={() => void revokeSession(session, current)}
                  >
                    {revoking === session.session_id ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              );
            })}
            {allSessions.length === 0 && <p className="text-sm text-white/60">No active sessions found.</p>}
          </div>
        ) : (
          <p className="text-sm text-white/60">Could not load login sessions.</p>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-red-400/30 bg-red-950/20 p-5">
        <div>
          <h2 className="text-xl font-semibold text-red-200">Delete account</h2>
          <p className="mt-1 text-sm text-white/70">Permanently delete your account and all associated data. This action cannot be undone.</p>
        </div>
        <label className="block max-w-sm">
          <span className="label">Type DELETE to confirm</span>
          <input
            className="input"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="DELETE"
          />
        </label>
        <button
          type="button"
          className="btn btn-danger"
          disabled={deleteConfirmation !== "DELETE" || deletingAccount}
          onClick={() => void deleteAccount()}
        >
          {deletingAccount ? "Deleting account…" : "Permanently delete account"}
        </button>
      </section>

      <div><Link to={routes.home} className="text-sm text-accent-2 underline underline-offset-4">Back to Encosim</Link></div>
    </div>
  );
}
