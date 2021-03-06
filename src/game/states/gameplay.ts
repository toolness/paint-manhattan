import { Manhattan } from "../core.js";
import { createCanvas, getCanvasCtx2D, iterPixelIndices, isImageEmptyAt, setPixel, uniqueArray } from "../../util.js";
import { BitmapFont } from "../../font.js";
import { STREETS_FRAME, TERRAIN_FRAME } from "../sheet-frames.js";
import { ManhattanState } from "../state.js";
import { StreetStoryState } from "./street-story.js";
import { shortenStreetName, countStreetPixelsToBePainted, areStreetNamesValid } from "../street-util.js";
import { logAmplitudeEvent, AmplitudeGameDifficultyInfo } from "../../amplitude.js";

const PAINT_RADIUS_MOUSE = 5;

const PAINT_RADIUS_TOUCH = 10;

const PAINT_HOVER_STYLE = 'rgba(255, 255, 255, 1.0)';

const PAINT_INACTIVE_STREET_RGBA: RGBA = [238, 195, 154, 255];

const PAINT_ACTIVE_STREET_RGBA: RGBA = [153, 229, 80, 255];

const SCORE_BONUS_STREET_FINISHED = 10;

const SCORE_BONUS_FLAWLESS_STREET_FINISHED = 100;

const STREET_SKELETON_ALPHA = 0.33;

type RGBA = [number, number, number, number];

type CurrentStreetDetails = {
  name: string,
  pixelsLeft: number,
  hasMissedOnce: boolean,
};

type GameplayStateOptions = {
  nextStreetIndex: number,
  nextStreetHasMissedOnce?: boolean;
  score: number;
};

export type GameplaySavegame = GameplayStateOptions & {
  streetList: string[],
};

function getPixelsLeftText(pixelsLeft: number): string {
  const pixels = pixelsLeft === 1 ? 'pixel' : 'pixels';
  return `${pixelsLeft} ${pixels} left`;
}

export class GameplayState extends ManhattanState {
  private readonly streetCanvas: HTMLCanvasElement;
  private nextStreetIndex: number;
  private currentStreetDetails: CurrentStreetDetails|null;
  private score: number;
  private nextStreetHasMissedOnce?: boolean;
  private hasEnteredOnce = false;

  constructor(readonly game: Manhattan, readonly streetList: string[], options: Partial<GameplayStateOptions> = {}) {
    super(game);
    const streetCanvas = createCanvas(game.canvas.width, game.canvas.height);
    this.streetCanvas = streetCanvas;
    this.currentStreetDetails = null;
    this.nextStreetIndex = options.nextStreetIndex || 0;
    this.nextStreetHasMissedOnce = options.nextStreetHasMissedOnce;
    this.score = options.score || 0;
    this.autopaintStreets(this.nextStreetIndex);
  }

