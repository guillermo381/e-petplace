/**
 * CodigoFirmaInput — EL CÓDIGO QUE FIRMA UN ACTA (S112-B, B4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **NO ES UN CAMPO NUEVO: ES `CampoCodigo` CON DOS DECISIONES PUESTAS.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El censo dio que la casa ya resuelve casi todo el pedido: `CampoCodigo`
 * tiene el largo por prop (sin default, *«la pieza no sabe cuánto mide un
 * código»*), el pegado desde el portapapeles **por la misma puerta que el
 * tipeo** —así que «código: 1234-5678» deposita los ocho dígitos— y el
 * mensaje inline en un slot de altura reservada, que no empuja nada.
 *
 * ⇒ **Lo único que faltaba era una decisión de la casa, y se hizo ensanche,
 * no copia** (`L-175`): `CampoCodigo` gana `tono`, y con él `PieDeCampo` —la
 * anatomía compartida por las tres piezas de campo—. Escribirlo en un
 * `CampoCodigo` clonado habría dejado a `Campo` y `CampoFecha` sin la
 * distinción el día que la necesiten.
 *
 * ── POR QUÉ EXISTE ESTA PIEZA IGUAL, si es tan fina ──────────────────────
 * Porque las dos decisiones que pone **no se pueden delegar a dos pantallas
 * distintas**: el acta se firma desde la app de la familia Y desde la del
 * refugio, y son dos montajes. *Un `<CampoCodigo largo={8} tono="estado" />`
 * escrito dos veces es un `largo={6}` esperando a pasar, y un `tono` que se
 * olvida en una de las dos.* Acá el 8 y el tono son del vertical, no de la
 * pantalla.
 *
 * ── 🔴 EL TONO: N23, Y ES LA DECISIÓN DE FONDO ───────────────────────────
 * Los tres mensajes que este campo puede dar —**vencido · equivocado ·
 * intentos agotados**— van **sin rojo de alarma**. *El acento se reserva
 * para lo accionable y para lo que necesita alarma, y ninguno de los tres es
 * eso: son el ESTADO de un código.* Pintarlos de rojo le dice a la persona
 * que hizo algo mal en el momento más cargado de todo el recorrido —está
 * firmando una adopción— cuando lo único que hay que hacer es pedir otro
 * código.
 *
 * ⚠️ **Y esto sí es un apartamiento de N12.4, declarado en vez de
 * disimulado:** la ley general dice que el error del formulario va en rojo y
 * dice qué está mal y cómo se arregla. La segunda mitad se cumple entera —el
 * mensaje lo redacta la pantalla y tiene que decir cómo se sigue—; la
 * primera se aparta **por firma del founder para este caso**. *Una ley que
 * se estira en silencio deja de ser ley*, así que queda escrito acá y no en
 * un parte.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La pantalla del acta en las DOS apps (C8), sobre `solicitar_codigo_firma`
 * y `firmar_acta_adopcion`. **Entregada y no montada.**
 */
import { CampoCodigo } from './CampoCodigo'

/** Los ocho dígitos que el servidor manda por correo (§5.5). */
const LARGO_CODIGO_FIRMA = 8

export type CodigoFirmaInputProps = {
  /** El código tal como va. Sólo dígitos: la pieza ya lo saneó. */
  valor: string
  /** Recibe el valor saneado, cortado a 8. */
  onCambio: (valor: string) => void
  /** Label visible y accesible. Lo trae la pantalla (Ley 3). */
  etiqueta: string
  /** Helper bajo el campo — «Te lo mandamos a tu correo», por ejemplo. */
  ayuda?: string
  /**
   * Vencido · equivocado · intentos agotados. **Redactado por la pantalla,
   * con el motor como fuente** — la pieza no tiene ninguno de los tres, y
   * no puede tenerlos: qué pasó lo sabe `firmar_acta_adopcion`.
   */
  mensaje?: string
  deshabilitado?: boolean
}

export function CodigoFirmaInput({
  valor,
  onCambio,
  etiqueta,
  ayuda,
  mensaje,
  deshabilitado = false,
}: CodigoFirmaInputProps) {
  return (
    <CampoCodigo
      largo={LARGO_CODIGO_FIRMA}
      valor={valor}
      onCambio={onCambio}
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={mensaje}
      /* Lo que esta pieza existe para no dejar librado a la pantalla. */
      tono="estado"
      deshabilitado={deshabilitado}
    />
  )
}
