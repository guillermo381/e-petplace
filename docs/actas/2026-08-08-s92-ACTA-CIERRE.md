# ACTA DE CIERRE · S92 (8-9 Ago 2026) — EL LOOP DE SEGURIDAD

> **Sesión de UNA sola pista.** A escritora única de DB y de `docs/`; sin B, C ni
> D en vuelo (verificado al abrir: árbol primario limpio y los 14 worktrees
> residuales en cero). **Founder ausente durante la corrida**, con instrucción de
> dejar los frenos escritos y seguir.
>
> **Cero features. Cinco migraciones, todas de permisos.**

---

## ✅ EL BURN-DOWN — medido al abrir y al cerrar, no estimado

| eje | arranque | cierre |
|---|---|---|
| **DEFINER alcanzables por `anon`** (D-701) | **59** | **4** — y las cuatro con decisión escrita |
| **policies con `prestadores` crudo** (D-700) | **29** | **14** |
| **grants de ESCRITURA a `anon`** (D-686) | 861 | 838 |
| **tablas de `public` SIN RLS** | 4 | **3** (las tres son catálogos públicos con su escritura ya revocada) |

**Re-corrida final: 22/22 verdes**, por camino real, sobre árbol quieto —
incluye las curas de **S91** (que siguen rigiendo después de cinco migraciones
nuevas) y las de hoy. **239 migraciones local = remoto.** Typechecks y
`verify:diseno` en verde.

---

## ① EL RESCATE QUE ABRIÓ LA SESIÓN — y que nadie estaba buscando

Leyendo el paso 0 aparecieron **cuatro artefactos de S90-B que NUNCA se
mergearon a `main`**: la **letra del LOOP escrita para ejecutarse hoy**, las dos
**skills de auditoría**, y el **volcado con los nueve hallazgos probados** — el
«censo servido con 7 rojos» que el brief de S92 citaba sin nombrar archivo.

Vivían solo en `pista/s90-b`. **El acta de S90 declaraba «TODO en origin»: era
cierto para `origin` y falso para el canon** — un commit pusheado a su rama de
pista está en origin sin estar en `main`. Y el propio volcado de B le pedía a A
ese merge en su §6; quedó sin ejecutar.

> **La sesión de seguridad empezó recuperando su propio manual de instrucciones.**
> Si no se hubiera leído el paso 0 archivo por archivo, S92 habría re-derivado a
> mano un censo que ya estaba hecho. **Ficha: D-707.**

---

## ② D-701 · LAS 59 DEFINER — DE HERENCIA A DECISIÓN

**Rojo producido antes, por camino real: las 59 con `has_function_privilege('anon',…)=true`,
y 28 confirmadas EJECUTANDO de verdad como `anon`.** Entre ellas:

- **`verificar_identificacion_disponible`** devolvía `{"disponible":true}` ⇒ **un
  oráculo de cédulas**: con un número real decía si ya había cuenta.
- **`test_marca_nombre`** devolvía el texto marcado y **`test_marca_metadata`** su
  objeto con `test_data:true` — **andamiaje de test respondiéndole a cualquiera
  en producción**.
- **`get_user_features`** entregaba la config de features sin sesión.
- **`cerrar_paseo_con_calidad`**, que **DEVENGA DINERO**, tenía a la anon key del
  bundle en su puerta.

**Cerradas 57, en dos tandas con su par ajeno-rebota/dueño-pasa:**

| tanda | qué | criterio |
|---|---|---|
| **1 (30)** | 11 triggers · 10 helpers internos y de policy · **9 de andamiaje de test** | el andamiaje sale también de `authenticated`; `service_role` conserva |
| **2 (27)** | 18 de usuario autenticado · 8 legacy sin consumidor · **`encontrar_prestador_emergencia`** | `anon` fuera, `authenticated` **escrito** |

**`encontrar_prestador_emergencia` entregaba lat/lon EXACTAS a cualquiera. No es
letra nueva: es la letra de S84 aplicada en la puerta donde faltaba** — esa
sesión firmó sacar `lat`/`lon` de la vista pública y esta quedó afuera del
barrido.

### Las dos que NO se cerraron, cada una con su porqué

- **`is_admin` QUEDA ABIERTA A `anon`, por decisión medida:** **11 policies con
  rol `{public}` la llaman** (`profiles`, `productos`, `pedidos`,
  `mascotas_adopcion`, storage, los tres `evento_caso_clinico_*`,
  `evento_hito_narrativo`, `solicitudes_adopcion`). Revocarla **no la vuelve más
  segura: rompe la evaluación de esas 11** y con ella la lectura pública de
  adopción. Devuelve `false` sin sesión. **Y el cinturón de la tanda 2 ahora
  VIGILA que nadie la cierre por prolijidad en una tanda futura.**
