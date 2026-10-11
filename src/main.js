// Pasapalabra · El juego 3D (independiente). Interfaz de la plantilla común (/workspace/plantilla_menu), platós de cada época.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ETAPAS } from './etapas/index.js';
import { drawGlobeLogo } from './etapas/_base.js';
import { figure } from './lib/helpers.js';
import { ESPECIALES } from './lib/especiales.js';
import { jugarPrograma, entrenar, FORMATOS, leerBote } from './juego/juego.js';
import { PRUEBAS } from './juego/pruebas.js';
import { jugarFinal } from './juego/final.js';
import { UI, nuevaPartida, ABORT, setVoz, VEL, espera, banco } from './juego/motor.js';
import { hud, HUD_CSS, estiloDe } from './juego/grafismos.js';
import { PRESENTADORES, SPOTS, CAPITULOS } from './juego/historia.js';
import { MONOLOGOS, TIPO_ICONO, TIPO_TXT, CHISTES } from './juego/monologos.js';
import { recursoEpoca, guardarSubido, quitarSubido, sfx, audioCtx, idb, cargarSonidos, subirSonido, asignarSuelto, quitarSonido, quitarSuelto, borrarSonidos, estadoSonidos, origenSonido, urlSonido, tieneRespaldo } from './lib/media.js';
import { GRUPOS_SONIDOS, TODOS_SONIDOS, SONIDO, ETAPA_CLAVE, reconocer } from './lib/catalogo_sonidos.js';
window.__urlSonido = urlSonido;
import { programarAudioRespaldo } from './cabeceras/telecinco.js';
import { musica } from './lib/musica.js';
import { decir, callar, configurarVoces, CREDITOS_VOCES } from './lib/voces.js';
import { cfg, guardarCfg, VERSION } from './cfg.js';
import * as M from './lib/menu_kit.js';
{ const st = document.createElement('style'); st.textContent = HUD_CSS; document.head.appendChild(st); }

const params = new URLSearchParams(location.search);
if (params.get('vel')) window.__VEL = +params.get('vel');
if (params.has('auto')) window.__AUTO = true;
const $ = id => document.getElementById(id);
const esc = M.esc;

// ---------- motor 3D ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: params.has('capture') });
renderer.setSize(innerWidth, innerHeight); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.shadowMap.enabled = true;
$('app').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 2; controls.maxDistance = 45;
const SanitizeShader = { uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0,0.0,0.0,1.0); gl_FragColor = clamp(c, 0.0, 30.0); }' };
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new ShaderPass(SanitizeShader));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.32, 0.4, 0.9); composer.addPass(bloom); composer.addPass(new OutputPass());
let bloomOn = false;
function aplicarCalidad() { const q = cfg.quality; renderer.setPixelRatio(q === 'baja' ? 0.75 : q === 'media' ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = q !== 'baja'; bloomOn = q === 'alta' && !params.has('nobloom'); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); }

// ---------- voces (Piper pregeneradas + respaldo) ----------
configurarVoces({ activo: () => cfg.voz, volumen: () => 1, rapida: () => cfg.leeVel === 'rapida', velocidad: () => VEL() });
const VOZ_PRES = { sofia: 'daniela' }; const vozDe = P => VOZ_PRES[P?.id] || 'davefx';
const PRES_ETAPA = { 'antena3-2000': 'sofia', 'telecinco-2007': 'toni', 'telecinco-2018': 'toni', 'antena3-2020': 'dani', 'rueda-letra': 'aurelio' };
Object.entries(PRESENTADORES).forEach(([k, v]) => { v.id = k; });
const RIVALES = [{ nombre: 'Paca Letras', prof: 'Coleccionista de diccionarios', voz: 'sharvard' }, { nombre: 'Ramón Rosco', prof: 'Afinador de abecedarios', voz: 'carlfm' },
  { nombre: 'Lupe Verbo', prof: 'Domadora de tildes', voz: 'daniela' }, { nombre: 'Tino Sílaba', prof: 'Cartero de palabras esdrújulas', voz: 'ald' }];
const FRASES_RIVAL = ['¡Hola a todos! Vengo a por el bote.', '¡Pasapalabra!', '¡Qué nervios! Vamos allá.', 'Ha sido un placer. ¡Gracias!'];

// ---------- plató ----------
const ctx = { screenMode: 'rosco', onRosco: null, logoPantalla: null, especial: cfg.especial };
let etapa = null, etapaDef = null, presentador3D = null;
const ETAPA_IDS = ETAPAS.map(e => e.id);
async function cargarLogoPantalla(def) { const r = await recursoEpoca('logo', def); if (!r) { ctx.logoPantalla = null; return; } const img = new Image(); img.src = r.url; ctx.logoPantalla = img; await new Promise(res => { img.onload = img.onerror = res; }); }
function cargarEtapa(id, { camara: c = 'general' } = {}) {
  const def = ETAPAS.find(e => e.id === id) || ETAPAS[3];
  if (etapa) etapa.dispose(); quitarPresentador();
  etapaDef = def; etapa = def.modulo.build(scene, ctx); cargarLogoPantalla(def);
  musica.setEtapa(ETAPA_CLAVE[def.id]); if (musica.nombre === 'menu' || musica.nombre === 'musica_menu') musica.play('menu');
  irACamara(def.modulo.cameras[c] ? c : 'general', true);
}
function ponerPresentador(P, spot = SPOTS[etapaDef.id]) {
  quitarPresentador(); if (!P) return;
  presentador3D = figure({ body: P.traje, legs: 0x1a1a22, hair: 0x2a1a10, scale: 1.05 });
  presentador3D.position.set(...spot.pres); presentador3D.lookAt(spot.cam[0], spot.pres[1], spot.cam[2]); scene.add(presentador3D);
}
function quitarPresentador() { if (presentador3D) { scene.remove(presentador3D); presentador3D = null; } }
const planoPresentador = () => { const s = SPOTS[etapaDef.id]; if (!s) return; tween = { t: 0, dur: 1.4, fromPos: camera.position.clone(), fromTgt: controls.target.clone(), toPos: new THREE.Vector3(...s.cam), toTgt: new THREE.Vector3(...s.tgt) }; orbitar = false; };
let tween = null, orbitar = false, camFija = 0;
function irACamara(nombre, inmediato = false) {
  const cam = etapaDef.modulo.cameras[nombre]; if (!cam) return; orbitar = false;
  if (cam.mode) etapa.setMode(cam.mode);
  const toPos = new THREE.Vector3(...cam.pos), toTgt = new THREE.Vector3(...cam.target);
  if (inmediato) { camera.position.copy(toPos); controls.target.copy(toTgt); controls.update(); tween = null; return; }
  tween = { t: 0, dur: 1.6, fromPos: camera.position.clone(), fromTgt: controls.target.clone(), toPos, toTgt };
}
function modoOrbita() { const c = etapaDef.modulo.cameras.general; camera.position.set(...c.pos); controls.target.set(...c.target); controls.update(); orbitar = true; tween = null; }

