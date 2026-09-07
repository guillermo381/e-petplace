#!/usr/bin/env node
/**
 * verify:tipos-vivos-vs-diccionario — el assert que el canon manda desde S72.
 *
 * **Cada tipo de evento que existe en la base tiene su voz en el diccionario.**
 * El que no la tiene no falla: **cae a una voz genérica y se dibuja igual.** Por
 * eso la predicción de S72 fue *«dos "Momento de cuidado" genéricos en el
 * timeline del founder»* y por eso B vio tres hoy: *un tipo sin voz no rompe la
 * pantalla — la aplana.*
 *
 * ── CÓMO RESUELVE, Y POR QUÉ NO ALCANZA CON MIRAR EL DICCIONARIO ────────────
 * `LineaDeVida` resuelve en TRES escalones: `DICCIONARIO[tipo]` → `POR_EJE[eje]`
 * → `GENERICO`. Un gate que sólo mirara el primero marcaría en rojo la mitad del
 * expediente. Acá se replica la escalera y se clasifica cada tipo vivo:
 *
 *   · **propia**   — tiene su entrada. Se lee como lo que es.
 *   · **de eje**   — comparte voz con TODOS los de su eje. No es rojo, y es la
 *                    razón por la que tres cosas distintas se leen igual.
 *   · **genérica** — 🔴 «Momento guardado». Ni siquiera dice de qué habla.
 *   · **ausente a propósito** — `cita_servicio` no se muestra, y su comentario
 *                    lo dice. *Un silencio declarado no es un hueco.*
 *
 * 🔴 **El diccionario se LEE del componente, no se copia acá.** Un gate con la
 * tabla adentro mide su propia copia y da verde el día que la de verdad cambie.
 *
 * ── LO QUE MIDE Y LO QUE NO ─────────────────────────────────────────────────
 * Mide **los tipos que existen en `eventos_mascota`**, con su conteo: un tipo
 * declarado en un catálogo y nunca escrito no le aplana la pantalla a nadie. Y
 * declara al revés también: una entrada del diccionario **sin un solo evento**
 * es una voz que nadie va a oír.
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE.
 *
 *   node scripts/verify-tipos-vivos-vs-diccionario.mjs --control
 *   node scripts/verify-tipos-vivos-vs-diccionario.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { exigirArgumentos } from './lib-argumentos.mjs';

const ESTE = fileURLToPath(import.meta.url) === process.argv[1];
if (ESTE) exigirArgumentos(['--control'], 0);

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PIEZA = process.env.TIPOS_PIEZA ?? 'packages/ui/src/components/LineaDeVida.tsx';
const di = (s) => console.log(s);

export function sql(q) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', cwd: RAIZ, maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return null;
  try { const j = JSON.parse(r.stdout.slice(i)); return j?.error ? null : (j.rows ?? null); } catch { return null; }
}

/**
 * Lee la escalera del componente. **Por bloque y no por línea suelta**: los tres
 * mapas usan la misma forma `clave: { clave: '…', capa: '…' }`, así que un grep
 * plano los mezcla y no puede decir cuál es cuál.
 */
