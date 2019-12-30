import { AsepriteSheet } from './aseprite-sheet.js';
import { BitmapFont } from './font.js';
import { getCanvasCtx2D, createCanvas, shuffleArray, iterPixelIndices, isImageEmptyAt, setPixel, moveToTopOfArray, reverseWordWrap } from './util.js';
import { CanvasResizer } from './canvas-resizer.js';
import { Pen } from './pen.js';
import { SoundEffect, initializeAudio } from './audio.js';
import { Timer } from './timer.js';

type RGBA = [number, number, number, number];

const STREET_SKELETON_ALPHA = 0.33;

const TIMER_INTERVAL_MS = 1500;

const PAINT_RADIUS = 5;

const PAINT_HOVER_STYLE = 'rgba(255, 255, 255, 1.0)';

const PAINT_STREET_RGBA: RGBA = [238, 195, 154, 255];

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

export type ManhattanOptions = {
  sheet: AsepriteSheet,
  font: BitmapFont,
  tinyFont: BitmapFont,
  root: HTMLElement,
  splashImage: HTMLImageElement,
  skipSplashScreen: boolean,
  showStreetSkeleton: boolean,
  startWithStreet?: string,
  successSoundEffect: SoundEffect,
};

function getHighlightFrames(sheet: AsepriteSheet): string[] {
  const ignoreFrames = new Set(NON_HIGHLIGHT_FRAMES);
  return Object.keys(sheet.metadata.frames).filter(name => !ignoreFrames.has(name));
}

function shortenStreetName(name: string): string {
  return name
    .replace('Street', 'St')
    .replace('Place', 'Pl');
}

type CurrentHighlightFrameDetails = {
  name: string,
  pixelsLeft: number,
};

type ManhattanState = 'splash'|'playing';

export class Manhattan {
  readonly resizer: CanvasResizer;
  readonly streetCanvas: HTMLCanvasElement;
  readonly canvas: HTMLCanvasElement;
  readonly highlightFrames: string[];
  readonly pen: Pen;
  readonly splashTimer: Timer;
  private currentHighlightFrameDetails: CurrentHighlightFrameDetails|null;
  private state: ManhattanState;

  constructor(readonly options: ManhattanOptions) {
    const {w, h} = options.sheet.getFrameMetadata(TERRAIN_FRAME).frame;
    const streetCanvas = createCanvas(w, h);
    this.streetCanvas = streetCanvas;
    const canvas = createCanvas(w, h);
    options.root.appendChild(canvas);
    this.updateAndDraw = this.updateAndDraw.bind(this);
    this.pen = new Pen(canvas, this.updateAndDraw);
    this.resizer = new CanvasResizer(canvas);
    this.canvas = canvas;
    this.splashTimer = new Timer(TIMER_INTERVAL_MS, this.updateAndDraw);
    this.state = options.skipSplashScreen ? 'playing' : 'splash';

    this.highlightFrames = shuffleArray(getHighlightFrames(options.sheet));
    if (options.startWithStreet) {
      moveToTopOfArray(this.highlightFrames, options.startWithStreet);
    }

    this.currentHighlightFrameDetails = this.getNextHighlightFrame();
  }

  private getNextHighlightFrame(): CurrentHighlightFrameDetails|null {
    const name = this.highlightFrames.pop();
    if (!name) {
      return null;
    }
    return {name, pixelsLeft: this.countPixelsToBePainted(name)};
  }

