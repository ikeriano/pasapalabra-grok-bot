// Grafismos (HUD 2D sobre el 3D) de cada época. Diseño propio inspirado en la disposición,
// formas y colores de los rótulos del programa, sin logos ni recursos gráficos reales.
// Los concursantes son los avatares virtuales del juego, retratados con una cámara 3D.
import * as THREE from 'three';
import { figure, ROSCO_LETRAS } from '../lib/helpers.js';

export const estiloDe = id => ({ 'antena3-2000': 'arena', 'telecinco-2007': 't5', 'telecinco-2018': 'azul', 'antena3-2020': 'azul', 'rueda-letra': 'rueda' }[id] || 'azul');
const COL = { arena: ['#f07a10', '#2a6fe0'], t5: ['#ff7a00', '#1f5fe0'], azul: ['#ff8a00', '#1a64f0'], rueda: ['#a43ee8', '#22c3d6'] };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Retratos de los avatares (render 3D offscreen, cacheado) ----------
let pr = null; const cacheRetratos = {};
export function retrato({ body = 0x3355aa, hair = 0x2a1a10, skin = 0xc8a07a, fondo = ['#1a3aa0', '#4f8cff'] } = {}) {
  const key = [body, hair, skin, ...fondo].join('-'); if (cacheRetratos[key]) return cacheRetratos[key];
  try {
    if (!pr) {
      const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 400;
      const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
      r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
      const cam = new THREE.PerspectiveCamera(30, 480 / 400, 0.1, 50); cam.position.set(0, 1.42, 2.1); cam.lookAt(0, 1.3, 0);
      pr = { r, cam };
    }
    const scene = new THREE.Scene();
    // fondo de plató desenfocado (bokeh) con los colores de la época
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, fondo[1]); gr.addColorStop(1, fondo[0]); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 26; i++) { const x = Math.random() * 256, y = Math.random() * 180, rr = 6 + Math.random() * 22; const rg = g.createRadialGradient(x, y, 0, x, y, rr); rg.addColorStop(0, 'rgba(255,255,255,0.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
    const bt = new THREE.CanvasTexture(c); bt.colorSpace = THREE.SRGBColorSpace; scene.background = bt;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 1.4));
    const k = new THREE.DirectionalLight(0xffffff, 2.2); k.position.set(1.5, 2.5, 3); scene.add(k);
    const f = figure({ body, hair, skin }); scene.add(f);
    // retrato de busto: hombros más anchos y brazos pegados
    f.children[0].scale.set(1.45, 1, 0.8); f.children[3].visible = f.children[4].visible = false;
    const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 12), new THREE.MeshStandardMaterial({ color: skin })); cuello.position.set(0, 1.36, 0); scene.add(cuello);
    // rasgos sencillos (personaje original): ojos y sonrisa
    const ojoM = new THREE.MeshStandardMaterial({ color: 0x1a1410 });
    for (const x of [-0.045, 0.045]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), ojoM); o.position.set(x, 1.52, 0.122); scene.add(o); }
    const boca = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 6, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x7a2a2a })); boca.rotation.z = Math.PI; boca.position.set(0, 1.465, 0.124); scene.add(boca);
    pr.r.render(scene, pr.cam);
    const url = pr.r.domElement.toDataURL('image/jpeg', 0.88);
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); bt.dispose();
    return (cacheRetratos[key] = url);
  } catch (e) { return ''; }
}

// ---------- piezas SVG ----------
const melones = (color) => {
  const plata = color === 'plata'; const c1 = plata ? '#f4f6fa' : color === 'rojo' ? '#ff5050' : '#5aa0ff', c2 = plata ? '#8a92a0' : color === 'rojo' ? '#9a0a0a' : '#0a2a9a';
  const id = 'm' + color + Math.random().toString(36).slice(2, 6);
  return `<svg viewBox="0 0 200 110" class="hud-pulsador"><defs><radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="0.25" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>
    <rect x="20" y="88" width="160" height="18" rx="6" fill="#2a2e38"/><ellipse cx="62" cy="70" rx="48" ry="40" fill="url(#${id})"/><ellipse cx="138" cy="70" rx="48" ry="40" fill="url(#${id})"/></svg>`;
};
const bombilla = (color) => {
  const c1 = color === 'rojo' ? '#ff6a6a' : '#6aa8ff', c2 = color === 'rojo' ? '#b00010' : '#0a2aa0'; const id = 'b' + color + Math.random().toString(36).slice(2, 6);
  return `<svg viewBox="0 0 120 170" class="hud-pulsador bombilla"><defs><radialGradient id="${id}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="0.3" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>
    <path d="M60 6 C26 6 8 32 8 58 C8 82 26 96 34 112 L86 112 C94 96 112 82 112 58 C112 32 94 6 60 6 Z" fill="url(#${id})" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
    <rect x="34" y="114" width="52" height="10" rx="3" fill="#cfd4dc"/><rect x="36" y="126" width="48" height="10" rx="3" fill="#aab0ba"/><rect x="38" y="138" width="44" height="10" rx="3" fill="#cfd4dc"/><rect x="26" y="150" width="68" height="16" rx="5" fill="#8a909a"/></svg>`;
};

// Pulsador cilíndrico gris de Rueda la letra: círculo y anillos del color del concursante (morado / turquesa)
const cilindro = (lado) => {
  const c = lado ? '#2cd0e4' : '#b04cf0', c2 = lado ? '#7ff0ff' : '#e0a0ff', id = 'cl' + lado + Math.random().toString(36).slice(2, 6);
  return `<svg viewBox="0 0 140 220" class="hud-pulsador cil"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#3a3d46"/><stop offset=".35" stop-color="#7a7e88"/><stop offset=".7" stop-color="#5a5d66"/><stop offset="1" stop-color="#2e3038"/></linearGradient></defs>
    <ellipse cx="70" cy="204" rx="66" ry="12" fill="#3a3d46"/><rect x="4" y="190" width="132" height="14" fill="#4a4d56"/><ellipse cx="70" cy="190" rx="66" ry="12" fill="#5a5d66"/><rect x="4" y="196" width="132" height="4" fill="${c}" opacity=".9"/>
    <rect x="24" y="30" width="92" height="160" fill="url(#${id})"/><ellipse cx="70" cy="190" rx="46" ry="8" fill="#2a2c34"/>
    <rect x="24" y="22" width="92" height="16" fill="${c}"/><rect x="24" y="22" width="92" height="5" fill="${c2}"/><ellipse cx="70" cy="22" rx="46" ry="8" fill="#6a6d76"/>
    <circle cx="70" cy="104" r="34" fill="${c}"/><circle cx="62" cy="94" r="12" fill="${c2}" opacity=".45"/></svg>`;
};

// ---------- HUD ----------
class HUD {
  constructor() {
    this.el = document.getElementById('hud');
    if (!this.el) { this.el = document.createElement('div'); this.el.id = 'hud'; document.body.appendChild(this.el); }
    this.modo = null; this.estilo = 'azul';
  }
  set(estilo) { this.estilo = estilo || 'azul'; }
  limpiar() { this.el.innerHTML = ''; this.el.className = ''; this.modo = null; this.rsoloLado = null; document.body.classList.remove('hud-split'); }
  _fondo(lado) { const c = COL[this.estilo][lado]; return lado ? (this.estilo === 'rueda' ? ['#0a5a7a', '#3fd0f0'] : ['#0a2a8a', '#3f7dff']) : this.estilo === 'rueda' ? ['#3a0a6a', '#a050e0'] : ['#8a3a00', '#ffa040']; }
  _retratoLado(G, lado) {
    const e = G.equipos[lado];
    const est = lado ? { body: this.estilo === 'rueda' ? 0x6a1a2a : 0x1f5fe0, hair: 0x3a2412 } : { body: this.estilo === 'rueda' ? 0x8a3ad0 : 0xff7a1a, hair: 0x2a1a10 };
    return retrato({ ...est, fondo: this._fondo(lado) });
  }
  _badge(lado, nombre) { return `<div class="hud-badge l${lado}">${esc(nombre)}</div>`; }

