import { useState } from "react";
import { Button } from "@headlessui/react";
import { Link, useLocation } from "react-router";
import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { NumberInput } from "/components/ui/NumberInput";
import { errorMessage } from "/lib/errors";
import { routes } from "/routes";
import { useAuthStore } from "/stores/auth.store";
import { useCharacterField } from "/stores/characters.store";
import {
  addTeam,
  addToTeam,
  removeFromTeam,
  removeTeam,
  setRepetitions,
  startSimulation,
} from "/stores/simulations.actions";
import { useSimulationStore } from "/stores/simulations.store";
import { CharacterPicker } from "./CharacterPicker";

export function TeamBuilder({ onStarted }: { onStarted: () => void }) {
  const { pathname } = useLocation();
  const teams = useSimulationStore((s) => s.draft.teams);
  const repetitions = useSimulationStore((s) => s.draft.repetitions);
  const starting = useSimulationStore((s) => s.starting);
  const authed = useAuthStore((s) => s.status === "authenticated");
  const [picker, setPicker] = useState<number | null>(null); // team that is being filled
  const [error, setError] = useState<string | null>(null);
  const total = teams.reduce((n, team) => n + team.length, 0);

  async function start() {
    setError(null);
    try {
      if (await startSimulation()) onStarted();
    } catch (e) {
      setError(errorMessage(e)); // includes the server's limits (too many participants, runs, ...)
    }
  }

  return (
    <div className="space-y-3">
      {teams.map((team, i) => (
        <TeamCard key={i} index={i} team={team} onAdd={() => setPicker(i)} />
      ))}
      <Button className="btn w-full" onClick={addTeam}>
        <PlusIcon className="size-5" />
        Add team
      </Button>

      <div className="card p-4">
        <NumberInput
          label="Repetitions"
          min={1}
          value={repetitions}
          onCommit={(n) => setRepetitions(Math.max(1, Math.round(n)))}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-900/50 p-3 text-sm">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-3 border-t border-white/10 bg-base-1/95 px-3 py-3 backdrop-blur">
        {authed ? (
          <Button
            className="btn btn-primary w-full"
            disabled={starting || total === 0 || teams.filter((t) => t.length > 0).length < 2}
            onClick={start}
          >
            {starting ? "Starting…" : "Start simulation"}
          </Button>
        ) : (
          <Link to={routes.login} state={{ from: pathname }} className="btn w-full">
            Sign in to start a simulation
          </Link>
        )}
      </div>

      <CharacterPicker team={picker} onClose={() => setPicker(null)} />
    </div>
  );
}

function TeamCard({ index, team, onAdd }: { index: number; team: string[]; onAdd: () => void }) {
  // the draft is a flat list of localIds per team; group it into "character x count" rows
  const counts = new Map<string, number>();
  for (const id of team) counts.set(id, (counts.get(id) ?? 0) + 1);

  return (
    <section className="card space-y-3 p-4" aria-label={`Team ${index + 1}`}>
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-fancy font-semibold">Team {index + 1}</h2>
        <span className="ml-auto text-sm text-white/60">{team.length} fighters</span>
        <Button
          className="btn btn-ghost btn-icon"
          aria-label={`Remove team ${index + 1}`}
          onClick={() => removeTeam(index)}
        >
          <TrashIcon className="size-5" />
        </Button>
      </header>
      {counts.size > 0 && (
        <ul className="space-y-2">
          {[...counts].map(([id, n]) => (
            <SlotRow key={id} teamIndex={index} team={team} localId={id} count={n} />
          ))}
        </ul>
      )}
      <Button className="btn w-full" onClick={onAdd}>
        <PlusIcon className="size-5" />
        Add character
      </Button>
    </section>
  );
}

function SlotRow({
  teamIndex,
  team,
  localId,
  count,
}: {
  teamIndex: number;
  team: string[];
  localId: string;
  count: number;
}) {
  const name = useCharacterField(localId, "name");
  return (
    <li className="flex items-center gap-2 rounded-lg bg-black/20 p-2 pl-3">
      <span className="min-w-0 flex-1 truncate">{name || "Unnamed"}</span>
      <Button
        className="btn btn-icon"
        aria-label="One less"
        onClick={() => removeFromTeam(teamIndex, team.lastIndexOf(localId))}
      >
        <MinusIcon className="size-5" />
      </Button>
      <span className="w-6 text-center font-semibold">{count}</span>
      <Button className="btn btn-icon" aria-label="One more" onClick={() => addToTeam(teamIndex, localId)}>
        <PlusIcon className="size-5" />
      </Button>
    </li>
  );
}
