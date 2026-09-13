# S116-C · LOTE 3 — la bienvenida, el alta y el shell

> **Rama `pista/s116-c-03` · worktree `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s116-c03` · partí de `main` @ `bced0bb6`.**
> Mergeado `origin/main` @ **`5fa3599b`** (ancestría verificada: `git merge-base --is-ancestor origin/main HEAD` → sí). Todas las capturas son sobre ese árbol.
> Medido el **13-sep-2026**. Emulador propio (`s114_C`, **puerto 5578**, `adb -s` siempre — el 5566 es de B y no se tocó). Metro en **puerto 8097** desde mi worktree.

---

## ⓪ LO PRIMERO, PORQUE CAMBIA CÓMO SE LEE TODO LO DEMÁS

**El lote NO está completo.** Entraron el shell entero y **6 de las 11 pantallas**. Las 5 que faltan y por qué están en §⑥, sin maquillar. *Se dice arriba para que nadie lea el resto creyendo que cerró.*

---

## ① EL HOOK EN ROJO — curado antes de tocar el rediseño (commit `70707cfb`)

| gate | antes | después | cómo |
|---|--:|--:|---|
| `verify:razon-muda` | 140 | **138** | los dos `Boton` de `carnet.tsx` ganaron razón |
| `verify:voz-sin-hueco` | 13 | **8** | `citas:434` (1) + `autorizacion:105-106` (4) |

**Los dos baselines se asentaron EN EL MISMO COMMIT**, como los dos gates exigen.

**Las curas son de tres clases distintas y ésa es la parte que importa:**

- **`carnet.tsx`** — la razón **dice CUÁL** de las tres causas apaga el botón (ninguna / dudosas / sin confirmar). *Una voz genérica habría dejado a la persona buscando cuál — el mismo adivinar que el botón mudo producía.*
- **`citas/[mascotaId].tsx:434`** — el hueco era **INALCANZABLE**: el ternario ya garantizaba el dato y el `?? ''` existía sólo para compilar (TS no estrecha `a ?? b`). Se hizo **inexpresable** con una const. **No usé `HUECO_ACEPTADO`**: *el escape deja el `?? ''` vivo para el próximo que lo copie.*
- **`autorizacion/[solicitudId].tsx`** — acá el hueco era **REAL** (el nombre del negocio no es legible por el dueño, RLS solo-owner) y la frase salía «  quiere atender a Thor». Ganó voz propia, es y en.

🔴 **`nexo.tsx:538` NO se curó, y no es olvido:** es un **`Campo`**, no un `Boton`, y **`Campo` no tiene `razonDeshabilitado`** (medido en su fuente). Pedido a B. **Por eso el baseline bajó a 138 y no a 137.**

⚠️ **DIVERGENCIA DECLARADA:** `D-1087` asigna `citas:434` al **lote 4** por firma del 13-sep; el encargo de hoy me la dio a mí. La curé y lo anoto — *dos letras que se contradicen no se dejan conviviendo en silencio.*

---

## ② EL SHELL (commit `e713eb4c`) — lo que hace que la app parezca una sola app

| # | qué | evidencia |
|--:|---|---|
| 1 | **cinco tabs FIJAS** · `Hogar · Explorar · Despensa · Actividad · Cuenta` | `06-shell-hogar.png` |
| 2 | **las empujadas NO llevan barra** | `07-empujada-sin-barra.png` |
| 3 | **el botón del asistente reemplaza al orbe** | `06-shell-hogar.png` |
| 4 | **contador de montajes** por tab, logcat `[montajes]` + pie de Cuenta en dev | `montajes.ts` |
| 5 | **la lámina S74 pasa a `__DEV__`** | `(tabs)/cuenta/index.tsx` |

### 🔴 La quinta tab era CONDICIONAL y deja de serlo — el choque, declarado

La firma **S100c-D** decía *«aparece con el primer pedido»*, con dos razones: no ofrecer una casa vacía, y el **anti-salto** (la barra de 4→5 **re-acomoda disco y valle bajo el pulgar**, porque el ancho es `ancho / cantidad`).

