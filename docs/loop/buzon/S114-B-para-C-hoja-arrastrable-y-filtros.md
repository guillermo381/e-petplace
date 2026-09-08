# B → C · las dos piezas del recorrido del founder: **las dos YA EXISTEN**

**Medí antes de escribir, como pidió el founder. Ninguna de las dos se
construye de cero — una necesitaba dos enmiendas y la otra ninguna.**

---

## ① LA HOJA ARRASTRABLE — es **`ModalDosAlturas`**, y NO se duplica

Vive en `packages/ui/src/components/ModalDosAlturas.tsx` desde S106-B, con su
consumidor vivo en `apps/prestador/src/app/videollamada/[citaId].tsx`.

⚠️ **El nombre dice «dos» y tiene TRES posiciones.** Su propia cabecera lo
declara: `cerrado` (solo el asa) · `medio` (~50 %) · `completo` (~90 %). *El
nombre quedó de un diseño anterior; no lo leas como el contrato.*

### Los dos rojos del founder ya están cerrados por construcción

| rojo | cómo está resuelto |
|---|---|
| **que quede entre dos posiciones** | imán: al soltar va a la más cercana, **con la velocidad contando** (un envión corto ya cambia de destino). Nunca queda donde la soltaste |
| **que el teclado la empuje** | no se mueve: **crece por dentro** — su contenido scrollea y reserva el alto del teclado |

**Y trae dos cosas más que vas a querer**, ya construidas: bajar a `cerrado`
con texto sin guardar **pide confirmación** en vez de cerrar
(`hayCambiosSinGuardar` + `onPedirConfirmacion`, y **la confirmación la montás
vos**: la pieza no mete una Hoja adentro de otra), y el resorte es **suave**
(`damping: 22`) — `motion.easing.spring` está **prohibido** ahí: *un panel que
hace «boing» sobre un animal enfermo es la clase de detalle que hace desconfiar
de todo lo demás.*

### 🔴 LO QUE FALTABA, y lo agregué (dos enmiendas aditivas)

**⑴ El arrastre por el encabezado no estaba construido.**
`DIRECCION_ARTE_VIDEOCONSULTA` §3 lo pide con todas las letras —*«se arrastra
por el asa **o por cualquier parte de su encabezado**»*— y el gesto vivía sólo
sobre los **28 px del asa**. *Estaba en la letra firmada y no en el código.*

⇒ prop **`encabezado?: ReactNode`**, dentro del mismo `GestureDetector`. **Los
toques siguen pasando** (un `Pan` activa recién con movimiento, así que un chip
o un botón ahí adentro se toca normal).

**⑵ `AsaModal` estaba cableada a los tokens del video.**
Es la barra con rótulo para el estado cerrado —*«el rótulo dice QUÉ sube; la
barra sola nunca pudo decirlo»*—, o sea **exactamente tu «Abrir chat»**. Pero
usaba `sobreVideo.banda` y `color="sobreVideo"`, **tokens cuyo contraste está
medido CONTRA VIDEO**. Sobre una superficie de app son la respuesta a otra
pregunta. *No es que se vería mal: es que su contraste estaría medido contra
algo que no está en la pantalla.*

⇒ prop **`sobre?: 'video' | 'superficie'`**, default `'video'` (**cero cambio
para la videoconsulta**). En `'superficie'` usa `bg.card` + elevación de reposo
+ texto `secondary`. **Contraste verificado: 431 pares, 0 fallos, sin pares
nuevos** — reusa una combinación que la casa ya medía.

### Cómo la montás

```tsx
<AsaModal etiqueta={t('...abrirChat')} onPress={() => setAltura('medio')} sobre="superficie" />

<ModalDosAlturas
  altura={altura}
  onAltura={setAltura}
  altoPantalla={alto}
  etiquetaAsa={t('...asaHilo')}
  altoTeclado={altoTeclado}          // 🔴 OBLIGATORIO — ver abajo
  encabezado={<CabeceraCaso … />}     // arrastra igual que el asa
  hayCambiosSinGuardar={hayBorrador}
  onPedirConfirmacion={() => setPregunta(true)}
>
  …
</ModalDosAlturas>
```

### 🔴 `altoTeclado` NO es opcional en la práctica, y ahora hay guard

**La garantía del teclado es del MONTAJE, no de la pieza.** Si no le pasás
`altoTeclado`, **el teclado empuja el panel entero**. Ya pasó una vez y lo
escribió quien lo pagó, en el consumidor vivo:

> *«`ModalDosAlturas` acepta `altoTeclado` y **yo no se lo pasaba**»*

*Una garantía que la pieza ofrece y el consumidor tiene que acordarse de pedir
no es una garantía: es una opción con buen nombre.* ⇒ **nace `R81`**, que mide
los dos rojos: que la pieza siga asentando al soltar, y que **todo montaje
declare `altoTeclado`**. Si de verdad no hay teclado en esa pantalla, pasá
`altoTeclado={0}` — **una decisión se ve; un olvido no.**

Los dos brazos están probados en rojo contra los archivos reales. Y su ventana
de 40 renglones está **declarada**: no busca el `>` de cierre porque ese `>`
vive adentro de las props.

**En la galería** hay dos discriminadores nuevos al lado de los de video: la
hoja **con encabezado** y el asa **sobre superficie**.

---

## ② LOS FILTROS — es **`FiltroPills`**, y sirve TAL CUAL

El founder pidió *«como lo pusimos en prestador»*, y lo que el prestador usa es
`FiltroPills` de `packages/ui` (promovida en S85-B7). **No hay nada que
construir en `packages/ui`.**

### El patrón, y es lo único que escribís

Mirá `apps/prestador/src/components/filtro-oficio.tsx`: es **un adaptador de 40
líneas** que sólo aporta **el vocabulario** —qué opciones hay, su voz y su
capa— y **delega todo el dibujo a la pieza**. Su propia cabecera lo dice:
*«Lo que queda acá es lo único que ES de esta pantalla… El dibujo es de la
pieza.»*

Hacé `filtros-de-caso.tsx` con esa forma: dos hileras de `FiltroPills`, una por
**estado** y otra por **fecha**.

- **Estado**: `activo` (uno solo) o `activos` (varios) — la pieza normaliza los
  dos modos en un solo lugar.
- **Fecha**: la hilera de **ventana temporal** («todos · semana · …») ya existe
  como caso vivo y **va SIN glifo, con su razón escrita**: ese set no está en el
  registry.
- Si un eje tiene muchas opciones, `disposicion="envuelve"` — nació porque una
  tira escondía el 78 % de un eje **y no decía cuánto escondía**.

### ⚠️ Y el contrato de motor que viene con el patrón

En el prestador, **la ventana temporal es la CONSULTA, no un filtro de vista**:
«ver más» **ensancha la ventana y vuelve a consultar**, y no hay filtrado de
fechas en memoria. *Si lo hacés en memoria, el filtro miente en cuanto la
ventana no trae todo.* Está escrito en `apps/prestador/src/app/historico.tsx`.

### 🔴 Y el riesgo real de este pedido, medido y con nombre

**Una promoción no es una migración.** Esa misma pantalla del prestador siguió
**221 líneas** con su hilera propia después de que `FiltroPills` existiera —
*sin que nada fallara*: el filtro filtraba, el typecheck pasaba, el gate de
diseño pasaba. **Lo vio el founder comparando su pantalla con la galería.**

⇒ *nada en el árbol relaciona una pieza nueva con el código que debería
reemplazar.* **Si escribís una hilera de chips propia para postventa, ningún
gate te lo va a decir.**
