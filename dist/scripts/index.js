"use strict";
/**
 * Restart all animated images contained within the given entries that
 * have just intersected with the browser's viewport.
 *
 * We do this for two reasons:
 *
 *   1. When the user scrolls into an animation, they probably want to
 *      see it from its beginning, not whatever part of it may happen
 *      to be playing at the moment.
 *
 *   2. Some browsers, like iOS Safari, seem to have a bug where the
 *      animation looks messed up it is initially off the viewport and
 *      then scrolled into view before it has finished. The user has
 *      to wait until the animation loops in order to view it as intended.
 *
 *      By simply restarting the animation whenever the image scrolls into
 *      view, we work around this problem.
 */
function restartAnimations(entries) {
    for (let entry of entries) {
        if (!entry.isIntersecting)
            continue;
        const img = entry.target.querySelector('img');
        if (img) {
            const { src } = img;
            img.src = "";
            img.src = src;
        }
    }
}
window.addEventListener('load', () => {
    if (!window.IntersectionObserver)
        return;
    const observer = new IntersectionObserver(restartAnimations);
    for (let apng of document.querySelectorAll('[data-has-animation]')) {
        observer.observe(apng);
    }
});
