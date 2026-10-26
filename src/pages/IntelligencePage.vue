<script setup lang="ts">
import { computed, ref } from "vue";
import { useKnowledgeStore, useCityStore, useGameStore } from "../stores";
import { goods } from "../data/fixture";
import { quickKnowledgeGoods } from "../data/journeyConfig";
import { art } from "../data/assets";
import { money } from "../data/presentation";
import { useServices } from "../services";
import GamePanel from "../components/ui/GamePanel.vue";
import GameButton from "../components/ui/GameButton.vue";
import PriceTrend from "../components/ui/PriceTrend.vue";
import ArtIcon from "../components/ui/ArtIcon.vue";
import SceneHero from "../components/ui/SceneHero.vue";
const knowledge = useKnowledgeStore(),
  cities = useCityStore(),
  game = useGameStore(),
  { route } = useServices(),
  cityFilter = ref("all"),
  goodFilter = ref("quick"),
  records = computed(() =>
    knowledge
      .observations(game.currentDay)
      .filter(
        (k) =>
          (cityFilter.value === "all" || k.cityId === cityFilter.value) &&
          (goodFilter.value === "all" ||
            (goodFilter.value === "quick"
              ? quickKnowledgeGoods.includes(k.goodId)
              : k.goodId === goodFilter.value)),
      ),
  );
const routeTo = (cityId: string) =>
  route.listFrom(game.currentCityId).find((r) => r.toCityId === cityId);
const vignetteStyle = (cityId: string) => ({
  backgroundImage: `url(${art.worldMap})`,
  backgroundPosition: `${cities.byId[cityId]!.position.x * 100}% ${cities.byId[cityId]!.position.y * 100}%`,
});
</script>
<template>
  <SceneHero
    scene="intelligence"
    title="商路情報"
    subtitle="各地行情乃商人來往傳聞，僅供參考。"
  />
  <div class="knowledge-heading">
    <span>港口來訊</span><small>已知觀察 · 非即時報價</small>
  </div>
  <div class="knowledge-filters">
    <label
      >港口<select v-model="cityFilter" aria-label="情報港口">
        <option value="all">全部已知港口</option>
        <option v-for="c in cities.items" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select></label
    ><label
      >商品<select v-model="goodFilter" aria-label="情報商品">
        <option value="quick">常用商品</option>
        <option value="all">全部已觀察商品</option>
        <option v-for="g in goods" :key="g.id" :value="g.id">
          {{ g.name }}
        </option>
      </select></label
    >
  </div>
  <GamePanel v-if="!records.length"><p>此篩選下尚無情報。</p></GamePanel>
  <div class="grid knowledge">
    <GamePanel
      v-for="k in records"
      :key="k.cityId + k.goodId"
      class="knowledge-card"
      :data-knowledge="k.cityId"
      :data-good="k.goodId"
    >
      <div
        class="city-vignette"
        :style="vignetteStyle(k.cityId)"
        aria-hidden="true"
      />
      <div class="knowledge-content">
        <div class="knowledge-meta">
          <div class="knowledge-title">
            <h2>{{ cities.byId[k.cityId]?.name }}</h2>
            <span v-if="k.knownPrice !== null" class="known-label"
              ><ArtIcon name="intelligence" kind="nav" />已知行情</span
            ><span v-else class="unknown-label">未知</span>
          </div>
          <span class="observation-age">{{
            k.age === null ? "" : k.age + "天前"
          }}</span>
        </div>
        <div class="knowledge-quote">
          <ArtIcon :name="k.goodId" /><span class="knowledge-good">{{
            goods.find((g) => g.id === k.goodId)?.name
          }}</span
          ><strong :class="{ 'unknown-price': k.knownPrice === null }">{{
            k.knownPrice === null ? "尚無情報" : money(k.knownPrice) + " 文"
          }}</strong>
        </div>
        <PriceTrend :history="k.history" />
        <p class="knowledge-source">
          {{
            k.observedDay === null
              ? "未有觀察紀錄"
              : "第" +
                k.observedDay +
                "天觀察 · " +
                (k.source === "visit" ? "當地觀察" : "模擬情報")
          }}
        </p>
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
        </div>
      </div>
    </GamePanel>
  </div>
  <h2 class="section-heading">海路傳聞</h2>
  <div class="grid events">
    <GamePanel
      v-for="event in knowledge.events"
      :key="event.id"
      class="event-card"
      ><ArtIcon name="intelligence" kind="nav" class="event-art" />
      <div>
        <span class="event-kind"
          >{{ event.type === "rumor" ? "傳聞" : "風險事件" }} · 僅模擬展示</span
        >
        <h3>{{ event.title }}</h3>
        <p class="info-space">{{ event.description }}</p>
        <small class="info-space"
          >第{{ event.observedDay }}天 · 不影響資產</small
        >
      </div></GamePanel
    >
  </div>
</template>
