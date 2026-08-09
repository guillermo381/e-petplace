# S91-D · VOLCADO PRE-COMPACTACIÓN — 8-ago-2026 (2ª emisión, tanda CERRADA)

> **Para el D que despierte después: no tenés mi memoria. Tenés este archivo y
> el repo.** Todo lo de acá se leyó del objeto hoy. Donde digo «medido» hay un
> comando o una ruta con línea; donde no puedo probar algo, lo digo.
>
> **Lo primero:** mi tanda está **CERRADA Y ACEPTADA por la mesa**. No hay
> trabajo de construcción esperándote en la pista D. Lo que queda abierto es de
> **otras pistas** (§②) y del **gate del founder en dispositivo** (§⑤).
>
> **Segundo, y es la trampa que más caro me salió:** `origin/main` avanza
> mientras trabajás. **Traé main antes de tocar nada.**

---

## ① MI TANDA DECLARADA — `12b3ac07`

Commit: **`12b3ac07`** · *«gate(S91-D · 2a pasada): LA TANDA DE AFINACION, Y LOS
DOS QUE NO SON MIOS»* · en `origin/pista/s91-d`.
Su declaración larga vive en
**`docs/relevamientos/2026-08-08-s91d-TANDA-A-declaracion-y-pedidos.md`**.

Las **seis curas pasaron verificación de mesa**. Punto por punto, con el
archivo y la causa — porque la causa es lo que no se puede re-derivar:

### A1 · el verde del chip elegido — `b2f67175`

`packages/ui/src/components/SelectorEspecie.tsx`. **La mesa corrigió mi lectura
y tenía razón: el verde vivía en el selector de ESPECIE, no en el de raza** (mi
captura `G4-pata.png` mostraba raza en magenta, y por eso no lo reproducía).

La causa estaba en la misma línea que yo había curado **a medias**: apagué el
relleno del tile en REPOSO cuando hay cara, y **dejé el del SELECCIONADO**, que
seguía resolviendo `capaBg.identidad` (verdeVital, `rgba(43,232,107,0.15)` leído
del DOM) con borde `capa.identidad`. Venía de la espec S45 —*la elección escala
por el borde de capa*—, que tenía sentido cuando la ficha era un catálogo sin
contenido. Hoy era **la única superficie de la app donde elegir algo no se veía
magenta**. Ahora resuelve `capaBg.comunidad` + `accent.control`: **el mismo
tinte que `SelectorOpcion` con `acento="control"`**. Memorial degrada solo.

### A2 · `ChipEntidad` consumido — `12b3ac07`

`apps/cliente/src/components/selector-de-raza.tsx`. La grilla la arma esta casa
y el chip lo pone `packages/ui`: es la letra de B al extraer la pieza (*sube el
chip, no el contenedor*).

**El ancho lo pone el contenedor, y ésa era la mitad de D-691 que me tocaba:**
`flexBasis: '47%'` es lo que le da a `numberOfLines={2}` una segunda línea que
llenar. Sin columna el chip se estira al largo de su texto y **la segunda línea
no existe nunca**, por más que la pieza la permita.

### A3 · el remate del paso de la foto — `12b3ac07`

`apps/cliente/src/components/alta/PasoFoto.tsx`. Los dos caminos terminaban
distinto: el de la foto ya ordenaba *contenido → preview → acciones*; el de
galería tenía «Elegir foto» en el **medio**. Y el preview vivía **dentro del
contenedor centrado** — su encabezado está compuesto a la izquierda, así que el
`alignItems: 'center'` de afuera lo descolocaba. **El acabado no se copió: se
compartió la disposición.** Las dos acciones cierran juntas y las dos son
`bloque`.

### A4 · la flecha del CTA — `12b3ac07`, **y trae un hallazgo**

`packages/ui/src/components/Boton.tsx` (**cruce declarado a B**, aditivo) +
`apps/cliente/src/components/alta/PasoCierre.tsx`.

`Boton` **ya dibujaba la flecha**, pero condicionada a `variante === 'acento'`.
El criterio de la casa es **E14, firmado**: *información DESPLIEGA · acción
LLEVA*. La flecha estaba atada a una **variante** cuando E14 la ata a lo que la
acción **hace** ⇒ **un primario que navega no tenía cómo decirlo**, y la única
salida era que la pantalla dibujara el path a mano — justo lo que
`packages/ui/src/components/chevron.ts` prohíbe en su cabecera (*la pieza lo
porta; la pantalla usa la pieza, jamás el path suelto*).

