import { Field, Label, Select } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

/** Headless Select keeps the native <select>, so phones still show their OS picker. */
export function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <Field className="min-w-0">
      <Label className="label">{label}</Label>
      <div className="relative">
        <Select
          className="input appearance-none pr-9 capitalize"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-white/60" />
      </div>
    </Field>
  );
}
