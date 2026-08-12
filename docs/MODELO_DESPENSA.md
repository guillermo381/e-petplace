# MODELO_DESPENSA — El frente de productos

> **Versión: v2.0 — S95 (11 Ago 2026). Sesión de MESA. Enmienda mayor.**
>
> **Qué cambió respecto de v1.0, en una línea: el motor de comercio deja
> de ser VTEX y pasa a ser propio.** VTEX queda como **fuente de
> inspiración de modelo, no como dependencia de producto** (firma del
> founder, S95). La v1.0 no se borra: se conserva su historial y se
> declara pieza por pieza qué muere, qué sobrevive y por qué.
>
> **Contrastes obligatorios:** `MODELO_PRODUCTO` (éticos §8, la señal
> práctica §6.4) · `BIO_EXPEDIENTE` (los ejes, la forma del evento y
> **PE7**, que este doc paga — ver §7) · `POLITICAS_EPETPLACE`
> (devoluciones, datos del vendedor, privacidad frente a terceros) ·
> `MODELO_FINANCIERO` (se lee ANTES de cualquier precio — regla de la
> casa) · `MODELO_LOYALTY` §5 (la anti-fuente: **la compra alimenta el
> EXPEDIENTE, jamás el loyalty**) · `DISEÑO_EXPERIENCIA` §7 (la barra y
> el ciclo del trono — **RIGE**) · `PORTAL_PRESTADOR` §S20 (portales
> hermanos — **este doc lo enmienda, ver §8**) · `CONTRATO_TRABAJO`.

> ## TRES HUECOS DECLARADOS EN LA PUERTA (S95)
>
> **1. Los reportes S94-M1 y S94-M2 no se leyeron de primera mano en
> esta sesión.** No estaban en el paquete. Todo lo que este documento
> dice sobre el ambiente de VTEX viene citado del §7 de la v1.0:
> **es HEREDADO, no MEDIDO acá.** Donde importa, está marcado. Regla R5
> de la casa: lo que no está medido no se afirma — y esto se declara en
> vez de afirmarse.
>
> **2. El censo del subsistema de comercio vivo (16 tablas, 8 columnas
> `vtex_*`, `producto_asignacion` activo, 137 cabeceras huérfanas) NO se
> ejecutó.** Esta letra decide sobre un terreno que todavía no se
> releyó. **B0.5 del arranque S95 sigue siendo precondición: ninguna
> migración se escribe antes del censo.** *El peor resultado posible
> sigue siendo crear una tabla al lado de una que ya existe.*
>
> **3. El flete no tiene dato.** Es el mayor costo escondido de esta
> decisión y depende enteramente de cómo entrega el vendedor real
> (D-745). El criterio v1 de §11.2 está escrito como **candidato**, y se
> firma o se cae con esa llamada.

---

## 1. LO QUE ESTÁ FIRMADO POR EL FOUNDER (no se re-discute)

**De S94, vigente:**

1. **Forma B.** El vendedor es el vendedor de registro: él factura al
   cliente final y absorbe los costos financieros. e-PetPlace cura la
   vitrina, pone la experiencia y cobra comisión. Ver §2.
2. **Comisión de e-PetPlace: 10% sobre el TOTAL CON IVA.**
   **Parámetro configurable, jamás constante en código.**
3. **UNA sola oferta visible por producto.** La vitrina la cura
   e-PetPlace. Ver §4.
4. **La cuenta opera en USD / Ecuador.**
5. **Los SERVICIOS jamás pasan por el catálogo de productos.** Línea
   dura de arquitectura, no una preferencia. Ver §3.4.
6. **La despensa entra al soft launch de octubre.** Alcance v1 en §11,
   con corte de exclusiones el **15 de septiembre**.
7. **La despensa ocupa su tab en la barra.** `DISEÑO_EXPERIENCIA` §7 y
   el ciclo del trono RIGEN: 4ª tab en A6; cuando llegue Comunidad,
   Comunidad va al centro.

**De S95, nuevo:**

