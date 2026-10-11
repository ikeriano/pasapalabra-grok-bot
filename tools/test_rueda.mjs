// Rueda la letra: juega cada prueba (entrenamiento, modo auto) y saca capturas de cada grafismo
import puppeteer from 'puppeteer-core';
const PORT = process.argv[2] || 8777;
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
let err = 0; const w = ms => new Promise(r => setTimeout(r, ms));
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
p.on('pageerror', e => { console.log('PAGEERROR', e.message); err++; }); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|404/.test(m.text())) { console.log('console.error', m.text()); err++; } });
await p.goto(`http://localhost:${PORT}/index.html?main&auto&vel=2&capture`); await p.waitForFunction('window.__plato && window.__plato.ok', { timeout: 90000 }); await w(1500);
await p.evaluate(() => { const c = window.__juego.cfg; c.voz = false; c.music = false; c.sfx = false; c.publico = false; localStorage.setItem('ppj_cfg', JSON.stringify(c)); window.__juego.cargarEtapa('rueda-letra'); }); await w(4000);
const vistos = new Set(), cuenta = {};
for (const id of ['la_oportunidad', 'he_dicho', 'cantando_espero', 'con_dos_palabras', 'palabras_ocultas', 'final:rueda']) {
  await p.evaluate(id => { window.__juego.iniciar('entreno:' + id); }, id); await w(800);
  const t0 = Date.now(); let fin = false;
  while (Date.now() - t0 < 240000) {
    await w(350);
    const st = await p.evaluate(() => { const h = document.getElementById('hud'); return { cls: h.className, n: h.querySelectorAll('.rl-pills .ok, .rl-grid .off, .rlo-a.on, .rlf-l.ok, .rlf-l.ko').length, fin: document.getElementById('actions').children.length > 0, a: document.getElementById('actions').innerHTML.slice(0, 120), mk: document.getElementById('marcador').innerText.slice(0, 100) }; });
    const m = st.cls.match(/(rl-op|rl-lista l\d|hud-duelo|rl-final l\d|rl-ledw)/); let k = m && m[1];
    if (k && st.cls.includes('rl-lista')) k += st.cls.includes('l1') ? '' : ''; 
    if (k) { const key = `${id}_${k.replace(/\s/g, '')}`; cuenta[key] = (cuenta[key] || 0) + 1; const quiero = !vistos.has(key) && (st.n >= 2 || cuenta[key] >= (/ledw|l1/.test(k) ? 1 : 6)); if (quiero) { vistos.add(key); await p.screenshot({ path: `capturas/rl_${key}.png` }); } }
    if (st.fin) { fin = true; break; }
  }
  console.log(id, fin ? 'TERMINADA' : 'NO TERMINÓ'); if (!fin) err++;
}
console.log('capturas:', [...vistos].join(', '));
for (const need of ['la_oportunidad_rl-op', 'he_dicho_rl-ledw', 'he_dicho_rl-listal0', 'he_dicho_rl-listal1', 'cantando_espero_hud-duelo', 'palabras_ocultas_rl-listal0', 'final:rueda_rl-finall0']) if (!vistos.has(need)) { console.log('FALTA', need); err++; }
// plató: pantalla central «LA LETRA» y atril de cristal
await p.evaluate(() => window.__juego.irMenu('main')); await w(1000);
await p.evaluate(() => { document.getElementById('menu').classList.add('hidden'); }); 
console.log('errores', err); await b.close();
