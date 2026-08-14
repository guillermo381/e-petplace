# S97-A · HANDOFF DE CIERRE (14-ago-2026)

**Para la próxima instancia de A: esto se lee ANTES que cualquier backlog.**
Todo en `origin/main` hasta `1b7dce01`. **Esto es LO VIVO, no la historia** —
la historia está en `docs/actas/2026-08-14-s97-ACTA.md`.

---

## 1 · 🔴 EL CIRCUITO QUE QUEDÓ A MEDIAS — es lo primero

**Regla que lo gobierna: `METODO` §6bis-B — Code camina el dispositivo ANTES
que el founder.** *No es desconfianza: es economía de ojo.* El founder ya
gastó una vuelta hoy en un defecto que Code destapa en tres minutos (D-799).

### Hecho y verde ✅
- **EL ALTA DEL MOSTRADOR NO-VET, CAMINADA ENTERA** (Estética → «Registrar
  mascota nueva» → Registrar). **✅ REGISTRA: la mascota nace.** Contesta la
  pregunta que la mesa tenía abierta —*«el mostrador solo registra
  veterinaria»*—: **para el ALTA, no.**
- **El barrido de colisión en ANDROID REAL** — dos filas recortadas del
  aparato, **cero colisión**, el título **elide con elipsis real**. *Era la
  evidencia que faltaba: todo el verde de la fila era RN-web.*
- **`ATENDER` con `demovet`** — **dos columnas, baldosas cuadradas, una sola
  vista.** Cierra D-804 + D-805, **y el founder ya la firmó**.
- **El mostrador no-vet ENTRANDO POR LA BALDOSA** — el camino existe.

### 🔴 EL ÍTEM 1 SE CORRIGE A SÍ MISMO — medido

**«El alta hasta la voz del *todavía no*» MEZCLABA DOS CAMINOS.** Caminado:
el alta crea el fantasma y **vuelve a la búsqueda**; huella medida = **1
mascota, 0 perfiles, 0 solicitudes**. **No hay handshake al dar de alta —
y es correcto: a un fantasma no hay a quién preguntarle nada.**

⇒ **`handshakePie` («La familia todavía no respondió») es del OTRO camino:**
buscar una familia **ya registrada** y pedirle autorización.
**Ese es el que falta caminar.**

⚠️ **Residuo declarado y DEJADO a propósito:** mascota `SondaS97A`
(`eda482ab-e226-4f3a-8266-03a46c6889c4`, familia
`0b154fea-f60c-44d9-864f-79b0192d5f16`, Clínica Aurora). **Se intentó borrar y
la FK lo rebotó: ya tiene su evento en `eventos_mascota`** — *el alta deposita
en el expediente, o sea el Bio-Expediente haciendo su trabajo*. **No se
fuerza:** precedente S92 — una sonda con historia **se marca, no se borra**.

### ✅ EL HANDSHAKE, CAMINADO ENTERO — y destapó una 🔴

`demovet` → buscar `guillo381+8@gmail.com` → **la búsqueda revela SOLO el
nombre** (§7bis cumplida, sin conteos) → «¿A quién vas a atender?» con las seis
mascotas → Thor → «Pedir autorización» → **la solicitud NACE** (`pendiente`) y
la espera se pinta con la `EsperaDeMarca`.

🔴 **PERO LA VOZ MIENTE: «Le llegó el pedido a su teléfono» — no le llegó
nada.** Medido en el mismo minuto: **0 intenciones, 0 notificaciones, el tipo
NO EXISTE en `cat_notificacion_tipos` y `crear_solicitud_autorizacion` no
encola.** *No falló el envío: no hay maquinaria de envío* — y la familia SÍ
tiene push token, lo que lo vuelve peor: el canal está vivo y nadie lo usa.
**⇒ D-815 (🔴).** *El vet se queda parado esperando algo que nadie pidió.*

⚠️ **Residuo:** solicitud `d70658e0…` en `pendiente` — **expira sola a los 10'**
(§7bis, perezosa). No se toca.

