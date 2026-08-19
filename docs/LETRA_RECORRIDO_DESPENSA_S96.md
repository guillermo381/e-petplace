# LETRA — EL RECORRIDO COMPLETO DE LA DESPENSA (S96, mesa founder + arquitecto)

> **Estado: ✅ FIRMADA en todo lo que enumera §0.** Dictada en mesa el
> 12 de agosto de 2026, después del depósito de
> `LETRA_PANEL_VENDEDOR_S96`.
>
> **Qué es:** el recorrido entero de la despensa, de los dos lados — el
> negocio y la familia. La letra anterior describió el panel; esta
> describe el sistema alrededor del panel. **Y la enmienda en cuatro
> puntos** (§12).
>
> 🔴 **ADVERTENCIA DE NUMERACIÓN, ESCRITA POR EL LÍO QUE ACABA DE
> PASAR:** los números de deuda de §13 (**D-774 → D-779**) están
> propuestos, **no verificados**. En el depósito de la letra anterior
> los cuatro números dictados estaban tomados, dos de ellos por
> artefactos vivos sin ficha. **Verificar contra `DEUDAS_CANONICAS.md`
> ANTES de escribir una línea, y elevar si alguno está ocupado.**
>
> **Contrastes obligatorios:** `LETRA_PANEL_VENDEDOR_S96` (a la que
> enmienda) · `MODELO_DESPENSA` v2.1 (§4.1 una oferta por producto ·
> §6 la recomendación · §7.4 privacidad · §11 el alcance) ·
> `PORTAL_PRESTADOR` §2.1 (el prestador es elegido) ·
> `MODELO_LOYALTY` §7 (la donación jamás otorga beneficio comercial ·
> la compra jamás alimenta el loyalty) · `BIO_EXPEDIENTE` (la ley madre
> acto/rol) · **L-139** (jamás se promete ni se muestra lo que no es
> verdad).

---

## 0. LO FIRMADO EN ESTA MESA

1. **Dos naturalezas, dos nombres: `Servicios` y `Venta de productos`.**
   Salud, cuidado y las que vengan son familias **dentro** de servicios.
2. **El vendedor se configura solo; e-PetPlace lo hace visible.**
3. **La venta de mostrador entra, y el vendedor jamás elige la mascota:
   el cliente reclama la compra con un código de la factura.**
4. **Retiro en tienda entra a v1.** El vet carga inventario.
5. **Catálogo amplio, buscador y filtros.** El detalle de producto al
   nivel del mejor comercio electrónico.
6. **La alergia no esconde: advierte.**
7. **Sin mascota elegida se muestra todo.** Seis especies.
8. **Compra recurrente en v1, con cobro al medio de pago guardado**, con
   aviso honesto y un interruptor para apagarla.
9. ~~**Programar la fecha de entrega entra**~~ **☠️ DEROGADO por firma del
   founder, 17-ago-2026 (gate de S100) — ver §6.2.** El control SALE del
   checkout; **el cupo por cada día futuro SIGUE VIGENTE**.
10. **La donación entra a v1**, sin destino elegible: el refugio lo elige
    e-PetPlace y la foto se manda a mano. **El reparto lo hace el
    founder y no consume cupo.**
11. **El carrito mezcla mascotas:** el pago va a la cuenta del dueño,
    cada producto a la mascota que lo consume.
12. **Las direcciones se validan con Google Places**, con alias,
    referencia, instrucciones de entrega y punto en el mapa.
13. **El cliente cancela solo hasta que el pedido se marca preparado.**
14. **Entrega fallida: vuelve y se reagenda.** El costo del segundo
    viaje lo absorbe el vendedor en v1 y se mide.
15. **Cinco avisos al cliente**, con el paso extra de *vamos hacia vos*.
16. 🔴 **El repartidor entra a v1 con pantalla mínima.** Con él entran el
    GPS y la foto de entrega.
