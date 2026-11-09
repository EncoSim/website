import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Button, Dialog, DialogPanel, DialogTitle, Input } from "@headlessui/react";
import { config } from "/config";
import { useAuthStore } from "/stores/auth.store";

// TODO: use same style for google and logout/fake
const style = "border border-gray-300 rounded-full w-[120px] h-[40px]";

export function LoginButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const loginWithGoogleIdToken = useAuthStore((s) => s.loginWithGoogleIdToken);

  const handleLogin = async (token: string) => {
    setLoading(true);
    try {
      await loginWithGoogleIdToken(token);
      setDialogOpen(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const googleButton = (
    <GoogleLogin
      width="120px"
      shape="pill"
      text="signin"
      onSuccess={(cred) => handleLogin(cred.credential)}
    />
  );

  const fakeLoginButton = (
    <>
      <Button onClick={() => setDialogOpen(true)} className={style}>
        Sign In
      </Button>
      <FakeLoginDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleLogin}
      />
    </>
  );
  if (loading) return <div className={style}>Signing in...</div>;
  return <div>{config.fakeAuthEnabled ? fakeLoginButton : googleButton}</div>;
}

function FakeLoginDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (token: string) => void;
}) {
  const [token, setToken] = useState("");

  return (
    <Dialog open={open} onClose={onClose} className="relative">
      <DialogPanel className="border p-6 gap-5 absolute inset-auto">
        <DialogTitle>Fake Google Login</DialogTitle>
        <Input
          autoFocus
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Fake Token"
          className="border border-gray-300 px-3 py-2 text-sm"
        />
        <Button onClick={onClose} className="p-2 bg-gray-300">
          Cancel
        </Button>
        <Button onClick={() => onSubmit(token)} className="p-2 bg-gray-300">
          Log in
        </Button>
      </DialogPanel>
    </Dialog>
  );
}

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const button = (
    <Button className={style} onClick={handleLogout}>
      Logout
    </Button>
  );
  return loading ? <div className={style}>Logging Out...</div> : button;
}
