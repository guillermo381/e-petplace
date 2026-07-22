# S73-B · BOCETO M1–M5 — EL CASO CLÍNICO GANA CARA (ítem 9)

> **Estado: BOCETO — viaja a la vara cruzada de A por mano del founder
> ANTES de construir. CERO código ejecutado sobre esta superficie.**
> Construcción prevista: S74 ("el expediente sabe quién lo mira").
> Autor: Sesión B (S73). Toda cita es ruta:línea contra HEAD real.

---

## 0. La verificación previa (L-141 — las dos promesas §10 "SIN VERIFICAR desde S72-A0")

`MODELO_VETERINARIA.md:438-439` promete v1: *"casos activos en el
Antes del vet · el caso visible en el timeline del dueño"*.

| Promesa | Estado REAL relevado | Evidencia |
|---|---|---|
| Casos activos en el Antes | **CONSTRUIDA Y CABLEADA, sin cara** | `consulta/[citaId].tsx:207` llama `obtenerCasosActivosMascota`; `:441-460` los pinta como `Celda` **NO interactiva** (condición + Insignia tratante/otra). El RPC vive en DB: sonda REST con anon → `42501 permission denied` (REVOKE L-140 sano; la función existe). El gate en dispositivo con sesión vet real sigue siendo del founder. |
| Caso visible en el timeline del dueño | **VISIBLE PERO SIN VOZ** | `packages/ui/src/components/LineaDeVida.tsx`: cero entrada "caso" en el diccionario cerrado → degrada al genérico. Es la clase exacta de **C8** ("dos 'Momento de cuidado' genéricos") — territorio A (cliente), NO se toca desde B. Se reporta como hallazgo, sin ejecutar. |

**El callejón (gemelo de P3):** el Antes muestra el caso y NO SE PUEDE
ENTRAR. `CasoActivo` (contrato vivo,
`packages/api/src/wrappers/veterinaria-nota-clinica.ts:457-465`) trae
`casoId · condicion · fechaApertura · horizonteProximoEvento ·
empleadoTratanteId · esTratante` — y la superficie de hoy renderiza SOLO
`condicion` y `esTratante`. No existe pantalla de caso, ni lector de los
eventos de un caso (barrido: cero rutas `veterinaria/caso/*`, cero
wrapper "eventos por caso" en `packages/api`).

## 1. M1 — LA TESIS

**"Este caso es una historia con dueño: qué condición, quién la trata,
qué pasó hasta hoy y qué viene después."**

