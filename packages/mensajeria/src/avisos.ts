/**
 * EL ENCHUFE DE NOTIFICACIONES DEL VERTICAL — puro.
 *
 * Traduce un HECHO del vertical a la INTENCIÓN de aviso que el motor de
 * `MODELO_NOTIFICACIONES` sabe despachar. No arma texto: devuelve tipo,
 * categoría, audiencia y destinatario. **La voz es de la superficie.**
 *
 * ── DE DÓNDE SALEN LAS CATEGORÍAS, y no las inventé ────────────────────────
 * `MODELO_NOTIFICACIONES` §3 define `relacional` como *«mensajes, respuesta a
 * una solicitud»* — literal, es este caso. Y el criterio firmado en S87 para
 * clasificar un tipo nuevo: *«la categoría la decide de QUIÉN es el hecho (la
 * cuenta · el cuerpo de la mascota · el proceso contratado · otra persona · el
 * negocio), jamás quién lo mira»*.
 *
 * ⇒ por eso `adopcion_sin_respuesta` es `operacion` y no `relacional`: **no lo
 * dice una persona, es el ESTADO de un proceso que la familia inició.**
 * Precedente exacto: S87 mandó `documento_aprobado` / `prestador_aprobado` a
 * `operacion` con esa misma razón.
 *
 * ⚠️ `notificaciones.tipo` tiene CHECK CERRADO de 26 valores (medido S87): cada
 * tipo de acá **exige su migración**, y va pedida en el contrato a A.
 */

import { avisaAlPadrino, type CausaFinPadrinazgo } from './padrinazgo';

export type CategoriaAviso = 'relacional' | 'operacion';
export type AudienciaAviso = 'cliente' | 'prestador' | 'ambas';

export type TipoAviso =
  | 'adopcion_solicitud_nueva'
  | 'adopcion_mensaje_nuevo'
  | 'adopcion_solicitud_respondida'
  | 'adopcion_sin_respuesta'
  | 'padrinazgo_ahijado_adoptado'
  | 'padrinazgo_refugio_inactivo';

export interface IntencionAviso {
  readonly tipo: TipoAviso;
  readonly categoria: CategoriaAviso;
  readonly audiencia: AudienciaAviso;
  readonly destinatarioUserId: string;
  /** Clave de dedupe, como la casa ya la usa: un hecho, un aviso. */
  readonly claveDedup: string;
}

