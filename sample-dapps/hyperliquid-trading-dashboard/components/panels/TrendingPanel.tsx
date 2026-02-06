"use client";

import Tile from "@/components/Tile";
import TrendingTable from "@/components/tables/TrendingTable";
import { TimeRangeMinutes } from "@/components/TimeRangePills";

export default function TrendingPanel(props: { windowMin: TimeRangeMinutes }) {
  return (
    <Tile
      title="Trending Coins"
      subtitle="Top 10 by trade count with volume sparklines"
    >
      <TrendingTable windowMin={props.windowMin} />
    </Tile>
  );
}