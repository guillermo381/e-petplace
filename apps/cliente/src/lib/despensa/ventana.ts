/**
 * LA VENTANA DE ENTREGA QUE YA PASÓ — el predicado, en UN solo lugar
 * (S100d-D · firma del founder).
 *
 * ── QUÉ DECIDE, Y QUÉ NO ───────────────────────────────────────────────
 * Decide **una sola cosa**: si la ventana prometida ya venció con margen.
 * **No decide la voz ni el lugar**: cada superficie la compone con su
 * gramática. *Una función que además eligiera el texto obligaría a las
 * cuatro pantallas a hablar igual aunque tengan formas distintas.*
 *
 * ── 🔴 POR QUÉ EXISTE ─────────────────────────────────────────────────
 * Firma del founder: *cuando la ventana ya pasó, la app dice que **está
 * tardando más de lo previsto***. Sin esto, una familia lee «llega entre
 * 9:00 y 13:00» a las tres de la tarde — **la app afirmando un futuro que
 * ya no existe**.
 *
 * Y con dos límites que son parte de la firma:
 *  · **la ventana NO se borra ni se reemplaza**: se le agrega la voz. *Lo
 *    prometido sigue siendo un dato — es contra eso que se mide el atraso.*
 *  · **no se dice «demorado» ni nada que atribuya culpa**. La app sabe que
 *    la hora pasó; **no sabe por qué**, y no puede sostener una acusación
 *    contra el vendedor con lo que tiene. *Describir lo que la familia ya
 *    está viendo no es acusar a nadie.*
 *
 * ── 🔴 EL UMBRAL: 20 MINUTOS, Y **NO SALE DEL COMPORTAMIENTO** ─────────
 * Lo declaro así de fuerte porque la tentación es citarlo como medido.
 *
 * **Lo que se midió y por qué no alcanza** (base viva, 18-ago-2026):
 * hay **UNA sola entrega con ventana** y llegó **~20 horas ANTES** de su
 * rango; **cero entregas tarde**. ⇒ *no existe distribución de atraso real
 * contra la cual calibrar nada.* **Un número sacado de una muestra de uno
 * sería una cifra inventada con aspecto de medición.**
 *
 * **De dónde SÍ sale, que es lo que sí tiene dato:** las ventanas vivas
 * miden **4 h** y **24 h** (30 pedidos, dos anchos) ⇒ 20 minutos es el
 * **8 % de la ventana más angosta**: suficiente para no gritar por un
 * minuto —*un pedido que dice «tarda» treinta segundos después del rango
 * es tan mudo como no decir nada*— y bastante menos que el tiempo en que
 * una familia ya lo concluyó sola.
 *
 * ⚠️ **Es UN número en UN lugar y se cambia en una línea.** El día que
 * haya entregas reales tarde, **este umbral se recalibra contra ellas** —
 * y ahí sí será medido. *Hasta entonces está elegido, y se dice.*
 *
 * ── EL DATO DE HOY, para que un verde no se lea como suerte ────────────
 * **27 de 30 pedidos con ventana la tienen vencida hace más de 20 minutos**
 * ⇒ en la cuenta del gate **esta voz va a aparecer casi siempre**. No es un
 * borde raro: es el caso dominante de esta base, porque su tráfico es de
 * prueba y quedó viejo.
 */

/** Los minutos de gracia después del fin de la ventana. Ver la cabecera:
 *  **elegido, no medido**, y con su razón. */
export const GRACIA_VENTANA_MIN = 20;

/**
 * ¿La ventana prometida ya pasó, con margen?
 *
 * `null` en la promesa ⇒ **false**: sin ventana no hay nada que vencer, y
 * *un pedido sin promesa no está tarde: está sin promesa* (L-139 — un nulo
 * no se lee como un valor).
 *
 * `ahora` entra por parámetro para que la decisión sea **probable sin
 * esperar**: una función que lee el reloj adentro solo se puede verificar
 * el día que el reloj coopere.
 */
export function ventanaVencida(promesaHasta: string | null, ahora: number = Date.now()): boolean {
  if (promesaHasta === null) return false;
  const fin = Date.parse(promesaHasta);
  if (Number.isNaN(fin)) return false;
  return ahora - fin > GRACIA_VENTANA_MIN * 60_000;
}
