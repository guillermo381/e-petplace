# MODELO_DESPENSA — El frente de productos

> **Versión: v1.0 — S94 (10 Ago 2026). Sesión de MESA, no de construcción.**
> **Contrastes obligatorios:** `MODELO_PRODUCTO` (éticos §8, la señal
> práctica §6.4) · `BIO_EXPEDIENTE` (los ejes y la forma del evento —
> este doc lo enmienda, ver §6) · `POLITICAS_EPETPLACE` (devoluciones,
> datos del vendedor, privacidad frente a terceros) ·
> `MODELO_FINANCIERO` (se lee ANTES de cualquier precio — regla de la
> casa) · `MODELO_LOYALTY` §5 (la anti-fuente: **la compra alimenta el
> EXPEDIENTE, jamás el loyalty**) · `CONTRATO_TRABAJO`.
>
> **Qué es:** la letra entera del frente de productos — la línea del
> catálogo, quién vende, el recorrido, los casos feos, qué vuelve al
> expediente, y qué NO se construye.
>
> **Estado de la medición:** B1 y B6 **MEDIDOS** contra el ambiente real
> (S94-M1 y S94-M2, 10-ago-2026). Lo que sigue sin verificar está
> marcado 🔴 con su motivo. Regla R1 de la mesa: nada se afirma sin
> medir, tampoco sobre un producto de terceros.

> **DOS HUECOS DECLARADOS EN LA PUERTA (S94-B):**
>
> **1. Este documento se escribió SIN el censo B0 que el propio brief
> exigía.** El censo posterior (S94-A) encontró que el frente NO es
> nuevo: 16 tablas de comercio ya existen, 8 columnas `vtex_*`,
> `producto_asignacion` ya activo en `cat_tipos_evento`, y 137
> cabeceras de pedido del prototipo v2. **Las decisiones del founder
> rigen; el encuadre de "frente nuevo" NO.** Donde la letra dice
> "nace", léase "enmienda algo vivo" — en particular §6.2.
>
> **2. §7.1 se degrada de MEDIDO a DOCUMENTADO.** Afirma en piedra que
> la moneda se edita sin cargo adicional; §11.4 lo pregunta a VTEX
> como duda abierta. Las dos no pueden ser ciertas. Lo medido es que
> técnicamente se edita la política existente; el COSTO no está
> medido — VTEX remite al contrato. **Rige §11.4 hasta que VTEX
> responda por escrito.** El orden obligatorio (moneda → limpieza →
> catálogo) NO se toca: ese sí está medido.
>
> **3. §4.1 y §9.2 fueron CORREGIDAS en S94-C: la v1.0 excluía a la
> despensa de la barra de tabs y era incorrecto.** Rige
> `DISEÑO_EXPERIENCIA` §7 (4ª tab en A6 + ciclo del trono, S50). *Es el
> hueco 1 en su caso concreto: la letra se escribió sin leer la que ya
> regía, y el censo lo destapó.* **Y §2.2bis también se corrigió: su
> aritmética v1.0 mezclaba bases de cálculo.** La cifra que rige es la
> de S94-C, sobre el TOTAL CON IVA.

---

## 1. LO QUE ESTÁ FIRMADO POR EL FOUNDER (no se re-discute)

1. **VTEX es el motor de comercio.** Catálogo, stock, pedidos y la
   maquinaria de tienda viven allá. e-PetPlace pone **el front** y se
   trae los datos que le sirven.
2. **Los SERVICIOS jamás pasan por el catálogo de VTEX.** El motor de
   servicios está construido y es propio. **Línea dura de
   arquitectura, no una preferencia.**
3. **UNA sola oferta visible por producto.** La vitrina la cura
   e-PetPlace. Ver §3.
4. **El vendedor factura; e-PetPlace cura y cobra comisión** (Forma B,
   §2). Comisión propia: **10%, modificable.**
5. **La cuenta opera en USD / Ecuador.** Ver §7.1.
6. **La despensa entra al soft launch de octubre.** Alcance v1 en §9,
   con corte de exclusiones el **15 de septiembre**.

