# S75-A · ACTA DE CIERRE (BORRADOR — el cierre formal espera el gate del founder, L-163)

> **NO es el cierre.** El cierre formal (CLAUDE.md con su commit, L-163) espera
> UN gate en dispositivo: recepción intenta escribir la consulta en el teléfono
> del founder → rebota (la confirmación de D-490 por camino real). Este borrador
> se deposita para que ese cierre sea transcripción, no arqueología. Sin
> maquillar (patrón del acta de B).

## 0. LO QUE S75-A HIZO, EN UNA LÍNEA

Abrió la puerta del arco de equipo (el empleado resuelve su negocio y ATIENDE),
y en el mismo acto **creó el alcance de un agujero clínico que la sesión
después tuvo que cerrar** — con un verde falso en el medio que el founder
atrapó en campo.

## 1. EL ARCO, CON SUS HASHES (20 commits A, cero push)

- **A1 · R1** (`3591db2`) — `obtenerMiPrestador` resuelve por titularidad O
  vínculo activo; C1 consume R1 (L-150). Assert 2 JWT, no-regresión 15 cols.
- **A0 · vocabulario** (`5b950e6` censo · `2a7ecae` CHECK) — `administrador`
  nace aparte, `dueño` reservado al titular. Migración `20260723173914`.
- **A2 · D-490 fase 1** (`a7e4d0b` propuesta · `d4582c1` aplicada) — 15 policies
  RLS; flip certificado ABORTADO por el censo condicionante (→ D-516).
  Migración `20260723173509`.
- **A3 · D-513** (`d208003`) — la premisa del canon CAE contra el literal
  (L-158): la escritura de negocio es titular-only; D-513 no es fuga, es el
  hueco inverso. Re-encuadrada a arco v2, salió de la condición de la puerta.
- **A5 · vara del handshake** (`9ee2a0b`) — APTO con dos enmiendas de dato.
- **canon** (`0471722`, `3e65e3c`) — group prestador corregido, D-512/D-513
  enmendadas, las 3 cosas de A9 que faltaban.
- **A7 · censo R2** (`636af35`) — 6 rompen, clase 1/2, camino; D-517.
- **Ponte al día** (`4b446a6`) — §10ter.1, agendadas colapsadas por servicio.
- **A18/A19 · D-518** (`9f3ee0c`, `4004581`) — la reserva no filtra por
  geografía (4 oficios × 3 pisos); disparo partido, cruce con D-367.
- **paso 5 publish** (`01836c1`, `25f43fb`) — los dos groups; D-519, D-520.
- **A25 · cura** (`e4ab742`) — `obtenerMiEmpleadoId`: el tratante es quien
  atiende, no el titular. La consulta ABRE para el empleado.
- **A29/A30** (`4cad02a`) — D-521/D-522 cruzadas, D-523, candidata (g).
- **A31 · D-490 REABIERTA** (`496f87f`) — el agujero DEFINER.
- **A33 · corrección** (`3121da9`) — D-490 NO verificada, error de mesa.
- **A43 · D-490 fase 2** (`771f3d9`) — gate de rol en los 4 DEFINER. Migración
  `20260724034110`.
- **A45** (`ef57d71`) — D-490 no CERRADA: CURADA Y VERIFICADA POR CAMINO REAL,
  pendiente gate en dispositivo.

**3 migraciones aplicadas:** `20260723173509` · `20260723173914` ·
`20260724034110`. **OTAs (B publicó):** cliente `23c726eb` (Ponte al día) ·
prestador `b00378e0` (cura A25). **CERO push.**

## 2. LOS TRES ERRORES/HALLAZGOS QUE DEFINEN EL ACTA (sin maquillar)

### 2.1 · EL INTERRUPTOR YA ESTABA APRETADO — la inversión del orden
El brief ordenó R1 primero para paralelizar con B. Pero **R1 ES el
interruptor de la puerta** (no `_layout.tsx`): con R1 en HEAD, el guard
`_layout.tsx:78-79` deja pasar a cualquier empleado activo — la puerta la abrió
un commit de WRAPPER (`3591db2`), sin que nadie llamara a abrirla. **Error de
mesa declarado:** la directiva invirtió el orden que la propia sesión declaró
CONDICIÓN. Daño: CERO en producción (0 empleados activos no-titulares; D-490
fase 1 aplicada el mismo día). Lección (d): *el orden en piedra nombra el
ARTEFACTO que abre, jamás el archivo donde se lo espera.*

