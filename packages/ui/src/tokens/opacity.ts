/**
 * e-PetPlace — Design Tokens v4 · OPACIDAD
 * Nace en B3.1 con el estado disabled del Botón: atenuación sin cambio
 * de hue (el color deshabilitado sigue siendo SU color, más callado).
 */

export const opacity = {
  disabled: 0.45,

  /** LA LUZ DE LA ESQUINA — **7% FIRMADO** (`DIRECCION_ARTE` §9bis.2,
   *  A4, firma del founder 26-jul-2026): círculo desbordando por la
   *  esquina superior derecha, diámetro ~60% del ancho, centro fuera del
   *  lienzo. *«Es el ÚNICO adorno permitido en un techo.»*
   *
   *  NACE COMO TOKEN AHORA, y no antes, porque hasta hoy el alfa vivía
   *  tecleado en cada techo que la montaba. Lo pide su propia letra: la
   *  ENMIENDA S82 de §9bis.2 dice que **el valor sale del token del
   *  tema, jamás de un literal** — y esa enmienda se escribió para el
   *  COLOR (blanco sobre techo oscuro, tinta sobre claro), dejando el
   *  alfa suelto. Un adorno firmado cuyo número se re-teclea es el
   *  mismo hueco que N10 tenía con las duraciones.
   *
   *  ⚠️ EL ALFA ES EL FIRMADO Y NO SE MODULA: lo que cambia por contexto
   *  es el REGISTRO del color (`text.primary` del tema resuelve las dos
   *  caras), nunca el 7%. */
  luzDeEsquina: 0.07,
  /** LA MARCA DE AGUA del fondo — **0.045 FIRMADO (founder, 2-ago-2026,
   *  S84-B6)**, un solo valor para las DOS casas.
   *
   *  ENMIENDA CON FECHA, y el texto viejo se CONSERVA porque explica qué
   *  se enmienda: el 0.06 llegó por firma del founder en S83-B22
   *  (*"no puedes copiar cómo quedó en cliente? Allí quedó bien"*), y
   *  antes por S82-B r10 con esta letra — *"0.06 y no 0.05: el Hogar
   *  está FIRMADO en 0.06 y lo firmado no se mueve para promediar; el
   *  perfil, que vivía en 0.04 por copia, SUBE"*. Las dos son del
   *  founder; la de S84 gana por ser la última y por venir de mirar la
   *  pieza ya montada en las dos casas.
   *
   *  EL PEDIDO Y SU TRADUCCIÓN: *"que se vea 25 a 40% menos"*. La
   *  magnitud que el ojo lee no es el ratio crudo sino su EXCESO sobre
   *  1.000 — medido sobre el prestador oscuro: 0.045 da 0.106 contra los
   *  0.148 de hoy, o sea **−28%**, dentro del rango. (0.035 daba −45% y
   *  0.03 −59%: los dos se pasaban.)
   *
   *  EL COSTO DE UN VALOR ÚNICO, escrito para no reabrirlo: los dos
   *  tapices oscuros están a % distinto (prestador 5%, cliente 3%), así
   *  que el mismo alfa cae sobre luminancias distintas y el agua siempre
   *  va a leerse un poco más en el prestador oscuro (1.106 contra
   *  1.070). Es de la FORMA elegida, no del número.
   *
   *  ☠️ LA RESERVA MURIÓ CON SU CONDICIÓN CUMPLIDA (firma founder en
   *  dispositivo, group d139b9c0 sobre la APK 1.0.3): **0.045 quedó**.
   *  La reserva era 0.040 (0.093 = −38%, también dentro del rango) y su
   *  condición era *"si en el teléfono 0.045 sigue pareciendo presente"*
   *  — el ojo dijo que no. **No se retira el NÚMERO, se retira su
   *  vigencia**: queda escrito para que quien alguna vez quiera bajar
   *  más no repita la medición, pero YA NO ES UNA OPCIÓN PENDIENTE.
   *  Y la enmienda de B22 cierra donde tenía que cerrar: se firmó sobre
   *  PANTALLA, no sobre mis números. Los números sirvieron para elegir
   *  QUÉ mirar — no para decidir.
   *
   *  UN número, una vez: mientras el agua viva copiada por pantalla se
   *  va a volver a separar (ya lo hizo — 0.06 contra 0.04, hallazgo r8). */
  marcaDeAgua: 0.045,
} as const
