# El mapa para decidir el rediseño — design system y tokens, **medidos**

Instrumento: **`npx tsx scripts/_inventario-ds.mts`**, corrido sobre `cb3e34c9`
(7-sep-2026). *Vive en `scripts/` y no en este doc para que el mapa se pueda
volver a correr: un inventario escrito a mano envejece el día que alguien agrega
una pieza, y nadie se entera.*

---

# ① EL DESIGN SYSTEM

## 🔴 El número que decide, y corrige algo que yo mismo escribí

**El lenguaje del tablero está en 0 de 195 pantallas.**

En la dirección del Hogar escribí *«acá hay tres lenguajes conviviendo»*. Medido,
**es falso y en la dirección más importante**: no conviven tres. Conviven **dos
viejos** —capas (5 pantallas) y marca/gradiente (1)— **y el tercero, el nuevo,
todavía no llegó a ninguna pantalla.** Existe sólo como piezas.

⚠️ Y hay **una sola** pantalla con dos lenguajes a la vez: **el Hogar**. *No hay
una epidemia de mezcla: hay una pantalla mezclada y un lenguaje nuevo que no se
montó.*

**Qué significa para la decisión:** *el rediseño no tiene que elegir entre lo que
hay y algo nuevo — lo nuevo ya está construido y sin estrenar.* La pregunta real
no es «¿sobre qué base?», es **«¿por qué 13 piezas terminadas no llegaron a una
pantalla?»**

## Las piezas

| | |
|---|---|
| piezas dibujables | **171** |
| con consumidor en apps | **133** |
| sólo consumidas dentro de `ui` | 20 |
| sin consumidor, **entregadas ahora** (esperan pantalla) | 13 |
| 🔴 sin consumidor **y con edad** | **5** |

⚠️ **«Sin consumidor» no es «muerta», y mezclarlas arruina el número.** El corte
es la EDAD, medida con git y no con la impresión de quien las escribió. Las
cinco con edad son candidatas de Ley 37 **y ninguna es un diagnóstico todavía**
—hay que preguntarle a su pista si esperan pantalla—:
`CierreEnCurso` (14 d) · `HiloDelDia` (10 d) · `SelectorRoster` (10 d) ·
`SelectorDestinoDonacion` (6 d) · `BotonBajarAlFinal` (4 d).

**Las diez más montadas** (archivos de apps que las nombran): `Boton` 224 ·
`Texto` 211 · `Encabezado` 163 · `EstadoVacio` 144 · `Tarjeta` 136 ·
`Esqueleto` 134 · `Hoja` 123 · `Separador` 106 · `Celda` 92 · `Campo` 74.
*Ésas diez son el idioma real de la app: cualquier dirección nueva que no las
contemple no es una dirección, es una segunda casa.*

## 🔴 Y el contador del canon está vencido: dice 53, son 171

El canon publica **«53 archivos-componente» (re-medido en S85)**. Hoy son **171**
—más del triple— y el número lleva **veintiocho sesiones** sin re-medirse.
*Un contador que se escribe a mano decae; por eso este inventario es un comando.*

---

# ② LOS TOKENS

## 🟢 Lo que está sano, y conviene no re-auditar

**Cero colores aplicados a mano.** Medido sobre `color|backgroundColor|
borderColor|stroke|fill` con hex literal, fuera de `tokens/` y `themes/`:
**0 ocurrencias**, en `packages/ui` y en las dos apps. `R35` dice lo mismo y
tiene razón.

**`borderRadius` con número crudo: 4**, con baseline 3 en `R37` — vigilado.

## ⚠️ Lo que se escapó, y no es lo que parecía

**45 hex escritos a mano en 22 archivos… todos en COMENTARIOS.** Al
caracterizarlos —antes de reportarlos como violaciones— resultan ser prosa que
describe tokens: *`'tinta' → #1D1A2E (CTA/marca sobre claro)`*.

🔴 **No son un incumplimiento: son una superficie de decaimiento.** *El día que
un token cambie de valor, esos 45 números pasan a mentir, y ningún gate los
mira.* Y la casa **ya pagó por esto**: el canon registra que la barra de tabs se
pintó de negro *«por elegir el token LEYENDO su comentario»*, que llevaba cuatro
sesiones vencido.

**`fontSize` con número crudo: 9**, concentrados: 7 en `lamina-fusion.tsx` (una
lámina), 1 en el Hogar, 1 en el perfil de mascota.

## 🔴 Los dos tamaños que nacieron sueltos, y su uso real

| token | consumidores |
|---|---|
| `size.control` (13) | **2** |
| `size.metrica` (18) | **1** |
| `size.sm` (14) | 74 |
| `size.base` (16) | 49 |
| `size.xs` (11) | 25 |
| `size.lg` (22) | 20 |
| `size.md` (20) | 19 |

**Los dos con nombre propio suman 3 consumidores entre ambos**, contra 187 de la
escala de prosa. *Nacieron bien —cada uno con su porqué escrito y su firma— pero
el número dice que hoy son excepciones de un solo sitio, no peldaños.*

⚠️ **Y eso es exactamente lo que una dirección nueva tiene que decidir:** o se
adoptan (y entonces «Tus servicios» y los controles los usan de verdad), o se
jubilan y su caso vuelve a la escala. **Dejarlos con un consumidor es la forma
de que dentro de tres sesiones nadie recuerde por qué existen.**

## Las excepciones firmadas, con su uso

`accent.control` **40** · `accent.cta` **22** · `sobreVideo` **16** ·
`motion.marca` **10** · `motion.coach` **2**.

*Las cuatro primeras están vivas y son idioma corriente.* **`motion.coach`, con
2, es la única que se parece a las de arriba**: una excepción firmada que casi
nadie usa. No la toco —es física de marca y su razón vive en `DIRECCION_ARTE`
§5— pero **entra a la misma pregunta que `control` y `metrica`**.

---

# Lo que este mapa NO dice

· **No dice si el rediseño conviene**: dice sobre qué se haría.
· **No juzga las cinco sin consumidor**: dice su edad. *Quién las esperaba lo
  sabe su pista, no este script.*
· **No mide lo que se ve**, sólo lo que se escribe. La mezcla del Hogar la vio
  el ojo primero; acá está su número.
