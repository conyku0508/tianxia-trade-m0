import type {
  Route,
  RouteState,
  RoutePreview,
  RouteError,
  Result,
  GameState,
  Player,
} from "../contracts/game";
export class RouteService {
  constructor(
    private routes: Route[],
    private state: () => { game: GameState; player: Player },
    private write: (s: RouteState) => void,
  ) {}
  listFrom(cityId: string) {
    return this.routes.filter((r) => r.enabled && r.fromCityId === cityId);
  }
  preview(id: string): Result<RoutePreview, RouteError> {
    const r = this.routes.find((r) => r.id === id && r.enabled);
    if (!r) return { ok: false, error: "NO_ROUTE", message: "暫無原型航線" };
    const s = this.state(),
      reason =
        r.fromCityId !== s.game.currentCityId
          ? "WRONG_ORIGIN"
          : r.travelDays > s.player.transport.rangeDays
            ? "OUT_OF_RANGE"
            : s.player.money < r.travelCost
              ? "INSUFFICIENT_FUNDS"
              : null;
    return { ok: true, value: { route: r, canPrepare: !reason, reason } };
  }
  prepare(id: string): Result<RouteState, RouteError> {
    const p = this.preview(id);
    if (!p.ok) return p;
    if (!p.value.canPrepare)
      return {
        ok: false,
        error: p.value.reason!,
        message:
          p.value.reason === "OUT_OF_RANGE"
            ? "超出商船航程"
            : p.value.reason === "WRONG_ORIGIN"
              ? "不在路線起點"
              : "現金不足旅費",
      };
    const state: RouteState = { selectedRouteId: id, status: "prepared" };
    this.write(state);
    return { ok: true, value: state };
  }
  cancel() {
    this.write({ selectedRouteId: null, status: "idle" });
  }
}
