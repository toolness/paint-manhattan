import { ManhattanState } from "./state.js";
import { shortenStreetName } from "./streets.js";
import { paragraphsToWordWrappedLines } from "../util.js";
import { ActionPrompt } from "./action-prompt.js";
import { Timer } from "../timer.js";
const STORIES = [
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
    {
        name: "Front Street",
        content: "This street was originally built on landfill in the latter half of the 18th century, and ran along the waterfront until the turn of the next century, when South street was built on more landfill.",
        // Weirdly, the Wikipedia entry for "Front Street (Manhattan)" actually redirects to Lower Manhattan and includes no information about Front street.
        sourceURL: "https://en.wikipedia.org/wiki/South_Street_(Manhattan)",
    },
    {
        name: "Pearl Street",
        content: [
            "This street dates back to the early 1600s and was named for the many oysters found in the river. During British rule, it was called Great Queen Street.",
            "It ran along the waterfront until the latter half of the 18th century, when Water and Front streets were built from landfill.",
        ],
        sourceURL: "https://en.wikipedia.org/wiki/Pearl_Street_(Manhattan)",
    },
    {
        name: "Wall Street",
        content: [
            "From 1711 to 1762, at the corner of Wall and Pearl, the city operated its first official slave market for the sale and rental of enslaved Africans and Indians.",
            "The city directly benefited from the sale of slaves by implementing taxes on every person who was bought and sold there.",
        ],
        sourceURL: "https://en.wikipedia.org/wiki/Wall_Street",
    },
    {
        name: "Fair/Fulton Street",
        content: [
            "This street, along with Partition Street west of Broadway, was renamed to Fulton Street in 1816, in honor of Robert Fulton, the inventor of the steamship.",
            "From 1882-1890, just south of Fulton and Pearl stood Pearl Street Station, the first commercial central power plant in the United States."
        ],
        sourceURL: "https://en.wikipedia.org/wiki/Fulton_Street_(Manhattan)",
    }
];
const STORY_CHARS_PER_LINE = 35;
const STREET_NAME_Y = 15;
const STREET_STORY_Y = 30;
const MS_PER_CHAR = 40;
export class StreetStoryState extends ManhattanState {
    constructor(game, gameplayState, story) {
        super(game);
        this.game = game;
        this.gameplayState = gameplayState;
        this.story = story;
        this.storyLines = paragraphsToWordWrappedLines(story.content, STORY_CHARS_PER_LINE);
        this.charsToAnimate = this.storyLines.reduce((total, line) => total + line.length, 0);
        const timer = new Timer(MS_PER_CHAR, game.updateAndDraw);
        this.subState = { type: 'animating', timer };
        timer.start();
    }
    update() {
        const { game, subState } = this;
        if (subState.type === 'waiting_for_user') {
            if (game.pen.justWentUp) {
                game.changeState(this.gameplayState);
            }
        }
        else if (subState.type === 'animating') {
            if (subState.timer.tick >= this.charsToAnimate || game.pen.justWentUp) {
                subState.timer.stop();
                const prompt = new ActionPrompt(game, 'to continue');
                this.subState = { type: 'waiting_for_user', prompt };
                prompt.start();
            }
        }
    }
    draw(ctx) {
        const { game } = this;
        const { font: big, tinyFont: small } = game.options;
        const { width } = this.game.canvas;
        const centerX = width / 2;
        this.gameplayState.drawDarkenedMap(ctx);
        const streetName = shortenStreetName(this.story.name).toUpperCase();
        big.drawText(ctx, streetName, centerX, STREET_NAME_Y, 'center');
        let currY = STREET_STORY_Y;
        for (let line of this.getAnimatingStoryLines()) {
            small.drawText(ctx, line, centerX, currY, 'center');
            currY += small.options.charHeight;
        }
        if (this.subState.type === 'waiting_for_user') {
            this.subState.prompt.draw(ctx);
        }
    }
    getAnimatingStoryLines() {
        if (this.subState.type === 'waiting_for_user') {
            return this.storyLines;
        }
        const maxChars = this.subState.timer.tick;
        const lines = [];
        let chars = 0;
        for (let line of this.storyLines) {
            if (chars + line.length < maxChars) {
                chars += line.length;
                lines.push(line);
            }
            else {
                const charsOfLine = maxChars - chars;
                const truncatedLine = line.slice(0, charsOfLine) + spaces(line.length - charsOfLine);
                lines.push(truncatedLine);
                break;
            }
        }
        return lines;
    }
    exit() {
        if (this.subState.type !== 'waiting_for_user') {
            throw new Error('Assertion failure, we should only exit the state when waiting for user!');
        }
        this.subState.prompt.stop();
    }
    static forStreet(game, gameplayState, streetName) {
        const story = getStreetStory(streetName);
        if (!story)
            return null;
        return new StreetStoryState(game, gameplayState, story);
    }
    static existsForStreet(streetName) {
        return getStreetStory(streetName) !== null;
    }
}
function getStreetStory(streetName) {
    for (let story of STORIES) {
        if (story.name === streetName) {
            return story;
        }
    }
    return null;
}
export function validateStreetStories(allStreetNames) {
    const allStreetSet = new Set(allStreetNames);
    for (let story of STORIES) {
        if (!allStreetSet.has(story.name)) {
            console.warn(`Story has invalid street name "${story.name}". It will never be shown.`);
        }
    }
}
function spaces(count) {
    let s = [];
    if (count > 0) {
        for (let i = 0; i < count; i++) {
            s.push(' ');
        }
    }
    return s.join('');
}
