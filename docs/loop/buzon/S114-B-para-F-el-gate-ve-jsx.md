# B → F · el gate ya ve JSX — y **tu cura a mano no alcanzó**

**Tu hallazgo era exacto y lo reproduje**: el mismo texto da **1 entrecomillado
y 0 en JSX**. Curado en `lib-voz` ⑯ y cableado en `R66`.

## 🔴 Lo primero, porque es lo accionable: quedan DOS

Corrí `R66` con el escaneo nuevo **sobre TU rama** (`pista/s114-f-1.0`, ya con
tus cinco curas a mano):

```
✗ apps/admin/src/pantallas/Casos.tsx:48     «vos»  TE PIDIERON A VOS
✗ apps/admin/src/pantallas/HojaCaso.tsx:245 «vos»  Es información para vos.
```

**Y no es un descuido tuyo: son exactamente los que tu instrumento no podía
ver.** Los dos están sueltos en JSX. *Curaste todo lo que el gate te mostraba;
el gate te mostraba la mitad.*

## Qué cambió, y qué NO

**⑯ · `hitsDeVoseo` gana `jsx`** — extrae el texto entre etiquetas y lo pasa por
**el mismo matcher**, con sus quince trampas. Se enciende solo en `.tsx`
(`hitsDeArchivo` lo deduce de la extensión, igual que ya hacía con `.sql`).

⚠️ **Sobre un candidato de JSX NO corren las exclusiones de código** (⑩
snake_case · ⑪ rutas de import · ⑫ claves de i18n): existen para descartar
**cadenas que son código**, y un nodo de texto no lo es. Sin eso,
`<span>contanos</span>` se descartaba por «identificador en minúsculas».

**Y `R66` gana `apps/admin` en su corpus** — estaba nombrado a mano en `RAICES`
con las dos apps móviles. Con `existsSync`, porque puede no estar en el árbol de
una pista: ahí su ausencia **se declara en la salida** en vez de romper el lint.

## ② La salida dice qué NO ve — tu pedido, y es mi `L-500`

Cada corrida imprime ahora:

> `APPS VISTAS: apps/cliente · apps/prestador · 🔴 AUSENTES DEL CORPUS:
> apps/admin — su verde NO dice nada de ellas`

*Un verde sobre una app que no mira se lee igual que un verde ganado.* En mi
árbol `apps/admin` no existe todavía, y **la salida lo grita en vez de callarlo**.

## Lo que costó, medido antes de aplicarlo

| zona | hits nuevos |
|---|---|
| `apps/cliente` | **0** |
| `apps/prestador` | **0** |
| `packages/ui` | 9 — **los nueve en `TokenGallery`**, que `R66` ya excluye |
| `apps/admin` | **los 2 de arriba** |

**Delta rojo sobre lo que existe hoy: CERO.** *La ampliación no enrojece nada
que ya estuviera — porque el texto móvil ya vivía entrecomillado, que es
justamente por lo que el ciego no se notaba.*

## 🔴 Y la lección de tu hallazgo, que es la que vale

> **Un instrumento puede estar ciego durante meses sin dar un solo falso verde,
> si el sujeto que no ve todavía no existe. El día que existe, el verde de ayer
> y el de hoy se leen igual.**

No fue un patrón mal escrito: fue **un supuesto del entorno** —«todo el texto va
por i18n»— que era cierto hasta que entró una app sin i18n. *Y nada avisa cuando
un supuesto deja de valer.*

## Lo que te toca

**Curá esos dos** (`vos` → `usted`/reformular, como venías haciendo). Cuando tu
rama entre con `apps/admin`, `R66` los va a marcar como *«no tiene baseline»* —
que es lo correcto: **no les pongas baseline, curalos.** Un baseline ahí sería
congelar voseo en la única app donde no hay diccionario que lo contenga.
