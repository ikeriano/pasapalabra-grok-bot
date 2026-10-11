// Música de fondo: audio/musica_<k>.mp3 si existe, «Mis canciones» durante las pruebas, o un bucle sintetizado sencillo.
import { audioCtx, synth, findAudioFile } from './media.js';
import { cfg } from '../cfg.js';
const LOOPS = { menu: { bpm: 104, notas: [523, 659, 784, 659, 587, 698, 880, 698] }, pruebas: { bpm: 128, notas: [440, 523, 659, 523, 494, 587, 740, 587] }, final: { bpm: 140, notas: [392, 466, 587, 466, 440, 523, 659, 523] } };
let actual = null, canciones = [], etapa = 'a3_2020';
export const musica = {
  setCanciones(l) { canciones = l || []; },
  setEtapa(k) { etapa = k || etapa; },
  async play(k) {
    this.stop(); const tok = actual = { k };
    let url = (k === 'pruebas' && canciones.length) ? canciones[Math.floor(Math.random() * canciones.length)] : k === 'menu' ? (await findAudioFile('sintonia_' + etapa) || await findAudioFile('musica_menu')) : await findAudioFile('musica_' + k);
    if (actual !== tok) return;
    if (url) { tok.url = url; const a = new Audio(url); a.loop = true; a.volume = cfg.music ? cfg.musicVol : 0; tok.a = a; a.play().catch(() => {}); return; }
    const L = LOOPS[k] || LOOPS.menu;
    try {
      const c = audioCtx(); const g = c.createGain(); g.gain.value = cfg.music ? 0.35 * cfg.musicVol : 0; g.connect(c.destination); tok.g = g;
      let t = c.currentTime + 0.05, i = 0; const paso = 60 / L.bpm / 2;
      tok.iv = setInterval(() => { while (t < c.currentTime + 0.4) { synth.tone(c, g, t, L.notas[i % L.notas.length], paso * 0.9, 'triangle', 0.05); if (i % 4 === 0) synth.kick(c, g, t, 0.1); if (i % 2) synth.hat(c, g, t, 0.012); t += paso; i++; } }, 120);
    } catch (e) { /* sin audio */ }
  },
  /** Música de una fase (prueba, final, despedida): el primer archivo que exista de «nombres»; si no hay, la de «respaldo» (sin reiniciarla) */
  async fase(nombres, respaldo = 'pruebas') {
    const tf = this._fase = {};
    for (const n of nombres) {
      const u = await findAudioFile(n); if (this._fase !== tf) return;
      if (u) { if (actual?.url === u) return; this.stop(); const tok = actual = { k: n, url: u }; const a = new Audio(u); a.loop = true; a.volume = cfg.music ? cfg.musicVol : 0; tok.a = a; a.play().catch(() => {}); return; }
    }
    if (actual?.k !== respaldo) this.play(respaldo);
  },
  stop() { const m = actual; actual = null; if (!m) return; if (m.a) m.a.pause(); if (m.iv) { clearInterval(m.iv); try { m.g.disconnect(); } catch (e) { /* */ } } },
  niveles() { if (!actual) return; if (actual.a) actual.a.volume = cfg.music ? cfg.musicVol : 0; if (actual.g) actual.g.gain.value = cfg.music ? 0.35 * cfg.musicVol : 0; },
  get nombre() { return actual?.k || null; },
};
