# M0 實作驗收｜2026-10-26

## 最終結果

- `npm run build` 通過：Vue TypeScript + Vite production build（66 modules）。
- `npm test` 通過：19/19，檔案 `tests/services.test.ts`。
- 本機 Chrome headless 透過 HTTP 實際載入 Vue/Pinia 應用，兩組瀏覽器腳本各完成六尺寸。
- 手機 390 與桌面 1440 的六頁 full-page 截圖已保存，並檢視地圖與市場主要版面；另外各尺寸有 viewport 壓力測試截圖。

## 22 算例覆蓋

| Case     | 實測方式與結果                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| A01      | 瀏覽器六尺寸：地圖點泉州、城市 Sheet、進市場；service 驗 20 城／30 商品與外鍵。通過。                          |
| A02      | 瀏覽器取消確認回交易 Sheet，現金維持 5,000；service 預覽前後完整資產一致。通過。                               |
| A03／A04 | service 精確驗 4,244／茶2／均成本378／庫存18／重量2／成本756／估值720／盈虧-36；瀏覽器驗現金及貨艙顯示。通過。 |
| A05      | service 與瀏覽器驗 2 天前、3 天前及 null 未知；趨勢只取 knowledge.history。通過。                              |
| A06／A07 | service 比較完整資產狀態不變；瀏覽器驗 prepared／取消與現金不變。通過。                                        |
| A08      | service 驗 4,586／茶1／avg378／stock19／weight1；瀏覽器驗買2再賣1及現金。通過。                                |
| A09／A10 | service 驗茶13、木材14與茶 MAX 成交餘額86；瀏覽器驗茶 MAX 顯示13與餘額86。通過。                               |
| A11      | service 驗 0、負值、小數、NaN、Infinity、超庫存，各次零副作用；瀏覽器驗輸入0的錯誤。通過。                     |
| A12      | service 以 money=0／capacity=1 變體驗不足、超重、超額賣出且零副作用。通過。                                    |
| A13      | service 驗同 request 二次確認回 STALE_PREVIEW；瀏覽器雙擊確認後現金只扣一次。通過。                            |
| A14      | 瀏覽器六入口頁與固定五入口切換，資產持續同步；價格只讀固定 MarketService。通過。                               |
| A15      | service 驗 reset 提高 revision、舊 request 失效；瀏覽器驗重設回5,000，RouterView resetKey 清草稿。通過。       |
| A16      | service 驗 money／range 變體拒絕且保留既有 prepared、資產不變。通過。                                          |
| A17      | 瀏覽器 MAX 成交後 reload 回5,000；README與選單顯示 memory-only。通過。                                         |

另測：模式不符、錯誤城市、未知商品；全數賣出移除貨物；買入成本維持精度；缺當地報價時估值為 null。

## 六尺寸結果

| Viewport | 主流程與六頁 | 補充邊界 |
| -------- | ------------ | -------- |
| 360×800  | PASS         | PASS     |
| 390×844  | PASS         | PASS     |
| 430×932  | PASS         | PASS     |
| 768×1024 | PASS         | PASS     |
| 1024×768 | PASS         | PASS     |
| 1440×900 | PASS         | PASS     |

主流程：Map→City→Market→取消→買茶→Cargo→Intelligence→Route→Prepared→取消→賣茶→五入口→重設→MAX→刷新。每尺寸六頁檢查 document 無水平溢出、導覽底部未越界，沒有 pageerror。

補充邊界：地圖縮放與 pointer 拖曳確實改變 scrollLeft；市場最後一列買入按鈕可捲到導覽列上方；實際鍵盤輸入數量；Sheet 與 Modal 的 Shift+Tab／Tab 循環、Escape 返回及觸發按鈕焦點還原。長商品名及 999,999,999 現金以 **DOM 文字替換** 做純版面壓力測試，不宣稱是遊戲資產測試。

原始結果：`artifacts/browser-results.json`、`artifacts/browser-edge-results.json`。截圖：`artifacts/390-*.png`、`artifacts/1440-*.png` 與各尺寸 `*-viewport.png`。Full-page 圖中的固定導覽顯示在當時 viewport 底部，長圖其餘區域為往下捲動內容，並非導覽隨內容移位。

## 過程發現與修復

- 修正 MarketPage trade event 的隱含 any；最終型別檢查通過。
- 修正初始焦點在 dialog 容器時 Shift+Tab 的循環邊界；最終六尺寸驗證通過。
- 第一版地圖拖曳測試取點落到浮動圖例；改為地圖內背景並放大至可捲尺寸後通過。沒有以錯誤測試取點推論產品不能拖曳。
- 一次原始碼格式化觸發 Vite 熱重載，中斷邊界測試；檔案穩定後完整重跑通過。
- 內建 CUA 因 sandbox TIOCSTI kernel 啟動錯誤無法使用；使用已安裝的本機 Chrome／Playwright 完成瀏覽器驗證。

