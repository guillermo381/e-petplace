/**
 * GATE · EL CONTADOR DE PIEZAS DE `packages/ui` SE MIDE, NO SE ESCRIBE.
 *
 * ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 * El 7-sep-2026 había **CUATRO números conviviendo** para la misma cosa —81 en
 * la skill y en `packages/ui/CLAUDE.md`, 53 en el canon, 41 filas de índice, 39
 * en otra línea de la skill— y el hecho era **171**. El del canon llevaba
 * **28 sesiones** sin re-medirse, con su nota al lado diciendo «RE-MEDIDO S85».
 *
 * *La nota no salvó al número: lo hizo más creíble.* Es el tercer cobro de la
 * misma clase en esta casa — el contador de migraciones cayó cuatro veces
 * (9 → 77 → 138 → 186) y el de fichas seis, y las dos veces la cura no fue
 * corregirlo otra vez: fue **sacarlo del canon y declarar el COMANDO**.
 *
 * ⚠️ **Este gate no exige un número: exige que NO haya uno escrito.** Un
 * contador correcto de hoy es un contador falso dentro de tres sesiones, y
 * nadie va a ir a mirarlo porque se lee como un dato ya verificado.
 *
 *   node scripts/verify-contador-piezas.mjs [--control]
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'

const DIR = 'packages/ui/src/components'
const DIR_WRAPPERS = 'packages/api/src/wrappers'
/* Archivos que NO son componentes, nombrados de a uno: la lista corta se puede
   auditar; un patrón se vuelve una excepción que nadie recuerda haber puesto. */
const INFRA = ['capturaFoto.tsx']

export function contar() {
  const f = readdirSync(DIR).filter((n) => n.endsWith('.tsx'))
  const web = f.filter((n) => n.endsWith('.web.tsx'))
  const infra = f.filter((n) => INFRA.includes(n))
  return { total: f.length, web: web.length, infra: infra.length,
           piezas: f.length - web.length - infra.length }
}

/* Dónde NO puede haber un número escrito, y con qué patrón se lo reconoce.
   Son DOS contadores de la misma clase: piezas de `packages/ui` y wrappers de
   `packages/api`. El de wrappers era el peor —**26 publicados con 122 archivos
   en disco, desde S46**: unas 67 sesiones— y **nadie lo vio**, porque un
   contador con su sesión al lado («26 wrappers vivos (S46)») se lee como un
   dato fechado y verificado, no como uno vencido. */
/* 🔴 S114-B · EL GATE MIRABA UNA SOLA FORMA, Y HABÍA DOS NÚMEROS VIVOS EN UN
   ARCHIVO DE SU PROPIO CORPUS. Lo destapó una adenda del founder pidiendo
   verificar «otro contador que reporta 53».

   **Lo medido, y corrige la premisa:** el `53` del canon **ya estaba curado**
   —sus dos apariciones en `CLAUDE.md` son CITAS dentro de la línea que declara
   el comando y de su lección—. El que estaba VIVO era otro y en otro lado:
   `packages/ui/CLAUDE.md` publicaba **81** en su encabezado y **49** en su
   inventario de «Qué hay», **en dos formas que ninguno de estos patrones
   miraba**.

   ⇒ *el verde de este gate significaba «ninguna fuente escribe el número EN LA
   FORMA QUE MIRO», jamás «ninguna fuente lo escribe»* — y entre esas dos
   frases vivían dos números con 122 y 90 de brecha. **Un gate que acota su
   pregunta al formato que su autor tenía en la cabeza no cierra la clase: la
   recorta.**

   ⚠️ **Y los patrones nuevos se anclan a la ORACIÓN QUE DECLARA EL ESTADO, no
   al formato**, porque el archivo está lleno de bandas históricas que citan
   números («= **85**, menos **3**», «52 → 53», «decía 63») y **esas son la
   evidencia de por qué se curó**: borrarlas dejaría cada cura sin su razón. */
const VIGILADOS = [
  ['CLAUDE.md', /tokens v4 \+ \*\*(\d+) componentes/],
  ['packages/ui/CLAUDE.md', /tokens v4 \+ \*\*(\d+) componentes/],
  ['.claude/skills/epetplace-design-system/SKILL.md', /tokens v4 \+ \*\*(\d+) componentes/],
  ['CLAUDE.md', /\*\*(\d+) wrappers vivos/],
  // el ENCABEZADO de estado de packages/ui
  ['packages/ui/CLAUDE.md', /^\*\*Estado:[^\n]*?(\d+) componentes/m],
  // el INVENTARIO de «Qué hay» — la viñeta que abre nombrando el número
  ['packages/ui/CLAUDE.md', /^- \*\*(\d+) componentes\*\*/m],
]

