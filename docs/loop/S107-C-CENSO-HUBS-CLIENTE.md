# S107-C · CENSO — las cinco pantallas del cliente, medidas

> **Orden de la mesa:** censar las cuatro que funcionan, decir en qué difiere guardería **con lo medido**, y recién después proponer. **Cero código tocado.**
> **Todo lo de acá sale de `grep` sobre los archivos, no de memoria.**

---

## ① LOS CHIPS DE MASCOTA — lo que el founder nombró primero, y es de una línea

| pantalla | con qué elige la mascota |
|---|---|
| `/hogar/paseos` | **`FiltroMascotas`** |
| `/hogar/grooming` | **`FiltroMascotas`** |
| `/hogar/adiestramiento` | **`FiltroMascotas`** |
| `/hogar/veterinaria` | **`FiltroMascotas`** |
| 🔴 **`/hogar/guarderia`** | **`SelectorOpcion`** genérico |

**Y no sólo en el hub: los CUATRO flujos de reserva (`/explorar/<oficio>/index.tsx`) también montan `FiltroMascotas`.** Cinco de cinco pantallas de la casa usan la misma pieza; **la mía es la única que no.**

**Qué se pierde con `SelectorOpcion`, medido:** `FiltroMascotas` recibe las mascotas con su **`fotoUrl` resuelta por `caraDeMascotaPorRuta`** — *la cara del animal*. `SelectorOpcion` recibe `{codigo, etiqueta}`: **sólo texto**. Por eso «no salen bien»: **no es un chip mal configurado, es otro control.**

---

## ② LA ARQUITECTURA DE LA CASA — dos lugares por oficio, y yo tengo uno solo mal puesto

**Medido: cada oficio vive en DOS sitios con papeles distintos.**

**A · `/hogar/<oficio>` — EL LOG.** Esqueleto idéntico en los cuatro:

1. `Encabezado variante="navegacion"` con `atras`
2. **`FiltroMascotas`** — sólo si hay más de una
3. **`FiltroPills`** — el eje de ESTADO (próximos / historial); algunos suman un segundo eje
4. `EstadoVacio` para error **con `Boton` de reintento**, y otro para vacío
5. Filas **`FilaCita`** — el historial
6. **`Boton` al pie** → `router.navigate('/explorar/<oficio>', { mascotaId })`

**B · `/explorar/<oficio>/` — EL FLUJO.** Medido: los cuatro tienen `index.tsx` (el CUÁNDO) · `disponibles.tsx` (el QUIÉN) · `checkout.tsx`. Paseo suma `paquete.tsx`; adiestramiento, `confirmar-programa.tsx`.

### Guardería, contra eso

| lo que la casa tiene | lo que guardería tiene |
|---|---|
| `/hogar/<oficio>` = **el log del servicio** | 🔴 `/hogar/guarderia` = **una pantalla de búsqueda** (mascota + día + lista de lugares). **No hay log: la familia no tiene dónde ver sus estadías.** |
| el CTA al pie lleva a `/explorar/<oficio>` | 🔴 **no existe `/explorar/guarderia`** |
| el flujo vive bajo `explorar`, con su `Stack` | 🔴 el mío vive en **`/guarderia/[prestadorId]`** y **`/guarderia/checkout`**, fuera de `explorar` |
| `FiltroPills` para el eje de estado | 🔴 **no hay** |
| `FilaCita` para el historial | 🔴 **no hay** |
| **tamaño de archivo**: 15–52 KB | **9,6 KB** |

> ### El diagnóstico en una línea: **construí el FLUJO dentro del lugar del LOG, y nunca construí el log.** Por eso «la primera pantalla no coincide con la de sus hermanas»: **no es una versión distinta de la misma pantalla — es otra pantalla.**

---

## ③ LA PROPUESTA — qué se reusa, qué es genuinamente distinto, qué era distinto sin razón

### 🟢 SE REUSA TAL CUAL (era distinto sin razón)

1. **`FiltroMascotas`** en lugar de `SelectorOpcion`, en el hub **y** en el flujo. *Es el hallazgo del founder y es de una pieza.*
2. **El esqueleto del hub**: `Encabezado` → `FiltroMascotas` → `FiltroPills` (próximos/historial) → `FilaCita` → `Boton` al pie. **Copiado de grooming, que es el más corto de los cuatro.**
3. **`EstadoVacio` con `Boton` de reintento** para el error — los cuatro lo hacen igual; el mío usa `EstadoVacio` sin acción en un caso.
4. **El flujo se muda a `/explorar/guarderia/`** con los nombres de la casa: `index.tsx` · `disponibles.tsx` · `checkout.tsx`. *Hoy vive en `/guarderia/…`, que no es donde la casa pone los flujos.*
5. **El CTA al pie con su `razonDeshabilitado`** — los cuatro lo montan; el mío no tiene CTA al pie.

### 🟡 GENUINAMENTE DISTINTO — porque el oficio lo pide

1. **La estadía-día no tiene hora.** Donde los otros eligen **hora**, guardería elige **día**, y sus dos ventanas son del lugar, no de la reserva. ⇒ **el `index.tsx` del flujo muestra el calendario de cupo, no una grilla de horas.** *Esto no se empareja: emparejarlo sería inventar una hora que no existe.*
2. **El QUIÉN llega DESPUÉS del día, y con cupo.** En los otros, `disponibles.tsx` lista quién puede a esa hora; acá lista **quién tiene lugar ese día** — misma forma, otra pregunta. **Se reusa el nombre y el lugar; el contenido es propio.**
3. **El semáforo sanitario** no tiene equivalente en los otros cuatro. **Se queda.**
4. **El calendario del lugar** (`CalendarioCupo`) no tiene equivalente. **Se queda, pero adentro del flujo.**

### 🔴 LO QUE FALTA Y NO EXISTÍA — el log

**La familia no tiene dónde ver sus estadías.** Ni próximas ni pasadas. Los otros cuatro lo tienen y es la mitad de su hub.
⚠️ **Y necesita un lector que hoy no existe**: `obtenerEstadiasDelDia` es **del prestador y por día**. **Del lado de la familia no hay nada** — es pedido a A, y sin él el hub de guardería **no puede tener log**.

---

## ④ LO QUE NO HICE, Y ES LA ORDEN

**No toqué una línea.** *La casa tenía la respuesta escrita y el trabajo era leerla* — y leerla dio un diagnóstico distinto del que yo habría «arreglado» a ojo: **habría cambiado el chip y la pantalla habría seguido sin parecerse, porque el problema no era el chip: era que construí el flujo donde va el log.**
