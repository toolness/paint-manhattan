import { AsepriteSheet } from './aseprite-sheet.js';
import { BitmapFont } from './font.js';
import { getCanvasCtx2D } from './util.js';

const PAINT_RADIUS = 2;

const PAINT_HOVER_STYLE = 'rgba(255, 255, 255, 0.5)';

const TERRAIN_FRAME = "Land and water";

const IGNORE_FRAMES = [
  "Reference image",
  "Streets",
];

type ManhattanOptions = {
  sheet: AsepriteSheet,
  font: BitmapFont,
  root: HTMLElement,
};

function getHighlightFrames(sheet: AsepriteSheet): string[] {
  const ignoreFrames = new Set([TERRAIN_FRAME, ...IGNORE_FRAMES]);
  return Object.keys(sheet.metadata.frames).filter(name => !ignoreFrames.has(name));
}

type Position = {x: number, y: number};

export class Manhattan {
  readonly canvas: HTMLCanvasElement;
  readonly highlightFrames: string[];
  isPenDown: boolean = false;
  penPos: Position|null = null;

  constructor(readonly options: ManhattanOptions) {
    const {w, h} = options.sheet.getFrameMetadata(TERRAIN_FRAME).frame;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    options.root.appendChild(canvas);
    this.canvas = canvas;
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.highlightFrames = getHighlightFrames(options.sheet);
  }

  private draw() {
    const { sheet, font } = this.options;
    const { width, height } = this.canvas;
    const ctx = getCanvasCtx2D(this.canvas);
    sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);

    if (this.penPos) {
      ctx.save();
      ctx.fillStyle = PAINT_HOVER_STYLE;
      const size = PAINT_RADIUS * 2 + 1;
      ctx.fillRect(this.penPos.x - PAINT_RADIUS, this.penPos.y - PAINT_RADIUS, size, size);
      ctx.restore();
    }

    const pos = this.penPos ? ` ${this.penPos.x}, ${this.penPos.y}` : ``;
    const btn = this.isPenDown ? 'DOWN' : 'UP';
    font.drawText(ctx, `${btn}${pos}`, width, height, 'bottom-right');
  }

  private handleMouseLeave(e: MouseEvent) {
    this.penPos = null;
    this.draw();
  }

  private handleMouseMove(e: MouseEvent) {
    const visibleSize = this.canvas.getBoundingClientRect();
    const pctX = e.offsetX / visibleSize.width;
    const pctY = e.offsetY / visibleSize.height;
    const x = Math.floor(pctX * this.canvas.width);
    const y = Math.floor(pctY * this.canvas.height);

    if (!(this.penPos && this.penPos.x === x && this.penPos.y === y)) {
      this.penPos = {x, y};
      this.draw();
    }
  }

  private handleMouseDown() {
    this.isPenDown = true;
    this.draw();
  }

  private handleMouseUp() {
    this.isPenDown = false;
    this.draw();
  }

  private handleResize() {
    const { canvas } = this;
    const aspectRatio = this.canvas.width / this.canvas.height;
    const currAspectRatio = window.innerWidth / window.innerHeight;
    if (currAspectRatio < aspectRatio) {
      canvas.classList.remove('full-height');
      canvas.classList.add('full-width');
    } else {
      canvas.classList.remove('full-width');
      canvas.classList.add('full-height');
    }
  }

  start() {
    window.addEventListener('resize', this.handleResize);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.handleResize();
    this.draw();
  }

  stop() {
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
  }
}
