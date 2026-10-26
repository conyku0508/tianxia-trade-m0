// v1.1 canonical contracts. Numbers in fixtures are MOCK, not balanced settings.
export type Id = string;
export type DataStatus = "candidate" | "mock" | "placeholder" | "approved";
export type GoodCategory =
  "food" | "agriculture" | "textile" | "craft" | "metal" | "luxury";
export type CityType =
  "major_port" | "port" | "agriculture" | "craft" | "metropolis" | "transit";
export type TradeMode = "buy" | "sell";
export interface Good {
  id: Id;
  name: string;
  category: GoodCategory;
  basePrice: number; // >0; mock baseline, not an always-current quote
  weight: number; // >0, per unit, decimals allowed
  icon: string; // semantic asset key; resolver must supply fallback
  tier: "basic" | "special";
  dataStatus: DataStatus;
}
export interface City {
  id: Id;
  name: string;
  type: CityType;
  position: { x: number; y: number }; // normalized 0..1 on illustrative map
  taxRate: number; // 0..1
  risk: number; // 0..1; no battle engine implied
  produces: Id[];
  demands: Id[];
  dataStatus: DataStatus;
}
export interface MarketItem {
  cityId: Id;
  goodId: Id;
  buyPrice: number; // positive integer, before tax
  sellPrice: number; // positive integer, before tax
  stock: number; // nonnegative integer
  quotedDay: number; // game day >=1
  priceTrend: "up" | "down" | "flat"; // mock local display, not foreign knowledge
  dataStatus: DataStatus;
}
export interface PriceObservation {
  day: number; // 1..observedDay
  price: number; // >0
}
export interface MarketKnowledge {
  cityId: Id;
  goodId: Id;
  knownPrice: number | null; // null=unknown, never use zero
  observedDay: number | null; // null iff knownPrice=null
  history: PriceObservation[]; // ascending, known observations only
  source: "visit" | "rumor" | "mock";
}
export interface Transport {
  id: Id;
  name: string;
  cargoCapacity: number; // positive weight capacity
  speed: number; // mock relative index, not a promise of km/h
  rangeDays: number; // max supported mock route duration
}
export interface Player {
  id: Id;
  name: string;
  money: number; // nonnegative integer
  transport: Transport;
  // No duplicated cargo/currentCityId/currentDay/usedWeight here.
}
export interface CargoItem {
  goodId: Id;
  quantity: number; // positive integer; remove row at zero
  averageCost: number; // >=0; per unit, includes buy tax, unrounded internally
}
export interface Route {
  id: Id;
  fromCityId: Id;
  toCityId: Id;
  mode: "sea" | "land";
  travelDays: number; // positive integer
  travelCost: number; // nonnegative integer
  risk: number; // 0..1
  enabled: boolean;
  dataStatus: DataStatus;
}
export interface WorldEvent {
  id: Id;
  title: string;
  description: string;
  type: "market" | "risk" | "rumor";
  cityId?: Id;
  goodId?: Id;
  observedDay: number;
  displayOnly: boolean; // M0=true, never applies an asset effect
}
// V1.5+ contracts: do not instantiate future runtime services in M0.
export interface DevelopmentLevels {
  commercial: number;
  defense: number;
  port: number;
  cultureTechnology: number;
}
export interface SpecialUnlock {
  goodId: Id; // reference to specialGoods, outside 30 basic slots
  commercialLevel: number;
}
export interface CityDevelopment {
  cityId: Id;
  levels: DevelopmentLevels;
  unlockedSpecialGoodIds: Id[];
}
export interface InvestmentRule {
  cityId: Id;
  direction: keyof DevelopmentLevels;
  targetLevel: number;
  cost: number | null; // null=placeholder, not free
  unlocks: SpecialUnlock[];
  dataStatus: DataStatus;
}
export interface Character {
  id: Id;
  name: string;
  role: "captain" | "merchant" | "navigator" | "guard" | "accountant" | "medic";
  portrait: string;
  stats: Record<string, number>;
  trait: string;
  salary: number | null; // null=not set
  fleetId: Id | null;
}
export interface Ship {
  id: Id;
  name: string;
  type: "merchant" | "fast" | "escort";
  cargoCapacity: number;
  speed: number;
  rangeDays: number;
  durability: number;
  defense: number;
  crewRequirement: number;
}
export interface Fleet {
  id: Id;
  name: string;
  flagshipShipId: Id | null;
  shipIds: Id[];
  characterIds: Id[];
  crewCount: number;
}
// Single state owners; assembled snapshots are transient, never a second store.
export interface GameState {
  currentCityId: Id;
  currentDay: number;
}
export interface RouteState {
  selectedRouteId: Id | null;
  status: "idle" | "prepared";
}
export interface TradeSnapshot {
  player: Player;
  game: GameState;
  cargo: CargoItem[];
  market: MarketItem[];
  revision: number; // monotonic across reset as well, rejects stale previews
  inTransit?: boolean;
}
export interface TradeRequest {
  cityId: Id;
  goodId: Id;
  mode: TradeMode;
  quantity: number;
  expectedRevision: number;
}
export type TradeError =
  | "INVALID_QUANTITY"
  | "INVALID_MODE"
  | "UNKNOWN_GOOD"
  | "NO_QUOTE"
  | "WRONG_CITY"
  | "INSUFFICIENT_STOCK"
  | "INSUFFICIENT_FUNDS"
  | "OVER_CAPACITY"
  | "INSUFFICIENT_CARGO"
  | "STALE_PREVIEW"
  | "BUSY"
  | "IN_TRANSIT";
export interface TradePreview {
  costBasis: number;
  realizedProfit: number | null;
  request: TradeRequest;
  unitPrice: number;
  subtotal: number;
  tax: number;
  cashDelta: number; // buy negative; sell positive
  moneyAfter: number;
  usedWeightAfter: number;
  quantityAfter: number;
  averageCostAfter: number | null; // null if resulting quantity=0
}
export type Result<T, E extends string> =
  { ok: true; value: T } | { ok: false; error: E; message: string };
export interface CargoSummary {
  usedWeight: number;
  capacity: number;
  totalCost: number;
  localValue: number | null; // pre-sale-tax; null if any held good lacks quote
  unrealizedProfit: number | null;
}
export interface TradeServicePort {
  preview(request: TradeRequest): Result<TradePreview, TradeError>;
  buy(request: TradeRequest): Result<TradePreview, TradeError>; // mode must be buy
  sell(request: TradeRequest): Result<TradePreview, TradeError>; // mode must be sell
  maxQuantity(cityId: Id, goodId: Id, mode: TradeMode): number;
  cargoSummary(): CargoSummary;
}
export type RouteError =
  | "NO_ROUTE"
  | "WRONG_ORIGIN"
  | "OUT_OF_RANGE"
  | "INSUFFICIENT_FUNDS"
  | "IN_TRANSIT";
export interface RoutePreview {
  route: Route;
  canPrepare: boolean;
  reason: RouteError | null;
}
export interface RouteServicePort {
  listFrom(cityId: Id): Route[];
  preview(routeId: Id): Result<RoutePreview, RouteError>;
  prepare(routeId: Id): Result<RouteState, RouteError>;
  cancel(): void;
}
export interface PrototypeFixture {
  player: Player;
  game: GameState;
  goods: Good[];
  cities: City[];
  market: MarketItem[];
  knowledge: MarketKnowledge[];
  routes: Route[];
  events: WorldEvent[];
  cargo: CargoItem[];
  routeState: RouteState;
}
