# S73-A · ACTA M2 — la vara cruzada sobre los CUATRO bocetos de B

> **Estado: EMITIDA (S73-A, 21 Jul 2026), validada por mesa.** Método L-158:
> se abrió la FUENTE de cada dato citado (código, schema generado, DB viva
> con `pg_get_functiondef` y conteos, policies literales) — jamás la tabla
> del boceto contra sí misma. **B incorpora las enmiendas leyendo esta acta,
> no re-relevando.** Bocetos auditados:
> `2026-07-20-s72b-boceto-p3-expediente-profesional.md` ·
> `2026-07-20-s72b-boceto-p2-presupuesto.md` ·
> `2026-07-21-s72b-cuarta-tanda.md` §2 (atención) ·
> `2026-07-21-s73b-boceto-caso-clinico-cara.md`.

---

## 1 · P3 — el expediente del profesional · **APTO CON 4 ENMIENDAS** (la tesis sobrevive entera)

**Los seis huecos §5.3 — 5 confirmados, 1 con dato corregido:**

- **H1 ENMIENDA:** "NINGÚN wrapper selecciona `alergias`" es falso en el
  conteo — **TRES la seleccionan** (`mascotasPrestador.ts:113` ·
  `adiestramiento-antes.ts:119` · `grooming-atencion.ts:366`) y **los tres
  la degradan a booleano** (`Array.isArray(alergias) && length > 0`). La
  conclusión que carga peso (**cero lector con CONTENIDO**) SE SOSTIENE —
  el peso de la franja §4.1 no cambia. (`veterinaria-nota-clinica.ts:261`
  maneja `AlergiaConfirmada[]` pero es el ESCRITOR del dictado, no lector
  de perfil.)
- **H2 ✅** `medicacion_actual`: cero selects en todo `packages/api` (único
  hit: el comentario del trigger, `veterinaria-nota-clinica.ts:293`).
- **H3 ✅** `perfilMascota.ts:158`:
  `tiene_condicion_cronica: Array.isArray(condiciones) && condiciones.length > 0`
  — la lista se lee y se tira, literal.
- **H4 — ENMIENDA DE DATO, CONCLUSIÓN REFORZADA:** el "único candidato
  `temperamento: Json`" es **fantasma**: `temperamento` es `string | null`
  y vive en **`criadero_camadas`** (vertical de criaderos, no el perfil
  clínico); `calificacion_temperamento` es de reseñas de camada. **No hay
  candidato en ninguna tabla del expediente.** La alerta de manejo es
  modelo nuevo → decisión de mesa, exactamente como el boceto votó.
- **H5 ✅** cero lectores exponen `procedencia` (único hit: comentario en
  `veterinaria-atencion.ts:5`).
- **H6 ✅** select literal (`perfilMascota.ts:92-94`):
  `evento_id, nombre_vacuna, tipo_vacuna, fecha_aplicada, fecha_proxima` —
  omite lote/veterinario_nombre_externo/archivo_url/via_administracion/
  procedencia tal cual.

**Las otras cuatro respuestas de §7:**

- **El guard del parte ✅** — `pg_get_functiondef('obtener_parte_consulta')`:
  `IF NOT public._user_es_familia_de_mascota(v_hc.mascota_id, v_uid) →
  RAISE 'sin_acceso' 42501`. **Cero rama de prestador** (la única mención a
  `prestadores` es display del nombre del negocio). El eje 3 NO gana el
  parte.
- **La procedencia ✅ es SELECT, no migración** —
  `eventos_mascota.procedencia` es columna viva del Row generado.
- **El conteo — ENMIENDA: son 88, no 83.** DB viva: `NULL = 88 ·
  declarado_por_familia = 24 · declarado_por_prestador = 9`. El 83 era el
  censo A0; la producción avanzó. "Origen no registrado" es la MODA del
  dataset — la tercera voz pesa MÁS de lo que el boceto creía.
- **D-463 ✅ vigente** — `mascota_acceso_prestador` Row sin columna
  `oficio`. **Voto §5.4 RATIFICADO**: profesional-vet primero; recepción y
  modulación esperan D-463/D-464.

**Verificación extra (sostiene su §0):** las 5 "reutilizables tal cual" —
policies literales `mascotas` (`select_prestador_con_acceso`) ·
`evento_vacuna_aplicada` (`vacuna_select`) · `mascota_perfil_vigente`
(`perfil_vigente_select`) gatean TODAS por `user_tiene_acceso_a_mascota` ✅;
`leerDetalleAtencion.oficio = 'paseo'|'grooming'|'adiestramiento'|null`
(`timeline.ts:239`) — vet cae a `null` ✅.

