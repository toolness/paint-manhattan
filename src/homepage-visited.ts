const SESSION_STORAGE_KEY = 'manhattan_userHasVisitedHomepage';

export function setUserHasVisitedHomepage() {
  if (window.sessionStorage) {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, 'on');
  }
}

export function hasUserVisitedHomepage(): boolean {
  if (window.sessionStorage) {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY) === 'on';
  }
  return false;
}