---

## 2. QUIÉN VENDE — LA FORMA B

### 2.1 La decisión

**El vendedor es el vendedor de registro: él factura al cliente final
y absorbe los costos financieros. e-PetPlace cura la vitrina, pone la
experiencia y cobra comisión sobre el producto.**

Se evaluaron tres formas y se descartaron dos:

| Forma | Qué es | Por qué NO |
|---|---|---|
| **A · 1P puro** | e-PetPlace compra y revende | Capital de trabajo, riesgo de stock muerto y una operación de compras que hoy no existe. Es un negocio nuevo, no una funcionalidad |
| **C · Intermediación** | e-PetPlace cobra todo y reparte | Convierte a e-PetPlace en el comercio ante el banco: absorbe 5,4–8,9% de cada venta. Además, facturar lo que no se compró es un problema tributario que le toca a un contador, no a esta mesa |
| **B · Vitrina curada** ✅ | El vendedor factura, e-PetPlace elige la oferta | Da la vitrina de una sola opción **sin** el costo financiero. Y escala al segundo vendedor sin rehacer el modelo |

### 2.2 El principio de transparencia de costos (founder, S94)

> **La comisión de e-PetPlace es por el servicio de e-PetPlace. Los
> costos de terceros — banco, procesador, plataforma — se muestran
> como lo que son: de terceros.**

El vendedor ve su liquidación desglosada, jamás un número único que
parezca todo nuestro. *Un 20% opaco y un 12% transparente pueden dejar
lo mismo, pero el segundo se puede defender en una mesa y el primero se
renegocia todos los meses.*

Corolario: **la Forma B permite que el vendedor crezca.** Si él factura
y opera, construye historial y relación bancaria propios. Con la Forma
C nunca los construye — se lo vuelve dependiente en vez de hacerlo
crecer, que era justo lo contrario de la intención del founder.

### 2.2bis 🔴 ENMIENDA S94-B — El 10% es LIBRE, y la aritmética completa

**Letra del founder (S94-B):** **la comisión de e-PetPlace es 10%
LIBRE.** Los costos de terceros — **comisión bancaria, procesador y
take rate de VTEX** — **corren por cuenta del seller**.

Es la §2.2 llevada a su consecuencia: si los costos de terceros se
muestran como de terceros, también se **pagan** como de terceros. El
10% no absorbe nada.

**LA BASE, FIJADA (founder, S94-C): el 10% se calcula sobre el TOTAL
CON IVA.**

**La aritmética completa, escrita para que nadie la descubra tarde.**
Sobre una venta de **USD 100 + IVA** (el cobro al cliente es **115**):

| Concepto | Monto | |
|---|---:|---|
| Banco, crédito corriente | $5,31 | |
| Nuvei + 3DS + IVA | $2,03 | |
| VTEX 2,50% | $2,88 | |
| **e-PetPlace 10% s/115** | **$11,50** | |
| **Fricción total** | **$21,72** | **= 18,9% del cobro** |

**El seller recibe $93,28 · paga $15 de IVA al SRI · le quedan ~$78
sobre un producto de $100.**

**Con débito:** fricción **$17,74 = 15,4%**. Le quedan **~$82**.

> **ESTA es la cifra que va a la ficha del piloto (D-745).**
>
> **🔴 La aritmética de la v1.0 de este §2.2bis (~13,7% crédito ·
> ~11,4% débito) era ERRÓNEA: mezclaba bases de cálculo** — sumaba
> porcentajes tomados unos sobre el producto y otros sobre el total.
> Queda anulada. *Un número que se le muestra a un vendedor real no
> puede estar mal: es la conversación entera.*

### 2.3 Lo que e-PetPlace absorbe

Los **USD 500/mes** de tarifa fija de VTEX. Decisión del founder, S94.

