# S116-B · LOTE 11 — la letra del CTA, el abanico, y la galería destrabada

**Rama `pista/s116-b-05` · commit `4fc2f0e4`.**

**Gates:** `verify:diseno` VERDE (81 reglas) · `verify:contrast` **464/0** · `verify:catalogo-v5` VERDE (33 piezas en 28 entradas) · `verify:reduced-motion` VERDE · `verify:isotipo-path` VERDE · `tsc` 0 en `packages/ui`, `packages/api`, `apps/cliente`, `apps/prestador`.

---

## ① LA LETRA DEL CTA — y el censo mueve dónde estaba el defecto

**`Boton` NO era el ofensor.** Su primario ya resuelve `{ fondo: theme.accent.cta, texto: theme.accent.ctaTexto }`, y en claro `ctaTexto` es **blanco**. Los botones magenta que dibuja la pieza salen con la letra blanca desde que existe el slot.

**El único ofensor vive en `FilaConfirmacionVacuna.tsx`, líneas 381 y 515**: un CTA **dibujado a mano** con `backgroundColor: theme.accent.cta` y un `<Texto color={… : undefined}>` que cae a `text.primary`.

> **Un CTA a mano hereda el fondo del acento y se olvida de su letra.** El fondo es una línea de estilo que alguien escribió; la letra es una **ausencia**, y una ausencia no se revisa.

**Medido (`verify:contrast`, tres pares nuevos):**

| par | ratio | veredicto |
|---|---|---|
| blanco sobre `magentaAccion` | **5,13** | pasa texto (4,5) |
| tinta sobre `magentaAccion` | **3,29** | **falla** — es lo que el founder veía |
| tinta sobre `magentaLuz` (CTA en oscuro) | **7,91** | pasa |
| blanco sobre `magentaLuz` | **2,31** | **falla** |

⚠️ **«Blanco siempre» no se puede obedecer al pie, y el número lo dice.** En **oscuro** el CTA no es magenta: es `magentaLuz`, un rosa claro. Ahí la tinta da 7,91 y el blanco 2,31 — pintarlo blanco por regla **rompería el tema oscuro**. **La regla verdadera es BLANCO SOBRE MAGENTA**, que es exactamente lo que el founder vio y lo que el slot ya hacía.

⚠️ **Y no hay token que matar:** ninguno pinta tinta sobre magenta. Lo que faltaba era **una forma de decirlo desde una pantalla**. `Texto` gana el color **`sobreCta`**, que resuelve `theme.accent.ctaTexto` — **por casa**.

> **`'inverso'` no alcanzaba, y ésa es la parte fina:** habría dado el color correcto en claro **por casualidad** y el equivocado en oscuro. Un color que acierta por coincidencia es un defecto que todavía no pasó.

---

## ② `AbanicoAsistente` REEMPLAZA A `HojaAsistente`, que muere con lápida

**Por qué la hoja estaba mal, y no es estética:**

> **Una hoja modal tapa la pantalla desde la que se la abrió — y el contexto de lo que se va a preguntar ES esa pantalla.** Preguntar sobre algo no puede empezar por esconderlo.

Segunda razón, de gesto: **una hoja pide dos manos o un pulgar que viaje**; el abanico nace donde está el dedo, a 46 px del botón que lo abrió.

**Lo que se reusa y lo que no.** Se reusa el **motion** del orbe —`motion.coach.escalonadoMs` al abrir, `motion.coach.cierreMs` al cerrar— y con él su regla: **se abre escalonado y se recoge de golpe**, porque *escalonar la salida hace esperar a quien ya decidió irse*. **No** se reusa el arco de pata: el sketch pide **columna**.

**Las tres decisiones de forma, con su razón:**
- **La etiqueta va a la IZQUIERDA, no debajo.** Debajo, cuatro etiquetas empujan la columna a lo alto y el último atajo queda fuera del pulgar.
- **El velo ocupa la pantalla entera.** *«Se cierra tocando fuera» sólo se cumple si «fuera» es tocable.*
- **El botón también cierra.** Uno que sólo abre deja a quien se arrepintió buscando dónde tocar.

«Pregúntale a Nexo» se dibuja **primero en el DOM y arriba en pantalla**, con el **último** escalón de entrada: la columna crece hacia arriba y el ojo la termina de leer ahí.

**El contrato de atajos viaja intacto**, como pidió la mesa: `atajos[] { glifo, texto, onPress }`.

`HojaAsistente.tsx` **borrado**; queda `HojaAsistente.LAPIDA.md` con el porqué.

---

## ③ LA GALERÍA DESTRABADA — la causa estaba a dos líneas en dos archivos

**Dos `ScrollView` verticales anidados:** `apps/cliente/src/app/gallery.tsx` envolvía todo en uno para poner la lámina arriba, y `TokenGallery` trae el suyo.

> **Un scroll vertical adentro de otro no reparte el gesto: se lo queda el de adentro**, que con `flex:1` mide lo que su contenido y cree que no tiene nada que desplazar.

**Síntoma que producía: 360 swipes sin mover un píxel.** Lo declaré durante cuatro lotes como «el scroll se traba», sin saber por qué.