  /** Bote acumulado: rótulo amarillo y cifra dorada con relieve */
  async bote(cantidad, ms = 3200) {
    this.el.className = 'hud-' + this.estilo;
    this.el.innerHTML = `<div class="hud-bote"><div class="hud-bote-r">BOTE ACUMULADO</div><div class="hud-bote-n">${cantidad.toLocaleString('es-ES')} €</div></div>`;
    await new Promise(r => setTimeout(r, ms)); if (!this.modo) this.el.innerHTML = '';
  }

  /** Pantalla partida de duelo (El pulsador / La pista musical / Cantando espero) */
  duelo(G, { texto = '', pista = null, activo = null, ecualizador = false, nombres = ['TÚ', 'RIVAL'], marcadores = null } = {}) {
    this.modo = 'duelo'; document.body.classList.add('hud-split');
    const st = this.estilo; this.el.className = 'hud-' + st + ' hud-duelo';
    const mk = marcadores || [G.equipos[0].seg, G.equipos[1].seg];
    const puls = lado => st === 'arena' ? melones('plata') : st === 't5' ? melones(lado ? 'azul' : 'rojo') : st === 'rueda' ? cilindro(lado) : bombilla(lado ? 'azul' : 'rojo');
    const lado = l => `<div class="hud-cam l${l} ${activo === l ? 'activo' : ''}"><img src="${this._retratoLado(G, l)}" alt="">${this._badge(l, nombres[l])}<div class="hud-puls-w">${puls(l)}</div>
      ${st === 'azul' || st === 'rueda' ? `<div class="hud-marc-c l${l}"><span>${mk[l]}</span></div>` : ''}</div>`;
    let centro = '';
    if (st === 'azul' || st === 'rueda') centro = `<div class="hud-pista ${ecualizador ? 'eq' : ''}">${ecualizador ? '<i class="eqL"><b></b><b></b><b></b><b></b><b></b></i><i class="eqR"><b></b><b></b><b></b><b></b><b></b></i>' : ''}<span>${pista ?? ''}</span></div>${texto ? `<div class="hud-texto-azul">${esc(texto)}</div>` : ''}`;
    else centro = `<div class="hud-barra"><div class="hud-mk l0">${mk[0]}</div><div class="hud-franja">${esc(String(texto).toUpperCase())}${pista ? ` <small>· PISTA ${pista}</small>` : ''}</div><div class="hud-mk l1">${mk[1]}</div></div>${st === 'arena' ? '<div class="hud-rotulo-negro">PASAPALABRA</div>' : ''}`;
    this.el.innerHTML = `${st === 'arena' ? '<div class="hud-arena-marco"></div>' : ''}<div class="hud-split-w">${lado(0)}${lado(1)}</div>${centro}`;
  }

  /** Rosco a pantalla partida */
  rosco(G, est, turno, { nombres = ['TÚ', 'RIVAL'] } = {}) {
    if (turno === 'H' || turno === 'R') return this.roscoSolo(G, turno === 'H' ? est.H : est.R, turno === 'H' ? 0 : 1, { nombre: nombres[turno === 'H' ? 0 : 1] });
    this.modo = 'rosco'; document.body.classList.add('hud-split');
    const st = this.estilo; this.el.className = 'hud-' + st + ' hud-rosco';
    const lado = (l, s) => {
      const n = s.set.length;
      const bolas = s.set.map((it, i) => { const a = -Math.PI / 2 + i / n * Math.PI * 2; const cls = s.e[i] === 'ok' ? 'ok' : s.e[i] === 'ko' ? 'ko' : (turno === (l ? 'R' : 'H') && i === s.i) ? 'cur' : '';
        return `<span class="hud-l ${cls}" style="left:${50 + Math.cos(a) * 40}%;top:${52 + Math.sin(a) * 40}%">${esc(it[0])}</span>`; }).join('');
      const ac = s.e.filter(x => x === 'ok').length;
      return `<div class="hud-cam l${l} ${turno === (l ? 'R' : 'H') ? 'activo' : ''}"><img src="${this._retratoLado(G, l)}" alt="">${this._badge(l, nombres[l])}
        <div class="hud-rosco-l">${bolas}</div><div class="hud-tiempo l${l}"><span class="t">${Math.ceil(s.t)}</span><span class="a">${ac}</span></div></div>`;
    };
    this.el.innerHTML = `${st === 'arena' ? '<div class="hud-arena-marco"></div>' : ''}<div class="hud-split-w">${lado(0, est.H)}${lado(1, est.R)}</div>${st === 'arena' ? '<div class="hud-rotulo-negro">PASAPALABRA</div>' : ''}`;
  }
  tiempoRosco(l, t) { const e = this.el.querySelector(`.hud-tiempo.l${l} .t`) || (this.rsoloLado === l ? this.el.querySelector('.rs-t .t, .rlf-t .t') : null); if (e) e.textContent = Math.ceil(t); }

  /** Una de cuatro / Una de dos (2018-2020s): opciones en píldoras a la derecha, franja redondeada con la pregunta y círculo de tiempo */
  opciones4(G, pregunta, ops, tiempo, { marca = null, ok = null } = {}) {
    this.modo = 'op4'; document.body.classList.add('hud-split'); this.el.className = 'hud-' + this.estilo + ' hud-op4';
    this.el.innerHTML = `<div class="op4-ops n${ops.length}">${ops.map((o, i) => `<div class="op4-p ${marca === i ? (ok ? 'ok' : 'ko') : ''}">${esc(String(o).toUpperCase())}</div>`).join('')}</div>
      <div class="op4-bar"><div class="op4-t"><span>${Math.ceil(tiempo)}</span></div><div class="op4-q">${esc(String(pregunta).toUpperCase())}</div></div>`;
  }
  tiempoOp(t) { const e = this.el.querySelector('.op4-t span'); if (e) e.textContent = Math.ceil(t); }

  /** Letra a letra (Telecinco): panel naranja con las palabras, número grande de segundos y píldoras con el panel */
  letraALetra(G, { panel = [], hechas = new Set(), actual = -1, tiempo = 0 } = {}) {
    this.modo = 'lal'; document.body.classList.add('hud-split'); this.el.className = 'hud-' + this.estilo + ' hud-lal';
    this.el.innerHTML = `<div class="lal-panel">${panel.map((w, i) => `<div class="${hechas.has(i) ? 'ok' : i === actual ? 'cur' : ''}">${hechas.has(i) ? esc(w.toUpperCase()) : i === actual ? '?'.repeat(Math.min(w.length, 9)) : '· · ·'}</div>`).join('')}</div>
      <div class="lal-num">${Math.ceil(tiempo)}</div>
      <div class="lal-pills">${panel.map((w, i) => `<div class="${hechas.has(i) ? 'ok' : ''}"><span>${hechas.has(i) ? esc(w.toUpperCase()) : w.length + ' LETRAS'}</span><i></i></div>`).join('')}</div>`;
  }
  tiempoLal(t) { const e = this.el.querySelector('.lal-num'); if (e) e.textContent = Math.ceil(t); }

