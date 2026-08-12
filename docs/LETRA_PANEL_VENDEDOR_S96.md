# LETRA — EL PANEL DEL VENDEDOR (S96, mesa founder + arquitecto)

> **Estado: ✅ FIRMADA en todo lo que enumera §0.** Dictada en mesa el
> 12 de agosto de 2026 sobre el arranque de S96 y la medición de S95.
> **Qué es:** la letra de lo que queremos del panel del vendedor y por
> qué. **No aprueba pantallas** — la pantalla se aprueba en la app, en
> la mano del founder. Este documento existe para garantizar que lo que
> se construya sea lo que se quiso.
>
> **Destino:** enmienda a `MODELO_DESPENSA` §8.6 y §11.1 (declarada en
> §11 de esta letra) · nacen D-770 a D-773.
>
> 🔴 **ENMENDADA EL MISMO DÍA POR `LETRA_RECORRIDO_DESPENSA_S96` §12, EN
> CUATRO PUNTOS.** Se marca en la puerta y en cada lugar afectado, no
> solo acá: *dos letras firmadas que se contradicen son peores que una
> equivocada — cualquiera cita la que le conviene y está «en regla».*
> **① El GPS del repartidor pasa de v2 a v1 ⇒ `D-770` NACE MUERTA**
> (§0.6, §8, §12) · **② el repartidor deja de ser «forma sin flujo» y
> gana pantalla mínima** (§5) · **③ el vendedor ya no marca los cuatro
> escalones: marca los tres del local, y el cuarto lo marca quien está
> en la puerta** (§3) · **④ la foto de entrega entra al sistema con
> letra de privacidad propia** (§9 de la letra nueva).
>
> **Lo que NO cambia y sigue siendo el corazón de esta letra:** los
> cuatro escalones, la línea de privacidad frente al vendedor (§4), el
> cupo por recurso confirmado (§7.3) y el estado como dato (§3).
>
> **Contrastes obligatorios:** `MODELO_DESPENSA` v2.0 (§7.4 privacidad
> frente al vendedor · §8 la app única · §10 los casos feos · §11 el
> alcance) · `BIO_EXPEDIENTE` (la ley madre acto/rol: el ACTO decide qué
> se MUESTRA, el ROL decide qué se PUEDE mostrar) · `PORTAL_PRESTADOR`
> nota S95 (`e-PetPlace Negocios`) · `MODELO_LOYALTY` §7 (la compra
> jamás alimenta el loyalty) · L-139, la ley del dato honesto: **jamás
> se promete lo que no se puede cumplir, jamás se muestra un dato
> plausible que no es verdad.**

---

## 0. LO FIRMADO EN ESTA MESA

1. **Son cuatro botones, no tres: preparado · empacado · despachado ·
   entregado.** Sin el cuarto, ninguna compra llega jamás al
   Bio-Expediente, que es la razón de existir de la despensa.
2. **Qué ve el vendedor de la familia:** nombre de contacto, dirección
   con referencia, teléfono, ítems y monto. **Nada de la mascota. Nada
   del expediente. Bajo ninguna configuración.**
3. **La ventana de entrega es parametrizable.** En el arranque: el
   pedido de la mañana llega en la tarde; el de la tarde, en la mañana
   del día siguiente. **El esqueleto soporta el pedido urgente con
   cobro adicional sin construirlo.**
4. **El repartidor es un ROL**, no un actor con app propia. Como es
   rol, lo que ve se decide donde se decide todo: en los permisos del
   servidor.
5. **Tres canales de contacto son el destino: llamada, chat y
   WhatsApp. En v1 se habilita el más simple — la llamada.**
6. ~~**El GPS del repartidor y el mapa de la familia van a v2.**
   Declarados como destino, no construidos.~~ ☠️ **ENMENDADA el mismo
   día** (`LETRA_RECORRIDO_DESPENSA_S96` §9.5): **el GPS ENTRA A v1**
   con el repartidor. *No es construcción nueva — el rastreo en segundo
   plano ya está construido y probado para el paseo.* **El mapa en vivo
   para la familia sigue en v2.**
7. **El cupo del día no se rompe: se suma otro repartidor.** Y el cupo
   es parámetro, jamás número escrito en el código.
