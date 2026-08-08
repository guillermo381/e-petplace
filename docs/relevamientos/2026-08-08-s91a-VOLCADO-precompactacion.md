# S91 · PISTA A — VOLCADO PRE-COMPACTACIÓN (8-ago-2026)

> **Criterio: el A que despierte no tiene mi memoria — tiene ESTE archivo y el
> repo.** Todo con literal. Lo que no está acá, no existe para ese A.
> Nada de «ya casi»: cada cosa dice hecho / no hecho / esperando a quién.

---

## ① MI ROL Y LAS REGLAS QUE ME GOBIERNAN

**A conduce:** `main` · la **DB** (migraciones, RPCs) · `packages/api` ·
`packages/domain` · **`docs/`** (escritora única) · **los merges y el push** ·
**el PUBLISH**.

**§2 de `docs/METODO_TRES_PISTAS.md`, enmendado HOY y es la regla que más
cambió:** **quien publica es quien mergea.** La fila de C decía «el canal OTA»
y §2 decía «nadie más publica» — dos líneas firmadas que se contradecían. Se
resolvió con el argumento de los hechos: **los tres choques de S91 pasaron
porque el que publicaba y el que dominaba el árbol eran personas distintas.**
El acto de publicar es de A; la superficie de los dos canales es de C.

**EL PUBLISH VA POR `scripts/publicar-ota.mjs`, JAMÁS `eas update` a mano.**
Es un acto único: veda (por `scripts/verify-veda-publish.mjs`, como hijo) →
publish → **re-verificación posterior que GRITA** si HEAD se movió, si el ancla
real no es la verificada, o si trae asterisco. `--mensaje` **no lleva el
ancla**: la pone el script.

**L-200 (nace hoy, error MÍO):** *un identificador se PEGA de la salida que lo
produjo, jamás se completa.* Reporté `origin/main = d4bfe5f5`, un hash que **no
es objeto del repo** — lo fabriqué porque corrí el guard con `| tail -3` y el
pipe cortó justo la línea del ancla. El real era `011abae0`.

**El ancla se lee del OBJETO** (`eas update:view --json` → `gitCommitHash`),
jamás del texto del mensaje: medido, un publish declaró «ancla f4c9a134» y su
hash real fue `5012db53`.

---

## ② LOS DOS PUBLISHES EN COLA

> **✅ GATEADO VERDE POR EL FOUNDER (8-ago) — el prestador queda CERRADO en el
> acta.** El asterisco de arriba se conserva escrito: el gate verde no lo borra,
> lo vuelve inofensivo.

### CLIENTE — espera el CABLEADO de C *(y esto no es una demora: es L-161)*

**Medido antes de bundlear, y por eso no salió:**

```
navegación a /prestador/[prestadorId]  →  SOLO desde preview-prestador.tsx:81
consumidores de preview-prestador       →  CERO
```

⇒ **la vitrina del cliente es INALCANZABLE en el build.** C lo declaró en su
propio commit con regla 77 (*«esto es LA PIEZA. El cableado a las CUATRO filas
NO entra en este commit»*), así que publicar ahora habría metido el arco entero
al bundle **sin puerta**: exactamente L-161, la ley que nació porque el founder
buscó un tab «Tokens» que nunca existió. *Un gate sobre una pantalla que no se
puede abrir no es un gate: es una hora perdida del founder.*

**Ya mergeado y esperando en `main`:** la cadena de D (`2e2de411`, verificada
por contenido, tres typechecks en 0) y las dos mitades de C (`38aed580` ·
`2f4b588f`). **Falta solo el cableado de las cuatro filas** → árbol quieto →
`publicar-ota.mjs --app cliente`.

### ~~CLIENTE — espera a D~~ *(superseded)*

- **Último publicado:** group `999d87e8-2dff-45fc-aec5-46e56ec1e765` ·
  android `019fe24e-3918-71b9-a54c-34c623054b38` · runtime **1.0.3** ·
  `gitCommitHash 5f2af691f9b86ddd5e724cc70b9a00d7809d4865` **con ASTERISCO**
  (árbol sucio durante el bundling: C commiteó `75f49181` a las 11:57:01, mi
  ancla era 11:55:54; lo sucio eran `supabase/dev/galeria-curas/**`, que **no
  entra al bundle** ⇒ contenido confiable).
