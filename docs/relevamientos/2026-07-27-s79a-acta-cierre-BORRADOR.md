# S79-A · ACTA DE CIERRE — BORRADOR (27 Jul 2026)

**BORRADOR por L-163:** una sesión no está cerrada hasta que el canon lo
dice — la transposición a `CLAUDE.md` corre con la palabra del founder.
Este acta es el insumo completo de esa transposición, lado A (los ítems
de B se citan por sus commits; su literal vive en su acta).

---

## EL ARCO: EL PERFIL DEL PRESTADOR + PLACES — Y EL ALTA QUE NO ESTABA EN EL BRIEF

S79-A corrió en DIEZ tandas sobre un solo día, con TRES frenos
ejecutados donde el mandato los puso (T1 tamaño-Places · T5.1
tamaño-invitación · t8 tamaño-plan) y DOS gates del founder en
dispositivo (la captura de sede/alta con Paseos Shyris · el que destapó
vet2). La sesión que abrió para darle dirección y radio al prestador
terminó entregando además EL ALTA COMPLETA (invitación → sala de espera
→ activación → ceremonia) y LA REFORMA DEL PLAN A SUSCRIPCIÓN MENSUAL —
las dos por decisión del founder en vuelo.

**Lo vivo al cierre, de punta a punta:**
- **Places E2E REAL** (Edge Function `lugares` + contrato
  `lugares.ts`): predicciones y resolución con coordenadas de Quito,
  sesión que cierra en Details, key server-side rotada tras el
  incidente (D-557 ✅). Las DOS capturas consumen el mismo contrato: el
  hogar (A4, `DireccionHogarForm`) y la sede (B3).
- **LA FIRMA rige en el motor**: sin coordenadas o sin radio declarado
  NO se oferta por geografía — el AND (sin COALESCE, L-139) vive en LAS
  CUATRO lectoras de oferta, con la transición del cliente declarada
  (`p_lat NULL` = lo de hoy). El discriminador corrió en fixture: el
  paseador sin coordenadas DESAPARECE con cliente geolocalizado y
  reaparece sin él. **Los callers todavía no PASAN coordenadas**
  (declarado): encender el filtro es una tanda de cliente que pase la
  ubicación del hogar (`obtenerDireccionHogar` ya la devuelve).
- **EL ALTA con un solo gate humano mecánicamente completado**:
  `invitar_prestador` (con EL ESPEJO DEL TITULAR: las DOS piezas del
  backfill histórico) → sala de espera (B, gateada por estado) →
  `activar_prestador` con checklist tipado (fila dueño → geo → radio →
  credencial médica) que activa PRESTADOR Y CUENTA en la misma txn
  (invariante activo⇒ofertable, voto (a)) → `registrar_primer_ingreso`
  (la ceremonia §2.3, solo titular, solo activo, una vez — y devuelve
  el propósito). El portal admin NO nació: tres RPCs por SQL con gate
  `is_admin()`, disparo verbatim del founder registrado.
- **EL PLAN ES SUSCRIPCIÓN MENSUAL**: `precio_mensual_plan` fijo (el
  mes es el mes), `plan_no_ofrecido` sin declarar, `precio_plan`
  jubilada con lápida, RETURNS de transición honesto POR la guarda,
  unitario derivado NO-estable declarado, batch que saltea.
- **Privilegios por COLUMNA estrenados en la casa** (`proposito` /
  `direccion_envio` no viajan por PostgREST) con su regla en el canon
  (skill `epetplace-db`): toda columna nueva de `prestadores` nace sin
  grant.

## LO QUE LOS FRENOS Y GATES ATRAPARON (el método pagando)

1. **T3.2**: el alta NO existía en el monorepo — sin esa medición, el
   contrato aplicado habría fabricado 15 fundadores invisibles sin
   camino de arreglo. El freno de dos condiciones (firma + captura de
   B) nació de ahí.
