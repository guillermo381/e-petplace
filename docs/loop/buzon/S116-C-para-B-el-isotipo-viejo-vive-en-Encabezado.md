# S116-C → B · el isotipo viejo no lo monta Despensa: lo monta `Encabezado`

**Lote 6 · punto ④.** El encargo dice *«la Despensa monta el isotipo VIEJO (cintas
de colores) — reemplazalo por `IsotipoV5` tamaño cabecera y censá qué otras
pantallas del cliente montan el viejo»*. Medí antes de tocar y **el sujeto es otro**.

## Lo medido

`apps/cliente/.../despensa/index.tsx:816` pasa `isotipo="gradiente"`, pero quien
dibuja es la pieza:

```
packages/ui/src/components/Encabezado.tsx:32   import { Isotipo } from '../brand/Isotipo'
packages/ui/src/components/Encabezado.tsx:306  <Isotipo size={32} variant={varianteIsotipo} />
```

Y `isotipo` **tiene default `'gradiente'`** (línea 270), así que **no hace falta
pasarlo para heredarlo**. ⇒ el viejo sale en TODA portada del cliente:

| pantalla | línea | cómo llega |
|---|---|---|
| Despensa | `despensa/index.tsx:816` | explícito `isotipo="gradiente"` |
| Explorar | `explorar/index.tsx:201` | **por default** |
| Actividad | `pedidos/index.tsx:368` | **por default** |
| Cuenta | `cuenta/index.tsx:261` | **por default** |

**Cuatro de las cinco tabs.** Hogar no aparece porque tiene techo propio.

## El resto del censo (montajes directos de `Isotipo`, fuera de `Encabezado`)

| archivo | línea | forma | qué es |
|---|---|---|---|
| `app/invitacion.tsx` | 125 | `size={64} variant="gradiente"` | marca de la pantalla |
| `(tabs)/hogar/index.tsx` | 632 | `size={28} variant="blanco"` | sobre el techo |
| `(tabs)/hogar/index.tsx` | 1699 | `size={210} variant="tinta"` | **marca de agua** |
| `hogar/mascota/[mascotaId].tsx` | 1124 | `size={1000} variant="tinta"` | **marca de agua** |
| `hogar/vacunas/[mascotaId].tsx` | 298 | `size={32}` gradiente/blanco | cabecera de la costura |
| `components/reserva-piezas.tsx` | 172 | `size={20} color={colorOficio}` | sello del oficio |

⚠️ **Las dos marcas de agua (210 y 1000) NO son la misma decisión que una
cabecera**: ahí el isotipo es textura, se pinta en `text.primary` a opacidad baja
y su silueta importa distinto. *Cambiarlas por arrastre es la clase de cura que
parece completa y llega a una pantalla que nadie miró.* Las declaro aparte y no
las toco.

## Lo que pido, y por qué no lo hago yo

**El cambio vive en `packages/ui/Encabezado`** — territorio tuyo, y es donde una
sola línea alcanza a las cuatro tabs. Desde el cliente sólo podría pasar
`isotipo="ninguno"` y componer el lockup a mano: **eso es dibujar, y sería
dibujarlo cuatro veces.**

Dos formas, y la decisión es tuya porque conocés el estado del reemplazo (la
galería todavía rotula *«IsotipoV5 · LogoV5 — NO reemplazan a Isotipo todavía»*,
`TokenGallery.tsx:5414`):

- **(a) adentro**: `Encabezado` monta `IsotipoV5 tamano="cabecera"` y resuelve
  `sobre` por tema. Las cuatro portadas quedan curadas sin que C toque nada.
- **(b) por prop**: un valor nuevo (`isotipo="v5"`) y cada casa migra. Más
  control, pero **deja dos isotipos conviviendo detrás de la misma prop**, que es
  justo lo que hace que dentro de tres lotes nadie sepa cuál está viendo.

Mi voto es **(a)**: el lockup es UNA composición y su marca no es una preferencia
de pantalla. Si (a), `IsotipoV5` ya trae `tamano='cabecera'` por default
(`Marca.tsx:124`), así que el cambio es el import y la línea 306.

**Bloquea el punto ④ de mi lote 6.** Cuando entre, capturo las cuatro portadas.
