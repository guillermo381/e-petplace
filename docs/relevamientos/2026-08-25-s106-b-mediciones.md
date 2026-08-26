# S106-B · MEDICIONES DEL PRIMER TURNO — telemedicina, el quinto oficio

> **Pista B** (`packages/ui` + jueces/instrumentos) · worktree
> `e-petplace-s106-b`, rama `pista/s106-b`, nacida de `main` en `09def031`.
> **25-ago-2026. CERO CÓDIGO en este turno — todo es censo.**
>
> **Ley que rige la lectura:** cada afirmación de acá abajo trae **su objeto y
> su comando**. Donde no pude medir, lo digo — no lo estimo (L-192: una
> verificación cuyo modo de falla es el silencio no es una verificación).

---

## ⓪ · EL PASO CERO, con sus números

| | |
|---|---|
| **Worktree** | `../e-petplace-s106-b` creado desde `main` **limpio** (`git status --porcelain` vacío) y **sincronizado** (`HEAD` = `origin/main` = `09def031`) |
| **Rama** | `pista/s106-b` · a origin con el primer commit, verificada **por SHA** (`git ls-remote` contra `git rev-parse`) |
| **Lecturas** | `LETRA_TELEMEDICINA.md` **entera, incluido el freno de depósito** · skill `epetplace-design-system` · `DIRECCION_ARTE` §6ter/§6sexies/§2/§7 · `S105-A-ACTA-CIERRE.md` · CLAUDE.md |

### 🔴 `node_modules` — NO estoy enganchado al primario, y no por la razón habitual

```
cd apps/cliente/node_modules/@epetplace/ui && pwd -P
→ NO EXISTE apps/cliente/node_modules/@epetplace/ui
→ NO HAY node_modules en la raíz del worktree
```

**El worktree nace SIN `node_modules` de ninguna clase.** El primario sí lo
tiene, y ahí el symlink resuelve a **su propio** `packages/ui`:

```
/Users/…/e-petplace/packages/ui        (primario)
apps/cliente/node_modules/@epetplace/api -> ../../../../packages/api   (relativo)
```

**Consecuencia operativa declarada, no supuesta:**
- Los symlinks son **relativos**, así que al instalar en mi worktree apuntarán
  a **mi** `packages/ui`. No hay riesgo de escribir el primario por esa vía.
- **Hoy `tsc` no corre en mi worktree** (sin deps). No bloquea este turno
  —es censo— pero **es precondición de la tanda 1**: instalar antes de tocar
  una línea.
- 🟢 **Y un hallazgo que ahorra:** **`verify:diseno` corre SIN `node_modules`**
  — es node puro. Medido corriéndolo acá: `VERDE (auto-prueba: 57 reglas
  encendieron; informativas declaradas: R9)`. **El juez de B-M5 se puede
  construir y probar antes de instalar nada.**

### Nota de conteo de reglas (contra el objeto, no contra la prosa)

| medición | valor | comando |
|---|---|---|
| reglas **en el registro** | **58** (máx `R66`) | `node -e` sobre `const REGLAS = {…}` |
| reglas **que encendieron** | **57** | salida real de `node scripts/verify-diseno.mjs` |
| números **ausentes** del registro | `R19 R21 R22 R23 R26 R28 R31 R61` | ídem |

La diferencia 58/57 **está explicada y no es una discrepancia**: `R9` está
declarada informativa. **El acta de S105 dice 57 y coincide con la salida del
instrumento** — el número exigible es el que imprime el objeto.
**El número `R-` libre se mide por grep al momento de nacer, no ahora** (L-141);
lo que queda registrado hoy es que **`R66` es el más alto vivo**.

---

## B-M1 · LA MARCA VISIBLE (§7 de la letra)

> §7: *«la teleconsulta deposita en la historia clínica y en el Bio-Expediente
> exactamente igual que una presencial, y lleva la marca de haber sido atendida
> por teleconsulta. La marca es VISIBLE para el dueño.»*

### ① Qué piezas dibujan el registro clínico — censadas por sus imports reales

**Comando:** `perl -0777` extrayendo el bloque `import { … } from '@epetplace/ui'`
de cada superficie.

