import { Timer } from "../timer.js";
import { initializeAudio } from "../audio.js";
import { GameplayState } from "./gameplay.js";
import { TERRAIN_FRAME, STREETS_FRAME } from "./sheet-frames.js";
import { ManhattanState } from "./state.js";
const TIMER_INTERVAL_MS = 1500;
export class SplashScreenState extends ManhattanState {
    constructor(game) {
        super(game);
        this.game = game;
        this.splashTimer = new Timer(TIMER_INTERVAL_MS, this.game.updateAndDraw);
    }
    update() {
        const { game } = this;
        if (game.pen.wasDown && !game.pen.isDown) {
            initializeAudio();
            game.changeState(new GameplayState(game));
            return;
        }
    }
    draw(ctx) {
        const { game } = this;
        game.canvas.style.cursor = 'default';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        ctx.globalAlpha = 0.33;
        game.options.sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
        ctx.globalAlpha = 0.04;
        game.options.sheet.drawFrame(ctx, STREETS_FRAME, 0, 0);
        ctx.globalAlpha = 1.0;
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