## 限制與未驗證

本次是本機 Chrome headless 的 viewport／DOM／pointer／鍵盤測試。未測實體手機、iOS Safari、Android Chrome、觸控手勢與軟鍵盤彈出後的 visual viewport／安全區差異，也未做完整 WCAG 對比量測。Sheet 限高並可內捲，未聲稱完成真手機軟鍵盤遮擋驗收。

文件包未提供四張圖片，所以使用 Suggested Tokens 與 SVG／文字 placeholder；沒有逐像素視覺比對。正式資料、正式經濟引擎、航行結算與正式持久化均未實作或驗證。

## GitHub Pages 發佈準備

已確認手機 viewport、768px／1200px RWD 斷點；Vite 加入相對 base，新增 `.github/workflows/pages.yml`。調整後 `npm run build` 與 19 項 service 測試通過。已確認本機 GitHub 登入帳號 conyku0508 可用。

使用者明確同意公開後，已建立公開儲存庫 https://github.com/conyku0508/tianxia-trade-m0 ，啟用 Pages workflow 並發佈 https://conyku0508.github.io/tianxia-trade-m0/ 。

首次 GitHub Actions run 40219934283 完成 success，雲端 npm ci、npm test、npm run build 與 Pages deployment 均成功。首次部署對應 commit `0ad553a2ec9a5c6f27feabb4c1b095758df8d40e`。

`node scripts/live-check.mjs` 已在正式 HTTPS 網址完成 360×800、390×844、430×932、768×1024、1024×768、1440×900 六尺寸驗證。全部 HTTP 200、無 pageerror、無 4xx/5xx 資源。每尺寸走完 Map→City→Market→買茶2→Cargo→Intelligence→Route→Prepared，現金4,244、成本756／估值720／盈虧-36、舊情報與未知正確，刷新重回5,000。另實測手機 Sheet 全寬、平板桌面 Drawer 窄欄；商品列表手機一欄、平板桌面兩欄，沒有水平溢出。

原始結果 `artifacts/live-results.json`；正式站截圖 `artifacts/live-*-prepared.png`。這是部署後 Chrome viewport 驗收，不代表實體手機或 Safari 已驗收。

## 美術套版驗收｜2026-10-26

使用者確認原四稿，另要求美化「已知行情」，確認 v2 後授權套用。實作採獨立場景與 atlas，Vue 文字／資產顯示、SVG 行情圖、城市 marker、Sheet、買賣控制保持可編輯與互動。

### 範圍與不變量

- UI：AppShell、四頁、SceneHero／ArtIcon、GoodsRow、PriceTrend、金框紙面樣式、導覽、載重條。市場全部列表優先茶葉／絲綢／瓷器。
- Asset：4 場景、6 商品圖示 atlas、5 導覽圖示 atlas；六張執行 WebP 合計2,997,274 bytes。專用商品圖6種，其餘24種為共用貨箱，不宣稱已有30種獨立美術。
- 原始PNG、確認稿、提示詞、manifest在art/；dist只含壓縮執行素材。沒有整張確認稿當作可操作頁面。
- 未修改 TradeService、MarketService、RouteService、stores、contracts 或 mock-fixture。數值與記憶體重設規則不變。

### 本機驗證

- 最終 TypeScript 與 production build 通過（78 modules）；19項 service 測試通過。
- 完整流程腳本六尺寸通過，買／賣／取消／MAX／prepared／重設／刷新維持正常，結果 `artifacts/art-release/flow/browser-results.json`。
- 邊界腳本六尺寸通過：地圖拖曳縮放、最後一列操作不被底欄遮擋、數量鍵盤、Sheet／Modal焦點循環及Esc、長名稱／大金額版面，結果 `artifacts/art-release/edge/browser-edge-results.json`。
- 美術腳本檢查六頁、圖片已解碼、所有30商品存在、真實買茶2與貨艙同步；情報只有2個已知行情及2條趨勢，逐筆比對馬六甲第8／10天470／500、琉球第7／9天650／680；亞丁沒有圖表與假日期。無水平溢出、pageerror或失敗資源。結果 `artifacts/art-release/art-results.json`。
- 手機390與桌面1440主要頁面截圖已保存與目視檢查。圖例、商品名與報價為DOM，非烘焙字。初稿額外導覽符號已修正；截圖等待image.decode，避免將解碼前的空白當成最終畫面。桌面未知卡片自動伸展與原生灰色progress已調整。

### 仍有限制

實體手機／Safari／軟鍵盤尚未重新驗收；以上為Chrome headless viewport測試。插畫地理及建築為示意，不保證史實。沒有新航行、事件、經濟平衡或持久化。

### 正式站驗收結果

