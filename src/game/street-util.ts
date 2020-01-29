import { ManhattanOptions } from "./core.js";
import { shuffleArray, uniqueArray, moveToStartOfArray, getCanvasCtx2D, iterPixelIndices, isImageEmptyAt } from "../util.js";
import { getStreetFrames } from "./sheet-frames.js";
import { getStreetsInNarrativeOrder, streetHasStory } from "./street-stories.js";
import { AsepriteSheet } from "../aseprite-sheet.js";

export function shortenStreetName(name: string): string {
  return name
    .replace('Street', 'St')
    .replace('Place', 'Pl');
}

function getFirstStreetWithStory(streets: string[]): string|null {
  for (let street of streets) {
    if (streetHasStory(street)) {
      return street;
    }
  }
  return null;
}

function moveStoriedStreetToStartOfArray(streets: string[]): string[] {
  const streetWithStory = getFirstStreetWithStory(streets);
  if (!streetWithStory) return streets;
  return moveToStartOfArray(streets, streetWithStory);
}

export function createStreetList(options: ManhattanOptions): string[] {
  let highlightFrames = shuffleArray(getStreetFrames(options.sheet));
  if (options.showStreetsInNarrativeOrder) {
    highlightFrames = uniqueArray(getStreetsInNarrativeOrder().concat(highlightFrames));
  }
  if (options.startWithStreet) {
    moveToStartOfArray(highlightFrames, options.startWithStreet);
  } else {
    moveStoriedStreetToStartOfArray(highlightFrames);
  }
  if (options.minStreetSize > 0) {
    highlightFrames = highlightFrames.filter(frame => {
      return countStreetPixelsToBePainted(options.sheet, frame) >= options.minStreetSize;
    });
  }
  if (options.onlyShowStreetsWithStories) {
    highlightFrames = highlightFrames.filter(frame => streetHasStory(frame));
  }
  return highlightFrames;
}

export function countStreetPixelsToBePainted(sheet: AsepriteSheet, frame: string, streetCanvas?: HTMLCanvasElement): number {
  const sheetCtx = getCanvasCtx2D(sheet.canvas);
  const frameIm = sheet.getFrameImageData(sheetCtx, frame);
  const streetIm = streetCanvas ? getCanvasCtx2D(streetCanvas).getImageData(0, 0, streetCanvas.width, streetCanvas.height) : null;
  let total = 0;
  for (let idx of iterPixelIndices(frameIm)) {
    if (!isImageEmptyAt(frameIm, idx) && (!streetIm || isImageEmptyAt(streetIm, idx))) {
      total += 1;
    }
  }
  return total;
}
