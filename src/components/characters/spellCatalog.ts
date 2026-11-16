// Spell ids are what gets stored in `magic.spell_list`. They follow the old demo's ids;
// adjust them (or generate this list) if the backend expects other identifiers.
export type Spell = { id: string; name: string; level: number };

export const SPELLS: readonly Spell[] = [
  { id: "FireBolt", name: "Fire Bolt", level: 0 },
  { id: "ChillTouch", name: "Chill Touch", level: 0 },
  { id: "EldritchBlast", name: "Eldritch Blast", level: 0 },

  { id: "BurningHands", name: "Burning Hands", level: 1 },
  { id: "MagicMissile", name: "Magic Missile", level: 1 },
  { id: "GuidingBolt", name: "Guiding Bolt", level: 1 },
  { id: "Entangle", name: "Entangle", level: 1 },
  { id: "CureWounds", name: "Cure Wounds", level: 1 },
  { id: "HealingWord", name: "Healing Word", level: 1 },
  { id: "Hex", name: "Hex", level: 1 },
  { id: "ArmorOfAgathys", name: "Armor of Agathys", level: 1 },
  { id: "FalseLife", name: "False Life", level: 1 },
  { id: "Shield", name: "Shield", level: 1 },
  { id: "InflictWounds", name: "Inflict Wounds", level: 1 },
  { id: "SpiritualWeapon", name: "Spiritual Weapon", level: 1 },

  { id: "AganazzarsSorcher", name: "Aganazzar’s Scorcher", level: 2 },
  { id: "ScorchingRay", name: "Scorching Ray", level: 2 },
  { id: "Shatter", name: "Shatter", level: 2 },

  { id: "Fireball", name: "Fireball", level: 3 },
  { id: "LightningBolt", name: "Lightning Bolt", level: 3 },
  { id: "Haste", name: "Haste", level: 3 },
  { id: "ConjureAnimals", name: "Conjure Animals", level: 3 },

  { id: "Blight", name: "Blight", level: 4 },
];

const BY_ID = new Map(SPELLS.map((s) => [s.id, s]));

export const spellById = (id: string) => BY_ID.get(id);