// ---------- cabecera 3D ----------
let cab = null, limpiarSkip = null;
async function reproducirCabecera(def = etapaDef) {
  pararCabecera();
  if (cfg.cabecera === 'video') { const rec = await idb.get('video:cabecera'); if (rec && rec.blob) return videoCabecera(rec); }
  const logo = await recursoEpoca('logo', def), mus = await recursoEpoca('musica', def);
  const C = def.cabecera; const inst = C.crearCabecera(renderer, { logoUrl: logo ? logo.url : null }); inst.resize(innerWidth, innerHeight);
  musica.stop();
  return new Promise(res => {
    cab = { def, inst, start: performance.now() / 1000, res };
    document.body.classList.add('en-cabecera'); $('btnSkip').classList.remove('hidden'); $('topbar').classList.remove('hidden');
    if (mus) { if (cfg.music) { cab.audio = new Audio(mus.url); cab.audio.volume = cfg.musicVol; cab.audio.play().catch(() => {}); } }
    else if (cfg.music) { try { const c = audioCtx(); const g = c.createGain(); g.gain.value = cfg.musicVol; g.connect(c.destination); cab.gain = g; (C.programarAudioRespaldo || programarAudioRespaldo)(c, g, c.currentTime + 0.05); } catch (e) { /* */ } }
  });
}
function pararCabecera() {
  if (!cab) return; const c0 = cab; cab = null;
  if (c0.audio) { const a = c0.audio; let v = a.volume; const iv = setInterval(() => { v -= 0.08; a.volume = Math.max(0, v); if (v <= 0) { a.pause(); clearInterval(iv); } }, 80); }
  if (c0.gain) { try { c0.gain.gain.setTargetAtTime(0, audioCtx().currentTime, 0.3); setTimeout(() => c0.gain.disconnect(), 2500); } catch (e) { /* */ } }
  c0.inst.dispose(); document.body.classList.remove('en-cabecera'); $('btnSkip').classList.add('hidden');
  $('fx-flash').style.opacity = 0; $('fx-streak').style.opacity = 0; $('fx-fade').style.opacity = 1; $('fx-fade').classList.add('saliendo'); setTimeout(() => { $('fx-fade').style.opacity = 0; }, 30);
  c0.res();
}
function videoCabecera(rec) {
  const url = URL.createObjectURL(rec.blob), box = $('video'), v = box.querySelector('video');
  return new Promise(res => { let ok = false; const fin = () => { if (ok) return; ok = true; v.pause(); v.removeAttribute('src'); v.load(); box.classList.add('hidden'); $('btnSkip').classList.add('hidden'); URL.revokeObjectURL(url); limpiarSkip = null; res(); };
    v.onended = fin; v.onerror = fin; limpiarSkip = fin; v.src = url; v.volume = cfg.music ? cfg.musicVol : 0; box.classList.remove('hidden'); $('btnSkip').classList.remove('hidden'); v.play().catch(() => { v.muted = true; v.play().catch(fin); }); });
}
function renderCab(t) { cab.inst.render(t); const o = cab.inst.overlay(t); $('fx-streak').style.opacity = o.streak; $('fx-flash').style.opacity = o.flash; $('fx-fade').classList.remove('saliendo'); $('fx-fade').style.opacity = o.fade; }
window.__renderCabecera = null;

// ---------- presentador: subtítulo «EL PRESENTADOR» + voz ----------
const sub = $('sub');
async function diga(P, texto, { voz = vozDe(P), quien = P ? P.nombre : '' } = {}) {
  sub.querySelector('b').textContent = quien || 'El presentador'; sub.querySelector('span').textContent = texto; sub.classList.remove('hidden');
  const gen = genActual(); const t0 = performance.now();
  await Promise.race([decir(texto, { voz }), new Promise(r => { saltarFrase = r; })]);
  const min = Math.min(2600, texto.length * 45) / VEL() - (performance.now() - t0); if (min > 0) await new Promise(r => setTimeout(r, min));
  saltarFrase = null; if (gen !== genActual()) throw ABORT;
}
let saltarFrase = null, gen = 0; const genActual = () => gen;
sub.onclick = e => { e.stopPropagation(); callar(); saltarFrase && saltarFrase(); };
const ocultarSub = () => sub.classList.add('hidden');
function hashtag(t) { $('hashtag').textContent = t || ''; $('hashtag').classList.toggle('on', !!t); }
async function rotulo(t, s = '', ms = 3000) { const l = $('lower3'); const d = document.createElement('div'); d.className = 'l3'; d.innerHTML = `<b>${esc(t)}</b>${s ? `<span>${esc(s)}</span>` : ''}`; l.appendChild(d); l.classList.remove('hidden'); await espera(ms); d.classList.add('out'); setTimeout(() => { d.remove(); if (!l.children.length) l.classList.add('hidden'); }, 400); }
function toast(t, ms = 2500) { const e = $('toast'); e.textContent = t; e.classList.remove('hidden'); clearTimeout(toast._t); toast._t = setTimeout(() => e.classList.add('hidden'), ms); }
function acciones(lista) { const a = $('actions'); a.innerHTML = ''; (lista || []).forEach(x => { const b = document.createElement('button'); b.className = 'abtn ' + (x.cls || ''); b.textContent = x.label; b.onclick = e => { e.stopPropagation(); sfx('tecla'); a.innerHTML = ''; x.fn(); }; a.appendChild(b); }); }
function marcador(html) { const m = $('marcador'); if (!html) { m.classList.add('hidden'); return; } m.innerHTML = html; m.classList.remove('hidden'); }
function saltable(p) { $('btnSkip').classList.remove('hidden'); return Promise.race([p, new Promise(r => { limpiarSkip = () => r('skip'); })]).finally(() => { limpiarSkip = null; $('btnSkip').classList.add('hidden'); callar(); }); }
async function rodarCreditos(bloques, ms = 16000) {
  const c = $('credits'), r = $('creditsRoll'); r.innerHTML = bloques.map(([t, l]) => `<h4>${esc(t)}</h4>${l.map(esc).join('<br>')}`).join('');
  c.classList.remove('hidden'); r.style.transition = 'none'; r.style.transform = 'translateY(0)'; r.offsetHeight;
  r.style.transition = `transform ${ms / VEL()}ms linear`; r.style.transform = `translateY(calc(-100% - ${c.clientHeight}px))`;
  await espera(ms); c.classList.add('hidden');
}

// ---------- créditos ----------
function creditos() {
  const nom = cfg.nombre ? `${cfg.nombre} · ${cfg.profesion || 'Concursante'}` : 'Tú · Concursante central';
  return [['Presentado por', Object.values(PRESENTADORES).map(p => `${p.nombre} (presentador virtual · ${p.etapa})`)],
    ['Concursantes', [`1. ${nom}`, ...RIVALES.map((r, i) => `${i + 2}. ${r.nombre} · ${r.prof}`)]],
    ['Juego creado por', ['Iker']], ['Basado en', ['El concurso «Pasapalabra» (adaptación no oficial)', 'Formato británico «The Alphabet Game»', 'Y «Rueda la letra» (Telecinco, 2026)']],
    ['Platós, cabeceras y grafismos', ['Recreaciones originales en 3D (Three.js) de cada época', 'sin logos ni recursos reales']],
    ['Música y sonidos', ['Los que subas tú desde Opciones', 'o efectos sintetizados por el propio juego']],
    CREDITOS_VOCES, ['Público de las gradas', ['Aplausos sintetizados (no son grabaciones)']],
    ['Interfaz', ['Basada en el APK «¡Ahora Caigo! El juego 3D» de Iker']], ['Programación', ['Grok Bot']]];
}

