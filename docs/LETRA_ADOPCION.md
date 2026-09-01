# LETRA_ADOPCION.md — e-PetPlace · adopción, padrinazgo y donación

> **Versión:** v1.0 · **Nace:** 31-ago-2026 (mesa founder + arquitecto, S108).
> 🔴 **SUSTITUYE A `LETRA_ADOPCION_PADRINAZGO.md` v1.0 (25-ago-2026), que queda
> ARCHIVADA.** Sus seis firmas se cargan acá con su fecha original; la única que
> cambia es la ③, y su enmienda está en §0. *Dos letras firmadas que se
> contradicen son peores que una equivocada — la casa ya lo pagó tres veces.*
>
> **Fuentes que obedece:** `MODELO_ADOPCION` v0.1 (investigación y forma) ·
> `MODELO_LOYALTY` §7 (🔴 las donaciones jamás otorgan beneficios comerciales) ·
> `MODELO_PRODUCTO` §4.4 y §3.1.4 (la historia viaja con la mascota) · §8.9
> (refugios sobre criaderos) · `BIO_EXPEDIENTE` A1 (el refugio como actor) ·
> `MODELO_DESPENSA` (la donación existente) · `MODELO_FINANCIERO` ·
> `POLITICAS_EPETPLACE` P3 y P5. **Si esta letra contradice a cualquiera, gana
> la fuente.**
>
> **Qué fija:** las tres figuras, el actor refugio, el adoptable, la sección
> pública, el portal del publicador y los límites duros. **Qué no fija:** nombres
> de tablas ni columnas —los fija la pista contra la base— ni el texto legal del
> acta, que va al paquete único del abogado.

---

## §0 · 🔴 LA ENMIENDA QUE ABRE ESTA LETRA — el expediente empieza en el rescate

La letra de 25-ago, **firma ③**, decía: *«Lo que se crea es una cuenta de
e-PetPlace con los datos de la mascota. Eso es todo lo que hace v1»*, y dejaba
la transferencia del expediente declarada pero **no activada**.

**Queda derogada.** *(Firma ① del founder, 31-ago-2026.)*

**La vida de la mascota en e-PetPlace empieza en el período de adopción, no en
la entrega.** El refugio carga eventos al expediente desde antes de que exista
la familia —castración, vacunas con su lote, tratamientos, comportamiento
observado, la historia del rescate— y **la familia hereda todo lo que hay hasta
ese momento**.

🔴 **Y esto no es un agregado: es la tesis del vertical.** En toda plataforma
del mundo el expediente del refugio muere en la adopción y el adoptante se lleva
un animal y, con suerte, un PDF. La adopción acá **no crea** la mascota: **le
cambia la familia** — el mismo mecanismo de transferencia que `MODELO_PRODUCTO`
§3.1.4 ya ratificó.

⚠️ **Su precondición es de objeto y hay que medirla ANTES de construir** (§12 ①):
la casa entera trata `familia_id` como la llave del dueño. Si no admite vacío,
la figura no cambia pero su forma sí: **el refugio es la familia hasta la
entrega**, y la adopción es la transferencia. *Esta letra firma el QUÉ; la forma
la decide la medición, no una preferencia.*

---

## §1 · LAS TRES FIGURAS, Y LA PLATA QUE MUEVEN

| figura | qué es | cobra comisión |
|---|---|---|
| **Adopción** | Match entre publicador y adoptante | ❌ gratuita |
| **Padrinazgo** | **Compra RECURRENTE de productos**, entregada al refugio | ❌ es una compra, no un cobro por servicio |
| **Donación** | **Compra PUNTUAL de productos**, entregada al refugio | ❌ ídem |

🔴 **El padrino aporta productos, jamás plata.** *(Firma ② — heredada 25-ago,
ratificada 31-ago.)* La razón es de figura y no de esfuerzo: girar plata de
terceros a un refugio toca el mandato de recaudación que **`D-900` tiene abierta
y el motor todavía no expresa**. Con productos, e-PetPlace vende lo que ya vende
y entrega a otra dirección — **no hay fondos ajenos que explicar**.

**El 5 % extra a la fundación** *(Firma ③ — heredada 25-ago)*: sobre el valor
comercial de las compras hechas por padrinazgo o donación, e-PetPlace abona un
5 % adicional a la fundación. **No rompe `LOYALTY` §7 porque el beneficio no
llega al donante: llega al refugio.** ⚠️ Contablemente es **gasto de
e-PetPlace**, jamás plata de terceros — y va a la lista del contador.

---

## §2 · EL ACTOR: REFUGIO Y RESCATISTA

- **Cuenta comercial que no factura y no cobra.** No tiene fee, no tiene agenda,
  no aparece en el marketplace de servicios. Aparece **solo** en la sección de
  adopción.
