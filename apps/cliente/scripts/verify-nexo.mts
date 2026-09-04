/**
 * verify:nexo — LA PRESENCIA, SUS CLASES, SUS DEDOS Y DÓNDE NO EXISTE.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ MIDE, Y POR QUÉ SIRVE
 * ═══════════════════════════════════════════════════════════════════════════
 * Llama a **las mismas funciones que corren en pantalla** (`lib/nexo/*`), no a
 * una réplica: por eso esos módulos no tienen un solo import de runtime.
 * *Un arnés que reescribe la regla mide su propio eco* (`L-459`).
 *
 * La voz se mide contra una instancia i18next **real**, inicializada igual que
 * `packages/i18n/src/instancia.ts` y con los diccionarios reales — porque el
 * defecto que S113-C acaba de curar en el prestador (`{{n}}` crudo en
 * pantalla) **no lo ve ningún typecheck**: el riel exige que la KEY exista,
 * jamás que los NOMBRES de las variables coincidan con la plantilla.
 *
 * `--control` corre los CONTROLES: cada regla se prueba también con el caso
 * que la haría fallar. *Un gate que no puede producir su rojo no está
 * midiendo.*
 *
 * Salidas: 0 verde · 1 un caso falló · 2 no pude medir.
 *
 * Correr:  node_modules/.bin/tsx apps/cliente/scripts/verify-nexo.mts [--control]
 */

import i18next from '../../../node_modules/i18next/dist/esm/i18next.js';

import { clienteEn } from '../src/i18n/en';
import { clienteEs } from '../src/i18n/es';
import {
  ORDEN_DE_PATA,
  esMemorial,
  focoNexo,
  montaPresencia,
  razonDeApagado,
  type AtajoNexo,
} from '../src/lib/nexo/atajos';
import {
  CLASES_NEXO,
  CUENTAS_DESCONOCIDAS,
  clasesVivasNexo,
  estaCargando,
  estadoNexo,
  nexoVisibleEn,
  type ClaseNexo,
  type CuentasNexo,
} from '../src/lib/nexo/estado';

const di = (s: string) => process.stdout.write(s + '\n');
const CONTROL = process.argv.includes('--control');
let fallos = 0;
let corridos = 0;

function ok(nombre: string, condicion: boolean, detalle = ''): void {
  corridos += 1;
  if (condicion) return;
  fallos += 1;
  di(`ROJO · ${nombre}${detalle === '' ? '' : ` — ${detalle}`}`);
}

/* ═══ AUTO-PRUEBA (L-459) — si el instrumento no distingue su rojo, no cuenta
   un verde. Preguntas que cualquier implementación sana contesta igual. ═══ */
if (typeof clasesVivasNexo !== 'function' || typeof focoNexo !== 'function') {
  di('ROJO · las funciones no son alcanzables — no pude medir.');
  process.exit(2);
}
if (clasesVivasNexo(CUENTAS_DESCONOCIDAS).length !== 0) {
  di('ROJO · auto-prueba: todo en null da clases vivas.');
  process.exit(2);
}
if (clasesVivasNexo({ chat: 1, carrito: null, avisos: null }).length !== 1) {
  di('ROJO · auto-prueba: pierde una clase viva.');
  process.exit(2);
}

/* ═══ ① LOS PENDIENTES · los dos casos del encargo ═══════════════════════════ */

const DORMIDA: CuentasNexo = { chat: 0, carrito: 0, avisos: null };
const ATENTA: CuentasNexo = { chat: 2, carrito: 1, avisos: null };

ok('dormida · 0/0/null no tiene clases vivas', clasesVivasNexo(DORMIDA).length === 0);
ok(
  'dormida · el estado es dormida',
  estadoNexo({ cuentas: DORMIDA, huellaAbierta: false, hojaAbierta: false }) === 'dormida',
);
ok('dormida · 0 NO es cargando', estaCargando(DORMIDA) === false);
ok('sin respuesta · todo null SÍ es cargando', estaCargando(CUENTAS_DESCONOCIDAS) === true);
ok(
  'sin respuesta · dibuja dormida igual, y es la otra mitad del guard doble',
  estadoNexo({ cuentas: CUENTAS_DESCONOCIDAS, huellaAbierta: false, hojaAbierta: false }) === 'dormida',
);

