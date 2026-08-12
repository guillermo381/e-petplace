# S95 · ACTA DE CIERRE — LA DESPENSA, DE LA LETRA A LA VITRINA

**11–12 de agosto de 2026 · pistas C · D · E · F · G · H · I · J · K.**
**95 archivos · +21.356 / −1.548 · 36 commits**, medidos del log entre
`4a1c4eaa` y `4ca17195`.

---

## ① LA DECISIÓN MADRE

> **El motor de comercio de la despensa es PROPIO. VTEX queda como fuente de
> inspiración de modelo, no como dependencia de producto.**

Y la razón, que es lo que trasciende a la decisión: **las cuatro razones por
las que VTEX entró se auditaron una por una, y las cuatro habían caducado o no
aplicaban al caso.**

| La razón de entonces | Lo que se midió ahora |
|---|---|
| «No sabíamos construir» | Caducó. Esta misma sesión construyó el motor entero |
| Escalabilidad | No aplica a ~800 pedidos/mes. Y lo que VTEX escala bien —multi-vendedor, matcher, Subscriptions— es justo lo que v1 deja afuera |
| Seguridad | Nunca fue de VTEX: el expediente vive en Supabase bajo RLS y el PCI lo transfiere la pasarela |
| Performance sin pagar el precio de escalar | **Estaba invertida.** El 2,50 % no evita ese precio: *es* un precio que crece con el éxito para siempre, y en Forma B lo paga el vendedor — la persona que todavía hay que convencer |

> 🔴 **LA LECCIÓN, Y NO ES SOBRE VTEX:**
> **Comprar plataforma cuando no sabés construir es prudencia. Conservarla
> cuando ya sabés es inercia.**
>
> Lo que hace auditable a esta decisión no es que salió más barata — es que
> **se revisó contra sus razones de entrada, no contra su precio.** Una
> decisión que se defiende por su costo se puede revertir con un descuento;
> una que se defiende por sus razones, no. ⇒ **L-228**.

---

## ② LAS FIRMAS DEL FOUNDER

Todas de esta sesión, todas ejecutadas:

- **Una sola app de negocios** — `e-PetPlace Negocios`. El vendedor es un
  **ROL** sobre `cuentas_comerciales`, no un actor con app propia. **No hay
  tercera app.**
- **El vendedor PROPONE, e-PetPlace PUBLICA.** *Si el vendedor publica
  directo, la vitrina curada deja de existir y con ella el foso entero.*
- **El ledger registra FEE, no GMV.** Modelar la despensa como GMV inflaría el
  ingreso proyectado un orden de magnitud: no es un error contable, es un
  error de decisión.
- **Los 137 pedidos del prototipo se borran** — cabeceras huérfanas, sin ítems
  y sin `vtex_order_id`.
- **Las tarifas de flete se conservan marcadas SIN VERIFICAR** y apagadas.
- **El impuesto es catálogo de tasas**, no una constante.
- **El flete es MOTO PROPIA del vendedor.** El courier pasa a v2, modelado y
  apagado.
- **Cobertura: Quito y sus valles, más Sangolquí y San Rafael.** 🔴 Los dos
  últimos **son del cantón Rumiñahui, no de Quito**, y entran por decisión
  explícita. *Quien mañana «limpie» la lista dejando solo el DMQ va a quitar
  dos zonas que se pusieron a propósito.*
- **El catálogo v1 se carga por SCRIPT, no por el portal admin.**
- **Los momentos del catálogo son la ETAPA ETARIA.** M1–M6 se queda en el
  expediente — ver §⑤.
- **El precio de la app va por debajo de la competencia, no al margen del
  vendedor.**

---

## ③ LO CONSTRUIDO, CAPA POR CAPA

| Capa | Qué | Commits |
|---|---|---|
| **Esqueleto** (S95-C) | 8 migraciones · 15 tablas nuevas · 17 jubiladas · el juez con 11 invariantes | `201f8d63` → `dfc9f5c2` |
| **Motor** (S95-D) | 5 migraciones · 10 funciones · 29 estados en dos capas · 46 transiciones como DATO · el ledger comercial | `bb464917` → `207f02ac` |
| **Wrappers** (S95-E) | catálogo · recomendación · pedido · seguimiento · panel del vendedor · el gate E2E · juez a 22 | `1631c128` → `5323b8db` |
| **Puerta del catálogo** (S95-F) | `proponer_sku_vendedor` · `publicar_oferta_sku` · el cargador CSV | `8a727bc6` · `ec9fe79e` |
| **Pantalla** (S95-I) | la primera de la despensa, publicada y verificada | `4865e4fb` |
| **Seguridad del motor** (S95-G) | las cinco puertas cerradas · la factura · el ajuste de stock | `1e99a454` |
| **Alta del vendedor** (S95-G2/G3) | tres puertas · la cuarta puerta · la activación con rastro | `962dafda` · `ac121493` |
| **Vocabularios** (S95-J/J2) | tallas y momentos cerrados con CHECK · la foto viaja | `383f36e9` · `3cb6e004` |
| **La vitrina llena** (S95-G4) | vendedor de pruebas + **seis productos reales** + E2E con catálogo real | `d9343d26` |
| **La compra completa** (S95-K) | la reserva antes del pago · el cotizador con destino · el filtro por etapa | `4ca17195` |

