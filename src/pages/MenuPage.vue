<script setup lang="ts">
import { ref } from "vue";
import { resetPrototype, usePlayerStore } from "../stores";
import GamePanel from "../components/ui/GamePanel.vue";
import GameButton from "../components/ui/GameButton.vue";
import Overlay from "../components/ui/Overlay.vue";
const confirm = ref(false),
  player = usePlayerStore();
</script>
<template>
  <div class="page-head">
    <div class="eyebrow">A MERCHANT'S JOURNAL</div>
    <h1>商隊行記</h1>
    <p>天下商路 · Mobile Frontend Prototype v0.1.0</p>
  </div>
  <div class="grid">
    <GamePanel class="menu-list"
      ><h2>{{ player.name }}</h2>
      <p class="info-space">商隊運具：{{ player.transport.name }}</p>
      <p>
        記憶體模式（memory-only）：重新載入頁面即回初始 fixture，沒有正式存檔。
      </p>
      <p>
        20 城市、30 一般商品、泉州固定報價、2
        航線與已知情報皆為模擬資料，尚未進行正式經濟平衡。
      </p>
      <GameButton @click="confirm = true">重設原型資料</GameButton></GamePanel
    ><GamePanel
      ><h2>未來的航程</h2>
      <p class="info-space">
        後續 V1：實際航行、價格引擎、Risk Event、正式存讀檔與離線功能。
      </p>
      <p class="info-space">
        V1.5：城市投資。V2：角色、水手、多船與旗艦。V2.5：第二商隊與自動貿易。V3：戰爭、外交與海戰另定。
      </p>
      <div class="actions">
        <GameButton secondary @click="$router.push('/route')"
          >前往航線規劃</GameButton
        >
      </div></GamePanel
    >
  </div>
  <Overlay v-if="confirm" modal title="重設原型資料？" @close="confirm = false"
    ><p>將回復初始現金、貨艙與市場，並清除準備航線及所有草稿。</p>
    <div class="actions">
      <GameButton secondary @click="confirm = false">取消</GameButton
      ><GameButton @click="resetPrototype()">確認重設</GameButton>
    </div></Overlay
  >
</template>
