import { decir } from '../lib/voces.js';
// Utilidades del motor de juego (interfaz 2D sobre el plató 3D)
import { sfx, audioCtx, synth, findAudioFile } from '../lib/media.js';
import BASE from '../data/preguntas.json';
import { hud } from './grafismos.js';

export function banco(nombre) {
  const extra = (window.PREGUNTAS_EXTRA && window.PREGUNTAS_EXTRA[nombre]) || [];
  return [...(BASE[nombre] || []), ...extra];
}
export const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zñ0-9 ]/g, '').replace(/\s+/g, ' ').trim();
// la ñ se pierde con NFD (n + tilde): se restaura tratando 'n' y 'ñ' como iguales al comparar
export const esCorrecta = (resp, r) => String(r).split('|').some(x => norm(x).replace(/ñ/g, 'n') === norm(resp).replace(/ñ/g, 'n'));
export const VEL = () => window.__VEL || 1;
export const espera = ms => new Promise(r => setTimeout(r, ms / VEL()));
// Cancelación: al volver al menú se incrementa GEN y las partidas antiguas se detienen en su siguiente paso
export const ABORT = new Error('ABORT'); let GEN = 0;
export const nuevaPartida = () => ++GEN; export const genActual = () => GEN;
export const azar = a => a[Math.floor(Math.random() * a.length)];
export const baraja = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let vozActiva = false;
export function setVoz(v) { vozActiva = v; }
export function habla(texto) { if (vozActiva) decir(texto, { voz: 'davefx', pregunta: true }); }

/** Cronómetro con pausa. fin: promesa que se resuelve al agotarse */
export class Reloj {
  constructor(seg, onTick) {
    this.rest = seg; this.onTick = onTick; this.corriendo = false; this.terminado = false; this.gen = GEN;
    this.fin = new Promise(r => (this._res = r));
    this._iv = setInterval(() => {
      if (!this.corriendo || this.terminado) return;
      if (this.gen !== GEN) { this.stop(); return; }
      this.rest = Math.max(0, this.rest - 0.1 * VEL()); this.onTick && this.onTick(this.rest);
      const s = Math.ceil(this.rest); if (s > 0 && s <= 5 && s !== this._ult) { this._ult = s; this._tic(); }
      if (this.rest <= 0) { this.terminado = true; clearInterval(this._iv); this._paraTic(); sonido('fin_tiempo'); this._res('TIEMPO'); }
    }, 100);
    onTick && onTick(seg);
  }
  start() { this.corriendo = true; return this; }
  pause() { this.corriendo = false; this._paraTic(); }
  quitar(s) { this.rest = Math.max(0.1, this.rest - s); }
  stop() { this.terminado = true; clearInterval(this._iv); this._paraTic(); this._res('STOP'); }
  // Tic-tac de los últimos 5 s: un archivo (cargado o en audio/) suena una vez y se corta al parar; el sintetizado, un tic por segundo
  async _tic() {
    if (this._ta !== undefined) return; this._ta = null;
    const url = await findAudioFile('tictac');
    if (!url) { sonido('tictac'); this._ta = undefined; return; }
    if (this.terminado || !this.corriendo) return;
    const a = await sfx('tictac'); if (this.terminado || !this.corriendo) { a && a.pause(); return; } this._ta = a || null;
  }
  _paraTic() { if (this._ta) { this._ta.pause(); } this._ta = undefined; }
}

