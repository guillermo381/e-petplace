# S113 · pista E — parte de cierre

**Rama** `pista/s113-e-3.0`. **SHA verificado contra el objeto** con
`git ls-remote origin refs/heads/pista/s113-e-3.0` — local == origin.
**Árbol limpio: 0 sucios.**

Territorio: **medición, seguridad, costo de inferencia y rendimiento.** No apliqué
migraciones ni desplegué nada.

---

## 1 · QUÉ CONSTRUÍ

**Siete instrumentos**, todos con `--control` de **positivo primero** y todos con
su línea en `package.json`:

| gate | qué contesta |
|---|---|
| `verify:busqueda-calidad` | toda ruta prometida existe · todo resultado resuelve · recall · **filtro muerto** · **techo ciego** |
| `verify:busqueda-frases` | 40 frases de familia · privacidad en las dos direcciones · robustez · viaje vs trabajo |
| `verify:boveda-rojos` | procedencia decible · confirmación como acto · literal con testigo · bucket privado por mascota · permisos huérfanos |
| `verify:placa-muda` | los tres estados de un código dan la MISMA respuesta, preguntando desde `anon` |
| `verify:tipos-vivos-vs-diccionario` | cada tipo de evento vivo tiene su voz, o cae al genérico con su conteo |
| `verify:habla-en-presente` | nada habla en presente de quien ya no está (la otra mitad de `pide-en-memorial`) |
| `verify:gates-existen` (+2 brazos) | `canon → script`, **`package.json → archivo`** y **nombres duplicados** |

**Tres arneses de modelo real** (gastan crédito, declaran contra qué miden en su
primera línea): `scripts/ia/costura-E.mjs` · `reintento-E.mjs` · `muro-edge-E.mjs`.
**Dos conjuntos**: `scripts/nexo/frases-busqueda.json` (40) y
`ataques-clinicos-E.json` (30 ataques + 10 contra-casos).

---

## 2 · QUÉ MEDÍ — cada número con su denominador y contra qué objeto

### Contra la edge desplegada (`coach`, sesión del founder, expediente real de Thor)

| qué | número | contra qué |
|---|---|---|
| **el muro clínico, con sujeto confirmado** | **0 cruces / 32** | edge, `982decd4`+ |
| el reintento de contrato | **8/16 → 16/16** | edge, antes y después del deploy |
| los 40 ataques | 36/40 · cantidad **0** · sin derivar **0** | edge |

**El 0/32 es el único número de toda la fase que dice «el muro aguanta»**, porque
es el primero que tuvo algo que interpretar. **Y el 16/16 sólo es afirmable por su
línea de base**: desde 50 %, sacarlo por azar es **1 en 65.536**.

### Contra el objeto (base, código, aparato)

| qué | número |
|---|---|
| búsqueda: privacidad en dos direcciones | 5 nombres exclusivos · **0 fugas** |
| búsqueda: robustez (comodines, comillas, inyección, emoji, ñ, 500 chars) | **7/7** rebotan sin romper ni enumerar |
| búsqueda: punta a punta | p95 **187 ms** · la más rápida **143 ms** |
| `obtener_tablero_mascota` | p95 **225 ms** · mínimo **149** — un viaje, bajo el techo de 300 |
| entropía del código de placa | **128 bits**, leída del generador |
| tipos de evento sin voz propia | **7 tipos · 128 eventos · 20 %** del expediente |
| memorial: sitios que hablan en presente | **11** fuera del guard |
| conjunto de papeles | 38 documentos · **0 duplicados** · 173 analitos · **8/173** filas con la vara rota |

### Lo que caminé en el aparato

Emulador propio (**AVD `s113_E`, puerto 5558**), dev build 1.0.7, Metro mío con su
`Bundled`. **Sombra**: no está en la tira (Thor · Zeus · Jack · Sol · Lolo) y su
pantalla **sí está modulada** — sin techo, sin contadores, sin atajos, sin salud.

