import { ManhattanState } from "./state.js";
import { shortenStreetName } from "./streets.js";
export class StreetStoryState extends ManhattanState {
    constructor(game, gameplayState, streetName) {
        super(game);
        this.game = game;
        this.gameplayState = gameplayState;
        this.streetName = streetName;
        this.justEntered = false;
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
    draw(ctx) {
        const { game } = this;
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        game.options.font.drawText(ctx, shortenStreetName(this.streetName).toUpperCase(), 0, 0);
    }
}