La pantalla nueva: `/veterinaria/caso/[casoId]` — LA CARA DEL CASO
(lado prestador). El vet que adoptó un caso (EL NORTE: *"el vet no
atendió una consulta — adoptó un caso"*) hoy no tiene NINGUNA superficie
donde verlo entero.

## 2. M1 — Las 7 preguntas del diseñador (§1c)

1. **¿Qué TRABAJO hace?** Entrar a una historia clínica agrupada y
   leerla de un vistazo: identidad del caso (qué/quién/desde cuándo) +
   la secuencia de sus eventos. Trabajo de LECTURA; las acciones de
   escritura (abrir/asociar) YA viven en la Confirmación del Durante
   (`consulta/[citaId].tsx:630-663`) y NO se duplican acá.
2. **¿Ya existe en la casa?** La pieza no; los materiales sí:
   `CeldaNavegacion` (la fila del Antes que ahora navega),
   `FilaDato` (identidad del caso: etiqueta sobre valor, sin
   interacción), `Insignia` (tratante/estado), `Texto`, `Tarjeta`,
   `Esqueleto`, `EstadoVacio`. CERO componente nuevo.
3. **¿Recorriste la casa?** Vecinas: el Antes (`consulta/[citaId]`,
   viene de ahí), el detalle de cita vet (`veterinaria/cita/[citaId]` —
   la vara 19.7 del ícono+label+chevron), el parte del dueño
   (`cliente: parte/[eventoId]` — la otra cara del mismo sedimento).
   Misma gramática, dosis baja.
4. **¿La tesis y la firma?** Tesis arriba. FIRMA: **la línea de eventos
   del caso** — la historia agrupada que ninguna otra superficie del
   prestador tiene (comportamiento, no color): cada consulta/examen
   anclado al caso, en orden, con su fecha en mono.
5. **¿Capa y dosis?** Oficio vet, dosis baja §15b: tinta + tealDark del
   CTA si lo hubiera (v1 es lectura: sin CTA primario). UN acento.
6. **¿3 temas y es/en, estados?** Abajo (§4). Memorial: el caso de una
   mascota en memorial se LEE (la historia no muere con la mascota —
   P13: el dato clínico JAMÁS expira) pero sin celebración — degradación
   estándar de los componentes.
7. **¿Chanel?** No se pinta `casoId` (máquina), no se pinta
   `empleadoTratanteId` crudo (UUID — hasta que exista resolución de
   nombre de empleado, la fila se OMITE: null honesto, jamás un UUID
   vestido de dato). El horizonte solo si existe.

## 3. M4 — CONTRATO DE DATOS DE PANTALLA

**Fuente 1 (existe): `CasoActivo`**
(`packages/api/src/wrappers/veterinaria-nota-clinica.ts:457-465`)

| Campo | ¿Se renderiza? | Cómo |
|---|---|---|
| `casoId` | NO (a propósito) | Solo ruta. Vocabulario de máquina (Ley 3). |
| `condicion` | SÍ | Título de la pantalla (`Texto titulo`). |
| `fechaApertura` | SÍ | `FilaDato` "Abierto" · valor `fechaCortaMono`. |
| `horizonteProximoEvento` | SÍ, si != null | `FilaDato` "Próximo control" · mono. Null → la fila NO se dibuja. |
| `empleadoTratanteId` | NO (a propósito, v1) | UUID sin resolución de nombre hoy. Se omite hasta que la letra de equipo (S73-mesa) dé el lector de nombre. Descarte DECLARADO. |
| `esTratante` | SÍ | `Insignia` — misma voz del Antes (`consulta.casoTratante/casoOtra`; OJO: `casoTratante` hoy en voseo "Sos la clínica…" — clase D-481, se cura al construirse). |

**Fuente 2 (NO existe — pedido de motor a la mesa):** lector "los
eventos de un caso" — la constelación ya ancla `caso_id` (migración
`20260720150000` y S70 `…150000`: `sedimentar_nota_clinica` ancla cita
+ caso), pero no hay RPC de lectura. Contrato propuesto (lo firma la
mesa; escritor de DB = A esta tanda, regla 76(a)):
`obtener_eventos_caso(p_caso_id)` → filas `{evento_id, fecha,
tipo_evento, resumen}` gateadas por el MISMO guard de
`obtener_casos_activos_mascota` (cuenta que atiende con acceso
vigente; anon revocado L-140; **gate de ROL D-464 cuando exista** — la
recepción NO lee esto: es expediente clínico, A3 ley madre acto/rol).

**Sin la Fuente 2 no se construye** — una cara de caso sin su historia
es otro callejón con más pintura.

## 4. M1 — ESTADOS DECLARADOS

- **Cargando:** `Esqueleto` estático (identidad + 3 nodos), Ley 13.
- **Error:** voz honesta con reintento — jamás disfrazado de vacío.
- **Caso sin eventos todavía** (abierto recién, cero consultas
  ancladas): voz honesta tipo *"Todavía no hay consultas en este
  caso."* — EstadoVacio registro="seccion", con la identidad del caso
  arriba SIEMPRE visible (el caso existe aunque su historia empiece).
- **Sin acceso / caso ajeno:** el RPC rebota tipado
  (`sin_acceso_mascota` / `no_opera_cuenta`) → voz del wrapper, back.
- **Memorial:** lectura digna, degradación estándar (sin tinte).
- **es/en:** todas las keys nuevas nacen en par (Espejo tipado).

## 5. M5 — PASADA DE DICCIONARIO

- La fila del caso EN EL ANTES pasa de `Celda` muda a **fila que
  navega** con la anatomía de la enmienda 19.7 S73: fila entera tapea,
  rol `button`, texto + **chevron ›** (navega). **Glifo: NO** — las
  filas de la sección "Casos activos" son del MISMO tipo (Ley 12
  enmendada S71: el glifo marca lo que varía dentro de la unidad de
  barrido; el header ya dijo qué son todas).
- Identidad del caso: `FilaDato` (su prueba: tocarlo no hace nada).
- Estado tratante: `Insignia` (dato pasivo, 19.4).
- La lista de eventos: filas que navegan al detalle del evento si el
  destino existe (v1: el parte del prestador no existe como pantalla —
  las filas nacen NO navegables como `Celda` con fecha en
  `metadataMono`, y se declara; navegar sin destino sería el mismo
  callejón).
- Techo visual: si el caso junta >5 eventos, `PieRevelar` con número
  (19.6) — NO paginación (los eventos de un caso son un conjunto
  chico y cerrado).