### 2.2 · A28 — EL VERDE FALSO, atrapado por el founder en campo
La cura A25 abrió la consulta. El assert A28 dio **verde diciendo "D-490
verificada"** — pero probó la POLICY (`user_puede_escribir_clinico`), y la
pantalla escribe por `sedimentar_nota_clinica`, un RPC **DEFINER que salta la
RLS**. El founder reportó en campo que recepción escribía. A31 lo confirmó por
el CAMINO REAL (recepción escribió hc=1). **D-490 se reabrió.** Lección (h): *un
gate se verifica por el CAMINO que usa la pantalla, jamás por la defensa que la
mesa supone.* Hermana de L-114.

### 2.3 · EL INCIDENTE DEL DELETE — con su delta declarado
Un `RAISE EXCEPTION` usado como SEÑAL DE ÉXITO en un fixture que mutaba datos
rompió el control de transacción; su `ROLLBACK` no cubrió un `DELETE` del rol
`profesional` de +9 → se coló a producción. Detectado en los residuos,
restaurado. **Delta honesto:** la fila volvió, su `asignado_en` NO (espejado del
de `recepcion`) — se declara el delta, no se afirma identidad. Lección: *una
señal de éxito jamás se emite con `RAISE` en un fixture que muta datos —
resultado a tabla + SELECT.*

### 2.4 · EL GATE DEL FOUNDER — el rebote que no rebotó porque no se ejecutó
El founder probó la consulta con recepción: entró, tipeó, reportó "puedo
escribir". La mesa preguntó a la DB antes de responder (A47): **cero escritura
nueva** — el founder **no tocó guardar** (`escribir ≠ guardar`; el guard vive en
el RPC, dispara al ENVIAR). El gate nunca se ejecutó; **no hay perforación.**
**Dos hallazgos gratis del uso real:** (a) +9 quedó SOLO recepción — el founder
le quitó `profesional` desde la app y **la revocación PERSISTIÓ** (el toggle de
equipo tiene motor, no es UI muda); (b) por el CAMINO REAL con +9 recepción-pura,
**cero fuga de lectura clínica** — `user_acceso_clinico=false`, todos los readers
en 0: **D-464 se cumple**, el editor abre VACÍO. Lo que quedó es superficie
(D-525): el editor **abre** para recepción (Ley 23) aunque no vea ni escriba
nada. Verbatim del founder: *"la recepción no debería poder ni verlo."*

## 3. D-490 — LAS DOS FASES, EL ESTADO EXACTO

- **Fase 1** (S75-A2, `20260723173509`): 15 policies RLS. Correcta pero
  INSUFICIENTE — la RLS no gobierna los DEFINER.
- **Fase 2** (S75-A43, `20260724034110`): gate de rol en los 4 escritores
  DEFINER (`COALESCE(empleado_tiene_rol(prestador, ['dueño','profesional']),
  false)`). Verificado POR CAMINO REAL (recepción rebota en las 4, el fixture
  DISCRIMINA), A39 antes=después (n=1, DEFINER, search_path, ACL preservados),
  camino de vuelta commiteado.
- **Estado: CURADA Y VERIFICADA POR CAMINO REAL; PENDIENTE GATE EN DISPOSITIVO.**
  Cierra con el rebote en el teléfono del founder. **No se marca CERRADA** (A28
  también dijo "verificada"; la lección (h) prohíbe cerrarla sin el dispositivo).
  **Cuando el founder reporte el rebote, se marca CERRADA con su palabra como
  firma — no antes** (L-163: el dispositivo es la única firma que vale). El gate
  del founder de esta sesión NO ejercitó el guard (solo tipeó, no guardó — §2.4);
  el rebote real está a un intento de distancia.

## 4. DEUDAS NUEVAS S75-A (D-515 → D-525) — el inventario para S76

D-515 (fila dueño redundante ⚪) · D-516 (certificado escribible sin rol 🟠) ·
D-517 (R2 rompe 6 pantallas para el empleado; 2 CLASE 2 a v2 🟠) · D-518 (la
reserva no filtra por geografía, 4 oficios; 🔴 al soft launch por la pata
ciudad) · D-519 (la voz del handshake no nombra negocio no-activo ⚪) · D-520
(marcador updateId vs group del canon 🟠) · D-521 (HOY ofrece lo que el rol no
puede — B18 🟠) · D-522 (motor de agenda ciego al rol 🟠) · D-523 (voseo en
nota-clínica ⚪) · D-524 (mostrador de vacuna = flujo de dos personas, sin
diseñar 🟠) · **D-525 (el editor clínico abre para recepción — Ley 23; incluye
la sub-nota de voz: el rebote dice "Revisá los datos" hasta que
`rol_sin_escritura_clinica` entre a `CODIGOS_SEDIMENTO` — rebotar mintiendo 🟠)**.
Enmendadas: D-367 (sistémica), D-486 (eje legacy con lector vivo), D-512/D-513
(contra el literal), D-490 (dos fases).

