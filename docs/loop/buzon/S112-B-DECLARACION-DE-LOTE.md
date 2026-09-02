# S112-B → A y C · DECLARACIÓN DE LOTE · hasta qué SHA entra `pista/s112-b`

> ## ✅ **MERGEÁ EL TIP DE `pista/s112-b`.**
> ## **EL CÓDIGO TERMINA EN `ecff9799460156caa2bf96cf2606acbbef5913bc`** — todo lo posterior en esta rama es documentación.
>
> Los cinco commits de código son aditivos, ninguno tiene consumidor en `apps/`
> que pueda romper, y el único que toca una pieza con consumidores vivos
> (`FiltroPills`) queda **probado equivalente** en la rama que esos consumidores
> usan (ver ③). **No hay corte parcial, y es decisión, no comodidad.**
>
> ⏪ **ESTE BLOQUE SE ESCRIBIÓ MAL DOS VECES, y la falla es de forma, no de
> dato:** las dos primeras versiones nombraban un SHA **que incluía a este
> archivo**, así que **quedaban viejas en el acto de commitearse** — el commit de
> la declaración se pone encima del SHA que declara. *Una declaración que se
> nombra a sí misma no puede ser estable.* La forma que no decae es ésta: se
> nombra **el último SHA de CÓDIGO**, que no se mueve cuando la documentación
> avanza, y para lo demás se apunta al tip.

---

## ① EL ROJO QUE C LEVANTÓ ESTÁ CURADO, con su control

**Curado en `ba730968`.** El defecto era real y estuvo commiteado en verde.

| | `apps/prestador` |
|---|---|
| el archivo como estaba en `55f51ad6` | **1 error** — `Boton.tsx(752,13) TS2322` |
| **HEAD `ecff9799`** | **0** |

**Reproducido acá, no aceptado de palabra:** mismo archivo, **misma línea 752**,
mismo mensaje que C reportó. *El instrumento produce su rojo antes de que se le
crea el verde.*

**La causa:** el spread condicional `...(cond ? transicion : null)` deja las tres
`transition*` como `?: T | undefined` dentro del objeto de estilo, y el tipo de
Reanimated no las acepta así — **un `| undefined` explícito no es «ausente»**.
El `as const` lo empeoraba (tuplas `readonly`). **La cura:** se elige entre DOS
OBJETOS COMPLETOS en vez de spreadear una condición; una rama trae las tres
presentes, la otra no las tiene, ninguna declara claves opcionales.

⚠️ **La forma que C propuso no compila** —una entrada del array que trae sólo
`transition*` es rechazada— y se declara porque **su diagnóstico sí era el
correcto**: se tomó la mitad que era la causa, montada donde compila.

## ② `BotonProps` SIGUE BYTE-IDÉNTICA — probado mecánicamente, no a ojo

Extraído el bloque `export interface BotonProps` de `main` y de `HEAD`, sin
comentarios: **14 líneas de contrato en las dos, IDÉNTICAS.**

```
etiqueta · onPress? · superficie? · variante? · tamaño? · bloque? ·
cargando? · deshabilitado? · iconoIzq? · chevron? ·
razonDeshabilitado? · onRazon?
```

⇒ **ningún consumidor puede romper por tipo.** Lo que cambió es lo que la pieza
HACE con lo que ya le pasaban.

## ③ LO ÚNICO QUE TOCA UNA PIEZA CON CONSUMIDORES VIVOS, y su prueba

`FiltroPills` gana un modo de selección múltiple (unión aditiva con `?: never`).
**Su único consumidor en el recorrido de guardería es
`apps/cliente/src/app/(tabs)/hogar/guarderia.tsx`, y usa el modo de UNA.**

**Equivalencia de conducta en esa rama, línea por línea:**

| | antes | ahora | |
|---|---|---|---|
| elegido | `o.codigo === activo` | `estaElegido(c)` → `props.activo === c` | ≡ |
| toque | `elegido && onLimpiar ? onLimpiar() : onCambio(c)` | `alTocar` → la misma condición | ≡ |
| rol a11y | `"radio"` | `varias ? 'checkbox' : 'radio'` ⇒ `radio` | ≡ |
| estado a11y | `{ selected }` | `varias ? {checked} : {selected}` ⇒ `{selected}` | ≡ |

**Mezclar los dos modos no compila** (`TS2322`, probado en rojo).

## ④ POR QUÉ ESTE LOTE LE SIRVE AL RECORRIDO DE MAÑANA — con el número

**De los SEIS botones que hoy frenan sin decir por qué, CINCO son de guardería:**

```
(tabs)/explorar/guarderia/[prestadorId].tsx     ← guardería
(tabs)/explorar/paseo/checkout-paquete.tsx
(tabs)/hogar/guarderia.tsx                      ← guardería
guarderia/[estadiaId].tsx                       ← guardería
guarderia/documentos.tsx                        ← guardería
guarderia/taller.tsx  (prestador)               ← guardería
```

**Los cinco ganan su línea sin que C ni D toquen una sola línea de código:** ya
pasaban `razonDeshabilitado`; lo que faltaba era que la pieza lo dibujara.

## ⑤ ESTADO MEDIDO DEL SHA QUE SE DECLARA

| medición | valor |
|---|---|
| `packages/ui` · `apps/cliente` · `apps/prestador` | **0 · 0 · 0** |
| `verify:diseno` | **VERDE, 62 reglas** |
| `verify:razon-muda` | **VERDE**, 6, baseline 6 |
| árbol | **limpio** |
| local vs origin | **`ecff9799` = `ecff9799`** |

⚠️ **Los tres typechecks corren con `node_modules` instalado en el worktree**
(`pnpm install`, 3,8 s). **Sin eso el número no vale**: mis reportes anteriores
decían «0 fuera de la clase heredada» y esa «clase heredada» era mi worktree sin
deps — *es exactamente cómo este rojo llegó a estar commiteado en verde.*

## ⑥ LO QUE NO ESTÁ VERIFICADO, y no se maquilla

**Nada de esto se vio en aparato.** Las cuatro láminas de gate viven primeras en
la galería (`⭐ GATE S112`) y esperan el ojo del founder:
la razón del botón · `TarjetaAdoptable` · la vidriera con sus chips ·
la tarjeta de todo-desconocido de `Convivencia`.

**Lo que el código no puede probar y sólo el founder puede:** que la línea de la
razón se lea como una explicación de la casa y no como un error, y que al
encenderse el botón **la regla de abajo no se mueva**.

## ⑦ A: LO QUE TE DEJO ABIERTO Y NO TOQUÉ

`verify:razon-muda` mide una propiedad que **acaba de volverse falsa** y su
trinquete ahora **castiga lo correcto** (cada razón nueva sin `onRazon` sube el
número). Ficha con las tres salidas y mi voto en
`S112-B-para-A-gate-razon-muda.md`. **No lo bajé con `onRazon` vacíos.**
