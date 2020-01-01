import { Timer } from "../timer.js";
import { Manhattan } from "./core.js";
import { initializeAudio } from "../audio.js";
import { GameplayState } from "./gameplay.js";
import { ManhattanState } from "./state.js";

const TIMER_INTERVAL_MS = 1500;

export class SplashScreenState extends ManhattanState {
  readonly splashTimer: Timer;

  constructor(readonly game: Manhattan, readonly gameplayState: GameplayState) {
    super(game);
    this.splashTimer = new Timer(TIMER_INTERVAL_MS, this.game.updateAndDraw);
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
    const { game } = this;

    ctx.save();
    this.gameplayState.drawDarkenedMap(ctx);
    ctx.drawImage(game.options.splashImage, 0, 40);

    if (this.splashTimer.tick % 2 === 0) {
      ctx.globalAlpha = 0.75;
      const { tinyFont } = game.options;
      tinyFont.drawText(ctx, 'Click or tap to start', game.canvas.width / 2, game.canvas.height - tinyFont.options.charHeight, 'center');
    }
    ctx.restore();
  }

  enter() {
    this.splashTimer.start();
  }

  exit() {
    this.splashTimer.stop();
  }
}
