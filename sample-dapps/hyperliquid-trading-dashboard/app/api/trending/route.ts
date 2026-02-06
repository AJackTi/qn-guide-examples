import prisma from "@/lib/prisma";

export const runtime = "nodejs";

function num(v: string | null, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const windowMin = num(url.searchParams.get("windowMin"), 15);

  const since = new Date(Date.now() - windowMin * 60_000);

  const grouped = await prisma.tradeAggMinute.groupBy({
    by: ["coin"],
    where: {
      bucketStart: { gte: since }
    },
    _sum: {
      tradesCount: true,
      volumeUsd: true,
      buyVolumeUsd: true,
      sellVolumeUsd: true,
      liqCount: true
    },
    orderBy: {
      _sum: { tradesCount: "desc" }
    },
    take: 10
  });

  const rows = grouped.map((g) => ({
    coin: g.coin,
    tradesCount: g._sum.tradesCount ?? 0,
    volumeUsd: Number(g._sum.volumeUsd ?? 0),
    buyVolumeUsd: Number(g._sum.buyVolumeUsd ?? 0),
    sellVolumeUsd: Number(g._sum.sellVolumeUsd ?? 0),
    liqCount: g._sum.liqCount ?? 0
  }));

  return Response.json({ rows });
}