17. **La foto de entrega vive 90 días**, la ven el vendedor y el equipo
    de e-PetPlace, **jamás otro cliente, jamás el expediente.**

---

## 1. LOS DOS NOMBRES, Y POR QUÉ IMPORTAN

**`Servicios` y `Venta de productos`.** No son dos categorías de lo
mismo: son dos naturalezas distintas. Los servicios se **agendan** —
tienen cita, hora, prestador y tocan el expediente. Los productos se
**venden** — tienen catálogo, stock, pedido y reparto.

**Por qué el nombre es arquitectura y no vocabulario:** desde que el
motor de comercio es propio, la frontera entre pedido de producto y cita
de servicio **se sostiene solo en nuestra disciplina** — ya no hay
penalidad contractual que la proteja. *El día que una pantalla diga
"Servicios: salud, cuidado, despensa", alguien va a construir la tabla
compartida que `MODELO_DESPENSA` §3.4 prohíbe.* Dos etiquetas distintas
son el primer candado, y es gratis.

---

## 2. EL NEGOCIO SE CONFIGURA

### 2.1 Se configura solo, se hace visible por decisión de e-PetPlace

**El vendedor completa su negocio sin pedirle permiso a nadie:** datos,
catálogo propuesto, método de reparto, repartidores, cobertura,
horarios de corte y capacidad de cada recurso.

**Y no aparece ante ningún cliente hasta que el equipo de e-PetPlace lo
revisa y lo habilita.**

Las dos mitades importan. La primera lo hace escalable — nadie tiene que
sentarse a llenar formularios ajenos. La segunda protege lo que
`PORTAL_PRESTADOR` §2.1 firma —*el prestador es elegido*— y la vitrina
curada de §4.1. **El vendedor propone; e-PetPlace publica.** Aplica al
negocio entero, no solo a cada producto.

**Consecuencia útil que sale gratis:** la pantalla de configuración **es**
el expediente del vendedor cuando el equipo lo revisa. No hay que
construir un formulario de solicitud aparte.

### 2.2 Lo que se configura

Datos de facturación (él es el vendedor de registro) · catálogo
propuesto · método de reparto · repartidores · ~~zona de cobertura~~ ·
horarios de corte · capacidad por recurso de reparto.

> **ENMIENDA (firma del founder, 13-ago-2026):** la cobertura se declara
> **por RADIO, no por polígono ni por lista de sectores** — radio en km
> desde la ubicación del negocio, **default 15 km · máximo 50 km**. La
> letra completa de la pantalla de configuración vive en
> `MODELO_DESPENSA` §8.6bis. **§2.3 (abajo) NO se toca:** la cobertura
> sigue siendo del SERVICIO, no del negocio.

**La vista de su facturación entra a v1. La liquidación —cuánto le toca,
cuándo le llega— se difiere al motor de pagos** (firma del founder: no
se decide sin pasarela).

### 2.3 La cobertura es del servicio, no del negocio

**La telemedicina llega más lejos que todo lo demás.** La cobertura se
declara por servicio.

Fuera de cobertura, la app **lo dice y no promete**: *"todavía no
llegamos a tu zona"*. Jamás una lista vacía sin explicación — una
pantalla vacía es un dato plausible y falso sobre el ecosistema.

---

## 3. LA PUERTA — CAMBIAR DE OFICIO

Para el negocio que tiene más de una naturaleza.

**La forma:** no es una pantalla intermedia ni una animación que se
paga todos los días. La barra inferior se reordena y el color del oficio
barre la pantalla de un lado al otro, en menos de medio segundo. Se
siente como cambiar de oficio, no como cargar una app.

> **Lo que la metáfora esconde y es lo único que importa: cruzar la
> puerta cambia PERMISOS, no decoración.**
>
> Una veterinaria que además vende alimento, **del lado de productos no
> ve expediente aunque sea veterinaria.** Ve el expediente por su oficio
> de prestador y por la matriz de acto/rol, jamás por haber vendido
> algo.
>
> Si la puerta solo cambia colores, es una animación bonita sobre un
> agujero.

