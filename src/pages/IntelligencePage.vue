<script setup lang="ts">
import { computed } from "vue";
import { useKnowledgeStore, useCityStore, useGameStore } from "../stores";
import { goods } from "../data/fixture";
import { money } from "../data/presentation";
import { useServices } from "../services";
import GamePanel from "../components/ui/GamePanel.vue";
import GameButton from "../components/ui/GameButton.vue";
import PriceTrend from "../components/ui/PriceTrend.vue";
const knowledge = useKnowledgeStore(),
  cities = useCityStore(),
  game = useGameStore(),
  { route } = useServices(),
  records = computed(() => knowledge.observations(game.currentDay));
const routeTo = (cityId: string) =>
  route.listFrom(game.currentCityId).find((r) => r.toCityId === cityId);
</script>
<template>
  <div class="page-head">
    <div class="eyebrow">WHISPERS ACROSS THE SEA</div>
    <h1>商路情報</h1>
    <p>消息有新舊，行情有遠近。以下為已知觀察，並非外地即時報價。</p>
  </div>
  <div class="grid knowledge">
    <GamePanel v-for="k in records" :key="k.cityId + k.goodId"
      ><div class="knowledge-meta">
        <h2>{{ cities.byId[k.cityId]?.name }}</h2>
        <span class="pill">{{ k.age === null ? "未知" : k.age + "天前" }}</span>
      </div>
      <p class="info-space">{{ goods.find((g) => g.id === k.goodId)?.name }}</p>
      <p style="font-size: 30px; margin-top: 8px">
        {{ k.knownPrice === null ? "尚無情報" : money(k.knownPrice) + " 文" }}
      </p>
      <small>{{
        k.observedDay === null
          ? "未有觀察紀錄"
          : "第" + k.observedDay + "天觀察 · 模擬來源"
      }}</small
      ><PriceTrend :history="k.history" />
      <div v-if="routeTo(k.cityId)" class="actions">
        <GameButton
          secondary
          @click="
            $router.push({
              path: '/route',
              query: { id: routeTo(k.cityId)!.id },
            })
          "
          >查看航線</GameButton
        >
      </div></GamePanel
    >
  </div>
  <h2 style="margin: 24px 0 16px">港口傳聞與海域紀事</h2>
  <div class="grid">
    <GamePanel v-for="event in knowledge.events" :key="event.id"
      ><span class="pill"
        >{{ event.type === "rumor" ? "傳聞" : "風險事件" }} · 僅模擬展示</span
      >
      <h3 class="info-space">{{ event.title }}</h3>
      <p class="info-space">{{ event.description }}</p>
      <p class="muted info-space">
        第{{ event.observedDay }}天 · 不影響資產
      </p></GamePanel
    >
  </div>
</template>
