import { beforeEach, describe, it, expect } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useServices } from "../src/services";
import {
  usePlayerStore,
  useCargoStore,
  useMarketStore,
  useGameStore,
  useRouteStore,
  useCityStore,
  useKnowledgeStore,
  resetPrototype,
} from "../src/stores";
import { goods, routes } from "../src/data/fixture";
import type { TradeRequest } from "../src/contracts/game";
beforeEach(() => setActivePinia(createPinia()));
const req = (
  quantity = 2,
  goodId = "tea",
  mode: "buy" | "sell" = "buy",
): TradeRequest => ({
  cityId: "quanzhou",
  goodId,
  mode,
  quantity,
  expectedRevision: useMarketStore().revision,
});
const assets = () =>
  JSON.stringify({
    p: usePlayerStore().$state,
    c: useCargoStore().$state,
    m: useMarketStore().$state,
    g: useGameStore().$state,
  });
describe("M0 fixture and service acceptance", () => {
  it("20 cities / 30 slots, timber retained, horses absent, all references valid", () => {
    expect(useCityStore().items).toHaveLength(20);
    expect(goods).toHaveLength(30);
    expect(goods.some((g) => g.id === "timber")).toBe(true);
    expect(goods.some((g) => g.id === "horse")).toBe(false);
    for (const q of useMarketStore().items) {
      expect(goods.some((g) => g.id === q.goodId)).toBe(true);
      expect(useCityStore().byId[q.cityId]).toBeTruthy();
    }
    for (const r of routes) {
      expect(useCityStore().byId[r.fromCityId]).toBeTruthy();
      expect(useCityStore().byId[r.toCityId]).toBeTruthy();
    }
  });
  it("A02 preview/cancel is read only", () => {
    const { trade } = useServices(),
      before = assets();
    expect(trade.preview(req()).ok).toBe(true);
    expect(assets()).toBe(before);
  });
  it("A03/A04 buy 2 tea and synchronized cargo summary", () => {
    const { trade } = useServices();
    expect(trade.buy(req()).ok).toBe(true);
    expect(usePlayerStore().money).toBe(4244);
    expect(useCargoStore().items[0]).toEqual({
      goodId: "tea",
      quantity: 2,
      averageCost: 378,
    });
    expect(useMarketStore().items.find((i) => i.goodId === "tea")?.stock).toBe(
      18,
    );
    expect(trade.cargoSummary()).toEqual({
      usedWeight: 2,
      capacity: 100,
      totalCost: 756,
      localValue: 720,
      unrealizedProfit: -36,
    });
  });
  it("A05 knowledge age, unknown and known observations only", () => {
    const records = useKnowledgeStore().observations(12);
    expect(records.map((k) => k.age)).toEqual([2, 3, null]);
    expect(records[2].knownPrice).toBe(null);
    expect(records[2].history).toEqual([]);
  });
  it("A06/A07 prepare and cancel never change assets/time/location", () => {
    const { trade, route } = useServices();
    trade.buy(req());
    const before = assets();
    expect(route.prepare("quanzhou_ryukyu").ok).toBe(true);
    expect(useRouteStore().status).toBe("prepared");
    expect(assets()).toBe(before);
    route.cancel();
    expect(useRouteStore().$state).toEqual({
      selectedRouteId: null,
      status: "idle",
    });
    expect(assets()).toBe(before);
  });
  it("A08 sell 1 keeps average cost", () => {
    const { trade } = useServices();
    trade.buy(req());
    trade.sell(req(1, "tea", "sell"));
    expect(usePlayerStore().money).toBe(4586);
    expect(useCargoStore().items[0]).toEqual({
      goodId: "tea",
      quantity: 1,
      averageCost: 378,
    });
    expect(useMarketStore().items.find((i) => i.goodId === "tea")?.stock).toBe(
      19,
    );
    expect(trade.cargoSummary().usedWeight).toBe(1);
  });
  it("A09/A10 MAX accounts for tax and weight", () => {
    const { trade } = useServices();
    expect(trade.maxQuantity("quanzhou", "tea", "buy")).toBe(13);
    expect(trade.maxQuantity("quanzhou", "timber", "buy")).toBe(14);
    trade.buy(req(13));
    expect(usePlayerStore().money).toBe(86);
  });
  it.each([0, -1, 1.5, NaN, Infinity, 21])(
    "A11 reject invalid quantity %s without side effects",
    (n) => {
      const { trade } = useServices(),
        before = assets();
      expect(trade.buy(req(n)).ok).toBe(false);
      expect(assets()).toBe(before);
    },
  );
  it("A12 insufficient funds / capacity / cargo", () => {
    const { trade } = useServices();
    usePlayerStore().money = 0;
    let before = assets();
    expect(trade.buy(req())).toMatchObject({
      ok: false,
      error: "INSUFFICIENT_FUNDS",
    });
    expect(assets()).toBe(before);
    resetPrototype();
    usePlayerStore().transport.cargoCapacity = 1;
    before = assets();
    expect(trade.buy(req())).toMatchObject({
      ok: false,
      error: "OVER_CAPACITY",
    });
    expect(trade.sell(req(1, "tea", "sell"))).toMatchObject({
      ok: false,
      error: "INSUFFICIENT_CARGO",
    });
    expect(assets()).toBe(before);
  });
  it("A13/A15 duplicate confirmation and pre-reset request are stale", () => {
    const { trade } = useServices(),
      r = req();
    trade.buy(r);
    const before = assets();
    expect(trade.buy(r)).toMatchObject({ ok: false, error: "STALE_PREVIEW" });
    expect(assets()).toBe(before);
    const old = req();
    resetPrototype();
    expect(trade.buy(old)).toMatchObject({ ok: false, error: "STALE_PREVIEW" });
  });
  it("A16 rejection preserves prepared route, assets and day", () => {
    const { route } = useServices();
    route.prepare("quanzhou_ryukyu");
    usePlayerStore().money = 0;
    let before = assets();
    expect(route.prepare("quanzhou_malacca")).toMatchObject({
      ok: false,
      error: "INSUFFICIENT_FUNDS",
    });
    expect(assets()).toBe(before);
    expect(useRouteStore().selectedRouteId).toBe("quanzhou_ryukyu");
    usePlayerStore().money = 5000;
    usePlayerStore().transport.rangeDays = 1;
    before = assets();
    expect(route.prepare("quanzhou_malacca")).toMatchObject({
      ok: false,
      error: "OUT_OF_RANGE",
    });
    expect(assets()).toBe(before);
  });
  it("full sell removes cargo; new buys retain weighted cost precision", () => {
    const { trade } = useServices();
    trade.buy(req(1));
    trade.buy(req(2));
    expect(useCargoStore().items[0].averageCost).toBe(378);
    trade.sell(req(3, "tea", "sell"));
    expect(useCargoStore().items).toEqual([]);
  });
  it("missing local quote gives unknown valuation, never zero", () => {
    const { trade } = useServices();
    trade.buy(req());
    useMarketStore().items = useMarketStore().items.filter(
      (i) => i.goodId !== "tea",
    );
    expect(trade.cargoSummary().localValue).toBe(null);
  });
  it("mode, city, good, quote guards have no effects", () => {
    const { trade } = useServices(),
      before = assets();
    expect(trade.buy(req(1, "tea", "sell"))).toMatchObject({
      error: "INVALID_MODE",
    });
    expect(trade.buy({ ...req(), cityId: "aden" })).toMatchObject({
      error: "WRONG_CITY",
    });
    expect(trade.buy(req(1, "missing"))).toMatchObject({
      error: "UNKNOWN_GOOD",
    });
    expect(assets()).toBe(before);
  });
});
