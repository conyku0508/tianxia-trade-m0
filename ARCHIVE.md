# 天下商路封存備份

2026-10-26：依專案擁有人指示停止開發，保存於此 GitHub 儲存庫，完成遠端核對後移除本機遊戲資料。

## 備份內容

- 本儲存庫：完整原始碼、lockfile、測試、規格、原始美術與驗證紀錄；Git 歷史保留。
- [網頁執行包](archive/tianxia-trade-v0.2.0-web.zip)：已編譯的 index.html、CSS、JavaScript 與遊戲圖檔，無需 npm 編譯。
- [原始碼執行包](archive/tianxia-trade-v0.2.0-source.zip)：可獨立安裝與編譯的原始碼、設定、lockfile、測試與說明。美術原稿及截圖另保留於儲存庫 art/、artifacts/。
- [原始規格文件包](archive/tianxia-original-specifications.zip)：v1、v1.1 必要設計文件、資料契約與 fixture。排除 sources/ 中的歷史私人對話及含對話的原始 ZIP；內容不代表所有功能均已實作。
- [SHA256SUMS](archive/SHA256SUMS)、[逐檔清單](archive/manifest.json)：供下載後核對完整性；封存來源 commit 記錄於清單中。

## 還原及執行

### 直接使用已編譯網頁

解壓縮網頁執行包，在解壓縮資料夾執行 `python3 -m http.server 8080`，開啟 `http://localhost:8080/`。或將全部檔案上傳靜態網站主機。不要以 file:// 雙擊 index.html 啟動。

### 還原開發環境

下載原始碼執行包或 clone 本儲存庫，使用 Node.js 22.12+，執行：

```sh
npm ci
npm run dev
# 驗證與正式編譯
npm test
npm run build
```

`node_modules`、npm 快取及開發暫存檔可重建，未納入執行包。

## 封存狀態

版本 v0.2.0 / M1：三港交易、商隊出航與逐日抵達、本機存檔、測試說明。資料及經濟數值仍為原型 mock/config，正式平衡與完整遊戲引擎未完成。先前驗證詳見 VALIDATION.md；此次封存重新通過 TypeScript 檢查與 production build，三份 ZIP 均通過解壓完整性檢查。

GitHub Pages 保留。瀏覽器內既有存檔不在原始碼或執行包內。

## 本機清理範圍

核對 GitHub 備份後移除本機 tianxia-trade-m0 專案（含依賴、編譯檔、美術原稿及驗證截圖）、兩版原始規格文件包及 ZIP（僅必要設計文件備份至 GitHub，私人對話未上傳）、本聊天產生的遊戲圖片、遊戲專用暫存腳本與 npm 快取。未採用的生成圖片屬可捨棄草稿；採用的原始美術保留於 art/。其他遊戲與共用工具不在清理範圍。
