<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useServices } from "../services";
import {
  useCityStore,
  useGameStore,
  useRouteStore,
  useUiStore,
  useVoyageStore,
  useMarketStore,
} from "../stores";
import { money, percent } from "../data/presentation";
import GamePanel from "../components/ui/GamePanel.vue";
import GameButton from "../components/ui/GameButton.vue";
import Overlay from "../components/ui/Overlay.vue";
const { route, voyage } = useServices(),
  cities = useCityStore(),
  game = useGameStore(),
  state = useRouteStore(),
  ui = useUiStore(),
  url = useRoute(),
  selected = ref(typeof url.query.id === "string" ? url.query.id : ""),
  show = ref(false),
  transit = useVoyageStore(),
  market = useMarketStore(),
  departure = ref<{ routeId: string; revision: number } | null>(null),
  pending = ref(false);
const departurePreview = computed(() =>
  departure.value
    ? voyage.preview(departure.value.routeId, departure.value.revision)
    : null,
);
function depart() {
  if (pending.value || !departure.value) return;
  pending.value = true;
  const r = voyage.depart(departure.value.routeId, departure.value.revision);
  departure.value = null;
  if (r.ok) {
    ui.notify("已出航，旅費已支付");
    window.location.hash = "/sailing";
  } else ui.notify(r.message);
  pending.value = false;
}
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
  <GamePanel v-if="transit.active"
    ><h2>商隊正在航行中</h2>
    <p class="info-space">抵達前無法改航線或重複出航。</p>
    <div class="actions">
      <GameButton @click="$router.push('/sailing')">繼續航行</GameButton>
    </div></GamePanel
  >
  <div v-else class="route-layout">
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
          準備只保存選擇，不扣費。另按「確認出航」才扣旅費；航行以「航行一天」推進，抵達才更換城市。
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
          <GameButton secondary @click="route.cancel()">取消準備</GameButton
          ><GameButton
            @click="
              departure = { routeId: prepared.id, revision: market.revision }
            "
            >確認出航</GameButton
          >
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
      Config；本階段風險僅提示，不抽取隨機損失。
    </p>
    <div class="actions">
      <GameButton secondary @click="show = false">返回規劃</GameButton
      ><GameButton :disabled="!preview.value.canPrepare" @click="prepare"
        >準備前往</GameButton
      >
    </div></Overlay
  >
  <Overlay v-if="departure" modal title="確認出航" @close="departure = null"
    ><template v-if="departurePreview?.ok"
      ><h3>
        {{ cities.byId[departurePreview.value.fromCityId]?.name }} →
        {{ cities.byId[departurePreview.value.toCityId]?.name }}
      </h3>
      <p class="info-space">
        立即支付旅費 {{ money(departurePreview.value.travelCost) }} 文；預計
        {{
          departurePreview.value.travelDays
        }}
        天。出航後不可取消退款，逐日航行直到抵達。
      </p></template
    >
    <p v-else class="error">
      {{
        departurePreview && !departurePreview.ok ? departurePreview.message : ""
      }}
    </p>
    <div class="actions">
      <GameButton secondary @click="departure = null">取消</GameButton
      ><GameButton :disabled="pending || !departurePreview?.ok" @click="depart"
        >支付旅費並出航</GameButton
      >
    </div></Overlay
  >
</template>
