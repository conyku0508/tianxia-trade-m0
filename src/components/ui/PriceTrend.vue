<script setup lang="ts">
import { computed } from "vue";
import type { PriceObservation } from "../../contracts/game";
const props = defineProps<{ history: PriceObservation[] }>();
const points = computed(() => {
  const h = props.history;
  if (!h.length) return [];
  const min = Math.min(...h.map((p) => p.price)),
    max = Math.max(...h.map((p) => p.price)),
    first = h[0].day,
    last = h[h.length - 1].day;
  return h.map((p) => ({
    ...p,
    x: 32 + ((p.day - first) / Math.max(1, last - first)) * 236,
    y: 62 - ((p.price - min) / Math.max(1, max - min)) * 22,
  }));
});
const line = computed(() => points.value.map((p) => `${p.x},${p.y}`).join(" "));
</script>
<template>
  <figure v-if="history.length" class="price-history">
    <figcaption class="ledger-heading">行情紀錄</figcaption>
    <svg
      class="trend"
      viewBox="0 0 300 98"
      role="img"
      :aria-label="
        history.map((p) => '第' + p.day + '天 ' + p.price + '文').join('，')
      "
    >
      <path d="M20 78H280" stroke="#b9a77d" />
      <g v-for="(point, i) in points" :key="i">
        <path
          :d="`M${point.x} ${point.y}V78`"
          stroke="#c6aa65"
          stroke-dasharray="2 3"
        />
        <text
          :x="point.x"
          :y="point.y - 13"
          text-anchor="middle"
          fill="#2c342b"
          font-size="13"
        >
          {{ point.price }} 文
        </text>
        <text
          :x="point.x"
          y="95"
          text-anchor="middle"
          fill="#685d45"
          font-size="12"
        >
          第{{ point.day }}天
        </text>
      </g>
      <polyline :points="line" fill="none" stroke="#1d5547" stroke-width="2" />
      <circle
        v-for="(point, i) in points"
        :key="i"
        :cx="point.x"
        :cy="point.y"
        r="4"
        fill="#d2ac4c"
        stroke="#725c28"
        stroke-width="1.3"
      /></svg
    ><span class="sr-only">僅連接已知觀察點</span>
  </figure>
</template>
