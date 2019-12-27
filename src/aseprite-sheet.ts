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

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({metadata, image});
    image.onerror = reject;
    image.src = imageURL;
  });
}
