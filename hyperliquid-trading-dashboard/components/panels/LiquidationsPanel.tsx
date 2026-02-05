"use client";

import Tile from "@/components/Tile";
import LiquidationsTable from "@/components/tables/LiquidationsTable";
import { TimeRangeMinutes } from "@/components/TimeRangePills";

export default function LiquidationsPanel(props: { windowMin: TimeRangeMinutes }) {
  return (
    <Tile
      title="Liquidations"
      subtitle="Recent liquidations sorted by notional value"
    >
      <LiquidationsTable windowMin={props.windowMin} />
    </Tile>
  );
}