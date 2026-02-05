import prisma from "@/lib/prisma";

export const runtime = "nodejs";

function num(v: string | null, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const windowMin = num(url.searchParams.get("windowMin"), 15);
  const sinceMs = BigInt(Date.now() - windowMin * 60_000);

  const rows = await prisma.tradeEvent.findMany({
    where: {
      isLiquidation: true,
      tradeTime: { gte: sinceMs }
    },
    orderBy: [{ notionalUsd: "desc" }, { tradeTime: "desc" }],
    take: 50
  });

  return Response.json({
    rows: rows.map((r) => {
      const liq = (r.liquidation as any) || null;
      return {
        id: r.id,
        coin: r.coin,
        side: r.side,
        notionalUsd: Number(r.notionalUsd),
        px: Number(r.px),
        sz: Number(r.sz),
        tid: r.tid ? r.tid.toString() : null,
        hash: r.hash ?? null,
        tradeTime: Number(r.tradeTime),
        liquidatedUser: liq?.liquidatedUser ?? null,
        markPx: liq?.markPx ?? null,
        method: liq?.method ?? null
      };
    })
  });
}