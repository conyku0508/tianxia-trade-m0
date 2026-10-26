import {
  usePlayerStore,
  useGameStore,
  useCargoStore,
  useMarketStore,
  useRouteStore,
  useCityStore,
  useVoyageStore,
  useLedgerStore,
  useKnowledgeStore,
} from "../stores";
import { goods } from "../data/fixture";
import { journeyRoutes } from "../data/journeyConfig";
import { VoyageService } from "./VoyageService";
import { ledgerSummary } from "./ledger";
import { TradeService } from "./TradeService";
import { MarketService } from "./MarketService";
import { RouteService } from "./RouteService";
export function useServices() {
  const p = usePlayerStore(),
    g = useGameStore(),
    c = useCargoStore(),
    m = useMarketStore(),
    r = useRouteStore(),
    v = useVoyageStore(),
    l = useLedgerStore(),
    k = useKnowledgeStore();
  const trade = new TradeService(
    {
      snapshot: () => ({
        player: p,
        game: g,
        cargo: c.items,
        market: m.items,
        revision: m.revision,
        inTransit: !!v.active,
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
        l.entries.push({
          id: `trade-${m.revision}`,
          kind: t.request.mode,
          day: g.currentDay,
          cityId: g.currentCityId,
          goodId: t.request.goodId,
          quantity: t.request.quantity,
          subtotal: t.subtotal,
          tax: t.tax,
          cashDelta: t.cashDelta,
          costBasis: t.costBasis,
          realizedProfit: t.realizedProfit ?? 0,
        });
        m.revision++;
      },
    },
    goods,
    useCityStore().items,
  );
  return {
    trade,
    statement: () => ledgerSummary(l.entries),
    voyage: new VoyageService(journeyRoutes, {
      state: () => ({
        game: g,
        player: p,
        route: r,
        voyage: v,
        market: m.items,
        revision: m.revision,
        knowledge: k.records,
        cargo: c.items,
      }),
      depart: (voyage, observed, entry) => {
        p.money = voyage.cashBefore - voyage.travelCost;
        v.active = voyage;
        v.lastArrival = null;
        k.records = observed;
        l.entries.push(entry);
        m.revision++;
      },
      advance: (next, arrival, observed) => {
        g.currentDay++;
        if (arrival) {
          g.currentCityId = arrival.toCityId;
          v.active = null;
          v.lastArrival = arrival;
          r.$patch({ selectedRouteId: null, status: "idle" });
          k.records = observed!;
          for (const quote of m.items.filter(
            (q) => q.cityId === arrival.toCityId,
          ))
            quote.quotedDay = arrival.arrivalDay;
        } else v.active = next;
        m.revision++;
      },
    }),
    market: new MarketService(() => m.items),
    route: new RouteService(
      journeyRoutes,
      () => ({ game: g, player: p, inTransit: !!v.active }),
      (s) => r.$patch(s),
    ),
  };
}
