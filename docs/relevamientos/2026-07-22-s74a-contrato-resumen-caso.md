# S74-A · T4 — El contrato del `resumen` del lector de caso (declarado ANTES de la firma)

> **Hallazgo previo que cambia el encuadre:** `obtener_eventos_caso` **NO
> EXISTE** — ni en la DB (`proname ILIKE '%eventos_caso%'` → 0) ni en el
> árbol commiteado (0 hits TS). El contrato con `resumen` vive en el WIP
> de B (su boceto M2 lo declaró; la vara de A ya marcó "`resumen` sin
> columna fuente"). **Esta declaración es la precondición de esa firma**
> — B construye contra esto, no al revés. Pase por mano del founder
> (L-152).

## 1 · Los hechos que fundan el contrato (DB viva, literal)

- `eventos_mascota` NO tiene columna `resumen`; trae `tipo` + `datos`
  (jsonb, default `{}`).
- **`datos` es un espejo PARCIAL y desigual por tipo** — probado: 4 de 68
  `cita_servicio` traen `{}` vacío; la HC duplica `diagnostico_principal`
  en `datos` pero la fuente rica es la tipada. **`datos` queda PROHIBIDO
  como fuente de `resumen`.**
- La fuente rica es SIEMPRE la tabla tipada (vía `evento_id`/`cita_id`) —
  es el patrón del único precedente vivo de derivación:
  `obtener_parte_consulta` compone desde las tipadas por `cita_id`.
- Los tipos que HOY pueden anclar a un caso (columna `caso_clinico_id` en
  la tipada, o `caso_id`): `historia_clinica_registrada` ·
  `medicacion_prescrita` · `examen_diagnostico` · `caso_clinico_abierto`
  (+ `caso_clinico_cerrado`/`_transferido` con 0 filas) + las citas por el
  puente caso⇄cita.

## 2 · LA DERIVACIÓN DECLARADA (por tipo de evento)

**Regla madre:** `resumen` es el **DATO que un humano escribió**, leído de
la TIPADA. No es una frase: **la VOZ la pone el diccionario de la pantalla
(Ley 3)** — el lector jamás compone prosa ("Se prescribió X…" es ilegal en
el motor. El lector entrega `tipo` + `resumen` crudo; la pantalla viste).
Donde no hay dato escrito, **`resumen = null` honesto — jamás relleno
plausible (L-139)**; la pantalla degrada con la voz del tipo.

| tipo | fuente del `resumen` | garantía |
|---|---|---|
| `historia_clinica_registrada` | `evento_historia_clinica_registrada.diagnostico_principal` | **siempre** (NOT NULL en la tipada) |
| `medicacion_prescrita` | `evento_medicacion_prescrita.nombre_medicamento` | **siempre** (NOT NULL; un evento POR medicamento — precisión 2 S70) |
| `examen_diagnostico` | `evento_examen_diagnostico.tipo_examen` (el `estado` viaja en campo propio si el contrato lo pide — no concatenado) | **siempre** (NOT NULL) |
| `caso_clinico_abierto` | `evento_caso_clinico_abierto.condicion` | **nullable → null honesto** (la voz del tipo la pone el diccionario) |
| `caso_clinico_cerrado` / `_transferido` | 0 filas hoy, sin productor ejercido | **null honesto v1**; la fuente se declara cuando el productor exista (L-141: no se inventa contra tabla vacía) |
| `cita_servicio` (anclada al caso) | la descripción D-474 del presupuesto si la cita nació de uno (frontera `_presupuesto-descripcion`, la única voz legal de un procedimiento); sin presupuesto → **null** (el `tipo_servicio` va en campo propio y la pantalla lo viste por `KEY_VOZ_SERVICIO` — con su asimetría §10ter intacta) | condicional |
| cualquier otro tipo | — | **null honesto** |

## 3 · Cláusulas del contrato (exigibles en la vara del lector)

1. `resumen` **nunca** se deriva de `datos` (jsonb) — solo de columnas de
   tipada. Si mañana un tipo nuevo quiere resumen, declara su columna
   fuente ANTES (enmienda a esta tabla, no improvisación en el body).
2. `resumen = null` es un valor del contrato, no un error — el reader
   devuelve siempre las mismas claves con null sin dato (L-124).
3. El lector no traduce ni compone: cero literales de voz en SQL (Ley 3;
   el diccionario vive en la pantalla).
4. La vara del lector (M2) verifica esta tabla CONTRA el body con
   `pg_get_functiondef` — fila por fila, fuente por fuente (L-158).
