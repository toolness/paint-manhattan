import { Manhattan } from "./core.js";
import { GameState } from "../game-state.js";

export class ManhattanState extends GameState {
  constructor(readonly game: Manhattan) {
    super();
  }
}
