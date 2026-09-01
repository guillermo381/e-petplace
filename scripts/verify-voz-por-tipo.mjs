#!/usr/bin/env node
/**
 * verify-voz-por-tipo.mjs — UN TIPO DE SERVICIO NO PUEDE EXISTIR SIN SU VOZ NI SU GLIFO
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ EXISTE, Y ES LO QUE HAY QUE LEER ANTES DEL CÓDIGO
 *
 * Dos veces la misma falla, con dos años de distancia entre sí:
 * `telemedicina` primero y `guarderia_dia` después entraron al producto **sin
 * su clave en `KEY_VOZ_SERVICIO`**, y su cita apareció en la lista de la
 * familia **sin decir qué era**. `vozServicio()` cae a `nombreDb`, el lector de
 * citas por mascota no lo pasa, y devuelve `null`.
 *
 * > **El defecto se ve como «falta un dato», no como «falta una traducción».**
 *
 * Y lo que lo vuelve un mecanismo y no otra lápida: **la lápida ya estaba
 * escrita**. El propio `voz-servicio.ts` documentaba el caso de `telemedicina`
 * — y el mapa siguió cerrado igual. *Lo que faltaba no era disciplina.*
 *
 * ── EL UNIVERSO SALE DEL DATO, NO DE UNA LISTA ───────────────────────────
 * No se pregunta «¿qué tipos son reservables?» —eso incluye `registro_evento`
 * (mostrador) y `servicio_exequial`, que **una familia no reserva**— sino
 * **«¿qué tipos ve YA una familia en sus citas?»**: todo `tipo_servicio` con al
 * menos una cita de una mascota con familia. *Un universo por dato se actualiza
 * solo; uno por lista hay que acordarse de mantenerlo, que es justo lo que
 * falló.*
 *
 * ── 🔴 PARSEA EL OBJETO, NO GREPEA EL ARCHIVO ────────────────────────────
 * El primer conteo a mano de S109-D dio **5 faltantes y eran 3**: un
 * `grep '^  [a-z_]+:'` tomó **los parámetros de la firma de la función**
 * (`codigo`, `t`) como claves del mapa. *Un gate que cuenta mal no es flojo:
 * acusa tipos que sí están y absuelve a los que faltan.*
 *
 * ── Y TRAE SU CONTROL POSITIVO ───────────────────────────────────────────
 * Tres veces en S109 un instrumento midió otra cosa —un `grep` sin `-a` sobre
 * un bundle de Hermes, un censo por import, y el conteo de arriba— y **las tres
 * se cazaron con un control cuyo resultado ya se conocía**. Acá el control es
 * parte del gate: si el parser no encuentra claves que SABEMOS que están, el
 * gate sale **NO CONCLUYENTE** y jamás verde. *Un instrumento que no puede dar
 * «sí» no está midiendo.*
 */

import { readFileSync } from 'node:fs';
import { dbQuery } from './lib-db.mjs';

const VOZ = 'apps/cliente/src/lib/voz-servicio.ts';
const GLIFO = 'apps/cliente/src/app/citas/[mascotaId].tsx';

/**
 * Baseline SOLO-BAJA. **Nace en 3, MEDIDO y no deseado.**
 *
 * Lo estimé en 1 mirando sólo la voz; **el gate encontró que el GLIFO tiene más
 * deuda que la voz** — `consulta_general` y `vacunacion` tampoco lo tienen. *Un
 * baseline que sale del instrumento y no de la expectativa es la mitad del
 * valor de tenerlo.*
 *
 * Los tres de hoy: `consulta_especializada` (voz + glifo) · `consulta_general`
 * (glifo) · `vacunacion` (glifo). **Ninguno se curó acá: no está firmado**, y un
 * gate no autoriza a tocar lo que encuentra.
 *
 * ✅ Su discriminador está corrido: con el estado **pre-cura** de esta sesión da
 * **4** y con `guarderia_dia` adentro da **3**. Mide el movimiento que le
 * importa.
 */
const BASELINE = 3;

/**
 * Exenciones — **con su razón, y la razón es letra firmada, no comodidad.**
 * Un tipo exento no es un tipo perdonado: es uno cuya ausencia se decidió.
 */
const EXENTOS = {
  procedimiento:
    'DISEÑO_EXPERIENCIA §10ter (D-474): la asimetría del fallback está FIRMADA — ' +
    'el vet lee «Procedimiento» y el dueño OMITE. Su ausencia del mapa es la decisión.',
};

// ── el parser: recorta el objeto y limpia comentarios ──────────────────────
function clavesDelMapa(src) {
  const m = src.match(/const KEY_VOZ_SERVICIO = \{([\s\S]*?)\n\} as const;/);
  if (m === null) return null; // el parser no reconoció el archivo
  const cuerpo = m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
  return new Set([...cuerpo.matchAll(/^\s*([a-z_0-9]+)\s*:/gm)].map((x) => x[1]));
}

