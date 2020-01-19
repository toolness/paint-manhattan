import { createCanvas, getCanvasCtx2D } from "./util.js";

export class FrameScaler {
  readonly canvases?: {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    scaledCanvas: HTMLCanvasElement;
    scaledCtx: CanvasRenderingContext2D;
  };
  public readonly scaledHeight: number;
  public readonly scaledWidth: number;

  constructor(readonly width: number, readonly height: number, readonly scaleFactor: number) {
    this.scaledWidth = width * scaleFactor;
    this.scaledHeight = height * scaleFactor;

    if (scaleFactor !== 1) {
      const canvas = createCanvas(width, height);
      const scaledCanvas = createCanvas(this.scaledWidth, this.scaledHeight);
      const ctx = getCanvasCtx2D(canvas);
      ctx.imageSmoothingEnabled = false;
      const scaledCtx = getCanvasCtx2D(scaledCanvas);
      scaledCtx.imageSmoothingEnabled = false;
      this.canvases = {canvas, scaledCanvas, ctx, scaledCtx};
    }

    this.scale = this.scale.bind(this);
  }

  scale(frame: Uint8ClampedArray): Uint8ClampedArray {
    if (this.canvases) {
      const { ctx, scaledCtx, canvas } = this.canvases;
      ctx.putImageData(new ImageData(frame, this.width, this.height), 0, 0);
      scaledCtx.drawImage(canvas, 0, 0, this.scaledWidth, this.scaledHeight);
      return scaledCtx.getImageData(0, 0, this.scaledWidth, this.scaledHeight).data;
    }
    return frame;
  }
}
