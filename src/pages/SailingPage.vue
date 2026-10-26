<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from "vue";
import {
  useVoyageStore,
  useCityStore,
  useGameStore,
  usePlayerStore,
  useUiStore,
} from "../stores";
import { useServices } from "../services";
import { money } from "../data/presentation";
import { art } from "../data/assets";
import GamePanel from "../components/ui/GamePanel.vue";
import GameButton from "../components/ui/GameButton.vue";
const state = useVoyageStore(),
  cities = useCityStore(),
  game = useGameStore(),
  player = usePlayerStore(),
  ui = useUiStore(),
  { voyage, statement } = useServices(),
  pending = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
const active = computed(() => state.active),
  arrival = computed(() => state.lastArrival),
  summary = computed(() => statement());
const shipStyle = computed(() => {
  const v = active.value;
  if (!v) return {};
  const a = cities.byId[v.fromCityId]!.position,
    b = cities.byId[v.toCityId]!.position,
    t = v.elapsedDays / v.travelDays;
  return {
    left: (a.x + (b.x - a.x) * t) * 100 + "%",
    top: (a.y + (b.y - a.y) * t) * 100 + "%",
  };
});
function advance(e: MouseEvent) {
  if (pending.value || e.detail > 1 || !active.value) return;
  pending.value = true;
  const r = voyage.advance(active.value.id, game.currentDay);
  if (!r.ok) ui.notify(r.message);
  else if (r.value.arrival)
    ui.notify("已抵達" + cities.byId[r.value.arrival.toCityId]!.name);
  timer = setTimeout(() => (pending.value = false), 300);
}
onBeforeUnmount(() => clearTimeout(timer));
</script>
<template>
  <div class="page-head">
    <div class="eyebrow">商隊航程 · 手動推進</div>
    <h1>{{ active ? "海上航行" : arrival ? "抵達港口" : "商隊待命" }}</h1>
    <p>第{{ game.currentDay }}天 · 不會按現實時間自動前進</p>
  </div>
  <template v-if="active"
    ><GamePanel class="voyage-panel"
      ><h2>
        {{ cities.byId[active.fromCityId]?.name }} →
        {{ cities.byId[active.toCityId]?.name }}
      </h2>
      <div class="voyage-map">
        <img :src="art.worldMap" alt="航行示意海圖" /><span
          class="voyage-ship"
          :style="shipStyle"
          aria-label="商隊位置"
          >⛵</span
        >
      </div>
      <div class="stat-grid">
        <div>
          <small>已航行</small
          ><strong>{{ active.elapsedDays }} / {{ active.travelDays }}天</strong>
        </div>
        <div>
          <small>剩餘</small
          ><strong>{{ active.travelDays - active.elapsedDays }}天</strong>
        </div>
        <div>
          <small>已付旅費</small
          ><strong>{{ money(active.travelCost) }}文</strong>
        </div>
      </div>
      <progress
        class="progress"
        :value="active.elapsedDays"
        :max="active.travelDays"
        aria-label="航行進度"
      />
      <p class="muted">
        航行期間不能交易或改航線。貨物保留；本階段風險只提示，不抽取隨機損失。
      </p>
      <div class="actions">
        <GameButton :disabled="pending" @click="advance">航行一天</GameButton
        ><GameButton secondary @click="$router.push('/map')"
          >查看商隊位置</GameButton
        >
      </div></GamePanel
    ></template
  >
  <template v-else-if="arrival"
    ><GamePanel
      ><span class="pill">到港結算 · 旅費已扣，沒有再次收費</span>
      <h2 class="info-space">
        已抵達{{ cities.byId[arrival.toCityId]?.name }}
      </h2>
      <dl class="summary">
        <dt>出發／抵達日</dt>
        <dd>第{{ arrival.departureDay }}天 → 第{{ arrival.arrivalDay }}天</dd>
        <dt>航行天數</dt>
        <dd>{{ arrival.travelDays }}天</dd>
        <dt>本次旅費</dt>
        <dd>{{ money(arrival.travelCost) }} 文</dd>
        <dt>攜帶貨物</dt>
        <dd>{{ arrival.cargoQuantity }} 件</dd>
        <dt>目前現金</dt>
        <dd>{{ money(player.money) }} 文</dd>
      </dl>
      <p class="info-space">
        已取得當地行情，現在可以交易。離開後，情報仍會保留觀察日期。
      </p>
      <div class="actions">
        <GameButton @click="$router.push('/market')">進入當地市場</GameButton
        ><GameButton secondary @click="$router.push('/route')"
          >規劃下一段</GameButton
        >
      </div></GamePanel
    ><GamePanel
      ><h2>累計貿易帳</h2>
      <dl class="summary">
        <dt>買入支出（含稅）</dt>
        <dd>{{ money(summary.purchaseSpend) }}</dd>
        <dt>賣出淨收入</dt>
        <dd>{{ money(summary.salesRevenue) }}</dd>
        <dt>已實現交易盈虧</dt>
        <dd>{{ money(summary.tradingProfit) }}</dd>
        <dt>累計旅費</dt>
        <dd>{{ money(summary.travelExpenses) }}</dd>
        <dt>扣旅費後已實現盈虧</dt>
        <dd>{{ money(summary.netRealizedProfit) }}</dd>
      </dl>
      <small
        >未售貨物成本仍留在貨艙，不重複列入已實現盈虧。此為累計帳，非單一航段分攤。</small
      ></GamePanel
    ></template
  >
  <GamePanel v-else
    ><p>準備航線後，再確認出航即可移動商隊。</p>
    <div class="actions">
      <GameButton @click="$router.push('/route')">前往航線規劃</GameButton>
    </div></GamePanel
  >
</template>
