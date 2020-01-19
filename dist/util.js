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
    // This is really weird; ideally we'd compare r/g/b/a values to zero,
    // which is what we used to do, except that Firefox perturbs
    // some of the values from our original source images, which is very
    // odd.  For instance, pixels that Chrome reports as being (0, 0, 0, 0)
    // will be reported as (0, 255, 0, 1) by Firefox. So a more cross-browser
    // way to test this is by just checking whether the alpha value is close
    // to zero.
    return im.data[idx + ALPHA_OFFSET] <= 1;
}
/** Return the pixel value as an (r, g, b, a) string for debugging. */
export function getPixelStr(im, idx) {
    const [r, g, b, a] = [
        im.data[idx + RED_OFFSET],
        im.data[idx + GREEN_OFFSET],
        im.data[idx + BLUE_OFFSET],
        im.data[idx + ALPHA_OFFSET],
    ];
    return `(${r}, ${g}, ${b}, ${a})`;
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
/**
 * Move the given item to the beginning of the array in-place.
 *
 * If the item doesn't exist, a console message will be logged and the
 * array will be returned unmodified.
 */
export function moveToStartOfArray(arr, item) {
    const idx = arr.indexOf(item);
    if (idx === -1) {
        console.warn(`"${item}" is not in ${JSON.stringify(arr)}`);
        return arr;
    }
    arr.splice(idx, 1);
    arr.unshift(item);
    return arr;
}
export function safeParseInt(s, defaultValue) {
    if (s === null)
        return defaultValue;
    const value = parseInt(s);
    if (isNaN(value))
        return defaultValue;
    return value;
}
/**
 * Word-wrap the given string to a list of lines with the
 * given maximum width.
 *
 * Taken from https://stackoverflow.com/a/51506718/2422398.
 */
export function wordWrap(s, width) {
    return s.replace(new RegExp(`(?![^\\n]{1,${width}}$)([^\\n]{1,${width}})\\s`, 'g'), '$1\n').split('\n');
}
/**
 * Convert a single paragraph or list of paragraphs into a list of
 * word-wrapped lines, separated by blank lines.
 */
export function paragraphsToWordWrappedLines(content, width) {
    const paragraphs = typeof (content) === 'string' ? [content] : content;
    const lines = [];
    let isFirst = true;
    for (let p of paragraphs) {
        if (isFirst) {
            isFirst = false;
        }
        else {
            lines.push('');
        }
        lines.push(...wordWrap(p, width));
    }
    return lines;
}
/** Return a string containing the given number of space characters. */
export function spaces(count) {
    let s = [];
    if (count > 0) {
        for (let i = 0; i < count; i++) {
            s.push(' ');
        }
    }
    return s.join('');
}
/**
 * Return a new array such that if the passed-in array has duplicate
 * entries, we remove the ones that appear after the first occurrence.
 */
export function uniqueArray(arr) {
    const result = [];
    const set = new Set();
    for (let item of arr) {
        if (!set.has(item)) {
            set.add(item);
            result.push(item);
        }
    }
    return result;
}
/**
 * Return the class name of the given instance, or "<unknown>" if we don't know.
 */
export function getClassName(obj) {
    if (obj && obj.constructor && typeof (obj.constructor.name) === 'string') {
        return obj.constructor.name;
    }
    return '<unknown>';
}
