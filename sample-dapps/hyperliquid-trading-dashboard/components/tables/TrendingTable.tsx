"use client";

import useSWR from "swr";
import { fmtUsd } from "@/lib/format";
import { qs } from "@/lib/query";
import { TimeRangeMinutes } from "@/components/TimeRangePills";
import Sparkline from "@/components/Sparkline";

type Row = {
  coin: string;
  tradesCount: number;
  volumeUsd: number;
  buyVolumeUsd: number;
  sellVolumeUsd: number;
  liqCount: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TrendingTable(props: { windowMin: TimeRangeMinutes }) {
  const key = `/api/trending?${qs({ windowMin: props.windowMin })}`;
  const { data, error, isLoading } = useSWR<{ rows: Row[] }>(key, fetcher, { refreshInterval: 2000 });

  const coins = data?.rows?.map(r => r.coin).join(",") || "";
  const sparklineKey = `/api/sparklines?${qs({ windowMin: props.windowMin, coins })}`;
  const { data: sparklineData } = useSWR<{ sparklines: Record<string, { volume: number[] }> }>(
    coins ? sparklineKey : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  if (error) return <div className="text-sm text-red-500 py-4">Failed to load</div>;
  if (isLoading) return <div className="text-sm text-qn-grey-400 py-4">Loading…</div>;

  const rows = data?.rows ?? [];

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-qn-grey-500">No trending data yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "50px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "70px" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-qn-grey-100">
            <th className="py-3 text-left text-xs font-medium text-qn-grey-500 uppercase tracking-wider">#</th>
            <th className="py-3 text-left text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Coin</th>
            <th className="py-3 text-left text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Trend</th>
            <th className="py-3 text-right text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Trades</th>
            <th className="py-3 text-right text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Volume</th>
            <th className="py-3 text-right text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Buy Vol</th>
            <th className="py-3 text-right text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Sell Vol</th>
            <th className="py-3 text-right text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Liq</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const sparkData = sparklineData?.sparklines?.[r.coin]?.volume ?? [];
            const isUp = sparkData.length > 1 && sparkData[sparkData.length - 1] >= sparkData[0];
            
            return (
              <tr key={r.coin} className="border-b border-qn-grey-50 last:border-b-0 hover:bg-qn-grey-50/50">
                <td className="py-3 text-qn-grey-400 font-medium">{idx + 1}</td>
                <td className="py-3 font-semibold text-qn-grey-900">{r.coin}</td>
                <td className="py-3">
                  <Sparkline 
                    data={sparkData}
                    color={isUp ? "#3EE148" : "#7646E7"}
                    fillColor={isUp ? "#3EE148" : "#7646E7"}
                    width={64}
                    height={20}
                  />
                </td>
                <td className="py-3 text-right font-mono tabular-nums text-qn-grey-700">{r.tradesCount.toLocaleString()}</td>
                <td className="py-3 text-right font-semibold font-mono tabular-nums text-qn-grey-900">{fmtUsd(r.volumeUsd)}</td>
                <td className="py-3 text-right font-mono tabular-nums qn-buy font-medium">{fmtUsd(r.buyVolumeUsd)}</td>
                <td className="py-3 text-right font-mono tabular-nums qn-sell font-medium">{fmtUsd(r.sellVolumeUsd)}</td>
                <td className="py-3 text-right">
                  {r.liqCount > 0 ? (
                    <span className="text-orange-500 font-medium">{r.liqCount}</span>
                  ) : (
                    <span className="text-qn-grey-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}