- 🔴 **La verificación es MANUAL y del founder.** *(Firma ④, 31-ago-2026.)* No
  hay autoregistro: el administrador crea la cuenta. Es lo único que escala a
  cero al arrancar, y resuelve de un golpe los muros anti-venta y anti-cría que
  `MODELO_ADOPCION` §6 dejaba abiertos.
- **Refugio y rescatista individual son el mismo actor con distinta vara de
  verificación**, no dos objetos.
- **El publicador SIEMPRE se muestra** (P3): nombre y cara. Un publicador
  anónimo no existe.
- 🔴 **El publicador decide SIEMPRE a quién entrega.** *(Firma ⑤ — heredada
  25-ago.)* e-PetPlace facilita solicitudes, filtros y herramientas; **jamás
  asigna un animal ni aprueba un adoptante en nombre de nadie.** No hay reserva
  que obligue al refugio.
- 🔴 **Responsabilidad durante el proceso: del refugio** *(Firma ⑥ — heredada
  25-ago)*. Entre el «lo quiero» y la entrega pasan días, y en esos días
  responde quien tiene al animal. *Misma línea que la guardería.*

---

## §3 · EL ADOPTABLE

Una mascota del sistema en estado adoptable. Su ficha: identidad (edad
**estimada**; *mestizo* es categoría legítima) · salud con honestidad de
semáforo · **convivencia** · la historia del rescate en voz humana · señales
operativas (urgente, pareja vinculada, tiempo en rescate, ubicación aproximada
— **jamás la dirección exacta**).

**Convivencia: TRES estados, jamás dos** — sí · no · **todavía no se sabe**. Un
refugio que rescató hace seis días no sabe cómo reacciona con gatos, y volcar
eso en un «no» le cuesta el hogar. *Lo no conocido se respeta como no conocido,
jamás como dato faltante.*

**Estados:** `en_rescate` → `publicado` → `en_proceso` → `adoptado`, y las
salidas duras `no_disponible` y `fallecido`. ⚠️ **El adoptable que fallece
recibe la misma dignidad de memorial que cualquier mascota de la casa, y sus
padrinos una comunicación humana** — su ficha jamás desaparece en silencio.

---

## §4 · LA SECCIÓN PÚBLICA — cómo se llega y qué se ve

*(Firma ⑦ del founder, 31-ago-2026.)*

**Dos puertas:**
1. Cuenta existente → la sección de adopción.
2. **Sin cuenta:** desde el login hay una puerta a *ver mascotas en adopción*.
   Al postular, se pide crear cuenta — y **el alta ofrece «no tengo mascota,
   quiero adoptar»**, que crea la cuenta **sin mascota registrada**.

⚠️ **Eso no es una rama del registro: es un estado nuevo para toda la app.** El
hogar, el expediente, explorar y el coach asumen hoy que hay al menos una
mascota. Se mide antes de construir (§12 ②).

**El orden de la lista:** un bloque **«Llevan más tiempo esperando»** encabeza,
con su porqué a la vista; debajo, el resto. 🔴 **No es orden puro por
antigüedad**, porque los que más esperan suelen ser los más difíciles y una
primera pantalla entera de casos duros hace rebotar al que entró a mirar. *El
que más lo necesita gana el mejor lugar, y el que mira se queda.*

**Filtros:** especie · tamaño · edad estimada · sexo · **convive bien con**
(perros · gatos · niños) · urgentes · esterilizado · pareja vinculada · cerca
de mí.

🔴 **Dos decisiones adentro, y son de piedra:**
- **SIN filtro de raza.** Filtrar por raza empuja a buscar raza.
- **«Necesidades especiales» existe solo para INCLUIR, jamás para ocultar.** Un
  filtro que esconde a los que más cuesta colocar es la función que no se
  construye.
- **Filtrar no borra al que no se midió:** con un filtro de convivencia activo,
  arriba van los confirmados y abajo, con su título, los que todavía no se
  saben.

**Botón directo a apadrinar** en la ficha, junto a las fotos.

**Lo que esto jamás es:** sin swipe, sin descartes gamificados, sin score de
match visible. **Se presentan vidas, no inventario.**

---

## §5 · LA SOLICITUD, Y LA ADOPCIÓN COMO SU FINAL

*(Firma ⑧ del founder, 31-ago-2026.)*

- El formulario es **del publicador**; la plataforma ofrece plantillas y no
  impone ni prohíbe barreras.
- **La conversación vive en la app**, con estados: recibida · en conversación ·
  aceptada · declinada.
- 🔴 **La adopción misma vive DENTRO de la solicitud, como su final natural:**
  avisos del animal → acta digital firmada por publicador y adoptante →
  **transferencia del expediente** → hito *«Una vida nueva empieza»*, con
  aniversario anual. El refugio queda como **procedencia permanente**.
