/**
 * DISCRIMINADOR DE D-595 — dos paseos simultáneos, en node.
 *
 * **Por qué existe, con la letra de la ficha:** *"sin dos atenciones vivas
 * a la vez no hay forma de producir el rojo, y una cura verificada sobre
 * un solo paseo daría verde sobre el caso que no se probó — exactamente
 * L-192."* Este archivo ES esa forma de producir el rojo sin esperar a
 * caminar con dos perros.
 *
 * **Qué NO reemplaza, y se dice para que nadie lo confunda:** el gate en
 * campo del founder. Esto prueba la LÓGICA DE REPARTO (que un punto entra
 * a las N sesiones, que terminar una no apaga a las otras, que el flush
 * final lee SU total). **No prueba nada del GPS real, ni del servicio de
 * Android, ni de la batería.** L-153 intacta: la única firma es el
 * dispositivo.
 *
 * Correr:  pnpm tsx --tsconfig scripts/verify-track-multisesion/tsconfig.json \
 *            scripts/verify-track-multisesion/test.ts
 *
 * ⚠️ CADA CHECK TIENE QUE PODER SALIR ROJO (L-192). Al pie va la
 * CONTRAPRUEBA: los cuatro checks madre se vuelven a evaluar contra el
 * comportamiento VIEJO simulado, y si alguno pasara ahí, el check no
 * discrimina y el script lo dice.
 */

import {
  aceptarPunto,
  detenerCapturaFondo,
  flushFinalTrack,
  flushTrack,
  iniciarCapturaFondo,
  iniciarSesionTrack,
  puntosSesionActual,
  sesionDetenidaPorServer,
  suscribirTrack,
  terminarSesionTrack,
  TAREA_TRACK_GPS,
} from '../../apps/prestador/src/lib/track-gps-fondo';
import { espia } from './stubs/expo-location';
import { espiaApi } from './stubs/api';
import { caja } from './stubs/async-storage';
import { tareas } from './stubs/expo-task-manager';

const A = 'atencion-A-el-que-quedo-en-830';
const B = 'atencion-B-el-que-quedo-en-2';
const NOTI = { titulo: 'Paseo en curso', cuerpo: 'Registrando el recorrido' };

// ── reloj controlado: el throttle es de 5 s y hay que poder avanzar ──
const relojReal = Date.now;
let ahora = 1_770_000_000_000;
Date.now = () => ahora;
const avanzar = (ms: number): void => {
  ahora += ms;
};

let fallos = 0;
let corridos = 0;
function check(nombre: string, condicion: boolean, detalle: string): void {
  corridos += 1;
  if (condicion) {
    console.log(`  ✅ ${nombre} — ${detalle}`);
  } else {
    fallos += 1;
    console.log(`  ❌ ${nombre} — ${detalle}`);
  }
}

async function limpiar(): Promise<void> {
  await detenerCapturaFondo();
  caja.clear();
  espia.reset();
  espiaApi.reset();
}

