import type { SaveSnapshot, Voyage, LedgerEntry } from "../contracts/voyage";
import { definitions, epsilon } from "../data/fixture";
import {
  initialMarkets,
  journeyRoutes,
  playableCityIds,
} from "../data/journeyConfig";
export const SAVE_KEY = "tianxia-v1-save";
export const BACKUP_KEY = SAVE_KEY + ":backup";
const integer = (v: unknown, min = 0, max = 1e12) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max;
const finite = (v: unknown, min = 0) =>
  typeof v === "number" && Number.isFinite(v) && v >= min;
const text = (v: unknown) =>
  typeof v === "string" && v.length > 0 && v.length <= 100;
export function validateSave(value: unknown): value is SaveSnapshot {
  try {
    const s = value as SaveSnapshot;
    if (
      !s ||
      s.version !== 1 ||
      !Number.isFinite(Date.parse(s.savedAt)) ||
      s.player.id !== definitions.player.id ||
      !text(s.player.name) ||
      !integer(s.player.money) ||
      !integer(s.game.currentDay, 1, 1e7) ||
      !playableCityIds.includes(s.game.currentCityId)
    )
      return false;
    const t = s.player.transport;
    if (
      t.id !== definitions.player.transport.id ||
      !text(t.name) ||
      !finite(t.cargoCapacity, epsilon) ||
      !finite(t.speed, epsilon) ||
      !integer(t.rangeDays, 1, 1e6)
    )
      return false;
    if (
      !Array.isArray(s.cargo) ||
      s.cargo.length > definitions.goods.length ||
      new Set(s.cargo.map((c) => c.goodId)).size !== s.cargo.length
    )
      return false;
    for (const c of s.cargo)
      if (
        !definitions.goods.some((g) => g.id === c.goodId) ||
        !integer(c.quantity, 1) ||
        !finite(c.averageCost)
      )
        return false;
    if (
      s.cargo.reduce(
        (n, c) =>
          n +
          c.quantity * definitions.goods.find((g) => g.id === c.goodId)!.weight,
        0,
      ) >
      t.cargoCapacity + epsilon
    )
      return false;
    const seeds = initialMarkets();
    if (
      !integer(s.market.revision, 1) ||
      !Array.isArray(s.market.items) ||
      s.market.items.length !== seeds.length ||
      new Set(s.market.items.map((q) => q.cityId + ":" + q.goodId)).size !==
        seeds.length
    )
      return false;
    for (const q of s.market.items) {
      const seed = seeds.find(
        (x) => x.cityId === q.cityId && x.goodId === q.goodId,
      );
      if (
        !seed ||
        q.buyPrice !== seed.buyPrice ||
        q.sellPrice !== seed.sellPrice ||
        !integer(q.stock) ||
        !integer(q.quotedDay, 1, s.game.currentDay) ||
        q.priceTrend !== "flat" ||
        q.dataStatus !== "mock"
      )
        return false;
    }
    if (
      !Array.isArray(s.knowledge) ||
      s.knowledge.length > 600 ||
      new Set(s.knowledge.map((k) => k.cityId + ":" + k.goodId)).size !==
        s.knowledge.length
    )
      return false;
    for (const k of s.knowledge) {
      if (
        !definitions.cities.some((c) => c.id === k.cityId) ||
        !definitions.goods.some((g) => g.id === k.goodId) ||
        !["visit", "rumor", "mock"].includes(k.source) ||
        !Array.isArray(k.history)
      )
        return false;
      if (k.knownPrice === null) {
        if (k.observedDay !== null || k.history.length) return false;
      } else {
        if (
          !integer(k.knownPrice, 1) ||
          !integer(k.observedDay, 1, s.game.currentDay) ||
          !k.history.length ||
          k.history.length > 12
        )
          return false;
        let day = 0;
        for (const h of k.history) {
          if (
            !integer(h.day, 1, k.observedDay!) ||
            h.day <= day ||
            !integer(h.price, 1)
          )
            return false;
          day = h.day;
        }
        const last = k.history.at(-1)!;
        if (last.day !== k.observedDay || last.price !== k.knownPrice)
          return false;
      }
    }
    if (!s.route || !["idle", "prepared"].includes(s.route.status))
      return false;
    const prepared = journeyRoutes.find(
      (r) => r.id === s.route.selectedRouteId,
    );
    if (
      s.route.status === "idle"
        ? s.route.selectedRouteId !== null
        : !prepared || prepared.fromCityId !== s.game.currentCityId
    )
      return false;
    if (!s.voyage) return false;
    const validVoyage = (v: Voyage, arrived: boolean) => {
      const r = journeyRoutes.find((r) => r.id === v.routeId);
      return (
        !!r &&
        /^voyage-\d+-\d+$/.test(v.id) &&
        r.fromCityId === v.fromCityId &&
        r.toCityId === v.toCityId &&
        r.travelDays === v.travelDays &&
        r.travelCost === v.travelCost &&
        integer(v.departureDay, 1, s.game.currentDay) &&
        integer(
          v.elapsedDays,
          arrived ? v.travelDays : 0,
          arrived ? v.travelDays : v.travelDays - 1,
        ) &&
        integer(v.cashBefore, v.travelCost) &&
        integer(v.cargoQuantity)
      );
    };
    if (s.voyage.active) {
      const v = s.voyage.active;
      if (
        s.voyage.lastArrival ||
        !validVoyage(v, false) ||
        v.departureDay + v.elapsedDays !== s.game.currentDay ||
        v.fromCityId !== s.game.currentCityId ||
        s.route.selectedRouteId !== v.routeId ||
        s.route.status !== "prepared"
      )
        return false;
    }
    if (s.voyage.lastArrival) {
      const v = s.voyage.lastArrival;
      if (
        !validVoyage(v, true) ||
        v.arrivalDay !== v.departureDay + v.travelDays ||
        v.arrivalDay > s.game.currentDay ||
        v.toCityId !== s.game.currentCityId
      )
        return false;
    }
    if (
      !Array.isArray(s.ledger) ||
      s.ledger.length > 20000 ||
      new Set(s.ledger.map((e) => e.id)).size !== s.ledger.length
    )
      return false;
    let money = definitions.player.money,
      lastDay = 0;
    const holdings = new Map<string, { quantity: number; cost: number }>(),
      stocks = new Map(seeds.map((q) => [q.cityId + ":" + q.goodId, q.stock]));
    for (const e of s.ledger) {
      if (
        !text(e.id) ||
        !["buy", "sell", "travel"].includes(e.kind) ||
        !integer(e.day, 1, s.game.currentDay) ||
        e.day < lastDay ||
        !playableCityIds.includes(e.cityId) ||
        !integer(e.subtotal) ||
        !integer(e.tax) ||
        !Number.isSafeInteger(e.cashDelta) ||
        !finite(e.costBasis) ||
        !Number.isFinite(e.realizedProfit)
      )
        return false;
      lastDay = e.day;
      money += e.cashDelta;
      if (money < 0) return false;
      if (e.kind === "travel") {
        if (
          e.goodId !== null ||
          e.quantity !== 0 ||
          e.tax !== 0 ||
          e.costBasis !== 0 ||
          e.realizedProfit !== 0 ||
          e.cashDelta !== -e.subtotal
        )
          return false;
        continue;
      }
      if (
        !e.goodId ||
        !definitions.goods.some((g) => g.id === e.goodId) ||
        !integer(e.quantity, 1)
      )
        return false;
      const h = holdings.get(e.goodId) ?? { quantity: 0, cost: 0 },
        key = e.cityId + ":" + e.goodId;
      const quote = seeds.find(
        (q) => q.cityId === e.cityId && q.goodId === e.goodId,
      )!;
      const city = definitions.cities.find((c) => c.id === e.cityId)!;
      if (
        e.subtotal !==
          e.quantity * (e.kind === "buy" ? quote.buyPrice : quote.sellPrice) ||
        e.tax !== Math.ceil(e.subtotal * city.taxRate)
      )
        return false;
      if (e.kind === "buy") {
        if (
          e.cashDelta !== -e.subtotal - e.tax ||
          e.costBasis !== 0 ||
          e.realizedProfit !== 0 ||
          (stocks.get(key) ?? 0) < e.quantity
        )
          return false;
        h.cost =
          (h.cost * h.quantity - e.cashDelta) / (h.quantity + e.quantity);
        h.quantity += e.quantity;
        stocks.set(key, stocks.get(key)! - e.quantity);
      } else {
        if (
          e.cashDelta !== e.subtotal - e.tax ||
          h.quantity < e.quantity ||
          Math.abs(e.costBasis - h.cost * e.quantity) > 1e-6 ||
          Math.abs(e.realizedProfit - (e.cashDelta - e.costBasis)) > 1e-6
        )
          return false;
        h.quantity -= e.quantity;
        stocks.set(key, stocks.get(key)! + e.quantity);
      }
      holdings.set(e.goodId, h);
    }
    if (money !== s.player.money) return false;
    for (const [id, h] of holdings) {
      const c = s.cargo.find((c) => c.goodId === id);
      if (
        h.quantity === 0
          ? !!c
          : !c ||
            c.quantity !== h.quantity ||
            Math.abs(c.averageCost - h.cost) > 1e-6
      )
        return false;
    }
    if (s.cargo.some((c) => !holdings.has(c.goodId))) return false;
    if (
      s.market.items.some(
        (q) => q.stock !== stocks.get(q.cityId + ":" + q.goodId),
      )
    )
      return false;
    const journey = s.voyage.active ?? s.voyage.lastArrival;
    if (
      journey &&
      !s.ledger.some(
        (e) =>
          e.id === journey.id &&
          e.kind === "travel" &&
          e.cashDelta === -journey.travelCost,
      )
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
export function parseSave(raw: string): SaveSnapshot | null {
  try {
    if (raw.length > 5_000_000) return null;
    const value: unknown = JSON.parse(raw);
    return validateSave(value) ? value : null;
  } catch {
    return null;
  }
}
export type StoragePort = Pick<Storage, "getItem" | "setItem">;
export class SaveService {
  private lastSeen: string | null = null;
  constructor(private storage: StoragePort | null) {}
  load() {
    if (!this.storage)
      return {
        snapshot: null,
        message: "本機儲存不可用，本次為記憶體模式，請匯出備份",
        mode: "memory" as const,
      };
    try {
      this.lastSeen = this.storage.getItem(SAVE_KEY);
      const main = this.lastSeen ? parseSave(this.lastSeen) : null;
      if (main)
        return {
          snapshot: main,
          message: "已載入本機進度",
          mode: "saved" as const,
        };
      const raw = this.storage.getItem(BACKUP_KEY),
        backup = raw ? parseSave(raw) : null;
      if (backup)
        return {
          snapshot: backup,
          message: "主存檔無法使用，已從上次備份恢復",
          mode: "saved" as const,
        };
      return {
        snapshot: null,
        message: this.lastSeen
          ? "存檔無法使用；本次由新遊戲開始，請保留備份"
          : "本機自動存檔已就緒",
        mode: this.lastSeen ? ("error" as const) : ("saved" as const),
      };
    } catch {
      return {
        snapshot: null,
        message: "本機儲存不可用，本次為記憶體模式，請匯出備份",
        mode: "memory" as const,
      };
    }
  }
  write(s: SaveSnapshot, force = false) {
    if (!this.storage)
      return {
        status: "memory" as const,
        message: "本機儲存不可用，進度僅在記憶體；請匯出備份",
      };
    if (!validateSave(s))
      return {
        status: "error" as const,
        message: "進度一致性檢查失敗，未覆蓋存檔；請匯出備份",
      };
    try {
      const current = this.storage.getItem(SAVE_KEY);
      if (!force && current !== this.lastSeen)
        return {
          status: "conflict" as const,
          message:
            "另一個分頁已更新進度，為避免覆蓋已停止自動儲存；請先匯出本頁備份",
        };
      const encoded = JSON.stringify(s);
      if (current && parseSave(current))
        this.storage.setItem(BACKUP_KEY, current);
      this.storage.setItem(SAVE_KEY, encoded);
      if (this.storage.getItem(SAVE_KEY) !== encoded)
        throw new Error("readback");
      this.lastSeen = encoded;
      return { status: "saved" as const, message: "已自動儲存於本機" };
    } catch {
      return {
        status: "error" as const,
        message: "本機存檔失敗，進度暫留記憶體；請先匯出備份",
      };
    }
  }
}
