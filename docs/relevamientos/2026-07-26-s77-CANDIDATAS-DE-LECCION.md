# LAS CANDIDATAS DE LECCIÓN — inventario para la firma del founder (S77)

> **NINGUNA ESTÁ FIRMADA. La firma es del founder.** Este documento no decide:
> junta lo que hoy vive disperso entre la letra, las deudas y los cierres de
> S75/S76/S77, con **su origen y su costo medido**, para que se puedan firmar
> o cerrar de una sentada.
>
> Criterio de inclusión: **solo lo que tiene fuente localizable**. Si algo se
> nombró como candidata y no está escrito en ningún lado, aparece abajo en
> "el hueco", no en la lista.

---

## Las ocho con fuente

### 1 · (d) — EL ORDEN NOMBRA EL ARTEFACTO QUE ABRE, JAMÁS EL ARCHIVO DONDE SE LO ESPERA
**Origen:** S75 (canon, línea 44). **Sin firma desde entonces.**
**Costo medido:** el brief de S75 ordenó R1 primero e **invirtió el orden que la propia sesión había declarado CONDICIÓN**. El interruptor se apretó en `3591db2` sin que nadie llamara a abrir la puerta, y **B3 resultó un no-op**. Daño en producción: **cero** (0 empleados activos no-titulares).
**Estado:** viva. Sus hermanas **(e)** y **(f)** quedaron **absorbidas por L-166**; **(g)** se firmó como **L-166** y **(h)** como **L-167**.

### 2 · UNA MIGRACIÓN NO ESTÁ COMPLETA HASTA QUE CORRE `gen:types`
**Origen:** S76 (candidata declarada al cierre; **no disparó** porque B regeneró completo en `7d3eb78`).
**Costo medido:** ninguno todavía — **es la única de esta lista que nunca cobró**. En S77 volvió a no cobrar: las dos migraciones corrieron `gen:types` en el mismo turno.
**Estado:** viva, sin evidencia de daño. Candidata a **cerrarse por innecesaria** tanto como a firmarse.

### 3 · L-168 — UNA LETRA NO AFIRMA EN SU CUERPO LO QUE ELLA MISMA LISTA COMO NO LEÍDO
**Origen:** S77, `LETRA_EDICION_VINCULO_S77` §10bis (nace del proceso de la propia letra).
**Costo medido:** la letra se equivocó **DOS VECES de la misma forma**, y las dos las corrigió la fuente, no la mesa.
**Estado:** viva.

### 4 · L-170 — UN CENSO POR `pg_get_functiondef` LEE LOS COMENTARIOS COMO CÓDIGO
**Origen:** S77, D-532 (nota de método).
**Costo medido:** la migración de D-532 **abortó contra sí misma** en su primer intento — el comentario que explicaba el flip reproducía el literal que el assert perseguía. **Evidencia del par:** el helper hermano, cuya nota decía `(…)` con puntos suspensivos, **no disparó**. Un carácter entre abortar y pasar.
**Regla:** un comentario jamás reproduce el literal que el censo persigue; **si el censo dispara sobre un comentario, se corrige el comentario, nunca el regex** (relajarlo pierde la garantía).

### 5 · EL ENCLÍTICO: TODO CENSO DE VOZ BARRE ESA CLASE APARTE
**Origen:** S77, D-533 (enmienda).
**Costo medido:** el censo declaró **7 strings, eran 8**. La octava era `Pedilo`, y se escapó por una razón estructural: **con clítico enclítico el voseo PIERDE la tilde** (`pedí`+`lo` → `pedilo`) **mientras el tuteo la GANA** (`pídelo`) — la regla que hacía visible al voseo **se invierte** exactamente en esa clase. No fue descuido: fue un agujero del instrumento.
**Confirmación independiente:** en `apps/cliente` apareció **`Pedila`** — el mismo verbo, la misma clase, la otra app.

### 6 · TRES CLASES × CUATRO UBICACIONES (el lint de voz)
**Origen:** S77, D-481 (2ª enmienda).
**Costo medido:** **cinco censos seguidos salieron cortos** — D-523 (declaraba 4, eran 11) · D-533 (7 → 8) · D-534 (el cliente, que ningún censo había mirado) · y `packages/api`, donde el problema resultó ser mayor que el voseo (**D-539: no hay capa de idioma**).
**Regla:** las tres clases (tilde final *case-insensitive* · vos conjugado · enclítico sin tilde) se corren sobre las cuatro ubicaciones (`apps/*/i18n` · `packages/api` · `packages/ui/i18n` · hardcodeos en `.tsx`), **o vuelve a dar corto**.

### 7 · UN CENSO DE PERMISOS SE HACE POR TABLA Y POR COMANDO
**Origen:** S77, D-481 (3ª enmienda) — el mismo error de alcance, ahora en RLS.
**Costo medido, y es el más caro de la lista:** el censo preguntó *"quién cita la tabla de empleados"* y midió **TRES** policies; sobre `evento_cita_servicio` hay **CINCO SELECT**. La cuarta (`cita_select_por_acceso`, que concede por MASCOTA) era la que importaba. **Consecuencia: una migración firmada llevaba una policy con delta 0**, y **la premisa falsa llegó a estar en negrita y firmada** en §11.1 de la letra hasta que el discriminador la tumbó.
**Regla:** `pg_policies` completo por tabla y por comando, **jamás "quién menciona X"**.

### 8 · ANTES DE PRESUPUESTAR UN ARCO, SE LEEN LAS POLICIES
**Origen:** S77, D-540 (enmienda L23).
**Costo medido — al revés que las demás: esta AHORRÓ trabajo, dos veces.** ① `prestador_empleado_servicios`: la policy DELETE existía desde que nació la tabla y `packages/api` nunca la expuso — **quitar un chip parecía motor y era un wrapper de 15 líneas**. ② `prestador_horarios`: `prestador_horarios_own` ya deja al titular escribir las franjas de su gente — **D-540 pasó de "motor" a wrapper + superficie**. Y una tercera aparición el mismo día: el brazo del UPDATE **nace abierto y sin puerta**.
**Regla:** la casa se dio por bloqueada donde el motor ya estaba abierto, y las dos veces **el costo real fue una fracción del estimado**.

---

## El hueco: **L-169 NO EXISTE**

`CLAUDE.md` viene arrastrando *"Candidatas de lección sin firma: L-168 · L-169 · L-170 (viven en la letra y en D-532)"*. **L-168 vive en la letra §10bis y L-170 en D-532 — pero L-169 no está definida en ningún lado**: grep en `docs/` y en el canon devuelve **una sola ocurrencia, la del propio índice que la nombra**.

Es el mismo patrón que S74 registró como error de mesa (**L-165 ordenada como firmada y nunca depositada**): *un número reservado sin letra que lo respalde*. **O la letra de L-169 existe en algún reporte que no llegó al repo —y entonces hay que depositarla—, o el número se libera.** No lo decido acá.

**Y por eso el conteo real es OCHO, no nueve.** Si la novena es L-169, su cuerpo hay que escribirlo; si es otra que no encontré, pasame la fuente y entra.
