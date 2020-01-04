import { loadAsepriteSheet } from "../aseprite-sheet.js";
import { SPRITESHEET_URL } from "../game/urls.js";
import { getStreetFrames } from "../game/sheet-frames.js";
import { canSupportOffline } from "../offline.js";

type FormControl = HTMLInputElement|HTMLSelectElement;

function getAllFormControls(): FormControl[] {
  return Array.from(document.querySelectorAll('input, select'));
}

function saveFormSetting(el: FormControl) {
  if (el instanceof HTMLInputElement && el.type === 'checkbox') {
    window.sessionStorage.setItem(el.name, el.checked ? 'YUP' : '');
  } else {
    window.sessionStorage.setItem(el.name, el.value);
  }
}

function restoreFormSetting(el: FormControl) {
  const val = window.sessionStorage.getItem(el.name);
  if (val === null) return;
  if (el instanceof HTMLInputElement && el.type === 'checkbox') {
    el.checked = Boolean(val);
  } else {
    el.value = val;
  }
}

function showOfflineSupport() {
  const offlineSelector = canSupportOffline() ? '.offline-support' : '.no-offline-support';

  Array.from(document.querySelectorAll(offlineSelector)).forEach(el => {
    if (el instanceof HTMLElement) {
      el.style.removeProperty('display');
    }
  });
}

async function debugMain() {
  showOfflineSupport();

  const sheet = await loadAsepriteSheet(SPRITESHEET_URL);
  const streetNames = getStreetFrames(sheet);
  const streetEl = document.getElementById('street');

  if (!streetEl) {
    throw new Error('Assertion failure, unable to find street <select> element!');
  }

  streetNames.sort();

  for (let name of streetNames) {
    const optionEl = document.createElement('option');
    optionEl.textContent = name;
    optionEl.setAttribute('value', name);
    streetEl.appendChild(optionEl);
  }

  getAllFormControls().forEach(el => {
    restoreFormSetting(el);
    el.addEventListener('change', () => saveFormSetting(el));
  });
}

debugMain().catch(e => {
  console.error(e);
});
