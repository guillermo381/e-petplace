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

// ═════════════════════════════════════════════════════════════════════════
// M2 · EL ENSANCHE (S86-B, firma de mesa) — «doce reales contra cinco
// medidos, y salía VERDE igual».
//
// EL INSTRUMENTO MEDÍA DE MENOS POR DOS CAUSAS DISTINTAS, y hacen falta
// las dos curas: una sola dejaba el guard mintiendo con otro número.
//
//  ① EL ALCANCE — medía UNA CARPETA (`apps/prestador/src/app`) mientras la
//    letra de D-498 dice «que eso no pase en NINGÚN campo». El cliente
//    entero y los dos `src/components` eran invisibles: 5 de 10.
//
//  ② EL DETECTOR — `/<Campo[\s/>]/` **no puede ver `<SliderPrecio`**, y
//    SliderPrecio ABRE TECLADO desde la enmienda S68 (tap en el valor →
//    edición numérica con teclado decimal). Los dos talleres que lo montan
//    quedaban fuera por construcción.
//
// ⚠️ Y LA TRAMPA QUE LA MEDICIÓN EVITÓ, que es lo que vale guardar: el «12»
// de la mesa se reproduce contando `Campo` + `CampoFecha` — pero
// **`CampoFecha` NO abre teclado** (su Hoja es un selector JS puro, cero
// TextInput). Medido contra el objeto: los ÚNICOS componentes de
// `packages/ui` que montan `TextInput` son **`Campo` y `SliderPrecio`**.
// El total coincide en 12 por casualidad y la LISTA es distinta en dos
// archivos. *Un número correcto con la lista equivocada manda a curar
// pantallas sanas y deja las rotas.*
//
// ⇒ POR ESO EL SET SE DERIVA Y NO SE ESCRIBE: se lee `packages/ui` y se
//   pregunta quién monta `TextInput`. El día que nazca la tercera pieza
//   con teclado, este detector la incluye SOLO — «una lista hay que
//   mantenerla, la regla no».
// ═════════════════════════════════════════════════════════════════════════
const DIR_UI = 'packages/ui/src/components';

/** Las piezas de la casa que montan un TextInput — DERIVADAS del objeto. */
function piezasQueAbrenTeclado() {
  if (!existsSync(DIR_UI)) return [];
  return readdirSync(DIR_UI)
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('.web.tsx'))
    .filter((f) => /\bTextInput\b/.test(sinComentarios(readFileSync(join(DIR_UI, f), 'utf8'))))
    .map((f) => f.replace(/\.tsx$/, ''))
    .sort();
}

const PIEZAS_TECLADO = piezasQueAbrenTeclado();

/** `<Campo …` | `<SliderPrecio …` | el `<TextInput` crudo de la app. */
const RE_ABRE_TECLADO = new RegExp(
  `<(?:${[...PIEZAS_TECLADO, 'TextInput'].join('|')})[\\s/>]`,
);

// Las DOS raíces del ensanche. `src/components` entra al barrido a
// propósito: una pieza local puede montar su propio scroll.
const RAICES_M2 = ['apps/prestador/src', 'apps/cliente/src'];

/** EL DISCRIMINADOR, medido por C y firmado — y por qué NO es una lista de
 *  paths: los tres falsos positivos de A son archivos **con anfitriona**
 *  (un componente montado dentro de una pantalla que ya porta la pieza);
 *  los reales son archivos de **RUTA** con su propio scroll de nivel
 *  superior. La señal estructural de «soy una ruta» en expo-router es
 *  vivir bajo `src/app/` y exportar default. Una lista hay que mantenerla;
 *  esto se mantiene solo. */
const esRutaDePantalla = (path, src) =>
  /[/\\]src[/\\]app[/\\]/.test(path) && /export\s+default/.test(src);