**La posición consolidada es distinta por naturaleza:** del lado
productos, los pedidos. Del lado servicios, la agenda.

---

## 4. 🔴 LA VENTA DE MOSTRADOR — EL VENDEDOR JAMÁS ELIGE LA MASCOTA

**El caso es real y es un canal de adquisición, no un caso borde:** la
veterinaria vende una bolsa de alimento a alguien que entró caminando.

**El problema:** para que esa compra entre al expediente, alguien tiene
que elegir la mascota. Si la elige el vendedor, le abrimos la identidad
de las mascotas del ecosistema — que es exactamente lo que §7.4 de
`MODELO_DESPENSA` prohíbe sin excepción.

**La solución: no la elige él. La reclama el cliente.**

1. El vet registra la venta **contra nadie**. Descuenta su inventario.
2. Su factura lleva **un código**.
3. El cliente mete el código en la app, y la compra se ata **a él y a la
   mascota que él elija**.

**Lo que esto compra:**

- **El vendedor nunca busca personas ni ve expedientes.** No hay nada que
  limitar: la pantalla no existe.
- **La factura es la invitación.** El canal de adquisición pedido, sin
  construir nada aparte.
- **El mismo mecanismo sirve para el retiro en tienda.**

> **LA REGLA GENERAL QUE ESTO REVELA, Y VALE MÁS QUE EL CASO:**
> **la compra es la puerta de entrada al expediente.** Aparece tres veces
> en esta letra —el mostrador, el retiro, y el alimento de un ave no
> registrada— y es una sola regla: **la app nunca adivina de quién es una
> compra; ofrece atarla, y el dueño decide.**

**Retiro en tienda entra a v1:** es el mismo pedido con otro modo de
entrega. Sin repartidor, sin ventana, con código en el mostrador. Misma
comisión, mismo evento del expediente.

### 4.bis 🔴 DÓNDE VIVE LA PUERTA — ENMIENDA FIRMADA (S100d·bis, 18-ago-2026)

> **⚠️ LEER PRIMERO QUÉ SE DEROGA Y QUÉ NO, porque no es lo que el encargo
> supuso — y decirlo mal sería peor que no decirlo.**
>
> **§4 NO se deroga. Ni una línea.** El mecanismo —*el vet registra contra
> nadie · su factura lleva un código · el cliente lo reclama y elige la
> mascota*— **rige entero**, sigue siendo v1 y sigue siendo el canal de
> adquisición. **Lo que se enmienda es algo que §4 nunca dijo: DÓNDE está
> la puerta.**
>
> *Se escribe así a propósito. El encargo decía «se deroga §4», y §4
> **jamás nombró a la Despensa**: la puerta la puso una PANTALLA. Tachar
> una cláusula por algo que no dice es como se pierden mecanismos enteros
> — el día que alguien lea «§4 derogado» va a creer que el reclamo murió.*

**LA FIRMA DEL FOUNDER (18-ago-2026): la entrada del código SALE de la
Despensa.** ~~La celda «¿Compraste en el local?» al pie de la vitrina~~ se
retira. **La puerta vive en el Hogar** (prominente sin pedidos, discreta
después) **y en Pedidos** (acceso arriba).

**Las tres razones, y la tercera es la que manda:**

1. **Como canal, casi no existía donde estaba.** Medido: la celda vivía al
   FONDO del scroll de la Despensa, **detrás de hasta 50 productos en
   grilla de dos**. *Un canal de adquisición que exige veinticinco filas de
   deslizamiento no es un canal.* Ése es el diagnóstico que motivó moverla,
   no una preferencia de composición.
2. **Con el Hogar y Pedidos cubiertos, la de la Despensa era la TERCERA
   puerta al mismo cuarto.** *Esa figura ya se mató dos veces en esta app*
   —el hub del paseo en S60, y «Tus pedidos» en esta misma sesión—.