  private countPixelsToBePainted(frame: string) {
    const { sheet } = this.options;
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

  private drawStreetSkeleton(ctx: CanvasRenderingContext2D) {
    if (!this.options.showStreetSkeleton) return;
    ctx.save();
    ctx.globalAlpha = STREET_SKELETON_ALPHA;
    this.options.sheet.drawFrame(ctx, STREETS_FRAME, 0, 0);
    ctx.restore();
  }

  private drawPenCursor(ctx: CanvasRenderingContext2D) {
    const { pen } = this;
    if (!pen.pos) return;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = PAINT_HOVER_STYLE;
    const size = PAINT_RADIUS * 2;
    ctx.strokeRect(pen.pos.x - PAINT_RADIUS + 0.5, pen.pos.y - PAINT_RADIUS + 0.5, size, size);
    ctx.restore();
  }

  private updateStreets() {
    const curr = this.currentHighlightFrameDetails;
  
    if (!curr) return;

    const { pen } = this;

    if (!pen.isDown && curr.pixelsLeft === 0) {
      this.currentHighlightFrameDetails = this.getNextHighlightFrame();
    }

    if (!(pen.pos && pen.isDown)) return;

    const x1 = Math.max(pen.pos.x - PAINT_RADIUS, 0);
    const y1 = Math.max(pen.pos.y - PAINT_RADIUS, 0);
    const x2 = Math.min(pen.pos.x + PAINT_RADIUS + 1, this.canvas.width);
    const y2 = Math.min(pen.pos.y + PAINT_RADIUS + 1, this.canvas.height);
    const w = x2 - x1;
    const h = y2 - y1;

    const sheetCtx = getCanvasCtx2D(this.options.sheet.canvas);
    const frameData = this.options.sheet.getFrameImageData(sheetCtx, curr.name, x1, y1, w, h);
    const streetCtx = getCanvasCtx2D(this.streetCanvas);
    const streetData = streetCtx.getImageData(x1, y1, w, h);
    let pixelsAdded = 0;
    for (let idx of iterPixelIndices(frameData)) {
      const shouldBeHighlighted = !isImageEmptyAt(frameData, idx);
      if (shouldBeHighlighted) {
        const isHighlighted = !isImageEmptyAt(streetData, idx);
        if (!isHighlighted) {
          setPixel(streetData, idx, ...PAINT_STREET_RGBA);
          pixelsAdded += 1;
        }
      }
    }

    if (pixelsAdded) {
      streetCtx.putImageData(streetData, x1, y1);
      curr.pixelsLeft -= pixelsAdded;
      if (curr.pixelsLeft === 0) {
        this.options.successSoundEffect.play();
      }
    }
  }

  private drawStatusText(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.canvas;
    const { font: big, tinyFont: small } = this.options;
    const curr = this.currentHighlightFrameDetails;

    type Line = {text: string, font: BitmapFont, rightPadding?: number};
    const lines: Line[] = [];

    if (curr) {
      lines.push({text: 'Paint', font: small});
      lines.push({text: shortenStreetName(curr.name).toUpperCase(), font: big});
      lines.push({text: '', font: small});
      const pixels = curr.pixelsLeft === 1 ? 'pixel' : 'pixels';
      lines.push({text: `${curr.pixelsLeft} ${pixels} left`, font: small});
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

  private handleEnterState() {
    if (this.state === 'splash') {
      this.splashTimer.start();
    }
  }

  private handleExitState() {
    if (this.state === 'splash') {
      this.splashTimer.stop();
    }
  }

  private changeState(newState: ManhattanState) {
    this.handleExitState();
    this.state = newState;
    this.handleEnterState();
    this.updateAndDraw();
  }

  private updateAndDrawSplashScreen(ctx: CanvasRenderingContext2D) {
    if (this.pen.wasDown && !this.pen.isDown) {
      initializeAudio();
      this.changeState('playing');
      return;
    }
    this.canvas.style.cursor = 'default';
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalAlpha = 0.33;
    this.options.sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
    ctx.globalAlpha = 0.04;
    this.options.sheet.drawFrame(ctx, STREETS_FRAME, 0, 0);
    ctx.globalAlpha = 1.0;
    ctx.drawImage(this.options.splashImage, 0, 40);

    if (this.splashTimer.tick % 2 === 0) {
      ctx.globalAlpha = 0.75;
      const { tinyFont } = this.options;
      tinyFont.drawText(ctx, 'Click or tap to start.', this.canvas.width / 2, this.canvas.height - tinyFont.options.charHeight, 'center');
    }
    ctx.restore();
  }

  private updateAndDraw() {
    const ctx = getCanvasCtx2D(this.canvas);

    if (this.state === 'splash') {
      this.updateAndDrawSplashScreen(ctx);
    } else if (this.state === 'playing') {
      this.canvas.style.cursor = 'none';
      this.updateStreets();

      this.options.sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
      this.drawStreetSkeleton(ctx);
      ctx.drawImage(this.streetCanvas, 0, 0);
      this.drawPenCursor(ctx);
      this.drawStatusText(ctx);
    }
  }

  start() {
    this.resizer.start();
    this.pen.start();
    this.handleEnterState();
    this.updateAndDraw();
  }

  stop() {
    this.handleExitState();
    this.resizer.stop();
    this.pen.stop();
  }
}
