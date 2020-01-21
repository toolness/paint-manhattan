/**
 * Most of this logic is taken from pman-sdl's font-rendering code:
 *
 * https://github.com/toolness/pman-sdl/blob/master/src/font.h
 */
/** ASCII value to subtract from every ASCII character we're asked to print. */
const CHAR_CODE_OFFSET = 32;
export class BitmapFont {
    constructor(image, options) {
        this.image = image;
        this.options = options;
    }
    drawTextAtTopLeft(ctx, text, dx, dy) {
        const { charsPerLine, charWidth, charHeight } = this.options;
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) - CHAR_CODE_OFFSET;
            const charX = charCode % charsPerLine;
            const charY = Math.floor(charCode / charsPerLine);
            const sx = charX * charWidth;
            const sy = charY * charHeight;
            ctx.drawImage(this.image, sx, sy, charWidth, charHeight, dx, dy, charWidth, charHeight);
            dx += charWidth;
        }
    }
    drawText(ctx, text, dx, dy, anchor = 'top-left') {
        switch (anchor) {
            case 'top-left':
                this.drawTextAtTopLeft(ctx, text, dx, dy);
                break;
            case 'bottom-right':
                this.drawTextAtTopLeft(ctx, text, dx - this.options.charWidth * text.length, dy - this.options.charHeight);
                break;
            case 'center':
                this.drawTextAtTopLeft(ctx, text, dx - Math.floor((this.options.charWidth * text.length) / 2), dy - Math.floor(this.options.charHeight / 2));
                break;
        }
    }
}