**Punto de equilibrio, escrito para que nadie lo descubra tarde:** al
10% de comisión, los USD 500 fijos se cubren con **~USD 5.000 de
comisión, es decir ~USD 50.000 de GMV mensual**. Hoy no está cerca. Es
un dato del modelo, no una alarma — pero es el número que ordena la
conversación de calendario (§10).

---

## 3. LA LÍNEA DEL CATÁLOGO

### 3.1 La vitrina: una oferta por producto

**Tesis del founder, S94, textual:** *"como cliente odio que del mismo
producto me ofrezcan 100 SKUs con precios diferentes, cuando ya debería
ofrecerme la mejor opción."*

La mesa la sostiene y agrega el argumento que la vuelve estructural:
**la despensa de e-PetPlace no compite por precio, compite por
criterio.** Si la app conoce a la mascota —especie, talla, edad,
condición— y aun así muestra siete opciones para que la familia elija,
está admitiendo que no sabe. **La ventaja competitiva de §5 exige una
sola oferta por producto. Son la misma decisión.**

Mecanismo: el seller manda su SKU, e-PetPlace decide si entra y cómo se
ve (el *matcher* de VTEX). **La curaduría es una decisión de
plataforma, no una consecuencia de quién factura.**

### 3.2 El cinturón: cómo se impide POR DISEÑO que un servicio termine en VTEX

**Un cinturón, no una nota.** Reglas de construcción:

1. **El motor de servicios no tiene ningún camino de escritura hacia el
   catálogo de VTEX.** No es una regla de proceso: es que la ruta no
   existe en el código.
2. **Ningún objeto del dominio de servicios (agenda, prestador, paseo,
   consulta) puede producir un SKU.** Si una superficie parece
   pedirlo, se frena y se eleva.
3. La revisión de catálogo la hace e-PetPlace producto por producto
   (§3.1). Un servicio disfrazado de producto se detiene ahí.

### 3.3 🔴 LA REGLA INVERSA: TODO PRODUCTO VA AL OMS DE VTEX

**Hallazgo del MSA (cláusula 6.1.7.1), y tiene penalidad con número.**

VTEX exige que **todo pedido de producto quede registrado en su OMS**.
Cobrar un producto por fuera es "incumplimiento grave": **6 veces la
última facturación mensual** más terminación unilateral.

**Consecuencia de diseño, en piedra:**

- Todo lo que se cobre como producto **se registra en el OMS de VTEX**,
  sin excepción.
- La frontera servicios/productos deja de ser solo una preferencia
  nuestra: **es bidireccional y una de sus mitades tiene multa.**

### 3.4 Los casos borrosos, resueltos

| Caso | Resolución |
|---|---|
| **Plan de alimento recurrente** | **Fuera de v1** (§9.2). Cuando entre: es PRODUCTO, va por VTEX y su OMS. VTEX tiene Subscriptions API nativa — se evalúa contra construcción propia cuando llegue el disparo |
| **Paquete que mezcla baño y shampoo** | **No existe como objeto único.** Se venden por separado: el baño por el motor de servicios, el shampoo por la despensa. Un objeto que cruza la línea es exactamente lo que §3.2 impide |
| **Producto entregado durante un servicio** | 🔴 **ZONA DE RIESGO CONTRACTUAL** (§3.3). Si el veterinario entrega un antipulgas en la consulta y se cobra por el motor de servicios, puede leerse como pedido de producto fuera del OMS. **Criterio v1: lo que se cobra aparte es producto y va por la despensa; lo aplicado durante el acto clínico es insumo del servicio y se documenta en el expediente, no se vende.** Ratificar con VTEX antes de habilitar cualquier cobro mixto |

### 3.5 El carrito: separado en v1

**Servicios y productos son compras separadas.** Un carrito unificado
significa dos cobros, dos ciclos y dos comisiones detrás de una sola
pantalla.

**Se declara sin adorno: es peor para la familia y es la única forma de
llegar a octubre.** Queda como deuda de producto, no como decisión
permanente.

---

## 4. EL RECORRIDO DE LA FAMILIA

### 4.1 Dónde vive — 🔴 CORREGIDA EN S94-C (la v1.0 estaba mal)