  /** ¿Qué es qué? / La palabra imposible (Telecinco): panel azul con marco cruzado, palabras comunes abajo y círculo de tiempo */
  queEsQue({ raras = [], comunes = [], hechas = new Set(), actual = -1, tiempo = 0 } = {}) {
    this.modo = 'qeq'; document.body.classList.add('hud-split'); this.el.className = 'hud-' + this.estilo + ' hud-qeq';
    this.el.innerHTML = `<div class="qeq-panel ${raras.length > 5 ? 'dos' : ''}"><i class="h1"></i><i class="h2"></i><i class="v1"></i><i class="v2"></i>${raras.map(w => `<div>${esc(String(w).toUpperCase())}</div>`).join('')}</div>
      <div class="qeq-com">${comunes.map((w, i) => `<div class="${hechas.has(i) ? 'ok' : i === actual ? 'cur' : ''}">${esc(String(w).toUpperCase())}</div>`).join('')}</div><div class="qeq-t">${Math.ceil(tiempo)}</div>`;
  }
  tiempoQeq(t) { const e = this.el.querySelector('.qeq-t'); if (e) e.textContent = Math.ceil(t); }

  /** Rosco individual a pantalla completa (turno de un concursante) */
  roscoSolo(G, s, lado, { nombre = '' } = {}) {
    if (this.estilo === 'rueda') return this.ruedaFinal(G, s, lado, { nombre });
    this.modo = 'rosco'; document.body.classList.add('hud-split'); this.el.className = 'hud-' + this.estilo + ' hud-rsolo';
    const n = s.set.length;
    const bolas = s.set.map((it, i) => { const a = -Math.PI / 2 + i / n * Math.PI * 2; const cls = s.e[i] === 'ok' ? 'ok' : s.e[i] === 'ko' ? 'ko' : i === s.i ? 'cur' : '';
      return `<span class="rs-l ${cls}" style="left:${50 + Math.cos(a) * 38}%;top:${50 + Math.sin(a) * 41}%">${esc(it[0])}</span>`; }).join('');
    const ac = s.e.filter(x => x === 'ok').length;
    this.el.innerHTML = `<div class="rs-fondo"><img src="${this._retratoLado(G, lado)}" alt=""></div><div class="rs-w">${bolas}</div>${nombre ? `<div class="rs-nom">${esc(nombre)}</div>` : ''}
      <div class="rs-t"><span class="t">${Math.ceil(s.t)}</span></div><div class="rs-a">${ac}</div>`;
    this.rsoloLado = lado;
  }


  /** ¿Dónde están?: panel 3x3 de cápsulas con números o palabras y círculo de tiempo */
  capsulas(palabras, visibles, tiempo = null, { titulo = '' } = {}) {
    this.modo = 'capsulas'; document.body.classList.remove('hud-split');
    this.el.className = 'hud-' + this.estilo + ' hud-caps';
    this.el.innerHTML = `<div class="hud-caps-w">${palabras.map((w, i) => `<div class="hud-cap ${visibles.has(i) ? '' : 'num'}">${visibles.has(i) ? esc(w) : i + 1}</div>`).join('')}</div>
      ${tiempo != null ? `<div class="hud-caps-t">${Math.ceil(tiempo)}</div>` : ''}${titulo ? `<div class="hud-caps-tit">${esc(titulo)}</div>` : ''}`;
  }
  tiempoCaps(t) { const e = this.el.querySelector('.hud-caps-t'); if (e) e.textContent = Math.ceil(t); }

  /** Rótulo genérico inferior con marcadores de equipo y la pregunta (resto de pruebas) */
  rotulo(G, texto, { titulo = '' } = {}) {
    if (['duelo', 'rosco', 'capsulas', 'op4', 'lal', 'qeq'].includes(this.modo)) return;
    this.modo = null; const st = this.estilo; this.el.className = 'hud-' + st + ' hud-gen'; document.body.classList.add('hud-split');
    this.el.innerHTML = `<div class="hud-gen-w">${titulo ? `<div class="hud-gen-tit">${esc(titulo)}</div>` : ''}<div class="hud-barra"><div class="hud-mk l0">${G.equipos[0].seg}</div><div class="hud-franja">${esc(String(texto).toUpperCase())}</div><div class="hud-mk l1">${G.equipos[1].seg}</div></div></div>`;
  }