// ---------- API para el programa ----------
const presDe = () => PRESENTADORES[PRES_ETAPA[etapaDef.id]];
const api = {
  async cabecera() { await reproducirCabecera(); },
  async saludo(G, variante) {
    const P = presDe(); ponerPresentador(P); planoPresentador(); sfx('aplausos'); musica.play('menu');
    const E = ESPECIALES[ctx.especial] || ESPECIALES.normal;
    await diga(P, E.saludo || `¡Muy buenas y bienvenidos a ${etapaDef.id === 'rueda-letra' ? 'Rueda la letra' : 'Pasapalabra'}! Hoy tenemos un programa lleno de palabras. ¡Que empiece el juego!`);
    if (cfg.monologo) await monologo(null, true);
    if (cfg.chistes) { await diga(P, CHISTES[Math.floor(Math.random() * CHISTES.length)]); sfx('risas'); }
  },
  async presentaciones(G) {
    if (!cfg.presentaciones) return;
    const P = presDe(); const R = RIVALES[Math.floor(Math.random() * RIVALES.length)]; G.rival = R;
    G.equipos[1].nombre = R.nombre.split(' ')[0]; if (cfg.nombre) G.equipos[0].nombre = cfg.nombre;
    irACamara('atril'); await diga(P, 'Vamos a conocer a los concursantes de hoy.');
    rotulo(cfg.nombre || 'Concursante central', cfg.profesion || 'Tú', 3200); await espera(3200);
    rotulo(R.nombre, R.prof, 3200); await diga(null, FRASES_RIVAL[0], { voz: R.voz, quien: R.nombre });
    if (G.famosos) for (const f of G.famosos) await rotulo(f, 'Famoso invitado (ficticio)', 1800);
    ocultarSub(); musica.play('pruebas');
  },
  camara: c => { if (!camFija) irACamara(c); },
};

