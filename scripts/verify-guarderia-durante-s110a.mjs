// ═══════════════════════════════════════════════════════════════════════════
// S110-A · E2E DEL DURANTE DE GUARDERÍA — los cinco actos por la PUERTA
//
// Por qué existe además del cinturón: el cinturón probó el MOTOR desde adentro
// de la migración, con `SET LOCAL request.jwt.claims`. Esto prueba **la
// PUERTA** — los wrappers, la normalización de códigos por prefijo, y la RLS
// con una sesión de verdad. *Un motor probado por dentro y una puerta probada
// son dos hechos distintos: se pagó seis veces en una sesión.*
//
// 🔴 ESCRIBE DE VERDAD sobre una estadía REAL, y **desmonta por id con residuo
// verificado en CERO** — el perímetro dice que las 95 filas vivas quedan donde
// están, y eso incluye después de este arnés.
// 🔒 La clave se lee del keychain EN EL MOMENTO — jamás viaja al repo.
// ═══════════════════════════════════════════════════════════════════════════

import { execFileSync } from 'node:child_process';
import { dbQuery, claveAnonDeEnv } from './lib-db.mjs';
import {
  initApi, iniciarSesion,
  obtenerMaquinaEstadia, abrirTramoGuarderia, cerrarTramoGuarderia,
  marcarABordo, marcarLlegada, marcarRetorno, marcarEntregada, marcarNoRecogida,
} from '../packages/api/src/index.ts';

const { url, anon } = claveAnonDeEnv();
initApi(url, anon);
const clave = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim();

let fallos = 0;
const check = (cond, nombre, detalle = '') => {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
};

// ── El sujeto sale de datos REALES ─────────────────────────────────────────
const ctx = dbQuery(`
  SELECT u.email, p.id AS prestador
    FROM prestadores p JOIN auth.users u ON u.id = p.user_id
   WHERE p.estado='activo' AND u.email = 'guillo381+demovet@gmail.com' LIMIT 1`)[0];
if (!ctx) { console.error('ABORTA: no existe el titular de prueba.'); process.exit(1); }

const filas = dbQuery(`
  SELECT g.id::text AS estadia, c.fecha::text AS fecha
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.estado='reservada' AND c.prestador_id='${ctx.prestador}'
   ORDER BY c.fecha LIMIT 2`);
if (filas.length < 2) {
  console.error(`ABORTA: hacen falta 2 estadías reservadas de ese prestador (hay ${filas.length}).`);
  process.exit(1);
}
/* Las dos del MISMO día: el tramo es por (prestador, fecha, dirección). */
const mismoDia = dbQuery(`
  SELECT g.id::text AS estadia, c.fecha::text AS fecha
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.estado='reservada' AND c.prestador_id='${ctx.prestador}'
     AND c.fecha = (SELECT c2.fecha FROM guarderia_estadias g2
                      JOIN evento_cita_servicio c2 ON c2.id=g2.cita_id
                     WHERE g2.estado='reservada' AND c2.prestador_id='${ctx.prestador}'
                     GROUP BY c2.fecha HAVING count(*) >= 2 ORDER BY c2.fecha LIMIT 1)
   ORDER BY g.id LIMIT 2`);
const [A, B] = mismoDia.length >= 2 ? mismoDia : filas;
const FECHA = A.fecha;
console.log(`sujeto: prestador ${ctx.prestador} · fecha ${FECHA} · estadías ${A.estadia} / ${B.estadia}\n`);

const ses = await iniciarSesion({ email: ctx.email, password: clave });
check(ses.ok === true, 'sesión real del titular', ses.ok ? ctx.email : ses.codigo);
if (!ses.ok) process.exit(1);

/* LA HORA DE LA PUERTA: 47 minutos atrás, para que NO pueda confundirse con la
   del servidor. *Si la divergencia fuera de un segundo, el brazo no
   discriminaría nada.* */
const PUERTA = new Date(Date.now() - 47 * 60 * 1000).toISOString();

