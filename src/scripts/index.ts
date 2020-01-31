import { enableOfflineSupport } from "../offline.js";
import { logAmplitudeEvent } from "../amplitude.js";

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
function restartAnimations(entries: IntersectionObserverEntry[]) {
  for (let entry of entries) {
    if (!entry.isIntersecting) continue;
    const { target } = entry;
    const imgs = target.querySelectorAll('img');
    if (imgs.length === 1) {
      const img = imgs[0];
      // I have no idea why, but on Firefox, creating a clone of the image and
      // setting its source appears to work much faster than setting the image
      // source to an empty string and then setting it back to its original value.
      const imgClone = img.cloneNode() as HTMLImageElement;
      imgClone.src = "";
      target.appendChild(imgClone);
      imgClone.src = img.src;
      target.removeChild(img);
    }
  }
}

function enableRestartAnimations() {
  if (!window.IntersectionObserver) return;

  const observer = new IntersectionObserver(restartAnimations);

  for (let apng of document.querySelectorAll('[data-has-animation]')) {
    observer.observe(apng);
  }
}

async function main() {
  enableRestartAnimations();
  await enableOfflineSupport();
  logAmplitudeEvent({name: 'Home page viewed'});
}

window.addEventListener('load', () => {
  main().catch(e => {
    console.error(e);
  });
});
