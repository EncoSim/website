import clsx from "clsx";
import type { CharacterRecord } from "/stores/characters.store";

// full class strings so Tailwind's scan finds them
const STYLE = {
  local: "bg-amber-600/80",
  synced: "bg-emerald-800/80",
  modified: "bg-blue-700/80",
  conflict: "bg-red-700/80",
  deleted: "bg-slate-600",
} as const;

export function SyncBadge({ sync, busy }: { sync: CharacterRecord["sync"]; busy?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-block shrink-0 rounded-full px-2 py-0.5 text-xs",
        STYLE[sync],
        busy && "animate-pulse",
      )}
    >
      {busy ? "syncing…" : sync}
    </span>
  );
}
