# MODELO_DESPENSA — El frente de productos

> **Versión: v2.3 — S96 (12 Ago 2026). La composición con cuatro estados y el vocabulario con relaciones.**
>
> **Qué cambió respecto de v2.1, en una línea: el alcance v1 se ensancha
> con el recorrido entero de los dos lados** — `LETRA_RECORRIDO_DESPENSA_S96`,
> **diecisiete firmas del founder**. Los tres cambios que tocan letra
> vigente: **① la alergia pasa de ESCONDER a ADVERTIR** —exclusión dura
> en la recomendación, advertencia dura en la búsqueda (§6, §10)— · **②
> la compra recurrente SALE de la lista de lo que no entra** (§11.2) ·
> **③ §4.1 se ACLARA, no se enmienda: una oferta por producto no
> significa catálogo chico** (§4.1). Suma al alcance el **repartidor con
> pantalla —y con él el GPS y la foto de entrega—**, la **venta de
> mostrador con código de reclamo**, el retiro en tienda, el catálogo
> amplio con buscador, la fecha programada, la donación y las
> direcciones con Places (§11.1). Nacen **D-774 a D-779**;
> **`D-770` nace y muere el mismo día**.
>
> **Qué cambió en v2.1 respecto de v2.0, en una línea: el panel mínimo del
> vendedor pasa de DOS botones a CUATRO escalones** —preparado ·
> empacado · despachado · entregado— por firma del founder en la mesa de
> S96. **Sin el cuarto, ninguna compra llega jamás al Bio-Expediente**,
> que es la razón de existir de la despensa. Fuente:
> `LETRA_PANEL_VENDEDOR_S96`, con su choque contra §8.6/§11.1 de la v2.0
> declarado en su §11. Nacen D-770 a D-773. **Y en particular
> **el criterio de flete de §11.2 SIGUE CANDIDATO, NO FIRMADO** (medido
> al cerrar S96, con su tensión contra la letra de S96 declarada ahí
> mismo) — **la v2.2 no lo mueve.**
>
> **Qué cambió en v2.0 respecto de v1.0, en una línea: el motor de comercio deja
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

### 2.3bis 🔴 LA ARITMÉTICA DEL CATÁLOGO QUE EXISTE — enmienda S95-CIERRE

> **§2.3 NO DESCRIBE NINGÚN PRODUCTO REAL, y hay que saberlo antes de usar sus
> números en una conversación.** Su aritmética está construida sobre una venta
> con **IVA 15 %**, y **los seis productos del catálogo v1 tributan
> `EC_IVA_0`** — alimento para mascotas, tarifa cero en Ecuador.
>
> **§2.3 no se borra:** describe bien el día que entre un producto gravado (un
> antiparasitario, un suplemento). Lo que faltaba era la versión de HOY.

Sobre una venta de **USD 100 con IVA 0 %** (el cobro al cliente es **100**):

| Concepto | Crédito corriente | Débito |
|---|---:|---:|
| Banco + procesador + 3DS ⚠️ | ~$6,38 | ~$2,92 |
| **e-PetPlace 10 % s/100** | **$10,00** | **$10,00** |
| **Fricción total** | **~$16,38 = 16,4 %** | **~$12,92 = 12,9 %** |
| **El vendedor recibe** | **~$83,62** | **~$87,08** |
| **Menos IVA al SRI** | ☠️ **$0,00** | ☠️ **$0,00** |
| **Le queda** | **~$84** | **~$87** |

> ⚠️ **HONESTIDAD DEL DESGLOSE:** la fila de banco + procesador está **derivada
> por proporción** de la que §2.3 declaró medida en la calculadora del
> procesador. **NO se re-midió en esta sesión.** Las dos filas de e-PetPlace y
> de IVA sí son aritmética exacta.

**LO QUE ESTE CUADRO ENSEÑA, Y NO SE VE EN §2.3:**

