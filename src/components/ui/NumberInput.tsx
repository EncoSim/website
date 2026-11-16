import { useState } from "react";
import clsx from "clsx";
import { Field, Input, Label } from "@headlessui/react";

/** Keeps what is typed locally; only valid numbers are committed, so no NaN ever reaches the data. */
export function NumberInput({
  label,
  value,
  onCommit,
  min,
  max,
  className,
}: {
  label: string;
  value: number | undefined;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const [text, setText] = useState<string | null>(null); // null = show the stored value
  return (
    <Field className={clsx("min-w-0", className)}>
      <Label className="label">{label}</Label>
      <Input
        className="input"
        type="number"
        step="any"
        min={min}
        max={max}
        value={text ?? (value === undefined ? "" : String(value))}
        onChange={(e) => {
          setText(e.target.value);
          if (Number.isFinite(e.target.valueAsNumber)) onCommit(e.target.valueAsNumber);
        }}
        onBlur={() => setText(null)}
      />
    </Field>
  );
}
