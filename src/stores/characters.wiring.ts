import { useAuthStore } from "/stores/auth.store"; // adapt to your current shape
import { pullAll } from "/stores/characters.actions";
import { resetCharacters } from "/stores/characters.store";

useAuthStore.subscribe((s, prev) => {
  if (s.status === prev.status) return;
  if (s.status === "authenticated")
    pullAll().catch(console.error); // listStatus shows "error"
  else if (s.status === "unauthenticated" && s.reason === "logout") resetCharacters();
});