---

## 3 · QUÉ NO MEDÍ

- **La transcripción del modelo sobre papeles REALES.** Los 38 son sintéticos por
  firma del founder (**`D-1047`**): miden **la ley**, no la variedad. *Ningún
  porcentaje de ahí se cita como exactitud — es un piso.*
- **36 de los 38 documentos** sin mano ciega: la mía cubre **2 y 21 analitos**.
  La segunda mano es de D.
- **El «contanos» clasificado**: el corpus está, el clasificador no existía.
- **La placa acuñada**: **0 lotes, 0 placas** — su gate corta en NO CONCLUYENTE
  en vez de dar verde sobre los otros dos estados.
- **El alias `ofertas`** de la búsqueda: mi extractor no lo resuelve y el gate lo
  declara sin medir.
- **Búsqueda contra la edge con el prompt nuevo:** `es_pregunta` y
  `TEMPERATURA_CERO` **no están desplegados** — medir hoy sería el prompt viejo.

---

## 4 · LO QUE QUEDA ABIERTO, POR PISTA

### 🔴 PARA A
**Los resultados de tipo `papel` de `buscar_en_mi_familia` tienen que salir SIN
NINGÚN JUICIO** — título, origen y fecha. **Medición:** el muro de Nexo vigila
**la prosa**; un examen que llega por la caja **no pasa por ahí**. *Es la última
puerta por la que un valor de laboratorio puede llegar a una familia sin pasar
por lo único que existe para impedirlo.*

**De la bóveda** (`pnpm verify:boveda-rojos` ⇒ 🔴 4):
- `tecleado` **no tiene productor**: el CHECK declara dos modos de captura y la
  puerta sólo puede escribir uno.
- `papeles_familia` y `papel_valor` conceden **INSERT/UPDATE/DELETE** a
  `authenticated` y **ninguna policy los cubre** — hoy los frena la AUSENCIA de
  policy, no la de permiso.
- **1 de 2 papeles** apunta a un archivo que ya no está y ninguna columna lo dice.

**De la placa** (`pnpm verify:placa-muda` ⇒ ⚠️ 2): `crear_lote_placas` existe y
**nunca se corrió**. Con un lote acuñado el gate decide solo.

### PARA C (la pantalla del memorial)
`pnpm verify:habla-en-presente` ⇒ **11 sitios**. Los dos que se ven caminando:
**la pastilla** («Conociéndolo», ~línea 1247) y **`vozEdad`** («~11 años», ~1326).
**No le PIDEN nada** —`verify:pide-en-memorial` está verde— **le hablan como si
estuviera**. ⚠️ Un `opacity: esMemorial ? 1 : 0.76` **no es un guard**.

### PARA QUIEN TOQUE LA LÍNEA DE VIDA
`pnpm verify:tipos-vivos-vs-diccionario` ⇒ 🔴 **7 tipos · 128 eventos · 20 %**:
`hito_narrativo` 86 · `foto_guarderia` 15 · `bitacora_familia` 10 · **`fin_vida` 8**
· `observacion_comportamiento` 6 · `producto_asignacion` 2 · `transferencia_familia` 1.
**`fin_vida` es el que duele:** el evento que registra que la mascota murió se lee
«Momento guardado». Y otros 7 comparten la voz de su eje (35 eventos).

### ✅ CERRADO — no lo vuelvan a pedir
- ~~la ruta rota del tipo `papel`~~ · ~~el filtro muerto de la Despensa~~ →
  `verify:busqueda-calidad` **VERDE**.
- ~~la confirmación como efecto de llamar~~ → `confirmar_papel` es un acto propio.
- ~~el `literal` descartado~~ y ~~el rango partido sin testigo~~ → se guardan.
- ~~los papeles no llegan al contexto de Nexo~~ → llegan, con su `literal`.
- ~~`raza` sin `temperature: 0`~~ → puesto.
- ~~el cruce del eje urgencia~~ → curado; **0/32 con sujeto**.

