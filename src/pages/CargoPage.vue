<script setup lang="ts">
import { computed } from "vue";
import { useServices } from "../services";
import { money, symbols } from "../data/presentation";
import GamePanel from "../components/ui/GamePanel.vue";
import GameButton from "../components/ui/GameButton.vue";
const { trade } = useServices(),
  summary = computed(() => trade.cargoSummary()),
  rows = computed(() => trade.cargoRows());
</script>
<template>
  <div class="page-head">
    <div class="eyebrow">THE HOLD & THE HORIZON</div>
    <h1>商船貨艙</h1>
    <p>一艙貨物，一段海路。所有持貨與市場即時同步。</p>
  </div>
  <div class="cargo-layout">
    <GamePanel
      ><h2>載重 {{ summary.usedWeight }} / {{ summary.capacity }}</h2>
      <progress
        class="progress"
        :value="summary.usedWeight"
        :max="summary.capacity"
        aria-label="貨艙載重"
      />
      <dl class="summary">
        <dt>總成本（含買入稅）</dt>
        <dd>{{ money(summary.totalCost) }}</dd>
        <dt>當地稅前估值</dt>
        <dd>{{ money(summary.localValue) }}</dd>
        <dt>未實現盈虧</dt>
        <dd :class="{ negative: (summary.unrealizedProfit ?? 0) < 0 }">
          {{ money(summary.unrealizedProfit) }}
        </dd>
      </dl>
      <small>估值未扣除未來賣出稅；並非已實現收益。</small></GamePanel
    >
    <div>
      <GamePanel v-if="!rows.length" class="empty"
        ><div class="empty-symbol">▣</div>
        <h2>貨艙尚無貨物</h2>
        <p class="info-space">前往泉州市場，開始第一筆交易。</p>
        <div class="actions">
          <GameButton @click="$router.push('/market')">前往市場</GameButton>
        </div></GamePanel
      ><GamePanel v-for="row in rows" :key="row.goodId"
        ><div class="goods-top">
          <div class="good-icon">{{ symbols[row.good.category] }}</div>
          <h2>{{ row.good.name }}</h2>
          <strong style="margin-left: auto">× {{ row.quantity }}</strong>
        </div>
        <div class="stat-grid">
          <div>
            <small>平均成本</small><strong>{{ money(row.averageCost) }}</strong>
          </div>
          <div>
            <small>稅前估值</small><strong>{{ money(row.localValue) }}</strong>
          </div>
          <div>
            <small>重量</small><strong>{{ row.weight }}</strong>
          </div>
        </div>
        <p>
          未實現盈虧
          <strong :class="{ negative: (row.profit ?? 0) < 0 }"
            >{{ money(row.profit) }} 文</strong
          >
        </p>
        <div class="actions">
          <GameButton secondary @click="$router.push('/market')"
            >返回市場交易</GameButton
          ><GameButton @click="$router.push('/intelligence')"
            >查看貿易情報</GameButton
          >
        </div></GamePanel
      >
    </div>
  </div>
</template>
