export function canSupportFullscreen() {
    return !!document.documentElement.requestFullscreen;
}
export function requestFullscreen() {
    if (canSupportFullscreen()) {
        document.documentElement.requestFullscreen();
    }
}
