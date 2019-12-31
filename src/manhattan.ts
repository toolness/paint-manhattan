import { AsepriteSheet } from './aseprite-sheet.js';
import { BitmapFont } from './font.js';
import { getCanvasCtx2D, createCanvas, shuffleArray, iterPixelIndices, isImageEmptyAt, setPixel, moveToTopOfArray} from './util.js';
import { CanvasResizer } from './canvas-resizer.js';
import { Pen } from './pen.js';
import { SoundEffect, initializeAudio } from './audio.js';
import { Timer } from './timer.js';

type RGBA = [number, number, number, number];

const STREET_SKELETON_ALPHA = 0.33;

const TIMER_INTERVAL_MS = 1500;

const PAINT_RADIUS_MOUSE = 5;

const PAINT_RADIUS_TOUCH = 10;

const PAINT_HOVER_STYLE = 'rgba(255, 255, 255, 1.0)';

const PAINT_INACTIVE_STREET_RGBA: RGBA = [238, 195, 154, 255];

const PAINT_ACTIVE_STREET_RGBA: RGBA = [153, 229, 80, 255];

const TERRAIN_FRAME = "Land and water";

const STREETS_FRAME = "Streets";

const IGNORE_FRAMES = [
  "Reference image",
];

const NON_HIGHLIGHT_FRAMES = [
  TERRAIN_FRAME,
  STREETS_FRAME,
  ...IGNORE_FRAMES
];

const SCORE_BONUS_STREET_FINISHED = 10;

const SCORE_PENALTY_COMPLETE_MISS = 2;

export type ManhattanOptions = {
  sheet: AsepriteSheet,
  font: BitmapFont,
  tinyFont: BitmapFont,
  root: HTMLElement,
  splashImage: HTMLImageElement,
  skipSplashScreen: boolean,
  showStreetSkeleton: boolean,
  startWithStreet?: string,
  minStreetSize: number,
  successSoundEffect: SoundEffect,
  missSoundEffect: SoundEffect,
};

export function getStreetFrames(sheet: AsepriteSheet): string[] {
  const ignoreFrames = new Set(NON_HIGHLIGHT_FRAMES);
  return Object.keys(sheet.metadata.frames).filter(name => !ignoreFrames.has(name));
}

function shortenStreetName(name: string): string {
  return name
    .replace('Street', 'St')
    .replace('Place', 'Pl');
}

function getPixelsLeftText(pixelsLeft: number): string {
  const pixels = pixelsLeft === 1 ? 'pixel' : 'pixels';
  return `${pixelsLeft} ${pixels} left`;
}

type CurrentHighlightFrameDetails = {
  name: string,
  pixelsLeft: number,
};

export class Manhattan {
  readonly resizer: CanvasResizer;
  readonly canvas: HTMLCanvasElement;
  readonly pen: Pen;
  private currState: ManhattanState;

  constructor(readonly options: ManhattanOptions) {
    const {w, h} = options.sheet.getFrameMetadata(TERRAIN_FRAME).frame;
    const canvas = createCanvas(w, h);
    options.root.appendChild(canvas);
    this.updateAndDraw = this.updateAndDraw.bind(this);
    this.pen = new Pen(canvas, this.updateAndDraw);
    this.resizer = new CanvasResizer(canvas);
    this.canvas = canvas;
    this.currState = options.skipSplashScreen ? new GameplayState(this) : new SplashScreenState(this);
  }

  drawStreetSkeleton(ctx: CanvasRenderingContext2D) {
    if (!this.options.showStreetSkeleton) return;
    ctx.save();
    ctx.globalAlpha = STREET_SKELETON_ALPHA;
    this.options.sheet.drawFrame(ctx, STREETS_FRAME, 0, 0);
    ctx.restore();
  }

  changeState(newState: ManhattanState) {
    this.currState.exit();
    this.currState = newState;
    this.currState.enter();
    this.updateAndDraw();
  }

