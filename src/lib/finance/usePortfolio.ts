import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Account,
  Asset,
  Goal,
  JournalEntry,
  PortfolioData,
  Profile,
  Transaction,
  Valuation,
} from "./types";
import { computeHistory, computePositions, computeSummary } from "./calc";

async function fetchAll(userId: string): Promise<PortfolioData> {
  const [profile, accounts, assets, transactions, valuations, goals, journal] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("accounts").select("*").order("created_at"),
    supabase.from("assets").select("*").order("created_at"),
    supabase.from("transactions").select("*").order("date", { ascending: true }),
    supabase.from("valuations").select("*").order("date", { ascending: true }),
    supabase.from("goals").select("*").order("created_at"),
    supabase.from("journal_entries").select("*").order("date", { ascending: false }),
  ]);

  return {
    profile: (profile.data as Profile | null) ?? null,
    accounts: (accounts.data ?? []) as Account[],
    assets: (assets.data ?? []) as Asset[],
    transactions: (transactions.data ?? []) as Transaction[],
    valuations: (valuations.data ?? []) as Valuation[],
    goals: (goals.data ?? []) as Goal[],
    journal: (journal.data ?? []) as JournalEntry[],
  };
}

const EMPTY: PortfolioData = {
  profile: null,
  accounts: [],
  assets: [],
  transactions: [],
  valuations: [],
  goals: [],
  journal: [],
};

export function usePortfolio(userId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["portfolio", userId],
    queryFn: () => fetchAll(userId!),
    enabled: !!userId,
  });

  const data = query.data ?? EMPTY;
  const base = data.profile?.base_currency ?? "EUR";

  const derived = useMemo(() => {
    const { positions, totalValue } = computePositions(data, base);
    return {
      positions,
      totalValue,
      summary: computeSummary(positions, data),
      history: computeHistory(data, base),
    };
  }, [data, base]);

  return {
    ...query,
    data,
    base,
    ...derived,
    isEmpty: !query.isLoading && data.assets.length === 0 && data.transactions.length === 0,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
  };
}
