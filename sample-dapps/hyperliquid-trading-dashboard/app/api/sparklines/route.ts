import prisma from "@/lib/prisma";

export const runtime = "nodejs";

function num(v: string | null, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const windowMin = num(url.searchParams.get("windowMin"), 15);
  const coins = (url.searchParams.get("coins") || "BTC,ETH,SOL")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 10);

  const since = new Date(Date.now() - windowMin * 60_000);

  const rows = await prisma.tradeAggMinute.findMany({
    where: {
      bucketStart: { gte: since },
      coin: { in: coins }
    },
    orderBy: { bucketStart: "asc" },
    select: {
      bucketStart: true,
      coin: true,
      volumeUsd: true,
      tradesCount: true
    }
  });

  const sparklines: Record<string, { volume: number[]; trades: number[]; timestamps: string[] }> = {};

  for (const coin of coins) {
    sparklines[coin] = { volume: [], trades: [], timestamps: [] };
  }

  for (const row of rows) {
    const coin = row.coin;
    if (sparklines[coin]) {
      sparklines[coin].volume.push(Number(row.volumeUsd));
      sparklines[coin].trades.push(row.tradesCount);
      sparklines[coin].timestamps.push(row.bucketStart.toISOString());
    }
  }

  return Response.json({ sparklines });
}