import puppeteer from 'puppeteer-core'; import fs from 'fs';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8777/index.html?main'); await p.waitForFunction('window.__plato && window.__plato.ok', { timeout: 90000 });
const f = await p.evaluate(() => window.__frases()); fs.writeFileSync(process.argv[2] || '/tmp/frases_ppj.json', JSON.stringify(f)); console.log(f.length, 'frases', f.filter(x => x.q).length, 'preguntas'); await b.close();