// ⚠️⚠️ EL HUECO DE ESTE DISCRIMINADOR, MEDIDO Y DECLARADO — no está
// cubierto, y se escribe acá para que el número de abajo no se lea como
// cobertura total (que es exactamente el defecto que este ensanche vino
// a curar, un piso más arriba).
//
// EL CASO REAL, medido archivo por archivo: `perfil-piezas.tsx` monta un
// `<Campo>` y se clasifica como "componente con anfitriona" ⇒ NO se
// cuenta. Pero tiene TRES anfitrionas y solo UNA porta la pieza:
//   · `(tabs)/cuenta/perfil.tsx`      → CON EvitaTeclado   ✅ cubierta
//   · `cuenta-comercial/index.tsx`    → SIN EvitaTeclado   🔴 descubierta
//   · `seccion-documentos.tsx`        → SIN, y es otro componente
// Y `cuenta-comercial/index.tsx` TAMPOCO aparece entre las rutas, porque
// no monta `<Campo>` él mismo: lo monta a través del componente.
//
// ⇒ ESTE GUARD MIRA EL ARCHIVO, NO EL ÁRBOL DE MONTAJE. Cubre los dos
//   extremos limpios (la ruta que monta su campo · el componente cuyas
//   anfitrionas están todas cubiertas) y **se le escapa el MIXTO**.
//
// LA CURA DE VERDAD es evaluar por árbol —un `<Campo>` está cubierto si
// TODAS las pantallas raíz que lo alcanzan portan la pieza—, y exige
// resolver imports transitivamente. Es trabajo propio, no un ajuste de
// regex. **Hasta que exista, el número de rutas es un PISO, no un
// total**, y esta nota es lo que impide leerlo como si lo fuera.

function corpusM2() {
  const out = { rutas: [], componentes: [] };
  for (const raiz of RAICES_M2) {
    if (!existsSync(raiz)) continue;
    for (const p of pantallas(raiz)) {
      const src = sinComentarios(readFileSync(p, 'utf8'));
      if (!RE_ABRE_TECLADO.test(src) || /EvitaTeclado/.test(src)) continue;
      (esRutaDePantalla(p, src) ? out.rutas : out.componentes).push(p);
    }
  }
  return out;
}

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
  // ── S85 ──
  { nombre: 'TresNumeros', origen: 'S85-B (el techo compacto, §2.4bis)', re: /<TresNumeros[\s/>]/ },
  { nombre: 'FiltroPills', origen: 'S85-B', re: /<FiltroPills[\s/>]/ },
  { nombre: 'SelectorDia', origen: 'S85-B (la rueda)', re: /<SelectorDia[\s/>]/ },
];

