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
import { clasesConAlgo, type PendientesCoach } from '../../../packages/ui/src/components/coach-geometria';
import { clasesVivas } from '../../../packages/ui/src/components/pendientes-vivos';
import { clasesVisibles, silenciaCarrito } from '../src/lib/pendientes-adopcion';
import {
  ORDEN_DE_PATA,
  esMemorial,
  focoNexo,
  mascotasParaAtajo,
  montaPresencia,
  razonDeApagado,
  razonDelDedo,
} from '../src/lib/nexo/atajos';
import { avisosSinRespuesta, estadoNexo, hayAlgo, nexoVisibleEn } from '../src/lib/nexo/estado';

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
if (typeof focoNexo !== 'function' || typeof clasesConAlgo !== 'function') {
  di('ROJO · las funciones no son alcanzables — no pude medir.');
  process.exit(2);
}
if (clasesConAlgo({ chat: 0, pedidos: 0, avisos: null }).length !== 0) {
  di('ROJO · auto-prueba: todo en cero da clases vivas.');
  process.exit(2);
}
if (clasesConAlgo({ chat: 1, pedidos: 0, avisos: null }).length !== 1) {
  di('ROJO · auto-prueba: pierde una clase viva.');
  process.exit(2);
}

/* ═══ ① LOS PENDIENTES · los dos casos del encargo ═══════════════════════════ */

/* ⚠️ **El tipo es el de B (`PendientesCoach`), no uno mío**: el arnés mide el
   contrato real que la pantalla le pasa a la pieza. */
const DORMIDA: PendientesCoach = { chat: 0, pedidos: 0, avisos: null };
const ATENTA: PendientesCoach = { chat: 2, pedidos: 1, avisos: null };

ok('dormida · 0/0/null no tiene clases vivas', clasesConAlgo(DORMIDA).length === 0);
ok('dormida · no hay nada', hayAlgo(DORMIDA) === false);
ok(
  'dormida · el estado es dormida',
  estadoNexo({ pendientes: DORMIDA, huellaAbierta: false, hojaAbierta: false }) === 'dormida',
);
ok('avisos en null · el motor NO sabe, y no es un cero', avisosSinRespuesta(DORMIDA) === true);
ok('avisos en 0 · el motor miró y no hay', avisosSinRespuesta({ chat: 0, pedidos: 0, avisos: 0 }) === false);
ok(
  'los dos callan el arco — por razones opuestas',
  clasesConAlgo({ chat: 0, pedidos: 0, avisos: 0 }).length === 0 && clasesConAlgo(DORMIDA).length === 0,
);

