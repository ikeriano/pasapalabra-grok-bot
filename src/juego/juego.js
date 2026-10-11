// Flujo de un programa completo: selección de fecha/variante, pruebas de la época y final.
import { UI, esc } from './motor.js';
import { PRUEBAS } from './pruebas.js';
import { jugarFinal } from './final.js';
import { ESPECIALES, FAMOSOS_FICTICIOS } from '../lib/especiales.js';
import { hud, estiloDe } from './grafismos.js';

// Pruebas por época y fecha (según el texto de referencia)
export const FORMATOS = {
  'antena3-2000': {
    equipos: [['Veterano', '#ff7a00'], ['Aspirante', '#2a5cff']], bote: 6000,
    variantes: [
      { id: 'a3-2001', nombre: '2001-2006 (rosco de 25 letras, 90 s + acumulado)', pruebas: ['una_de_dos', 'pulsador', 'de_par_en_par', 'piramides', 'antes_y_despues', 'palabra_imposible'], final: { tipo: 'rosco', base: 90, nombre: 'El rosco' } },
    ],
    nota: 'En 2000 el rosco tenía 28 letras (con K, LL y W) y 100 s; entre 2003 y 2005 ambos partían con 110 s. Aquí se juega la fórmula de 25 letras y 90 s + acumulado.',
  },
  'telecinco-2007': {
    equipos: [['Naranja', '#ff7a00'], ['Azul', '#2a5cff']], bote: 6000,
    variantes: [
      { id: 't5-hasta2018', nombre: 'Hasta el 7 de septiembre de 2018', pruebas: ['silla_azul', 'letra_a_letra', 'pista_musical', 'coco_loco', 'que_es_que'], final: { tipo: 'rosco', base: 85, nombre: 'El rosco' } },
      { id: 't5-primeros', nombre: 'Primeros años de Telecinco (pruebas históricas, aprox.)', pruebas: ['piramides', 'pulsador', 'de_par_en_par', 'antes_y_despues', 'palabra_imposible'], final: { tipo: 'rosco', base: 85, nombre: 'El rosco' } },
    ],
  },
  'telecinco-2018': {
    equipos: [['Naranja', '#ff7a00'], ['Azul', '#2a5cff']], bote: 6000,
    variantes: [{ id: 't5-desde2018', nombre: 'Desde el 10 de septiembre de 2018', pruebas: ['silla_azul', 'una_de_cuatro', 'pista_musical', 'sopa_letras', 'donde_estan'], final: { tipo: 'rosco', base: 85, nombre: 'El rosco' } }],
  },
  'antena3-2020': {
    equipos: [['Naranja', '#ff7a00'], ['Azul', '#2a5cff']], bote: 100000,
    variantes: [
      { id: 'a3-2020', nombre: '13 may 2020 – 4 dic 2023 (Sopa de letras + Rosco)', pruebas: ['silla_azul', 'una_de_cuatro', 'pista_musical', 'sopa_letras', 'donde_estan'], final: { tipo: 'rosco', base: 85, nombre: 'El rosco' } },
      { id: 'a3-2023', nombre: '5 dic 2023 – 18 jun 2026 (Palabras cruzadas + Rosco)', pruebas: ['silla_azul', 'una_de_cuatro', 'pista_musical', 'palabras_cruzadas', 'donde_estan'], final: { tipo: 'rosco', base: 85, nombre: 'El rosco' } },
      { id: 'a3-2026', nombre: 'Desde el 19 jun 2026 (Palabras cruzadas + AlaZ)', pruebas: ['silla_azul', 'una_de_cuatro', 'pista_musical', 'palabras_cruzadas', 'donde_estan'], final: { tipo: 'alaz', base: 110, nombre: 'AlaZ' } },
    ],
  },
  'rueda-letra': {
    equipos: [['Morado', '#a040e0'], ['Azul', '#2a8bff']], bote: 200000,
    variantes: [{ id: 'rueda', nombre: 'Rueda la letra (desde el 7 sep 2026)', pruebas: ['la_oportunidad', 'he_dicho', 'cantando_espero', 'con_dos_palabras', 'palabras_ocultas'], final: { tipo: 'rueda', base: 85, nombre: 'La Rueda' } }],
  },
};

const boteKey = id => 'ppj-bote-' + id;
export const leerBote = id => +localStorage.getItem(boteKey(id)) || FORMATOS[id].bote;
const fmt = n => n.toLocaleString('es-ES');

