import { use } from "react";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { getAt } from "/lib/paths";
import { useCharacter } from "/stores/characters.store";
import { NumberField, TextField } from "./fields";
import { LocalIdContext, type PathsOf } from "./useField";

type FieldDef =
  | { kind: "number"; label: string; path: PathsOf<number> }
  | { kind: "text"; label: string; path: PathsOf<string> };
type ClassDef = { id: string; label: string; fields: readonly FieldDef[]; hint?: string };

const num = (label: string, path: PathsOf<number>): FieldDef => ({ kind: "number", label, path });
const txt = (label: string, path: PathsOf<string>): FieldDef => ({ kind: "text", label, path });

const SPELLS_HINT = "No class-specific fields. Spells and spell slots are under Spellcasting.";

const CLASSES: readonly ClassDef[] = [
  { id: "barbarian", label: "Barbarian", fields: [num("Rage damage", "abilities.rage_dmg")] },
  { id: "bard", label: "Bard", fields: [num("Inspiration die", "abilities.inspiration")] },
  {
    id: "cleric",
    label: "Cleric",
    fields: [num("Channel divinity", "abilities.channel_divinity"), num("Destroy undead CR", "abilities.destroy_undead_cr")],
  },
  { id: "druid", label: "Druid", fields: [num("Wild shape CR", "abilities.druid_cr")] },
  { id: "fighter", label: "Fighter", fields: [num("Action surges", "abilities.action_surges")] },
  { id: "monk", label: "Monk", fields: [num("Ki points", "magic.ki_points")] },
  { id: "paladin", label: "Paladin", fields: [num("Lay on hands pool", "abilities.lay_on_hands_pool")] },
  { id: "ranger", label: "Ranger", fields: [num("Favored foe damage", "abilities.favored_foe_dmg")] },
  { id: "rogue", label: "Rogue", fields: [num("Sneak attack damage", "abilities.sneak_attack_dmg")] },
  { id: "sorcerer", label: "Sorcerer", fields: [num("Sorcery points", "magic.sorcery_points")] },
  { id: "warlock", label: "Warlock", fields: [], hint: SPELLS_HINT },
  { id: "wizard", label: "Wizard", fields: [], hint: SPELLS_HINT },
  {
    id: "monster",
    label: "Monster",
    fields: [
      num("Heal at start of turn", "health.start_of_turn_heal"),
      num("Legendary resistances", "saves.legendary_resistances"),
      num("Recharge AoE damage", "abilities.aoe_recharge_dmg"),
      num("Recharge AoE save DC", "abilities.aoe_recharge_dc"),
      num("Recharge AoE save type", "abilities.aoe_save_type"),
      num("Recharge AoE area", "abilities.aoe_recharge_area"),
      num("Recharge AoE probability", "abilities.aoe_recharge_probability"),
      txt("Recharge AoE damage type", "abilities.aoe_recharge_type"),
    ],
  },
];

/** A group is marked when one or more of its fields contain a non-default value. */
function hasActiveValues(group: ClassDef, rec: ReturnType<typeof useCharacter>): boolean {
  if (!rec || rec.sync === "deleted") return false;
  return group.fields.some((field) => {
    // The backend requires a valid damage type even when AoE damage is zero.
    // Its default value must not mark the Monster group as configured.
    if (field.path === "abilities.aoe_recharge_type") return false;
    const value = getAt(rec.data, field.path);
    return value !== 0 && value !== "" && value !== undefined;
  });
}

export function ClassAbilities() {
  const localId = use(LocalIdContext);
  const rec = useCharacter(localId ?? "");

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">
        Expand an ability group to view or edit its fields. A marker indicates that at least one
        field in that group has an active value.
      </p>
      {CLASSES.map((group) => {
        const marked = hasActiveValues(group, rec);
        return (
          <Disclosure
            key={group.id}
            as="section"
            defaultOpen={marked}
            className="card border-l border-white/10"
          >
            <DisclosureButton className="group flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left font-fancy font-semibold">
              <span className="flex items-center gap-2">
                <span>{group.label}</span>
                {marked && <span className="size-2 rounded-full bg-accent-1" aria-hidden="true" />}
              </span>
              <ChevronDownIcon className="size-5 transition group-data-open:rotate-180" />
            </DisclosureButton>
            <DisclosurePanel className="space-y-3 px-4 pb-4">
              {group.fields.length === 0 ? (
                <p className="text-sm text-white/60">{group.hint}</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3">
                  {group.fields.map((field) =>
                    field.kind === "number" ? (
                      <NumberField key={field.path} label={field.label} path={field.path} />
                    ) : (
                      <TextField key={field.path} label={field.label} path={field.path} />
                    ),
                  )}
                </div>
              )}
            </DisclosurePanel>
          </Disclosure>
        );
      })}
    </div>
  );
}
