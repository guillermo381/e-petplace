/**
 * GRABAR LA PLACA — los estados, aparte de la pieza (S113-B · 1.3 · B6).
 *
 * Su gate los mide **sin montar React**, que es la única forma de probar que
 * *un fallo sin salida no se puede escribir* sin mirar una pantalla.
 *
 * ── 🔴 POR QUÉ ESTA PIEZA NO TOCA NFC, Y ES UNA DECISIÓN Y NO UNA FALTA ──
 * Escribir un tag exige **módulo nativo**, y lo nativo **no viaja por OTA**:
 * una pieza de `packages/ui` que importara NFC dejaría a `packages/ui` sin
 * poder publicarse sin una build. ⇒ **la escritura la hace quien tenga la
 * capacidad y acá llega el RESULTADO.** Es el mismo reparto con el que el
 * dictado vive en el prestador y no en el design system.
 *
 * *No es que la pieza «no sepa» escribir: es que si supiera, todo el paquete
 * tendría que viajar en una build.*
 *
 * ── LOS CINCO FINALES, Y TRES NO SON ERRORES ────────────────────────────
 * Una placa que **ya estaba activada** y una que **no es de e-PetPlace** no
 * son fallas de quien la acercó: son hechos del mundo. *Pintarlas de rojo le
 * cobra a la persona algo que no hizo* — misma doctrina con la que un código
 * de firma vencido no se pinta de alarma. El único rojo es el fallo, y el
 * fallo **exige su salida**.
 */

/**
 * 🔴 **UN FALLO SIN SALIDA NO COMPILA.** Es el estado más caro de esta
 * pantalla: la persona acercó la placa, algo salió mal, y si no puede
 * reintentar se queda con una placa a medio escribir y sin saber si sirve.
 *
 * ⚠️ Y `ya_estaba` lleva su salida OPCIONAL a propósito: *ver la placa que ya
 * existe es útil, pero no ofrecerlo no deja a nadie encerrado* — la Hoja se
 * cierra y la placa sigue funcionando.
 */
export type EstadoTag =
  /** Esperando que acerquen la placa. */
  | { fase: 'acercar' }
  /** Detectada: escribiendo. **No se puede cancelar acá** — cancelar a mitad
   *  de una escritura es lo que deja una placa a medias. */
  | { fase: 'escribiendo' }
  /** *«Quedó activada para Thor»* — ya compuesta (Ley 3). */
  | { fase: 'lista'; voz: string }
  /** No es un error: la placa ya tenía dueño. */
  | { fase: 'ya_estaba'; voz: string; onVerla?: () => void }
  /** Tampoco: es una placa de otro sistema, o una tarjeta cualquiera. */
  | { fase: 'ajena'; voz: string }
  /** 🔴 El único rojo, y con salida obligatoria. */
  | { fase: 'fallo'; voz: string; onReintentar: () => void }

/** ¿Está pasando algo ahora mismo? Las dos fases vivas comparten que **la
 *  Hoja no se puede cerrar de un toque al costado**: *cerrar mientras se
 *  escribe deja la placa a medias y a la persona sin saberlo.* */
export function enCurso(e: EstadoTag): boolean {
  return e.fase === 'acercar' || e.fase === 'escribiendo'
}

/**
 * ¿Terminó bien? **`ya_estaba` cuenta como terminado y NO como error**: la
 * placa funciona, sólo que no es de esta mascota.
 */
export function termino(e: EstadoTag): boolean {
  return e.fase === 'lista' || e.fase === 'ya_estaba' || e.fase === 'ajena'
}

/**
 * 🔴 **EL ÚNICO QUE SE PINTA DE ALARMA.** *Una placa que ya tenía dueño y una
 * que no es nuestra no son fallas de quien la acercó, y cobrárselas en rojo
 * enseña a tenerle miedo a una pantalla que no hizo nada malo.*
 */
export function esAlarma(e: EstadoTag): boolean {
  return e.fase === 'fallo'
}
