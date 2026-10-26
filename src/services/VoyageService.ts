import type {
  Result,
  GameState,
  Player,
  Route,
  RouteState,
  MarketItem,
  MarketKnowledge,
  CargoItem,
} from "../contracts/game";
import type {
  VoyageState,
  Voyage,
  Arrival,
  VoyageError,
  LedgerEntry,
} from "../contracts/voyage";
interface Port {
  state(): {
    game: GameState;
    player: Player;
    route: RouteState;
    voyage: VoyageState;
    market: MarketItem[];
    revision: number;
    knowledge: MarketKnowledge[];
    cargo: CargoItem[];
  };
  depart(v: Voyage, observed: MarketKnowledge[], entry: LedgerEntry): void;
  advance(
    next: Voyage,
    arrival: Arrival | null,
    observed: MarketKnowledge[] | null,
  ): void;
}
export class VoyageService {
  constructor(
    private routes: Route[],
    private port: Port,
  ) {}
  private fail(
    error: VoyageError,
    message: string,
  ): Result<never, VoyageError> {
    return { ok: false, error, message };
  }
  private observations(cityId: string, day: number) {
    const s = this.port.state(),
      records = s.knowledge.map((k) => ({
        ...k,
        history: k.history.map((h) => ({ ...h })),
      }));
    for (const q of s.market.filter((q) => q.cityId === cityId)) {
      let k = records.find((k) => k.cityId === cityId && k.goodId === q.goodId);
      if (!k) {
        k = {
          cityId,
          goodId: q.goodId,
          knownPrice: null,
          observedDay: null,
          history: [],
          source: "visit",
        };
        records.push(k);
      }
      k.knownPrice = q.sellPrice;
      k.observedDay = day;
      k.source = "visit";
      k.history = [
        ...k.history.filter((p) => p.day !== day),
        { day, price: q.sellPrice },
      ]
        .sort((a, b) => a.day - b.day)
        .slice(-12);
    }
    return records;
  }
  preview(
    routeId: string,
    expectedRevision: number,
  ): Result<Voyage, VoyageError> {
    const s = this.port.state();
    if (s.voyage.active)
      return this.fail("IN_TRANSIT", "已在航行中，不能重複出航");
    if (expectedRevision !== s.revision)
      return this.fail("STALE_PREVIEW", "出航摘要已過期，請重新確認");
    if (s.route.status !== "prepared" || s.route.selectedRouteId !== routeId)
      return this.fail("NOT_PREPARED", "請先準備這條航線");
    const r = this.routes.find((r) => r.id === routeId && r.enabled);
    if (!r) return this.fail("NO_ROUTE", "找不到可用航線");
    if (r.fromCityId !== s.game.currentCityId)
      return this.fail("WRONG_ORIGIN", "目前不在出發港");
    if (r.travelDays > s.player.transport.rangeDays)
      return this.fail("OUT_OF_RANGE", "超出商船航程");
    if (!Number.isFinite(s.player.money) || s.player.money < r.travelCost)
      return this.fail("INSUFFICIENT_FUNDS", "現金不足旅費");
    return {
      ok: true,
      value: {
        id: `voyage-${s.revision}-${s.game.currentDay}`,
        routeId: r.id,
        fromCityId: r.fromCityId,
        toCityId: r.toCityId,
        departureDay: s.game.currentDay,
        travelDays: r.travelDays,
        elapsedDays: 0,
        travelCost: r.travelCost,
        cashBefore: s.player.money,
        cargoQuantity: s.cargo.reduce((n, c) => n + c.quantity, 0),
      },
    };
  }
  depart(routeId: string, expectedRevision: number) {
    const result = this.preview(routeId, expectedRevision);
    if (!result.ok) return result;
    const v = result.value;
    const entry: LedgerEntry = {
      id: v.id,
      kind: "travel",
      day: v.departureDay,
      cityId: v.fromCityId,
      goodId: null,
      quantity: 0,
      subtotal: v.travelCost,
      tax: 0,
      cashDelta: -v.travelCost,
      costBasis: 0,
      realizedProfit: 0,
    };
    this.port.depart(v, this.observations(v.fromCityId, v.departureDay), entry);
    return result;
  }
  advance(
    voyageId: string,
    expectedDay: number,
  ): Result<{ voyage: Voyage; arrival: Arrival | null }, VoyageError> {
    const s = this.port.state(),
      v = s.voyage.active;
    if (!v) return this.fail("NO_VOYAGE", "目前沒有航行中的商隊");
    if (v.id !== voyageId || expectedDay !== s.game.currentDay)
      return this.fail("STALE_TURN", "這一天已處理，請使用最新航程");
    const next = { ...v, elapsedDays: v.elapsedDays + 1 },
      arrival: Arrival | null =
        next.elapsedDays === next.travelDays
          ? { ...next, arrivalDay: s.game.currentDay + 1 }
          : null;
    this.port.advance(
      next,
      arrival,
      arrival ? this.observations(next.toCityId, arrival.arrivalDay) : null,
    );
    return { ok: true, value: { voyage: next, arrival } };
  }
}