- **Falta:** la tanda de D — **`56ebc2e4` en `origin/pista/s91-d`, sin
  mergear** («A8 CON SU LIB, EL ROJO DE LA DOBLE ALTA, Y CUATRO DEL…»). D
  espera además **la caja de la puerta y la voz del contador**, que bajan por
  relay del founder.
- **Secuencia:** merge de D → árbol quieto → `publicar-ota.mjs --app cliente`
  → el founder gatea.

### PRESTADOR — ✅ PUBLICADO (reorden de mesa: sale primero porque C es toda del cliente)

- **group `c6b2c85c-665a-4871-82c2-615890bbe446`** · android
  `019fe2ae-121c-7005-8a77-756dce6a8535` · ios
  `019fe2ae-121c-7188-a4db-7013c2c2222e` · runtime **1.0.4** ·
  `gitCommitHash 38aed580da4c290a0941ba4b6a03fb62ea173dfd` **CON ASTERISCO**
  (leído del OBJETO con `update:view --json`, no del texto del mensaje).
- **Lleva:** filtros del histórico COMPLETOS (`ff66a530` tipeo en los dos
  mundos + `6c53c396` mundo persona + `c509c869` filtro de especie) · glifo
  `documentos` apilado firmado (`90df2d4e`) · ensanche de `ChipEntidad`
  (`e60d6389`). Los tres verificados ancestros de HEAD antes de bundlear.
- **⚠️ EL ASTERISCO, TRANSCRIPTO EN EL MOMENTO** (el registro publicado **no**
  lo guarda: `update:view` no expone `dirty`): el árbol se ensució durante el
  bundling con **`apps/cliente/src/components/preview-prestador.tsx`**, creado
  **13:40** — WIP del commit 2/2 de C. **Fuera del bundle del prestador, y
  PROBADO, no supuesto:** cero sentencias `import`/`require` de `apps/cliente`
  desde `apps/prestador` (los 2 hits del primer grep eran COMENTARIOS — L-170
  en su cuarta aparición) ⇒ **el contenido del bundle es confiable.**
- **LA CAUSA ESTRUCTURAL, medida:** `git worktree list` tiene
  `e-petplace-s91-B` y `e-petplace-s91-D` **y NO tiene una de C** — **C trabaja
  en el directorio primario, sobre `main`, el mismo árbol desde el que A
  publica.** Eso explica el choque ③ **y** este cuarto: *el acto único cierra
  la ventana entre verificar y bundlear, pero no puede cerrar la de una pista
  que ESCRIBE en el árbol mientras Metro lee.* ⇒ **la cura que queda es
  publicar desde un árbol que nadie más escribe** (la `worktree-detached` que
  la regla 82 dejó CANDIDATA desde S81 y que ya cobró cuatro veces).

### ~~PRESTADOR — espera a C~~ *(superseded por el bloque de arriba)*

- **Último publicado:** group `cd5386db-7998-4dbc-abfa-8559f9015589` ·
  android `019fe1d8-0bdc-7e84-b22c-16a5c43a0ccb` · runtime **1.0.4** ·
  `gitCommitHash 1129abbf61863bc77cb5a6039db8e9d95054daa2` (**limpio**).
- **Falta:** los **dos commits de C** (perfil público) + **`e60d6389` de
  `origin/pista/s91-b`, sin mergear** («ChipEntidad — LA CARA SE DIBUJA SIEMPRE
  QUE EXISTA»).
- **Ya servido para C:** `obtenerPerfilesPublicos(ids)` en
  `packages/api/src/wrappers/prestador.ts`, con `categoria` · `portadas` ·
  `clip_url`. Lee `v_prestadores_publicos` y **jamás la tabla**.
- **Secuencia:** merge C + merge `e60d6389` → acto único con TODO (filtros
  completos + perfil público + glifo apilado).

---

## ③ WHATSAPP — el estado REAL, medido hoy

| pieza | estado |
|---|---|
| transporte en sombra | ✅ `supabase/functions/despachar-whatsapp/index.ts`, **desplegado** con `--no-verify-jwt` |
| modo `?verificar=1` | ✅ lee Meta (plantillas + número), **no manda nada** |
| secrets | ✅ los TRES existen: `META_WHATSAPP_TOKEN` · `META_WABA_ID` · `META_PHONE_NUMBER_ID` (17:49 de hoy) |
| `transporte_vivo` | **false** — y `exige_evidencia = true` |
| cola de WhatsApp | **0** encoladas (por eso invocar el transporte no puede mandar nada) |

