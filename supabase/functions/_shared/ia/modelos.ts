// _shared/ia/modelos.ts — LA TABLA DE PIEZAS (S113-D, lote 0).
//
// ── QUÉ ES ESTO Y QUÉ NO ES ─────────────────────────────────────────────────
// Es la CLASIFICACIÓN de lo que las cuatro edges YA hacen hoy, medida archivo
// por archivo. No es una propuesta ni una mejora: cada número de acá salió de
// leer la línea que lo escribe. **En el lote 0 no cambia ningún modelo.**
//
// Medido contra main dd40e37e:
//   extract-vacuna/index.ts:213-214            model 'claude-sonnet-5' · max_tokens 16000
//   extract-documento/index.ts:170-171         model 'claude-sonnet-5' · max_tokens 4000
//   estructurar-nota-clinica/index.ts:121-122  model 'claude-sonnet-5' · max_tokens 16000
//   escribir-presencia/index.ts:316-317        model 'claude-sonnet-5' · max_tokens 4000
//
// ── EL VOCABULARIO ES DE LA CASA, NO DEL PROVEEDOR ──────────────────────────
// `Pieza` nombra lo que el producto hace ('carnet'), jamás cómo lo hace un
// proveedor. El día que un modelo cambie, cambia UNA celda de esta tabla y
// ninguna edge se entera. Ése es todo el punto de la puerta única.

/** Vocabulario CERRADO. Una pieza = un trabajo del producto. */
export type Pieza = 'carnet' | 'documento' | 'nota_clinica' | 'presencia'

/** El modelo por pieza. **Medido, no elegido** — ver cabecera. */
export const MODELOS: Record<Pieza, string> = {
  carnet: 'claude-sonnet-5',
  documento: 'claude-sonnet-5',
  nota_clinica: 'claude-sonnet-5',
  presencia: 'claude-sonnet-5',
}

/** `max_tokens` por pieza. **Medido**, ver cabecera. */
export const MAX_TOKENS: Record<Pieza, number> = {
  // 🔴 CAMBIADO EN S113-D-1.0, y **viaja atado a `PENSAR.carnet = false`**:
  // con razonamiento encendido, 2000 trunca. Los dos se mueven juntos o
  // ninguno. La salida real que este techo tiene que albergar se midió: el
  // carnet más denso del conjunto de E tiene 8 vacunas ⇒ ~8 filas de 11
  // campos + `plan_impreso`, del orden de 900-1200 tokens. 2000 deja aire
  // sin dejar lugar a la prosa.
  carnet: 4000,
  /* 🔴 2000 → 4000 · DECISIÓN DE LA MESA (5-sep-2026), y queda en el repo
     ESPERANDO a la v2.1 — hoy lo desplegado es la v1, que usa su propio techo.
     La razón, medida por la edge con el carnet «1 → 12»: la salida real mide
     **1945–2087 tokens**, así que con 2000 **una de cada tres corridas trunca**
     (medido: 422 con `resultado: 'error_parseo'` y `tokens_salida: 2000`).
     *Un techo que cae en la MEDIANA de lo que hace falta no es un techo chico:
     es una moneda al aire, y falla según el carnet y según la corrida.* 4000
     deja el doble de margen sobre el peor caso medido. */
  documento: 4000,
  nota_clinica: 16000,
  presencia: 4000,
}

/**
 * Qué edge sirve cada pieza. Hoy la relación es 1:1 y está MEDIDA (§1.1); vive
 * acá y no en la firma de `llamarModelo` para que la columna `edge` de `ia_uso`
 * se llene con un dato medido y no con lo que el llamador se acuerde de pasar.
 */
export const EDGES: Record<Pieza, string> = {
  carnet: 'extract-vacuna',
  documento: 'extract-documento',
  nota_clinica: 'estructurar-nota-clinica',
  presencia: 'escribir-presencia',
}

