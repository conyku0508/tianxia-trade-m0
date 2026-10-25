import {
  usePlayerStore,
  useGameStore,
  useCargoStore,
  useMarketStore,
  useRouteStore,
  useCityStore,
} from "../stores";
import { goods, routes } from "../data/fixture";
import { TradeService } from "./TradeService";
import { MarketService } from "./MarketService";
import { RouteService } from "./RouteService";
export function useServices() {
  const p = usePlayerStore(),
    g = useGameStore(),
    c = useCargoStore(),
    m = useMarketStore(),
    r = useRouteStore();
  const trade = new TradeService(
    {
      snapshot: () => ({
        player: p,
        game: g,
        cargo: c.items,
        market: m.items,
        revision: m.revision,
      }),
      commit: (t) => {
        p.money = t.moneyAfter;
        const index = c.items.findIndex((i) => i.goodId === t.request.goodId);
        if (index >= 0) c.items.splice(index, 1);
        if (t.quantityAfter > 0)
          c.items.push({
            goodId: t.request.goodId,
            quantity: t.quantityAfter,
            averageCost: t.averageCostAfter!,
          });
        const quote = m.items.find(
          (i) => i.cityId === t.request.cityId && i.goodId === t.request.goodId,
        )!;
        quote.stock +=
          t.request.mode === "buy" ? -t.request.quantity : t.request.quantity;
        m.revision++;
      },
    },
    goods,
    useCityStore().items,
  );
  return {
    trade,
    market: new MarketService(() => m.items),
    route: new RouteService(
      routes,
      () => ({ game: g, player: p }),
      (s) => r.$patch(s),
    ),
  };
}