| superficie | app | piezas de `@epetplace/ui` que monta |
|---|---|---|
| `(tabs)/hogar/index.tsx` · `hogar/paseos.tsx` · `hogar/mascota/[mascotaId].tsx` | cliente | **`LineaDeVida`** (los tres) |
| `parte/[eventoId].tsx` — **el detalle del evento** | cliente | `Encabezado` · `Tarjeta` · **`FilaDato`** · **`Insignia`** · `Celda` · `CeldaNavegacion` · `Hoja`/`HojaScroll` · `Texto` · `Separador` · `Boton` |
| `(tabs)/hogar/veterinaria.tsx` — el log del oficio | cliente | **`FilaCita`** · `Icono` · `Celda` · `Texto` |
| `veterinaria/consulta/[citaId].tsx` — la nota clínica | prestador | `Campo` · `SelectorSegmentado` · `SelectorOpcion` · `MarcaDeAgua` · `EsperaDeMarca` · `Insignia` · `Icono` · `Tarjeta` · `Texto` |
| `veterinaria/cita/[citaId].tsx` | prestador | `AvatarMascota` · `Insignia` · `Icono` · `MarcaDeAgua` · `Tarjeta` · `Texto` |

**🔴 Hallazgo estructural: `LineaDeVida` NO se monta en el prestador.**
Medido (`grep -rln "LineaDeVida"`): sus consumidores son **4 pantallas, las
cuatro del cliente**. Coincide con §7 —la marca es *«visible para el dueño»*—
pero **hay que decirlo al revés para que nadie lo asuma: marcar el timeline NO
marca nada en la superficie del prestador**, que lee por otras piezas.

### ② Dónde CABRÍA la marca — la anatomía real del nodo, leída del código

`LineaDeVida.tsx:280-308`, el nodo dibuja en este orden:

1. **título** ← `DICCIONARIO[item.tipo]` (cerrado, adentro de la pieza — Ley 3)
2. **`con {item.titulo_fuente}`** ← *el QUIÉN* (el prestador)
3. **hora mono** (omitida si `fecha_sola`)
4. **miniaturas**
5. **acordeón** (`detalleDe`, slot `ReactNode` del caller)

**El nodo ya dice el QUIÉN y no dice el CÓMO.** La marca de teleconsulta es
exactamente un CÓMO, y su lugar natural es esa segunda línea o el título.

**Y hay un precedente medido de cómo la casa metió un dato nuevo en un nodo sin
componente nuevo:** `vacuna_nombre` — *«Recibió la vacuna {nombre}»*
(`LineaDeVida.tsx:100-107`, campo propio en `LineaDeVidaItem:179`). **Se
resolvió por VOZ, no por elemento.**

### ③ 🔴 EL HALLAZGO QUE DECIDE ESTA MEDICIÓN: la casa NUNCA marcó modalidad en el expediente

Antes de declarar Ley 11 apliqué §6ter de `DIRECCION_ARTE` —*«esta clase no se
inventó: se nombró, y es lo que la hace barata»*— y busqué el caso vivo más
cercano: **el grooming a domicilio** (S61, D-392: *«la cita PORTA su
modalidad»*). Es la misma clase exacta: **una propiedad del ACTO, no del
sujeto.**

**Cómo se dibuja hoy la modalidad, medido:**

```
apps/prestador/…/grooming/cita/[citaId]/index.tsx:392
  {cita.modalidad === 'domicilio' && <SeccionDireccion direccion={cita.direccion} />}

apps/cliente/…/explorar/grooming/index.tsx:83,505
  useState<ModalidadGrooming>('local')   ·   etiqueta={t('grooming.modalidadDomicilio')}
```

⇒ **En el prestador la modalidad es una SECCIÓN CONDICIONAL (la dirección), no
una marca. En el cliente es una ELECCIÓN PREVIA (un chip de `SelectorOpcion`),
no una marca del acto ocurrido.** Y en `LineaDeVida` el diccionario tiene **un
solo** `atencion_grooming_registrada` → *«Grooming»* · capa cuidado: **sin
modalidad**.