Cura: `chevron?: boolean`, con la línea `(chevron ?? variante === 'acento')`.
**El default no se mueve** — cero consumidor vivo cambia de dibujo.

### A5 🔴 · la Hoja de raza trabada — `12b3ac07`

`apps/cliente/src/components/editar-raza-hoja.tsx`. Faltaban las dos piezas que
el paso 2 del alta sí monta, y `altura="completa"` las volvía obligatorias: fija
el alto en 0.9 de la ventana, así que 44 chips desbordan un contenedor que no
scrollea, con el campo de tipeo tapado.

* **`HojaScroll` y no `ScrollView`**, porque estamos DENTRO de una Hoja: es la
  pieza que bloquea el pan del swipe-to-close mientras el toque nace en la lista
  (**L-132** — en web el `ScrollView` plano no delata el problema; en Android el
  arrastre cierra la Hoja).
* **`EvitaTeclado`**, porque el campo vive arriba de la lista.
* **El botón queda AFUERA del scroll a propósito:** adentro obligaría a recorrer
  las 44 razas para volver a encontrarlo después de elegir.

### El 🔴 del acuario · mi condición provisoria **RETIRADA** — `12b3ac07`

`apps/cliente/src/app/(tabs)/hogar/bitacora.tsx`, en `gruposVocabulario`.

A cerró el hueco en la puerta (migración `20260808070000`; el wrapper
`adiestramiento-bitacora.ts` ahora filtra `cat_objetivos_adiestramiento` con el
**mismo** par `especie`/`sujeto` que las conductas). **Medido antes de retirar:
`obj_acuario=0` Y `obj_gato=0`** — el cierre de A es **más ancho que mi pedido**,
porque cubre también el caso general que mi parche dejaba abierto (un gato sin
programa veía los 23 objetivos de adiestramiento canino).

**Un filtro que sobrevive a la puerta que lo hizo innecesario es una segunda
frontera esperando divergir** (Ley 37): el día que la mesa firme objetivos para
otro sujeto, la condición local los seguiría escondiendo y las dos capas
seguirían compilando.

### Lo anterior de la 2ª pasada, ya cerrado en `b8539505`

* **A9** — la tarjeta suelta de bitácora murió; queda **una sola puerta**, la de
  Su historia (letra P4).
* **A10** — «Contanos» (voseo) → **«Cuéntanos algo de {{nombre}}»** + subtítulo
  firmado: *«Lo que ves en casa completa su expediente y ayuda a cuidarlo
  mejor»*.

---

## ② LO QUE QUEDÓ FUERA DE MI TANDA — con dueño ajeno, ya en vuelo

La mesa confirmó que **las tres entregas viajaron**. No las trabajes: no son de D.

### 🔵 A6 → **A** · el lector del Hogar necesita `raza`

**Medido:** `obtenerMascotasDeFamilia`
(`packages/api/src/wrappers/onboarding.ts:284`) selecciona
`id, nombre, especie, foto_url, paseo_social_ok, talla, pelaje, estado_vida,
sujeto, tipo_agua` — **`raza` no está**, ni en el `select` ni en
`MascotaResumen` (`onboarding.ts:251`).

**Por qué bloquea de verdad:** la cara se resuelve con `caraDeMascota({especie,
razaSlug})` y **el slug NO se deriva del texto tipeado** — a veces acertaría y
traería la cara de OTRA raza. Sin `raza`, el Hogar solo puede caer al genérico
de especie, y la misma mascota se ve Labrador en su perfil y perro-cualquiera en
el Hogar. **Media cura es una inconsistencia nueva, no un avance.**

### 🟣 A7 → **B** · Documentos sin glifo (clase D-546), con gate POR ÍCONO