if (process.argv.includes('--control')) {
  /* El control prueba que el detector VE un número escrito cuando lo hay —y no
     lo ve cuando el texto declara el comando. Un gate que no puede producir su
     rojo sobre un caso construido a mano no está midiendo. */
  const casos = [
    [VIGILADOS[0][1],
     'Design system: tokens v4 + **53 componentes** + 3 temas',
     'Design system: tokens v4 + **el contador se MIDE** (ver abajo) + 3 temas'],
    // S114-B · los dos ciegos que la adenda destapó. Cada uno con su NEGATIVO,
    // y el negativo es lo que importa: la banda histórica que CITA un número
    // no puede encender el gate, o curar deja de ser posible sin borrar la
    // razón de la cura.
    [VIGILADOS[4][1],
     '**Estado: S103 — 81 componentes, sistema exigible.**',
     '**Estado: sistema exigible.** El número **NO SE ESCRIBE ACÁ — se pide:** `node ...`'],
    [VIGILADOS[5][1],
     '- **49 componentes** (`src/components/`) — los 11 de S43',
     '- **Componentes** (`src/components/`) — el número NO SE ESCRIBE ACÁ: `node ...`'],
    // el NEGATIVO transversal: las bandas históricas de packages/ui/CLAUDE.md
    [VIGILADOS[4][1], '**Estado: S103 — 81 componentes**', '> Contador re-medido: 52 → 53'],
    [VIGILADOS[5][1], '- **49 componentes** (`src/`)', '> `ls src/components/*.tsx` = **85**, menos **3**'],
  ]
  let ok = true
  for (const [re, conNumero, sinNumero] of casos) {
    const bien = re.test(conNumero) && !re.test(sinNumero)
    if (!bien) ok = false
    console.log(`${bien ? '  ✓' : '  ✗'} ${String(re).slice(0, 46)}`)
  }
  console.log(ok
    ? '✅ control: los TRES patrones ven el número escrito y dejan pasar el texto que declara el comando y las bandas que lo CITAN'
    : '🔴 control: algún patrón no discrimina')
  process.exit(ok ? 0 : 2)
}

const c = contar()
const w = readdirSync(DIR_WRAPPERS).filter((n) => n.endsWith('.ts')).length
if (c.total === 0) {
  console.log('🔴 NO CONCLUYENTE: no encontré ningún .tsx — el gate no midió nada.')
  process.exit(2)
}

console.log(`verify:contador-piezas · ${c.total} .tsx − ${c.web} .web − ${c.infra} infra = ${c.piezas} piezas · ${w} wrappers`)

const escritos = []
/* 🔴 UNA LÍNEA YA CURADA CITA EL NÚMERO VIEJO, y el patrón no distingue una
   CITA de una PUBLICACIÓN. La primera versión de este gate se cazó a sí misma:
   la fila curada explica «publicaba **26 wrappers vivos (S46)**» —esa cita es
   la evidencia de por qué se curó, y sacarla dejaría la cura sin su razón—.
   Se resuelve por SEMÁNTICA y no por formato: una línea que declara el comando
   ya no publica un número, lo historia. *Atarlo al formato —sacar la negrita,
   cambiar la palabra— habría durado hasta el próximo que escriba en negrita.* */
const YA_CURADA = /EL NÚMERO NO SE ESCRIBE ACÁ/

for (const [ruta, re] of VIGILADOS) {
  if (!existsSync(ruta)) continue
  const texto = readFileSync(ruta, 'utf8')
  const lineaDelHit = texto.split('\n').find((l) => re.test(l))
  if (lineaDelHit && YA_CURADA.test(lineaDelHit)) continue
  const m = re.exec(texto)
  if (m) escritos.push({ ruta, n: Number(m[1]), re: String(re) })
}

if (escritos.length > 0) {
  for (const e of escritos) {
    const real = /wrappers/.test(String(e.re ?? '')) ? w : c.piezas
    const estado = e.n === real ? 'coincide HOY' : `🔴 dice ${e.n}, son ${real}`
    console.log(`  ✗ ${e.ruta} lleva un número escrito (${estado})`)
  }
  console.log('\n✗ El contador NO se escribe: se mide.')
  console.log('  Aunque coincida hoy, dentro de tres sesiones va a ser falso y nadie')
  console.log('  va a ir a mirarlo — un número con una nota que dice «re-medido» se')
  console.log('  lee como un dato ya verificado. Declará el comando en su lugar:')
  console.log('    node scripts/verify-contador-piezas.mjs')
  process.exit(1)
}
console.log('✅ ninguna fuente escribe el número; el comando es la fuente')