> ### **Un grooming a domicilio y uno en local dejan el MISMO rastro en el expediente. La casa nunca tuvo que decir CÓMO se prestó un servicio.**
> Por eso §7 **no es «nombrar lo que ya regía»** como fue la marca de mapa: es
> **capacidad nueva**. Y por eso conviene decidirla una vez y bien — porque el
> día que se decida, **el domicilio es su segundo consumidor gratis**.

### ④ ¿Alcanza el sistema o falta componente (Ley 11)? — LAS DOS VÍAS, sin elegir

**No me toca elegir y no elijo.** Declaro las dos con su costo medido:

**(a) POR VOZ — cero componente nuevo.** La marca vive en el `tipo`/la voz del
diccionario y en la línea del prestador. Precedente exacto: `vacuna_nombre`.
**Costo: una clave de riel + una entrada de diccionario en `LineaDeVida`.**
Depende de que el motor (A) distinga el `tipo` o traiga un campo.
⚠️ Su límite honesto: una voz **no sobrevive al barrido visual** — el dueño que
escanea su expediente lee títulos, y *«Consulta»* y *«Consulta por
videollamada»* se parecen demasiado a los tres años que §7 invoca.

**(b) POR MARCA VISUAL — y acá SÍ falta pieza.** Medí las familias de
`Insignia` (`Insignia.tsx:40-66`, discriminated union):

| familia | valores | ¿sirve? |
|---|---|---|
| `estado` | `alDia · atencion · proximo · info` | **No** — describe la SITUACIÓN del sujeto |
| `capa` | `vida · cuidado · comunidad · comunidadAmplia` | **No** — es el eje del expediente |
| `distincion` | `cohorte` | **No** — es PERTENENCIA de una persona |

⇒ **«cómo se prestó el acto» no existe como familia.** La vía (b) exige **o**
una cuarta familia de `Insignia` **o** un glifo b′ nuevo — y un glifo nuevo
arrastra el proceso completo: hoja de contacto §6b (2-3 variantes con riesgo
declarado), montaje a 21px junto a 5 del registry, **gate del founder POR
ÍCONO** (§2.9). *No es caro por capricho: es el proceso que la casa ya firmó.*

**🟢 Y un argumento DE LEY a favor de (b), que no es gusto:** Ley 12 enmendada
S71 — *«el glifo marca lo que VARÍA dentro de la unidad de barrido»*. En una
Línea de Vida donde la mayoría de las consultas serán presenciales, **la
teleconsulta es justamente lo que varía** ⇒ ahí un glifo **informa** en vez de
decorar. La misma ley que suele matar glifos, acá lo justifica.

**Lo que NO cambia en ninguna de las dos vías:** el diccionario de `LineaDeVida`
es **cerrado y vive adentro de la pieza** (Ley 3) ⇒ **toda marca en el timeline
toca `packages/ui`, o sea territorio B.**

---

## B-M2 · EL AVISO §3 — ¿existe patrón de aviso BLOQUEANTE con tres acciones?

### ① Lo que NO sirve, medido

**`useAviso`/`Aviso` queda descartado, y con número** (`Aviso.tsx`):

```
:45   accion?: { etiqueta: string; onPress: () => void }   ← UNA sola acción
:99   const duracion = aviso.accion ? 6000 : DURACION[…]   ← AUTO-CIERRE
:108  cola.current.push(aviso)   // UNO a la vez — jamás apilados
```

⇒ **es efímero (3-6 s) y de una acción.** Un deslinde que se va solo a los seis
segundos no es un deslinde. **Descartado por medición, no por criterio.**

### ② 🟢 EL PRECEDENTE VIVO EXISTE — y son exactamente TRES acciones

`packages/ui/src/components/SelectorAvatar.tsx:214-229`:

```tsx
<Hoja visible={hojaAbierta} onCerrar={…} titulo={…}>
  <Celda interactiva onPress={tomarFoto}        accessibilityRole="button" … />
  <Celda interactiva onPress={elegirDeGaleria}  accessibilityRole="button" … />
  <Celda interactiva onPress={cerrar}           accessibilityRole="button" … />  ← "Por ahora no"
</Hoja>
```

Y su propio comentario, línea 32: *«las tres acciones de la Hoja son Celdas
navegables»*.