> 🔴 **El 10 % sobre el TOTAL CON IVA hace que el impuesto encarezca la
> comisión.** Sobre un producto de $100: con IVA 15 % el vendedor se queda con
> **~$81**; con IVA 0 %, con **~$84**. **La diferencia no la produce el
> producto: la produce dónde cae la base de la comisión.**
>
> No es un argumento para cambiar la base —está firmada, y sobre el total con
> IVA es lo que hace la aritmética simple y auditable—, pero **sí es algo que
> hay que poder decir en la conversación con el vendedor** cuando entre el
> primer producto gravado y su margen baje $3 sin que él haya cambiado nada.

**Y el número que va a la conversación de HOY:** sobre el producto real más
caro del catálogo cargado —Taste of the Wild Bisonte y Venado, **$122**— la
comisión es **$12,20** y el vendedor recibe **~$102**, sin nada que pagarle al
SRI.

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

> ✅ **ACLARACIÓN S96 — NO ES ENMIENDA, Y POR ESO SE ESCRIBE ACÁ.**
> *"Una oferta por producto" NO significa catálogo chico.* Esta sección
> prohíbe **ofrecer el mismo producto cien veces con precios
> distintos**; no prohíbe tener muchos productos. **v1 lleva catálogo
> amplio, buscador, filtros por categoría y nombre, y detalle de
> producto al nivel del mejor comercio electrónico**
> (`LETRA_RECORRIDO_DESPENSA_S96` §5.1). *Se aclara porque la letra
> vieja mezclaba las dos cosas, y una lectura estrecha de esta sección
> habría recortado el catálogo creyendo que obedecía.*
>
> **Y lo que sí se agrega como regla nueva:** **sin mascota elegida se
> muestra todo** —elegir la mascota es lo que **enciende** el criterio,
> no un peaje para entrar— y **la primera compra no recomienda**,
> porque no sabemos qué come Thor y no lo inventamos (L-139).

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

### 4.3 🔴 LOS SEIS DEL LANZAMIENTO — POR SKU EXACTO, NO POR PROSA (S96, 12-ago)

**El hueco que esta sección cierra:** el acta de S95 decía *"seis
productos reales en la vitrina"* y no los listaba — vivían en prosa, y
la prosa produjo su primer error el mismo día que alguien la necesitó
(abajo). **Son los únicos productos que un cliente real va a ver en
octubre**: un identificador ambiguo acá es el producto equivocado con
la composición equivocada, y de ahí a la advertencia de alergia
equivocada hay un paso.

**Los seis, MEDIDOS de la base viva (12-ago-2026), no reconstruidos:**

| # | Producto | Presentación | SKU | Precio | Alérgenos declarados | Estado composición |
|---|---|---|---|---|---|---|
| 1 | Pro Pac Ultimates — **Puppy Pollo y Arroz** | 2.3 kg | `PRUEBA-PP-001` | $29.00 | pollo · arroz | declarada_sin_verificar |
| 2 | Pro Pac Ultimates — **Adulto Cordero y Arroz** | 12.7 kg | `PRUEBA-PP-002` | $94.50 | cordero · arroz | declarada_sin_verificar |
| 3 | Pro Pac Ultimates — **Adulto Pescado y Papa** | 12.7 kg | `PRUEBA-PP-003` | $122.00 | pescado | declarada_sin_verificar |
| 4 | Taste of the Wild — **Salmon Puppy Pacific Stream** | 2 kg | `PRUEBA-TW-001` | $34.00 | salmon | declarada_sin_verificar |
| 5 | Taste of the Wild — **Bisonte y Venado Adulto High Prairie** 🔴 | 12.2 kg | `PRUEBA-TW-002` | $122.00 | bisonte · venado | declarada_sin_verificar |
| 6 | Taste of the Wild — **Trucha y Salmon Canyon River Feline** (gato) | 2 kg | `PRUEBA-TW-003` | $34.00 | trucha · salmon | declarada_sin_verificar |

