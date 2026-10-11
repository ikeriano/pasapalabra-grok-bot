import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let err = 0; const w = ms => new Promise(r => setTimeout(r, ms));
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
p.on('pageerror', e => { console.log('PAGEERROR', e.message); err++; });
await p.goto('http://localhost:8777/index.html?main'); await p.waitForFunction('window.__plato && window.__plato.ok', { timeout: 90000 }); await w(2500);
await p.evaluate(() => { document.getElementById('menu').classList.add('hidden'); });
const G = `({ equipos: [{ nombre: 'Naranja', color: '#f80', seg: 12 }, { nombre: 'Azul', color: '#08f', seg: 9 }], bote: 864000 })`;
const mk = `((n, ok) => ({ set: Array.from('ABCDEFGHIJLMNÑOPQRSTUVXYZ').map(l => [l]), e: Array.from({ length: 25 }, (_, i) => i < ok ? (i % 9 === 4 ? 'ko' : 'ok') : null), i: ok, t: n }))`;
const casos = [
  ['60_una_de_cuatro', 'azul', `h.opciones4(${G}, 'Es capaz de alcanzar una velocidad de cinco metros por hora excavando', ['Buitre negro', 'Topo', 'Jaguar', 'Delfín'], 85)`],
  ['61_una_de_cuatro_acierto', 'azul', `h.opciones4(${G}, '¿Cuál es el río más largo de la península ibérica?', ['Ebro', 'Tajo', 'Duero', 'Guadalquivir'], 62, { marca: 1, ok: true })`],
  ['62_rosco_individual_azul', 'azul', `h.rosco(${G}, { H: ${mk}(6, 21), R: ${mk}(80, 10) }, 'H', { nombres: ['PABLO', 'RIVAL'] })`],
  ['63_rosco_individual_rival', 'azul', `h.rosco(${G}, { H: ${mk}(6, 21), R: ${mk}(18, 7) }, 'R', { nombres: ['TÚ', 'LUPE'] })`],
  ['64_letra_a_letra_t5', 't5', `h.letraALetra(${G}, { panel: ['casa', 'capa', 'capo', 'caño', 'paño'], hechas: new Set([0, 1, 2]), actual: 3, tiempo: 11 })`],
  ['65_que_es_que_t5', 't5', `h.queEsQue({ raras: ['Este', 'Seno', 'Ponto'], comunes: ['Golfo', 'Mar', 'Báltico'], hechas: new Set([0]), actual: 1, tiempo: 57 })`],
  ['66_palabra_imposible_t5', 't5', `h.queEsQue({ raras: ['Bonhomía', 'Petricor', 'Acendrado', 'Ataraxia', 'Serendipia', 'Inefable'], comunes: ['Olor que desprende la tierra mojada'], actual: 0, tiempo: 41 })`],
  ['67_pulsador_t5', 't5', `h.duelo(${G}, { texto: '1961', pista: 3, activo: 0 })`],
  ['68_rosco_individual_rueda', 'rueda', `h.rosco(${G}, { H: ${mk}(44, 13), R: ${mk}(80, 10) }, 'H', { nombres: ['TÚ', 'RIVAL'] })`],
];
const plato = { azul: 'antena3-2020', t5: 'telecinco-2007', rueda: 'rueda-letra' };
for (const [n, st, js] of casos) {
  await p.evaluate(`window.__juego.cargarEtapa('${plato[st]}', { camara: 'mesa' })`); await w(900);
  await p.evaluate(`(() => { const h = window.__juego.hud(); h.limpiar(); h.set('${st}'); ${js}; })()`); await w(700);
  await p.screenshot({ path: 'capturas/' + n + '.png' }); console.log('ok', n);
}
console.log('errores', err); await b.close();
