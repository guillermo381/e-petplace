# S115-A · CIERRE DOCUMENTAL — la documentación dice la verdad o no sirve

**12 de septiembre de 2026.** Tanda de **documentación medida**: cero producto, cero migraciones. Todo lo que sigue se contrastó contra el objeto —catálogo de Postgres, edges desplegadas, `git ls-remote`, el aparato del founder— **antes** de escribirse.

---

## ① LO QUE EL OBJETO DICE DISTINTO A LA LETRA

*Nueve divergencias encontradas al medir. Ninguna se curó de callado: las que son del founder se **marcaron en su lugar**, las que son defectos se **anotaron**.*

| # | el documento dice | el objeto dice | qué se hizo |
|---|---|---|---|
| **1** | `MODELO_FINANCIERO` §3.1: `Payout = GMV − Pasarela − Plataforma` | `crear_evento_economico`: **`payout = bruto − comisión`** y `plataforma = comisión − pasarela`, con `regla_payout` estampada | **enmendado con el literal**, y declarado que `monto_plataforma` **puede quedar negativo** |
| **2** | `MODELO_FISCAL` E5: *«con `direccion` (emitido \| recibido)»* | el eje se llama **`sentido`**. 🔴 **`direccion` EXISTE y es la del comprador** | **E8 lo corrige.** *Un nombre que apunta a una columna real con otro significado no se descubre nunca* |
| **3** | `MODELO_FINANCIERO` (enmienda 10-sep): *«ítem de catálogo de `plataforma_directa`»* | **`plataforma_directa` no existe.** `revenue_stream_enum` = transaccional·recurrente·eventual·publicitario·passthrough. Lo que existe es `venta_directa_plataforma`, un **tipo de evento**. Y `tarifa_servicio` **no está en `tipos_servicio`**: vive en `app_config` | **declarado en §3.1quinquies** |
| **4** | la comisión es 18 / 15 / 12 | **esas filas arrancan el `2026-10-01`. HOY rige el 10 %** | **§2.2bis lo dice primero**, antes de la tabla |
| **5** | `MODELO_ECONOMICO` E-A: el carrito mixto aplica el mínimo de la categoría de mayor base | `resolver_comision_despensa()` **no mira categoría, no devuelve mínimo, y tiene CERO consumidores** (motor y puerta única) | **letra escrita y marcada SIN CONSTRUIR**; es `L-318` y funda `L-551` |
| **6** | `MODELO_FISCAL` §1.4: *«la fórmula universal (§3.1) no cambia»* | **cambió el mismo 12-sep** | **E10 lo declara vencido** en su último ítem |
| **7** | `MODELO_FINANCIERO` §2.3: *«la factura la emite el seller original»* · §8.10: Forma B | el objeto ya separa `venta_cliente` **emitido** por la casa / `comprobante_proveedor` **recibido** | **marcadas PENDIENTES en su lugar** — las enmiendas son del founder y **no se aplicaron** |
| **8** | — *(nadie lo decía)* | **`fiscal_sequences.ultimo_secuencial = 5`** para `001-002/factura` mientras hay **autorizadas con secuencial 13** | **anotado.** No es corrupción —numera el proveedor— pero el día que se emita en modo `casa` sobre esa serie **pediría el 6 y el SRI ya tiene el 13** |
| **9** | — *(nadie lo decía)* | **WhatsApp: 40 de 43 entregas en `fallida`** (93 %), última **hoy 17:01**. Correo 44/44, push 60/60 | **anotado en `MODELO_NOTIFICACIONES`** con sus dos motivos |

**Y tres observaciones menores, medidas en `fee_configs`:** cuatro filas `activo = true` con vigencia **ya vencida** (⇒ `activo` dejó de significar «rige») · las dos filas de `donacion` están **duplicadas** · `suscripcion_prime` y `suscripcion_prestador` existen en `false` (Prime preparado-apagado, correcto).

---

## ② LO QUE SIGUE ABIERTO — con dueño y con lo que lo destraba

*Sin optimismo. Lo que no tiene fecha, no tiene fecha.*