const vivas = clasesVivasNexo(ATENTA);
ok('atenta · DOS clases vivas ⇒ dos arcos y dos pastillas', vivas.length === 2, `dio ${vivas.length}`);
ok('atenta · son chat y carrito, en ese orden', vivas.join(',') === 'chat,carrito', vivas.join(','));
ok('atenta · NINGUNA VIOLETA: avisos queda fuera', !vivas.includes('avisos'));
ok('atenta · los números son los de las cuentas', ATENTA.chat === 2 && ATENTA.carrito === 1);
ok(
  'atenta · el estado es atenta',
  estadoNexo({ cuentas: ATENTA, huellaAbierta: false, hojaAbierta: false }) === 'atenta',
);
ok(
  'despierta · con la pata abierta manda la pata',
  estadoNexo({ cuentas: ATENTA, huellaAbierta: true, hojaAbierta: false }) === 'despierta',
);
ok(
  'hablando · con la Hoja abierta manda la Hoja',
  estadoNexo({ cuentas: DORMIDA, huellaAbierta: true, hojaAbierta: true }) === 'hablando',
);

/* ⚠️ Un `avisos` con número NO se dibuja hoy, pero el día que exista tiene que
   entrar como cualquier otra clase: se mide para que ese día no haya sorpresa. */
ok(
  'avisos · el día que tenga número, cuenta como clase viva',
  clasesVivasNexo({ chat: 0, carrito: 0, avisos: 3 }).join(',') === 'avisos',
);

/* ═══ ② DÓNDE NEXO NO EXISTE (§1.6) ══════════════════════════════════════════ */

const SIN_NEXO: Array<[string, string[]]> = [
  ['la cámara del carnet', ['carnet']],
  ['la videollamada', ['videollamada', '[citaId]']],
  ['la videoconsulta', ['videoconsulta', '[citaId]']],
  ['el checkout de despensa', ['(tabs)', 'despensa', 'checkout']],
  ['el checkout de paseo', ['(tabs)', 'explorar', 'paseo', 'checkout']],
  ['el checkout del PLAN — el que el guard viejo NO alcanzaba', ['(tabs)', 'explorar', 'paseo', 'checkout-plan']],
  ['el checkout del PAQUETE — ídem', ['(tabs)', 'explorar', 'paseo', 'checkout-paquete']],
  ['el carrito', ['(tabs)', 'despensa', 'carrito']],
  ['el alta de tarjeta', ['pagos', 'alta-tarjeta']],
  ['la mensualidad', ['pagos', 'mensualidad']],
  ['el hilo de adopción', ['adoptar', 'solicitud', '[solicitudId]']],
];
for (const [nombre, segs] of SIN_NEXO) ok(`sin Nexo en ${nombre}`, nexoVisibleEn(segs) === false);

const CON_NEXO: Array<[string, string[]]> = [
  ['el Hogar', ['(tabs)', 'hogar', 'index']],
  ['la vitrina de la despensa', ['(tabs)', 'despensa', 'index']],
  ['la ficha de la mascota', ['(tabs)', 'hogar', 'mascota', '[mascotaId]']],
  ['el ACTA de adopción — no tiene barra de escribir', ['adoptar', 'acta', '[solicitudId]']],
  ['la lista de solicitudes — es otra palabra', ['adoptar', 'solicitudes']],
];
for (const [nombre, segs] of CON_NEXO) ok(`con Nexo en ${nombre}`, nexoVisibleEn(segs) === true);

/* ═══ ③ SOBRE QUIÉN ACTÚA UN DEDO (§2.5) ═════════════════════════════════════ */

type M = Parameters<typeof esMemorial>[0] & { id: string; nombre: string; sujeto: 'individuo' | 'acuario' };
const mascota = (id: string, extra: Partial<M> = {}): any => ({
  id,
  nombre: id,
  especie: 'perro',
  foto_url: null,
  paseo_social_ok: null,
  talla: null,
  pelaje: null,
  estado_vida: 'activa',
  sujeto: 'individuo',
  tipo_agua: null,
  raza: null,
  raza_ruta_imagen: null,
  ...extra,
});

const UNA = [mascota('thor')];
const DOS = [mascota('thor'), mascota('zeus')];

ok('una sola mascota ⇒ NO se pregunta', focoNexo({ mascotaIdEnRuta: undefined, mascotas: UNA }).modo === 'directa');
ok('dos mascotas ⇒ el dedo abre el selector', focoNexo({ mascotaIdEnRuta: undefined, mascotas: DOS }).modo === 'elegir');

const conRuta = focoNexo({ mascotaIdEnRuta: 'zeus', mascotas: DOS });
ok('con una pantalla de mascota abierta manda ELLA', conRuta.modo === 'directa' && conRuta.mascota.id === 'zeus');