8. **La fecha se corre antes que la funcionalidad.** El 15 de
   septiembre deja de ser un cuchillo y pasa a ser una medición.
9. **La prueba en dispositivo antes de mergear la hace el founder o
   Karina**, desde `e-PetPlace Negocios`.

---

## 1. LA TESIS

**El panel es la primera pantalla de e-PetPlace que un tercero usa para
trabajar, no para comprar.**

De ahí sale la vara entera:

> **¿Puede el vendedor, sin que nadie le explique nada, ver un pedido y
> despacharlo?**

Si no se entiende sola, el problema no es la pantalla: es que nadie del
otro lado va a estar para explicarla. En la app del cliente, una
pantalla confusa cuesta una consulta. Acá cuesta un pedido que no sale.

**El mínimo honesto:** la lista de pedidos, los cuatro botones y el
ajuste de stock. Todo lo que crezca más allá de esto es exactamente
cómo *"la despensa"* se convierte en *"una plataforma"*.

---

## 2. LAS TRES PANTALLAS

**Tres, y ninguna más: Hoy · El pedido · Stock.**

### 2.1 Hoy — la lista

**Se ordena por lo que falta hacer, no por hora.** Lo que está por
preparar preside; lo entregado se apaga y baja. El vendedor abre la app
y ve trabajo, no historial.

Encabeza el día con una sola cifra honesta: **cuántos pedidos van sobre
cuántos caben hoy** (§7).

Cada fila dice lo mínimo para decidir cuál agarrar: quién, la ventana
prometida, cuántos ítems, el monto, y en qué escalón está.

### 2.2 El pedido — donde se avanza

Preside la persona y su dirección, porque la pregunta del vendedor
cuando abre un pedido es siempre la misma: *a dónde va esto*.

Debajo: los ítems, la ventana prometida, el tipo de entrega, y **la
escalera de cuatro escalones a la vista** — se ve dónde está y cuánto
falta sin abrir nada.

Y las dos acciones que resuelven el mundo real: **llamar** y **abrir el
mapa**.

### 2.3 Stock — el ajuste

La lista corta de productos con su cantidad. **Todo ajuste pide motivo,
y sin motivo no se guarda.**

**El ajuste jamás se escribe directo contra la tabla: pasa por la misma
puerta que usaría cualquier otro que lo haga.** El inventario es plata:
la autorización y el motivo pertenecen al servidor. *Un ajuste que solo
existe adentro de una pantalla es uno que ninguna automatización futura
puede ejecutar.*

---

## 3. LA ESCALERA DE CUATRO ESCALONES

**Cada paso pide adelante lo que necesita.** El botón no se aprieta y
falla: muestra primero qué le falta. Nada de *"error, faltan datos"* —
el campo está a la vista antes de tocar nada.

| Escalón | Qué pide | Por qué |
|---|---|---|
| **Preparado** | Nada | Es el acto de agarrar el pedido |
| **Empacado** | **Lote y peso real** | *El día que un fabricante retire un lote, esa columna es la diferencia entre poder avisarle a las familias y no poder* |
| **Despachado** | **La factura del vendedor** | En Ecuador la factura electrónica falla. Un pedido empacado sin factura no puede salir. **La factura se registra, no se emite** |
| **Entregado** | Nada | Es el único escalón que deposita en el expediente |

**Tres reglas duras sobre la escalera:**

1. **Las transiciones son dato, no código.** La pantalla pide; el motor
   decide.
2. **Si una transición rebota, la pantalla dice la verdad** — jamás la
   fuerza por otra puerta.
3. **El estado no se pisa, se agrega**, con quién lo movió y cuándo.

### 3.1 Por qué el cuarto escalón no es opcional

`MODELO_DESPENSA` §5.2 pone la confirmación de recepción en la app de
la familia. **Esa pantalla no existe todavía**, y hay un modo de falla
que la haría insuficiente igual: **un pedido que se cierra solo si el
dueño aprieta un botón es un pedido que no se cierra nunca** — el stock
no se libera, el cupo no se recupera, y el evento del expediente no
nace.

**El vendedor marca la entrega. La confirmación de la familia, cuando
exista, es cortesía, no fuente de verdad.**

