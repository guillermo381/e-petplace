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

## ☠️ FICHA `D-943` — EL VOSEO VUELVE, Y YA NO SON DESCUIDOS

**Medido:** `D-942` es la última depositada; `D-943` está libre (grep sobre
`docs/`, `apps/`, `packages/`, `supabase/`).

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
| ② | ⚠️ **`softwareKeyboardLayoutMode: "pan"`** — la cura candidata del crash al escribir | **medido: hoy NO está declarado en ninguna de las dos apps** ⇒ default `resize`, que es la hipótesis del crash |

**② es una decisión de la mesa, no mía**, y por eso va como pregunta y no como
hecho: **es nativo, toca TODA la app, y su diagnóstico todavía depende del
stack que A tiene que capturar.**

🔴 **Pero el orden importa y por eso lo digo ahora:** *si el stack llega
después de que la build salga, la cura del crash espera a la build siguiente —
y el crash es lo único que impide al vet escribir.* **Conviene que A capture el
stack ANTES de que la build se dispare**, aunque la respuesta sea «no era el
teclado».

⚠️ **Y lo mismo con `[GIRO_C]`:** la instrumentación **ya viaja por OTA**, así
que ése no necesita esperar a nadie — pero si el log dijera que la causa es
nativa, su cura también caería en esta build.

⇒ **Los tres —cuadro, crash, giro— quieren la misma ventana.** Decidirlo junto
es lo que evita la segunda build.

---
