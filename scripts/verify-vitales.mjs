// Asserts imperativos de calcularVitales (S53-B2c) — el test 5 del
// bloque: nada se afirma sin respaldo.
import { calcularVitales, distanciaTrackKm } from '../packages/domain/src/vitalesPaseos.ts';

const hoy = new Date('2026-07-10T12:00:00Z');
let fallos = 0;
const check = (c, n) => { console.log(`${c ? '✓' : '✗ FALLO'} ${n}`); if (!c) fallos++; };

// haversine sanity: ~111km por grado de latitud
const km = distanciaTrackKm([{ lat: 0, lng: -78 }, { lat: 1, lng: -78 }]);
check(Math.abs(km - 111.19) < 0.5, `haversine 1° lat ≈ 111.2km (dio ${km.toFixed(2)})`);

// vacío: cero salidas, cero afirmaciones
const vacio = calcularVitales([], hoy);
check(vacio.totalSalidas === 0 && vacio.ultimaSalida === null && !vacio.caminoMasQueAnterior, 'vacío honesto');

// ventanas: 2 paseos esta semana, 1 la anterior
const p = (fecha, min, pts) => ({ fecha, duracionMin: min, puntos: pts });
const tramo = [{ lat: -0.18, lng: -78.48 }, { lat: -0.181, lng: -78.48 }]; // ~111m
const v = calcularVitales(
  [p('2026-07-08T10:00:00Z', 30, tramo), p('2026-07-09T10:00:00Z', 20, tramo), p('2026-07-01T10:00:00Z', 40, tramo)],
  hoy,
);
check(v.salidas7d === 2 && v.min7d === 50, `ventana 7d: 2 salidas/50min (dio ${v.salidas7d}/${v.min7d})`);
check(v.salidas7dAnteriores === 1, 'ventana anterior: 1 salida');
check(v.caminoMasQueAnterior === true, 'comparativa true con respaldo (2 tramos > 1)');

// comparativa ESTRICTA: sin semana anterior, jamás true
const soloActual = calcularVitales([p('2026-07-09T10:00:00Z', 20, tramo)], hoy);
check(soloActual.caminoMasQueAnterior === false, 'comparativa false sin ventana anterior (L-139)');

// track de un punto o vacío: 0 km, sin NaN
check(distanciaTrackKm([]) === 0 && distanciaTrackKm([{ lat: 1, lng: 1 }]) === 0, 'tracks degenerados = 0km');

console.log(fallos === 0 ? '\nVITALES DOMAIN: 7/7' : `\nFALLOS: ${fallos}`);
process.exit(fallos === 0 ? 0 : 1);