> ### **La casa YA tiene tres caminos en una Hoja, y su anatomía es CELDA, no botón.**

**Esto disuelve el choque aparente entre la letra y el diccionario.** La letra
escribe `[ Ir a urgencias ] · [ Reservar cita presencial ] · [ Continuar ]` —
**corchetes de mesa, que dicen QUÉ acciones existen, no con qué anatomía se
dibujan.** Las leyes dicen la anatomía, y ya tienen respuesta para tres.

### ③ Y el patrón binario también está firmado, para que no se confunda

**`D-484` ✅ PAGADA (S99-B)**, leída de la ficha: *«primario + SECUNDARIO,
jamás primario + ghost. 19.7 prohíbe el contorno transparente como acción de
FILA, y el pie de una Hoja no es una fila.»*

Y el slot `pie` de `Hoja` (`Hoja.tsx:138-144`) lo dice con todas las letras:

> ⛔ *«**dos botones compitiendo.** Rige 19.7: por superficie UN sólido; lo
> secundario baja a label. Un pie con dos cajas llenas obliga a elegir dos
> veces.»*

⇒ **Tres botones sólidos al pie serían ilegales.** Tres **celdas** no lo son.
**El patrón existe; lo que falta es una decisión de producto, no una pieza.**

---

## B-M3 · RE-MEDICIÓN DEL CERO DE TRANSPORTE (L-141 — no se cita, se re-mide)

> La letra §182-183 cita *mi* medición de S105. **Se re-mide.** Y esta vez con
> el alcance declarado, que es lo que a la anterior le faltaba.

**Comando exacto:**
```bash
grep -ri "webrtc\|livekit\|daily\|agora\|twilio\|jitsi\|100ms\|vonage\|stream-video" <ámbito>
```
**Condición favorable declarada:** este worktree **no tiene `node_modules`**,
así que el barrido es sobre **código versionado por construcción** — no por
suerte ni por un `--exclude` que se pueda olvidar.

| ámbito | hits | veredicto |
|---|---|---|
| **todo el árbol** | **108** | ⚠️ ver abajo — **el número crudo asusta y no dice nada** |
| `apps/` + `packages/` + `supabase/` (+`scripts/`) | **12 líneas** | **TODOS falsos positivos** (detalle abajo) |
| **todo `package.json`** (dependencia declarada) | **0** | 🟢 |
| **`pnpm-lock.yaml`** | **0** | 🟢 |

**Los 12 de producto, uno por uno — ninguno es transporte:**

| dónde | qué es |
|---|---|
| `apps/prestador/src/i18n/en.ts:2383` | `"your **daily** orders"` — inglés |
| `packages/api/src/database.types.ts:547,565,583` | `avg_**daily**_steps` — columna del wearable |
| `scripts/s92/salida/b0-grants-columna.json` ×4 | la misma columna en un volcado |
| `supabase/config.toml:288-294` | el bloque **de fábrica** de Supabase para SMS (`twilio`, `vonage`) — sección `auth.sms`, con `auth_token = "env(…)"` por sustitución. **Config de plantilla, no telemedicina y no un secreto en el repo** |

### 🟢 VEREDICTO: el cero se sostiene. **CERO transporte de video en código de producto, cero en manifiestos, cero en el lockfile.**

### ⚠️ Y dos precisiones que la medición de S105 no traía

**① Los 108 hits viven casi todos en `.agents/skills/` (33 archivos).** Y entre
ellos hay uno que la mesa querrá saber: **está instalada la skill `fishjam`** —
la plataforma WebRTC hosted de Software Mansion, **con SDK de React
Native/Expo** documentado (`react-native-client`, `rtcview`,
`picture-in-picture`, `foreground-service`, `callkit`, `screen-sharing`).
**No es una dependencia ni código: es documentación instalada.** Lo declaro
como **insumo para la mesa de §9** —quien decida el transporte tiene una
referencia de primera mano en el repo—, **jamás como una decisión tomada.**

**② `ClipSesion` NO es transporte, y ahora está probado en vez de afirmado:**

