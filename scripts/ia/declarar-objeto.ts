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
async function huella(ruta: string): Promise<string> {
  // 🔴 La ruta se declara COMO SE LLAMA EN EL REPO, que es el nombre que un
  // humano reconoce y el que el gate puede verificar. Pero el arnés CORRE en
  // una copia temporal donde `supabase/functions/` quedó en `functions/`, así
  // que acá se prueban las dos. *Declarar la ruta del temp haría que la
  // declaración nombre un lugar que no existe para nadie más.*
  const bytes = await Deno.readFile(ruta).catch(() =>
    Deno.readFile(ruta.replace(/^supabase\/functions\//, 'functions/')))
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
      Deno.exit(2)
    }
  }
  console.log(`[mide] ${partes.join(' · ')}`)
  console.log(`[mide] proveedor: ${o.modeloReal ? '🔴 MODELO REAL (gasta)' : 'falso (cero llamadas)'}`)
  console.log(`[mide] NO cubre: ${o.noCubre}`)
}