| qué | dueño | qué lo destraba |
|---|---|---|
| 🔴 **EL GATE EN EL APARATO DEL ÚLTIMO OTA** — cliente `66683587` · prestador `3e1df302`, ancla `5d83a413` | **founder** | Enchufar el cable y abrir la app **dos veces** (la 1ª descarga, la 2ª aplica). **Lo verificado es el bundle ANTERIOR** (`d181f9b8`): la cura de `D-1074` verde, 19-20 MB planos a los 120 s. **Este bundle agrega el trabajo de C mergeado** —checkout, sección de facturación, diccionarios— **y ese código no lo caminó nadie**. *typecheck y gates verdes, pero ninguno mira una pantalla* (regla 77). |
| 🔴 **WhatsApp caído (93 %)** · 28 `sin_plantilla_resuelta` + 12 `ensamblado_incompleto:null` | **quien tenga el canal** | **Falla ANTES de Meta** ⇒ no espera a nadie de afuera: falta resolver la plantilla y completar el ensamblado. *Es el hallazgo más accionable de esta tanda.* |
| 🔴 **`F1`: ¿puede Satori revender un servicio de salud animal?** | **contador** | Su respuesta. **Es la única razón por la que el acto veterinario va en agencia** — sin ella, la agencia por acto es una cobertura, no una conclusión |
| 🔴 **`D-1083`** las huérfanas + el reconciliador | **founder + A** | La firma ya está (se **adoptan**, sólo lo NUESTRO; los duplicados por nota de crédito). Falta construir el reconciliador. Evidencia nueva: **4 `invoice.authorized` → `documento_no_encontrado`** |
| 🔴 **`D-1069`** los **16** intentos trabados · fecha **25-sep** | **A** | El barrido + el techo del pago, en ese orden |
| 🔴 **`D-1068`** el medio de pago | **founder** | La **segunda llave** para producción (`fiscal_forma_pago_asumida_en_produccion`, hoy `false`) |
| ⚠️ **La tarifa de veterinaria «pendiente de ratificación»** | **founder** | 🔴 **Está cargada con vigencia `2026-10-01`: va a regir sin que nadie vuelva a firmarla si esa fecha llega primero.** *Un número con fecha futura no espera a nadie* |
| ⚠️ **`D-1084`** agencia por acto | **founder + A** | Firmada, **sin construir**. El objeto decide **por cuenta** (5 fachada / 10 reventa) ⇒ el carrito mixto con dos facturas **todavía no puede ocurrir** |
| ⚠️ **`E-A`** el mínimo del carrito mixto | **A** | Letra firmada, **sin construir**, y su resolutor no tiene consumidores |
| ⚠️ **Las dos enmiendas de `MODELO_FISCAL` §1.4** (§2.3 y §8.10/Forma B) | **founder** | Su firma. **Marcadas en su lugar, no aplicadas** |
| ⚠️ **`fiscal_sequences` desalineada** (5 vs 13) | **A** | Decidir si el contador se re-sincroniza o si la serie `001-002` queda reservada al proveedor. **No se retrocede el contador** |
| ⚠️ **WebRTC fuera del arranque** | **C** | Firmado, sin construir. `@/lib/livekit` sigue en el layout raíz |
| ⚠️ **`D-1061`** edges atrasadas | **A** | **NO MEDIBLE con lo corrido**: las 7 fiscales están `ACTIVE`, pero comparar cada edge contra su fuente exige un diff por contenido que esta tanda no corrió |
| ⚠️ **`epetplace-facturacion-sri.md`** | **founder** | **No existe en el repo** (buscado por nombre y por contenido). Si vive afuera, su marcado es suyo |
| ⚠️ **Plazo real de devolución del IVA retenido** | **contador** | Decide cuánto capital de trabajo hace falta. *Mientras no tenga número, la caja se presupuesta con el plazo pesimista* |
| ⚠️ **`D-1081`** · **`D-1082`** · **`D-1075`** · **`D-1077`** · **`D-1078`** · **`D-1079`** · **`D-1059`** | varios | **No re-medidas en esta tanda**, y se dice en vez de heredar su estado |

---

## ③ EL GATE — **construido, con su límite declarado**

**`pnpm verify:numero-nombra-comando`** · `scripts/verify-numero-nombra-comando.mjs`