**Dos correcciones que la medición le hace a la reconstrucción por
prosa, y son la moraleja de la sección:** ① el *"Pro Pac Pollo-Arroz"*
del cierre de S95 (el de la prueba de exclusión por alergia) **es el
Puppy de 2.3 kg — no la adulta de 12,7 kg** que la reconstrucción
había elegido entre nueve candidatas · ② la evidencia *"$122 en
§2.3bis"* atribuida al Taste of the Wild **es ambigua: hay DOS
productos a $122** (el TOW Bisonte y el Pro Pac Pescado y Papa). *La
prosa reconstruye; la base se mide.*

> 🔴 **EL QUE NO PUEDE SALIR: el #5 (Taste of the Wild Bisonte y
> Venado) queda marcado NO CARGAR / NO VERIFICAR HASTA FOTO DE BOLSA
> (firma founder, 12-ago).** Es el más caro de la vitrina, se vende
> como proteína novel de bisonte y venado, **y la etiqueta
> estadounidense arranca con búfalo de agua y trae grasa de pollo en
> el octavo lugar**. El importador (Veterino S.A.S., Quito) no publica
> ficha; lo que hay es traducción de la etiqueta de OTRO mercado — y
> §6 (2ª enmienda) ya dice qué vale eso: una ficha que no es del país
> no sostiene una verificación. Con `res` incluyendo búfalo de agua
> (relaciones de §6, 3ª enmienda), **este producto es exactamente el
> caso que el motor existe para cazar** — afirmarlo con la ficha de
> otro país es el riesgo caro del lanzamiento. **El founder fotografía
> la bolsa; hasta entonces su estado es `declarada_sin_verificar` y la
> superficie lo DICE.** Sus alérgenos declarados hoy (bisonte ·
> venado) son los de esa traducción: la lista está INCOMPLETA a
> sabiendas, y por eso el estado que la acompaña importa más que la
> lista.

**Regla que queda:** todo cambio en la lista de los seis se hace ACÁ
primero (letra) y en la base después — y siempre por SKU, jamás por
nombre a secas.

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
| Condiciones y alergias | 🔴 **Exclusión dura EN LA RECOMENDACIÓN · ADVERTENCIA DURA EN LA BÚSQUEDA** (enmendado S96) |
| Periodicidad de antiparasitarios | El recordatorio de §7.3 |

**Límite ético, heredado de `MODELO_LOYALTY` §7.6 y P11:** *los
beneficios jamás distorsionan recomendaciones clínicas.* Acá se lee
así: **la despensa jamás recomienda por margen.** Si hay dos productos
válidos, manda el criterio de cuidado, no el que deja más. Y una alerta
de cuidado existe por la mascota, nunca para vender.

> 🔴 **ENMIENDA S96 — LA ALERGIA ADVIERTE, NO ESCONDE.** Fuente:
> `LETRA_RECORRIDO_DESPENSA_S96` §5.4, firma del founder.
>
> **Exclusión dura en la RECOMENDACIÓN. Advertencia dura en la
> BÚSQUEDA.** La app **jamás sugiere** pollo para Thor. Si el dueño lo
> busca y lo encuentra, **se lo dice y lo deja decidir** —*"Thor es
> alérgico al pollo y este alimento lo contiene"*— con un paso explícito
> de entendimiento que **queda registrado**.
>
> **Por qué es mejor producto y no una relajación:** esconder es
> invisible, y lo invisible no demuestra nada. *Un producto que
> desaparece sin explicación deja al dueño sin entender; uno que
> advierte es la app demostrando que conoce a Thor* — el diferencial
> hecho pantalla en vez de hecho filtro.
>
> **Dos candados, ninguno opcional:** ① **solo se puede advertir si el
> producto declara su composición** — sin ella la app dice *"no tenemos
> los ingredientes de este producto"*, **jamás silencio**, porque *el
> silencio se lee como «no tiene pollo» y esa lectura la hace el dueño,
> no nosotros* · ② **la advertencia jamás se apaga por una promoción**:
> el motor de alertas manda sobre el de beneficios, siempre.