async function main(): Promise<void> {
  console.log('\nD-595 · DOS PASEOS SIMULTÁNEOS — discriminador\n');

  // ══ T1 · EL REPARTO, y la asimetría del campo del founder ══
  // A arranca primero y camina solo un rato; B se suma después. Es
  // exactamente la forma del caso real: uno tiene MÁS puntos que el otro
  // por haber empezado antes — no porque el otro se haya perdido.
  await limpiar();
  console.log('T1 · el punto se reparte a TODAS las sesiones vivas');
  iniciarSesionTrack(A, 0);
  for (let i = 0; i < 3; i += 1) {
    avanzar(6_000);
    aceptarPunto(-0.18 + i * 0.001, -78.48);
  }
  iniciarSesionTrack(B, 0);
  for (let i = 0; i < 2; i += 1) {
    avanzar(6_000);
    aceptarPunto(-0.19 + i * 0.001, -78.49);
  }
  const puntosA = puntosSesionActual(A).length;
  const puntosB = puntosSesionActual(B).length;
  check('T1a el segundo paseo NO pisa al primero', puntosA === 5, `A tiene ${puntosA} puntos (esperado 5)`);
  check('T1b el segundo paseo recibe lo suyo', puntosB === 2, `B tiene ${puntosB} puntos (esperado 2)`);
  check(
    'T1c cada punto entró a las DOS a la vez',
    puntosSesionActual(A)[4]?.t === puntosSesionActual(B)[1]?.t,
    'el último punto de A y el último de B comparten instante',
  );

  // ══ T2 · el flush final lee SU total, no el del hermano ══
  console.log('T2 · flushFinalTrack devuelve el total de SU atención');
  const finA = await flushFinalTrack(A);
  const finB = await flushFinalTrack(B);
  check('T2a el total de A es de A', finA.total === 5, `flushFinal(A).total = ${finA.total} (esperado 5)`);
  check('T2b el total de B es de B', finB.total === 2, `flushFinal(B).total = ${finB.total} (esperado 2)`);
  check(
    'T2c y el server los recibió separados',
    espiaApi.totales.get(A) === 5 && espiaApi.totales.get(B) === 2,
    `server: A=${espiaApi.totales.get(A)} · B=${espiaApi.totales.get(B)}`,
  );

  // ══ T3 · TERMINAR UNO NO MATA AL OTRO — el defecto ② ══
  await limpiar();
  console.log('T3 · terminar un paseo no apaga la captura del otro');
  iniciarSesionTrack(A, 0);
  iniciarSesionTrack(B, 0);
  await iniciarCapturaFondo(A, NOTI);
  await iniciarCapturaFondo(B, NOTI);
  check('T3a un solo servicio para los dos', espia.arranques === 1, `arranques = ${espia.arranques} (esperado 1)`);
  await terminarSesionTrack(A);
  check('T3b terminar A no apagó el servicio', espia.paradas === 0 && espia.corriendo, `paradas = ${espia.paradas}`);
  avanzar(6_000);
  aceptarPunto(-0.2, -78.5);
  check('T3c B sigue capturando después de que A terminó', puntosSesionActual(B).length === 1, `B = ${puntosSesionActual(B).length} punto(s)`);
  check('T3d y A ya no recibe nada', puntosSesionActual(A).length === 0, `A = ${puntosSesionActual(A).length} punto(s)`);
  await terminarSesionTrack(B);
  check('T3e el ÚLTIMO en terminar sí apaga', espia.paradas === 1 && !espia.corriendo, `paradas = ${espia.paradas}`);

  // ══ T4 · el hard-stop del server es DE UNA sesión ══
  await limpiar();
  console.log('T4 · el rebote del server aísla a la atención que rebotó');
  iniciarSesionTrack(A, 0);
  iniciarSesionTrack(B, 0);
  await iniciarCapturaFondo(A, NOTI);
  espiaApi.rebotan.add(A);
  let avisoA = false;
  let avisoB = false;
  suscribirTrack(A, { onServerDetuvo: () => { avisoA = true; } });
  suscribirTrack(B, { onServerDetuvo: () => { avisoB = true; } });
  avanzar(6_000);
  aceptarPunto(-0.2, -78.5);
  await flushTrack(A);
  check('T4a A quedó detenida por el server', sesionDetenidaPorServer(A), 'sesionDetenidaPorServer(A) = true');
  check('T4b B NO quedó detenida', !sesionDetenidaPorServer(B), 'sesionDetenidaPorServer(B) = false');
  check('T4c solo A recibió el aviso', avisoA && !avisoB, `avisoA=${avisoA} avisoB=${avisoB}`);
  check('T4d el servicio sigue arriba por B', espia.corriendo, `corriendo = ${espia.corriendo}`);
  avanzar(6_000);
  aceptarPunto(-0.21, -78.51);
  check('T4e y B sigue sumando', puntosSesionActual(B).length === 2, `B = ${puntosSesionActual(B).length}`);

  // ══ T5 · headless: el disco restaura TODAS ══
  await limpiar();
  console.log('T5 · el camino headless restaura las N sesiones');
  const tarea = tareas.get(TAREA_TRACK_GPS);
  if (tarea === undefined) throw new Error('la tarea no se definió en global scope');
  caja.set('track-gps-sesion-activa', JSON.stringify({ ids: [A, B] }));
  avanzar(6_000);
  await tarea({ data: { locations: [{ coords: { latitude: -0.22, longitude: -78.52 } }] } });
  check('T5a A revivió del disco', puntosSesionActual(A).length === 1, `A = ${puntosSesionActual(A).length}`);
  check('T5b B revivió del disco', puntosSesionActual(B).length === 1, `B = ${puntosSesionActual(B).length}`);

  // ══ T6 · compatibilidad con el disco VIEJO (un APK en la calle) ══
  await limpiar();
  console.log('T6 · el disco de la forma vieja no se descarta');
  caja.set('track-gps-sesion-activa', JSON.stringify({ eventoAtencionId: A }));
  avanzar(6_000);
  await tarea({ data: { locations: [{ coords: { latitude: -0.23, longitude: -78.53 } }] } });
  check('T6a la forma vieja revive su único paseo', puntosSesionActual(A).length === 1, `A = ${puntosSesionActual(A).length}`);

  // ══ CONTRAPRUEBA — ¿los checks madre PUEDEN salir rojos? (L-192) ══
  // Se simula el comportamiento VIEJO (un solo slot, un solo apagado) y
  // se re-evalúan las mismas preguntas. Si alguna pasara acá, el check no
  // discrimina nada y este script sería decorativo.
  console.log('\nCONTRAPRUEBA · las mismas preguntas contra el comportamiento VIEJO');
  const viejo = { sesion: null as null | { id: string; puntos: number } };
  const iniciarViejo = (id: string): void => {
    if (viejo.sesion?.id === id) return;
    viejo.sesion = { id, puntos: 0 }; // ← PISA, que es el defecto ①
  };
  const puntoViejo = (): void => {
    if (viejo.sesion) viejo.sesion.puntos += 1;
  };
  iniciarViejo(A);
  puntoViejo();
  puntoViejo();
  puntoViejo();
  iniciarViejo(B);
  puntoViejo();
  const viejoA = viejo.sesion?.id === A ? viejo.sesion.puntos : 0;
  const viejoB = viejo.sesion?.id === B ? viejo.sesion.puntos : 0;
  check(
    'CP1 con el código viejo, T1a HABRÍA FALLADO',
    viejoA !== 5,
    `A viejo = ${viejoA} puntos (el singleton lo dejó en 0 — la firma del founder)`,
  );
  check(
    'CP2 con el código viejo, T1b habría dado el número del OTRO',
    viejoB === 1,
    `B viejo se llevó los puntos que seguían caminando (${viejoB})`,
  );
  // el apagado viejo: uno solo, sin condición
  let corriendoViejo = true;
  const terminarViejo = (): void => {
    corriendoViejo = false; // ← sin preguntar si queda alguien: el defecto ②
  };
  terminarViejo();
  check('CP3 con el código viejo, T3b HABRÍA FALLADO', !corriendoViejo, 'terminar uno apagaba el servicio de todos');

  await limpiar();
  Date.now = relojReal;

  console.log(`\n${fallos === 0 ? '✅ VERDE' : '❌ ROJO'} — ${corridos - fallos}/${corridos} checks\n`);
  process.exit(fallos === 0 ? 0 : 1);
}

void main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