### 🔴 PENDIENTE, en orden
1. **`+vet2` (paseo-only)** — perdió `ATENDER` **y** «Registrar atención».
   **Es consecuencia de firma, no bug.** *Lo que hay que mirar es cómo se VE
   ese vacío:* **la ausencia de la TAB está firmada y no se explica**
   (`LAMINA_BARRA_DE_TRES` §2), **pero el BOTÓN que desapareció no está
   cubierto por esa letra** — *una tab que nunca existió y un botón que se fue
   no son el mismo silencio.* **Si queda mudo, es hallazgo de VOZ.**
3. **El wizard con `duenodes`** (vendedor puro) — ejercita **D-799 completo**,
   incluido «crear mi negocio» como peldaño 0, y el alta que antes no podía
   completarse.
4. **El destape en FRAMES con la luz al 7 %** (D-801 curada, sin verificar en
   frames todavía). Método: captura en ráfaga con `adb exec-out screencap`;
   **no hay `ffmpeg` en esta máquina**.
5. **OJO TRANSVERSAL en cada pantalla: la entrada escalonada.** `Entrada` fue
   **reimplementada** (`9d5f13e4`, B) y es el portador de toda la casa. *«Se
   ve igual» es exactamente lo que solo un teléfono confirma.* **Si algo entra
   seco o con salto, es la reimplementación y es de B.**

**Reportar SIEMPRE con ficha, captura y DUEÑO** — pieza → B · pantalla → C/D ·
motor → A.

---

## 2 · ESTADO OPERATIVO

- 🚂 **EL TREN SALIÓ. OTA vigente del PRESTADOR:
  `536fd59c-301f-4a5c-a923-aa0be33be4e9`** · ancla **`b10dd4ef`** ·
  runtime 1.0.5 · canal `preview`.
  **Verificado del OBJETO (`update:view --json`): `gitCommitHash` = el sha
  declarado, `dirty: None`.**
  ✅ **Publicado desde WORKTREE DETACHED sobre el sha** — la candidata de la
  regla 82, **ejercida y entregando el ancla exacta**. Úsese siempre.
- ⚠️ **EL CLIENTE NO SE PUBLICÓ, y es decisión declarada.** Sigue en
  `3743c536` / runtime 1.0.3. Las piezas COMPARTIDAS que cambiaron para el
  prestador (`Entrada` reimplementada, `Baldosa`) **le entrarían sin gate**.
  *No está olvidado: está esperando su propio ojo.*
- **Migraciones: 313 en disco = 313 local = 313 remoto**, cero deriva
  (medido parseando el JSON, no con un grep que devolvía 0).
- **EL APARATO: `ANDROID_SERIAL=R5CY201ZDVL`**, entrega ABIERTA (§6bis-A).
  🔴 **SESIÓN ACTUAL: `demovet`** (se entró desde `duenotodo` — declarado).
  **Al cambiarla, declarar antes y después.**
  ⚙️ **`animator_duration_scale` quedó en `1.0`** (lo puso A; era `null`).
- **Credenciales: el MAPA, jamás la clave.**
  `security find-generic-password -a siembra -s epetplace-siembra-s97 -w` ·
  `-a pin -s epetplace-dispositivo-s97 -w`. Matriz:
  `docs/relevamientos/2026-08-13-s97a-matriz-cuentas-prueba.md`.
- **Cuentas útiles, medidas:** `demovet` = Clínica Aurora, **11 servicios que
  agrupan en DOS oficios** (veterinaria + estética) ⇒ **dos baldosas es
  CORRECTO** *(la versión previa de esta línea decía «3 oficios» y era
  imprecisa: contaba servicios, no oficios)* · `duenotodo` **1 oficio** (no sirve para columnas)
  · `duenodes` vendedor puro · `+vet2` paseo-only.
- **Residuo declarado y DEJADO a propósito:** cita hoy 16:30 (Thor · Consulta
  General · con llegada) en `duenotodo` — es la fila cargada del gate.
- **Migraciones de A hoy:** `20260814100000` … **`20260814210000`** (11),
  todas con reversa ANTES en `scripts/s97/`, cinturón con discriminador y
  76(g) declarada. Las tres del cierre: **`190000`** la banda del día ·
  **`200000`** la llegada al atender · **`210000`** la corrección del
  comentario que afirmaba una FK inexistente (D-812).
