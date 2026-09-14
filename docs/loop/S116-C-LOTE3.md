# S116-C · LOTE 3 — la bienvenida, el alta y el shell

> **Rama `pista/s116-c-03` · worktree `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s116-c03` · partí de `main` @ `bced0bb6`.**
> Mergeado `origin/main` @ **`5fa3599b`** (ancestría verificada: `git merge-base --is-ancestor origin/main HEAD` → sí). Todas las capturas son sobre ese árbol.
> Medido el **13-sep-2026**. Emulador propio (`s114_C`, **puerto 5578**, `adb -s` siempre — el 5566 es de B y no se tocó). Metro en **puerto 8097** desde mi worktree.

---

## ⓪ LO PRIMERO, PORQUE CAMBIA CÓMO SE LEE TODO LO DEMÁS

**EL LOTE ESTÁ COMPLETO: las once pantallas y el shell**, con las piezas del buzón de B ya montadas. ⚠️ Lo que NO está completo se dice acá arriba, no enterrado:
- **El alta nueva corre de punta a punta** y está capturada paso por paso (07 · 08 · 09 · 10), con sus tres barras de progreso.
- ✅ **Las tres curas que pediste verificar están en pantalla**: el logo sin fondo negro, el «Pez» con su cara, el esqueleto fuera de la confirmación.
- 🔴 **`D-1098`, tercera vuelta: el crash se fue y crear cuenta SIGUE roto** — con el defecto acotado en cuatro mediciones (§⑬). **Es el resultado de la verificación que pediste.**
- 🔴 **Y apareció un SEGUNDO bloqueo que nadie había medido (`D-1099`): la confirmación de correo está encendida**, así que el camino 05 → 06 se corta aunque `signUp` se cure.
- ⚠️ **Dos pantallas sin captura, las dos con su razón medida**: `00` sale en el acto (su ausencia es la prueba) y `06 · hogar SIN mascota` está bloqueado por las dos fichas de arriba.
- ⚠️ **El «tamaño protagonista» y `BotonMarcaAjena` NO están en `main`** — viven en `pista/s116-b-catalogo` @ `be55e5ed`. No mergeo una rama que la mesa no nombró.
- **La cabecera nueva** entró en ocho pantallas; las ~90 restantes del cliente siguen con la vieja. *Se dice arriba para que nadie lea el resto creyendo que cerró.*

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
| — | **la cabecera nueva en TODAS las pantallas del cliente** | entró en 01·03·04·05·06·07·08·09; **las ~90 restantes siguen con `Encabezado` viejo**. Es el resto del encargo que no alcancé, y es mecánico pero grande |
| — | **captura de 04 y de 10 post-cura** | ver §⑫ |

### El alta SÍ se reestructuró — y lo que costó está en su commit

Cinco pasos → tres + el cierre, con su reparto verificable en la cabecera de `PASOS`. **Nada de lo que preguntaba se perdió** (sexo y origen incluidos, que la RPC recibe). Lo que **sí** se perdió y está dicho: la sugerencia de raza por foto, cuya condición era el orden viejo.

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

---

## ⑪ LA VARA DE COHERENCIA — las diez preguntas, por pantalla

`docs/VARA_COHERENCIA_S116.md`. **sí** = cumple con evidencia · **no** = ficha · **n/a** = no aplica · **✳️** = excepción firmada por la mesa (00·01·02 no llevan cabecera por diseño, `D-1097`).

| # | pregunta | 00 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 |
|--:|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 1 | una sola cabecera | ✳️ | ✳️ | ✳️ | sí | sí | sí | sí | sí | sí | sí | n/a |
| 2 | tabs solo en raíz | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí |
| 3 | un acento | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí |
| 4 | Baloo arriba, PJS abajo | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí |
| 5 | nada local | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí |
| 6 | plata y fecha por su riel | n/a | n/a | n/a | n/a | n/a | n/a | **no** | sí | n/a | n/a | n/a |
| 7 | estado con palabra | n/a | n/a | n/a | sí | sí | sí | sí | sí | sí | sí | sí |
| 8 | vacío honesto | sí | n/a | n/a | sí | sí | sí | sí | sí | sí | sí | sí |
| 9 | movimiento que dice algo | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí |
| 10 | voz | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí | sí |

### Los tres «no», con su ficha

