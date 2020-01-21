import { ActionPrompt } from "../action-prompt.js";
import { initializeAudio } from "../../audio.js";
import { ManhattanState } from "../state.js";
import { OfflineStateChangeNotifier, getOfflineVersion } from "../../offline.js";
import { requestFullscreen } from "../../fullscreen.js";
import { logAmplitudeEvent } from "../../amplitude.js";
export class SplashScreenState extends ManhattanState {
    constructor(game, gameplayState) {
        super(game);
        this.game = game;
        this.gameplayState = gameplayState;
        this.prompt = new ActionPrompt(this.game, 'to start');
        this.bindToLifetime(this.prompt, new OfflineStateChangeNotifier(this.game.updateAndDraw));
    }
    update() {
        const { game } = this;
        if (game.pen.justWentUp) {
            if (game.options.enableFullscreen) {
                requestFullscreen();
            }
            initializeAudio();
            const { showStreetSkeleton, showStreetsInNarrativeOrder } = this.game.options;
            logAmplitudeEvent({
                name: 'Game started',
                showStreetSkeleton,
                showStreetsInNarrativeOrder
            });
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
}