- 🔴 **El silencio tiene reloj:** al postular, respuesta automática configurada;
  **si el refugio no responde en 5 días, e-PetPlace avisa a la familia que el
  refugio no respondió.** *La promesa de no repetir el silencio de Instagram la
  cumple el refugio; cuando no la cumple, la verdad la decimos nosotros.*
- **Datos del solicitante:** solo los ve el publicador del animal solicitado.
  Jamás otro uso — ni marketing, ni scoring. **Ningún dato de un menor alimenta
  nada** (P5).

---

## §6 · PADRINAZGO — la canasta del refugio

*(Firma ⑨ del founder, 31-ago-2026.)*

- 🔴 **El refugio NO carga catálogo: MARCA del nuestro.** Entra a la despensa,
  marca *«esto es lo que necesitamos»*, y eso arma su canasta. Cero productos
  nuevos que administrar. ⚠️ Un refugio que necesita algo que no vendemos no lo
  puede pedir, **y está bien**: es señal de catálogo, no función faltante.
- **La canasta es del REFUGIO, no de cada mascota.** Apadrinás a Luna con un
  saco al mes: el saco llega al refugio donde vive Luna, y las fotos que recibís
  son de Luna.
- **El padrino recibe fotos de su ahijado. Nada más.** 🔴 **Límite duro, no
  etapa** (`LOYALTY` §7): un descuento convertiría el padrinazgo en compra, con
  IVA y otro tratamiento contable. **Si algún día se quiere ese beneficio,
  reabre la figura entera y exige su propia letra.**
- 🔴 **El padrinazgo sabe morir.** Si el ahijado es adoptado, fallece o el
  refugio se va, **el cobro recurrente se detiene solo — jamás sigue por
  inercia.** El padrino recibe correo y aviso en la app: *tu ahijado fue
  adoptado*, con la novedad **sin violar la privacidad de la familia que
  adoptó**, el agradecimiento, y la invitación a apadrinar a otro. *(Firma ⑩,
  31-ago-2026.)* ⚠️ El aviso de adopción **no es un beneficio comercial**: §7 de
  LOYALTY queda intacto.
- **Su puerta de cancelación es la de la casa:** *Pagos recurrentes y
  suscripciones*, en Cuenta (`D-9xx`). El padrinazgo **no construye la suya**.

---

## §7 · DONACIÓN — un objeto con destino, no tres flujos

*(Firma ⑪ del founder, 31-ago-2026.)*

**Compra puntual del catálogo ENTERO** —el donante elige lo que quiera— con un
**campo de destino** de tres valores:

1. **una mascota en adopción** · 2. **un refugio** · 3. **abierta**, y
e-PetPlace la cruza con el refugio que mejor haga match.

🔴 **`MODELO_DESPENSA` ya tiene una donación «sin destino elegible»: ese es el
valor *abierta*, no otra pieza.** Se construye como un objeto con un campo.
*Quien implemente el padrinazgo o la donación con destino reusando la donación
de la despensa tal cual va a heredar «sin destino elegible», que es
precisamente lo que estas figuras no pueden ser.*

---

## §8 · LA ENTREGA — a la dirección de un tercero

*(Firma ⑫ del founder, 31-ago-2026.)*

La compra se entrega **al refugio**, no a quien pagó. **La coordina el refugio.**

🔴 **Es la única pieza genuinamente nueva del bloque:** el motor de entrega de la
despensa nunca despachó a un tercero. Se declara acá para que nadie lo descubra
al construir.

---

## §9 · EL PORTAL DEL PUBLICADOR — tres tabs en la app de negocios

*(Firma ⑬ del founder, 31-ago-2026.)*

Mismo login, misma cuenta, mismo diseño, misma configuración. **El tipo de
cuenta decide las tabs**, y las de adopción son tres:

1. **Home** — 🔴 **una sola cosa cuenta.** Las **solicitudes por revisar**
   arriba, con contador; padrinazgos y donaciones recibidas abajo, como
   novedades, **sin contador**. *Un contador tiene que poder llegar a cero: las
   solicitudes exigen respuesta, las novedades no, y mezclarlas es cómo se
   pierde la que había que responder.*
2. **Mascotas** — subir, editar, pausar, bajar, y **cargar eventos al
   expediente** (§0). *Se llama así porque en la cabeza del refugio no son
   publicaciones: son animales.*
3. **Cuenta.**

---

## §10 · LÍMITES DUROS

1. **Jamás venta encubierta:** cachorros de raza en volumen, precios sin
   desglose, pagos anticipados. La cría solo por criaderos certificados, en su
   propio módulo.
2. **El publicador decide siempre.** La plataforma jamás asigna, aprueba ni
   puntúa adoptantes.
