import { Field, Label, Switch } from "@headlessui/react";

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Field className="flex min-h-11 items-center justify-between gap-3">
      <Label className="cursor-pointer">{label}</Label>
      <Switch
        checked={checked}
        onChange={onChange}
        className="group relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-base-3 transition data-checked:bg-accent-1 data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-accent-2"
      >
        <span className="size-5 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
      </Switch>
    </Field>
  );
}