- **1 · 00·01·02 no llevan `Cabecera`.** ✅ **RESUELTO POR FIRMA DE LA MESA (13-sep-2026): no la llevan POR DISEÑO y quedan como están.** `D-1097` cierra con esa firma. *La celda sigue diciendo «no» y ahora eso significa «excepción declarada», no deuda.*
- **6 · 06 Hogar sin mascota: la fecha del antetítulo pasa por `fechaLargaHumana` del riel ✓, pero la pantalla poblada de al lado sigue con la fuente mono** que la mesa mató. No es de este lote (**lote 4**) y por eso no se toca; queda dicho porque la captura `06-shell-hogar.png` lo muestra.
- **6 · el resto es n/a** porque esas pantallas no muestran plata ni fecha. **Y 07 es «sí» por una cura**: el peso se parsea con `parsearPrecio` del riel — me lo cazó `R88`.

### La pregunta de cierre del lote

> **¿bajó el conteo de piezas locales?** → **SÍ: 62 → 61.** El lote absorbió tres (`PasoEspecie`, `PasoRaza`, `PasoHistoria`), nacieron dos (`PasoDatosBasicos`, `PasoCarnet`) y se inlinearon dos que yo había creado en el lote anterior. Baseline asentado en 61 en el mismo commit.

---

## ⑫ LA HOJA DE CAPTURAS — el recorrido ENTERO, en orden de flujo

> **Lote 3d · 13-sep-2026.** Sobre `origin/main` @ `a040375d` + esta rama.
> Emulador `s114_C` (**5578**, `adb -s` siempre) · Metro **8097** desde este worktree
> (`Starting project at …/e-petplace-s116-c03/apps/cliente`) · binario **1.0.7** ·
> **bundle fresco confirmado: `Android Bundled 8147ms … (3097 modules)`**.
>
> 🔴 **Cuenta REAL, creada desde la app y confirmada con el código del correo
> del founder** (`guillo381+s116c2@gmail.com`). *No es un fixture: el correo
> salió de verdad y el código volvió de verdad.*

| # | pantalla | archivo | qué prueba |
|--:|---|---|---|
| **00** | splash | — | ⚠️ **sigue sin captura, y su ausencia ES la evidencia** (§⑫bis) |
| **01** | propuesta | `01-propuesta.png` | logo sin fondo negro · «una vida.» en rosa |
| **02** | beneficios · 1ª | `02-beneficios.png` | personaje, Baloo, puntos en ciruela, «Saltar» |
| **02** | beneficios · 3ª | `02-beneficios-tercera.png` | el CTA aparece **sólo** en la última |
| **03** | acceso | `03-acceso.png` | cabecera nueva · Google |
| **04** | recuperar | `04-recuperar.png` | candado · «QUÉ SIGUE» · vencimiento sin número inventado |
| **05** | crear cuenta | `05-crear-cuenta.png` | ✅ **`BotonMarcaAjena` con el logo OFICIAL de Google** · Apple **no dibuja nada** · datos reales |
| **05b** | revisa tu correo | `05b-revisa-tu-correo.png` | 🆕 lienzo · flecha sola · círculo con glifo de correo · Baloo · «QUÉ SIGUE» · **el campo del código** · reenviar y cambiar correo en tinta apagada |
| **onb** | ¿mascota o adoptar? | `06b-onboarding-roto.png` | 🔴 **NO es una captura de logro: es un defecto** (§⑫quater) |
| **07** | datos básicos | `07-datos-basicos.png` | barra 1/3 · especies con su cara · raza con autocompletado |
| **08** | foto | `08-foto.png` | barra 2/3 · la escalera de la cara · «Ahora no» |
| **09** | carné | `09-carnet.png` | barra 3/3 · marco, nota, «Omitir» y las dos salidas |
| **10** | expediente creado | `10-expediente-creado.png` | ✅ **recapturada sobre este código** · esqueleto fuera · «El expediente de Lolo ya está creado.» |
| **06** | hogar | `06-shell-hogar.png` | las cinco tabs con **Actividad** · el asistente · «Ponte al día · 2 cosas» |
| **11** | expediente de la mascota | `11-expediente-mascota.png` | a dónde aterriza «Ver expediente» |
| — | empujada | `07-empujada-sin-barra.png` | **sin barra de tabs** (firma de la mesa) |

### ⑫bis · 00 · por qué sigue sin captura, y el protagonista sí está montado

**El tamaño protagonista YA ESTÁ MONTADO** (`<IsotipoV5 sobre="oscuro" tamano="protagonista" />`)
— llegó con el merge de `a040375d`, medido: `protagonista` ×3 en `Marca.tsx`.
**Lo que no se pudo es fotografiarlo**: intentado con ráfaga sin pausa, en la
segunda captura la app ya estaba en 01. *El splash sale en el acto cuando la
sesión resuelve, que es lo que el código hace y lo que la pieza declara.*
⇒ **queda como lo único del lote sin evidencia visual, y se dice.**

