import { beforeEach, it, expect, describe } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useServices } from "../src/services";
import {
  usePlayerStore,
  useGameStore,
  useMarketStore,
  useVoyageStore,
  useRouteStore,
  useCargoStore,
  useKnowledgeStore,
  useLedgerStore,
  resetPrototype,
} from "../src/stores";
import { snapshot } from "../src/services/persistence";
import {
  validateSave,
  parseSave,
  SaveService,
  SAVE_KEY,
  BACKUP_KEY,
} from "../src/services/SaveService";
beforeEach(() => setActivePinia(createPinia()));
const request = (
  quantity = 10,
  goodId = "tea",
  mode: "buy" | "sell" = "buy",
) => ({
  cityId: useGameStore().currentCityId,
  goodId,
  mode,
  quantity,
  expectedRevision: useMarketStore().revision,
});
function depart(id = "quanzhou_ryukyu") {
  const s = useServices();
  expect(s.route.prepare(id).ok).toBe(true);
  const result = s.voyage.depart(id, useMarketStore().revision);
  expect(result.ok).toBe(true);
  return s;
}
function arrive() {
  const s = useServices();
  while (useVoyageStore().active) {
    const v = useVoyageStore().active!;
    expect(s.voyage.advance(v.id, useGameStore().currentDay).ok).toBe(true);
  }
}
const data = () =>
  JSON.stringify(snapshot(), (key, value) =>
    key === "savedAt" ? undefined : value,
  );
