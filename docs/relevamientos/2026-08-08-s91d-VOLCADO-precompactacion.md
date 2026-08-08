# S91-D · VOLCADO PRE-COMPACTACIÓN — 8-ago-2026

> **Para el D que despierte después: no tenés mi memoria. Tenés este archivo y
> el repo.** Todo lo de acá se leyó del objeto hoy. Donde digo «medido» hay un
> comando o una ruta con línea; donde no puedo probar algo, lo digo.
>
> **Lo primero, para no perder tiempo:** tu rama tiene UN commit sin mergear
> (`b8539505`) y `origin/main` avanzó mientras trabajabas — **traé main antes
> de tocar nada**, porque el chip que necesitás ya llegó ahí.

---

## ① LA TANDA EN VUELO — la 2ª pasada del gate, punto por punto

El founder aprobó la ESTRUCTURA; esto es letra fina. Llegó como un 🔴 nuevo
(el acuario) + diez de afinación numeradas por la mesa.

### 🔴 EL ACUARIO MEZCLABA VOCABULARIOS — **CURADO PARCIAL**, y la causa medida importa

**Commit `b8539505`.** El archivo: `apps/cliente/src/app/(tabs)/hogar/bitacora.tsx`,
en `gruposVocabulario` (~línea 190).

**LO QUE SE SOSPECHABA Y ES FALSO — literal de lo medido:**

- **NO hay seed viejo, NI lista inline, NI caché.**
  `grep -rn "Ladra\|ladra" apps packages --include='*.ts' --include='*.tsx'` → **cero**.
- **El catálogo de conductas ya está universalizado.** La fila es
  `ladridos_excesivos | nombre_familia = «Hizo más ruido de lo normal»`. Su
  columna `nombre` dice **«Vocalización aumentada»** (la voz técnica del
  prestador). **Ninguna columna dice «Ladra».**
- **Sus `sujetos_aplicables` están BIEN puestos:**
  `agua_turbia`, `comieron_todos`, `habitante_no_bien` → `{acuario}` / `{pez}` ·
  `ladridos_excesivos`, `convivio_bien` → `{individuo}` / `{perro,gato,conejo,roedor,ave}`.
  Conductas que ve un acuario hoy: **3** (`... where especies_aplicables @> array['pez'] and sujetos_aplicables @> array['acuario']`).

**LA CAUSA REAL — es el OTRO catálogo del MISMO wrapper:**

`packages/api/src/wrappers/adiestramiento-bitacora.ts`, `obtenerVocabularioBitacora`:
- líneas **119-124**: filtra `cat_conductas_bitacora` por `especie` y por `sujeto`
  (`.contains('especies_aplicables',[…])` / `.contains('sujetos_aplicables',[…])`). **Correcto.**
- líneas **127-131**: trae `cat_objetivos_adiestramiento` **SIN NINGÚN FILTRO**.

**Y no es un olvido del wrapper: ese catálogo no tiene por dónde filtrar.** Sus
columnas medidas son `codigo · nombre · descripcion · orden_display · activo ·
pais_codigo · es_seed_preliminar · nombre_familia · nombre_familia_en ·
created_at · updated_at` — **ninguna de especie ni de sujeto**. Sus **23 filas
activas** caían enteras sobre cualquier sujeto. `junto = «Camina pegado a tu
paso»` es lo que el founder leyó como «Camina junto a ti».

**LO CURADO:** los grupos de adiestramiento no se componen cuando
`sujetoActivo === 'acuario'` (`sujeto` viene de `MascotaResumen`, que A ya sirve).

**LO QUE NO CIERRA, y hay que decirlo:** un **gato sin programa de
adiestramiento sigue viendo objetivos**. La cura completa es dar aplicabilidad
al catálogo de objetivos (columnas + seed) — **es DB, va a A**. El día que
llegue, **esta condición de pantalla se retira**: el filtro vuelve a la puerta
única, que es donde el propio wrapper dice (líneas 105-113) que tiene que vivir.

### Los diez de afinación

