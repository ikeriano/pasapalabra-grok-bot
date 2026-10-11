// Modo historia: presentadores virtuales ORIGINALES (sin parecido físico con personas reales)
// narran la historia del programa recorriendo los platós. Datos del texto de referencia.
import { esc, espera } from './motor.js';

export const PRESENTADORES = {
  sofia: { nombre: 'Sofía Brisa', estilo: 'Cercana y elegante', etapa: '2000-2002', color: '#ff7a00', traje: 0x7a2a5a, pitch: 1.15, rate: 1.0 },
  ramiro: { nombre: 'Don Ramiro', estilo: 'Voz grave y mucho aplomo', etapa: '2002-2003', color: '#8a5a2b', traje: 0x1a1a22, pitch: 0.55, rate: 0.9 },
  nico: { nombre: 'Nico Chispa', estilo: 'Dinámico y simpático', etapa: '2006', color: '#2ab8ff', traje: 0x2a4a8a, pitch: 1.05, rate: 1.12 },
  toni: { nombre: 'Toni Risas', estilo: 'Bromista y con mucha energía', etapa: '2007-2019', color: '#3f7dff', traje: 0x1a2a6a, pitch: 1.1, rate: 1.18 },
  dani: { nombre: 'Dani Sonrisa', estilo: 'Natural, alegre y cercano', etapa: '2020-2026', color: '#1f74ff', traje: 0xd8d8c8, pitch: 1.0, rate: 1.05 },
  aurelio: { nombre: 'Aurelio Guasa', estilo: 'Veterano, irónico y simpático', etapa: 'Rueda la letra', color: '#c050ff', traje: 0x2a2a34, pitch: 0.8, rate: 0.98 },
};

// Punto del presentador (x, y suelo, z) y cámara para el plano de presentación
export const SPOTS = {
  'antena3-2000': { pres: [2.2, 0, 6.5], cam: [3.2, 1.9, 11.5], tgt: [0, 2.6, -3] },
  'telecinco-2007': { pres: [0.5, 0, 5.4], cam: [1.4, 1.9, 9.8], tgt: [0, 2.2, -4] },
  'telecinco-2018': { pres: [0.5, 0, 5.6], cam: [1.4, 1.9, 10], tgt: [0, 2.6, -6] },
  'antena3-2020': { pres: [1.2, 0, 6.2], cam: [2.2, 1.9, 10.8], tgt: [-1, 2.6, -6] },
  'rueda-letra': { pres: [0.4, 0, 4.2], cam: [1.2, 1.9, 8.2], tgt: [0, 3, -9] },
};

