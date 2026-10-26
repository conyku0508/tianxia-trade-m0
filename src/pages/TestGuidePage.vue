<script setup lang="ts">
import GamePanel from "../components/ui/GamePanel.vue";
import GameButton from "../components/ui/GameButton.vue";
</script>
<template>
  <div class="page-head">
    <div class="eyebrow">手機試玩指南</div>
    <h1>怎麼測試商隊移動</h1>
    <p>先到選單「重設原型資料」，再依以下順序操作。全部價格是模擬值。</p>
  </div>
  <GamePanel class="test-guide"
    ><h2>一、完成一趟往返</h2>
    <ol>
      <li>
        <strong>泉州買普通茶葉10。</strong
        >市場→茶葉買入→輸入10→確認摘要→確認買入。現金應為1,220，茶葉10、載重10。
      </li>
      <li>
        <strong>準備泉州→琉球。</strong
        >地圖點琉球→查看航線→準備前往。先按確認出航，再取消：現金仍1,220、第12天。
      </li>
      <li>
        <strong>正式出航。</strong
        >再次確認出航→支付旅費並出航。現金變1,100，商隊進入航行；所在地尚未切到琉球。
      </li>
      <li>
        <strong>按「航行一天」3次。</strong
        >第13、14天仍在海上；第15天抵達琉球。現金仍1,100，茶葉10不變。
      </li>
      <li>
        <strong>到當地市場，賣茶葉10。</strong
        >琉球茶葉480文。賣出後現金5,660，茶葉清空。情報的琉球行情更新為第15天觀察。
      </li>
      <li>
        <strong>買木材10。</strong
        >分類農產→木材買入10，每件70文。含稅735，現金4,925，載重70。
      </li>
      <li>
        <strong>琉球→泉州，準備並出航。</strong
        >支付120旅費後現金4,805；再航行3天，第18天返回泉州。
      </li>
      <li>
        <strong>泉州賣木材10。</strong
        >當地單價120，稅後收入1,140。最終現金5,945、空貨艙。累計扣旅費後已實現盈虧945。
      </li>
    </ol></GamePanel
  ><GamePanel class="test-guide"
    ><h2>二、確認不會多扣錢或丟進度</h2>
    <ul>
      <li>準備／取消、關閉出航確認都不扣款。</li>
      <li>出航確認快速連點，旅費只能扣一次；航行一天連點不應跳兩天。</li>
      <li>航行中點市場，應顯示無法交易；回航行頁可繼續。</li>
      <li>
        航行到一半刷新，應保留所在地、已付旅費與已航行天數。切頁或等候現實時間不會自動前進。
      </li>
      <li>抵達後反覆進出航行頁，不得再次扣款、增加天數或取得重複收益。</li>
      <li>
        重設後MAX買茶13只剩86文，琉球旅費120：應拒絕準備，現金及貨物不變。
      </li>
      <li>
        選單匯出備份，重設後匯入，應還原原有進度。匯入損毀JSON應拒絕，不能清掉目前進度。
      </li>
    </ul>
    <p>
      本機存檔只限目前瀏覽器與此網站；無跨裝置同步。若顯示存檔失敗，先匯出備份。風險機率、動態價格、離線安裝、投資與艦隊仍待後續。
    </p></GamePanel
  ><GamePanel
    ><h2>回報問題時請附上</h2>
    <p class="info-space">
      手機型號／瀏覽器、當時城市與天數、操作到第幾步、預期數字與實際數字；如可行，附畫面截圖。
    </p>
    <div class="actions">
      <GameButton @click="$router.push('/menu')">返回選單</GameButton
      ><GameButton secondary @click="$router.push('/map')">開始試玩</GameButton>
    </div></GamePanel
  >
</template>
