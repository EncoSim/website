import { useDeferredValue, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Fieldset,
  Input,
  Label,
  Legend,
} from "@headlessui/react";
import { BookOpenIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { CheckBox } from "/components/ui/CheckBox";
import { SPELLS, spellById, type Spell } from "./spellCatalog";
import { useField } from "./useField";

/** The spell list is edited in the spellbook only; the field shows a read-only summary. */
export function SpellListField() {
  const [spells, setSpells] = useField("magic.spell_list");
  const [open, setOpen] = useState(false);
  const list = spells ?? [];
  // display order only (level, then name); the stored order is untouched
  const shown = list
    .map((id) => ({ id, spell: spellById(id) }))
    .sort((a, b) => (a.spell?.level ?? 99) - (b.spell?.level ?? 99) || (a.spell?.name ?? a.id).localeCompare(b.spell?.name ?? b.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-white/70">Spells ({list.length})</span>
        <Button className="btn" onClick={() => setOpen(true)}>
          <BookOpenIcon className="size-5" />
          Spellbook
        </Button>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-white/60">No spells selected.</p>
      ) : (
        <ul className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-black/25 p-2">
          {shown.map(({ id, spell }) => (
            <li key={id} className="flex min-h-9 items-center rounded-full bg-base-3 px-3 text-sm">
              {spell?.name ?? id}
              {spell && <span className="ml-2 rounded bg-black/30 px-1 text-xs text-white/70">L{spell.level}</span>}
            </li>
          ))}
        </ul>
      )}
      <SpellBook open={open} onClose={() => setOpen(false)} selected={list} onChange={setSpells} />
    </div>
  );
}

function SpellBook({
  open,
  onClose,
  selected,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  selected: readonly string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query).trim().toLowerCase();

  const groups = useMemo(() => {
    const byLevel = new Map<number, Spell[]>();
    for (const s of SPELLS) {
      if (q && !s.name.toLowerCase().includes(q)) continue;
      byLevel.set(s.level, [...(byLevel.get(s.level) ?? []), s]);
    }
    return [...byLevel].sort(([a], [b]) => a - b);
  }, [q]);

  // entries that are not in the catalog stay visible (and removable) while not searching
  const custom = q ? [] : selected.filter((id) => !spellById(id));
  const toggle = (id: string, on: boolean) =>
    onChange(on ? [...selected, id] : selected.filter((x) => x !== id));

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-black/60 transition duration-150 data-closed:opacity-0" />
      <div className="fixed inset-0 flex sm:items-center sm:justify-center sm:p-4">
        <DialogPanel
          transition
          className="flex h-dvh w-full flex-col bg-base-2 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition duration-150 data-closed:opacity-0 sm:h-auto sm:max-h-[85dvh] sm:max-w-4xl sm:rounded-2xl sm:pt-0 sm:pb-0 sm:shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 p-4">
            <DialogTitle className="font-fancy text-lg font-semibold">
              Spellbook <span className="text-sm font-normal text-white/60">({selected.length} selected)</span>
            </DialogTitle>
            <Button className="btn btn-primary" onClick={onClose}>
              Done
            </Button>
          </div>

          <Field className="relative border-b border-white/10 p-3">
            <Label className="sr-only">Search spells</Label>
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-6 size-5 -translate-y-1/2 text-white/50" />
            <Input
              type="search"
              className="input pl-10"
              placeholder="Search spells…"
              autoComplete="off"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>

          <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.length === 0 && custom.length === 0 && <p className="text-white/60">No spells match.</p>}
            {groups.map(([level, spells]) => (
              <Fieldset key={level} className="rounded-lg border border-white/10 p-3">
                <Legend className="px-2 text-sm text-white/60">{level === 0 ? "Cantrips" : `Level ${level}`}</Legend>
                {spells.map((s) => (
                  <CheckBox
                    key={s.id}
                    label={s.name}
                    checked={selected.includes(s.id)}
                    onChange={(on) => toggle(s.id, on)}
                  />
                ))}
              </Fieldset>
            ))}
            {custom.length > 0 && (
              <Fieldset className="rounded-lg border border-white/10 p-3">
                <Legend className="px-2 text-sm text-white/60">Other</Legend>
                {custom.map((id) => (
                  <CheckBox key={id} label={id} checked onChange={(on) => toggle(id, on)} />
                ))}
              </Fieldset>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
