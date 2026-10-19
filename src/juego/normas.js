// Normas sorpresa (v1.2): 10 por partida, sorteadas entre 17. Apagadas por defecto (Opciones › 🎲 Normas sorpresa).
// Se aplican al juego final (El rosco / AlaZ / La Rueda) y las anuncia el presentador al empezarlo.
export const NORMAS = [
  { id: 't20', n: 'Veinte segundos más', d: 'Empiezas el rosco con veinte segundos extra.', fx: { tiempo: 20 } },
  { id: 't10', n: 'Diez segundos menos', d: 'Empiezas el rosco con diez segundos menos.', fx: { tiempo: -10 } },
  { id: 'acs', n: 'Acierto con premio', d: 'Cada acierto te suma un segundo.', fx: { segAcierto: 1 } },
  { id: 'fal', n: 'Fallo con castigo', d: 'Cada fallo te quita tres segundos.', fx: { segFallo: 3 } },
  { id: 'per', n: 'Fallo perdonado', d: 'El primer fallo no cuenta: puedes volver a contestar.', fx: { perdon: 1 } },
  { id: 'per2', n: 'Doble perdón', d: 'Los dos primeros fallos no cuentan.', fx: { perdon: 2 } },
  { id: 'rl', n: 'Rival lento', d: 'El rival tarda más en contestar.', fx: { rivalLento: 1.4 } },
  { id: 'rf', n: 'Rival nervioso', d: 'El rival falla más de lo normal.', fx: { rivalFalla: 0.15 } },
  { id: 'lg', n: 'Letra gratis', d: 'Pedir una letra no te quita segundos.', fx: { letraGratis: 1 } },
  { id: 'rch', n: 'Racha', d: 'Tres aciertos seguidos te dan cinco segundos.', fx: { racha: 5 } },
  { id: 'pas', n: 'Pasapalabra con premio', d: 'Cada pasapalabra te da medio segundo.', fx: { segPasa: 0.5 } },
  { id: 'rt', n: 'Rival con menos tiempo', d: 'El rival empieza con quince segundos menos.', fx: { tiempoRival: -15 } },
  { id: 'rt2', n: 'Rival con más tiempo', d: 'El rival empieza con diez segundos más.', fx: { tiempoRival: 10 } },
  { id: 'cin', n: 'Cinco de regalo', d: 'Al empezar tu segundo turno ganas cinco segundos.', fx: { regalo2: 5 } },
  { id: 'tri', n: 'Triple A', d: 'Acertar la A suma tres segundos.', fx: { bonusA: 3 } },
  { id: 'ult', n: 'Última letra', d: 'Acertar la Z suma cinco segundos.', fx: { bonusZ: 5 } },
  { id: 'tol', n: 'Tildes libres', d: 'Las tildes nunca cuentan en tus respuestas.', fx: {} },
];
let activas = [], fx = {};
export function sortea(on) { activas = []; fx = {}; if (!on) return activas; const a = NORMAS.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  for (const r of a) { if (activas.length >= 10) break; if (Object.keys(r.fx).some(k => k in fx)) continue; activas.push(r); Object.assign(fx, r.fx); }
  return activas; }
export const fxDe = (k, d = 0) => (k in fx ? fx[k] : d);
export const lista = () => activas.slice();