**Medido:** el registry no tiene glifo para *la familia de papeles* que no esté
ya tomado por sus propias filas — `documento` lo usan `historia_clinica` y
`ficha_identidad`; `carnet` lo usa `carnet_vacunas`
(`apps/cliente/src/lib/papeles.ts:45-81`). En el encabezado darían **tres
instancias del mismo glifo en una sección abierta**.
Sitio: `apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx:1282`.
Nota: `icono` es **opcional** en `CeldaNavegacion` — sin glifo hoy es legal.

### 🟠 damero → **C** · `perro/generico.webp` (disparo adelantado)

El genérico de perro **trae el damero de transparencia del editor HORNEADO en la
imagen** (bucket de galería, 10 858 B). No es artefacto de render: en la misma
pantalla, con `razaSlug=labrador-retriever` la cara sale limpia y sin raza sale
con cuadros grises. Es el camino de quien elige «Mestizo» o «No sé» y no sube
foto — **el caso más común del alta, no un borde**.
Evidencia: `scripts/capturas/s91d-A2-chipentidad-razas.png`.

### 🟡 A8 · MEDIDO · FIRMADO · **NO CONSTRUIDO** (sigue siendo de D)

**Son dos verdades distintas y ninguna miente:**

* **La pastilla del perfil** (`«Al día»`):
  `apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx:514`,
  `calcularVozHogar({tieneEmergenciaActiva, vacunasTotal, ultimaVacunaAplicada,
  proximaVacuna, ultimaAtencionCerrada})` → **estado del CUIDADO**.
* **El badge del header del Hogar**:
  `apps/cliente/src/app/(tabs)/hogar/index.tsx:1030`,
  `pendientesDe = (id) => filasReco.filter(f => f.mascotaId === id).length`, con
  filas `sol-` (mostrador) · `pre-` (presupuestos) · `coord-` (citas por
  coordinar) → **ACCIONES PENDIENTES del dueño**.

**Firmado en sus dos mitades:** la pastilla se **nombra** («Cuidado al día») **y**
el perfil muestra **su propia cuenta de pendientes al lado**. La voz de esa
cuenta va como propuesta al gate.

> **LETRA DE MESA ADOPTADA (8-ago):** quien construya A8 **sube `pendientesDe` a
> una lib compartida ANTES de que el perfil lo re-implemente**. Si cada pantalla
> lo escribe, las dos van a contar distinto tarde o temprano.

---

## ③ LOS CONTRATOS QUE CONSUMO, Y LAS REGLAS QUE NO SE VIOLAN

### Wrappers (todos en `origin/main`)

| pieza | ruta | nota |
|---|---|---|
| `obtenerPerfilMascota` | `packages/api/src/wrappers/perfilMascota.ts:115` | su `select` trae **`origen · sujeto · tipo_agua · fecha_montaje`**; `IdentidadMascota` los declara |
| `actualizarRazaMascota` | `perfilMascota.ts:339` | `(mascotaId, raza: string \| null)` |
| `registrarPesoMascota` · `obtenerHistoriaPeso` | `packages/api/src/wrappers/salud.ts:98` y `:136` | `PesoDeLaSerie {peso_kg, fecha, metodo, de_prestador}` |
| `obtenerRazasDeEspecie` | `packages/api/src/wrappers/catalogos.ts:81` | `RazaCatalogo {slug, nombre, ruta_imagen}`. ⚠️ **`cat_razas` concede SELECT solo a `authenticated`** — medido: `grant_anon=0`, `grant_auth=1` |
| `obtenerVocabularioBitacora` | `adiestramiento-bitacora.ts:101` | filtro `{especie, sujeto}` — **desde S91-A filtra los DOS catálogos** |
| `obtenerBitacora` | `adiestramiento-bitacora.ts:220` | **el `mascotaId` es OBLIGATORIO pasarlo** — sin él devuelve toda la familia (fue el G1) |
| `obtenerMascotasDeFamilia` | `onboarding.ts:278` | **sin `raza`** — ver A6 |

### Piezas de `packages/ui` que monto (jamás clonar)

```ts
// packages/ui/src/components/ChipEntidad.tsx
export interface ChipEntidadProps {
  nombre: string
  fotoUrl?: string
  sujeto?: 'mascota' | 'persona' | 'cosa'   // default 'mascota'
  tamano?: 'compacto' | 'general'           // default 'compacto' (44 / 56 de alto)
  elegido: boolean
  onPress: () => void
}
```

