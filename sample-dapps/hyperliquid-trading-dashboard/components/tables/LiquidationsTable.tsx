"use client";

import useSWR from "swr";
import { fmtTime, fmtUsd } from "@/lib/format";
import { qs } from "@/lib/query";
import { TimeRangeMinutes } from "@/components/TimeRangePills";

type Row = {
  id: string;
  coin: string;
  side: "B" | "A";
  notionalUsd: number;
  px: number;
  sz: number;
  tid: string | null;
  tradeTime: number;
  hash?: string | null;
  liquidatedUser?: string | null;
  markPx?: string | null;
  method?: string | null;
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
      className="hover:text-qn-green-500 transition-colors"
      title="View on Hyperliquid Explorer"
    >
      {children}
      <svg className="inline-block ml-1 w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

export default function LiquidationsTable(props: { windowMin: TimeRangeMinutes }) {
  const key = `/api/liquidations?${qs({ windowMin: props.windowMin })}`;
  const { data, error, isLoading } = useSWR<{ rows: Row[] }>(key, fetcher, { refreshInterval: 2000 });

  if (error) return <div className="text-sm text-red-500 py-4">Failed to load</div>;
  if (isLoading) return <div className="text-sm text-qn-grey-400 py-4">Loading…</div>;

  const rows = data?.rows ?? [];

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-qn-grey-500">No liquidations in this window</p>
        <p className="text-xs text-qn-grey-400 mt-1">Check back when volatility picks up</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "80px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-qn-grey-100">
            <th className="py-3 text-left text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Time</th>
            <th className="py-3 text-left text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Coin</th>
            <th className="py-3 text-left text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Side</th>
            <th className="py-3 text-left text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Notional</th>
            <th className="py-3 text-left text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Liquidated User</th>
            <th className="py-3 text-left text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Mark Px</th>
            <th className="py-3 text-left text-xs font-medium text-qn-grey-500 uppercase tracking-wider">Method</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isBuy = r.side === "B";
            return (
              <tr key={r.id} className="border-b border-qn-grey-50 last:border-b-0 hover:bg-qn-grey-50/50">
                <td className="py-3 whitespace-nowrap text-qn-grey-500">
                  <ExplorerLink hash={r.hash}>
                    {fmtTime(r.tradeTime)}
                  </ExplorerLink>
                </td>
                <td className="py-3 font-semibold text-qn-grey-900">{r.coin}</td>
                <td className="py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isBuy ? "qn-buy-bg" : "qn-sell-bg"
                  }`}>
                    {isBuy ? "BUY" : "SELL"}
                  </span>
                </td>
                <td className="py-3 text-left font-semibold font-mono tabular-nums">{fmtUsd(r.notionalUsd)}</td>
                <td className="py-3 font-mono text-xs text-qn-grey-500">
                  {r.liquidatedUser ? (
                    <a 
                      href={`https://app.hyperliquid.xyz/explorer/address/${r.liquidatedUser}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-qn-green-500 transition-colors"
                      title="View user on Hyperliquid Explorer"
                    >
                      {`${r.liquidatedUser.slice(0, 6)}…${r.liquidatedUser.slice(-4)}`}
                      <svg className="inline-block ml-1 w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : "—"}
                </td>
                <td className="py-3 text-left font-mono tabular-nums text-qn-grey-500">{r.markPx ?? "—"}</td>
                <td className="py-3 text-qn-grey-500 capitalize">{r.method ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}