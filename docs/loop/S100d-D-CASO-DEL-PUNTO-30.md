# CASO DEL PUNTO 30 — los pedidos en vuelo en el Hogar, listos para el ojo

> **Para el founder, para el próximo gate.** El punto 30 del gate de S100c dice:
> *«Pedidos en vuelo en el Hogar — construido por D en S100c, SIN ojo del
> founder aún»*, con dueño **D prepara el caso; founder lo mira**.
>
> Esto no construye nada nuevo: **dice exactamente qué vas a ver, dónde, y qué
> tiene que decirte si está bien.** Todo lo de acá está **medido contra la base
> viva el 18-ago-2026**, no estimado.

---

## ① DÓNDE MIRARLO — tres toques, sin buscar

1. Abrí la app del **cliente** con la cuenta **`guillo381+8@gmail.com`**
   (`user_id` `dd024680-…`). **Es la cuenta que tiene los pedidos**; con otra
   cuenta la fila no aparece y eso sería correcto, no un defecto.
2. Andá al tab **Hogar** (el primero).
3. La fila está en la sección **«Ponte al día»**, y es la **PRIMERA de la
   primera sección de contenido** — arriba del techo solo están el saludo y la
   entrada del Coach.

**No hay que scrollear, no hay que abrir un «Ver más».** Si tenés que hacer
alguna de las dos cosas, eso ya es un hallazgo y hay que anotarlo.

---

## ② QUÉ VAS A VER, LITERAL

> **Tenés 12 pedidos en curso**
> 13 de agosto, 09:00–12:00

- **El glifo:** el de la despensa, en capa *cuidado*.
- **Al tocarla:** te lleva a **la casa de Pedidos** (`/pedidos`), la lista
  entera. *No te lleva a un pedido: son doce, y elegir uno por vos sería
  inventar cuál te importa.*
- **Si hubiera UN SOLO pedido en vuelo**, la fila diría el estado de ese
  (*«Tu pedido va en camino»*) y te llevaría **directo a ese pedido** — a
  **EN CAMINO** si va en camino, y a su detalle si todavía se está preparando.
  Hoy no vas a ver ese caso, porque hay doce.

**Los números de hoy, medidos:** 12 pedidos en vuelo = **10 preparando + 2 en
camino** · 0 confirmados · **26 pedidos en total** en esa cuenta.

---

## ③ 🔴 LO QUE VAS A VER Y **NO** ES UN DEFECTO DE LA FILA — dicho antes para que no te lo coma

**La fecha que sale debajo es del 13 de agosto, y hoy es 18.** No está rota la
fila: **ésa es la ventana que el pedido tiene guardada**, y esos pedidos son
tráfico de prueba que quedó «en camino» durante cinco días.

**Cómo se elige esa fecha, para que puedas juzgarla:** entre los doce preside
**el más avanzado** (en camino le gana a preparando) y, entre los empatados, el
de **promesa más próxima**. La fecha que ves es la de ése.

🔴 **Y acá hay una pregunta de producto que NO decido yo y que este caso
destapa, porque con datos reales va a pasar igual:**

> **¿Qué dice la app cuando la ventana prometida ya se venció y el pedido
> sigue en camino?**

Hoy la fila **muestra la ventana como si fuera futura**. Con un pedido real que
se demora, una familia leería *«llega entre 09:00 y 12:00»* a las tres de la
tarde. **No lo curé por mi cuenta y digo por qué:** decir *«demorado»* es una
acusación al vendedor que la app no puede sostener con lo que sabe, y esconder
la ventana deja la fila sin decir nada. **Las dos salidas son decisión de mesa,
no de pantalla** — van servidas, no resueltas.

---

## ④ POR QUÉ LA FILA ESTÁ ARRIBA Y NO ENTERRADA — medido, no supuesto

«Ponte al día» muestra **tres filas** y esconde el resto detrás de un
*«Ver N más»*. La fila del pedido entra **cuarta en el orden del código**
(después de autorizaciones, presupuestos y citas por coordinar), así que la
pregunta real era: *¿queda adentro de las tres?*

**Medido hoy en esa cuenta:**

| lo que va antes | cuántos hay |
|---|---|
| autorizaciones pendientes | **0** |
| presupuestos esperando respuesta | **0** |
| citas por coordinar | **0** *(medido: cero citas sin fecha)* |
| **⇒ el pedido en vuelo** | **la fila nº 1** |

⚠️ **Y el revés, que es lo que hay que saber:** el día que aparezca una
autorización, un presupuesto y una cita por coordinar **al mismo tiempo**, la
fila del pedido **se va detrás del «Ver más»** — porque lo que espera una
ACCIÓN tuya va primero, y un pedido en vuelo es información. *Eso es letra
firmada (`DISEÑO_EXPERIENCIA` §10ter.1) y está bien; se dice acá para que si
un día no la ves, sepas que no se rompió: se corrió.*

---

## ⑤ ⚠️ LA FRAGILIDAD DEL CASO, CON SU NÚMERO — por si el gate se corre unos días

La fila se arma con **los últimos 30 pedidos** de la cuenta. Hoy hay **26**.

⇒ **el margen es de 4 pedidos.** Si entre hoy y el gate se crean **cinco o más
pedidos nuevos** en esa cuenta, **el más viejo de los que están en vuelo se cae
de la ventana** y la fila diría «11 en curso» en vez de «12». *No rompe nada
—la fila sigue estando— pero el número deja de cerrar contra este documento, y
quiero que si eso pasa se lea como lo que es: la ventana de 30, no un defecto.*

---

## ⑥ LO QUE ESTE CASO **NO** COMPRUEBA, dicho sin maquillar

- **Nadie lo vio en un teléfono.** Al 18-ago-2026, **A, B y D corrimos
  `adb devices` y las tres devolvieron la lista vacía**: no hay aparato
  conectado en ninguna pista. Todo lo de arriba está medido contra **la base y
  la fuente**, que es lo que sí se puede medir sin teléfono — *cuántas filas
  hay, en qué orden entran y qué texto arma cada una*. **Lo que ningún
  instrumento contesta es si se VE bien**, y ése es justamente el trabajo del
  ojo del founder.
- **No se sembró ni se movió un solo dato para que el caso se viera mejor.**
  Los 12 pedidos en vuelo son los que ya estaban. *Si hubiera acomodado la
  cuenta, el gate estaría mirando un decorado.*

---

## ⑦ LAS TRES PREGUNTAS QUE EL OJO CONTESTA Y NINGÚN INSTRUMENTO

1. **«Tenés 12 pedidos en curso»** — ¿alcanza colapsado, o querés **una fila
   por pedido**? *(La letra dice colapsar lo informativo; con doce, sin
   colapso, «Ponte al día» se convierte en una lista de pedidos y las vacunas
   quedan detrás del «Ver 12 más». Pero eso es la letra, y el ojo manda.)*
2. **La fecha vieja** — ¿la dejamos como está, o la app tiene que decir algo
   cuando la ventana se venció? (§③).
3. **El lugar** — ¿la fila del pedido va antes o después de la alerta de
   vacuna? Hoy va **antes**, con esta razón: *una entrega de hoy tiene hora; un
   refuerzo de vacuna tiene semanas.* **Es una línea moverla.**
