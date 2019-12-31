import { Manhattan } from "./core.js";

export class ManhattanState {
  constructor(readonly game: Manhattan) {}
  enter() {}
  exit() {}
  update() {}
  draw(ctx: CanvasRenderingContext2D) {}
}
