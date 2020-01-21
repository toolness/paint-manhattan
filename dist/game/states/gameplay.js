import { createCanvas, shuffleArray, moveToStartOfArray, getCanvasCtx2D, iterPixelIndices, isImageEmptyAt, setPixel, uniqueArray } from "../../util.js";
import { STREETS_FRAME, getStreetFrames, TERRAIN_FRAME } from "../sheet-frames.js";
import { ManhattanState } from "../state.js";
import { StreetStoryState } from "./street-story.js";
import { shortenStreetName } from "../street-util.js";
import { getStreetsInNarrativeOrder } from "../street-stories.js";
import { logAmplitudeEvent } from "../../amplitude.js";
const PAINT_RADIUS_MOUSE = 5;
const PAINT_RADIUS_TOUCH = 10;
const PAINT_HOVER_STYLE = 'rgba(255, 255, 255, 1.0)';
const PAINT_INACTIVE_STREET_RGBA = [238, 195, 154, 255];
const PAINT_ACTIVE_STREET_RGBA = [153, 229, 80, 255];
const SCORE_BONUS_STREET_FINISHED = 10;
const SCORE_BONUS_FLAWLESS_STREET_FINISHED = 100;
const STREET_SKELETON_ALPHA = 0.33;
function getPixelsLeftText(pixelsLeft) {
    const pixels = pixelsLeft === 1 ? 'pixel' : 'pixels';
    return `${pixelsLeft} ${pixels} left`;
}
function getFirstStreetWithStory(streets) {
    for (let street of streets) {
        if (StreetStoryState.existsForStreet(street)) {
            return street;
        }
    }
    return null;
}
function moveStoriedStreetToStartOfArray(streets) {
    const streetWithStory = getFirstStreetWithStory(streets);
    if (!streetWithStory)
        return streets;
    return moveToStartOfArray(streets, streetWithStory);
}
export class GameplayState extends ManhattanState {
    constructor(game) {
        super(game);
        this.game = game;
        this.score = 0;
        this.prevCursor = null;
        const streetCanvas = createCanvas(game.canvas.width, game.canvas.height);
        this.streetCanvas = streetCanvas;
        let highlightFrames = shuffleArray(getStreetFrames(game.options.sheet));
        if (game.options.showStreetsInNarrativeOrder) {
            highlightFrames = uniqueArray(getStreetsInNarrativeOrder().concat(highlightFrames));
        }
        if (game.options.startWithStreet) {
            moveToStartOfArray(highlightFrames, game.options.startWithStreet);
        }
        else {
            moveStoriedStreetToStartOfArray(highlightFrames);
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
        this.initialStreetsToPaint = highlightFrames.length;
    }
    drawStreetSkeleton(ctx) {
        if (!this.game.options.showStreetSkeleton)
            return;
        ctx.save();
        ctx.globalAlpha = STREET_SKELETON_ALPHA;
        this.game.options.sheet.drawFrame(ctx, STREETS_FRAME, 0, 0);
        ctx.restore();
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
    getNextHighlightFrame() {
        const name = this.highlightFrames.shift();
        if (!name) {
            logAmplitudeEvent({
                name: 'Game won',
                streetsPainted: this.initialStreetsToPaint,
                finalScore: this.score,
            });
            return null;
        }
        return { name, pixelsLeft: this.countPixelsToBePainted(name), hasMissedOnce: false };
    }
    countPixelsToBePainted(frame) {
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
        game.pen.setCursor('none');
        if (!curr)
            return;
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
        if (!(pen.pos && pen.isDown))
            return;
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
                }
                else {
                    this.score += SCORE_BONUS_FLAWLESS_STREET_FINISHED;
                }
                logAmplitudeEvent({
                    name: "Street painted",
                    streetName: curr.name,
                    missedAtLeastOnce: curr.hasMissedOnce,
                });
            }
        }
        else if (isCompleteMiss && curr.pixelsLeft > 0) {
            curr.hasMissedOnce = true;
            game.options.missSoundEffect.play();
        }
    }
    draw(ctx) {
        this.drawMap(ctx);
        this.drawPenCursor(ctx);
        this.drawStatusText(ctx);
        this.drawScore(ctx);
    }
    drawMap(ctx) {
        this.game.options.sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
        this.drawStreetSkeleton(ctx);
        ctx.drawImage(this.streetCanvas, 0, 0);
    }
    drawDarkenedMap(ctx) {
        const { width, height } = this.game.canvas;
        ctx.save();
        this.drawMap(ctx);
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = 0.75;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
    get paintRadius() {
        return this.game.pen.medium === 'touch' ? PAINT_RADIUS_TOUCH : PAINT_RADIUS_MOUSE;
    }
    drawPenCursor(ctx) {
        const { pen } = this.game;
        if (!pen.pos)
            return;
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = PAINT_HOVER_STYLE;
        const { paintRadius } = this;
        const size = paintRadius * 2;
        ctx.strokeRect(pen.pos.x - paintRadius + 0.5, pen.pos.y - paintRadius + 0.5, size, size);
        ctx.restore();
    }
    drawStatusText(ctx) {
        const { width, height } = this.game.canvas;
        const { font: big, tinyFont: small } = this.game.options;
        const curr = this.currentHighlightFrameDetails;
        const lines = [];
        if (curr) {
            const done = curr.pixelsLeft === 0;
            lines.push({ text: done ? 'You painted' : 'Paint', font: small });
            lines.push({ text: shortenStreetName(curr.name).toUpperCase(), font: big });
            lines.push({ text: '', font: small });
            lines.push({
                text: done ? 'Lift finger to continue' : getPixelsLeftText(curr.pixelsLeft),
                font: small
            });
        }
        else {
            lines.push({ text: 'HOORAY!', font: big, rightPadding: 0 });
            lines.push({ text: 'You painted Manhattan', font: small });
        }
        let currY = height - 1;
        for (let line of lines.reverse()) {
            const { font, text, rightPadding } = line;
            const x = width - (typeof (rightPadding) === 'number' ? rightPadding : 2);
            font.drawText(ctx, text, x, currY, 'bottom-right');
            currY -= font.options.charHeight;
        }
    }
    drawScore(ctx) {
        if (!this.game.options.showScore)
            return;
        const { tinyFont } = this.game.options;
        const x = 1;
        const y = this.game.canvas.height - tinyFont.options.charHeight - 1;
        tinyFont.drawText(ctx, `Score: ${this.score}`, x, y);
    }
    enter() {
        super.enter();
    }
    exit() {
        super.exit();
    }
}
