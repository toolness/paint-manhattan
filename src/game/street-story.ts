import { ManhattanState } from "./state.js";
import { Manhattan } from "./core.js";
import { GameplayState } from "./gameplay.js";
import { shortenStreetName } from "./streets.js";

export class StreetStoryState extends ManhattanState {
  private justEntered: boolean = false;

  constructor(readonly game: Manhattan, readonly gameplayState: GameplayState, readonly streetName: string) {
    super(game);
  }

  enter() {
    this.justEntered = true;
  }

  update() {
    if (!this.justEntered && this.game.pen.wasDown && !this.game.pen.isDown) {
      this.game.changeState(this.gameplayState);
    }
    this.justEntered = false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { game } = this;

    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    game.options.font.drawText(ctx, shortenStreetName(this.streetName).toUpperCase(), 0, 0);
  }
}
