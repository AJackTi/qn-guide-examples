import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  DbLiquidation,
  LiquidationFilters,
} from "@/types/liquidation";

interface UseLiquidationsProps {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: LiquidationFilters;
}

export function useLiquidations({
  page,
  pageSize,
  sortBy = 'timestamp',
  sortOrder = 'desc',
  filters,
}: UseLiquidationsProps) {
  return useQuery({
    queryKey: ["liquidations", page, pageSize, sortBy, sortOrder, filters],
    queryFn: async () => {
      let query = supabase
        .from("liquidations")
        .select("*")
        .order(sortBy, { ascending: sortOrder === "asc" })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filters?.dateRange) {
        query = query
          .gte("timestamp", filters.dateRange[0].toISOString())
          .lte("timestamp", filters.dateRange[1].toISOString());
      }

      if (filters?.assets?.length) {
        query = query.or(
          `collateral_asset_symbol.in.(${filters.assets.join(
            ","
          )}),debt_asset_symbol.in.(${filters.assets.join(",")})`
        );
      }

      if (filters?.addresses?.length) {
        query = query.or(
          `liquidator_address.in.(${filters.addresses.join(
            ","
          )}),liquidated_wallet.in.(${filters.addresses.join(",")})`
        );
      }

      const { data, error, count } = await query.returns<DbLiquidation[]>();

      if (error) {
        throw error;
      }

      const transformedData = data.map((row) => ({
        id: row.id,
        liquidator_address: row.liquidator_address,
        liquidated_wallet: row.liquidated_wallet,
        collateral_asset: {
          address: row.collateral_asset,
          name: row.collateral_asset_name,
          symbol: row.collateral_asset_symbol,
          price: row.collateral_asset_price,
          amount: row.collateral_seized_amount,
        },
        debt_asset: {
          address: row.debt_asset,
          name: row.debt_asset_name,
          symbol: row.debt_asset_symbol,
          price: row.debt_asset_price,
          amount: row.debt_repaid_amount,
        },
        transaction_hash: row.transaction_hash,
        block_number: row.block_number,
        receive_a_token: row.receive_a_token,
        timestamp: row.timestamp,
      }));

      return {
        data: transformedData,
        count,
      };
    },
    refetchInterval: 60000,
  });
}