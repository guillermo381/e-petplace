// ═══════════════════════════════════════════════════════════════════════════
// TODO ARNÉS DECLARA CONTRA QUÉ OBJETO MIDIÓ (S113-D, lote 3).
//
// ── LA LEY, y sale de cinco casos medidos en una sola noche ────────────────
// Cinco instrumentos dieron **un número creíble sobre otra cosa**, y **ninguno
// falló**:
//   · un arnés que detectaba el router buscando `"intencion"` en un cuerpo
//     donde va escapada ⇒ la redacción nunca ocurría, y los rojos parecían de
//     la edge;
//   · un extractor de prompt por regex que **borraba el 17 %** y después
//     preguntaba si quedaba alguna interpolación — el síntoma que su propia
//     cura eliminaba;
//   · un brazo atado a un campo ya muerto que **caía a un piso y seguía
//     contando**, con otro significado;
//   · un `ota:deps` que ignoraba su segundo argumento y **midió dos veces la
//     misma rama**, dando el mismo verde para dos ramas distintas;
//   · un `| head` que convirtió «no lo vi» en «no está».
//
// **Un instrumento roto que FALLA se ve en la revisión. Uno que contesta sobre
// otro objeto produce una salida bien formada, plausible y del tipo esperado**
// — y la revisión confirma que el código hace lo que dice, porque lo hace. Lo
// que no se puede leer es CONTRA QUÉ lo está haciendo.
//
// ⇒ La defensa no es más cuidado: es que el instrumento **diga, en su salida,
//   qué objeto midió** — con su huella calculada al momento, no escrita.
//
// ── LO QUE ESTO NO HACE ────────────────────────────────────────────────────
// No verifica que el arnés mida BIEN. Sólo hace visible **sobre qué** midió, y
// que ese objeto exista. *Un arnés puede declarar el archivo correcto y aun así
// medirlo mal* — para eso está su rojo producido, no esto.
// ═══════════════════════════════════════════════════════════════════════════

/** Huella corta y estable de un archivo. Se calcula AL MOMENTO: una huella
 *  escrita a mano es exactamente el problema que este módulo existe para
 *  evitar. */
declare const Deno: { readFile(p: string): Promise<Uint8Array>; exit(c: number): never } | undefined

/** Lee un archivo en Deno o en Node, probando la ruta del repo y la de la copia
 *  temporal de las edges. */
async function leerArchivo(ruta: string): Promise<Uint8Array> {
  const alternativas = [ruta, ruta.replace(/^supabase\/functions\//, 'functions/')]
  if (typeof Deno !== 'undefined' && Deno) {
    for (const r of alternativas) { try { return await Deno.readFile(r) } catch { /* la próxima */ } }
    throw new Error(`no encontré ${ruta}`)
  }
  const { readFile } = await import('node:fs/promises')
  const { existsSync } = await import('node:fs')
  const { dirname, join } = await import('node:path')
  // Bajo Node se busca desde el cwd y, si no está, subiendo hasta la raíz del repo.
  let dir = process.cwd()
  for (let i = 0; i < 8; i++) {
    for (const r of alternativas) { const f = join(dir, r); if (existsSync(f)) return new Uint8Array(await readFile(f)) }
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) break
    const arriba = dirname(dir); if (arriba === dir) break; dir = arriba
  }
  throw new Error(`no encontré ${ruta}`)
}

/** Sale del proceso en cualquiera de los dos runtimes. */
function salir(codigo: number): never {
  if (typeof Deno !== 'undefined' && Deno) Deno.exit(codigo)
  process.exit(codigo)
  throw new Error('inalcanzable')
}

async function huella(ruta: string): Promise<string> {
  // 🔴 La ruta se declara COMO SE LLAMA EN EL REPO, que es el nombre que un
  // humano reconoce y el que el gate puede verificar. Pero el arnés CORRE en
  // una copia temporal donde `supabase/functions/` quedó en `functions/`, así
  // que acá se prueban las dos. *Declarar la ruta del temp haría que la
  // declaración nombre un lugar que no existe para nadie más.*
  /* 🔴 **Y CORRE EN LOS DOS RUNTIMES.** Este módulo nació con `Deno.readFile`
     y `Deno.exit` porque los seis primeros arneses eran de edges. El primero
     que necesitó `packages/` corre en `tsx` y **el instrumento de la honestidad
     reventó con `ReferenceError: Deno is not defined`** — o sea que la ley no
     podía alcanzar justo a los arneses que no son de edge. *Una ley que sólo
     rige donde ya se cumplía no rige.*
     Además, bajo Node el proceso arranca en la RAÍZ del repo y bajo Deno en la
     copia temporal: por eso se prueban las dos rutas y, si ninguna, se sube
     hasta encontrar el `package.json` de la raíz. */
  const bytes = await leerArchivo(ruta)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash)).slice(0, 4)
    .map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface Objeto {
  /** Rutas de lo que este arnés está midiendo. Si una no existe, PARA. */
  mide: string[]
  /** `false` = proveedor falso. Un verde con proveedor falso NO dice que el
   *  modelo se comporte: dice que el cableado se comporta. */
  modeloReal: boolean
  /** Lo que este arnés NO cubre, en una línea. Va a la salida a propósito:
   *  *un arnés que no dice su límite deja que su verde se lea como completo.* */
  noCubre: string
}

/** Imprime la declaración y devuelve las huellas. **Si un archivo declarado no
 *  existe, sale con 2** — no con rojo: un arnés que no encuentra su objeto no
 *  midió mal, no midió. */
export async function declararObjeto(o: Objeto): Promise<void> {
  const partes: string[] = []
  for (const ruta of o.mide) {
    try {
      partes.push(`${ruta}@${await huella(ruta)}`)
    } catch {
      console.error(`\nNO CONCLUYENTE — el arnés declara medir \`${ruta}\` y ese archivo no existe.\n`)
      salir(2)
    }
  }
  console.log(`[mide] ${partes.join(' · ')}`)
  console.log(`[mide] proveedor: ${o.modeloReal ? '🔴 MODELO REAL (gasta)' : 'falso (cero llamadas)'}`)
  console.log(`[mide] NO cubre: ${o.noCubre}`)
}
