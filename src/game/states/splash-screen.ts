import { ActionPrompt } from "../action-prompt.js";
import { Manhattan } from "../core.js";
import { initializeAudio } from "../../audio.js";
import { GameplayState } from "./gameplay.js";
import { ManhattanState } from "../state.js";
import { OfflineStateChangeNotifier, getOfflineVersion } from "../../offline.js";
import { requestFullscreen } from "../../fullscreen.js";

export class SplashScreenState extends ManhattanState {
  private prompt = new ActionPrompt(this.game, 'to start');

  constructor(readonly game: Manhattan, readonly gameplayState: GameplayState) {
    super(game);
    this.bindToLifetime(this.prompt, new OfflineStateChangeNotifier(this.game.updateAndDraw));
  }

  update() {
    const { game } = this;
    if (game.pen.justWentUp) {
      if (game.options.enableFullscreen) {
        requestFullscreen();
      }
      initializeAudio();
      game.changeState(this.gameplayState);
      return;
    }
  }

  private drawVersion(ctx: CanvasRenderingContext2D) {
    const version = getOfflineVersion().slice(0, 4);
    if (!version) return;
    const font = this.game.options.tinyFont;
    const { width } = this.game.canvas;
    ctx.save();
    ctx.globalAlpha = 0.2;
    font.drawText(ctx, `V${version}`, width - 1, font.options.charHeight + 1, 'bottom-right');
    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.gameplayState.drawDarkenedMap(ctx);
    ctx.drawImage(this.game.options.splashImage, 0, 40);
    this.drawVersion(ctx);
    this.prompt.draw(ctx);
  }
}