**Nota de procedencia, para que no se malinterprete la letra del
expediente:** el evento sigue naciendo **aportado por la familia** —
ella compró. Quién apretó el botón es el disparador, no el autor. Un
alimento comprado no tiene el peso de una prescripción veterinaria, y
la pantalla jamás los puede confundir.

---

## 4. QUÉ VE Y QUÉ NO VE EL VENDEDOR

**Ve:** nombre de contacto · dirección con referencia · teléfono ·
ítems · monto · la ventana prometida.

**Jamás ve:** nombre, especie, raza, edad ni condición de la mascota ·
el porqué de la recomendación · compras anteriores · absolutamente nada
del expediente.

> **El rol `seller` no hereda ningún acceso del rol de prestador.** Una
> clínica que además vende alimento ve el expediente **por su oficio de
> prestador**, jamás por haber vendido algo. Un vendedor puro tiene cero
> acceso, sin excepción y sin configuración que lo habilite.
>
> **Se cierra en los permisos del servidor, jamás en la pantalla.**

**Y se ve, no se declara:** el nombre de la mascota no aparece en
ninguna superficie del panel. Es el hilo que conecta una entrega con una
identidad clínica, y no hace falta para entregar una bolsa de alimento.

---

## 5. EL REPARTIDOR — LA FORMA, NO EL FLUJO

**Es un rol dentro de `e-PetPlace Negocios`.** No hay tercera app y no
hay cuarta pantalla.

**Por qué esto importa y no es burocracia:** con un courier hay una
empresa detrás que responde. **Con moto propia, quien llega a la casa
donde vive la familia es alguien del vendedor y nadie más lo
respalda.**

**Se modela hoy:** quién es el repartidor · qué documento · a qué envío
se lo asignó · **un código que la familia verifica en la puerta.**

Con un repartidor es siempre el mismo. **Con tres, sin ese campo, no se
sabe quién entregó qué.** Es una columna hoy y una mudanza con datos
vivos después.

**Su regla de lectura, escrita desde ahora:** el repartidor ve **el
envío asignado a él y nada más**. Ni el catálogo, ni los otros pedidos,
ni el expediente.

~~**No se construye el flujo. Solo la forma.** En v1 el vendedor marca los
cuatro escalones desde su teléfono.~~

> 🔴 **ENMENDADA el mismo día — `LETRA_RECORRIDO_DESPENSA_S96` §9: EL
> REPARTIDOR ENTRA A v1 CON PANTALLA MÍNIMA.** *Mis entregas de hoy*,
> con tres acciones y nada más: **voy hacia acá** · **entregado** (pide
> foto y el código que la familia dice en la puerta) · **no había
> nadie**.
>
> **El vendedor marca los TRES escalones del local; el cuarto lo marca
> quien está en la puerta.** La razón es de hecho, no de preferencia:
> **el paso *vamos hacia vos* solo lo puede marcar quien está manejando**
> — el vendedor en su local no sabe cuál es la próxima casa.
>
> **Lo que NO se movió: qué ve.** Sigue rigiendo palabra por palabra el
> párrafo de arriba — **el envío asignado a él y nada más**, cerrado en
> los permisos del servidor.

---

## 6. LOS TRES CANALES — Y POR QUÉ GANA LA LLAMADA

El problema real es concreto: **el repartidor está en la puerta y no
encuentra la casa.**

**En v1: llamada.** Es el único canal que no exige que nadie tenga la
app abierta. Nadie escribe cuando está arriba de una moto.

**Destino declarado: chat y WhatsApp.** La costura que se deja para que
entren sin mudanza es una sola y es la que importa:

> **El mensaje pertenece al ENVÍO, no a la persona.** Nace cuando el
> pedido se despacha y muere cuando se entrega.

Así, el día que se prenda cualquiera de los dos, el canal ya sabe de qué
pedido habla y cuándo dejar de existir. **Y el alcance del canal es lo
que protege la línea de §4:** un canal atado al envío no es una puerta
abierta a la relación con la familia.

---

## 7. LA VENTANA DE ENTREGA Y EL CUPO

### 7.1 La promesa es una ventana, no una fecha

**Regla del arranque:** pedido de la mañana → llega en la tarde. Pedido
de la tarde → llega en la mañana del día siguiente.

**Los cortes horarios son parámetro.** El founder cambia el corte sin
que nadie toque una línea.

### 7.2 Lo que el esqueleto soporta sin construirse

