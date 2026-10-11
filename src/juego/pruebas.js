// Pruebas acumulativas de segundos. Cada prueba: async (G, ui) => void (suma segundos en G.equipos)
// Reglas y segundos según el texto de referencia (Wikipedia) aportado por el usuario.
import { banco, esCorrecta, espera, azar, baraja, esc, Reloj, habla, sonido, tocaMelodia } from './motor.js';
import { hud } from './grafismos.js';

const H = 0, R = 1; // índice equipo humano / rival
const rival = (p = 0.55) => Math.random() < p;
function sumar(G, eq, s) { G.equipos[eq].seg += s; }
// reparto 20/10/5 de ¿Dónde están?, ¿Qué es qué? y La palabra imposible
function reparto20(G, aH, aR, completoH, completoR) {
  if (aH === 0 && aR === 0) return [0, 0];
  if (completoH && completoR) return [10, 10];
  if (completoH) return [20, 0];
  if (completoR) return [0, 20];
  if (aH === aR) return [5, 5];
  return aH > aR ? [10, 0] : [0, 10];
}

// ---------- genérico: lista de definiciones con respuesta escrita ----------
async function listaDefiniciones(G, ui, { titulo, reglas, items, seg, pts, falloResetea = false, maxItems = 99, extraHtml = () => '', graf = null }) {
  const hechas = new Map(); let ganados = 0;
  let cont = ui.pantalla(`<p class="j-reglas">${reglas}</p>`); ui.cabecera(G, titulo, seg); await ui.continuar(cont, 'Empezar ▸');
  const reloj = new Reloj(seg, v => ui.setReloj(v)).start();
  let cola = items.slice(0, maxItems).map((x, i) => ({ ...x, i })), aciertos = 0, total = cola.length;
  while (cola.length && !reloj.terminado) {
    const it = cola[0];
    cont = ui.pantalla(`${extraHtml(it)}<div class="j-def">${esc(it.def)}</div><div class="j-sub">${aciertos}/${total} aciertos</div>`); ui.cabecera(G, titulo, reloj.rest);
    if (graf === 'lal') hud().letraALetra(G, { panel: it.panel, hechas: hechas.get(it.pid) || new Set(), actual: it.k, tiempo: ganados }); else hud().rotulo(G, it.def, { titulo });
    habla(it.def);
    const r = await ui.respuesta(cont, {}, [reloj.fin]);
    if (r === 'TIEMPO' || r === 'STOP') break;
    if (r === 'PASA') { cola.push(cola.shift()); continue; }
    if (esCorrecta(r, it.r)) { aciertos++; sumar(G, H, pts); ganados += pts; if (it.pid) { if (!hechas.has(it.pid)) hechas.set(it.pid, new Set()); hechas.get(it.pid).add(it.k); } sonido('acierto'); cola.shift(); await ui.aviso(cont, `✅ ¡Correcto! +${pts} s`, 600); }
    else { sonido('fallo'); await ui.aviso(cont, `❌ Era: <b>${esc(String(it.r).split('|')[0])}</b> · turno al compañero`, 1200); if (falloResetea) { /* el equipo vuelve a empezar el panel */ } cola.shift(); }
  }
  reloj.stop();
  // rival simulado con el mismo número de elementos
  let ar = 0; for (let i = 0; i < total; i++) if (rival()) ar++; sumar(G, R, ar * pts);
  return { aH: aciertos, aR: ar, total };
}
async function resumen(G, ui, titulo, txt) {
  const cont = ui.pantalla(`<div class="j-def">${txt}</div>`); ui.cabecera(G, titulo); await ui.continuar(cont);
}

