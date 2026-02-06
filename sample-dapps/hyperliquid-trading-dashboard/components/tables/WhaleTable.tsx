"use client";

import useSWR from "swr";
import { fmtTime, fmtUsd, fmtNum } from "@/lib/format";
import { qs } from "@/lib/query";
import { TimeRangeMinutes } from "@/components/TimeRangePills";

type WhaleRow = {
  id: string;
  coin: string;
  side: "B" | "A";
  notionalUsd: number;
  px: number;
  sz: number;
  tid: string | null;
  tradeTime: number;
  hash?: string | null;
  isLiquidation: boolean;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ExplorerLink({ hash, children }: { hash: string | null | undefined; children: React.ReactNode }) {
  if (!hash) return <>{children}</>;
  
  const url = `https://app.hyperliquid.xyz/explorer/tx/${hash}`;
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="hover:text-qn-green-500 transition-colors inline-flex items-center gap-1"
      title="View on Hyperliquid Explorer"
    >
      {children}
      <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

export default function WhaleTable(props: {
  coin: string;
  windowMin: TimeRangeMinutes;
  thresholdUsd: number;
  limit?: number;
}) {
  const limit = props.limit ?? 5;
  
  const key = `/api/whales?${qs({
    coin: props.coin,
    windowMin: props.windowMin,
    thresholdUsd: props.thresholdUsd
  })}`;

  const { data, error, isLoading } = useSWR<{ rows: WhaleRow[] }>(key, fetcher, {
    refreshInterval: 2000
  });

  if (error) return <div className="text-sm text-red-500 py-4">Failed to load</div>;
  if (isLoading) return <div className="text-sm text-qn-grey-400 py-4">Loading…</div>;

  const rows = (data?.rows ?? []).slice(0, limit);

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-qn-grey-500">No whale trades yet</p>
        <p className="text-xs text-qn-grey-400 mt-1">Waiting for large trades…</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((r, idx) => {
        const isBuy = r.side === "B";
        return (
          <div 
            key={r.id} 
            className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-qn-grey-50 border border-qn-grey-100"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-qn-grey-400 w-4">{idx + 1}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isBuy ? "qn-buy-bg" : "qn-sell-bg"
                  }`}>
                    {isBuy ? "BUY" : "SELL"}
                  </span>
                  {r.isLiquidation && (
                    <span className="text-[10px] text-orange-500 font-medium bg-orange-50 px-1.5 py-0.5 rounded-full">LIQ</span>
                  )}
                </div>
                <p className="text-xs text-qn-grey-500 mt-1">
                  <ExplorerLink hash={r.hash}>
                    {fmtTime(r.tradeTime)}
                  </ExplorerLink>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-qn-grey-900">{fmtUsd(r.notionalUsd)}</p>
              <p className="text-xs text-qn-grey-500">
                {fmtNum(r.sz)} @ ${fmtNum(r.px)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}