const LEFT_MOUSE_BTN = 0;
const MOUSE_EVENTS = [
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
export class Pen {
    constructor(canvas, onChange) {
        this.canvas = canvas;
        this.isMouseDown = false;
        this.cursorThisFrame = 'default';
        this.wasDown = false;
        this.isDown = false;
        this.pos = null;
        this.medium = null;
        this.handleMouseEvent = this.handleMouseEvent.bind(this);
        this.handleTouchEvent = this.handleTouchEvent.bind(this);
        this.onChange = onChange;
    }
    get justWentUp() {
        return this.wasDown && !this.isDown;
    }
    updatePen(isDown, pctX, pctY) {
        let stateChanged = false;
        if (typeof (isDown) === 'boolean') {
            if (this.isDown !== isDown) {
                this.wasDown = this.isDown;
                this.isDown = isDown;
                stateChanged = true;
            }
        }
        if (typeof (pctX) === 'number' && typeof (pctY) === 'number') {
            const x = Math.floor(pctX * this.canvas.width);
            const y = Math.floor(pctY * this.canvas.height);
            if (!(this.pos && this.pos.x === x && this.pos.y === y)) {
                this.pos = { x, y };
                stateChanged = true;
            }
        }
        else if (pctX === null && pctY === null) {
            if (this.pos) {
                this.pos = null;
                stateChanged = true;
            }
        }
        if (stateChanged && this.onChange) {
            this.onChange();
        }
    }
    getPctCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const offsetX = Math.max(e.clientX - rect.left, 0);
        const offsetY = Math.max(e.clientY - rect.top, 0);
        const pctX = Math.min(offsetX, rect.width) / rect.width;
        const pctY = Math.min(offsetY, rect.height) / rect.height;
        return [pctX, pctY];
    }
    updatePenFromTouch(e) {
        this.medium = 'touch';
        if (e.type === 'touchcancel' || e.type === 'touchend') {
            this.updatePen(false, null, null);
            return;
        }
        const touch = e.touches[0];
        const [pctX, pctY] = this.getPctCoords(touch);
        this.updatePen(true, pctX, pctY);
    }
    updatePenFromMouse(e) {
        this.medium = 'mouse';
        if (e.type === 'mouseup' && e.button === LEFT_MOUSE_BTN) {
            this.isMouseDown = false;
        }
        else if (e.type === 'mousedown' && e.button === LEFT_MOUSE_BTN) {
            this.isMouseDown = true;
        }
        const [pctX, pctY] = this.getPctCoords(e);
        this.updatePen(this.isMouseDown, pctX, pctY);
    }
    handleTouchEvent(e) {
        e.preventDefault();
        this.updatePenFromTouch(e);
    }
    handleMouseEvent(e) {
        this.updatePenFromMouse(e);
    }
    /**
     * Set the OS cursor for the canvas.
     *
     * This needs to be called every frame, just like any other drawing
     * operation. If it is not called every frame, the cursor will revert
     * to `default`.
     */
    setCursor(cursorType) {
        this.cursorThisFrame = cursorType;
    }
    /**
     * Use this at the beginning of a frame update to reset the cursor style.
     *
     * Clients should call `setCursor()` if they want to change the cursor style
     * for this frame.
     */
    clearCursorState() {
        this.cursorThisFrame = 'default';
    }
    /**
     * Use this at the end of a frame update to apply any cursor state set
     * by clients to the canvas.
     */
    applyCursorState() {
        if (this.canvas.style.cursor != this.cursorThisFrame) {
            this.canvas.style.cursor = this.cursorThisFrame;
        }
    }
    /**
     * This effectively tells the pen that time has passed, which changes
     * its conception of whether the pen was recently down or not.
     */
    updateHistory() {
        this.wasDown = this.isDown;
    }
    start() {
        MOUSE_EVENTS.forEach(name => window.addEventListener(name, this.handleMouseEvent));
        TOUCH_EVENTS.forEach(name => this.canvas.addEventListener(name, this.handleTouchEvent));
    }
    stop() {
        MOUSE_EVENTS.forEach(name => window.removeEventListener(name, this.handleMouseEvent));
        TOUCH_EVENTS.forEach(name => this.canvas.removeEventListener(name, this.handleTouchEvent));
    }
}