- ⚠️ **`packages/api` y `packages/domain` quedaron SIN `node_modules`**: tenían
  **symlinks autorreferentes** (`node_modules -> node_modules`) que hacían
  ELOOP y **rompían `pnpm install` del repo entero**. Los quité; `pnpm install`
  ahora pide purgar y **NO lo hice: es piso compartido con dos pistas
  trabajando**. Las otras cinco están intactas, así que nadie más está
  bloqueado, y `tsc` corre por el binario raíz
  (`../../node_modules/.bin/tsc --noEmit -p tsconfig.json`). **Recuperación
  cuando haya TTY o acuerdo: `CI=true pnpm install`.**

---

## 2bis · 🔴 INCIDENTE DE SEGURIDAD DECLARADO (S97-A, 14-ago)

**Al leer `cron.job.command` para diagnosticar D-816, A imprimió en claro el
`x-despacho-secret`** (el secreto compartido de D-713) en la salida de su
terminal. **El anon key que va al lado es público —viaja en el bundle—; el
secreto de despacho NO.**

- **No se escribió en ningún archivo ni commit.** Se declara acá porque *si no
  queda escrito ahora no lo escribe nadie*.
- ⚠️ **RECOMENDADO: rotar `x-despacho-secret`** y actualizar los tres crons que
  lo mandan (`despachar-notificaciones-tick`, `despachar-push-tick`,
  `barrer-storage-tick`).
- **La cura del 401 se hizo copiando el header DENTRO de SQL**, sin que ningún
  valor volviera a pasar por la salida — así se toca ese comando de ahora en
  más.

> **Precedente exacto: D-712** — *los artefactos de una auditoría de seguridad
> son un vector nuevo.* Es la segunda vez que esta casa lo paga con la misma
> forma: **mirar un secreto para diagnosticar es exponerlo.**

---

## 3 · ✅ EL FRENO CERRÓ — los literales llegaron y están depositados

**Los cinco dictados del gate de `ATENDER` viven VERBATIM en
`LA_CASA_DEL_PRESTADOR` §6bis**, con las dos firmas posteriores adentro.
**Veredicto global: GUSTÓ; las baldosas quedaron firmadas en dispositivo.**

| # | Dictado | Dónde vive | Ficha |
|---|---|---|---|
| ① | el «Llegó» **muere** | §6bis + **§2.3bis** (redefine el rol) | **D-807** · **D-810** |
| ② | dashboard, *«si está en 0 se muestra en 0»* | §6bis | **D-808** |
| ③ | la baldosa: dato vivo **o silencio** | §6bis | **D-809** |
| ④ | la pizarra como **Hoja** | §6bis | (dentro de D-810) |
| ⑤ | el Negocio a rectángulos | §6bis | sin ficha — **en vuelo por C** |

🔴 **① NO ERA UNA MEJORA DE PANTALLA: era firma que redefine la recepción.**
*Antes marcaba llegadas; ahora DISTRIBUYE* — asigna las citas del local que no
tienen persona. **Y su motor ya estaba entero** (§2.3bis: cuatro piezas de
S78/S90, con 3 citas vivas en ese estado). **Falta la pantalla y nada más.**

### 🔴 Lo que SIGUE sin literal — se PIDE, no se deduce

**D-811** (el alta de mascota duplicada entre cliente y mostrador) llegó **sin
el texto del founder**. La ficha está depositada con la clase del hallazgo —
que es lo que más vale— **y su literal marcado como faltante.**

> **L-142 · regla 76b, cobrada dos veces hoy:** una mejora transcrita de
> memoria deja de ser el dictado del founder; **una regla resumida es peor,
> porque su valor está en la formulación exacta.**

---

## 4 · LO QUE QUEDA VIVO Y NO ES DE A