GitHub Actions run [40224953564](https://github.com/conyku0508/tianxia-trade-m0/actions/runs/40224953564) 為 success；執行用美術版本 commit `287dbf2aa561c961dc91e221ba58c6b14f5577aa`。

正式站 https://conyku0508.github.io/tianxia-trade-m0/?release=art-v1-20261026 已完成六尺寸 `scripts/art-check.mjs`：360×800、390×844、430×932、768×1024、1024×768、1440×900 全部 PASS。每尺寸走六頁、實際買茶2、檢查現金4,244／成本756／估值720／盈虧−36與已知行情觀察點。沒有 pageerror、失敗資源或水平溢出，所有實際img已解碼。原始結果及截圖在 `artifacts/art-release/live/`。

這是部署後 Chrome 實測，沒有把前一輪手機能開啟的回覆當作新版 Safari／實體手機驗收。正式裝置仍請使用者試玩。

## 手機城市標記縮小｜2026-10-26

UI限定修改 `MapPage.vue` 與 `art.css`，手機寬度<768px時改為小港口圓點＋21px高窄版名稱；泉州採紅金色。透明按鈕觸控範圍44×44px，並使用反向縮放保持視覺與觸控區固定。平板／桌面維持原樣。城市座標、fixture與services不變。

`npm run build` 通過；`scripts/port-check.mjs` 六尺寸通過，20城標記存在，可在0.75／1／1.75倍點泉州，外地與長名稱摘要可用，Esc／關閉正常，市場30商品、現金5,000、無水平溢出或pageerror。三個手機尺寸量測觸控區均約44×44px，label高21px。結果與截圖在 `artifacts/compact-ports/`。實體手機/Safari仍待使用者驗收。

正式站城市標記版本 `930ab68f2f49b3b0fc5803537dd2468af5e439e0` 的 Actions run40225519466建置與部署成功；正式HTTPS網址六尺寸port-check全數PASS，結果在 `artifacts/compact-ports/live/results.json`。手機三尺寸於0.75／1／1.75倍的觸控區實測約44×44px，非僅靜態CSS檢查。

## V1第一階段：商隊往返／本機續玩

本章為目前版本；前文M0「memory-only刷新重設」是歷史紀錄，新版已由自動存檔取代。程式v0.2.0，詳細契約見M1_SPEC.md、操作指南TEST_GUIDE.md及遊戲/help。

- 本機46項測試通過（原19+新增27），包含完整茶10／木材10往返、day18／cash5945／net945、重複出航與日期、海上交易拒絕、費用／航程／起點重新驗證、抵達情報、馬六甲回程、重設、存檔版本／數值／帳務一致性、配額／安全錯誤、回讀不符、備份復原與分頁衝突。
- 六尺寸Chrome實際往返全部PASS：360×800、390×844、430×932、768×1024、1024×768、1440×900。測cancel/雙點出航/雙點一天/海上市場阻擋/第13天reload續航/到港價與觀察日/完整買賣/匯出/檔案與文字匯入/取消還原/損毀拒絕/重設/86不足120旅費/手機指南。沒有pageerror或4xx/5xx資源。結果 `artifacts/v1-voyage/results.json`。
- 真實瀏覽器origin儲存檢查3項PASS：注入QuotaExceededError後記憶體狀態保留且可匯出；兩分頁偵測新保存、不覆寫；損毀主檔可載入上一有效備份。結果 `artifacts/v1-voyage/save/results.json`。
- 手機390及桌面1440航行／到港／累計帳截圖已保存並檢視，沿用既有美術與底部五入口。
- 測試曾發現Pinia Proxy不能structuredClone，已改逐層複製情報歷史，完整測試後通過。
- 型別與production build通過。動態價格、隨機風險、離線、投資、多船、帳號與跨裝置同步未實作或驗證。Chrome模擬尺寸不等於真機Safari、觸控及軟鍵盤驗收，仍須使用者裝置測試。


### V1正式站驗收完成

執行版commit `4bc9ad14f3f6e4c4f2d32d363080d840ba0e0236`，GitHub Actions [40269992900](https://github.com/conyku0508/tianxia-trade-m0/actions/runs/40269992900) test／build／deploy均success。

正式HTTPS來源六尺寸完整往返腳本全部PASS：`artifacts/v1-voyage/live/results.json`，同樣實際完成泉州day12→琉球day15→泉州day18、現金5945、盈虧945、途中reload與備份還原；沒有pageerror或失敗資源。正式來源的配額／分頁衝突／備份復原3項亦PASS，結果 `artifacts/v1-voyage/live-save/results.json`。兩次測試皆使用獨立headless context，不操作使用者目前分頁的存檔。

手機操作說明已上線於 `/help`；實體手機與Safari仍須使用者試玩，未以Chrome viewport冒充真機。
