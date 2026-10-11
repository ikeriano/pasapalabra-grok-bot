// Carga un zip de sonidos generados desde Opciones → «Cargar sonidos» y comprueba que suenan en una partida (Programa completo, Antena 3 2020)
import puppeteer from 'puppeteer-core';
const ZIP = process.argv[2] || '/tmp/sonidos_prueba.zip', PORT = process.argv[3] || 8777;
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
let err = 0; p.on('pageerror', e => { console.log('PAGEERROR', e.message); err++; }); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|404/.test(m.text())) { console.log('console.error', m.text()); err++; } });
await p.evaluateOnNewDocument(() => { window.__suenan = []; const o = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__suenan.push(this.src); return o.call(this); }; });
const w = ms => new Promise(r => setTimeout(r, ms));
const clic = async t => { const ok = await p.evaluate(t => { const x = [...document.querySelectorAll('button')].find(b => b.offsetParent && b.textContent.includes(t)); if (x) x.click(); return !!x; }, t); if (!ok) { console.log('NO', t); err++; } await w(900); };
await p.goto(`http://localhost:${PORT}/index.html?capture`); await p.waitForFunction('window.__plato && window.__plato.ok', { timeout: 90000 }); await w(1500);
await p.evaluate(() => { const c = window.__juego.cfg; c.etapa = 'antena3-2020'; c.voz = false; c.music = true; c.misSonidos = true; localStorage.setItem('ppj_cfg', JSON.stringify(c)); window.__juego.cargarEtapa('antena3-2020'); });
await p.mouse.click(640, 600); await w(2500);
await clic('Opciones'); await w(1200);
const inp = await p.waitForSelector('#optSonidos input[type=file]'); await inp.uploadFile(ZIP);
await p.waitForFunction(() => /sonidos del juego cargados/.test(document.querySelector('#optSonidos')?.innerText || ''), { timeout: 30000 }); await w(1500);
console.log('estado:', await p.evaluate(() => document.querySelector('#optSonidos').innerText.split('\n').slice(1, 3).join(' | ')));
await p.screenshot({ path: 'capturas/son_01_opciones.png' });
console.log('menú con la sintonía cargada:', await p.evaluate(() => window.__suenan.includes(window.__urlSonido('sintonia_a3_2020'))));
await clic('Lista de sonidos'); await p.waitForSelector('.son-grupo .son-row', { timeout: 30000 }); await w(1500);
console.log('filas en la lista:', await p.evaluate(() => document.querySelectorAll('.son-grupo .son-row').length), '· cargadas:', await p.evaluate(() => document.querySelectorAll('.son-grupo .son-row.cargado').length));
// asignar a mano el no reconocido
await p.evaluate(() => { const s = document.querySelector('#sonSueltos select'); s.value = 'musica_pista_musical'; s.dispatchEvent(new Event('change')); });
await p.waitForFunction(() => !document.querySelector('#sonSueltos') && document.querySelector('.son-row[data-id=musica_pista_musical].cargado'), { timeout: 15000 }); await w(800);
console.log('asignado a mano: musica_pista_musical =', await p.evaluate(() => !!window.__urlSonido('musica_pista_musical')));
// escuchar
await p.evaluate(() => { window.__suenan = []; document.querySelector('.son-row[data-id=acierto] button').click(); }); await w(500);
console.log('botón escuchar (acierto):', await p.evaluate(() => window.__suenan.includes(window.__urlSonido('acierto'))));
await p.evaluate(() => document.querySelector('.son-row[data-id=cabecera_a3_2020]').scrollIntoView({ block: 'center' })); await w(500);
await p.screenshot({ path: 'capturas/son_02_lista.png' });
await p.evaluate(() => { document.querySelector('.son-row[data-id=acierto]').scrollIntoView({ block: 'start' }); }); await w(400); await p.screenshot({ path: 'capturas/son_03_efectos.png' });
// partida completa
await p.evaluate(() => { const P = window.__juego.PRUEBAS, o = P.silla_azul.jugar; P.silla_azul.jugar = async function (G, ui) { await o.call(this, G, ui); G.eliminado = false; }; // el modo auto falla siempre: que no quede eliminado
  window.__AUTO = true; window.__VEL = 12; window.__suenan = []; window.__juego.iniciar('programa'); });
