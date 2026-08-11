# ACTA DE ENMIENDAS — S95 (11 Ago 2026)

> **Qué es esto.** La decisión de S95 —**el motor de comercio pasa a ser
> propio; VTEX queda como fuente de inspiración**— toca cinco documentos
> maestros además de `MODELO_DESPENSA`. Este acta trae **el texto
> literal de cada enmienda, listo para insertar donde se indica.**
>
> **Regla de la casa que gobierna este acta: fuente única, jamás texto
> duplicado.** Cada bloque tiene UNA casa. Una vez depositado, este acta
> queda como registro del acto, no como fuente.
>
> **Precedente de forma:** `docs/relevamientos/2026-07-31-s82-censo-de-enmiendas.md`.

---

## ORDEN DE DEPÓSITO

Se depositan **en este orden**, porque cada uno cita al anterior:

1. `docs/MODELO_DESPENSA.md` — **reemplazo completo** por la v2.0.
2. `docs/BIO_EXPEDIENTE.md` — enmienda E1/E2 (D-743) + costura de IA (D-753).
3. `docs/PORTAL_PRESTADOR.md` — enmienda a §S20 (portales hermanos).
4. `docs/MODELO_FINANCIERO.md` — acotación de §8.10 y nota de D-750.
5. `CLAUDE.md` — alta de D-751 a D-756 y cambio de estado de D-746/D-747.

**Ninguno de estos depósitos autoriza construir.** El censo del
subsistema de comercio vivo (B0.5 del arranque S95) sigue siendo
precondición de la primera migración.

---

## 1 · `BIO_EXPEDIENTE.md` — D-743 y D-753

### 1.1 Dónde va

**En `## Eventos`, inmediatamente después de `### E2 — Tipos de evento
(MVP + diferidos)`**, como nueva sub-sección `E2bis`. Se inserta ahí y
no en E1 porque lo que se enmienda es **el estatuto de un tipo que ya
existe**, no la forma del evento.

### 1.2 Texto literal a insertar

```markdown
### E2bis — LA COMPRA COMO FUENTE DE EVENTO (enmienda S95, D-743)

> **Origen:** `MODELO_DESPENSA` §7. **El tipo `producto_asignacion` YA
> EXISTE y está activo en `cat_tipos_evento`** (censo S94-A). Esta
> enmienda **NO funda un tipo nuevo**: le da su fuente, su procedencia y
> sus límites. *La letra de S94 lo trató como frente nuevo y era
> incorrecto.*

**La despensa deposita eventos en el expediente. Condiciones, todas
duras:**

1. **Append-only**, como todo el expediente. Un pedido cancelado o
   devuelto **no borra el evento**: deposita otro que lo corrige.
2. **Procedencia obligatoria: `declarado_por_familia`.** Una compra la
   aporta la familia, jamás un profesional. El expediente **sí**
   distingue la fuente (A3.6, y el muro verificado/declarado de
   `MODELO_PRESENCIA` §4): **un alimento comprado no tiene el peso de
   una prescripción veterinaria, y ninguna pantalla los puede
   confundir.**
3. **NO alimenta el loyalty.** `MODELO_LOYALTY` §5 lo declara
   anti-fuente y §7.4 lo pone entre los límites duros: *comprar mucho no
   es cuidar mejor*. **Sin excepción — y se verifica por construcción
   que ningún trigger conecte la compra con `transacciones_puntos`.**
   *(La categoría `compras` del catálogo `logros` ya estaba muerta por
   `MODELO_LOYALTY` §4: esta enmienda no la revive.)*
4. **Eventos aportados por menores no acumulan** (P5).

**QUÉ COMPRA ES DATO DE CUIDADO — la frontera, resolviendo el choque (c)
del censo S94-A.**

*El choque:* este documento decía que los sellers contribuyen TODO lo
comprado; `MODELO_DESPENSA` §7.1 excluye juguetes, accesorios, camas e
higiene. **Se resuelve a favor de la exclusión, y la razón es de
modelo, no de alcance:**

| Entra al expediente | No entra |
|---|---|
| Alimento (se cruza con la curva de peso, Eje 5) | Juguetes |
| Suplementos | Accesorios |
| Antiparasitarios y antipulgas (con su periodicidad) | Camas |
| Dietas de prescripción | Higiene general |

**El criterio, escrito para que no se re-discuta cada vez: entra lo que
cambia el cuerpo o el riesgo sanitario de la mascota.** Una cama es
compra; un antipulgas es cuidado. *Un expediente que registra todo lo
comprado deja de ser un expediente clínico y se vuelve un historial de
consumo — que es exactamente lo que P5 y `MODELO_LOYALTY` §7 impiden.*

**PE7 QUEDA PAGADO.** El pendiente PE7 (*"catálogo de productos
centralizado… sellers como dueños de SKUs específicos pero productos
como entidades canónicas"*, S12) **es el modelo de datos que
`MODELO_DESPENSA` §3.3 adopta**. Su casa es ese documento; acá queda la
referencia. *Vale la pena registrarlo: la inspiración que se le atribuyó
a VTEX ya estaba escrita en esta casa desde S12.*

**LO QUE EL VENDEDOR NO VE — cláusula nueva y hoy necesaria.** Con la
decisión de app única (`MODELO_DESPENSA` §8), vendedor y prestador
conviven en la misma app. Por lo tanto:

> **El rol `seller` no hereda ningún acceso del rol `prestador`.** Una
> cuenta comercial con los dos roles ve el expediente **por su oficio y
> por la matriz A3**, jamás por haber vendido algo. **Un vendedor puro
> tiene cero acceso al expediente, sin excepción y sin configuración que
> lo habilite.** Se cierra en las policies, no en la UI.
```