3. 🔴 **Y la razón de concepto, que sobrevive a cualquier composición: LA
   DESPENSA ES DONDE SE COMPRA ONLINE; EL RECLAMO ES PARA QUIEN COMPRÓ
   OFFLINE.** Era el lugar equivocado **por concepto, no solo por
   posición** — moverla dentro de la misma pantalla no lo habría curado.

**Por qué queda escrito y tachado en vez de borrado:** *una decisión de
NO-construir que no queda escrita se vuelve a proponer.* Sin esta nota, la
próxima pasada por la vitrina ve una tienda sin puerta al reclamo y la
vuelve a poner — con las mismas buenas intenciones y el mismo resultado.
**Misma forma que §6.2 y que la cláusula derogada de `PinMovible`.**

---

## 5. EL CATÁLOGO — AMPLIO, Y CON CRITERIO

### 5.1 Amplio no contradice una oferta por producto

**Son dos cosas distintas y la letra vieja las mezclaba.** `MODELO_DESPENSA`
§4.1 prohíbe **ofrecer el mismo producto cien veces con precios
distintos**. No prohíbe tener un catálogo grande.

**Catálogo amplio, buscador, filtros por categoría y nombre, y detalle
de producto al nivel del mejor comercio electrónico.** Acá no se
inventa la rueda.

### 5.2 Sin mascota elegida, se muestra todo

Seis especies. **Elegir la mascota es lo que enciende el criterio**, no
un requisito para entrar.

**Y si se compra para una especie que no está en la familia:** *"estás
comprando comida para aves. Todavía no tenemos ninguna registrada,
¿querés hacerlo?"* Se ofrece, no se exige, y la compra sigue igual.

### 5.3 La primera compra no recomienda

**No sabemos qué come Thor, y no lo inventamos.** La recomendación nace
cuando hay dato, jamás antes. Un catálogo que recomienda sin saber es
exactamente el dato plausible que L-139 prohíbe.

### 5.4 🔴 LA ALERGIA ADVIERTE, NO ESCONDE — ENMIENDA

**Enmienda a `MODELO_DESPENSA` §6 y §10.** La letra vigente firma
*exclusión dura: jamás recomendar algo contraindicado*, y trata su
aparición como error grave.

**La enmienda del founder, y es mejor producto:**

> **Exclusión dura en la RECOMENDACIÓN. Advertencia dura en la
> BÚSQUEDA.**
>
> La app **jamás sugiere** pollo para Thor. Si el dueño lo busca y lo
> encuentra, **se lo dice y lo deja decidir**: *"Thor es alérgico al
> pollo y este alimento lo contiene."* Con un paso explícito de
> entendimiento que queda registrado.

**Por qué es mejor:** esconder es invisible, y lo invisible no demuestra
nada. Un producto que desaparece sin explicación deja al dueño sin
entender. Un producto que advierte **es la app demostrando que conoce a
Thor** — el diferencial hecho pantalla en vez de hecho filtro.

**Dos candados, y ninguno es opcional:**

1. **Solo se puede advertir si el producto declara su composición.** Sin
   composición la app dice *"no tenemos los ingredientes de este
   producto"*. **Jamás silencio** — el silencio se lee como "no tiene
   pollo", y esa lectura la hace el dueño, no nosotros.
2. **La advertencia jamás se apaga por una promoción.** El motor de
   alertas manda sobre el de beneficios, siempre.

### 5.5 La recomendación del veterinario

Si el vet recomendó un alimento y el dueño elige otro: *"tu veterinario
recomendó X para Thor, y estás eligiendo otro. ¿Querés continuar?"*

**Candado:** solo se puede decir si el vet la registró como dato. **La
app jamás fabrica una recomendación que nadie hizo.**

---

## 6. LA COMPRA

### 6.1 Compra recurrente — ENMIENDA

**Enmienda a `MODELO_DESPENSA` §11.2**, que hoy pone suscripción y plan
recurrente explícitamente fuera de v1.

