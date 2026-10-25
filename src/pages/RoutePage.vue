<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useServices } from "../services";
import {
  useCityStore,
  useGameStore,
  useRouteStore,
  useUiStore,
} from "../stores";
import { money, percent } from "../data/presentation";
import GamePanel from "../components/ui/GamePanel.vue";
import GameButton from "../components/ui/GameButton.vue";
import Overlay from "../components/ui/Overlay.vue";
const { route } = useServices(),
  cities = useCityStore(),
  game = useGameStore(),
  state = useRouteStore(),
  ui = useUiStore(),
  url = useRoute(),
  selected = ref(typeof url.query.id === "string" ? url.query.id : ""),
  show = ref(false);
const list = computed(() => route.listFrom(game.currentCityId)),
  preview = computed(() =>
    selected.value ? route.preview(selected.value) : null,
  ),
  prepared = computed(() =>
    list.value.find((r) => r.id === state.selectedRouteId),
  );
function prepare() {
  const result = route.prepare(selected.value);
  ui.notify(result.ok ? "航線已準備；尚未出發" : result.message);
  show.value = false;
}
</script>
<template>
  <div class="page-head">
    <div class="eyebrow">CHART YOUR NEXT PASSAGE</div>
    <h1>航線規劃</h1>
    <p>
      起點：{{ cities.byId[game.currentCityId]?.name }} ·
      先了解旅費與風險，再準備前往。
    </p>
  </div>
  <div class="route-layout">
    <div>
      <button
        v-for="r in list"
        :key="r.id"
        class="panel route-card"
        :class="{ selected: selected === r.id }"
        @click="selected = r.id"
      >
        <span class="pill">海路 · 模擬路線</span>
        <h2 class="info-space">
          {{ cities.byId[r.fromCityId]?.name }} →
          {{ cities.byId[r.toCityId]?.name }}
        </h2>
        <div class="stat-grid">
          <div>
            <small>所需日數</small><strong>{{ r.travelDays }} 天</strong>
          </div>
          <div>
            <small>旅費</small><strong>{{ money(r.travelCost) }} 文</strong>
          </div>
          <div>
            <small>基本風險</small><strong>{{ percent(r.risk) }}</strong>
          </div>
        </div>
        <span>{{ selected === r.id ? "✓ 已選擇" : "點選此航線" }}</span>
      </button>
    </div>
    <div>
      <GamePanel
        ><h2>行前摘要</h2>
        <template v-if="preview?.ok"
          ><h3 class="info-space">
            {{ cities.byId[game.currentCityId]?.name }} →
            {{ cities.byId[preview.value.route.toCityId]?.name }}
          </h3>
          <dl class="summary">
            <dt>時間</dt>
            <dd>{{ preview.value.route.travelDays }} 天</dd>
            <dt>費用</dt>
            <dd>{{ money(preview.value.route.travelCost) }} 文</dd>
            <dt>風險</dt>
            <dd>{{ percent(preview.value.route.risk) }}</dd>
          </dl>
          <p v-if="!preview.value.canPrepare" class="error">
            {{
              preview.value.reason === "OUT_OF_RANGE"
                ? "超出商船航程"
                : "現金不足旅費或起點不符"
            }}
          </p>
          <div class="actions">
            <GameButton secondary @click="show = true">路線詳細</GameButton
            ><GameButton :disabled="!preview.value.canPrepare" @click="prepare"
              >準備前往</GameButton
            >
          </div></template
        >
        <p v-else class="info-space">請選擇一條航線。</p>
        <p class="muted info-space">
          準備只保存選擇，不扣費、不推進時間、不更換城市。實際航行於後續版本開放。
        </p></GamePanel
      ><GamePanel v-if="state.status === 'prepared' && prepared"
        ><div class="route-status" role="status">
          <strong
            >已準備：{{ cities.byId[game.currentCityId]?.name }} →
            {{ cities.byId[prepared.toCityId]?.name }}</strong
          >
          <p>尚未出發 · 資產維持不變</p>
        </div>
        <div class="actions">
          <GameButton secondary @click="route.cancel()">取消準備</GameButton>
        </div></GamePanel
      >
    </div>
  </div>
  <Overlay v-if="show && preview?.ok" title="路線詳細" @close="show = false"
    ><h2>{{ cities.byId[preview.value.route.toCityId]?.name }}</h2>
    <p class="info-space">
      航行 {{ preview.value.route.travelDays }} 天 · 旅費
      {{ money(preview.value.route.travelCost) }} 文
    </p>
    <p class="info-space">
      基本風險 {{ percent(preview.value.route.risk) }}，為 Mock
      Config；尚未啟用事件概率或航行結算。
    </p>
    <div class="actions">
      <GameButton secondary @click="show = false">返回規劃</GameButton
      ><GameButton :disabled="!preview.value.canPrepare" @click="prepare"
        >準備前往</GameButton
      >
    </div></Overlay
  >
</template>
