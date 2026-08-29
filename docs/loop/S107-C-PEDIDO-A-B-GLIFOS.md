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

## 🔴 QUÉ SON LOS DOS — dictado del founder (29-ago), y es lo que decide el dibujo

### `certificaciones` — **documental, y de la MASCOTA**

La familia **obtiene y guarda acreditaciones** de su animal: adiestramiento aprobado · **mascota de servicio** · **mascota de apoyo emocional** · documentos para **salida del país**.

> 🔴 **NO es una medalla de negocio ni un diploma de profesional.** *Ese es el error fácil —«certificación» suena a credencial de quien trabaja— y acredita a la persona equivocada.* **El objeto es un documento acreditado / un sello**, y el acreditado es el animal.
>
> ⚠️ **Conviene mirar antes de dibujar:** la casa ya tiene **el certificado de salud** (S90-D) y **la receta** — dos papeles que acreditan. *Si el papel que acredita ya tiene una forma acá, el tercero no la reinventa.*

### `wearables` — **hardware, y monitoreo continuo**

Dispositivos que **se le ponen a la mascota y leen su estado**: GPS y ubicación en tiempo real · frecuencia cardíaca · actividad.

> 🔴 **JAMÁS un corazón médico.** *Un corazón dice consulta —un episodio, alguien que mira una vez—; esto es lo contrario: algo puesto encima que mide todo el tiempo.* **El objeto es el dispositivo, o la señal que emite.**
>
> ⚠️ **Nace con DOS consumidores, no uno:** el hueco **`M-WEAR`** ya está reservado en la ficha de la mascota desde S51. *Vale dibujarlo sabiendo que va a vivir también ahí, y no sólo en una lista de promesas.*

**La capa la elige B** — este pedido no la hereda. Como insumo: `wearables` **va sobre el cuerpo del animal y reporta su estado**, que suena a `identidad` antes que a `cuidado`; `certificaciones` es papel que acredita, pariente del certificado de salud.

---

## QUÉ HACE C CUANDO LLEGUEN

Dos líneas en `apps/cliente/src/app/(tabs)/explorar/index.tsx`: ensanchar la unión del array `proximamente` y agregar sus dos `push`. **Las voces (`explorar.proxWearables`, `explorar.proxCertificaciones`) las pongo yo** — son de la casa que las muestra.

---

## LO QUE NO SE HIZO, Y POR QUÉ NO ES UN OLVIDO

**No se listaron con un glifo prestado.** *Dos servicios con el ícono de un tercero se leen como ese tercero* — y en una lista cuya única función es decir qué viene, un ícono equivocado es la lista mintiendo. **Prefiero tres entradas correctas que cinco con dos disfrazadas.**