// =============================== PRUEBAS ===============================
export const PRUEBAS = {
  silla_azul: { nombre: 'Silla azul', async jugar(G, ui) {
    const qs = baraja(banco('silla_azul')); let fH = 0, fR = 0, i = 0;
    let cont = ui.pantalla(`<p class="j-reglas">No suma segundos. Eres el aspirante: eliges entre dos letras y respondes. Tu rival (el que perdió la final anterior) responde también. Tienes 5 segundos por pregunta. Quien falle dos preguntas abandona el concurso.</p>`); ui.cabecera(G, 'Silla azul'); await ui.continuar(cont, 'Empezar ▸');
    while (fH < 2 && fR < 2 && i < qs.length * 2) {
      const q = qs[i % qs.length]; i++;
      cont = ui.pantalla(`<div class="j-def">Elige letra:</div><div class="j-opc">${q.letras.map(l => `<button data-v="${l}">${l}</button>`).join('')}</div><div class="j-sub">Fallos: tú ${fH} · rival ${fR}</div>`); ui.cabecera(G, 'Silla azul');
      const L = await ui.clic(cont); const otra = q.letras.find(x => x !== L);
      cont = ui.pantalla(`<div class="j-def">${esc(q[L].p)}</div>`); ui.cabecera(G, 'Silla azul'); habla(q[L].p);
      const reloj = new Reloj(5, v => ui.setReloj(v)).start();
      const r = await ui.respuesta(cont, { pasa: null }, [reloj.fin]); reloj.stop();
      if (r !== 'TIEMPO' && esCorrecta(r, q[L].r)) { sonido('acierto'); await ui.aviso(cont, '✅ Correcto', 700); } else { fH++; sonido('fallo'); await ui.aviso(cont, `❌ Era <b>${esc(q[L].r.split('|')[0])}</b>`, 1200); }
      if (fH >= 2) break;
      const okR = rival(0.7); if (!okR) fR++;
      await ui.aviso(cont, `El rival responde la letra ${otra}: ${okR ? '✅ acierta' : '❌ falla'}`, 1200);
    }
    G.eliminado = fH >= 2;
    await resumen(G, ui, 'Silla azul', fH >= 2 ? (G.entreno ? 'Has fallado dos preguntas: en el programa quedarías eliminado.' : 'Has fallado dos preguntas: quedas eliminado del programa. ¡El rival conserva la silla!') : '¡Ocupas la silla azul! Sigues en el programa.');
    return { eliminado: G.eliminado };
  } },

  una_de_cuatro: { nombre: 'Una de cuatro', async jugar(G, ui) { await opciones(G, ui, 'Una de cuatro', banco('una_de_cuatro'), 90, 2, 'Pregunta con cuatro opciones. Durante 90 segundos, cada acierto suma 2 segundos; si fallas, el turno pasa al compañero.'); } },
  una_de_dos: { nombre: 'Una de dos', async jugar(G, ui) { await opciones(G, ui, 'Una de dos', banco('una_de_dos'), 90, 5, 'Por cada pregunta, elige entre dos opciones. 90 segundos; cada acierto suma 5 segundos; si fallas, el turno pasa al compañero.'); } },

  piramides: { nombre: 'Pirámides (La escalera)', async jugar(G, ui) {
    const items = banco('piramides').flatMap(p => p.palabras.map((w, i) => ({ def: `${p.defs[i]} — empieza por ${w[0].toUpperCase()} (${w.length} letras)`, r: w })));
    await listaDefiniciones(G, ui, { titulo: 'Pirámides / La escalera', reglas: 'Paneles de 5 palabras: se empieza con una de 7 letras y cada siguiente es un anagrama de la anterior con una letra menos, hasta 3 letras. 90 segundos, 1 segundo por palabra; cada fallo pasa el turno al compañero.', items, seg: 90, pts: 1 });
  } },
  letra_a_letra: { nombre: 'Letra a letra', async jugar(G, ui) {
    const items = banco('letra_a_letra').flatMap(p => p.palabras.map((w, i) => ({ def: `${p.defs[i]} (${w.length} letras)`, r: w, panel: p.palabras, k: i, pid: p })));
    await listaDefiniciones(G, ui, { graf: 'lal', titulo: 'Letra a letra', reglas: 'Paneles de cinco palabras; cada palabra se obtiene cambiando una letra de la anterior. 90 segundos; tantos segundos como palabras acertadas. Puedes decir «Pasapalabra».', items, seg: 90, pts: 1 });
  } },
  antes_y_despues: { nombre: 'Antes y después', async jugar(G, ui) {
    let cont = ui.pantalla(`<p class="j-reglas">Elige inicio o fin de palabra. Panel de 9 palabras; 2 segundos por acierto (máx. 18) en 60 segundos. Si fallas, se lee la siguiente y el turno pasa al compañero.</p><div class="j-opc"><button data-v="inicio">Inicio</button><button data-v="fin">Fin</button></div>`); ui.cabecera(G, 'Antes y después');
    const modo = await ui.clic(cont); const p = banco('antes_y_despues').find(x => x.modo === modo) || banco('antes_y_despues')[0];
    const items = p.items.map(([d, r]) => ({ def: `${d} (${p.modo === 'inicio' ? 'empieza por' : 'termina en'} ${p.parte})`, r }));
    await listaDefiniciones(G, ui, { titulo: 'Antes y después', reglas: `Palabras que ${p.modo === 'inicio' ? 'empiezan por' : 'terminan en'} «${p.parte}».`, items, seg: 60, pts: 2 });
  } },
  palabras_cruzadas: { nombre: 'Palabras cruzadas', async jugar(G, ui) {
    const p = azar(banco('palabras_cruzadas'));
    const items = p.items.map(([d, r]) => ({ def: `${d} (${r.split('|')[0].length} letras)`, r }));
    await listaDefiniciones(G, ui, { titulo: `Palabras cruzadas · ${p.tema}`, reglas: `Tema: ${p.tema}. Nueve palabras en dos columnas; 2 segundos por acierto (18 en total) y 75 segundos. Si fallas, turno al compañero.`, items, seg: 75, pts: 2 });
  } },

  pulsador: { nombre: 'El pulsador (los melones)', async jugar(G, ui) {
    const todos = banco('pulsador'); const temas = [...new Set(todos.map(x => x.tema))].slice(0, 3);
    const turnos = ['Invitadas', 'Concursantes', 'Invitados'];
    for (let t = 0; t < 3; t++) {
      const items = todos.filter(x => x.tema === temas[t % temas.length]).slice(0, 5);
      let cont = ui.pantalla(`<p class="j-reglas">Turno ${t + 1} (${turnos[t]}). Tema: <b>${esc(temas[t % temas.length])}</b>. 5 definiciones: pulsa antes que el rival. Si fallas, rebota al rival. 1 segundo por acierto.</p>`); ui.cabecera(G, 'El pulsador'); await ui.continuar(cont, 'Empezar ▸');
      for (const it of items) { await duelo(G, ui, 'El pulsador', it.p, it.r, 1); }
    }
  } },

  pista_musical: { nombre: 'La pista musical', async jugar(G, ui) {
    const items = baraja(banco('pista_musical')).slice(0, 3);
    let cont = ui.pantalla(`<p class="j-reglas">Tres turnos cara a cara. Adivina la canción con hasta 5 pistas: con la 1ª ganas 5 s, con la 2ª 4 s... y con la 5ª 1 s. Si fallas, rebota al rival. Aquí suenan melodías de dominio público sintetizadas (o tus audios de la carpeta audio/).</p>`); ui.cabecera(G, 'La pista musical'); await ui.continuar(cont, 'Empezar ▸');
    for (const it of items) {
      let resuelto = false;
      for (let k = 0; k < 5 && !resuelto; k++) {
        const pts = 5 - k;
        cont = ui.pantalla(`<div class="j-def">Pista ${k + 1} (${pts} s): ${esc(it.pistas[k])}</div><div class="j-opc"><button data-v="buzz" class="buzz">🔴 ¡Pulsar!</button><button data-v="no">Esperar pista</button></div>`); ui.cabecera(G, 'La pista musical');
        const suena = [0, 2, 4].includes(k); if (suena) tocaMelodia(it.notas, { n: [5, 9, 99][k / 2] });
        hud().duelo(G, { texto: it.pistas[k], pista: pts, ecualizador: suena });
        const cpuT = espera(2500 + Math.random() * 4000).then(() => 'CPU');
        const quiere = Math.random() < 0.15 + k * 0.17;
        const r = await ui.clic(cont, '[data-v]', quiere ? [cpuT] : []);
        if (r === 'CPU' || r === 'buzz') hud().duelo(G, { texto: it.pistas[k], pista: pts, activo: r === 'buzz' ? 0 : 1 });
        if (r === 'CPU') { const ok = rival(0.6); await ui.aviso(cont, `El rival pulsa... ${ok ? '✅ acierta: ' + esc(it.titulo) : '❌ falla'}`, 1400); if (ok) { sumar(G, R, pts); resuelto = true; } else { const a = await respondeHumano(ui, cont, it.acepta, 8); if (a) { sumar(G, H, pts); resuelto = true; } } }
        else if (r === 'buzz') { const a = await respondeHumano(ui, cont, it.acepta, 8); if (a) { sumar(G, H, pts); resuelto = true; } else if (rival(0.5)) { sumar(G, R, pts); resuelto = true; await ui.aviso(cont, `Rebote: el rival acierta (${esc(it.titulo)})`, 1300); } }
      }
      if (!resuelto) await ui.aviso(cont, `Nadie acertó: era «${esc(it.titulo)}»`, 1500);
    }
  } },

  coco_loco: { nombre: 'Coco loco', async jugar(G, ui) {
    let cont = ui.pantalla(`<p class="j-reglas">El ahorcado. 75 segundos. Si fallas 5 letras se resuelve la palabra y se pasa a otra; si dices la palabra y no es correcta, no hay más oportunidades. Cada palabra acertada: 5 segundos.</p>`); ui.cabecera(G, 'Coco loco', 75); await ui.continuar(cont, 'Empezar ▸');
    const reloj = new Reloj(75, v => ui.setReloj(v)).start(); let aciertos = 0;
    for (const it of baraja(banco('coco_loco'))) {
      if (reloj.terminado) break;
      const w = it.r.toUpperCase(); const vistas = new Set(); let fallos = 0, fin = false;
      while (!fin && !reloj.terminado) {
        const mask = [...w].map(c => vistas.has(c) ? c : '_').join(' ');
        cont = ui.pantalla(`<div class="j-def">${esc(it.pista)}</div><div class="j-hang">${mask}</div><div class="j-sub">Fallos: ${'✖'.repeat(fallos)}${'·'.repeat(5 - fallos)}</div><div class="j-teclado">${'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').map(l => `<button data-v="${l}" ${vistas.has(l) ? 'disabled' : ''}>${l}</button>`).join('')}<button data-v="!" class="res">Resolver</button></div>`); ui.cabecera(G, 'Coco loco', reloj.rest);
        const l = await ui.clic(cont, '[data-v]', [reloj.fin]); if (l === 'TIEMPO') break;
        if (l === '!') { const r = await ui.respuesta(cont, { pasa: null }, [reloj.fin]); if (esCorrecta(r, it.r)) { aciertos++; sumar(G, H, 5); sonido('acierto'); await ui.aviso(cont, '✅ ¡Correcto! +5 s', 700); } else { sonido('fallo'); await ui.aviso(cont, `❌ Era ${esc(w)}`, 1100); } fin = true; continue; }
        vistas.add(l); if (!w.includes(l)) { fallos++; sonido('fallo'); }
        if ([...w].every(c => vistas.has(c))) { aciertos++; sumar(G, H, 5); sonido('acierto'); await ui.aviso(cont, '✅ ¡Completada! +5 s', 700); fin = true; }
        else if (fallos >= 5) { await ui.aviso(cont, `Se resuelve: ${esc(w)}`, 1100); fin = true; }
      }
    }
    reloj.stop(); let ar = 0; for (let i = 0; i < 3; i++) if (rival(0.45)) ar++; sumar(G, R, ar * 5);
    await resumen(G, ui, 'Coco loco', `Tú: ${aciertos} palabras (+${aciertos * 5} s) · Rival: ${ar} (+${ar * 5} s)`);
  } },

  que_es_que: { nombre: '¿Qué es qué?', async jugar(G, ui) {
    const paneles = banco('que_es_que').slice(0, 3); let aciertos = 0, total = paneles.flat().length;
    let cont = ui.pantalla(`<p class="j-reglas">Tres paneles de palabras atípicas (3, 4 y 5). Relaciona cada palabra común con su palabra rara. 60 segundos. Si fallas tras acertar alguna, se vuelve a empezar el panel. 20 s si completas los tres paneles (10 si ambos), 10 s al que más acierte sin completar, 5 s cada uno si empatan.</p>`); ui.cabecera(G, '¿Qué es qué?', 60); await ui.continuar(cont, 'Empezar ▸');
    const reloj = new Reloj(60, v => { ui.setReloj(v); hud().tiempoQeq(v); }).start(); let completo = true;
    for (const panel of paneles) {
      let idx = 0; const raras = baraja(panel.map(p => p[0]));
      while (idx < panel.length && !reloj.terminado) {
        cont = ui.pantalla(`<div class="j-def">Palabra común: <b>${esc(panel[idx][1])}</b></div><div class="j-opc">${raras.map(w => `<button data-v="${esc(w)}">${esc(w)}</button>`).join('')}</div><div class="j-sub">Panel de ${panel.length} · ${idx}/${panel.length}</div>`); ui.cabecera(G, '¿Qué es qué?', reloj.rest);
        hud().queEsQue({ raras, comunes: panel.map(x => x[1]), hechas: new Set([...Array(idx).keys()]), actual: idx, tiempo: reloj.rest });
        const v = await ui.clic(cont, '[data-v]', [reloj.fin]); if (v === 'TIEMPO') break;
        if (v === panel[idx][0]) { idx++; aciertos++; sonido('acierto'); } else { sonido('fallo'); await ui.aviso(cont, '❌ Fallo: turno al compañero y se empieza el panel', 1000); aciertos -= idx; idx = 0; }
      }
      if (idx < panel.length) { completo = false; break; }
    }
    reloj.stop(); const aR = Math.round(total * (0.3 + Math.random() * 0.6)); const cR = aR >= total;
    const [sH, sR] = reparto20(G, aciertos, aR, completo, cR); sumar(G, H, sH); sumar(G, R, sR);
    await resumen(G, ui, '¿Qué es qué?', `Tú: ${aciertos} aciertos${completo ? ' (paneles completos)' : ''} → +${sH} s · Rival: ${aR} → +${sR} s`);
  } },

  palabra_imposible: { nombre: 'La palabra imposible', async jugar(G, ui) {
    const p = banco('palabra_imposible')[0]; const defs = baraja(p.defs); let idx = 0;
    let cont = ui.pantalla(`<p class="j-reglas">Panel de 8 palabras. Relaciona cada definición con su palabra. Si fallas, el turno pasa al compañero y hay que volver a acertar las palabras. 60 segundos. Reparto: 20 s si completas (10 si ambos), 10 s al que más acierte, 5 s si empate.</p>`); ui.cabecera(G, 'La palabra imposible', 60); await ui.continuar(cont, 'Empezar ▸');
    const reloj = new Reloj(60, v => { ui.setReloj(v); hud().tiempoQeq(v); }).start(); let mejor = 0;
    while (idx < defs.length && !reloj.terminado) {
      cont = ui.pantalla(`<div class="j-def">${esc(defs[idx][0])}</div><div class="j-opc">${p.palabras.map(w => `<button data-v="${esc(w)}">${esc(w)}</button>`).join('')}</div><div class="j-sub">${idx}/8</div>`); ui.cabecera(G, 'La palabra imposible', reloj.rest); habla(defs[idx][0]);
      hud().queEsQue({ raras: p.palabras, comunes: [defs[idx][0]], actual: 0, tiempo: reloj.rest });
      const v = await ui.clic(cont, '[data-v]', [reloj.fin]); if (v === 'TIEMPO') break;
      if (v === defs[idx][1]) { idx++; mejor = Math.max(mejor, idx); sonido('acierto'); } else { sonido('fallo'); await ui.aviso(cont, '❌ Turno al compañero: se vuelve a empezar', 1000); idx = 0; }
    }
    reloj.stop(); const aR = Math.floor(Math.random() * 9); const [sH, sR] = reparto20(G, mejor, aR, mejor === 8, aR === 8); sumar(G, H, sH); sumar(G, R, sR);
    await resumen(G, ui, 'La palabra imposible', `Tú: ${mejor}/8 → +${sH} s · Rival: ${aR}/8 → +${sR} s`);
  } },

  de_par_en_par: { nombre: 'De par en par', async jugar(G, ui) {
    const p = banco('de_par_en_par')[0]; const panel = baraja(p.pares.map(x => x[1])); let ac = 0;
    let cont = ui.pantalla(`<p class="j-reglas">Tema: ${esc(p.tema)}. Relaciona la palabra leída con la de tu panel (9 parejas). 2 segundos por acierto (máx. 18) en 60 segundos; si fallas se lee la siguiente.</p>`); ui.cabecera(G, 'De par en par', 60); await ui.continuar(cont, 'Empezar ▸');
    const reloj = new Reloj(60, v => ui.setReloj(v)).start(); const usados = new Set();
    for (const [leida, buena] of baraja(p.pares)) {
      if (reloj.terminado) break;
      cont = ui.pantalla(`<div class="j-def">${esc(leida)}</div><div class="j-opc">${panel.map(w => `<button data-v="${esc(w)}" ${usados.has(w) ? 'disabled' : ''}>${esc(w)}</button>`).join('')}</div>`); ui.cabecera(G, 'De par en par', reloj.rest);
      const v = await ui.clic(cont, '[data-v]', [reloj.fin]); if (v === 'TIEMPO') break;
      if (v === buena) { ac++; usados.add(v); sumar(G, H, 2); sonido('acierto'); } else { sonido('fallo'); await ui.aviso(cont, `❌ Era ${esc(buena)}`, 900); }
    }
    reloj.stop(); let ar = 0; for (let i = 0; i < 9; i++) if (rival()) ar++; sumar(G, R, ar * 2);
    await resumen(G, ui, 'De par en par', `Tú: ${ac} parejas (+${ac * 2} s) · Rival: ${ar} (+${ar * 2} s)`);
  } },

  sopa_letras: { nombre: 'Sopa de letras', async jugar(G, ui) {
    let cont = ui.pantalla(`<p class="j-reglas">Encuentra las tres palabras del tema escondidas en un panel de 5×5 (escríbelas). Si fallas o pasas 5 veces, se revela el panel. 5 segundos por panel completo. 90 segundos, hasta 8 paneles (40 s).</p>`); ui.cabecera(G, 'Sopa de letras', 90); await ui.continuar(cont, 'Empezar ▸');
    const reloj = new Reloj(90, v => ui.setReloj(v)).start(); let paneles = 0;
    for (const p of baraja(banco('sopa_letras')).slice(0, 8)) {
      if (reloj.terminado) break;
      const grid = sopa(p.palabras); const hallo = new Set(); let errores = 0;
      while (hallo.size < 3 && errores < 5 && !reloj.terminado) {
        cont = ui.pantalla(`<div class="j-def">Tema: <b>${esc(p.tema)}</b> · encontradas ${hallo.size}/3</div><div class="j-sopa">${grid.map(f => f.map(c => `<span>${c}</span>`).join('')).join('<br>')}</div><div class="j-sub">Fallos/pasos: ${errores}/5</div>`); ui.cabecera(G, 'Sopa de letras', reloj.rest);
        const r = await ui.respuesta(cont, { pasa: 'Paso' }, [reloj.fin]); if (r === 'TIEMPO') break;
        const w = p.palabras.find(x => esCorrecta(r, x)); if (r !== 'PASA' && w && !hallo.has(w)) { hallo.add(w); sonido('acierto'); } else { errores++; sonido('fallo'); }
      }
      if (hallo.size === 3) { paneles++; sumar(G, H, 5); await ui.aviso(cont, '✅ Panel completo: +5 s', 700); } else if (!reloj.terminado) await ui.aviso(cont, `Se revela: ${p.palabras.join(', ')}`, 1300);
    }
    reloj.stop(); const pr = Math.floor(Math.random() * 6); sumar(G, R, pr * 5);
    await resumen(G, ui, 'Sopa de letras', `Tú: ${paneles} paneles (+${paneles * 5} s) · Rival: ${pr} (+${pr * 5} s)`);
  } },

  donde_estan: { nombre: '¿Dónde están?', async jugar(G, ui) {
    const temas = baraja(banco('donde_estan')).slice(0, 2);
    let cont = ui.pantalla(`<p class="j-reglas">Elige tema. Prueba de memoria: 9 casillas numeradas con 9 palabras. Recuerda dónde está cada una. 75 segundos por equipo. Si fallas, todo se oculta y el turno pasa al compañero. 20 s si completas el panel (10 cada uno si ambos), 10 s al que más destape sin completar, 5 s cada uno si empatan, 0 si nadie acierta.</p><div class="j-opc">${temas.map((t, i) => `<button data-v="${i}">${esc(t.tema)}</button>`).join('')}</div>`); ui.cabecera(G, '¿Dónde están?');
    const t = temas[+await ui.clic(cont)]; const pal = baraja(t.palabras);
    cont = ui.pantalla(`<div class="j-def">Memoriza (8 s)</div><div class="j-grid9">${pal.map((w, i) => `<div><small>${i + 1}</small>${esc(w)}</div>`).join('')}</div>`); ui.cabecera(G, '¿Dónde están?');
    hud().capsulas(pal, new Set(pal.map((_, i) => i)), null, { titulo: t.tema }); await espera(8000);
    const reloj = new Reloj(75, v => { ui.setReloj(v); hud().tiempoCaps(v); }).start(); let dest = new Set(), mejor = 0;
    const orden = baraja(pal.map((w, i) => i));
    let k = 0;
    while (dest.size < 9 && !reloj.terminado) {
      const objetivo = orden[k % 9]; if (dest.has(objetivo)) { k++; continue; }
      cont = ui.pantalla(`<div class="j-def">¿Dónde está <b>${esc(pal[objetivo])}</b>?</div><div class="j-grid9">${pal.map((w, i) => dest.has(i) ? `<div class="ok"><small>${i + 1}</small>${esc(w)}</div>` : `<button data-v="${i}"><small>${i + 1}</small>?</button>`).join('')}</div>`); ui.cabecera(G, '¿Dónde están?', reloj.rest);
      hud().capsulas(pal, dest, reloj.rest, { titulo: `¿Dónde está ${pal[objetivo]}?` });
      const v = await ui.clic(cont, '[data-v]', [reloj.fin]); if (v === 'TIEMPO') break;
      if (+v === objetivo) { dest.add(objetivo); mejor = Math.max(mejor, dest.size); sonido('acierto'); k++; } else { sonido('fallo'); await ui.aviso(cont, '❌ Se oculta todo · turno al compañero', 1000); dest = new Set(); k++; }
    }
    reloj.stop(); const aR = Math.floor(Math.random() * 10); const [sH, sR] = reparto20(G, dest.size, aR, dest.size === 9, aR === 9); sumar(G, H, sH); sumar(G, R, sR);
    await resumen(G, ui, '¿Dónde están?', `Tú: ${dest.size}/9 destapadas → +${sH} s · Rival: ${aR}/9 → +${sR} s`);
  } },

  // ===================== RUEDA LA LETRA =====================
  la_oportunidad: { nombre: 'La oportunidad', async jugar(G, ui) {
    const tira = banco('la_oportunidad').slice(0, 10); let pH = 0, pR = 0, turno = H, i = 0;
    let cont = ui.pantalla(`<p class="j-reglas">Repesca en el atril azul. Tira de 10 letras en orden alfabético con una definición por letra. 5 segundos para responder; fallo o tiempo = rebote al rival. Si se acierta el rebote, suma y sigue en su turno. Gana el primero en llegar a 6 aciertos.</p>`); ui.cabecera(G, 'La oportunidad'); await ui.continuar(cont, 'Empezar ▸');
    while (pH < 6 && pR < 6) {
      const [L, d, r] = tira[i % tira.length]; i++;
      const tiraHtml = `<div class="j-tira">${tira.map((x, k) => `<span class="${k === (i - 1) % 10 ? 'cur' : ''}">${x[0]}</span>`).join('')}</div>`;
      if (turno === H) {
        cont = ui.pantalla(`${tiraHtml}<div class="j-def">${L}: ${esc(d)}</div><div class="j-sub">Tú ${pH} · Rival ${pR}</div>`); ui.cabecera(G, 'La oportunidad');
        const ok = await respondeHumano(ui, cont, r, 5);
        if (ok) pH++; else { if (rival(0.55)) { pR++; turno = R; await ui.aviso(cont, 'Rebote: el rival acierta y se queda el turno', 1100); } }
      } else {
        cont = ui.pantalla(`${tiraHtml}<div class="j-def">${L}: ${esc(d)}</div><div class="j-sub">Turno del rival · Tú ${pH} · Rival ${pR}</div>`); ui.cabecera(G, 'La oportunidad');
        await espera(1200);
        if (rival(0.6)) { pR++; await ui.aviso(cont, `El rival acierta: ${esc(r.split('|')[0])}`, 900); }
        else { await ui.aviso(cont, 'El rival falla: ¡rebote para ti!', 700); const ok = await respondeHumano(ui, cont, r, 5); if (ok) { pH++; turno = H; } }
      }
    }
    await resumen(G, ui, 'La oportunidad', pH >= 6 ? '¡Ganas La oportunidad! Entras en el programa.' : 'El rival gana La oportunidad (sigues para practicar).');
  } },
  he_dicho: { nombre: '¡He dicho!', async jugar(G, ui) {
    const lista = banco('he_dicho').slice(0, 10); const frases = baraja(lista.map(x => x[1])); let ac = 0; const usadas = new Set();
    let cont = ui.pantalla(`<p class="j-reglas">10 personajes y 10 frases célebres (históricas, de dominio público). 90 segundos para emparejarlos: +1 s por acierto y +5 s extra si completas la lista.</p>`); ui.cabecera(G, '¡He dicho!', 90); await ui.continuar(cont, 'Empezar ▸');
    const reloj = new Reloj(90, v => ui.setReloj(v)).start();
    for (const [pers, frase] of lista) {
      if (reloj.terminado) break;
      cont = ui.pantalla(`<div class="j-def">¿Qué dijo <b>${esc(pers)}</b>?</div><div class="j-opc vert">${frases.map((f, k) => `<button data-v="${k}" ${usadas.has(k) ? 'disabled' : ''}>«${esc(f)}»</button>`).join('')}</div>`); ui.cabecera(G, '¡He dicho!', reloj.rest);
      const v = await ui.clic(cont, '[data-v]', [reloj.fin]); if (v === 'TIEMPO') break;
      if (frases[+v] === frase) { ac++; usadas.add(+v); sumar(G, H, 1); sonido('acierto'); } else { sonido('fallo'); await ui.aviso(cont, '❌', 500); }
    }
    reloj.stop(); if (ac === 10) sumar(G, H, 5);
    let ar = 0; for (let i = 0; i < 10; i++) if (rival(0.6)) ar++; sumar(G, R, ar + (ar === 10 ? 5 : 0));
    await resumen(G, ui, '¡He dicho!', `Tú: ${ac}/10 (+${ac + (ac === 10 ? 5 : 0)} s) · Rival: ${ar}/10`);
  } },
  cantando_espero: { nombre: 'Cantando espero', async jugar(G, ui) {
    const temas = baraja(banco('cantando_espero')).slice(0, 4);
    let cont = ui.pantalla(`<p class="j-reglas">Duelo de pulsador: 15 segundos por tema. Los primeros 5 s son exclusivos del equipo con más segundos; después se habilita el rival. En la siguiente ronda se invierte. Fallo = rebote. +5 s por acierto. (Melodías de dominio público sintetizadas o tus audios.)</p>`); ui.cabecera(G, 'Cantando espero'); await ui.continuar(cont, 'Empezar ▸');
    let prioridad = G.equipos[H].seg >= G.equipos[R].seg ? H : R;
    for (const it of temas) {
      cont = ui.pantalla(`<div class="j-def">🎵 Suena el tema... (${prioridad === H ? 'tienes 5 s exclusivos' : '5 s exclusivos del rival'})</div><div class="j-opc"><button data-v="buzz" class="buzz">🔴 ¡Pulsar!</button></div>`); ui.cabecera(G, 'Cantando espero', 15);
      tocaMelodia(it.notas); hud().duelo(G, { texto: '🎵 Cantando espero', pista: 15, ecualizador: true });
      const reloj = new Reloj(15, v => { ui.setReloj(v); const p = document.querySelector('.hud-pista span'); if (p) p.textContent = Math.ceil(v); }).start();
      const tCPU = (prioridad === R ? 1500 : 5200) + Math.random() * 6000;
      const r = await ui.clic(cont, '[data-v]', [espera(tCPU).then(() => 'CPU'), reloj.fin]);
      const humanoPuede = prioridad === H || (15 - reloj.rest) >= 5;
      if (r === 'buzz' || r === 'CPU') hud().duelo(G, { texto: '🎵 Cantando espero', pista: Math.ceil(reloj.rest), activo: r === 'buzz' ? 0 : 1 });
      reloj.stop();
      if (r === 'buzz' && humanoPuede) { const ok = await respondeHumano(ui, cont, it.acepta, 8); if (ok) sumar(G, H, 5); else if (rival(0.5)) { sumar(G, R, 5); await ui.aviso(cont, `Rebote: acierta el rival («${esc(it.titulo)}»)`, 1200); } }
      else if (r === 'buzz') { await ui.aviso(cont, 'Aún no puedes pulsar (5 s exclusivos del rival)', 1000); if (rival(0.6)) { sumar(G, R, 5); await ui.aviso(cont, `El rival acierta («${esc(it.titulo)}»)`, 1100); } }
      else if (r === 'CPU') { if (rival(0.6)) { sumar(G, R, 5); await ui.aviso(cont, `El rival acierta («${esc(it.titulo)}»)`, 1200); } else { await ui.aviso(cont, 'El rival falla: ¡rebote!', 700); const ok = await respondeHumano(ui, cont, it.acepta, 8); if (ok) sumar(G, H, 5); } }
      else await ui.aviso(cont, `Tiempo: era «${esc(it.titulo)}»`, 1200);
      prioridad = prioridad === H ? R : H;
    }
  } },
  con_dos_palabras: { nombre: 'Con dos palabras', async jugar(G, ui) {
    const lista = banco('con_dos_palabras');
    for (let ronda = 1; ronda <= 3; ronda++) {
      const doce = baraja(lista).slice(0, 12);
      let cont = ui.pantalla(`<p class="j-reglas">Ronda ${ronda}/3 · Lista de 12 palabras. Apuesta cuántas adivinarás con pistas de máximo 2 palabras de tu compañero (virtual). Juega la apuesta más alta; 90 s; 5 s en juego por ronda.</p><div class="j-opc">${[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => `<button data-v="${n}">${n}</button>`).join('')}</div>`); ui.cabecera(G, 'Con dos palabras');
      const apH = +await ui.clic(cont); const apR = 3 + Math.floor(Math.random() * 6);
      if (apH >= apR) {
        await ui.aviso(cont, `Tu apuesta (${apH}) supera la del rival (${apR}): juegas tú`, 1300);
        const reloj = new Reloj(90, v => ui.setReloj(v)).start(); let ac = 0;
        for (const [w, pista] of doce) {
          if (reloj.terminado || ac >= apH) break;
          cont = ui.pantalla(`<div class="j-def">Pista: «${esc(pista)}»</div><div class="j-sub">${ac}/${apH}</div>`); ui.cabecera(G, 'Con dos palabras', reloj.rest);
          const r = await ui.respuesta(cont, { pasa: 'Paso' }, [reloj.fin]); if (r === 'TIEMPO') break;
          if (r !== 'PASA' && esCorrecta(r, w)) { ac++; sonido('acierto'); } else sonido('fallo');
        }
        reloj.stop(); if (ac >= apH) { sumar(G, H, 5); await resumen(G, ui, 'Con dos palabras', `¡Conseguido! ${ac}/${apH}: +5 s`); } else { sumar(G, R, 5); await resumen(G, ui, 'Con dos palabras', `No llegas (${ac}/${apH}): los 5 s van al rival`); }
      } else {
        const ok = rival(0.5); sumar(G, ok ? R : H, 5);
        await resumen(G, ui, 'Con dos palabras', `El rival apuesta ${apR} y juega: ${ok ? 'lo consigue (+5 s rival)' : 'no lo consigue (+5 s para ti)'}`);
      }
    }
  } },
  palabras_ocultas: { nombre: 'Palabras ocultas', async jugar(G, ui) {
    const pal = banco('palabras_ocultas').slice(0, 8); const grid = panelSilabas(pal); let ac = 0; const hechas = new Set();
    let cont = ui.pantalla(`<p class="j-reglas">Panel de 16 sílabas desordenadas. Forma la palabra de cada definición uniendo sílabas que NO estén juntas (ni en horizontal, ni en vertical, ni en diagonal). 90 segundos, +1 s por acierto.</p>`); ui.cabecera(G, 'Palabras ocultas', 90); await ui.continuar(cont, 'Empezar ▸');
    const reloj = new Reloj(90, v => ui.setReloj(v)).start();
    for (const [d, a, b] of pal) {
      if (reloj.terminado) break;
      cont = ui.pantalla(`<div class="j-def">${esc(d)}</div><div class="j-grid16">${grid.map(s => `<span class="${hechas.has(s) ? 'off' : ''}">${s}</span>`).join('')}</div>`); ui.cabecera(G, 'Palabras ocultas', reloj.rest);
      const r = await ui.respuesta(cont, { pasa: 'Paso' }, [reloj.fin]); if (r === 'TIEMPO') break;
      if (r !== 'PASA' && esCorrecta(r, a + b)) { ac++; hechas.add(a); hechas.add(b); sumar(G, H, 1); sonido('acierto'); } else { sonido('fallo'); await ui.aviso(cont, `Era ${a}+${b}`, 900); }
    }
    reloj.stop(); let ar = 0; for (let i = 0; i < 8; i++) if (rival(0.5)) ar++; sumar(G, R, ar);
    await resumen(G, ui, 'Palabras ocultas', `Tú: ${ac} (+${ac} s) · Rival: ${ar} (+${ar} s)`);
  } },
};