### 1.3 Segundo bloque — la costura de IA (D-753)

**Dónde va:** en `### E1 — Modelo central: eventos_mascota`,
**inmediatamente después de la Nota S67 sobre la procedencia**, porque
es el mismo eje y hay que leerlos juntos.

```markdown
> **Costura S95 (D-753) — LA PROCEDENCIA GANA UN SEGUNDO EJE: CÓMO SE
> CAPTURÓ.** Hoy `procedencia` responde **quién** aporta
> (`declarado_por_familia` | `verificado_por_prestador`). Falta
> responder **cómo se capturó el dato**: tecleado por una persona,
> dictado a un asistente, o extraído por IA de una imagen o un audio.
>
> **Un evento asistido por IA no tiene el mismo peso probatorio que uno
> tecleado, y el expediente no los puede confundir** — es el mismo
> principio que ya separa familia de profesional.
>
> **Se deposita como costura, NO como función.** El dictado clínico
> asistido ya existe en el flujo veterinario y hoy no lo declara; la
> ingesta de catálogo por IA y la asistencia por voz
> (`MODELO_DESPENSA` §14) llegarán después del soft launch. **Hoy es una
> columna; con miles de eventos vivos es una migración con backfill.**
> Su forma exacta la resuelve el censo de esquema, no esta letra.
```

---

## 2 · `PORTAL_PRESTADOR.md` — enmienda a §S20 (portales hermanos)

### 2.1 Dónde va

**En `### Portales hermanos (decisión arquitectónica S20)`, sobre la
línea de `PORTAL_SELLER.md`**, con la forma de tachado + actualización
que esa sección ya usa (es el mismo patrón con el que S94-B actualizó
la salida de MediaLab).

### 2.2 Texto literal — reemplaza la viñeta de `PORTAL_SELLER.md`

