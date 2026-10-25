<script setup lang="ts">
import { art } from "../../data/assets";
defineProps<{
  scene: "market" | "cargo" | "intelligence";
  title: string;
  subtitle: string;
}>();
</script>
<template>
  <header class="scene-hero" :data-scene="scene">
    <img
      class="scene-art"
      :src="art[scene]"
      alt=""
      fetchpriority="high"
      decoding="sync"
    />
    <div class="scene-caption">
      <span class="hero-ornament" aria-hidden="true">◆</span>
      <h1>{{ title }}</h1>
      <p>{{ subtitle }}</p>
    </div>
  </header>
</template>