**Por qué la letra §1.5 gana, y no es sólo que sea más nueva:**
1. **la premisa de aquella firma era una tab VACÍA.** Con Actividad = citas + pedidos + postventa, *toda familia con una mascota tiene actividad*: el caso que evitaba deja de existir.
2. **el salto desaparece solo** con cinco fijas ⇒ ☠️ la marca `CLAVE_YA_COMPRO` muere. *Se retira la CAUSA, no la cura.*

⚠️ **Hoy Actividad abre la pantalla de pedidos** (el encargo prohíbe montar un «próximamente») ⇒ **sin pedidos se ve una lista vacía**. Es exactamente lo que la firma vieja evitaba, y vive hasta el lote 6.
**El glifo sigue siendo `pedido`**: un glifo se firma por gate a 21 px (§2.9) y el de Actividad no existe.

### 🔴 LO QUE SE VA CON EL ORBE — cuatro funciones, declaradas

El orbe **no era sólo el asistente**. Se va con él:
1. **el carrito flotante** — 🔴 **choca contra firma del founder S100d-bis**: *«mientras tenga productos debe estar visible en TODA la app»*. Sigue alcanzable por la tab Despensa. **La mesa decide dónde vuelve.**
2. **los mensajes de adopción** y 3. **las solicitudes** (siguen en `/adoptar/solicitudes`).
4. **los cuatro atajos del coach.**

⚠️ **En memorial el orbe tenía una razón propia** —*«el carrito y los mensajes conservan su única puerta también acá»*— que este retiro **no reemplaza**.

### 🔴 El enganche `onMontaje` de B no mide lo que el encargo pide

Se dispara **en el mismo acto que `onCambiar`** (su propia cabecera lo explica) ⇒ cuenta **toques de la barra**, no montajes de pantalla. **Son dos números y los reporto separados.** El que importa para `D-1090` es el segundo: *lo que mata la app no es cambiar de tab, es apilar sin soltar*. Se deriva de la **profundidad del stack** de cada tab, que el navegador ya expone — mide las cinco sin tocar ninguna de las 106 rutas.
**Declara lo que NO ve:** rutas de nivel raíz, un `replace` dentro del mismo nivel, y la memoria.

---

## ③ LA NAVEGACIÓN, DECLARADA UNA VEZ (commit `5fc07ee4`)

En el router raíz: **empuje desde la derecha**, **gesto de volver siempre** (en Android hay que decirlo: RN lo trae apagado), **duración por token** (`motion.duration.estandar`). El modal lo resuelve `presentation` en su ruta; el cambio de tab sin transición lo resuelve el `Tabs` del shell.

⭐ **MEDIDO: ninguna pantalla traía animación propia** — cero `animation:` / `presentation:` / `gestureEnabled` fuera del router. **No hubo nada que quitar.** *Se declara porque «no había» es una medición, y no decir nada se lee igual que no haber mirado.*

---

## ④ LAS PANTALLAS — qué entró, con su captura

| # | pantalla | estado | captura |
|--:|---|---|---|
| 00 | splash | ✅ construido | ⚠️ **sin captura** — ver abajo |
| 01 | propuesta | ✅ | `01-propuesta.png` |
| 02 | beneficios | ✅ | `02-beneficios.png` · `02-beneficios-tercera.png` |
| 03 | acceso | ✅ | `03-acceso.png` |
| 05 | crear cuenta | ✅ | `05-crear-cuenta.png` |
| 10 | expediente creado | ✅ construido | ⚠️ sin captura (exige crear una mascota real) |

**00 no tiene captura y la razón ES su comportamiento correcto:** con sesión resuelta **sale en el acto**, sin esperar el ciclo de 3 s — *hacer esperar a alguien para terminar una animación es cobrarle el adorno*. Dura menos que el tiempo de captura. Para verlo hace falta cerrar sesión o red lenta; **queda para tu recorrido**.

**Lo que 00 respeta y conviene saber:** **no simula progreso** (corrección del plan §5) — la fila de personajes es el único indicador; y con **«reducir movimiento»** del sistema **nada se mueve** (misma ley que `usePresionado`, §1.11).

---

## ⑤ 🔴 LO QUE LAS CAPTURAS MOSTRARON — tres defectos, uno mío

