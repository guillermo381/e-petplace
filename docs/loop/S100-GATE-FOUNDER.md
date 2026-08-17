# S100 · GATE DEL FOUNDER — **NO PASA**

> **Registro, no cura.** Por orden de mesa: se anota entero, con dueño propuesto
> por hallazgo, y **no se toca nada**. S101 lo toma con plan.
> **Ancla del recorrido:** `main` `9baed84a` · OTA cliente `5d7a2320` (rt 1.0.3)
> · OTA prestador `cef75285` (rt 1.0.5).
>
> **EL VEREDICTO, VERBATIM:** *«no se ve delicado, no se ve fino»*.
> Y lo que hay que leer antes que la lista: **el gate no falla por lo que falta
> por dato — falla por la FORMA.** La pregunta que la Dirección de Diseño fija
> para toda pantalla nueva es *«¿artesano, u obrero?»*, y esta ronda contestó
> obrero.

---

## §1 · TRES DEFECTOS DE FUNCIONAMIENTO — rojo, no gusto

| # | qué | dueño propuesto |
|---|---|---|
| **G-01** | 🔴 **EL STEPPER NO AUMENTA.** El `+` pone 1, aparece el `−`, y **no hay camino a 2**. ⇒ **comprar más de una unidad está roto en TODA la vitrina.** Y con cantidad 1 el número queda casi fuera del recuadro. | **C** (vitrina/ficha) + **B** si la pieza es de `packages/ui` |
| **G-02** | 🔴 **CONTENIDO TAPADO** en la ficha, debajo de *«está pensado para perros»*: hay algo que no se ve. | **C** |
| **G-03** | 🔴 **«¿PARA QUIÉN ES?» OFRECE ESPECIES IMPOSIBLES** — alimento de perro ofreciendo loro, hámster y pez. **Y la donación, una vez marcada, NO SE PUEDE DESMARCAR.** | **A** (el destino del ítem es del carrito) + **C** (la ficha) |

> **G-01 es el más grave de los tres y conviene decir por qué:** no es una
> pantalla fea, es **una tienda donde no se puede comprar dos de algo**. Y su
> modo de falla es de los que no gritan: el `−` aparece, así que la pieza
> *parece* funcionar.
>
> **G-03 tiene dos mitades distintas:** ofrecer una especie imposible es un
> filtro que falta (el producto declara `especies_aplicables` y el selector no
> lo mira); **la donación que no se desmarca es un estado sin salida**, que es
> peor — *un control que entra y no sale no es un control, es una trampa.*

---

## §2 · DOCE DE FORMA — el juicio es *«no se ve delicado, no se ve fino»*

| # | qué | dueño propuesto |
|---|---|---|
| **G-04** | 🔴 **LA PRIMERA PANTALLA DE DESPENSA NO MUESTRA UN SOLO PRODUCTO.** Buscador + espacio muerto + la voz de «elegí una mascota» + el contador 50/563 + los filtros + el carrito **consumen el 100 % del alto**. **Se repiensa entera.** | **C** + receta de **B** |
| **G-05** | **LAS IMÁGENES NO LLENAN SU CAJA**: mucho blanco, la foto corrida a un lado. En la ficha, **un marco púrpura con la imagen flotando al centro**. Pasa en vitrina, ficha y carrito. | **B** (la pieza) + **C** |
| **G-06** | **EL PRECIO ES DEMASIADO GRANDE** en toda la casa. Vara: **Laika**, que el founder tiene en la mano — *allá el precio manda sin gritar*. | **B** |
| **G-07** | **EL `+` ES UN CÍRCULO PÚRPURA GRANDE.** Debe ser delicado y distintivo, no un botón que **pesa más que el producto**. | **B** |
| **G-08** | **EL BOTÓN «QUITAR» DEL CARRITO NO SE ENTIENDE.** Estándar: **con cantidad 1 el `−` se convierte en papelera**; no hay botón de texto aparte. | **B** (pieza) + **A** (carrito) |
| **G-09** | **«DONAR ESTE PRODUCTO» OCUPA UN BLOQUE ENORME.** Debe ser **una pastilla, del mismo tamaño y familia que las de mascota** — *es una opción más de «para quién es», no un anuncio.* | **A** + **B** |
| **G-10** | **EL DESTINO SE PREGUNTA UNA VEZ POR PRODUCTO Y SE REPITE ENTERO.** Si ya se eligió mascota, **se hereda**; solo se pregunta si el carrito tiene más de un producto y hace falta repartirlos. | **A** |
| **G-11** | **«CAMBIAR LA DIRECCIÓN» ES UN BOTÓN GRANDE** donde la industria usa **la línea de dirección con chevron** (captura de Laika). **El teléfono NO TIENE SELECTOR DE INDICATIVO.** Y **los datos de entrega deberían MOSTRARSE fijos, no como campos de edición** — editar es otro momento. **Solo «instrucciones» es campo.** | **A** |
| **G-12** | **EL RESUMEN DE ENTREGAS NO TIENE SUPERFICIE**: los bloques están apoyados sobre el fondo, **sin carta**. Y hay **~1 cm muerto** entre los botones fijos y la barra de tabs. | **A** + receta de **B** |
| **G-13** | **«QUE LLEGUE SOLO»**: el bloque de texto explicativo debe ser **un ícono de información con modal**, y **las frecuencias (7/15/30) NO se muestran hasta que el interruptor esté encendido**. | **A** |
| **G-14** | **EL CARRITO NO TIENE ÍCONO EN LA BARRA**: es un botón de texto donde la industria usa **una canasta con su contador**. | **B** (glifo) + **C** |
| **G-15** | **LA ESCALERA MEJORÓ MUCHO** — pero **el círculo de cada nodo con su glifo tiene que ser MÁS GRANDE**. Y **falta acceso a «mis pedidos» desde la primera pantalla de Despensa**. | **D** + **B** |

