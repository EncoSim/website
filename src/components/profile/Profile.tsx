import { Button } from "@headlessui/react";
import { logout } from "/stores/auth.store";
import { useState } from "react";

export function ProfilePage() {
  return (
    <div className="w-xs">
      <LogoutButton />
    </div>
  );
}

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (e) {
      if (e instanceof Error) alert(e.message);
      else alert("Unknown Error");
    } finally {
      setLoading(false);
    }
  };

  return loading ? (
    <p>Logging Out...</p>
  ) : (
    <Button className="border border-gray-300 rounded-full px-4 w-full" onClick={handleLogout}>
      Logout
    </Button>
  );
}
