<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  useGameStore,
  usePlayerStore,
  useCityStore,
  useUiStore,
} from "./stores";
import { useServices } from "./services";
import { money } from "./data/presentation";
const game = useGameStore(),
  player = usePlayerStore(),
  cities = useCityStore(),
  ui = useUiStore(),
  services = useServices(),
  route = useRoute();
const summary = computed(() => services.trade.cargoSummary());
const nav = [
  ["/map", "◎", "地圖"],
  ["/market", "⚖", "市場"],
  ["/cargo", "▣", "貨艙"],
  ["/intelligence", "◈", "情報"],
  ["/menu", "☰", "選單"],
];
</script>
<template>
  <header class="top">
    <div class="top-line">
      <RouterLink to="/map" class="brand" style="text-decoration: none"
        >天下商路</RouterLink
      ><span class="prototype">M0 原型／模擬資料</span>
    </div>
    <div class="status">
      <span
        >{{ cities.byId[game.currentCityId]?.name }} · 第{{
          game.currentDay
        }}天</span
      ><strong data-testid="money">{{ money(player.money) }} 文</strong
      ><RouterLink to="/cargo"
        >載重 {{ summary.usedWeight }} / {{ summary.capacity }}</RouterLink
      >
    </div>
  </header>
  <main class="main"><RouterView :key="ui.resetKey" /></main>
  <nav class="bottom" aria-label="主要導覽">
    <RouterLink
      v-for="[path, icon, label] in nav"
      :key="path"
      :to="path!"
      :class="{
        active:
          route.path === path || (path === '/map' && route.path === '/route'),
      }"
      ><b aria-hidden="true">{{ icon }}</b
      >{{ label }}</RouterLink
    >
  </nav>
  <div v-if="ui.toast" class="toast" role="status">{{ ui.toast }}</div>
</template>
