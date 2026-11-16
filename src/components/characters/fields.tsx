import type { PathValue } from "/lib/paths";
import type { components } from "/generated/schemas";
import { NumberInput } from "/components/ui/NumberInput";
import { Segmented } from "/components/ui/Segmented";
import { SelectInput } from "/components/ui/SelectInput";
import { TextInput } from "/components/ui/TextInput";
import { Toggle } from "/components/ui/Toggle";
import type { CharData } from "/stores/characters.store";
import { useField, type PathsOf } from "./useField";

type S = components["schemas"];

export function NumberField({
  label,
  path,
  min,
  max,
}: {
  label: string;
  path: PathsOf<number>;
  min?: number;
  max?: number;
}) {
  const [value, set] = useField(path);
  return <NumberInput label={label} value={value} onCommit={set} min={min} max={max} />;
}

export function TextField({ label, path }: { label: string; path: PathsOf<string> }) {
  const [value, set] = useField(path);
  return <TextInput label={label} value={value} onChange={set} />;
}

export function ToggleField({ label, path }: { label: string; path: PathsOf<boolean> }) {
  const [value, set] = useField(path);
  return <Toggle label={label} checked={!!value} onChange={set} />;
}

type EnumPath = PathsOf<S["EntityType"]> | PathsOf<S["DamageType"]> | PathsOf<S["Position"]>;

/** `options` is loosely typed on purpose; the path decides what is stored. */
export function SelectField<P extends EnumPath>({
  label,
  path,
  options,
}: {
  label: string;
  path: P;
  options: readonly string[];
}) {
  const [value, set] = useField(path);
  return (
    <SelectInput
      label={label}
      value={value as string | undefined}
      onChange={(v) => set(v as PathValue<CharData, P>)}
      options={options}
    />
  );
}

export function SegmentedField<P extends EnumPath>({
  label,
  path,
  options,
}: {
  label: string;
  path: P;
  options: readonly string[];
}) {
  const [value, set] = useField(path);
  return (
    <Segmented
      label={label}
      value={value as string | undefined}
      onChange={(v) => set(v as PathValue<CharData, P>)}
      options={options}
    />
  );
}