  updateAndDraw() {
    this.currState.update();

    const ctx = getCanvasCtx2D(this.canvas);
    this.currState.draw(ctx);
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

class ManhattanState {
  constructor(readonly game: Manhattan) {}
  enter() {}
  exit() {}
  update() {}
  draw(ctx: CanvasRenderingContext2D) {}
}

class SplashScreenState extends ManhattanState {
  readonly splashTimer: Timer;

  constructor(readonly game: Manhattan) {
    super(game);
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

  draw(ctx: CanvasRenderingContext2D) {
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

class GameplayState extends ManhattanState {
  private readonly streetCanvas: HTMLCanvasElement;
  private readonly highlightFrames: string[];
  private currentHighlightFrameDetails: CurrentHighlightFrameDetails|null;
  private score: number = 0;

  constructor(readonly game: Manhattan) {
    super(game);
    const streetCanvas = createCanvas(game.canvas.width, game.canvas.height);
    this.streetCanvas = streetCanvas;
    let highlightFrames = shuffleArray(getStreetFrames(game.options.sheet));
    if (game.options.startWithStreet) {
      moveToTopOfArray(highlightFrames, game.options.startWithStreet);
    }
    if (game.options.minStreetSize > 0) {
      highlightFrames = highlightFrames.filter(frame => {
        return this.countPixelsToBePainted(frame) >= game.options.minStreetSize;
      });
    }
    this.highlightFrames = highlightFrames;

    this.currentHighlightFrameDetails = this.getNextHighlightFrame();
  }

  unhighlightActiveStreet() {
    const streetCtx = getCanvasCtx2D(this.streetCanvas);
    const streetIm = streetCtx.getImageData(0, 0, this.streetCanvas.width, this.streetCanvas.height);

    // This is a bit brute-force, we're just iterating through all non-empty pixels and
    // setting them to the un-highlighted color, which is fine for now because all
    // the street canvas's pixels should be the same color anyways.
    for (let idx of iterPixelIndices(streetIm)) {
      if (!isImageEmptyAt(streetIm, idx)) {
        setPixel(streetIm, idx, ...PAINT_INACTIVE_STREET_RGBA);
      }
    }

    streetCtx.putImageData(streetIm, 0, 0);
  }

  getNextHighlightFrame(): CurrentHighlightFrameDetails|null {
    const name = this.highlightFrames.pop();
    if (!name) {
      return null;
    }
    return {name, pixelsLeft: this.countPixelsToBePainted(name)};
  }

  private countPixelsToBePainted(frame: string) {
    const { sheet } = this.game.options;
    const streetCtx = getCanvasCtx2D(this.streetCanvas);
    const sheetCtx = getCanvasCtx2D(sheet.canvas);
    const frameIm = sheet.getFrameImageData(sheetCtx, frame);
    const streetIm = streetCtx.getImageData(0, 0, this.streetCanvas.width, this.streetCanvas.height);
    let total = 0;
    for (let idx of iterPixelIndices(frameIm)) {
      if (!isImageEmptyAt(frameIm, idx) && isImageEmptyAt(streetIm, idx)) {
        total += 1;
      }
    }
    return total;
  }

  update() {
    const { game } = this;
    const curr = this.currentHighlightFrameDetails;
  
    if (!curr) return;

    const { pen } = game;

    if (!pen.isDown && curr.pixelsLeft === 0) {
      this.unhighlightActiveStreet();
      this.currentHighlightFrameDetails = this.getNextHighlightFrame();
    }

    if (!(pen.pos && pen.isDown)) return;

    const { paintRadius } = this;
    const x1 = Math.max(pen.pos.x - paintRadius, 0);
    const y1 = Math.max(pen.pos.y - paintRadius, 0);
    const x2 = Math.min(pen.pos.x + paintRadius + 1, game.canvas.width);
    const y2 = Math.min(pen.pos.y + paintRadius + 1, game.canvas.height);
    const w = x2 - x1;
    const h = y2 - y1;

    const sheetCtx = getCanvasCtx2D(game.options.sheet.canvas);
    const frameData = game.options.sheet.getFrameImageData(sheetCtx, curr.name, x1, y1, w, h);
    const streetCtx = getCanvasCtx2D(this.streetCanvas);
    const streetData = streetCtx.getImageData(x1, y1, w, h);
    let pixelsAdded = 0;
    let isCompleteMiss = true;
    for (let idx of iterPixelIndices(frameData)) {
      const shouldBeHighlighted = !isImageEmptyAt(frameData, idx);
      if (shouldBeHighlighted) {
        const isHighlighted = !isImageEmptyAt(streetData, idx);
        if (!isHighlighted) {
          setPixel(streetData, idx, ...PAINT_ACTIVE_STREET_RGBA);
          pixelsAdded += 1;
        }
        isCompleteMiss = false;
      }
    }

    if (pixelsAdded) {
      streetCtx.putImageData(streetData, x1, y1);
      curr.pixelsLeft -= pixelsAdded;
      if (curr.pixelsLeft === 0) {
        game.options.successSoundEffect.play();
        this.score += SCORE_BONUS_STREET_FINISHED;
      }
    } else if (isCompleteMiss && curr.pixelsLeft > 0) {
      this.score = Math.max(this.score - SCORE_PENALTY_COMPLETE_MISS, 0);
      game.options.missSoundEffect.play();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { game } = this;

    game.canvas.style.cursor = 'none';
    game.options.sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
    game.drawStreetSkeleton(ctx);
    ctx.drawImage(this.streetCanvas, 0, 0);
    this.drawPenCursor(ctx);
    this.drawStatusText(ctx);
    this.drawScore(ctx);
  }

  get paintRadius() {
    return this.game.pen.medium === 'touch' ? PAINT_RADIUS_TOUCH : PAINT_RADIUS_MOUSE;
  }

  drawPenCursor(ctx: CanvasRenderingContext2D) {
    const { pen } = this.game;
    if (!pen.pos) return;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = PAINT_HOVER_STYLE;
    const { paintRadius } = this;
    const size = paintRadius * 2;
    ctx.strokeRect(pen.pos.x - paintRadius + 0.5, pen.pos.y - paintRadius + 0.5, size, size);
    ctx.restore();
  }

  drawStatusText(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.game.canvas;
    const { font: big, tinyFont: small } = this.game.options;
    const curr = this.currentHighlightFrameDetails;

    type Line = {text: string, font: BitmapFont, rightPadding?: number};
    const lines: Line[] = [];

    if (curr) {
      const done = curr.pixelsLeft === 0;
      lines.push({text: done ? 'You painted' : 'Paint', font: small});
      lines.push({text: shortenStreetName(curr.name).toUpperCase(), font: big});
      lines.push({text: '', font: small});
      lines.push({
        text: done ? 'Lift finger to continue' : getPixelsLeftText(curr.pixelsLeft),
        font: small
      });
    } else {
      lines.push({text: 'HOORAY!', font: big, rightPadding: 0});
      lines.push({text: 'You painted Manhattan', font: small});
    }

    let currY = height - 1;

    for (let line of lines.reverse()) {
      const { font, text, rightPadding } = line;
      const x = width - (typeof(rightPadding) === 'number' ? rightPadding : 2);
      font.drawText(ctx, text, x, currY, 'bottom-right');
      currY -= font.options.charHeight;
    }
  }

  private drawScore(ctx: CanvasRenderingContext2D) {
    const { tinyFont } = this.game.options;

    const x = 1;
    const y = this.game.canvas.height - tinyFont.options.charHeight - 1;
    tinyFont.drawText(ctx, `Score: ${this.score}`, x, y);
  }
}
