import { useState } from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useSimulationIds } from "/stores/simulations.store";
import { RunsList } from "./RunsList";
import { TeamBuilder } from "./TeamBuilder";

export function SimulationPage() {
  const [tab, setTab] = useState(0);
  const pending = useSimulationIds("pending").length;
  return (
    <TabGroup selectedIndex={tab} onChange={setTab} className="mx-auto max-w-3xl">
      <TabList className="sticky top-0 z-10 -mx-3 mb-3 grid grid-cols-2 gap-1 bg-base-1/90 px-3 pb-2 backdrop-blur">
        {["Teams", "Runs"].map((label, i) => (
          <Tab
            key={label}
            className="btn data-selected:bg-linear-to-br data-selected:from-accent-1 data-selected:to-amber-500 data-selected:text-white"
          >
            {label}
            {i === 1 && pending > 0 && (
              <span className="rounded-full bg-black/30 px-2 text-xs">{pending}</span>
            )}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        <TabPanel>
          <TeamBuilder onStarted={() => setTab(1)} />
        </TabPanel>
        <TabPanel>
          <RunsList />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
