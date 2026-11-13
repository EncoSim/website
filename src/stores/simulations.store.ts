import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";
import type { components } from "/generated/schemas";

export type SimConfig = components["schemas"]["SimulationConfig"];
export type PendingSim = components["schemas"]["SimulationPendingRecord"];
export type FinishedSim = components["schemas"]["SimulationRecord"];
export type SimRecord = PendingSim | FinishedSim; // discriminated by `status`
export type SimEntry = SimRecord & { busy: boolean }; // a refresh/abort/delete is in flight

// character localIds; a character may appear in several teams and several times per team
export type SimulationDraft = { repetitions: number; teams: string[][] };

export type SimulationStore = {
  draft: SimulationDraft;
  starting: boolean;
  simulations: Record<string, SimEntry>;
  listStatus: "idle" | "loading" | "loaded" | "error";
};

export const initialDraft = (): SimulationDraft => ({ repetitions: 1, teams: [[], []] }); // placeholder

const initialState = (): SimulationStore => ({
  draft: initialDraft(),
  starting: false,
  simulations: {},
  listStatus: "idle",
});

export const useSimulationStore = create<SimulationStore>()(immer(initialState));

export function resetSimulations() {
  useSimulationStore.setState((d) => {
    Object.assign(d, initialState());
  });
}

// --- accessors -----------------------------------------------------------------------------------

export const useSimulation = (taskId: string) => useSimulationStore((s) => s.simulations[taskId]);

const newestFirst = (a: SimRecord, b: SimRecord) =>
  Date.parse(b.submitted_at) - Date.parse(a.submitted_at);

export const useSimulationIds = (kind: "all" | "pending" | "finished" = "all") =>
  useSimulationStore(
    useShallow((s) =>
      Object.values(s.simulations)
        .filter((r) => kind === "all" || (kind === "pending") === (r.status === "pending"))
        .sort(newestFirst)
        .map((r) => r.task_id),
    ),
  );
