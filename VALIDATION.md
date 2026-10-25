# M0 實作驗收｜2026-10-26

## 最終結果

- `npm run build` 通過：Vue TypeScript + Vite production build（66 modules）。
- `npm test` 通過：19/19，檔案 `tests/services.test.ts`。
- 本機 Chrome headless 透過 HTTP 實際載入 Vue/Pinia 應用，兩組瀏覽器腳本各完成六尺寸。
- 手機 390 與桌面 1440 的六頁 full-page 截圖已保存，並檢視地圖與市場主要版面；另外各尺寸有 viewport 壓力測試截圖。

## 22 算例覆蓋

| Case | 實測方式與結果 |
|---|---|
| A01 | 瀏覽器六尺寸：地圖點泉州、城市 Sheet、進市場；service 驗 20 城／30 商品與外鍵。通過。 |
| A02 | 瀏覽器取消確認回交易 Sheet，現金維持 5,000；service 預覽前後完整資產一致。通過。 |
| A03／A04 | service 精確驗 4,244／茶2／均成本378／庫存18／重量2／成本756／估值720／盈虧-36；瀏覽器驗現金及貨艙顯示。通過。 |
| A05 | service 與瀏覽器驗 2 天前、3 天前及 null 未知；趨勢只取 knowledge.history。通過。 |
| A06／A07 | service 比較完整資產狀態不變；瀏覽器驗 prepared／取消與現金不變。通過。 |
| A08 | service 驗 4,586／茶1／avg378／stock19／weight1；瀏覽器驗買2再賣1及現金。通過。 |
| A09／A10 | service 驗茶13、木材14與茶 MAX 成交餘額86；瀏覽器驗茶 MAX 顯示13與餘額86。通過。 |
| A11 | service 驗 0、負值、小數、NaN、Infinity、超庫存，各次零副作用；瀏覽器驗輸入0的錯誤。通過。 |
| A12 | service 以 money=0／capacity=1 變體驗不足、超重、超額賣出且零副作用。通過。 |
| A13 | service 驗同 request 二次確認回 STALE_PREVIEW；瀏覽器雙擊確認後現金只扣一次。通過。 |
| A14 | 瀏覽器六入口頁與固定五入口切換，資產持續同步；價格只讀固定 MarketService。通過。 |
| A15 | service 驗 reset 提高 revision、舊 request 失效；瀏覽器驗重設回5,000，RouterView resetKey 清草稿。通過。 |
| A16 | service 驗 money／range 變體拒絕且保留既有 prepared、資產不變。通過。 |
| A17 | 瀏覽器 MAX 成交後 reload 回5,000；README與選單顯示 memory-only。通過。 |

另測：模式不符、錯誤城市、未知商品；全數賣出移除貨物；買入成本維持精度；缺當地報價時估值為 null。

## 六尺寸結果

| Viewport | 主流程與六頁 | 補充邊界 |
|---|---|---|
| 360×800 | PASS | PASS |
| 390×844 | PASS | PASS |
| 430×932 | PASS | PASS |
| 768×1024 | PASS | PASS |
| 1024×768 | PASS | PASS |
| 1440×900 | PASS | PASS |

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