/* ⚠️ LA LISTA **BASE** ENVEJECE, Y HAY QUE VERLO AL LEER EL NÚMERO.
   Mide las piezas de S82/S83 — que es lo correcto para comparar contra la línea
   base 7/54 —, **pero la app siguió construyendo con piezas de S84 y S85**. En
   S85 se rediseñaron pantallas enteras (DATOS, el techo, «Necesita tu
   atención») **con piezas que la BASE no nombra**, así que el porcentaje de
   arriba SUBESTIMA lo que pasó.
   **Esto NO se cura moviendo piezas de EXTENSIÓN a BASE**: eso rompería la
   comparabilidad, que es lo único que hace útil a la serie. **Re-basar es
   decisión de la mesa**, y cuando la tome, la línea base se re-declara con su
   fecha — no se corrige hacia atrás. */

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
    nombre: 'campo que abre teclado, sin EvitaTeclado',
    ley: 'D-498 / §15b la regla del teclado — letra founder: "que eso no pase en NINGÚN campo"',
    // S86-B: el detector ya no nombra `Campo` — pregunta por las piezas
    // que MONTAN TextInput, derivadas de packages/ui (ver el bloque de
    // arriba). Sigue corriendo sobre el corpus general para no romper el
    // denominador del eje; su alcance REAL lo reporta `alcancePropio`.
    detecta: (src) => RE_ABRE_TECLADO.test(src) && !/EvitaTeclado/.test(src),
    /** EL ENSANCHE, reportado APARTE y no fundido en el denominador: el
     *  eje mecánico se compara contra una línea base de S83 medida sobre
     *  `apps/prestador/src/app`, y cambiarle el corpus haría que el
     *  porcentaje midiera otra cosa con el mismo nombre — el defecto que
     *  la cabecera del corpus advierte. Así el número de M2 dice la
     *  verdad entera SIN corromper la serie. */
    alcancePropio: corpusM2,
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
  TresNumeros: '<TresNumeros carga={c} />',
  FiltroPills: '<FiltroPills opciones={o} />',
  SelectorDia: '<SelectorDia dia={d} />',
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

  // ── S86-B · LOS BRAZOS DEL M2 ENSANCHADO ────────────────────────────
  // El fixture genérico de M2 usa `<Campo>`, que YA disparaba antes del
  // ensanche: con él solo, las dos curas nuevas podrían romperse sin que
  // la auto-prueba se entere. Cada una gana su rojo propio.

  // ① EL ANCLA DEL SET DERIVADO. Si `packages/ui` se mueve de lugar o
  //    `TextInput` se envuelve en otra pieza, el set queda vacío, el
  //    regex se degrada a solo-TextInput y M2 pasaría en VERDE habiendo
  //    mirado media casa. Es el modo de falla exacto de L-192: silencio.
  if (PIEZAS_TECLADO.length < 2) {
    mudos.push(
      `M2·ANCLA: el set de piezas que abren teclado se derivó de ${DIR_UI} y trajo ` +
        `${PIEZAS_TECLADO.length} (${PIEZAS_TECLADO.join(', ') || 'ninguna'}). Se esperan al menos 2 ` +
        `(Campo y SliderPrecio, medidos en S86). Con el set vacío el detector no verifica nada.`,
    );
  }

  // ② EL BRAZO QUE EL ENSANCHE ABRIÓ: si el derivado dejara de ver
  //    SliderPrecio, volveríamos al defecto original —los dos talleres
  //    invisibles— con el mismo número en pantalla.
  if (!MARCAS_MECANICAS.find((m) => m.id === 'M2').detecta('<SliderPrecio valor={v} />')) {
    mudos.push('M2·brazo SliderPrecio: no dispara — el ensanche S86 quedó decorativo.');
  }

  // ③ EL DISCRIMINADOR, en sus dos direcciones. Sin esto puede invertirse
  //    (contar componentes y perder rutas) sin que nada se ponga rojo.
  if (!esRutaDePantalla('apps/cliente/src/app/carnet.tsx', 'export default function P(){}'))
    mudos.push('M2·discriminador: una RUTA con export default no se reconoce como ruta.');
  if (esRutaDePantalla('apps/cliente/src/components/x.tsx', 'export default function P(){}'))
    mudos.push('M2·discriminador: un COMPONENTE se está contando como ruta — los falsos positivos vuelven.');

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
    // ── S86-B · el alcance ENSANCHADO de M2, con su denominador dicho ──
    if (m.alcancePropio) {
      const { rutas, componentes } = m.alcancePropio();
      console.log(`       ── ALCANCE REAL (${RAICES_M2.join(' + ')}):`);
      console.log(`          ${rutas.length} RUTAS con deuda propia  ·  ${componentes.length} componentes con anfitriona`);
      console.log(`          piezas que abren teclado, DERIVADAS de ${DIR_UI}: ${PIEZAS_TECLADO.join(', ')} (+ TextInput crudo)`);
      for (const r of rutas) console.log(`          🔴 ${r}`);
      for (const c of componentes) console.log(`          ·  ${c} — su anfitriona porta la pieza`);
      console.log(`          ⚠️ el número de arriba (${rs.length}) es el del corpus de la SERIE`);
      console.log(`             (${RAIZ}); el de acá es el de la LETRA ("ningún campo").`);
    }
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