export const CAPITULOS = [
  { emoji: '🌍', t: 'El origen', plato: 'antena3-2000', cam: 'general', p: 'dani', ficha: [['Formato original', 'The Alphabet Game (Reino Unido)'], ['Llega a España', '24 de julio de 2000'], ['Mecánica', 'Acumular segundos para el rosco final']], textos: [
    '¡Hola! Bienvenidos a la historia de Pasapalabra, un concurso de palabras que lleva en la tele española desde el año 2000.',
    'Está basado en el formato británico The Alphabet Game: dos concursantes acumulan segundos en pruebas con palabras para tener más tiempo en la prueba final. ¡Acompañadme plató por plató!'] },
  { emoji: '📺', t: 'Antena 3 (2000-2006)', plato: 'antena3-2000', cam: 'general', p: 'sofia', ficha: [['Cadena', 'Antena 3'], ['Estreno', '24 de julio de 2000'], ['Rosco inicial', '28 letras (con K, LL y W) y 100 s'], ['Desde 2001', '25 letras y 90 s + acumulado']], textos: [
    'Encantada. Estamos en el primer plató: Antena 3, desde el 24 de julio de 2000. Letras gigantes de colores, el atril doble rojo y azul… ¡qué recuerdos!',
    'Al principio el rosco tenía 28 definiciones, con la K, la LL y la W, y 100 segundos. Un año después se quedó para siempre en 25 letras y 90 segundos más lo acumulado.'] },
  { emoji: '🎙️', t: 'Cambios de 2002 a 2005', plato: 'antena3-2000', cam: 'atril', p: 'ramiro', ficha: [['Sustituto', 'Nov 2002 – ene 2003'], ['2003', 'Ambos finalistas con 110 s'], ['2005', 'Vuelve 90 s + acumulado']], textos: [
    'Buenas noches. Entre noviembre de 2002 y enero de 2003 el programa tuvo un presentador sustituto durante unas semanas.',
    'Y en 2003 llegó otro cambio: los dos finalistas partían con 110 segundos cada uno. En 2005 se volvió a la fórmula de 90 segundos más el acumulado.'] },
  { emoji: '💰', t: 'El gran premio de 2006', plato: 'antena3-2000', cam: 'mesa', p: 'nico', ficha: [['Premio récord', '2.190.000 €'], ['Programas en Antena 3', '1.282'], ['Fin de etapa', '2006']], textos: [
    '¡Hola, hola! En 2006 cambió el presentador y, con ese cambio, se entregó el mayor premio de la tele española hasta entonces: ¡2.190.000 euros!',
    'Antena 3 retiró el concurso ese año tras 1.282 programas. Pero esto no acaba aquí… ¡nos vamos a Telecinco!'] },
  { emoji: '🟠', t: 'Telecinco (2007-2018)', plato: 'telecinco-2007', cam: 'general', p: 'toni', ficha: [['Estreno', '16 de julio de 2007'], ['Horario', 'L-V 20:05 – 21:05'], ['Premio Ondas', '2010 (Especial del Jurado)'], ['Botes', 'Más de 1,8 millones de €']], textos: [
    '¡Ey, qué pasa! Bienvenidos a Telecinco: el concurso llegó el 16 de julio de 2007 y se emitía de lunes a viernes de 20:05 a 21:05, liderando su franja.',
    'En 2010 ganó el Premio Especial del Jurado de los Premios Ondas por sus 10 años de éxito. Y hubo botes de récord: ¡más de 1,8 millones de euros en esta etapa!'] },
  { emoji: '🔵', t: 'Telecinco (2018-2019)', plato: 'telecinco-2018', cam: 'general', p: 'toni', ficha: [['Nuevas pruebas', '10 de septiembre de 2018'], ['Pruebas', 'Una de cuatro, Sopa de letras, ¿Dónde están?'], ['Fin', '1 de octubre de 2019'], ['Programas en Telecinco', '3.292']], textos: [
    'Cambio de plató, ¡todo azul! El 10 de septiembre de 2018 llegaron nuevas pruebas: Una de cuatro, Sopa de letras y ¿Dónde están?, además de la Silla azul y La pista musical.',
    'El programa dejó de emitirse el 1 de octubre de 2019 por una sentencia del Tribunal Supremo tras el litigio iniciado por ITV. En total, 3.292 programas en Telecinco.'] },
  { emoji: '🔁', t: 'La vuelta a Antena 3', plato: 'antena3-2020', cam: 'general', p: 'dani', ficha: [['Regreso', '13 de mayo de 2020'], ['Bote inicial', '100.000 €'], ['Bote récord', '2.272.000 €'], ['Programas (dic 2025)', '6.030']], textos: [
    '¡Y volvimos! El 13 de mayo de 2020 Pasapalabra regresó a Antena 3, con el bote empezando en 100.000 euros.',
    'En esta etapa se ganó el bote más alto de su historia: 2.272.000 euros, y por primera vez acertando las 25 palabras en un solo turno. A 31 de diciembre de 2025 se llevaban 6.030 programas en total.'] },
  { emoji: '🔤', t: 'De Palabras cruzadas a AlaZ', plato: 'antena3-2020', cam: 'atril', p: 'dani', ficha: [['Palabras cruzadas', 'Desde el 5 de diciembre de 2023'], ['Último rosco', '18 de junio de 2026'], ['AlaZ', 'Desde el 19 de junio de 2026'], ['Tiempo base', '110 s + acumulado']], textos: [
    'Desde el 5 de diciembre de 2023 la Sopa de letras dejó paso a Palabras cruzadas.',
    'Y el 18 de junio de 2026 se jugó el último rosco: la justicia decidió que los derechos de ese juego pertenecen a MC&F. Desde el 19 de junio la final es AlaZ, con 110 segundos más lo acumulado.'] },
  { emoji: '🟣', t: 'Rueda la letra', plato: 'rueda-letra', cam: 'general', p: 'aurelio', ficha: [['Cadena', 'Telecinco'], ['Estreno', '7 de septiembre de 2026'], ['Producción', 'Bulldog TV'], ['Bote inicial', '200.000 €']], textos: [
    'Muy buenas… y no me miren así, que no muerdo. Les presento Rueda la letra, estrenado en Telecinco el 7 de septiembre de 2026.',
    'Nace porque el Supremo confirmó el 19 de mayo de 2026 que la mecánica pertenece a MC&F. Antena 3 cambió a AlaZ y Mediaset usó esa mecánica como La Rueda, producido con Bulldog TV. Equipos morado y azul, y un bote que empieza en 200.000 euros. ¿Se atreven?'] },
];