> 🔴 **SEGUNDA ENMIENDA S96 (firma founder, 12-ago — el mismo día): LA
> COMPOSICIÓN TIENE CUATRO ESTADOS, Y SOLO DOS PUEDEN CALLAR.**
>
> ~~El candado ① distinguía dos casos: con composición y sin ella~~ —
> **cubría «sin composición» y NO cubría «con composición incompleta»,
> y ese silencio se ve idéntico al silencio confiable.** La razón es
> MEDIDA, no teórica: 133 productos del catálogo real tienen
> composición presente y lista de alérgenos INCOMPLETA (Royal Canin
> Medium Adulto lleva aceite de pescado y no declara pescado).
>
> **Los cuatro estados** (`productos.composicion_estado`, verbatim):
> **`verificada`** — e-PetPlace cotejó la lista de alérgenos contra la
> composición: **la única que puede callar como confiable** ·
> **`declarada_sin_verificar`** — composición presente, nadie la
> cotejó: la superficie DICE su condición · **`ausente`** — sin
> composición: la app lo dice, jamás calla (el candado ① original) ·
> **`no_aplica`** — la composición no es una categoría que aplique
> (las arenas sanitarias): calla porque **no hay dato faltante**, que
> es OTRO silencio que el de la verificada.
>
> **Y la verificación es CONTRA LA FICHA DEL PAÍS**
> (`composicion_mercado`, hoy `EC`): el fabricante formula por planta
> y por mercado — la ficha ecuatoriana del Royal Canin Hepatic declara
> hígado de ave; la británica no. **Una ficha `global` JAMÁS sostiene
> una verificación** (cae en `declarada_sin_verificar`), y si la
> composición o el mercado CAMBIAN, la verificación **caduca sola**
> (trigger, no disciplina). *Esto mata un supuesto no escrito: un SKU
> no es un producto — sin el mercado, el día que entremos a Colombia
> el mismo SKU puede traer otra fórmula y nadie sabría cuál rige.*
>
> **COROLARIO (misma firma): la advertencia se dispara por
> COMPOSICIÓN, jamás por nombre.** Hay 10 productos
> «hypoallergenic/sensitive» con alérgeno común adentro — *el nombre
> no es una dieta de eliminación.*
>
> **TERCERA ENMIENDA S96 (firma founder, 12-ago): el vocabulario de
> alérgenos es DATO y tiene RELACIONES.** Medido: 242 de 456 productos
> del catálogo real declaraban un alérgeno que el motor no podía
> sostener — *el motor de alergias estaba apagado en la práctica.*
> `cat_alergenos` (23 entradas; ampliar = un INSERT, jamás una
> migración) + `cat_alergeno_relaciones` con dos aristas: **`es_un`**
> (bisonte ES res — advertencia EXACTA) y **`puede_ser`**
> (`ave_no_especificada` podría ser pollo — advertencia IMPRECISA,
> **y la imprecisión SE DICE**: *«contiene proteína de ave sin
> especificar, y podría ser pollo»*, jamás «contiene pollo»).
> **Lo que jamás se agrupa, protegido en el modelo:** pollo, pavo y
> pato SEPARADOS (la dieta de eliminación usa pato o pavo para el
> alérgico al pollo) · insectos aparte de moluscos_crustaceos pese a
> la tropomiosina (la proteína de insecto existe como alternativa).
> **`moluscos_crustaceos` es UNA entrada** (reactividad cruzada).
> Y la lección de `ave_no_especificada`: 80 etiquetas dicen «proteínas
> de ave» sin nombrar cuál — leerlas como pollo era **un alérgeno
> inferido, lo que prohibimos, hecho por nosotros**; el casillero dice
> lo que la etiqueta dice y nada más.
>
> El paso de entendimiento de §5.4 **tiene productor**: tabla
> append-only `alergia_entendimientos` — el registro jamás se edita ni
> se borra; la pantalla decide cuándo re-preguntar.

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
  fecha de compra. **⚠️ GATEADO POR FIRMA (founder, 12-ago-2026): LAS
  RACIONES NO SALEN EN v1 — ni heredadas ni calculadas.** Una ración
  no es atributo de producto: es indicación de alimentación, y las
  heredadas están cortas por casi la mitad. **Manda la etiqueta del
  fabricante y el veterinario.** El campo puede existir en el modelo;
  **ninguna superficie lo muestra** — y este aviso queda esperando una
  ración confiable, no se calcula con una inventada.
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
no lo hace gratis. ~~**Versión mínima honesta para octubre: una lista de
pedidos con dos botones —preparado, despachado— y el ajuste de stock.**~~
☠️ **ENMENDADA S96** — ver abajo.

