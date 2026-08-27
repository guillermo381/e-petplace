# PARTE DE LA PISTA C · S106 · CIERRE

**Worktree:** `../e-petplace-s106-c-cierre` · **rama:** `pista/s106-c-cierre`
**Base:** `main = 7958fb09` · **rama en origin verificada por SHA** al abrir.

**Frenos permanentes:** la DB la escribe sólo A (todo SQL sale como pedido
autocontenido, 76b) · piezas de B por pedido, jamás inline · ninguna key en el
repo.

**⚠️ La ley que esta sesión pagó cuatro veces, y me la aplico:** una pieza
**entregada** y una pieza **montada** son dos hechos distintos. Antes de decir
«construido», verifico el montaje. **Y jamás digo «curado»: eso lo dice el
dedo del founder.**

---

## ✅ ACTO 1 · EL SERVICIO PRESELECCIONADO — construido (`a6f268c1`)

Detalle en el mensaje del commit. Los dos criterios que la mesa registró:

- *Un default en el campo que decide **qué se compra** no es una comodidad: es
  una decisión tomada en nombre de alguien que no la tomó.*
- *Un vacío que **no puede dañar** es más robusto que cuatro caminos
  auditados.*

---

## ☠️ FICHA `D-944` — EL VOSEO VUELVE, Y YA NO SON DESCUIDOS

**⚠️ Nace como `D-943` y se renumera ANTES de mergear.** Ese número lo tomó A
para su ficha del giro de cámara mientras yo escribía — *el precedente `D-757`
exacto: un número vivo en artefactos sin ficha depositada, que la sesión
siguiente encuentra ocupado.* **Corregido cuando todavía no costaba nada.**

**Re-medido contra `origin/main` fresco y contra TODAS las ramas remotas:**
`D-943` tomada · **`D-944` libre**. *Medir sólo contra el archivo de deudas no
habría alcanzado — el número de A ya vivía en su rama antes de estar en la
ficha, que es exactamente cómo se produce la colisión.*

### El hecho

**Es la CUARTA vez que el voseo reaparece después de una barrida**, con
**manos distintas** — la última fui yo, escribiendo *«Elegí qué necesita…»* en
una key nueva del cliente. `R66` lo frenó sobre su baseline de 2.

### 🔴 La lectura, que es lo que esta ficha aporta

**Cuatro veces con cuatro manos no son cuatro descuidos: es que algo lo
reintroduce.** Barrer por quinta vez trataría el síntoma otra vez.

*Y el trinquete tampoco lo explica: `R66` dice «no creció», que es su trabajo
y lo hace bien — pero un guard que frena la reincidencia no responde por qué
alguien reincide.*

**Las hipótesis de origen que alguien debería medir, ninguna verificada:**
① el español rioplatense es el registro natural de la mesa, y la voz de
producto es tuteo neutro por decisión (L-148) ⇒ **cada string nuevo nace en el
registro equivocado y depende de acordarse** · ② la regla vive en el CONTRATO
y en `L-148`, **no al lado de donde se escriben las keys** · ③ el ejemplo más
cercano a la mano —los diccionarios— tiene ~50 cadenas en voseo **en galería**,
que no cuentan para el trinquete **pero sí se leen como referencia**.

### Por qué NO se cura ahora

**El trinquete está haciendo su trabajo y no urge.** Y curar el síntoma sin
mirar el origen es exactamente lo que produjo las cuatro barridas.

**Disparo:** la próxima vez que `R66` frene a alguien — ahí hay un caso fresco
con su autor presente, que es cuando el origen se puede medir en vez de
suponer.

---

## ⚠️ ACTO 2 · EL AVISO DE LA BUILD, temprano y con su lista

### 🔴 SÍ EXIGE BUILD, y ahora está confirmado con el literal

Medido en el fork: **`VideoTrackAdapter.java:82` ya recibe
`onFrame(VideoFrame frame)`** en cada llamada, y lo usa **sólo para detectar
mute/unmute**. Exactamente lo que D dijo: *no falta el acceso, falta la
conversión.*

Y medido del otro lado: **el fork NO expone nada de frames desde JS**
(`MediaStreamTrack.d.ts` — cero `addSink`, cero `onFrame`).

⇒ **La conversión es código nativo nuevo. Nada de eso viaja por OTA**, y **la
prueba barata tampoco**: su parte cara *es* la nativa.

### 🔴 QUÉ DEBERÍA LLEVAR LA BUILD ÚNICA — para que no haya una segunda

*El moto g31 espera una, así que lo caro no es la build: es descubrir después
que le faltó algo.* Lo que hay hoy que **sólo** viaja horneado:

| # | Qué | Estado |
|---|---|---|
| ① | **El módulo del cuadro congelado** (Android + iOS) | lo que motiva la build |
| ② | ~~`softwareKeyboardLayoutMode: "pan"`~~ | ☠️ **RETIRADO — la hipótesis está descartada** |

### ☠️ EL `"pan"` SALE, y la corrección es mía

**El crash al escribir YA ESTÁ CURADO**, y no era el teclado: era **un worklet
de `ModalDosAlturas` llamando a JS desde el hilo de UI** — lo curó A en
`3797a779`, publicado en `01a041a2`.

⇒ **Mi hipótesis quedó falsada, y no tengo otra razón para el `pan`.** Es
nativo, toca toda la app, y *proponer un cambio de esa clase sin una razón
viva es pedir riesgo a cambio de nada.* **Sale de la lista.**

*Y vale registrar por qué la hipótesis era razonable y aun así falsa: el
síntoma —crash nativo al escribir, «keeps stopping», fuera de toda
ErrorBoundary— es idéntico en las dos causas. **Lo que las separa no se podía
leer: hacía falta el stack**, que es justamente lo que la mesa mandó pedir en
vez de seguir construyendo sobre la sospecha.*

⇒ **LA BUILD LLEVA UNA SOLA COSA: el módulo del cuadro congelado.**

⚠️ Sigue en pie lo del giro: `[GIRO_C]` **viaja por OTA y no espera a nadie**,
pero **si su log dijera que la causa es nativa, su cura caería en esta misma
build** — y ahí sí convendría que el log se lea antes del disparo.

---