/** Panel de interfaz */
export class UI {
  constructor(el) { this.el = el; this.gen = GEN; }
  vivo() { if (this.gen !== GEN) throw ABORT; }
  abrir() { this.el.classList.add('abierto'); }
  cerrar() { this.el.classList.remove('abierto'); this.el.innerHTML = ''; hud().limpiar(); }
  pantalla(html) { this.vivo(); this.el.innerHTML = `<div class="j-cab"></div><div class="j-cuerpo">${html}</div>`; this.abrir(); return this.el.querySelector('.j-cuerpo'); }
  cabecera(G, titulo, reloj = null) {
    const c = this.el.querySelector('.j-cab'); if (!c) return;
    const eq = G.equipos.map((e, i) => `<span class="eq" style="--c:${e.color}">${esc(e.nombre)}${i === 0 ? ' (tú)' : ''}: <b>${e.seg}</b> s</span>`).join('');
    c.innerHTML = `<div class="j-tit">${esc(titulo)}</div><div class="j-eqs">${eq}</div><div class="j-reloj">${reloj != null ? Math.ceil(reloj) + ' s' : ''}</div>`;
  }
  setReloj(v) { const r = this.el.querySelector('.j-reloj'); if (r) r.textContent = Math.ceil(v) + ' s'; }
  /** Espera un clic en un elemento con data-v */
  clic(cont, sel = '[data-v]', extra = []) {
    if (window.__AUTO) setTimeout(() => { const l = [...cont.querySelectorAll(sel)].filter(b => !b.disabled); if (l.length && cont.isConnected) l[Math.floor(Math.random() * l.length)].click(); }, 700 / VEL());
    return Promise.race([new Promise(res => cont.querySelectorAll(sel).forEach(b => b.onclick = () => res(b.dataset.v))), ...extra]);
  }
  /** Campo de respuesta: resuelve con el texto, 'PASA' o 'LETRA' */
  respuesta(cont, { pasa = 'Pasapalabra', letra = false, placeholder = 'Escribe tu respuesta y pulsa Intro' } = {}, extra = []) {
    const box = document.createElement('div'); box.className = 'j-resp';
    box.innerHTML = `<input type="text" autocomplete="off" placeholder="${esc(placeholder)}"><button data-a="ok">Responder</button>${pasa ? `<button data-a="pasa" class="pasa">${esc(pasa)}</button>` : ''}${letra ? '<button data-a="letra">Letra (−5 s)</button>' : ''}`;
    cont.appendChild(box); const inp = box.querySelector('input'); setTimeout(() => inp.focus(), 50);
    if (window.__AUTO) setTimeout(() => { if (!box.isConnected) return; const bs = box.querySelectorAll('button'); if (Math.random() < 0.3 && bs[1]) bs[1].click(); else { inp.value = 'xyz'; bs[0].click(); } }, 900 / VEL());
    return Promise.race([new Promise(res => {
      inp.onkeydown = e => { if (e.key === 'Enter') res(inp.value); };
      box.querySelectorAll('button').forEach(b => b.onclick = () => res(b.dataset.a === 'ok' ? inp.value : b.dataset.a === 'pasa' ? 'PASA' : 'LETRA'));
    }), ...extra]).finally(() => box.remove());
  }
  async aviso(cont, html, ms = 1400) { this.vivo(); const d = document.createElement('div'); d.className = 'j-aviso'; d.innerHTML = html; cont.appendChild(d); await espera(ms); d.remove(); this.vivo(); }
  async continuar(cont, txt = 'Continuar ▸') { this.vivo(); const b = document.createElement('button'); b.className = 'j-cont'; b.textContent = txt; cont.appendChild(b); if (window.__AUTO) setTimeout(() => b.click(), 500 / VEL()); await new Promise(r => (b.onclick = r)); this.vivo(); }
}

export function sonido(tipo) { try { sfx(tipo); } catch (e) { /* sin audio */ } }

// Melodías de dominio público sintetizadas (respaldo para pruebas musicales)
const NOTA = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
export function tocaMelodia(notas, { n = 99, tempo = 0.32 } = {}) {
  try {
    const c = audioCtx(); let t = c.currentTime + 0.05;
    notas.split(' ').slice(0, n).forEach(s => { const m = s.match(/^([A-G]#?)(\d)$/); if (!m) return;
      const f = 440 * Math.pow(2, (NOTA[m[1]] + (parseInt(m[2]) + 1) * 12 - 69) / 12); synth.tone(c, c.destination, t, f, tempo * 0.95, 'triangle', 0.18); t += tempo; });
  } catch (e) { /* */ }
}