**Consecuencia que lo vuelve grave, y es la que lo hace un defecto de gate y no de comodidad:**

> **Ninguna pieza que viva debajo de ese punto se podía gatear.** Una galería que no se puede recorrer entera es una galería que **miente sobre lo que contiene** — y es la única superficie por la que el founder mira `packages/ui`.

**Cura:** `TokenGallery` gana `encabezado?: ReactNode`, la lámina entra **adentro del único scroll**, y el `ScrollView` externo de la ruta muere. El anidamiento queda **inexpresable desde la ruta**: ya no hay dónde ponerlo.

De paso muere el `lazy`/`Suspense` del lote 9, con su arco documentado: *cambié siete segundos en blanco por una espera infinita bien dibujada.*

---

## ④ LO QUE NO HICE, DECLARADO

- **El censo del punto 1 devolvió UN ofensor, no una lista.** Busqué `accent.cta` como `backgroundColor` en las dos apps y en `packages/ui`: los demás son `Boton`, que ya resolvía bien. *Un censo que devuelve uno también dice algo — dice que la pieza estaba sana y el defecto era de una pantalla.*
- **`FilaConfirmacionVacuna` sigue dibujando su CTA a mano.** Curé su letra, no su anatomía: volverla `Boton` es cambio de pieza ajena a este lote y se declara en vez de hacerse de paso.

---

## ⑤ LAS CAPTURAS — y una medición del instrumento antes que ninguna

⚠️ **Mi propio «se trabó otra vez» era del instrumento, no del producto, y estuvo a un paso de entrar a este parte como hallazgo.** Después de la cura corrí **seis swipes encadenados de 200 ms sin pausa**: la pantalla quedó **idéntica**, y lo anoté como «queda un segundo anidamiento». **Un solo swipe de 300 ms desde la misma coordenada movió la galería.** Los flings encadenados se cancelan entre sí y el resultado se lee exactamente igual que un scroll trabado.

> **El síntoma del instrumento y el del defecto son el mismo píxel.** La única diferencia es que uno se va cambiando la duración del gesto.

⇒ **toda medición de scroll va con swipes espaciados**, y el control es un swipe solo.

**Lo capturado, con lo que prueba:**

| captura | qué prueba |
|---|---|
| `lote11-cta-blanco.png` | **Punto 1 en la pantalla exacta que nombró el founder** — revisión del carnet, los dos «Es correcta» magenta con **letra blanca** |
| `lote11-carrito-raiz-y-checkout.png` | El carrito con su contador en el slot derecho de la cabecera **raíz**, y abajo la tarjeta de checkout que **no lo dibuja aunque se le pase** |
| `lote11-confeti-en-vuelo.png` | El confeti **cayendo** — magenta, rosa, ciruela — alrededor del check de «¡Listo!». *Tomada persiguiendo la ventana de 1,5 s: la pieza no tiene loop, así que la captura es del momento o no es.* |
| `lote11-tarjeta-producto.png` | Lote 7 sostenido: nombre a dos líneas y **«Agregar» entero**, sin recorte |

🔴 **EL ABANICO NO SE CAPTURÓ, y la razón es un hallazgo que vale más que la captura: EN LA APP NO EXISTE TODAVÍA.**

Medido en `apps/cliente/src/app/(tabs)/_layout.tsx:145` — el cliente monta la **variante sin abanico**:

```
<BotonAsistente onPress={() => router.push('/nexo')} etiqueta={…} />
```

**Sin `atajos`, el botón es un enlace a Nexo**, y eso es lo que hace hoy en las cinco tabs: lo toqué en el Hogar y **navegó derecho a la pantalla de Nexo**. La pieza tiene el abanico; **la app todavía no se lo pide.** ⇒ **el cableado es de C**, y es la única mitad que falta para que el founder vea lo que pidió.

⚠️ **Y la mitad que es mía, declarada: la entrada de galería del abanico no la pude alcanzar.** La galería es un solo scroll muy largo y la sección vive a **~9 % del contenido**; los barridos automáticos la pasaron de largo o la app se cerró a mitad de recorrido. **No es que el scroll esté trabado** —eso quedó curado y medido arriba—: es que **recorrer a ciegas una galería sin índice no es un método**, y lo digo en vez de reportar una captura que no tomé.

☠️ **Y una cura que escribí y REVERTÍ en el mismo turno, porque se apoyaba en una hipótesis y no en una medición.** Vi que la entrada montaba el botón dentro de un `View` de 220 px, razoné que su `bottom` absoluto lo empujaría fuera, y lo saqué con un comentario que lo declaraba defecto. **Después hice la cuenta: `insets.bottom + barraAlto + SEPARACION − margen` ≈ 114 px — entra en 220.** El montaje estaba bien y el que no llegaba era yo.

> **Una explicación que encaja con el síntoma no es una medición del síntoma.** La mía encajaba perfecto — y el número, que costaba una resta, decía lo contrario.

**Tampoco se capturó la onda con teclado arriba y abajo**: vive en las pantallas de acceso y el emulador está con sesión abierta; cerrarla es tocar una cuenta compartida con las otras pistas.