// ── ① LA MÁQUINA COMO DATO ─────────────────────────────────────────────────
const maq = await obtenerMaquinaEstadia();
check(maq.ok === true && maq.data.estados.length === 7 && maq.data.actos.length === 5,
  'obtenerMaquinaEstadia trae 7 estados y 5 actos',
  maq.ok ? `${maq.data.estados.length}/${maq.data.actos.length}` : maq.codigo);
check(maq.ok === true && maq.data.estados.find((e) => e.estado === 'cancelada')?.escritor
        === 'mover_sujeto_por_reverso',
  'la máquina DECLARA que `cancelada` la escribe el reverso de pago');

// ── ② ROJO PRIMERO: a bordo SIN tramo abierto ──────────────────────────────
const sinTramo = await marcarABordo(A.estadia, { carnetVerificado: true, ocurridoEn: PUERTA });
check(sinTramo.ok === false && sinTramo.codigo === 'sin_tramo_abierto',
  'ROJO · a bordo sin tramo abierto REBOTA tipado',
  sinTramo.ok ? 'PASÓ' : sinTramo.codigo);

// ── ③ ROJO: hora del futuro ────────────────────────────────────────────────
const futuro = await marcarABordo(A.estadia, {
  carnetVerificado: true, ocurridoEn: new Date(Date.now() + 3600e3).toISOString(),
});
check(futuro.ok === false && futuro.codigo === 'hora_de_la_puerta_en_el_futuro',
  'ROJO · una hora del futuro no puede sellar un acto',
  futuro.ok ? 'PASÓ' : futuro.codigo);

// ── ④ EL VIAJE DE RECOGIDA ─────────────────────────────────────────────────
const tr = await abrirTramoGuarderia({
  prestadorId: ctx.prestador, fecha: FECHA, direccion: 'recogida',
  estadias: [A.estadia, B.estadia],
});
check(tr.ok === true && tr.data.estadiasAtadas === 2,
  'abrirTramoGuarderia ata las dos estadías', tr.ok ? tr.data.tramoId : tr.codigo);
if (!tr.ok) process.exit(1);
const tramoRecogida = tr.data.tramoId;

const tr2 = await abrirTramoGuarderia({ prestadorId: ctx.prestador, fecha: FECHA, direccion: 'recogida' });
check(tr2.ok === true && tr2.data.yaExistia === true && tr2.data.tramoId === tramoRecogida,
  'abrirTramo es IDEMPOTENTE — el segundo encuentra, no rebota');

// ── ⑤ EL ACTO ÚNICO: acta + estado, y LAS DOS HORAS ────────────────────────
const ab = await marcarABordo(A.estadia, {
  carnetVerificado: true, objetos: 'correa y manta', ocurridoEn: PUERTA, claveIdempotencia: 'e2e-1',
});
check(ab.ok === true && ab.data.estado === 'recogida_en_curso' && !!ab.data.actaId,
  'marcarABordo mueve el estado Y levanta el acta en un acto',
  ab.ok ? `${ab.data.estado} · acta ${ab.data.actaId.slice(0, 8)}` : ab.codigo);
if (!ab.ok) process.exit(1);
check(ab.data.ocurridoEn.slice(0, 19) === PUERTA.slice(0, 19),
  'la hora que se MUESTRA es la de la PUERTA', `${ab.data.ocurridoEn} vs ${PUERTA}`);
check(new Date(ab.data.registradoEn) > new Date(ab.data.ocurridoEn),
  '`registradoEn` es del servidor y DIVERGE — la auditoría ve las dos',
  `${Math.round((new Date(ab.data.registradoEn) - new Date(ab.data.ocurridoEn)) / 60000)} min`);