| # | qué pidió la mesa | estado | dónde / qué falta |
|---|---|---|---|
| **1** | El elegido se ve VERDE, debe ser MAGENTA | **HECHO** — ver hash del volcado | **La mesa corrigió mi lectura y tenía razón: era el selector de ESPECIE, no el de raza** (mi `G4-pata.png` mostraba el de raza en magenta, y por eso no reproducía). Causa medida en `packages/ui/src/components/SelectorEspecie.tsx`: la tile elegida (`conCapa`) daba fondo `capaBg.identidad` y borde `capa.identidad` — **verdeVital, `rgba(43,232,107,0.15)` leído del DOM**. Venía de la espec S45 («la elección escala por el BORDE de capa»), que tenía sentido con la ficha vacía. Ahora usa `capaBg.comunidad` + `accent.control` — **el mismo tinte que `SelectorOpcion` con `acento="control"`**, así los dos selectores del alta se marcan igual. Memorial degrada solo (Ley 8 intacta) |
| **2** | Usar el chip de «Mis paseos», no el relleno entero | **NO ARRANCADO — desbloqueado** | `ChipEntidad` **ya está en `origin/main`** (`packages/ui/src/components/ChipEntidad.tsx`) pero **tu rama todavía no lo tiene: `git merge origin/main` primero**. Ver §② para su contrato |
| **3** | «Así lo vas a ver» + «Ahora no» en el camino de galería | **NO ARRANCADO** | `apps/cliente/src/components/alta/PasoFoto.tsx`. El preview YA se monta en los dos caminos (cura G5, commit `69398b50`) — falta igualar el ACABADO y que «Ahora no» se lea siempre como salida |
| **4** | Falta la flecha › del CTA de la Hoja de completar | **NO ARRANCADO** | `apps/cliente/src/components/alta/PasoCierre.tsx`, el `Boton` de `alta.modalCompletar` |
| **5** 🔴 | La Hoja de raza se traba al borrar: la lista tapa el campo | **NO ARRANCADO** | `apps/cliente/src/components/editar-raza-hoja.tsx`. La Hoja usa `altura="completa"`; el contenido no está en `HojaScroll` y no hay `EvitaTeclado`. **Ése es el primer lugar a mirar** |
| **6** | La cara de galería no llega a la tile del Hogar | **NO ARRANCADO** | La regla vive en `apps/cliente/src/lib/cara-mascota.ts` (`caraDeMascota`). El perfil ya la consume; **falta el Hogar** — `apps/cliente/src/app/(tabs)/hogar/index.tsx` y la ficha de mascota. `MascotaResumen` trae `foto_url`, `especie` y `sujeto` pero **NO `raza`** ⇒ sin raza no hay slug: o se resuelve al genérico de especie, o se le pide `raza` a A |
| **7** | Documentos quedó sin glifo | **NO ARRANCADO** | `apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx`, la sección de papeles (~línea 1059, el `onPress={() => setDocsAbiertos(...)}`) |
| **8** | «Al día» vs el badge «1» | **MEDIDO · FIRMADO · NO CONSTRUIDO** | La medición está abajo. **La mesa firmó las DOS mitades juntas: la pastilla se NOMBRA («Cuidado al día») Y el perfil muestra su propia cuenta de pendientes al lado** («N por resolver» o similar — la voz va como propuesta al gate). Las dos verdades conviven a la vista, ninguna se esconde. **Es trabajo pendiente, no una decisión pendiente** |
| **9** | Doble puerta de la bitácora | **HECHO** — `b8539505` | La tarjeta suelta murió; queda la de Su historia (letra P4) |
| **10** | «Contanos» es voseo | **HECHO** — `b8539505` | `alta`/`perfil.bitacoraEntrada` = «Cuéntanos algo de {{nombre}}» + subtítulo firmado por la mesa |

**A8, el literal medido — SON DOS VERDADES DISTINTAS, ninguna miente:**