> **La v1.0 de este §4.1 excluía a la despensa de la barra de tabs. Era
> incorrecto y se corrige acá.** El error de fondo: se escribió sin
> conocer `DISEÑO_EXPERIENCIA` §7, que ya tenía la respuesta firmada
> desde S50. *No era letra vieja que había que enmendar: era letra
> nueva escrita sin leer la que ya regía.*

**La despensa ocupa el tab que está disponible para ella en la barra**
(palabra del founder, S94-C). **`DISEÑO_EXPERIENCIA` §7 y su CICLO DEL
TRONO RIGEN, no se enmiendan:** la Despensa entra como **4ª tab en
A6** y **cuando llegue Comunidad, Comunidad va al centro** — la
Despensa le entrega el trono y no pierde nada, porque para entonces la
recompra ya vive en el Home y en el módulo de nutrición del perfil.

**Entrada principal: desde el expediente de la mascota.** No una tienda
genérica con categorías. *"El alimento de Thor"*, no *"Categoría:
Alimentos"*.

Razón: la despensa que se justifica es la que sabe para quién compra —
**y eso no depende de dónde esté la puerta, sino de qué hay del otro
lado.** El tab da alcance; el expediente da criterio. La tesis de §5 se
sostiene con las dos cosas, no en contra de una de ellas.

Entrada secundaria: una superficie dentro de Explorar.

### 4.2 Las pantallas

1. **Descubrir** — desde el expediente, con la recomendación de §5.
2. **Producto** — foto, nombre, precio, presentación, y **el porqué de
   la recomendación** ("para perros de talla media, 3 a 7 años").
3. **Carrito** — solo productos (§3.5).
4. **Pagar** — corriente y débito. Sin diferido (§9.2).
5. **Seguir el pedido** — estados desde el OMS de VTEX vía hook (§7.4).
6. **Recibir** — confirmación, y el evento entra al expediente (§6).

Voz del producto: tuteo neutro latinoamericano, bilingüe es+en de
nacimiento (DEFINICION_SOFTLAUNCH).

---

## 5. LA VENTAJA COMPETITIVA — LO QUE UNA TIENDA COMÚN NO PUEDE

**Este bloque es la razón de existir del frente entero. Se diseña
ahora, no después.**

La despensa recomienda **desde la mascota real que ya vive en el
expediente**: especie, talla, edad, momento vital, condiciones y
alergias documentadas.

| Señal del expediente | Qué habilita |
|---|---|
| Especie y raza | Filtrado duro: nada que no aplique |
| Talla y curva de peso | Presentación y porción correctas |
| Momento vital (M1–M5) | Cachorro / adulto / senior — la fórmula cambia |
| Condiciones y alergias | 🔴 **Exclusión dura**: jamás recomendar algo contraindicado |
| Periodicidad de antiparasitarios | El recordatorio de §6.3 |

**Límite ético, heredado de `MODELO_LOYALTY` §7.6 y P11:** *los
beneficios jamás distorsionan recomendaciones clínicas.* Acá se lee
así: **la despensa jamás recomienda por margen.** Si hay dos productos
válidos, manda el criterio de cuidado, no el que deja más. Y una alerta
de cuidado existe por la mascota, nunca para vender.

---

## 6. QUÉ VUELVE AL BIO-EXPEDIENTE

**Sin esto, la tienda de VTEX sola alcanzaba.**

### 6.1 Qué compra es dato de cuidado

**SÍ entra al expediente:** alimento (cruzado con la curva de peso),
suplementos, antiparasitarios y antipulgas (con su periodicidad),
dietas de prescripción.

**NO entra:** juguetes, accesorios, camas, higiene general. Son compra,
no cuidado.

### 6.2 Cómo entra sin romper la letra del expediente

**Enmienda a `BIO_EXPEDIENTE`:** nace la compra como **fuente de
evento**, con estas condiciones:

