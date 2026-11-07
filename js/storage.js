const KEY = 'gira-sorteos-v1';
export function readStore() {
  try { const item = JSON.parse(localStorage.getItem(KEY) || '{}'); return item && typeof item === 'object' ? item : {}; }
  catch { return {}; }
}
export function saveStore(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
  catch { return false; }
}
