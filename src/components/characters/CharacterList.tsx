import { useState } from "react";
import { Button } from "@headlessui/react";
import clsx from "clsx";
import { Link, useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { ArrowPathIcon, ArrowUpTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import { errorMessage } from "/lib/errors";
import { routes } from "/routes";
import { useAuthStore } from "/stores/auth.store";
import { createCharacter, discardChanges, pullAll, pushAll } from "/stores/characters.actions";
import { useCharacterField, useCharacterIds, useCharacterStore } from "/stores/characters.store";
import { SyncBadge } from "./SyncBadge";

export function CharacterList({ selectedId }: { selectedId?: string }) {
  const navigate = useNavigate();
  const ids = useCharacterIds();
  const listStatus = useCharacterStore((s) => s.listStatus);
  const authed = useAuthStore((s) => s.status === "authenticated");
  const deleted = useCharacterStore(
    useShallow((s) =>
      Object.values(s.characters)
        .filter((c) => c.sync === "deleted")
        .map((c) => c.localId),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setSyncing(true);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSyncing(false);
    }
  };
  const upload = () =>
    run(async () => {
      const failed = (await pushAll()).filter((r) => r.error !== undefined);
      if (failed.length) {
        throw new Error(`${failed.length} could not be uploaded: ${errorMessage(failed[0].error)}`);
      }
    });

  return (
    <section aria-label="Characters" className="space-y-3">
      <div className="flex gap-2">
        <Button
          className="btn btn-primary flex-1"
          onClick={() => navigate(routes.character(createCharacter()))}
        >
          <PlusIcon className="size-5" />
          New
        </Button>
        <Button className="btn" disabled={!authed || syncing} onClick={upload}>
          <ArrowUpTrayIcon className="size-5" />
          Upload
        </Button>
        <Button className="btn" disabled={!authed || syncing} onClick={() => run(pullAll)}>
          <ArrowPathIcon className={clsx("size-5", listStatus === "loading" && "animate-spin")} />
          Reload
        </Button>
      </div>

      {!authed && <p className="text-sm text-white/60">Sign in to upload and reload your characters.</p>}
      {error && (
        <p role="alert" className="rounded-lg bg-red-900/50 p-3 text-sm">
          {error}
        </p>
      )}

      {ids.length === 0 ? (
        <p className="py-6 text-center text-white/60">
          {listStatus === "loading" ? "Loading characters…" : "No characters yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {ids.map((id) => (
            <li key={id}>
              <CharacterRow localId={id} selected={id === selectedId} />
            </li>
          ))}
        </ul>
      )}

      {deleted.length > 0 && (
        <p className="flex items-center justify-between gap-2 text-sm text-white/60">
          {deleted.length} pending deletion{deleted.length > 1 ? "s" : ""} (applied on upload)
          <Button className="btn btn-ghost" onClick={() => deleted.forEach(discardChanges)}>
            Undo
          </Button>
        </p>
      )}
    </section>
  );
}

function CharacterRow({ localId, selected }: { localId: string; selected: boolean }) {
  const name = useCharacterField(localId, "name");
  const level = useCharacterField(localId, "level");
  const hp = useCharacterField(localId, "health.hit_points");
  const ac = useCharacterField(localId, "combat.armor_class");
  const sync = useCharacterStore((s) => s.characters[localId]?.sync);
  const busy = useCharacterStore((s) => s.characters[localId]?.busy ?? false);
  if (!sync) return null;

  return (
    <Link
      to={routes.character(localId)}
      aria-current={selected ? "page" : undefined}
      className={clsx(
        "flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 py-2",
        selected ? "border-accent-1 bg-base-3" : "border-transparent bg-base-2 hover:bg-base-3",
      )}
    >
      <div className="min-w-0">
        <div className="truncate font-semibold">{name || "Unnamed"}</div>
        <div className="truncate text-sm text-white/60">
          Lv {level} · HP {hp} · AC {ac}
        </div>
      </div>
      <SyncBadge sync={sync} busy={busy} />
    </Link>
  );
}