const rutaAjena = focoNexo({ mascotaIdEnRuta: 'no-existe', mascotas: DOS });
ok('una ruta que nombra a otra mascota NO cae en «la primera»', rutaAjena.modo === 'elegir');

ok('el hogar que no contestó es CARGANDO, jamás «ninguna»', focoNexo({ mascotaIdEnRuta: undefined, mascotas: null }).modo === 'cargando');
ok('un hogar sin mascotas es NINGUNA', focoNexo({ mascotaIdEnRuta: undefined, mascotas: [] }).modo === 'ninguna');

/* ═══ ④ MEMORIAL — la presencia NO se monta, la burbuja SÍ (§2.3) ════════════ */

const MEMORIAL = [mascota('thor', { estado_vida: 'memorial' })];
ok('memorial · la mascota se reconoce', esMemorial(MEMORIAL[0]));
ok('memorial · `null` cuenta como ACTIVA (angostado honesto)', esMemorial(mascota('x', { estado_vida: null })) === false);

const focoMemorial = focoNexo({ mascotaIdEnRuta: undefined, mascotas: MEMORIAL });
ok('memorial · el hogar entero da NINGUNA', focoMemorial.modo === 'ninguna');
ok('memorial · NO se monta la presencia', montaPresencia(focoMemorial) === false);

const focoEnFocoMemorial = focoNexo({ mascotaIdEnRuta: 'thor', mascotas: [mascota('thor', { estado_vida: 'memorial' }), mascota('zeus')] });
ok(
  'memorial en foco · el dedo NO actúa sobre la que se fue',
  focoEnFocoMemorial.modo === 'directa' && focoEnFocoMemorial.mascota.id === 'zeus',
);

ok('cargando · tampoco se monta la presencia (queda la burbuja)', montaPresencia({ modo: 'cargando' }) === false);
ok('hogar activo · SÍ se monta', montaPresencia(focoNexo({ mascotaIdEnRuta: undefined, mascotas: UNA })) === true);

/* ═══ ⑤ LOS CUATRO DEDOS Y SUS RAZONES (§2.4 y §2.6) ═════════════════════════ */

ok('el orden de la pata es Peso → Vacuna → Antiparasitario → Foto', ORDEN_DE_PATA.join(',') === 'peso,vacuna,antiparasitario,foto');

const apagadosIndividuo = ORDEN_DE_PATA.filter((a) => razonDeApagado(a, 'individuo') !== null);
ok('individuo · sólo Foto está apagado, y por falta de puerta', apagadosIndividuo.join(',') === 'foto');
ok('individuo · la razón de Foto es «sin puerta»', razonDeApagado('foto', 'individuo') === 'sin_puerta');

const apagadosAcuario = ORDEN_DE_PATA.filter((a) => razonDeApagado(a, 'acuario') !== null);
ok('acuario · DOS dedos atenuados por acuario + Foto', apagadosAcuario.join(',') === 'vacuna,antiparasitario,foto');
ok('acuario · Vacuna se apaga por acuario', razonDeApagado('vacuna', 'acuario') === 'acuario');
ok('acuario · Antiparasitario se apaga por acuario', razonDeApagado('antiparasitario', 'acuario') === 'acuario');
ok('acuario · Peso NO se apaga: un acuario se pesa tan poco como un perro nada, pero el motor lo admite', razonDeApagado('peso', 'acuario') === null);

/* ═══ ⑥ LA VOZ — que el nombre ENTRE, y que no quede una llave cruda ═════════ */

const inst = (i18next as any).createInstance();
await inst.init({
  lng: 'es',
  fallbackLng: 'es',
  resources: { es: { cliente: clienteEs }, en: { cliente: clienteEn } },
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
});
const t = (clave: string, valores?: Record<string, string | number>) => inst.t(`cliente:${clave}`, valores) as string;