### 🔴 EL HALLAZGO QUE BLOQUEA, y es del founder

**La credencial cargada NO es un token de Meta.** Meta contesta **401 «Invalid
OAuth access token - Cannot parse access token»** para plantillas Y número. El
diagnóstico de FORMA (metadatos, cero valor):

```
largo: 23 · empieza_con_EAA: false · tiene_espacios: false
tiene_comillas: false · tiene_salto: false · parece_un_id_numerico: false
```

**Un System User token de Meta tiene ~200+ caracteres y empieza con `EAA`.**
23 caracteres sin ese prefijo = **se cargó otra cosa** en ese campo (no está
truncado por comillas ni por salto de línea: simplemente no es un token).

⇒ **La orden «correr la sombra con API real y reportar plantillas /
verificación / tres números» quedó a medias por esto y NO por falta de
ejecución.** Lo que sí se midió: `habria_entregado 0 · sin_telefono 0 ·
telefono_no_e164 0 · encoladas 0` (los cuatro en cero porque la cola está
vacía, que es correcto con el flip en false).

**Reintentar es UNA llamada** cuando el founder cargue el token bueno:
```
curl -s -X POST "$URL/functions/v1/despachar-whatsapp?verificar=1" \
  -H "Authorization: Bearer $ANON_KEY"
```

### Lo demás de WhatsApp

- **`MODELO_NOTIFICACIONES` §0quater** (texto de C verbatim + mi enmienda):
  **quedan DOS bloqueos, no tres** — la tercera pata (opt-in con evidencia)
  **EXISTE desde S88-D**; «0 habilitadas» es un **estado vacío**, no un hueco.
- **Espera del founder:** las **6 plantillas están en MARKETING y deben ser
  UTILITY** (precio varias veces menor · reglas de ventana · riesgo de pausa
  del número). Sin credencial nadie más llega a la consola.
- **`MODELO_FINANCIERO` §11bis:** desde el **1-oct-2026** Meta cobra utility y
  **Ecuador cuesta ~17× Colombia**. Cero gasto proyectado a propósito: falta el
  volumen.
- **L-201 RIGE:** la normalización **E.164 vive en el MOTOR**.
  `normalizar_telefono(p_texto, p_country_code)` **ya existe desde S69 y NADIE
  LA LLAMA**. Medido: **24 teléfonos · 16 con `+` · 9 FUERA de E.164**.
  **BACKFILL PROHIBIDO** sin país declarado (P21: el teléfono no implica país).
  El transporte **valida y no arregla**: saltea con contador propio.

---

## ④ ÓRDENES VIVAS EN MI MANO — no ejecutadas

### 🔴 1. IDEMPOTENCIA DEL ALTA en el motor (pedido de D) — NO EMPEZADA

Literal del pedido: *«la cura de navegación cierra el camino, no el daño — un
deep-link re-somete igual. La RPC del alta gana su guard de idempotencia (la
forma la decidís vos: clave natural o token de intento — con fixture del doble
submit)»*.

**Lo que ya medí y el próximo A no tiene que re-medir:**
- **`crear_familia_con_primera_mascota` YA está protegida**: su guard
  `familia_ya_existe` rebota el segundo intento, y `PasoCierre.tsx` lo trata
  como idempotencia de UX (va al Home). **El hueco está en
  `agregar_mascota_a_familia`.**
- **Los duplicados del founder fueron por ESA puerta**: Sol 15:51 y 15:53 (2
  min), Carl 17:05 y 17:06 (1 min) ⇒ **no fue doble-tap: fue re-sumisión
  humana**, así que una ventana de segundos NO alcanza.
- **Los de D son otro caso y hay que verlo**: `PerfilThor`/`PerfilMishi`/
  `PerfilAcuario` duplicados a 17:38 y 17:40 **en DOS familias distintas**
  («Familia de Perfil D» ×2) ⇒ una clave natural `(familia_id, nombre,
  especie)` **NO los habría cazado**. *Eso es dato para elegir la forma: el
  token de intento sí los cazaría.*
- Medido: **0 duplicados** por `(familia_id, nombre, especie)` en toda la DB.

**Mi inclinación (no ejecutada, sin firma):** clave natural con ventana
declarada **devolviendo la fila EXISTENTE** (no un error: re-someter debe caer
en la misma mascota) **+ aceptar un `p_intento` opcional** que, si viene, es la
clave autoritativa — así D/C pueden cablear exactitud después sin otra
migración. **Y el hito NO se emite en el camino idempotente.**

