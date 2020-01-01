import { Manhattan } from "./core.js";
import { createCanvas, shuffleArray, moveToTopOfArray, getCanvasCtx2D, iterPixelIndices, isImageEmptyAt, setPixel } from "../util.js";
import { BitmapFont } from "../font.js";
import { STREETS_FRAME, getStreetFrames, TERRAIN_FRAME } from "./sheet-frames.js";
import { ManhattanState } from "./state.js";
import { StreetStoryState } from "./street-story.js";
import { shortenStreetName } from "./streets.js";

const PAINT_RADIUS_MOUSE = 5;

const PAINT_RADIUS_TOUCH = 10;

const PAINT_HOVER_STYLE = 'rgba(255, 255, 255, 1.0)';

const PAINT_INACTIVE_STREET_RGBA: RGBA = [238, 195, 154, 255];

const PAINT_ACTIVE_STREET_RGBA: RGBA = [153, 229, 80, 255];

const SCORE_BONUS_STREET_FINISHED = 10;

const SCORE_PENALTY_COMPLETE_MISS = 2;

const STREET_SKELETON_ALPHA = 0.33;

type RGBA = [number, number, number, number];

type CurrentHighlightFrameDetails = {
  name: string,
  pixelsLeft: number,
};

function getPixelsLeftText(pixelsLeft: number): string {
  const pixels = pixelsLeft === 1 ? 'pixel' : 'pixels';
  return `${pixelsLeft} ${pixels} left`;
}

export class GameplayState extends ManhattanState {
  private readonly streetCanvas: HTMLCanvasElement;
  private readonly highlightFrames: string[];
  private currentHighlightFrameDetails: CurrentHighlightFrameDetails|null;
  private score: number = 0;
  private prevCursor: string|null = null;

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
    if (game.options.onlyShowStreetsWithStories) {
      highlightFrames = highlightFrames.filter(frame => StreetStoryState.existsForStreet(frame));
    }
    this.highlightFrames = highlightFrames;
    this.currentHighlightFrameDetails = null;
  }

  drawStreetSkeleton(ctx: CanvasRenderingContext2D) {
    if (!this.game.options.showStreetSkeleton) return;
    ctx.save();
    ctx.globalAlpha = STREET_SKELETON_ALPHA;
    this.game.options.sheet.drawFrame(ctx, STREETS_FRAME, 0, 0);
    ctx.restore();
  }

  private unhighlightActiveStreet() {
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

  private getNextHighlightFrame(): CurrentHighlightFrameDetails|null {
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
    let maybeShowStreetStory = false;

    if (!this.currentHighlightFrameDetails) {
      this.currentHighlightFrameDetails = this.getNextHighlightFrame();
      maybeShowStreetStory = true;
    }

    const { game } = this;
    const curr = this.currentHighlightFrameDetails;
  
    if (!curr) return;

    const { pen } = game;

    if (!pen.isDown && curr.pixelsLeft === 0) {
      this.unhighlightActiveStreet();
      this.currentHighlightFrameDetails = this.getNextHighlightFrame();
      maybeShowStreetStory = true;
    }

    if (maybeShowStreetStory && this.currentHighlightFrameDetails && game.options.showStreetStories) {
      const storyState = StreetStoryState.forStreet(game, this, this.currentHighlightFrameDetails.name);
      if (storyState) {
        game.changeState(storyState);
        return;
      }
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
    this.drawMap(ctx);
    this.drawPenCursor(ctx);
    this.drawStatusText(ctx);
    this.drawScore(ctx);
  }

  private drawMap(ctx: CanvasRenderingContext2D) {
    this.game.options.sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
    this.drawStreetSkeleton(ctx);
    ctx.drawImage(this.streetCanvas, 0, 0);
  }

  drawDarkenedMap(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.game.canvas;
    ctx.save();
    this.drawMap(ctx);
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private get paintRadius() {
    return this.game.pen.medium === 'touch' ? PAINT_RADIUS_TOUCH : PAINT_RADIUS_MOUSE;
  }

  private drawPenCursor(ctx: CanvasRenderingContext2D) {
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

  private drawStatusText(ctx: CanvasRenderingContext2D) {
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

  enter() {
    this.prevCursor = this.game.canvas.style.cursor;
    this.game.canvas.style.cursor = 'none';
  }

  exit() {
    if (typeof(this.prevCursor) === 'string') {
      this.game.canvas.style.cursor = this.prevCursor;
    }
  }
}
