export type PenPosition = {x: number, y: number};

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

export class Pen {
  isDown: boolean = false;
  pos: PenPosition|null = null;
  onChange?: () => void;

  constructor(readonly canvas: HTMLCanvasElement, onChange?: () => void) {
    this.handleMouseEvent = this.handleMouseEvent.bind(this);
    this.handleTouchEvent = this.handleTouchEvent.bind(this);
    this.onChange = onChange;
  }

  private updatePen(isDown?: boolean, pctX?: number|null, pctY?: number|null) {
    let stateChanged = false;

    if (typeof(isDown) === 'boolean') {
      if (this.isDown !== isDown) {
        this.isDown = isDown;
        stateChanged = true;
      }
    }

    if (typeof(pctX) === 'number' && typeof(pctY) === 'number') {
      const x = Math.floor(pctX * this.canvas.width);
      const y = Math.floor(pctY * this.canvas.height);
      if (!(this.pos && this.pos.x === x && this.pos.y === y)) {
        this.pos = {x, y};
        stateChanged = true;
      }
    } else if (pctX === null && pctY === null) {
      if (this.pos) {
        this.pos = null;
        stateChanged = true;
      }
    }

    if (stateChanged && this.onChange) {
      this.onChange();
    }
  }

  private updatePenFromTouch(e: TouchEvent) {
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

  private updatePenFromMouse(e: MouseEvent) {
    const visibleSize = this.canvas.getBoundingClientRect();
    const pctX = e.offsetX / visibleSize.width;
    const pctY = e.offsetY / visibleSize.height;

    if (e.type === 'mouseup') {
      this.updatePen(false, pctX, pctY);
    } else if (e.type === 'mouseleave') {
      this.updatePen(false, null, null);
    } else if (e.type === 'mousedown') {
      this.updatePen(true, pctX, pctY);
    } else if (e.type === 'mousemove') {
      this.updatePen(undefined, pctX, pctY);
    }
  }

  private handleTouchEvent(e: TouchEvent) {
    e.preventDefault();
    this.updatePenFromTouch(e);
  }

  private handleMouseEvent(e: MouseEvent) {
    this.updatePenFromMouse(e);
  }

  start() {
    MOUSE_EVENTS.forEach(name => this.canvas.addEventListener(name, this.handleMouseEvent as any));
    TOUCH_EVENTS.forEach(name => this.canvas.addEventListener(name, this.handleTouchEvent as any));
  }

  stop() {
    MOUSE_EVENTS.forEach(name => this.canvas.removeEventListener(name, this.handleMouseEvent as any));
    TOUCH_EVENTS.forEach(name => this.canvas.removeEventListener(name, this.handleTouchEvent as any));
  }
}