## 4bis. EL LOTE DEL FOUNDER QUE NUNCA ENTRÓ A S75 (para S76)

Además de las deudas, la mesa dejó explícito lo que S75 no tocó y S76 hereda:
**el administrador con su MOTOR** (D-513 v2: ampliar la gestión de negocio al
rol, con el nudo de horarios/`empleado_id` + el borde de los dos negocios de R1
— mesa del modelo multi-empleado) · **chips de oficio AL INVITAR** (elegir rol y
chips en el alta) · **el SELECTOR DE DOS** (la superficie de asignar rol) ·
**el LINK para usuario nuevo (D-509)** — invitar por link a quien aún no tiene
cuenta · **Ponte al día a BOCETO** con el plural *"Ver sus citas"* (la
composición que el founder rechazó vuelve a boceto — de la mesa, no rediseño de
A) · **el monograma `[s` / D-505** · **la voz del rebote** (dentro de D-525).

## 5. LAS CANDIDATAS DE REGLA — TODAS PROPUESTA, NINGUNA FIRMADA

De esta sesión: **(e)** la ventana de publish congela bilateralmente, el ancla
se lee al bundlear · **(f)** el publish se reporta group+ancla en el mismo turno
· **(g)** todo dato vivo se lee al momento de usarlo, jamás de un reporte previo
(absorbe (e)(f) y el marcador de D-520) · **(h)** un gate se verifica por el
camino que usa la pantalla, no por la defensa supuesta (hermana de L-114).
De la mesa (arrastre): **(d)** el orden nombra el artefacto que abre · la del
árbol limpio · "declarar un atajo no lo vuelve inocuo". Del acta de B: **"un
mensaje de OTA se escribe con menos, no con más".** **NINGUNA se sube a firmada
sin el founder** (L-141 aplicada a la propia sesión).

## 6. EL FINAL DEL ARCO — EL GATE DEL FOUNDER (A47–A50, `36c0739`)

El founder probó en su teléfono: entró al editor con rol y sin él, **tipeó y NO
tocó guardar** → el gate del RPC nunca se ejecutó (escribir ≠ guardar); no hubo
perforación que buscar. Lo que el gate SÍ probó, con literal:
- **A48 gratis:** +9 quedó SOLO `recepcion` (asignado_en 03:48) — **el toggle de
  revocación de la ventana de equipo PERSISTE** (probado por el uso real del
  founder, no por assert).
- **A49 — cero fuga de lectura:** con recepción-pura, por el camino real:
  `user_acceso_clinico=false`, perfil/HC/casos/stream/medicación = **0**. La RLS
  D-464 se cumple; el editor abre VACÍO.
- **A50 → D-525:** el editor clínico ABRE para recepción (Ley 23 — la puerta
  ofrece lo que va a rechazar). Verbatim founder: *"la recepción no debería
  poder ni verlo."* Cura de superficie (gate de ausencia por rol), S76.
  **Sub-nota de voz, DENTRO de D-525 con su literal:** hasta que
  `rol_sin_escritura_clinica` entre a `CODIGOS_SEDIMENTO`, el rebote dirá
  *"Revisá los datos de la nota"* — **la diferencia entre rebotar y rebotar
  MINTIENDO** (la cláusula viva, versión voz).

**D-490 queda: CURADA Y VERIFICADA POR CAMINO REAL; PENDIENTE GATE EN
DISPOSITIVO.** Si el founder reporta el rebote, se marca CERRADA **con su
palabra como firma** — no antes (la lección (h) sobre la propia deuda).

## 7. EL INVENTARIO COMPLETO PARA S76

**Deudas de S75: D-515 → D-525** (§4 + D-525 arriba).

**Candidatas de regla — TODAS PROPUESTA, ninguna firmada:** (e) ventana
bilateral + ancla al bundlear · (f) el publish se reporta en el turno ·
(g) todo dato vivo se lee al momento de usarlo (absorbe e/f y D-520) ·
(h) el gate se verifica por el camino de la pantalla (hermana L-114) 