> 🔴 **ENMIENDA S96 — SON CUATRO ESCALONES, NO DOS.** Versión mínima
> honesta para octubre: **una lista de pedidos con cuatro escalones
> —preparado · empacado · despachado · entregado— y el ajuste de
> stock.** Fuente: `LETRA_PANEL_VENDEDOR_S96` §3, con su choque contra
> esta misma línea declarado en su §11 y firmado por el founder en esa
> mesa.
>
> **Las tres razones, que son las que vuelven caro cada escalón que
> falta:** el **empaque** necesita el lote —el día que un fabricante
> retire uno, esa columna es la diferencia entre poder avisarle a las
> familias y no poder— · el **despacho** necesita la factura del
> vendedor, porque en Ecuador la factura electrónica falla y un pedido
> empacado sin factura no puede salir · y **la entrega es el único acto
> que deposita en el expediente**. Sin el cuarto, ninguna compra llega
> jamás al Bio-Expediente, que es la razón de existir de la despensa
> (§7).
>
> **Y el modo de falla que lo cierra:** §5.2 pone la confirmación de
> recepción en la app de la familia — **esa pantalla no existe todavía**
> (D-772), y aun cuando exista sería insuficiente sola: *un pedido que
> se cierra solo si el dueño aprieta un botón es un pedido que no se
> cierra nunca*. **El vendedor marca la entrega; la confirmación de la
> familia es cortesía, no fuente de verdad.**

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
| **Producto contraindicado** | ~~**No debe llegar a ocurrir**: §6 lo excluye antes de mostrarlo. Si ocurre, es bug de severidad alta, no caso de atención~~ ☠️ **ENMENDADO S96 — ver abajo** |
| **Producto contraindicado — RECOMENDADO** (S96) | **No debe llegar a ocurrir.** §6 lo excluye antes de sugerirlo. Si aparece en una recomendación, **es bug de severidad alta**, no caso de atención |
| **Producto contraindicado — BUSCADO** (S96) | **Es legal y esperado.** La app **advierte y deja decidir**, con paso explícito de entendimiento registrado (§6, `LETRA_RECORRIDO_DESPENSA_S96` §5.4) |
| **Producto sin composición declarada** (S96) | La app **lo dice**: *"no tenemos los ingredientes de este producto"*. **Jamás silencio** — el silencio se lee como ausencia de alérgeno |
| **Producto con composición SIN VERIFICAR** (S96, 2ª enmienda) | La app **dice su condición** — solo la `verificada` (contra ficha del país) puede callar. *El silencio de una lista incompleta se ve idéntico al confiable, y por eso el estado existe* |
| **Producto donde la composición NO APLICA** (S96, `no_aplica`) | La app **calla sin reclamar**: pedirle ingredientes a una bolsa de arena es un dato faltante que no falta |
| **Producto genérico con relación de alérgeno** (S96) | `ave_no_especificada` ADVIERTE al alérgico a pollo, **con voz de imprecisión**: *"podría ser pollo"*, jamás *"contiene"* |
| **El vet no registró recomendación** (S96) | La app **no la menciona.** Jamás fabrica una recomendación que nadie hizo |

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
- **El panel mínimo del vendedor**: pedidos, **cuatro escalones
  —preparado · empacado · despachado · entregado—**, stock (§8.6).
  🔴 **ENMENDADO S96** (`LETRA_PANEL_VENDEDOR_S96` §3; choque contra la
  v2.0 declarado en su §11). ~~Decía "dos botones".~~ **El cuarto
  escalón no es alcance de más: es el único que deposita la compra en
  el expediente.**