  private autopaintStreets(upToStreetIndex: number) {
    const sheetCtx = getCanvasCtx2D(this.game.options.sheet.canvas);
    const { width, height } = this.streetCanvas;
    const streetCtx = getCanvasCtx2D(this.streetCanvas);
    const streetData = streetCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < upToStreetIndex; i++) {
      const streetName = this.streetList[i];
      const frameData = this.game.options.sheet.getFrameImageData(sheetCtx, streetName);
      for (let idx of iterPixelIndices(frameData)) {
        const isPartOfStreet = !isImageEmptyAt(frameData, idx);
        if (isPartOfStreet) {
          setPixel(streetData, idx, ...PAINT_INACTIVE_STREET_RGBA);
        }
      }
    }
    streetCtx.putImageData(streetData, 0, 0);
  }

  static fromSavegame(game: Manhattan, savegame: GameplaySavegame): GameplayState|null {
    const { streetList, ...options } = savegame;
    if (!areStreetNamesValid(game.options.sheet, streetList)) {
      // The game has evolved since the saved game was made, and
      // some of the street names are now invalid.
      return null;
    }
    return new GameplayState(game, streetList, options);
  }

  private getBaseSavegame(): GameplaySavegame {
    let { streetList, nextStreetIndex, score } = this;
    return {
      streetList,
      nextStreetIndex,
      score,
      nextStreetHasMissedOnce: false,
    };
  }

  private getSavegameForStreetMiss(): GameplaySavegame {
    const savegame = this.getBaseSavegame();
    savegame.nextStreetIndex--;
    savegame.nextStreetHasMissedOnce = true;
    return savegame;
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

  private shiftToNextStreet(): CurrentStreetDetails|null {
    const name = this.streetList[this.nextStreetIndex];
    if (!name) {
      return null;
    }
    this.nextStreetIndex++;
    let hasMissedOnce = false;
    if (typeof(this.nextStreetHasMissedOnce) === 'boolean') {
      hasMissedOnce = this.nextStreetHasMissedOnce;
      this.nextStreetHasMissedOnce = undefined;
    }
    return {name, pixelsLeft: this.countPixelsToBePainted(name), hasMissedOnce};
  }

  private hasStreetsLeft(): boolean {
    return this.nextStreetIndex < this.streetList.length;
  }

  private countPixelsToBePainted(frame: string) {
    return countStreetPixelsToBePainted(this.game.options.sheet, frame, this.streetCanvas);
  }

  update() {
    let maybeShowStreetStory = false;

    if (!this.currentStreetDetails) {
      this.currentStreetDetails = this.shiftToNextStreet();
      maybeShowStreetStory = true;
    }

    const { game } = this;
    const curr = this.currentStreetDetails;

    game.pen.setCursor('none');

    if (!curr) return;

    const { pen } = game;

    if (!pen.isDown && curr.pixelsLeft === 0) {
      this.unhighlightActiveStreet();
      this.currentStreetDetails = this.shiftToNextStreet();
      maybeShowStreetStory = true;
    }

    if (maybeShowStreetStory && this.currentStreetDetails && game.options.showStreetStories) {
      const storyState = StreetStoryState.forStreet(game, this, this.currentStreetDetails.name);
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
        if (curr.hasMissedOnce) {
          this.score += SCORE_BONUS_STREET_FINISHED;
        } else {
          this.score += SCORE_BONUS_FLAWLESS_STREET_FINISHED;
        }
        logAmplitudeEvent({
          name: "Street painted",
          streetName: curr.name,
          missedAtLeastOnce: curr.hasMissedOnce,
        });
        if (!this.hasStreetsLeft()) {
          this.game.autosave(null);
          logAmplitudeEvent({
            name: 'Game won',
            streetsPainted: this.streetList.length,
            finalScore: this.score,
          });
        } else {
          this.game.autosave(this.getBaseSavegame());
        }
      }
    } else if (isCompleteMiss && curr.pixelsLeft > 0) {
      if (!curr.hasMissedOnce) {
        curr.hasMissedOnce = true;
        this.game.autosave(this.getSavegameForStreetMiss());
      }
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
    const curr = this.currentStreetDetails;

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
    if (!this.game.options.showScore) return;

    const { tinyFont } = this.game.options;

    const x = 1;
    const y = this.game.canvas.height - tinyFont.options.charHeight - 1;
    tinyFont.drawText(ctx, `Score: ${this.score}`, x, y);
  }

  enter() {
    super.enter();
    if (!this.hasEnteredOnce) {
      this.hasEnteredOnce = true;
      const { showStreetSkeleton, showStreetsInNarrativeOrder } = this.game.options;
      const { nextStreetIndex } = this;
      const difficultyInfo: AmplitudeGameDifficultyInfo = {
        showStreetSkeleton,
        showStreetsInNarrativeOrder
      };
      if (nextStreetIndex === 0) {
        logAmplitudeEvent({name: 'Game started', ...difficultyInfo});
      } else {
        logAmplitudeEvent({name: 'Game continued', nextStreetIndex, ...difficultyInfo});
      }
    }
  }
}