// ---------- MENÚ (plantilla común) ----------
let pantalla = 'title', sinTiempo = false, lineaMsg = '', probando = null;
const VOLVER = { title: null, main: 'title', play: 'main', train: 'play', options: 'main', help: 'main', credits: 'main', concursantes: 'options', canciones: 'options', sonidos: 'options', monologos: 'play' };
M.setSonidoTecla(() => sfx('tecla'));
function logoDataURL(w = 900, h = 600) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const img = ctx.logoPantalla; if (img && img.complete && img.naturalWidth) { const s = Math.min((w - 40) / img.naturalWidth, (h - 20) / img.naturalHeight); g.drawImage(img, (w - img.naturalWidth * s) / 2, (h - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s); }
  else drawGlobeLogo(g, w / 2, h / 2, h * 0.42, 0.6, { font: `900 ${Math.round(h * 0.17)}px Arial` });
  return c.toDataURL('image/png');
}
const guardar = () => { guardarCfg(); musica.niveles(); setVoz(cfg.voz && cfg.lee); };
const siNo = (k, f) => M.siNo(cfg, k, v => { guardar(); f && f(v); });
const opciones = (k, l, f) => M.opciones(cfg, k, l, v => { guardar(); f && f(v); });
const slider = k => M.slider(cfg, k, guardar, () => sfx(k === 'publicoVol' ? 'aplausos' : 'tecla'));
function limpiarTodo() {
  gen++; nuevaPartida(); callar(); pararCabecera(); musica.stop(); hud().limpiar(); $('juego').classList.remove('abierto'); $('juego').innerHTML = '';
  ocultarSub(); acciones([]); marcador(null); hashtag(''); $('credits').classList.add('hidden'); $('lower3').innerHTML = ''; $('video').classList.add('hidden'); historiaUI?.cerrar(); historiaUI = null;
  if (paseo) salirPaseo(); $('joy').classList.add('hidden'); quitarPresentador(); camFija = 0; $('glights').classList.add('hidden');
}
function irMenu(p = 'main') {
  limpiarTodo(); $('topbar').classList.add('hidden');
  if (etapaDef.id !== cfg.etapa || ctx.especial !== cfg.especial) { ctx.especial = cfg.especial; cargarEtapa(cfg.etapa); }
  modoOrbita(); musica.play('menu'); Lt(p);
}
function Lt(p) {
  pantalla = p; const m = $('menu'); const E = ESPECIALES[cfg.especial] || ESPECIALES.normal;
  if (p === 'title') return M.pantallaTitulo(m, { logo: logoDataURL(900, 640), sub: 'El juego', onStart: () => { audioCtx(); sfx('pasapalabra'); irMenu('main'); } });
  const col = M.pantallaMenu(m, { logo: logoDataURL(), tag: cfg.especial === 'normal' ? `EL JUEGO · 3D` : E.emoji + ' ' + (E.banner || E.nombre), version: VERSION, cls: ['options', 'concursantes', 'canciones', 'sonidos'].includes(p) ? 'opts' : ['help', 'credits'].includes(p) ? 'text' : '' });
  const mbtn = M.mbtn, volver = d => M.volver(() => Lt(d));
  const nomEtapa = `${etapaDef.nombre} ${etapaDef.anios}`;
  if (p === 'main') {
    col.append(mbtn('Jugar', 'Programa completo, entrenamiento, clásico…', 'gold', () => Lt('play')), mbtn('Opciones', 'Sonido, plató de cada época, calidad gráfica', '', () => Lt('options')),
      mbtn('La historia de Pasapalabra', 'Los presentadores virtuales te cuentan la historia', '', () => iniciar('historia')), mbtn('Cómo se juega', 'Las reglas del concurso', '', () => Lt('help')), mbtn('Créditos', '', '', () => Lt('credits')));
    const enApk = location.hostname === 'appassets.androidplatform.net';
    if (!enApk && !matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) col.append(mbtn('Instalar app', 'Juega sin conexión desde tu pantalla de inicio', 'inst', instalar));
    if (!enApk) col.append(mbtn('Descargar APK', 'Instala el juego en tu móvil Android', 'inst', () => window.open('https://github.com/ikeriano/pasapalabra-grok-bot/releases/latest', '_blank')));
  } else if (p === 'play') {
    col.append(mbtn('Programa completo', `Cabecera, Silla azul, pruebas y ${FORMATOS[cfg.etapa].variantes.at(-1).final.nombre} · ${nomEtapa}`, 'gold', () => iniciar('programa')), mbtn('Entrenamiento', 'Practica cada prueba y las finales', '', () => Lt('train')),
      mbtn('Clásico', 'Partida rápida: dos pruebas y la final', '', () => iniciar('clasico')), mbtn('Rueda la letra', 'El programa de Telecinco (2026): La oportunidad… y La Rueda', '', () => iniciar('rueda')),
      mbtn('Explorar el plató', 'Pasea libremente por el plató 3D', '', () => iniciar('explorar')), mbtn('Monólogos del presentador', 'Con el público, al teléfono y las normas', '', () => Lt('monologos')),
      M.h2('Programa especial'), M.rejillaTemas(Object.fromEntries(Object.entries(ESPECIALES).map(([k, v]) => [k, { name: v.nombre, emoji: v.emoji }])), cfg.especial, k => { cfg.especial = k; guardarCfg(); ctx.especial = k; cargarEtapa(cfg.etapa); modoOrbita(); Lt('play'); }),
      M.nota(cfg.etapa === 'antena3-2000' ? 'Los adornos de los especiales se ven en los platós desde 2007.' : `Plató: ${nomEtapa} (cámbialo en Opciones → Etapa / Plató).`, 'onote'), volver('main'));
  } else if (p === 'train') {
    col.append(M.h2('Entrenamiento (sin eliminación)'));
    const ids = [...new Set(Object.values(FORMATOS).flatMap(f => f.variantes.flatMap(v => v.pruebas)))];
    const lista = document.createElement('div'); lista.className = 'monolist';
    ids.forEach((id, i) => { const b = document.createElement('button'); b.className = 'tbtn' + (i === 0 ? ' sel' : ''); b.innerHTML = `<b>${esc(PRUEBAS[id].nombre)}</b><small>${esc(DESC[id] || '')}</small>`; b.onclick = e => { e.stopPropagation(); sfx('tecla'); iniciar('entreno:' + id); }; lista.appendChild(b); });
    [['rosco', 'El rosco', '25 letras · 85/90 s + acumulado'], ['alaz', 'AlaZ', 'De la A a la Z o al revés · 110 s'], ['rueda', 'La Rueda', 'Empieza por / contiene · sobres']].forEach(([k, t, d]) => { const b = document.createElement('button'); b.className = 'tbtn'; b.innerHTML = `<b>🏁 ${t}</b><small>${d}</small>`; b.onclick = e => { e.stopPropagation(); iniciar('entreno:final:' + k); }; lista.appendChild(b); });
    col.append(lista, volver('play'));
  } else if (p === 'options') {
    col.append(M.h2('Opciones')); col.append(bloqueSonidos(false));
    col.append(M.fila('🎵 Música', siNo('music'), slider('musicVol')), M.fila('🎬 Cabecera', ...opciones('cabecera', [['video', 'Mi vídeo'], ['3d', 'Cabecera 3D']])));
    const cb = M.bloque('🎶 Música de la cabecera'); col.append(cb); pintarMusicaCab(cb);
    col.append(M.fila('🔊 Efectos', siNo('sfx'), slider('sfxVol')));
    const pub = M.bloque('', M.fila('👏 Público', siNo('publico'), slider('publicoVol')), M.nota('Aplausos del público sintetizados por el propio juego (no son grabaciones).')); pub.querySelector('.olabel').remove(); col.append(pub);
    col.append(M.fila('🎤 Voz del presentador', siNo('voz')), M.fila('📖 El presentador lee las preguntas', siNo('lee')), M.fila('⏩ Velocidad de lectura', ...opciones('leeVel', [['normal', 'Normal'], ['rapida', 'Rápida']])),
      M.fila('😄 Chistes del presentador', siNo('chistes')), M.fila('🎭 Monólogo del presentador', siNo('monologo')));
    col.append(M.bloque('👥 Concursantes', M.linea(`${cfg.nombre ? 'Tú: ' + esc(cfg.nombre) + (cfg.profesion ? ' · ' + esc(cfg.profesion) : '') : 'Tú: sin nombre'} · Rivales: ${RIVALES.map(r => esc(r.nombre.split(' ')[0])).join(', ')}`), M.botones([{ t: '✏️ Nombres y profesiones', sel: true, full: true, fn: () => Lt('concursantes') }])));
    col.append(M.bloque('🏟️ Etapa / Plató', M.botones(ETAPAS.filter(e => e.id !== 'rueda-letra').map(e => ({ t: `${e.nombre} ${e.anios}`, sel: cfg.etapa === e.id, fn: () => { cfg.etapa = e.id; guardarCfg(); cargarEtapa(e.id); modoOrbita(); Lt('options'); } })))));
    col.append(M.nota(`${etapaDef.nombre} ${etapaDef.anios}: ${NOTA_ETAPA[etapaDef.id] || ''} Presenta: ${presDe().nombre}.`, 'mtext'));
    getCanciones().then(l => { col.insertBefore(M.bloque('🎵 Mis canciones', M.linea(l.length ? `${l.length} ${l.length === 1 ? 'canción' : 'canciones'}: ${esc(l.map(x => x.name).join(', '))}` : 'Sin canciones: suena la música del juego'), M.botones([{ t: '🎵 Gestionar mis canciones', sel: true, full: true, fn: () => Lt('canciones') }]), M.nota('Sube canciones desde tu dispositivo (se quedan solo en él). Suenan durante las pruebas en lugar de la música del juego.')), calidad); });
    const calidad = M.fila('✨ Calidad gráfica', ...opciones('quality', [['baja', 'Baja'], ['media', 'Media'], ['alta', 'Alta']], aplicarCalidad)); col.append(calidad);
    const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
    col.append(M.fila('⛶ Pantalla completa', M.botones([{ t: standalone ? 'Siempre (app)' : document.fullscreenElement ? 'Salir' : 'Activar', sel: !!document.fullscreenElement, disabled: standalone, fn: async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); try { await screen.orientation.lock('landscape'); } catch (x) { /* */ } } } catch (x) { toast('Tu navegador no permite pantalla completa aquí'); } setTimeout(() => Lt('options'), 300); } }])),
      M.nota(`Rendimiento actual: ${Math.round(fps)} fps. Si el juego va lento en tu móvil, elige calidad «Baja».`, 'mtext'), volver('main'));
  } else if (p === 'sonidos') {
    col.append(volver('options'), M.h2('Cargar sonidos'), bloqueSonidos(true)); pintarListaSonidos(col).then(() => col.append(volver('options')));
  } else if (p === 'canciones') {
    col.append(M.h2('Mis canciones')); const lista = document.createElement('div'); lista.className = 'ocustom'; col.append(lista);
    getCanciones().then(l => { if (!l.length) lista.append(M.linea('Todavía no has subido ninguna canción.'));
      l.forEach((c, i) => lista.append(M.fila('🎵 ' + c.name, ...M.botones([{ t: '▶ Probar', fn: b => probar(URL.createObjectURL(c.blob), b) }, { t: '🗑 Quitar', fn: async () => { l.splice(i, 1); await idb.put('canciones', l); await cargarCanciones(); Lt('canciones'); } }]).children)));
      lista.append(M.botones([{ t: '📂 Subir canción de mi dispositivo', sel: true, full: true, file: { accept: 'audio/*', onFile: async f => { l.push({ name: f.name.replace(/\.[^.]+$/, ''), blob: f }); await idb.put('canciones', l); await cargarCanciones(); toast('✅ ¡Canción guardada en este dispositivo!'); Lt('canciones'); } } }])); });
    col.append(M.nota('Las canciones se quedan solo en este dispositivo; no se suben ni se comparten.'), volver('options'));
  } else if (p === 'concursantes') {
    col.append(M.h2('Concursantes'), M.fila('🙋 Tu nombre', M.texto(cfg, 'nombre', 'Ej.: Iker', 18, guardarCfg)), M.fila('💼 Profesión', M.texto(cfg, 'profesion', 'Ej.: estudiante', 24, guardarCfg)), M.fila('🪪 Presentar a los concursantes', siNo('presentaciones')),
      M.nota('El presentador te presentará al empezar el Programa completo. Tu nombre sale en el marcador y en los créditos.'), volver('options'));
  } else if (p === 'monologos') {
    col.append(M.h2('Monólogos del presentador'), mbtn('🎲 Al azar', 'Uno cualquiera (y luego «Siguiente»)', 'gold', () => iniciar('mono:azar')));
    const l = document.createElement('div'); l.className = 'monolist';
    MONOLOGOS.forEach(mo => { const b = document.createElement('button'); b.className = 'tbtn'; b.innerHTML = `<span>${TIPO_ICONO[mo.tipo]}</span><b>${esc(mo.titulo)}</b><small>${TIPO_TXT[mo.tipo]}</small>`; b.onclick = e => { e.stopPropagation(); sfx('tecla'); iniciar('mono:' + mo.id); }; l.appendChild(b); });
    col.append(l, M.nota(`Los presenta ${presDe().nombre}, presentador virtual de la etapa elegida. Toca el subtítulo para pasar de frase o «Saltar ⏭» para terminar.`, 'mtext'), volver('play'));
  } else if (p === 'help') {
    col.append(volver('main'), M.h2('Cómo se juega')); const d = document.createElement('div'); d.className = 'mtext'; d.innerHTML = AYUDA; col.append(d);
  } else if (p === 'credits') {
    M.pantallaCreditos(col, { bloques: creditos(), extraHTML: `<p><b>Especial 300 suscriptores</b><br>Dedicado a los suscriptores del canal de YouTube «Ikeriano el campeón 2»</p><p class="small">Versión ${VERSION}</p><p class="small">Juego de fans sin ánimo de lucro. «Pasapalabra» y «Rueda la letra» son formatos de televisión de sus respectivos dueños; este juego no está afiliado a ninguna cadena. Los presentadores y concursantes son personajes virtuales inventados.</p>`, onVolver: () => Lt('main') });
  }
}
const NOTA_ETAPA = { 'antena3-2000': 'letras gigantes de colores y atril doble.', 'telecinco-2007': 'plató naranja y azul de la primera etapa en Telecinco.', 'telecinco-2018': 'plató azul con las pruebas de 2018.', 'antena3-2020': 'el plató azul de la vuelta a Antena 3 (rosco y AlaZ).' };
const DESC = { silla_azul: '5 s por pregunta · eliminado con 2 fallos', una_de_cuatro: '90 s · +2 s por acierto', una_de_dos: '90 s · +5 s por acierto', donde_estan: '75 s · 20 s si completas, 10 s al mejor', letra_a_letra: '90 s · 1 s por palabra', que_es_que: '60 s · relaciona palabras raras', palabra_imposible: '60 s · 8 palabras', pista_musical: 'Pulsador con pistas', sopa_letras: 'Encuentra las palabras', palabras_cruzadas: 'Cruza las palabras', piramides: '90 s · anagramas', pulsador: 'Los melones', coco_loco: 'Ahorcado de frases', de_par_en_par: '60 s · parejas', antes_y_despues: '60 s · inicio o fin', la_oportunidad: 'Rueda la letra', he_dicho: 'Rueda la letra', cantando_espero: 'Rueda la letra', con_dos_palabras: 'Rueda la letra', palabras_ocultas: 'Rueda la letra' };
const AYUDA = `<p><b>Objetivo:</b> dos concursantes acumulan <b>segundos</b> en las pruebas. Los segundos se suman al tiempo base de la prueba final: <b>El rosco</b> (25 letras), <b>AlaZ</b> (desde junio de 2026) o <b>La Rueda</b> (Rueda la letra). Quien acierte las 25 palabras se lleva el <b>bote</b>.</p>
<p><b>Silla azul.</b> Eliges entre dos letras y respondes en <b>5 segundos</b>. Con <b>2 fallos</b> quedas eliminado del programa.</p>
<p><b>Una de dos:</b> 90 s, +5 s por acierto. <b>Una de cuatro:</b> 90 s, +2 s por acierto. <b>¿Dónde están?:</b> 75 s para recordar 9 casillas; 20 s si completas el panel, 10 s al que más acierte sin completarlo. <b>La pista musical</b>, <b>Letra a letra</b>, <b>¿Qué es qué?</b>, <b>Sopa de letras</b>, <b>Palabras cruzadas</b>… según la época elegida.</p>
<p><b>El rosco:</b> responde con la letra indicada (empieza por / contiene). «Pasapalabra» guarda la letra para la siguiente vuelta; un fallo pasa el turno al rival.</p>
<p><b>Controles:</b> arrastra para girar la cámara, rueda para zoom. En «Explorar el plató»: WASD o el joystick para andar, arrastra para mirar. ☰ vuelve al menú, 👁 cambia de cámara, 💡 luces, «Saltar ⏭» pasa la cabecera, la despedida y los monólogos.</p>`;
function probar(url, b) { if (probando) { probando.pause(); probando = null; if (b) b.textContent = '▶ Probar'; musica.play('menu'); return; } musica.stop(); probando = new Audio(url); probando.volume = cfg.musicVol; probando.play().catch(() => {}); if (b) b.textContent = '⏹ Parar'; const a = probando; setTimeout(() => { if (probando === a) probar(null, b); }, 12000); }
async function pintarMusicaCab(o) {
  const mu = await recursoEpoca('musica', etapaDef), lo = await recursoEpoca('logo', etapaDef), vid = await idb.get('video:cabecera');
  const todas = async fn => { for (const E of ETAPAS) await fn(E.id); };
  o.append(M.linea(mu ? `🎵 <b>${esc(mu.nombre)}</b>` : 'Sin audio propio: suena la música de la cabecera 3D'),
    M.botones([{ t: '📂 Elegir audio de mi dispositivo', sel: true, full: true, file: { accept: 'audio/*', onFile: async f => { await todas(id => guardarSubido('musica', id, f)); lineaMsg = '✅ ¡Audio guardado en este dispositivo!'; Lt('options'); } } },
      { t: '▶ Probar', disabled: !mu, fn: b => probar(mu.url, b) }, { t: '🗑 Quitar', disabled: !mu || mu.origen !== 'subido', fn: async () => { await todas(id => quitarSubido('musica', id)); lineaMsg = 'Audio quitado: vuelve la música de la cabecera 3D'; Lt('options'); } }]));
  if (lineaMsg) { o.append(M.linea(lineaMsg, 'omsg')); lineaMsg = ''; }
  o.append(M.nota('El audio se queda solo en este dispositivo; no se sube ni se comparte.'), M.nota('Suena en la cabecera del Programa completo, con los mismos movimientos de cámara.'));
  o.append(M.linea(`🎞️ Mi vídeo de cabecera: ${vid ? '<b>' + esc(vid.name) + '</b>' : 'ninguno'}`), M.botones([{ t: '📂 Elegir vídeo', file: { accept: 'video/*', onFile: async f => { await idb.put('video:cabecera', { blob: f, name: f.name }); cfg.cabecera = 'video'; guardarCfg(); Lt('options'); } } }, { t: '🗑 Quitar vídeo', disabled: !vid, fn: async () => { await idb.del('video:cabecera'); cfg.cabecera = '3d'; guardarCfg(); Lt('options'); } }, { t: '▶ Ver cabecera', fn: async () => { $('menu').classList.add('hidden'); musica.stop(); await reproducirCabecera(); irMenu('options'); } }]));
  o.append(M.linea(`🖼️ Logo propio: ${lo && lo.origen === 'subido' ? '<b>' + esc(lo.nombre) + '</b>' : 'el globo de letras'}`), M.botones([{ t: '📂 Elegir imagen', file: { accept: 'image/*', onFile: async f => { await todas(id => guardarSubido('logo', id, f)); await cargarLogoPantalla(etapaDef); Lt('options'); } } }, { t: '🗑 Quitar logo', disabled: !lo || lo.origen !== 'subido', fn: async () => { await todas(id => quitarSubido('logo', id)); await cargarLogoPantalla(etapaDef); Lt('options'); } }]));
}
// ---------- «Cargar sonidos» (como ¡Boom! v1.4): zip o archivos sueltos → IndexedDB, asignados por nombre ----------
let msgSon = '';
const reiniciarMenuMusica = () => { musica.stop(); musica.play('menu'); };
async function alCargar(fs, scroll) {
  const est = document.querySelector('#optSonidos .son-estado'); if (est) est.textContent = '⏳ Cargando ' + fs.map(f => f.name).join(', ') + '…';
  try { const r = await cargarSonidos(fs, reconocer); msgSon = r.total ? `✅ ${r.asignados.length} ${r.asignados.length === 1 ? 'sonido reconocido' : 'sonidos reconocidos'}${r.sinAsignar.length ? ` · ${r.sinAsignar.length} sin asignar (asígnalos abajo en la lista)` : ''}` : '⚠️ No había archivos de audio (mp3, ogg, wav o m4a)'; }
  catch (x) { msgSon = '⚠️ No se pudo leer: ' + x.message; }
  Lt(scroll ? 'sonidos' : 'options'); reiniciarMenuMusica();
}
function bloqueSonidos(enLista) {
  const b = M.bloque('🔊 Cargar sonidos'); b.id = 'optSonidos';
  estadoSonidos().then(e => {
    const n = Object.keys(e.asignados).length, s = e.sueltos.length;
    b.append(M.linea(n || s ? `✅ <b>${n}</b> de ${TODOS_SONIDOS.length} sonidos del juego cargados${s ? ` · ${s} sin asignar` : ''}${cfg.misSonidos === false ? ' · <i>desactivados</i>' : ''}` : '⚠️ No hay sonidos cargados: suenan los sonidos del juego', 'oname son-estado'));
    const bs = M.botones([{ t: '📂 CARGAR SONIDOS (.zip o mp3/ogg/wav/m4a)', sel: true, full: true, file: { accept: '.zip,application/zip,audio/*,.mp3,.ogg,.wav,.m4a', multiple: true, onFile: fs => alCargar(fs, enLista) } }]);
    bs.querySelector('label').classList.add('cargar-son'); b.append(bs);
    b.append(M.fila('🎧 Usar mis sonidos', siNo('misSonidos', () => { reiniciarMenuMusica(); Lt(pantalla); })));
    b.append(M.botones([...(enLista ? [] : [{ t: '📋 Lista de sonidos', fn: () => Lt('sonidos') }]), { t: '🗑 Borrar sonidos cargados', disabled: !n && !s, fn: async () => { await borrarSonidos(); msgSon = 'Sonidos borrados: vuelven los sonidos del juego'; Lt(pantalla); reiniciarMenuMusica(); } }]));
    if (msgSon) { b.append(M.linea(msgSon, 'omsg')); msgSon = ''; }
    b.append(M.nota('Elige un .zip o varios audios: cada archivo se asigna por su nombre (acierto.mp3, fallo.mp3, tictac.mp3, cabecera_a3_2020.mp3, sintonia_t5_2007.mp3, musica_rosco.mp3…). Se guardan solo en este dispositivo. Si hay archivos en la carpeta audio/, se usan esos primero.'));
  });
  return b;
}
function escuchar(id, url, b) {
  if (url) return probar(url, b);
  sfx(id, true);
}
async function pintarListaSonidos(col) {
  const e = await estadoSonidos();
  if (e.sueltos.length) {
    const bx = M.bloque(`❓ Archivos sin asignar (${e.sueltos.length})`); bx.id = 'sonSueltos'; col.append(bx);
    bx.append(M.nota('No se ha reconocido su nombre: elige a qué sonido del juego corresponde cada uno.'));
    for (const x of e.sueltos) {
      const sel = document.createElement('select'); sel.className = 'otext son-asignar';
      sel.innerHTML = '<option value="">Asignar a…</option>' + GRUPOS_SONIDOS.map(g => `<optgroup label="${esc(g.titulo)}">${g.sonidos.map(([id, n]) => `<option value="${id}">${esc(n)}${e.asignados[id] ? ' (cambiar)' : ''}</option>`).join('')}</optgroup>`).join('');
      sel.onclick = ev => ev.stopPropagation(); sel.onpointerdown = ev => ev.stopPropagation();
      sel.onchange = async () => { if (!sel.value) return; await asignarSuelto(x.clave, sel.value); msgSon = `✅ «${x.name}» → ${SONIDO[sel.value].nombre}`; Lt('sonidos'); };
      const r = M.fila('🎵 ' + x.name, sel, ...M.botones([{ t: '▶', fn: b => probar(x.url, b) }, { t: '🗑', fn: async () => { await quitarSuelto(x.clave); Lt('sonidos'); } }]).children); r.classList.add('son-row'); bx.append(r);
    }
  }
  for (const g of GRUPOS_SONIDOS) {
    const bx = M.bloque(g.titulo); bx.classList.add('son-grupo'); col.append(bx);
    for (const [id, nombre] of g.sonidos) {
      const o = await origenSonido(id);
      const est = o.origen === 'cargado' ? `✅ ${esc(o.nombre)}${o.activo ? '' : ' (desactivado)'}` : o.origen === 'carpeta' ? '📁 carpeta audio/' : g.tipo === 'efecto' ? '🎛️ sonido del juego' : id.startsWith('cabecera_') ? '🎛️ música de la cabecera 3D' : id.startsWith('sintonia_') ? '— sin cargar (suena la música del menú)' : '— sin cargar (suena la música general)';
      const r = document.createElement('div'); r.className = 'orow son-row' + (o.origen ? ' cargado' : ''); r.dataset.id = id;
      const l = document.createElement('label'); l.innerHTML = `${esc(nombre)}<small>${est} · <code>${id}</code></small>`; r.append(l);
      const usable = o.origen === 'carpeta' || (o.origen === 'cargado' && o.activo);
      r.append(...M.botones([{ t: '▶ Escuchar', disabled: !usable && !tieneRespaldo(id), fn: b => escuchar(id, usable ? o.url : null, b) },
        { t: o.origen === 'cargado' ? '🔄 Cambiar' : '📂 Subir', file: { accept: 'audio/*,.mp3,.ogg,.wav,.m4a', onFile: async f => { await subirSonido(id, f); msgSon = `✅ ${nombre}: «${f.name}»`; Lt('sonidos'); } } },
        ...(o.origen === 'cargado' ? [{ t: '🗑', fn: async () => { await quitarSonido(id); Lt('sonidos'); } }] : [])]).children);
      bx.append(r);
    }
  }
}
const getCanciones = async () => (await idb.get('canciones')) || [];
async function cargarCanciones() { const l = await getCanciones(); musica.setCanciones(l.map(c => URL.createObjectURL(c.blob))); }
function instalar() {
  const m = M.modal($('menu'), `<h2>Instalar Pasapalabra</h2>${deferredPrompt ? '<p><button class="mbtn gold" id="instNow">📲 Instalar ahora</button></p>' : ''}<p><b>Android (Chrome):</b> menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».</p><p><b>iPhone/iPad (Safari):</b> botón Compartir → «Añadir a pantalla de inicio».</p><p><b>PC (Chrome/Edge):</b> icono de instalar ⊕ en la barra de direcciones.</p><p>Una vez instalada funciona <b>sin conexión</b>.</p>`);
  const n = m.querySelector('#instNow'); if (n) n.onclick = e => { e.stopPropagation(); const d = deferredPrompt; deferredPrompt = null; d.prompt(); m.remove(); };
}
let deferredPrompt = null; addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });

// ---------- iniciar modos ----------
async function iniciar(modo) {
  limpiarTodo(); pantalla = 'juego'; $('menu').classList.add('hidden'); $('topbar').classList.remove('hidden'); audioCtx(); setVoz(cfg.voz && cfg.lee);
  const E = ESPECIALES[cfg.especial] || ESPECIALES.normal;
  try {
    if (modo === 'historia') { await historia(); return irMenu('main'); }
    if (modo === 'explorar') return await explorar();
    if (modo.startsWith('mono:')) return await monologoSuelto(modo.slice(5));
    if (modo.startsWith('entreno:')) {
      const id = modo.slice(8); hashtag('#PasapalabraEntrena'); irACamara('mesa'); musica.play(id.startsWith('final:') ? 'final' : 'pruebas');
      const res = await entrenar($('juego'), etapaDef, id); musica.stop(); marcador(`${esc(id.startsWith('final:') ? id.slice(6) : PRUEBAS[id].nombre)}<br><small>${esc(res)}</small>`);
      acciones([{ label: 'Repetir', cls: 'gold', fn: () => iniciar(modo) }, { label: 'Entrenamiento', fn: () => irMenu('train') }]); return;
    }
    const rueda = modo === 'rueda'; if (rueda && etapaDef.id !== 'rueda-letra') cargarEtapa('rueda-letra'); else if (!rueda && etapaDef.id !== cfg.etapa) cargarEtapa(cfg.etapa);
    hashtag(rueda ? '#RuedaLaLetra' : E.hashtag); if (modo === 'clasico') musica.play('pruebas');
    const r = await jugarPrograma($('juego'), etapaDef, api, { modo: modo === 'clasico' ? 'clasico' : 'programa', especial: cfg.especial });
    musica.stop();
    if (modo !== 'clasico') {
      const P = presDe(); ponerPresentador(P); modoOrbita(); musica.fase(['musica_despedida', 'sintonia_' + ETAPA_CLAVE[etapaDef.id]], 'menu'); sfx('aplausos');
      await saltable(Promise.all([(async () => { await diga(P, r.G.eliminado ? 'Hoy la Silla azul no ha sido tu aliada… ¡pero vuelve pronto! Muchas gracias por jugar.' : '¡Qué gran programa! Muchas gracias por acompañarnos. ¡Hasta mañana!'); if (r.G.rival) await diga(null, FRASES_RIVAL[3], { voz: r.G.rival.voz, quien: r.G.rival.nombre }); })().catch(() => {}), rodarCreditos(creditos(), 16000)]));
      $('credits').classList.add('hidden'); ocultarSub();
    }
    marcador(`${esc(r.linea)}<br><small>Bote para el próximo programa: ${r.bote.toLocaleString('es-ES')} €</small>`);
    acciones([{ label: 'Jugar otra vez', cls: 'gold', fn: () => iniciar(modo) }, { label: 'Menú', fn: () => irMenu('play') }]);
  } catch (e) { if (e !== ABORT) { console.error(e); toast('Error: ' + e.message, 5000); irMenu('play'); } }
}
async function monologo(id, enPrograma = false) {
  const mo = !id || id === 'azar' ? MONOLOGOS[Math.floor(Math.random() * MONOLOGOS.length)] : MONOLOGOS.find(x => x.id === id) || MONOLOGOS[0];
  const P = presDe(); if (!presentador3D) ponerPresentador(P);
  if (mo.cam === 'general' || !etapaDef.modulo.cameras[mo.cam]) planoPresentador(); else irACamara(mo.cam);
  await saltable((async () => { for (const l of mo.lineas) await diga(P, l); sfx('aplausos'); })().catch(e => { if (e !== ABORT) throw e; }));
  ocultarSub(); return mo;
}
async function monologoSuelto(id) {
  hashtag('#Pasapalabra'); sfx('aplausos'); const g0 = gen; const mo = await monologo(id); if (g0 !== gen) return;
  const i = MONOLOGOS.indexOf(mo); const sig = id === 'azar' ? 'azar' : MONOLOGOS[(i + 1) % MONOLOGOS.length].id;
  marcador(`🎭 «${esc(mo.titulo)}»`); modoOrbita();
  acciones([{ label: 'Siguiente ▶', cls: 'gold', fn: () => iniciar('mono:' + sig) }, { label: 'Repetir', fn: () => iniciar('mono:' + mo.id) }, { label: 'Lista', fn: () => irMenu('monologos') }]);
}
let historiaUI = null;
async function historia() {
  hashtag('#PasapalabraHistoria'); musica.play('menu'); const N = CAPITULOS.length; const g0 = gen;
  historiaUI = M.interfazHistoria({ total: N, presentador: 'El presentador' });
  let idx = 0, mover = null;
  historiaUI.on({ prev: () => mover && mover(Math.max(0, idx - 1)), next: () => mover && mover(idx + 1), skip: () => mover && mover('skip'), ir: i => mover && mover(i) });
  const leer = async (P, texto) => { historiaUI.el.querySelector('#hSub b').textContent = P.nombre; historiaUI.subtitulo(texto); let d = null;
    await Promise.race([(async () => { await decir(texto, { voz: vozDe(P) }); await espera(1200); })(), new Promise(r => { mover = x => { d = x; callar(); r(); }; })]);
    if (g0 !== gen) throw ABORT; return d; };
  while (idx < N) {
    const c = CAPITULOS[idx], P = PRESENTADORES[c.p];
    if (etapaDef.id !== c.plato) cargarEtapa(c.plato); ponerPresentador(P); planoPresentador();
    historiaUI.mostrar(idx, { emoji: c.emoji, t: c.t, rows: c.ficha });
    let d = null;
    for (const [k, txt] of c.textos.entries()) { if (k > 0) irACamara(c.cam); d = await leer(P, txt); if (d != null) break; }
    idx = d == null || d === 'skip' ? idx + 1 : d;
  }
  historiaUI.cerrar(); historiaUI = null; quitarPresentador();
}