/** Programa completo / Clásico. api: { cabecera, saludo, presentaciones, camara, despedida } (lo da main.js) */
export async function jugarPrograma(el, etapaDef, api, { modo = 'programa', especial = 'normal', nombreJugador = '' } = {}) {
  const F = FORMATOS[etapaDef.id]; if (!F) return null;
  const ui = new UI(el);
  let variante = F.variantes[0];
  if (F.variantes.length > 1) {
    const cont = ui.pantalla(`<h3>${esc(etapaDef.nombre)} · ${esc(etapaDef.anios)}</h3><p>Elige la fecha / variante del programa:</p>
      <div class="j-opc vert">${F.variantes.map((v, i) => `<button data-v="${i}">${esc(v.nombre)}</button>`).join('')}</div>${F.nota ? `<p class="j-sub">${esc(F.nota)}</p>` : ''}`);
    variante = F.variantes[+await ui.clic(cont)];
  } else if (F.nota && modo === 'programa') { /* nada */ }
  ui.cerrar();
  const famosos = especial === 'famosos' ? [...FAMOSOS_FICTICIOS].sort(() => Math.random() - 0.5).slice(0, 4) : null;
  const G = { equipos: F.equipos.map(([n, c]) => ({ nombre: n, color: c, seg: 0 })), bote: leerBote(etapaDef.id), boteInicial: F.bote, ganado: 0, famosos, jugador: nombreJugador };
  G.estilo = estiloDe(etapaDef.id); hud().set(G.estilo);
  if (modo === 'programa') {
    await api.cabecera(); ui.vivo();
    await api.saludo(G, variante); ui.vivo();
    await api.presentaciones(G); ui.vivo();
  }
  api.camara('mesa');
  await hud().bote(G.bote); hud().limpiar(); ui.vivo();
  const pruebas = modo === 'clasico' ? variante.pruebas.filter(p => p !== 'silla_azul').slice(0, 2) : variante.pruebas;
  for (const p of pruebas) {
    const cont = ui.pantalla(`<div class="j-def grande">${esc(PRUEBAS[p].nombre)}</div>`); ui.cabecera(G, PRUEBAS[p].nombre);
    await ui.continuar(cont, 'Jugar ▸');
    await PRUEBAS[p].jugar(G, ui); hud().limpiar(); ui.vivo();
    if (G.eliminado) break;
  }
  let linea;
  if (G.eliminado) linea = 'Has perdido la Silla azul: hoy te despides del programa.';
  else {
    api.camara('atril');
    await hud().bote(G.bote); hud().limpiar(); ui.vivo();
    const antes = G.ganado;
    await jugarFinal(G, ui, variante.final); hud().limpiar(); ui.vivo();
    linea = G.ganado > antes ? `¡Has ganado ${fmt(G.ganado)} €!` : `Fin del programa. Hoy te llevas ${fmt(G.ganado)} €.`;
  }
  localStorage.setItem(boteKey(etapaDef.id), String(G.bote));
  ui.cerrar();
  return { G, linea, bote: G.bote, final: variante.final.nombre };
}

/** Entrenamiento: una prueba suelta (sin eliminación) o una final */
export async function entrenar(el, etapaDef, id) {
  const ui = new UI(el); const F = FORMATOS[etapaDef.id] || FORMATOS['antena3-2020'];
  const G = { equipos: F.equipos.map(([n, c]) => ({ nombre: n, color: c, seg: 0 })), bote: leerBote(etapaDef.id), boteInicial: F.bote, ganado: 0, entreno: true };
  G.estilo = estiloDe(etapaDef.id); hud().set(G.estilo);
  if (id.startsWith('final:')) { const tipo = id.slice(6); const base = tipo === 'alaz' ? 110 : tipo === 'rueda' ? 85 : 85; G.equipos[0].seg = 10; G.equipos[1].seg = 8; await jugarFinal(G, ui, { tipo, base, nombre: { rosco: 'El rosco', alaz: 'AlaZ', rueda: 'La Rueda' }[tipo] }); }
  else await PRUEBAS[id].jugar(G, ui);
  hud().limpiar(); ui.cerrar();
  return `${G.equipos[0].nombre}: ${G.equipos[0].seg} s · ${G.equipos[1].nombre}: ${G.equipos[1].seg} s`;
}