2. **El gate de vet2** destapó DOS cosas: el invariante roto
   (activo/cuenta-pendiente) y — vía diagnóstico con las tres hipótesis
   FALSIFICADAS con literal — **el eslabón faltante del alta** (invitar
   no creaba la fila dueño). La colisión del CHECK de bancarios con el
   voto (a) se DECLARÓ antes de ejecutar y se resolvió fiel a las dos
   decisiones del founder (vacío-o-completo; barrido A1 post-hoc: CERO
   lectores se apoyaban en la implicación rota — enmienda LIMPIA,
   registrado).
3. **t8**: la medición ACHICÓ el mandato (una lectora con precio_plan,
   no cuatro) y encontró la prueba viva de la confusión semántica (el
   60-sobre-10). L-174 en su enésima aplicación: leer antes de
   presupuestar.
4. **La mesa corrigió a la mesa dos veces** (la transición NULL que
   D-375 volvía verosímil-falso al revés; el `sin_prestador` que trataba
   a todo empleado como error) — y ambas correcciones entraron ANTES de
   construir.

## OPERATIVO

- **9 migraciones** aplicadas y versionadas (`20260727150000` vista ·
  `160000` documentos · `170000` dirección hogar · `180000` motor alta ·
  `190000` invariante cuenta · `200000` CONTRATO letra-perfil ·
  `210000` hermanas geo + invitar · `220000` espejo titular · `230000`
  plan mensual), **76(g) declarada en las nueve** (NO RIGE en todas,
  con su porqué; la única con backfill —espejo, 2 filas deterministas—
  lo declaró con ids medidos). **8 reversas escritas ANTES de aplicar**
  (`docs/relevamientos/2026-07-27-s79a-REVERSA-*.sql`), dos con bodies
  vivos embebidos por ser su única fuente.
- **Fixtures, todos in-txn ROLLBACK residuo 0:** A3 6/6 · A4 4/4 ·
  alta 10/10 · contrato 12/12 · espejo 5/5 · plan 5/5 (+ sondas A0 y
  las 3 sondas de Places).
- **1 Edge Function nueva** (`lugares`) desplegada y verificada E2E.
- **`gen:types` en sync** (4 regeneraciones); typechecks
  api/cliente/prestador VERDES al cierre de cada tanda.
- **Commits A (~30, todos `add` acotado + `--only` por ruta, 76(f2)):**
  de `a34d707` (lecturas) a `0b7e7a1` (consumidores del plan) + este
  cierre. CERO push — lo ejecuta el founder.
- **Proyecto confirmado por medición**: `zyltipqscdsdsxnjclhp` (el
  incidente de los dos proyectos documentado en D-557).

## LETRAS — firmadas y propuestas

| Letra | Estado |
|---|---|
| `LETRA_PERFIL_S79` v1.1 | **FIRMADA (founder, 27-jul) + CONTRATO APLICADO** (T4.6, liberado por gate en dispositivo) |
| `LETRA_PERFIL_S79` §7 (vencimientos) | **PROPUESTA con gate propio** — la única excepción de la firma, sigue abierta |
| `LETRA_ALTA_S79` v1.0 | Depositada (+ §2bis espejo del titular, §4bis invariante, la señal D-487 declarada). Enmienda a v1.1 (invitación real) ESPERA T5.2 |
| `MODELO_PASEO` §6.2/§6.4 | ENMIENDA S79 (8 puntos — la reforma del plan + el aviso del precio que cambia) |
| `MODELO_FINANCIERO` | Decisión M enmendada (bancarios vacío-o-completo) · Decisión S enmendada (base mensual fija) |
| Skill `epetplace-db` | La regla de privilegios por columna |
| `DEUDAS` D-471 | Enmendada: el legado NO está desplegado |

## DEUDAS DE S79 (D-556 → D-561)

- **D-556** 🟠 buckets públicos heredados + policies "Admin" de
  adopcion-fotos que no gatean admin.