const CATALOGO: Readonly<Record<TipoAviso, { categoria: CategoriaAviso; audiencia: AudienciaAviso }>> = {
  adopcion_solicitud_nueva:      { categoria: 'relacional', audiencia: 'prestador' },
  adopcion_mensaje_nuevo:        { categoria: 'relacional', audiencia: 'ambas' },
  adopcion_solicitud_respondida: { categoria: 'relacional', audiencia: 'cliente' },
  adopcion_sin_respuesta:        { categoria: 'operacion',  audiencia: 'cliente' },
  padrinazgo_ahijado_adoptado:   { categoria: 'relacional', audiencia: 'cliente' },
  padrinazgo_refugio_inactivo:   { categoria: 'operacion',  audiencia: 'cliente' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   ☠️ `silencio_detectado` — RETIRADO EN S112-D. No volvió a otro lado: **su ley
   vive ahora en SQL**, y este archivo dejó de ser uno de los dos lugares.

   **Por qué murió, medido:** tenía **CERO productores** (aparecía sólo acá y en
   su propio test) y el barrido de los 5 días **es un cron de SQL**, que jamás
   llama a este módulo. Era *motor sin puerta* — y peor: **el segundo de dos
   mecanismos de «una sola vez» para el mismo aviso**, cada uno pareciendo
   respaldado por el otro y **ninguno corriendo**.

   **Dónde vive hoy cada mitad que este caso tenía adentro** — no hay que
   buscarlas:
   - *«suena UNA vez»* → `adopcion_solicitud.aviso_silencio_emitido_en`, sellado
     en el mismo acto que la emisión, **con el `UNIQUE (clave_dedup)` de
     `notificacion_intencion` como piso**. Las dos capas de `L-424`.
   - *«el memorial lo apaga»* → el `WHERE m.estado_vida IS NOT DISTINCT FROM
     'activa'` de `avisar_adopcion_sin_respuesta()`, **y ahí es obligatorio**:
     con `p_mascota_id => NULL` el GATE 1 del motor de avisos no corre.
   - *la categoría `operacion`* → `cat_notificacion_tipos`, que es donde el
     motor la lee de verdad.

   ⚠️ **Los otros cuatro `HechoDelVertical` siguen vivos y siguen sin productor.**
   Éste se retira porque su productor **existe y es otro**; los demás todavía
   esperan el suyo. *No se retiran por parecerse a éste.*
   ═══════════════════════════════════════════════════════════════════════════ */
export type HechoDelVertical =
  | { readonly clase: 'solicitud_creada'; readonly solicitudId: string; readonly publicadorUserId: string }
  | { readonly clase: 'mensaje_nuevo'; readonly solicitudId: string; readonly mensajeId: string; readonly destinatarioUserId: string }
  | { readonly clase: 'solicitud_cerrada'; readonly solicitudId: string; readonly solicitanteUserId: string }
  | {
      readonly clase: 'padrinazgo_terminado';
      readonly padrinazgoId: string;
      readonly padrinoUserId: string;
      readonly causa: CausaFinPadrinazgo;
    };

export interface ContextoAviso {
  /**
   * ¿La mascota del hecho está en memorial?
   *
   * 🔴 **El memorial apaga este vertical entero, por construcción.**
   * `MODELO_LOYALTY` §7.1 apaga el motor ahí y S88 firmó que la liberación por
   * memorial CALLA. *Ninguno de estos avisos es de `salud_seguridad` ni de
   * `seguridad_cuenta`, que son las dos que sobreviven al memorial — así que
   * ninguno tiene derecho a sonar.*
   */
  readonly mascotaEnMemorial: boolean;
}

function armar(tipo: TipoAviso, destinatarioUserId: string, claveDedup: string): IntencionAviso {
  const c = CATALOGO[tipo];
  return { tipo, categoria: c.categoria, audiencia: c.audiencia, destinatarioUserId, claveDedup };
}

/**
 * Qué avisos salen por este hecho. **Lista, posiblemente vacía** — y vacía es
 * una respuesta legítima, no un error: el memorial y lo estacionado se ven
 * exactamente así.
 */
export function avisosDe(
  hecho: HechoDelVertical,
  ctx: ContextoAviso,
): readonly IntencionAviso[] {
  if (ctx.mascotaEnMemorial) return [];

  switch (hecho.clase) {
    case 'solicitud_creada':
      return [armar('adopcion_solicitud_nueva', hecho.publicadorUserId,
        `adopcion_solicitud_nueva:${hecho.solicitudId}`)];
    case 'mensaje_nuevo':
      return [armar('adopcion_mensaje_nuevo', hecho.destinatarioUserId,
        `adopcion_mensaje_nuevo:${hecho.mensajeId}`)];
    case 'solicitud_cerrada':
      return [armar('adopcion_solicitud_respondida', hecho.solicitanteUserId,
        `adopcion_solicitud_respondida:${hecho.solicitudId}`)];
    case 'padrinazgo_terminado': {
      // 🅿️ `fallecido` devuelve `false` y por eso NO sale aviso. Es la decisión
      // estacionada, no un olvido — y el cobro se detiene igual.
      if (!avisaAlPadrino(hecho.causa)) return [];
      const tipo: TipoAviso =
        hecho.causa === 'adoptado' ? 'padrinazgo_ahijado_adoptado' : 'padrinazgo_refugio_inactivo';
      return [armar(tipo, hecho.padrinoUserId, `${tipo}:${hecho.padrinazgoId}`)];
    }
  }
}