**Entra a v1**, con el interruptor que ya existe en los planes de paseo y
adiestramiento. **Con cobro directo al medio de pago guardado**, y con
el mensaje honesto en el momento de activarlo:

> *"Este pedido se cargará automáticamente al medio de pago guardado.
> Lo podés desactivar cuando quieras."*

**Tres condiciones que la industria aprendió a los golpes:**

1. **Aviso ANTES del cobro, no después** — dos o tres días antes, con la
   opción de saltar, mover o cancelar. *El cobro sorpresa es la causa
   número uno de contracargos.*
2. **Se apaga en un toque, desde donde se prendió.** Nunca por atención
   al cliente.
3. **Si el medio de pago falla, el pedido NO se crea a medias.** Se avisa
   y se espera. Jamás se envía prometiendo cobrar después.

**Y lo que no se puede esquivar:** el interruptor se construye, pero **el
primer cobro real es el mismo día que exista la pasarela** (D-778).

### 6.2 Programar la fecha de entrega

> ## ☠️ **DEROGADO POR FIRMA DEL FOUNDER — 17-ago-2026 (gate de S100)**
>
> **«Programar otra fecha» SALE de la superficie del checkout.** El founder
> lo pidió quitar **repetidamente** y **volvía a aparecer en cada ronda**.
>
> **LA RAZÓN POR LA QUE SE DEPOSITA ACÁ Y NO EN UN PROMPT:** *una decisión
> que no queda escrita se vuelve a proponer.* No es que alguien
> desobedeciera — **es que esta sección decía «Entra» y la letra gana**,
> porque es lo único que la pista siguiente lee. Es el mismo patrón que el
> canon ya pagó tres veces (el magenta en S83, la plata en S83 y en S88):
> **dos letras firmadas que se contradicen son peores que una equivocada,
> porque cualquiera cita la que le conviene y está «en regla».**
>
> **QUÉ MUERE:** el control de programar otra fecha en el checkout — el
> `onProgramarOtra` del `SelectorVentana`, el `CampoFecha` que abre, y las
> voces `despensa.programarFecha` / `despensa.programarPlaceholder`.
>
> **QUÉ NO MUERE, y es importante no barrerlo de más:** el **cupo por día
> futuro** sigue existiendo y sigue siendo lo que respalda la promesa; y
> `calcular_promesa_despensa` **conserva su parámetro `p_fecha_programada`**,
> que es motor y no superficie. *Lo que se quita es la puerta, no el motor
> — el día que la fecha programada vuelva por decisión, vuelve sin
> reconstruirse.*
>
> **MECANIZADO:** `verify:diseno` **R52** (R51 ya estaba tomada por otra ley: el número se verificó, no se supuso) — *una ley que vive en el lint no se
> degrada.*

~~**Entra.** Programar con más aviso permite planificar la ruta y sumar
vehículos: es mejor servicio y mejor operación.~~

**La condición que lo hace honesto** *(SIGUE VIGENTE — es del cupo, no del
control)*: el cupo existe **por cada día futuro** y la promesa lo consume.
Un día sin capacidad confirmada no se puede prometer.

### 6.3 El carrito

Instrucciones de envío en texto libre —*dejar en portería, entregar a
fulanito*— con largo acotado. **Las ve el repartidor y no son un canal
de conversación.**

**Cada ítem lleva su destino:** una mascota, o *donación*. El pago se
registra a la cuenta del dueño; **el producto va a quien lo consume.**
Sin esa columna, al entregar habría que adivinar a qué expediente
depositar.

### 6.4 La donación

**Entra a v1, sin destino elegible.** El refugio lo elige e-PetPlace y la
foto de la entrega se manda a mano. **El reparto lo coordina el founder
y no consume cupo.**

**Dos límites heredados, no negociables:** la donación **jamás entra a
ningún expediente** —no hay mascota— y **jamás otorga beneficio
comercial** (`MODELO_LOYALTY` §7.2). *Reconocer una donación con un
descuento la convierte en compra. El agradecimiento es humano, no
contable.*

