import { useState } from "react";
import clsx from "clsx";
import { Link, useLocation, useNavigate } from "react-router";
import { Button, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ArrowPathIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { errorMessage } from "/lib/errors";
import { routes } from "/routes";
import { useAuthStore } from "/stores/auth.store";
import {
  abortSimulation,
  deleteSimulation,
  importAllParticipants,
  importParticipant,
  pullSimulations,
  refreshSimulation,
} from "/stores/simulations.actions";
import {
  useSimulation,
  useSimulationIds,
  useSimulationStore,
  type SimConfig,
  type SimEntry,
} from "/stores/simulations.store";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function RunsList() {
  const { pathname } = useLocation();
  const ids = useSimulationIds();
  const listStatus = useSimulationStore((s) => s.listStatus);
  const authed = useAuthStore((s) => s.status === "authenticated");
  const [error, setError] = useState<string | null>(null);

  if (!authed) {
    return (
      <div className="card space-y-3 p-4">
        <p>Sign in to run simulations and see their history.</p>
        <Link to={routes.login} state={{ from: pathname }} className="btn btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-fancy font-semibold">Simulations</h2>
        <Button
          className="btn"
          disabled={listStatus === "loading"}
          onClick={() => {
            setError(null);
            pullSimulations().catch((e) => setError(errorMessage(e)));
          }}
        >
          <ArrowPathIcon className={clsx("size-5", listStatus === "loading" && "animate-spin")} />
          Refresh
        </Button>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-900/50 p-3 text-sm">
          {error}
        </p>
      )}
      {ids.length === 0 ? (
        <p className="py-6 text-center text-white/60">
          {listStatus === "loading" ? "Loading…" : "No simulations yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {ids.map((id) => (
            <li key={id}>
              <RunCard taskId={id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RunCard({ taskId }: { taskId: string }) {
  const sim = useSimulation(taskId);
  const [error, setError] = useState<string | null>(null);
  if (!sim) return null;

  const run = (fn: () => Promise<void>) => {
    setError(null);
    fn().catch((e) => setError(errorMessage(e)));
  };
  const { config } = sim;

  return (
    <article className="card space-y-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge sim={sim} />
        <time dateTime={sim.submitted_at} className="text-sm text-white/60">
          {dateFormat.format(new Date(sim.submitted_at))}
        </time>
      </header>
      <p className="text-sm text-white/80">
        {config.teams.map((t) => t.length).join(" vs ")} fighters · {config.repetitions}×
      </p>

      {sim.status !== "pending" && (
        <pre className="max-h-72 overflow-auto rounded-lg bg-black/25 p-3 font-sans text-sm break-words whitespace-pre-wrap">
          {sim.summary}
        </pre>
      )}

      <Participants taskId={taskId} config={config} />

      {error && (
        <p role="alert" className="rounded-lg bg-red-900/50 p-3 text-sm">
          {error}
        </p>
      )}
      <footer className="flex flex-wrap gap-2">
        {sim.status === "pending" ? (
          <>
            <Button className="btn" disabled={sim.busy} onClick={() => run(() => refreshSimulation(taskId))}>
              Refresh
            </Button>
            <Button
              className="btn btn-danger"
              disabled={sim.busy}
              onClick={() => run(() => abortSimulation(taskId))}
            >
              Abort
            </Button>
          </>
        ) : (
          <Button
            className="btn btn-danger"
            disabled={sim.busy}
            onClick={() => run(() => deleteSimulation(taskId))}
          >
            Delete
          </Button>
        )}
      </footer>
    </article>
  );
}

function StatusBadge({ sim }: { sim: SimEntry }) {
  if (sim.status === "pending") {
    return <span className="animate-pulse rounded-full bg-amber-600/80 px-3 py-0.5 text-sm">running</span>;
  }
  if (sim.status === "success") {
    return <span className="rounded-full bg-emerald-800/80 px-3 py-0.5 text-sm">finished</span>;
  }
  return (
    <span className="rounded-full bg-red-700/80 px-3 py-0.5 text-sm">
      failed{sim.error_type ? ` · ${sim.error_type}` : ""}
    </span>
  );
}

/** Inspect the characters of a run; "Edit copy" makes a local-only copy in the character store. */
function Participants({ taskId, config }: { taskId: string; config: SimConfig }) {
  const navigate = useNavigate();
  const { participants, teams } = config;
  return (
    <Disclosure as="div">
      <DisclosureButton className="group flex min-h-11 w-full items-center justify-between text-sm font-semibold">
        Characters ({participants.length})
        <ChevronDownIcon className="size-5 transition group-data-open:rotate-180" />
      </DisclosureButton>
      <DisclosurePanel className="space-y-2 pt-1">
        <ul className="space-y-2">
          {participants.map((p, i) => {
            const inTeams = teams.flatMap((t, ti) => (t.includes(i) ? [ti + 1] : []));
            return (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 p-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="text-sm text-white/60">
                    Lv {p.level} · HP {p.health.hit_points} · AC {p.combat.armor_class}
                    {inTeams.length > 0 && ` · team ${inTeams.join(", ")}`}
                  </div>
                </div>
                <Button
                  className="btn shrink-0"
                  onClick={() => navigate(routes.character(importParticipant(taskId, i)))}
                >
                  Edit copy
                </Button>
              </li>
            );
          })}
        </ul>
        {participants.length > 1 && (
          <Button
            className="btn w-full"
            onClick={() => {
              importAllParticipants(taskId);
              navigate(routes.characters);
            }}
          >
            Copy all to my characters
          </Button>
        )}
      </DisclosurePanel>
    </Disclosure>
  );
}