// ---------- explorar / paseo ----------
let paseo = false; const teclas = {}; let yaw = 0, pitch = 0; const joy = { x: 0, y: 0 };
function entrarPaseo() { paseo = true; controls.enabled = false; tween = null; orbitar = false; const d = new THREE.Vector3().subVectors(controls.target, camera.position); yaw = Math.atan2(-d.x, -d.z); pitch = 0; camera.position.y = 1.7; }
function salirPaseo() { paseo = false; controls.enabled = true; const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); controls.target.copy(camera.position).addScaledVector(f, 4); controls.update(); }
async function explorar() {
  hashtag('#Pasapalabra'); musica.play('menu'); irACamara('general', true); const P = presDe(); ponerPresentador(P);
  entrarPaseo(); $('joy').classList.remove('hidden'); $('hint').textContent = '🕹️ Joystick / WASD para andar · arrastra para mirar · Mayús para correr'; $('hint').classList.remove('hidden'); setTimeout(() => $('hint').classList.add('hidden'), 6000);
  diga(P, '¡Bienvenido al plató! Date una vuelta, pero no toques el rosco.').catch(() => {});
}
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; teclas[e.code] = true; });
addEventListener('keyup', e => { teclas[e.code] = false; });
let arrastre = null;
renderer.domElement.addEventListener('pointerdown', e => { if (paseo) arrastre = [e.clientX, e.clientY]; });
addEventListener('pointerup', () => { arrastre = null; });
addEventListener('pointermove', e => { if (!paseo || !arrastre) return; yaw -= (e.clientX - arrastre[0]) * 0.004; pitch = Math.max(-1.2, Math.min(1.2, pitch - (e.clientY - arrastre[1]) * 0.004)); arrastre = [e.clientX, e.clientY]; });
{ const j = $('joy'), k = $('knob'); let id = null; const mv = e => { const r = j.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } joy.x = x; joy.y = y; k.style.transform = `translate(${x * 30}px,${y * 30}px)`; };
  j.addEventListener('pointerdown', e => { e.stopPropagation(); id = e.pointerId; j.setPointerCapture(id); mv(e); }); j.addEventListener('pointermove', e => { if (e.pointerId === id) mv(e); });
  const fin = () => { id = null; joy.x = joy.y = 0; k.style.transform = ''; }; j.addEventListener('pointerup', fin); j.addEventListener('pointercancel', fin); }