**Apadrinar y adoptar van a v2** (D-777). Apadrinar —aportes económicos o
en especie a una mascota concreta, sin llevarla a casa— es un concepto
poco usado en la industria y tiene peso comercial propio. Se registra
como candidato, no como compromiso.

### 6.5 El pago simulado

Hasta que exista la pasarela, el pago es simulado. **Una venta simulada
jamás genera liquidación al vendedor ni factura**, y se marca de forma
imposible de confundir. *La lección ya está pagada: hay 137 pedidos
huérfanos de un prototipo esperando limpieza.*

---

## 7. LAS DIRECCIONES

**Validadas contra Google Places**, con alias, campo de referencia
separado, instrucciones de entrega y **punto en el mapa**. Se agregan
desde el momento de comprar, sin salir del flujo.

**Dos decisiones que después son caras:**

1. **Se guarda el identificador de Places, no solo el texto.** Es lo que
   impide que la dirección y el punto se separen con el tiempo.
2. **El punto se puede mover a mano, y es obligatorio.** *Places falla en
   Quito más de lo que uno espera —urbanizaciones nuevas, casas sin
   numeración—. Si Places no encuentra la casa, el punto igual existe.*

**La referencia va aparte de la calle**, porque es lo que el repartidor
lee: *"casa verde, portón negro, frente a la panadería"*.

---

## 8. DESPUÉS DE COMPRAR

### 8.1 Mis pedidos

Del más reciente al más viejo, con el seguimiento adentro.

### 8.2 Los cinco avisos

**Se notifica lo que cambia lo que la persona puede hacer.**

| Aviso | Qué es |
|---|---|
| **Confirmado** | El vendedor lo aceptó. Es el recibo |
| **En ruta** | Salió del local |
| 🔴 **Vamos hacia vos** | Sos el próximo. **Es el único que hace que alguien se quede en casa** |
| **Entregado** | Cerró |
| *(Entrega fallida)* | Solo si pasa |

**Preparado y empacado NO se notifican.** Son operación interna del
vendedor y no le cambian nada al cliente. *Avisar todo enseña a ignorar
los avisos.*

**Push por defecto, y el canal lo elige el cliente.** Cero urgencia
artificial.

### 8.3 Cancelar

**El cliente cancela solo hasta que el pedido se marca preparado.**
Después, el botón cambia a *tengo un problema*.

**El corte es un hecho operativo, no un reloj:** cancelar es gratis
mientras nadie trabajó, y deja de serlo cuando alguien ya trabajó. Usar
un escalón que ya existe evita inventar un cronómetro paralelo.

### 8.4 Tengo un problema

Va a WhatsApp del founder hasta que exista el módulo de postventa
(D-774). **El botón dice a dónde va y en qué horario contestan.**
*Prometer respuesta inmediata a las dos de la mañana es prometer lo que
no se cumple.*

### 8.5 Las dos calificaciones

**La app** y **el pedido o el servicio**. Son dos, para todos los
servicios, y entran **después de cerrar el recorrido de la despensa**
(D-775).

**Tres condiciones:**

1. **El criterio se hereda de Kaxo**, que ya tiene reseñas doble ciego
   construidas y verificadas. *Dos sistemas de reseñas distintos en la
   misma casa es deuda desde el día uno.*
2. **La calificación del prestador jamás se vuelve ranking público.** El
   portal tiene firmado que no hay rankings, y un promedio de estrellas
   visible es un ranking con otro nombre.
3. **La calificación de la app no se pide después de una entrega buena.**
   Cosechar la alegría para inflar la nota es el dark pattern clásico.

---

## 9. 🔴 EL REPARTIDOR ENTRA A v1

**Firma del founder, y enmienda la letra anterior.** El paso *vamos
hacia vos* solo lo puede marcar quien está manejando: el vendedor en su
local no sabe cuál es la próxima casa. **Una vez que el repartidor tiene
pantalla, cuatro huecos se cierran solos.**