- **D-557** ✅ CERRADA COMO ROTADA (key nueva, la expuesta borrada) —
  con la lección de método intacta: credenciales navegador→terminal,
  jamás al chat.
- **D-558** 🟠 la key de NAVEGADOR del legado: comodín `*.vercel.app` +
  Geocoding habilitada (cerró la pregunta de las coords de
  Carlos/Satori). Candidata a jubilarse entera; mínimo inmediato:
  quitar el comodín.
- **D-559** 🟢 `sector` sin capturar en la sede v1 (pedido a B).
- **D-560** 🟡 la sala de espera por LISTA BLANCA: al portal entra
  `activo`, todo lo demás a la sala (pedido a B, regla de mesa).
- **D-561** 🟠 el invariante "exactamente UNA fila dueño activa" es de
  constraint/trigger, no de checklist (disparo declarado).
- Pagadas/honradas al paso: D-342 (en `prestador_documentos`) · D-375
  (honrada en la reforma) · **D-518/D-367: la mitad FILTRO quedó
  CONSTRUIDA** (el AND en las 4 lectoras; la captura corriendo;
  encender = que los callers pasen coordenadas).

## LO QUE ESPERA (sin maquillaje)

1. **T5.2 (la invitación real) — EN ESPERA DEL SCHEME EN DISPOSITIVO**
   (A3, orden de mesa): si el APK vivo no responde a `prestador://`, el
   tamaño deja de ser chico. No arranca sin ese dato.
2. **§7 vencimientos**: propuesta con gate.
3. **Gates founder en dispositivo pendientes**: la Hoja del plan
   mensual + el rebote del chip · la captura del hogar con Places · el
   lote de strings S79 (es/en) entero.
4. **Pedidos a B vivos**: taller a "precio mensual del plan" (wrapper
   listo) · D-559 · D-560 · retiro del puente AsyncStorage
   (`registrarPrimerIngreso` publicado).
5. **El comando de Shyris** (re-veredicto con activar v3) si el founder
   no lo corrió ya.
6. **La clave `precio_plan` del RETURNS + la columna**: mueren al
   jubilar el último bundle pre-reforma.
7. **El arco de pagos hereda con nombre**: ciclo real del plan +
   prorrateo + la comparación del aviso de 72 h (§6.2 punto 8) + el
   gate de bancarios en la liquidación real.

## LECCIONES DE MÉTODO DE LA SESIÓN (candidatas a la lista, las TRES de la mesa explícitas)

1. **Un backfill histórico que es la ÚNICA fuente de un dato ES la
   especificación: se lee ENTERO, no se copia la parte que dolió.**
   Evidencia: el espejo del titular eran DOS piezas (V0 +
   empleado_roles S73) — copiar solo la fila que rompió la pantalla
   habría dejado la segunda esperando a un vet reclutado. El founder lo
   ordenó ANTES de conocer el resultado; la lectura le dio la razón.
2. **Un dato faltante JAMÁS se disfraza de permiso denegado — la
   denegación exige lectura coherente** (la ley del gate de B,
   `5055062`: el titular-null se volvía denegación muda y el blanco
   parecía crash; ahora el dato roto HABLA — `GateRoto`, frontera
   app-wide por voto de mesa).
3. **Un apply que toca GRANTS se secuencia contra los BUNDLES VIVOS,
   no solo contra el repo.** Evidencia: la transición del RETURNS de la
   reforma se diseñó contra el shape-guard del bundle publicado (la
   clave conservada + la guarda detrás), y el diagnóstico de vet2
   arrancó con esa hipótesis porque el apply de privilegios por columna
   corrió bajo un OTA ya publicado — esa vez fue falsa alarma, pero la
   secuencia es ley.

*(Cuarta, ya depositada en D-557: las credenciales van del navegador a
la terminal directo — la mesa nunca necesita el valor de un secret.)*
