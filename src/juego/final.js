// Prueba final: El rosco / AlaZ / La Rueda (25 definiciones, dos concursantes por turnos)
import { banco, esCorrecta, espera, esc, Reloj, habla, sonido } from './motor.js';
import { hud } from './grafismos.js';

function svgRosco(items, estados, cur, color) {
  const n = items.length, R = 92;
  const bolas = items.map((it, i) => {
    const a = -Math.PI / 2 + i / n * Math.PI * 2, x = 110 + Math.cos(a) * R, y = 110 + Math.sin(a) * R;
    const st = estados[i]; const fill = st === 'ok' ? '#19c25a' : st === 'ko' ? '#e02020' : i === cur ? '#ffd400' : color;
    return `<circle cx="${x}" cy="${y}" r="11" fill="${fill}" stroke="#fff" stroke-width="1.5"/><text x="${x}" y="${y + 4}" font-size="11" text-anchor="middle" fill="#fff" font-weight="700">${it[0]}</text>`;
  }).join('');
  return `<svg viewBox="0 0 220 220" class="j-rosco">${bolas}</svg>`;
}

/** tipo: 'rosco' | 'alaz' | 'rueda'. base: segundos base (90/85/110/85) */
export async function jugarFinal(G, ui, { tipo = 'rosco', base = 85, nombre = 'El rosco' }) {
  const sets = banco('rosco');
  let setH = sets[0], setR = sets[1] || sets[0];
  const tH = base + G.equipos[0].seg, tR = base + G.equipos[1].seg;
  let empiezaH = tH >= tR; // empieza quien más segundos tiene (empate: naranja/primero)
  let cont = ui.pantalla(`<p class="j-reglas">${reglasFinal(tipo, base)}</p><div class="j-def">Tu tiempo: <b>${tH} s</b> (${base} + ${G.equipos[0].seg}) · Rival: <b>${tR} s</b></div>`); ui.cabecera(G, nombre);
  if (tipo === 'rueda') {
    if (empiezaH) { cont.insertAdjacentHTML('beforeend', '<div class="j-def">Tienes más segundos: elige sobre</div><div class="j-opc"><button data-v="0">✉️ Sobre 1</button><button data-v="1">✉️ Sobre 2</button></div>'); const s = +await ui.clic(cont); setH = sets[s] || sets[0]; setR = sets[1 - s] || sets[0]; }
    else { await ui.aviso(cont, 'El rival tiene más segundos: elige sobre y empieza', 1300); }
  } else if (tipo === 'alaz') {
    if (empiezaH) { cont.insertAdjacentHTML('beforeend', '<div class="j-def">Elige secuencia</div><div class="j-opc"><button data-v="az">De la A a la Z</button><button data-v="za">De la Z a la A</button></div>'); const d = await ui.clic(cont); if (d === 'za') setH = setH.slice().reverse(); else setR = setR.slice().reverse(); }
    else { const rz = Math.random() < 0.5; if (rz) setR = setR.slice().reverse(); else setH = setH.slice().reverse(); await ui.aviso(cont, `El rival elige ${rz ? 'de la Z a la A' : 'de la A a la Z'}: tú juegas la otra`, 1500); }
    await ui.continuar(cont, 'Empezar ▸');
  } else await ui.continuar(cont, 'Empezar ▸');

  const est = { H: { set: setH, e: Array(25).fill(null), i: 0, t: tH, letras: {} }, R: { set: setR, e: Array(25).fill(null), i: 0, t: tR } };
  const pendiente = s => s.e.some(x => x === null);
  const sig = s => { for (let k = 0; k < 25; k++) { const j = (s.i + k) % 25; if (s.e[j] === null) { s.i = j; return true; } } return false; };
  let turno = empiezaH ? 'H' : 'R';
  const pinta = (msg = '') => {
    cont = ui.pantalla(`<div class="j-final"><div><h4>Tú · ${Math.ceil(est.H.t)} s</h4>${svgRosco(est.H.set, est.H.e, turno === 'H' ? est.H.i : -1, '#ff7a00')}</div><div class="j-fcentro">${msg}</div><div><h4>Rival · ${Math.ceil(est.R.t)} s</h4>${svgRosco(est.R.set, est.R.e, turno === 'R' ? est.R.i : -1, '#2a5cff')}</div></div>`);
    ui.cabecera(G, nombre); hud().rosco(G, est, turno); return cont.querySelector('.j-fcentro');
  };
  while ((est.H.t > 0 && pendiente(est.H)) || (est.R.t > 0 && pendiente(est.R))) {
    if (turno === 'H' && (est.H.t <= 0 || !pendiente(est.H))) turno = 'R';
    if (turno === 'R' && (est.R.t <= 0 || !pendiente(est.R))) { if (est.H.t > 0 && pendiente(est.H)) turno = 'H'; else break; }
    if (turno === 'H') {
      const reloj = new Reloj(est.H.t, v => { est.H.t = v; const h = cont.querySelector('h4'); if (h) h.textContent = `Tú · ${Math.ceil(v)} s`; hud().tiempoRosco(0, v); }).start();
      let seguir = true;
      while (seguir && sig(est.H) && !reloj.terminado) {
        const [L, modo, def, r] = est.H.set[est.H.i];
        const pista = estructura(tipo, L, modo, r, est.H.letras[est.H.i]);
        const centro = pinta(`<div class="j-letra">${modo === 'e' ? 'Empieza por' : 'Contiene la'} <b>${L}</b></div><div class="j-def">${esc(def)}</div>${pista}`);
        habla(`${modo === 'e' ? 'Con la' : 'Contiene la'} ${L}. ${def}`);
        const a = await ui.respuesta(centro, { pasa: tipo === 'rueda' ? 'Paso' : 'Pasapalabra', letra: tipo === 'alaz' }, [reloj.fin]);
        if (a === 'TIEMPO') break;
        if (a === 'LETRA') { if (!est.H.letras[est.H.i]) { reloj.quitar(5); est.H.letras[est.H.i] = revela(r); } continue; }
        if (a === 'PASA') { sonido('pasapalabra'); est.H.i = (est.H.i + 1) % 25; seguir = false; break; }
        if (esCorrecta(a, r)) { est.H.e[est.H.i] = 'ok'; sonido('acierto'); est.H.i = (est.H.i + 1) % 25; }
        else { est.H.e[est.H.i] = 'ko'; sonido('fallo'); await ui.aviso(centro, `❌ Era <b>${esc(r.split('|')[0])}</b>`, 1300); est.H.i = (est.H.i + 1) % 25; seguir = false; }
      }
      reloj.stop(); turno = 'R';
    } else {
      // rival simulado: ~4 s de su reloj por definición
      let seguir = true;
      while (seguir && sig(est.R) && est.R.t > 0) {
        const centro = pinta(`<div class="j-def">Juega el rival… (${est.R.set[est.R.i][0]})</div>`);
        await espera(900); est.R.t = Math.max(0, est.R.t - (3 + Math.random() * 3));
        const x = Math.random();
        if (x < 0.62) { est.R.e[est.R.i] = 'ok'; est.R.i = (est.R.i + 1) % 25; }
        else if (x < 0.8) { est.R.i = (est.R.i + 1) % 25; seguir = false; await ui.aviso(centro, `Rival: «${tipo === 'rueda' ? 'Paso' : 'Pasapalabra'}»`, 700); }
        else { est.R.e[est.R.i] = 'ko'; est.R.i = (est.R.i + 1) % 25; seguir = false; await ui.aviso(centro, 'El rival falla', 700); }
      }
      turno = 'H';
    }
  }
  // resultado
  const ac = s => s.e.filter(x => x === 'ok').length, fa = s => s.e.filter(x => x === 'ko').length;
  const aH = ac(est.H), aR = ac(est.R), fH = fa(est.H), fR = fa(est.R);
  let msg;
  if (aH === 25) { msg = `🏆 ¡PLENO! Te llevas el bote de ${G.bote.toLocaleString('es-ES')} €`; G.ganado += G.bote; G.bote = G.boteInicial; }
  else if (aR === 25) { msg = `El rival hace pleno y se lleva el bote (${G.bote.toLocaleString('es-ES')} €)`; G.bote = G.boteInicial; }
  else {
    G.bote += 6000;
    if (aH > aR || (aH === aR && fH < fR)) { G.ganado += 1200; msg = `¡Ganas el programa! +1.200 € y vuelves mañana. El bote sube a ${G.bote.toLocaleString('es-ES')} €`; }
    else if (aH === aR && fH === fR) { G.ganado += 600; msg = `Empate total: 600 € para cada uno y seguís los dos. Bote: ${G.bote.toLocaleString('es-ES')} €`; }
    else msg = `Gana el rival. Mañana tendrías tu oportunidad en ${tipo === 'rueda' ? 'La oportunidad' : 'la silla azul'}. Bote: ${G.bote.toLocaleString('es-ES')} €`;
  }
  sonido('aplausos'); hud().limpiar();
  cont = ui.pantalla(`<div class="j-def">Tú: ${aH} aciertos, ${fH} fallos · Rival: ${aR} aciertos, ${fR} fallos</div><div class="j-def grande">${msg}</div>`); ui.cabecera(G, nombre);
  await ui.continuar(cont, 'Terminar');
}
function estructura(tipo, L, modo, r, revelada) {
  if (tipo !== 'alaz') return '';
  const w = r.split('|')[0].toUpperCase();
  const s = [...w].map((c, i) => (c === L && (modo === 'c' || i === 0)) || c === revelada ? c : '_').join(' ');
  return `<div class="j-hang peq">${s}</div>`;
}
function revela(r) { const w = r.split('|')[0].toUpperCase(); return w[Math.floor(Math.random() * w.length)]; }
function reglasFinal(tipo, base) {
  if (tipo === 'alaz') return `AlaZ (desde el 19 de junio de 2026): el que tiene más segundos elige hacer la secuencia de la A a la Z o al revés; el otro hace la contraria. ${base} s + acumulados. Ves la estructura de la palabra y puedes decir «Letra» para revelar una letra (−5 s). Pleno = bote; si no, bote +6.000 € y 1.200 € al que más acierte (empate: menos fallos; si persiste, 600 € cada uno).`;
  if (tipo === 'rueda') return `La Rueda: 25 definiciones (empieza por / contiene). ${base} s + segundos acumulados. El que tiene más segundos elige entre 2 sobres y empieza. Mantienes el turno mientras aciertas; «Paso» para el reloj y pasa el turno. Pleno = bote; si no, bote +6.000 € y 1.200 € al que más acierte (empate: menos fallos; si persiste, se reparten).`;
  return `El rosco: 25 palabras, ${base} s + los acumulados. Empieza el que más segundos tiene. Contestas mientras no falles o digas «Pasapalabra». Pleno = bote; si no, el bote sube 6.000 € y el que más acierte gana 1.200 € (empate: menos fallos; si persiste, 600 € cada uno).`;
}
