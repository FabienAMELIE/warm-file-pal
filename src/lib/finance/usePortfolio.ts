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

export const REAL_ESTATE_TYPES = ["Immobilier", "SCPI"];
const STORAGE_KEY = "patrimonia:include-real-estate";

/** Case à cocher persistante : inclure ou non l'immobilier dans les statistiques. */
export function useIncludeRealEstate() {
  const [include, setInclude] = useState(false);
  useEffect(() => {
    setInclude(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);
  const update = (v: boolean) => {
    setInclude(v);
    window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  };
  return { include, setInclude: update };
}

function withoutRealEstate(data: PortfolioData): PortfolioData {
  const excluded = new Set(
    data.assets.filter((a) => REAL_ESTATE_TYPES.includes(a.asset_type)).map((a) => a.id),
  );
  if (!excluded.size) return data;
  return {
    ...data,
    assets: data.assets.filter((a) => !excluded.has(a.id)),
    transactions: data.transactions.filter((t) => !t.asset_id || !excluded.has(t.asset_id)),
    valuations: data.valuations.filter((v) => !excluded.has(v.asset_id)),
  };
}

export function usePortfolio(
  userId: string | undefined,
  options?: { includeRealEstate?: boolean },
) {
  const includeRealEstate = options?.includeRealEstate ?? true;
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["portfolio", userId],
    queryFn: () => fetchAll(userId!),
    enabled: !!userId,
  });

  const raw = query.data ?? EMPTY;
  const data = useMemo(
    () => (includeRealEstate ? raw : withoutRealEstate(raw)),
    [raw, includeRealEstate],
  );
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
