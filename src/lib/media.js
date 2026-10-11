import { cfg } from '../cfg.js';
// Gestión de archivos multimedia aportados por el usuario:
//  1) Archivos subidos desde el juego (se guardan en IndexedDB y se recuerdan)
//  2) Archivos en las carpetas audio/ y logos/ junto a index.html
//  3) Si no hay nada: sonido sintetizado sencillo / texto 3D de respaldo

const DB_NAME = 'pasapalabra_juego', STORE = 'media';
const AUDIO_EXT = ['mp3', 'ogg', 'wav', 'm4a'];
const IMG_EXT = ['png', 'webp', 'jpg', 'jpeg', 'svg'];

function openDB() {
  return new Promise((res, rej) => {
    if (!('indexedDB' in window)) return rej(new Error('Sin IndexedDB'));
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function tx(mode, fn) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode); const st = t.objectStore(STORE);
    const req = fn(st); t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error);
  });
}
export const idb = {
  get: (k) => tx('readonly', s => s.get(k)).catch(() => undefined),
  put: (k, v) => tx('readwrite', s => s.put(v, k)),
  del: (k) => tx('readwrite', s => s.delete(k)),
};

// --- comprobar si existe un archivo en una carpeta (funciona también con file://) ---
function probeAudio(url) {
  return new Promise(res => {
    const a = new Audio(); let done = false;
    const fin = ok => { if (!done) { done = true; res(ok ? url : null); } };
    a.preload = 'metadata';
    a.onloadedmetadata = () => fin(true); a.onerror = () => fin(false);
    setTimeout(() => fin(false), 2500);
    a.src = url;
  });
}
function probeImage(url) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(url); i.onerror = () => res(null); i.src = url; setTimeout(() => res(null), 2500); });
}
async function firstFound(base, exts, probe) {
  for (const e of exts) { const u = await probe(`${base}.${e}`); if (u) return u; }
  return null;
}
const folderCache = {};
export function findAudioFile(name) {
  return folderCache['a:' + name] ??= firstFound(`audio/${name}`, AUDIO_EXT, probeAudio);
}
export function findLogoFile(name) {
  return folderCache['i:' + name] ??= firstFound(`logos/${name}`, IMG_EXT, probeImage);
}

// --- recursos por época (subidos > carpeta > nada) ---
const blobUrls = {};
async function fromIDB(key) {
  const rec = await idb.get(key);
  if (!rec || !rec.blob) return null;
  if (blobUrls[key]) URL.revokeObjectURL(blobUrls[key].url);
  blobUrls[key] = { url: URL.createObjectURL(rec.blob), name: rec.name };
  return blobUrls[key];
}
/** Devuelve {url, origen, nombre} o null. claves: tipo 'musica' | 'logo' */
export async function recursoEpoca(tipo, etapa) {
  const sub = await fromIDB(`${tipo}:${etapa.id}`);
  if (sub) return { url: sub.url, origen: 'subido', nombre: sub.name };
  const nombres = tipo === 'musica' ? etapa.archivosMusica : etapa.archivosLogo;
  for (const n of nombres || []) {
    const u = tipo === 'musica' ? await findAudioFile(n) : await findLogoFile(n);
    if (u) return { url: u, origen: 'carpeta', nombre: u };
  }
  return null;
}
export async function guardarSubido(tipo, etapaId, file) {
  await idb.put(`${tipo}:${etapaId}`, { blob: file, name: file.name, type: file.type, fecha: Date.now() });
}
export async function quitarSubido(tipo, etapaId) { await idb.del(`${tipo}:${etapaId}`); }

// ===================== Audio =====================
let ac = null;
export function audioCtx() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

