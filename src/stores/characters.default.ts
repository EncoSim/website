import type { CharData } from "/stores/characters.store";
import def from "/generated/character.json" with { type: "json" };

export function createDefault(): CharData {
  return def as CharData // json does not carry enums
};
