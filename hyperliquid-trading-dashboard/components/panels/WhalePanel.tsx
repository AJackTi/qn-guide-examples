"use client";

import { useState } from "react";
import useSWR from "swr";
import Tile from "@/components/Tile";
import WhaleTable from "@/components/tables/WhaleTable";
import Sparkline from "@/components/Sparkline";
import { TimeRangeMinutes } from "@/components/TimeRangePills";
import { qs } from "@/lib/query";

const DEFAULT_THRESHOLD = 50_000;

const WHALE_COINS = [
  { coin: "BTC", label: "Bitcoin" },
  { coin: "ETH", label: "Ethereum" },
  { coin: "USDC", label: "USDC" }
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getSparklineColor(data: number[]) {
  if (!data || data.length < 2) return { stroke: "#3EE148", fill: "#3EE148" };
  const isUp = data[data.length - 1] >= data[0];
  return isUp 
    ? { stroke: "#3EE148", fill: "#3EE148" }
    : { stroke: "#7646E7", fill: "#7646E7" };
}

export default function WhalePanel(props: { windowMin: TimeRangeMinutes }) {
  const [customCoin, setCustomCoin] = useState("HYPE");
  const threshold = DEFAULT_THRESHOLD;

  const coins = [...new Set([...WHALE_COINS.map(c => c.coin), customCoin])].filter(Boolean);
  const sparklineKey = `/api/sparklines?${qs({ windowMin: props.windowMin, coins: coins.join(",") })}`;
  const { data: sparklineData } = useSWR<{ sparklines: Record<string, { volume: number[] }> }>(
    sparklineKey,
    fetcher,
    { refreshInterval: 5000 }
  );

  const customCoinData = sparklineData?.sparklines?.[customCoin]?.volume ?? [];
  const customCoinColors = getSparklineColor(customCoinData);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {WHALE_COINS.map((t) => {
          const coinData = sparklineData?.sparklines?.[t.coin]?.volume ?? [];
          const colors = getSparklineColor(coinData);
          
          return (
            <Tile
              key={t.coin}
              title={`${t.coin} Whales`}
              subtitle={`≥ $${(threshold / 1000).toFixed(0)}K notional`}
              right={
                <div className="flex flex-col items-end gap-1">
                  <Sparkline 
                    data={coinData}
                    color={colors.stroke}
                    fillColor={colors.fill}
                    width={72}
                    height={28}
                  />
                  <span className="text-[10px] text-qn-grey-400">Volume</span>
                </div>
              }
            >
              <WhaleTable 
                coin={t.coin} 
                windowMin={props.windowMin} 
                thresholdUsd={threshold}
                limit={5}
              />
            </Tile>
          );
        })}
      </div>

      <Tile
        title="Track Any Coin"
        subtitle="Enter a Hyperliquid ticker (e.g., HYPE, DOGE, WIF, PEPE)"
        right={
          <div className="flex items-center gap-3">
            <Sparkline 
              data={customCoinData}
              color={customCoinColors.stroke}
              fillColor={customCoinColors.fill}
              width={72}
              height={28}
            />
            <input
              value={customCoin}
              onChange={(e) => setCustomCoin(e.target.value.toUpperCase().trim())}
              className="qn-input w-24 text-center font-medium"
              placeholder="HYPE"
            />
          </div>
        }
      >
        <WhaleTable 
          coin={customCoin} 
          windowMin={props.windowMin} 
          thresholdUsd={threshold}
          limit={5}
        />
      </Tile>
    </div>
  );
}