1. **🔴 EL LOGO TIENE FONDO NEGRO HORNEADO** (`01-propuesta.png`). `LogoV5 sobre="oscuro"` monta un PNG con caja negra sobre el degradado ciruela. **Es del asset, no del montaje** — se ve un rectángulo negro alrededor de la marca, en **la primera pantalla que ve un invitado de F&F**. Dueño: B.
2. **🟠 EL BOTÓN DEL ASISTENTE TAPA CONTENIDO** (`06-shell-hogar.png`): cae sobre la tarjeta de Kira. **Es la misma crítica que la mesa le hizo al orbe** (*«tapa "Ver cómo va"»*). El orbe recibía `aireInferior={altoBarra}`; **`BotonAsistente` no tiene esa prop**. Dueño: B (la prop) + yo (montarla).
3. **🟡 «Saltar» de 02 queda muy al borde** — en la captura se solapa con el engranaje del dev menu, que **no viaja a producción**. *No afirmo que esté mal: digo que no puedo decidirlo con esta captura.* Se ve en tu recorrido.

**Y lo que las capturas confirman que funciona:** Baloo vivo en los títulos (la cura de B), el degradado de entrada, la píldora magenta con su sombra, los campos con halo de foco, la cabecera ciruela con radio inferior, **y la razón del botón apagado en 05** (`«Completa los campos…»`, la cura de `D-1086` en pantalla).

⚠️ **Los defectos del Hogar que se ven en `06-shell-hogar.png`** —la fuente mono, los círculos translúcidos, la marca de agua, las tarjetas con contorno negro, el isotipo fino— **ya están en el acta de mesa §3 y son del lote 4**. Mi lote no los tocaba.

---

## ⑥ 🔴 LO QUE NO ALCANCÉ — sin maquillar

| # | qué falta | por qué |
|--:|---|---|
| **04** | recuperar contraseña | no se tocó: es el camino de quien ya tiene cuenta, y prioricé el del invitado nuevo |
| **06** | hogar sin mascota | el estado vacío del Hogar no se recompuso |
| **07·08·09** | **el alta en 3 pasos + el carné** | **es reestructura de flujo, no piel** — ver abajo |
| — | **la cabecera nueva en TODAS las pantallas** | entró en 03 y 05; las demás siguen con `Encabezado` viejo |

### Por qué el alta no se reestructuró, con el número

Hoy son **cinco** pasos (`especie · foto · raza · historia · cierre`) y el encargo pide **tres + carné**. Fusionarlos es **reescribir tres componentes en uno y agregar uno nuevo** (el carné, que hoy vive en `carnet.tsx` con `extract-vacuna`). *El objetivo del plan es «sin dañar una sola función»; un alta a medio fusionar rompe el camino por el que hoy entra toda mascota nueva.* **Lo que sí entró del alta es 10**, su confirmación.

---

## ⑦ LOS SIETE PEDIDOS A B — `docs/loop/buzon/S116-C-lote3-para-B.md`

| # | qué | bloquea |
|--:|---|---|
| 1 | `Campo` sin `razonDeshabilitado` | cerrar `D-1086` |
| 2 | alto de `Cabecera` como constante | no |
| 3 | **Baloo no aparecía** | **ya curado por B** ✅ |
| 4 | `Texto` sin rosa sobre ciruela | el acento de 01 |
| 5 | `Boton` sin secundario sobre oscuro | el par de 01 |
| 6 | logos de Apple/Google + motor de Apple | la fila social de 03/05 |
| 7 | exportar el mapeo especie → `EspeciePersonaje` | el trío de 10 |

### 🔴 El #3 fue el hallazgo del lote, y corrigió a la mesa

El acta §3 dejó dos hipótesis (*«o el token no apunta a Baloo, o las pantallas usan token propio»*). **Medí la cadena y era una tercera:** la escala v5 existía y **nadie la consumía** — de las nueve variantes de `Texto`, sólo `antetitulo` la leía. Y **`Confirmacion.tsx:145` llevaba escrito** *«El "¡Listo!" en Baloo»* **siendo falso**: `titulo` entregaba DM Sans 300 Light. *No fallaba nada, compilaba, pasaba los tres gates — y el comentario reforzaba la creencia.* **B lo curó con `ESCALA_V5` por casa y mis pantallas lo heredaron sin cambiar una línea.**

