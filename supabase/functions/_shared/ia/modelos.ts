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
  carnet: 16000,
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
 * **400 s en planes pagos**, y **request idle timeout 150 s en TODOS**.
 * ⚠️ **El plan de este proyecto NO se pudo medir**: ni `supabase projects
 * list` ni `orgs list` lo exponen. **No se infiere** ⇒ rige el piso de 150 s,
 * que además es el idle timeout en todos los planes.
 *
 * ── LO MEDIDO, y la regla aplicada (2× la latencia, subido a múltiplo de 10 s,
 *    siempre por debajo del muro) ──────────────────────────────────────────
 *
 *   pieza          entrada real                    medido      2×      queda
 *   carnet         carnet de vacunas real, 320 kB  85.132 ms  170 s   140 s 🔴
 *   nota_clinica   dictado de consulta, 1.688 ch   15.564 ms   40 s    40 s
 *   presencia      2 hechos + 1 respuesta           3.038 ms   10 s    10 s
 *   documento      —                                    (ver abajo)     60 s
 *
 * 🔴 **`carnet` NO PUEDE cumplir la regla, y se dice:** su doble son 170 s y
 * el muro son 150 s. **Un timeout por encima del muro es ficción** — la
 * plataforma corta primero y el cliente nunca llega a ver el suyo. Se fija en
 * **140 s**, bajo el muro con 10 s de margen. *Y el número deja una
 * advertencia: 85 s de latencia real contra 150 s de muro es poco aire; si el
 * p95 sube, esa pieza empieza a morir por plataforma y no por timeout.*
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
  carnet: 140_000,
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
export const CACHEAR_SISTEMA: Record<Pieza, boolean> = {
  carnet: false,
  documento: false,
  nota_clinica: false,
  presencia: true,
}