function pasoPaseo(dt) {
  const v = (teclas.ShiftLeft || teclas.ShiftRight ? 9 : 4) * dt;
  const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  let fy = -joy.y, fx = joy.x; if (teclas.KeyW || teclas.ArrowUp) fy += 1; if (teclas.KeyS || teclas.ArrowDown) fy -= 1; if (teclas.KeyA || teclas.ArrowLeft) fx -= 1; if (teclas.KeyD || teclas.ArrowRight) fx += 1;
  camera.position.addScaledVector(f, v * Math.max(-1, Math.min(1, fy))).addScaledVector(r, v * Math.max(-1, Math.min(1, fx)));
  camera.position.y = 1.7; camera.rotation.set(pitch, yaw, 0, 'YXZ');
}

// ---------- barra superior ----------
$('btnMenu').onclick = e => { e.stopPropagation(); sfx('tecla'); irMenu(pantalla === 'juego' ? 'play' : 'main'); };
$('btnCam').onclick = e => { e.stopPropagation(); sfx('tecla'); if (paseo) { salirPaseo(); toast('👁 Cámara libre', 1200); return; }
  const ks = Object.keys(etapaDef.modulo.cameras).filter(k => k !== 'salida'); camFija = (camFija + 1) % (ks.length + 1); if (camFija) { irACamara(ks[camFija - 1]); toast('👁 ' + etapaDef.modulo.cameras[ks[camFija - 1]].label, 1300); } else toast('👁 Cámara automática', 1200); };
