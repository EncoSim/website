import clsx from "clsx";
import { Field, Input, Label } from "@headlessui/react";

export function TextInput({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Field className={clsx("min-w-0", className)}>
      <Label className="label">{label}</Label>
      <Input className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