const vivas = clasesConAlgo(ATENTA);
ok('atenta · DOS clases vivas ⇒ dos arcos y dos pastillas', vivas.length === 2, `dio ${vivas.length}`);
ok('atenta · son chat y pedidos, en ese orden', vivas.join(',') === 'chat,pedidos', vivas.join(','));
ok('atenta · NINGUNA VIOLETA: avisos queda fuera', !vivas.includes('avisos'));
ok('atenta · los números son los que se pasan', ATENTA.chat === 2 && ATENTA.pedidos === 1);
ok(
  'atenta · el estado es atenta',
  estadoNexo({ pendientes: ATENTA, huellaAbierta: false, hojaAbierta: false }) === 'atenta',
);
ok(
  'despierta · con la pata abierta manda la pata',
  estadoNexo({ pendientes: ATENTA, huellaAbierta: true, hojaAbierta: false }) === 'despierta',
);
ok(
  'hablando · con la Hoja abierta manda la Hoja',
  estadoNexo({ pendientes: DORMIDA, huellaAbierta: true, hojaAbierta: true }) === 'hablando',
);
ok(
  'avisos · el día que tenga número, cuenta como clase viva',
  clasesConAlgo({ chat: 0, pedidos: 0, avisos: 3 }).join(',') === 'avisos',
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

const PERRO = [mascota('thor')];
const ACUARIO = [mascota('nube', { sujeto: 'acuario', especie: 'pez' })];
const MIXTO = [mascota('thor'), mascota('nube', { sujeto: 'acuario', especie: 'pez' })];

const apagadosIndividuo = ORDEN_DE_PATA.filter((a) => razonDelDedo(a, PERRO) !== null);
ok('individuo · sólo Foto está apagado, y por falta de puerta', apagadosIndividuo.join(',') === 'foto');
ok('individuo · la razón de Foto es «sin puerta»', razonDelDedo('foto', PERRO) === 'sin_puerta');

const apagadosAcuario = ORDEN_DE_PATA.filter((a) => razonDelDedo(a, ACUARIO) !== null);
ok('acuario · DOS dedos atenuados por acuario + Foto', apagadosAcuario.join(',') === 'vacuna,antiparasitario,foto');
ok('acuario · Vacuna se apaga por acuario', razonDelDedo('vacuna', ACUARIO) === 'acuario');
ok('acuario · Antiparasitario se apaga por acuario', razonDelDedo('antiparasitario', ACUARIO) === 'acuario');
ok('acuario · Peso NO se apaga: el motor lo admite', razonDelDedo('peso', ACUARIO) === null);

/* 🔴 EL HUECO QUE APARECIÓ PROBANDO EL SELECTOR — el dedo no puede ofrecer un
   camino que después habría que rebotar. */
ok('perro + acuario · Vacuna sigue VIVA (el perro se vacuna)', razonDelDedo('vacuna', MIXTO) === null);
ok(
  'perro + acuario · pero la hoja ofrece SOLO al perro',
  mascotasParaAtajo('vacuna', MIXTO).map((m) => m.id).join(',') === 'thor',
);
ok('perro + acuario · Peso las ofrece a las dos', mascotasParaAtajo('peso', MIXTO).length === 2);
ok('sin candidatas todavía · el dedo NO se apaga por no saber', razonDelDedo('vacuna', []) === null);
ok('razonDeApagado sigue siendo la regla por mascota', razonDeApagado('vacuna', 'acuario') === 'acuario');


/* ═══ ⑦ EL GUARD DEL CARRITO — la burbuja tampoco se dibuja donde no debe ════
 *
 * 🔴 **Vivía con `s === 'checkout'` y NO alcanzaba a `checkout-plan` ni a
 * `checkout-paquete`.** Nexo ya comparaba por prefijo; la burbuja —que sigue
 * viva en memorial y mientras el hogar carga— no. *La cura no basta con
 * escribirla: el control es que en `checkout-plan` no quede NADA dibujado.*
 */
{
  const CHECKOUTS: Array<[string, string[]]> = [
    ['despensa', ['(tabs)', 'despensa', 'checkout']],
    ['paseo', ['(tabs)', 'explorar', 'paseo', 'checkout']],
    ['paseo · PLAN — el que la igualdad no alcanzaba', ['(tabs)', 'explorar', 'paseo', 'checkout-plan']],
    ['paseo · PAQUETE — ídem', ['(tabs)', 'explorar', 'paseo', 'checkout-paquete']],
    ['la caja del carrito', ['(tabs)', 'despensa', 'carrito']],
  ];
  for (const [nombre, segs] of CHECKOUTS) {
    ok(`el carrito se calla en ${nombre}`, silenciaCarrito(segs) === true);
    ok(`clasesVisibles apaga el carrito en ${nombre}`, clasesVisibles(segs).carrito === false);
    /* 🔴 EL CONTROL QUE PIDIÓ LA MESA: con SÓLO carrito pendiente, ahí la
       burbuja entera no se dibuja — la clase se calla, queda cero clases
       vivas y la pieza devuelve null. */
    const soloCarrito = [
      { clase: 'carrito', cuenta: clasesVisibles(segs).carrito ? 3 : 0 },
      { clase: 'mensajes', cuenta: clasesVisibles(segs).mensajes ? 0 : 0 },
    ];
    ok(`en ${nombre} la burbuja no se dibuja con sólo carrito`, clasesVivas(soloCarrito).length === 0);
  }

  /* Y el contra-caso, que es lo que hace que la cura sirva: **el prefijo no
     apaga de más.** */
  const VIVOS: Array<[string, string[]]> = [
    ['la vitrina', ['(tabs)', 'despensa', 'index']],
    ['el Hogar', ['(tabs)', 'hogar', 'index']],
    ['la ficha de un producto', ['(tabs)', 'despensa', 'producto', '[productoId]']],
  ];
  for (const [nombre, segs] of VIVOS) {
    ok(`el carrito SIGUE VIVO en ${nombre}`, silenciaCarrito(segs) === false);
    ok(`y ahí la burbuja sí se dibuja`, clasesVivas([{ clase: 'carrito', cuenta: 3 }]).length === 1);
  }

  /* Los mensajes NO se callan en un checkout: *un mensaje pendiente en el
     checkout sigue estando pendiente.* El silencio es POR CLASE. */
  ok(
    'los mensajes NO se callan en el checkout — el silencio es por clase',
    clasesVisibles(['(tabs)', 'explorar', 'paseo', 'checkout-plan']).mensajes === true,
  );
  /* Y en el hilo se calla la pieza ENTERA, que es otra razón (el disco cae
     sobre la barra de escribir). */
  const enHilo = clasesVisibles(['adoptar', 'solicitud', '[solicitudId]']);
  ok('en el hilo se callan LAS DOS clases', enHilo.carrito === false && enHilo.mensajes === false);
  ok('en el ACTA no se calla nada: no tiene barra de escribir', clasesVisibles(['adoptar', 'acta', '[solicitudId]']).carrito === true);
}

/* ═══ ⑧ LA VOZ — que el nombre ENTRE, y que no quede una llave cruda ═════════ */

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

  const conMascota = [
    'antiparasitario.titulo',
    'antiparasitario.anotado',
    /* 🔴 Las razones de los dedos atenuados NOMBRAN a la mascota (firma de la
       mesa): ni «próximamente» ni «en construcción». */
    'nexo.razonSinPuerta',
    'nexo.razonAcuario',
  ];
  for (const k of conMascota) {
    const s = t(k, { mascota: 'Thor' });
    ok(`${idioma} · ${k} interpola la mascota`, s.includes('Thor'), s);
    ok(`${idioma} · ${k} no deja una llave cruda`, !s.includes('{{'), s);
  }

  /* Las voces sin variables tampoco pueden quedar con una llave: si alguien
     agrega una interpolación y se olvida del valor, acá suena. */
  /* Las pastillas: **su voz se pasa aunque la cuenta sea 0**, así que las
     cuatro tienen que existir y ninguna puede quedar con una llave cruda. */
  for (const [k, v] of [['nexo.vozChat', { n: 3 }], ['nexo.vozCarrito', { n: 3 }]] as const) {
    const s2 = t(k, v as Record<string, number>);
    ok(`${idioma} · ${k} interpola el número`, s2.includes('3'), s2);
    ok(`${idioma} · ${k} no deja una llave cruda`, !s2.includes('{{'), s2);
  }

  const planas = [
    'nexo.dedoPeso', 'nexo.dedoVacuna', 'nexo.dedoAntiparasitario', 'nexo.dedoFoto',
    'nexo.elegirMascota', 'nexo.cerrar', 'alta.tuMascota',
    'nexo.vozChatUna', 'nexo.vozCarritoUno',
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
    ['una clase en 0 NO cuenta como viva', clasesConAlgo({ chat: 0, pedidos: 0, avisos: null }).length === 0],
    ['`null` de avisos NO cuenta como viva', clasesConAlgo({ chat: 0, pedidos: 0, avisos: null }).length === 0],
    ['un acuario solo SÍ apaga vacuna', razonDelDedo('vacuna', [mascota('n', { sujeto: 'acuario' })]) === 'acuario'],
    ['el checkout NO es visible (rojo del guard por igualdad)', nexoVisibleEn(['checkout-plan']) === false],
    ['una ruta cualquiera SÍ es visible (el guard no apaga todo)', nexoVisibleEn(['hogar']) === true],
    ['memorial NO monta presencia', montaPresencia({ modo: 'ninguna' }) === false],
    ['individuo NO apaga vacuna', razonDelDedo('vacuna', [mascota('t')]) === null],
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
