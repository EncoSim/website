import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ArrowRightStartOnRectangleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { logout, useAuthStore } from "/stores/auth.store";
import { routes } from "/routes";

export function AccountMenu() {
  const status = useAuthStore.use.status();
  const session = useAuthStore((s) => (s.status === "authenticated" ? s.session : null));
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(false);

  if (status === "initializing") {
    return <div aria-hidden className="size-11 shrink-0 animate-pulse rounded-full bg-white/10" />;
  }
  if (!session) {
    return (
      <Link to={routes.login} state={{ from: pathname }} className="btn btn-primary shrink-0">
        Sign in
      </Link>
    );
  }

  const { name, email, picture } = session.profile;
  return (
    <Menu>
      <MenuButton
        aria-label="Account menu"
        className="size-11 shrink-0 overflow-hidden rounded-full focus-visible:outline-2 focus-visible:outline-accent-2"
      >
        {picture ? (
          <img src={picture} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center bg-base-3 font-semibold">
            {(name ?? email ?? "").charAt(0).toUpperCase() || "?"}
          </span>
        )}
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        transition
        className="z-50 w-64 origin-top-right rounded-xl border border-white/10 bg-base-3 p-1 shadow-xl transition duration-100 [--anchor-gap:0.5rem] focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        <div className="border-b border-white/10 px-3 py-2">
          <div className="truncate font-semibold">{name ?? "Signed in"}</div>
          {email && <div className="truncate text-sm text-white/60">{email}</div>}
        </div>
        <MenuItem>
          <Link
            to={routes.account}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left data-focus:bg-white/10"
          >
            <UserCircleIcon className="size-5" />
            Account settings
          </Link>
        </MenuItem>
        <MenuItem>
          <button
            disabled={busy}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left data-focus:bg-white/10"
            onClick={async (e) => {
              e.preventDefault(); // keep the menu open while signing out
              setBusy(true);
              try {
                await logout();
              } finally {
                setBusy(false);
              }
            }}
          >
            <ArrowRightStartOnRectangleIcon className="size-5" />
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
