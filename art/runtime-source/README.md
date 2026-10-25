# 執行用美術來源

使用者已確認 v1 地圖／市場／貨艙及 v2 情報方向，並授權套用。原始 PNG、PROMPTS.md、GOODS_ALPHA_PROMPT.md 與 manifest.json 保留重建來源；src/assets/art 為 WebP 編碼版本。

所有生成與去背皆使用內建 image_gen；程式僅將 PNG 轉存 WebP，不使用像素裁切或重繪。圖示以 CSS sprite 定位共用 atlas；文字與按鈕由 Vue 顯示。兩張 atlas 有 alpha，並非把黑色背景當成透明。

這些是 AI 生成的示意美術，非歷史考據。商品專用圖目前6種，其餘使用通用貨箱。地圖20個城市 marker 仍按 fixture 正規化座標疊加，不以背景圖定義新的遊戲地理或商品。

manifest 記錄原檔／執行檔、尺寸、alpha、檔案大小與 SHA-256；原圖與概念包不在 dist。六張 runtime 圖片共2,997,274 bytes，保留原始尺寸，不等於首屏流量或解碼記憶體。
