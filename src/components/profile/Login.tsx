import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Button, Field, Input } from "@headlessui/react";
import { config } from "/config";
import { loginWithGoogle, useAuthStore } from "/stores/auth.store";

export function LoginPage() {
  return (
    <div className="w-xs">
      <LoginOptions />
    </div>
  );
}

function LoginOptions() {
  const [loading, setLoading] = useState(false);
  const status = useAuthStore.use.status();
  useEffect(() => setLoading(status === "initializing"), [status]);

  const handleGoogleLogin = async (token: string) => {
    setLoading(true);
    try {
      await loginWithGoogle(token);
    } catch (e) {
      if (e instanceof Error) alert(e.message);
      else alert("Unknown Error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Signing in...</p>;
  return (
    <div className="flex flex-col gap-2">
      <GoogleLogin
        shape="pill"
        text="signin"
        onSuccess={(cred) => handleGoogleLogin(cred.credential ?? "")}
      />
      {config.fakeAuthEnabled ? <FakeLogin onSubmit={handleGoogleLogin} /> : <></>}
    </div>
  );
}

function FakeLogin({ onSubmit }: { onSubmit: (token: string) => void }) {
  const [token, setToken] = useState("");

  return (
    <Field className="flex h-10">
      <Input
        className="border border-gray-300 rounded-l-full pl-4 pr-2 w-full"
        placeholder="fake:<id>:<email>[:<name>]"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <Button
        className="border border-gray-300 border-l-0 rounded-r-full pl-2 pr-4"
        onClick={() => onSubmit(token)}
      >
        Login
      </Button>
    </Field>
  );
}
