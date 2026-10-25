<script setup lang="ts">
import { computed } from "vue";
import { art, goodsIconIndex, navIconIndex } from "../../data/assets";
const props = withDefaults(
  defineProps<{ name: string; kind?: "good" | "nav" }>(),
  { kind: "good" },
);
const index = computed(() =>
  props.kind === "nav"
    ? (navIconIndex[props.name] ?? 2)
    : goodsIconIndex[props.name],
);
const isGoods = computed(
  () => props.kind === "good" && index.value !== undefined,
);
const style = computed(() =>
  isGoods.value
    ? {
        backgroundImage: `url(${art.goodsAtlas})`,
        backgroundSize: "300% 200%",
        backgroundPosition: `${(index.value! % 3) * 50}% ${Math.floor(index.value! / 3) * 100}%`,
      }
    : {
        backgroundImage: `url(${art.navigationAtlas})`,
        backgroundSize: "500% 166.6667%",
        backgroundPosition: `${(index.value ?? 2) * 25}% 50%`,
      },
);
</script>
<template>
  <span
    class="art-icon"
    :class="{ 'nav-art': kind === 'nav' }"
    :style="style"
    aria-hidden="true"
  />
</template>