export function leerEscalera(fuente) {
  const bloque = (nombre) => {
    const i = fuente.indexOf(`const ${nombre}`);
    if (i === -1) return null;
    /* 🔴 **La llave del OBJETO, no la del TIPO.** Mi primera versión buscaba el
       primer `{` después del nombre — y la declaración real es
       `const DICCIONARIO: Record<string, { clave: …; capa: … }> = {`, así que
       agarraba la llave de la ANOTACIÓN y el conteo cerraba en `}>`. Devolvía
       vacío. *Mi fixture usaba `Record<string, V>`, sin llaves: **el control era
       más fácil que el objeto**, que es el mismo defecto que le señalé a otra
       pista esta misma sesión.* El gate salió NO CONCLUYENTE en vez de verde —
       eso sí funcionó. */
    const eq = fuente.indexOf('= {', i);
    if (eq === -1) return null;
    const a = eq + 2;
    let n = 0;
    for (let k = a; k < fuente.length; k += 1) {
      if (fuente[k] === '{') n += 1;
      else if (fuente[k] === '}') { n -= 1; if (n === 0) return fuente.slice(a, k + 1); }
    }
    return null;
  };
  const clavesDe = (txt) => txt === null ? []
    /* Sólo las de PRIMER nivel: `{ clave: …, capa: … }` también son claves y
       colarlas inventaría tipos que no existen. Se pide el `: {` que las
       distingue. */
    : [...txt.matchAll(/^\s{2}([a-z_][a-z0-9_]*)\s*:\s*\{/gim)].map((m) => m[1]);
  const dic = bloque('DICCIONARIO');
  return {
    diccionario: clavesDe(dic),
    porEje: clavesDe(bloque('POR_EJE')),
    hayGenerico: /const\s+GENERICO/.test(fuente),
    /* Un tipo que el componente decide NO mostrar, y lo dice: se lee del
       comentario que lo declara, no de una lista mía. */
    ausentesAProposito: [...String(dic ?? '').matchAll(/([a-z_]+):\s*intencionalmente AUSENTE/gi)].map((m) => m[1]),
    /* Casos con voz propia armada a mano (la vacuna usa su nombre). */
    especiales: /vacuna_nombre/.test(fuente) ? ['vacuna_aplicada'] : [],
  };
}

/** Clasifica un tipo vivo contra la escalera. El orden ES el del componente. */
export function clasificar(tipo, eje, esc) {
  if (esc.ausentesAProposito.includes(tipo)) return 'ausente a propósito';
  if (esc.diccionario.includes(tipo)) return 'propia';
  if (esc.especiales.includes(tipo)) return 'propia';
  if (eje !== null && esc.porEje.includes(eje)) return 'de eje';
  return 'genérica';
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (ESTE && process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et) => { di(`${b ? '✅' : '🔴'} ${et}`); if (!b) fallos += 1; };

  const FUENTE = `
type X = 1
const DICCIONARIO: Record<string, { clave: VozTimeline; capa: CapaNodo }> = {
  atencion_paseo_registrada: { clave: 'lineaDeVida.vozPaseo', capa: 'cuidado' },
  historia_clinica_registrada: { clave: 'lineaDeVida.vozHistoriaClinica', capa: 'cuidado' },
  // cita_servicio: intencionalmente AUSENTE — no se muestra (ver header).
}
const POR_EJE: Record<string, { clave: VozTimeline; capa: CapaNodo }> = {
  salud: { clave: 'lineaDeVida.vozMomentoCuidado', capa: 'cuidado' },
}
const GENERICO = { clave: 'lineaDeVida.vozMomentoGuardado', capa: 'identidad' }
const t = item.vacuna_nombre
`;
  const E = leerEscalera(FUENTE);

  // POSITIVO primero: el caso que este gate existe para encontrar.
  ok(clasificar('hito_narrativo', 'identidad', E) === 'genérica',
    'POSITIVO un tipo sin entrada y con un eje sin voz cae al GENÉRICO y se nombra');
  ok(clasificar('atencion_paseo_registrada', 'cuidado_externo', E) === 'propia',
    'NEGATIVO un tipo con su entrada NO es hallazgo');
  ok(clasificar('peso_medicion', 'salud', E) === 'de eje',
    'CLASE    un tipo sin entrada pero con eje que tiene voz es «de eje», no genérico');
  ok(clasificar('cita_servicio', 'salud', E) === 'ausente a propósito',
    'CLASE    un tipo que el componente DECLARA que no muestra no es un hueco');
  ok(clasificar('vacuna_aplicada', 'salud', E) === 'propia',
    'CLASE    la vacuna arma su voz con su nombre: tiene voz aunque no esté en la tabla');

  ok(E.diccionario.length === 2 && E.diccionario.includes('historia_clinica_registrada'),
    'POSITIVO la tabla se lee del componente — 2 entradas, no las que yo escriba');
  ok(!E.diccionario.includes('clave') && !E.diccionario.includes('capa'),
    'CLASE    `clave` y `capa` son campos internos y NO se cuelan como tipos');
  ok(E.porEje.length === 1 && E.porEje[0] === 'salud' && E.hayGenerico,
    'CLASE    los tres escalones se distinguen entre sí, no se mezclan');
  ok(leerEscalera('nada de nada').diccionario.length === 0,
    'NEGATIVO una fuente sin la tabla devuelve vacío, no inventa entradas');
  ok(leerEscalera('const DICCIONARIO = {\n  x: { clave: 1 },\n}').diccionario.length === 1,
    'CLASE    también lee una declaración SIN anotación de tipo');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo — el gate NO mide.`); process.exit(1); }
  di('✅ el gate mide: lee la escalera del componente y separa los cuatro destinos.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
if (ESTE) {
  const abs = join(RAIZ, PIEZA);
  if (!existsSync(abs)) { di(`⚠️ NO CONCLUYENTE — no encuentro \`${PIEZA}\`.`); process.exit(2); }
  const esc = leerEscalera(readFileSync(abs, 'utf8'));
  if (esc.diccionario.length === 0 || !esc.hayGenerico) {
    di(`⚠️ NO CONCLUYENTE — no pude leer la escalera de \`${PIEZA}\`.`);
    di('   O el componente cambió de forma, o mi lector quedó viejo. NO es verde:');
    di('   con la tabla vacía todos los tipos saldrían genéricos y el rojo sería mío.');
    process.exit(2);
  }

  const filas = sql(`select e.tipo, coalesce(e.eje_jtbd, '') as eje, count(*) as n
                     from eventos_mascota e
                     where not coalesce(e.soft_delete, false)
                     group by e.tipo, e.eje_jtbd order by count(*) desc`);
  if (filas === null) { di('⚠️ NO CONCLUYENTE — no pude leer `eventos_mascota`.'); process.exit(2); }
  if (filas.length === 0) {
    di('⚠️ NO CONCLUYENTE — cero eventos en la base: con nada escrito, ningún tipo se');
    di('   puede quedar sin voz. Eso dice «no hay», no «está bien».');
    process.exit(2);
  }

  di(`verify:tipos-vivos-vs-diccionario · \`${PIEZA}\``);
  di(`   escalera: ${esc.diccionario.length} voz(ces) propia(s) · ${esc.porEje.length} por eje · genérico ✓` +
     ` · ${esc.ausentesAProposito.length} ausente(s) a propósito`);

  const grupos = { propia: [], 'de eje': [], genérica: [], 'ausente a propósito': [] };
  for (const f of filas) {
    grupos[clasificar(f.tipo, f.eje === '' ? null : f.eje, esc)].push(f);
  }
  const suma = (g) => g.reduce((a, x) => a + Number(x.n), 0);
  const total = suma(filas);
  di(`   ${filas.length} tipo(s) vivo(s) · ${total} evento(s)`);
  for (const k of ['propia', 'de eje', 'ausente a propósito']) {
    di(`   ${k.padEnd(22)} ${String(grupos[k].length).padStart(2)} tipo(s) · ${String(suma(grupos[k])).padStart(4)} evento(s)`);
  }

  /* Una entrada del diccionario que ningún evento usa: no es rojo —puede estar
     esperando su primer caso— pero se dice, porque una voz que nadie oye es
     indistinguible de una voz que sobra. */
  const vivos = new Set(filas.map((f) => f.tipo));
  const mudas = esc.diccionario.filter((d) => !vivos.has(d));
  if (mudas.length) di(`   ⚠️ ${mudas.length} voz(ces) del diccionario sin un solo evento: ${mudas.join(' · ')}`);

  if (grupos['de eje'].length) {
    di(`\n⚠️ COMPARTEN VOZ CON TODO SU EJE (${grupos['de eje'].length} tipo(s) · ${suma(grupos['de eje'])} evento(s)) — no es rojo, y es`);
    di('   por qué cosas distintas se leen igual en el timeline:');
    for (const f of grupos['de eje']) di(`   ${f.tipo.padEnd(38)} ${String(f.n).padStart(4)}  (eje ${f.eje})`);
  }

  if (grupos.genérica.length) {
    const n = suma(grupos.genérica);
    di(`\n🔴 SIN VOZ — caen al genérico (${grupos.genérica.length} tipo(s) · ${n} evento(s), ${Math.round(100 * n / total)} % del expediente):`);
    for (const f of grupos.genérica) di(`   ${f.tipo.padEnd(38)} ${String(f.n).padStart(4)}  (eje ${f.eje || '—'})`);
    di('\n   Ninguno rompe nada: se dibujan con una voz que no dice de qué hablan.');
    di('   *Un tipo sin voz no falla la pantalla — la aplana.*');
    process.exit(1);
  }
  di('\n✅ VERDE · todo tipo vivo tiene voz propia o la de su eje.');
}