- **D-806 ✅ CAMBIÓ DE FORMA Y SU MITAD DE MOTOR ESTÁ HECHA (A).** *No eran
  seis glifos: eran seis fotos que ya existían* — el bucket `especies-razas`
  tiene sus **6 genéricos de especie** desde S90-C. **La pregunta de arte se
  DISUELVE: no hay nada que dibujar.** La **ESCALERA** subió a `packages/api`
  (`caraDeMascota` / `caraDeMascotaPorRuta`) y `cara-mascota.ts` del cliente
  pasó a re-export, **sin tocar a sus 10+ consumidores**. 🔴 **Confirmado con
  el ojo en dispositivo: las seis especies muestran LA MISMA huella.**
  ⇒ **Queda el CABLEADO en el alta — territorio C, cero assets, cero gate de
  ícono.**
- **D-813** (la baldosa elegida: **borde teal, relleno magenta** — medido al
  píxel) → **B**. *La pieza nació para el cliente, donde los dos tokens
  coinciden, y ahí el acoplamiento es invisible.*
- **D-802 hija:** el espejo `prestadores.nombre_comercial` **muere cuando
  `v_prestadores_publicos` lea el nombre desde la cuenta comercial**. Toca el
  frente del cliente — otro territorio, otro gate.
- **El mostrador solo registra VETERINARIA** (declarado por C, es S86 con más
  superficie ofreciéndolo). **La mesa no lo adjudicó: espera la captura.**
- **D-788** (el DESPUÉS del vendedor: cuándo cobra — sin letra) · **D-792**
  cerrada · **D-799** curada por C · **D-801/D-803/D-804/D-805** cerradas.

### 🔴 LO DE NOTIFICACIONES (S97-A, cerrado el mismo día que se encontró)

- **D-816 ✅ CURADA — todas las notificaciones estuvieron muertas por un header
  que faltaba.** El cron de `despachar-correo` mandaba el secreto y **no
  `Authorization`** ⇒ **401 en todos sus ticks**. Y ese edge **no es el
  transporte de email: es EL ORQUESTADOR** (llama `despachar_notificaciones`).
  Con él caído nada salía de `nacida` y el push corría sobre una cola vacía
  devolviendo `200 · entregadas: 0`. **Al primer tick sano la cola se vació
  sola: 34 → 0, con 21 descartadas por vigencia.**
  ⚠️ **La ficha nació con una causa FALSA** (*«motor sin puerta»*): mi censo
  fue `grep … | head -8` sobre un resultado de **13 líneas con el caller en la
  12**. *Un `head` puesto por brevedad es un filtro con opinión.*
- **D-817 ✅ el guard** — `scripts/verify-cola-notificaciones.mjs`, mide **la
  EDAD de la `nacida` más vieja, no el tamaño**. Probado **en rojo** (sonda de
  90 min → exit 1), residuo 0. **Su tercer brazo NO se ejercitó** y está
  declarado.
- **D-815 SIGUE ABIERTA a propósito.** El motor encola bien y **el cierre es un
  handshake real desde el aparato con la push llegando** — §6bis-B puro, y lo
  único que A no puede firmar sola (L-153).

---

## 5 · REGLAS NUEVAS DEPOSITADAS HOY (leerlas antes de operar)

- **`METODO` §6bis-A** — la entrega del dispositivo ABIERTA a las pistas, con
  el mapa de credenciales y las tres reglas (identidad antes de censar · cero
  captura fuera de nuestras apps · el cambio de sesión se declara antes y
  después).
- **`METODO` §6bis-B** — **Code camina antes que el founder.**
- **`CONTRATO` regla 80, enmienda S97** — **el gate es por LOTE**, con
  **captura obligatoria por pantalla** como contrapartida. *L-153 intacta.*
- **`DIRECCION_ARTE` §13** — **EL NORTE (N1–N10)**, con la **escala de la
  CEREMONIA** (~3000 ms se logran **abriendo pausas, jamás estirando
  gestos**) y el overshoot **fuera de candidata**.
- **`LA_CASA_DEL_PRESTADOR` v2** — la barra por capacidad · **§3.1 la frontera
  del HOY** (el contador gobierna) · **§4.3bis UN NOMBRE, UNA PUERTA**.

---

## 6 · TRAMPAS MEDIDAS HOY — no se re-descubren

