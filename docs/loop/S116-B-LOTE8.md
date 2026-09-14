# S116-B · LOTE 8 — las cuatro del recorrido 2

**Rama `pista/s116-b-05`.**

**Gates:** `verify:diseno` VERDE (81 reglas) · `verify:contrast` 461/0 · `verify:catalogo-v5` VERDE (32 piezas) · `verify:reduced-motion` VERDE · `verify:isotipo-path` VERDE · `tsc` 0 en las cuatro superficies.

---

## ① LA ONDA — eran DOS causas, no una

**El color.** Lo ponían la ola y la banda, **cada una en su caja**, así que todo lo que quedara entre ellas o alrededor salía lienzo: el SVG a 100 % deja subpíxeles en los cantos y cualquier redondeo de alto abre una línea abajo.

> **Un color que se compone de dos piezas tiene tantas junturas como piezas.**

Ahora **el magenta vive en la raíz**: cualquier superficie que la onda ocupe es magenta por construcción, y las junturas **no pueden existir**.

**El inset.** Vuelve al **crudo**. El derivado mide *cuánto de la barra queda debajo del contenedor* — correcto para un pie que vive DENTRO de un contenedor y **equivocado para una franja que tiene que llegar al borde físico**. *Es la misma lección que el asistente ya me había cobrado en el lote 6, cobrada de nuevo en la pieza de al lado.*

La adenda rige tal cual: **el inset empuja el CONTENIDO y no mueve un píxel del color.**

### 🔴 LA CAPTURA NO SE PUDO TOMAR — séptimo intento medido, y ya no es una excusa: es una deuda

| vía | resultado, medido |
|---|---|
| `cliente://gallery` | no navega |
| `cliente:///gallery` (triple barra, host vacío) | no navega |
| `exp+cliente:///gallery` | no navega |
| dev-client con `…/--/gallery` como `url` | rompe: lo toma como manifiesto |
| galería del **prestador** (es un tab, sería alcanzable) | `resolve-activity` → **`No activity found`**: el APK no es dev build |
| la pantalla **03**, consumidor real | vive en la rama de **C** |
| **la galería por WEB** (`localhost:8090/gallery`) | **`curl` la sirve** (HTML real), pero **Chrome da `ERR_CONNECTION_REFUSED`**: el navegador no alcanza el localhost del host |

**Lo accionable, y es de una línea:** la entrada a `/gallery` se retiró de Cuenta en S106 *sobre la premisa de que «se alcanza por deep link con cable»*. **Medido siete veces: esa premisa es falsa.** ⇒ **o vuelve una entrada (aunque sea sólo en `__DEV__`), o `/gallery` deja de ser la superficie de gate de `packages/ui`.** *Hoy `R17` obliga a mantener una galería que nadie puede abrir, y eso lleva tres lotes bloqueando capturas.*

---

## ② `FilaBeneficio`

**No anuncia toque — y no es «una celda con el `onPress` apagado»:** ni `Pressable`, ni `accessibilityRole`, ni chevrón, ni hundido. **No están apagados: no están.**

> *Una celda de navegación dice «acá se entra» con todo su cuerpo; quitarle el toque deja una puerta que no abre, y quien la toque concluye que la app está rota.*

Para el lector de pantalla la diferencia es total: una celda se anuncia **«botón»**, y acá no hay botón que anunciar — hay una frase sobre lo que la app hace.

**Cuatro tarjetas, no una lista con divisores:** *una lista dice «estos ítems van juntos»; cuatro tarjetas dicen «cada uno vale por sí mismo»*, que es lo que una pantalla de propuesta necesita.

---

## ③ `EsperaLarga`

**No sabe cuánto falta y no lo finge — por eso muere la línea de progreso.**

> *Una barra que avanza sin saber hacia dónde es una promesa que nadie puede cumplir, y cuando se queda quieta al 80 % lo que comunica es que algo se rompió.* **Lo que esta pieza comunica es otra cosa: que hay alguien acá.**

🔴 **Es la única pieza de la casa con movimiento sin fin, firmado.** En el asistente el halo respira tres veces y descansa **porque una animación infinita deja la ventana no-idle**; acá esa razón no aplica: *la espera es lo que dura, y una pantalla de espera detenida a los 24 s dice lo contrario de lo que vino a decir.* ⚠️ **Consecuencia declarada: mientras esté, `uiautomator` no reporta `idle`.**

Consume `lib/rueda-de-caras` y el halo del asistente. **Nada se redibuja.**

⚠️ **Lo que NO pude medir:** qué «línea de progreso» muere exactamente. **Censado: no existe una pieza de progreso de espera en `packages/ui`** — la más cercana es `EsperaDeMarca` (la huella respirando), que **no es una línea** y tiene cuatro consumidores vivos. Si la línea vive en una pantalla de C, muere cuando esa pantalla adopte `EsperaLarga`. *No la maté a ciegas.*

---

## ③bis LA RUEDA DE CARAS SUBE A `lib/`

Como la mesa pidió: *«sin copiarla»*. **Lo que se pierde al copiarla no es código: es la CADENCIA.** Cuatro ruedas escritas aparte giran a cuatro ritmos el día que alguien ajuste una, y *cuatro pantallas de la misma app respirando distinto se lee como que la app está mal hecha*, sin que nada falle.

**No dibuja**: devuelve qué cara toca y cuánta opacidad. *Una rueda que además dibujara obligaría a las cuatro superficies a verse igual, y no lo son.*

✅ **`R77` cazó la mudanza sola:** su tabla apuntaba a `OndaAcceso.tsx::LAS_SEIS`, que ya no existe — *«un lector que se fue deja la tabla afirmando algo sobre nada»*. Reapuntada.

---

## ④ LOS ATAJOS — censados del objeto, no de la memoria

**`apps/cliente/src/lib/nexo/atajos.ts:57`** — `ORDEN_DE_PATA = ['peso', 'vacuna', 'antiparasitario', 'foto']`.

⚠️ **La mesa los nombró como *«agregar recuerdo, carné de vacunas y los demás»* y el objeto dice otra cosa:** «carné» ≈ `vacuna` y «recuerdo» ≈ `foto`, **pero `peso` y `antiparasitario` no estaban en la lista dictada y sí en el código.** *Se declara para que la mesa elija sobre lo que hay, no sobre lo que recordamos.*

Nace **`HojaAsistente`** y **`BotonAsistente` la monta él**: *si cada pantalla la montara, abrir el asistente sería un acto distinto en cada una, y el estado de «abierta» se olvidaría de cerrarse en alguna.*

El botón pasa a ser una **unión**: o abre su hoja (y entonces exige campo **y** atajos), o tiene `onPress`. *Un asistente con atajos y sin campo no es una configuración: es una hoja a medio construir* — y así no compila. **La lista vacía sí es legal.**

**Filas de lista y no los dedos del orbe**, y la consecuencia es buena: *una lista crece a cinco sin rediseñar nada; el abanico no podía pasar de cuatro sin dejar de ser una pata.*

---

## ⑤ EL TSC DE LAS APPS CAZÓ LO QUE EL DE `packages/ui` DEJÓ PASAR — tercera vez en esta sesión

`estiloPresionado` lleva `transitionProperty`, que el `ViewStyle` de la config de las apps **no acepta** en un `Pressable`. `packages/ui` compilaba en 0. El hundido va en un `Animated.View`, como el resto de la casa.

> *El gate que vale es el del hook, que compila las cuatro superficies.*