### ✅ 2. La verificación del duplicado — HECHA

Los cinco cayeron en mi limpieza anterior (Jack gato · Sol ×2 · Carl ×2) con
censo dinámico sobre las **79 FKs** de `mascotas`. Verificado: **0 altas de hoy
en la familia del founder** (quedan **solo Thor y Zeus**) · **0 duplicados** en
toda la DB · **Jack del mostrador VIVO** (`9a6ba106-4e81-4048-b796-831fb0888adb`,
perro, `origen=alta_asistida`, 20-jul — el censo **aborta** si entra en una
lista de borrado).
**⚠️ Quedan 6 mascotas de prueba de D** («Familia de Perfil D» ×2, altas de
17:38 y 17:40) — **NO las borré: son de su gate y nadie las mandó limpiar.**

> ### ✅ LIMPIADAS (orden de mesa) — **y eran 19, no 6: el número de arriba es MÍO y estaba viejo**
>
> **L-141 en mi propio volcado, y vale más que el borrado:** conté 6 a las
> 17:40 y **D siguió gateando hasta las 18:40** — aparecieron 13 más (18:11 ·
> 18:15 · 18:36 · 18:38-18:40). *Un residuo declarado con número es un número
> que envejece igual que cualquier otro; lo que no envejece es el CRITERIO.* Por
> eso la limpieza no seleccionó por lista de ids sino por criterio medido:
> nombre `Perfil%` **Y** titular `s91d-%@epetplace.dev`.
>
> **Cada alta creó su PROPIA familia** (19 mascotas en 19 familias, 1 humano
> cada una) — no eran duplicados dentro de una familia. Eso confirma lo que ya
> estaba dicho para la idempotencia: **una clave natural `(familia_id, nombre,
> especie)` no habría cazado ninguno.**
>
> **Ejecución, con censo dinámico sobre las 79 FKs de `mascotas`:**
>
> | paso | resultado |
> |---|---|
> | tres cinturones (objetivo ≠ 0 · Jack fuera · todo titular es fixture de D) | pasaron, 19 objetivos |
> | `mascota_perfil_vigente.ultimo_evento_id` · `evento_hito_narrativo.evento_id` | 19 + 19 |
> | `eventos_mascota` (su FK a `mascotas` es **RESTRICT**: hay que vaciar el árbol primero) | 19 |
> | `mascotas` | 19 |
> | **residuo en las 79 FKs** | **0** |
> | Jack del mostrador `9a6ba106…` | **VIVO** |
> | familia del founder | **2 mascotas** (Thor y Zeus) |
>
> **Lo que NO se tocó, a propósito:** las 19 filas de `familia`, sus
> `familia_miembro` y los 19 `auth.users` de fixture. *Borrar la familia
> dejando al usuario vivo lo pondría en un estado que la app no produce nunca;
> un usuario descartable con familia vacía es el estado normal de post-registro.*
> La orden era sobre las mascotas y el alcance se respetó.

### 3. La sombra con credencial — bloqueada por el token (ver ③)

---

## ⑤ DEUDAS Y LETRAS DE HOY QUE GOBIERNAN LO QUE SIGUE

- **D-693** — la **matrícula del negocio**: hoy «legible pero no mostrada»
  (el peor de los tres estados). Va a **la lámina de la vitrina**, se firma
  sobre píxeles. **No se decide en una migración.**
- **D-692** — **chips propios por especie**: gato ya tiene 5; **perro, conejo y
  roedor tienen CERO**. Registrado por firma, **no abierto como defecto** («el
  mínimo digno de hoy ya es digno»; no se inventan chips por simetría). *El
  caso del perro es el interesante: tiene cero porque las 16 se escribieron
  desde su vida — la pregunta futura no es «qué le falta» sino «qué de lo
  universal era en realidad suyo».*
- **D-685 · el arco del acuario** — letra fundacional FIRMADA: *«el perfil del
  acuario integrará la LISTA de sus peces como MIEMBROS… servicios, comida,
  bitácora y todo lo contratable aplican SIEMPRE al ACUARIO. El pez se mira; el
  sistema se cuida.»* **Post-S92.** Dos trampas ya nombradas: «identidad
  ligera» **NO es una fila de `mascotas`**, y **un pez que muere no puede usar
  `estado_vida`** (es del acuario).
