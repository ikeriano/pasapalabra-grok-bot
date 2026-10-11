// Catálogo de sonidos del juego para «Cargar sonidos» (Opciones). Cada sonido: [id, nombre legible, alias para reconocer el archivo]
// El id es el nombre de archivo que el juego busca (audio/<id>.mp3 o el cargado desde Opciones). Sin dependencias.
const PRUEBAS = [['silla_azul', 'Silla azul', ['silla']], ['una_de_dos', 'Una de dos', []], ['una_de_cuatro', 'Una de cuatro', []], ['piramides', 'Pirámides (La escalera)', ['escalera', 'piramide']],
  ['letra_a_letra', 'Letra a letra', []], ['antes_y_despues', 'Antes y después', []], ['palabras_cruzadas', 'Palabras cruzadas', ['cruzadas']], ['pulsador', 'El pulsador (los melones)', ['melones']],
  ['pista_musical', 'La pista musical', []], ['coco_loco', 'Coco loco', []], ['que_es_que', '¿Qué es qué?', []], ['palabra_imposible', 'La palabra imposible', ['imposible']],
  ['de_par_en_par', 'De par en par', []], ['sopa_letras', 'Sopa de letras', ['sopa_de_letras', 'sopa']], ['donde_estan', '¿Dónde están?', []], ['la_oportunidad', 'La oportunidad', ['oportunidad']],
  ['he_dicho', '¡He dicho!', []], ['cantando_espero', 'Cantando espero', []], ['con_dos_palabras', 'Con dos palabras', []], ['palabras_ocultas', 'Palabras ocultas', ['ocultas']]];
// Etapas: [clave, nombre, alias] → cabecera_<clave> (música de la cabecera) y sintonia_<clave> (sintonía del programa: menú, saludo y despedida)
export const ETAPA_CLAVE = { 'antena3-2000': 'a3_2000', 'telecinco-2007': 't5_2007', 'telecinco-2018': 't5_2018', 'antena3-2020': 'a3_2020', 'rueda-letra': 'rueda' };
const ETAPAS_SON = [['a3_2000', 'Antena 3 (2000-2006)', ['a3_2000', 'antena3_2000', 'antena_3_2000', '2000', '2006']], ['t5_2007', 'Telecinco (2007-2018)', ['t5_2007', 'telecinco_2007', '2007', 'telecinco']],
  ['t5_2018', 'Telecinco (2018-2019)', ['t5_2018', 'telecinco_2018', '2018', '2019']], ['a3_2020', 'Antena 3 (2020-actualidad)', ['a3_2020', 'antena3_2020', 'antena_3_2020', '2020', 'antena3', 'antena_3']],
  ['rueda', 'Rueda la letra (2026)', ['rueda_letra', 'rueda_la_letra', 'ruedalaletra']]];
