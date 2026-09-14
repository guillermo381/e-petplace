# S116-B · LOTE 5b — los tres retoques de la mesa

**Rama `pista/s116-b-05` · commit `fa319c36`** (sigue la misma rama: las tres piezas viven ahí sin mergear).

**Gates:** `verify:diseno` VERDE (80 reglas) · `verify:contrast` 457/0 · `verify:catalogo-v5` VERDE (30 piezas / 25 entradas) · `verify:reduced-motion` VERDE · `tsc` 0 en las cuatro superficies.

---

## ① LA ONDA DEJA DE PINTARSE

C midió **píxeles magenta a y≈1505-1510 con el teclado arriba**. *Una opacidad que llega a 0 no deja nada visible: o el fundido no corrió, o lo que se ve no es esta pieza.*

**No elegí entre las dos hipótesis** — la cura que cierra las dos puertas es la misma: **al terminar el fundido la onda deja de dibujarse.** Lo que no está dibujado no deja píxeles, y eso no depende de que un listener haya disparado.

- **Conserva su alto siempre**, pintada o no. *Si además se encogiera, el contenido de arriba saltaría al subir el teclado — y «no salta» es de la misma orden que «desaparece».* Deja de pintarse, no de existir.
- **El orden importa en las dos direcciones:** se apaga **cuando termina** el fundido (apagarla al empezar sería el salto), y al bajar el teclado **vuelve a existir invisible antes de aparecer** — montar y fundir en el mismo frame deja el primer cuadro a opacidad 1, que es un parpadeo.
- Absorbe `insets.bottom` como **padding y no como margen**: el magenta sangra hasta el filo y sólo el contenido se corre (Ley 8, precedente `Hoja`).

### 🔴 LA CAPTURA NO SE PUDO TOMAR, y son TRES obstáculos medidos

| camino | qué pasó, medido |
|---|---|
| `/gallery` del **cliente** | `cliente://gallery` **no navega**: la pantalla no cambia un píxel, con la app corriendo y en frío. Probado dos veces, con logcat abierto |
| `/gallery` del **prestador** (es un tab, sería alcanzable) | el APK instalado **no es dev build**: `cmd package resolve-activity … prestador://expo-development-client/` responde **`No activity found`** ⇒ no puede cargar mi Metro |
| la pantalla **03**, consumidor real | vive en la rama de **C**, no en la mía: acá la onda tiene **0 consumidores** |

⚠️ **Y el primero tiene causa documentada, que es lo que lo vuelve accionable:** la entrada a la galería se retiró de Cuenta **por firma del founder en S106**, y la nota que la retira dice *«la ruta `/gallery` sigue viva y se alcanza por deep link con cable, como antes»*. **Medido: esa premisa es falsa en este binario.** *Una firma que se apoya en un camino que no funciona deja sin puerta a la superficie que `R17` declara obligatoria.* No la re-abro: deshacer una firma del founder no es mío.

**Lo que sí queda montado para cuando haya puerta:** la sección de galería lleva la onda como `pie` **y un `Campo`** — sin un campo, esa sección probaría la mitad que no estaba rota.

**Lo que le pido a C:** una sola captura de 03 con el teclado arriba, contra 04, sobre este commit. Tiene el consumidor y tiene la línea base.

---

## ② EL ASISTENTE DESCANSA — y esto SÍ está medido

Tres ciclos al montar y en cada `despertar`; **el halo se queda puesto** en su punto más contraído y visible. *Lo que descansa es el movimiento, no la presencia.*

**La curva de `uiautomator`, desde que el Hogar aparece:**

| t | `uiautomator dump` |
|---|---|
| **t+12 s** (recién montada, respirando) | **`ERROR: could not get idle state.`** |
| t+25 s | OK |
| t+38 s … t+90 s (14 lecturas más, cada 4 s) | OK, sostenido |

**Tres ciclos × 8 s = 24 s, y la primera lectura verde es a los 25.** *La predicción y la medición coinciden, que es lo que separa una explicación de una coincidencia.*

⚠️ **Un límite del dato, declarado:** a t+12 s la ventana también está terminando de montar, así que ese rojo **no separa «respira» de «está montando»**. Lo que sí separa es **la recuperación**: antes no llegaba nunca —C midió la ventana permanentemente no-idle— y ahora llega, en el segundo que la aritmética predice.

- **El despertador es un número que cambia, no un `boolean`.** Con un booleano hay que apagarlo y volver a prenderlo para pedir otra vuelta, y *quien se olvide del apagado deja el asistente sin respirar para siempre sin que nada falle.* Lo dispara el consumidor: la pieza no sabe qué es «volver a la raíz» ni tiene el scroll.
- 🔴 **DISCREPANCIA MEDIDA, DECLARADA Y NO CURADA ACÁ:** el comentario del token dice *«el ciclo… ida y vuelta»* pero su otro consumidor —`PresenciaCoach`, el orbe— **lo usa por dirección**. Copio al orbe porque la orden firmada pide que **se lean igual**; corregir el token cambiaría el ritmo del orbe, y el orbe no es de este lote. **Consecuencia a la vista: tres ciclos son ~24 s.** Si la mesa los quiere más cortos, es un número.

---

## ③ EL PIE ES UNO, NO DOS

`HojaContenido` gana **`pie`** + **`materialDelPie`**, y el mecanismo **no se copió: se extrajo** a `pie-fijo.tsx`. Lo consumen las dos piezas.

Adentro viven las tres curas que `PantallaConPie` pagó con defectos de aparato:

1. **la reserva MEDIDA** — el pie tapaba contenido en cinco pantallas; en una, la composición y los alérgenos de un producto, **inalcanzables**, porque el scroll reservaba un `96` tecleado;
2. **el inset DERIVADO** — se contaba dos veces adentro de `(tabs)`, donde el navegador ya lo reservó;
3. **`box-none`** — el pie se comía el gesto en todo su ancho y el tercio inferior dejaba de scrollear, justo donde se apoya el pulgar.

> *Escribir un segundo pie en `HojaContenido` habría sido escribir la versión que no pagó ninguna de las tres.* `PantallaConPie` **no cambia de comportamiento**: cambia de dónde lo saca.

`materialDelPie` es **cerrado** (`lienzo` | `sangrado`) a propósito: con un estilo libre, cada pantalla volvería a decidir el material y volveríamos a N pies.

**Catálogo:** §⓪ gana la **tabla de cuál se usa cuándo** (con hoja → el slot; sin hoja → `PantallaConPie`; onda → `sangrado`) y la advertencia de que **no se envuelve una en la otra**: serían dos pies y dos reservas.

### Sobre `R53`

**La declaración muere cuando las pantallas migren, no antes.** Retirarla hoy pondría la regla **en rojo** sobre cuatro pantallas que todavía no cambiaron. *Migración y baja de baseline son el mismo acto* — y el acto es de quien tiene las pantallas.

---

## ④ OPERATIVO

Emulador propio (AVD `s113_E`, puerto **5590**) y Metro propios (**8090** cliente, **8092** prestador). No toqué `emulator-5578`.

✅ **Y esto corrige una duda que dejé en el parte anterior.** Ahí declaré que al apagar lo mío el emulador de C también había desaparecido y que *no podía distinguir si lo había tumbado yo*. **Esta vez medí `adb devices` antes y después de matar el mío: el de C sobrevivió intacto.** ⇒ **matar el propio emulador no se lleva el ajeno**, y lo de la vez pasada fue otra cosa. *La duda se resuelve midiendo el caso otra vez, no razonando sobre el anterior.*

Credenciales copiadas al worktree para las capturas y **borradas al terminar**; nunca impresas.
