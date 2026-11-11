import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";
import type { components } from "/generated/schemas";
import { getAt, type Path, type PathValue } from "/api/paths";

export type CharData = components["schemas"]["EntityConfig"];
export type CharUpload = components["schemas"]["CharUpload"];
export type CharDownload = components["schemas"]["CharDownload"];

export const MAX_CHARACTERS = 10; // placeholder

type Base = { localId: string; busy: boolean };
// Invariant for "synced": data === remote.data (same reference)
export type LocalOnly = Base & { sync: "local"; data: CharData };
export type Synced = Base & { sync: "synced"; data: CharData; remote: CharDownload };
export type Modified = Base & { sync: "modified"; data: CharData; remote: CharDownload };
export type Conflict = Base & { sync: "conflict"; data: CharData; remote: CharDownload };
export type Deleted = Base & { sync: "deleted"; remote: CharDownload }; // tombstone

export type CharacterRecord = LocalOnly | Synced | Modified | Conflict | Deleted;
export type Editable = Exclude<CharacterRecord, Deleted>;

export type CharacterStore = {
  characters: Record<string, CharacterRecord>;
  listStatus: "idle" | "loading" | "loaded" | "error";
};

export const useCharacterStore = create<CharacterStore>()(
  immer(() => ({ characters: {}, listStatus: "idle" })),
);

export function resetCharacters() {
  useCharacterStore.setState((d) => {
    d.characters = {};
    d.listStatus = "idle";
  });
}

// --- accessors -----------------------------------------------------------------------------------

export const useCharacter = (localId: string) => useCharacterStore((s) => s.characters[localId]);

export const useCharacterIds = () =>
  useCharacterStore(
    useShallow((s) =>
      Object.values(s.characters)
        .filter((c) => c.sync !== "deleted")
        .map((c) => c.localId),
    ),
  );

export const useCharacterCount = () =>
  useCharacterStore((s) => Object.values(s.characters).filter((c) => c.sync !== "deleted").length);

export function useCharacterField<P extends Path<CharData> & string>(
  localId: string,
  path: P,
): PathValue<CharData, P> | undefined {
  return useCharacterStore((s) => {
    const c = s.characters[localId];
    return c && c.sync !== "deleted" ? getAt(c.data, path) : undefined;
  });
}