**El juez cerró en 27 verdes / 1 rojo.** El único rojo es `seller_perfil` y
`resenas_productos`, bloqueadas por vistas que sirven a otro frente y con
deuda propia.

---

## ④ 🔴 LOS CINCO DEFECTOS GRAVES — Y EL PATRÓN ES LA LECCIÓN

### ④.1 `confirmar_pago_pedido` regalaba la mercadería

Cualquier usuario logueado podía marcar como pagado el pedido **de otro** y
llevarlo hasta preparación. Medido por el camino real, con la anon key del
bundle y sobre el pedido de una tercera persona.

> *No es un permiso de más: es la puerta por la que se llevan la mercadería.*

Y el brief de esa tanda señalaba **una** puerta —el actor `sistema`—.
**Eran cinco**, y la peor no era ésa.

### ④.2 Se cobraba sin reserva

Con stock en cero: la reserva **falló**, no quedó ninguna reserva vigente, y
el pago se capturó igual. El pedido quedó en `liberado_preparacion`.

> *Y hay algo peor que el cobro: el pedido pasó por el estado `stock_reservado`
> sin que existiera reserva. **Un estado que miente es peor que uno que falta,
> porque nadie lo va a ir a verificar.***

### ④.3 El separador de alérgenos

`"pollo, arroz"` entraba como **un solo alérgeno** llamado literalmente
«pollo, arroz».

> *Ningún perro es alérgico a esa cadena, así que **la exclusión dura nunca
> habría disparado** y el producto se le habría recomendado a un perro
> alérgico al pollo — sin error y sin aviso.* **Es la feature entera fallando
> en silencio.**

### ④.4 `pedidos` aceptaba INSERT anónimo

Con la anon key que viaja en el bundle público. ⇒ **D-757**, cerrada en la M1.

### ④.5 El operador del CHECK importaba más que el vocabulario

Con solapamiento (`&&`) en vez de contención (`<@`), `['adulto','M6']` habría
pasado: bastaba un valor válido para que entrara la fila entera.

> ***Vocabulario cerrado en apariencia, basura adentro*** — y justo el valor
> que la razón de cerrarlo existía para impedir.

### ④.6 El patrón

> 🔴 **LOS CINCO FALLABAN EN SILENCIO. NINGUNO SE ENCONTRÓ LEYENDO: los cinco
> salieron de una medición con contra-caso.**
>
> Ni el typecheck, ni el juez estático, ni una revisión de código los habrían
> visto — **porque los cinco FUNCIONABAN.** Devolvían `ok`, no lanzaban, no
> dejaban traza. Lo único que los destapó fue producir el rojo a propósito.

---

## ⑤ LOS VERDES FLOJOS — Y POR QUÉ SON EL HALLAZGO

Tres instrumentos dieron verde por la razón equivocada, **y a los tres los
cazó quien los había escrito.**

| Instrumento | Cómo mentía |
|---|---|
| El invariante del cinturón servicios↔productos | **Medía por NOMBRE de tabla en vez de por estructura.** Su lista era corta y por eso salía verde |
| El arnés E2E | Imprimió **«GATE VERDE» con siete tests sin correr**: un `process.exit(0)` en el `finally` se comía la excepción |
| La sonda del actor `sistema` | **Atacaba desde el estado equivocado** (`creado`), donde la tabla de transiciones no tiene fila para ese actor. Rebotaba, y el rebote parecía un gate |

> 🔴 **UN ROJO POR LA RAZÓN EQUIVOCADA ESTÁ TAN ROTO COMO UN VERDE POR LA
> RAZÓN EQUIVOCADA.**
>
> Y hubo dos de esos también: el invariante 16 buscaba `p.estado` en el TEXTO
> de una vista y hacía match con el `JOIN`; el invariante 20 medía «lo
> menciona» en vez de «en qué dirección va», y salía rojo contra dos líneas
> perfectamente correctas.
>
> **En los cinco casos se corrigió el INSTRUMENTO, jamás el test.**

