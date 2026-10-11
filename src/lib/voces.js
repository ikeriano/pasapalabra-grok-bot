// ===== Voces pregeneradas con Piper TTS (como el APK ¡Ahora Caigo! 3D) =====
// voz/<hash>.mp3 (frases del presentador, historia, monólogos…) y voz/q/<hash>.mp3 (preguntas) con
// voz/index.json y voz/q/index.json = { hash: duración_en_segundos }.
// hash = FNV-1a 32 bits (hex, 8 cifras) de "<voz>|<texto>" en UTF-8. El generador (gen_voces.py) usa la misma fórmula.
// Si la frase no está pregenerada (dinámica), se usa speechSynthesis con una voz MASCULINA es-ES si existe.
export function hashFrase(voz, texto) {
  const b = new TextEncoder().encode(voz + '|' + String(texto).trim()); let h = 0x811c9dc5;
  for (const x of b) { h ^= x; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
export const VOCES = {
  davefx: { id: 'davefx', modelo: 'es_ES-davefx-medium', licencia: 'CC0', sexo: 'm' },
  sharvard: { id: 'sharvard', modelo: 'es_ES-sharvard-medium', licencia: 'CC BY 3.0 (Univ. de Edimburgo)', sexo: 'm' },
  carlfm: { id: 'carlfm', modelo: 'es_ES-carlfm-x_low', licencia: 'dominio público', sexo: 'm' },
  ald: { id: 'ald', modelo: 'es_MX-ald-medium', licencia: 'Unlicense', sexo: 'm' },
  daniela: { id: 'daniela', modelo: 'es_AR-daniela-high', licencia: 'CC BY-SA 4.0 (corpus OpenSLR 61)', sexo: 'f' },
};
export const CREDITOS_VOCES = ['Voces sintéticas genéricas (Piper TTS)', ['Presentador: davefx (CC0)', 'Concursantes: sharvard (CC BY 3.0, Univ. de Edimburgo),', 'carlfm (dominio público), ald (Unlicense),', 'daniela (CC BY-SA 4.0, corpus OpenSLR 61)']];

const idx = { p: null, q: null }; let base = './';
const cargar = k => idx[k] || (idx[k] = fetch(`${base}voz/${k === 'q' ? 'q/' : ''}index.json`).then(r => r.ok ? r.json() : {}).catch(() => ({})));
let audioActual = null, ttsVoz = null, opts = { activo: () => true, volumen: () => 1, rapida: () => false, velocidad: () => 1 };
export function configurarVoces(o) { Object.assign(opts, o); if (o.base) base = o.base; cargar('p'); cargar('q'); }
function vozMasculina() {
  if (ttsVoz) return ttsVoz; const vs = speechSynthesis.getVoices(); if (!vs.length) return null;
  const es = vs.filter(v => /^es(-|_)ES/i.test(v.lang)), es2 = vs.filter(v => /^es/i.test(v.lang));
  const masc = /(male|hombre|pablo|jorge|[áa]lvaro|diego|enrique|carlos|ra[uú]l|antonio|juan|miguel|manuel|sergio|david|xavier|javier)/i, fem = /(female|mujer|helena|laura|lucia|luc[íi]a|m[oó]nica|paulina|elvira|conchita|sabina|marisol|esperanza|dalia|elena)/i;
  ttsVoz = es.find(v => masc.test(v.name)) || es.find(v => !fem.test(v.name)) || es2.find(v => masc.test(v.name)) || es[0] || es2[0] || null;
  return ttsVoz;
}
if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = () => { ttsVoz = null; };
export function callar() { if (audioActual) { audioActual.pause(); audioActual = null; } try { speechSynthesis.cancel(); } catch (e) { /* */ } }
/** Dice una frase. Resuelve al terminar (o enseguida si la voz está desactivada). */
export async function decir(texto, { voz = 'davefx', pregunta = false, pitch = 1, rate = 1, minMs = 0 } = {}) {
  callar(); if (!texto || !opts.activo()) return;
  const h = hashFrase(voz, texto); const ix = await cargar(pregunta ? 'q' : 'p'); const vel = opts.velocidad();
  if (ix[h] != null) {
    const a = new Audio(`${base}voz/${pregunta ? 'q/' : ''}${h}.mp3`); a.volume = Math.min(1, opts.volumen()); a.playbackRate = opts.rapida() ? 1.25 : 1; audioActual = a;
    return new Promise(res => { let ok = false; const fin = () => { if (!ok) { ok = true; if (audioActual === a) audioActual = null; res(); } }; a.onended = fin; a.onerror = fin; a.onpause = fin; a.play().catch(fin); setTimeout(fin, (ix[h] * 1000 + 1500) / (opts.rapida() ? 1.25 : 1)); });
  }
  if (typeof speechSynthesis === 'undefined') return new Promise(r => setTimeout(r, Math.max(minMs, texto.length * 55) / vel));
  return new Promise(res => {
    const u = new SpeechSynthesisUtterance(texto); u.lang = 'es-ES'; u.pitch = pitch * (VOCES[voz]?.sexo === 'f' ? 1.1 : 0.85); u.rate = rate * (opts.rapida() ? 1.25 : 1); u.volume = Math.min(1, opts.volumen());
    const v = vozMasculina(); if (v && VOCES[voz]?.sexo !== 'f') u.voice = v;
    let ok = false; const fin = () => { if (!ok) { ok = true; res(); } }; u.onend = fin; u.onerror = fin;
    setTimeout(fin, Math.max(3000, texto.length * 90)); speechSynthesis.speak(u);
  });
}
export const estaPregenerada = async (texto, voz = 'davefx', pregunta = false) => (await cargar(pregunta ? 'q' : 'p'))[hashFrase(voz, texto)] != null;
