import { client } from "/api/client";
import { ApiError } from "/api/errors";
import { createCharacter } from "/stores/characters.actions";
import { useCharacterStore, type CharacterRecord } from "/stores/characters.store";
import {
  initialDraft,
  useSimulationStore,
  type SimConfig,
  type SimEntry,
  type SimRecord,
  type SimulationDraft,
} from "/stores/simulations.store";

const get = () => useSimulationStore.getState();
const set = useSimulationStore.setState;
const del = (taskId: string) =>
  set((s) => {
    delete s.simulations[taskId];
  });

// records only move forward (unknown -> pending -> finished), so stale responses can't regress them
function mergeRecord(map: Record<string, SimEntry>, rec: SimRecord) {
  const cur = map[rec.task_id];
  if (cur && (cur.status !== "pending" || rec.status === "pending")) return;
  map[rec.task_id] = { ...rec, busy: cur?.busy ?? false };
}

const setBusy = (taskId: string, busy: boolean) =>
  set((s) => {
    const rec = s.simulations[taskId];
    if (rec) rec.busy = busy;
  });

async function withBusy(taskId: string, fn: () => Promise<void>) {
  if (get().simulations[taskId]?.busy !== false) return; // unknown or already busy
  setBusy(taskId, true);
  try {
    await fn();
  } finally {
    setBusy(taskId, false);
  }
}

// --- draft ---------------------------------------------------------------------------------------

export const setRepetitions = (n: number) =>
  set((s) => {
    s.draft.repetitions = n;
  });
export const addTeam = () =>
  set((s) => {
    s.draft.teams.push([]);
  });
export const removeTeam = (team: number) =>
  set((s) => {
    s.draft.teams.splice(team, 1);
  });
export const addToTeam = (team: number, localId: string) =>
  set((s) => {
    s.draft.teams[team]?.push(localId);
  });
export const removeFromTeam = (team: number, slot: number) =>
  set((s) => {
    s.draft.teams[team]?.splice(slot, 1);
  });
export const resetDraft = () =>
  set((s) => {
    s.draft = initialDraft();
  });

export class MissingCharacterError extends Error {
  localId: string;
  constructor(localId: string) {
    super(`Character ${localId} is missing or deleted`);
    this.name = "MissingCharacterError";
    this.localId = localId;
  }
}

/** Snapshot the draft into a request: unique characters become participants, teams index into them. */
export function buildConfig(
  draft: SimulationDraft,
  characters: Record<string, CharacterRecord>,
): SimConfig {
  const index = new Map<string, number>();
  const participants: SimConfig["participants"] = [];
  const teams = draft.teams.map((team) =>
    team.map((localId) => {
      let i = index.get(localId);
      if (i === undefined) {
        const rec = characters[localId];
        if (!rec || rec.sync === "deleted") throw new MissingCharacterError(localId);
        i = participants.push(rec.data) - 1;
        index.set(localId, i);
      }
      return i;
    }),
  );
  return { repetitions: draft.repetitions, participants, teams };
}

export function pruneIds(characters: Record<string, CharacterRecord>) {
  const alive = (id: string) => {
    const rec = characters[id];
    return rec !== undefined && rec.sync !== "deleted";
  };
  if (get().draft.teams.every((team) => team.every(alive))) return; // common case: no write
  set((s) => {
    s.draft.teams = s.draft.teams.map((team) => team.filter(alive));
  });
}

// --- server actions ------------------------------------------------------------------------------

/** Starts the draft. Resolves to the task id. The draft is kept so it can be started again. */
export async function startSimulation(): Promise<string | undefined> {
  if (get().starting) return;
  const config = buildConfig(get().draft, useCharacterStore.getState().characters);
  set((s) => {
    s.starting = true;
  });
  try {
    // too_many_participants / too_many_repetitions (403) and too_many_simulations (429) propagate
    const { data } = await client.POST("/simulation", { body: config });
    if (!data) throw new Error("Empty response");
    set((s) => mergeRecord(s.simulations, data)); // pending, or already finished
    return data.task_id;
  } finally {
    set((s) => {
      s.starting = false;
    });
  }
}

/** Fetches everything (pending + finished); also the manual "refresh" for pending ones. */
export async function pullSimulations(): Promise<void> {
  // only records known before the request may be pruned (avoids racing with startSimulation)
  const known = new Set(Object.keys(get().simulations));
  set((s) => {
    s.listStatus = "loading";
  });
  try {
    const { data } = await client.GET("/simulation");
    if (!data) throw new Error("Empty simulation list");
    const seen = new Set(data.map((r) => r.task_id));
    set((s) => {
      for (const rec of data) mergeRecord(s.simulations, rec);
      for (const id of known) {
        const cur = s.simulations[id];
        if (cur && !cur.busy && !seen.has(id)) delete s.simulations[id]; // deleted elsewhere
      }
      s.listStatus = "loaded";
    });
  } catch (e) {
    set((s) => {
      s.listStatus = "error";
    });
    throw e;
  }
}

async function fetchOne(taskId: string) {
  try {
    const { data } = await client.GET("/simulation/{task_id}", {
      params: { path: { task_id: taskId } },
    });
    if (data) set((s) => mergeRecord(s.simulations, data));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return del(taskId);
    throw e;
  }
}

export const refreshSimulation = (taskId: string) => withBusy(taskId, () => fetchOne(taskId));

/** The simulation stays in the list as failed (aborted), so fetch its final state afterwards. */
export const abortSimulation = (taskId: string) =>
  withBusy(taskId, async () => {
    try {
      await client.POST("/simulation/{task_id}/abort", {
        params: { path: { task_id: taskId } },
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return del(taskId);
      throw e;
    }
    await fetchOne(taskId);
  });

export const deleteSimulation = (taskId: string) =>
  withBusy(taskId, async () => {
    if (get().simulations[taskId]?.status === "pending") throw new Error("Abort it first");
    try {
      await client.DELETE("/simulation/{task_id}", { params: { path: { task_id: taskId } } });
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) throw e;
    }
    del(taskId);
  });

// --- carry characters over -----------------------------------------------------------------------

/** Creates a local-only copy (no link back to the simulation). Returns the new localId. */
export function importParticipant(taskId: string, index: number): string {
  const data = get().simulations[taskId]?.config.participants[index];
  if (!data) throw new Error(`No participant ${index} in simulation ${taskId}`);
  return createCharacter(data);
}

export function importAllParticipants(taskId: string): string[] {
  const sim = get().simulations[taskId];
  if (!sim) throw new Error(`Unknown simulation ${taskId}`);
  return sim.config.participants.map((data) => createCharacter(data));
}
