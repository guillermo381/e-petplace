/**
 * LA BÚSQUEDA DE LA FAMILIA — la lógica, aparte de la pieza
 * (S113-B · 2.0 · B2).
 *
 * Su gate la mide **sin montar React**: es la única forma de probar que *el
 * resaltado no se come una letra* sin mirar una pantalla.
 */

/** Los cinco lugares donde la familia tiene cosas. **Cerrado a propósito**:
 *  un tipo nuevo sin rótulo ni glifo no compila, en vez de caer a un grupo
 *  «otros» que nadie sabría abrir. */
export type TipoResultado = 'citas' | 'pedidos' | 'recuerdos' | 'despensa' | 'prestadores'

export interface Resultado {
  id: string
  tipo: TipoResultado
  /** El título tal cual está en el dato. **El resaltado lo hace la pieza** —
   *  si viniera ya partido, cada pantalla decidiría qué es «coincidir». */
  titulo: string
  /** Una línea más, ya redactada. */
  subtitulo?: string
  /** *«12 mar»* — ya redactada por el riel. */
  fecha?: string
  /** 🔴 **Obligatorio: tocar ABRE la cosa.** Un resultado que no lleva a
   *  ningún lado no es un resultado, es un texto. */
  onPress: () => void
}

export interface GrupoResultados {
  tipo: TipoResultado
  /** *«Citas»* — ya redactado (Ley 3). */
  rotulo: string
  resultados: readonly Resultado[]
}

/**
 * Parte el título en tramos, marcando los que coinciden con el término.
 *
 * 🔴 **NO PIERDE NI AGREGA UNA LETRA**, y su gate lo mide concatenando los
 * tramos y comparando contra el original: *un resaltado que se come un
 * carácter cambia el dato que la familia está leyendo, y lo hace justo en el
 * lugar donde fue a verificar algo.*
 *
 * ⚠️ **Compara sin acentos ni mayúsculas, y devuelve el texto ORIGINAL.**
 * Quien busca «pipeta» tiene que encontrar «Pipeta» y «pipetá»; lo que se
 * dibuja es lo que dice el dato, no lo normalizado.
 *
 * Con término vacío devuelve un solo tramo sin marcar: *buscar nada no
 * resalta todo.*
 */
export function tramosResaltados(
  titulo: string,
  termino: string,
): readonly { texto: string; marcado: boolean }[] {
  const plano = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  const t = termino.trim()
  if (t.length === 0) return [{ texto: titulo, marcado: false }]

  /* 🔴 **SE BUSCA SOBRE LO PLANO Y SE CORTA SOBRE LO ORIGINAL, CON MAPA.**
     ⏪ La primera versión cortaba el original con los índices de la versión
     plana, apoyada en que «NFD + borrar diacríticos conserva el largo». **Es
     falso**: un título ya descompuesto («a» + tilde combinante) mide 2 y su
     plano mide 1, así que a partir de ahí todos los cortes se corren uno.
     *No fallaba con los datos de prueba —que vienen precompuestos— y habría
     resaltado la letra de al lado con datos reales.*
     Acá cada carácter del original aporta 0 o más caracteres al plano y se
     anota de dónde vino ⇒ **el invariante vale por construcción**, no por un
     supuesto sobre Unicode. */
  const pajar: string[] = []
  const origen: number[] = []
  for (let k = 0; k < titulo.length; k++) {
    const p = plano(titulo[k]!)
    for (const c of p) {
      pajar.push(c)
      origen.push(k)
    }
  }
  const aguja = plano(t)
  const texto = pajar.join('')

  const tramos: { texto: string; marcado: boolean }[] = []
  let corte = 0 // índice en el ORIGINAL
  let desde = 0 // índice en el plano
  for (;;) {
    const hit = texto.indexOf(aguja, desde)
    if (hit === -1 || aguja.length === 0) break
    const ini = origen[hit] ?? titulo.length
    const fin = origen[hit + aguja.length] ?? titulo.length
    if (ini > corte) tramos.push({ texto: titulo.slice(corte, ini), marcado: false })
    tramos.push({ texto: titulo.slice(ini, fin), marcado: true })
    corte = fin
    desde = hit + aguja.length
  }
  if (corte < titulo.length) tramos.push({ texto: titulo.slice(corte), marcado: false })
  return tramos.length > 0 ? tramos : [{ texto: titulo, marcado: false }]
}

/**
 * 🔴 **UN GRUPO VACÍO NO EXISTE.** *Un rótulo «Pedidos» con nada debajo dice
 * que se buscó ahí y no dice que no había nada: se lee como algo que falló al
 * cargar.*
 */
export function gruposConAlgo(grupos: readonly GrupoResultados[]): GrupoResultados[] {
  return grupos.filter((g) => g.resultados.length > 0)
}

/** Si no quedó ningún grupo con algo, la búsqueda no encontró nada. */
export function sinResultados(grupos: readonly GrupoResultados[]): boolean {
  return gruposConAlgo(grupos).length === 0
}