Cuatro piezas, y las cuatro son baratas hoy y caras con pedidos vivos:

1. **El envío tiene tipo de servicio** — estándar o urgente. Es una
   lista que crece, no un casillero de sí/no.
2. **La promesa es una ventana** — desde y hasta.
3. **Los cortes viven en parámetros**, jamás en el código.
4. **El envío tiene precio propio y quién lo paga**, separado del
   producto. Hoy vale cero y lo paga el vendedor. El día de la
   urgencia, el campo ya existe y solo cambia de valor.

### 7.3 El cupo — 🔴 NINGÚN NÚMERO VA EN EL CÓDIGO

**El cupo del día es la suma de la capacidad de los recursos de reparto
confirmados para ese día.**

- **La capacidad es del recurso, no de la casa.** Una moto lleva 20. El
  día que el vendedor use un carro para llevar 40, **el sistema no se
  entera de que cambió algo**: se edita la capacidad del recurso.
- **Cuenta lo confirmado para ese día, no lo registrado.** Si el segundo
  repartidor no puede venir el domingo, el sistema no promete como si
  estuviera. **Prometer sobre un recurso que no va a estar es
  exactamente lo que L-139 prohíbe.**
- **El excedente no rompe nada: se promete al turno siguiente**, que es
  lo que la regla de §7.1 ya sabe hacer.

---

## 8. LO QUE SE MODELA Y NO SE CONSTRUYE — RESUMEN

**El esqueleto nace completo; las opciones se prenden.**

| Pieza | Estado |
|---|---|
| El repartidor y su identidad | ~~**Forma sí, flujo no**~~ ☠️ **FORMA Y FLUJO** — entra a v1 con pantalla |
| El código de verificación en la puerta | ~~**Columna sí, flujo no**~~ ☠️ **COLUMNA Y FLUJO** — el repartidor lo pide al entregar |
| El mensaje atado al envío | **Forma sí, canal no** |
| El tipo de servicio y el precio del envío | **Forma sí, urgente no** |
| La capacidad por recurso y por día | **Forma y consumo sí** |
| El GPS del repartidor | ~~**Nada. Se hereda del paseo cuando entre**~~ ☠️ **ENTRA A v1** — el «cuando entre» llegó el mismo día |

> 🔴 **TRES FILAS ENMENDADAS EL MISMO DÍA** por
> `LETRA_RECORRIDO_DESPENSA_S96` §9. **La foto de entrega, que en esta
> letra no era ni fila, ahora existe y tiene letra de privacidad
> propia:** la ven el vendedor y el equipo de e-PetPlace, **jamás otro
> cliente**, vive **90 días** (D-776) y **el expediente jamás la toca**.

---

## 9. FUERA DE ALCANCE — DECLARADO

Postventa · el mapa en vivo desde el teléfono de la familia · chat y
WhatsApp · asignación y optimización de rutas · validación de identidad
del repartidor · devolución automatizada · courier · segundo vendedor ·
reconstrucción del portal admin.

---

## 10. LOS CASOS FEOS DEL PANEL

| Caso | Qué hace el panel |
|---|---|
| **La factura electrónica falla** | El pedido queda empacado y **no sale**. La pantalla lo dice sin rodeos y el pedido espera. No hay puerta de atrás |
| **El stock no alcanza al preparar** | El ajuste con motivo es el camino, y el pedido se eleva a atención humana. **Jamás se despacha de menos en silencio** |
| **Se entregó fuera de la ventana** | Se registra la hora real. **No se corrige la promesa hacia atrás** — el dato honesto es lo que permite medir si la promesa sirve |
| **Un escalón rebota** | La pantalla dice el motivo verdadero. Nunca *"intentá de nuevo"* |
| **Estado inactivo** | Rechazo con error explícito, no silencio |

---

## 11. ⚠️ CHOQUE DECLARADO CONTRA LETRA FIRMADA

Por regla de la casa, un choque contra letra firmada **se declara,
jamás se difiere en silencio.**

`MODELO_DESPENSA` §8.6 y §11.1 firman *"una lista de pedidos con **dos
botones** —preparado, despachado— y el ajuste de stock"*.

**Esta letra lo enmienda a cuatro escalones**, por las razones de §3:
el empaque necesita el lote (retiro de producto), el despacho necesita
la factura (Ecuador), y la entrega es el único acto que deposita en el
expediente.