**El chip de raza es `ChipEntidad` con `sujeto="cosa"` y `tamano="general"`, y
el ancho lo pone MI grilla.** `cosa` porque una raza no es una mascota: sin cara
del catálogo el fallback es su **inicial**, y una huella sobre «Mestizo» diría
que ese chip ES un animal cuando es una categoría.

### Las reglas que NO se violan — cada una costó algo

1. **La raza JAMÁS se valida contra el catálogo** (letra S59). Es texto libre y
   `actualizar_raza_mascota` lo respeta. Forzarla mataría el mestizo con nombre
   propio y la raza que el catálogo no tiene. **El cinturón del motor rebota, y
   con razón.**
2. **La composición del acuario va ARRIBA** (§6). En `[mascotaId].tsx` es la
   constante **`monta`**: `{comoEstaHoy, hechos, vacunas, vitales}`. Jamás ocho
   `if` repartidos abajo. **Y declararla no es componerla** — ver §⑤.
3. **UNA sola puerta de bitácora**, en Su historia (letra P4).
4. **El escaparate va en los DOS caminos de foto** — `PreviewSuperficies`
   (`apps/cliente/src/components/EncuadreFoto.tsx:396`), un componente y dos
   fuentes de imagen. Sus `cx/cy/z` son `SharedValue<number>` (las previews
   viven en el UI thread): para la galería se pasan constantes envueltas con
   `useSharedValue`.
5. **El slug NUNCA se deriva del texto tipeado** (`apps/cliente/src/lib/cara-mascota.ts`):
   acertaría a veces y traería la cara de otra raza, que es peor que el genérico.
6. **La degradación del hito no se toca** (`apps/cliente/src/lib/voz-hecho.ts`):
   una clave que el bundle no conozca cae al genérico. Un bundle viejo no puede
   inventarle voz a un hito nuevo.
7. **La voz de precisión vive en UN solo lugar**
   (`apps/cliente/src/lib/voz-mascota.ts`: `vozEdad` · `vozNacimiento` ·
   `vozOrigen`). Dos pantallas que escriben la misma regla divergen.
8. **Los fixtures afirman por CONJUNTOS DISTINTOS, jamás por conteo.** El
   catálogo crece por firma del founder (hoy gato 20 · perro 15 · acuario 4;
   **D-692 abierta** por conejo/roedor/perro). Un assert que dice «15» hay que
   editarlo cada vez; uno que dice «perro ≠ gato ≠ ave ≠ acuario» prueba que el
   filtro filtra y no se rompe nunca. *(Y el número que te pasen puede venir mal:
   A corrigió su propia carta de 16 → 15.)*

---

## ④ LOS VERIFICADORES Y LAS CAPTURAS

Los tres verify necesitan el dev server:
`cd apps/cliente && npx expo start --web --port 8082`.
**Crean cuentas desechables y las borran al final** (residuo 0 verificado).
Se corren con `npx tsx scripts/<archivo>.mjs` e importan **`playwright-core`**
con `chromium.launch({ channel: 'chrome', headless: true })`.

| script | qué prueba |
|---|---|
| `scripts/verify-perfil-mascota-s91.mjs` | **los TRES sujetos del gate** (perro con raza y origen · gato · acuario). **Afirma POR SECCIÓN — es el que discrimina**: si las ausencias del acuario se resolvieran con `if` sueltos, alguna se colaría y esto lo diría. **17/17** |
| `scripts/verify-alta-mascota-web-s91.mjs` | el alta punta a punta con el **contraste pez↔perro** adentro: un smoke que solo probara el perro habría dado verde con la cláusula del pez sin construir. **27/27 al cierre** |
| `scripts/verify-hito-voces-s91.mjs` | las tres voces del hito por camino real. Su discriminador: los casos ① y ② se dan de alta con la MISMA pantalla y solo cambia la **precisión** de la fecha. **3/3** |
| `scripts/capturar-tanda-a-s91.mjs` | **no es verificador: es el instrumento de la captura.** Navega **por URL con params**, jamás tapeando — la etiqueta del CTA **cambia por especie** (la cláusula del pez cambia hasta el verbo), así que un capturador que tapea se cae cuando la voz se afina y su rojo no dice nada del dibujo |