8. 🔴 **EL MOTOR DE COMERCIO ES PROPIO. VTEX ES FUENTE DE INSPIRACIÓN,
   NO DEPENDENCIA.** Deroga el punto 1 de la v1.0 (*"VTEX es el motor de
   comercio"*). Ver §3.
9. **Una sola app de negocios: `e-PetPlace Negocios`.** El vendedor
   vive como **rol sobre `cuentas_comerciales`**, dentro de la app que
   hoy es del prestador. **No hay tercera app.** Ver §8.
10. **El vendedor PROPONE; e-PetPlace PUBLICA.** La puerta de carga
    desde la app existe, y no publica: propone. Ver §4.2.
11. **Se protege la puerta de la asistencia por IA sin construirla en
    v1.** Ver §14.

---

## 2. QUIÉN VENDE — LA FORMA B

### 2.1 La decisión

**El vendedor factura al cliente final y absorbe los costos
financieros. e-PetPlace cura la vitrina, pone la experiencia y cobra
comisión sobre el producto.**

Se evaluaron tres formas y se descartaron dos:

| Forma | Qué es | Por qué NO |
|---|---|---|
| **A · 1P puro** | e-PetPlace compra y revende | Capital de trabajo, riesgo de stock muerto y una operación de compras que hoy no existe. Es un negocio nuevo, no una funcionalidad |
| **C · Intermediación** | e-PetPlace cobra todo y reparte | Convierte a e-PetPlace en el comercio ante el banco: absorbe 5,4–8,9% de cada venta. Además, facturar lo que no se compró es problema de un contador, no de esta mesa |
| **B · Vitrina curada** ✅ | El vendedor factura, e-PetPlace elige la oferta | Da la vitrina de una sola opción **sin** el costo financiero. Y escala al segundo vendedor sin rehacer el modelo |

### 2.2 El principio de transparencia de costos (founder, S94)

> **La comisión de e-PetPlace es por el servicio de e-PetPlace. Los
> costos de terceros — banco, procesador — se muestran como lo que son:
> de terceros.**

El vendedor ve su liquidación desglosada, jamás un número único que
parezca todo nuestro. *Un 20% opaco y un 12% transparente pueden dejar
lo mismo, pero el segundo se puede defender en una mesa y el primero se
renegocia todos los meses.*

Corolario: **la Forma B permite que el vendedor crezca.** Si él factura
y opera, construye historial y relación bancaria propios.

### 2.3 🔴 LA ARITMÉTICA — RECALCULADA EN S95

**Qué cambió:** desaparece el take rate de VTEX (2,50%). Nada más se
movió: el 10% sigue siendo LIBRE y sobre el TOTAL CON IVA, y los costos
de terceros los sigue pagando el vendedor.

Sobre una venta de **USD 100 + IVA** (el cobro al cliente es **115**):

| Concepto | Crédito corriente | Débito |
|---|---:|---:|
| Banco | $5,31 | $1,33 |
| Procesador + 3DS + IVA | $2,03 | $2,03 |
| ~~VTEX 2,50%~~ | ☠️ **$0,00** | ☠️ **$0,00** |
| **e-PetPlace 10% s/115** | **$11,50** | **$11,50** |
| **Fricción total** | **$18,84 = 16,4%** | **$14,86 = 12,9%** |
| **El vendedor recibe** | **$96,16** | **$100,14** |
| **Menos IVA al SRI ($15)** | **~$81** | **~$85** |

> **ESTA es la cifra que va a la ficha del piloto (D-745).** Contra la
> aritmética de S94-C, el vendedor mejora **+$3 con crédito y +$3 con
> débito sobre cada venta de $100**. Es munición directa de la
> conversación con el vendedor real, no una mejora contable interna.
>
> **Nota de honestidad sobre el desglose de débito:** el número del
> banco en débito se deriva de la fricción total que la v1.0 declaró
> medida en la calculadora del procesador. **La fila del banco en débito
> es HEREDADA, no re-medida en S95.** El total sí es aritmética directa.

### 2.4 Lo que e-PetPlace absorbe — enmendado en S95

**La despensa deja de tener costo fijo de plataforma propio.** Corre
sobre la infraestructura que el ecosistema ya paga.

**Consecuencia que hay que ver y no celebrar de más:** el punto de
equilibrio de la v1.0 (~USD 5.000 de comisión, ~USD 50.000 de GMV
mensual, para cubrir los USD 500/mes de VTEX) **deja de ser una
condición estructural del frente.** Pasa a ser un costo heredado con
fecha de vencimiento: ver §13.

---

## 3. EL MOTOR DE COMERCIO ES PROPIO

### 3.1 La decisión y su razón (founder, S95)

**VTEX entró cuando la casa no sabía construir comercio, y era la
decisión correcta en ese momento.** Comprar plataforma cuando no sabés
construir es prudencia. **Conservarla cuando ya sabés es inercia.**

Lo que movió el piso, y está a la vista en el propio repo: un motor de
servicios completo, el Bio-Expediente con sus tablas, triggers y RPCs,
un motor de notificaciones con 37 tipos de evento, GPS en background,
documentos clínicos, un ledger append-only. **Un catálogo con carrito es
más simple que casi todo eso.**

Las cuatro razones originales, auditadas:

| Razón de entrada | Estado en S95 |
|---|---|
| **"No sabíamos construir"** | ☠️ **Caducó.** Es la única que cambió del todo, y cambió del todo |
| **Escalabilidad** | ☠️ **No aplica al caso.** El equilibrio del propio modelo está en ~800 pedidos/mes: 27 por día. Y lo que VTEX escala bien —maquinaria multi-vendedor, matcher, Subscriptions— es justo lo que §11.2 deja fuera de v1 |
| **Seguro y confiable** | ☠️ **No era de VTEX.** Lo que hay que proteger es el expediente clínico, que vive en Supabase bajo RLS desde siempre. El PCI de la tarjeta lo transfiere la pasarela, con o sin VTEX en la cadena |
| **Performance sin pagar el precio de escalar** | ☠️ **Invertida.** El 2,50% no es evitar el precio de escalar: **es un precio que crece con el éxito, para siempre** — y en Forma B lo paga el vendedor, que es la persona que todavía hay que convencer |

**Y el modo de falla que se quita:** con VTEX, un pedido dependía de
Supabase **y** de VTEX **y** de la sincronía entre los dos. Sacarlo
quita un modo de falla; no agrega ninguno.

### 3.2 Qué se copia de VTEX y qué no

**Se copia (es buen maestro y sale gratis):**

- **Producto canónico ≠ SKU del vendedor ≠ oferta visible.** Tres
  entidades, no una. *Y no es de VTEX: `BIO_EXPEDIENTE` PE7 ya lo
  escribió en S12 —"sellers como dueños de SKUs específicos pero
  productos como entidades canónicas"—. La inspiración ya estaba en la
  casa antes de que VTEX entrara. Este documento paga PE7.*
- **Reserva de stock con bloqueo al confirmar**, no al agregar al
  carrito.
- **Estados del pedido explícitos y append-only**, con el mismo patrón
  del ledger de la casa: el estado no se pisa, se agrega.
- **El vendedor es dueño de su SKU; la plataforma es dueña de la
  vitrina.**

**No se copia (son verrugas de su arquitectura, no lecciones):**

- El caché de borde de 300 segundos y su consecuencia — que el precio
  de vitrina sea solo indicativo. Ver §9.1.
- El HTTP 200 con el fracaso en el cuerpo. La lección general
  sobrevive; el patrón no se imita. Ver §9.3.
- La maquinaria multi-vendedor y el matcher: capacidad que v1 no usa.

### 3.3 El modelo de datos — conceptual, sobre lo que existe

**Precondición innegociable (B0.5): se construye SOBRE el subsistema de
comercio vivo, jamás al lado.** El censo decide, pieza por pieza, qué
sirve tal cual, qué se enmienda y qué se jubila. **Esta sección describe
el destino, no autoriza la migración.**

| Entidad | Qué es | Regla que la gobierna |
|---|---|---|
| **Producto canónico** | La entidad de la casa: "alimento X, adulto, 15 kg". Independiente de quién lo venda | Es de e-PetPlace. Porta los atributos que la recomendación de §6 necesita: especie, talla, momento vital, ingredientes activos |
| **SKU del vendedor** | Lo que el vendedor efectivamente tiene, con su código propio | Es del vendedor. Se propone; no se publica solo (§4.2) |
| **Oferta** | El precio y la disponibilidad visibles hoy | **UNA por producto canónico** (§4.1). La cura e-PetPlace |
| **Stock** | Movimientos, no un número que se pisa | Append-only. La reserva se bloquea al confirmar |
| **Pedido / ítem** | La compra | **Jamás comparte tabla con las citas de servicio** (§3.4) |
| **Estado del pedido** | La máquina de estados | Append-only, auditable, con quién lo movió |
| **Comisión** | El 10% | **Parámetro configurable con valor inicial 10%.** Jamás constante en código |

**Policies desde el primer día.** Sin `ALL` para nadie. El vendedor ve
su pedido; jamás el expediente (§7.4).

### 3.4 El cinturón servicios/productos — 🔴 MÁS IMPORTANTE AHORA, NO MENOS

**Advertencia estructural de S95.** En la v1.0 la frontera tenía dos
mitades y una tenía multa: la cláusula 6.1.7.1 de VTEX castigaba con 6×
la facturación mensual cobrar producto fuera de su OMS. **Al salir de
VTEX, esa mitad desaparece.**

> **La frontera ahora se sostiene SOLO en nuestra disciplina de
> esquema. Por lo tanto tiene que estar EN el esquema, no en un
> documento.**

Reglas de construcción:

1. **El motor de servicios no tiene ningún camino de escritura hacia el
   catálogo de productos.** No es regla de proceso: la ruta no existe en
   el código.
2. **Ningún objeto del dominio de servicios (agenda, prestador, paseo,
   consulta) puede producir un SKU.** Si una superficie parece pedirlo,
   se frena y se eleva.
3. **Pedido de producto y cita de servicio no comparten tabla.** Un
   objeto que cruza la línea es exactamente lo que esta sección impide.
4. La revisión de catálogo la hace e-PetPlace producto por producto
   (§4.1). Un servicio disfrazado de producto se detiene ahí.

### 3.5 Los casos borrosos, resueltos

| Caso | Resolución |
|---|---|
| **Plan de alimento recurrente** | **Fuera de v1** (§11.2). Cuando entre: es PRODUCTO y va por la despensa |
| **Paquete que mezcla baño y shampoo** | **No existe como objeto único.** Se venden por separado: el baño por el motor de servicios, el shampoo por la despensa |
| **Producto entregado durante un servicio** | **Criterio v1, ahora sin la sombra contractual:** lo que se cobra aparte es producto y va por la despensa; lo aplicado durante el acto clínico es insumo del servicio, se documenta en el expediente y no se vende. *La consulta a VTEX que bloqueaba esto (D-747.7) queda acotada por §13* |

### 3.6 El carrito: separado en v1 — con la razón cambiada

**Servicios y productos siguen siendo compras separadas en v1.**

> **Se declara con honestidad: la razón técnica principal desapareció.**
> Con dos sistemas, un carrito unificado significaba dos cobros y dos
> ciclos detrás de una pantalla. Con motor propio y una sola pasarela,
> eso deja de ser cierto. **Sigue fuera de v1 por alcance y por fecha,
> no por arquitectura — y en v2 es mucho más barato de lo que era.**

Queda como deuda de producto, no como decisión permanente.

---

## 4. LA VITRINA CURADA

### 4.1 Una oferta por producto

**Tesis del founder, S94, textual:** *"como cliente odio que del mismo
producto me ofrezcan 100 SKUs con precios diferentes, cuando ya debería
ofrecerme la mejor opción."*

**La despensa de e-PetPlace no compite por precio, compite por
criterio.** Si la app conoce a la mascota —especie, talla, edad,
condición— y aun así muestra siete opciones para que la familia elija,
está admitiendo que no sabe. **La ventaja competitiva de §6 exige una
sola oferta por producto. Son la misma decisión.**

### 4.2 🔴 LA PUERTA DE CARGA — EL VENDEDOR PROPONE, e-PetPlace PUBLICA

**Firma del founder, S95.** La puerta de carga vive **dentro de la
app**, no en una web aparte. Y tiene una condición que la define:

> **El vendedor PROPONE. e-PetPlace PUBLICA.**
>
> Si el vendedor publica directo, la vitrina curada deja de existir — y
> con ella el foso entero. **La puerta es de propuesta, no de
> publicación.**

Consecuencias en el esquema, que se dejan **ahora** porque después son
caras:

1. **El producto nace en estado de propuesta.** Publicar es un acto
   distinto de cargar, con su propio actor.
2. **El origen del dato queda declarado**: cargado por el vendedor,
   cargado por e-PetPlace, o asistido por IA (§14).
3. **El precio se propone; la oferta visible la fija la curaduría.**
4. **El stock sí lo maneja el vendedor directo** — es dato operativo
   suyo, no decisión de vitrina.

**Alcance v1 de la puerta:** el formulario y el estado de propuesta. **La
ingesta asistida por IA (foto de la bolsa → atributos extraídos) es
posterior al 15 de septiembre** (§14). Se deja la costura, no la carne.

~~**Ingesta v1 del catálogo inicial: la hace e-PetPlace por el portal
admin, que ya existe.**~~ ☠️ **DEROGADO (S95-F, 11-ago-2026) — LA
PREMISA ERA FALSA Y SE MIDIÓ.**

> **Lo que la medición encontró** (relevamiento completo en
> `docs/relevamientos/2026-08-11-s95-relevamiento-portal-admin.md`): la
> pantalla `Productos.tsx` del portal admin está construida sobre
> `productos.seller_perfil_id`, `precio`, `stock` y `sku` — **columnas
> que la migración M2 de S95-C eliminó**. El portal fue escrito para el
> modelo que S95 derogó, **su último commit es del 10 de mayo de 2026**,
> y de sus 28 pantallas hay **5 rotas enteras y 5 parciales**.
>
> *«El portal admin, que ya existe» era cierto como frase y falso como
> premisa: existe, y no sirve para esto.*

**ENMIENDA FIRMADA POR EL FOUNDER (11-ago-2026).** Tres partes, y el
orden importa porque es el que se firmó:

1. **El catálogo inicial v1 se carga por SCRIPT, no por pantalla.** Con
   **un vendedor y tres familias** esto es un seed, no una interfaz.
   *Construir UI sobre un modelo que todavía se mueve es fabricar
   deuda* — y el portal admin es la prueba viva de esa factura.
2. **La puerta del vendedor SIGUE VIVA y NO se reemplaza.** Él propone,
   e-PetPlace publica (arriba, sin cambios). **Su costura ya está en el
   esquema y está medida:** `vendedor_skus` nace en `propuesto`,
   `ofertas` separa `propuesto_por` de `publicado_por`, y `origen_carga`
   admite `asistido_por_ia`. **El script no es un atajo alrededor de la
   puerta: es su primer usuario.**
3. **La ingesta asistida por IA sigue siendo posterior al 15 de
   septiembre** (§14). **Sin cambios.**

> **🔴 EL MOTIVO QUE HACE MEJOR AL SCRIPT QUE A LA PANTALLA, y es lo que
> no hay que perder:** si la carga inicial pasa por la **MISMA función**
> que va a usar el vendedor, el camino queda **probado con datos reales
> antes de que él lo toque**.
>
> **Estrenamos nosotros la puerta, no el primer vendedor.**

**Consecuencia operativa:** el cargador vive en `tools/carga-catalogo/`
y **no escribe una sola tabla directo** — llama a las dos funciones de
catálogo. *Esto se decide el mismo día en que se midió que el portal
admin acumuló **104 escrituras directas contra 1 solo RPC**: la deuda
que no se repite es la que se acaba de medir.*

---

## 5. EL RECORRIDO DE LA FAMILIA

### 5.1 Dónde vive

**La despensa ocupa su tab en la barra.** `DISEÑO_EXPERIENCIA` §7 y su
CICLO DEL TRONO **RIGEN, no se enmiendan**: 4ª tab en A6, y cuando
llegue Comunidad, Comunidad va al centro — la Despensa le entrega el
trono y no pierde nada, porque para entonces la recompra ya vive en el
Home y en el módulo de nutrición del perfil.

**Entrada principal: desde el expediente de la mascota.** No una tienda
genérica con categorías. *"El alimento de Thor"*, no *"Categoría:
Alimentos"*. **El tab da alcance; el expediente da criterio.**

Entrada secundaria: una superficie dentro de Explorar.

### 5.2 Las pantallas

1. **Descubrir** — desde el expediente, con la recomendación de §6.
2. **Producto** — foto, nombre, precio, presentación, y **el porqué de
   la recomendación** ("para perros de talla media, 3 a 7 años").
3. **Carrito** — solo productos (§3.6).
4. **Pagar** — corriente y débito. Sin diferido (§11.2).
5. **Seguir el pedido** — estados propios, entregados por el motor de
   notificaciones que ya existe.
6. **Recibir** — confirmación, y el evento entra al expediente (§7).

Voz del producto: tuteo neutro latinoamericano, bilingüe es+en de
nacimiento (DEFINICION_SOFTLAUNCH).

---

## 6. LA VENTAJA COMPETITIVA — LO QUE UNA TIENDA COMÚN NO PUEDE

**Este bloque es la razón de existir del frente entero.**

La despensa recomienda **desde la mascota real que ya vive en el
expediente**: especie, talla, edad, momento vital, condiciones y
alergias documentadas.

| Señal del expediente | Qué habilita |
|---|---|
| Especie y raza | Filtrado duro: nada que no aplique |
| Talla y curva de peso | Presentación y porción correctas |
| Momento vital (M1–M5) | Cachorro / adulto / senior — la fórmula cambia |
| Condiciones y alergias | 🔴 **Exclusión dura**: jamás recomendar algo contraindicado |
| Periodicidad de antiparasitarios | El recordatorio de §7.3 |

**Límite ético, heredado de `MODELO_LOYALTY` §7.6 y P11:** *los
beneficios jamás distorsionan recomendaciones clínicas.* Acá se lee
así: **la despensa jamás recomienda por margen.** Si hay dos productos
válidos, manda el criterio de cuidado, no el que deja más. Y una alerta
de cuidado existe por la mascota, nunca para vender.

---

## 7. QUÉ VUELVE AL BIO-EXPEDIENTE

**Sin esto, una tienda cualquiera alcanzaba.**

### 7.1 Qué compra es dato de cuidado

**SÍ entra al expediente:** alimento (cruzado con la curva de peso),
suplementos, antiparasitarios y antipulgas (con su periodicidad),
dietas de prescripción.

**NO entra:** juguetes, accesorios, camas, higiene general. Son compra,
no cuidado.

### 7.2 Cómo entra sin romper la letra del expediente

**Enmienda a `BIO_EXPEDIENTE` (D-743).** *Matiz que la letra de S94 no
vio: el tipo de evento `producto_asignacion` YA EXISTE y está activo en
`cat_tipos_evento`. No se funda — se enmienda.* La enmienda literal vive
en el acta de S95, y su casa definitiva es `BIO_EXPEDIENTE`.

Condiciones:

1. **Append-only**, como todo el expediente.
2. **Porta su procedencia de nacimiento**: el evento declara que fue
   **aportado por la familia**, no por un profesional. Un alimento
   comprado no tiene el peso de una prescripción veterinaria, y la
   pantalla no los puede confundir.
3. **No alimenta el loyalty.** `MODELO_LOYALTY` §5 es explícito:
   *comprar mucho no es cuidar mejor*. **Sin excepción — y se verifica
   que ningún trigger la conecte.**
4. Eventos aportados por menores no acumulan (P5).

### 7.3 Qué se le devuelve a la familia

**Esto es el producto, no el catálogo:**

- Avisar cuándo se está acabando el alimento, calculado por porción y
  fecha de compra.
- Recordar el antipulgas por su periodicidad real.
- Sugerir la presentación siguiente cuando el cachorro crece.

**Con la vara de `MODELO_LOYALTY` §6:** se celebra, jamás se reprocha.
Cero urgencia artificial, cero FOMO, cero "vas a perder". Un
recordatorio de antipulgas es cuidado; un contador regresivo para
comprar es un dark pattern.

### 7.4 🔴 PRIVACIDAD FRENTE AL VENDEDOR — REFORZADA EN S95

**Por defecto, el vendedor no ve NADA del expediente.** Ve el pedido:
qué, cuánto, dónde entregar. **Lo contrario es freno 4 y no se negocia
en esta mesa.**

> **Cláusula nueva de S95, y existe porque el vendedor ahora vive en
> NUESTRA app junto al prestador:**
>
> **El rol `seller` no hereda ningún acceso del rol `prestador`.** Una
> cuenta comercial que tenga los dos roles —la clínica que además vende
> alimento— **ve el expediente por su oficio de prestador y por la
> matriz A3, jamás por haber vendido algo.** Un vendedor puro tiene cero
> acceso al expediente, sin excepción y sin configuración que lo
> habilite.
>
> *Esto es exactamente el riesgo que introduce la app única, y se cierra
> en el esquema, no en la UI.*

**Enmienda a `POLITICAS_EPETPLACE` (D-744):** queda escrito que el
expediente no es dato compartible con terceros comerciales bajo ninguna
configuración.

---

## 8. LA SUPERFICIE DEL VENDEDOR — `e-PetPlace Negocios`

### 8.1 La decisión (founder, S95)

**Una sola app de negocios. El vendedor es un ROL, no otro actor.**

Lo que ya lo sostenía antes de decidirlo:

- **`MODELO_FINANCIERO` §8.11**: un refugio con RUC agrega el rol
  `seller_productos` a **la misma cuenta comercial**. El modelo de
  dominio nunca trató al seller como actor aparte.
- **`PORTAL_PRESTADOR` §S20** llama a los sellers *"prestadores de
  productos"*.
- **§3.5**: la clínica que entrega antipulgas es prestador y vendedor a
  la vez. Con dos apps, esa persona necesita dos apps.

### 8.2 Lo que se hereda gratis

- **El arco de equipo/empleados** (S83–S93). Un vendedor con alguien que
  prepara pedidos ya tiene su modelo.
- **Push por FCM**, del motor de notificaciones. Un pedido que entra
  tiene que sonar en el teléfono — es la razón por la que el día a día
  va a mobile, y la cañería existe.
- **La dosis de craft del prestador** y el teal oscuro
  (`DIRECTIVA_CRAFT_CLIENTE` §10). Una tercera app sería una tercera
  dosis de diseño en medio del burn-down de 102 pantallas (regla 81).

### 8.3 Web sin elegirla

**La dicotomía web-vs-mobile es falsa en esta casa.** La nota S42 de
`PORTAL_PRESTADOR` deja la superficie primaria como app Expo/RN **con
vista web como target secundario del mismo codebase (RN Web)**. Si el
vendedor vive en ese codebase, la web sale del mismo build cuando haga
falta. **No hay que elegir, y no hay web propia en el alcance de
octubre.**

### 8.4 ⚠️ CHOQUE DECLARADO CONTRA LETRA DE S20

`PORTAL_PRESTADOR` §S20 dice *"cada portal tiene su propio canal en
e-PetPlace"*. **Esta sección lo enmienda:** `PORTAL_SELLER.md` sigue
existiendo como documento —el alma del vendedor merece su letra— pero
**su superficie es un MÓDULO dentro de `e-PetPlace Negocios`, no una app
propia.**

Por regla de la casa, un choque contra letra firmada **se declara, jamás
se difiere en silencio.** Queda declarado y firmado por el founder en
S95.

### 8.5 El renombre — 🔴 ventana barata que se cierra sola

La app pasa de nombre de prestador a **`e-PetPlace Negocios`**.

**Por qué Negocios y no Care:** la app del cliente se llama e-PetPlace.
Con "Care", un dueño que busca "e-PetPlace" en la tienda ve las dos y
"Care" le suena a *cuidar a mi mascota* — se baja la equivocada, justo
en el soft launch. **El prestador no busca la app: se la decimos
nosotros** (proceso de selección y momento fundacional,
`PORTAL_PRESTADOR` §2.1–2.2). El cliente sí busca. El nombre optimiza
contra la confusión del cliente; el alma vive adentro. *Y "Care" queda
libre para lo que sirve mejor: un plan de salud o un tier del cliente.*

Costo asumido y declarado: es más frío que el alma sobria del
prestador, y en inglés hay que localizar a "Business".

> 🔴 **REGLA DURA DEL RENOMBRE (D-752):** cambia el **nombre visible y la
> ficha de tienda**. **JAMÁS el identificador del bundle** — si se toca,
> es una app nueva y se pierden las instalaciones. **Se verifica en el
> repo antes de tocar nada; no se asume.**

### 8.6 Qué hace el vendedor desde el teléfono (alcance v1)

Ver pedidos · prepararlos · despacharlos · ajustar stock · **proponer**
producto y precio (§4.2).

**El panel operativo del vendedor NO estaba en el alcance v1 de S94 y
entra acá con nombre propio (D-755).** Que siempre se haya querido hacer
no lo hace gratis. **Versión mínima honesta para octubre: una lista de
pedidos con dos botones —preparado, despachado— y el ajuste de stock.**
Eso alcanza para un vendedor.

---

## 9. REGLAS TÉCNICAS

### 9.1 El precio que se muestra ES el precio

**Con motor propio se cae el caché de borde de 300 segundos, y con él la
regla de la v1.0 de que el precio de vitrina era solo indicativo.**

> La pantalla muestra el precio real. Se cae la simulación al comprar,
> se cae la divergencia entre vitrina y checkout, se cae la trampa del
> 200. **No es solo más barato: es mejor producto.**

Lo que **sí** sobrevive: la disponibilidad se verifica contra stock al
confirmar, y **la reserva se bloquea ahí, no antes.**

### 9.2 La búsqueda es propia, y siempre lo iba a ser

Intelligent Search nunca estuvo disponible sin front de VTEX (heredado
de S94-M1). **La búsqueda propia no es una pérdida de esta decisión:
estaba en el alcance en los dos caminos.** Con catálogo chico se navega;
la búsqueda avanzada con filtros sigue en evaluación (§11.3).

### 9.3 Las lecciones de integración que sobreviven, ahora apuntadas a la pasarela

- **No confiar en el status code.** La lección nació de la simulación de
  VTEX (200 con el fracaso en el cuerpo), y **se aplica igual a la
  pasarela**: el resultado se lee del cuerpo, siempre.
- **Cola y backoff desde el día uno** en toda integración externa. El
  techo de un proveedor se descubre chocando.
- **Credenciales de pasarela jamás en cliente. La anon key jamás en
  bundle público.** Backend solamente.

---

## 10. LOS CASOS FEOS

**Los productos traen problemas que los servicios no tienen.**

| Caso | Resolución v1 |
|---|---|
| **Sin stock** | La verificación al confirmar es la verdad (§9.1). Si no hay stock, la pantalla lo dice antes del pago, con la alternativa curada si existe |
| **Entrega fallida** | Responsable operativo: el vendedor. **Cara visible ante la familia: e-PetPlace.** Atención humana en v1 |
| **Producto equivocado** | Ídem. Se resuelve por atención, no por flujo automatizado |
| **Devolución** | 🔴 **No automatizada en v1.** Atención humana con criterio escrito en `POLITICAS`. Automatizarla es v2 |
| **Producto contraindicado** | **No debe llegar a ocurrir**: §6 lo excluye antes de mostrarlo. Si ocurre, es bug de severidad alta, no caso de atención |

**Enmienda a `POLITICAS_EPETPLACE` (D-744):** nace el capítulo de
devoluciones y responsabilidad de producto, con la distinción
responsable operativo (vendedor) / responsable de la experiencia
(e-PetPlace).

---

## 11. EL ALCANCE v1

### 11.1 Lo que entra

- **Tres familias, y solo tres**: alimento · antiparasitarios y
  antipulgas · suplementos. **Son exactamente las que alimentan el
  expediente** (§7.1).
- El recorrido completo de §5.
- La recomendación desde el expediente (§6).
- La compra como evento del expediente (§7).
- Pago corriente y débito.
- **La puerta de carga como propuesta**, sin IA (§4.2).
- **El panel mínimo del vendedor**: pedidos, dos botones, stock (§8.6).

### 11.2 Lo que NO entra — decidido, no en evaluación

- **Diferido en cualquier forma.** Comisión bancaria de 5% a 15% según
  plazo y banco. Para tickets de USD 30–80 no se sostiene.
- **Suscripción / plan recurrente.**
- **Segundo vendedor.**
- **Carrito unificado con servicios** (§3.6).
- **Devolución automatizada** (§10).
- **Ingesta de catálogo asistida por IA** (§14).
- **Web propia del vendedor** (§8.3).
- 🔴 **CANDIDATO, NO FIRMADO — FLETE: tarifa plana o gratis sobre un
  mínimo, definida por el vendedor. El cálculo por zona y peso es v2.**
  *Es el mayor costo escondido de la decisión de S95 y no tiene dato: se
  firma o se cae con la llamada al vendedor (D-745/D-754).*

### 11.3 En EVALUACIÓN hasta el 15 de septiembre

> **PUNTO DE CONTROL: 15 DE SEPTIEMBRE.** Ese día el founder firma la
> lista final con el ritmo medido en la mano. Quedan ~5 semanas de
> construcción después — el mínimo honesto para octubre.

| Candidato | Dato que ya pesa |
|---|---|
| **Juguetes, accesorios, camas** | No alimentan el expediente (§7.1). Suman catálogo y operación sin sumar diferencial |
| **Búsqueda avanzada con filtros** | Trabajo real y propio en cualquier escenario. Con catálogo chico, se navega |
| **Panel del vendedor más allá del mínimo** | Entra como ítem propio (D-755), no como parte difusa de "la despensa" |

---

## 12. EL CALENDARIO

**Firmado por el founder: la despensa entra al soft launch de octubre.**

Lo que la mesa pone al lado de esa firma, sin discutirla:

- **~7-8 semanas** hasta octubre, conviviendo con la landing, la sesión
  de login y la segunda pasada de performance.
- **Trabajo que sigue existiendo con o sin VTEX**: afiliar pasarela,
  reglas de pago, IVA ecuatoriano desde cero.
- **Trabajo que aparece con la decisión de S95**: el motor de pedidos
  propio, la máquina de estados, el flete, el panel del vendedor.
- **Trabajo que desaparece con la decisión de S95**: la integración
  entera con VTEX, el feed/hook de pedidos, la edición de moneda a mano,
  la limpieza de objetos de fábrica, y la sincronía permanente entre dos
  sistemas de pedido.

> 🔴 **EL RIESGO DE ALCANCE, ESCRITO PARA QUE NO SORPRENDA.** Lo que
> hace viable construir esto en 7-8 semanas es la lista de §11.1 y
> §11.2. **Esa lista deja de ser una limitación y pasa a ser el andamio
> que sostiene la decisión de S95.** Si se erosiona, la decisión se
> vuelve mala retroactivamente. *El riesgo de esta sesión no es técnico:
> es que "la despensa" se convierta en "una plataforma de e-commerce".*

---

## 13. LO QUE QUEDA VIVO DE VTEX

**El contrato sigue corriendo. La decisión de producto y la decisión
contractual son dos, y la segunda tiene su propio calendario.**

| Fecha | Qué |
|---|---|
| **Fin de noviembre de 2026** | 🔴 Última fecha para avisar no renovación (MSA §10.1 pide 90 días; el Anexo dice 60 — se toma el plazo largo). **D-756** |
| **~27 de febrero de 2027** | Renovación automática por 12 meses si no se avisó |

**Los USD 500/mes hasta febrero ya están gastados y no compran nada en
este camino.** Se dice sin adorno. **Y no cuentan para la decisión** —
es la trampa clásica y §12 de la v1.0 ya la había nombrado.

**🔴 LO ÚNICO QUE SIGUE SIENDO RIESGO Y NO LO RESUELVE NINGUNA PISTA
(D-751):** ¿vender productos fuera del OMS de VTEX **mientras el
contrato está vivo** activa la penalidad de 6.1.7.1 (6× la última
facturación mensual más terminación unilateral)? **Ninguna venta real de
la despensa ocurre antes de tener esa respuesta por escrito.**

**Preguntas de la v1.0 que MUEREN con esta decisión:** la cláusula 14.7
y el "Powered by VTEX" (☠️ deja de chocar con `MODELO_PRESENCIA`, y deja
de bloquear el cierre de pantallas) · el cambio de moneda y su costo ·
la ratificación de política comercial y ambiente adicional.

**Preguntas que SOBREVIVEN:** qué se factura desde febrero si la cuenta
nunca estuvo en producción · si existe un "Monto Terminación" definido ·
y la nueva D-751.

---

## 14. LO QUE SE PROTEGE SIN CONSTRUIR — LA ASISTENCIA POR IA

**Sueño declarado del founder (S95): pedirle a la app por voz que haga
cualquier cosa — un pedido, revisar una historia clínica.**

**Es viable, y no por la IA: por la disciplina de esquema que la casa ya
sostiene.** Un asistente que actúa necesita tres cosas, y dos de ellas
—donde todos fracasan— ya existen sin haberse construido para esto:

- **"El motor escribe SOLO vía funciones — puerta única."** Cada RPC con
  sus parámetros y su autorización **es, literalmente, una herramienta
  declarada.**
- **Los tipos de evento son un vocabulario cerrado**, no texto libre.
- **La matriz A3 (oficio × eje) y las policies** ya definen quién ve y
  quién escribe qué.

**Lo difícil, sin edulcorar:** leer no es escribir —un evento alucinado
en un expediente append-only que viaja con la mascota no se borra
fácil—; un pedido es plata y necesita confirmación explícita; el
reconocimiento de voz en español ecuatoriano con nombres propios es
donde esto se rompe en la práctica; y **P11 vuelve a mandar: un
asistente que sugiere productos es exactamente el lugar donde la
recomendación clínica se distorsiona sin que nadie lo note.**

> **LO ÚNICO QUE SE HACE HOY — dos costuras baratas, autorizadas por el
> founder en S95:**
>
> **(1) No romper la puerta única.** Cada acción que viva SOLO dentro de
> una pantalla es una acción que el asistente nunca va a poder hacer. La
> regla que ya existe por seguridad gana un segundo motivo.
>
> **(2) El evento sabe declarar que lo asistió una IA (D-753).** Hoy la
> procedencia distingue familia de profesional; falta el matiz de si el
> dato fue dictado o extraído por IA. **Hoy cuesta una columna; con
> miles de eventos vivos cuesta una migración con backfill.**

**La voz NO es octubre.** Se protege la posibilidad; no se construye la
función.

---

## 15. DEUDA — ESTADO TRAS S95

| # | Qué | Estado |
|---|---|---|
| **D-743** | Enmienda a `BIO_EXPEDIENTE` — la compra como fuente con procedencia | **VIVE.** Texto listo en el acta S95 |
| **D-744** | Dos capítulos de `POLITICAS`: devoluciones/responsabilidad de producto · privacidad del expediente frente a terceros | **VIVE.** Antes del primer producto vendible |
| **D-745** | **Ficha del piloto con el vendedor real** | 🔴 **VIVE, y subió de prioridad.** Ahora también define el flete (D-754) y el panel (D-755) |
| **D-746** | Limpieza de los 4 objetos de fábrica de VTEX | ☠️ **MUERTA** por la decisión de S95 |
| **D-747** | Las 7 preguntas a VTEX | **ACOTADA** a tres: facturación desde febrero · Monto Terminación · y la nueva D-751. El resto muere (§13) |
| **D-748** | El 20% vivo en `seller_comisiones` contra el 10% firmado | **VIVE.** Es plata viva y es tabla NUESTRA: la decisión de S95 no la toca |
| **D-749** | Los 137 pedidos huérfanos del prototipo v2 | **VIVE.** Se limpian o se marcan antes del primer pedido real |
| **D-750** | Modelar la despensa como **fee, no como GMV con margen** | **VIVE y se simplifica**: sin take rate de terceros, el fee es limpio |
| **D-751** | 🔴 **¿Vender fuera del OMS con contrato VTEX vivo activa 6.1.7.1?** | **NUEVA.** Founder/legal. **Bloquea la primera venta real** |
| **D-752** | Renombre a `e-PetPlace Negocios` — nombre visible y ficha, **jamás el bundle identifier** | **NUEVA.** Ventana barata que se cierra con la primera instalación real |
| **D-753** | El evento declara si lo asistió una IA | **NUEVA.** Costura barata hoy, migración cara después |
| **D-754** | Criterio de flete v1 | **NUEVA.** 🔴 Sin dato. Depende de D-745 |
| **D-755** | Panel operativo del vendedor como ítem propio del corte 15-sep | **NUEVA.** No es "parte de la despensa" |
| **D-756** | Aviso de no renovación de VTEX antes de fin de noviembre | **NUEVA.** Fecha dura |

---

## Historial

- **v2.0 (S95, 11 Ago 2026):** enmienda mayor. **El motor de comercio
  pasa a ser propio; VTEX queda como fuente de inspiración** (§3, firma
  del founder). Aritmética recalculada sin take rate: el vendedor pasa
  de ~$78 a ~$81 con crédito (§2.3). **Una sola app de negocios,
  `e-PetPlace Negocios`, con el vendedor como rol** (§8) — enmienda
  declarada a `PORTAL_PRESTADOR` §S20. **La puerta de carga: el vendedor
  propone, e-PetPlace publica** (§4.2). **El cinturón servicios/productos
  se refuerza porque pierde su mitad con multa** (§3.4). **El rol seller
  no hereda accesos del rol prestador** (§7.4). Se protegen dos costuras
  para la asistencia por IA sin construirla (§14). Mueren D-746 y cuatro
  de las siete preguntas a VTEX; nacen D-751 a D-756. Tres huecos
  declarados en la puerta.
- **v1.0 (S94, 10 Ago 2026):** redacción inicial sobre medición real del
  ambiente (S94-M1 y M2), el Anexo 1 y el MSA. Forma B firmada, comisión
  10% modificable, USD/Ecuador firmado, alcance v1 con corte 15-sep.
  Regla del OMS (§3.3) y sus penalidades incorporadas como línea dura.
  Enmiendas declaradas a `BIO_EXPEDIENTE` (§6.2) y `POLITICAS_EPETPLACE`
  (§6.4, §8). **Su §1.1 —"VTEX es el motor de comercio"— y su §7 quedan
  derogados por la v2.0.**