const t0 = Date.now(); let fin = false;
while (Date.now() - t0 < 400000) {
  await w(1500);
  const st = await p.evaluate(() => ({ fin: document.getElementById('actions').children.length > 0, skip: !document.getElementById('btnSkip').classList.contains('hidden'), opc: document.querySelector('#juego .j-opc.vert button') }));
  if (st.skip && Date.now() - t0 > 6000) await p.evaluate(() => document.getElementById('btnSkip').click());
  if (st.fin) { fin = true; break; }
}
console.log('partida', fin ? 'TERMINADA' : 'NO TERMINÓ', Math.round((Date.now() - t0) / 1000) + 's'); if (!fin) err++;
const nombres = ['cabecera_a3_2020', 'sintonia_a3_2020', 'musica_silla_azul', 'musica_una_de_cuatro', 'musica_pista_musical', 'musica_pruebas', 'musica_rosco', 'musica_final', 'acierto', 'fallo', 'pasapalabra', 'tictac', 'fin_tiempo', 'bote', 'rosco', 'aplausos'];
const res = await p.evaluate(n => { const s = new Set(window.__suenan); return n.map(x => [x, s.has(window.__urlSonido(x))]); }, nombres);
console.log('suenan en partida:', res.map(([n, v]) => `${n}:${v ? 'sí' : 'NO'}`).join(' '));
const imprescindibles = ['cabecera_a3_2020', 'sintonia_a3_2020', 'musica_silla_azul', 'musica_una_de_cuatro', 'tictac', 'fin_tiempo', 'bote', 'rosco', 'aplausos'];
for (const [n, v] of res) if (!v && imprescindibles.includes(n)) err++;
const v = n => res.find(x => x[0] === n)[1]; if (!v('musica_rosco') && !v('musica_final')) err++; // rosco → musica_rosco; AlaZ → musica_final
if (!res.find(x => x[0] === 'acierto')[1] && !res.find(x => x[0] === 'fallo')[1]) err++;
// interruptor «Usar mis sonidos» desactivado → no suena ningún sonido cargado
await p.evaluate(() => { window.__juego.irMenu('options'); }); await w(1500);
await p.evaluate(() => { [...document.querySelectorAll('#optSonidos .orow button')][0].click(); }); await w(1500);
await p.evaluate(() => { window.__suenan = []; window.__juego.iniciar('entreno:una_de_cuatro'); }); await w(15000);
const blobs = await p.evaluate(() => window.__suenan.filter(u => u.startsWith('blob:')).length);
console.log('interruptor desactivado, sonidos cargados que suenan (debe ser 0):', blobs, '· cfg.misSonidos =', await p.evaluate(() => window.__juego.cfg.misSonidos)); if (blobs) err++;
// recarga: siguen guardados; borrar
await p.goto(`http://localhost:${PORT}/index.html?capture`); await p.waitForFunction('window.__plato && window.__plato.ok', { timeout: 90000 }); await w(1500); await p.mouse.click(640, 600); await w(2500);
await clic('Opciones'); await p.waitForSelector('#optSonidos .son-estado'); await w(800);
console.log('tras recargar:', await p.evaluate(() => document.querySelector('#optSonidos .son-estado').innerText));
await clic('Borrar sonidos cargados'); await p.waitForFunction(() => /No hay sonidos/.test(document.querySelector('#optSonidos .son-estado')?.innerText || ''), { timeout: 15000 });
console.log('tras borrar:', await p.evaluate(() => document.querySelector('#optSonidos .son-estado').innerText));
console.log('errores', err); await b.close();
