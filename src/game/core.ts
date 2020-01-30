import { AsepriteSheet } from '../aseprite-sheet.js';
import { BitmapFont } from '../font.js';
import { getCanvasCtx2D, createCanvas } from '../util.js';
import { CanvasResizer } from '../canvas-resizer.js';
import { Pen } from '../pen.js';
import { SoundEffect } from '../audio.js';
import { TERRAIN_FRAME } from './sheet-frames.js';
import { GameplayState } from './states/gameplay.js';
import { SplashScreenState } from './states/splash-screen.js';
import { ManhattanState } from './state.js';
import { CreateStreetListOptions, createStreetList } from './street-util.js';

export type ManhattanOptions = CreateStreetListOptions & {
  sheet: AsepriteSheet,
  font: BitmapFont,
  tinyFont: BitmapFont,
  root: HTMLElement,
  splashImage: HTMLImageElement,
  skipSplashScreen: boolean,
  showStreetSkeleton: boolean,
  successSoundEffect: SoundEffect,
  missSoundEffect: SoundEffect,
  showStreetStories: boolean,
  showScore: boolean,
  enableFullscreen: boolean,
  resizeCanvas: boolean,
  onFrameDrawn?: (ctx: CanvasRenderingContext2D) => void,
};

export class Manhattan {
  private readonly resizer?: CanvasResizer;
  readonly canvas: HTMLCanvasElement;
  readonly pen: Pen;
  private currState: ManhattanState;

  constructor(readonly options: ManhattanOptions) {
    const {w, h} = options.sheet.getFrameMetadata(TERRAIN_FRAME).frame;
    const canvas = createCanvas(w, h);
    options.root.appendChild(canvas);
    this.updateAndDraw = this.updateAndDraw.bind(this);
    this.pen = new Pen(canvas, this.updateAndDraw);
    if (options.resizeCanvas) {
      this.resizer = new CanvasResizer(canvas);
    }
    this.canvas = canvas;
    const streetsToPaint = createStreetList(options.sheet, options);
    const gameplayState = new GameplayState(this, streetsToPaint);
    this.currState = options.skipSplashScreen ? gameplayState : new SplashScreenState(this, gameplayState);
  }

  changeState(newState: ManhattanState) {
    this.currState.exit();
    this.currState = newState;
    this.currState.enter();

    // We don't want a state thinking the pen just went up immediately after it started,
    // as it's likely that the state transition was caused by the pen going up!
    this.pen.updateHistory();

    this.currState.update();
  }

  updateAndDraw() {
    this.pen.clearCursorState();
    this.currState.update();

    const ctx = getCanvasCtx2D(this.canvas);
    this.currState.draw(ctx);
    this.pen.updateHistory();
    this.pen.applyCursorState();
    if (this.options.onFrameDrawn) {
      this.options.onFrameDrawn(ctx);
    }
  }

  start() {
    if (this.resizer) {
      this.resizer.start();
    }
    this.pen.start();
    this.currState.enter();
    this.updateAndDraw();
  }

  stop() {
    this.currState.exit();
    if (this.resizer) {
      this.resizer.stop();
    }
    this.pen.stop();
  }
}
