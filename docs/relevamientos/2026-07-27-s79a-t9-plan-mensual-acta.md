# S79-A · LA REFORMA DEL PRECIO DEL PLAN — EJECUTADA (acta, 27 Jul 2026)

OK del founder al tamaño + DOS enmiendas de mesa, las dos adentro.
Letra + migración en UNA tanda, como se ordenó. 76(f2) rigió · CERO
push · 76(g) declarada (NO RIGE — DDL aditivo + funciones; cero
backfill; los 2 valores vivos de `precio_plan` NO tocados) · REVERSA
escrita ANTES de aplicar — **con los bodies vivos pre-reforma embebidos
verbatim** (única fuente: no viven en ninguna migración individual;
ensamblada por copia de los dumps, cero re-tipeo).

## LA LETRA (depositada en los DOS maestros)

- **`MODELO_PASEO` §6.2 — ENMIENDA S79** (7 puntos): el precio es del
  PERÍODO · sin mensual declarado no se contrata (`plan_no_ofrecido`;
  murió por omisión el COALESCE — la enmienda ① con su porqué D-375
  al revés: emitir NULL al bundle viejo dice "plan sin descuento", y lo
  que vuelve honesta la transición es LA GUARDA detrás, no la clave) ·
  la cita de plan NO cobrable individualmente (discriminador
  `suscripcion_servicio_id NOT NULL`) · **unitario = mensual/N DERIVADO
  y NO ESTABLE entre períodos** (enmienda ②: N varía con el mes;
  prohibido asumirlo fijo en reportes; N=0 guarded) · **el batch
  SALTEA** (handler por fila medido: vence honesto + notificación; el
  aviso de 72 h ya avisa ANTES cuando no va a poder renovar) ·
  `saltar_cita_plan` = mover agenda, jamás plata (body medido) · **EL
  CORTE**: modelo + configurador acá; ciclo/prorrateo/reintentos/
  pasarela = ARCO DE PAGOS (disparo: Kushki real; la infra
  `kushki_subscription_id`/`proximo_cobro_en` ya espera). §6.4: el
  sugerido del plan se re-expresa mensual (fórmula de la superficie);
  el del paquete (80% por salida) intacto.
- **`MODELO_FINANCIERO` Decisión S — ENMIENDA S79**: la BASE pasa de
  `por-salida × N` a `precio_mensual_plan` FIJO; variante (b) intacta
  con unitario derivado; la no-estabilidad DECLARADA.

## LA MIGRACIÓN (`20260727230000`, APLICADA)

1. **Nace `prestador_servicios.precio_mensual_plan`** (numeric NULL,
   CHECK > 0, COMMENT). **`precio_plan` JUBILADA** con COMMENT de
   lápida; sus 2 valores vivos (el 10 y el 60-sobre-10 que probó la
   confusión) NO traducidos; DROP futuro al retirar el último bundle.
2. **`contratar_plan_paseo`**: guarda ① (`plan_no_ofrecido`) + EL MES
   ES EL MES (total fijo; si el filtro de pasado descarta fechas, el
   total NO cambia — solo el unitario derivado se recalcula).
3. **`cerrar_y_renovar_planes`**: mismo modelo al renovar; el aviso 72 h
   declara el MENSUAL (sin ×N) y, sin mensual en la oferta, avisa que
   NO va a renovarse; la renovación sin mensual cae al handler por fila.
4. **La lectora** (única con precio_plan — la corrección medida del
   reporte de tamaño): DROP+CREATE misma firma, RETURNS de TRANSICIÓN
   — `precio_plan` SIEMPRE NULL (compat) + `precio_mensual_plan`. L-119
   (sobrecargas=1) + L-140 (anon=0) verificados en la migración; el AND
   geográfico de la firma viaja intacto.
5. Verificación imperativa extra: **cero funciones leen
   `ps.precio_plan`** (la jubilación probada mecánicamente) ·
   `chk_precio_paquete_valido` presente (paquete INTACTO).

## EL FIXTURE — 5/5 con ROLLBACK y residuo 0

| T | Qué probó | Resultado |
|---|---|---|
| T1 | contratar sin mensual | **rebota `plan_no_ofrecido`** (el COALESCE no revivió) |
| T2 | mes fijo | total=120.00 con 5 citas · unitario=24.00 derivado · citas snapshot ✓ |
| T3 | la lectora | `precio_plan=NULL` (compat) · `mensual=120` ✓ |
| T4 | renovación | total_nuevo=150.00 · corrida 1r/0v/0e ✓ |
| T5 | el batch saltea | ok=true · la fila vence honesta · `renovacion_fallida='plan_no_ofrecido'` registrado ✓ |

Residuo: 1 suscripción (la demo intacta, activa/$138 — su período en
curso no cambia, como promete la ayuda del taller), 0 mensuales vivos,
`precio_plan` [10, 60] sin traducir. Dos fallas de ESCENARIO del fixture
(colisión de nombre `v`, período fin<inicio) curadas en el fixture, no
en el motor — la lección de la memoria operativa aplicada.

## LOS CONSUMIDORES (typecheck api · cliente · prestador VERDES; gen:types ×1)

- **`agendamiento.ts`**: `PaseadorDisponible` gana `precio_mensual_plan`;
  `precio_plan` queda con JSDoc de JUBILADA (no consumir en código
  nuevo).
- **`configuracionPaseo.ts`**: lectura+escritura+validación de
  `precioMensualPlan` (`precio_mensual_plan_invalido`); `precioPlan` se
  conserva SOLO mientras B migra el taller (JSDoc: escribirla ya no
  afecta ningún cobro).
- **`plan-hoja.tsx` (cliente)**: el MES preside — "Precio del mes"
  fijo en mono + salidas estimadas informativas + la voz que dice la
  decisión: *"Pagas el mes completo. Las salidas que no uses no se
  descuentan."* Murió el total estimado ×N (keys viejas retiradas del
  diccionario, Ley 37).
- **`disponibles.tsx` (cliente)**: la puerta Ley 23 — con
  `precio_mensual_plan` NULL el chip del plan NO abre la Hoja; la voz
  da el camino (*"…puedes reservar suelto o con paquete"*).

## PEDIDO A B (registrado acá; su territorio)

El campo del taller de paseo pasa de "precio del plan (por salida)" a
**"precio mensual del plan"** sobre `precioMensualPlan` del wrapper (ya
publicado), con su ayuda nueva y el sugerido re-expresado en mensual
(§6.4 enmendado — la fórmula es de la superficie). Al migrar, avisar
para retirar `precioPlan` del wrapper (deprecada, escribirla no cobra).

## LO QUE QUEDA (sin maquillaje)

- El gate en dispositivo del founder sobre la Hoja del plan nueva y el
  rebote del chip (lote de strings S79 incluido).
- La clave `precio_plan` del RETURNS y la columna: mueren cuando el
  canon jubile el último bundle pre-reforma (declarado en letra).
- El cobro real del ciclo mensual: ARCO DE PAGOS, con su disparo.
