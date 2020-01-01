import { ActionPrompt } from "./action-prompt.js";
import { Manhattan } from "./core.js";
import { initializeAudio } from "../audio.js";
import { GameplayState } from "./gameplay.js";
import { ManhattanState } from "./state.js";

export class SplashScreenState extends ManhattanState {
  prompt: ActionPrompt;

  constructor(readonly game: Manhattan, readonly gameplayState: GameplayState) {
    super(game);
    this.prompt = new ActionPrompt(game, 'to start');
  }

  update() {
    const { game } = this;
    if (game.pen.justWentUp) {
      initializeAudio();
      game.changeState(this.gameplayState);
      return;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.gameplayState.drawDarkenedMap(ctx);
    ctx.drawImage(this.game.options.splashImage, 0, 40);
    this.prompt.draw(ctx);
  }

  enter() {
    this.prompt.start();
  }

  exit() {
    this.prompt.stop();
  }
}