```markdown
- **`PORTAL_SELLER.md`** — prestadores de productos. ~~Base técnica
  definida (MediaLab + VTEX).~~ ~~**ACTUALIZADA S94-B:** base técnica y
  visión viven en `MODELO_DESPENSA` v1.0 con Forma B firmada; nuevo
  disparo, la ficha del piloto (D-745).~~ ☠️ **ENMENDADA S95
  (11-ago-2026) — EL DOCUMENTO SOBREVIVE; EL CANAL PROPIO, NO.** Firma
  del founder: **una sola app de negocios, `e-PetPlace Negocios`**, con
  el vendedor como **rol sobre `cuentas_comerciales`**, no como actor
  con app propia. `PORTAL_SELLER.md` **sigue siendo un documento a
  redactar** —el alma del vendedor merece su letra— pero **su superficie
  es un MÓDULO dentro de `e-PetPlace Negocios`**. Base técnica en
  `MODELO_DESPENSA` v2.0 §8. Disparo sin cambio: D-745.
```

### 2.3 ⚠️ El choque, declarado — bloque que se agrega debajo de la lista

```markdown
> ### ⚠️ CHOQUE DECLARADO CONTRA LA LETRA DE S20 (S95, firmado)
>
> S20 dice *"cada portal tiene su propio canal en e-PetPlace"*. **La
> decisión de S95 lo enmienda para el caso del vendedor**, y por regla
> de la casa un choque contra letra firmada **se declara, jamás se
> difiere en silencio.**
>
> **Lo que lo sostiene:** `MODELO_FINANCIERO` §8.11 ya trataba al seller
> como **rol sobre la misma cuenta comercial** (el refugio que agrega
> `seller_productos`), y esta misma sección S20 llama a los sellers
> *"prestadores de productos"*. **El modelo de dominio nunca los trató
> como actores separados: la letra de la superficie iba por detrás del
> modelo, y acá se alinea.**
>
> **Alcance de la enmienda: EL VENDEDOR, y nadie más.** Los otros
> portales hermanos (refugios/criaderos, admin, cliente) **no se tocan**
> y su estatuto de S20 sigue vigente tal cual.
>
> **Lo que NO decide esta enmienda:** si refugios y criaderos también
> deberían vivir como rol dentro de `e-PetPlace Negocios`. *Es la
> pregunta obvia siguiente y se deja abierta a propósito: no tiene
> disparo, y S20 fue explícito en que un portal se redacta cuando tiene
> disparo real, no por completitud.*
```

### 2.4 La nota de superficie — se agrega a la NOTA S42 del encabezado

```markdown
> **NOTA S95 (11-ago-2026) — LA APP CAMBIA DE NOMBRE Y DE ALCANCE.** La
> app deja de ser "del prestador" y pasa a ser **`e-PetPlace Negocios`**:
> una sola app para todo el que hace negocio en el ecosistema —
> prestador de servicios y vendedor de productos, como roles sobre
> `cuentas_comerciales`.
>
> **Por qué Negocios y no Care** (la alternativa que la mesa evaluó): la
> app del cliente se llama e-PetPlace, y con "Care" un dueño que busca
> en la tienda ve las dos y se baja la equivocada — *"Care" le suena a
> cuidar a su mascota*. **El prestador no busca la app: se la decimos
> nosotros** (§2.1–2.2, proceso de selección y momento fundacional). El
> cliente sí busca. **El nombre optimiza contra la confusión del
> cliente; el alma vive adentro.** Costo asumido: es más frío que la
> sobriedad de este documento, y en inglés hay que localizar a
> "Business".
>
> **El alma descrita en este documento se ratifica intacta**, como ya se
> ratificó en S42. Lo que cambia es quién más entra por la misma puerta.
>
> 🔴 **REGLA DURA DEL RENOMBRE (D-752): cambia el nombre visible y la
> ficha de tienda. JAMÁS el identificador del bundle** — si se toca, es
> una app nueva y se pierden las instalaciones. **Se verifica en el repo
> antes de tocar nada; no se asume.**
```

---

## 3 · `MODELO_FINANCIERO.md` — §8.10 y D-750

### 3.1 Dónde va

