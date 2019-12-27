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

type AsepriteSheet = {
  metadata: AsepriteSheetMetadata,
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.height = image.naturalHeight;
  canvas.width = image.naturalWidth;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get 2d context of canvas!');
  }
  ctx.drawImage(image, 0, 0);

  // Verify that the canvas data isn't tainted.
  ctx.getImageData(0, 120, 1, 1);

  return canvas;
}

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

  if (image.naturalWidth !== metadata.meta.size.w ||
      image.naturalHeight !== metadata.meta.size.h) {
    throw new Error('Assertion failure, image is not expected dimensions!');
  }

  const canvas = imageToCanvas(image);

  return {metadata, image, canvas};
}
