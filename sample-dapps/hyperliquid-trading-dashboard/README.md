# Hyperliquid Trading Dashboard

A real-time trading analytics dashboard for Hyperliquid DEX built using Quicknode [HyperCore gRPC](https://www.quicknode.com/docs/hyperliquid/grpc-api?utm_source=qn-github&utm_campaign=hyperliquid_trading_dash). Track whales, monitor liquidations, and identify trending trading activity with live data streaming and aggregation.

## Features

### 📊 Three Main Views

1. **Whales** - Track large traders and their activity
   - Monitor high-value trades above configurable thresholds
   - Filter by trading side and time range

2. **Liquidations** - Monitor forced closures and liquidation events
   - Track liquidation events in real-time

3. **Trending** - Identify trending coins and trading patterns
   - See top trading volumes by asset
   - Time-series analysis of trading activity

## Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with Node.js
- **Data Streaming**: [gRPC via Quicknode HyperCore]
- **Database**: PostgreSQL with Prisma ORM
- **Data Ingestion**: Worker process for real-time data streaming

### Data Flow

```
HyperCore gRPC Stream
        ↓
   Worker Process (ingest.ts)
        ↓
   PostgreSQL Database
   ├─ TradeEvent (raw trades)
   └─ TradeAggMinute (aggregated data)
        ↓
   API Routes (/api/*)
        ↓
   React Components (Dashboard UI)
```

## Prerequisites

- Node.js 20+ installed
- A PostgreSQL instance, you can use a platform like [Aiven](https://aiven.io/) to spin up a hosted instance. We'll need this for `DATABASE_URL`.
- [Quicknode account](https://www.quicknode.com/docs/hyperliquid/grpc-api?utm_source=qn-github&utm_campaign=hyperliquid_trading_dash) with Hypercore gRPC endpoint. We'll need this for `GRPC_ENDPOINT` and `AUTH_TOKEN`.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git

cd qn-guide-examples/sample-dapps/hyperliquid-trading-dashboard

npm install
```

### 2. Start PostgreSQL

If you are using a hosted PostgreSQL instance, skip this step.

```bash
npm run db:up
```

### 3. Configure environment

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hypercore"
export GRPC_ENDPOINT="your-endpoint.hype-mainnet.quiknode.pro:10000"
export AUTH_TOKEN="your_quicknode_token"
```

> Note: Just paste these with values in two terminal windows. You'll need one window for the Next.js app and another for the database worker.

### 4. Initialize database

```bash
npm run db:push
```

### 5. Start the worker

```bash
npm run worker
```

This starts the worker process that:
- Connects to Quicknode HyperCore gRPC
- Streams live trading events
- Stores raw trades and aggregated data in PostgreSQL
- Tracks whale activity and liquidations

You should see:

```bash
Ping ok: { count: 1 }
Ingester running
WHALE_MIN_USD: 50000
```

### 6. Start the dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server (http://localhost:3000) |
| `npm run build` | Build optimized production bundle |
| `npm start` | Start production server |
| `npm run worker` | Run data ingestion worker process |
| `npm run db:up` | Start PostgreSQL container |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:push` | Sync Prisma schema with database |
| `npm run db:studio` | Open Prisma Studio UI for database inspection |
| `npm run lint` | Run ESLint |

## Database Schema

### TradeEvent
Stores raw trading events from the gRPC stream.
- `coin`: Trading pair
- `side`: BUY or SELL
- `px`: Price
- `sz`: Size
- `notionalUsd`: Trade value in USD
- `isLiquidation`: Whether this is a liquidation
- `liquidation`: Liquidation details (if applicable)

### TradeAggMinute
Minute-level aggregations for performance.
- Tracks volume, trade counts, buy/sell splits
- Optimized for dashboard queries

