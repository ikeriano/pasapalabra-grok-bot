// Juega solo (?auto) el programa completo de cada etapa y Rueda la letra; saca capturas de grafismos que aparecen.
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
let err = 0; const w = ms => new Promise(r => setTimeout(r, ms));
const etapas = (process.argv[2] || 'antena3-2020,telecinco-2007,telecinco-2018,antena3-2000,rueda').split(',');
for (const et of etapas) {
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
  p.on('pageerror', e => { console.log(et, 'PAGEERROR', e.message); err++; }); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|404/.test(m.text())) { console.log(et, 'console.error', m.text()); err++; } });
  await p.goto(`http://localhost:8777/index.html?main&auto&vel=12`); await p.waitForFunction('window.__plato && window.__plato.ok', { timeout: 90000 }); await w(1500);
  await p.evaluate(et => { const c = window.__juego.cfg; c.voz = false; c.music = false; if (et !== 'rueda') { c.etapa = et; } localStorage.setItem('ppj_cfg', JSON.stringify(c)); window.__juego.iniciar(et === 'rueda' ? 'rueda' : 'programa'); }, et);
  const vistos = new Set(); const t0 = Date.now(); let fin = false;
  while (Date.now() - t0 < 420000) {
    await w(1500);
    const st = await p.evaluate(() => ({ modo: document.getElementById('hud').className, fin: document.getElementById('actions').children.length > 0, skip: !document.getElementById('btnSkip').classList.contains('hidden') }));
    if (st.skip) await p.evaluate(() => document.getElementById('btnSkip').click());
    const k = (st.modo.match(/hud-(op4|lal|qeq|rsolo|duelo|caps|gen)/) || [])[1];
    if (k && !vistos.has(k)) { vistos.add(k); await p.screenshot({ path: `capturas/7_${et}_${k}.png` }); }
    if (st.fin) { fin = true; await p.screenshot({ path: `capturas/7_${et}_fin.png` }); break; }
  }
  console.log(et, fin ? 'TERMINADO' : 'NO TERMINÓ', [...vistos].join(','), Math.round((Date.now() - t0) / 1000) + 's'); if (!fin) err++;
  await p.close();
}
console.log('errores', err); await b.close();
