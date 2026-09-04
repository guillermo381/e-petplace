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
 * ⚠️ TIMEOUT POR PIEZA — **ESTOS NÚMEROS NO ESTÁN MEDIDOS Y SE DECLARA.**
 *
 * Hoy las cuatro edges corren **sin timeout ninguno** (medido: cero
 * `AbortController`, cero `signal` en las cuatro). O sea que el número de
 * abajo no reemplaza a otro número: reemplaza a *no tener ninguno*.
 *
 * Por qué no pude medirlo: la latencia real sólo se conoce llamando al
 * proveedor, y **en esta pista no hay credencial de Anthropic** (medido:
 * `ANTHROPIC_API_KEY` no está en env, no está en keychain, y `ant` no está
 * instalado). Estimar una latencia sería justo el modo de falla que esta
 * sesión persigue.
 *
 * Cómo se destraba, con su bloqueante nombrado: la columna `latencia_ms` de
 * `ia_uso` — que este mismo lote empieza a escribir — da la distribución real.
 * **E fija estos números con percentil en el lote 1.** Hasta entonces son un
 * techo deliberadamente holgado, elegido para que no corte nada que hoy
 * funciona: las dos piezas con `max_tokens` 16000 piensan más y llevan el
 * doble.
 */
export const TIMEOUT_MS: Record<Pieza, number> = {
  carnet: 120_000,
  documento: 60_000,
  nota_clinica: 120_000,
  presencia: 60_000,
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
