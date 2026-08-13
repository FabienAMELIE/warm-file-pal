export type Currency = "EUR" | "USD" | "GBP" | "CHF";

export const CURRENCIES: Currency[] = ["EUR", "USD", "GBP", "CHF"];

export const ASSET_TYPES = [
  "Actions",
  "ETF",
  "Obligations",
  "Fonds",
  "Crypto",
  "Immobilier",
  "SCPI",
  "Crowdfunding",
  "Private equity",
  "Livret",
  "Autre",
] as const;

export const ACCOUNT_TYPES = [
  "PEA",
  "CTO",
  "Assurance-vie",
  "PER",
  "Compte crypto",
  "Compte bancaire",
  "Immobilier",
  "Autre",
] as const;

export const TRANSACTION_TYPES = [
  "Achat",
  "Vente",
  "Dépôt",
  "Retrait",
  "Dividende",
  "Intérêt",
  "Loyer",
  "Frais",
  "Distribution",
  "Transfert",
  "Autre",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const INCOME_TYPES: TransactionType[] = [
  "Dividende",
  "Intérêt",
  "Loyer",
  "Distribution",
];

export const GEOGRAPHIES = [
  "Europe",
  "États-Unis",
  "Asie",
  "Émergents",
  "Monde",
  "France",
  "Non renseigné",
] as const;

export const SECTORS = [
  "Technologie",
  "Finance",
  "Santé",
  "Industrie",
  "Immobilier",
  "Énergie",
  "Consommation",
  "Diversifié",
  "Non renseigné",
] as const;

export interface Profile {
  id: string;
  display_name: string | null;
  base_currency: string;
  concentration_threshold: number;
  has_demo_data: boolean;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  institution: string | null;
  currency: string;
  is_demo: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  account_id: string | null;
  name: string;
  ticker: string | null;
  asset_type: string;
  sector: string | null;
  geography: string | null;
  currency: string;
  /** "unit" = quantité × prix unitaire, "value" = valeur globale estimée */
  pricing_mode: string;
  current_price: number | null;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  asset_id: string | null;
  date: string;
  type: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number;
  currency: string;
  fees: number;
  notes: string | null;
  is_demo: boolean;
}

export interface Valuation {
  id: string;
  user_id: string;
  asset_id: string;
  date: string;
  price: number;
  currency: string;
  is_demo: boolean;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  kind: string;
  target_amount: number;
  target_date: string | null;
  is_demo: boolean;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  title: string;
  content: string | null;
  asset_id: string | null;
  account_id: string | null;
  is_demo: boolean;
}

export interface PortfolioData {
  profile: Profile | null;
  accounts: Account[];
  assets: Asset[];
  transactions: Transaction[];
  valuations: Valuation[];
  goals: Goal[];
  journal: JournalEntry[];
}