### 9.1 La pantalla mínima

**Mis entregas de hoy** — la lista, en orden. Al abrir una: dirección,
punto en el mapa, referencia, instrucciones de entrega y un botón para
llamar.

**Tres acciones y nada más:**

- **Voy hacia acá** — dispara el aviso al cliente.
- **Entregado** — pide **foto** y el **código** que la familia dice en la
  puerta.
- **No había nadie** — abre §9.3.

**Fuera:** rutas, optimización, chat, catálogo, cualquier otro pedido.

### 9.2 Qué ve

**El envío asignado a él y nada más.** Ni catálogo, ni los otros
pedidos, ni una palabra de la mascota. **Se cierra en los permisos del
servidor, jamás en la pantalla.**

### 9.3 La entrega fallida

**Llamar → esperar un rato corto con el reloj a la vista → cumplir la
instrucción de entrega, o volver.**

**La instrucción que el cliente dio al comprar es la que decide**, y por
eso se pide en el momento de comprar y no en la puerta: resuelve la
mayoría de los casos sin que nadie tenga que decidir en la vereda.

**El pedido vuelve, queda en entrega fallida, y se reagenda por
WhatsApp.** El costo del segundo viaje **lo absorbe el vendedor en v1 y
se mide**. Si duele, se cobra en v2 con dato en la mano.

**Y lo que importa para la casa: una entrega fallida JAMÁS deposita en
el expediente.** La compra entra al entregar, y esto no se entregó.

### 9.4 La foto de entrega

**Entra al sistema** (deja de ser un mensaje suelto al vendedor).

> **Su letra de privacidad, firmada:** es la puerta de la casa de una
> familia.
>
> - **La ven el vendedor y el equipo de e-PetPlace. Jamás otro cliente.**
> - **Vive 90 días y se borra** (D-776).
> - **El expediente jamás la toca.**

### 9.5 El GPS

**Entra con el repartidor.** No es construcción nueva: el rastreo en
segundo plano ya está construido y probado para el paseo, y un
repartidor moviéndose hacia una casa es el mismo problema que un
paseador moviéndose con un perro.

---

## 10. LO QUE SIGUE FUERA DE v1

Optimización y asignación de rutas (D-779) · chat y WhatsApp dentro del
envío · courier · segundo vendedor · devolución automatizada · módulo de
postventa · apadrinar y adoptar · venta de mostrador **sin** código de
reclamo · cálculo de flete por zona y peso.

---

## 11. LOS CASOS FEOS NUEVOS

| Caso | Qué hace el sistema |
|---|---|
| **El producto no declara composición** | Lo dice. Jamás calla (§5.4) |
| **El vet no registró recomendación** | La app no la menciona (§5.5) |
| **Google Places no encuentra la dirección** | El punto en el mapa se pone a mano (§7) |
| **El medio de pago recurrente falla** | Se avisa, no se crea el pedido (§6.1) |
| **Se compra para una especie no registrada** | Se ofrece registrarla; la compra sigue (§5.2) |
| **Nadie en la puerta** | La instrucción de entrega decide (§9.3) |

---

## 12. ⚠️ LO QUE ESTA LETRA ENMIENDA

**Se declara, jamás se difiere en silencio.**

**A `LETRA_PANEL_VENDEDOR_S96`, cuatro puntos:**

1. **§0.6 y D-770 — el GPS del repartidor iba a v2. Entra a v1.**
   ☠️ **D-770 nace muerta y hay que depositarla ya enmendada.**
2. **§5 — el repartidor tenía forma pero no flujo. Ahora tiene pantalla.**
3. **§3 — el vendedor marcaba los cuatro escalones. Ahora marca los tres
   del local; el cuarto lo marca quien está en la puerta.**
4. **§9 — la foto viajaba fuera del sistema. Ahora vive adentro, con
   letra de privacidad propia (§9.4).**