```
packages/ui/src/components/ClipSesion.tsx:33  import { VideoView, useVideoPlayer } from 'expo-video'
                                        :97  const player = useVideoPlayer(uri, …)
```
**`useVideoPlayer(uri)` = playback de un archivo por URI.** Cero captura, cero
peer connection, cero señalización. **Es exactamente lo que la letra dice que
es.**

**Precisión sobre §9 que conviene tener a mano:** *«el video es módulo nativo y
no viaja por OTA»* es cierto **para el transporte**; el **playback** ya viaja —
`expo-video ~57.0.1` está declarado en **`packages/ui`, `apps/cliente` y
`apps/prestador`**. Lo que falta no es «video»: es **transporte**.

---

## B-M4 · INVENTARIO PARA UN PRE-JOIN Y UNA IN-CALL MÍNIMA

> Sin diseñar. Qué sirve · qué falta · qué cuesta.

### ① 🟢 Lo que YA existe y sirve tal cual

| pieza | para qué, en esta pantalla |
|---|---|
| **`Cronometro`** | el tiempo de la consulta. **Corre por DIFERENCIA contra un `inicioTs` del server** y `pausadoEnMs` lo congela — hecho para exactamente esto |
| **`CitaEnVivo`** | el envoltorio de «en curso» (Ley 7: glow dark / anillo+pill claro, **UNO por pantalla**, voz única `ui.citaEnVivo`) |
| **`EsperaDeMarca`** | la única espera legal >2 s (Ley 13). *«Conectando»* es su caso de manual |
| **`AvatarMascota`** · **`LogoNegocio`** | quién está del otro lado |
| **`Hoja`** (+`pie`) | el pre-join como superficie que se abre sobre la cita |
| **`Boton`** (`destructivo` tonal) | colgar — y la ley ya dice **tonal, «nunca coral sólido»** |
| **`EstadoVacio`** · `GateRoto`/`PantallaCaida` (locales del prestador) | la falla que HABLA (Ley 13 + L-178) |

### ② 🟢 El precedente de captura que nadie esperaba encontrar

**`apps/prestador/src/app/adiestramiento/clips.tsx`** ya monta una superficie de
cámara viva:

```
:24   import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera'
:146  const cam = permisoCamara?.granted ? permisoCamara : await pedirCamara();
:147  const mic = permisoMic?.granted  ? permisoMic  : await pedirMic();
:209  <CameraView … mode="video" facing="back" />
```

⇒ **El prestador ya pide permiso de cámara Y de micrófono, y ya dibuja un
preview a pantalla con controles al pie.** Es la anatomía más cercana que
existe a un pre-join. **Es pantalla LOCAL del prestador, no vive en
`packages/ui`** — si la casa la quiere en las dos apps, es promoción, y **D-645
rige: una promoción NO es una migración** (dejar el código viejo vivo es el
defecto medido cuatro veces en un día).

### ③ 🔴 La asimetría que cambia el costo: **el cliente NO tiene `expo-camera`**

Medido en los manifiestos:

| paquete | `expo-camera` | `expo-video` |
|---|---|---|
| `apps/prestador` | **`~57.0.2`** ✅ | `~57.0.1` |
| `apps/cliente` | **ausente** ❌ | `~57.0.1` |
| `packages/ui` | ausente | `~57.0.1` |

El cliente captura por **`expo-image-picker`** (`capturaFoto.tsx:177-188`,
`launchCameraAsync`), que **abre la cámara del SISTEMA** — no da preview
embebido.

> ⇒ **Un pre-join con preview de cámara en el CLIENTE exige `expo-camera` nuevo
> en `apps/cliente`: módulo nativo ⇒ BUILD, no OTA.** Esto **refuerza §9 y le
> agrega precisión**: el tren de build no lo pide solo el transporte — lo pide
> también el preview del lado de la familia.

### ④ 🔴 Lo que FALTA, por Ley 11 — y no es una pieza, son tres

1. **La superficie del video remoto** — el «lienzo» donde se pinta el stream.
   Nada en la casa dibuja un stream (medido en B-M3).
2. **El video propio** (el recuadro chico sobre el remoto).
3. **La barra de controles de llamada** (mute · cámara · colgar).

### ⑤ 🔴 Y una advertencia de DIRECCIÓN DE ARTE que hay que decir ANTES de dibujar

