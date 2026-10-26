# 天下商路 · V1 第一階段（v0.2.0）

已完成「泉州買貨 → 準備 → 確認出航 → 逐日航行 → 抵達琉球 → 當地交易 → 返回泉州」的可玩循環。沿用已確認的手繪航海美術與手機小港口標記；沒有新增投資、艦隊或戰鬥。

**手機試玩：** [開啟遊戲](https://conyku0508.github.io/tianxia-trade-m0/?release=m1-voyage-20261026#/map)

**怎麼測：** 遊戲「選單 → 測試說明」，或 [手機測試指南](https://conyku0508.github.io/tianxia-trade-m0/?release=m1-voyage-20261026#/help)。原始說明見 [TEST_GUIDE.md](TEST_GUIDE.md)。

所有城市供需／價格／費用／風險仍為 **Mock Config**，不是正式經濟平衡。這是 V1 第一個完整貿易循環，不是完整 V1 經濟引擎。

## 執行

Node.js 22.12+ 或 24（實測24.14.0）：

```sh
cd tianxia-trade-m0
npm ci
npm run dev -- --port 5174
```

開啟終端的 Local 網址。Vue3／TypeScript／Pinia／Vue Router／Tailwind／Vite，已保存 lockfile。hash路由與相對base支援GitHub Pages儲存庫路徑。

```sh
npm test
npm run build
npm run preview
```

## 本階段可玩內容

- 底部五入口仍為地圖／市場／貨艙／情報／選單，航程與路線歸地圖；測試指南從選單進入。
- 20城marker可看摘要；泉州、琉球、馬六甲各有30商品市場。泉州↔琉球、泉州↔馬六甲共4條方向航線。其他17城尚未開航，不假裝全世界已連通。
- 準備航線不扣款；取消準備或關閉出航確認也不扣款。**支付旅費並出航**時只扣一次；出航後不可退款／改航線。
- 按「航行一天」才推進一天；沒有現實時間倒數。航行中切頁、刷新仍可回航程繼續。抵達才切換城市，途中不開市場，不得海上交易。
- 到港紀錄列出旅費、日期、攜帶貨物。貨艙持貨及平均成本保留；目的港使用當地模擬報價。
- 出發及到港時記錄當地觀察，情報保留舊觀察日期與真正已知點。預設常用商品，可選港口／商品或全部已觀察商品。未知不顯示0或假觀察日。
- 累計貿易帳分開買入支出、賣出淨收入、交易盈虧、旅費及扣旅費後盈虧；未售貨物成本不重複扣入已實現盈虧，不宣稱做了單航段旅費分攤。

## 本機存檔（本版已取代M0刷新重設）

**刷新會繼續目前進度。** 自動存檔僅限同一裝置、同一瀏覽器與同一網站origin，不提供帳號或跨裝置同步；無痕／清理網站資料可能刪除存檔。

- 主檔key `tianxia-v1-save`；備份key `tianxia-v1-save:backup`。與其他遊戲分開。
- 同步command完成後以microtask組合完整snapshot寫入，讀回比對；保留上一個有效備份。不是資料庫交易，也不宣稱零風險永久保存。
- 存檔包含資產、90市場價量、已知情報、準備航線、航行進度與收支；UI草稿不存。恢復時提高market revision，讓舊摘要失效。
- 嚴格檢查版本／外鍵／數值／重量／庫存／行情歷史／航程／帳務一致性。匯入錯誤不清除進度；合法備份亦須確認後才取代現況。
- 儲存不可用／配額失敗會顯示警示，仍可操作與匯出完整備份；此時不可依賴刷新續玩。
- 偵測到另一分頁更新時停止直接覆寫，請先匯出本頁備份。這是衝突檢查，不是多分頁協作鎖。
- 選單提供匯出JSON、檔案或文字匯入及重設。重設有確認，會清除目前航程與資產。

## 資料與架構

`src/data/mock-fixture.json` 保留M0原包內容，未覆蓋。`journeyConfig.ts` 是M1 adapter：建立琉球／馬六甲市場與反向航線，價格仍標示mock；30商品含木材，不含馬匹。

- Data/Config：`data/`、`contracts/`，M1契約擴充見 [M1_SPEC.md](M1_SPEC.md)。原文件包與既有其他遊戲未修改。
- UI：`pages/`、`components/ui/`、`styles/`。金額、稅、MAX、成本、航行驗證與存檔規則不放Page。
- Logic：TradeService、MarketService、RouteService、VoyageService、SaveService及ledger selector。
- 狀態唯一責任：player.money；cargo.items；game.city/day；market.items/revision；knowledge.records；route.prepared；voyage.active/lastArrival；ledger.entries。快照只用於保存／恢復，並非第二個資產store。

美術來源與提示詞見 `art/runtime-source/`；四稿保留於 `art/concepts/`，執行用WebP在 `src/assets/art/`，約3MB。6種商品專用圖，其餘共用貨箱；琉球／馬六甲暫用共用港市景，非已完成每城專用美術。

## 驗證

詳細結果見 [VALIDATION.md](VALIDATION.md)。本機46項service／保存一致性測試通過，Vue型別及build通過。六尺寸真實Chrome往返、取消與重入、海上禁交易、到港情報、中途reload、備份匯出／匯入／取消／損毀拒絕及旅費不足通過。另實測儲存失敗可匯出、多分頁衝突及備份復原。

```sh
node scripts/voyage-check.mjs
node scripts/save-browser-check.mjs
```

先啟動5174本機服務；腳本使用已安裝的macOS Chrome。`BASE_URL`與`ARTIFACT_DIR`可指定正式站及結果輸出。結果保存於 `artifacts/v1-voyage/`。既有M0腳本保留；reload預期已改為新版本續玩，舊驗收結果是歷史紀錄。

實體iOS／Android、Safari與手機軟鍵盤需使用者裝置實測；Chrome viewport不等於實機驗收。未聲稱PWA離線或永久存檔安全。

## 延後

動態價格引擎、正式平衡、隨機Risk Event、真實風險概率、離線安裝、投資、人物、水手、多船／旗艦、自動商隊、外交海戰與後端帳號。風險數字本階段僅提示，不觸發扣款／損失。
