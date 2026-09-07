/**
 * GATE · TODO ARNÉS DECLARA CONTRA QUÉ OBJETO MIDIÓ (S113-D, lote 3).
 *
 * Nace de cinco instrumentos que en una sola noche dieron un número creíble
 * sobre otra cosa **sin fallar** (la lista, con sus casos, en
 * `scripts/ia/declarar-objeto.ts`).
 *
 * Exige dos cosas de cada arnés de `scripts/ia/prueba-*.{ts,mts}`:
 *   ① que llame a `declararObjeto`;
 *   ② que lo que declara medir EXISTA — si no, el arnés no está midiendo mal:
 *      no está midiendo, y su verde no dice nada.
 *
 * 🔴 Y su propio límite, declarado: **esto no verifica que el arnés mida bien.**
 * Un arnés puede declarar el archivo correcto y medirlo mal igual. Para eso
 * está su rojo producido; esto sólo hace visible SOBRE QUÉ.
 *   node scripts/verify-arneses-declaran.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'scripts/ia'
let v = 0, r = 0
const exigir = (n, ok, visto) => {
  if (ok) { v++; console.log(`  OK   ${n}`) }
  else { r++; console.log(`  ROJO ${n}${visto === undefined ? '' : ` — ${visto}`}`) }
}

/* 🔴 `.ts` Y `.mts`. El filtro decía sólo `.endsWith('.ts')`, y `.mts` NO
   termina en `.ts` — un arnés en ESM se le escapaba entero y el gate seguía
   diciendo un número verde. *Un gate atado a una extensión mide la convención
   de nombre, no el hecho* — misma clase que el gate atado a un campo. Lo
   destapó el primer arnés que necesitó `await` de nivel superior. */
/* 🔴 Y NO SÓLO `prueba-*`. El filtro miraba ese prefijo, así que **los arneses
   de modelo real que se llaman `*-real*` se le escapaban enteros** — y son
   justamente los que pueden quedar en cero casos por la red o por la clave.
   *Un gate atado a un prefijo mide la convención de nombre, no el hecho*: es la
   tercera vez hoy que la misma clase muerde (antes fue `.mts`, y antes un campo
   renombrado). Ahora el sujeto se define por lo que el archivo HACE —declara un
   objeto medido— y el prefijo sólo acota el directorio. */
const arneses = readdirSync(DIR)
  .filter((f) => /\.m?ts$/.test(f) && !f.startsWith('declarar-objeto'))
  .filter((f) => /declararObjeto\s*\(/.test(readFileSync(join(DIR, f), 'utf8')))
console.log(`\narneses-declaran · ${arneses.length} arnés(es) en ${DIR}\n`)
// Un gate que no encuentra sujetos no está midiendo: lo dice antes que nada.
exigir(`hay arneses que vigilar (si no, este gate no mide nada)`, arneses.length > 0, arneses.length)

for (const f of arneses) {
  const src = readFileSync(join(DIR, f), 'utf8')
  const llama = /declararObjeto\s*\(/.test(src)
  exigir(`${f} declara su objeto`, llama, 'no llama a declararObjeto')
  if (!llama) continue
  // Las rutas declaradas tienen que existir. Se leen del literal: si alguien
  // las arma por variable, este gate lo dice en vez de dar verde a ciegas.
  /* 🔴 DOS ALCANCES, CADA COMPROBACIÓN EL SUYO.
     Antes se cortaban 700 chars desde `declararObjeto(` y se usaban para todo
     — y esa ventana **produjo un rojo falso** el día que un arnés tuvo un
     `await import('../_shared/ia/mod.ts')` a menos de 700 caracteres: el gate
     leyó esa ruta como declarada. *Una ventana de tamaño fijo no delimita una
     estructura: la aproxima, y falla cuando el archivo cambia de forma.*
     Y al acotarla al array `mide` rompí 12 verdes, porque `noCubre` vivía en
     esa misma ventana: **una cura que mueve el alcance mueve TODO lo que se
     medía con él.** Por eso ahora son dos, explícitos:
       · las RUTAS salen del array `mide`
       · `noCubre` se busca en la LLAMADA entera */
  const llamada = src.slice(src.indexOf('declararObjeto('),
    src.indexOf('})', src.indexOf('declararObjeto(')) + 2)
  const arrayMide = src.match(/mide:\s*\[([\s\S]*?)\]/)
  const bloque = arrayMide ? arrayMide[1] : ''
  const rutas = [...bloque.matchAll(/'([^']*\/[^']*\.(?:ts|mjs|json))'/g)].map((m) => m[1])
  exigir(`  ...con rutas literales (no armadas por variable)`, rutas.length > 0,
    'no encontré rutas literales en la llamada')
  for (const ruta of rutas) {
    const abs = ruta.startsWith('../../') ? ruta.replace('../../', '') : ruta
    exigir(`  ...y \`${abs}\` existe`, existsSync(abs), 'no existe')
  }
  exigir(`  ...y dice qué NO cubre`, /noCubre\s*:/.test(llamada), 'sin `noCubre`')

  /* 🔴 UN ARNÉS DE MODELO REAL DEBE EXIGIR CASOS ANTES DE RESUMIR.
     La regla no se enumera: se DERIVA de lo que el arnés YA declara. Si dice
     `modeloReal: true`, su corrida puede quedar en cero por la red, por la
     clave sin crédito o por un conjunto vacío — y ahí un resumen sin guarda
     imprime `0 sobre 0`, que **se lee como un verde**. Pasó de verdad.
     Los de proveedor falso quedan fuera a propósito: su fixture siempre tiene
     casos, y exigirles la guarda sería ruido. */
  if (/modeloReal:\s*true/.test(src)) {
    exigir(`  ...y usa MODELO REAL, así que exige casos antes de resumir`,
      /exigirCasos\s*\(/.test(src), 'no llama a exigirCasos: un resumen sobre cero se lee como un verde')
  }
}


console.log(`\n${r === 0 ? 'OK' : 'ROJO'} verify:arneses-declaran — ${v} verdes · ${r} rojos`)
console.log('  ⚠️ su verde dice «cada arnés dice sobre qué mide», JAMÁS «cada arnés mide bien».\n')
process.exit(r === 0 ? 0 : 1)
