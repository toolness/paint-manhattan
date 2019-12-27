import { loadAsepriteSheet } from "./aseprite-sheet.js";
import { getCanvasCtx2D } from "./util.js";

console.log("Loading resources!");

const TERRAIN_FRAME = "Land and water";

async function main() {
  const sheet = await loadAsepriteSheet('./manhattan.json');
  const {w, h} = sheet.getFrameMetadata(TERRAIN_FRAME).frame;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = getCanvasCtx2D(canvas);
  sheet.drawFrame(ctx, TERRAIN_FRAME, 0, 0);
  document.body.appendChild(canvas);
}

main().catch(e => {
  console.error(e);
});
