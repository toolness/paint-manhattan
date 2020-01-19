import { createCanvas, getCanvasCtx2D } from "./util.js";
export class FrameScaler {
    constructor(width, height, scaleFactor) {
        this.width = width;
        this.height = height;
        this.scaleFactor = scaleFactor;
        this.scaledWidth = width * scaleFactor;
        this.scaledHeight = height * scaleFactor;
        if (scaleFactor !== 1) {
            const canvas = createCanvas(width, height);
            const scaledCanvas = createCanvas(this.scaledWidth, this.scaledHeight);
            const ctx = getCanvasCtx2D(canvas);
            ctx.imageSmoothingEnabled = false;
            const scaledCtx = getCanvasCtx2D(scaledCanvas);
            scaledCtx.imageSmoothingEnabled = false;
            this.canvases = { canvas, scaledCanvas, ctx, scaledCtx };
        }
        this.scale = this.scale.bind(this);
    }
    scale(frame) {
        if (this.canvases) {
            const { ctx, scaledCtx, canvas } = this.canvases;
            ctx.putImageData(new ImageData(frame, this.width, this.height), 0, 0);
            scaledCtx.drawImage(canvas, 0, 0, this.scaledWidth, this.scaledHeight);
            return scaledCtx.getImageData(0, 0, this.scaledWidth, this.scaledHeight).data;
        }
        return frame;
    }
}