### ⑫ter · 06 · el hogar **vacío** no existe en el camino real — y eso es un hallazgo, no un hueco

El encargo pide «06 vacío». **No se pudo capturar, y la razón no es un bloqueo:
es que ese estado no está en el recorrido.** Medido hoy: una cuenta recién
confirmada **sin familia** la manda el router a **`/onboarding`**, no a `/hogar`
— y el onboarding sale directo al alta. *El hogar sin mascota sólo sería
alcanzable si alguien abandonara el alta a mitad.*

⇒ **la hoja entrega `06-shell-hogar.png` con Lolo ya creado**, que es el estado
real después del alta. **Si la mesa quiere el vacío como pantalla, hay que
decidir que exista** — hoy el producto no lo ofrece.

### ⑫quater · 🔴 EL DEFECTO QUE ENCONTRÓ ESTE RECORRIDO — la pantalla de onboarding está rota

`06b-onboarding-roto.png`. **Está en el camino de TODA cuenta nueva** — es lo
primero que ve alguien que acaba de confirmar su correo. Lo que muestra:

- el título **choca contra la barra de estado** (sin aire superior);
- el **engranaje flotante queda encima del título**;
- **dos barras blancas vacías** donde debería haber contenido;
- los glifos (lápiz, corazón) **flotan fuera de su caja**;
- un **hueco vertical enorme** entre las dos opciones.

**No la toqué**, y digo por qué: **no es de este lote** —el encargo son 00–10 más
el alta— y curarla a esta altura sería ensanchar el lote sin firma. *Pero está en
el camino crítico de la primera impresión, así que va con captura y no como nota.*
**Va al buzón como pedido de lote propio.**

### Las cuatro tareas del lote 3d

| # | qué | estado |
|--:|---|---|
| 1 | 00 con el isotipo protagonista | ✅ **montado** (por fracción de ancho, sin número en la pantalla) · ⚠️ **sin captura**, §⑫bis |
| 2 | `BotonMarcaAjena` en 03 y 05 | ✅ **hecho y visto en el aparato**: Google con su asset oficial, **Apple devuelve `null` y no dibuja** — montado **sin `if`**, como firmó la mesa |
| 3 | 05b «Revisa tu correo» | ✅ **nace** · 🔴 **y cambió de forma a mitad, por firma tuya**: ver §⑬bis |
| 4 | cuenta de prueba de punta a punta | ✅ **CORRIDA ENTERA con cuenta real** · ⚠️ con dos asteriscos: **00 sin captura** y **06 vacío no existe** |

---

## ⑬ ✅ `D-1098` — LA CAUSA, MEDIDA. No era el resolvedor, ni el receptor, ni el servidor

Tres vueltas buscaron la causa en el camino de la llamada. **Estaba un piso más
abajo, en una primitiva del runtime.** Sonda dentro de 05, antes del motor:

```
[D1098] crypto=object  getRandomValues=undefined  subtle=undefined
        TextEncoder=function  btoa=function
[D1098] crypto own=randomUUID   randomUUID=function
[D1098] crypto.getRandomValues(new Uint32Array(4))
        → TypeError: undefined is not a function
```

⇒ **Hermes define `crypto` con UNA sola propiedad: `randomUUID`.**

Y `auth-js` guarda así: `if (typeof crypto === 'undefined') { …fallback… }` y
después llama `crypto.getRandomValues(...)`. **El guard pregunta por el OBJETO,
no por el MÉTODO** — y acá el objeto sí está, así que el fallback nunca entra.

**Ese camino lo toma `signUp` sólo porque el cliente declara `flowType: 'pkce'`**
(puesto para que funcione Google). **`signInWithPassword` no toca PKCE.**
*Ésa es toda la diferencia entre el que funciona y el que no* — y explica las
tres vueltas: cada una miró la mitad que era igual en los dos.

### La medición que NO sirvió, declarada en vez de publicada

Sondé el `.hbc` con `strings | grep -x signUp` → **0**. **Ese cero no prueba
nada**: `signInWithPassword`, que demostrablemente funciona, **también da 0**.
*No es una ausencia: es un instrumento ciego contra bytecode Hermes.*
**Se declara no concluyente y no entra como evidencia.**

### Lo que monté, y es un PUENTE

