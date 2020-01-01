import { ManhattanState } from "./state.js";
import { Manhattan } from "./core.js";
import { GameplayState } from "./gameplay.js";
import { shortenStreetName } from "./streets.js";
import { paragraphsToWordWrappedLines } from "../util.js";

export type StreetStory = {
  name: string,
  content: string|string[],
  sourceURL?: string,
};

const STORIES: StreetStory[] = [
  {
    name: "George/Spruce Street",
    content: [
      "Built around 1725, this street was once named in honor of King George III, but eventually changed after the Revolution.",
      "Today it's home to a Deconstructivist skyscraper by Frank Gehry, located between William and Nassau.",
    ],
    sourceURL: "https://en.wikipedia.org/wiki/Spruce_Street_(Manhattan)",
  },
  {
    name: "Bridge Street",
    content: "This street was given its name because it was one of three bridges that crossed a canal located at present-day Broad Street.",
    sourceURL: "https://en.wikipedia.org/wiki/Bridge_Street_(Manhattan)",
  },
];

const STORY_CHARS_PER_LINE = 40;
const STREET_NAME_Y = 15;
const STREET_STORY_Y = 30;

export class StreetStoryState extends ManhattanState {
  private storyLines: string[];

  constructor(readonly game: Manhattan, readonly gameplayState: GameplayState, readonly story: StreetStory) {
    super(game);
    this.storyLines = paragraphsToWordWrappedLines(story.content, STORY_CHARS_PER_LINE);
  }

  update() {
    if (this.game.pen.justWentUp) {
      this.game.changeState(this.gameplayState);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { game } = this;
    const { font: big, tinyFont: small } = game.options;
    const { width, height } = this.game.canvas;
    const centerX = width / 2;

    ctx.fillRect(0, 0, width, height);

    const streetName = shortenStreetName(this.story.name).toUpperCase();
    big.drawText(ctx, streetName, centerX, STREET_NAME_Y, 'center');

    let currY = STREET_STORY_Y;
    for (let line of this.storyLines) {
      small.drawText(ctx, line, centerX, currY, 'center');
      currY += small.options.charHeight;
    }
  }

  static forStreet(game: Manhattan, gameplayState: GameplayState, streetName: string): StreetStoryState|null {
    const story = getStreetStory(streetName);
    if (!story) return null;
    return new StreetStoryState(game, gameplayState, story);
  }
}

function getStreetStory(streetName: string): StreetStory|null {
  for (let story of STORIES) {
    if (story.name === streetName) {
      return story;
    }
  }
  return null;
}

export function validateStreetStories(allStreetNames: string[]) {
  const allStreetSet = new Set(allStreetNames);
  for (let story of STORIES) {
    if (!allStreetSet.has(story.name)) {
      console.warn(`Story has invalid street name "${story.name}". It will never be shown.`);
    }
  }
}
