import worldMap from "../assets/art/world-map.webp";
import market from "../assets/art/quanzhou-market.webp";
import cargo from "../assets/art/cargo-hold.webp";
import intelligence from "../assets/art/intelligence-desk.webp";
import goodsAtlas from "../assets/art/goods-atlas.webp";
import navigationAtlas from "../assets/art/navigation-atlas.webp";
export const art = {
  worldMap,
  market,
  cargo,
  intelligence,
  goodsAtlas,
  navigationAtlas,
};
// Presentation-only sprite mapping. Unknown goods retain a generic cargo illustration.
export const goodsIconIndex: Record<string, number> = {
  tea: 0,
  silk: 1,
  porcelain: 2,
  rice: 3,
  timber: 4,
  spice: 5,
};
export const navIconIndex: Record<string, number> = {
  map: 0,
  market: 1,
  cargo: 2,
  intelligence: 3,
  menu: 4,
};

// Visual merchandising order from the approved market concept; no economic effect.
export const featuredGoodIds = ["tea", "silk", "porcelain"];