**A `MODELO_DESPENSA` v2.1:**

- **§6 y §10** — exclusión dura pasa a **exclusión en la recomendación,
  advertencia en la búsqueda** (§5.4).
- **§11.2** — suscripción y plan recurrente **salen de la lista de lo que
  no entra** (§6.1).
- **§4.1** — no se enmienda: se **aclara** que una oferta por producto no
  significa catálogo chico (§5.1).

---

## 13. DEUDA NUEVA — 🔴 NÚMEROS PROPUESTOS, VERIFICAR ANTES DE DEPOSITAR

| # | Qué | Muerte |
|---|---|---|
| **D-774** | **Módulo de postventa.** Hoy el botón manda a WhatsApp del founder | ☠️ cuando exista el módulo |
| **D-775** | **Las dos calificaciones**, heredando el criterio doble ciego de Kaxo | ☠️ al cerrar el recorrido de la despensa |
| **D-776** | **El borrado de la foto de entrega a los 90 días.** No alcanza con escribirlo: necesita mecanismo | ☠️ cuando el borrado corra solo y esté medido |
| **D-777** | **Apadrinar y adoptar** | v2. Candidato, no compromiso |
| **D-778** | **El cobro recurrente no se puede probar sin pasarela.** El interruptor existe; el primer cobro real espera | ☠️ con la pasarela afiliada |
| **D-779** | **Asignación y optimización de rutas**, y el segundo repartidor | ☠️ cuando el cupo de un día se llene de verdad |

**Y dos que esta letra hereda y no resuelve:**

- **D-770 nace muerta** por §12.1. Se deposita con su muerte escrita.
- **La ficha de D-755 en `DEUDAS_CANONICAS.md`** todavía dice *"dos
  botones"*. Se enmienda con la misma pasada.

---

## 14. LO QUE ESTA LETRA NO RESUELVE

- **La pasarela de pago.** Sin proveedor afiliado no hay primera venta
  real, y ahora además bloquea la recurrencia. **Es lo único del camino
  crítico que no controlamos.**
- **La respuesta escrita de VTEX sobre vender fuera de su sistema con el
  contrato vivo.** Bloquea la primera venta real.
- **El vendedor confirmado**, con sus fotos y su stock.
- **El criterio comercial del flete**, que sigue siendo candidato sin
  firma.

---

## Historial

- **enmienda a §2.2 (13-ago-2026, firma del founder, depositada por A):**
  la cobertura pasa a declararse **por RADIO** (default 15 km · máx 50 km),
  no por polígono ni lista de sectores. La letra completa de la pantalla de
  configuración —que ENTRA a v1— vive en `MODELO_DESPENSA` §8.6bis. §2.3
  intacta: la cobertura sigue siendo del servicio, no del negocio.

- **v1.0 (S96, 12 Ago 2026):** dictada en mesa después del depósito de
  `LETRA_PANEL_VENDEDOR_S96`, a la que enmienda en cuatro puntos. Diecisiete
  firmas del founder en §0. **El repartidor entra a v1 con pantalla, y
  con él el GPS y la foto.** La venta de mostrador se resuelve sin que el
  vendedor toque una identidad: el cliente reclama la compra con un
  código de la factura. La alergia pasa de esconder a advertir. La
  recurrencia entra con cobro directo. La donación entra sin destino
  elegible. Nacen D-774 a D-779, con advertencia de numeración escrita
  por el lío de D-757.
  - ✅ **Nota de depósito (no de mesa):** la verificación que ordena la
    advertencia de la puerta **se corrió antes de escribir una línea**:
    `D-774` a `D-779` estaban **los seis LIBRES** —cero ocurrencias en
    `docs/` y `CLAUDE.md`— y son el bloque contiguo siguiente a `D-773`,
    el más alto en uso. **No hubo que elevar nada y el depósito es
    verbatim.** *La advertencia funcionó igual: se escribió para el caso
    en que los números estuvieran tomados, y correrla cuesta un grep.*