1. **Append-only**, como todo el expediente.
2. **Porta su procedencia de nacimiento**: el evento declara que fue
   **aportado por la familia**, no por un profesional. El expediente
   **sí distingue la fuente** — es el mismo principio del muro
   verificado/declarado de `MODELO_PRESENCIA` §4. Un alimento comprado
   no tiene el peso de una prescripción veterinaria, y la pantalla no
   los puede confundir.
3. **No alimenta el loyalty.** `MODELO_LOYALTY` §5 es explícito:
   *comprar mucho no es cuidar mejor*. La compra alimenta el
   expediente; el motor de progreso no la ve. **Sin excepción.**
4. Eventos aportados por menores no acumulan (P5).

### 6.3 Qué se le devuelve a la familia

**Esto es el producto, no el catálogo:**

- Avisar cuándo se está acabando el alimento, calculado por porción y
  fecha de compra.
- Recordar el antipulgas por su periodicidad real.
- Sugerir la presentación siguiente cuando el cachorro crece.

**Con la vara de `MODELO_LOYALTY` §6:** se celebra, jamás se reprocha.
Cero urgencia artificial, cero FOMO, cero "vas a perder". Un
recordatorio de antipulgas es cuidado; un contador regresivo para
comprar es un dark pattern.

### 6.4 Privacidad frente al vendedor

**Por defecto, el vendedor no ve NADA del expediente.** Ve el pedido:
qué, cuánto, dónde entregar. **Lo contrario es freno 4 y no se negocia
en esta mesa.**

**Enmienda a `POLITICAS_EPETPLACE`:** queda escrito que el expediente
no es dato compartible con terceros comerciales bajo ninguna
configuración.

---

## 7. LO MEDIDO — REGLAS TÉCNICAS EN PIEDRA

Todo lo de esta sección salió de S94-M1 y S94-M2 contra el ambiente
real. No es documentación de VTEX: es comportamiento verificado.

### 7.1 La moneda — ORDEN OBLIGATORIO

La cuenta nació configurada **COL / es-CO / COP**. El founder firmó
**USD / Ecuador**.

**La ventana está abierta hoy y se cierra sola:** se edita la política
comercial existente (Store Settings → Channels → Trade Policies →
Edit), no hace falta una nueva, y por lo tanto **no dispara cargo
adicional**. Es a mano; no hay API.

> **🔴 ORDEN OBLIGATORIO, EN PIEDRA:**
> **1) la moneda · 2) la limpieza · 3) el catálogo.**
>
> Hoy el cambio no arrastra nada porque no hay nada cargado. Cada
> producto, precio y tabla de flete que entre antes es trabajo que hay
> que rehacer — y VTEX **no publica** qué pasa con los precios
> existentes al cambiar la moneda de una política viva. No hay manual.

### 7.2 La vitrina propia es viable — con el buscador legacy

- ✅ El catálogo se lee **headless**, sin storefront de VTEX, en menos
  de un segundo.
- 🔴 **Intelligent Search NO sirve**: responde *"Store is not active"*.
  Exige una tienda VTEX IO activa — **el front de VTEX que decidimos no
  usar**.
- ⇒ **La búsqueda de la despensa se construye sobre la Search API
  legacy**, que sí funciona headless. Con catálogo chico alcanza; ver
  §9.3.

### 7.3 La trampa del 200 — regla de integración no negociable

La simulación de carrito **devuelve HTTP 200 aunque no pueda vender
nada**. El fracaso viaja en el cuerpo, no en el status.

> **Toda integración con VTEX lee `items` y `messages`. JAMÁS el status
> code.** Un cliente que confíe en el 200 muestra un carrito vacío como
> si fuera exitoso.

Lo bueno: la simulación **es pública** — no exige credenciales ni
política comercial. **La vitrina puede consultar precio y
disponibilidad sin exponer llaves en el cliente.** Coherente con la ley
de la casa sobre la anon key.

### 7.4 El caché de 300 segundos

Las respuestas de catálogo traen caché de borde de **5 minutos**. Un
cambio de precio o de stock puede tardar hasta 300 s en verse.