3. **Los datos del solicitante** solo los ve el publicador del animal
   solicitado.
4. **Refugios sobre criaderos en todo discovery.**
5. **Donar o apadrinar JAMÁS otorga beneficio comercial**, y los eventos de
   adopción y donación **no acumulan en loyalty**.
6. **La devolución jamás humilla** — ni al adoptante ni al animal.
7. **El adoptable fallecido recibe memorial.**
8. **Sin swipe, sin descartes gamificados, sin score de match visible.**
9. **Ningún dato de menor alimenta nada** (P5).
10. **La IA jamás aprueba ni rechaza adoptantes, jamás puntúa animales, y jamás
    mejora fotos o videos** — el animal real es el que llega a casa.

---

## §11 · LO QUE NO ENTRA EN v1

Padrinazgo en dinero · cualquier beneficio comercial al padrino · reubicación
de mascotas propias · hogares de tránsito · quiz y matching por lenguaje natural
· ferias como objeto · cierre en clínica de la red · alianza municipal ·
check-ins post-adopción con cadencia configurable · período de prueba ·
bono de adopción procesado por la plataforma.

⚠️ **El bono de adopción queda fuera y hay que decirlo en pantalla si un refugio
lo cobra:** se paga al conocer al animal, fuera de la app. *Cualquier pedido de
depósito previo a conocer al animal es reportable con un tap.*

---

## §12 · LO QUE SE MIDE ANTES DE CONSTRUIR — y no se opina

1. 🔴 **¿Puede existir una mascota sin familia?** Es §0 entero. Si `familia_id`
   no admite vacío, el refugio es la familia hasta la entrega.
2. 🔴 **¿Puede existir un usuario sin mascota?** Es la puerta de §4. `M0` ya
   nombra ese estado en el modelo; falta saber si el código lo aguanta.
3. **¿Hay mensajería entre dos cuentas hoy?** Si no, la conversación de §5 es
   superficie nueva y es la mitad del vertical.
4. **¿El motor de entrega admite un destinatario distinto del comprador?** (§8).
5. **¿El motor de cobro recurrente admite un sujeto cuyo destinatario puede
   desaparecer?** (§6, el padrinazgo que sabe morir).
6. **¿La app de negocios admite tabs por tipo de cuenta** sin bifurcar la app?
   (§9).

---

## §13 · AL ABOGADO Y AL CONTADOR — al paquete único, no por separado

**Abogado:** el acta de adopción · ¿qué figura es entregar productos comprados
por un tercero a una fundación? · ¿el match sin intervención nos deja fuera de
responsabilidad? · tratamiento de datos del solicitante · el texto de §12 del
modelo (Ordenanza 019, REMETFU, esterilización).

**Contador:** el 5 % extra, ¿gasto de marketing o donación? · ¿la donación en
producto exige comprobante distinto? · ¿el comprobante va a nombre de quien
paga, con el refugio como destinatario?

---

## §14 · FIRMAS

| # | Qué | Estado |
|---|---|---|
| ① | El expediente empieza en el rescate y se hereda (§0) | 🟡 **founder, 31-ago** — *deroga la firma ③ del 25-ago* |
| ② | Padrinazgo en productos, jamás plata (§1) | ✅ heredada 25-ago, ratificada 31-ago |
| ③ | El 5 % extra a la fundación (§1) | ✅ heredada 25-ago |
| ④ | Verificación manual del publicador (§2) | 🟡 founder, 31-ago |
| ⑤ | El publicador decide siempre (§2) | ✅ heredada 25-ago |
| ⑥ | Responsabilidad del refugio durante el proceso (§2) | ✅ heredada 25-ago |
| ⑦ | Las dos puertas, el orden y los filtros (§4) | 🟡 founder, 31-ago |
| ⑧ | La adopción vive dentro de la solicitud + el reloj de 5 días (§5) | 🟡 founder, 31-ago |
| ⑨ | La canasta del refugio marcada del catálogo (§6) | 🟡 founder, 31-ago |
| ⑩ | El padrinazgo sabe morir (§6) | 🟡 founder, 31-ago |
| ⑪ | La donación es un objeto con destino (§7) | 🟡 founder, 31-ago |
| ⑫ | La entrega la coordina el refugio (§8) | 🟡 founder, 31-ago |
| ⑬ | El portal de tres tabs (§9) | 🟡 founder, 31-ago |

> 🟡 = decidida en mesa hoy, **pendiente de que el founder firme el documento**.
> Nada de §12 se construye antes de medirse.

---

## Historial

- **v1.0 (31-ago-2026, S108):** nace en mesa consolidando `LETRA_ADOPCION_PADRINAZGO`
  v1.0 (25-ago, archivada) con las decisiones del founder de hoy. La enmienda de
  §0 es la que cambia el vertical: el expediente empieza en el rescate.