> **G-04 es el que ordena a los demás, y merece su frase:** *una vitrina que no
> muestra mercadería no es una vitrina.* Los otros once son ajustes sobre
> superficies que existen; éste dice que **la superficie está mal pensada**.
>
> **Y hay un patrón entre G-05, G-06, G-07 y G-09** que conviene no tratar como
> cuatro ítems sueltos: **en las cuatro, el CONTROL o el CONTENEDOR pesa más que
> el PRODUCTO** — el marco sobre la foto, el precio sobre el nombre, el `+`
> sobre la cosa que se compra, el anuncio de donación sobre la opción. *Lo que
> el founder llamó «no se ve fino» tiene una causa medible: la jerarquía está
> invertida a favor de lo que la app hace y en contra de lo que la familia
> mira.*

---

## §3 · 🔴 G-16 · UNA FIRMA INCUMPLIDA — Y LA CULPA ES DE LA MESA, NO DE UNA PISTA

**«PROGRAMAR OTRA FECHA» SIGUE AHÍ.** El founder lo pidió quitar
**repetidamente** y **vuelve a aparecer cada vez**.

**La causa es conocida y hoy la nombró C: *una decisión que no queda escrita se
vuelve a proponer.*** No es que alguien desobedeciera — es que **la letra
firmada dice lo contrario y la letra gana**, porque es lo único que la pista
siguiente lee.

**Dónde vive la contradicción, medido:**
- `LETRA_RECORRIDO_DESPENSA_S96.md` **§6.2 · «Programar la fecha de entrega —
  ENTRA»**, y su ítem **9** de la lista de firmas.
- `MODELO_DESPENSA.md` líneas **53** y **1674** («fecha programada con cupo por
  día futuro») dentro del alcance v1.
- El código: `checkout.tsx` (el `onProgramarOtra` del `SelectorVentana` y el
  `CampoFecha`) + las claves `despensa.programarFecha` / `programarPlaceholder`.

**⇒ Esta vez la firma va AL CANON, no a un prompt.** Depositada en la letra que
la contradecía, con su fecha y su razón, **tachando y no borrando** (convención
de la casa: la letra vieja se conserva para que el próximo censo no la
redescubra). **Y se mecaniza en `verify:diseno`**, porque *una ley que vive en
el lint no se degrada.*

---

## §4 · LO QUE EL GATE **SÍ** DEJÓ EN VERDE

Se anota porque un registro que solo lista lo malo no deja saber qué no volver a
tocar:
- **La escalera de estados «mejoró mucho»** (G-15 es un ajuste de tamaño sobre
  algo que el founder aprobó de fondo).
- Nada más se declaró verde. **El resto del recorrido no recibió veredicto
  positivo explícito**, y por la regla de la casa **eso no se lee como verde**:
  se lee como no juzgado.

---

## §5 · LO QUE NO SE TOCÓ, Y ESO ES LA ORDEN

**Cero curas.** Ningún hallazgo de §1 ni §2 fue modificado. Lo único que se
escribió es **§3**, porque la orden de mesa para G-16 era explícitamente
depositar la firma en el canon.

**Y el dato que S101 necesita para no confundir forma con dato:**
- **5 de 6 fichas de repartidor salen sin placa** — por DATO, no por lector.
- **2 de 4 envíos tienen destino** — el mapa no se dibuja en los otros dos.
- **80 de 563 ofertas publicadas están sin stock** (14 % de la vitrina).
- Sujeto vivo del gate, reconfirmado: envío `474e6ff6` · 6 puntos · destino ·
  `hacia_destino` · placa `PBA-0142`.
