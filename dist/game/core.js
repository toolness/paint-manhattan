import { getCanvasCtx2D, createCanvas } from '../util.js';
import { CanvasResizer } from '../canvas-resizer.js';
import { Pen } from '../pen.js';
import { TERRAIN_FRAME } from './sheet-frames.js';
import { GameplayState } from './gameplay.js';
import { SplashScreenState } from './splash-screen.js';
export class Manhattan {
    constructor(options) {
        this.options = options;
        const { w, h } = options.sheet.getFrameMetadata(TERRAIN_FRAME).frame;
        const canvas = createCanvas(w, h);
        options.root.appendChild(canvas);
        this.updateAndDraw = this.updateAndDraw.bind(this);
        this.pen = new Pen(canvas, this.updateAndDraw);
        this.resizer = new CanvasResizer(canvas);
        this.canvas = canvas;
        const gameplayState = new GameplayState(this);
        this.currState = options.skipSplashScreen ? gameplayState : new SplashScreenState(this, gameplayState);
    }
    changeState(newState) {
        this.currState.exit();
        this.currState = newState;
        this.currState.enter();
        // We don't want a state thinking the pen just went up immediately after it started,
        // as it's likely that the state transition was caused by the pen going up!
        this.pen.updateHistory();
        this.currState.update();
    }
    updateAndDraw() {
        this.currState.update();
        const ctx = getCanvasCtx2D(this.canvas);
        this.currState.draw(ctx);
        this.pen.updateHistory();
    }
    start() {
        this.resizer.start();
        this.pen.start();
        this.currState.enter();
        this.updateAndDraw();
    }
    stop() {
        this.currState.exit();
        this.resizer.stop();
        this.pen.stop();
    }
}
