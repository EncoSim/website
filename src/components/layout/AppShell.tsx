import clsx from "clsx";
import { NavLink, Outlet } from "react-router";
import { routes } from "/routes";
import { PartyIcon, SwordsIcon, EncosimIcon, HomeIcon } from "./Icons";
import { AccountMenu } from "./AccountMenu";

const HEADER_NAC = [
  { to: routes.home, label: "Home", Icon: HomeIcon },
  { to: routes.characters, label: "Characters", Icon: PartyIcon },
  { to: routes.simulation, label: "Simulation", Icon: SwordsIcon },
] as const;

const FOOTER_NAV = [
  { to: routes.impressum, label: "Impressum" },
  { to: routes.privacy, label: "Privacy" },
] as const;

export function AppShell() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 bg-base-2 shadow-lg">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-3">
          <div className="flex items-center gap-2 justify-self-start">
            <EncosimIcon className="size-9 shrink-0 text-accent-2" />
            {/* md instead of sm: both side columns only need to hold the wordmark when there is room */}
            <span className="hidden font-fancy text-2xl font-semibold md:inline">Encosim</span>
          </div>

          <nav aria-label="Main" className="flex items-center gap-1">
            {HEADER_NAC.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    "flex min-h-12 flex-col items-center justify-center rounded-lg px-3 text-xs font-semibold sm:flex-row sm:gap-2 sm:text-base",
                    isActive
                      ? "bg-linear-to-br from-accent-1 to-amber-500 text-white"
                      : "text-accent-2 hover:bg-white/10",
                  )
                }
              >
                <Icon className="size-6" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="justify-self-end">
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto min-h-full max-w-6xl p-3 lg:h-full">
          <Outlet />
        </div>
      </main>

      <footer className="shrink-0 border-t border-white/10 bg-base-2 text-sm text-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-x-4 px-3">
          <span>© {new Date().getFullYear()} Encosim</span>
          <nav aria-label="Legal" className="-mr-3 flex items-center">
            {FOOTER_NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className="flex min-h-8 items-center rounded px-3 hover:bg-white/10 hover:text-white"
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
