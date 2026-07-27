# LAS CANDIDATAS DE LECCIÓN — inventario para la firma del founder (S77)

> **NUEVE candidatas.** La novena (L-169) se depositó en S77 con su texto: estuvo nombrada en el canon sin existir — ver su nota de procedencia.

> **NINGUNA ESTÁ FIRMADA. La firma es del founder.** Este documento no decide:
> junta lo que hoy vive disperso entre la letra, las deudas y los cierres de
> S75/S76/S77, con **su origen y su costo medido**, para que se puedan firmar
> o cerrar de una sentada.
>
> Criterio de inclusión: **solo lo que tiene fuente localizable**. Si algo se
> nombró como candidata y no está escrito en ningún lado, aparece abajo en
> "el hueco", no en la lista.

---

## Las nueve

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

### 9 · L-169 — ENTRE DOS CURAS EQUIVALENTES, GANA LA QUE NO DEPENDE DE QUE EL CENSO ESTÉ COMPLETO
**Origen:** S77, el piso `RESTRICTIVE` de INSERT en `prestadores` (dentro de D-532).
**Costo medido de la alternativa:** el censo declaró **DOS** policies de INSERT y eran **CUATRO** — las dos `FOR ALL` también son puerta, y las permisivas se combinan en OR. **Endurecer solo las dos `FOR INSERT`, que es lo que la mesa pidió, habría dejado `prestador_own_profile` abierta: una fuga viva con el cinturón en verde.** La forma `RESTRICTIVE` cerró sobre las cuatro **sin que nadie tuviera que saber cuántas eran** — se combina con AND sobre el OR de todas las permisivas, presentes y futuras.
**La regla, y por qué no es lo mismo que "hacé bien el censo":** los censos van a volver a salir cortos (esta sesión lo probó **seis veces**). Cuando existe una forma cuya corrección **no depende de haber enumerado bien**, esa gana — aunque la otra parezca más quirúrgica.
**Hermana de D-495**, donde el cinturón in-migración atrapó 10 policies que el censo no había visto.
**Estado:** viva, sin firma.

> **NOTA DE PROCEDENCIA, y es parte de la lección:** este número estuvo **NOMBRADO en el canon durante toda S77 sin existir**. La mesa lo declaró depositado en la letra y **la edición nunca se hizo** — grep en `docs/` y en `CLAUDE.md` devolvía una sola ocurrencia: la del índice que lo citaba. **Es el mismo patrón que S74 registró con L-165** (una ley ordenada como firmada y jamás escrita). Su texto se deposita acá, en S77, con esta nota puesta: **un número reservado no es una lección; una lección es un texto que alguien puede leer.**

---

## Nota sobre el conteo

**Son NUEVE, y la novena nació acá.** El inventario abrió con ocho porque **L-169 no existía**: el canon la nombraba y ninguna edición la había escrito. Su texto se depositó en S77 (ver arriba), con su nota de procedencia — que es, ella misma, material de la lección.

Si alguna otra candidata quedó fuera, es porque no encontré su fuente. **Pasame el literal y entra**: el criterio de este documento es que nada figure sin dónde leerlo.
