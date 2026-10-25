<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useCityStore, useGameStore } from "../stores";
import { goods } from "../data/fixture";
import { useServices } from "../services";
import { percent } from "../data/presentation";
import GameButton from "../components/ui/GameButton.vue";
import Overlay from "../components/ui/Overlay.vue";
const cities = useCityStore(),
  game = useGameStore(),
  router = useRouter(),
  { route } = useServices(),
  selected = ref<string | null>(null),
  zoom = ref(1),
  scroller = ref<HTMLElement>();
const city = computed(() =>
  selected.value ? cities.byId[selected.value] : null,
);
const available = computed(() =>
  route.listFrom(game.currentCityId).find((r) => r.toCityId === selected.value),
);
let drag: { x: number; y: number; left: number; top: number } | null = null;
function down(e: PointerEvent) {
  if ((e.target as HTMLElement).closest("button")) return;
  drag = {
    x: e.clientX,
    y: e.clientY,
    left: scroller.value!.scrollLeft,
    top: scroller.value!.scrollTop,
  };
  scroller.value!.setPointerCapture(e.pointerId);
}
function move(e: PointerEvent) {
  if (!drag) return;
  scroller.value!.scrollLeft = drag.left - (e.clientX - drag.x);
  scroller.value!.scrollTop = drag.top - (e.clientY - drag.y);
}
onMounted(() => {
  scroller.value!.scrollLeft = 510;
  scroller.value!.scrollTop = 60;
});
const names = (ids: string[]) =>
  ids.map((id) => goods.find((g) => g.id === id)?.name).join("、") ||
  "尚無情報";
</script>
<template>
  <div class="page-head">
    <div class="eyebrow">A WORLD OF POSSIBILITIES</div>
    <h1>四海通商圖</h1>
    <p>從泉州起航，讓每一次遠行皆有所獲。</p>
  </div>
  <div class="map-frame">
    <div class="map-controls">
      <GameButton
        secondary
        aria-label="縮小地圖"
        @click="zoom = Math.max(0.75, zoom - 0.25)"
        >−</GameButton
      ><GameButton
        secondary
        aria-label="放大地圖"
        @click="zoom = Math.min(1.75, zoom + 0.25)"
        >＋</GameButton
      >
    </div>
    <div
      ref="scroller"
      class="map-scroll"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="drag = null"
      @pointercancel="drag = null"
    >
      <div :style="{ width: 1000 * zoom + 'px', height: 740 * zoom + 'px' }">
        <div class="map-world" :style="{ transform: `scale(${zoom})` }">
          <svg viewBox="0 0 1000 740" aria-hidden="true">
            <defs>
              <pattern
                id="land"
                width="12"
                height="12"
                patternUnits="userSpaceOnUse"
              >
                <rect width="12" height="12" fill="#bfc39b" />
                <path d="M0 12 12 0" stroke="#8da17f" stroke-width=".5" />
              </pattern>
            </defs>
            <path
              d="M0 0H820L800 55 735 90 740 155 712 215 735 270 695 310 625 355 615 410 560 430 570 485 535 520 510 600 480 575 465 510 425 455 390 430 350 390 335 480 300 485 260 430 230 360 180 350 135 300 100 370 50 390 0 350Z"
              fill="url(#land)"
              stroke="#e2d4a8"
              stroke-width="3"
            />
            <path
              d="M840 130l-20 45 8 35-35 35 12 15 45-35 18-50Z M754 335l-12 30 14 25 10-40Z M450 595l45 12 60 55-12 18-70-50Z M565 660l90 8 25 18-105-9Z"
              fill="url(#land)"
              stroke="#e2d4a8"
              stroke-width="2"
            />
            <g fill="none" stroke="#d5c588" opacity=".5">
              <path
                d="M400 120l18-30 20 30 18-25 20 28 M550 220l20-35 20 35 18-23 15 23 M320 280l18-35 18 35"
              />
            </g>
            <path
              v-for="r in route.listFrom(game.currentCityId)"
              :key="r.id"
              :d="`M ${cities.byId[r.fromCityId]!.position.x * 1000} ${cities.byId[r.fromCityId]!.position.y * 740} Q 820 500 ${cities.byId[r.toCityId]!.position.x * 1000} ${cities.byId[r.toCityId]!.position.y * 740}`"
              fill="none"
              stroke="#f0ce7b"
              stroke-width="3"
              stroke-dasharray="8 7"
            /></svg
          ><span class="compass" aria-hidden="true"
            >✥<small style="display: block; font-size: 14px; text-align: center"
              >北</small
            ></span
          ><span class="sea-label">南 海</span
          ><button
            v-for="c in cities.items"
            :key="c.id"
            class="city-marker"
            :class="{
              current: c.id === game.currentCityId,
              selected: c.id === selected,
            }"
            :style="{
              left: c.position.x * 100 + '%',
              top: c.position.y * 100 + '%',
            }"
            :aria-label="'選擇' + c.name"
            @click="selected = c.id"
          >
            {{ c.id === game.currentCityId ? "⚑ " : "" }}{{ c.name }}
          </button>
        </div>
      </div>
    </div>
    <div class="map-legend">⚑ 所在港口　┄ 可規劃航線　· 示意地圖</div>
  </div>
  <p class="map-note">拖曳探索海域 · ＋／− 縮放 · 點選港口查看情報</p>
  <details>
    <summary class="map-note">港口索引 · {{ cities.items.length }} 城</summary>
    <div class="city-index">
      <GameButton
        v-for="c in cities.items"
        :key="c.id"
        secondary
        @click="selected = c.id"
        >{{ c.name }}</GameButton
      >
    </div>
  </details>
  <Overlay v-if="city" :title="city.name" @close="selected = null"
    ><span class="pill">{{
      city.id === game.currentCityId
        ? "所在港口 · 大型海港"
        : "示意港口 · 模擬摘要"
    }}</span>
    <h3 class="info-space">海路交會，百貨雲集</h3>
    <dl class="summary">
      <dt>主要出產</dt>
      <dd>{{ names(city.produces) }}</dd>
      <dt>需求商品</dt>
      <dd>{{ names(city.demands) }}</dd>
      <dt>城市稅率</dt>
      <dd>{{ percent(city.taxRate) }}</dd>
      <dt>基本風險</dt>
      <dd>{{ percent(city.risk) }}</dd>
      <dt>情報時間</dt>
      <dd>
        {{
          city.id === game.currentCityId
            ? "當地 · 第" + game.currentDay + "天"
            : "尚無港口觀察"
        }}
      </dd>
    </dl>
    <p class="muted">城市發展於 V1.5 開放；招募於 V2 開放。</p>
    <div class="actions">
      <GameButton
        v-if="city.id === game.currentCityId"
        @click="router.push('/market')"
        >進入市場</GameButton
      ><GameButton
        v-else-if="available"
        @click="router.push({ path: '/route', query: { id: available.id } })"
        >查看航線</GameButton
      ><GameButton v-else disabled>暫無原型航線</GameButton>
    </div></Overlay
  >
</template>
