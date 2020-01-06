import { ManhattanState } from "../state.js";
import { Manhattan } from "../core.js";
import { GameplayState } from "./gameplay.js";
import { shortenStreetName } from "../street-util.js";
import { paragraphsToWordWrappedLines, spaces } from "../../util.js";
import { ActionPrompt } from "../action-prompt.js";
import { Timer } from "../../timer.js";
import { StreetStory, getStreetStory } from "../street-stories.js";

const STORY_CHARS_PER_LINE = 35;
const STREET_NAME_Y = 15;
const STREET_STORY_Y = 30;
const MS_PER_CHAR = 40;

export abstract class StreetStoryState extends ManhattanState {
  protected storyLines: string[];

  constructor(game: Manhattan, protected readonly gameplayState: GameplayState, protected readonly story: StreetStory) {
    super(game);
    this.storyLines = paragraphsToWordWrappedLines(story.content, STORY_CHARS_PER_LINE);
  }

  protected drawStory(ctx: CanvasRenderingContext2D, storyLines: string[]) {
    const { game } = this;
    const { font: big, tinyFont: small } = game.options;
    const { width } = this.game.canvas;
    const centerX = width / 2;

    this.gameplayState.drawDarkenedMap(ctx);

    const streetName = shortenStreetName(this.story.name).toUpperCase();
    big.drawText(ctx, streetName, centerX, STREET_NAME_Y, 'center');

    let currY = STREET_STORY_Y;
    for (let line of storyLines) {
      small.drawText(ctx, line, centerX, currY, 'center');
      currY += small.options.charHeight;
    }
  }

  static forStreet(game: Manhattan, gameplayState: GameplayState, streetName: string): StreetStoryState|null {
    const story = getStreetStory(streetName);
    if (!story) return null;
    return new AnimatingSubState(game, gameplayState, story);
  }

  static existsForStreet(streetName: string): boolean {
    return getStreetStory(streetName) !== null;
  }
}

class AnimatingSubState extends StreetStoryState {
  private charsToAnimate: number;
  private timer: Timer;

  constructor(game: Manhattan, gameplayState: GameplayState, story: StreetStory) {
    super(game, gameplayState, story);
    this.charsToAnimate = this.storyLines.reduce((total, line) => total + line.length, 0);
    this.timer = new Timer(MS_PER_CHAR, game.updateAndDraw);
    this.bindToLifetime(this.timer);
  }

  private getAnimatingStoryLines() {
    const maxChars = this.timer.tick;
    const lines: string[] = [];
    let chars = 0;
    for (let line of this.storyLines) {
      if (chars + line.length < maxChars) {
        chars += line.length;
        lines.push(line);
      } else {
        const charsOfLine = maxChars - chars;
        const truncatedLine = line.slice(0, charsOfLine) + spaces(line.length - charsOfLine);
        lines.push(truncatedLine);
        break;
      }
    }
    return lines;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawStory(ctx, this.getAnimatingStoryLines());
  }

  update() {
    if (this.timer.tick >= this.charsToAnimate || this.game.pen.justWentUp) {
      this.game.changeState(new WaitingForUserSubState(this.game, this.gameplayState, this.story));
    }
  }
}

class WaitingForUserSubState extends StreetStoryState {
  private prompt: ActionPrompt;

  constructor(game: Manhattan, gameplayState: GameplayState, story: StreetStory) {
    super(game, gameplayState, story);    
    this.prompt = new ActionPrompt(game, 'to continue');
    this.bindToLifetime(this.prompt);
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.drawStory(ctx, this.storyLines);
    this.prompt.draw(ctx);
  }

  update() {
    if (this.game.pen.justWentUp) {
      this.game.changeState(this.gameplayState);
    }
  }
}