**Debajo de la ACOTACIÓN S94-B que ya vive en §8.10**, sin borrarla: se
le agrega un párrafo. La acotación de S94-B sigue siendo correcta —
cambia una de sus premisas, no su conclusión.

### 3.2 Texto literal a insertar

```markdown
> **➕ ENMIENDA S95 (11-ago-2026) — LA ACOTACIÓN DE S94-B SE MANTIENE;
> UNA DE SUS PREMISAS CAMBIA.**
>
> S94-B acotó §8.10 porque en Forma B hay un solo vendedor y él factura:
> **eso no cambió y sigue vigente.** Lo que cambió es que **el motor de
> comercio dejó de ser VTEX** (`MODELO_DESPENSA` v2.0 §3). Consecuencias
> sobre esta sección:
>
> - **Donde §8.10 dice "VTEX webhook desglosa por vendor", léase "el
>   motor de pedidos propio desglosa por vendedor".** El escenario
>   multi-vendedor futuro sigue siendo válido palabra por palabra: lo
>   que cambia es qué sistema lo ejecuta.
> - **Desaparece el take rate de 2,50% de la aritmética del vendedor.**
>   Sobre una venta de USD 100 + IVA, el vendedor pasa de quedarse ~$78
>   a **~$81 con crédito** y de ~$82 a **~$85 con débito**. La tabla
>   completa vive en `MODELO_DESPENSA` §2.3 — **fuente única, no se
>   duplica acá.**
> - **La despensa deja de tener costo fijo de plataforma propio.** El
>   punto de equilibrio de ~USD 50.000 de GMV mensual **deja de ser
>   condición estructural del frente**; los USD 500/mes de VTEX pasan a
>   ser costo heredado con vencimiento (`MODELO_DESPENSA` §13).
>
> **D-750 sigue viva y se simplifica: con Forma B la despensa entra al
> P&L como FEE, no como GMV con margen** — y ahora el fee es limpio,
> sin take rate de terceros restándose antes. **Es línea propia del
> modelo y todavía no está modelada.**
```

---

## 4 · `CLAUDE.md` — backlog canónico

### 4.1 Cambios de estado sobre deuda existente

| # | Acción |
|---|---|
| **D-746** | ☠️ **CERRAR como MUERTA.** Motivo: *"limpieza de los 4 objetos de fábrica de VTEX — sin objeto tras la decisión de S95 (motor propio)"* |
| **D-747** | **ACOTAR a tres preguntas**: (1) qué se factura desde febrero si la cuenta nunca estuvo en producción · (2) si existe un "Monto Terminación" definido · (3) la nueva D-751. **Mueren**: cláusula 14.7 / "Powered by VTEX" (y con ella el choque contra `MODELO_PRESENCIA`, que dejaba pantallas sin poder cerrarse), cambio de moneda y su costo, ratificación de política comercial y ambiente adicional |
| **D-743** | **Texto listo** en este acta §1. Pasa a "pendiente de depósito", no de redacción |
| **D-748** | **Sin cambio.** Es tabla nuestra: la decisión de S95 no la toca y sigue siendo plata viva |
| **D-749** | **Sin cambio.** Se limpian o se marcan antes del primer pedido real |
| **D-750** | **Sin cambio de estado; se simplifica** (ver §3.2 de este acta) |

### 4.2 Deuda nueva — alta con la forma de la regla 66

