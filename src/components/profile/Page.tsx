import { LoginPage } from "./Login";
import { ProfilePage } from "./Profile";
import { useAuthStore } from "/stores/auth.store";

export function LoginOrProfilePage() {
  const loggedIn = useAuthStore((s) => s.status === "authenticated");
  return loggedIn ? <ProfilePage /> : <LoginPage />;
}
