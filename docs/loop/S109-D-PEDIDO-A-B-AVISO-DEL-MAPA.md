# PEDIDO D → B · `FichaPrestador` dice que el mapa no está, EN EL LUGAR del mapa

> **De:** pista D (S109) · **Para:** B (`packages/ui`) · 31-ago-2026.
> **Autocontenido a propósito:** la medición va adentro para que B no tenga que
> rehacerla. **Firma del founder:** *«que el mapa no está disponible, en
> palabras, ocupando el lugar donde iba — no un hueco que se cierra solo.»*

---

## ① QUÉ HAY QUE CAMBIAR

Hoy, `FichaPrestador` (línea ~525):

```tsx
{zonaLat != null && zonaLon != null && zonaRadioM != null ? (
  <MapaZona lat={zonaLat} lon={zonaLon} radioM={zonaRadioM} />
) : null}
```

El `: null` hace que, cuando el mapa no puede mostrarse, **el hueco se cierre
solo**. La pantalla no se rompe — **y tampoco dice nada**.

**Lo que se pide:** que en ese lugar quede **un aviso legible**, con la voz que
B decida y su token, ocupando el espacio donde iba el mapa. El resto de la ficha
—nombre, cohorte, historia, servicios, portadas— **sigue igual de usable**.

⚠️ **La forma la elige B**, incluida la prop: si el aviso llega como texto, como
booleano `zonaNoDisponible`, o como slot. D no propone anatomía de pieza.

---

## ② POR QUÉ LA VOZ NO PUEDE VIVIR EN LA PANTALLA — el punto que hace falta que B vea

Las pantallas **no montan el mapa**: le pasan tres props a `FichaPrestador` y la
pieza decide. **El guard vigente se aplica NO PASANDO las tres** — y esa forma se
eligió a propósito, porque no toca la pieza compartida.

⇒ Desde la pantalla **no hay dónde poner el aviso**: el mapa vive dentro del
cuerpo de la ficha, entre la historia y los servicios. Un `Texto` puesto por la
pantalla caería **fuera de ese cuerpo**, en otro lugar de la página. *El aviso
tiene que salir de donde el mapa iba a salir, y ese sitio sólo lo conoce la
pieza.*

**Contraste, para que la asimetría no parezca capricho:** las **cuatro**
superficies que ya hablan (paseo ×3, pedido en camino, el durante de guardería,
el pin de dirección) **montan el mapa ellas mismas** — ahí el texto es suyo y ya
está puesto (S109-D, commit `c9872408`). Las de `FichaPrestador` no pueden.

---

## ③ LA MEDICIÓN — TRES superficies, no seis

**Censadas por PROP, no por import** (la diferencia importa y es la lección
`L-451`): `FichaPrestador` tiene **seis consumidores**, pero **sólo tres le pasan
`zonaLat`**. Las otras tres la montan sin zona, así que `MapaZona` **nunca se
monta ahí** y no les cambia nada.

| # | superficie | app | guard hoy |
|---|---|---|---|
| 1 | `explorar/guarderia/[prestadorId]` | cliente | ✅ pasa `null` con el flag |
| 2 | `prestador/[prestadorId]` | cliente | ✅ pasa `null` con el flag |
| 3 | `(tabs)/cuenta/como-te-ven` | **prestador** | ✅ **desde hoy** — ver ④ |

**Las tres apagan en silencio.** Ninguna de las tres puede hablar sin este cambio.

---

## ④ EL HALLAZGO QUE VIAJA CON EL PEDIDO, porque cambia su urgencia

**«Cómo te ven» era la única de las tres que NO consultaba el flag** — pasaba
`prestador.zona_lat` directo. Y es **la app donde el flag SÍ mide** (sonda
nativa del manifiesto, a diferencia del cliente, donde hoy es una constante).

⇒ En un binario sin `geo.API_KEY`, el flag daba `false`, **esa pantalla no lo
consultaba, montaba el `MapView` igual y mataba la app en hilo NATIVO** — fuera
de toda ErrorBoundary, así que ninguna pantalla de error la atrapa.

**Curado hoy** (S109-D, commit `f66620f9`) con la misma forma de sus hermanas.
*El guard faltaba justo donde más servía* — y la razón por la que esto viaja
acá: **el aviso que se pide en ① es lo que esas tres van a mostrar el día que el
flag mida en las dos apps.** Sin él, el binario correcto muestra tres pantallas
que perdieron algo sin decir qué.

---

## ⑤ LO QUE ESTE PEDIDO **NO** PIDE

- **No pide tocar `MapaZona`.** La pieza del mapa está bien: `initialRegion` y
  `Circle` comparten centro, y con `AIRE = 2.6` el círculo ocupa **~77 % de la
  vista** con un radio de 500 m. **Medido, no supuesto** — el encuadre no es el
  defecto.
- **No pide decidir el flag.** Cuándo `MAPA_NATIVO_DISPONIBLE` pasa a medir en
  el cliente es de D y está **frenado con su razón** (el APK de nube es anterior
  al módulo de la sonda; el flip viaja con el próximo binario).
- **No pide una pieza nueva.** Si la casa ya tiene la forma de «acá iba algo y
  no está», **se reusa** — ese censo es de B.