**Una pantalla de videollamada es fondo NO CONTROLADO** — igual que el mapa.
`DIRECCION_ARTE` §6ter ya resolvió esta física para su caso:

> *«A 21 px sobre fondo con textura **el trazo desaparece y solo sobrevive la
> silueta rellena de alto contraste**.»*

Y §6ter descartó explícitamente la salida fácil —ensanchar la Ley 12 a «fondo
no-controlado»— con esta razón: *«toda foto, todo gradiente y **todo póster de
video** es fondo no controlado. Una regla que no puede decir dónde termina no es
una regla.»* **La letra vieja ya nombró este caso al descartarlo.**

⇒ **Predicción declarada, no decisión:** los controles sobre video van a
necesitar **la misma física de masa**, y el camino barato es **nombrar una
clase** (como se hizo con «marca de mapa»), **jamás enmendar la Ley 12**. Se
firma cuando llegue; lo dejo escrito para que no se resuelva por reflejo.

---

## B-M5 · PROPUESTA DEL JUEZ DEL TEXTO (no construido)

> **Familia `R66`** — que es mía y de la que salgo con el molde en la mano.
> **El número `R-` se mide por grep al nacer, no ahora.**

### ① Qué verificaría, en una línea

**Que el aviso §3 que se renderiza es, carácter por carácter, el que el founder
firmó** — porque la letra lo pide con esas palabras: *«No se resume, no se
acorta, no se convierte en una línea de letra chica.»*

### ② 🟢 La decisión de diseño que lo hace correcto: **lee la LETRA, no un baseline transcrito**

El molde de `R66` enseña justamente esto: *«NO se reimplementó acá: una segunda
copia del matcher sería el defecto que la casa nombra como una copia que diverge
sin avisar, y su modo de falla es el PEOR: funciona.»*

⇒ El juez **extrae el texto de `docs/LETRA_TELEMEDICINA.md` §3** (el blockquote)
y lo compara contra las claves del diccionario. **Un baseline transcrito sería
una tercera copia del mismo texto** — y el día que la mesa enmiende la letra,
el juez seguiría verde contra la versión vieja.

**Precedente de que se puede:** el corpus de `verify-diseno.mjs` **solo mira**
`apps/*/src` y `packages/ui/src/{components,brand}` (`RAICES`, línea 136) —
**pero la casa ya lee fuentes fuera del corpus con `readFileSync`**: `palette.ts`
(:1202), `themes/index.ts` (:1203, :1295), los diccionarios (:688) y el asset de
`R65`. **Leer un `.md` firmado es el mismo gesto.**

### ③ La forma, calcada de `R66`

```js
function rNN(archivos) {
  const fallos = [];

  // ── ANCLA ①: la FUENTE. Sin la letra no hay contra qué comparar.
  if (!existsSync(LETRA)) return { fallos: ['…'], info: 'NO CONCLUYENTE — sin la letra' };
  const firmado = extraerAviso3(readFileSync(LETRA, 'utf8'));   // el blockquote de §3
  if (!firmado) return { fallos: ['…'], info: 'NO CONCLUYENTE — §3 no se pudo extraer' };

  // ── ANCLA ②: el CORPUS. El molde exacto de R66:5458-5464.
  //    Sin el diccionario, el cero significaría «no miré», jamás «coincide».
  if (!vioDiccionario) return { fallos: ['…'], info: 'NO CONCLUYENTE — sin diccionarios' };

  // ── EL JUICIO: igualdad EXACTA (no trinquete: acá no hay «solo-baja»).
  //    Los cinco signos de §3 se cuentan aparte y son 5, ni 4 ni 3.
}
```

**Tres diferencias con `R66`, todas deliberadas:**

| | `R66` | este juez |
|---|---|---|
| forma | **trinquete solo-baja** (el voseo viejo se cura al tocarse) | **igualdad exacta** — *un deslinde no tiene versión intermedia aceptable* |
| baseline | por archivo, a la vista | **ninguno**: la vara es la letra |
| ancla | 1 (el corpus) | **2** (la letra **y** el corpus) |