> 🔴 **LO QUE SUMA `LETRA_RECORRIDO_DESPENSA_S96` AL ALCANCE v1**
> (diecisiete firmas del founder en su §0):
>
> - **El repartidor con pantalla mínima**, y con él **el GPS** (heredado
>   del paseo, ya construido y probado) **y la foto de entrega**.
>   *El paso «vamos hacia vos» solo lo puede marcar quien está
>   manejando.* ⇒ el vendedor marca los **tres** escalones del local; el
>   **cuarto lo marca quien está en la puerta**.
> - **La venta de mostrador**, con la regla que la hace posible sin
>   romper §7.4: **el vendedor JAMÁS elige la mascota** — registra la
>   venta contra nadie, su factura lleva un **código**, y **el cliente
>   reclama la compra** y elige la mascota. **La factura es la
>   invitación.**
> - **Retiro en tienda** — el mismo pedido con otro modo de entrega.
> - **Catálogo amplio con buscador y filtros** (§4.1 no lo impedía —
>   ver la aclaración ahí).
> - **Compra recurrente** (§11.2, arriba) · **programar fecha de
>   entrega**, con cupo por cada día futuro · **donación sin destino
>   elegible** · **direcciones validadas con Places** con referencia,
>   instrucciones y punto en el mapa movible · **cinco avisos** ·
>   **cancelar hasta «preparado»** · **la vista de facturación del
>   vendedor** (la liquidación espera al motor de pagos).
> - **Dos nombres, no uno: `Servicios` y `Venta de productos`.** *No es
>   vocabulario: es el primer candado del cinturón de §3.4, y es
>   gratis.*

### 11.2 Lo que NO entra — decidido, no en evaluación

- **Diferido en cualquier forma.** Comisión bancaria de 5% a 15% según
  plazo y banco. Para tickets de USD 30–80 no se sostiene.
- ~~**Suscripción / plan recurrente.**~~ ☠️ **SALE DE ESTA LISTA — S96.**
  **La compra recurrente ENTRA a v1** con el interruptor que ya existe
  en los planes de paseo y adiestramiento, cobro directo al medio de
  pago guardado, y las tres condiciones de
  `LETRA_RECORRIDO_DESPENSA_S96` §6.1: **aviso ANTES del cobro** (2-3
  días, con saltar/mover/cancelar — *el cobro sorpresa es la causa
  número uno de contracargos*) · **se apaga en un toque desde donde se
  prendió**, nunca por atención al cliente · **si el medio de pago
  falla, el pedido NO se crea a medias**. ⚠️ **El interruptor se
  construye, pero el primer cobro real espera a la pasarela (D-778).**
- **Segundo vendedor.**
- **Carrito unificado con servicios** (§3.6).
- **Devolución automatizada** (§10).
- **Ingesta de catálogo asistida por IA** (§14).
- **Web propia del vendedor** (§8.3).
- 🔴 **CANDIDATO, NO FIRMADO — FLETE: tarifa plana o gratis sobre un
  mínimo, definida por el vendedor. El cálculo por zona y peso es v2.**
  *Es el mayor costo escondido de la decisión de S95 y no tiene dato: se
  firma o se cae con la llamada al vendedor (D-745/D-754).*
  > **ESTADO MEDIDO AL CERRAR S96: SIGUE CANDIDATO, NO FIRMADO.** Se
  > verificó el literal de esta viñeta y el del hueco 3 de la puerta:
  > los dos siguen diciendo *candidato*, y **`LETRA_PANEL_VENDEDOR_S96`
  > no lo firma** — su §13 deja el vendedor real (D-745) como pendiente
  > que ninguna pista resuelve. **D-754 sigue viva y 🔴.**
  >
  > ⚠️ **Tensión declarada, no resuelta:** la letra de S96 **sí decide
  > algo del flete en v1** — su §7.2(4): *"El envío tiene precio propio
  > y quién lo paga, separado del producto. **Hoy vale cero y lo paga el
  > vendedor.** El día de la urgencia, el campo ya existe y solo cambia
  > de valor"*. Eso es **más angosto** que el candidato de esta viñeta
  > (que admite tarifa plana), y **es una decisión de esqueleto, no la
  > firma del criterio comercial**. *Se declara acá en vez de
  > absorberse: firmar el criterio con una frase escrita para otra cosa
  > sería exactamente lo que el hueco 3 de la puerta existe para
  > evitar.* **Lo arbitra el founder con el dato de la llamada.**

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