- Ghost prohibido como acción de fila (19.7). Cero contorno
  transparente.

## 6. Lo que este boceto NO toca (declarado)

- El timeline del DUEÑO (voz de caso en `LineaDeVida`) — cliente,
  territorio A, clase C8/assert tipos-vivos-vs-diccionario.
- Las acciones de escritura sobre el caso (cerrar, transferir §10
  handshake) — v2 con su propia letra; v1 es LECTURA.
- El motor de alertas por horizonte (§10 v2, comparte infra con
  loyalty — su tanda propia).
- El gate de ROL (D-464) — el boceto lo NOMBRA como precondición del
  lector nuevo; la letra es de la mesa (esqueleto de equipo §5).

## 7. ENMIENDA DE MESA S74 — el diagnóstico gana su declaración (incorporada ANTES de la firma)

> Decisión de mesa S74 (entra a MODELO_VETERINARIA §8.3/§12 por mano de
> A). Este boceto y el contrato del `resumen` de A
> (`2026-07-22-s74a-contrato-resumen-caso.md`) se leen CON esta enmienda.
> **Resuelve la pregunta de producto que S73-B dejó reportada sin curar
> (`276140d`): la nota sin diagnóstico ("todavía no sé, pido exámenes")
> ES legal — como DECLARACIÓN, jamás como hueco.**

**La letra:** `diagnostico_principal` deja de ser NOT NULL — pasa a
nullable. Nace una columna HERMANA con el estado de la declaración:
**definido / no_definido**. La pantalla NO deja guardar sin elegir una de
las dos (el vet escribe su diagnóstico, o declara explícitamente "aún no
definido"). **Motivo, para que nadie lo revierta:** el vocabulario
clínico es LIBRE (§12) — un valor centinela dentro de un campo de texto
libre obliga a distinguir por string (regla 35, y el precedente exacto de
`'otro'` en S72).

**COROLARIO (corrige la derivación previa): "no definido" NO es un hueco
— es una DECLARACIÓN. Se DICE, con la voz del diccionario (Ley 3), nunca
se muestra en blanco.** El null honesto no es silencio cuando hubo
declaración.

**Qué cambia en este boceto (declarado, fila por fila):**

1. **M4 / la línea de eventos:** la fila `historia_clinica_registrada`
   pierde su garantía "resumen siempre" (la tabla de A la derivaba de un
   NOT NULL que muere). Con `no_definido`, `resumen = null` **+ el estado
   de la declaración viaja en campo propio del contrato del lector** — y
   la pantalla lo VISTE con voz del diccionario (key nueva par es/en,
   candidata: *"Aún sin diagnóstico"*), jamás fila en blanco ni la voz
   genérica del tipo (eso sería pintar la declaración como ausencia).
2. **Estados (§4):** entra el estado declarado — evento de HC con
   diagnóstico no definido: se dice, no se degrada.
3. **El Durante (consulta, superficie B — POST-motor):** el guard del
   Confirmar pasa de "Falta el diagnóstico." (cura `276140d`) a exigir
   UNA de las dos: texto en el campo O la declaración explícita "aún no
   definido". La forma exacta del control de declaración se firma en su
   gate (candidata barata: acción junto al campo, anatomía 19.7); la voz
   "Falta el diagnóstico." se reescribe a la elección de dos vías. CERO
   código hasta que el motor de A exista.

**PEDIDO DE MOTOR → A (76-b, viaja por mano del founder; CERO SQL acá —
nombra el TRABAJO, el naming lo decide A contra el schema vivo, L-084):**

1. La tipada de HC: `diagnostico_principal` DROP NOT NULL.
2. Columna hermana en la MISMA tipada: estado de la declaración del
   diagnóstico, dos valores (definido / no_definido), NOT NULL.
   Coherencia EN LA TABLA, no en la UI: definido ⇒ diagnóstico presente ·
   no_definido ⇒ diagnóstico null.
3. El guard `nota_sin_diagnostico` del RPC de sedimento pasa de "exige
   diagnóstico" a "exige la declaración": rebota solo si no vino ni texto
   ni el `no_definido` explícito. (El muro §8.3 intacto: la IA jamás
   inventa el diagnóstico — y ahora tampoco inventa la declaración: campo
   no dictado = la pantalla pide elegir.)
4. El lector del caso (`obtener_eventos_caso`, aún pedido) y
   `obtener_parte_consulta` exponen el estado de la declaración junto al
   diagnóstico — las caras (parte del dueño incluido, territorio A) lo
   visten por diccionario.
