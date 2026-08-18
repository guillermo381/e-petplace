# S100b-B · LA MEDICIÓN CON APARATO — la vitrina, la ficha y Laika, en números

> **Estatuto: MEDICIÓN, no receta.** Nada de acá aprueba una pantalla (regla 80).
> **Instrumento:** el SM-S938B del founder por USB — `1080 × 2340 px @ 450 dpi = 384 × 832 dp`.
> Bounds por `uiautomator dump` (árbol real) + píxeles por PIL sobre la captura real.
> **Capturas:** `docs/laminas/s100b-medicion/`.
>
> **Por qué existe:** el gate de S100 no falló por lo que falta —eso estaba medido— sino
> por **cómo se ve lo que hay**, y ninguna pista tenía aparato. *El toque 2 nunca ocurrió.*
> Esto es el toque 2, ejecutado.

---

## 🔴 §1 · LA LEY DE LA VUELTA, PROBADA CON UN SOLO NÚMERO

El acta de apertura §2 dice que G-05, G-06, G-07 y G-09 **no son cuatro ítems: son uno** —
*el control o el contenedor pesa más que el producto*. **Medido, son uno, y G-01 también.**

**El eje es el TAMAÑO RELATIVO A LA TARJETA QUE LO CONTIENE:**

| | nuestra tarjeta (**163.9 dp**) | fila de Laika (**384 dp**) | relativo |
|---|---|---|---|
| nombre (por línea) | 24.2 dp = **14.8 %** | 16.7 dp = **4.3 %** | **3.4× más grande** |
| precio | 26.3 dp = **16.0 %** | 24.5 dp = **6.4 %** | **2.5× más grande** |
| el control | `+` 36 dp = **22.0 %** · stepper 144 dp = **87.9 %** | — |  |

> ### En absoluto nuestro precio casi coincide con el de Laika (26.3 dp contra 24.5). **Lo que no coincide es la caja: la nuestra mide 164 dp y la suya 384.**

**⇒ LA CAUSA, EN UNA LÍNEA: la vitrina pasó a DOS COLUMNAS y se quedó con la escala
tipográfica y los controles del ancho COMPLETO.** Nada está «mal dibujado» pieza por pieza;
está **trasplantado a media escala sin re-derivarse**.

**Es L-278 literal** (*una proporción copiada de una referencia con otra escala no conserva
lo que la hacía funcionar*) — solo que acá la referencia con otra escala **era nuestra propia
app de ayer**.

### El número que lo resume solo, y no necesita tabla

| | alto de la tarjeta |
|---|---|
| **nuestra tarjeta, media pantalla de ancho** | **305 dp** |
| **la fila de Laika, pantalla ENTERA de ancho** | **271 dp** |

> **Nuestra tarjeta de medio ancho es MÁS ALTA que su fila de ancho completo.**
> *Con la mitad del ancho y más alto, entra menos de la mitad de mercadería por pantalla.*

---

## 🔴 §2 · G-01 — EL `+` NO ESTÁ ROTO: ESTÁ RECORTADO. Causa cerrada.

**La lógica del stepper está SANA** — su `+` llama a `irA(v + 1)` y está habilitado mientras
`v < max`, con `max = 12`. *Releer ese archivo con más cuidado no encuentra nada, porque no
hay nada ahí* (**L-286**).

**La causa es geométrica, y la cascada sale de los archivos vivos** (instrumento:
`scripts/medir-tarjeta-producto.mjs`, que **extrae y no reimplementa**):

```
pantalla 384 dp − pad 20·2 = 344 → grilla +8·2 = 360 → celda 180 − pad 8·2 = 164 dp
tarjeta 164 − borde 1·2 − pad 12·2                    = 138 dp  ← la caja interna
stepper  44·2 + 12·2 + 32                             = 144 dp
                                                        ─────
                                                        FALTAN 6 dp
```

**Y el precio todavía no pidió un solo píxel.** Con el precio en la misma fila el faltante
real es de ~64 dp. La tarjeta lleva `overflow: 'hidden'` ⇒ **lo que sobra no se ve: se corta**,
y el `+` es el elemento más a la derecha.

### La prueba en el aparato, y la coincidencia que la cierra

| | predicho por el instrumento | medido en el aparato |
|---|---|---|
| ancho de la tarjeta | **164.0 dp** | **163.9 dp** |

**Dos cuentas distintas dando el mismo número** (L-287). Y en el árbol del aparato, tras
agregar una unidad:

- contenedor del stepper: `x=[815,1024]` = **74 dp** — de los 144 que necesita.
- botón **`Menos`**: presente, `x=[815,938]`.
- botón **`Más`**: **NO EXISTE EN EL ÁRBOL.**

> ***«El `+` pone 1, aparece el `−`, y no hay camino a 2»* — el founder describió con
> precisión un botón que fue expulsado del layout.**

**⚠️ Y una trampa que este hallazgo deja escrita:** el árbol de accesibilidad **sigue
reportando los precios** `$14.95` y `$57.19` de las tarjetas cuya fila quedó recortada.
*El `uiautomator` dice que el precio está; la pantalla dice que no.* **Un lector de árbol no
prueba que algo se vea** — es L-235 con otro disfraz, y por eso la captura y el árbol se
leen juntos.

### 🔴 Lo que la cura NO puede ser

**N8 es ley firmada: blancos de 44, y ningún consumidor la re-decide.** Achicar los botones
del stepper por debajo de 44 **rompe una ley de la casa para tapar un síntoma**.

**El camino está escrito en la propia pieza y ya tiene precedente adentro:** el timbre `+`
es **36 dp visuales con `hitSlop={8}`** ⇒ 52 dp de blanco efectivo. *La casa ya sabe separar
el tamaño VISUAL del tamaño TÁCTIL, y lo hace tres líneas más arriba.*

⇒ **G-01 y G-07 se curan con el mismo movimiento** (control visualmente delicado, blanco
táctil intacto), que es exactamente lo que la ley de la vuelta predice. **La decisión de
cuánto achicar espera el benchmark, y no se toma acá.**

---

## 🔴 §3 · G-02 — NO ES «HAY ALGO QUE NO SE VE»: ES LA COMPOSICIÓN Y LOS ALÉRGENOS, TAPADOS

Medido en la ficha de *Adulto Cordero y Arroz*:

| contenido | bounds | qué lo tapa |
|---|---|---|
| `Composición` | y=[1518,1592] | `Agregar al carrito` y=[1543,1602] |
| la lista de ingredientes (`Lamb Meal, Brown Rice…`) | y=[1614,1886] | `Ver carrito · 1` y=[1701,1760] |
| **`Declara contener: Cordero, Arroz.`** | y=[1909,1966] | queda bajo la barra de tabs |

**Y la ficha NO SCROLLEA** — verificado: captura idéntica antes y después del swipe.
⇒ **ese contenido no está «abajo»: es INALCANZABLE.**

> **Lo tapado es exactamente lo que la letra firmada manda no esconder.** `N19 ④` ordena
> composición y alérgenos en la ficha; `MODELO_DESPENSA` firma ***«la alergia ADVIERTE, no
> esconde»*** y *«sin composición declarada la app LO DICE, jamás calla»*; y la propia
> `TarjetaProducto` lleva escrito: **⛔ *«ninguna se colapsa jamás dentro de un acordeón —
> plegar una advertencia de salud la convierte en nota al pie»*.**
>
> **Acá no está plegada: está PINTADA ENCIMA.** *Es peor que el caso que la ley previó, y
> por eso la ley no lo atrapó.*

**Segundo defecto en la misma pantalla:** los chips de `Presentaciones` (`12.7 kg`, `2.5 kg`,
`12.7 kg`) están **recortados a media altura**, y **un toque en las coordenadas que el propio
árbol reporta para el chip NO lo selecciona** ⇒ el CTA queda en *«Elegí una presentación para
agregarlo»* para siempre. **Desde la ficha no se puede comprar.** (Se compra desde el `+` de
la grilla, que es lo que salva al recorrido.)

---

## §4 · G-05 — LA FOTO NO LLENA SU CAJA, Y LA CAUSA ES EL ASSET, NO EL CONTENEDOR

Misma pieza, mismo `resizeMode="cover"`, dos resultados en la misma fila:

| producto | fondo a la izq. | fondo a la der. | la imagen ocupa |
|---|---|---|---|
| *Adulto Cordero y Arroz* | 43.0 dp | 42.7 dp | **48 % del ancho de su caja** |
| *Adulto Control PH Feline* | 0.0 dp | 0.0 dp | **100 %** |

`cover` **nunca** deja ver el fondo. Que se vea significa que **la imagen es un packshot con
fondo transparente** — y el color que asoma es `bg.hundido` (lavanda).

⇒ **El «marco púrpura con la imagen flotando al centro» de la ficha es eso mismo**, a mayor
tamaño: un PNG transparente sobre un fondo lavanda.