async function opciones(G, ui, titulo, items, seg, pts, reglas) {
  let cont = ui.pantalla(`<p class="j-reglas">${reglas}</p>`); ui.cabecera(G, titulo, seg); await ui.continuar(cont, 'Empezar ▸');
  const reloj = new Reloj(seg, v => { ui.setReloj(v); hud().tiempoOp(v); }).start(); let ac = 0, n = 0;
  for (const q of baraja(items)) {
    if (reloj.terminado) break; n++;
    cont = ui.pantalla(`<div class="j-def">${esc(q.p)}</div><div class="j-opc">${q.op.map((o, i) => `<button data-v="${i}">${'ABCD'[i]}. ${esc(o)}</button>`).join('')}</div>`); ui.cabecera(G, titulo, reloj.rest); hud().opciones4(G, q.p, q.op, reloj.rest); habla(q.p);
    const v = await ui.clic(cont, '[data-v]', [reloj.fin]); if (v === 'TIEMPO') break;
    hud().opciones4(G, q.p, q.op, reloj.rest, { marca: +v, ok: +v === q.r });
    if (+v === q.r) { ac++; sumar(G, H, pts); sonido('acierto'); await ui.aviso(cont, `✅ +${pts} s`, 500); } else { sonido('fallo'); await ui.aviso(cont, `❌ Era ${esc(q.op[q.r])} · turno al compañero`, 1000); }
  }
  reloj.stop(); let ar = 0; for (let i = 0; i < Math.max(n, 6); i++) if (rival()) ar++; sumar(G, R, ar * pts);
  await resumen(G, ui, titulo, `Tú: ${ac} aciertos (+${ac * pts} s) · Rival: ${ar} (+${ar * pts} s)`);
}