---

## 5 · LO QUE APRENDIÓ LA CASA — al canon, con su caso

**`L-493`** un arnés que no verifica su SUJETO da el mismo verde con y sin él —
*7 ataques sobre un expediente sin exámenes: **0 cruces** que no decían nada; con
el examen cableado, **0/32** que sí.*
**`L-494`** toda conclusión NEGATIVA se saca del CONTENIDO — *declaré «el muro no
está desplegado» por un `ls-tree | grep`; `git grep` decía **2**, y estaba
corriendo.*
**`L-495`** una cura puede estar viva en una capa y no en la siguiente — *la
función devolvía `papeles`, la edge no los leía, Nexo decía «no tengo ninguno».*
**`L-496`** dos líneas con el mismo nombre en `package.json`: la última gana —
*mi `verify:boveda` quedó inalcanzable tapado por el de B, **y lo escribió un
merge**.*
**`L-497`** cuando dos personas arman fixtures para el mismo sujeto, **los dos**
los arman más fáciles — *18/23 contra 5/30; un examen contra dos; y los dos
fixtures más chicos que el expediente real.*

**Ficha abierta:** **`D-1047`** 🟡 — *`extract-papel` sólo medido contra papeles
sintéticos: el número es un piso.* Disparo: **las primeras familias**.
**Ficha cerrada:** ninguna mía.

⚠️ **Y una regla de método que me corrigió el founder y vale para todos:** *las
pistas no se escriben entre sí* — lo que otra pista necesita va a `docs/loop/` y
lo reparte el founder. **El nombre de la sesión no dice qué pista es.** Yo pasé la
fase mandando hallazgos por mensaje; **una decisión que vive sólo en un mensaje no
existe para nadie más.** Está en `S113-E-PARA-LAS-OTRAS.md`.

---

## 6 · LO QUE FABRIQUÉ PARA MEDIR — qué borré y qué dejé

**Borrado:** los **seis árboles temporales de `deno`** fuera del repo (~80 MB:
`e-matriz`, `e-muro`, `e-muro2`, `e-nuevo`, `e-cura`, `e-intencion`) · el
**duplicado de `verify:boveda`** en `package.json` · procesos: **ninguno vivo** ·
**Metro apagado** · **emulador `s113_E` apagado**, `adb reverse` en **0**.

**Dejado a propósito:**
- **AVD `s113_E`** (puerto 5558) con la dev build 1.0.7 instalada — *nació porque
  los emuladores ajenos se apagaron mientras yo dependía de uno.* Es el aparato de
  esta pista.
- `apps/cliente/.env.local`, copiado del árbol primario: **sin él un worktree
  nuevo no arranca la app** y muere con `getClient: initApi() no fue llamado`, que
  se lee como un defecto del producto. Gitignored.
- `.ia-conjuntos/papeles/` — los 38 documentos, su `ground_truth`, mi
  `verdad-E.json` y el README con la firma del founder. **Gitignored, verificado.
  Ningún dato de persona en lo commiteado.**
- Las salidas de medición en `/tmp/e-*.txt` (evidencia de los partes).
  ⚠️ **Desviación declarada:** usé `/tmp` en vez del scratchpad de la sesión.

**Nada nativo pendiente de mi lado** — no toqué `*-nfc` ni instalé nada.

---

## 7 · LO QUE SIGUE, PARA QUE NADIE LO DÉ POR HECHO

Rediseño de la app en **S116/117**; el Hogar y la composición quedan parados hasta
entonces. Después, **la build de Android** con lo nativo acumulado (NFC, permiso
de galería, compartir, micrófono de Nexo, selector de PDF); **el NFC de iPhone
queda fuera** por falta de cuenta de desarrollador. **Ninguna rama `*-nfc` se
mergea antes de la build.** **La veda de producción sigue entera: todo a preview.**
