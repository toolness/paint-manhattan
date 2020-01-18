import { loadImage, imageToCanvas } from "./util.js";
export class AsepriteSheet {
    constructor(metadata, image) {
        this.metadata = metadata;
        this.image = image;
        this.canvas = imageToCanvas(image);
        if (image.naturalWidth !== metadata.meta.size.w ||
            image.naturalHeight !== metadata.meta.size.h) {
            throw new Error('Assertion failure, image is not expected dimensions!');
        }
    }
    getFrameMetadata(name) {
        const frame = this.metadata.frames[name];
        if (!frame) {
            throw new Error(`Frame "${name}" does not exist`);
        }
        return frame;
    }
    drawFrame(ctx, name, dx, dy) {
        const { x, y, w, h } = this.getFrameMetadata(name).frame;
        ctx.drawImage(this.image, x, y, w, h, dx, dy, w, h);
    }
    getFrameImageData(ctx, name, xOfs = 0, yOfs = 0, width, height) {
        const { frame } = this.getFrameMetadata(name);
        width = width || frame.w;
        height = height || frame.h;
        return ctx.getImageData(frame.x + xOfs, frame.y + yOfs, width, height);
    }
}
;
export async function loadAsepriteSheet(path) {
    const baseURL = new URL(window.location.href);
    const metadataURL = new URL(path, baseURL);
    const metadataRes = await fetch(metadataURL.href);
    if (metadataRes.status !== 200) {
        throw new Error(`Got HTTP ${metadataRes.status} loading ${path}!`);
    }
    const metadata = await metadataRes.json();
    const imageURL = new URL(metadata.meta.image, metadataURL).href;
    const image = await loadImage(imageURL);
    return new AsepriteSheet(metadata, image);
}