**Consecuencia para la promesa al cliente:** el precio de la vitrina es
indicativo; **el precio que vale es el de la simulación al momento de
comprar**. La pantalla nunca promete un precio que la simulación pueda
contradecir.

### 7.5 Lo que hoy NO existe y hay que construir

| Pieza | Estado medido | Qué implica |
|---|---|---|
| **Pasarelas de pago** | **CERO** afiliaciones, cero reglas | La cuenta no puede cobrar un centavo. Nada heredado que desarmar |
| **Impuestos** | `taxConfiguration: null` | El IVA ecuatoriano se arma desde cero. **No estaba en ninguna estimación previa** |
| **Feed / Hook de OMS** | No existe | Hoy no hay forma de enterarse de que entró un pedido |
| **Limpieza de fábrica** | 4 objetos demo | Categoría, marca, producto id 1 y SKU id 1: se borran. Almacén, doca y transportadora **se conservan y reconfiguran** |

### 7.6 Límites

45.000 peticiones/minuto por cuenta, 15.000 por endpoint (Catalog API).
Amplio. **VTEX no declara límites en cabeceras** — no hay `RateLimit-*`
ni `Retry-After`: el techo se descubre chocando. La integración se
diseña con cola y backoff desde el día uno.

---

## 8. LOS CASOS FEOS

**Los productos traen problemas que los servicios no tienen.**

| Caso | Resolución v1 |
|---|---|
| **Sin stock** | La simulación es la verdad (§7.4). Si no hay stock al comprar, la pantalla lo dice antes del pago, con la alternativa curada si existe |
| **Entrega fallida** | Responsable operativo: el vendedor. **Cara visible ante la familia: e-PetPlace.** Atención humana en v1 |
| **Producto equivocado** | Ídem. Se resuelve por atención, no por flujo automatizado |
| **Devolución** | 🔴 **No automatizada en v1.** Se maneja por atención humana con criterio escrito en `POLITICAS`. Automatizarla es v2 |
| **Producto contraindicado** | **No debe llegar a ocurrir**: §5 lo excluye antes de mostrarlo. Si ocurre, es bug de severidad alta, no caso de atención |

**Enmienda a `POLITICAS_EPETPLACE`:** nace el capítulo de devoluciones y
responsabilidad de producto, con la distinción responsable operativo
(vendedor) / responsable de la experiencia (e-PetPlace).

---

## 9. EL ALCANCE v1

### 9.1 Lo que entra

- **Tres familias, y solo tres**: alimento · antiparasitarios y
  antipulgas · suplementos. **Son exactamente las que alimentan el
  expediente** (§6.1).
- El recorrido completo de §4.
- La recomendación desde el expediente (§5).
- La compra como evento del expediente (§6).
- Pago corriente y débito.

### 9.2 Lo que NO entra — decidido, no en evaluación

Estas exclusiones **no dependen del ritmo de construcción**: son de
plata o de riesgo.

- **Diferido en cualquier forma.** Comisión bancaria de 5% a 15% según
  plazo y banco (medido en la calculadora de Nuvei). Para tickets de
  USD 30–80 no se sostiene.
- **Suscripción / plan recurrente.**
- **Segundo vendedor.**
- **Carrito unificado con servicios** (§3.5).
- **Devolución automatizada** (§8).
- ~~**Pestaña propia en la barra** (§4.1).~~ ☠️ **RETIRADA EN S94-C:** era
  incorrecta. **La despensa SÍ ocupa su tab** — rige
  `DISEÑO_EXPERIENCIA` §7 (4ª tab en A6 + ciclo del trono). Ver §4.1.

### 9.3 En EVALUACIÓN hasta el 15 de septiembre

**Decisión de método del founder (S94): medir el ritmo real antes de
recortar.** Correcto — es la regla R1 aplicada a nuestro propio
trabajo. Pero el brief exige la contracara: *una primera versión sin
lista de exclusiones se vuelve todas las versiones.*

