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
const VIGILADOS = [
  ['CLAUDE.md', /tokens v4 \+ \*\*(\d+) componentes/],
  ['packages/ui/CLAUDE.md', /tokens v4 \+ \*\*(\d+) componentes/],
  ['.claude/skills/epetplace-design-system/SKILL.md', /tokens v4 \+ \*\*(\d+) componentes/],
  ['CLAUDE.md', /\*\*(\d+) wrappers vivos/],
]

if (process.argv.includes('--control')) {
  /* El control prueba que el detector VE un número escrito cuando lo hay —y no
     lo ve cuando el texto declara el comando. Un gate que no puede producir su
     rojo sobre un caso construido a mano no está midiendo. */
  const re = VIGILADOS[0][1]
  const conNumero = 'Design system: tokens v4 + **53 componentes** + 3 temas'
  const conComando = 'Design system: tokens v4 + **el contador se MIDE** (ver abajo) + 3 temas'
  const ok = re.test(conNumero) && !re.test(conComando)
  console.log(ok
    ? '✅ control: ve «53 componentes» escrito y deja pasar el texto que declara el comando'
    : '🔴 control: el patrón no discrimina')
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