```markdown
- **D-751 — ¿Vender fuera del OMS de VTEX con el contrato vivo activa
  6.1.7.1?** Descripción: el MSA castiga cobrar producto fuera de su OMS
  con 6× la última facturación mensual más terminación unilateral. El
  contrato corre hasta ~27-feb-2027; la despensa propia vende fuera del
  OMS desde el día uno. Origen: S95. Prioridad: 🔴 **BLOQUEANTE.**
  Criterio de disparo: **ninguna venta real de la despensa ocurre antes
  de tener la respuesta por escrito.** Dueño: founder / asesoría legal.

- **D-752 — Renombre de la app a `e-PetPlace Negocios`.** Descripción:
  cambia el nombre visible y la ficha de tienda; **jamás el
  identificador del bundle** (si se toca, es una app nueva y se pierden
  las instalaciones). Verificar el identificador en el repo **antes** de
  tocar nada. Origen: S95. Prioridad: 🟡 ALTA. Criterio de disparo:
  **antes de la primera instalación real** — la ventana se cierra sola.

- **D-753 — El evento declara cómo se capturó (tecleado / dictado /
  extraído por IA).** Descripción: `procedencia` hoy responde QUIÉN
  aporta, no CÓMO se capturó. El dictado clínico ya existe y no lo
  declara. Origen: S95. Prioridad: 🟢 MEDIA. Criterio de disparo: **la
  primera migración que toque `eventos_mascota`** — hoy es una columna,
  con volumen es un backfill.

- **D-754 — Criterio de flete v1.** Descripción: candidato escrito
  (tarifa plana o gratis sobre un mínimo, definida por el vendedor;
  cálculo por zona y peso a v2), **sin firmar y sin dato**. Es el mayor
  costo escondido de la decisión de S95. Origen: S95. Prioridad: 🔴
  ALTA. Criterio de disparo: la llamada con el vendedor real (D-745).

- **D-755 — Panel operativo del vendedor como ítem propio del corte del
  15-sep.** Descripción: no estaba en el alcance v1 de S94. Mínimo
  honesto para octubre: lista de pedidos con dos botones (preparado /
  despachado) + ajuste de stock. Todo lo demás es candidato de recorte.
  Origen: S95. Prioridad: 🟡 ALTA. Criterio de disparo: 15-sep-2026.

- **D-756 — Aviso de no renovación de VTEX.** Descripción: el MSA §10.1
  pide 90 días y el Anexo dice 60; se toma el plazo largo. Sin aviso,
  renovación automática por 12 meses el ~27-feb-2027. Origen: S95.
  Prioridad: 🔴 ALTA (fecha dura). Criterio de disparo: **fin de
  noviembre de 2026.**
```

### 4.3 Lección nueva

```markdown
- **L-NNN (siguiente libre) — UNA DECISIÓN DE COMPRA SE AUDITA CONTRA
  SUS RAZONES DE ENTRADA, NO CONTRA SU COSTO.** *(S95.)* VTEX entró por
  cuatro razones: no sabíamos construir, escalabilidad, seguridad, y
  performance sin pagar el precio de escalar. **Auditadas una por una en
  S95, las cuatro habían caducado o no aplicaban al caso** — y ninguna
  auditoría anterior las había mirado, porque la conversación siempre
  fue sobre el gasto. **Comprar plataforma cuando no sabés construir es
  prudencia; conservarla cuando ya sabés es inercia.** El disparador
  correcto de la revisión no es el precio: es preguntar si la razón por
  la que entró sigue siendo cierta.
```

---

## 5 · LO QUE ESTE ACTA **NO** HACE

1. **No autoriza construir.** El censo del subsistema de comercio vivo
   (B0.5) sigue siendo precondición de la primera migración. *Crear una
   tabla al lado de una que ya existe sigue siendo el peor resultado
   posible.*
2. **No firma el flete.** El criterio de `MODELO_DESPENSA` §11.2 es
   candidato, y sin la llamada al vendedor no se firma (D-754).
3. **No redacta `PORTAL_SELLER.md`.** Solo cambia su superficie. Su
   disparo sigue siendo D-745.
4. **No decide qué entra al recorte del 15 de septiembre.** Ese día se
   firma con ritmo medido, no con intuición.
5. **No re-mide el ambiente de VTEX.** Todo lo heredado de S94-M1/M2
   está marcado como heredado en la v2.0. Regla R5: lo que no está
   medido no se afirma.