// Sonidos sintetizados sencillos de respaldo (genéricos, no imitan ninguna sintonía)
export const synth = {
  tone(c, dest, t, f, dur, type = 'sine', vol = 0.2) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
  },
  noiseBuffer(c, secs = 2) {
    const b = c.createBuffer(1, c.sampleRate * secs, c.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b;
  },
  whoosh(c, dest, t, dur = 0.7, panFrom = -1, panTo = 1, vol = 0.35) {
    const src = c.createBufferSource(); src.buffer = synth.noiseBuffer(c, dur + 0.1);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3500, t + dur * 0.6); f.frequency.exponentialRampToValueAtTime(600, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    src.connect(f).connect(g);
    if (p) { p.pan.setValueAtTime(panFrom, t); p.pan.linearRampToValueAtTime(panTo, t + dur); g.connect(p).connect(dest); } else g.connect(dest);
    src.start(t); src.stop(t + dur + 0.1);
  },
  kick(c, dest, t, vol = 0.5) {
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(dest); o.start(t); o.stop(t + 0.35);
  },
  hat(c, dest, t, vol = 0.06) {
    const s = c.createBufferSource(); s.buffer = synth.noiseBuffer(c, 0.06);
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f).connect(g).connect(dest); s.start(t);
  },
  chord(c, dest, t, freqs, dur = 2.5, vol = 0.09) {
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(4000, t + 0.08); f.frequency.exponentialRampToValueAtTime(900, t + dur);
    f.connect(dest);
    for (const fr of freqs) for (const det of [-6, 6]) {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = det;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setTargetAtTime(0, t + dur * 0.5, dur * 0.25);
      o.connect(g).connect(f); o.start(t); o.stop(t + dur + 0.5);
    }
  },
  applause(c, dest, t, dur = 3.5, vol = 0.5) {
    const buf = synth.noiseBuffer(c, 0.03);
    const out = c.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(vol, t + 0.4);
    out.gain.setValueAtTime(vol, t + dur - 1); out.gain.exponentialRampToValueAtTime(0.0001, t + dur); out.connect(dest);
    const n = Math.floor(dur * 160);
    for (let i = 0; i < n; i++) {
      const s = c.createBufferSource(); s.buffer = buf;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 2200; f.Q.value = 0.8;
      const g = c.createGain(); g.gain.value = 0.25 + Math.random() * 0.5;
      const p = c.createStereoPanner ? c.createStereoPanner() : null;
      s.connect(f).connect(g); if (p) { p.pan.value = Math.random() * 2 - 1; g.connect(p).connect(out); } else g.connect(out);
      s.start(t + Math.random() * dur);
    }
  },
};

const FALLBACK = {
  acierto: (c, d, t) => { synth.tone(c, d, t, 880, 0.15, 'triangle', 0.2); synth.tone(c, d, t + 0.12, 1320, 0.3, 'triangle', 0.2); },
  fallo: (c, d, t) => { synth.tone(c, d, t, 220, 0.45, 'square', 0.08); synth.tone(c, d, t + 0.05, 165, 0.5, 'square', 0.06); },
  pasapalabra: (c, d, t) => { synth.tone(c, d, t, 660, 0.12, 'sine', 0.2); synth.tone(c, d, t + 0.13, 520, 0.2, 'sine', 0.2); },
  rosco: (c, d, t) => { for (let i = 0; i < 4; i++) synth.tone(c, d, t + i * 0.12, 500 + i * 120, 0.1, 'triangle', 0.12); },
  aplausos: (c, d, t) => synth.applause(c, d, t, 3, 0.4),
  tecla: (c, d, t) => synth.tone(c, d, t, 1200, 0.05, 'sine', 0.08),
  risas: (c, d, t) => { for (let i = 0; i < 6; i++) synth.tone(c, d, t + i * 0.13, 420 - i * 18, 0.1, 'sawtooth', 0.03); },
};

/** Reproduce un efecto: usa audio/<nombre>.mp3 si existe; si no, el respaldo sintetizado */
export async function sfx(nombre) {
  const pub = nombre === 'aplausos'; if (pub ? !cfg.publico : !cfg.sfx) return null;
  const vol = pub ? cfg.publicoVol : cfg.sfxVol;
  const url = await findAudioFile(nombre);
  if (url) { const a = new Audio(url); a.volume = Math.min(1, vol); a.play().catch(() => {}); return a; }
  const c = audioCtx(); const g = c.createGain(); g.gain.value = vol; g.connect(c.destination); FALLBACK[nombre]?.(c, g, c.currentTime + 0.01); setTimeout(() => g.disconnect(), 6000);
  return null;
}