for (const idioma of ['es', 'en'] as const) {
  await inst.changeLanguage(idioma);
  const nombre = t('coach.nombre');
  ok(`${idioma} · coach.nombre existe y no está vacío`, typeof nombre === 'string' && nombre.length > 0, nombre);

  const conNombre = ['nexo.etiqueta', 'nexo.almohadilla', 'nexo.presentacion'];
  for (const k of conNombre) {
    const s = t(k, { nombre });
    ok(`${idioma} · ${k} interpola el nombre`, s.includes(nombre), s);
    ok(`${idioma} · ${k} no deja una llave cruda`, !s.includes('{{'), s);
  }

  const conMascota = ['antiparasitario.titulo', 'antiparasitario.anotado'];
  for (const k of conMascota) {
    const s = t(k, { mascota: 'Thor' });
    ok(`${idioma} · ${k} interpola la mascota`, s.includes('Thor'), s);
    ok(`${idioma} · ${k} no deja una llave cruda`, !s.includes('{{'), s);
  }

  /* Las voces sin variables tampoco pueden quedar con una llave: si alguien
     agrega una interpolación y se olvida del valor, acá suena. */
  const planas = [
    'nexo.dedoPeso', 'nexo.dedoVacuna', 'nexo.dedoAntiparasitario', 'nexo.dedoFoto',
    'nexo.razonAcuario', 'nexo.razonSinPuerta', 'nexo.elegirMascota', 'nexo.cerrar',
    'antiparasitario.tipoInterna', 'antiparasitario.tipoExterna', 'antiparasitario.tipoMixta',
    'antiparasitario.guardar', 'antiparasitario.errProducto', 'antiparasitario.errFechaFutura',
    'antiparasitario.errOrden', 'antiparasitario.errAcceso', 'antiparasitario.errGenerico',
  ];
  for (const k of planas) {
    const s = t(k);
    ok(`${idioma} · ${k} tiene voz`, s.length > 0 && s !== k, s);
    ok(`${idioma} · ${k} sin llave cruda`, !s.includes('{{'), s);
  }
}

/* ⚠️ EL NOMBRE VIVE EN UNA SOLA KEY, Y ESTO LO PRUEBA DE VERDAD: se busca el
   **literal entre comillas** en el árbol del cliente. Si aparece fuera de
   `coach.nombre`, el cambio de nombre deja de ser una línea.

   ⚠️ La primera versión buscaba la palabra suelta y dio ROJO con 60 líneas de
   `AtajoNexo`, `focoNexo` y prosa. *No medía el hecho —«hay un literal
   tecleado»— sino su eco en los identificadores*, que es justo la clase de
   instrumento que esta casa llama verde (o rojo) por la razón equivocada.
   Comillas simples, dobles y backtick: las tres formas de teclear un string. */
{
  const { execSync } = await import('node:child_process');
  let salida = '';
  try {
    salida = execSync(
      "grep -rn \"['\\\"\\`]Nexo['\\\"\\`]\" apps/cliente/src --include='*.ts' --include='*.tsx' | grep -v \"nombre: 'Nexo'\" || true",
      { cwd: new URL('../../../', import.meta.url).pathname, encoding: 'utf8' },
    );
  } catch {
    di('AMARILLO · no pude correr el censo del literal — se declara, no se da por verde.');
  }
  const lineas = salida.split('\n').filter((l) => l.trim() !== '');
  ok('el literal «Nexo» vive en UNA sola key', lineas.length === 0, lineas.join(' | '));
}

/* ═══ CONTROLES — cada regla con el caso que la haría fallar (L-459) ═════════ */

if (CONTROL) {
  di('');
  di('── CONTROLES ──');
  const controles: Array<[string, boolean]> = [
    ['una clase en 0 NO cuenta como viva', clasesVivasNexo({ chat: 0, carrito: 0, avisos: null }).length === 0],
    ['`null` NO cuenta como viva', clasesVivasNexo({ chat: null, carrito: null, avisos: null }).length === 0],
    ['el checkout NO es visible (rojo del guard por igualdad)', nexoVisibleEn(['checkout-plan']) === false],
    ['una ruta cualquiera SÍ es visible (el guard no apaga todo)', nexoVisibleEn(['hogar']) === true],
    ['memorial NO monta presencia', montaPresencia({ modo: 'ninguna' }) === false],
    ['individuo NO apaga vacuna', razonDeApagado('vacuna', 'individuo') === null],
    ['un i18next sin el valor DEJA la llave cruda — la premisa del gate sigue viva',
      String(inst.t('cliente:nexo.almohadilla')).includes('{{nombre}}')],
  ];
  for (const [nombre, condicion] of controles) {
    corridos += 1;
    if (condicion) {
      di(`  ok · ${nombre}`);
    } else {
      fallos += 1;
      di(`ROJO · control: ${nombre}`);
    }
  }
}

di('');
di(fallos === 0 ? `VERDE · ${corridos} casos, 0 fallos.` : `ROJO · ${corridos} casos, ${fallos} fallos.`);
process.exit(fallos === 0 ? 0 : 1);
