# S79-A · LA REFORMA DEL PRECIO DEL PLAN — mediciones y TAMAÑO (27 Jul 2026)

**FRENO EJECUTADO: cero letra, cero DDL.** Este reporte es el tamaño en
la mano; el diseño corre cuando la mesa lo apruebe.

---

## 1. ¿SE COBRA ALGO HOY DE VERDAD? **NO — LA VENTANA ESTÁ ABIERTA.**

El camino del dinero del plan, punta a punta (bodies ENTEROS leídos:
`contratar_plan_paseo` · `_generar_citas_plan` · `saltar_cita_plan` ·
fragmento de `cerrar_y_renovar_planes`):

- `contratar_plan_paseo` escribe `suscripciones_servicio` con
  `precio_mensual`/`precio_pagado` y un `pago_metadata` que dice
  **`pago_simulado: true`** — su propio comentario: *"UN cobro simulado
  DECLARADO por el período (jamás toca el ledger)"*. **Cero pasarela**
  (`kushki_subscription_id` NULL en la única suscripción viva), cero
  `eventos_economicos` al contratar (variante b intacta: el devengo nace
  cita por cita al CERRAR, sobre `precio_unitario_efectivo`).
- La cita del plan SÍ snapshotea precio: `_generar_citas_plan` estampa
  `precio = v_susc.precio_unitario_efectivo` y nace
  `'confirmada'/'pagada'` con `pago_simulado` en metadata.
- Datos vivos: **1 suscripción** (demo: $138/mes, unitario $6, L-V
  semanal) y **27 citas de plan**.

⇒ Cambiar la semántica del precio AHORA es barato: no hay un solo cobro
real que re-interpretar. La tabla `suscripciones_servicio` **ya tiene
`precio_mensual`** — el modelo de datos del período existe; lo que está
del lado equivocado es el CONFIGURADOR del prestador.

## 2. ¿EXISTE FRECUENCIA? **SÍ, completa.**

`suscripciones_servicio` porta `dias_semana[]` (CHECK L-V dura),
`frecuencia` (`semanal|quincenal|mensual`), `hora`, `duracion_minutos`.
`_generar_citas_plan` itera `_fechas_periodo_plan(inicio, dias,
frecuencia)` sobre un período de 1 mes, valida ventana+persona por fecha
(atómico: una fecha sin cupo rebota TODO), y N sale de ahí. **Hoy:
`total = COALESCE(precio_plan, precio) × N` y `unitario = total/N`** —
con ajuste si el filtro de pasado descartó fechas. La reforma invierte
la flecha: `total = precio_mensual_plan` (fijo) y el unitario pasa a ser
DERIVADO (`total/N`) solo para el devengo.

## 3. CENSO COMPLETO de lectores de `precio_plan`

**Columna:** solo `prestador_servicios.precio_plan` (+ su CHECK
`chk_precio_plan_valido`).

**DB — 3 funciones (censo prosrc, bodies confirmados):**
| Función | Qué hace con él | Si el valor pasara a mensual SIN reforma |
|---|---|---|
| `contratar_plan_paseo` | `COALESCE(precio_plan, precio) × N` | **cobraría N meses por un mes** |
| `cerrar_y_renovar_planes` | mismo COALESCE al renovar (fragmento literal leído) | ídem, en cada renovación |
| `obtener_paseadores_disponibles` | lo DEVUELVE en su RETURNS (D-375, display) | la Hoja del plan mostraría un mes como precio de salida |

**⚠️ CORRECCIÓN AL MANDATO, medida: es UNA lectora de oferta, no
cuatro.** Los RETURNS de las cuatro se leyeron verbatim HOY (tanda
T4.6): solo `obtener_paseadores_disponibles` porta `precio_plan` — el
plan es del paseo, único oficio con recurrencia; grooming/adiestramiento
/vet jamás lo tuvieron. **La tanda ACHICA: un solo DROP+CREATE de
RETURNS, no cuatro** (sería la CUARTA recreación de esa función hoy —
razón de más para hacerla una vez y bien).

**Árbol:** `plan-hoja.tsx` (cliente — `precio_plan ?? precio` como
precio POR SALIDA) · `paseo/taller.tsx` + `index.tsx` (prestador, B — el
campo del configurador con su ayuda "Rige desde la próxima renovación") ·
`agendamiento.ts` (shape + guard que EXIGE la clave) ·
`configuracionPaseo.ts` (whitelist + `precio_plan_invalido`).

