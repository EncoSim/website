import { useAuthStore } from "/stores/auth.store";
import { pullSimulations } from "/stores/simulations.actions";
import { resetSimulations } from "/stores/simulations.store";
import { useCharacterStore } from "/stores/characters.store";
import { pruneIds } from "/stores/simulations.actions";

useAuthStore.subscribe((s, prev) => {
  if (s.status === prev.status) return;
  if (s.status === "authenticated") pullSimulations().catch(console.error);
  else if (s.status === "unauthenticated" && s.reason === "logout") resetSimulations();
});

useCharacterStore.subscribe((s, prev) => {
  if (s.characters !== prev.characters) pruneIds(s.characters);
});
