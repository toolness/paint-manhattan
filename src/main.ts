import { loadAsepriteSheet } from "./aseprite-sheet.js";
import { getCanvasCtx2D, loadImage } from "./util.js";
import { BitmapFont, BitmapFontOptions } from "./font.js";

console.log("Loading resources!");

const SPRITESHEET_URL = "./manhattan.json";
const FONT_URL = "./pman_font01.png";
const TERRAIN_FRAME = "Land and water";

const FONT_OPTIONS: BitmapFontOptions = {
  charWidth: 6,
  charHeight: 8,
  charsPerLine: 16,
};

function maximizeElementOnResize(el: HTMLElement, aspectRatio: number) {
  const resizeElement = () => {
    const currAspectRatio = window.innerWidth / window.innerHeight;
    if (currAspectRatio < aspectRatio) {
      el.classList.remove('full-height');
      el.classList.add('full-width');
    } else {
      el.classList.remove('full-width');
      el.classList.add('full-height');
    }
  };
  window.addEventListener('resize', resizeElement);
  resizeElement();
}

async function main() {
  const sheet = await loadAsepriteSheet(SPRITESHEET_URL);
  const {w, h} = sheet.getFrameMetadata(TERRAIN_FRAME).frame;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = getCanvasCtx2D(canvas);
  sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
  document.body.appendChild(canvas);
  maximizeElementOnResize(canvas, w / h);

  const fontImage = await loadImage(FONT_URL);
  const font = new BitmapFont(fontImage, FONT_OPTIONS);
  font.drawText(ctx, 'Hello World', w, h, 'bottom-right');
}

main().catch(e => {
  console.error(e);
});
