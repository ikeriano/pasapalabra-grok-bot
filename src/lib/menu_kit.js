// ===== Plantilla de menú «estilo APK ¡Ahora Caigo! 3D» — piezas reutilizables =====
// Uso (ES module): import * as M from './menu_kit.js';  + <link rel="stylesheet" href="menu.css">
// Cada juego conserva SU plató 3D detrás (#menu es transparente) y solo cambia textos, logo e icono (--m-icono).
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let sonido = () => {}; export const setSonidoTecla = f => { sonido = f; };
const stop = e => e && e.stopPropagation();

/** Botón píldora con icono circular + título + subtítulo. cls: '' (azul) | 'gold' | 'inst' */
export function mbtn(t, sub, cls, fn) { const b = document.createElement('button'); b.className = 'mbtn ' + (cls || ''); b.innerHTML = `<span class="fp"></span><span>${t}${sub ? `<small>${sub}</small>` : ''}</span>`; b.onclick = e => { stop(e); sonido(); fn(); }; return b; }
export function volver(fn) { const b = document.createElement('button'); b.className = 'tbtn back'; b.textContent = '⟵ Volver'; b.onclick = e => { stop(e); sonido(); fn(); }; return b; }
export function h2(t) { const e = document.createElement('h2'); e.textContent = t; return e; }
export function nota(t, cls = 'onote') { const p = document.createElement('p'); p.className = cls; p.textContent = t; return p; }
/** Fila de opciones: etiqueta + controles */
export function fila(label, ...els) { const r = document.createElement('div'); r.className = 'orow'; const l = document.createElement('label'); l.textContent = label; r.append(l, ...els); return r; }
/** Interruptor Sí/No sobre cfg[k] */
export function siNo(cfg, k, onChange) { const b = document.createElement('button'); const p = () => { b.className = 'tbtn' + (cfg[k] ? ' sel' : ''); b.textContent = cfg[k] ? 'Sí' : 'No'; }; p(); b.onclick = e => { stop(e); cfg[k] = !cfg[k]; p(); sonido(); onChange && onChange(cfg[k]); }; return b; }
/** Grupo de botones excluyentes sobre cfg[k]; lista = [[valor, texto], …] */
export function opciones(cfg, k, lista, onChange) { return lista.map(([v, t]) => { const b = document.createElement('button'); b.className = 'tbtn' + (cfg[k] === v ? ' sel' : ''); b.textContent = t; b.dataset.v = v; b.onclick = e => { stop(e); cfg[k] = v; sonido(); b.parentNode.querySelectorAll('.tbtn[data-v]').forEach(x => x.classList.toggle('sel', x.dataset.v === v)); onChange && onChange(v); }; return b; }); }
/** Deslizador 0..1 sobre cfg[k] */
export function slider(cfg, k, onInput, onChange) { const r = document.createElement('input'); r.type = 'range'; r.min = 0; r.max = 100; r.value = Math.round((cfg[k] ?? 1) * 100); r.oninput = () => { cfg[k] = r.value / 100; onInput && onInput(cfg[k]); }; r.onchange = () => onChange && onChange(cfg[k]); r.onpointerdown = stop; return r; }
/** Recuadro con borde amarillo (sección): título + contenido */
export function bloque(titulo, ...els) { const d = document.createElement('div'); d.className = 'ocustom'; const t = document.createElement('div'); t.className = 'olabel'; t.textContent = titulo; d.append(t, ...els.filter(Boolean)); return d; }
export function linea(html, cls = 'oname') { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return d; }
/** Fila de botones (tbtn); items = [{t, sel, full, fn, disabled, file:{accept, onFile}}] */
export function botones(items) { const r = document.createElement('div'); r.className = 'obtns'; for (const it of items) { let b; if (it.file) { b = document.createElement('label'); const i = document.createElement('input'); i.type = 'file'; i.accept = it.file.accept; i.onclick = stop; i.onchange = () => i.files[0] && it.file.onFile(i.files[0]); b.append(document.createTextNode(it.t), i); } else { b = document.createElement('button'); b.textContent = it.t; b.disabled = !!it.disabled; b.onclick = e => { stop(e); sonido(); it.fn && it.fn(b); }; } b.className = 'tbtn' + (it.sel ? ' sel' : '') + (it.full ? ' full' : ''); r.appendChild(b); } return r; }
/** Campo de texto */
export function texto(cfg, k, ph, max, onInput) { const i = document.createElement('input'); i.className = 'otext'; i.value = cfg[k] || ''; i.placeholder = ph; i.maxLength = max; i.oninput = () => { cfg[k] = i.value.trim(); onInput && onInput(cfg[k]); }; i.onkeydown = stop; i.onpointerdown = stop; return i; }
/** Rejilla «Programa especial»: temas = {id: {name, emoji}} */
export function rejillaTemas(temas, actual, onPick) { const g = document.createElement('div'); g.className = 'themes'; for (const [k, v] of Object.entries(temas)) { const b = document.createElement('button'); b.className = 'tbtn' + (k === actual ? ' sel' : ''); b.innerHTML = `<span>${v.emoji}</span>${esc(v.name)}`; b.onclick = e => { stop(e); sonido(); onPick(k); }; g.appendChild(b); } return g; }

