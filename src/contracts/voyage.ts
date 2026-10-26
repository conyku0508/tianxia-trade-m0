import type {
  Player,
  GameState,
  CargoItem,
  MarketItem,
  MarketKnowledge,
  RouteState,
} from "./game";
export interface Voyage {
  id: string;
  routeId: string;
  fromCityId: string;
  toCityId: string;
  departureDay: number;
  travelDays: number;
  elapsedDays: number;
  travelCost: number;
  cashBefore: number;
  cargoQuantity: number;
}
export interface Arrival extends Voyage {
  arrivalDay: number;
}
export interface VoyageState {
  active: Voyage | null;
  lastArrival: Arrival | null;
}
export type VoyageError =
  | "IN_TRANSIT"
  | "NOT_PREPARED"
  | "STALE_PREVIEW"
  | "NO_VOYAGE"
  | "STALE_TURN"
  | "NO_ROUTE"
  | "WRONG_ORIGIN"
  | "OUT_OF_RANGE"
  | "INSUFFICIENT_FUNDS";
export interface LedgerEntry {
  id: string;
  kind: "buy" | "sell" | "travel";
  day: number;
  cityId: string;
  goodId: string | null;
  quantity: number;
  subtotal: number;
  tax: number;
  cashDelta: number;
  costBasis: number;
  realizedProfit: number;
}
export interface SaveSnapshot {
  version: 1;
  savedAt: string;
  player: Player;
  game: GameState;
  cargo: CargoItem[];
  market: { items: MarketItem[]; revision: number };
  knowledge: MarketKnowledge[];
  route: RouteState;
  voyage: VoyageState;
  ledger: LedgerEntry[];
}
