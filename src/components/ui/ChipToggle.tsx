import type { ReactNode } from "react";
import { Checkbox } from "@headlessui/react";

/** A pill that toggles on/off (Headless checkbox styled as a chip). */
export function ChipToggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Checkbox
      checked={checked}
      onChange={onChange}
      className="flex min-h-11 cursor-pointer items-center rounded-full border border-white/15 bg-black/20 px-4 text-sm select-none data-checked:border-transparent data-checked:bg-accent-1 data-checked:text-white data-focus:outline-2 data-focus:outline-accent-2"
    >
      {children}
    </Checkbox>
  );
}
