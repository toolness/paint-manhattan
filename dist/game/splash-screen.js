import { ActionPrompt } from "./action-prompt.js";
import { initializeAudio } from "../audio.js";
import { ManhattanState } from "./state.js";
import { onOfflineStateChange, getOfflineVersion } from "../offline.js";
export class SplashScreenState extends ManhattanState {
    constructor(game, gameplayState) {
        super(game);
        this.game = game;
        this.gameplayState = gameplayState;
        this.unsubscribeOffline = null;
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
    drawVersion(ctx) {
        const version = getOfflineVersion().slice(0, 4);
        if (!version)
            return;
        const font = this.game.options.tinyFont;
        const { width } = this.game.canvas;
        ctx.save();
        ctx.globalAlpha = 0.2;
        font.drawText(ctx, `V${version}`, width - 1, font.options.charHeight + 1, 'bottom-right');
        ctx.restore();
    }
    draw(ctx) {
        this.gameplayState.drawDarkenedMap(ctx);
        ctx.drawImage(this.game.options.splashImage, 0, 40);
        this.drawVersion(ctx);
        this.prompt.draw(ctx);
    }
    clearOfflineSubscription() {
        if (this.unsubscribeOffline) {
            this.unsubscribeOffline();
            this.unsubscribeOffline = null;
        }
    }
    enter() {
        this.clearOfflineSubscription();
        this.unsubscribeOffline = onOfflineStateChange(this.game.updateAndDraw);
        this.prompt.start();
    }
    exit() {
        this.clearOfflineSubscription();
        this.prompt.stop();
    }
}
