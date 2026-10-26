import type {
  TradeSnapshot,
  TradeRequest,
  TradePreview,
  TradeError,
  Result,
  Good,
  City,
  CargoSummary,
} from "../contracts/game";
import { epsilon } from "../data/fixture";
export interface TradePort {
  snapshot(): TradeSnapshot;
  commit(p: TradePreview): void;
}
const errors: Record<TradeError, string> = {
  INVALID_QUANTITY: "數量須為有限正整數",
  INVALID_MODE: "交易模式不符",
  UNKNOWN_GOOD: "找不到商品",
  NO_QUOTE: "當地無有效報價",
  WRONG_CITY: "只能交易所在城市",
  INSUFFICIENT_STOCK: "市場庫存不足",
  INSUFFICIENT_FUNDS: "現金不足（含稅）",
  OVER_CAPACITY: "超出貨艙載重",
  INSUFFICIENT_CARGO: "持有數量不足",
  STALE_PREVIEW: "摘要已過期，請重新取得摘要並確認",
  BUSY: "交易處理中",
  IN_TRANSIT: "航行中無法交易，請先抵達港口",
};
export class TradeService {
  private busy = false;
  constructor(
    private port: TradePort,
    private goods: Good[],
    private cities: City[],
  ) {}
  private fail(error: TradeError): Result<never, TradeError> {
    return { ok: false, error, message: errors[error] };
  }
  cargoRows() {
    const s = this.port.snapshot();
    return s.cargo.map((c) => {
      const g = this.goods.find((g) => g.id === c.goodId)!;
      const q = s.market.find(
        (q) => q.cityId === s.game.currentCityId && q.goodId === g.id,
      );
      const value = q ? c.quantity * q.sellPrice : null;
      return {
        ...c,
        good: g,
        weight: g.weight * c.quantity,
        totalCost: c.quantity * c.averageCost,
        localValue: value,
        profit: value === null ? null : value - c.quantity * c.averageCost,
      };
    });
  }
  cargoSummary(): CargoSummary {
    const s = this.port.snapshot(),
      rows = this.cargoRows(),
      totalCost = rows.reduce((n, c) => n + c.totalCost, 0),
      localValue = rows.some((c) => c.localValue === null)
        ? null
        : rows.reduce((n, c) => n + c.localValue!, 0);
    return {
      usedWeight: rows.reduce((n, c) => n + c.weight, 0),
      capacity: s.player.transport.cargoCapacity,
      totalCost,
      localValue,
      unrealizedProfit: localValue === null ? null : localValue - totalCost,
    };
  }
  preview(r: TradeRequest): Result<TradePreview, TradeError> {
    const s = this.port.snapshot();
    if (s.inTransit) return this.fail("IN_TRANSIT");
    if (r.expectedRevision !== s.revision) return this.fail("STALE_PREVIEW");
    if (r.mode !== "buy" && r.mode !== "sell") return this.fail("INVALID_MODE");
    if (
      !Number.isFinite(r.quantity) ||
      !Number.isInteger(r.quantity) ||
      r.quantity <= 0
    )
      return this.fail("INVALID_QUANTITY");
    if (r.cityId !== s.game.currentCityId) return this.fail("WRONG_CITY");
    const g = this.goods.find((g) => g.id === r.goodId);
    if (!g) return this.fail("UNKNOWN_GOOD");
    const city = this.cities.find((c) => c.id === r.cityId),
      q = s.market.find((q) => q.goodId === r.goodId && q.cityId === r.cityId);
    if (
      !city ||
      !q ||
      !Number.isFinite(q.buyPrice) ||
      !Number.isFinite(q.sellPrice) ||
      q.buyPrice <= 0 ||
      q.sellPrice <= 0 ||
      !Number.isInteger(q.stock) ||
      q.stock < 0 ||
      !Number.isFinite(city.taxRate) ||
      city.taxRate < 0 ||
      city.taxRate > 1
    )
      return this.fail("NO_QUOTE");
    const old = s.cargo.find((c) => c.goodId === g.id),
      held = old?.quantity ?? 0,
      buy = r.mode === "buy",
      unitPrice = buy ? q.buyPrice : q.sellPrice,
      subtotal = unitPrice * r.quantity,
      tax = Math.ceil(subtotal * city.taxRate),
      cashDelta = buy ? -(subtotal + tax) : subtotal - tax,
      moneyAfter = s.player.money + cashDelta,
      quantityAfter = held + (buy ? r.quantity : -r.quantity),
      usedWeightAfter =
        this.cargoSummary().usedWeight + (buy ? 1 : -1) * r.quantity * g.weight;
    if (buy && r.quantity > q.stock) return this.fail("INSUFFICIENT_STOCK");
    if (!buy && r.quantity > held) return this.fail("INSUFFICIENT_CARGO");
    if (!Number.isFinite(moneyAfter) || moneyAfter < 0)
      return this.fail("INSUFFICIENT_FUNDS");
    if (
      !Number.isFinite(usedWeightAfter) ||
      usedWeightAfter > s.player.transport.cargoCapacity + epsilon
    )
      return this.fail("OVER_CAPACITY");
    const averageCostAfter =
      quantityAfter === 0
        ? null
        : buy
          ? ((old?.averageCost ?? 0) * held - cashDelta) / quantityAfter
          : old!.averageCost;
    return {
      ok: true,
      value: {
        costBasis: buy ? 0 : (old?.averageCost ?? 0) * r.quantity,
        realizedProfit: buy
          ? null
          : cashDelta - (old?.averageCost ?? 0) * r.quantity,
        request: { ...r },
        unitPrice,
        subtotal,
        tax,
        cashDelta,
        moneyAfter,
        usedWeightAfter,
        quantityAfter,
        averageCostAfter,
      },
    };
  }
  private execute(r: TradeRequest, mode: "buy" | "sell") {
    if (r.mode !== mode) return this.fail("INVALID_MODE");
    if (this.busy) return this.fail("BUSY");
    this.busy = true;
    try {
      const result = this.preview(r);
      if (result.ok) this.port.commit(result.value);
      return result;
    } finally {
      this.busy = false;
    }
  }
  buy(r: TradeRequest) {
    return this.execute(r, "buy");
  }
  sell(r: TradeRequest) {
    return this.execute(r, "sell");
  }
  maxQuantity(cityId: string, goodId: string, mode: "buy" | "sell") {
    const s = this.port.snapshot();
    if (s.inTransit || cityId !== s.game.currentCityId) return 0;
    const q = s.market.find((q) => q.cityId === cityId && q.goodId === goodId);
    const g = this.goods.find((g) => g.id === goodId);
    if (!q || !g) return 0;
    if (mode === "sell")
      return s.cargo.find((c) => c.goodId === goodId)?.quantity ?? 0;
    let low = 0,
      high = Math.max(
        0,
        Math.min(
          q.stock,
          Math.floor(
            (s.player.transport.cargoCapacity -
              this.cargoSummary().usedWeight +
              epsilon) /
              g.weight,
          ),
        ),
      );
    while (low < high) {
      const mid = Math.ceil((low + high) / 2),
        r = this.preview({
          cityId,
          goodId,
          mode,
          quantity: mid,
          expectedRevision: s.revision,
        });
      if (r.ok) low = mid;
      else high = mid - 1;
    }
    return low;
  }
}
