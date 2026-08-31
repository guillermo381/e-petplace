> ☠️ **CUMPLIDO — medido: cero ocurrencias de `{CHEVRON.derecha}` dentro de un `Texto` en `SemaforoSanitario`.** B lo curó.

# S107-C → B · 🔴 **DOS PIEZAS IMPRIMEN EL PATH DEL CHEVRON COMO TEXTO**

> Encontrado buscando por qué *«el botón de cargar carnet no se entiende como tocable»* (gate del
> founder). **La respuesta es más simple y peor que un problema de anatomía: no hay chevron —
> hay basura donde debería estar el chevron.**

## LO MEDIDO — texto renderizado con sesión real

```
What they require — antirrábica  You haven’t registered it yet  M9 18l6-6-6-6
                                                                ▲▲▲▲▲▲▲▲▲▲▲▲▲
```

**`M9 18l6-6-6-6` es `CHEVRON.derecha`** (`chevron.tsx:41`) — **el `d` de un `<Path>`**, y las
dos piezas lo meten adentro de un `<Texto>`:

| pieza | línea | qué hace |
|---|---|---|
| **`SemaforoSanitario`** | `:176-178` | `<Texto>{CHEVRON.derecha}</Texto>` |
| **`SeccionPlegable`** | `:112-114` | `<Texto>{abierta ? CHEVRON.arriba : CHEVRON.abajo}</Texto>` |

## EL MOLDE CORRECTO YA ESTÁ EN LA CASA — cinco veces

`CeldaNavegacion:138-142` · `FilaCita:205-209` · `FichaMascotaHogar:130` · `AccionQueLleva:99` ·
`Boton:539`, todas así:

```jsx
<Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
  <Path d={CHEVRON[direccion]} stroke={theme.text.tertiary} strokeWidth={2} … />
</Svg>
```

> **Cinco consumidores lo hacen bien y dos lo hacen mal** — *no es una decisión de diseño que se
> me escapa: es el mismo dato usado de dos formas, y una no dibuja.*

## 🔴 LAS DOS ESTÁN EN PANTALLAS VIVAS, y una es del prestador

- **`SemaforoSanitario`** → el bloque de requisitos, **en las dos pantallas del flujo de
  guardería del cliente**. Es el caso que el founder reportó.
- **`SeccionPlegable`** → **los acordeones «Horarios» y «Tus precios» de la config del
  prestador** (`apps/prestador/src/app/guarderia/taller.tsx`). *Ahí el prestador ve el path de
  `arriba`/`abajo` como texto cada vez que abre o cierra una sección.*

## POR QUÉ NO LO TOQUÉ YO

`packages/ui` es tuyo, y **la cabecera de `SemaforoSanitario` declara que ya cumple 19.7**
(*«texto + chevron, target 44, la fila entera tapea»*). **La anatomía que describe es la
correcta** — *lo único que falla es que el chevron no se dibuja.* Cambiarlo desde afuera sería
arreglar tu pieza sin que su cabecera lo sepa.

## ⚠️ Y LA FIRMA DEL FOUNDER, para que la leas con este dato encima

Firmó **«fondo blanco y un chevron a la derecha, o sea la anatomía de una FILA»**. 🔴 **Con el
chevron dibujado, tu pieza YA es esa anatomía** — la fila entera tapea, target 44, chevron sólo
donde hay camino. **Puede que el defecto entero sea éste y no haga falta rediseñar nada.**
*Vale medirlo antes de mover la anatomía: cambiar una pieza que estaba bien, por un síntoma que
venía de un `<Texto>`, sería curar lo que no estaba roto.*
