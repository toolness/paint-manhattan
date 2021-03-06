import { FrameScaler } from "./frame-scaler.js";

type UPNG = typeof import("../vendor/upng");

const UZIP_URL = 'vendor/uzip/UZIP.js';
const UPNG_URL = 'vendor/upng/UPNG.js';
const PNG_CONTENT_TYPE = 'image/png';
const MIN_DELAY_BETWEEN_FRAMES_MS = 11;

let upngPromise: Promise<UPNG>|null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.onerror = reject;
    script.onload = () => resolve();
    script.src = src;
    document.body.appendChild(script);
  });
}

function ensureWindowGlobal(name: string): any {
  const value = (window as any)[name];
  if (!value) {
    throw new Error(`Expected "${name}" to be on the global window object!`);
  }
  return value;
}

function importUPNG(): Promise<UPNG> {
  if (!upngPromise) {
    upngPromise = (async () => {
      await loadScript(UZIP_URL);
      ensureWindowGlobal('UZIP');

      // The UPNG library looks for pako, and UZIP's inflate/deflate API
      // is identical to it, so we'll just alias one to the other.
      (window as any).pako = (window as any).UZIP;

      await loadScript(UPNG_URL);
      return ensureWindowGlobal('UPNG');
    })();
  }
  return upngPromise;
}

function now(): number {
  if (typeof(performance) !== 'undefined' && performance && performance.now) {
    return performance.now();
  }
  return Date.now();
}

export class AnimatedPngRecorder {
  state?: {
    timeOfLastFrame: number,
    frames: Uint8ClampedArray[],
    delaysBetweenFrames: number[],
    width: number,
    height: number,
  }

  constructor(readonly maxFrames = 20_000) {
  }

  addFrame(ctx: CanvasRenderingContext2D) {
    const { width, height } = ctx.canvas;
    const frameData = ctx.getImageData(0, 0, width, height).data;

    if (!this.state) {
      this.state = {
        timeOfLastFrame: now(),
        frames: [frameData],
        delaysBetweenFrames: [],
        width,
        height
      };
    } else if (this.state.frames.length < this.maxFrames) {
      const timeOfThisFrame = now();
      const timeSinceLastFrame = timeOfThisFrame - this.state.timeOfLastFrame;
      if (timeSinceLastFrame < MIN_DELAY_BETWEEN_FRAMES_MS) {
        // If very little time has passed since the rendering of the last frame,
        // just replace the most recent frame with this frame, rather than
        // adding it as a new frame.
        this.state.frames[this.state.frames.length - 1] = frameData;
        return;
      };
      this.state.frames.push(frameData);
      this.state.delaysBetweenFrames.push(timeSinceLastFrame);
      this.state.timeOfLastFrame = timeOfThisFrame;
    }
  }

  get frameCount(): number {
    if (!this.state) return 0;
    return this.state.frames.length;
  }

  async encode(scaleFactor: number): Promise<ArrayBuffer> {
    const { state } = this;
    if (!state) {
      throw new Error("No frames have been added to the animation!");
    }

    const upng = await importUPNG();
    const { width, height } = state;
    const scaler = new FrameScaler(width, height, scaleFactor);
    const frames = state.frames.map(scaler.scale);
    const buf = upng.encode(frames, scaler.scaledWidth, scaler.scaledHeight, 0, state.delaysBetweenFrames);
    return buf;
  }

  async encodeToObjectURL(scaleFactor: number): Promise<{byteLength: number, url: string}> {
    const buf = await this.encode(scaleFactor);
    const { byteLength } = buf;

    const blob = new Blob([buf], {type: PNG_CONTENT_TYPE});
    const url = URL.createObjectURL(blob);
    return { byteLength, url };
  }
}
