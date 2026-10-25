import type { MarketItem } from "../contracts/game";
export class MarketService {
  constructor(private items: () => MarketItem[]) {}
  list(cityId: string) {
    return this.items().filter((i) => i.cityId === cityId);
  }
  quote(cityId: string, goodId: string) {
    return this.list(cityId).find((i) => i.goodId === goodId);
  }
}