  // ================= Rueda la letra (2026): grafismos copiados de las capturas del programa =================
  _rl(cls, split = true) { document.body.classList.toggle('hud-split', split); this.el.className = 'hud-rueda hud-rl ' + cls; }
  /** La oportunidad: columna central A-J en bolas azules unidas por una línea y aros a cada lado para el avance de cada concursante */
  ruedaOportunidad(G, { letras = [], actual = -1, aH = 0, aR = 0, turno = 0 } = {}) {
    this.modo = 'rl-op'; this._rl('rl-op');
    const filas = letras.map((L, i) => `<div class="rlo-f ${i === actual ? 'cur' : ''}"><i class="rlo-a l0 ${i < aH ? 'on' : ''} ${i === actual && turno === 0 ? 'turno' : ''}"></i><b class="rlo-c"></b><span class="rlo-b">${esc(L)}</span><b class="rlo-c"></b><i class="rlo-a l1 ${i < aR ? 'on' : ''} ${i === actual && turno === 1 ? 'turno' : ''}"></i></div>`).join('');
    this.el.innerHTML = `<div class="rl-dos"><img src="${this._retratoLado(G, 0)}" alt=""><img src="${this._retratoLado(G, 1)}" alt=""></div>
      <div class="rlo-col"><div class="rlo-linea"></div><div class="rlo-tapa"></div>${filas}</div>`;
  }
  /** Lista vertical de píldoras (¡He dicho! 10 / Con dos palabras 12) o panel 4x4 de sílabas (Palabras ocultas) + barra inferior con tiempo.
   *  lado 0 = morado a la izquierda, 1 = turquesa a la derecha. items: [{t, e:'cur'|'ok'|'off'}] */
  ruedaLista(G, { lado = 0, items = [], grid = false, texto = '', tiempo = null, total = 90, apuesta = null, conseguido = null } = {}) {
    this.modo = 'rl-lista'; this._rl('rl-lista l' + lado);
    const lista = grid ? `<div class="rl-grid">${items.map(x => `<div class="${x.e || ''} ${String(x.t).length >= 4 ? 'c4' : String(x.t).length === 3 ? 'c3' : ''}">${esc(x.t)}</div>`).join('')}</div>`
      : `<div class="rl-pills ${items.length > 10 ? 'n12' : ''}">${items.map(x => `<div class="${x.e || ''}">${esc(String(x.t).toUpperCase())}</div>`).join('')}</div>`;
    const ap = apuesta != null ? `<div class="rl-ap"><div><small>APUESTA</small><b>${apuesta}</b></div><div><small>CONSEGUIDO</small><b class="cons">${conseguido ?? 0}</b></div></div>` : '';
    this._rlTotal = total;
    this.el.innerHTML = `${lista}<div class="rl-barra ${apuesta != null ? 'corta' : ''}">${this._rlReloj(tiempo)}<div class="rl-txt">${esc(String(texto).toUpperCase())}</div>${ap}</div>`;
  }
  _rlReloj(t) { const p = t == null ? 100 : Math.max(0, Math.min(100, t / (this._rlTotal || 90) * 100)); return `<div class="rl-t" style="--p:${p}%"><span>${t == null ? '' : Math.ceil(t)}</span></div>`; }
  tiempoRl(t) { const e = this.el.querySelector('.rl-t'); if (!e) return; e.style.setProperty('--p', Math.max(0, Math.min(100, t / (this._rlTotal || 90) * 100)) + '%'); e.querySelector('span').textContent = Math.ceil(t); }
  conseguidoRl(n) { const e = this.el.querySelector('.rl-ap .cons'); if (e) e.textContent = n; }
  /** La Rueda (final): letras en círculos azules alrededor del concursante, caja de aciertos y círculo grande con el tiempo */
  ruedaFinal(G, s, lado, { nombre = '' } = {}) {
    this.modo = 'rosco'; this._rl('rl-final l' + lado);
    const n = s.set.length;
    const bolas = s.set.map((it, i) => { const a = -Math.PI / 2 + i / n * Math.PI * 2; const cls = s.e[i] === 'ok' ? 'ok' : s.e[i] === 'ko' ? 'ko' : i === s.i ? 'cur' : '';
      return `<span class="rlf-l ${cls}" style="left:${50 + Math.cos(a) * 46}%;top:${50 + Math.sin(a) * 46}%">${esc(it[0])}</span>`; }).join('');
    const ac = s.e.filter(x => x === 'ok').length;
    this.el.innerHTML = `<div class="rlf-fondo"><img src="${this._retratoLado(G, lado)}" alt=""></div><div class="rlf-w">${bolas}</div>${nombre ? `<div class="rlf-nom">${esc(nombre)}</div>` : ''}
      <div class="rlf-ab"><div class="rlf-a">${ac}</div><div class="rlf-t"><span class="t">${Math.ceil(s.t)}</span></div></div>`;
    this.rsoloLado = lado;
  }
  /** Banda LED superior del plató (p. ej. «¡HE DICHO!») */
  ruedaLed(texto, ms = 2600) {
    this.modo = 'rl-led'; this._rl('rl-ledw', false);
    this.el.innerHTML = `<div class="rl-led"><span>${esc(texto)}</span><span>${esc(texto)}</span><span>${esc(texto)}</span></div>`;
    return new Promise(r => setTimeout(r, ms / (window.__VEL || 1)));
  }
}
let _hud = null;
export const hud = () => (_hud || (_hud = new HUD()));
export const HUD_CSS = `
/* ---- Una de cuatro / Una de dos ---- */
.hud-op4 .op4-ops{position:absolute;right:4vw;top:22vh;display:grid;grid-template-columns:1fr 1fr;gap:1.4vh 1.2vw;width:42vw}.hud-op4 .op4-ops.n2{grid-template-columns:1fr 1fr;width:34vw}
.op4-p{background:linear-gradient(#2f7dff,#0a46d8);border:2px solid #cfe4ff;border-radius:999px;padding:1.1vh 1vw;text-align:center;font:800 clamp(11px,1.5vw,20px) Arial;color:#fff;box-shadow:0 3px 10px rgba(0,0,40,.5)}
.op4-p.ok{background:linear-gradient(#2fd36a,#0f8a3a)}.op4-p.ko{background:linear-gradient(#ff5050,#b01010)}
.op4-bar{position:absolute;left:3vw;right:6vw;bottom:36vh;display:flex;align-items:center}
.op4-t{width:8.5vw;height:8.5vw;max-width:110px;max-height:110px;border-radius:50%;background:radial-gradient(#1e5fe8 60%,#0a2a8a);border:4px solid #fff;display:grid;place-items:center;font:900 clamp(20px,3.6vw,44px) Arial;color:#fff;z-index:2;flex:none;box-shadow:0 0 0 4px #1e5fe8,0 4px 14px #0008}
.op4-q{flex:1;margin-left:-2vw;padding:1.4vh 2vw 1.4vh 3.5vw;background:linear-gradient(#2f7dff,#0a46d8);border:2px solid #cfe4ff;border-radius:0 999px 999px 0;font:800 clamp(11px,1.5vw,20px)/1.3 Arial;color:#fff;text-align:center}
.hud-t5 .op4-p,.hud-t5 .op4-q,.hud-arena .op4-p,.hud-arena .op4-q{background:linear-gradient(#ffa040,#e06a00);border-color:#ffe0b0}.hud-t5 .op4-t,.hud-arena .op4-t{background:radial-gradient(#ff8a10 60%,#b04a00);box-shadow:0 0 0 4px #ff8a10,0 4px 14px #0008}
.hud-rueda .op4-p,.hud-rueda .op4-q{background:linear-gradient(#a050ff,#5a10c0);border-color:#e8d0ff}.hud-rueda .op4-t{background:radial-gradient(#8a30f0 60%,#3a0a8a);box-shadow:0 0 0 4px #8a30f0,0 4px 14px #0008}
/* ---- Letra a letra (Telecinco) ---- */
.lal-panel{position:absolute;left:3vw;top:14vh;width:22vw;padding:1.6vh 1vw;background:linear-gradient(#ffa63a,#e06800);border:3px solid #ffe2b0;border-radius:1.2vw;box-shadow:0 6px 18px #0009;display:flex;flex-direction:column;gap:.8vh;text-align:center}
.lal-panel div{font:900 clamp(12px,1.8vw,24px) Arial;color:#fff;text-shadow:0 2px 2px #7a3000;letter-spacing:.05em}.lal-panel .cur{color:#fff6a0}.lal-panel .ok{color:#fff}
.lal-num{position:absolute;left:4vw;bottom:36vh;font:900 clamp(40px,9vw,120px) Arial;color:#ff9a1a;-webkit-text-stroke:2px #fff2d0;text-shadow:0 6px 16px #000a}
.lal-pills{position:absolute;left:30vw;right:3vw;bottom:36vh;display:flex;flex-wrap:wrap;gap:1vh 1vw;justify-content:center}
.lal-pills div{position:relative;min-width:11vw;padding:.7vh 2.4vw .7vh 1.2vw;background:linear-gradient(#ffa63a,#e06800);border:2px solid #ffe2b0;border-radius:999px;font:900 clamp(10px,1.4vw,18px) Arial;color:#fff;text-align:center}
.lal-pills div i{position:absolute;right:-.6vw;top:50%;transform:translateY(-50%);width:2.4vw;height:2.4vw;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffd070,#e08000);border:2px solid #fff2d0}.lal-pills .ok{background:linear-gradient(#ffd23a,#f39a12);color:#4a2000}
/* ---- ¿Qué es qué? / La palabra imposible ---- */
.qeq-panel{position:absolute;right:6vw;top:12vh;width:20vw;padding:4vh 1vw;background:linear-gradient(#3a7dff,#0a3ac8);display:flex;flex-direction:column;gap:2.2vh;align-items:center;box-shadow:0 6px 18px #0009}
.qeq-panel.dos{width:30vw;display:grid;grid-template-columns:1fr 1fr;gap:1.6vh 1vw;justify-items:center;padding:3.4vh 1.4vw}.qeq-panel div{font:900 clamp(12px,1.7vw,22px) Arial;color:#fff;letter-spacing:.08em}
.qeq-panel i{position:absolute;background:#fff;box-shadow:0 0 6px #fff}.qeq-panel .h1,.qeq-panel .h2{left:-1.2vw;right:-1.2vw;height:3px}.qeq-panel .h1{top:1.4vh}.qeq-panel .h2{bottom:1.4vh}.qeq-panel .v1,.qeq-panel .v2{top:-1.4vh;bottom:-1.4vh;width:3px}.qeq-panel .v1{left:1vw}.qeq-panel .v2{right:1vw}
.qeq-com{position:absolute;left:2vw;right:16vw;bottom:36vh;display:flex;gap:1vw;justify-content:center;flex-wrap:wrap}
.qeq-com div{min-width:12vw;padding:.9vh 1vw;background:linear-gradient(#3a7dff,#0a46d8);border:2px solid #dfeaff;font:900 clamp(10px,1.5vw,20px) Arial;color:#fff;text-align:center}.qeq-com .cur{background:linear-gradient(#ffd23a,#f39a12);color:#3a1a00}.qeq-com .ok{opacity:.45}
.qeq-t{position:absolute;right:8vw;bottom:35vh;width:7vw;height:7vw;max-width:96px;max-height:96px;border-radius:50%;background:radial-gradient(#1e5fe8 60%,#0a2a8a);border:3px solid #fff;display:grid;place-items:center;font:900 clamp(18px,3vw,38px) Arial;color:#fff}
/* ---- Rosco individual a pantalla completa ---- */
.hud-rsolo .rs-fondo{position:absolute;inset:0;background:radial-gradient(ellipse at center,#4f8cff,#123a9a 75%)}.hud-rsolo .rs-fondo img{position:absolute;left:50%;bottom:0;height:92%;transform:translateX(-50%);opacity:.95;-webkit-mask-image:radial-gradient(ellipse 55% 65% at 50% 55%,#000 55%,transparent 100%);mask-image:radial-gradient(ellipse 55% 65% at 50% 55%,#000 55%,transparent 100%)}
.hud-rueda.hud-rsolo .rs-fondo{background:radial-gradient(ellipse at center,#a060ff,#3a0a8a 75%)}.hud-t5.hud-rsolo .rs-fondo,.hud-arena.hud-rsolo .rs-fondo{background:radial-gradient(ellipse at center,#ffb060,#c04a00 75%)}
.rs-w{position:absolute;left:50%;top:5vh;width:min(76vh,60vw);height:min(78vh,62vw);transform:translateX(-50%)}
.rs-l{position:absolute;transform:translate(-50%,-50%);width:clamp(20px,5.6vh,52px);height:clamp(20px,5.6vh,52px);border-radius:50%;display:grid;place-items:center;font:900 clamp(11px,3.1vh,28px) Arial;color:#fff;background:radial-gradient(circle at 35% 30%,#7aa8ff,#1f5fe8);border:2px solid #fff;box-shadow:0 2px 6px #0008}
.rs-l.ok{background:radial-gradient(circle at 35% 30%,#8af0a0,#19b04a)}.rs-l.ko{background:radial-gradient(circle at 35% 30%,#ff9090,#d01818)}.rs-l.cur{background:radial-gradient(circle at 35% 30%,#5aa0ff,#0a3ac8);transform:translate(-50%,-50%) scale(1.25);box-shadow:0 0 0 3px #ffd23a,0 0 14px #ffd23a}
.rs-t{position:absolute;left:3vw;bottom:4vh;width:15vh;height:15vh;border-radius:50%;background:radial-gradient(#ff8a10 58%,#c05000);border:5px solid #fff;display:grid;place-items:center;font:900 7vh Arial;color:#fff;box-shadow:0 4px 16px #000a}
.rs-a{position:absolute;left:calc(3vw + 15.5vh);bottom:5vh;width:8vh;height:8vh;border-radius:50%;background:radial-gradient(#3ad86a 58%,#0f8a3a);border:3px solid #fff;display:grid;place-items:center;font:900 4vh Arial;color:#fff}
.rs-nom{position:absolute;right:4vw;bottom:5vh;background:#000a;border:2px solid #fff;border-radius:999px;padding:.6vh 1.6vw;font:900 2.6vh Arial;color:#fff}
body.hud-split:has(#hud.hud-rsolo) #juego{max-height:26vh}
body:has(#hud.hud-rsolo) .j-final{display:block}body:has(#hud.hud-rsolo) .j-final>div:not(.j-fcentro){display:none}

#hud{position:fixed;inset:0;pointer-events:none;z-index:6;font-family:'Arial Black','Arial',sans-serif}
body.captura #hud{display:block!important}
body.hud-split #juego{top:auto;bottom:1.5vh;transform:translateX(-50%);max-height:31vh;width:min(780px,94vw);background:rgba(4,12,48,.86);padding:8px 14px}
body.hud-split #juego .j-final>div:not(.j-fcentro){display:none}body.hud-split #juego .j-final{grid-template-columns:1fr}
body.hud-split #juego .j-def{font-size:16px;margin:4px 0}body.hud-split #juego .j-reglas{font-size:13px}
.hud-split-w{position:absolute;left:2vw;right:2vw;top:2vh;height:61vh;display:flex;gap:1.2vw}
.hud-cam{flex:1;position:relative;overflow:hidden;background:#000}
.hud-cam img{width:100%;height:100%;object-fit:cover;display:block}
.hud-badge{position:absolute;bottom:22%;width:5.4vw;height:5.4vw;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:.85vw;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5)}
.hud-badge.l0{right:20%;background:var(--c0)}.hud-badge.l1{left:20%;background:var(--c1)}
.hud-puls-w{position:absolute;left:50%;bottom:2%;transform:translateX(-50%);width:34%}
.hud-pulsador{width:100%;filter:drop-shadow(0 4px 8px rgba(0,0,0,.6))}.hud-pulsador.bombilla{width:58%;margin:0 auto;display:block}
.hud-cam.activo .hud-pulsador{filter:drop-shadow(0 0 18px #fff) brightness(1.35)}
/* ---- estilo azul/naranja redondeado (2018-2026) y Rueda ---- */
.hud-azul,.hud-rueda{--c0:#ff8a00;--c1:#1a64f0}.hud-rueda{--c0:#a43ee8;--c1:#22c3d6}
.hud-azul .hud-cam,.hud-rueda .hud-cam{border-radius:2.2vw;border:.75vw solid var(--c0);box-shadow:inset 0 0 0 3px rgba(255,255,255,.35),0 6px 24px rgba(0,0,0,.5)}
.hud-azul .hud-cam.l1,.hud-rueda .hud-cam.l1{border-color:var(--c1)}
.hud-marc-c{position:absolute;bottom:14%;width:4.6vw;height:4.6vw;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:2.4vw;color:#222;box-shadow:0 0 0 .5vw var(--c0)}
.hud-marc-c.l0{left:4%}.hud-marc-c.l1{right:4%;box-shadow:0 0 0 .5vw var(--c1)}
.hud-pista{position:absolute;left:50%;top:44vh;transform:translate(-50%,-50%);width:6.5vw;height:6.5vw;border-radius:50%;background:#fff;border:.5vw solid #f0f0f0;display:grid;place-items:center;font-size:3.6vw;color:#222;box-shadow:0 0 0 .4vw #1a64f0,0 6px 18px rgba(0,0,0,.5)}
.hud-pista span{position:relative;z-index:2}
.hud-pista i{position:absolute;top:50%;display:flex;gap:3px;align-items:center;transform:translateY(-50%)}
.hud-pista .eqL{right:100%;margin-right:.4vw;flex-direction:row-reverse}.hud-pista .eqR{left:100%;margin-left:.4vw}
.hud-pista b{display:block;width:.55vw;background:#ffd21a;border-radius:2px;animation:eq .5s ease-in-out infinite alternate}.hud-pista .eqR b{background:#3f8bff}
.hud-pista b:nth-child(2){animation-delay:.1s}.hud-pista b:nth-child(3){animation-delay:.2s}.hud-pista b:nth-child(4){animation-delay:.05s}.hud-pista b:nth-child(5){animation-delay:.15s}
@keyframes eq{from{height:.8vw}to{height:4.5vw}}
.hud-texto-azul{position:absolute;left:50%;top:57vh;transform:translateX(-50%);background:linear-gradient(#2a7bff,#0a3ac0);color:#fff;border:3px solid #fff;border-radius:2vw;padding:.5vw 2vw;font-size:1.3vw;white-space:nowrap;max-width:80vw;overflow:hidden;text-overflow:ellipsis}
/* ---- estilo Telecinco 2007-2018: pantalla partida, franja morada, melones ---- */
.hud-t5{--c0:#ff7a00;--c1:#1f5fe0}
.hud-t5 .hud-cam{border:.45vw solid var(--c0);box-shadow:0 0 0 2px #fff inset}.hud-t5 .hud-cam.l1{border-color:var(--c1)}
.hud-barra{position:absolute;left:4vw;right:4vw;top:55vh;display:flex;align-items:stretch;gap:.8vw;height:4.4vw}
.hud-mk{width:7vw;display:grid;place-items:center;color:#fff;font-size:2.2vw;border:3px solid #fff;background:linear-gradient(#ffa040,#e05a00)}
.hud-mk.l1{background:linear-gradient(#5a9aff,#0a3ac0)}
.hud-franja{flex:1;display:grid;place-items:center;background:linear-gradient(#b03ad0,#7a1aa8 55%,#5a0a88);color:#fff;font-size:1.45vw;letter-spacing:.06em;border:3px solid #f0c8ff;box-shadow:0 4px 16px rgba(0,0,0,.5);padding:0 1vw;text-align:center}
.hud-franja small{font-size:.8em;opacity:.85}
/* ---- estilo arena 2000-2006: marco de piedra con estrellas, pulsadores plateados ---- */
.hud-arena{--c0:#f07a10;--c1:#2a6fe0}
.hud-arena-marco{position:absolute;inset:0;background:
  radial-gradient(circle at 12% 18%,rgba(255,255,255,.35) 0 2px,transparent 3px),radial-gradient(circle at 80% 85%,rgba(255,255,255,.3) 0 2px,transparent 3px),
  repeating-radial-gradient(circle at 30% 40%,rgba(120,80,30,.12) 0 3px,rgba(255,240,200,.06) 3px 7px),
  linear-gradient(135deg,#d9b77a,#c49a5a 40%,#e6c88e 70%,#b88a4a);
  padding:2.6vh 2.6vw 33vh;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude}
.hud-arena-marco::before,.hud-arena-marco::after{content:'★';position:absolute;color:#fff6d0;font-size:2.4vw;text-shadow:0 0 8px #a07030;left:1vw;top:52vh}.hud-arena-marco::after{left:auto;right:1vw;top:58vh;content:'✦'}
.hud-arena .hud-cam{border:.5vw solid #8a6a3a;box-shadow:inset 0 0 0 3px #f6e2b0}
.hud-arena .hud-franja{background:linear-gradient(#a04ac0,#6a1a90);border-color:#f8c8ff;font-family:Arial,sans-serif;font-weight:700}
.hud-arena .hud-mk{width:5vw;border-color:#f6e2b0}
.hud-rotulo-negro{position:absolute;left:50%;top:62vh;transform:translateX(-50%);background:#0a0a0a;color:#e8e8e8;border:3px solid #6a5a3a;padding:.5vw 4vw;font:700 1.3vw Arial,sans-serif;letter-spacing:.15em}
.hud-arena .hud-split-w{left:2.6vw;right:2.6vw;top:2.6vh;height:50vh}.hud-arena .hud-barra{top:53.5vh;height:3.6vw}
/* ---- rosco partido ---- */
.hud-rosco-l{position:absolute;inset:0}
.hud-l{position:absolute;transform:translate(-50%,-50%);width:2.15vw;height:2.15vw;border-radius:50%;display:grid;place-items:center;color:#fff;font:800 1.05vw Arial,sans-serif;background:radial-gradient(circle at 35% 30%,#7ab8ff,#1a5ad8 60%,#0a2a8a);border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.5)}
.hud-l.ok{background:radial-gradient(circle at 35% 30%,#8af59a,#19b84a 60%,#0a6a20)}.hud-l.ko{background:radial-gradient(circle at 35% 30%,#ff9090,#e01a1a 60%,#8a0a0a)}
.hud-l.cur{background:radial-gradient(circle at 35% 30%,#fff7b0,#ffd400 60%,#c09000);color:#222;transform:translate(-50%,-50%) scale(1.2)}
.hud-tiempo{position:absolute;top:2%;left:50%;transform:translateX(-50%);display:flex;align-items:center}
.hud-tiempo .t{width:4.4vw;height:4.4vw;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:2vw;background:var(--c0);border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.5)}
.hud-tiempo.l1 .t{background:var(--c1)}
.hud-tiempo .a{margin-left:-.5vw;min-width:2.6vw;height:2.6vw;border-radius:1.3vw;display:grid;place-items:center;background:#fff;color:var(--c0);font-size:1.25vw;border:2px solid var(--c0)}
.hud-tiempo.l1 .a{color:var(--c1);border-color:var(--c1)}
.hud-rosco .hud-badge{left:50%;right:auto;bottom:16%;transform:translateX(-50%);width:4.2vw;height:4.2vw}.hud-rosco .hud-cam:not(.activo){filter:saturate(.75) brightness(.8)}
.hud-rosco .hud-split-w{height:64vh}
/* ---- cápsulas (¿Dónde están?) ---- */
.hud-caps-w{position:absolute;right:6vw;top:18vh;display:grid;grid-template-columns:repeat(3,11vw);gap:1vw}
.hud-cap{height:3.6vw;border-radius:1.8vw;display:grid;place-items:center;color:#fff;font:800 1.15vw Arial,sans-serif;background:linear-gradient(#3a8bff,#0a46d8 60%,#0a32a8);border:.22vw solid #fff;box-shadow:0 0 0 .2vw #0a32a8,0 4px 12px rgba(0,0,0,.45);text-transform:uppercase}
.hud-cap.num{font-size:2vw}
.hud-caps-t{position:absolute;right:calc(6vw + 12vw);top:calc(18vh + 15vw);width:5vw;height:5vw;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:2.2vw;background:radial-gradient(circle at 35% 30%,#5aa0ff,#0a46d8);border:.25vw solid #fff;box-shadow:0 0 0 .2vw #0a32a8}
.hud-caps-tit{position:absolute;right:6vw;top:12vh;color:#fff;font-size:1.3vw;text-shadow:0 2px 6px #000}
.hud-t5 .hud-cap{border-radius:.6vw}.hud-arena .hud-cap{border-radius:.3vw;background:linear-gradient(#a04ac0,#6a1a90);border-color:#f6e2b0}
/* ---- bote acumulado ---- */
.hud-bote{position:absolute;left:50%;bottom:16vh;transform:translateX(-50%);text-align:left;animation:boteIn .6s cubic-bezier(.2,1.4,.4,1)}
.hud-bote-r{color:#ffe14a;font-size:2.1vw;letter-spacing:.02em;text-shadow:0 2px 0 #a06a00,0 3px 6px rgba(0,0,0,.6);margin-left:.6vw}
.hud-bote-n{font-size:7.5vw;line-height:1;color:#ffd84a;background:linear-gradient(#fff6b0 0%,#ffd84a 35%,#e0a010 60%,#ffe680 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 1px 0 #b07a00) drop-shadow(0 2px 0 #9a6400) drop-shadow(0 3px 0 #845400) drop-shadow(0 4px 0 #6e4400) drop-shadow(0 8px 10px rgba(0,0,0,.6));white-space:nowrap}
@keyframes boteIn{from{transform:translateX(-50%) scale(.6);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}
/* ---- rótulo genérico ---- */
.hud-gen .hud-barra{top:auto;bottom:34vh;left:12vw;right:12vw;height:3.4vw}
.hud-azul.hud-gen .hud-franja,.hud-rueda.hud-gen .hud-franja{background:linear-gradient(#2a7bff,#0a3ac0);border:3px solid #fff;border-radius:1.7vw}
.hud-azul.hud-gen .hud-mk,.hud-rueda.hud-gen .hud-mk{border-radius:50%;width:3.4vw;background:#fff;color:#222;box-shadow:0 0 0 .35vw var(--c0)}
.hud-azul.hud-gen .hud-mk.l1,.hud-rueda.hud-gen .hud-mk.l1{box-shadow:0 0 0 .35vw var(--c1)}
.hud-gen-tit{position:absolute;left:12vw;bottom:calc(34vh + 3.9vw);color:#fff;font-size:1.1vw;text-shadow:0 2px 6px #000}
body.jugando #hud .hud-gen-w{display:block}
/* ================= Rueda la letra 2026 ================= */
.hud-rueda{--c0:#a43ee8;--c1:#22c3d6}
.hud-rl{--mor1:#d58bff;--mor2:#9a3be6;--mor3:#6c1cc0;--tur1:#8ff3ff;--tur2:#2cc7da;--tur3:#0f8ea8}
/* La oportunidad */
.rl-dos{position:absolute;inset:0;display:flex}.rl-dos img{flex:1;min-width:0;height:100%;object-fit:cover}
.rl-dos::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#1a3cc855,#1a6af033 50%,#1a3cc855)}
.rlo-col{position:absolute;left:50%;top:3vh;transform:translateX(-50%);display:flex;flex-direction:column;gap:1.25vh;padding-top:3.4vh}
.rlo-linea{position:absolute;left:50%;top:0;bottom:2vh;width:.55vh;transform:translateX(-50%);background:linear-gradient(#bfe6ff,#5fb0f0);box-shadow:0 0 6px #9fd8ff}
.rlo-tapa{position:absolute;left:50%;top:-1.6vh;width:5.2vh;height:3.6vh;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle at 40% 30%,#bfe8ff,#3a90d8 60%,#16508a)}
.rlo-f{position:relative;display:flex;align-items:center;justify-content:center;height:4.2vh}
.rlo-b{position:relative;z-index:2;width:4.6vh;height:4.6vh;border-radius:50%;display:grid;place-items:center;font:900 2.7vh Arial;color:#fff;text-shadow:0 1px 2px #0a2a6a;
  background:radial-gradient(circle at 38% 30%,#a8dcff,#3d93df 55%,#1b5aa8);border:.35vh solid #d8f0ff;box-shadow:0 0 8px #7fc4ff}
.rlo-c{display:block;width:3.6vh;height:.32vh;background:#b9d8ec;box-shadow:0 0 4px #fff8}
.rlo-a{display:block;width:3.4vh;height:3.4vh;border-radius:50%;border:.32vh solid #c8dceb;background:transparent;box-sizing:border-box}
.rlo-a.l0.on{background:radial-gradient(circle at 38% 30%,#f0c8ff,#a43ee8 65%);border-color:#fff}.rlo-a.l1.on{background:radial-gradient(circle at 38% 30%,#c8fbff,#22c3d6 65%);border-color:#fff}
.rlo-a.turno{border:.55vh solid #fff;box-shadow:0 0 10px #fff}.rlo-f.cur .rlo-b{transform:scale(1.12);box-shadow:0 0 14px #fff}
/* listas de píldoras / panel 4x4 / barra */
.rl-pills{position:absolute;left:5vw;top:8vh;width:19vw;display:flex;flex-direction:column;gap:.7vh}
.rl-pills div{height:3.6vh;border-radius:.7vw;display:grid;place-items:center;font:900 clamp(9px,2.3vh,20px) Arial;color:#fff;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 .5vw;
  background:linear-gradient(#e2a6ff 0%,var(--mor2) 45%,var(--mor3) 100%);box-shadow:inset 0 1px 0 #fff9,inset 0 -2px 4px #4a0a9066,0 2px 6px #0007;text-shadow:0 1px 2px #4a0a90}
.rl-pills.n12{top:6vh;gap:.55vh}.rl-pills.n12 div{height:3.3vh}
.rl-pills .cur{background:linear-gradient(#fff2b0,#e8b820 50%,#b88a00);box-shadow:0 0 0 .25vh #fff4c0,0 0 12px #ffd84a;text-shadow:0 1px 2px #6a4a00}
.rl-pills .ok,.rl-grid .off{opacity:.38;filter:saturate(.5)}
.l1 .rl-pills,.l1 .rl-grid{left:auto;right:5vw}
.l1 .rl-pills div{background:linear-gradient(#b8fbff 0%,var(--tur2) 45%,var(--tur3) 100%);text-shadow:0 1px 2px #0a5a6a}
.l1 .rl-pills .cur{background:linear-gradient(#fff2b0,#e8b820 50%,#b88a00)}
.rl-grid{position:absolute;left:5vw;top:7vh;display:grid;grid-template-columns:repeat(4,10.5vh);gap:1.1vh 1.1vh}
.rl-grid div{height:10.5vh;border-radius:2vh;display:grid;place-items:center;font:900 clamp(12px,4.4vh,40px) Arial;color:#fff;text-shadow:0 1px 3px #4a0a90;
  background:linear-gradient(#eab8ff 0%,#b65cf4 40%,#8a2ee0 100%);box-shadow:inset 0 2px 0 #fffa,inset 0 -3px 6px #4a0a9066,0 3px 8px #0007}
.rl-grid div.c3{font-size:clamp(10px,3.5vh,32px)}.rl-grid div.c4{font-size:clamp(9px,2.7vh,26px)}
.l1 .rl-grid div{background:linear-gradient(#c8fdff 0%,#4ad8e8 40%,#14a0b8 100%);text-shadow:0 1px 3px #0a5a6a}
.rl-barra{position:absolute;left:16vw;right:22vw;bottom:36vh;height:7vh;display:flex;align-items:center}
.rl-barra.corta{right:14vw}
.rl-t{position:relative;z-index:2;flex:none;width:9vh;height:9vh;border-radius:50%;display:grid;place-items:center;
  background:conic-gradient(#3fd46a var(--p),#c8f5d4 0);box-shadow:0 3px 10px #0008}
.rl-t::before{content:'';position:absolute;inset:.9vh;border-radius:50%;background:radial-gradient(circle at 40% 30%,#fff,#e8e8f0)}
.rl-t span{position:relative;font:900 4.4vh Arial;color:var(--mor3)}.l1 .rl-t span{color:#0d7f96}
.rl-txt{flex:1;margin-left:-2.2vh;height:100%;display:grid;place-items:center;padding:0 2vw 0 3.6vh;border-radius:0 1vw 1vw 0;text-align:center;font:900 clamp(10px,2.5vh,22px)/1.15 Arial;color:#fff;letter-spacing:.02em;
  background:linear-gradient(#e8b0ff 0%,#b052f0 40%,#8a28dc 100%);box-shadow:inset 0 2px 0 #fff8,0 3px 10px #0008;text-shadow:0 1px 2px #4a0a90}
.l1 .rl-txt{background:linear-gradient(#c0fbff 0%,#46d4e6 40%,#16a2ba 100%);text-shadow:0 1px 2px #0a5a6a}
.rl-ap{display:flex;gap:.5vw;margin-left:.6vw;height:118%}
.rl-ap div{width:6.4vw;border-radius:.9vw;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(#c070ff,#8a2ee0);box-shadow:inset 0 2px 0 #fff8,0 3px 8px #0008;color:#fff}
.l1 .rl-ap div{background:linear-gradient(#5ae0f0,#14a0b8)}
.rl-ap small{font:900 clamp(6px,1.1vh,11px) Arial;letter-spacing:.04em}.rl-ap b{font:900 clamp(16px,5vh,44px) Arial;line-height:1}
/* La Rueda (final) */
.rlf-fondo{position:absolute;inset:0;background:repeating-linear-gradient(100deg,#1f5fe8 0 5vw,#2a74f4 5vw 7vw,#1a56dc 7vw 11vw),#1f5fe8}
.rlf-fondo::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,#5aa8ff55,transparent 70%)}
.rlf-fondo img{position:absolute;left:50%;bottom:0;height:88%;transform:translateX(-50%);-webkit-mask-image:radial-gradient(ellipse 50% 62% at 50% 58%,#000 55%,transparent 100%);mask-image:radial-gradient(ellipse 50% 62% at 50% 58%,#000 55%,transparent 100%)}
.rlf-w{position:absolute;left:50%;top:5vh;width:min(80vh,46vw);height:min(80vh,46vw);transform:translateX(-50%)}
.rlf-l{position:absolute;transform:translate(-50%,-50%);width:clamp(18px,5.4vh,48px);height:clamp(18px,5.4vh,48px);border-radius:50%;display:grid;place-items:center;font:900 clamp(10px,2.8vh,26px) Arial;color:#fff;
  background:radial-gradient(circle at 40% 32%,#2f8ae8,#0d4fae 70%);border:.35vh solid #7fc8ff;box-shadow:0 0 0 .2vh #0a3a8a,0 2px 6px #0007}
.rlf-l.ok{background:radial-gradient(circle at 40% 32%,#7ef09a,#16a84a 70%);border-color:#c8ffd8}.rlf-l.ko{background:radial-gradient(circle at 40% 32%,#ff8a8a,#c81a1a 70%);border-color:#ffd0d0}
.rlf-l.cur{background:radial-gradient(circle at 40% 32%,#fff,#bfe2ff 70%);color:#0d4fae;transform:translate(-50%,-50%) scale(1.22);box-shadow:0 0 14px #fff}
.rlf-nom{position:absolute;left:58%;bottom:7vh;width:10vh;height:10vh;border-radius:50%;display:grid;place-items:center;font:900 2vh Arial;color:#fff;background:radial-gradient(circle at 40% 30%,#8fe0ff,#2aa0e8);border:.3vh solid #d8f4ff}
.l0 .rlf-nom{background:radial-gradient(circle at 40% 30%,#f0c8ff,#b46cf0)}
.rlf-ab{position:absolute;left:8vw;bottom:6vh;display:flex;align-items:center}
.rlf-a{height:8vh;min-width:8vh;padding:0 1.6vh 0 1.4vh;margin-right:-2.4vh;border-radius:1.4vh 0 0 1.4vh;display:grid;place-items:center;font:900 4.4vh Arial;color:#fff;
  background:linear-gradient(#d890ff,#9a3be6 50%,#7424c8);box-shadow:inset 0 2px 0 #fff8,0 3px 10px #0008}
.l1 .rlf-a{background:linear-gradient(#9ae8cc,#3aa88a 50%,#1f7a62)}
.rlf-t{position:relative;width:17vh;height:17vh;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 40% 30%,#8fd0ff,#2a7ae0 55%,#0f4aa8);
  border:1.3vh solid #3fd46a;box-shadow:0 0 0 .35vh #b8f5c8,0 4px 16px #0009}
.rlf-t .t{font:900 6.6vh Arial;color:#fff;text-shadow:0 2px 4px #0a2a6a}
body.hud-split:has(#hud.rl-final) #juego{max-height:46vh;left:auto;right:1vw;bottom:1vh;transform:none;width:min(360px,25vw);padding:6px 10px}
body.hud-split:has(#hud.rl-final) #juego .j-cab{display:none}body.hud-split:has(#hud.rl-final) #juego .j-def{font-size:13px}body.hud-split:has(#hud.rl-final) #juego .j-resp{flex-wrap:wrap}
body.hud-split:has(#hud.rl-final) #juego .j-resp input{min-width:0;width:100%}body.hud-split:has(#hud.rl-final) #juego .j-resp button{font-size:12px;padding:6px 8px}
body.hud-split:has(#hud.rl-lista) #juego,body.hud-split:has(#hud.rl-op) #juego{max-height:29vh}
body.hud-split:has(#hud.rl-lista) #juego .j-opc.vert{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}body.hud-split:has(#hud.rl-lista) #juego .j-opc.vert button{font-size:12px;padding:5px 4px;margin:0}
body:has(#hud.rl-final) .j-final{display:block}body:has(#hud.rl-final) .j-final>div:not(.j-fcentro){display:none}
/* Cantando espero (duelo de pulsadores) */
.hud-rueda.hud-duelo .hud-cam{border-radius:.5vw;border-width:.45vw}
.hud-rueda.hud-duelo .hud-cam.l0{border-color:#b35cf0}.hud-rueda.hud-duelo .hud-cam.l1{border-color:#2ccbe0}
.hud-rueda.hud-duelo .hud-marc-c,.hud-rueda.hud-duelo .hud-texto-azul{display:none}
.hud-rueda.hud-duelo .hud-pista{width:9vw;height:9vw;top:50vh;border:none;background:conic-gradient(#3fd46a 0 33%,#2a8bff 0 66%,#ff3a3a 0);box-shadow:0 0 0 .3vw #fff8,0 6px 18px #0009}
.hud-rueda.hud-duelo .hud-pista::before{content:'';position:absolute;inset:.9vw;border-radius:50%;background:radial-gradient(circle at 40% 30%,#8fd0ff,#2a7ae0 55%,#0f4aa8);box-shadow:inset 0 0 0 .25vw #fff}
.hud-rueda.hud-duelo .hud-pista span{color:#fff;font-size:3.8vw;text-shadow:0 2px 4px #0a2a6a}
.hud-pulsador.cil{width:62%;margin:0 auto;display:block}.hud-rueda .hud-puls-w{width:30%}
/* Banda LED «¡HE DICHO!» */
.rl-led{position:absolute;left:0;right:0;top:3vh;height:13vh;display:flex;justify-content:space-around;align-items:center;overflow:hidden;
  background:radial-gradient(circle,#ffffff22 1px,transparent 1.6px) 0 0/7px 7px,linear-gradient(90deg,#4a1aa8,#7a2ad8 30%,#5a20c0 70%,#3a148a);border-top:.4vh solid #c8a0ff;border-bottom:.4vh solid #c8a0ff;box-shadow:0 0 30px #8a3af0aa;animation:boteIn .5s}
.rl-led span{font:900 8vh 'Arial Black',Arial;color:#fff;letter-spacing:.04em;text-shadow:0 0 12px #e0c8ff;white-space:nowrap}
.rl-led span:nth-child(odd){opacity:.55}
`;
