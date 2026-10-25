<script setup lang="ts">
import { ref, computed } from "vue";
import type { Good, TradeMode, TradeRequest } from "../../contracts/game";
import { useServices } from "../../services";
import { useGameStore, useMarketStore, useUiStore } from "../../stores";
import { money } from "../../data/presentation";
import GameButton from "./GameButton.vue";
import Overlay from "./Overlay.vue";
const props = defineProps<{ good: Good; mode: TradeMode }>(),
  emit = defineEmits<{ close: [] }>(),
  { trade } = useServices(),
  game = useGameStore(),
  market = useMarketStore(),
  ui = useUiStore();
const quantity = ref("1"),
  confirmed = ref<TradeRequest | null>(null),
  pending = ref(false);
const request = computed(() => ({
  cityId: game.currentCityId,
  goodId: props.good.id,
  mode: props.mode,
  quantity: Number(quantity.value),
  expectedRevision: market.revision,
}));
const preview = computed(() => trade.preview(request.value));
const confirmation = computed(() =>
  confirmed.value ? trade.preview(confirmed.value) : null,
);
function execute() {
  if (pending.value || !confirmed.value) return;
  pending.value = true;
  const result =
    props.mode === "buy"
      ? trade.buy(confirmed.value)
      : trade.sell(confirmed.value);
  confirmed.value = null;
  if (result.ok) {
    ui.notify("交易完成，資產已同步");
    emit("close");
  } else {
    ui.notify(result.message);
    pending.value = false;
  }
}
</script>
<template>
  <Overlay
    :title="(mode === 'buy' ? '買入 ' : '賣出 ') + good.name"
    @close="emit('close')"
    ><p class="muted">本地固定模擬報價 · 交易包含城市稅</p>
    <div class="quantity">
      <GameButton
        secondary
        aria-label="減少數量"
        @click="quantity = String(Number(quantity) - 1)"
        >−</GameButton
      ><input
        v-model="quantity"
        aria-label="交易數量"
        inputmode="numeric"
        type="number"
        min="1"
        step="1"
      /><GameButton
        secondary
        aria-label="增加數量"
        @click="quantity = String(Number(quantity) + 1)"
        >＋</GameButton
      ><GameButton
        secondary
        @click="
          quantity = String(
            trade.maxQuantity(game.currentCityId, good.id, mode),
          )
        "
        >MAX</GameButton
      >
    </div>
    <template v-if="preview.ok"
      ><dl class="summary">
        <dt>單價</dt>
        <dd>{{ money(preview.value.unitPrice) }} 文</dd>
        <dt>本金</dt>
        <dd>{{ money(preview.value.subtotal) }} 文</dd>
        <dt>城市稅</dt>
        <dd>{{ money(preview.value.tax) }} 文</dd>
        <dt>{{ mode === "buy" ? "總支出" : "淨收入" }}</dt>
        <dd>
          <strong>{{ money(Math.abs(preview.value.cashDelta)) }} 文</strong>
        </dd>
        <dt>交易後現金</dt>
        <dd>{{ money(preview.value.moneyAfter) }} 文</dd>
        <dt>交易後載重</dt>
        <dd>{{ preview.value.usedWeightAfter }}</dd>
      </dl></template
    >
    <p v-else class="error" role="alert">{{ preview.message }}</p>
    <div class="actions">
      <GameButton secondary @click="emit('close')">取消交易</GameButton
      ><GameButton :disabled="!preview.ok" @click="confirmed = { ...request }"
        >確認摘要</GameButton
      >
    </div></Overlay
  ><Overlay v-if="confirmed" modal title="確認交易" @close="confirmed = null"
    ><p>
      {{ mode === "buy" ? "買入" : "賣出" }} {{ good.name }} ×
      {{ confirmed.quantity }}
    </p>
    <p v-if="confirmation?.ok" class="info-space">
      {{ mode === "buy" ? "總支出" : "淨收入" }}
      {{ money(Math.abs(confirmation.value.cashDelta)) }} 文（含稅）
    </p>
    <p v-else class="error">
      {{ confirmation && !confirmation.ok ? confirmation.message : "" }}
    </p>
    <div class="actions">
      <GameButton secondary @click="confirmed = null">取消</GameButton
      ><GameButton :disabled="pending || !confirmation?.ok" @click="execute"
        >確認{{ mode === "buy" ? "買入" : "賣出" }}</GameButton
      >
    </div></Overlay
  >
</template>
