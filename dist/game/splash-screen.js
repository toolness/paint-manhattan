import { ActionPrompt } from "./action-prompt.js";
import { initializeAudio } from "../audio.js";
import { ManhattanState } from "./state.js";
export class SplashScreenState extends ManhattanState {
    constructor(game, gameplayState) {
        super(game);
        this.game = game;
        this.gameplayState = gameplayState;
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
    draw(ctx) {
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