## 15. DEUDA — ESTADO TRAS S95, ACTUALIZADO EN S96

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
| ~~**D-770**~~ | ~~**GPS del repartidor y mapa en vivo para la familia**~~ | ☠️ **NACIÓ Y MURIÓ EL MISMO DÍA.** `LETRA_RECORRIDO_DESPENSA_S96` §9.5 mete el GPS en v1 con el repartidor. **El mapa en vivo para la familia sigue en v2** |
| **D-771** | **Chat y WhatsApp dentro del envío.** La costura queda escrita en `LETRA_PANEL_VENDEDOR_S96` §6: **el mensaje pertenece al ENVÍO, no a la persona** | **NUEVA (S96).** ☠️ cuando se prenda cualquiera de los dos canales |
| **D-772** | **La pantalla "Recibir" de la app del cliente** (§5.2). Hasta que exista, la entrega la marca solo el vendedor | **NUEVA (S96).** ☠️ cuando la confirmación de la familia exista como cortesía |
| **D-773** | **El procedimiento escrito para el pedido empacado sin factura.** Hoy la pantalla lo frena; falta decir qué hace el humano después | **NUEVA (S96).** ☠️ con el capítulo de `POLITICAS` que ya pide D-744 |
| **D-774** | **Módulo de postventa.** Hoy el botón *tengo un problema* manda a WhatsApp del founder | **NUEVA (S96).** ☠️ cuando exista el módulo |
| **D-775** | **Las dos calificaciones** —la app y el pedido/servicio—, **heredando el criterio doble ciego de Kaxo**. Jamás ranking público; jamás pedirla justo después de una entrega buena | **NUEVA (S96).** ☠️ al cerrar el recorrido de la despensa |
| **D-776** | **El borrado de la foto de entrega a los 90 días.** *No alcanza con escribirlo: necesita mecanismo* | **NUEVA (S96).** ☠️ cuando el borrado corra solo y esté medido |
| **D-777** | **Apadrinar y adoptar** — aportes a una mascota concreta sin llevarla a casa | **NUEVA (S96).** v2. Candidato, no compromiso |
| **D-778** | **El cobro recurrente no se puede probar sin pasarela.** El interruptor existe; el primer cobro real espera | **NUEVA (S96).** ☠️ con la pasarela afiliada. Cruce con D-764 |
| **D-779** | **Asignación y optimización de rutas**, y el segundo repartidor | **NUEVA (S96).** ☠️ cuando el cupo de un día se llene de verdad |

> **Nota de numeración (S96):** la mesa dictó estas cuatro como **D-757
> a D-760** y **los cuatro números ya estaban tomados** — `D-757` por
> los artefactos de S95-C, y `D-758`/`D-759`/`D-760` por las fichas de
> S95-F. **El founder firmó el corrimiento a `D-770`–`D-773`**, el
> primer bloque libre medido contra `D-769`. Su texto de origen vive en
> `LETRA_PANEL_VENDEDOR_S96` §12.
>
> ✅ **Las fichas SÍ están depositadas en `DEUDAS_CANONICAS.md`**
> (segunda tanda de S96) — **D-770 con su muerte escrita**. *Se deja
> anotado que en la primera pasada no lo estaban, porque es exactamente
> el modo de falla que produjo el lío de `D-757`: un número usado en
> artefactos vivos sin ficha, que la sesión siguiente encuentra tomado y
> sin dueño.*
>
> **`D-774` a `D-779` (S96, segunda letra) se verificaron LIBRES antes
> de escribir** —cero ocurrencias en `docs/` y `CLAUDE.md`—, tal como
> ordena la advertencia de puerta de `LETRA_RECORRIDO_DESPENSA_S96`.

