import { AsepriteSheet } from './aseprite-sheet.js';
import { BitmapFont } from './font.js';
import { getCanvasCtx2D, createCanvas, shuffleArray } from './util.js';
import { CanvasResizer } from './canvas-resizer.js';
import { Pen } from './pen.js';

type RGBA = [number, number, number, number];

const PAINT_RADIUS = 5;

const PAINT_HOVER_STYLE = 'rgba(255, 255, 255, 1.0)';

const PAINT_STREET_RGBA: RGBA = [238, 195, 154, 255];

const BYTES_PER_PIXEL = 4;

const RED_OFFSET = 0;
const GREEN_OFFSET = 1;
const BLUE_OFFSET = 2;
const ALPHA_OFFSET = 3;

const TERRAIN_FRAME = "Land and water";

const IGNORE_FRAMES = [
  "Reference image",
  "Streets",
];

type ManhattanOptions = {
  sheet: AsepriteSheet,
  font: BitmapFont,
  root: HTMLElement,
};

function getHighlightFrames(sheet: AsepriteSheet): string[] {
  const ignoreFrames = new Set([TERRAIN_FRAME, ...IGNORE_FRAMES]);
  return Object.keys(sheet.metadata.frames).filter(name => !ignoreFrames.has(name));
}

function shortenStreetName(name: string): string {
  return name.replace('Street', 'St');
}

function isImageEmptyAt(im: ImageData, idx: number): boolean {
  return im.data[idx + RED_OFFSET] === 0 &&
    im.data[idx + GREEN_OFFSET] === 0 &&
    im.data[idx + BLUE_OFFSET] === 0 &&
    im.data[idx + ALPHA_OFFSET] === 0;
}

function *iterPixelIndices(im: ImageData|number) {
  const totalPixels = typeof(im) === 'number' ? im : im.height * im.width;
  let idx = 0;
  for (let i = 0; i < totalPixels; i++) {
    yield idx;
    idx += BYTES_PER_PIXEL;
  }
}

function setPixel(im: ImageData, idx: number, r: number, g: number, b: number, a: number) {
  im.data[idx + RED_OFFSET] = r;
  im.data[idx + GREEN_OFFSET] = g;
  im.data[idx + BLUE_OFFSET] = b;
  im.data[idx + ALPHA_OFFSET] = a;
}

type CurrentHighlightFrameDetails = {
  name: string,
  pixelsLeft: number,
};

export class Manhattan {
  readonly resizer: CanvasResizer;
  readonly streetCanvas: HTMLCanvasElement;
  readonly canvas: HTMLCanvasElement;
  readonly highlightFrames: string[];
  readonly pen: Pen;
  private currentHighlightFrameDetails: CurrentHighlightFrameDetails|null;

  constructor(readonly options: ManhattanOptions) {
    const {w, h} = options.sheet.getFrameMetadata(TERRAIN_FRAME).frame;
    const streetCanvas = createCanvas(w, h);
    this.streetCanvas = streetCanvas;
    const canvas = createCanvas(w, h);
    canvas.style.cursor = 'none';
    options.root.appendChild(canvas);
    this.pen = new Pen(canvas, this.updateAndDraw.bind(this));
    this.resizer = new CanvasResizer(canvas);
    this.canvas = canvas;
    this.highlightFrames = shuffleArray(getHighlightFrames(options.sheet));
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
    const x2 = Math.min(pen.pos.x + PAINT_RADIUS, this.canvas.width - 1);
    const y2 = Math.min(pen.pos.y + PAINT_RADIUS, this.canvas.height - 1);
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
    }
  }

  private drawText(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.canvas;
    const { font } = this.options;
    const curr = this.currentHighlightFrameDetails;
    let msg1 = "Hooray!"
    let msg2 = "You painted Manhattan.";
    if (curr) {
      msg1 = `Paint ${shortenStreetName(curr.name)}.`;
      const pixels = curr.pixelsLeft === 1 ? 'pixel' : 'pixels';
      msg2 = `${curr.pixelsLeft} ${pixels} left.`;
    }
    font.drawText(ctx, msg1, width, height - font.options.charHeight, 'bottom-right');
    font.drawText(ctx, msg2, width, height, 'bottom-right');
  }

  private updateAndDraw() {
    this.updateStreets();

    const ctx = getCanvasCtx2D(this.canvas);
    this.options.sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
    ctx.drawImage(this.streetCanvas, 0, 0);
    this.drawPenCursor(ctx);
    this.drawText(ctx);
  }

  start() {
    this.resizer.start();
    this.pen.start();
    this.updateAndDraw();
  }

  stop() {
    this.resizer.stop();
    this.pen.stop();
  }
}
