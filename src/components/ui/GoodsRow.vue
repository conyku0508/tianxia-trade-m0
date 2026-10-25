<script setup lang="ts">
import type { Good, MarketItem, CargoItem } from "../../contracts/game";
import GameButton from "./GameButton.vue";
import GamePanel from "./GamePanel.vue";
import ArtIcon from "./ArtIcon.vue";
import { money, categories } from "../../data/presentation";
defineProps<{ good: Good; quote: MarketItem; held?: CargoItem }>();
defineEmits<{ trade: [mode: "buy" | "sell"] }>();
</script>
<template>
  <GamePanel class="goods-row" :data-testid="'good-' + good.id"
    ><div class="goods-top">
      <ArtIcon :name="good.id" class="commodity-art" />
      <div class="goods-name">
        <h3>{{ good.name }}</h3>
        <small
          >{{ categories[good.category] }} · {{ good.weight }} 載重／件</small
        >
      </div>
      <div class="goods-price">
        {{ money(quote.buyPrice)
        }}<small style="display: block; font-weight: 400">文／件</small>
      </div>
    </div>
    <div class="goods-details">
      <span>庫存 {{ quote.stock }}</span
      ><span>持有 {{ held?.quantity ?? 0 }}</span
      ><span>均成本 {{ held ? money(held.averageCost) : "—" }}</span
      ><span>— 持平</span>
    </div>
    <div class="actions">
      <GameButton :disabled="quote.stock === 0" @click="$emit('trade', 'buy')"
        >買入</GameButton
      ><GameButton secondary :disabled="!held" @click="$emit('trade', 'sell')"
        >賣出</GameButton
      >
    </div></GamePanel
  >
</template>
