import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import prisma from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

const GRPC_ENDPOINT = process.env.GRPC_ENDPOINT;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const WHALE_MIN_USD = Number(process.env.WHALE_MIN_USD ?? 50_000);
const STORE_RETENTION_MIN = Number(process.env.STORE_RETENTION_MIN ?? 120);

const TRENDING_COIN_WHITELIST = (process.env.TRENDING_COIN_WHITELIST ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function must(v: string | undefined, name: string) {
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

must(GRPC_ENDPOINT, "GRPC_ENDPOINT");
must(AUTH_TOKEN, "AUTH_TOKEN");

const protoPath = path.join(process.cwd(), "proto", "streaming.proto");
const pkgDef = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const hyperliquid: any = (grpc.loadPackageDefinition(pkgDef) as any).hyperliquid;

function md() {
  const m = new grpc.Metadata();
  m.add("x-token", AUTH_TOKEN!);
  return m;
}

function num(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
}

function bucketStartFromMs(ms: number) {
  const minute = Math.floor(ms / 60_000) * 60_000;
  return new Date(minute);
}

type AggDelta = {
  bucketStart: Date;
  coin: string;
  tradesCount: number;
  volumeUsd: number;
  buyCount: number;
  buyVolumeUsd: number;
  sellCount: number;
  sellVolumeUsd: number;
  liqCount: number;
  liqVolumeUsd: number;
};

type EventRow = {
  tid?: bigint;
  hash?: string;
  coin: string;
  side: string;
  px: number;
  sz: number;
  notionalUsd: number;
  crossed: boolean;
  tradeTime: bigint;
  isLiquidation: boolean;
  liquidation: any | null;
  raw: any;
};

const pendingAgg = new Map<string, AggDelta>();
const pendingEvents: EventRow[] = [];
let flushing = false;

function addAgg(d: AggDelta) {
  const key = `${d.bucketStart.toISOString()}|${d.coin}`;
  const prev = pendingAgg.get(key);
  if (!prev) {
    pendingAgg.set(key, d);
    return;
  }
  prev.tradesCount += d.tradesCount;
  prev.volumeUsd += d.volumeUsd;
  prev.buyCount += d.buyCount;
  prev.buyVolumeUsd += d.buyVolumeUsd;
  prev.sellCount += d.sellCount;
  prev.sellVolumeUsd += d.sellVolumeUsd;
  prev.liqCount += d.liqCount;
  prev.liqVolumeUsd += d.liqVolumeUsd;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function upsertAggWithRetry(a: AggDelta, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.tradeAggMinute.upsert({
        where: { bucketStart_coin: { bucketStart: a.bucketStart, coin: a.coin } },
        create: {
          bucketStart: a.bucketStart,
          coin: a.coin,
          tradesCount: a.tradesCount,
          volumeUsd: new Decimal(a.volumeUsd),
          buyCount: a.buyCount,
          buyVolumeUsd: new Decimal(a.buyVolumeUsd),
          sellCount: a.sellCount,
          sellVolumeUsd: new Decimal(a.sellVolumeUsd),
          liqCount: a.liqCount,
          liqVolumeUsd: new Decimal(a.liqVolumeUsd)
        },
        update: {
          tradesCount: { increment: a.tradesCount },
          volumeUsd: { increment: new Decimal(a.volumeUsd) },
          buyCount: { increment: a.buyCount },
          buyVolumeUsd: { increment: new Decimal(a.buyVolumeUsd) },
          sellCount: { increment: a.sellCount },
          sellVolumeUsd: { increment: new Decimal(a.sellVolumeUsd) },
          liqCount: { increment: a.liqCount },
          liqVolumeUsd: { increment: new Decimal(a.liqVolumeUsd) }
        }
      });
      return;
    } catch (e: any) {
      const isDeadlock = e.message?.includes("deadlock") || e.code === "40P01";
      const isConnExhausted = e.message?.includes("connection slots");
      if ((isDeadlock || isConnExhausted) && attempt < retries) {
        await sleep(50 * attempt + Math.random() * 50);
        continue;
      }
      throw e;
    }
  }
}

async function flush() {
  if (flushing) return;
  flushing = true;

  const agg = Array.from(pendingAgg.values());
  pendingAgg.clear();

  const events = pendingEvents.splice(0, pendingEvents.length);

  try {
    for (const a of agg) {
      await upsertAggWithRetry(a);
    }

    if (events.length) {
      await prisma.tradeEvent.createMany({
        data: events.map((e) => ({
          tid: e.tid,
          hash: e.hash,
          coin: e.coin,
          side: e.side,
          px: new Decimal(e.px),
          sz: new Decimal(e.sz),
          notionalUsd: new Decimal(e.notionalUsd),
          crossed: e.crossed,
          tradeTime: e.tradeTime,
          isLiquidation: e.isLiquidation,
          liquidation: e.liquidation,
          raw: e.raw
        })),
        skipDuplicates: false
      });
    }
  } finally {
    flushing = false;
  }
}

async function cleanup() {
  const cutoffMs = BigInt(Date.now() - STORE_RETENTION_MIN * 60_000);
  const cutoffDate = new Date(Date.now() - STORE_RETENTION_MIN * 60_000);

  await prisma.tradeEvent.deleteMany({
    where: { tradeTime: { lt: cutoffMs } }
  });

  await prisma.tradeAggMinute.deleteMany({
    where: { bucketStart: { lt: cutoffDate } }
  });
}

async function main() {
  const client = new hyperliquid.Streaming(
    GRPC_ENDPOINT!,
    grpc.credentials.createSsl(),
    { "grpc.max_receive_message_length": 100 * 1024 * 1024 }
  );

  await new Promise<void>((resolve, reject) => {
    client.Ping({ count: 1 }, md(), (err: any, res: any) => {
      if (err) return reject(err);
      console.log("Ping ok:", res);
      resolve();
    });
  });

  const stream = client.StreamData(md());

  stream.on("data", (msg: any) => {
    if (msg.pong) return;

    const raw = msg.data?.data;
    if (!raw) return;

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const events = payload.events;
    if (!Array.isArray(events) || events.length === 0) return;

    for (const ev of events) {
      if (!Array.isArray(ev) || ev.length < 2) continue;
      const trade = ev[1];
      if (!trade || typeof trade !== "object") continue;

      if (trade.crossed !== true) continue;

      const coin = String(trade.coin ?? "");
      if (!coin) continue;

      const allowTrending =
        TRENDING_COIN_WHITELIST.length === 0 || TRENDING_COIN_WHITELIST.includes(coin);

      const px = num(trade.px);
      const sz = num(trade.sz);
      if (!Number.isFinite(px) || !Number.isFinite(sz)) continue;

      const notionalUsd = px * sz;
      if (!Number.isFinite(notionalUsd)) continue;

      const tradeTimeMs = num(trade.time);
      if (!Number.isFinite(tradeTimeMs)) continue;

      const side = String(trade.side ?? "");
      const isBuy = side === "B";
      const isSell = side === "A";

      const isLiq = !!trade.liquidation;

      if (allowTrending) {
        const bucketStart = bucketStartFromMs(tradeTimeMs);
        addAgg({
          bucketStart,
          coin,
          tradesCount: 1,
          volumeUsd: notionalUsd,
          buyCount: isBuy ? 1 : 0,
          buyVolumeUsd: isBuy ? notionalUsd : 0,
          sellCount: isSell ? 1 : 0,
          sellVolumeUsd: isSell ? notionalUsd : 0,
          liqCount: isLiq ? 1 : 0,
          liqVolumeUsd: isLiq ? notionalUsd : 0
        });
      }

      const storeEvent = isLiq || notionalUsd >= WHALE_MIN_USD;
      if (storeEvent) {
        pendingEvents.push({
          tid: trade.tid ? BigInt(trade.tid) : undefined,
          hash: trade.hash ? String(trade.hash) : undefined,
          coin,
          side,
          px,
          sz,
          notionalUsd,
          crossed: true,
          tradeTime: BigInt(Math.floor(tradeTimeMs)),
          isLiquidation: isLiq,
          liquidation: trade.liquidation ?? null,
          raw: trade
        });
      }
    }
  });

  stream.on("error", (e: any) => console.error("Stream error:", e.code, e.message));
  stream.on("end", () => console.log("Stream ended"));

  const coinFilter = (process.env.COIN_FILTER ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  stream.write({
    subscribe: {
      stream_type: "TRADES",
      start_block: 0,
      filters: coinFilter.length ? { coin: { values: coinFilter } } : {}
    }
  });

  setInterval(() => stream.write({ ping: { timestamp: Date.now() } }), 25_000);

  setInterval(() => {
    flush().catch((e) => console.error("Flush failed:", e.message));
  }, 1000);

  setInterval(() => {
    cleanup().catch((e) => console.error("Cleanup failed:", e.message));
  }, 60_000);

  console.log("Ingester running");
  console.log("WHALE_MIN_USD:", WHALE_MIN_USD);
  console.log("STORE_RETENTION_MIN:", STORE_RETENTION_MIN);
  console.log("COIN_FILTER:", coinFilter.length ? coinFilter.join(",") : "(all)");
  console.log(
    "TRENDING_COIN_WHITELIST:",
    TRENDING_COIN_WHITELIST.length ? TRENDING_COIN_WHITELIST.join(",") : "(all)"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});