---

## ⑥ LO QUE NO SE CONSTRUYÓ, Y POR QUÉ IMPORTA

Carrito unificado · suscripción · segundo vendedor · devolución automatizada ·
courier · búsqueda con filtros · juguetes, accesorios y camas · IA de carga ·
asistente por voz.

> 🔴 **La lista de exclusiones dejó de ser una limitación y pasó a ser el
> andamio que sostiene la decisión de S95.**
>
> Lo que hace viable un motor propio en 7-8 semanas es exactamente esa lista.
> **Si se erosiona, la decisión de construir en vez de comprar se vuelve mala
> retroactivamente.** *El riesgo de esta sesión nunca fue técnico: es que «la
> despensa» se convierta en «una plataforma de e-commerce».*

---

## ⑦ LO QUE LA SESIÓN LE HIZO A SU PROPIA LETRA

**`MODELO_DESPENSA` v2.0 se releyó al cierre.** Tres hallazgos:

1. 🔴 **§2.3 no describe ningún producto real.** Su aritmética está construida
   sobre una venta con **IVA 15 %**, y **los seis productos del catálogo v1
   tributan `EC_IVA_0`**. Se agrega la versión correcta como **§2.3bis** —
   no se borra la vieja: describe bien el escenario del día que entre un
   producto gravado.

2. ✅ **§10 «Sin stock» ya lo decía bien, y el motor no lo cumplía.** La letra
   dice *«si no hay stock, la pantalla lo dice antes del pago»* — y hasta
   S95-K el motor cobraba igual. **La letra estaba bien y nadie la había
   verificado contra el motor.** *Una letra correcta que nadie contrasta es
   una letra que no protege de nada.*

3. **Nada más resultó estar muerto.** Los capítulos que S95-F declaró no
   revisados (§3, §5, §6, §7, §9, §11) se releyeron y **siguen describiendo lo
   construido.** Se declara la relectura, no se enmienda por prolijidad.

---

## ⑧ LO QUE NO SE PUDO MEDIR

1. **La forma real de `imagenes`.** Quedó en `[]` porque **el catálogo del
   vendedor no trae fotos.** El wrapper acepta `["url"]` y `[{"url":…}]` sin
   poder elegir. ⇒ **D-767**.
2. **El filtro por etapa, por camino real.** Zeus no tiene fecha de nacimiento
   —y **64 de las 72 mascotas de esta base tampoco**—, así que la etapa es
   `desconocida` y el filtro no se ejerce. Está construido y probado por
   construcción. ⇒ **D-768**.
3. **El tratamiento tributario real de los seis productos.** Se usó `EC_IVA_0`
   por criterio; **no se verificó contra factura del vendedor.**
4. **Si los alérgenos coinciden con el envase.** Los seis van marcados
   `NO VERIFICADO CONTRA ENVASE` a propósito.
5. **El portal admin**, que vive en otro repo. Es lo que mantiene rojo el
   invariante 10.

---

## ⑨ EN LENGUAJE DE NEGOCIO

**Al empezar la sesión no existía nada de la despensa: ni tabla, ni motor, ni
pantalla, ni producto.**

**Hoy la vitrina de la app tiene seis productos reales** —marca, presentación,
peso y precio del catálogo del vendedor— y lo que la hace distinta de
cualquier tienda **ya funciona sobre producto de verdad**: un perro con
alergia a pollo deja de ver el Pro Pac Pollo-Arroz y sigue viendo los otros
cuatro.

**El camino de compra completo corre de punta a punta en la base**, probado
con datos reales: reserva → pago → empaque con lote → factura del vendedor →
reparto con moto propia → entrega → **y el evento llega al expediente de la
mascota, al entregar y solo al entregar.**

### Qué falta para la primera venta real

| Qué | Por qué bloquea |
|---|---|
| 🔴 **La pasarela de pago** | Es lo único que falta para comprar desde el teléfono. Hoy el cobro lo simula el backend |
| 🔴 **D-751 — la respuesta escrita de VTEX** | Vender fuera de su OMS con el contrato vivo puede activar la penalidad de 6.1.7.1. **Ninguna venta real ocurre antes de tenerla por escrito** |
| 🟡 **Fotos y stock del vendedor** | La vitrina tiene seis productos sin foto y con stock de prueba |
| 🟡 **El vendedor real** | La cuenta de hoy es de pruebas, con RUC falso, **diseñada para borrarse** |

**Y una que no bloquea la venta pero sí el calendario: D-756** — el aviso de
no renovación de VTEX antes de fin de noviembre, o renueva automático doce
meses el ~27-feb-2027.