**Truco del arnés que vas a necesitar:** RN-web deja las pantallas anteriores
montadas y sus botones interceptan el click de la de adelante. Los verify usan
un helper `tocar()` que elige el candidato que está **arriba en su propio
centro** (`document.elementFromPoint`) — no depende del orden del DOM. Y el alta
se recorre **por URL** (`/onboarding/raza?nombre=Zeus&especie=perro`):
«URL-reconstruible» es una propiedad declarada de la pieza, así que probarla por
ahí **la ejerce**.

**Capturas en `scripts/capturas/`, con qué prueba cada una:**

| archivo | qué prueba |
|---|---|
| `s91d-A1-especie-elegida.png` | la tile de especie elegida **en magenta**, no verde (A1) |
| `s91d-A2-chipentidad-razas.png` | la anatomía de `ChipEntidad` (inicial de `cosa`) **y el damero del genérico de perro** (hallazgo → C) |
| `s91d-A2-filtro-tres-letras.png` | el campo con «lab» — **y el límite del arnés**: sin sesión no hay catálogo |
| `s91d-A2-elegido-con-pata.png` | el elegido: **pata magenta, hundido, label en acento** |
| `s91d-A3-foto-camino-galeria.png` | el remate del camino de galería: preview a lo ancho → «Elegir una foto» → «Ahora no» (A3) |
| `s91d-gate-G2-tiles.png` | las seis especies con su cara, sin fondo verde |
| `G3-filtra.png` | 53 chips → 10 con «lab» (**con sesión**, de la pasada anterior) |
| `G4-pata.png` | el chip de RAZA en magenta — el que probó que A1 no era de esta pantalla |
| `G5-escaparate.png` · `G6-perfil.png` | el escaparate y la cara de galería en el perfil |
| `s91d-perfil-{perro,gato,acuario}.png` | los tres sujetos del gate |

---

## ⑤ LAS TRAMPAS QUE YA PISÉ — no las repitas

1. **La captura prematura.** Medí el perfil 3,5 s después de aterrizar y leí
   `perro/generico.webp`; con **6 s** da `perro/labrador-retriever.webp`. **El
   catálogo de 44 filas tarda.** Reporté un falso rojo por eso. *(Y describe algo
   real: hay una ventana de carga genérico→raza. El founder la conoce y **no se
   cura salvo que él la firme como defecto**.)*
2. **El `update id` del pie de Cuenta, ANTES de diagnosticar** (L-160). En G7
   perdí un rodeo entero midiendo el motor cuando el hito **sí se emitía**
   (`llego_a_la_familia` a las 14:32 y 14:34, medido en DB): lo que no tenía el
   dispositivo era el bundle con el mapeo.
3. **EL TERCER JACK NO SE BORRA.** Hay **dos** «Jack»: el del gate (borrado) y
   **`9a6ba106`** del **20-jul**, `origen=alta_asistida`, familia de Guillo,
   dueño `guillo381+9` — **nació por el MOSTRADOR de un prestador**. Una orden
   que dice «borrá a Jack» y un nombre repetido es el error fácil. **Verificá
   `origen` y `created_at` antes de borrar cualquier cosa.**
4. **DECLARAR LA COMPOSICIÓN NO ES COMPONER.** Escribí la constante `monta` con
   su comentario y **no la cablé**: las secciones seguían montándose solas y el
   acuario mostraba «Peso» y «Vacunas». **Lo cazó mi propio assert por sección**
   — uno que dijera «el perfil del acuario carga» habría dado verde.
5. **`main` avanza mientras trabajás.** Cablé `origen` con un cast de rojo
   honesto y A lo había servido **23 minutos después de que mi rama partiera**.
   Y en esta tanda `ChipEntidad` + la aplicabilidad de objetivos ya estaban en
   main mientras yo los daba por pendientes. **Traé main antes de construir.**
6. 🔴 **TU ARNÉS WEB NO TIENE SESIÓN, Y `cat_razas` ES SOLO-AUTENTICADO.**
   Medido: `grant_anon=0` · `grant_auth=1`. Con la lista de razas vacía **casi
   reporto «el filtro de tres letras devuelve cero» como defecto de producto** —
   era mi arnés. Consecuencia práctica: **las capturas del alta no pueden probar
   los 44 chips de raza, sus caras, ni el envolver a dos líneas de D-691.** Eso
   se juzga **en el teléfono del founder, con sesión**, y así quedó declarado.