- **`email_exists` — FRENO declarado** (freno 2: cambia comportamiento visible).
  Enumeración de usuarios probada, pero su único consumidor medido es un
  **checkout de `e-petplace-v2` que corre sin sesión**. **Ficha: D-703.**

---

## ③ D-700 · EL HELPER, Y LA PRUEBA DE QUE LA DEUDA SE PAGÓ

El censo encontró **dos predicados, no uno**: 24 policies preguntan «este
prestador es MÍO» y 5 preguntan «está ACTIVO». Nacen **`es_mi_prestador(uuid)`**
y **`prestador_activo(uuid)`** — DEFINER, STABLE, `search_path` fijo, **audiencia
escrita**.

> ### Lo que NO se hizo, y es la decisión más importante del bloque
> **`user_gestiona_prestador` ya existía y era el molde de la casa.** No se
> reusó: su cuerpo es **titular OR administrador OR is_admin**, así que sustituir
> con él «soy el titular» **habría AMPLIADO el acceso** — un administrador de
> negocio pasaría a ver bonos, estadías y suscripciones que hoy solo ve el
> titular. *Un helper de seguridad que ensancha en silencio es peor que el
> predicado crudo que viene a reemplazar.*

**EL DISCRIMINADOR — el incidente de S91 reproducido en chiquito.** Dentro de una
transacción con `ROLLBACK` se revocó `SELECT(estado)` y después `SELECT(user_id)`
sobre `prestadores`:

| | migradas | no migrada (control) |
|---|---|---|
| tras revocar la columna | **PASAN** (zonas 2 filas · servicios 25 · fotos 6) | **ROMPE** `permission denied` |

*El contraste es la prueba: la diferencia la hace el helper, no el azar.* Residuo
tras el ROLLBACK, medido: 1, como debía.

**Baseline con dos actores (titular y un ajeno sin prestador) antes y después:
las tres fotos IDÉNTICAS.** Cero cambio de comportamiento, que es lo correcto
para una migración de estructura interna.

**Quedan 12, nombradas y no escondidas (regla 77):** las COMPUESTAS, que mezclan
el brazo del titular con brazos de `prestador_empleados` (walk-in, agenda,
mostrador) y una con `UNION`. **Ficha: D-702.**

---

## ④ D-686 + LOS CUATRO ROJOS QUE QUEDABAN DEL CENSO DE S90

**El hallazgo que volvió tratable a D-686:** el barrido parecía inabarcable —861
grants de escritura sobre 217 tablas—. Medido desde el otro lado se ordena solo:
**solo CUATRO tablas de `public` no tienen RLS**, y son exactamente las de los
hallazgos ① y ⑤. *El número grande describía el síntoma; el número chico era el
trabajo.*

- **① `_traza_promocion_e164`** — **teléfonos E.164 REALES**, legibles **y
  borrables** por cualquiera con la anon key. Censo: **cero funciones, cero
  triggers, cero consumidores**. Cerrada con RLS encendida sin policies + revoke
  total. **Las 14 filas NO se borran** (freno 3): cerrar la puerta no es borrar
  el dato. **Ficha: D-706.**
- **⑤ los tres catálogos** — tenían las siete privilegios para `anon` (S90 lo
  probó borrando 17 filas y reescribiendo 23). Escritura revocada **y la
  TRAMPA esquivada a propósito: el SELECT se conserva y se re-concede explícito**,
  porque la pantalla de registro los lee **sin sesión**. *Revocarlo dejaría a la
  gente sin poder crear cuenta y el typecheck no diría nada* — **el cinturón
  tiene un brazo dedicado solo a eso.**
- **⑥ `consentimientos`** — el INSERT se conserva; se van UPDATE, DELETE y
  TRUNCATE. *Un consentimiento se otorga; no se borra ni se reescribe.*
- **⑨ `audit_log`** — `anon` **y** `authenticated` tenían CRUD completo sobre la
  bitácora. *Un audit log que el auditado puede borrar no es un audit log.*

---

## ⑤ EL INSTRUMENTO DE L-215, CONSTRUIDO Y USADO

`scripts/s92/censo-impacto.mjs` — dada una **tabla, columna o función**, lista
policies, vistas, funciones, grants y consumidores en código, con salida para
pegar en un reporte. Lo usaron B1, B2, B3 y B4.

**Probado contra el caso conocido de S91 — `prestadores.cuenta_comercial_id` — y
de paso CORRIGIÓ EL ACTA: no son ocho las policies que la nombran, son QUINCE.**

*Lo que faltaba no eran las consultas: era que fueran un paso y no un hallazgo.*

---

## ⑥ LOS FRENOS, CON SU MEDICIÓN

