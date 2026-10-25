import raw from "./mock-fixture.json";
import type { PrototypeFixture } from "../contracts/game";
export const freshFixture = (): PrototypeFixture =>
  structuredClone(raw) as PrototypeFixture;
export const definitions = freshFixture();
export const goods = definitions.goods;
export const routes = definitions.routes;
export const epsilon = 1e-9;
