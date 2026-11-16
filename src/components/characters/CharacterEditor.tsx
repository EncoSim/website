import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Button,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Fieldset,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { ArrowLeftIcon, ChevronDownIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { errorMessage } from "/lib/errors";
import { routes } from "/routes";
import { useAuthStore } from "/stores/auth.store";
import {
  createCharacter,
  deleteCharacter,
  discardChanges,
  pullCharacter,
  pushCharacter,
  resolveConflict,
  setField,
} from "/stores/characters.actions";
import { useCharacter, useCharacterField, type Editable } from "/stores/characters.store";
import { ClassAbilities } from "./ClassAbilities";
import { NumberField, SegmentedField, SelectField, TextField, ToggleField } from "./fields";
import { AbilityScores, DamageMatrix, ProficiencyField, SpellSlots, StrategyField } from "./parts";
import { SpellListField } from "./SpellBook";
import { SyncBadge } from "./SyncBadge";
import { LocalIdContext } from "./useField";

const ENTITY_TYPES = ["normal", "beast", "undead", "construct", "plant", "fiend"] as const;
const POSITIONS = ["front", "middle", "back", "airborne"] as const;
const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing",
  "poison", "psychic", "radiant", "slashing", "thunder", "true", "heal",
] as const;

// auto-fill grid: 2 columns on a 320px phone, more as space allows, no breakpoints needed
const GRID = "grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3";

export function CharacterEditor({ localId }: { localId: string }) {
  const rec = useCharacter(localId);
  const [error, setError] = useState<string | null>(null);
  if (!rec || rec.sync === "deleted") return <NotFound />;

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <LocalIdContext value={localId}>
      <div className="space-y-3 pb-6">
        <EditorBar rec={rec} run={run} />
        {error && (
          <p role="alert" className="rounded-lg bg-red-900/50 p-3 text-sm">
            {error}
          </p>
        )}
        {rec.sync === "conflict" && <ConflictBanner localId={localId} />}
        <Sections />
      </div>
    </LocalIdContext>
  );
}

function NotFound() {
  return (
    <div className="card space-y-3 p-4">
      <p>This character doesn't exist (anymore).</p>
      <Link to={routes.characters} className="btn">
        Back to characters
      </Link>
    </div>
  );
}

function ConflictBanner({ localId }: { localId: string }) {
  return (
    <div className="space-y-3 rounded-lg bg-red-900/40 p-3 text-sm">
      <p>This character was changed on the server. Which version do you want to keep?</p>
      <div className="flex gap-2">
        <Button className="btn flex-1" onClick={() => resolveConflict(localId, "mine")}>
          Keep mine
        </Button>
        <Button className="btn flex-1" onClick={() => resolveConflict(localId, "theirs")}>
          Take server's
        </Button>
      </div>
    </div>
  );
}

