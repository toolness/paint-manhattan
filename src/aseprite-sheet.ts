import { loadImage, imageToCanvas } from "./util.js";

type AsepriteDimensions = {
  x: number,
  y: number,
  w: number,
  h: number,
};

type AsepriteFrame = {
  frame: AsepriteDimensions,
  rotated: boolean,
  trimmed: boolean,
  spriteSourceSize: AsepriteDimensions,
  sourceSize: AsepriteDimensions,
  duration: number,
};

type AsepriteFrames = {
  [key: string]: AsepriteFrame,
};

type AsepriteSheetMetadata = {
  frames: AsepriteFrames,
  meta: {
    app: string,
    version: string,
    image: string,
    format: string,
    size: {w: number, h: number},
    scale: string
  }
};

class AsepriteSheet {
  readonly canvas: HTMLCanvasElement;

  constructor(readonly metadata: AsepriteSheetMetadata, readonly image: HTMLImageElement) {
    this.canvas = imageToCanvas(image);

    if (image.naturalWidth !== metadata.meta.size.w ||
        image.naturalHeight !== metadata.meta.size.h) {
      throw new Error('Assertion failure, image is not expected dimensions!');
    }
  }

  getFrameMetadata(name: string): AsepriteFrame {
    const frame = this.metadata.frames[name];
    if (!frame) {
      throw new Error(`Frame "${name}" does not exist`);
    }
    return frame;
  }

  drawFrame(ctx: CanvasRenderingContext2D, name: string, dx: number, dy: number) {
    const { x, y, w, h } = this.getFrameMetadata(name).frame;
    ctx.drawImage(this.image, x, y, w, h, dx, dy, w, h);
  }
};

export async function loadAsepriteSheet(path: string): Promise<AsepriteSheet> {
  const baseURL = new URL(window.location.href);
  const metadataURL = new URL(path, baseURL);
  const metadataRes = await fetch(metadataURL.href);
  if (metadataRes.status !== 200) {
    throw new Error(`Got HTTP ${metadataRes.status} loading ${path}!`);
  }
  const metadata: AsepriteSheetMetadata = await metadataRes.json();
  const imageURL = new URL(metadata.meta.image, metadataURL).href;
  const image = await loadImage(imageURL);
  return new AsepriteSheet(metadata, image);
}