/** Pantalla de título (logo centrado + subtítulo + «Toca para empezar») */
export function pantallaTitulo(menu, { logo, sub = 'El juego', tap = 'Toca para empezar', onStart }) {
  menu.classList.remove('hidden'); menu.innerHTML = `<div class="title"><img class="tlogo" src="${logo}" alt=""><div class="tsub">${esc(sub)}</div><div class="ttap">${esc(tap)}</div></div>`;
  const go = e => { stop(e); menu.removeEventListener('pointerup', go); removeEventListener('keydown', go); onStart(); };
  setTimeout(() => { menu.addEventListener('pointerup', go); addEventListener('keydown', go); }, 200);
}
/** Estructura de menú: logo + insignia a la izquierda, versión abajo, columna a la derecha. Devuelve la columna. */
export function pantallaMenu(menu, { logo, tag, version, cls = '' }) {
  menu.classList.remove('hidden'); menu.innerHTML = '';
  const box = document.createElement('div'); box.className = 'mbox';
  const l = document.createElement('div'); l.className = 'logo'; l.innerHTML = `<img class="mlogo" src="${logo}" alt=""><div class="mtag">${esc(tag)}</div>`;
  const col = document.createElement('div'); col.className = 'col ui ' + cls;
  const v = document.createElement('div'); v.className = 'mver'; v.textContent = 'v' + version;
  box.append(v, l, col); menu.appendChild(box); return col;
}
/** Mapa de «atrás» (Escape / botón atrás de Android) */
export function navegacionAtras(mapa, getPantalla, ir) { const f = () => { const m = document.querySelector('#menu .modal'); if (m) { m.remove(); return true; } const d = mapa[getPantalla()]; if (d) { ir(d); return true; } return false; }; addEventListener('keydown', e => { if (e.key === 'Escape') f(); }); return f; }
/** Modal sencillo */
export function modal(menu, html) { const m = document.createElement('div'); m.className = 'modal ui'; m.innerHTML = `<div class="mcard">${html}<button class="tbtn back" data-cerrar>Cerrar</button></div>`; menu.appendChild(m); m.querySelector('[data-cerrar]').onclick = e => { stop(e); m.remove(); }; return m; }

// ===== Modo historia (tarjeta azul arriba a la derecha + subtítulo «EL PRESENTADOR» + ◄ ⏭ ►) =====
/** Crea la interfaz y devuelve {mostrar(i, cap), subtitulo(t), on(handlers), cerrar()}. cap = {emoji, t, rows:[[etiqueta, dato]]} */
export function interfazHistoria({ total, presentador = 'El presentador', padre = document.body }) {
  document.getElementById('historia')?.remove();
  const s = document.createElement('div'); s.id = 'historia'; s.className = 'ui';
  s.innerHTML = `<div class="hcard" id="hCard"></div><div class="hsub" id="hSub"><b>${esc(presentador)}</b><span></span></div>
    <div class="hctl"><button class="tbtn" id="hPrev">◄ Anterior</button><button class="tbtn" id="hSkip">⏭ Saltar</button><button class="tbtn sel" id="hNext">Siguiente ►</button></div>
    <div class="hdots" id="hDots">${Array.from({ length: total }, (_, i) => `<i data-i="${i}"></i>`).join('')}</div>`;
  padre.appendChild(s); const q = id => s.querySelector('#' + id);
  return {
    el: s,
    mostrar(i, cap) { const c = q('hCard'); c.classList.remove('in'); c.innerHTML = `<div class="hhead">${i >= 0 ? `<span class="hnum">${i + 1}/${total}</span>` : ''}<span class="hemo">${cap.emoji || ''}</span><b>${esc(cap.t)}</b></div>` + (cap.rows || []).map(([k, v]) => `<div class="hrow"><small>${esc(k)}</small><span>${esc(v)}</span></div>`).join(''); c.offsetWidth; c.classList.add('in'); s.querySelectorAll('#hDots i').forEach((d, j) => d.classList.toggle('on', j === i)); q('hPrev').disabled = i <= 0; q('hNext').textContent = i >= total - 1 ? 'Terminar ►' : 'Siguiente ►'; },
    subtitulo(t) { q('hSub').querySelector('span').textContent = t; q('hSub').classList.toggle('vacio', !t); },
    on({ prev, next, skip, ir }) { q('hPrev').onclick = e => { stop(e); sonido(); prev(); }; q('hNext').onclick = e => { stop(e); sonido(); next(); }; q('hSkip').onclick = e => { stop(e); skip(); }; q('hSub').onclick = e => { stop(e); skip(); }; s.querySelectorAll('#hDots i').forEach(d => d.onclick = e => { stop(e); ir(+d.dataset.i); }); },
    cerrar() { s.remove(); },
  };
}

// ===== Créditos (como el APK: «⟵ Volver», «Créditos» y bloque con secciones en amarillo) =====
/** bloques = [[titulo, [lineas…]], …] → HTML para meter en un .mtext.creditos */
export function htmlCreditos(bloques) { return bloques.map(([t, l]) => `<p><b>${esc(t)}</b><br>${l.map(esc).join('<br>')}</p>`).join(''); }
/** Pinta la pantalla de créditos en la columna del menú */
export function pantallaCreditos(col, { bloques, extraHTML = '', onVolver }) { col.append(volver(onVolver), h2('Créditos')); const d = document.createElement('div'); d.className = 'mtext creditos'; d.innerHTML = htmlCreditos(bloques) + extraHTML; col.append(d); return d; }
