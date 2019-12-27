export function getCanvasCtx2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get 2d context of canvas!');
  }
  return ctx;
}