1. **El árbol es UNO para las tres pistas.** Un `tsc` rojo puede ser WIP
   ajeno. **Medir antes de diagnosticar «está roto»** — pasó en las dos
   direcciones el mismo día (A leyó `verify-diseno.mjs` de B a medio escribir;
   B leyó `equipo.ts` de A).
2. 🔴 **HEAD PUEDE MOVERSE ENTRE TU PUSH Y TU BUNDLE.** Pasó hoy: publiqué y
   el ancla salió un commit adelante. *Esta vez sumó; podría haber restado.*
   **La candidata de la regla 82 —publicar desde WORKTREE DETACHED sobre el
   sha declarado— está EJERCIDA y funciona** (se usó en el Lote 1, EAS estampa
   el commit correcto). **Usala cuando el árbol no esté en cero.**
3. **`eas-cli` SIEMPRE desde `apps/<app>/`**, aunque solo estés mirando.
4. **Un `RAISE` como rollback aborta la MIGRACIÓN entera** — sirve para
   fixtures sueltos, no adentro de una migración que tiene que quedar.
5. **Un guard de trigger NO va `SECURITY DEFINER`** si compara
   `current_user`: adentro de un DEFINER es el DUEÑO, no la sesión — **el
   guard queda decorativo.** El que funciona (`_prestadores_protege_columnas`,
   D-389) es INVOKER.
6. **Un test que pregunta «¿hubo excepción?» no distingue «escribió» de «la
   RLS lo filtró a 0 filas».** **Medir el VALOR.**
7. **No redirigir la salida de `gen:types`** (L-192 en primera persona) ni
   leer el exit de un `| head`/`| tail` (L-191).
8. **`adb exec-out screencap` devuelve 0 BYTES de vez en cuando.** Un PNG
   vacío se lee como pantalla negra ⇒ **verificar tamaño antes de concluir**.
   *Reportar «la pantalla está en negro» por una captura vacía es un hallazgo
   inventado.*
9. **`adb shell input text` CORTA EN EL PRIMER ESPACIO** («Sonda S97A» entró
   como «Sonda»). Sin espacios, o `%s`.
10. **Un campo a `y<250` puede estar tapado por el encabezado**: el tap no
   falla, entra en otro lado. Scrollear al tope antes de tipear.
11. **NO SE NAVEGA A CIEGAS EN EL APARATO.** Un swipe desde abajo abrió la
   bandeja del sistema y terminé capturando Ajustes de USB — **fuera de
   nuestras apps, que §6bis-A prohíbe**. Se entra por `am start` con deep
   link. *(Las capturas ajenas se borraron.)*
12. **Los nombres de tabla NO se adivinan:** `familias`→**`familia`**,
   `eventos`→ es la de COMUNIDAD, la del expediente es **`eventos_mascota`**,
   `solicitudes_mostrador`→**`solicitud_autorizacion_mostrador`**. *Tres
   abortos seguidos por suponer un plural.*
13. **El CLI `db query`: un archivo = UNA transacción**, y hay que correrlo
   **desde la raíz del repo** (si no: `Cannot find project ref`).

---

## 7 · LA LECCIÓN QUE CORONA LA JORNADA

> ***Seis defectos reales, ninguno encontrado por un instrumento.***
> **«Mis gates no fallaron — miden lo que ya sabemos nombrar, y hoy todo lo
> que apareció era algo que todavía no sabíamos nombrar.»** (B)

**Un gate mide lo que alguien YA SUPO NOMBRAR. Un defecto nuevo todavía no
tiene nombre, y por eso ningún gate lo espera.**
**Los instrumentos son la memoria de la casa; el ojo es su capacidad de
aprender.**

**Y su corolario operativo, medido con las dos plataformas el mismo día:**

> **El verde de una plataforma no viaja a la otra — pero tampoco el rojo.**
> Lo que hay que medir en las dos es **la geometría DELEGADA**: quien no
> declara su tamaño y lo hereda. *Donde la pieza declara lo suyo, las dos
> coinciden.* ⇒ *«probar en las dos plataformas»* no escala; **«probar en las
> dos LO QUE NO ESTÁ DECLARADO»** sí.
