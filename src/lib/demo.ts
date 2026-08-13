import { supabase } from "@/integrations/supabase/client";

/** Génère un jeu de données de démonstration réaliste sur plusieurs années. */
export async function seedDemoData(userId: string) {
  const accounts = [
    { name: "PEA Bourse Direct", type: "PEA", institution: "Bourse Direct", currency: "EUR" },
    { name: "CTO Interactive", type: "CTO", institution: "IBKR", currency: "EUR" },
    { name: "Compte crypto", type: "Compte crypto", institution: "Kraken", currency: "EUR" },
    { name: "Immobilier locatif", type: "Immobilier", institution: null, currency: "EUR" },
    { name: "Livret A", type: "Compte bancaire", institution: "Banque Populaire", currency: "EUR" },
  ];

  const { data: accRows, error: accErr } = await supabase
    .from("accounts")
    .insert(accounts.map((a) => ({ ...a, user_id: userId, is_demo: true })))
    .select();
  if (accErr) throw accErr;
  const acc = (name: string) => accRows?.find((a) => a.name === name)?.id ?? null;

  const assets = [
    {
      name: "ETF MSCI World",
      ticker: "IWDA",
      asset_type: "ETF",
      sector: "Diversifié",
      geography: "Monde",
      account_id: acc("PEA Bourse Direct"),
      pricing_mode: "unit",
      current_price: 102.4,
    },
    {
      name: "ETF S&P 500",
      ticker: "CSPX",
      asset_type: "ETF",
      sector: "Diversifié",
      geography: "États-Unis",
      account_id: acc("CTO Interactive"),
      pricing_mode: "unit",
      current_price: 528.0,
    },
    {
      name: "Air Liquide",
      ticker: "AI.PA",
      asset_type: "Actions",
      sector: "Industrie",
      geography: "France",
      account_id: acc("PEA Bourse Direct"),
      pricing_mode: "unit",
      current_price: 172.5,
    },
    {
      name: "Bitcoin",
      ticker: "BTC",
      asset_type: "Crypto",
      sector: "Non renseigné",
      geography: "Monde",
      account_id: acc("Compte crypto"),
      pricing_mode: "unit",
      current_price: 61000,
    },
    {
      name: "Appartement Lille",
      ticker: null,
      asset_type: "Immobilier",
      sector: "Immobilier",
      geography: "France",
      account_id: acc("Immobilier locatif"),
      pricing_mode: "value",
      current_price: 168000,
    },
    {
      name: "Livret A",
      ticker: null,
      asset_type: "Livret",
      sector: "Non renseigné",
      geography: "France",
      account_id: acc("Livret A"),
      pricing_mode: "value",
      current_price: 12450,
    },
  ];

  const { data: assetRows, error: assetErr } = await supabase
    .from("assets")
    .insert(assets.map((a) => ({ ...a, user_id: userId, currency: "EUR", is_demo: true })))
    .select();
  if (assetErr) throw assetErr;
  const id = (name: string) => assetRows?.find((a) => a.name === name)?.id ?? null;
  const accountOf = (name: string) => assetRows?.find((a) => a.name === name)?.account_id ?? null;

  type Tx = {
    name: string;
    date: string;
    type: string;
    quantity?: number;
    unit_price?: number;
    amount: number;
    fees?: number;
    notes?: string;
  };

  const txs: Tx[] = [
    { name: "ETF MSCI World", date: "2021-03-15", type: "Achat", quantity: 60, unit_price: 68.2, amount: 4092, fees: 3 },
    { name: "ETF MSCI World", date: "2021-09-10", type: "Achat", quantity: 40, unit_price: 74.5, amount: 2980, fees: 3 },
    { name: "ETF MSCI World", date: "2022-06-20", type: "Achat", quantity: 55, unit_price: 66.9, amount: 3679.5, fees: 3 },
    { name: "ETF MSCI World", date: "2023-04-05", type: "Achat", quantity: 45, unit_price: 78.3, amount: 3523.5, fees: 3 },
    { name: "ETF MSCI World", date: "2024-05-14", type: "Achat", quantity: 35, unit_price: 92.1, amount: 3223.5, fees: 3 },
    { name: "ETF S&P 500", date: "2022-01-18", type: "Achat", quantity: 6, unit_price: 402, amount: 2412, fees: 5 },
    { name: "ETF S&P 500", date: "2023-08-22", type: "Achat", quantity: 5, unit_price: 435, amount: 2175, fees: 5 },
    { name: "ETF S&P 500", date: "2025-02-11", type: "Achat", quantity: 4, unit_price: 505, amount: 2020, fees: 5 },
    { name: "Air Liquide", date: "2021-06-02", type: "Achat", quantity: 25, unit_price: 141.2, amount: 3530, fees: 4 },
    { name: "Air Liquide", date: "2023-01-16", type: "Achat", quantity: 15, unit_price: 152.8, amount: 2292, fees: 4 },
    { name: "Air Liquide", date: "2022-05-20", type: "Dividende", amount: 71 },
    { name: "Air Liquide", date: "2023-05-19", type: "Dividende", amount: 118 },
    { name: "Air Liquide", date: "2024-05-17", type: "Dividende", amount: 130 },
    { name: "Air Liquide", date: "2025-05-16", type: "Dividende", amount: 138 },
    { name: "Bitcoin", date: "2021-11-08", type: "Achat", quantity: 0.05, unit_price: 55000, amount: 2750, fees: 15 },
    { name: "Bitcoin", date: "2023-03-12", type: "Achat", quantity: 0.06, unit_price: 21000, amount: 1260, fees: 8 },
    { name: "Bitcoin", date: "2024-10-02", type: "Vente", quantity: 0.02, unit_price: 58000, amount: 1160, fees: 10 },
    { name: "Appartement Lille", date: "2020-09-30", type: "Achat", quantity: 1, unit_price: 142000, amount: 142000, fees: 9800, notes: "Frais de notaire inclus" },
    { name: "Appartement Lille", date: "2023-07-05", type: "Loyer", amount: 7200, notes: "Loyers nets 2023" },
    { name: "Appartement Lille", date: "2024-07-05", type: "Loyer", amount: 7440 },
    { name: "Appartement Lille", date: "2025-07-05", type: "Loyer", amount: 7620 },
    { name: "Livret A", date: "2021-01-04", type: "Dépôt", quantity: 1, unit_price: 8000, amount: 8000 },
    { name: "Livret A", date: "2023-02-01", type: "Dépôt", quantity: 0, unit_price: 0, amount: 3000 },
    { name: "Livret A", date: "2024-12-31", type: "Intérêt", amount: 330 },
    { name: "Livret A", date: "2025-12-31", type: "Intérêt", amount: 375 },
  ];

  const { error: txErr } = await supabase.from("transactions").insert(
    txs.map((t) => ({
      user_id: userId,
      asset_id: id(t.name),
      account_id: accountOf(t.name),
      date: t.date,
      type: t.type,
      quantity: t.quantity ?? null,
      unit_price: t.unit_price ?? null,
      amount: t.amount,
      fees: t.fees ?? 0,
      currency: "EUR",
      notes: t.notes ?? null,
      is_demo: true,
    })),
  );
  if (txErr) throw txErr;

  const valuations: Array<[string, string, number]> = [
    ["ETF MSCI World", "2021-12-31", 76.4],
    ["ETF MSCI World", "2022-12-31", 70.1],
    ["ETF MSCI World", "2023-12-31", 82.6],
    ["ETF MSCI World", "2024-12-31", 96.2],
    ["ETF MSCI World", "2025-12-31", 101.1],
    ["ETF S&P 500", "2022-12-31", 380],
    ["ETF S&P 500", "2023-12-31", 448],
    ["ETF S&P 500", "2024-12-31", 512],
    ["ETF S&P 500", "2025-12-31", 524],
    ["Air Liquide", "2021-12-31", 153.4],
    ["Air Liquide", "2022-12-31", 132.6],
    ["Air Liquide", "2023-12-31", 176.5],
    ["Air Liquide", "2024-12-31", 162.3],
    ["Air Liquide", "2025-12-31", 170.2],
    ["Bitcoin", "2021-12-31", 41000],
    ["Bitcoin", "2022-12-31", 15500],
    ["Bitcoin", "2023-12-31", 38500],
    ["Bitcoin", "2024-12-31", 89000],
    ["Bitcoin", "2025-12-31", 63000],
    ["Appartement Lille", "2021-12-31", 150000],
    ["Appartement Lille", "2022-12-31", 156000],
    ["Appartement Lille", "2023-12-31", 159000],
    ["Appartement Lille", "2024-12-31", 164000],
    ["Appartement Lille", "2025-12-31", 167000],
    ["Livret A", "2021-12-31", 8060],
    ["Livret A", "2022-12-31", 8220],
    ["Livret A", "2023-12-31", 11450],
    ["Livret A", "2024-12-31", 11900],
    ["Livret A", "2025-12-31", 12300],
  ];

  const { error: valErr } = await supabase.from("valuations").insert(
    valuations.map(([name, date, price]) => ({
      user_id: userId,
      asset_id: id(name)!,
      date,
      price,
      currency: "EUR",
      is_demo: true,
    })),
  );
  if (valErr) throw valErr;

  await supabase.from("goals").insert([
    { user_id: userId, name: "Atteindre 250 000 €", kind: "patrimoine", target_amount: 250000, target_date: "2030-12-31", is_demo: true },
    { user_id: userId, name: "500 € de revenus mensuels", kind: "revenu", target_amount: 6000, target_date: "2032-12-31", is_demo: true },
    { user_id: userId, name: "Investir 20 000 € cette année", kind: "versement", target_amount: 20000, target_date: "2026-12-31", is_demo: true },
  ]);

  await supabase.from("journal_entries").insert([
    { user_id: userId, date: "2021-03-15", title: "Premier investissement", content: "Démarrage d'un DCA mensuel sur un ETF Monde pour construire un socle diversifié.", asset_id: id("ETF MSCI World"), is_demo: true },
    { user_id: userId, date: "2024-10-02", title: "Allègement Bitcoin", content: "La position crypto dépassait 10 % du portefeuille, j'en ai vendu une partie.", asset_id: id("Bitcoin"), is_demo: true },
  ]);

  await supabase.from("profiles").update({ has_demo_data: true }).eq("id", userId);
}

export async function deleteDemoData(userId: string) {
  await supabase.from("journal_entries").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("goals").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("valuations").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("transactions").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("assets").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("accounts").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("profiles").update({ has_demo_data: false }).eq("id", userId);
}
