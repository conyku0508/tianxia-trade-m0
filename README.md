# 天下商路 · M0 手機優先原型

依 `work_天下商路遊戲討論_v1.1` 與 2026-10-26 Review 實作的獨立本機原型，未改動文件包或其他遊戲。所有經濟參數為 **Mock Data / Config Placeholder**，不是正式平衡。已套用使用者確認的四張美術方向，情報頁採 v2 細金線／卷軸標記。手繪海圖、泉州港市景、貨艙、情報桌與商品／導覽圖示為獨立素材；標頭、文字、報價、圖表、按鈕及城市 marker 仍為可操作的 Vue／CSS／SVG 元件。

## 執行

使用 Node.js 22.12+ 或 24（實測 24.14.0），npm：

```sh
cd tianxia-trade-m0
npm ci
npm run dev -- --port 5174
```

開啟終端顯示的本機網址，例如 http://127.0.0.1:5174/ 。Vue Router 使用 hash 路由，無需伺服器 rewrite。

```sh
npm test         # service/fixture 接受條件，19 項
npm run build    # Vue/TypeScript 檢查 + Vite production build
npm run preview  # 預覽 dist
```

`package-lock.json` 已保存實際相依版本。Vue 3.5、Vite 7、Pinia 3、Vue Router 4、Tailwind 4、TypeScript 5.9。Vite 相容性來源：[官方說明](https://vite.dev/guide/)。

## 可操作流程

地圖點選「泉州」→城市 Bottom Sheet→進入市場→普通茶葉買入→數量 2→確認摘要→確認買入→貨艙→情報→琉球查看航線→準備前往。底部固定五入口為地圖、市場、貨艙、情報、選單；航線頁歸在地圖入口。

- 地圖提供 20 城 marker、可拖曳及按鈕縮放、全部港口索引、城市摘要。僅泉州可交易；只有兩條已配置航線可準備，其餘清楚顯示暫無原型航線。
- 市場有 30 商品槽位、分類、買／賣、手動整數、＋／−、MAX、預覽、確認及取消。木材存在，馬匹不在列表。茶葉、絲綢、瓷器、稻米、木材、香料有專用插畫；其餘24商品沿用共用貨箱圖示，名稱與資料各自獨立。全部列表先展示茶葉／絲綢／瓷器，此為 UI 排序，不改 fixture。
- 確認前不更動資產；確認成功同步現金、庫存、持貨、含買入稅平均成本與載重。舊 revision 摘要失效；重設仍提高 revision。MAX、稅金、估值與交易驗證由 service 計算。
- 貨艙顯示成本、當地稅前估值、未實現盈虧。缺報價時顯示「資料不足」。
- 情報只讀已知價與觀察歷史，顯示舊情報時間與未知值，不讀外地即時行情；傳聞／事件只展示。
- 準備航線可取消或替換，僅保存 prepared；不扣旅費、不移動、不推進第 12 天。
- 選單可經確認重設全部原型資料。

## 模擬資料與初始化

`src/data/mock-fixture.json` 是唯一可編輯數值來源，直接取自文件包 22 的 fixture，未另造商品清單。`freshFixture()` 每次 deep clone，store 初始化與重設都使用它。`src/contracts/game.ts` 沿用文件包契約；未來型別存在不代表建置了相應 runtime。

初始泉州、第 12 天、現金 5,000、小型商船容量 100、空艙。茶葉 360 文、稅率 5%；買 2 後現金 4,244、均成本 378、總成本 756、庫存 18、重量 2，稅前估值 720、未實現盈虧 -36。再賣 1 後現金 4,586。全新 MAX 茶 13、木材 14。外地情報為馬六甲茶 500（2 天前）、琉球瓷器 680（3 天前）、亞丁香料未知。兩條航線分別為琉球 3 天／120／8%，馬六甲 12 天／480／18%。

**memory-only：重新載入頁面即回初始 fixture。** 不使用 localStorage、IndexedDB、帳號或正式存讀檔；重設及刷新不會保留交易紀錄。

## 三層與唯一狀態

- Data/Config：`src/data/`、`src/contracts/`。
- UI/Presentation：`src/pages/`、`components/ui/`、`styles/`。Button、Panel、Sheet/Modal（Overlay）、交易列、交易控制、趨勢圖共用。
- Logic/Service：MarketService、TradeService、RouteService 透過注入 port 讀寫；不依賴 Vue Router 或 .vue。
- `src/stores/index.ts` 定義各自獨立 Pinia store：player.money、cargo.items、game.currentCityId/currentDay、market.items/revision、city、knowledge、route；UI store 只管 toast 與 resetKey。暫時交易草稿在元件中，不是資產備份。金額、載重、估值不存第二份。

修改前先判斷 Data／UI／Logic，再列出預計修改檔案；直接執行，不以此作為批准關卡。

## 實際驗證

詳細結果見 [VALIDATION.md](VALIDATION.md)，原始結果及截圖在 `artifacts/`。

- 通過：Vue TypeScript 檢查、正式建置；19 項 service/fixture 測試。
- 通過：本機 Chrome 無頭瀏覽器於 360×800、390×844、430×932、768×1024、1024×768、1440×900 的交易與主流程，六頁水平溢出／導覽檢查，鍵盤 Escape 與焦點返回、重設、刷新。
- 未執行：實體 iOS／Android、Safari、真實觸控與軟鍵盤彈出遮擋；viewport 測試不能代替裝置驗收。沒有宣稱正式素材逐像素還原或 WCAG 全面認證。

重跑瀏覽器測試：先啟動上述 5174 dev server，再執行 `node scripts/browser-check.mjs` 與 `node scripts/browser-edge-check.mjs`。腳本預設 macOS Chrome 路徑；其他環境需調整 executablePath。Chrome 測試使用真實 DOM 與 Vue 應用，並非靜態 HTML 檢查。內建 CUA 工具本次因 sandbox TIOCSTI 啟動錯誤不可用，因此改用本機 Chrome。

## 延後範圍

完整經濟引擎、正式數值／最終商品資料、價格波動、實際航行／到港／風險結算、正式存讀檔、PWA 離線均延後。沒有 Investment／Fleet／Recruitment runtime。V1.5 投資；V2 角色、水手、多船、旗艦；V2.5 第二商隊／自動貿易；V3 戰爭外交海戰另定。沒有大型 RPG、多人、後端帳號。

## GitHub Pages 與手機測試

公開儲存庫：https://github.com/conyku0508/tianxia-trade-m0

已上線手機測試網址：https://conyku0508.github.io/tianxia-trade-m0/

使用手機 Safari／Chrome 直接開啟，不需要同 Wi-Fi 或啟動電腦終端機。手機瀏覽器請使用一般行動版模式；若開啟「要求桌面網站」，可能套用桌面斷點。刷新會回 fixture，沒有跨裝置同步。

RWD：小於 768px 為單欄與底部 Sheet；768–1199px 重排為雙區塊與側 Drawer；1200px 以上市場為雙欄商品＋摘要側欄。手機與桌面共用同一份 state/service。

推送 main 後，`.github/workflows/pages.yml` 自動執行 npm ci、19 項測試、型別檢查、建置與 Pages 發佈。Vite base='./' 搭配 hash router，支援儲存庫子路徑。重新部署後可在網址加 `?release=版本` 避免舊頁面快取；資源檔另有內容 hash。

正式站已於 2026-10-26 完成六尺寸 Chrome 主流程驗證，HTTP 200、無 pageerror／失敗資源，手機市場一欄、平板桌面兩欄。結果在 `artifacts/live-results.json`，重跑指令 `node scripts/live-check.mjs`。實體 iOS／Android 與 Safari 仍待裝置測試。

## 美術套版｜2026-10-26

- 確認稿：`art/concepts/v1/`（地圖、市場、貨艙）與 `art/concepts/v2/`（情報）。
- 六張可重用素材的原始 PNG、生成提示詞與 SHA-256 清單：`art/runtime-source/`。使用內建 image_gen 依確認稿改編，非整張 UI 圖直接貼到操作頁。
- 執行用素材：`src/assets/art/*.webp`，六張合計 2,997,274 bytes。原尺寸僅做 WebP 編碼，保留圖示 alpha；原 PNG 不進 dist。此總量是全部素材檔案大小，並非宣稱首屏下載量。
- `src/data/assets.ts` 集中資產及 CSS sprite 映射；`ArtIcon`、`SceneHero` 共用；未找到專用商品圖時顯示貨箱，不會破圖。每個頁面只引用所需場景。
- 情報頁「已知行情」為卷軸＋墨綠文字＋細金線，歷史紀錄為動態 SVG，只有兩筆已知觀察點。未知值仍無趨勢圖、無虛構觀察日期。
- 圖片為示意美術，不作正式地理／建築考據；20城座標、30商品與所有交易／路線規則維持既有 fixture。沒有新增航行、存檔或投資功能。

美術六尺寸驗收：`node scripts/art-check.mjs`。可設定 `BASE_URL` 測正式站、`ARTIFACT_DIR` 指定輸出；結果位於 `artifacts/art-release/`。原始 UI 邊界與交易流程腳本也支援這兩個環境變數。
