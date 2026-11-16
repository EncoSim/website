import { Fieldset, Legend, Radio, RadioGroup } from "@headlessui/react";

/** Segmented control for a small set of options (Headless RadioGroup). */
export function Segmented({
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
    <Fieldset className="min-w-0">
      <Legend className="label">{label}</Legend>
      <RadioGroup
        value={value ?? ""}
        onChange={onChange}
        className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-black/25 p-1"
      >
        {options.map((o) => (
          <Radio
            key={o}
            value={o}
            className="flex min-h-10 cursor-pointer items-center justify-center rounded-md px-2 text-sm capitalize select-none data-checked:bg-accent-1 data-checked:text-white data-focus:outline-2 data-focus:outline-accent-2"
          >
            {o}
          </Radio>
        ))}
      </RadioGroup>
    </Fieldset>
  );
}
