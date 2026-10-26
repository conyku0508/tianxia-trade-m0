import type { MarketItem, Route } from "../contracts/game";
import { definitions } from "./fixture";
// V1 first playable loop: all values are MOCK CONFIG, not final economy balance.
export const playableCityIds = ["quanzhou", "ryukyu", "malacca"];
const priceOverrides: Record<string, Record<string, number>> = {
  ryukyu: {
    tea: 480,
    silk: 1100,
    porcelain: 680,
    timber: 70,
    dried_fish: 95,
    sugar: 90,
  },
  malacca: { tea: 500, silk: 1100, porcelain: 760, spice: 640 },
};
export const journeyRoutes: Route[] = [
  ...definitions.routes,
  ...definitions.routes.map((r) => ({
    ...r,
    id: `${r.toCityId}_quanzhou`,
    fromCityId: r.toCityId,
    toCityId: "quanzhou",
  })),
];
export const initialMarkets = (): MarketItem[] => [
  ...structuredClone(definitions.market),
  ...["ryukyu", "malacca"].flatMap((cityId) =>
    definitions.goods.map((g) => ({
      cityId,
      goodId: g.id,
      buyPrice: priceOverrides[cityId]?.[g.id] ?? g.basePrice,
      sellPrice: priceOverrides[cityId]?.[g.id] ?? g.basePrice,
      stock: 20,
      quotedDay: definitions.game.currentDay,
      priceTrend: "flat" as const,
      dataStatus: "mock" as const,
    })),
  ),
];
export const quickKnowledgeGoods = ["tea", "porcelain", "spice", "timber"];