function EditorBar({ rec, run }: { rec: Editable; run: (fn: () => Promise<void>) => Promise<void> }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const authed = useAuthStore((s) => s.status === "authenticated");
  const name = useCharacterField(rec.localId, "name");
  const id = rec.localId;
  const canUpload = rec.sync === "local" || rec.sync === "modified";
  const hasRemote = rec.sync !== "local";

  const duplicate = () => {
    const copy = createCharacter(rec.data);
    setField(copy, "name", `${rec.data.name} (copy)`);
    navigate(routes.character(copy));
  };
  const remove = () => {
    // a local-only character is gone for good; synced ones become a pending deletion you can undo
    if (rec.sync === "local" && !window.confirm("Delete this character? It only exists on this device.")) {
      return;
    }
    deleteCharacter(id);
    navigate(routes.characters, { replace: true });
  };

  return (
    <div className="sticky top-0 z-10 -mx-3 flex items-center gap-2 border-b border-white/10 bg-base-1/90 px-3 py-2 backdrop-blur lg:mx-0 lg:rounded-xl lg:border">
      <Link
        to={routes.characters}
        aria-label="Back to characters"
        className="btn btn-ghost btn-icon lg:hidden"
      >
        <ArrowLeftIcon className="size-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-fancy text-lg font-semibold">{name || "Unnamed"}</h1>
        <SyncBadge sync={rec.sync} busy={rec.busy} />
      </div>

      {canUpload &&
        (authed ? (
          <Button className="btn btn-primary" disabled={rec.busy} onClick={() => run(() => pushCharacter(id))}>
            {rec.sync === "local" ? "Upload" : "Save"}
          </Button>
        ) : (
          <Link to={routes.login} state={{ from: pathname }} className="btn">
            Sign in to save
          </Link>
        ))}

      <Menu>
        <MenuButton className="btn btn-ghost btn-icon" aria-label="More actions">
          <EllipsisVerticalIcon className="size-6" />
        </MenuButton>
        <MenuItems
          anchor="bottom end"
          className="z-50 w-56 rounded-xl border border-white/10 bg-base-3 p-1 shadow-xl [--anchor-gap:0.25rem] focus:outline-none"
        >
          {hasRemote && authed && (
            <MenuAction disabled={rec.busy} onClick={() => run(() => pullCharacter(id))}>
              Pull from server
            </MenuAction>
          )}
          {(rec.sync === "modified" || rec.sync === "conflict") && (
            <MenuAction onClick={() => discardChanges(id)}>Discard changes</MenuAction>
          )}
          <MenuAction onClick={duplicate}>Duplicate</MenuAction>
          <MenuAction danger onClick={remove}>
            Delete
          </MenuAction>
        </MenuItems>
      </Menu>
    </div>
  );
}

// Menu items use the documented Headless pattern: MenuItem wraps a plain element.
function MenuAction({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <MenuItem disabled={disabled}>
      <button
        className={clsx(
          "flex min-h-11 w-full items-center rounded-lg px-3 text-left data-disabled:opacity-50 data-focus:bg-white/10",
          danger && "text-red-300",
        )}
        onClick={onClick}
      >
        {children}
      </button>
    </MenuItem>
  );
}

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <Disclosure as="section" defaultOpen={defaultOpen} className="card">
      <DisclosureButton className="group flex min-h-12 w-full items-center justify-between px-4 text-left font-fancy font-semibold">
        {title}
        <ChevronDownIcon className="size-5 transition group-data-open:rotate-180" />
      </DisclosureButton>
      <DisclosurePanel className="space-y-4 px-4 pb-4">{children}</DisclosurePanel>
    </Disclosure>
  );
}

function Sections() {
  return (
    <div className="space-y-3">
      <Section title="General" defaultOpen>
        <TextField label="Name" path="name" />
        <div className={GRID}>
          <SelectField label="Type" path="entity_type" options={ENTITY_TYPES} />
          <NumberField label="Level" path="level" min={1} max={20} />
          <ProficiencyField />
          <NumberField label="HP" path="health.hit_points" />
          <NumberField label="AC" path="combat.armor_class" />
        </div>
      </Section>

      <Section title="Ability scores" defaultOpen>
        <AbilityScores />
      </Section>

      <Section title="Combat">
        <Fieldset className="space-y-4">
          <div className={GRID}>
            <NumberField label="To hit" path="combat.to_hit" />
            <NumberField label="Damage" path="combat.damage" />
            <NumberField label="Attacks" path="combat.attacks" />
            <NumberField label="Offhand damage" path="combat.offhand_damage" />
            <SelectField label="Damage type" path="combat.damage_type" options={DAMAGE_TYPES} />
            <NumberField label="Speed (ft)" path="position.speed" />
          </div>
          <ToggleField label="Ranged attack" path="combat.has_range_attack" />
          <SegmentedField label="Position" path="position.position" options={POSITIONS} />
        </Fieldset>
      </Section>

      <Section title="Resistances">
        <DamageMatrix />
      </Section>

      <Section title="Strategy">
        <StrategyField />
      </Section>

      <Section title="Spellcasting">
        <SpellSlots />
        <div className={GRID}>
          <NumberField label="Spell modifier" path="magic.spell_modifier" />
          <NumberField label="Spell save DC" path="magic.spell_save_dc" />
        </div>
        <SpellListField />
      </Section>

      <Section title="Classes and abilities">
        <ClassAbilities />
        <TextField label="Other abilities" path="abilities.other_abilities" />
      </Section>
    </div>
  );
}