describe("V1 voyage loop", () => {
  it("requires prepared route and valid revision; failures have no side effects", () => {
    const s = useServices(),
      before = data();
    expect(s.voyage.depart("quanzhou_ryukyu", 1)).toMatchObject({
      error: "NOT_PREPARED",
    });
    expect(data()).toBe(before);
    s.route.prepare("quanzhou_ryukyu");
    const next = data();
    expect(s.voyage.depart("quanzhou_ryukyu", 0)).toMatchObject({
      error: "STALE_PREVIEW",
    });
    expect(data()).toBe(next);
  });
  it("departure cancel/preview read-only; charges once at departure, not during prepare", () => {
    const s = useServices();
    s.trade.buy(request());
    s.route.prepare("quanzhou_ryukyu");
    const before = data();
    const preview = s.voyage.preview(
      "quanzhou_ryukyu",
      useMarketStore().revision,
    );
    expect(preview.ok).toBe(true);
    expect(data()).toBe(before);
    const revision = useMarketStore().revision;
    s.voyage.depart("quanzhou_ryukyu", revision);
    expect(usePlayerStore().money).toBe(1100);
    expect(useGameStore().$state).toEqual({
      currentCityId: "quanzhou",
      currentDay: 12,
    });
    const charged = data();
    expect(s.voyage.depart("quanzhou_ryukyu", revision).ok).toBe(false);
    expect(data()).toBe(charged);
  });
  it("each day once; stale/duplicate turn cannot double advance or charge", () => {
    const s = depart(),
      id = useVoyageStore().active!.id;
    s.voyage.advance(id, 12);
    expect(useGameStore().currentDay).toBe(13);
    const before = data();
    expect(s.voyage.advance(id, 12)).toMatchObject({ error: "STALE_TURN" });
    expect(data()).toBe(before);
    arrive();
    expect(useGameStore().$state).toEqual({
      currentCityId: "ryukyu",
      currentDay: 15,
    });
    expect(usePlayerStore().money).toBe(4880);
    expect(s.voyage.advance(id, 15)).toMatchObject({ error: "NO_VOYAGE" });
    expect(useRouteStore().status).toBe("idle");
  });
  it("in transit blocks buy/sell/MAX, preparation and cancel", () => {
    const s = useServices();
    s.trade.buy(request());
    depart();
    const before = data();
    expect(s.trade.buy(request(1))).toMatchObject({ error: "IN_TRANSIT" });
    expect(s.trade.sell(request(1, "tea", "sell"))).toMatchObject({
      error: "IN_TRANSIT",
    });
    expect(s.trade.maxQuantity("quanzhou", "tea", "buy")).toBe(0);
    expect(s.route.prepare("quanzhou_malacca")).toMatchObject({
      error: "IN_TRANSIT",
    });
    s.route.cancel();
    expect(data()).toBe(before);
  });
  it("revalidates money, range and origin between prepare and departure", () => {
    const s = useServices();
    s.route.prepare("quanzhou_ryukyu");
    usePlayerStore().money = 0;
    const before = data();
    expect(s.voyage.depart("quanzhou_ryukyu", 1)).toMatchObject({
      error: "INSUFFICIENT_FUNDS",
    });
    expect(data()).toBe(before);
    usePlayerStore().money = 5000;
    usePlayerStore().transport.rangeDays = 1;
    expect(s.voyage.depart("quanzhou_ryukyu", 1)).toMatchObject({
      error: "OUT_OF_RANGE",
    });
    usePlayerStore().transport.rangeDays = 20;
    useGameStore().currentCityId = "ryukyu";
    expect(s.voyage.depart("quanzhou_ryukyu", 1)).toMatchObject({
      error: "WRONG_ORIGIN",
    });
  });
  it("arrival learns destination quotes only when observed, preserves unknown and origin date", () => {
    const s = useServices();
    expect(
      useKnowledgeStore().records.find((k) => k.cityId === "ryukyu")
        ?.observedDay,
    ).toBe(9);
    depart();
    expect(
      useKnowledgeStore().records.filter((k) => k.cityId === "quanzhou"),
    ).toHaveLength(30);
    expect(
      useKnowledgeStore().records.find((k) => k.cityId === "ryukyu")
        ?.observedDay,
    ).toBe(9);
    arrive();
    expect(
      useKnowledgeStore().records.filter((k) => k.cityId === "ryukyu"),
    ).toHaveLength(30);
    expect(
      useKnowledgeStore().records.find(
        (k) => k.cityId === "ryukyu" && k.goodId === "tea",
      ),
    ).toMatchObject({ knownPrice: 480, observedDay: 15, source: "visit" });
    expect(
      useKnowledgeStore()
        .observations(15)
        .find((k) => k.cityId === "quanzhou")?.age,
    ).toBe(3);
    expect(
      useKnowledgeStore().records.find((k) => k.cityId === "aden")?.knownPrice,
    ).toBeNull();
  });
  it("roundtrip tea10 + timber10 yields cash5945, day18, cargo0, net profit945", () => {
    const s = useServices();
    s.trade.buy(request());
    expect(usePlayerStore().money).toBe(1220);
    depart();
    arrive();
    s.trade.sell(request(10, "tea", "sell"));
    expect(usePlayerStore().money).toBe(5660);
    s.trade.buy(request(10, "timber"));
    expect(usePlayerStore().money).toBe(4925);
    expect(s.trade.cargoSummary().usedWeight).toBe(70);
    depart("ryukyu_quanzhou");
    expect(usePlayerStore().money).toBe(4805);
    arrive();
    s.trade.sell(request(10, "timber", "sell"));
    expect(useGameStore().$state).toEqual({
      currentCityId: "quanzhou",
      currentDay: 18,
    });
    expect(useCargoStore().items).toEqual([]);
    expect(usePlayerStore().money).toBe(5945);
    expect(s.statement()).toEqual({
      purchaseSpend: 4515,
      salesRevenue: 5700,
      travelExpenses: 240,
      tradingProfit: 1185,
      netRealizedProfit: 945,
      taxes: 515,
      cashFlow: 945,
    });
    expect(validateSave(snapshot())).toBe(true);
  });
  it("Malacca also has a return route and an actual 12-day arrival", () => {
    depart("quanzhou_malacca");
    arrive();
    expect(useGameStore().currentCityId).toBe("malacca");
    expect(useGameStore().currentDay).toBe(24);
    expect(
      useServices()
        .route.listFrom("malacca")
        .map((r) => r.id),
    ).toEqual(["malacca_quanzhou"]);
    expect(useServices().market.list("malacca")).toHaveLength(30);
    expect(validateSave(snapshot())).toBe(true);
  });
  it("MAX tea leaves86 and refuses fare120 without modifying cargo or money", () => {
    const s = useServices();
    s.trade.buy(request(13));
    const before = data();
    expect(s.route.prepare("quanzhou_ryukyu")).toMatchObject({
      error: "INSUFFICIENT_FUNDS",
    });
    expect(data()).toBe(before);
  });
  it("reset clears active voyage, ledger and foreign stock; stale departure invalid", () => {
    const s = depart(),
      revision = useMarketStore().revision;
    resetPrototype();
    expect(useVoyageStore().$state).toEqual({
      active: null,
      lastArrival: null,
    });
    expect(useLedgerStore().entries).toEqual([]);
    expect(useMarketStore().items).toHaveLength(90);
    expect(s.voyage.depart("quanzhou_ryukyu", revision)).toMatchObject({
      error: "STALE_PREVIEW",
    });
    expect(validateSave(snapshot())).toBe(true);
  });
});
describe("Save consistency and storage failures", () => {
  it("fresh, trading, sailing, middle-day and arrived snapshots validate", () => {
    expect(validateSave(snapshot())).toBe(true);
    useServices().trade.buy(request());
    expect(validateSave(snapshot())).toBe(true);
    depart();
    expect(validateSave(snapshot())).toBe(true);
    const v = useVoyageStore().active!;
    useServices().voyage.advance(v.id, 12);
    expect(validateSave(snapshot())).toBe(true);
    arrive();
    expect(parseSave(JSON.stringify(snapshot()))).not.toBeNull();
  });
  it.each(["{bad", "null", "{}", '{"version":99}'])(
    "invalid JSON/schema rejected: %s",
    (raw) => expect(parseSave(raw)).toBeNull(),
  );
  it.each([
    "money",
    "cargo",
    "stock",
    "date",
    "route",
    "observation",
    "ledger",
  ])("corrupted %s rejected", (key) => {
    useServices().trade.buy(request());
    depart();
    const s = snapshot();
    if (key === "money") s.player.money++;
    if (key === "cargo") s.cargo[0].averageCost++;
    if (key === "stock") s.market.items[0].stock++;
    if (key === "date") s.game.currentDay++;
    if (key === "route") s.voyage.active!.routeId = "missing";
    if (key === "observation") s.knowledge[0].observedDay = 999;
    if (key === "ledger") s.ledger[0].cashDelta = 1;
    expect(validateSave(s)).toBe(false);
  });
  it("write/readback saves verified complete snapshot and retains previous valid backup", () => {
    const map = new Map<string, string>(),
      storage = {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => {
          map.set(k, v);
        },
      },
      service = new SaveService(storage);
    service.load();
    const first = snapshot();
    expect(service.write(first).status).toBe("saved");
    useServices().trade.buy(request());
    const second = snapshot();
    expect(service.write(second).status).toBe("saved");
    expect(JSON.parse(map.get(BACKUP_KEY)!)).toEqual(first);
    expect(new SaveService(storage).load().snapshot).toEqual(second);
  });
  it("corrupt primary recovers previous backup", () => {
    const first = snapshot(),
      map = new Map([
        [SAVE_KEY, "{broken"],
        [BACKUP_KEY, JSON.stringify(first)],
      ]),
      service = new SaveService({
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => {
          map.set(k, v);
        },
      });
    expect(service.load()).toMatchObject({ snapshot: first, mode: "saved" });
    expect(map.get(SAVE_KEY)).toBe("{broken");
  });
  it("quota and denied storage report error/memory, never claim success", () => {
    const blocked = new SaveService({
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    blocked.load();
    expect(blocked.write(snapshot()).status).toBe("error");
    expect(new SaveService(null).write(snapshot()).status).toBe("memory");
    const denied = new SaveService({
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {},
    });
    expect(denied.load().mode).toBe("memory");
  });
  it("readback mismatch reports failure and leaves last-good backup", () => {
    let corrupt = false;
    const map = new Map<string, string>(),
      service = new SaveService({
        getItem: (k) =>
          corrupt && k === SAVE_KEY ? "broken" : (map.get(k) ?? null),
        setItem: (k, v) => {
          map.set(k, v);
          if (k === SAVE_KEY && map.has(BACKUP_KEY)) corrupt = true;
        },
      });
    service.load();
    const first = snapshot();
    service.write(first);
    expect(service.write(snapshot()).status).toBe("error");
    expect(parseSave(map.get(BACKUP_KEY)!)).toEqual(first);
  });
  it("another tab cannot silently overwrite a newer save", () => {
    const map = new Map<string, string>(),
      storage = {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => {
          map.set(k, v);
        },
      },
      one = new SaveService(storage);
    one.load();
    one.write(snapshot());
    const two = new SaveService(storage);
    two.load();
    useServices().trade.buy(request());
    one.write(snapshot());
    expect(
      two.write({ ...snapshot(), savedAt: "2026-10-26T02:00:00.000Z" }).status,
    ).toBe("conflict");
  });
});