- **La pastilla del perfil** (`«Al día»`): `apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx:514`, `calcularVozHogar({tieneEmergenciaActiva, vacunasTotal, ultimaVacunaAplicada, proximaVacuna, ultimaAtencionCerrada})`. **Es el estado del CUIDADO.**
- **El badge del header**: `apps/cliente/src/app/(tabs)/hogar/index.tsx:1030`,
  `pendientesDe = (id) => filasReco.filter(f => f.mascotaId === id).length`. Sus
  filas son `sol-` (solicitudes de mostrador), `pre-` (presupuestos) y `coord-`
  (citas por coordinar). **Son ACCIONES PENDIENTES del dueño.**

⇒ Thor puede estar al día en su cuidado **y** tener una acción esperando.
**Ninguna miente: falta que la voz las distinga.**

**FIRMADO por la mesa (8-ago) — las dos mitades, no una:** la pastilla se
**nombra** («Cuidado al día») **y** el perfil muestra **su propia cuenta de
pendientes junto a ella**. La voz de esa cuenta («N por resolver» o similar) va
como propuesta al gate. **Las dos verdades conviven a la vista, ninguna se
esconde.** El número ya está computado: `pendientesDe(mascota.id)` vive en
`hogar/index.tsx:1030` — para el perfil hay que traer las mismas tres fuentes
(`sol-` · `pre-` · `coord-`) o subir ese cómputo a una lib compartida, que es lo
que evita que las dos pantallas cuenten distinto.

---

## ② LO QUE ESPERA DE OTROS

### De B — **YA LLEGÓ, consumilo** (verificado en `origin/main` hoy)

`packages/ui/src/components/ChipEntidad.tsx`. Contrato literal:

```ts
export type ChipEntidadTamano = 'compacto' | 'general'   // 44 / 56 de alto
export type ChipEntidadSujeto = 'mascota' | 'persona' | 'cosa'
export interface ChipEntidadProps {
  nombre: string
  fotoUrl?: string
  sujeto?: ChipEntidadSujeto   // default 'mascota'
  tamano?: ChipEntidadTamano   // default 'compacto'
  elegido: boolean
  onPress: () => void
}
```

**Para el selector de raza, orden de mesa literal:** `sujeto="cosa"` (inicial,
**SIN huella** — «una pata sobre una raza diría que es un animal»),
`tamano="general"`, **el ancho lo pone tu grilla**. D-691 (nombres largos)
muere ahí: dos líneas con tope. **No clones nada** — la copia vieja de
`FiltroMascotas` ya murió.

⚠️ **Tu rama todavía no lo tiene** (`ls packages/ui/src/components/ChipEntidad.tsx` → no existe).
**`git merge origin/main` primero.**

### Del founder, por relay

- **La cuarta conducta del acuario** se siembra. **El fixture pasa de 3 a 4
  chips** — y por eso **mi verify afirma POR SECCIÓN y no por conteo**: no se
  rompe con el cambio. **Cero conteos hardcodeados** (orden vigente).
- **El subtítulo de la puerta** ya bajó y está aplicado: *«Lo que ves en casa
  completa su expediente y ayuda a cuidarlo mejor»*. Si el founder dicta otra
  letra, es una línea en los dos diccionarios.

### De A

- **Aplicabilidad en `cat_objetivos_adiestramiento`** (columnas
  `especies_aplicables` / `sujetos_aplicables` + seed) — cierra el 🔴 del
  acuario **de verdad** y retira mi condición de pantalla.
- **`raza` en `MascotaResumen`** — SOLO si se decide curar el punto 6 con la
  cara de la raza; con el genérico de especie no hace falta. *(La mesa avisó
  que `MascotaResumen` no trae `origen` a propósito: no pedir campos sin caso.)*

---

## ③ LOS CONTRATOS QUE CONSUMO, Y LAS REGLAS QUE NO SE VIOLAN

### Wrappers (todos ya en `origin/main`)