$('btnSkip').onclick = e => { e.stopPropagation(); if (cab) pararCabecera(); else if (limpiarSkip) limpiarSkip(); };
$('btnLuces').onclick = e => { e.stopPropagation(); $('glights').classList.toggle('hidden'); };
$('glights').innerHTML = `<div class="gl-head"><b>💡 Luces del plató</b><button data-close>✕</button></div><label>Exposición <input type="range" min="0.5" max="1.6" step="0.05" value="1" id="glExp"></label><label>Brillo (bloom) <input type="range" min="0" max="1" step="0.02" value="0.32" id="glBloom"></label>`;
$('glights').addEventListener('click', e => { e.stopPropagation(); if (e.target.closest('[data-close]')) $('glights').classList.add('hidden'); });
$('glExp').oninput = e => { renderer.toneMappingExposure = +e.target.value; }; $('glBloom').oninput = e => { bloom.strength = +e.target.value; bloomOn = bloom.strength > 0.01; };
function atras() { if ($('menu').querySelector('.modal')) { $('menu').querySelector('.modal').remove(); return true; } if ($('menu').classList.contains('hidden')) { $('btnMenu').click(); return true; } const d = VOLVER[pantalla]; if (d) { sfx('tecla'); Lt(d); return true; } return false; }
window.__back = atras; addEventListener('keydown', e => { if (e.key === 'Escape') atras(); });

// ---------- bucle ----------
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); if (cab) cab.inst.resize(innerWidth, innerHeight); });
const clock = new THREE.Clock(); let elapsed = 0, fps = 60;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05); elapsed += dt; fps = fps * 0.95 + (1 / Math.max(dt, 0.001)) * 0.05;
  if (cab) { const t = performance.now() / 1000 - cab.start; if (t >= cab.def.cabecera.DURACION) pararCabecera(); else { renderCab(t); return; } }
  if (tween) { tween.t += dt / tween.dur; const k = tween.t >= 1 ? 1 : 1 - Math.pow(1 - tween.t, 3); camera.position.lerpVectors(tween.fromPos, tween.toPos, k); controls.target.lerpVectors(tween.fromTgt, tween.toTgt, k); if (tween.t >= 1) tween = null; }
  if (orbitar) { const o = camera.position.clone().sub(controls.target); o.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.06); camera.position.copy(controls.target).add(o); }
  if (paseo) pasoPaseo(dt); else controls.update();
  if (presentador3D) presentador3D.rotation.z = Math.sin(elapsed * 2.2) * 0.03;
  if (etapa) etapa.update(elapsed, dt);
  if (bloomOn) composer.render(); else renderer.render(scene, camera);
}
renderer.setAnimationLoop(frame);

// ---------- frases para pregenerar las voces (tools/frases.mjs → gen_voces.py) ----------
window.__frases = () => {
  const out = []; const add = (v, t, q = false) => t && out.push({ v, t, q });
  for (const c of CAPITULOS) c.textos.forEach(t => add(vozDe(PRESENTADORES[c.p]), t));
  for (const P of Object.values(PRESENTADORES)) {
    const v = vozDe(P); MONOLOGOS.forEach(m => m.lineas.forEach(l => add(v, l))); CHISTES.forEach(c => add(v, c));
    Object.values(ESPECIALES).forEach(e => add(v, e.saludo)); ['Pasapalabra', 'Rueda la letra'].forEach(n => add(v, `¡Muy buenas y bienvenidos a ${n}! Hoy tenemos un programa lleno de palabras. ¡Que empiece el juego!`));
    ['Vamos a conocer a los concursantes de hoy.', 'Hoy la Silla azul no ha sido tu aliada… ¡pero vuelve pronto! Muchas gracias por jugar.', '¡Qué gran programa! Muchas gracias por acompañarnos. ¡Hasta mañana!', '¡Bienvenido al plató! Date una vuelta, pero no toques el rosco.'].forEach(t => add(v, t));
  }
  RIVALES.forEach(r => FRASES_RIVAL.forEach(t => add(r.voz, t)));
  // preguntas (voz/q): las mismas cadenas que lee motor.habla()
  const B = n => banco(n);
  B('silla_azul').forEach(q => q.letras.forEach(L => add('davefx', q[L].p, true)));
  [...B('una_de_cuatro'), ...B('una_de_dos')].forEach(q => add('davefx', q.p, true));
  B('palabra_imposible').forEach(p => p.defs.forEach(d => add('davefx', d[0], true)));
  B('letra_a_letra').forEach(p => p.palabras.forEach((w, i) => add('davefx', `${p.defs[i]} (${w.length} letras)`, true)));
  B('piramides').forEach(p => p.palabras.forEach((w, i) => add('davefx', `${p.defs[i]} — empieza por ${w[0].toUpperCase()} (${w.length} letras)`, true)));
  B('rosco').forEach(set => set.forEach(([L, modo, def]) => add('davefx', `${modo === 'e' ? 'Con la' : 'Contiene la'} ${L}. ${def}`, true)));
  const vistos = new Set(); return out.filter(f => { const k = f.v + '|' + f.t + '|' + f.q; if (vistos.has(k)) return false; vistos.add(k); return true; });
};

// ---------- arranque ----------
aplicarCalidad(); cargarCanciones();
cargarEtapa(params.get('plato') || cfg.etapa); modoOrbita();
cargarLogoPantalla(etapaDef).then(() => { if ((pantalla === 'title' || pantalla === 'main') && !$('menu').classList.contains('hidden')) Lt(pantalla); });
Lt(params.has('main') ? 'main' : 'title');
addEventListener('pointerdown', function una() { audioCtx(); if (!$('menu').classList.contains('hidden') && !musica.nombre) musica.play('menu'); removeEventListener('pointerdown', una); });
document.addEventListener('visibilitychange', () => { if (document.hidden) musica.stop(); });
$('loading').classList.add('hidden');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.__juego = { cargarEtapa, PRUEBAS, jugarFinal, UI, FORMATOS, hud, estiloDe, iniciar, irMenu, cfg };
window.__plato = { scene, camera, renderer, etapa: () => etapa, ok: true };