| freno | qué | dónde |
|---|---|---|
| **`email_exists`** | enumeración probada, pero su consumidor es un checkout sin sesión | D-703 |
| **las 64 sondas** | **la orden es ejecutable pero NO es de una línea** | `docs/relevamientos/2026-08-08-s92a-FRENO-borrado-de-sondas.md` · D-704 |

**El borrado de las sondas merece su párrafo, porque falsó una premisa del
brief.** El censo salió limpio (64 exactas, cero cruce con datos reales), pero el
borrado **abortó dos veces contra CHECKs de procedencia XOR**
(`chk_familia_creador_xor`, después `chk_eventos_origen`): **esta casa guarda de
quién viene cada dato, y eso hace que una cuenta con historia no se pueda
desconectar en silencio.** La alternativa medida: **80 FKs apuntan a `mascotas`,
40 de ellas bloqueantes.** El brief decía *«es de una línea con el censo ya
escrito; lo que falta es la palabra»* — **el censo estaba escrito; la línea no
existe.** Las dos vías quedan servidas para que la decisión sí sea de una línea.

---

## ⑦ LOS ERRORES DE ESTA PISTA, DECLARADOS — todos cazados por la regla que vino a aplicar

1. **El más caro, y es L-211 escrita por quien vino a cazarla:** la v1 del rojo
   llamó a las 59 sin parámetros y leyó los `404 PGRST202` como «el permiso
   pasó». **Es falso:** ese 404 lo emite PostgREST al no resolver la firma y la
   llamada **nunca llega a Postgres**. Declaré «59 abiertas» con **52 sin medir**.
2. **Cinco rojos falsos por adivinar nombres** en vez de medirlos (`p_tipo` por
   `p_country_code`, `p_user_id` por `p_session_id`, `familia_miembros` por
   `familia_miembro`, `titular_user_id` por `created_by_user_id`, `eventos` por
   `eventos_mascota`). **Tres de ellos parecían «rompí el camino legítimo».**
3. **Un verde flojo, cazado antes de archivarlo:** el DELETE de `anon` sobre
   `cat_paises` rebotaba **400** mientras sus hermanas rebotaban 401 — era error
   de tipo (esa tabla no tiene columna `id`), o sea que **el permiso nunca se
   evaluaba**. Repetido con la PK real: 401.
4. **Un assert de cierre mal calibrado:** esperaba «2 DEFINER con anon» y dio 4 —
   porque **los dos helpers que esta misma sesión creó** reciben `anon` por
   decisión escrita. El 4 era correcto y el assert estaba mal; la pregunta buena
   no es «cuántas» sino **«cuántas sin que alguien lo haya decidido»**.

---

## ⑧ OPERATIVO

- **5 migraciones** (`20260808160000` → `20260808200000`), **239 local = remoto**.
- **Cinco reversas escritas ANTES de aplicar**, cada una declarando **qué NO
  deshace** — la de la tanda 5 lleva la advertencia más fuerte de la sesión:
  *revertirla REEXPONE teléfonos reales*.
- **76(g) declarada NO RIGE en las cinco**, con su porqué (DCL sin backfill; los
  cinturones leen catálogo y no anclan filas vivas).
- **Cinturones por `has_function_privilege`, jamás por `LIKE` sobre `proacl`** —
  el error ② de S91 abortó una migración de seguridad con el agujero abierto por
  exactamente eso. **Los tres brazos se probaron EN ROJO antes de confiarles la
  primera migración** (L-192).
- **Deudas nuevas: D-702 → D-708.** **Lecciones: L-216, L-217.**
- **Commits:** `81abe7d4` (B1) · `7c839c61` (B2) · `3ce1c75c` (B3+B4) + el merge
  de rescate y este cierre.

---

## ⑨ LO QUE S92 DEJA ESCRITO Y NO ES CÓDIGO

El brief pedía **un procedimiento de cambio de permisos**, porque *«un loop que
cierra 59 funciones y deja el procedimiento sin escribir va a volver a producir
el mismo día»*. Quedan tres piezas:

1. **El instrumento** (`censo-impacto.mjs`) — el censo es un paso, no un hallazgo.
2. **La lección técnica que cambió todos los revokes de esta sesión (L-216):**
   **`authenticated` hereda EXECUTE de `PUBLIC`**, así que un `REVOKE … FROM anon`
   que deje `PUBLIC` intacto **no cierra nada**. Lo descubrió el cinturón al ser
   probado en rojo.
3. **La forma de los cinturones:** tres brazos — *lo cerrado está cerrado* · **lo
   legítimo sigue abierto** · *la semántica se verifica contra una fila viva*. El
   segundo brazo es el que faltó en S91.