7. 🔴 **UN LECTOR SE SONDEA COPIANDO SU `select` LITERAL — jamás preguntándole
   a su tabla.** El caso: el hub de grooming rebotaba con `42501` porque pide
   `prestadores.select('id, nombre_comercial, direccion, ciudad')` y **dos de
   esas columnas no tienen grant para `authenticated`**. Mi sonda hizo
   `count(*) from prestadores` → 6 filas, **verde**. En Postgres el `SELECT` se
   concede **POR COLUMNA**: «¿puedo leer esta tabla?» y «¿puedo correr esta
   consulta?» son preguntas distintas. A midió 5/5 verde y yo 6/6 verde sobre un
   lector roto, los dos por lo mismo.
8. 🔴 **Y su hermana: un lector medido en otro TRANSPORTE tampoco es el lector.**
   Medí por SQL con `set_config('role','authenticated')` dentro de una función
   mía; PostgREST pasa por otro rol, otro pool y exige GRANT de EXECUTE. Para
   medir de verdad: abrir la pantalla y escuchar el cable
   (`scripts/sonda-grooming-camino-real-s91.mjs`).
9. **El shell se come los backticks** en los mensajes de commit
   (`git commit -m "... \`foo\` ..."` pierde el literal). Me pasó dos veces.
   **Usá `-F <archivo>`.**
10. **L-191, el exit del pipe.** `npx tsc … | head` devuelve el exit del `head`.
   Leé `$?` **del comando**, no del pipe. Me cobró una vez esta sesión.
11. **`eas-cli` SIEMPRE desde `apps/<app>/`**, aunque solo estés mirando: desde
   la raíz scaffoldea un `app.json` stub y **el árbol sucio saca el ancla con
   asterisco**.

---

## ⑥ EL ESTADO DEL REPO

* **Worktree:** `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s91-D`.
* **Rama:** `pista/s91-d` · **punta: `12b3ac07`** · **árbol LIMPIO**
  (`git status --porcelain` → 0) · **pusheada a origin**.
* **Mergeado a `origin/main`** (verificado con `git merge-base --is-ancestor`):
  `bccdc4fc` · `47930fa1` · `14f5daf9` · `529f9fa1` · `69398b50` · `97b9737e` ·
  `7c00dfaa`.
* **SIN mergear a main — los tres que A todavía no tiene:**
  **`b8539505`** (el 🔴 del acuario + A9 + A10) ·
  **`b2f67175`** (el volcado anterior + la cura A1) ·
  **`12b3ac07`** (la tanda de afinación + esta declaración).
  *(Hay además un merge de `origin/main` en la rama, del 8-ago.)*
* **De main ya consumido:** `ChipEntidad` (`c94e1ca0` / `d3bb1115`) · la
  aplicabilidad de objetivos (`b5ccfb25`, migración `20260808070000`) · el
  vocabulario de gato y acuario (`3a740a72`, migración `20260808060000`).
* **Verificación al cierre:** typecheck `packages/ui` y `apps/cliente` **en 0** ·
  `verify:diseno` **VERDE, 25 reglas** · `verify-alta-mascota-web-s91` **27/27**.
* **Datos:** cero cuentas `s91d-*` vivas, cero mascotas de prueba mías, cero
  eventos huérfanos. **El Jack del mostrador (`9a6ba106`) intacto.**
* **Renames de A que NO me rompen nada** (grep en cero de mi lado):
  `ladridos_excesivos` → `hizo_mas_ruido` · `hizo_adentro` → `hizo_fuera_de_lugar`.

---

## ⑦ LO QUE SIGUE

**No hay construcción pendiente en la pista D.** El próximo evento es el **gate
del founder en dispositivo**, sobre el id que publique A. Adentro de ese gate va
lo que el arnés no puede ver: **los 44 chips de raza con sus caras y el envolver
a dos líneas de D-691.**

**Y la regla que gobierna: el publish sale UNA sola vez, completo.** Declarar la
tanda entera con capturas es la puerta. **No se pide veda por partes.**
