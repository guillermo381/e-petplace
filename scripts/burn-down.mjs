#!/usr/bin/env node
/**
 * burn-down — LA MÉTRICA DE SESIÓN DE LA REGLA 81, HECHA COMANDO.
 *
 * PAGA D-630. Su ficha lo dice literal: *"NO se cuenta a mano — nace como
 * SCRIPT"*. Un conteo manual de 54 pantallas × 2 ejes compite cada sesión
 * contra construir y pierde siempre; un comando, no.
 *
 * QUÉ MIDE — los DOS EJES de la enmienda S81 de la regla 81, que NO se suman:
 *
 *   · COMPOSICIÓN — la pantalla rediseñada con vara y gate (regla 80), que se
 *     mueve de a una. Se mide por CONSUMO REAL de las piezas del patrón nuevo,
 *     agrupado por las NUEVE FAMILIAS de `2026-07-31-s83-mapa-de-familias-prestador.md`.
 *
 *   · MECÁNICA — las leyes aplicadas por barrido. ⚠️ SE MIDE AL REVÉS que la
 *     composición, y la razón es una MEDICIÓN, no una preferencia: los barridos
 *     mecánicos de S81/S82 se implementaron como CAMBIOS DE DEFAULT en
 *     `packages/ui` (`Tarjeta.elevacion` 'plana'→'reposo'; `Campo.sinCaja`
 *     nace `true`). Una pantalla los adopta SIN TOCAR UNA LÍNEA — así que
 *     "cuántas lo tienen" daría 58/58 sin que nadie haya hecho nada.
 *     ⇒ el eje mecánico cuenta DEUDA PENDIENTE: pantallas con al menos una
 *     marca de atraso. Baja cuando alguien cura, no cuando B cambia un default.
 *
 * QUÉ **NO** MIDE — y se dice acá para que nadie lo lea de más:
 *   · NO mide CALIDAD. Mide ANATOMÍA y CONSUMO (la misma limitación que su
 *     fuente declara: "que 12 pantallas sean de la misma familia no dice que
 *     las 12 estén bien ni mal").
 *   · NO reemplaza el gate del founder. Ninguna pantalla se declara firmada acá.
 *   · Cubre SOLO `apps/prestador`. El eje del cliente (48 pantallas del
 *     inventario C3) queda declarado como hueco, no completado.
 *
 * L-192 (una verificación cuyo modo de falla es el SILENCIO no es una
 * verificación) se mecaniza en DOS capas, del molde de `verify-diseno.mjs`:
 *   ① AUTO-PRUEBA: cada detector corre contra un fixture sintético que TIENE
 *      que hacerlo disparar. Si no puede salir positivo, es decorativo.
 *   ② ANCLA: cada eje declara el mínimo de corpus que necesita para que su
 *      silencio signifique algo. Sin ese mínimo → ROJO.
 *
 * DERIVA: el mapa de familias es de S83 y la app se mueve. El script NO la
 * silencia — reporta las pantallas SIN FAMILIA (nacidas después) y las
 * DESAPARECIDAS (en el mapa, ya no en el árbol). *Un mapa que envejece en
 * silencio es peor que no tener mapa.*
 *
 * EXIT: 0 si el instrumento es válido (haya deuda o no). ≠0 SOLO si el
 * instrumento se rompió (ancla rota o auto-prueba muda) — la medición no es
 * un gate, pero un instrumento roto sí lo es. El exit se lee del COMANDO,
 * jamás del pipe (L-191).
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAIZ = 'apps/prestador/src/app';

// ─────────────────────────────────────────────────────────────────────────
// EL CORPUS — el mismo criterio literal que usó el mapa de familias S83-A15:
// `find apps/prestador/src/app -name "*.tsx" ! -name "_layout.tsx"`.
// Se conserva idéntico A PROPÓSITO: si cambiara, los números dejarían de ser
// comparables contra la línea base, y el burn-down mediría otra cosa con el
// mismo nombre.
// ─────────────────────────────────────────────────────────────────────────
function pantallas(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...pantallas(p));
    else if (p.endsWith('.tsx') && !p.endsWith('_layout.tsx')) out.push(p);
  }
  return out;
}

/** L-170 mecanizada: un censo NO lee comentarios como código. */
const sinComentarios = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// ─────────────────────────────────────────────────────────────────────────
// LAS NUEVE FAMILIAS — datos, no heurística.
//
// POR QUÉ HARDCODEADAS Y NO RE-DERIVADAS: el mapa S83-A15 clasificó por SEÑAL
// ESTRUCTURAL medida archivo por archivo, y sus propias fronteras están
// declaradas como discutibles (F5 admite tres candidatas a familia propia).
// Re-derivar la heurística acá produciría una clasificación PARECIDA Y
// DISTINTA, y el burn-down dejaría de ser comparable entre sesiones sin que
// nadie lo note. La adjudicación de familia es de la mesa; este script la
// TRANSCRIBE y avisa cuando envejece.
//
// Rutas relativas a RAIZ, sin extensión.
// ─────────────────────────────────────────────────────────────────────────
const FAMILIAS = [
  {
    id: 'F1',
    nombre: 'EL TALLER (configurar el oficio)',
    pantallas: [
      'paseo/taller',
      'grooming/taller',
      'adiestramiento/taller',
      'veterinaria/taller',
      'veterinaria/procedimientos',
    ],
  },
  {
    id: 'F2',
    nombre: 'PORTADA DE OFICIO',
    pantallas: [
      'paseo/index',
      'grooming/index',
      'adiestramiento/index',
      'veterinaria/index',
    ],
  },
  {
    id: 'F3',
    nombre: 'EL CICLO DE LA ATENCIÓN (antes · durante · cierre)',
    pantallas: [
      // Antes (5)
      'cita/[citaId]/index',
      'adiestramiento/cita/[citaId]/index',
      'grooming/cita/[citaId]/index',
      'veterinaria/cita/[citaId]',
      'adiestramiento/antes/[mascotaId]',
      // Durante (4)
      'cita/[citaId]/durante',
      'adiestramiento/cita/[citaId]/durante',
      'grooming/cita/[citaId]/durante',
      'veterinaria/consulta/[citaId]',
      // Cierre (3)
      'cita/[citaId]/cierre',
      'adiestramiento/cita/[citaId]/cierre',
      'grooming/cita/[citaId]/cierre',
      // + S85 (adjudicación de mesa): el mostrador de campo entra al ciclo.
      'veterinaria/mostrador/atencion',
    ],
  },
  {
    id: 'F4',
    nombre: 'LISTA CON EJES',
    pantallas: [
      '(tabs)/index',
      'negocio/equipo',
      'adiestramiento/clips',
      'liquidaciones',
      'vacaciones',
      'veterinaria/mostrador/index',
      'grooming/dia',
      '(tabs)/mascotas',
      'veterinaria/movimiento',
    ],
  },
  {
    id: 'F5',
    nombre: 'CAPTURA (formulario)',
    pantallas: [
      '(tabs)/cuenta/perfil',
      // '(tabs)/cuenta/perfil-v2' — BORRADA DEL CENSO (adjudicación de mesa,
      // S85). Desapareció del árbol en S83-C30 ②, cuando la pantalla nueva
      // reemplazó a la vieja y la vieja murió (Ley 37). No es una pantalla
      // que falta: es una que dejó de existir a propósito. *Se deja el
      // renglón comentado en vez de borrarlo limpio para que el próximo que
      // compare este mapa contra el de S83 no la busque.*
      'veterinaria/mostrador/nueva',
      'cuenta-comercial/nueva',
      'cuenta-comercial/bancarios',
      'registro',
      'veterinaria/presupuesto/nuevo',
      'login',
      'veterinaria/verificacion',
      'veterinaria/coordinar/[citaId]',
      'veterinaria/mostrador/autorizar',
      '(tabs)/cuenta/preferencias',
    ],
  },
  {
    id: 'F6',
    nombre: 'MENÚ DE NAVEGACIÓN',
    pantallas: ['(tabs)/negocio', '(tabs)/cuenta/index', 'cuenta-comercial/index'],
  },
  {
    id: 'F7',
    nombre: 'PUERTA / MOMENTO',
    pantallas: ['bienvenida-dia1', 'sala-espera', 'invitacion', 'solicitar-acceso'],
  },
  {
    id: 'F8',
    nombre: 'ESTADO VACÍO PURO (peldaño 0)',
    pantallas: [
      'negocio/casos-heredados',
      'negocio/estadisticas',
      'negocio/resenas',
      '(tabs)/gallery',
    ],
  },
  {
    id: 'F9',
    nombre: 'FICHA DE ENTIDAD',
    pantallas: ['mascota/[mascotaId]'],
  },
  {
    id: 'F10',
    nombre: 'CUENTA (el lote de S85)',
    // ADJUDICACIÓN DE MESA, S85. Las cuatro nacieron después del mapa de S83
    // y las cuatro las toca el mismo lote.
    //
    // ⚠️ AGRUPADA POR LOTE, NO POR SEÑAL ESTRUCTURAL — y se declara, porque
    // es la excepción al criterio del mapa y no una lectura suya. Las cuatro
    // son anatómicamente distintas: `como-te-ven` es un espejo de vitrina,
    // `identidad` y `seguridad` son captura (F5 pura), `recuperar` es una
    // puerta (F7 pura). *Si se clasificaran por anatomía se repartirían en
    // tres familias y ninguna decisión de composición las alcanzaría juntas
    // — que es justo lo contrario de para qué existe el mapa.*
    //
    // Tiene precedente dentro del propio mapa: F8 agrupa por MADUREZ y su
    // autor lo declaró en vez de esconderlo (*"están juntas por madurez, no
    // por familia de uso"*). Ésta agrupa por LOTE, con la misma honestidad.
    //
    // ☠️ CONDICIÓN DE DISOLUCIÓN: cuando el lote de Cuenta cierre y sus
    // pantallas tengan arquetipo firmado, **F10 se reparte** en F5/F7/F2 por
    // anatomía. *Una familia que existe por el trabajo en curso tiene que
    // morir cuando el trabajo termina, o el mapa deja de medir anatomía y
    // pasa a medir el backlog.*
    pantallas: [
      '(tabs)/cuenta/como-te-ven',
      '(tabs)/cuenta/identidad',
      '(tabs)/cuenta/seguridad',
      'recuperar',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// EJE COMPOSICIÓN — las señales del patrón nuevo.
//
// DOS LOTES, y la partición NO es cosmética: si las piezas de S84 se mezclaran
// con las de S83, el número SUBIRÍA sin que ninguna pantalla se haya
// rediseñado — solo porque el catálogo creció. El lote BASE mantiene la
// comparabilidad contra la línea base 7/54 (S83-A15); el lote EXTENSIÓN se
// reporta al lado y se suma solo cuando la mesa decida re-basar.
// ─────────────────────────────────────────────────────────────────────────
const SENALES_BASE = [
  { nombre: 'Entrada', origen: 'S81-B (promovida a ui)', re: /<Entrada[\s/>]/ },
  { nombre: 'TarjetaEstado', origen: 'S78-B', re: /<TarjetaEstado[\s/>]/ },
  { nombre: 'FilaCita', origen: 'S80-B (1er componente de dominio)', re: /<FilaCita[\s/>]/ },
  { nombre: 'SelectorSegmentado', origen: 'S58', re: /<SelectorSegmentado[\s/>]/ },
  { nombre: 'PieReserva', origen: 'S82-B', re: /<PieReserva[\s/>]/ },
  { nombre: 'MarcaEleccion', origen: 'S82-B (la pata)', re: /<MarcaEleccion[\s/>]/ },
  { nombre: 'CantoMarca', origen: 'S81-B', re: /<CantoMarca[\s/>]/ },
];

const SENALES_EXTENSION = [
  { nombre: 'FichaPrestador', origen: 'S83-B / S84 (la vitrina)', re: /<FichaPrestador[\s/>]/ },
  { nombre: 'MapaZona', origen: 'S84-B (la zona aproximada)', re: /<MapaZona[\s/>]/ },
  { nombre: 'Atmosfera', origen: 'S83-B16 (la luz)', re: /<Atmosfera[\s/>]/ },
  { nombre: 'Boton variante="acento"', origen: 'S84-B', re: /variante=["']acento["']/ },
  { nombre: 'superficie="muro"', origen: 'S84-B', re: /superficie=["']muro["']/ },
];

// ⚠️ LAS QUE **NO** SON SEÑAL, y por qué — el hallazgo que le da forma al eje
// mecánico. Se escriben acá para que nadie las agregue "porque faltan":
//   · `Tarjeta elevacion="reposo"` — es el DEFAULT desde S81. Greparla mide
//     quién lo escribió de más, no quién lo adoptó.
//   · `Campo sinCaja` — nace `true`. Mismo caso.
//   · `Texto` / `FilaDato` / `PieRevelar` — S71, anteriores a la línea base;
//     ya viven en 51 de 58 pantallas. Contarlas daría 88% de "migradas" el día
//     que el mapa midió 13%.

// ─────────────────────────────────────────────────────────────────────────
// EJE MECÁNICA — las marcas de ATRASO. Cada una con su ley y su ficha.
// ─────────────────────────────────────────────────────────────────────────
const MARCAS_MECANICAS = [
  {
    id: 'M1',
    nombre: 'alias deprecado de elevación (sm/md)',
    ley: 'Ley 20 / D-358 (S58) — sm→reposo, md→elevada; "no usar en código nuevo"',
    detecta: (src) => /elevacion=(?:["'](?:sm|md)["']|\{\s*['"](?:sm|md)['"]\s*\})/.test(src),
  },
  {
    id: 'M2',
    nombre: 'Campo sin EvitaTeclado',
    ley: 'D-498 / §15b la regla del teclado — letra founder: "que eso no pase en NINGÚN campo"',
    detecta: (src) => /<Campo[\s/>]/.test(src) && !/EvitaTeclado/.test(src),
  },
  {
    id: 'M3',
    nombre: 'hex crudo en la app',
    ley: 'Ley 1 — el color sale del tema, jamás de un literal (R2 del lint, ratchet)',
    detecta: (src) => /#[0-9a-fA-F]{6}\b/.test(src),
  },
  {
    id: 'M4',
    nombre: 'sombra artesanal',
    ley: 'Ley 20 — la elevación es token, no shadowOffset a mano (R4 del lint)',
    detecta: (src) => /shadowOffset|shadowRadius|shadowOpacity/.test(src),
  },
];

// ─────────────────────────────────────────────────────────────────────────
// ① AUTO-PRUEBA (L-192) — cada detector contra su fixture de violación.
//    Un detector que no puede salir POSITIVO es decorativo, y un burn-down
//    decorativo es peor que ninguno: da un número que nadie va a re-medir.
// ─────────────────────────────────────────────────────────────────────────
const FIXTURES_SENAL = {
  Entrada: '<Entrada titulo="x" />',
  TarjetaEstado: '<TarjetaEstado estado="ok" />',
  FilaCita: '<FilaCita cita={c} />',
  SelectorSegmentado: '<SelectorSegmentado opciones={o} />',
  PieReserva: '<PieReserva total={1} />',
  MarcaEleccion: '<MarcaEleccion />',
  CantoMarca: '<CantoMarca categoria="salud" />',
  FichaPrestador: '<FichaPrestador p={p} />',
  MapaZona: '<MapaZona zona={z} />',
  Atmosfera: '<Atmosfera>{x}</Atmosfera>',
  'Boton variante="acento"': '<Boton variante="acento" />',
  'superficie="muro"': '<Boton superficie="muro" />',
};

const FIXTURES_MECANICA = {
  M1: '<Tarjeta elevacion="sm">x</Tarjeta>',
  M2: '<Campo valor={v} onChange={f} />',
  M3: 'const c = "#FCBC1D"',
  M4: 'const s = { shadowOpacity: 0.2 }',
};

function autoPrueba() {
  const mudos = [];
  for (const s of [...SENALES_BASE, ...SENALES_EXTENSION]) {
    const fx = FIXTURES_SENAL[s.nombre];
    if (fx === undefined) {
      mudos.push(`señal "${s.nombre}": SIN FIXTURE — escapó de la auto-prueba en silencio.`);
      continue;
    }
    if (!s.re.test(fx)) mudos.push(`señal "${s.nombre}": su fixture NO la dispara — detector decorativo.`);
  }
  for (const m of MARCAS_MECANICAS) {
    const fx = FIXTURES_MECANICA[m.id];
    if (fx === undefined) {
      mudos.push(`marca ${m.id}: SIN FIXTURE — escapó de la auto-prueba en silencio.`);
      continue;
    }
    if (!m.detecta(fx)) mudos.push(`marca ${m.id} ("${m.nombre}"): su fixture NO la dispara — detector decorativo.`);
  }
  // Contra-caso: un archivo limpio no puede disparar NADA. Un detector que
  // siempre dice sí mide igual de mal que uno que siempre dice no.
  const limpio = 'export default function P() { return <View /> }';
  for (const s of [...SENALES_BASE, ...SENALES_EXTENSION]) {
    if (s.re.test(limpio)) mudos.push(`señal "${s.nombre}": dispara sobre un archivo LIMPIO — falso positivo constante.`);
  }
  for (const m of MARCAS_MECANICAS) {
    if (m.detecta(limpio)) mudos.push(`marca ${m.id}: dispara sobre un archivo LIMPIO — falso positivo constante.`);
  }
  return mudos;
}

// ─────────────────────────────────────────────────────────────────────────
// ② ANCLA (L-192, tercera capa) — el mínimo de corpus sin el cual el silencio
//    de este script no significa "no hay", sino "no miré".
// ─────────────────────────────────────────────────────────────────────────
const ANCLA_MIN_PANTALLAS = 40; // la app midió 54 en S83; menos de 40 es árbol roto o ruta mal
const ANCLA_MIN_SENALES = 1; // si CERO pantallas montan CERO señales, el detector está roto

// ─────────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(RAIZ)) {
    console.error(`\n🔴 burn-down: no existe ${RAIZ}. Corré desde la raíz del monorepo.\n`);
    process.exit(2);
  }

  const mudos = autoPrueba();
  if (mudos.length > 0) {
    console.error('\n🔴 AUTO-PRUEBA ROTA (L-192) — el burn-down se declara DECORATIVO y no reporta número:\n');
    for (const m of mudos) console.error(`   · ${m}`);
    console.error('\nUn instrumento que no puede fallar no verifica nada. Se arregla antes de medir.\n');
    process.exit(1);
  }

  const archivos = pantallas(RAIZ).sort();
  const corpus = archivos.map((p) => ({
    ruta: relative(RAIZ, p).replace(/\.tsx$/, ''),
    src: sinComentarios(readFileSync(p, 'utf8')),
  }));

  if (corpus.length < ANCLA_MIN_PANTALLAS) {
    console.error(
      `\n🔴 ANCLA ROTA — esperaba al menos ${ANCLA_MIN_PANTALLAS} pantallas y encontró ${corpus.length}. ` +
        `El silencio de este script dejó de significar "no hay migradas" y pasó a significar "no miré" (L-192, tercera capa).\n`,
    );
    process.exit(1);
  }

  const porRuta = new Map(corpus.map((c) => [c.ruta, c]));
  const enMapa = new Set(FAMILIAS.flatMap((f) => f.pantallas));

  const senalesDe = (src, lote) => lote.filter((s) => s.re.test(src)).map((s) => s.nombre);

  // ── EJE COMPOSICIÓN, por familia ──
  const filas = [];
  let baseTotal = 0;
  let baseMigradas = 0;
  const detalle = [];

  for (const f of FAMILIAS) {
    const vivas = f.pantallas.filter((p) => porRuta.has(p));
    const migradas = vivas.filter((p) => senalesDe(porRuta.get(p).src, SENALES_BASE).length > 0);
    baseTotal += vivas.length;
    baseMigradas += migradas.length;
    filas.push({
      id: f.id,
      nombre: f.nombre,
      total: vivas.length,
      declaradas: f.pantallas.length,
      migradas: migradas.length,
    });
    for (const p of migradas) {
      detalle.push({ familia: f.id, ruta: p, piezas: senalesDe(porRuta.get(p).src, SENALES_BASE) });
    }
  }

  // ── DERIVA del mapa ──
  const sinFamilia = corpus.map((c) => c.ruta).filter((r) => !enMapa.has(r));
  const desaparecidas = [...enMapa].filter((r) => !porRuta.has(r)).sort();

  // ── EJE MECÁNICA ──
  const conDeuda = [];
  const porMarca = new Map(MARCAS_MECANICAS.map((m) => [m.id, []]));
  for (const c of corpus) {
    const marcas = MARCAS_MECANICAS.filter((m) => m.detecta(c.src));
    if (marcas.length > 0) {
      conDeuda.push({ ruta: c.ruta, marcas: marcas.map((m) => m.id) });
      for (const m of marcas) porMarca.get(m.id).push(c.ruta);
    }
  }

  // ── EXTENSIÓN S84 ──
  const conExtension = corpus
    .map((c) => ({ ruta: c.ruta, piezas: senalesDe(c.src, SENALES_EXTENSION) }))
    .filter((x) => x.piezas.length > 0);

  const totalSenales = detalle.length + conExtension.length;
  if (totalSenales < ANCLA_MIN_SENALES) {
    console.error(
      `\n🔴 ANCLA ROTA — CERO pantallas montan CERO señales del patrón nuevo. ` +
        `Eso no es un burn-down en cero: es un detector que dejó de encontrar lo que sabe que existe (L-192).\n`,
    );
    process.exit(1);
  }

  // ─────────────────────────── SALIDA ───────────────────────────
  const pct = (n, d) => (d === 0 ? '  —' : `${String(Math.round((n / d) * 100)).padStart(3)}%`);

  console.log('');
  console.log('═'.repeat(78));
  console.log('  BURN-DOWN DEL REDISEÑO · apps/prestador · regla 81 (dos ejes)');
  console.log(`  corpus: ${corpus.length} pantallas · mapa de familias: S83-A15 (${enMapa.size} declaradas)`);
  console.log('═'.repeat(78));

  console.log('\n▌ EJE COMPOSICIÓN — pantallas que montan ≥1 pieza del patrón nuevo\n');
  const ANCHO = 52;
  const col = (s) => (s.length > ANCHO ? s.slice(0, ANCHO - 1) + '…' : s.padEnd(ANCHO));
  console.log(`  #    ${'familia'.padEnd(ANCHO)} migr / vivas    %`);
  console.log('  ' + '─'.repeat(77));
  for (const f of filas) {
    const nota = f.total !== f.declaradas ? ` (mapa: ${f.declaradas})` : '';
    console.log(
      `  ${f.id.padEnd(4)} ${col(f.nombre + nota)} ${String(f.migradas).padStart(4)} / ${String(f.total).padStart(5)}   ${pct(f.migradas, f.total)}`,
    );
  }
  console.log('  ' + '─'.repeat(77));
  console.log(
    `  ${''.padEnd(4)} ${col('TOTAL (pantallas del mapa, vivas)')} ${String(baseMigradas).padStart(4)} / ${String(baseTotal).padStart(5)}   ${pct(baseMigradas, baseTotal)}`,
  );
  console.log(`\n  Línea base S83-A15: 7 / 54 (13%). Lote BASE = ${SENALES_BASE.map((s) => s.nombre).join(' · ')}`);

  if (detalle.length > 0) {
    console.log('\n  Las migradas, con su pieza:');
    for (const d of detalle) console.log(`    · [${d.familia}] ${d.ruta.padEnd(40)} ${d.piezas.join(', ')}`);
  }

  console.log('\n▌ EXTENSIÓN S84 — piezas posteriores a la línea base, REPORTADAS APARTE\n');
  console.log('  Se cuentan al lado y NO se suman al número de arriba: sumarlas subiría el');
  console.log('  burn-down sin que ninguna pantalla se haya rediseñado — solo porque el');
  console.log('  catálogo creció. Re-basar es decisión de la mesa.\n');
  if (conExtension.length === 0) {
    console.log('    (ninguna)');
  } else {
    for (const x of conExtension) console.log(`    · ${x.ruta.padEnd(40)} ${x.piezas.join(', ')}`);
  }

  console.log('\n▌ EJE MECÁNICA — DEUDA pendiente (baja cuando alguien cura)\n');
  console.log(`  ${conDeuda.length} de ${corpus.length} pantallas con ≥1 marca de atraso.\n`);
  for (const m of MARCAS_MECANICAS) {
    const rs = porMarca.get(m.id);
    console.log(`  ${m.id} · ${m.nombre} — ${rs.length}`);
    console.log(`       ${m.ley}`);
    if (rs.length > 0 && rs.length <= 12) for (const r of rs) console.log(`       · ${r}`);
    else if (rs.length > 12) console.log(`       · (${rs.length} pantallas — corré con --detalle)`);
    console.log('');
  }

  console.log('▌ DERIVA DEL MAPA — el mapa es de S83 y la app se mueve\n');
  console.log(`  SIN FAMILIA (nacidas después del mapa): ${sinFamilia.length}`);
  for (const r of sinFamilia) console.log(`    · ${r}`);
  console.log(`\n  DESAPARECIDAS (en el mapa, ya no en el árbol): ${desaparecidas.length}`);
  for (const r of desaparecidas) console.log(`    · ${r}`);
  console.log('\n  ⚠️ Las SIN FAMILIA no entran a los porcentajes de arriba: clasificarlas es');
  console.log('     adjudicación de la mesa, no del script. Mientras no se clasifiquen, el');
  console.log('     denominador del eje composición NO es la app entera — y esta línea existe');
  console.log('     para que ese hueco no se lea como cobertura.');

  console.log('\n▌ HUECOS DECLARADOS\n');
  console.log('  · apps/cliente NO se mide acá (48 pantallas del inventario C3).');
  console.log('  · El eje mecánico NO puede medir los barridos hechos por CAMBIO DE DEFAULT');
  console.log('    en packages/ui (Tarjeta.elevacion, Campo.sinCaja): una pantalla los adopta');
  console.log('    sin tocar una línea. Por eso cuenta deuda y no adopción.');
  console.log('  · Ninguna cifra de acá es una firma. El gate es del founder (regla 80).');
  console.log('');

  if (process.argv.includes('--detalle')) {
    console.log('▌ DETALLE MECÁNICO COMPLETO\n');
    for (const d of conDeuda) console.log(`  · ${d.ruta.padEnd(45)} ${d.marcas.join(' ')}`);
    console.log('');
  }

  console.log('═'.repeat(78));
  console.log(
    `  COMPOSICIÓN ${baseMigradas}/${baseTotal} (${Math.round((baseMigradas / baseTotal) * 100)}%)  ·  ` +
      `MECÁNICA ${conDeuda.length}/${corpus.length} con deuda  ·  DERIVA +${sinFamilia.length}/-${desaparecidas.length}`,
  );
  console.log('═'.repeat(78));
  console.log('');
}

main();
