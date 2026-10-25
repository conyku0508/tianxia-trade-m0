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
import ArtIcon from "./components/ui/ArtIcon.vue";
const game = useGameStore(),
  player = usePlayerStore(),
  cities = useCityStore(),
  ui = useUiStore(),
  services = useServices(),
  route = useRoute();
const summary = computed(() => services.trade.cargoSummary());
const nav = [
  ["/map", "map", "地圖"],
  ["/market", "market", "市場"],
  ["/cargo", "cargo", "貨艙"],
  ["/intelligence", "intelligence", "情報"],
  ["/menu", "menu", "選單"],
];
</script>
<template>
  <header class="top">
    <div class="top-line">
      <RouterLink to="/map" class="brand" style="text-decoration: none"
        ><svg class="brand-ship" viewBox="0 0 40 36" aria-hidden="true">
          <path d="M4 26h32l-7 7H11Z" fill="#d9b864" />
          <path
            d="M18 2v22H5Z M22 7v17h13Z"
            fill="#edd39a"
            stroke="#a98c48"
            stroke-width="1"
          />
          <path d="M18 0v27M22 5v22" stroke="#c4a463" stroke-width="2" /></svg
        >天下商路</RouterLink
      ><span class="prototype">M0 · 模擬資料</span>
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
      ><ArtIcon :name="icon!" kind="nav" />{{ label }}</RouterLink
    >
  </nav>
  <div v-if="ui.toast" class="toast" role="status">{{ ui.toast }}</div>
</template>