export const GRUPOS_SONIDOS = [
  { id: 'cab', titulo: '🎬 Cabeceras y sintonías de cada etapa', tipo: 'musica', sonidos: ETAPAS_SON.flatMap(([k, n, al]) => [
    ['cabecera_' + k, 'Cabecera · ' + n, [...al, ...al.map(x => 'cabecera_' + x)]],
    ['sintonia_' + k, 'Sintonía · ' + n, [...al.map(x => 'sintonia_' + x), ...al.map(x => 'tema_' + x)]]]) },
  { id: 'mus', titulo: '🎵 Músicas generales', tipo: 'musica', sonidos: [
    ['musica_menu', 'Música del menú', ['menu', 'titulo', 'principal', 'portada']],
    ['musica_pruebas', 'Música de las pruebas (general)', ['pruebas', 'juego', 'fondo', 'partida']],
    ['musica_final', 'Música de la final (general)', ['final']],
    ['musica_rosco', 'Música del rosco', ['rosco']],
    ['musica_alaz', 'Música de AlaZ', ['alaz', 'a_la_z']],
    ['musica_la_rueda', 'Música de La Rueda', ['la_rueda', 'rueda']],
    ['musica_despedida', 'Despedida y créditos', ['despedida', 'creditos', 'cierre', 'ending', 'adios']]] },
  { id: 'pru', titulo: '🎼 Música de cada prueba', tipo: 'musica', sonidos: PRUEBAS.map(([k, n, a]) => ['musica_' + k, n, [k, k.replace(/_/g, ''), ...a]]) },
  { id: 'fx', titulo: '🔔 Efectos', tipo: 'efecto', sonidos: [
    ['acierto', 'Acierto', ['acierto', 'correcto', 'bien', 'correct', 'ok', 'si']],
    ['fallo', 'Fallo', ['fallo', 'error', 'incorrecto', 'mal', 'wrong', 'no']],
    ['pasapalabra', '«Pasapalabra» (pasar letra)', ['pasapalabra', 'pasa_palabra', 'paso', 'pasar']],
    ['tictac', 'Tic-tac (últimos 5 segundos)', ['tictac', 'tic_tac', 'tic', 'tick', 'reloj', 'clock', 'cuenta_atras']],
    ['fin_tiempo', 'Fin de tiempo', ['fin_tiempo', 'fin_de_tiempo', 'tiempo_agotado', 'sin_tiempo', 'se_acabo', 'timeout', 'time_up', 'bocina', 'tiempo']],
    ['rosco', 'Entrada del rosco', ['entrada_rosco', 'rosco_entrada', 'rosco']],
    ['bote', 'Bote acumulado', ['bote', 'jackpot', 'dinero']],
    ['pleno', '¡Pleno! (bote ganado)', ['pleno', 'bote_ganado', 'ganador', 'victoria', 'campeon']],
    ['eliminado', 'Eliminado (Silla azul)', ['eliminado', 'eliminacion', 'pierde', 'perdedor']],
    ['pulsar', 'Pulsador (botonazo)', ['pulsar', 'buzzer', 'zumbador', 'boton']],
    ['aplausos', 'Aplausos del público', ['aplausos', 'aplauso', 'applause', 'publico']],
    ['risas', 'Risas del público', ['risas', 'risa', 'laugh', 'laughs']],
    ['tecla', 'Botones del menú', ['tecla', 'click', 'clic', 'menu_click']]] },
];
export const TODOS_SONIDOS = GRUPOS_SONIDOS.flatMap(g => g.sonidos.map(([id, nombre, alias]) => ({ id, nombre, alias: [...new Set([id, ...alias])], grupo: g.id, tipo: g.tipo })));
export const SONIDO = Object.fromEntries(TODOS_SONIDOS.map(s => [s.id, s]));
export const normNombre = f => String(f).split('/').pop().replace(/\.[^.]+$/, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const SINT = /(^|_)(sintonia|tema|theme|jingle)(_|$)/, CABW = /(^|_)(cabecera|intro|opening|careta|cortinilla)(_|$)/;
const PAL_MUSICA = /(^|_)(musica|music|tema|bso|loop|melodia|cancion|song|ost)(_|$)/;
/** Devuelve el id del sonido que corresponde a un nombre de archivo, o null si no se reconoce */
export function reconocer(archivo) {
  const n = normNombre(archivo); if (!n) return null;
  if (SONIDO[n]) return n;
  const nn = '_' + n + '_', esMusica = PAL_MUSICA.test(n);
  let mejor = null, puntos = 0;
  for (const s of TODOS_SONIDOS) for (const a of s.alias) {
    if (!nn.includes('_' + a + '_')) continue;
    const p = a.length * 2 + ((s.tipo === 'musica') === esMusica ? 5 : 0) + (s.grupo === 'cab' ? (s.id.startsWith('sintonia_') ? (SINT.test(n) ? 12 : 0) : (CABW.test(n) ? 12 : 0)) : 0);
    if (p > puntos) { puntos = p; mejor = s.id; }
  }
  return mejor;
}
