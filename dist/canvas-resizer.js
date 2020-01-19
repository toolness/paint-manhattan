export class CanvasResizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.handleResize = this.handleResize.bind(this);
    }
    handleResize() {
        const { canvas } = this;
        const aspectRatio = this.canvas.width / this.canvas.height;
        const currAspectRatio = window.innerWidth / window.innerHeight;
        if (currAspectRatio < aspectRatio) {
            canvas.classList.remove('full-height');
            canvas.classList.add('full-width');
        }
        else {
            canvas.classList.remove('full-width');
            canvas.classList.add('full-height');
        }
    }
    start() {
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    }
    stop() {
        window.removeEventListener('resize', this.handleResize);
    }
}
