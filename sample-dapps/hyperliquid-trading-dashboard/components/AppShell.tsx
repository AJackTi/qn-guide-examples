"use client";

import { useMemo, useState } from "react";
import Tabs from "@/components/Tabs";
import TimeRangePills, { TimeRangeMinutes } from "@/components/TimeRangePills";
import WhalePanel from "@/components/panels/WhalePanel";
import LiquidationsPanel from "@/components/panels/LiquidationsPanel";
import TrendingPanel from "@/components/panels/TrendingPanel";

const TABS = [
  { key: "whales", label: "Whales" },
  { key: "liquidations", label: "Liquidations" },
  { key: "trending", label: "Trending" }
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AppShell() {
  const [tab, setTab] = useState<TabKey>("whales");
  const [windowMin, setWindowMin] = useState<TimeRangeMinutes>(15);

  const subtitle = useMemo(() => {
    if (tab === "whales") return "Top 5 largest taker trades by notional value";
    if (tab === "liquidations") return "Trades with liquidation object (sorted by notional)";
    return "Top coins by trade count with buy/sell breakdown";
  }, [tab]);

  return (
    <div className="min-h-screen qn-dots-bg">
      {/* Header */}
      <header className="bg-qn-white border-b border-qn-grey-100">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-qn-black flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#3EE148"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-qn-grey-950">
                  Hypercore Streams
                </h1>
                <p className="text-sm text-qn-grey-500">
                  Real-time Hyperliquid data via Quicknode gRPC
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <TimeRangePills value={windowMin} onChange={setWindowMin} />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex items-center justify-between">
            <Tabs
              tabs={TABS.map(t => ({ key: t.key, label: t.label }))}
              value={tab}
              onChange={(k) => setTab(k as TabKey)}
            />
            <p className="text-xs text-qn-grey-500 hidden sm:block">{subtitle}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {tab === "whales" && <WhalePanel windowMin={windowMin} />}
        {tab === "liquidations" && <LiquidationsPanel windowMin={windowMin} />}
        {tab === "trending" && <TrendingPanel windowMin={windowMin} />}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-6 pb-8">
        <div className="flex items-center justify-between text-xs text-qn-grey-500">
          <p>
            Powered by <span className="font-medium text-qn-grey-700">Quicknode</span> Streams
          </p>
          <p>
            Run <code className="px-1.5 py-0.5 rounded-md bg-qn-white border border-qn-grey-100 text-qn-grey-700 font-mono text-[11px]">npm run worker</code> for live data
          </p>
        </div>
      </footer>
    </div>
  );
}