> **PUNTO DE CONTROL: 15 DE SEPTIEMBRE.** Ese día el founder firma la
> lista final con el ritmo medido en la mano. Quedan ~5 semanas de
> construcción después — el mínimo honesto para octubre.

| Candidato | Dato que ya pesa en la decisión |
|---|---|
| **Juguetes, accesorios, camas** | No alimentan el expediente (§6.1). Suman catálogo y operación sin sumar diferencial |
| **Búsqueda avanzada con filtros** | 🔴 Intelligent Search no está disponible sin front de VTEX (§7.2). Construirla propia es trabajo real. Con catálogo chico, se navega |

---

## 10. EL CALENDARIO

**Firmado por el founder: la despensa entra al soft launch de octubre.
Es indispensable.**

Lo que la mesa pone al lado de esa firma, sin discutirla:

- **El ambiente se paga desde el 27-feb-2026 y nunca estuvo en
  producción.** `Account status: Not in production`, `Go-live date: —`.
- **~7-8 semanas** hasta octubre, conviviendo con la landing, la sesión
  de login y la segunda pasada de performance.
- **Trabajo que apareció recién con la medición** y no estaba en
  ninguna estimación: afiliar pasarela, reglas de pago, IVA ecuatoriano
  desde cero, feed/hook de pedidos.
- Referencia externa: la propuesta de Medialab estimaba **3–4 meses
  solo para el lado VTEX**, sin la app.

**Fechas duras del contrato:**

| Fecha | Qué |
|---|---|
| **15 de septiembre de 2026** | Corte de alcance v1 (§9.3) |
| **Fin de noviembre de 2026** | 🔴 Última fecha para avisar no renovación (MSA §10.1 pide 90 días; el Anexo dice 60 — se toma el plazo largo) |
| **~27 de febrero de 2027** | Renovación automática por 12 meses |

---

## 11. PREGUNTAS ABIERTAS A VTEX (bloquean decisiones, no construcción)

1. Qué se factura desde febrero si la cuenta nunca estuvo en
   producción (2 facturas pagadas).
2. **Alcance de la cláusula 14.7**: ¿"Powered by VTEX" debe aparecer en
   las apps nativas o solo en el checkout? Incumplir = **+5% de
   facturación**. Choca con la tesis de `MODELO_PRESENCIA`.
3. ¿Existe un "Monto Terminación" definido? El Anexo lo menciona; el
   MSA no lo define.
4. ¿La política comercial COL/COP puede pasar a Ecuador/USD editándola,
   sin ambiente ni cargo adicional?
5. ¿Por qué se configuró para Colombia si el proyecto siempre fue
   Ecuador? (buscar respaldo escrito en la negociación)
6. Ratificar por escrito los montos de política comercial adicional
   (USD 250) y ambiente adicional (USD 500).
7. **§3.4:** ¿un producto entregado durante un servicio y cobrado por
   fuera del OMS activa la penalidad de 6.1.7.1?

---

## 12. LA MESA PENDIENTE

**Está firmado que la despensa entra a octubre. NO está firmado que
entre SOBRE VTEX.**

Son dos decisiones distintas y la segunda merece mesa propia. El
material para tomarla ya existe: el MSA leído, la medición completa, y
la tensión declarada — *la maquinaria multi-vendedor de VTEX, que es lo
mejor que ofrece, es justo la que el modelo de vitrina curada con un
solo vendedor no usa todavía.*

**Los costos ya pagados no cuentan para esa decisión.** Son plata
gastada; seguir por eso es la trampa clásica.

---

## Historial

- **v1.0 (S94, 10 Ago 2026):** redacción inicial sobre medición real
  del ambiente (S94-M1 y M2), el Anexo 1 y el MSA. Forma B firmada,
  comisión 10% modificable, USD/Ecuador firmado, alcance v1 con corte
  15-sep. Regla del OMS (§3.3) y sus penalidades incorporadas como
  línea dura. Enmiendas declaradas a `BIO_EXPEDIENTE` (§6.2) y
  `POLITICAS_EPETPLACE` (§6.4, §8).
