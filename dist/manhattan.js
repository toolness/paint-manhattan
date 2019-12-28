import { getCanvasCtx2D, createCanvas, shuffleArray } from './util.js';
const PAINT_RADIUS = 5;
const PAINT_HOVER_STYLE = 'rgba(255, 255, 255, 1.0)';
const PAINT_STREET_RGBA = [238, 195, 154, 255];
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
const MOUSE_EVENTS = [
    'mouseleave',
    'mousemove',
    'mouseup',
    'mousedown',
];
const TOUCH_EVENTS = [
    'touchstart',
    'touchend',
    'touchmove',
    'touchcancel',
];
function getHighlightFrames(sheet) {
    const ignoreFrames = new Set([TERRAIN_FRAME, ...IGNORE_FRAMES]);
    return Object.keys(sheet.metadata.frames).filter(name => !ignoreFrames.has(name));
}
function shortenStreetName(name) {
    return name.replace('Street', 'St');
}
function isImageEmptyAt(im, idx) {
    return im.data[idx + RED_OFFSET] === 0 &&
        im.data[idx + GREEN_OFFSET] === 0 &&
        im.data[idx + BLUE_OFFSET] === 0 &&
        im.data[idx + ALPHA_OFFSET] === 0;
}
function* iterPixelIndices(im) {
    const totalPixels = typeof (im) === 'number' ? im : im.height * im.width;
    let idx = 0;
    for (let i = 0; i < totalPixels; i++) {
        yield idx;
        idx += BYTES_PER_PIXEL;
    }
}
function setPixel(im, idx, r, g, b, a) {
    im.data[idx + RED_OFFSET] = r;
    im.data[idx + GREEN_OFFSET] = g;
    im.data[idx + BLUE_OFFSET] = b;
    im.data[idx + ALPHA_OFFSET] = a;
}
export class Manhattan {
    constructor(options) {
        this.options = options;
        this.isPenDown = false;
        this.penPos = null;
        const { w, h } = options.sheet.getFrameMetadata(TERRAIN_FRAME).frame;
        const streetCanvas = createCanvas(w, h);
        this.streetCanvas = streetCanvas;
        const canvas = createCanvas(w, h);
        canvas.style.cursor = 'none';
        options.root.appendChild(canvas);
        this.canvas = canvas;
        this.handleResize = this.handleResize.bind(this);
        this.handleMouseEvent = this.handleMouseEvent.bind(this);
        this.handleTouchEvent = this.handleTouchEvent.bind(this);
        this.highlightFrames = shuffleArray(getHighlightFrames(options.sheet));
        this.currentHighlightFrameDetails = this.getNextHighlightFrame();
    }
    getNextHighlightFrame() {
        const name = this.highlightFrames.pop();
        if (!name) {
            return null;
        }
        return { name, pixelsLeft: this.countPixelsToBePainted(name) };
    }
    countPixelsToBePainted(frame) {
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
    drawPenCursor(ctx) {
        if (!this.penPos)
            return;
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = PAINT_HOVER_STYLE;
        const size = PAINT_RADIUS * 2;
        ctx.strokeRect(this.penPos.x - PAINT_RADIUS + 0.5, this.penPos.y - PAINT_RADIUS + 0.5, size, size);
        ctx.restore();
    }
    updateStreets() {
        const curr = this.currentHighlightFrameDetails;
        if (!curr)
            return;
        if (!this.isPenDown && curr.pixelsLeft === 0) {
            this.currentHighlightFrameDetails = this.getNextHighlightFrame();
        }
        if (!(this.penPos && this.isPenDown))
            return;
        const x1 = Math.max(this.penPos.x - PAINT_RADIUS, 0);
        const y1 = Math.max(this.penPos.y - PAINT_RADIUS, 0);
        const x2 = Math.min(this.penPos.x + PAINT_RADIUS, this.canvas.width - 1);
        const y2 = Math.min(this.penPos.y + PAINT_RADIUS, this.canvas.height - 1);
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
    drawText(ctx) {
        const { width, height } = this.canvas;
        const { font } = this.options;
        const curr = this.currentHighlightFrameDetails;
        let msg1 = "Hooray!";
        let msg2 = "You painted Manhattan.";
        if (curr) {
            msg1 = `Paint ${shortenStreetName(curr.name)}.`;
            const pixels = curr.pixelsLeft === 1 ? 'pixel' : 'pixels';
            msg2 = `${curr.pixelsLeft} ${pixels} left.`;
        }
        font.drawText(ctx, msg1, width, height - font.options.charHeight, 'bottom-right');
        font.drawText(ctx, msg2, width, height, 'bottom-right');
    }
    updateAndDraw() {
        this.updateStreets();
        const ctx = getCanvasCtx2D(this.canvas);
        this.options.sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
        ctx.drawImage(this.streetCanvas, 0, 0);
        this.drawPenCursor(ctx);
        this.drawText(ctx);
    }
    updatePen(isDown, pctX, pctY) {
        let stateChanged = false;
        if (typeof (isDown) === 'boolean') {
            if (this.isPenDown !== isDown) {
                this.isPenDown = isDown;
                stateChanged = true;
            }
        }
        if (typeof (pctX) === 'number' && typeof (pctY) === 'number') {
            const x = Math.floor(pctX * this.canvas.width);
            const y = Math.floor(pctY * this.canvas.height);
            if (!(this.penPos && this.penPos.x === x && this.penPos.y === y)) {
                this.penPos = { x, y };
                stateChanged = true;
            }
        }
        else if (pctX === null && pctY === null) {
            if (this.penPos) {
                this.penPos = null;
                stateChanged = true;
            }
        }
        if (stateChanged) {
            this.updateAndDraw();
        }
    }
    updatePenFromTouch(e) {
        if (e.type === 'touchcancel' || e.type === 'touchend') {
            this.updatePen(false, null, null);
            return;
        }
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const offsetX = Math.max(touch.clientX - rect.left, 0);
        const offsetY = Math.max(touch.clientY - rect.top, 0);
        const pctX = Math.min(offsetX, rect.width) / rect.width;
        const pctY = Math.min(offsetY, rect.height) / rect.height;
        this.updatePen(true, pctX, pctY);
    }
    updatePenFromMouse(e) {
        const visibleSize = this.canvas.getBoundingClientRect();
        const pctX = e.offsetX / visibleSize.width;
        const pctY = e.offsetY / visibleSize.height;
        if (e.type === 'mouseup') {
            this.updatePen(false, pctX, pctY);
        }
        else if (e.type === 'mouseleave') {
            this.updatePen(false, null, null);
        }
        else if (e.type === 'mousedown') {
            this.updatePen(true, pctX, pctY);
        }
        else if (e.type === 'mousemove') {
            this.updatePen(undefined, pctX, pctY);
        }
    }
    handleTouchEvent(e) {
        e.preventDefault();
        this.updatePenFromTouch(e);
    }
    handleMouseEvent(e) {
        this.updatePenFromMouse(e);
    }
    handleResize() {
        const { canvas } = this;
        const aspectRatio = this.canvas.width / this.canvas.height;
        const currAspectRatio = window.innerWidth / window.innerHeight;
        if (currAspectRatio < aspectRatio) {
            canvas.classList.remove('full-height');
            canvas.classList.add('full-width');
        }
        else {
            canvas.classList.remove('full-width');
            canvas.classList.add('full-height');
        }
    }
    start() {
        window.addEventListener('resize', this.handleResize);
        MOUSE_EVENTS.forEach(name => this.canvas.addEventListener(name, this.handleMouseEvent));
        TOUCH_EVENTS.forEach(name => this.canvas.addEventListener(name, this.handleTouchEvent));
        this.handleResize();
        this.updateAndDraw();
    }
    stop() {
        window.removeEventListener('resize', this.handleResize);
        MOUSE_EVENTS.forEach(name => this.canvas.removeEventListener(name, this.handleMouseEvent));
        TOUCH_EVENTS.forEach(name => this.canvas.removeEventListener(name, this.handleTouchEvent));
    }
}
