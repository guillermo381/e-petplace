/**
 * LA PUERTA DE ADOPCIÓN — apagada hasta su lote (S112-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **POR QUÉ EXISTE ESTA CONSTANTE Y NO SE BORRÓ EL CÓDIGO.**
 *
 * El lote que el founder recorre esta noche es **guardería**, y la orden de
 * mesa fue explícita: *«nada de adopción alcanzable antes de ese SHA; si ya
 * montaste una puerta a medias, dejala inalcanzable hasta el lote de
 * adopción»*.
 *
 * Las dos entradas **ya están construidas y verificadas** (Explorar y el hogar
 * sin mascotas). Borrarlas para volver a escribirlas en dos días sería tirar
 * trabajo verde; dejarlas encendidas metería una vertical entera en un lote de
 * gate ajeno. **La constante es el interruptor**, y es el precedente exacto de
 * la casa: `VITRINA_GATE_ABIERTO` en S78 hizo esto mismo con la vitrina del
 * prestador — *construir SÍ, encender NO*.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ **SU CONDICIÓN DE MUERTE, ESCRITA para que no se vuelva permanente por
 * accidente:** se pone en `true` —y esta constante se borra con sus dos
 * lectores— **el día que abra el lote de adopción**. *Un interruptor sin fecha
 * de retiro es cómo una función terminada queda apagada seis meses.*
 *
 * **Lo que NO gatea, a propósito:** la vidriera (`/adoptar`) y el hilo siguen
 * existiendo como rutas. Quien tenga el link entra — **no son secreto ni dato
 * ajeno**, y la puerta sin sesión desde el login es de S111-C y ya estaba
 * gateada por su propia letra. Lo que esta constante apaga es el
 * DESCUBRIMIENTO: que la adopción aparezca sola delante de alguien que entró a
 * mirar su guardería.
 */
export const ADOPCION_ALCANZABLE = false;