**Y un brazo propio, porque es lo que la letra defiende de verdad:** **contar
los CINCO signos** (*dificultad para respirar · sangrado · convulsiones · golpe
fuerte · dolor intenso o decaimiento repentino*). La letra dice que *«los signos
concretos no son decoración»*; **cuatro signos compilan igual que cinco**, y esa
es exactamente la clase de defecto que solo un juez ve.

**Control positivo obligatorio** (patrón `FIXTURES` de `verify-diseno.mjs:1980`):
un fixture con el aviso **acortado** que debe salir ROJO. *Sin rojo producido,
el verde no prueba nada.*

### ④ 🔴 LOS DOS LÍMITES DEL INSTRUMENTO — declarados ahora, no descubiertos después

**(a) El juez cubre el TEXTO, jamás su TIPOGRAFÍA.** La letra prohíbe tres
cosas y este juez alcanza dos: *no se resume* ✅ · *no se acorta* ✅ ·
***«no se convierte en una línea de letra chica»*** ❌ — eso es **render**.
**Un aviso verbatim renderizado en `size.xs` pasaría este juez y violaría la
letra.** Esa mitad la cubre una regla de render sobre la pieza (si nace pieza) o
**el ojo del founder en dispositivo**. *Lo digo acá para que el verde de este
juez no se lea como más de lo que mide* — **L-425, que es mía: un baseline en 0
no dice «no hay», dice «no vi, con la lista de hoy».**

**(b) El inglés no tiene fuente firmada.** La letra está en español; el aviso en
`en` será una **traducción que nadie firmó**. El juez puede exigir verbatim
contra la letra **solo en español**. Para `en` hay dos salidas y las dos son de
mesa: **o el founder firma el texto inglés** (y entra como segunda vara), **o**
se acepta que ahí solo rige el `Espejo<D>` del riel i18n —que ya existe y
garantiza *paridad de claves*, no *fidelidad del contenido*—. **No lo resuelvo:
lo declaro.**

---

# 🔴 CHOQUES CONTRA LETRA — freno y aviso

> Ninguno me habilita a construir. Los cuatro son de mesa.

## 🔴 CH-1 · §3: CUÁL de las tres acciones preside — y la trampa está en la respuesta fácil

**Las leyes obligan a que haya UNA sola primaria** (19.2: *«UNO por pantalla»* ·
19.7: *«por superficie UN sólido»* · el `pie` de `Hoja`: *«dos cajas llenas
obligan a elegir dos veces»*). La letra da tres acciones y **no dice cuál
preside** — y no es un detalle de estilo:

- Si preside **«Continuar con la videoconsulta»**, la pantalla del deslinde
  **empuja hacia la videoconsulta**, que es lo contrario de para qué existe.
- Si preside **«Ir a urgencias»**, la app **empuja a irse** en el caso normal,
  que es el 95 %.

**El precedente de `SelectorAvatar` ofrece una tercera salida real: tres celdas
de peso par, sin primaria** —tres caminos, ninguno empujado—. **Es firma del
founder, no deducción de B.** *La anatomía la resuelve el precedente; la
jerarquía la firma la mesa.*

## 🔴 CH-2 · §3 vs §10.2: **mostrar un aviso y registrar un consentimiento son DOS piezas**

§10 le pregunta al abogado: *«¿el aviso de §3 alcanza como deslinde, o hace
falta consentimiento expreso registrado?»* — y **la respuesta cambia la
anatomía, no solo el backend**:

- **Una `Hoja` se cierra por swipe, backdrop, X y botón atrás** (`Hoja.tsx:118`).
  Como *aviso*, está bien: descartar = no continuar (fail-closed, gratis).
  **Como *consentimiento registrado*, no alcanza**: nadie firma algo que se
  cierra de un manotazo.

**🟢 Y la buena noticia, medida:** si el abogado pide consentimiento registrado,
**el riel ya existe** —`registrarConsentimiento(userId, tipo, urlMostrada)` en
`packages/api/src/wrappers/auth.ts:229`, nacido en S104 con `TipoConsentimiento`
y `documentosVigentes`—. **No habría que construirlo: habría que agregarle un
tipo.**

