import { defineStore } from "pinia";
import { freshFixture, definitions } from "../data/fixture";
export const usePlayerStore = defineStore("player", {
  state: () => freshFixture().player,
});
export const useGameStore = defineStore("game", {
  state: () => freshFixture().game,
});
export const useCargoStore = defineStore("cargo", {
  state: () => ({ items: freshFixture().cargo }),
});
export const useMarketStore = defineStore("market", {
  state: () => ({ items: freshFixture().market, revision: 1 }),
});
export const useCityStore = defineStore("city", {
  state: () => ({ items: freshFixture().cities }),
  getters: { byId: (s) => Object.fromEntries(s.items.map((c) => [c.id, c])) },
});
export const useKnowledgeStore = defineStore("knowledge", {
  state: () => ({
    records: freshFixture().knowledge,
    events: freshFixture().events,
  }),
  getters: {
    observations: (s) => (day: number) =>
      s.records.map((k) => ({
        ...k,
        age: k.observedDay === null ? null : day - k.observedDay,
      })),
  },
});
export const useRouteStore = defineStore("route", {
  state: () => freshFixture().routeState,
});
export const useUiStore = defineStore("ui", {
  state: () => ({ toast: "", resetKey: 0 }),
  actions: {
    notify(text: string) {
      this.toast = text;
      setTimeout(() => {
        if (this.toast === text) this.toast = "";
      }, 3500);
    },
  },
});
export function resetPrototype() {
  const f = freshFixture();
  usePlayerStore().$patch(f.player);
  useGameStore().$patch(f.game);
  useCargoStore().items = f.cargo;
  const m = useMarketStore();
  m.items = f.market;
  m.revision++;
  useCityStore().items = f.cities;
  useKnowledgeStore().$patch({ records: f.knowledge, events: f.events });
  useRouteStore().$patch(f.routeState);
  useUiStore().resetKey++;
  useUiStore().notify("原型資料已重設");
}
export { definitions };