/** Los prefijos y literales que `iconoOficio` reconoce. */
function patronesDelGlifo(src) {
  const m = src.match(/function iconoOficio\(([\s\S]*?)\n\}/);
  if (m === null) return null;
  const cuerpo = m[1];
  return {
    prefijos: [...cuerpo.matchAll(/startsWith\('([a-z_]+)'\)/g)].map((x) => x[1]),
    exactos: [...cuerpo.matchAll(/tipo === '([a-z_]+)'/g)].map((x) => x[1]),
    // `esTeleconsulta(...)` resuelve la familia de telemedicina fuera de acá.
    delega: /esTeleconsulta\(/.test(cuerpo),
  };
}

const srcVoz = readFileSync(VOZ, 'utf8');
const srcGlifo = readFileSync(GLIFO, 'utf8');
const claves = clavesDelMapa(srcVoz);
const glifo = patronesDelGlifo(srcGlifo);

// ══ CONTROL POSITIVO — antes de creerle una sola palabra al parser ═════════
const TESTIGOS_VOZ = ['paseo', 'telemedicina', 'vacunacion'];
const TESTIGOS_GLIFO = ['paseo', 'grooming'];

if (claves === null || glifo === null) {
  console.error('NO CONCLUYENTE — el parser no reconoció el archivo (¿cambió su forma?)');
  process.exit(2);
}
const faltanTestigos = TESTIGOS_VOZ.filter((k) => !claves.has(k));
const faltanGlifos = TESTIGOS_GLIFO.filter((p) => !glifo.prefijos.includes(p) && !glifo.exactos.includes(p));
if (faltanTestigos.length > 0 || faltanGlifos.length > 0) {
  console.error('NO CONCLUYENTE — el control positivo falló: el parser no ve lo que SÍ está.');
  console.error(`  voz sin ver: ${faltanTestigos.join(', ') || '—'} · glifo sin ver: ${faltanGlifos.join(', ') || '—'}`);
  console.error('  ⇒ el gate NO puede dar verde: no está midiendo.');
  process.exit(2);
}

// ══ EL UNIVERSO, del dato ══════════════════════════════════════════════════
/* 🔴 SIN BASE NO HAY VEREDICTO — y eso es NO CONCLUYENTE, jamás verde.
   El universo sale del dato, así que un worktree sin `supabase link` no puede
   contestar la pregunta. *Un gate que no puede medir y sale verde es peor que
   no tenerlo: dice que miró.* (Mismo criterio que `verify-edge-deno`.) */
let universo;
try {
  const filas = await dbQuery(`
    select distinct c.tipo_servicio as tipo
    from evento_cita_servicio c
    join mascotas m on m.id = c.mascota_id
    where m.familia_id is not null and c.tipo_servicio is not null
    order by 1;
  `);
  universo = filas.map((f) => f.tipo);
} catch (e) {
  console.error('NO CONCLUYENTE — no se pudo consultar la base (¿worktree sin `supabase link`?).');
  console.error(`  ${String(e).split('\n')[0]}`);
  console.error('  ⇒ el universo sale del DATO: sin base no hay veredicto, y el silencio no es verde.');
  process.exit(2);
}

const tieneGlifo = (t) =>
  glifo.prefijos.some((p) => t.startsWith(p)) || glifo.exactos.includes(t) || (glifo.delega && t.includes('telemedicina'));

const sinVoz = universo.filter((t) => !claves.has(t) && EXENTOS[t] === undefined);
const sinGlifo = universo.filter((t) => !tieneGlifo(t) && EXENTOS[t] === undefined);
const exentosVistos = universo.filter((t) => EXENTOS[t] !== undefined);

console.log(`verify:voz-por-tipo — universo ${universo.length} tipos (los que una familia YA ve)`);
console.log(`  control positivo: OK (${TESTIGOS_VOZ.length} voces y ${TESTIGOS_GLIFO.length} glifos testigo encontrados)`);
for (const t of exentosVistos) console.log(`  ⏸  ${t} — EXENTO: ${EXENTOS[t]}`);

const total = new Set([...sinVoz, ...sinGlifo]).size;
for (const t of sinVoz) console.log(`  🔴 ${t} — sin VOZ en KEY_VOZ_SERVICIO (su cita se lista MUDA)`);
for (const t of sinGlifo) console.log(`  🔴 ${t} — sin GLIFO en iconoOficio (su fila se pinta sin marca)`);

if (total > BASELINE) {
  console.error(`\n❌ ROJO — ${total} tipo(s) sin voz/glifo, baseline ${BASELINE}. El baseline SOLO BAJA.`);
  process.exit(1);
}
console.log(`\n${total === 0 ? '✅ VERDE — todo tipo que la familia ve tiene voz y glifo' : `✅ VERDE — ${total} de ${BASELINE} (baseline, solo baja)`}`);