// ── ⑥ IDEMPOTENCIA DEL ACTO: el reintento NO pisa la hora ──────────────────
const rein = await marcarABordo(A.estadia, {
  carnetVerificado: true, ocurridoEn: new Date().toISOString(), claveIdempotencia: 'e2e-1',
});
check(rein.ok === true && rein.data.yaEstaba === true
      && rein.data.ocurridoEn === ab.data.ocurridoEn,
  'el reintento devuelve el ORIGINAL y no pisa la hora',
  rein.ok ? `${rein.data.ocurridoEn}` : rein.codigo);

// ── ⑦ EL LOTE, con su rechazo POR ÍTEM ─────────────────────────────────────
const lote = await marcarLlegada([A.estadia, B.estadia], PUERTA);
check(lote.ok === true && lote.data.movidas === 1 && lote.data.rechazadas.length === 1
      && lote.data.rechazadas[0].estadiaId === B.estadia,
  'el lote mueve la que puede y RECHAZA la otra POR ÍTEM',
  lote.ok ? `movidas=${lote.data.movidas} rechazadas=${lote.data.rechazadas.length}` : lote.codigo);

const nada = await marcarRetorno([B.estadia], PUERTA);
check(nada.ok === false && nada.codigo === 'ninguna_transicion_posible',
  'ROJO · un lote que no mueve NADA no devuelve ok:true',
  nada.ok ? 'PASÓ' : nada.codigo);

// ── ⑧ LA VUELTA ───────────────────────────────────────────────────────────
const trd = await abrirTramoGuarderia({
  prestadorId: ctx.prestador, fecha: FECHA, direccion: 'devolucion', estadias: [A.estadia],
});
check(trd.ok === true, 'abre el tramo de devolución', trd.ok ? trd.data.tramoId : trd.codigo);
const ret = await marcarRetorno([A.estadia], PUERTA);
check(ret.ok === true && ret.data.movidas === 1, 'marcarRetorno mueve',
  ret.ok ? `${ret.data.movidas}` : ret.codigo);

const ent = await marcarEntregada(A.estadia, {
  carnetVerificado: true, ocurridoEn: PUERTA, claveIdempotencia: 'e2e-2',
});
check(ent.ok === true && ent.data.estado === 'entregada' && !!ent.data.actaId,
  'marcarEntregada cierra con el acta ESPEJO',
  ent.ok ? `acta ${ent.data.actaId.slice(0, 8)}` : ent.codigo);

const dosActas = dbQuery(`SELECT count(*)::int n FROM guarderia_actas WHERE estadia_id='${A.estadia}'`)[0].n;
check(dosActas === 2, 'quedaron LAS DOS actas', `${dosActas}`);

// ── ⑨ ROJO: sobre una estadía TERMINAL no se aplica un acto NUEVO ──────────
/* 🔴 ENMENDADO DESPUÉS DE CORRERLO. Mi primera versión repetía `llegada` sobre
   la estadía ya entregada y esperaba un rechazo — y el motor devolvía ok. **El
   motor tenía razón y el arnés estaba midiendo otra cosa**: esa estadía SÍ
   llegó, y la idempotencia es por (estadía, ACTO), así que repetir un acto que
   ocurrió devuelve el original. *Eso no es «aplicar un acto sobre un estado
   terminal»: es no aplicar nada.*
   El guard que la mesa pidió se mide con un acto que NUNCA ocurrió sobre esa
   estadía — y ahí sí tiene que rebotar hablando. */
const fin = await marcarNoRecogida({
  estadiaId: A.estadia, motivo: 'nadie_en_domicilio', ocurridoEn: PUERTA,
});
check(fin.ok === false && fin.codigo === 'estadia_en_estado_final',
  'ROJO · un acto NUEVO sobre una estadía ya entregada rebota HABLANDO',
  fin.ok ? 'PASÓ' : fin.codigo);

// ── ⑩ NO-RECOGIDA, con su motivo — y NADA colgando ─────────────────────────
const nr = await marcarNoRecogida({ estadiaId: B.estadia, motivo: 'nadie_en_domicilio', ocurridoEn: PUERTA });
check(nr.ok === true && nr.data.estado === 'no_recogida' && nr.data.motivo === 'nadie_en_domicilio',
  'marcarNoRecogida deja el estado Y su motivo', nr.ok ? nr.data.motivo : nr.codigo);