**La evidencia que justifica la reforma sola (datos vivos):** las 2
ofertas con `precio_plan` valen `{precio: 6, plan: 10}` y **`{precio:
10, plan: 60}`** — $60 POR SALIDA sobre un paseo de $10 no es un
descuento por volumen: **es un precio mensual tipeado en un campo
por-salida**. La confusión semántica que la decisión mata ya ocurrió.

## 4. `precio_paquete`: POR SALIDA, CORRECTO, INTACTO

`comprar_paquete_salidas` lee `ps.precio_paquete` como precio de la
SALIDA dentro del paquete (fragmento literal; Decisión T: N salidas,
FIFO a precio de origen). Su CHECK propio. **La reforma no lo toca** —
paquete = bolsa de salidas prepagas; plan = suscripción del período. Dos
productos, dos precios, y ahora con semánticas que no se pisan.

## 5. ⚠️ EL ÚNICO RIESGO REAL DE LA TANDA: la compat con el OTA VIVO

El wrapper vivo (`agendamiento.ts`, en el bundle publicado) **valida el
shape y exige la clave `precio_plan`** en cada fila de
`obtener_paseadores_disponibles` (guard: `p.precio_plan !== null &&
typeof p.precio_plan !== 'number'` ⇒ `datos_inconsistentes`). Jubilar la
columna del RETURNS **rompería el QUIÉN del paseo en todo bundle
publicado**. Propuesta para la letra (transición honesta, no
reinterpretación): el RETURNS nuevo **conserva la clave `precio_plan`
emitiendo SIEMPRE NULL** (el precio-por-salida-de-plan ya no existe — y
NULL es exactamente "sin plan por salida", que el bundle viejo muestra
como "sin plan": degradación honesta, cero COALESCE peligroso) **y suma
`precio_mensual_plan`**. La clave vieja muere del RETURNS cuando el
canon declare jubilado el último bundle pre-reforma.

## 6. Lo que la medición ya deja resuelto para la letra

- **`saltar_cita_plan` YA no devuelve plata** (body entero): mueve
  fecha/hora dentro del MISMO período, P14(c) <24h se pierde, cero
  contacto con precios. La letra lo DECLARA explícito, cero código.
- **El devengo variante (b) queda mecánicamente INTACTO**: el unitario
  efectivo pasa a `precio_mensual_plan / N generadas` y el cierre de
  cada cita devenga igual que hoy. Lo que cambia es la cara al CLIENTE:
  paga el mes, use 5 o use 20.
- **La cita de plan ya se distingue de la suelta**:
  `suscripcion_servicio_id NOT NULL` + `metadata.origen='plan'` — la
  letra consagra eso como el discriminador de "no cobrable
  individualmente".
- **Los 2 valores vivos de `precio_plan` NO se traducen** (propuesta):
  nadie puede saber qué quiso decir el 60; `precio_mensual_plan` nace
  NULL y el prestador lo declara (la misma ley del radio: jamás un
  default, jamás una traducción inventada — L-139). La suscripción viva
  ($138) conserva su contrato: los períodos en curso no cambian (la
  ayuda del taller ya lo promete).

## EL TAMAÑO

**UNA tanda, cabe en S79.** Piezas: la LETRA (`MODELO_PASEO` §6 +
enmienda a Decisión S del FINANCIERO + la nota P14) · UNA migración
(nace `precio_mensual_plan` + CHECK · `contratar_plan_paseo` y
`cerrar_y_renovar_planes` cambian su aritmética · `obtener_paseadores_
disponibles` DROP+CREATE con el RETURNS de transición — la única, no
cuatro · `precio_plan` jubilada del camino de cobro con censo y reversa)
· wrapper + `plan-hoja` del cliente (precio del MES) · **pedido a B**:
el campo del taller pasa a "precio mensual del plan" con su ayuda nueva
· fixture in-txn (contratar con mensual fijo · renovar · el RETURNS de
transición · el paquete intacto). **El COBRO real (prorrateos, ciclo,
reintentos, Kushki) es del ARCO DE PAGOS** — se declara con disparo, no
se construye acá.

**FRENO.** La letra y la migración esperan el OK de la mesa sobre este
tamaño.