- **D-690** — el expediente **no se elimina**; ocultar y adopción son los
  caminos; el intento debe **rebotar TIPADO**. La policy legacy de codueños va
  al loop de S92 (2 filas, y en las dos el codueño **es el propio dueño**).
- **D-686** — barrido de grants `anon` en tablas legacy → **S92**.
- **D-684 ☠️ MUERTA** hoy (bucket sirve md5 `b4e4eeba…`, los dos destinos).
- **D-691 ☠️ MUERTA** hoy (`ChipEntidad` unificado por B).
- **A8** — diferido y vuelto a S91: viaja en la tanda de D.
- **S92 = FULL loop de seguridad**, con los **7 rojos del censo** ya servidos.
  **Sin features.**

---

## ⑥ TRAMPAS DE HOY — todas cobradas en carne propia

1. **`storage rm` devuelve `{"deleted":[]}` SIN error** — no-op silencioso
   (familia L-192). **Verificar por CONTENIDO**, jamás por exit code. Y para
   subir al bucket: `x-upsert: true` (`cp` rebota **409**).
2. **`CREATE OR REPLACE VIEW` solo APENDEA columnas.** Puse `clip_url` en el
   medio y Postgres lo leyó como *rename* de `ciudad` (**42P16**).
3. **El `.select()` de supabase-js va en UNA cadena literal.** Concatenado con
   `+` la fila entera cae a `GenericStringError` — **17 errores por una causa**.
4. **El pipe trunca DATOS (L-200) y exit codes (L-191).** `| tail -N` sobre una
   salida que contiene el dato que vas a citar es una trampa. **Leer el exit
   del COMANDO** (`cmd > log; echo $?`), nunca del pipe.
5. **`git status` limpio 60 s antes NO garantiza bundling limpio** — el
   asterisco **vive solo en el momento**: el registro publicado **no guarda el
   estado del árbol** (medido: `update:view` no expone `dirty`). ⇒ si aparece,
   **se transcribe YA**.
6. **Tres supuestos de TIPO cazados chocando:** `especies_elegibles` es
   **jsonb** (no `text[]`) · `p_raza` es **requerido** (sin DEFAULT) · `lat`/
   `lon` son **double precision** (no `numeric`). **Y plpgsql valida el
   `RETURN QUERY` al EJECUTAR, no al crear** — la función se creó «bien» y el
   cinturón pasó.
7. **Un comentario propio rompe un grep propio** (L-170, tercera aparición):
   mi comentario nombraba `sin_contexto_activo` y el assert lo encontró.
8. **`eas-cli` SIEMPRE desde `apps/<app>/`**, aunque solo estés MIRANDO
   (desde la raíz scaffoldea un `app.json` stub).

---

## ⑦ ESTADO DEL REPO

```
origin/main = e40d3348c750f4f8a0d82a6ecbe62b0502495b74   (== HEAD)
migraciones locales = 229        (comando: ls supabase/migrations/*.sql | wc -l)
```

**Sin mergear, uno por rama:**

| rama | commit | qué es |
|---|---|---|
| `origin/pista/s91-b` | **`e60d6389`** | `ChipEntidad` — la cara se dibuja siempre que exista |
| `origin/pista/s91-d` | **`56ebc2e4`** | A8 con su lib + el rojo de la doble alta + cuatro más |

**Árbol al escribir:** sucio en **`supabase/functions/despachar-whatsapp/index.ts`**
(el diagnóstico de forma del token) — **entra en el commit de este volcado.**

**Mis migraciones de hoy (S91-A), en orden:**
`20260807170000` cat_razas · `173000` pez/acuario · `180000` hito · `183000`
raza en las 2 RPCs · `190000` grants L-140 · `200000` razas apagadas ·
`210000` razas firmadas · `220000` p_origen + coherencia · `230000` reptil ·
`20260808000000` hito catálogo · `010000` hito emisión · `020000` vocabulario
universal · `030000` aplicabilidad de conductas · `040000` reservador ·
`050000` tres motores del perfil · `060000` paquete gato/acuario · `070000`
aplicabilidad de objetivos · `080000` **cierre de la fuga** · `090000` tipos ·
`100000` ensanche de la vista.
**Cada una con su reversa escrita ANTES en `docs/relevamientos/2026-08-0*-s91a-REVERSA-*.sql`.**
