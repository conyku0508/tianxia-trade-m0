<script setup lang="ts">
import { computed } from "vue";
import type { PriceObservation } from "../../contracts/game";
const props = defineProps<{ history: PriceObservation[] }>();
const points = computed(() => {
  const h = props.history;
  if (!h.length) return "";
  const min = Math.min(...h.map((p) => p.price)),
    max = Math.max(...h.map((p) => p.price)),
    first = h[0].day,
    last = h[h.length - 1].day;
  return h
    .map(
      (p) =>
        `${15 + ((p.day - first) / Math.max(1, last - first)) * 270},${48 - ((p.price - min) / Math.max(1, max - min)) * 35}`,
    )
    .join(" ");
});
</script>
<template>
  <figure v-if="history.length">
    <svg
      class="trend"
      viewBox="0 0 300 65"
      role="img"
      :aria-label="
        history.map((p) => '第' + p.day + '天 ' + p.price + '文').join('，')
      "
    >
      <path d="M15 55H285" stroke="#ba9855" />
      <polyline
        :points="points"
        fill="none"
        stroke="#256846"
        stroke-width="2"
      />
      <circle
        v-for="(point, i) in points.split(' ')"
        :key="i"
        :cx="point.split(',')[0]"
        :cy="point.split(',')[1]"
        r="4"
        fill="#256846"
      />
    </svg>
    <figcaption class="muted">
      {{ history.map((p) => `第${p.day}天：${p.price}`).join(" → ")
      }}<br />僅連接已知觀察點
    </figcaption>
  </figure>
</template>
