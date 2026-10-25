<script setup lang="ts">
import { computed, ref } from "vue";
import { goods } from "../data/fixture";
import { categories, money, percent } from "../data/presentation";
import { useServices } from "../services";
import { useCargoStore, useGameStore, useCityStore } from "../stores";
import type { Good, TradeMode } from "../contracts/game";
import GoodsRow from "../components/ui/GoodsRow.vue";
import TradeControl from "../components/ui/TradeControl.vue";
import GameButton from "../components/ui/GameButton.vue";
import GamePanel from "../components/ui/GamePanel.vue";
const { market, trade } = useServices(),
  cargo = useCargoStore(),
  game = useGameStore(),
  cities = useCityStore(),
  filter = ref("all"),
  draft = ref<{ good: Good; mode: TradeMode } | null>(null);
const quotes = computed(() => market.list(game.currentCityId));
const list = computed(() =>
  goods.filter((g) => filter.value === "all" || g.category === filter.value),
);
const summary = computed(() => trade.cargoSummary());
</script>
<template>
  <div class="page-head">
    <div class="eyebrow">THE MERCHANT'S EXCHANGE</div>
    <h1>{{ cities.byId[game.currentCityId]?.name }}市場</h1>
    <p>
      滿載而歸，始於一筆好交易。城市稅
      {{ percent(cities.byId[game.currentCityId]!.taxRate) }} · 固定模擬報價
    </p>
  </div>
  <div class="filters" aria-label="商品分類">
    <GameButton
      secondary
      :class="{ chosen: filter === 'all' }"
      @click="filter = 'all'"
      >全部 · {{ goods.length }}</GameButton
    ><GameButton
      v-for="(name, key) in categories"
      :key="key"
      secondary
      :class="{ chosen: filter === key }"
      @click="filter = String(key)"
      >{{ name }}</GameButton
    >
  </div>
  <div class="market-layout">
    <div class="goods-list">
      <template v-for="good in list" :key="good.id"
        ><GoodsRow
          v-if="quotes.find((q) => q.goodId === good.id)"
          :good="good"
          :quote="quotes.find((q) => q.goodId === good.id)!"
          :held="cargo.items.find((c) => c.goodId === good.id)"
          @trade="(mode: TradeMode) => (draft = { good, mode })"
      /></template>
    </div>
    <GamePanel class="desktop-aside"
      ><div class="eyebrow" style="color: #805712">商隊手記</div>
      <h2>留有餘裕，方行萬里</h2>
      <p class="info-space">
        商品價格為稅前單價。確認前，交易摘要會列出稅金與實際支出。
      </p>
      <hr class="divider" />
      <p>載重 {{ summary.usedWeight }} / {{ summary.capacity }}</p>
      <p>貨物成本 {{ money(summary.totalCost) }} 文</p>
      <p class="info-space muted">選擇買入或賣出，開啟交易面板。</p></GamePanel
    >
  </div>
  <TradeControl
    v-if="draft"
    :key="draft.good.id + draft.mode"
    :good="draft.good"
    :mode="draft.mode"
    @close="draft = null"
  />
</template>
