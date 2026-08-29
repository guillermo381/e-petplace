# S107-C → B · PEDIDO AUTOCONTENIDO — dos glifos para «Próximamente»

> **Qué se pide:** `wearables` y `certificaciones` en el registry de `Icono`.
> **Por qué a B:** **censo hecho antes de pedir** (orden de la mesa) — los glifos de los mundos viven en `packages/ui/src/components/Icono.tsx`, en el registry tipado `IconoNombre`; las apps **sólo consumen por nombre**. `apps/` no puede crearlos.
> **Bloquea:** la firma del founder de «Próximamente» con **cinco** entradas. Hoy la pantalla lista **tres** —hotel · seguros · Prime— y las dos que faltan son exactamente éstas.

---

## EL CENSO, con su resultado

| pregunta | medido |
|---|---|
| ¿los glifos de los otros mundos viven en `packages/ui`? | **sí** — `IconoNombre` los declara: `hotel` · `guarderia` · `seguros` · `telemedicina` · `prime` · `paseo` · `grooming` · `training` · `veterinaria` |
| ¿hay glifos propios de la app? | **no para mundos** — las apps montan `<Icono nombre="…">` |

⇒ **Territorio de B, sin ambigüedad.**

---

## LO QUE SE PIDE

```ts
// packages/ui/src/components/Icono.tsx — al registry
| 'wearables' | 'certificaciones'
```

🔴 **Siguen la familia existente — no se inventa un estilo para dos íconos.** Rigen tal cual:
- **Ley 12 / `DIRECCION_ARTE` §1:** *en cada ícono, la mascota está presente* — **objeto del oficio en trazo 1.9 + UNA huella rellena** en el hex de su capa.
- **§2.9: el gate es POR ÍCONO, a 21 px.** *A ese tamaño la huella sobrevive o es ruido* (Ley 9 afilada).
- **§6b:** si hace falta explorar la metáfora, el estándar es **2-3 variantes con su riesgo declarado** y montaje a 21 px + 44 px junto a cinco del registry.

**Capa sugerida, para que la elija B con criterio y no la herede de este pedido:**
- **`wearables`** — es un objeto que va **en el cuerpo del animal** y reporta su estado ⇒ suena a capa **`identidad`** (como veterinaria), no a `cuidado`. ⚠️ **Y hay contexto que conviene mirar: el hueco `M-WEAR` ya está reservado en la ficha de la mascota** (S51) — el mismo concepto va a necesitar glifo ahí, así que **nace con dos consumidores, no uno.**
- **`certificaciones`** — es un **papel que acredita** ⇒ pariente del certificado de salud (S90-D) y de la receta. Conviene mirar esos dos antes de dibujar: *si el papel que acredita ya tiene una forma en la casa, el tercero no la reinventa.*

---

## QUÉ HACE C CUANDO LLEGUEN

Dos líneas en `apps/cliente/src/app/(tabs)/explorar/index.tsx`: ensanchar la unión del array `proximamente` y agregar sus dos `push`. **Las voces (`explorar.proxWearables`, `explorar.proxCertificaciones`) las pongo yo** — son de la casa que las muestra.

---

## LO QUE NO SE HIZO, Y POR QUÉ NO ES UN OLVIDO

**No se listaron con un glifo prestado.** *Dos servicios con el ícono de un tercero se leen como ese tercero* — y en una lista cuya única función es decir qué viene, un ícono equivocado es la lista mintiendo. **Prefiero tres entradas correctas que cinco con dos disfrazadas.**