/**
 * TIMEOUT POR PIEZA — **MEDIDOS CONTRA EL PROVEEDOR REAL (S113-A, 3-sep-2026).**
 *
 * D los dejó estimados y lo declaró: no tenía credencial. La llave vive en los
 * secrets del proyecto (`ANTHROPIC_API_KEY`) y sólo la ven las edges, así que
 * la medición se hizo **llamando a las cuatro edges desplegadas** con entradas
 * reales, y el número es la **latencia de pared de la ida y vuelta completa**
 * (incluye red y el base64 subiendo) — o sea un TECHO del tiempo del modelo,
 * no su tiempo exacto. El exacto lo va a decir `ia_uso.latencia_ms` cuando E
 * cree la tabla.
 *
 * ── EL MURO, citado y no recordado ────────────────────────────────────────
 * `supabase.com/docs/guides/functions/limits`: wall clock **150 s en Free**,
 * **400 s en planes pagos**, y request idle timeout **150 s en TODOS**.
 * ✅ **El proyecto está en plan Pro** (dato del founder, 3-sep) ⇒ **el muro es
 * 400 s**. La primera versión de estos números se calculó contra el piso de
 * 150 s porque el plan no se podía medir desde el CLI (ni `projects list` ni
 * `orgs list` lo exponen) y **no se infirió**; con el plan confirmado, la
 * regla original —el doble de la latencia medida— ya no colisiona con nada.
 *
 * ⚠️ Queda una nota, no un freno: el **idle timeout de 150 s rige en todos los
 * planes**. Una espera de 85 s con la conexión abierta y sin datos fluyendo
 * está holgadamente por debajo, así que hoy no muerde — pero si el p95 de
 * `carnet` subiera de 150 s, cortaría por ahí antes que por este timeout.
 *
 * ── LO MEDIDO, y la regla aplicada (2× la latencia, subido a múltiplo de 10 s,
 *    siempre por debajo del muro de 400 s) ─────────────────────────────────
 *
 *   pieza          entrada real                    medido      2×      queda
 *   carnet         carnet de vacunas real, 320 kB  85.132 ms  170 s   170 s
 *   nota_clinica   dictado de consulta, 1.688 ch   15.564 ms   31 s    40 s
 *   presencia      2 hechos + 1 respuesta           3.038 ms    6 s    10 s
 *   documento      —                                    (ver abajo)     60 s
 *
 * ⚠️ **`documento` NO tiene medición representativa y por eso NO se movió.**
 * La única imagen real disponible era un carnet de vacunas (`prestador_docu-
 * mentos` tiene 0 filas con archivo), y la edge —correctamente— devolvió los
 * tres campos en null en 2.370 ms. *Ese número puede ser la lectura real de la
 * imagen o un corto circuito del modelo al no encontrar un documento, y desde
 * afuera no se distingue.* Aplicar la regla a una medición inválida da un
 * número equivocado **con la autoridad de una medición**, así que se conserva
 * el techo holgado de D: un timeout largo de más sólo cuesta espera; uno corto
 * de más rompe algo que funciona.
 *
 * 🔴 **LA MEDICIÓN QUE SALVÓ UN NÚMERO MALO, registrada:** el primer dictado
 * de prueba era un párrafo y dio 4.510 ms ⇒ la regla habría fijado **10 s**.
 * Con un dictado realista de consulta completa dio **15.564 ms**: ese timeout
 * habría cortado TODA consulta de verdad. *La regla estaba bien; la magnitud
 * medida estaba mal, y una muestra no representativa se lee igual que una
 * buena.*
 *
 * **E los reemplaza con percentil sobre `latencia_ms` en el lote 1.** Hasta
 * entonces, estos números no reemplazan a otros: reemplazan a *ninguno*.
 */
export const TIMEOUT_MS: Record<Pieza, number> = {
  carnet: 170_000,
  documento: 60_000,
  nota_clinica: 40_000,
  presencia: 10_000,
}

/**
 * CACHÉ DEL BLOQUE `system`, por pieza — y las tres son `false` por MEDICIÓN,
 * no por prudencia.
 *
 * El caché es un match de PREFIJO (`tools` → `system` → `messages`). Sólo
 * paga si hay un prefijo ESTABLE entre llamadas:
 *
 * · `presencia` **true** — es la única con bloque `system`, y es la constante
 *   `SISTEMA` (escribir-presencia/index.ts:191), idéntica en toda llamada.
 *   Mide ~9.950 caracteres ⇒ del orden de 2.000-2.800 tokens, cómodamente por
 *   encima del mínimo cacheable de Sonnet 5 (**1024 tokens**). *No pude contar
 *   los tokens exactos — `count_tokens` exige credencial y no la hay— pero el
 *   piso del rango (9.950/5 ≈ 1.990) ya supera el mínimo, así que la decisión
 *   no depende del dígito.* Y paga porque la pieza REGENERA:
 *   `TOPE_REGENERACIONES = 3` (index.ts:94) ⇒ ráfagas de hasta 3 llamadas con
 *   el mismo `system` dentro de la misma ventana de 5 min, y el break-even del
 *   TTL de 5 min son 2 llamadas. Una llamada solitaria paga 1,25× sobre ~2,5K
 *   tokens ≈ una milésima de dólar: el downside está acotado y medido.
 *
 * · `carnet` / `documento` **false** — no tienen `system`, y su primer bloque
 *   de contenido es LA IMAGEN, que cambia en cada llamada. **No existe prefijo
 *   estable que cachear**: moverles el prompt a `system` tampoco serviría,
 *   porque el prefijo se corta en el primer byte que varía.
 *
 * · `nota_clinica` **false** — su prompt se arma con `especie` y `motivo`
 *   (index.ts:106, `construirPrompt(...) + texto`) y viaja CONCATENADO con el
 *   dictado en un solo bloque de texto. Tampoco hay prefijo estable.
 *
 * ⇒ Encenderlo en las tres sería pagar 1,25× de escritura por entradas que
 *   nadie lee nunca. Las columnas `tokens_cache_*` de `ia_uso` son las que
 *   dejan confirmar o revertir esto con número.
 */
