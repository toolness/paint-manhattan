const BYTES_PER_PIXEL = 4;
const RED_OFFSET = 0;
const GREEN_OFFSET = 1;
const BLUE_OFFSET = 2;
const ALPHA_OFFSET = 3;
export function getCanvasCtx2D(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Unable to get 2d context of canvas!');
    }
    return ctx;
}
export function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
    });
}
export function imageToCanvas(image) {
    const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
    canvas.height = image.naturalHeight;
    canvas.width = image.naturalWidth;
    const ctx = getCanvasCtx2D(canvas);
    ctx.drawImage(image, 0, 0);
    // Verify that the canvas data isn't tainted.
    ctx.getImageData(0, 120, 1, 1);
    return canvas;
}
export function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
/**
 * Shuffle an array in place.
 *
 * Taken from https://stackoverflow.com/a/6274381/2422398.
 */
export function shuffleArray(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
export function isImageEmptyAt(im, idx) {
    return im.data[idx + RED_OFFSET] === 0 &&
        im.data[idx + GREEN_OFFSET] === 0 &&
        im.data[idx + BLUE_OFFSET] === 0 &&
        im.data[idx + ALPHA_OFFSET] === 0;
}
export function* iterPixelIndices(im) {
    const totalPixels = typeof (im) === 'number' ? im : im.height * im.width;
    let idx = 0;
    for (let i = 0; i < totalPixels; i++) {
        yield idx;
        idx += BYTES_PER_PIXEL;
    }
}
export function setPixel(im, idx, r, g, b, a) {
    im.data[idx + RED_OFFSET] = r;
    im.data[idx + GREEN_OFFSET] = g;
    im.data[idx + BLUE_OFFSET] = b;
    im.data[idx + ALPHA_OFFSET] = a;
}
