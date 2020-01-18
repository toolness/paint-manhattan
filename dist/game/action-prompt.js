import { Timer } from "../timer.js";
const TIMER_INTERVAL_MS = 1500;
export class ActionPrompt {
    constructor(game, actionConsequence) {
        this.game = game;
        this.actionConsequence = actionConsequence;
        this.blinkTimer = new Timer(TIMER_INTERVAL_MS, this.game.updateAndDraw);
    }
    draw(ctx) {
        const { game } = this;
        const { width, height } = game.canvas;
        if (this.blinkTimer.tick % 2 === 0) {
            ctx.save();
            ctx.globalAlpha = 0.75;
            const { tinyFont } = game.options;
            const text = `Click or tap ${this.actionConsequence}`;
            tinyFont.drawText(ctx, text, width / 2, height - tinyFont.options.charHeight, 'center');
            ctx.restore();
        }
    }
    start() {
        this.blinkTimer.start();
    }
    stop() {
        this.blinkTimer.stop();
    }
}
