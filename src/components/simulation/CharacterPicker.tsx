import { Link } from "react-router";
import { Button, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { routes } from "/routes";
import { useCharacterField, useCharacterIds } from "/stores/characters.store";
import { addToTeam } from "/stores/simulations.actions";
import { useSimulationStore } from "/stores/simulations.store";

/** Bottom sheet on phones, centered dialog from `sm`. Tapping a row adds one; "Done" closes. */
export function CharacterPicker({ team, onClose }: { team: number | null; onClose: () => void }) {
  const ids = useCharacterIds();
  return (
    <Dialog open={team !== null} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/60 transition duration-150 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <DialogPanel
          transition
          className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl bg-base-2 pb-[env(safe-area-inset-bottom)] shadow-xl transition duration-150 data-closed:translate-y-4 data-closed:opacity-0 sm:rounded-2xl"
        >
          <div className="flex items-center justify-between gap-2 p-4 pb-2">
            <DialogTitle className="font-fancy font-semibold">
              Add to team {(team ?? 0) + 1}
            </DialogTitle>
            <Button className="btn btn-primary" onClick={onClose}>
              Done
            </Button>
          </div>
          {ids.length === 0 ? (
            <p className="p-4 text-white/70">
              You have no characters yet.{" "}
              <Link to={routes.characters} className="text-accent-2 underline">
                Create one
              </Link>
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
              {ids.map((id) => (
                <PickerRow key={id} localId={id} team={team ?? 0} />
              ))}
            </ul>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function PickerRow({ localId, team }: { localId: string; team: number }) {
  const name = useCharacterField(localId, "name");
  const level = useCharacterField(localId, "level");
  const inTeam = useSimulationStore((s) => s.draft.teams[team]?.filter((x) => x === localId).length ?? 0);
  return (
    <li>
      <Button
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-3 text-left hover:bg-white/10"
        onClick={() => addToTeam(team, localId)}
      >
        <span className="min-w-0">
          <span className="block truncate font-semibold">{name || "Unnamed"}</span>
          <span className="block text-sm text-white/60">Level {level}</span>
        </span>
        {inTeam > 0 && <span className="rounded-full bg-accent-1 px-2 text-sm">×{inTeam}</span>}
      </Button>
    </li>
  );
}
