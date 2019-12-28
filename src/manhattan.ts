import { AsepriteSheet } from './aseprite-sheet.js';
import { BitmapFont } from './font.js';
import { getCanvasCtx2D } from './util.js';

const TERRAIN_FRAME = "Land and water";

type ManhattanOptions = {
  sheet: AsepriteSheet,
  font: BitmapFont,
  root: HTMLElement,
};

export class Manhattan {
  readonly canvas: HTMLCanvasElement;

  constructor(readonly options: ManhattanOptions) {
    const {w, h} = options.sheet.getFrameMetadata(TERRAIN_FRAME).frame;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    options.root.appendChild(canvas);
    this.canvas = canvas;
    this.handleResize = this.handleResize.bind(this);
  }

  private drawFrame() {
    const { sheet, font } = this.options;
    const { width, height } = this.canvas;
    const ctx = getCanvasCtx2D(this.canvas);
    sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
    font.drawText(ctx, 'Hello World', width, height, 'bottom-right');
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
    this.handleResize();
    this.drawFrame();
  }

  stop() {
    window.removeEventListener('resize', this.handleResize);
  }
}
