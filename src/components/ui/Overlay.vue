<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import GameButton from "./GameButton.vue";
defineProps<{ title: string; modal?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const box = ref<HTMLElement>();
let previous: HTMLElement | null = null;
function key(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    emit("close");
  }
  if (e.key === "Tab") {
    const list = box.value?.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input,a[href],[tabindex="0"]',
    );
    if (!list?.length) return;
    const first = list[0],
      last = list[list.length - 1];
    if (
      e.shiftKey &&
      (document.activeElement === first || document.activeElement === box.value)
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
onMounted(async () => {
  previous = document.activeElement as HTMLElement;
  await nextTick();
  box.value?.focus();
});
onBeforeUnmount(() => previous?.isConnected && previous.focus());
</script>
<template>
  <Teleport to="body"
    ><div class="veil" :class="{ modal }" @click.self="emit('close')">
      <section
        ref="box"
        class="overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        @keydown="key"
      >
        <header>
          <h2>{{ title }}</h2>
          <GameButton secondary aria-label="關閉" @click="emit('close')"
            >✕</GameButton
          >
        </header>
        <div class="overlay-body"><slot /></div>
      </section></div
  ></Teleport>
</template>