---

## ⑧ 🔴 DOS ERRORES MÍOS, declarados

1. **Salté un gate que no había declarado.** El commit `bc5f2185` salió con `SALTAR_GATE` puesto para `D-1088`, y **ese escape salta TODOS los gates**. El hook lo dijo en su línea (*«verify:diseno ROJO»*) y lo leí después. **Los tres rojos eran míos y los tres tenían razón** (Ley 21 · N4 · R77), curados en `9a69cbab`. *La lección es del escape: un motivo declarado no acota lo que el escape apaga.*
2. **Reporté una medición falsa al buzón.** Escribí que `iniciarSesionConGoogle` tenía **cero consumidores**; **está cableado en `login.tsx:166`**. Busqué `auth-google|iniciarConGoogle|GoogleSign` y el nombre real era otro. *Un censo por patrón acota, no cierra (`L-437`).* Lo destapó abrir el archivo para tocarlo, no un gate. **Corregido en el buzón, donde lo escribí.**

---

## ⑨ LO INTOCABLE (plan §2) — cómo lo respeté

| fila | cómo |
|---|---|
| lo que se ve sin sesión se sigue viendo | 01·02·03·05 son pre-sesión y siguen siéndolo; `ADOPCION_ALCANZABLE` intacto |
| Apple y Google solo en cliente | no se tocó el motor; Google sigue en `login.tsx` |
| consentimiento por `registrarConsentimiento` | **la lógica de `registro.tsx` no se tocó** — sólo su superficie |
| ley del founder sobre lo que no se sabe | el apoyo de 10 **elige** entre dos voces según hubo foto o no |
| las tres voces de «no cargó» | no se tocaron |
| tuteo neutro, sin género | «Te damos la bienvenida», nunca «Bienvenido» · **el gate me cazó 3 voseos míos y los curé** |
| puerta única | cero `supabase.from/rpc` nuevos |
| área táctil 44 | piezas de la casa; no escribí tamaños |
| memorial | el splash no se monta con sesión; `Personaje`/`Confirmacion` resuelven por tema |

⚠️ **`docs/VARA_COHERENCIA_S116.md` y `docs/CATALOGO_PIEZAS_V5.md` NO estaban en `origin/main` al cerrar** (verificado con `git ls-tree origin/main docs/`). Las diez preguntas se responden en cuanto la vara exista; mientras, esta tabla responde el plan §2, que es lo que el encargo del lote listaba.

---

## ⑩ GATES, con números y exit

```
npx tsc --noEmit -p apps/cliente        → EXIT 0
node scripts/verify-diseno.mjs          → EXIT 0 · 81 reglas
node scripts/verify-huella-por-casa.mjs → EXIT 0
node scripts/verify-razon-muda.mjs      → EXIT 0 · 138 (baseline 138)
pnpm verify:voz-sin-hueco               → EXIT 0 · 8 (baseline 8)
```

**El bundle que produjo las capturas:** `Android Bundled … (3094 modules)` con `Starting project at .../e-petplace-s116-c03/apps/cliente`, **puerto 8097**. Binario `com.epetplace.cliente` **1.0.7**, emulador `s114_C` en **5578**.

⚠️ **`verify:habla-en-presente` sigue ROJO y es `D-1088`** — sus 8 sitios viven todos en `(tabs)/hogar/mascota/[mascotaId].tsx` (**lote 4**), medido: ninguno de mis archivos aparece en su salida. Mis commits la arrastran, no la agregan, y así está declarado en cada uno.

🔴 **`verify:moneda` está en ROJO y NO es mío — es el §4 del acta de mesa, medido:** el `$6.00` sale de un formateador **local** en `(tabs)/despensa/checkout.tsx:850` (`v.toFixed(2)`, punto decimal). **No es un bypass puntual: son 56 sitios en el cliente** (y 51 en el prestador) contra la fuente única `packages/i18n/src/moneda.ts`. **El gate ya existe y ya lo dice.** Dueño: A.
