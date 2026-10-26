import type { Pinia } from "pinia";
import type { SaveSnapshot } from "../contracts/voyage";
import { SaveService, parseSave } from "./SaveService";
import {
  usePlayerStore,
  useGameStore,
  useCargoStore,
  useMarketStore,
  useKnowledgeStore,
  useRouteStore,
  useVoyageStore,
  useLedgerStore,
  useUiStore,
  useSaveStore,
} from "../stores";
let service: SaveService | null = null;
let queued = false;
export function snapshot(): SaveSnapshot {
  return JSON.parse(
    JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      player: usePlayerStore().$state,
      game: useGameStore().$state,
      cargo: useCargoStore().items,
      market: useMarketStore().$state,
      knowledge: useKnowledgeStore().records,
      route: useRouteStore().$state,
      voyage: useVoyageStore().$state,
      ledger: useLedgerStore().entries,
    }),
  );
}
function apply(s: SaveSnapshot) {
  const p = s.player,
    t = p.transport;
  usePlayerStore().$patch({
    id: p.id,
    name: p.name,
    money: p.money,
    transport: {
      id: t.id,
      name: t.name,
      cargoCapacity: t.cargoCapacity,
      speed: t.speed,
      rangeDays: t.rangeDays,
    },
  });
  useGameStore().$patch({
    currentCityId: s.game.currentCityId,
    currentDay: s.game.currentDay,
  });
  useCargoStore().items = s.cargo;
  const m = useMarketStore();
  m.items = s.market.items;
  m.revision = Math.max(m.revision, s.market.revision) + 1;
  useKnowledgeStore().records = s.knowledge;
  useRouteStore().$patch(s.route);
  useVoyageStore().$patch(s.voyage);
  useLedgerStore().entries = s.ledger;
  useUiStore().resetKey++;
}
function persist() {
  if (!service) return;
  const s = snapshot(),
    result = service.write(s),
    status = useSaveStore();
  status.$patch({
    ...result,
    savedAt: result.status === "saved" ? s.savedAt : status.savedAt,
  });
}
export function initializePersistence(pinia: Pinia) {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {}
  service = new SaveService(storage);
  const loaded = service.load();
  if (loaded.snapshot) apply(loaded.snapshot);
  useSaveStore(pinia).$patch({
    status: loaded.mode,
    message: loaded.message,
    savedAt: loaded.snapshot?.savedAt ?? "",
  });
  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      persist();
    });
  };
  for (const store of [
    usePlayerStore(pinia),
    useGameStore(pinia),
    useCargoStore(pinia),
    useMarketStore(pinia),
    useKnowledgeStore(pinia),
    useRouteStore(pinia),
    useVoyageStore(pinia),
    useLedgerStore(pinia),
  ])
    store.$subscribe(schedule, { detached: true, flush: "sync" });
  window.addEventListener("pagehide", persist);
}
export function inspectImport(raw: string) {
  return parseSave(raw);
}
export function importProgress(raw: string) {
  const parsed = parseSave(raw);
  if (!parsed)
    return { ok: false, message: "備份格式或數值不一致，未更動目前進度" };
  apply(parsed);
  const result = service?.write(snapshot(), true);
  if (result)
    useSaveStore().$patch({
      ...result,
      savedAt:
        result.status === "saved" ? parsed.savedAt : useSaveStore().savedAt,
    });
  return { ok: true, message: "備份已匯入" };
}
export function exportProgress() {
  const blob = new Blob([JSON.stringify(snapshot(), null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "天下商路-進度備份.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