---

## Historial

- **v2.3 (S96, 12 Ago 2026 — mismo día, cuatro firmas nuevas del founder,
  todas salidas de VERIFICAR el catálogo real):** **§6 gana la segunda y
  tercera enmienda** — la composición pasa a **CUATRO estados**
  (`verificada` · `declarada_sin_verificar` · `ausente` · `no_aplica`;
  solo la primera calla como confiable y la última calla porque no hay
  dato faltante), la verificación es **contra la ficha del PAÍS**
  (`composicion_mercado`; la global jamás sostiene, caso Royal Canin
  Hepatic) y **el vocabulario de alérgenos se vuelve DATO con
  RELACIONES** (23 entradas + `es_un`/`puede_ser`; la advertencia
  imprecisa SE DICE; pollo/pavo/pato jamás se agrupan — medido: 242 de
  456 productos declaraban alérgenos que el motor no sostenía).
  **§7.3: las raciones NO salen en v1** (ni heredadas ni calculadas —
  manda la etiqueta y el vet). **§10 gana tres filas** (sin verificar ·
  no_aplica · relación imprecisa). El paso de entendimiento de §5.4
  gana productor (`alergia_entendimientos`, append-only).
- **v2.2 (S96, 12 Ago 2026):** el recorrido completo, de los dos lados.
  Fuente: `LETRA_RECORRIDO_DESPENSA_S96`, **diecisiete firmas del
  founder**. **§6 y §10: la alergia ADVIERTE, no esconde** —exclusión
  dura en la recomendación, advertencia dura en la búsqueda, con dos
  candados (sin composición se dice, jamás silencio · la advertencia
  jamás se apaga por promoción)—. **§11.2: la compra recurrente sale de
  la lista de lo que no entra**, con cobro al medio guardado y aviso
  ANTES del cobro; su primer cobro real espera la pasarela (D-778).
  **§4.1 se ACLARA y no se enmienda:** una oferta por producto no
  significa catálogo chico. **§11.1 se ensancha:** repartidor con
  pantalla —**el GPS y la foto de entrega entran a v1**—, venta de
  mostrador **donde el vendedor jamás elige la mascota** (el cliente la
  reclama con el código de la factura), retiro en tienda, catálogo
  amplio con buscador, fecha programada con cupo por día futuro,
  donación sin destino elegible, direcciones con Places, cinco avisos,
  cancelar hasta «preparado», y **dos nombres —`Servicios` y `Venta de
  productos`— como primer candado del cinturón de §3.4**. Nacen **D-774
  a D-779** (verificados libres antes de escribir); **D-770 nace y muere
  el mismo día**. La letra vieja **no se borra**: queda tachada con su
  marca. **El criterio de flete NO se toca: sigue candidato.**
- **v2.1 (S96, 12 Ago 2026):** enmienda del panel del vendedor.
  **§8.6 y §11.1 pasan de DOS botones a CUATRO escalones** —preparado ·
  empacado · despachado · entregado— por firma del founder
  (`LETRA_PANEL_VENDEDOR_S96` §3, choque declarado en su §11). Las tres
  razones: el lote para el retiro de producto · la factura del vendedor
  porque en Ecuador la electrónica falla · y **la entrega como único
  acto que deposita en el expediente**. La letra vieja **no se borra**:
  queda tachada con su marca de enmienda. **§11.2 se re-mide y NO se
  firma**: el criterio de flete sigue candidato, con la tensión contra
  §7.2(4) de la letra de S96 declarada en su lugar. Nacen **D-770 a
  D-773** — la mesa las dictó como D-757–D-760 y los cuatro números
  estaban tomados; el corrimiento lo firmó el founder. **Cero cambios
  en el resto del documento.**
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
