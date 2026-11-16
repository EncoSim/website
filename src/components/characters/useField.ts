import { createContext, use } from "react";
import type { Path, PathValue } from "../../lib/paths";
import { setField } from "/stores/characters.actions";
import { useCharacterField, type CharData } from "/stores/characters.store";

/** The character the surrounding editor is working on. */
export const LocalIdContext = createContext<string | null>(null);

type CharPath = Path<CharData> & string;
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/** Paths whose value type is exactly V, so a text field can't be pointed at an enum, and so on. */
export type PathsOf<V> = {
  [P in CharPath]: Equal<PathValue<CharData, P>, V> extends true ? P : never;
}[CharPath];

export function useField<P extends CharPath>(path: P) {
  const localId = use(LocalIdContext);
  if (!localId) throw new Error("useField needs a <LocalIdContext>");
  const value = useCharacterField(localId, path);
  const set = (v: PathValue<CharData, P>) => setField(localId, path, v);
  return [value, set] as const;
}