| pieza | ruta | nota |
|---|---|---|
| `obtenerPerfilMascota` | `packages/api/src/wrappers/perfilMascota.ts:115` | su `select` (línea ~128) trae **`origen · sujeto · tipo_agua · fecha_montaje`**. `IdentidadMascota` los declara |
| `actualizarRazaMascota` | `perfilMascota.ts:339` | `(mascotaId, raza: string \| null)` |
| `registrarPesoMascota` · `obtenerHistoriaPeso` | `packages/api/src/wrappers/salud.ts:98` y `:136` | la serie con `PesoDeLaSerie {peso_kg, fecha, metodo, de_prestador}` |
| `obtenerRazasDeEspecie` | `packages/api/src/wrappers/catalogos.ts:81` | `RazaCatalogo {slug, nombre, ruta_imagen}`. ⚠️ `cat_razas` concede SELECT **solo a `authenticated`** |
| `obtenerVocabularioBitacora` | `adiestramiento-bitacora.ts:101` | filtro `{especie, sujeto}`; ver el 🔴 de §① |
| `obtenerBitacora` | `adiestramiento-bitacora.ts:220` | **el `mascotaId` es OBLIGATORIO pasarlo** — sin él devuelve toda la familia (fue el G1) |

### Las reglas que NO se violan — cada una costó algo

1. **La raza JAMÁS se valida contra el catálogo** (letra S59). Es texto libre y
   la RPC lo respeta. Forzarla mataría el mestizo con nombre propio y la raza
   que el catálogo no tiene. **El cinturón del motor rebota, y con razón.**
2. **La composición del acuario va ARRIBA** (§6). En
   `[mascotaId].tsx` es la constante **`monta`**: `{comoEstaHoy, hechos,
   vacunas, vitales}`. **Declararla no es componer** — ver §⑤.
3. **UNA sola puerta de bitácora**, en Su historia (letra P4).
4. **El escaparate va en los DOS caminos de foto** — `PreviewSuperficies`
   (`apps/cliente/src/components/EncuadreFoto.tsx`), un componente y dos fuentes
   de imagen. Sus `cx/cy/z` son `SharedValue<number>` (las previews viven en el
   UI thread): para la galería se pasan constantes envueltas con `useSharedValue`.
5. **El slug NUNCA se deriva del texto tipeado** (`lib/cara-mascota.ts`):
   acertaría a veces y traería la cara de otra raza, que es peor que el genérico.
6. **La degradación del hito no se toca**: una clave que el bundle no conozca
   cae al genérico. Un bundle viejo no puede inventarle voz a un hito nuevo.

---

## ④ LOS VERIFICADORES

Los tres necesitan el dev server: `cd apps/cliente && npx expo start --web --port 8082`.
Los tres **crean cuentas desechables y las borran al final** (residuo 0 verificado).

| script | qué prueba |
|---|---|
| `scripts/verify-perfil-mascota-s91.mjs` | **los TRES sujetos del gate** (perro con raza y origen · gato · acuario). **Afirma POR SECCIÓN — es el que discrimina**: si las ausencias del acuario se resolvieran con `if` sueltos, alguna se le colaría y esto lo diría. **17/17 al cierre** |
| `scripts/verify-alta-mascota-web-s91.mjs` | el alta punta a punta con el **contraste pez↔perro** adentro: un smoke que solo probara el perro habría dado verde con la cláusula del pez sin construir. **26/26** |
| `scripts/verify-hito-voces-s91.mjs` | las tres voces del hito por camino real. Su discriminador: los casos ① y ② se dan de alta con la MISMA pantalla y solo cambia la **precisión** de la fecha |

**Truco del arnés que vas a necesitar:** RN-web deja las pantallas anteriores
montadas y sus botones interceptan el click de la de adelante. Los tres verify
usan un helper `tocar()` que elige el candidato que está **arriba en su propio
centro** (`document.elementFromPoint`) — no depende del orden del DOM. Y el alta
se recorre **por URL** (`/onboarding/cierre?...`): «URL-reconstruible» es una
propiedad declarada de la pieza, así que probarla por ahí **la ejerce**.