/** Niveles de `output_config.effort`. Sólo los modelos que lo soportan. */
export type Esfuerzo = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

/**
 * 🔴 MODELOS QUE PIENSAN SI NO SE LES DICE NADA — y esto NO es trivia: es lo
 * que hace que «el mismo cuerpo» signifique cosas distintas según el modelo.
 *
 * En `claude-sonnet-5`, **omitir `thinking` equivale a `adaptive`**: piensa, y
 * ese pensamiento se cobra como tokens de SALIDA. En `claude-haiku-4-5`,
 * omitirlo significa **no pensar**.
 *
 * ⇒ Mandar el MISMO cuerpo a los dos y comparar los números **no compara los
 * modelos: compara un modelo pensando contra otro que no piensa.** Por eso
 * `pensar` es explícito y esta tabla existe: para poder apagarlo donde hay que
 * apagarlo y dejar la comparación limpia.
 *
 * Fuente: tabla de modelos de la skill `claude-api` (cacheada 2026-06-24).
 * ⚠️ Un modelo que se agregue acá se agrega MIDIENDO, no por parecido de
 * nombre — es exactamente la clase de dato que envejece sin avisar.
 */
export const MODELOS_ADAPTIVOS = new Set<string>(['claude-sonnet-5'])

/**
 * 🔴 SI LA PIEZA PIENSA — la palanca más cara de las cuatro, y la más riesgosa
 * de este lote.
 *
 * `carnet` **false**, y la razón es de plata medida: la línea base de A dio
 * **4.036 tokens de entrada y 6.347 de SALIDA** ($0,0715). El JSON de doce
 * vacunas no llega a 1.000 tokens ⇒ **la mayor parte de esa salida no es la
 * respuesta: es razonamiento.** A $10/MTok de salida contra $2 de entrada, ahí
 * está el 89 % del costo.
 *
 * ⚠️ **PERO ESTO NO ESTÁ MEDIDO DIRECTAMENTE Y SE DICE:** la API no separa
 * tokens de razonamiento de tokens de respuesta; lo de arriba es una
 * INFERENCIA a partir del tamaño del JSON. **El experimento que la vuelve
 * medición es de E y es de una línea:** el mismo carnet con `pensar` en true y
 * en false. Si la salida no baja, la inferencia era falsa y hay que buscar en
 * otro lado.
 *
 * ⚠️ **Y EL RIESGO EN LA OTRA DIRECCIÓN, que es el que de verdad importa:**
 * S48 midió que Haiku 4.5 **topaba en la atribución espacial** sticker↔columna
 * FECHA, y que Sonnet con razonamiento fue lo que la resolvió. Apagarlo puede
 * reintroducir justo el defecto que aquella sesión cerró.
 * ⇒ **E no mide sólo costo y latencia: mide EXACTITUD contra las 32 filas de
 *   verdad del conjunto.** Si la exactitud cae bajo la línea base
 *   (nombre 65,6 % · fecha 62,5 % · lote 81,3 %), la tercera variante ya está
 *   servida sin tocar código: `esfuerzo: 'low'` con `pensar: true`.
 */
export const PENSAR: Record<Pieza, boolean> = {
  carnet: false,
  documento: true,
  nota_clinica: true,
  presencia: true,
}

/**
 * `output_config.effort` por pieza. `null` = no se manda el campo (default del
 * proveedor). Nace en `null` en las cuatro: **mover esto sin medir es cambiar
 * el precio y la calidad a la vez y no saber cuál se movió.**
 */
export const ESFUERZO: Record<Pieza, Esfuerzo | null> = {
  carnet: null,
  documento: null,
  nota_clinica: null,
  presencia: null,
}

export const CACHEAR_SISTEMA: Record<Pieza, boolean> = {
  carnet: false,
  documento: false,
  nota_clinica: false,
  presencia: true,
}
