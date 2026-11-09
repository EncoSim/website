import { useAuthStore } from "./stores/auth.store";
import "./App.css";
import { LoginButton, LogoutButton } from "./components/LoginButton";

function App() {
  const authenticated = useAuthStore((s) => s.status === "authenticated");

  return <div id="app">{authenticated ? <LogoutButton /> : <LoginButton />}</div>;
}

export default App;