## 2 · P2 — el presupuesto · **APTO CON 3 ENMIENDAS**

1. **§3a ✅ el pecado es literal** (`nuevo.tsx:175-181`). **Respuesta a su
   pregunta 1:** el diccionario NO cubre "agregar desde catálogo a un
   carrito" y no hay vara viva de carrito en la casa (el único checkout es
   mono-ítem). El candidato de forma es sano con **UN roce**: N filas × un
   `+` sólido = N sólidos por superficie — choque textual con 19.7. La
   entrada nueva debe deslindar los trabajos (19.7 = lista de CONTENIDO;
   el carrito = otro trabajo). **Registrado como D-491**; la forma la
   firma el gate de P2.
2. **§5.4 aplanamiento — INTENCIÓN A MEDIAS, precisada:** quien aplana es
   el **CALLER** (`nuevo.tsx:121`); `crearPresupuestoBorrador` **sí
   soporta el XOR** (`tipoServicioCodigo`,
   `veterinaria-presupuesto.ts:20-23 → :124-125`). El vínculo al
   procedimiento PROPIO es **imposible por schema** (`presupuesto_item`
   sin columna hacia `prestador_servicios`; solo `tipo_servicio_codigo`
   del catálogo de plataforma). Veredicto: restricción de schema cuya
   salida es **D-480** — el boceto puede darlo por intención HOY con esa
   referencia.
3. **`cantidad>1`: voto RATIFICADO** (decisión al gate). Dato a favor del
   contador «×N»: `presupuesto_item.cantidad` existe y el wrapper ya la
   envía.
4. Menores: la función es `agregarLibre` (no `agregarLinea`); el
   `SliderPrecio` del vecino vive hoy en `procedimientos.tsx:287` (las
   líneas corrieron); las constantes 5/5/500 (`:57-59`) llevan el
   comentario *"calibración founder pendiente — familia D-413"* que el
   boceto hereda como nota al copiar.

## 3 · Atención (cuarta tanda §2) · **APTO CON UNA ENMIENDA VIVA**

Claims originales verificados (`servicios: ServicioActivo[] | null`
bivalente `:71` · return silencioso · `EstadoVacio` sinServicios existe).
**El propio commit S73 de B (`a9b8686`, ítem 10) tocó el mismo `useEffect`
y agregó un CUARTO fetch** (`obtenerDetalleMascotaPrestador`, `:92-96`) —
también tragado en silencio (`if (detalle.ok)` sin else). **La máquina
propuesta debe envolver CUATRO fetches, no tres**; las líneas citadas
quedaron stale (`:201-202` → hoy `:227-228`). El espejo `type Estado` de
`coordinar/[citaId].tsx:47` existe ✅ — la propuesta sigue correcta, solo
creció.

**Decisión chica delegada a M2, tomada:** el `EstadoVacio` de "sin
servicios activos" sin acción **viola 17.5** → **SÍ al CTA al taller**
(`EstadoVacio` ya tiene prop `accion`; cero componente nuevo).

## 4 · Caso clínico (S73-B) · **APTO — cero enmiendas duras, 1 nota de motor**

Todo literal: promesas §10 (`MODELO_VETERINARIA:438-439`) ✅ ·
`consulta/[citaId].tsx:207` llama el lector y `:448-460` pinta `Celda`
**sin onPress** (el callejón es real) ✅ · `CasoActivo`
(`veterinaria-nota-clinica.ts:457-466`) campos exactos ✅ · cero rutas
`veterinaria/caso/*` ✅ · cero wrapper eventos-por-caso ✅ · `LineaDeVida`
sin voz "caso" ✅ · voseo `casoTratante` vivo (`prestador/i18n/es.ts:1316`,
clase D-481) ✅.

**Nota de motor (territorio A, precondición del contrato — S74):** el
contrato propuesto `obtener_eventos_caso → {evento_id, fecha, tipo_evento,
resumen}` tiene un campo sin fuente: **`resumen` no existe como columna** —
`eventos_mascota` trae `datos: Json` + tipo; el resumen se deriva por tipo
(de `datos` o de las tipadas) y **esa derivación se declara ANTES de firmar
el contrato**. El guard espejo de `obtener_casos_activos_mascota` + D-464
como precondición: correcto tal cual.

---

## Resumen para la mesa

Los cuatro bocetos **pasan la vara — ninguna enmienda tumba una tesis**.
Las que cambian trabajo: H4 sin candidato (la mesa modela la alerta de
manejo desde cero) · el conteo 88 · la máquina de atención sobre 4
fetches · el campo `resumen` sin fuente. P3 sigue con su franja §4.1 **no
construible** hasta H1–H4 (confirmado contra fuente, no contra tabla).