async function respondeHumano(ui, cont, acepta, seg) {
  const reloj = new Reloj(seg, v => ui.setReloj(v)).start();
  const r = await ui.respuesta(cont, { pasa: null }, [reloj.fin]); reloj.stop();
  const ok = r !== 'TIEMPO' && esCorrecta(r, acepta);
  sonido(ok ? 'acierto' : 'fallo'); await ui.aviso(cont, ok ? '✅ ¡Correcto!' : `❌ Era «${esc(String(acepta).split('|')[0])}»`, 900);
  return ok;
}
async function duelo(G, ui, titulo, def, r, pts) {
  const cont = ui.pantalla(`<div class="j-def">${esc(def)}</div><div class="j-opc"><button data-v="buzz" class="buzz">🔴 ¡Pulsar!</button></div>`); ui.cabecera(G, titulo); habla(def);
  hud().duelo(G, { texto: def });
  const v = await ui.clic(cont, '[data-v]', [espera(2500 + Math.random() * 5000).then(() => 'CPU')]);
  hud().duelo(G, { texto: def, activo: v === 'buzz' ? 0 : 1 });
  if (v === 'buzz') { const ok = await respondeHumano(ui, cont, r, 7); if (ok) sumar(G, H, pts); else if (rival(0.6)) { sumar(G, R, pts); await ui.aviso(cont, 'Rebote: el rival acierta', 900); } }
  else { if (rival(0.6)) { sumar(G, R, pts); await ui.aviso(cont, `El rival pulsa y acierta: ${esc(r.split('|')[0])}`, 1100); } else { await ui.aviso(cont, 'El rival falla: ¡rebote!', 700); const ok = await respondeHumano(ui, cont, r, 7); if (ok) sumar(G, H, pts); } }
}
function sopa(palabras) {
  const L = 'ABCDEFGHIJLMNOPRSTUVZ'; for (let intento = 0; intento < 200; intento++) {
    const g = Array.from({ length: 5 }, () => Array(5).fill(null)); let ok = true;
    for (const w of palabras) {
      let colocada = false;
      for (let t = 0; t < 50 && !colocada; t++) {
        const hz = Math.random() < 0.5, r0 = Math.floor(Math.random() * (hz ? 5 : 6 - w.length)), c0 = Math.floor(Math.random() * (hz ? 6 - w.length : 5));
        if (r0 < 0 || c0 < 0) continue;
        if ([...w].every((ch, i) => { const v = g[r0 + (hz ? 0 : i)][c0 + (hz ? i : 0)]; return v === null || v === ch; })) { [...w].forEach((ch, i) => g[r0 + (hz ? 0 : i)][c0 + (hz ? i : 0)] = ch); colocada = true; }
      }
      if (!colocada) { ok = false; break; }
    }
    if (ok) return g.map(f => f.map(c => c || L[Math.floor(Math.random() * L.length)]));
  }
  return [palabras.join('').padEnd(25, 'X').slice(0, 25).split('')].flatMap(a => [a.slice(0, 5), a.slice(5, 10), a.slice(10, 15), a.slice(15, 20), a.slice(20, 25)]);
}
function panelSilabas(pal) {
  const sil = pal.flatMap(p => [p[1], p[2]]);
  for (let t = 0; t < 500; t++) {
    const g = baraja(sil);
    const pos = s => { const i = g.indexOf(s); return [Math.floor(i / 4), i % 4]; };
    if (pal.every(p => { const [a, b] = [pos(p[1]), pos(p[2])]; return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) > 1; })) return g;
  }
  return baraja(sil);
}