`apps/cliente/src/lib/crypto-getrandomvalues.ts` — polyfill derivado de
`crypto.randomUUID()`, **criptográficamente aleatorio por spec**; se descartan
los nibbles fijos y el resto se usa como bytes. **Cero `Math.random()`**.
Va como **import por efecto y arriba de `@/lib/api`** porque los imports se
izan: *una llamada escrita entre medio correría después de que `initApi` cree el
cliente, y no curaría nada.* **Lo escribí mal la primera vez y el comentario
afirmaba lo contrario; queda dicho porque compilaba igual.**

⚠️ **Es puente, no destino:** lo correcto es el polyfill nativo, que **no viaja
por OTA**. Y con el puente `auth-js` avisa que el desafío PKCE viaja en `plain`
y no en `s256`, porque `crypto.subtle` tampoco existe. **Todo eso es de A**, y
está en `docs/loop/buzon/S116-C-para-A-D1098-la-causa-medida.md` con su decisión
a tomar.

---

## ⑬bis · 🔴 05b CAMBIÓ DE FORMA A MITAD DEL LOTE, por firma tuya

La mesa la especificó con **«Ya lo confirmé»**, un botón que vuelve a mirar la
sesión — o sea, diseñada para un **enlace**. Dos cosas la corrigieron el mismo día:

1. **A midió `D-1100`**: el enlace **abre el navegador**, no la app (sin
   `intentFilters`, sin `associatedDomains`, sin `emailRedirectTo`).
2. **Tu firma, verbatim:** *«el correo lo validamos con código no con enlace».*

⇒ **«Ya lo confirmé» se retira con su razón medida:** con código, mirar la
sesión **no puede servir** — no hay nada que mirar, porque la sesión la crea el
canje y el canje ocurre en la pantalla. *Habría dicho «todavía no» para siempre,
con cara de estar funcionando.*

**05b hoy:** el campo del código es el acto de la pantalla, sobre
`confirmarAltaConCodigo` (que ya existía y además registra el consentimiento,
porque `verifyOtp` devuelve sesión). **Y esto esquiva `D-1100` entero: con
código nunca se sale de la app.**

### El defecto que la propia captura destapó — el `+` del correo

05b mostraba `demo-prestador s116c48143@epetplace.dev`: **el `+` se había
convertido en espacio.** En una query string el `+` **significa** espacio, así
que el decodificador hizo su trabajo y el dato llegó roto. *No falla, no lanza,
no rompe el tipo: pinta una dirección verosímil y equivocada, y la persona la lee
como un hecho.* Curado con una frontera única —`apps/cliente/src/lib/auth/correo-en-ruta.ts`—
porque **son tres saltos** (05→05b, 05b→05, reenvío) y *una regla que hay que
acordarse de aplicar en tres lugares es una que alguien va a olvidar en el cuarto.*

---

## ⑭ LA VARA PARA 05b — las diez preguntas

| # | pregunta | 05b | evidencia |
|--:|---|:-:|---|
| 1 | una sola cabecera | **sí** | no lleva cabecera: **flecha sola sobre lienzo**, como firmó la mesa. Y **no es `FlechaVolver`**: esa pieza pinta con `text.onGradient` y sobre lienzo habría salido **invisible sin que nada fallara**. Va `Chevron`, que es lo que el catálogo nombra |
| 2 | tabs solo en raíz | **sí** | es pantalla empujada: sin barra |
| 3 | un acento | **sí** | una sola primaria («Confirmar»); reenviar y cambiar correo son `ghost` |
| 4 | Baloo arriba, PJS abajo | **sí** | «Revisa tu correo» en `titulo`, el resto en `cuerpo`/`antetitulo` — resuelto por `ESCALA_V5`, sin una línea de fuente en la pantalla |
| 5 | nada local | **sí** | `Icono` · `Texto` · `Celda` · `Campo` · `Boton` · `Chevron` · `spacing`. **Cero color, tamaño o tiempo literal** |
| 6 | plata y fecha por su riel | **n/a** | no muestra ninguna de las dos |
| 7 | estado con palabra | **sí** | el rebote del código lo dice el motor con **una sola voz** para «malo» y «vencido» — a propósito: distinguirlos le confirma a un extraño que ese correo tiene cuenta |
| 8 | vacío honesto | **sí** | sin código el CTA está apagado **y dice por qué** (`razonDeshabilitado`); sin correo en la ruta, vuelve a 05 en vez de quedarse muda |
| 9 | movimiento que dice algo | **sí** | sólo la cuenta regresiva del reenvío, que informa; cero animación decorativa |
| 10 | voz | **sí** | tuteo neutro, es/en en paridad. **Cero vocabulario de motor**: no dice «sesión», «token» ni «OTP» |

**Cero «no» ⇒ ninguna ficha.**

---
