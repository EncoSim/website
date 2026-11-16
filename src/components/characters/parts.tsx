import clsx from "clsx";
import { Button, Field, Fieldset, Input, Label, Legend } from "@headlessui/react";
import type { components } from "/generated/schemas";
import { CheckBox } from "/components/ui/CheckBox";
import { NumberInput } from "/components/ui/NumberInput";
import { useField } from "./useField";

type DamageType = components["schemas"]["DamageType"];

export const ATTRIBUTES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
type Attribute = (typeof ATTRIBUTES)[number];

const abilityMod = (score: number) => Math.floor((score - 10) / 2);
const signed = (n: number) => (n >= 0 ? `+${n}` : String(n));

// --- ability scores: the modifier follows the score, but stays editable for overrides ---------------

export function AbilityScores() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ATTRIBUTES.map((attr) => (
        <AbilityCard key={attr} attr={attr} />
      ))}
    </div>
  );
}

function AbilityCard({ attr }: { attr: Attribute }) {
  const [score, setScore] = useField(`stats.attributes.${attr}` as const);
  const [mod, setMod] = useField(`stats.modifiers.${attr}` as const);
  const [proficiencies, setProficiencies] = useField("saves.proficiencies");
  const proficient = proficiencies?.includes(attr) ?? false;
  const auto = abilityMod(score ?? 10);

  return (
    <div className="space-y-2 rounded-lg bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-fancy font-semibold uppercase">{attr.slice(0, 3)}</span>
        <CheckBox
          label="Save prof."
          checked={proficient}
          onChange={(on) =>
            setProficiencies(on ? [...(proficiencies ?? []), attr] : (proficiencies ?? []).filter((a) => a !== attr))
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Score"
          min={1}
          value={score}
          onCommit={(n) => {
            setScore(n);
            setMod(abilityMod(n)); // 5e: floor((score - 10) / 2)
          }}
        />
        <NumberInput label="Modifier" value={mod} onCommit={setMod} />
      </div>
      {mod !== auto && (
        <Button className="btn btn-ghost w-full text-xs" onClick={() => setMod(auto)}>
          Reset modifier to {signed(auto)}
        </Button>
      )}
    </div>
  );
}

// --- proficiency bonus suggestion from the level ------------------------------------------------------

export function ProficiencyField() {
  const [level] = useField("level");
  const [prof, setProf] = useField("stats.proficiency");
  const suggested = level !== undefined && level >= 1 ? 2 + Math.floor((Math.min(level, 20) - 1) / 4) : undefined;
  return (
    <div className="min-w-0">
      <NumberInput label="Proficiency" value={prof} onCommit={setProf} />
      {suggested !== undefined && suggested !== prof && (
        <Button className="btn btn-ghost mt-1 w-full text-xs" onClick={() => setProf(suggested)}>
          Use +{suggested} (level {level})
        </Button>
      )}
    </div>
  );
}

// --- strategy level: slider + presets --------------------------------------------------------------------

const STRATEGY_PRESETS = [
  ["Beast", 2],
  ["Average player", 5],
  ["Evil wizard", 8],
] as const;

export function StrategyField() {
  const [value, set] = useField("strategy_level");
  return (
    <Field className="space-y-2">
      <Label className="label">
        Strategy level: <span className="font-semibold text-white">{value ?? "–"}</span> / 10
      </Label>
      <Input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value ?? 5}
        onChange={(e) => set(e.target.valueAsNumber)}
        className="h-11 w-full accent-accent-1"
      />
      <div className="flex flex-wrap gap-2">
        {STRATEGY_PRESETS.map(([label, n]) => (
          <Button key={n} className={clsx("btn", value === n && "btn-primary")} onClick={() => set(n)}>
            {label} ({n})
          </Button>
        ))}
      </div>
    </Field>
  );
}

// --- spell slots --------------------------------------------------------------------------------------------

export function SpellSlots() {
  const [slots, set] = useField("magic.spell_slots");
  // the stored array may be shorter than 9 levels: pad for display, always write the full array
  const padded = Array.from({ length: 9 }, (_, i) => slots?.[i] ?? 0);
  return (
    <Fieldset>
      <Legend className="label">Spell slots per level</Legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {padded.map((n, i) => (
          <NumberInput key={i} label={`L${i + 1}`} min={0} value={n} onCommit={(v) => set(padded.with(i, v))} />
        ))}
      </div>
    </Fieldset>
  );
}

// --- resistances / immunities / vulnerabilities as one matrix -----------------------------------------------

// "true" and "heal" can't be resisted, so they are not part of the matrix
const RESISTIBLE = [
  "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic",
  "piercing", "poison", "psychic", "radiant", "slashing", "thunder",
] as const satisfies readonly DamageType[];

export function DamageMatrix() {
  const [res, setRes] = useField("health.resistances");
  const [imm, setImm] = useField("health.immunities");
  const [vul, setVul] = useField("health.vulnerabilities");
  const cols = [
    { key: "res", title: "Res.", full: "resistant", list: res ?? [], set: setRes },
    { key: "imm", title: "Imm.", full: "immune", list: imm ?? [], set: setImm },
    { key: "vul", title: "Vul.", full: "vulnerable", list: vul ?? [], set: setVul },
  ];
  return (
    <Fieldset>
      <Legend className="label">Resistances, immunities and vulnerabilities</Legend>
      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/30 text-white/70">
              <th scope="col" className="px-3 py-2 text-left font-normal">
                Damage type
              </th>
              {cols.map((c) => (
                <th key={c.key} scope="col" className="w-14 px-1 text-center font-normal">
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RESISTIBLE.map((type) => (
              <tr key={type} className="border-t border-white/10">
                <th scope="row" className="px-3 py-2.5 text-left font-normal capitalize">
                  {type}
                </th>
                {cols.map((c) => (
                  <td key={c.key}>
                    <div className="flex justify-center">
                      <CheckBox
                        ariaLabel={`${type}: ${c.full}`}
                        checked={c.list.includes(type)}
                        onChange={(on) => c.set(on ? [...c.list, type] : c.list.filter((x) => x !== type))}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Fieldset>
  );
}
