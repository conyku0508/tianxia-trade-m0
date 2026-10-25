<script setup lang="ts">
withDefaults(defineProps<{ secondary?: boolean; disabled?: boolean }>(), {
  secondary: false,
  disabled: false,
});
</script>
<template>
  <button
    class="game-button"
    :class="{ secondary }"
    :disabled="disabled"
    type="button"
  >
    <slot />
  </button>
</template>
