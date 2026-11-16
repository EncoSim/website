import clsx from "clsx";
import { useParams } from "react-router";
import { CharacterList } from "./CharacterList";
import { CharacterEditor } from "./CharacterEditor";

/**
 * Below `lg` only one pane is visible (list at /characters, editor at /characters/:id), so the
 * browser back button works as "back to the list". From `lg` both panes sit side by side.
 */
export function CharactersPage() {
  const { localId } = useParams();
  return (
    <div className="grid gap-4 lg:h-full lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div className={clsx("min-w-0 lg:h-full lg:overflow-y-auto", localId && "hidden lg:block")}>
        <CharacterList selectedId={localId} />
      </div>
      <div
        className={clsx(
          "min-w-0 lg:h-full lg:overflow-y-auto",
          !localId && "hidden lg:grid lg:place-items-center",
        )}
      >
        {localId ? (
          <CharacterEditor key={localId} localId={localId} />
        ) : (
          <p className="text-white/50">Select or create a character</p>
        )}
      </div>
    </div>
  );
}
