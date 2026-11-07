import { secureRandomInt } from './random.js';
import { readStore, saveStore } from './storage.js';
import { Wheel } from './wheel.js';

const $ = id => document.getElementById(id);
const wheel = new Wheel($('wheelCanvas'));
const saved = readStore();
const state = {
  text: typeof saved.text === 'string' ? saved.text : '',
  excluded: Array.isArray(saved.excluded) ? saved.excluded.filter(x => typeof x === 'string') : [],
  history: Array.isArray(saved.history) ? saved.history.filter(x => x && typeof x.name === 'string').slice(0, 250) : [],
  removeWinner: saved.removeWinner !== false,
  showNames: saved.showNames !== false,
  duration: Number.isInteger(saved.duration) && saved.duration >= 3 && saved.duration <= 12 ? saved.duration : 6,
  busy: false,
};
const sample = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Facundo', 'Gabriela', 'Hugo'];

function parseNames(text) { return text.split(/[\n\r,;\t]+/).map(x => x.trim()).filter(Boolean); }
// Each occurrence is a separate ticket. An identical text on two lines has two chances to win.
function tickets() {
  const excluded = new Set(state.excluded);
  return parseNames(state.text).map((name, index) => ({ name, id: `${index}:${name}` })).filter(ticket => !excluded.has(ticket.id));
}
function persist() { saveStore({ text: state.text, excluded: state.excluded, history: state.history, removeWinner: state.removeWinner, showNames: state.showNames, duration: state.duration }); }
function render() {
  const active = tickets();
  wheel.update(active.map(x => x.name), state.showNames);
  $('wheelCount').textContent = `${active.length} participante${active.length === 1 ? '' : 's'}`;
  $('listCount').textContent = parseNames(state.text).length;
  $('historyBadge').textContent = state.history.length;
  $('spinBtn').disabled = state.busy || active.length < 2;
  $('resetBtn').disabled = state.busy || state.excluded.length === 0;
  $('namesInput').disabled = state.busy;
  $('loadSampleBtn').disabled = state.busy;
  $('importBtn').disabled = state.busy;
  $('clearBtn').disabled = state.busy;
  $('removeWinner').disabled = state.busy;
  $('showNames').disabled = state.busy;
  $('durationInput').disabled = state.busy;
  $('stageNote').textContent = state.busy ? 'La suerte está girando…' : active.length < 2 ? 'Agregá al menos dos participantes para comenzar.' : `Listo para sortear entre ${active.length} participantes.`;
  $('historyList').replaceChildren(...state.history.map((entry, index) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong'); strong.textContent = entry.name;
    const small = document.createElement('small');
    const date = new Date(entry.at); small.textContent = Number.isNaN(date.valueOf()) ? '' : date.toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' });
    const number = document.createElement('span'); number.className = 'history-index'; number.textContent = String(state.history.length - index).padStart(2, '0');
    const detail = document.createElement('div'); detail.append(strong, small); li.append(number, detail); return li;
  }));
  $('historyEmpty').hidden = state.history.length > 0;
  $('clearHistoryBtn').disabled = state.history.length === 0 || state.busy;
  persist();
}
function setText(value) { state.text = value; state.excluded = []; $('namesInput').value = value; render(); }
function showWinner(name) {
  $('winnerName').textContent = name;
  $('winnerMeta').textContent = new Date().toLocaleString('es-PY', { dateStyle: 'long', timeStyle: 'short' });
  $('winnerModal').hidden = false;
  $('closeModalBtn').focus();
}
function closeWinner() { $('winnerModal').hidden = true; $('spinBtn').focus(); }
async function spin() {
  if (state.busy) return;
  const active = tickets(); if (active.length < 2) return;
  state.busy = true;
  const winnerIndex = secureRandomInt(active.length);
  const winner = active[winnerIndex];
  render();
  try {
    await wheel.spin(winnerIndex, state.duration * 1000);
    state.history.unshift({ name: winner.name, at: new Date().toISOString() });
    state.history = state.history.slice(0, 250);
    if (state.removeWinner) state.excluded.push(winner.id);
    showWinner(winner.name);
  } catch (error) { $('stageNote').textContent = `No se pudo realizar el sorteo: ${error.message}`; }
  finally { state.busy = false; render(); }
}
function switchTab(which) {
  const history = which === 'history';
  $('participantsPanel').hidden = history;
  $('historyPanel').hidden = !history;
  $('participantsTab').classList.toggle('active', !history);
  $('historyTab').classList.toggle('active', history);
  $('participantsTab').setAttribute('aria-selected', String(!history));
  $('historyTab').setAttribute('aria-selected', String(history));
}
$('namesInput').value = state.text;
$('removeWinner').checked = state.removeWinner;
$('showNames').checked = state.showNames;
$('durationInput').value = state.duration;
$('durationValue').textContent = `${state.duration} s`;
$('namesInput').addEventListener('input', e => setText(e.target.value));
$('loadSampleBtn').addEventListener('click', () => setText(sample.join('\n')));
$('clearBtn').addEventListener('click', () => { if (state.text && !confirm('¿Vaciar toda la lista de participantes?')) return; setText(''); });
$('importBtn').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', async e => {
  const file = e.target.files?.[0]; if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('El archivo supera los 2 MB.'); e.target.value = ''; return; }
  try { setText(await file.text()); } catch { alert('No se pudo leer el archivo.'); }
  e.target.value = '';
});
$('removeWinner').addEventListener('change', e => { state.removeWinner = e.target.checked; render(); });
$('showNames').addEventListener('change', e => { state.showNames = e.target.checked; render(); });
$('durationInput').addEventListener('input', e => { state.duration = Number(e.target.value); $('durationValue').textContent = `${state.duration} s`; persist(); });
$('spinBtn').addEventListener('click', spin);
$('resetBtn').addEventListener('click', () => { state.excluded = []; render(); });
$('participantsTab').addEventListener('click', () => switchTab('participants'));
$('historyTab').addEventListener('click', () => switchTab('history'));
$('clearHistoryBtn').addEventListener('click', () => { if (!confirm('¿Borrar todo el historial de ganadores?')) return; state.history = []; render(); });
$('closeModalBtn').addEventListener('click', closeWinner);
$('winnerModal').addEventListener('click', e => { if (e.target === $('winnerModal')) closeWinner(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('winnerModal').hidden) closeWinner(); });
$('copyWinnerBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('winnerName').textContent); $('copyWinnerBtn').textContent = '¡Copiado!'; setTimeout(() => { $('copyWinnerBtn').textContent = 'Copiar nombre'; }, 1500); }
  catch { $('copyWinnerBtn').textContent = 'No se pudo copiar'; }
});
$('fullscreenBtn').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { alert('Tu navegador no permitió activar la pantalla completa.'); }
});
render();
