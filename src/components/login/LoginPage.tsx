import { useState } from "react";
import clsx from "clsx";
import { Link, Navigate, useLocation } from "react-router";
import { Button, Field, Input, Label } from "@headlessui/react";
import { GoogleLogin } from "@react-oauth/google";
import { config } from "/config";
import { loginWithGoogle, useAuthStore } from "/stores/auth.store";
import { EncosimIcon } from "/components/layout/Icons";
import { routes } from "/routes";
import { PayPalDonation } from "/components/ui/PayPalDonation";

export function LoginPage() {
  const status = useAuthStore.use.status();
  const reason = useAuthStore((s) => (s.status === "unauthenticated" ? s.reason : null));
  const from = (useLocation().state as { from?: string } | null)?.from ?? routes.home;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "authenticated") return <Navigate to={from} replace />;

  // loginWithGoogle does not throw: failures end up as status "unauthenticated" + reason
  async function submit(token: string) {
    setBusy(true);
    setError(null);
    try {
      await loginWithGoogle(token);
      const s = useAuthStore.getState();
      if (s.status === "unauthenticated") {
        setError(
          s.reason === "banned" ? "This account has been banned." : "Sign-in failed. Please try again.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const notice =
    error ??
    (reason === "expired" ? "Your session expired. Please sign in again." : null) ??
    (reason === "banned" ? "This account has been banned." : null);

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-[max(2rem,env(safe-area-inset-top))]">
      <div className="card w-full max-w-sm space-y-6 p-6 text-center shadow-xl">
        <div className="space-y-2">
          <EncosimIcon className="mx-auto size-16 text-accent-2" />
          <h1 className="font-fancy text-3xl font-semibold">Encosim</h1>
          <p className="text-white/70">Sign in to save characters and run simulations.</p>
        </div>

        {notice && (
          <p role="alert" className="rounded-lg bg-red-900/50 p-3 text-sm">
            {notice}
          </p>
        )}

        {status === "initializing" ? (
          <p className="text-white/70">Checking your session…</p>
        ) : (
          // stays mounted while busy, so the Google button is not torn down and re-rendered
          <div className={clsx("space-y-4", busy && "pointer-events-none opacity-50")}>
            {config.googleClientId ? (
              <div className="flex justify-center">
                <GoogleLogin
                  shape="pill"
                  text="signin"
                  width={250}
                  onSuccess={(cred) =>
                    cred.credential ? submit(cred.credential) : setError("No credential received")
                  }
                  onError={() => setError("Google sign-in failed or was cancelled.")}
                />
              </div>
            ) : (
              !config.fakeAuthEnabled && (
                <p className="text-sm text-white/60">Google sign-in is not configured.</p>
              )
            )}
            {config.fakeAuthEnabled && <FakeLogin onSubmit={submit} />}
          </div>
        )}
        <Link to={routes.home} className="block text-sm text-accent-2 underline underline-offset-4">
          Continue without signing in
        </Link>
      </div>
      {/*<PayPalDonation />*/}
    </div>
  );
}

function FakeLogin({ onSubmit }: { onSubmit: (token: string) => void }) {
  const [token, setToken] = useState("");
  return (
    <form
      className="flex items-end gap-2 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(token);
      }}
    >
      <Field className="min-w-0 flex-1">
        <Label className="label">Fake token (dev)</Label>
        <Input
          className="input"
          placeholder="fake:<id>:<email>[:<name>]"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </Field>
      <Button type="submit" className="btn btn-primary shrink-0">
        Login
      </Button>
    </form>
  );
}