**Enmienda declarada y firmada por el founder en esta mesa.**
`MODELO_DESPENSA` sube a v2.1 con este cambio y con el estado real del
criterio de flete.

---

## 12. DEUDA NUEVA

| # | Qué | Disparo / muerte |
|---|---|---|
| ~~**D-770**~~ | ~~**GPS del repartidor y mapa en vivo para la familia.** Se hereda del rastreo del paseo, ya construido y probado. Lo caro no es el GPS: es convertir al repartidor en usuario con sesión, permisos y pantalla propia~~ | ☠️ **NACE MUERTA.** `LETRA_RECORRIDO_DESPENSA_S96` §9 le dio al repartidor la entrada real que era su disparo, el mismo día. *Su razón —«lo caro es convertirlo en usuario con pantalla»— sigue siendo cierta: lo que cambió es que el founder decidió pagarla.* **El mapa en vivo para la familia sigue en v2** |
| **D-771** | **Chat y WhatsApp dentro del envío.** La costura queda escrita en §6 | ☠️ cuando se prenda cualquiera de los dos canales |
| **D-772** | **La pantalla "Recibir" de la app del cliente.** Hasta que exista, la entrega la marca solo el vendedor | ☠️ cuando la confirmación de la familia exista como cortesía |
| **D-773** | **El procedimiento escrito para el pedido empacado sin factura.** Hoy la pantalla lo frena; falta decir qué hace el humano después | ☠️ con el capítulo de `POLITICAS` que ya pide D-744 |

---

## 13. LO QUE ESTA LETRA NO RESUELVE

**Y no lo resuelve ninguna pista:**

- **La pasarela de pago.** Sin proveedor afiliado no hay primera venta
  real, con panel perfecto o sin él. **Es lo único del camino crítico
  que no controlamos.**
- **La respuesta escrita de VTEX sobre la penalidad de vender fuera de
  su sistema con el contrato vivo (D-751).** Bloquea la primera venta
  real.
- **El vendedor confirmado (D-745)**, con sus fotos y su stock.
- **El aviso de no renovación de VTEX antes de fin de noviembre
  (D-756).** Es decisión de contrato, independiente del lanzamiento: si
  octubre se mueve, esa fecha llega igual.

---

## Historial

- **v1.0 (S96, 12 Ago 2026):** dictada en mesa sobre el arranque de S96.
  Nueve firmas del founder en §0. El cuarto escalón entra y con él la
  compra llega al expediente. El repartidor queda como rol con su regla
  de lectura escrita. La llamada gana v1 con el chat y WhatsApp
  declarados como destino y su costura escrita. El GPS va a v2. El cupo
  pasa de número a capacidad por recurso confirmado. Choque declarado
  contra `MODELO_DESPENSA` §8.6 y §11.1. Nacen D-770 a D-773.
  - ⚠️ **Nota de depósito (no de mesa):** la mesa dictó estas cuatro
    deudas como **D-757 a D-760**. Al depositar se midió que **los
    cuatro números ya estaban tomados** — `D-757` por los artefactos de
    S95-C (el INSERT anónimo de `pedidos`, con dos reversas SQL que lo
    nombran) y `D-758`/`D-759`/`D-760` por las fichas de S95-F (portal
    admin desalineado · el 14% · `seller_perfil`). **El founder firmó el
    corrimiento al primer bloque libre, `D-770` a `D-773`**, medido
    contra `D-769` como el más alto en uso. El depósito es verbatim en
    todo lo demás.
  - 🔴 **ENMENDADA EL MISMO DÍA por `LETRA_RECORRIDO_DESPENSA_S96` §12,
    en cuatro puntos** — el GPS a v1 (**D-770 nace muerta**) · el
    repartidor gana pantalla · el vendedor marca tres escalones y el
    cuarto lo marca quien está en la puerta · la foto de entrega entra
    al sistema. **Las marcas viven en cada lugar afectado (§0.6, §5, §8,
    §12), no solo en la puerta.** *Una letra de doce horas de vida que
    ya se enmienda no es un fracaso del método: es el método —la mesa
    siguió pensando y la letra lo registró en vez de dejar dos verdades
    conviviendo.*
