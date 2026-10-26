# V1第一階段實作契約

本階段由使用者授權「商隊移動、下一階段製作、完成時提供怎麼測」。範圍為實際出航／手動時間／到港交易／回程／觀察情報／收支／本機續玩。沿用已批准美術與手機小港口標記。未修改外部v1.1文件包；原M0 fixture不變，以journeyConfig建立擴充runtime。

## 狀態與command

- `routeStore`仍只保存idle/prepared，prepare不改資產、天數或所在地。出航是VoyageService獨立command。
- `voyageStore.active`保存目前航程與elapsedDays，`lastArrival`保存上次到港紀錄；不另存money/cargo/currentCity。
- depart要求prepared routeId與expectedRevision符合、起點相符、航程與現金足夠。成功扣旅費一次、記錄出發港已知行情、建立active、增加market revision。無await，失敗零資產副作用。
- advance要求active.id及expectedDay符合；成功currentDay+1。達travelDays才換所在地、清prepared/active、保存lastArrival並觀察目的港報價；不再扣旅費。重複同一天／同一到港request失敗，不重算。
- 海上TradeService拒絕買／賣、MAX回0，RouteService拒絕prepare並忽略cancel；UI市場亦有阻擋。途中保留出發港估值並明示為參考價。
- 出航後不可取消退款；本階段沒有現實時間倒數或隨機事件扣款。

## 配置與情報

泉州原30報價保留。琉球／馬六甲各30報價與回程由journeyConfig集中配置。所有mock，無隨機波動。琉球茶480／木材70；泉州茶360／木材120。稅率皆沿用城市fixture的5%。馬六甲保留原出發航線並補反向12天／480。

Knowledge只在出發及抵達的實際觀察時寫入該港30筆記錄，source=visit；同日替換同日觀察，歷史保留最後12個已知點。未觀察的外地不自動更新。UI提供港口與商品篩選，不直接讀外地market。

## 收支

ledgerStore只保存已發生command紀錄，不重複資產。TradePreview增加costBasis與realizedProfit，由TradeService計算，UI只顯示selector。

買入稅計入平均成本；賣出盈虧=稅後淨收入−賣出數量×平均成本；旅費另記。累計扣旅費後已實現盈虧=累計已實現交易盈虧−旅費。未售成本不重扣；不做單航段費用分攤。

## 本機保存

SaveSnapshot version1含player/game/cargo/market/knowledge/route/voyage/ledger，UI草稿不存。restore提高revision，防舊摘要。驗證數值、外鍵、各key唯一、重量、固定配置價格、觀察歷史、航程一致性，並從ledger回算現金／持貨平均成本／庫存。

Command同步完成後microtask保存完整快照，寫入讀回驗證，上一有效快照留backup。損毀主檔可回復上次備份。Quota/Security/回讀失敗顯示警示，當前記憶體狀態仍在且可匯出。其他分頁修改後不直接覆寫；無資料庫原子性或永久存檔承諾。無跨裝置同步。

匯入先parse/validate，再顯示確認；取消或錯誤零副作用。使用者確認後才取代狀態與保存。JSON最多5MB，合法版本1限定此階段配置；未承諾未來引擎版本直接相容。

## 可重現驗收

初始5000／day12→茶10買入3780→1220→出航120→1100→day15琉球→賣茶淨4560→5660→木材10買入735→4925→回程120→4805→day18泉州→賣木材淨1140→5945／空艙；交易盈虧1185−旅費240=945。

使用者操作指南見TEST_GUIDE.md及遊戲/help。原M0「刷新回fixture」在此版由本機續玩取代；舊歷史驗收不應當成本版行為。
