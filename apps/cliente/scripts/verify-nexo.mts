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
import { readFileSync } from 'node:fs';

import {
  AIRE_BORDE,
  ARCO_GROSOR,
  ORBE,
  ORBE_ABIERTO,
  RESPLANDOR,
  anclaOrbe,
  clasesConAlgo,
  type PendientesCoach,
} from '../../../packages/ui/src/components/coach-geometria';
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
import { cuerpoDelRecuerdo, frenoDelRecuerdo, keyDelRebote, puedeGuardar } from '../src/lib/recuerdo/decidir';

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
if (typeof frenoDelRecuerdo !== 'function' || frenoDelRecuerdo({ hayFoto: true, texto: '', fecha: '2026-01-01', hoy: '2026-01-01' }) !== null) {
  di('ROJO · auto-prueba: el freno del recuerdo no deja pasar un caso válido.');
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

/* ✅ LOTE 0.1 · **LOS CUATRO DEDOS ESTÁN VIVOS PARA UN INDIVIDUO.** ⏪ Este
   bloque afirmaba que «Foto» estaba apagado por falta de puerta; A la construyó
   y el gate se da vuelta en el mismo acto. *Un caso de prueba que sobrevive a
   su premisa mide el mundo de ayer.* */
const apagadosIndividuo = ORDEN_DE_PATA.filter((a) => razonDelDedo(a, PERRO) !== null);
ok('individuo · NINGÚN dedo apagado', apagadosIndividuo.length === 0, apagadosIndividuo.join(','));
ok('individuo · Foto está VIVO', razonDelDedo('foto', PERRO) === null);
ok('acuario · Foto también, el recuerdo no depende del sujeto', razonDelDedo('foto', ACUARIO) === null);

const apagadosAcuario = ORDEN_DE_PATA.filter((a) => razonDelDedo(a, ACUARIO) !== null);
ok('acuario · SÓLO los dos que no aplican', apagadosAcuario.join(',') === 'vacuna,antiparasitario');
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


/* ═══ ⑨ EL RECUERDO — las tres decisiones de la pantalla, sin React ══════════
 *
 * Se llaman **las mismas funciones que corren en pantalla** (`lib/recuerdo/
 * decidir`), no una réplica. Y es lo que vuelve medible el «cero llamadas» del
 * encargo: *que el botón no dispare nada sin foto ni texto se puede leer en el
 * código, pero leer no es medir.*
 */
{
  const HOY = '2026-09-04';
  const base = { hayFoto: false, texto: '', fecha: HOY, hoy: HOY };

  /* ① SIN FOTO NI TEXTO — razón en pantalla, y el guard dice que NO. */
  ok('vacío · el freno es «falta algo»', frenoDelRecuerdo(base) === 'faltaAlgo');
  ok('vacío · NO se puede guardar ⇒ cero llamadas', puedeGuardar(base) === false);
  ok('vacío · el espacio en blanco no cuenta como texto', frenoDelRecuerdo({ ...base, texto: '   \n ' }) === 'faltaAlgo');

  /* ② SÓLO TEXTO · SÓLO FOTO — las dos alcanzan, que es la firma de la mesa. */
  ok('sólo texto alcanza', puedeGuardar({ ...base, texto: 'Su primer día en el mar' }) === true);
  ok('sólo foto alcanza', puedeGuardar({ ...base, hayFoto: true }) === true);
  ok('las dos juntas también', puedeGuardar({ ...base, hayFoto: true, texto: 'x' }) === true);

  /* ③ FECHA FUTURA — rechazada EN PANTALLA. */
  ok('mañana se rechaza', frenoDelRecuerdo({ ...base, texto: 'x', fecha: '2026-09-05' }) === 'fechaFutura');
  ok('mañana NO se puede guardar', puedeGuardar({ ...base, texto: 'x', fecha: '2026-09-05' }) === false);
  ok('hoy sí', puedeGuardar({ ...base, texto: 'x', fecha: HOY }) === true);
  ok('ayer también: un recuerdo es del pasado', puedeGuardar({ ...base, texto: 'x', fecha: '2026-09-03' }) === true);

  /* 🔴 EL ORDEN DE LAS DOS PREGUNTAS: con el formulario recién abierto —vacío y
     con hoy— la razón tiene que ser la del primer paso que falta. */
  ok(
    'vacío Y con fecha futura ⇒ manda «falta algo», no la fecha',
    frenoDelRecuerdo({ ...base, fecha: '2026-09-05' }) === 'faltaAlgo',
  );

  /* ④ EL CUERPO QUE VIAJA — un texto vacío NO viaja. */
  const soloFoto = cuerpoDelRecuerdo({ mascotaId: 'm1', texto: '   ', fotoPath: 'u/f.jpg', fecha: HOY });
  ok('sólo foto · el texto vacío NO viaja', !('texto' in soloFoto), JSON.stringify(soloFoto));
  ok('sólo foto · el path sí', soloFoto.fotoPath === 'u/f.jpg');

  const soloTexto = cuerpoDelRecuerdo({ mascotaId: 'm1', texto: '  Su primer día  ', fecha: HOY });
  ok('sólo texto · no viaja fotoPath', !('fotoPath' in soloTexto), JSON.stringify(soloTexto));
  ok('sólo texto · viaja recortado', soloTexto.texto === 'Su primer día');
  ok('la fecha viaja siempre', soloTexto.fecha === HOY && soloFoto.fecha === HOY);
  ok('la mascota viaja siempre', soloTexto.mascotaId === 'm1');

  /* ⑤ LOS REBOTES — una línea cada uno, y el vacío comparte key con el freno. */
  ok('recuerdo_vacio comparte key con el freno de pantalla', keyDelRebote('recuerdo_vacio') === 'recuerdo.faltaAlgo');
  ok('foto_invalida tiene la suya', keyDelRebote('foto_invalida') === 'recuerdo.errFoto');
  ok('fecha_futura comparte key con el freno de pantalla', keyDelRebote('fecha_futura') === 'recuerdo.fechaFutura');
  ok('sin_acceso_mascota', keyDelRebote('sin_acceso_mascota') === 'recuerdo.errAcceso');
  ok('acceso_denegado', keyDelRebote('acceso_denegado') === 'recuerdo.errAcceso');
  ok('error_desconocido cae al genérico', keyDelRebote('error_desconocido') === 'recuerdo.errGenerico');
  /* 🔴 Y el ensanche del ResultadoWrapper, que el compilador ya cobró una vez:
     un código que el enum del wrapper no nombra tiene que caer al genérico y no
     romper. */
  ok('datos_inconsistentes cae al genérico', keyDelRebote('datos_inconsistentes') === 'recuerdo.errGenerico');
  ok('un código inventado cae al genérico', keyDelRebote('lo_que_sea') === 'recuerdo.errGenerico');
}


/* ═══ ⑩ EL ORBE EN REPOSO NO QUEDA TAPADO — z-order y geometría ══════════════
 *
 * ⏪ **ESTE BLOQUE SE REESCRIBIÓ CONTRA LA PIEZA NUEVA, y el gate lo exigió a
 * los gritos:** B rehízo la presencia en el lote 0.1 —la huella murió en el
 * teléfono y la reemplaza una FILA ASCENDENTE sobre el eje del orbe, que ya no
 * viaja— y con ella murió `HALO`. El arnés **no arrancó**: *«does not provide
 * an export named HALO»*. **Eso es exactamente lo que tiene que pasar**: un
 * gate atado a la geometría real se rompe cuando la geometría cambia, en vez
 * de seguir verde midiendo el mundo de ayer.
 *
 * 🔴 **LA BARRA PINTA DESPUÉS DEL ORBE, y eso no se discute: se mide.** En el
 * `tabBar` del shell, `NexoDelShell` es el PRIMER hijo del fragmento y
 * `BarraTabs` el SEGUNDO — en React Native los hermanos posteriores pintan
 * encima. ⇒ **donde se toquen, gana la barra.** Lo único que salva al orbe es
 * que NO se toquen, y eso es aritmética con los números de B.
 *
 * ⚠️ **Y una tarjeta de pantalla no puede taparlo, por una razón distinta:**
 * el orbe vive en el subárbol del `tabBar`, que el navegador pinta DESPUÉS del
 * contenedor de pantallas. Los `zIndex: 2` de Hogar (`index.tsx:1749`) y de la
 * ficha de la mascota (`[mascotaId].tsx:1092`) ordenan **entre hermanos de su
 * propio padre** y no cruzan de subárbol; medido además: **ninguna de las dos
 * pantallas usa `elevation`**, que es lo único que en Android podría cruzar.
 */
{
  const ANCHO = 390; // un teléfono común; el ancla es lineal en el ancho

  /* 🔴 **EL ALTO DE LA FILA SE LEE DEL ARCHIVO, NO SE IMPORTA — y no es un
     atajo: es lo único que se puede.** `ALTO_FILA_TABS` se exporta desde
     `BarraTabs.tsx`, un componente, así que importarlo arrastra
     `react-native` entero y el arnés no arranca (medido: «Unexpected typeof»
     en `react-native/index.js`). *Ésa es la razón por la que B puso su
     geometría en un módulo sin runtime.* Se lee del objeto y **si no se puede
     leer, el gate NO da verde**: sale NO CONCLUYENTE. */
  const fuenteBarra = readFileSync(
    new URL('../../../packages/ui/src/components/BarraTabs.tsx', import.meta.url),
    'utf8',
  );
  const mAlto = /const ALTO_FILA = (\d+)/.exec(fuenteBarra);
  if (mAlto === null) {
    di('ROJO · no pude leer ALTO_FILA de BarraTabs.tsx — no pude medir el z-order.');
    process.exit(2);
  }
  const BARRA = Number(mAlto[1]) + 34; // fila + un inset típico

  const ancla = anclaOrbe(ANCHO, BARRA);

  /* ① EL CUERPO DEL ORBE — `anclaOrbe` promete la caja del ORBE, no la del
        resplandor, así que su borde inferior es el ancla misma. */
  const holguraCuerpo = ancla.abajo - BARRA;
  ok('el cuerpo del orbe no entra en la banda de la barra', holguraCuerpo > 0, `holgura=${holguraCuerpo}`);
  ok('y la holgura es el aire del borde, no un sobrante casual', holguraCuerpo === AIRE_BORDE, String(holguraCuerpo));

  /* ② LA CAJA DE LOS ARCOS — desborda `ARCO_GROSOR * 2` y la pieza lo compensa
        para que el CUERPO caiga donde el ancla promete. La caja baja igual. */
  const holguraCaja = ancla.abajo - ARCO_GROSOR * 2 - BARRA;
  ok('la caja de los arcos tampoco entra en la barra', holguraCaja > 0, `holgura=${holguraCaja}`);

  /* ③ EL ORBE ABIERTO — **crece y no viaja** (`scale`, centro fijo). Al escalar
        alrededor del centro, la caja baja la mitad de lo que crece. */
  const altoCaja = ORBE + ARCO_GROSOR * 4;
  const crecimiento = altoCaja * (ORBE_ABIERTO / ORBE - 1);
  const holguraAbierto = holguraCaja - crecimiento / 2;
  ok('abierto tampoco entra en la barra', holguraAbierto > 0, `holgura=${holguraAbierto.toFixed(1)}`);

  /* ④ EL RESPLANDOR SÍ ROZA, Y SE DECLARA EN VEZ DE ESCONDERSE. Es una SOMBRA
        (`shadowRadius = RESPLANDOR`, `elevation` en Android), no cuerpo: su
        borde exterior llega a `AIRE_BORDE - RESPLANDOR` de la banda. *El orbe
        no queda tapado; lo que la barra recorta son los píxeles más tenues de
        su brillo.* Se mide para que el día que alguien cambie uno de los dos
        números, el cambio aparezca acá y no en un teléfono. */
  const rocePorElBrillo = RESPLANDOR - AIRE_BORDE;
  ok('el roce es SÓLO del resplandor y está acotado', rocePorElBrillo > 0 && rocePorElBrillo <= 8, `${rocePorElBrillo}px`);

  /* ⑤ EL BORDE DERECHO — que no se salga de la pantalla, ni al crecer. */
  ok('el orbe no se sale por la derecha', ancla.izquierda + ORBE <= ANCHO);
  ok('abierto tampoco', ancla.izquierda + ORBE + crecimiento / 2 <= ANCHO);

  /* 🔴 EL CONTROL NEGATIVO, y nombra el modo de falla real: si el shell se
        olvidara de pasar `aireInferior`, el orbe caería DENTRO de la barra —
        y como la barra pinta después, quedaría tapado sin que nada falle. */
  const sinAire = anclaOrbe(ANCHO, 0);
  ok(
    'sin `aireInferior` el orbe QUEDARÍA dentro de la banda de la barra',
    sinAire.abajo - BARRA < 0,
    `holgura=${sinAire.abajo - BARRA}`,
  );

  /* ⑥ Y QUE EL SHELL SE LO PASE MEDIDO, NO TECLEADO.
     🔴 **SE MIRA EL BLOQUE DE `PresenciaCoach`, NO EL ARCHIVO — y esto lo
     corrigió su propio rojo.** La primera versión buscaba
     `aireInferior={altoBarra}` en todo el archivo y **daba VERDE con la
     presencia en `0`**: encontraba el de `BurbujaPendientes`, que está tres
     líneas más arriba y también lo recibe. *Dos consumidores del mismo dato en
     el mismo archivo, y el gate no distinguía cuál medía.* */
  const shell = readFileSync(new URL('../src/app/(tabs)/_layout.tsx', import.meta.url), 'utf8');
  const iPresencia = shell.indexOf('<PresenciaCoach');
  if (iPresencia < 0) {
    di('ROJO · no encuentro el montaje de PresenciaCoach — no pude medir.');
    process.exit(2);
  }
  const bloquePresencia = shell.slice(iPresencia, shell.indexOf('/>', iPresencia));
  ok('la PRESENCIA recibe el aire medido', /aireInferior=\{altoBarra\}/.test(bloquePresencia), bloquePresencia.slice(-120));
  ok('y la burbuja también, que ocupa el mismo píxel', /aireInferior=\{altoBarra\}/.test(shell.slice(0, iPresencia)));
  ok('`altoBarra` se MIDE con onLayout', /onLayout=\{\(e\) =>/.test(shell) && /setAltoBarra/.test(shell));
  ok(
    'arranca en la fórmula de la barra, no en un número tecleado',
    /useState\(ALTO_FILA_TABS \+ insets\.bottom\)/.test(shell),
  );
  const iNexo = shell.indexOf('<NexoDelShell');
  const iBarra = shell.indexOf('<BarraTabs');
  ok('la presencia se monta ANTES que la barra (la barra pinta encima)', iNexo > 0 && iBarra > iNexo);

  /* ⑦ 🔴 `onPreguntar` NO SE DISPARA DOS VECES — aviso de B: ahora lo tira el
        orbe YA ABIERTO, no una línea aparte. Medido de los dos lados: en la
        PIEZA son dos NODOS distintos (la pastilla de la voz y el orbe), así
        que un toque enciende uno; en MI montaje `onPreguntar` aparece una sola
        vez y `tocar('coach')` tiene un solo llamador. */
  const veces = (re: RegExp) => (bloquePresencia.match(re) ?? []).length;
  ok('`onPreguntar` se pasa UNA sola vez', veces(/onPreguntar=/g) === 1, String(veces(/onPreguntar=/g)));
  ok(
    "`tocar('coach')` tiene un solo llamador en el shell",
    (shell.match(/tocar\('coach'\)/g) ?? []).length === 1,
  );
  ok('y `onAbrir` no lo llama: sólo enciende la fila', /onAbrir=\{\(\) => setAbierta\(true\)\}/.test(bloquePresencia));

  /* ⑧ EL ORDEN DE LOS ATAJOS — B lo lee **de abajo hacia arriba**, en el orden
        en que se pasan. El de la mesa es Peso · Vacuna · Antiparasitario ·
        Foto, con Peso abajo (el más cerca del pulgar). */
  ok(
    'el orden de los atajos es el de la mesa, de abajo hacia arriba',
    ORDEN_DE_PATA.join(',') === 'peso,vacuna,antiparasitario,foto',
    ORDEN_DE_PATA.join(','),
  );
  ok('y son exactamente CUATRO, que es lo que la tupla exige', ORDEN_DE_PATA.length === 4);
}


/* ═══ ⑫ EL CABLEADO DEL ORBE — qué llega a la pieza y qué no ═════════════════
 *
 * Medido en web con sesión real (`scripts/medir-orbe-s113c.mjs`): al tocar el
 * orbe su nombre accesible pasa de «Abrir a Nexo» a «Pregúntale a Nexo», que
 * es literalmente `abierta ? voz.preguntar : voz.orbe` ⇒ **`abierta` LLEGA**.
 * Acá se fija lo que ese camino necesita del montaje, para que el día que
 * alguien lo desarme suene antes que un teléfono.
 */
{
  const shell = readFileSync(new URL('../src/app/(tabs)/_layout.tsx', import.meta.url), 'utf8');
  const iP = shell.indexOf('<PresenciaCoach');
  const bloque = shell.slice(iP, shell.indexOf('/>', iP));

  ok('el orbe abre: `onAbrir` enciende la fila', /onAbrir=\{\(\) => setAbierta\(true\)\}/.test(bloque));
  ok('el velo cierra: `onCerrar` la apaga', /onCerrar=\{\(\) => setAbierta\(false\)\}/.test(bloque));
  ok('la fila «Pregúntale» abre la Hoja', /onPreguntar=\{\(\) => tocar\('coach'\)\}/.test(bloque));
  ok('`abierta` viaja a la pieza', /abierta=\{abierta\}/.test(bloque));

  /* 🔴 LOS DOS ARGUMENTOS DEL ESTADO, y son los que la captura del founder
     puso en duda: `despierta` sale de la pata abierta y `hablando` de la Hoja.
     Se asertan por literal porque **el estado no se puede leer del DOM**: no
     es una prop de la pieza que se dibuje, es un cálculo del shell. */
  ok(
    '`estado` deriva la pata de `abierta`',
    /estado=\{estadoNexo\(\{[^}]*huellaAbierta: abierta/.test(bloque),
    bloque.slice(bloque.indexOf('estado='), bloque.indexOf('estado=') + 110),
  );
  ok('`estado` deriva la Hoja de `hojaCoach`', /hojaAbierta: hojaCoach !== null/.test(bloque));

  /* Y la función, con los dos casos que el encargo pidió medir. */
  const P = { chat: 0, pedidos: 0, avisos: null } as const;
  ok(
    'al abrir la pata ⇒ despierta',
    estadoNexo({ pendientes: P, huellaAbierta: true, hojaAbierta: false }) === 'despierta',
  );
  ok(
    'con la Hoja ⇒ hablando, aunque la pata ya se haya cerrado',
    estadoNexo({ pendientes: P, huellaAbierta: false, hojaAbierta: true }) === 'hablando',
  );
  /* ⚠️ El caso REAL de esta app: `tocar('coach')` cierra la pata Y abre la
     Hoja, así que el estado que la pieza recibe es `hablando` con
     `huellaAbierta: false`. *Si el assert sólo mirara `true/true`, mediría un
     caso que este montaje no produce.* */
  ok(
    'y con las dos ⇒ manda la Hoja',
    estadoNexo({ pendientes: P, huellaAbierta: true, hojaAbierta: true }) === 'hablando',
  );
}

/* ═══ ⑬ LA VOZ — que el nombre ENTRE, y que no quede una llave cruda ═════════ */

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
    /* 🔴 La razón del dedo atenuado NOMBRA a la mascota (firma de la mesa):
       ni «próximamente» ni «en construcción». */
    'nexo.razonAcuario',
    /* Lote 0.1 · las dos voces de la pantalla del recuerdo que llevan nombre. */
    'recuerdo.titulo',
    'recuerdo.guardado',
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
    /* Lote 0.1 · la pantalla del recuerdo, entera. */
    'recuerdo.agregarFoto', 'recuerdo.cambiarFoto', 'recuerdo.textoLabel',
    'recuerdo.textoPlaceholder', 'recuerdo.fechaLabel', 'recuerdo.fechaPlaceholder',
    'recuerdo.fechaFutura', 'recuerdo.guardar', 'recuerdo.faltaAlgo',
    'recuerdo.permisoDenegado', 'recuerdo.errFoto', 'recuerdo.errAcceso',
    'recuerdo.errSesion', 'recuerdo.errGenerico',
    /* Y las cinco razones de la SUBIDA, que se reusan de `carnet.*`: si alguna
       se retira de allá, este gate lo dice antes que una pantalla muda. */
    'carnet.subidaLecturaLocal', 'carnet.subidaArchivoGrande', 'carnet.subidaMime',
    'carnet.subidaPolicy', 'carnet.subidaRed',
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
    ['Foto ya no se apaga por falta de puerta', razonDelDedo('foto', [mascota('t')]) === null],
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
