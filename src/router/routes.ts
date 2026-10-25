import { createRouter, createWebHashHistory } from "vue-router";
import MapPage from "../pages/MapPage.vue";
import MarketPage from "../pages/MarketPage.vue";
import CargoPage from "../pages/CargoPage.vue";
import IntelligencePage from "../pages/IntelligencePage.vue";
import RoutePage from "../pages/RoutePage.vue";
import MenuPage from "../pages/MenuPage.vue";
export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/map" },
    { path: "/map", component: MapPage },
    { path: "/market", component: MarketPage },
    { path: "/cargo", component: CargoPage },
    { path: "/intelligence", component: IntelligencePage },
    { path: "/route", component: RoutePage },
    { path: "/menu", component: MenuPage },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