⇒ **La anatomía de §3 no se puede cerrar hasta que §10.2 tenga respuesta.**
Construir la Hoja antes es aceptar rehacerla. *Lo declaro como precondición, no
como bloqueo total: el TEXTO y su juez (B-M5) se pueden hacer igual — el texto
es el mismo en las dos salidas.*

## 🔴 CH-3 · §7 pide una capacidad que la casa NUNCA tuvo (y conviene saberlo antes de presupuestarla)

Detalle completo en **B-M1 ③**. En una línea: **no hay marca de modalidad en
ningún expediente** — el grooming a domicilio y el de local dejan rastro
idéntico. §7 **no es nombrar lo que ya regía** (§6ter): es capacidad nueva, con
su gate por ícono si va por la vía visual. **No es un choque contra la letra:
es un choque contra la expectativa de que fuera barato.**

## ⚠️ CH-4 · Nota sobre el freno de depósito de A (NO es mío, y no lo toco)

El freno al pie de la letra —**la ventana de cancelación: `≥24 h` en
`LETRA_SALDO` §3 contra `30 min` en §4**— **está bien declarado y no tengo nada
que agregarle desde `packages/ui`**. Lo registro solo por una consecuencia de
superficie: **si las dos ventanas conviven, la voz que la app le diga al dueño
al cancelar depende de qué tipo de cita es** — y esa voz es de C, con el texto
de la mesa. *No lo abro; lo dejo anotado para que no aparezca como sorpresa el
día que alguien escriba ese string.*

---

# PROPUESTA DE TERRITORIO — TANDA 1 (76h)

## Lo que reclamo como B

| ruta | por qué |
|---|---|
| `scripts/verify-diseno.mjs` | **el juez de B-M5** (familia `R66`, que es mía) |
| `packages/ui/src/components/LineaDeVida.tsx` | **el diccionario es cerrado y vive adentro** (Ley 3) ⇒ toda marca del timeline pasa por acá |
| `packages/ui/src/components/Insignia.tsx` | solo **si** la mesa elige la vía (b) — la cuarta familia |
| `packages/ui/src/components/<piezas nuevas>` | lo que nazca por Ley 11 (pre-join / in-call), **si la mesa lo dispara** |
| `packages/ui/src/i18n/{es,en}.ts` | namespace `ui` — la voz interna de las piezas |
| `packages/ui/src/index.ts` · `packages/ui/src/gallery/TokenGallery.tsx` | export + galería (método completo de Ley 11) |

## 🔴 Los tres roces que declaro AHORA para que no se descubran en un merge

**① El juez de B LEE diccionarios de C.** El texto del aviso §3 vive en
`apps/cliente/src/i18n/{es,en}.ts` — **territorio de C**. Mi juez **lo lee,
jamás lo escribe**. Consecuencia operativa: **hasta que C deposite las claves,
el juez sale NO CONCLUYENTE — nunca verde.** Eso es correcto por diseño (es el
ancla ②), pero hay que saberlo: *un rojo del juez en la tanda 1 puede significar
«C todavía no llegó», no «alguien rompió el texto».*

**② La marca del timeline depende del MOTOR (A).** `LineaDeVida` resuelve por
`item.tipo` (código crudo de `eventos_mascota.tipo`) o por un campo propio
—patrón `vacuna_nombre`—. **No puedo marcar nada hasta que A decida si la
teleconsulta es un `tipo` distinto o un campo del mismo tipo.** Mi pieza se
adapta a las dos; **la decisión no es mía y no la voy a suponer.**

**③ `clips.tsx` es del prestador (C), no mío.** Si la casa quiere su anatomía de
cámara en las dos apps, es **promoción a `packages/ui`** — y **D-645 rige: una
promoción no es una migración**, el código viejo queda vivo y nada lo señala.
**No la toco sin que la mesa la dispare.**

## Precondición operativa de mi tanda 1

**Instalar dependencias en el worktree antes de tocar `packages/ui`** (hoy no
hay `node_modules` ⇒ no hay `tsc`). **El juez de B-M5 no la necesita** — corre
en node puro, medido hoy.

## Lo que NO reclamo, explícito

Lo abierto de S105: el deploy de `pagos-web` · el guard del IVA · la puerta de
retomar · **las siete piezas no ejercidas del acta §②**. **No las toco.**
