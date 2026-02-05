import prisma from "@/lib/prisma";

export const runtime = "nodejs";

function num(v: string | null, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const coin = (url.searchParams.get("coin") || "BTC").toUpperCase();
  const windowMin = num(url.searchParams.get("windowMin"), 15);
  const thresholdUsd = num(url.searchParams.get("thresholdUsd"), 50_000);

  const sinceMs = BigInt(Date.now() - windowMin * 60_000);

  const rows = await prisma.tradeEvent.findMany({
    where: {
      coin,
      tradeTime: { gte: sinceMs },
      notionalUsd: { gte: thresholdUsd }
    },
    orderBy: [{ notionalUsd: "desc" }, { tradeTime: "desc" }],
    take: 25
  });

  return Response.json({
    rows: rows.map((r) => ({
      id: r.id,
      coin: r.coin,
      side: r.side,
      notionalUsd: Number(r.notionalUsd),
      px: Number(r.px),
      sz: Number(r.sz),
      tid: r.tid ? r.tid.toString() : null,
      hash: r.hash ?? null,
      tradeTime: Number(r.tradeTime),
      isLiquidation: r.isLiquidation
    }))
  });
}