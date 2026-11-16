import type { ReactNode } from "react";
import clsx from "clsx";
import { Checkbox, Field, Label } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/16/solid";

/** Headless UI checkbox. Pass `label` for a row with a visible label, `ariaLabel` for a bare box. */
export function CheckBox({
  checked,
  onChange,
  label,
  ariaLabel,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  ariaLabel?: string;
  className?: string;
}) {
  // the ::before extends the hit area to ~44px without making the box itself bigger
  const box = (
    <Checkbox
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="group relative grid size-6 shrink-0 place-items-center rounded border border-white/30 bg-black/25 before:absolute before:-inset-2.5 before:content-[''] data-checked:border-transparent data-checked:bg-accent-1 data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-accent-2"
    >
      <CheckIcon className="size-4 text-white opacity-0 group-data-checked:opacity-100" />
    </Checkbox>
  );
  if (!label) return box;
  return (
    <Field className={clsx("flex min-h-11 items-center gap-3", className)}>
      {box}
      <Label className="cursor-pointer">{label}</Label>
    </Field>
  );
}
