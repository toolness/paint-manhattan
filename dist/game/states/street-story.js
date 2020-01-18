import { ManhattanState } from "../state.js";
import { shortenStreetName } from "../street-util.js";
import { paragraphsToWordWrappedLines, spaces } from "../../util.js";
import { ActionPrompt } from "../action-prompt.js";
import { Timer } from "../../timer.js";
import { getStreetStory } from "../street-stories.js";
const STORY_CHARS_PER_LINE = 35;
const STREET_NAME_Y = 15;
const STREET_STORY_Y = 30;
const MS_PER_CHAR = 40;
export class StreetStoryState extends ManhattanState {
    constructor(game, gameplayState, story) {
        super(game);
        this.gameplayState = gameplayState;
        this.story = story;
        this.storyLines = paragraphsToWordWrappedLines(this.story.content, STORY_CHARS_PER_LINE);
    }
    drawStory(ctx, storyLines) {
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
    static forStreet(game, gameplayState, streetName) {
        const story = getStreetStory(streetName);
        if (!story)
            return null;
        return new AnimatingSubState(game, gameplayState, story);
    }
    static existsForStreet(streetName) {
        return getStreetStory(streetName) !== null;
    }
}
class AnimatingSubState extends StreetStoryState {
    constructor(game, gameplayState, story) {
        super(game, gameplayState, story);
        this.charsToAnimate = this.storyLines.reduce((total, line) => total + line.length, 0);
        this.timer = new Timer(MS_PER_CHAR, this.game.updateAndDraw);
        this.bindToLifetime(this.timer);
    }
    getAnimatingStoryLines() {
        const maxChars = this.timer.tick;
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
    draw(ctx) {
        this.drawStory(ctx, this.getAnimatingStoryLines());
    }
    update() {
        if (this.timer.tick >= this.charsToAnimate || this.game.pen.justWentUp) {
            this.game.changeState(new WaitingForUserSubState(this.game, this.gameplayState, this.story));
        }
    }
}
class WaitingForUserSubState extends StreetStoryState {
    constructor(game, gameplayState, story) {
        super(game, gameplayState, story);
        this.prompt = new ActionPrompt(this.game, 'to continue');
        this.bindToLifetime(this.prompt);
    }
    draw(ctx) {
        this.drawStory(ctx, this.storyLines);
        this.prompt.draw(ctx);
    }
    update() {
        if (this.game.pen.justWentUp) {
            this.game.changeState(this.gameplayState);
        }
    }
}
