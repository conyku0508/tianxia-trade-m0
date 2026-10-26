<script setup lang="ts">
import { ref, computed } from "vue";
import {
  resetPrototype,
  usePlayerStore,
  useSaveStore,
  useLedgerStore,
  useCityStore,
} from "../stores";
import {
  exportProgress,
  inspectImport,
  importProgress,
} from "../services/persistence";
import { ledgerSummary } from "../services/ledger";
import { money } from "../data/presentation";
import GamePanel from "../components/ui/GamePanel.vue";
import GameButton from "../components/ui/GameButton.vue";
import Overlay from "../components/ui/Overlay.vue";
const confirm = ref(false),
  player = usePlayerStore(),
  save = useSaveStore(),
  ledger = useLedgerStore(),
  cities = useCityStore(),
  raw = ref(""),
  message = ref(""),
  importing = ref(false),
  summary = computed(() => ledgerSummary(ledger.entries));
async function selectFile(event: Event) {
  const input = event.target as HTMLInputElement,
    file = input.files?.[0];
  if (!file) return;
  if (file.size > 5_000_000) {
    message.value = "備份檔案過大";
    return;
  }
  raw.value = await file.text();
  input.value = "";
  review();
}
function review() {
  const parsed = inspectImport(raw.value);
  if (!parsed) {
    message.value = "備份格式或數值不一致，未更動目前進度";
    return;
  }
  message.value = `${cities.byId[parsed.game.currentCityId]?.name} · 第${parsed.game.currentDay}天 · 現金${money(parsed.player.money)}`;
  importing.value = true;
}
function restore() {
  const r = importProgress(raw.value);
  message.value = r.message;
  if (r.ok) {
    importing.value = false;
    raw.value = "";
  }
}
</script>
<template>
  <div class="page-head">
    <div class="eyebrow">商隊行記</div>
    <h1>選單與貿易帳</h1>
    <p>V1 第一階段 · 可往返的貿易循環</p>
  </div>
  <div class="grid">
    <GamePanel class="menu-list"
      ><h2>{{ player.name }}</h2>
      <p class="info-space">商隊運具：{{ player.transport.name }}</p>
      <p
        :class="save.status === 'saved' ? 'status-saved' : 'status-failed'"
        role="status"
      >
        {{ save.message }}
      </p>
      <p>
        自動保存於目前瀏覽器。刷新可繼續航行；沒有跨裝置同步。請定期匯出備份。
      </p>
      <p>
        20城市、30商品、泉州／琉球／馬六甲市場與往返航線使用模擬數值。其他城市可看摘要，尚未開通航行。
      </p>
      <div class="actions">
        <GameButton @click="$router.push('/help')">測試說明</GameButton
        ><GameButton secondary @click="confirm = true">重設原型資料</GameButton>
      </div>
      <div class="actions">
        <GameButton @click="$router.push('/route')">航線規劃</GameButton
        ><GameButton secondary @click="$router.push('/sailing')"
          >航程／到港紀錄</GameButton
        >
      </div></GamePanel
    ><GamePanel
      ><h2>累計貿易帳</h2>
      <dl class="summary statement-list">
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
        <dt>現金淨流量</dt>
        <dd>{{ money(summary.cashFlow) }}</dd>
      </dl>
      <small
        >未售貨物仍按成本保留，不重複扣入已實現盈虧。此帳為累計，不宣稱單航段成本分攤。</small
      ></GamePanel
    ><GamePanel
      ><h2>備份與還原</h2>
      <div class="actions">
        <GameButton @click="exportProgress">匯出備份</GameButton>
      </div>
      <div class="save-tools">
        <label
          >選取備份JSON檔<input
            type="file"
            accept=".json,application/json"
            aria-label="匯入備份檔"
            @change="selectFile"
        /></label>
        <p class="muted info-space">亦可貼上JSON文字：</p>
        <textarea
          v-model="raw"
          aria-label="備份JSON文字"
          placeholder="貼上從本遊戲匯出的備份"
        /><GameButton secondary @click="review">檢查並匯入</GameButton>
        <p v-if="message" class="info-space" role="status">{{ message }}</p>
      </div></GamePanel
    ><GamePanel
      ><h2>本階段範圍</h2>
      <p class="info-space">
        手動逐日航行、目的港買賣、到港情報、本機存檔已開放。價格波動、隨機風險、PWA離線、投資、角色與多船仍待後續。共用港口插畫不代表每座城市已有專用美術。
      </p></GamePanel
    >
  </div>
  <Overlay v-if="confirm" modal title="重設原型資料？" @close="confirm = false"
    ><p>
      將清除本機目前進度，回到泉州第12天、現金5,000；所有航程、貨物、收支與草稿重設。可先取消並匯出備份。
    </p>
    <div class="actions">
      <GameButton secondary @click="confirm = false">取消</GameButton
      ><GameButton @click="resetPrototype()">確認重設</GameButton>
    </div></Overlay
  ><Overlay
    v-if="importing"
    modal
    title="以備份取代目前進度？"
    @close="importing = false"
    ><p>{{ message }}</p>
    <p class="info-space">
      確認後會取代目前進度與航程。可先取消並匯出目前備份。
    </p>
    <div class="actions">
      <GameButton secondary @click="importing = false">取消</GameButton
      ><GameButton @click="restore">確認還原</GameButton>
    </div></Overlay
  >
</template>