**Capturas de referencia** en `scripts/capturas/`:
`s91d-gate-G2-tiles.png` (las seis especies con su cara, sin fondo verde) ·
`G3-filtra.png` (53 chips → 10 con «lab») · `G4-pata.png` (**el chip elegido en
MAGENTA con la pata** — el que contradice el punto 1) · `G5-escaparate.png` ·
`G6-perfil.png` · `s91d-perfil-{perro,gato,acuario}.png`.

---

## ⑤ LAS TRAMPAS QUE YA PISÉ — no las repitas

1. **La captura prematura.** Medí el perfil 3,5 s después de aterrizar y leí
   `perro/generico.webp`; con **6 s** da `perro/labrador-retriever.webp`. **El
   catálogo de 44 filas tarda.** Reporté un falso rojo por eso. *(Y describe
   algo real: hay una ventana de carga genérico→raza. El founder la conoce y
   **no se cura salvo que él la firme como defecto**.)*
2. **El `update id` del pie de Cuenta, ANTES de diagnosticar** (L-160). En G7
   perdí un rodeo entero midiendo el motor cuando el hito **sí se emitía**
   (`llego_a_la_familia` a las 14:32 y 14:34, medido en DB): lo que no tenía el
   dispositivo era el bundle con el mapeo.
3. **EL TERCER JACK NO SE BORRA.** Hay **dos** «Jack»: el del gate (borrado) y
   `9a6ba106` del **20-jul**, `origen=alta_asistida`, familia de Guillo, dueño
   `guillo381+9` — **nació por el MOSTRADOR de un prestador**. Una orden que
   dice «borrá a Jack» y un nombre repetido es el error fácil. **Verificá
   `origen` y `created_at` antes de borrar cualquier cosa.**
4. **DECLARAR LA COMPOSICIÓN NO ES COMPONER.** Escribí la constante `monta` con
   su comentario y **no la cablé**: las secciones seguían montándose solas y el
   acuario mostraba «Peso» y «Vacunas». **Lo cazó mi propio assert por sección**
   — uno que dijera «el perfil del acuario carga» habría dado verde.
5. **`main` avanza mientras trabajás.** Cablé `origen` con un cast de rojo
   honesto y A lo había servido **23 minutos después de que mi rama partiera**.
   **Traé main antes de construir andamio.**
6. **El shell se come los backticks** en los mensajes de commit (`git commit -m
   "... \`foo\` ..."` pierde el literal). Me pasó dos veces. **Usá `-F <archivo>`.**
7. **L-191, el exit del pipe.** `npx tsc ... | head` devuelve el exit del `head`.
   Leé `$?` del comando, no del pipe.

---

## ⑥ EL ESTADO DEL REPO

- **Rama:** `pista/s91-d` · **punta:** `b8539505` · **árbol LIMPIO** (`git status --porcelain` → 0).
- **Worktree:** `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s91-D`.
- **Mergeado a `origin/main`** (verificado con `git merge-base --is-ancestor`):
  `bccdc4fc` · `47930fa1` · `14f5daf9` · `529f9fa1` · `69398b50` · `97b9737e` · `7c00dfaa`.
- **SIN mergear — lo único que A todavía no tiene:** **`b8539505`**
  (el 🔴 del acuario + A9 + A10).
- **Verificación al cierre:** typecheck `apps/cliente` · `apps/prestador` ·
  `packages/ui` **los tres en 0** · `verify:diseno` **VERDE 25/25**.
- **Datos:** cero cuentas `s91d-*` vivas, cero mascotas de prueba mías, cero
  eventos huérfanos. **El Jack del mostrador (`9a6ba106`) intacto.**

**El próximo evento** es el gate del founder sobre el id que publique A.

**EL TRABAJO QUE SIGUE, en el orden en que lo dejo:** **5🔴** (la Hoja trabada)
· **3** · **4** · **6** · **7** · **2** (con `ChipEntidad`, tras traer main) ·
**8** (las dos mitades ya firmadas). **Y la regla que gobierna todo esto sigue
vigente: el publish sale UNA sola vez, completo — declarar la tanda entera con
capturas es la puerta.** No pidas veda por partes.
