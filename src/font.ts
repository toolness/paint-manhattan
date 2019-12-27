/**
 * Most of this logic is taken from pman-sdl's font-rendering code:
 * 
 * https://github.com/toolness/pman-sdl/blob/master/src/font.h
 */

/** ASCII value to subtract from every ASCII character we're asked to print. */
const CHAR_CODE_OFFSET = 32;

export type BitmapFontAnchor = 'top-left'|'bottom-right';

export type BitmapFontOptions = {
  charWidth: number,
  charHeight: number,
  charsPerLine: number,
};

export class BitmapFont {
  constructor(readonly image: HTMLImageElement, readonly options: BitmapFontOptions) {
  }

  private drawTextAtTopLeft(ctx: CanvasRenderingContext2D, text: string, dx: number, dy: number) {
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

  drawText(ctx: CanvasRenderingContext2D, text: string, dx: number, dy: number, anchor: BitmapFontAnchor = 'top-left') {
    switch (anchor) {
      case 'top-left': this.drawTextAtTopLeft(ctx, text, dx, dy);
      case 'bottom-right': this.drawTextAtTopLeft(ctx, text, dx - this.options.charWidth * text.length, dy - this.options.charHeight);
    }
  }
}