/* Réplica de la cola: MISMO payload, hora nueva. Es lo que un reintento hace. */
const nrIgual = await marcarNoRecogida({
  estadiaId: B.estadia, motivo: 'nadie_en_domicilio', ocurridoEn: new Date().toISOString(),
});
check(nrIgual.ok === true && nrIgual.data.yaEstaba === true
      && nrIgual.data.ocurridoEn === nr.data.ocurridoEn,
  'el reintento de la cola no pisa la hora de la puerta',
  nrIgual.ok ? nrIgual.data.ocurridoEn : nrIgual.codigo);
/* 🔴 ENMENDADO DESPUÉS DE CORRERLO: mi primera versión reintentaba con motivo
   `otro` SIN detalle, y rebotaba `motivo_otro_exige_detalle` — el guard de
   entrada corre antes que la idempotencia, y **está bien que corra antes**: un
   payload inválido es inválido aunque el acto ya haya ocurrido. *El arnés
   estaba probando el guard del `otro`, no la idempotencia del motivo.*
   Con un motivo VÁLIDO distinto se mide lo que se quería medir. */
const nrOtro = await marcarNoRecogida({
  estadiaId: B.estadia, motivo: 'familia_cancelo_en_puerta', ocurridoEn: PUERTA,
});
check(nrOtro.ok === true && nrOtro.data.yaEstaba === true
      && nrOtro.data.motivo === 'nadie_en_domicilio',
  'un segundo toque con OTRO motivo NO reescribe por qué no estaba el animal',
  nrOtro.ok ? nrOtro.data.motivo : nrOtro.codigo);

const cer = await cerrarTramoGuarderia(tramoRecogida);
check(cer.ok === true, 'cerrarTramoGuarderia', cer.ok ? '' : cer.codigo);

// ── DESMONTAJE POR ID, y el residuo se MIDE ────────────────────────────────
dbQuery(`
  DELETE FROM guarderia_estadia_actos WHERE estadia_id IN ('${A.estadia}','${B.estadia}');
  DELETE FROM guarderia_actas         WHERE estadia_id IN ('${A.estadia}','${B.estadia}');
  UPDATE guarderia_estadias SET estado='reservada', a_bordo_en=NULL, llegada_en=NULL,
         retorno_en=NULL, entregada_en=NULL, no_recogida_en=NULL,
         no_recogida_motivo=NULL, no_recogida_detalle=NULL,
         tramo_recogida_id=NULL, tramo_devolucion_id=NULL
   WHERE id IN ('${A.estadia}','${B.estadia}');
  DELETE FROM guarderia_tramos WHERE prestador_id='${ctx.prestador}' AND fecha='${FECHA}';
  SELECT 1 AS x`);

const residuo = dbQuery(`
  SELECT (SELECT count(*) FROM guarderia_estadia_actos)                       AS actos,
         (SELECT count(*) FROM guarderia_actas)                               AS actas,
         (SELECT count(*) FROM guarderia_tramos)                              AS tramos,
         (SELECT count(*) FROM guarderia_estadias WHERE estado <> 'reservada') AS movidas,
         (SELECT count(*) FROM guarderia_estadias)                            AS total`)[0];
check(Number(residuo.actos) === 0 && Number(residuo.actas) === 0 && Number(residuo.tramos) === 0
      && Number(residuo.movidas) === 0 && Number(residuo.total) === 95,
  'RESIDUO CERO — las 95 estadías vuelven a `reservada`',
  `actos=${residuo.actos} actas=${residuo.actas} tramos=${residuo.tramos} movidas=${residuo.movidas} total=${residuo.total}`);

console.log(`\n${fallos === 0 ? '✅ E2E VERDE' : `🔴 ${fallos} FALLO(S)`}`);
process.exit(fallos === 0 ? 0 : 1);
