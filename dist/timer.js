export class Timer {
    constructor(intervalMs, onTick) {
        this.intervalMs = intervalMs;
        this.onTick = onTick;
        this.timeout = null;
        this.tick = 0;
    }
    start() {
        this.stop();
        this.timeout = window.setInterval(() => {
            this.tick += 1;
            this.onTick();
        }, this.intervalMs);
    }
    stop() {
        if (this.timeout !== null) {
            window.clearInterval(this.timeout);
            this.timeout = null;
        }
        this.tick = 0;
    }
}