**Tiene dos mitades y conviene no confundirlas:**
- **de FORMA (mía):** el fondo de la caja de foto es `bg.hundido`. Sobre lavanda, un packshot
  transparente se lee como *marco de color*; sobre blanco se leería como un packshot normal.
  **Cura barata y es de la pieza.**
- **de DATO (dueño fuera de esta pieza):** el catálogo mezcla fotos opacas y packshots
  transparentes, así que la vitrina **nunca va a verse pareja** hasta que el criterio del
  asset se declare. *La forma puede dejar de empeorarlo; no puede emparejarlo.*

---

## 🔴 §5 · G-04 — LA VITRINA NO MUESTRA UN SOLO PRODUCTO, con su reparto vertical

Medido por píxel sobre la captura de arranque (columna x=250):

| | |
|---|---|
| primer píxel de producto | **y = 587.7 dp** |
| borde superior de la barra de tabs | **y = 699.0 dp** |
| **alto consumido ANTES del primer producto** | **587.7 de 699 = 84.1 %** |
| lo que queda para mercadería | **111.3 dp = 15.9 %** |

**Y esos 111 dp no alcanzan ni para UNA foto:** la foto de la tarjeta es 4:3 sobre 164 dp de
ancho = **123 dp de alto**. ⇒ **no entra completa ni la primera imagen.**

Lo que consume el 84 %: título · **cuatro chips de mascota** · rótulo `Buscar` + campo ·
la voz de *«elegí una mascota»* · el contador *«50 de 563»* · **dos filas de chips** (categoría
y especie).

> ***Una vitrina que no muestra mercadería no es una vitrina.***

**⚖️ Y el dato honesto que matiza la comparación:** **el INICIO de Laika tampoco muestra un
producto arriba** — es una home promocional (banner, membresía, «¿para quién comprás hoy?»).
*La comparación justa no es contra su home: es contra su LISTADO*, y ahí su primer producto
arranca a **187 dp (27 %)** contra nuestros **587.7 dp (84 %)**.

---

## §6 · LO QUE LAIKA HACE PEOR QUE NOSOTROS — y por eso no se copia

*De los referentes se toma el MECANISMO, jamás la superficie* — y esta pasada midió tres
cosas suyas que **nuestra ley ya prohíbe**, para que nadie las traiga de vuelta como «vara»:

1. **Su control pesa MÁS que el nuestro.** El botón `Agregar` ocupa **51.8 % del ancho de su
   fila**, contra el 22 % de nuestro `+`. **En G-07 Laika es el anti-patrón, no la vara** —
   el caso de G-07 se sostiene en nuestra propia ley (§2: el control va tercero y sin pesar),
   no en una comparación que perderíamos.
2. **Cuatro líneas de precio compitiendo** (`7% OFF` · precio · `con membresía $109.837 👑` ·
   `($56,13/gr)`) + `OFERTA` sobre cada foto. **Moneda visible, urgencia y ranking: los tres
   prohibidos** (`MODELO_LOYALTY`, N18).
3. **🔴 Su catálogo está anidado CUATRO niveles** — `PERROS → Alimento → Concentrado → ¿Qué
   marca? → Ver todas` **antes del primer producto**. **N20 firma máximo DOS toques**, y su
   razón es literal: *el catálogo anidado hace que la gente abandone la navegación.*

> **Nuestra vitrina falla por lo contrario que la suya:** la de ellos esconde el producto
> **detrás de toques**; la nuestra lo esconde **debajo de su propio encabezado**. *Los dos
> caminos terminan en una tienda donde no se ve qué se vende.*

---

## §7 · LO QUE ESTA MEDICIÓN **NO** DICE — declarado, no omitido

- **No aprueba ni rechaza ninguna pantalla.** Ningún número de acá es una firma (regla 80).
- **No fija las proporciones nuevas.** Eso lo decide **`docs/diseno/BENCHMARK-TIENDA.md`**
  cuando exista, y **para toda proporción manda el benchmark**. *Elegir acá un 12 dp porque
  «se ve mejor» sería exactamente la prosa que S99 pagó ocho gates aprendiendo a no usar.*
- **No mide el carrito, el checkout, el resumen ni el seguimiento.** El recorrido se cortó en
  la ficha: **G-02 impide comprar desde ahí**, y las pantallas de A y D piden su propia pasada.
- **No mide en oscuro ni en memorial.** Todo lo de acá es tema claro.
- **No mide rendimiento** (N16): ningún número de esta lámina es de tiempo.