**Qué exige:** una sección que **se declara medida** y publica una **tabla con números** tiene que nombrar **su comando o su fecha** (o decir `NO MEDIBLE`).

🔴 **Por qué NO hace lo que se pidió literalmente —«que todo número de un documento vivo nombre su comando»— y se dice en vez de fingir que sí:** *un gate no puede distinguir un número que es una **medición** de uno que es una **decisión** («la comisión es 18 %») o de uno que es parte de una frase.* Intentarlo produce ruido sobre prosa correcta, **y un gate ruidoso se apaga** — que es peor que no tenerlo (`L-550`). Se acotó a lo único decidible por texto: **si una sección dice «medido», tiene que decir con qué.**

⚠️ **Sus DOS puntos ciegos, declarados porque su verde no los cubre:**
1. **Una sección que publica números medidos y no usa la palabra «medido» es invisible.**
2. **Un documento que no está en el corpus no se mide.** El corpus son cuatro (`FINANCIERO`, `FISCAL`, `ECONOMICO`, `PROVEEDOR_FISCAL`) y **se declara, no se deriva**.

**Y su no-concluyente:** si ninguna sección resulta exigible, **sale con exit 2 y lo dice** — *un gate que no exige nada da verde por vacío, y eso no es una medición.*

✅ **Su rojo salió en la PRIMERA corrida y sobre un caso real**, que es lo que `L-459` pide: `MODELO_ECONOMICO` §6.1 publicaba la tabla de DeUna sin decir de dónde salía. **Y la cura fue la correcta: no era medible contra nuestra base** —el costo del riel no vive en ninguna tabla nuestra— **así que se citó con su origen (el proveedor) y su fecha, en vez de inventarle un comando.**

---

## ④ LO QUE ESTA TANDA TOCÓ

| documento | qué |
|---|---|
| `MODELO_FINANCIERO` | §2.2bis (las 18 filas con su comando) · §3.1 enmendada · §3.1bis…sexies (fecha que rige · mínimo y base cero · carrito mixto · `tarifa_servicio` · IVA congelado) · §3.3 liquidaciones y su compuerta · §3.4 `medio_pago` · dos enmiendas ajenas **marcadas** |
| `MODELO_FISCAL` | **v0.4 → v0.5**: E8 (el libro del emisor, corrige a E5) · E9 (los códigos con `fuente_codigo`) · E10 (lo que NO cierra) |
| `MODELO_ECONOMICO` | **v1.1 → v1.2**: §6 DeUna · la retención es **caja, no costo** · la regla de fase **firmada** · lo que el objeto todavía no hace |
| `PROVEEDOR_FISCAL` | **NUEVO v1.0** — el elegido con sus dos modos y sus cuatro incumplimientos, y los descartados con su razón |
| `DEUDAS_CANONICAS` | `D-1074` **cerrada** con sus ocho hipótesis muertas · **L-547 → L-558** · el estado real de las fichas · **los secuenciales quemados, uno por uno** |
| `MODELO_DESPENSA` | Forma B **marcada superada**, no borrada |
| `MODELO_NOTIFICACIONES` | el correo con sus dos papeles · **WhatsApp al 93 % de fallo**, con sus motivos |
| `POLITICAS_EPETPLACE` | **P25 CANDIDATA, sin firma** — el archivo tenía cero menciones a factura |
| `LETRA_PORTAL_ADMIN` | el **tercer criterio** aplicado (opción (a) de su propio §6.6), con su razón **y su límite** |
| skill `epetplace-db` | **el despliegue de edges es parte del mismo acto que la migración** |
| `scripts/` | `verify:numero-nombra-comando`, con su rojo probado sobre un caso real |

**Y antes de todo eso, el censo de ramas que el founder pidió:** `git ls-remote` encontró **dos ramas de S115 sin mergear** (`b-1.0 @ a5da9b77`, `c-1.0 @ dd798b9d`). **Las dos están en `main`.** El merge de C **rompió un contrato** —construía sobre `estadoDeSesion()`, retirado el mismo día— y se curó con la señal que sí existe, **conservando las dos voces sostenibles y declarando la tercera sin productor**.
