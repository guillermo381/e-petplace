# S91 · LETRA DE DISEÑO DEL FOUNDER — LA BITÁCORA NACE SABIENDO (para C)

> **Depositada por A porque `docs/` es de A.** El texto del founder va
> VERBATIM; debajo, el estado MEDIDO del motor — registro de A, no firma.
> **El motor ya está entero: esta letra es de superficie.**

## LA LETRA, VERBATIM (founder, 8-ago-2026)

> «LA BITÁCORA NACE SABIENDO: vive en el perfil de la mascota y hereda su
> contexto entero: jamás pregunta especie, raza ni nada que el perfil ya
> sabe; los chips ofrecidos llegan YA filtrados por `especies_aplicables` y
> sujeto (un gato jamás ve «Ladró», un acuario jamás ve conductas de
> individuo); levantar el guard `sin_contexto_activo`; entrada desde el
> perfil, intuitiva — pocos toques, cero formulario. Cada entrada sedimenta
> en el Bio-Expediente (Eje 6: el dueño como productor — es el eje
> cumpliéndose) y queda legible para el Coach. Gate founder en dispositivo
> con tres casos: Thor (perro), un gato, y el acuario — cada uno debe ver
> SOLO su vocabulario.»

## EL MOTOR YA HIZO SU MITAD — lo medido

**☠️ EL GUARD `sin_contexto_activo` MURIÓ** (migración `20260808020000`). La
bitácora ya no exige programa ni cita de adiestramiento: **cualquier mascota
la tiene**. *El ancla al programa SE CONSERVA — cuando hay uno activo la fila
lo sigue registrando: se soltó la exigencia, jamás el dato.*

**El vocabulario: 19 conductas, cero preliminares.** Los dos ejes vienen
EXPLÍCITOS en las 19 filas (nada de NULL «que significa todas»):

| lo que la mascota es | cuántos chips ve |
|---|---|
| perro | 16 |
| **gato** | **15** (no ve «Se arrancó plumas») |
| **ave** | **14** (no ve «Se rascó», no ve «Vomitó») |
| conejo · roedor | 15 |
| **acuario** | **3, y son OTROS** (agua · habitante · alimentación del conjunto) |

**Los tres conjuntos del gate son distintos entre sí — esa es justamente la
prueba que el founder va a mirar.** Y ninguna conducta nombra al perro:
verificado por cinturón dentro de la migración (`ILIKE '%ladr%'`, `'%dog%'`,
`'%bark%'` → 0).

## LO QUE C NO TIENE QUE HACER: FILTRAR

`obtenerVocabularioBitacora(filtro?)` **ya filtra en la puerta única**:

```ts
const chips = await obtenerVocabularioBitacora({
  especie: mascota.especie,   // 'perro' | 'gato' | 'ave' | 'pez' | …
  sujeto:  mascota.sujeto,    // 'individuo' | 'acuario'
});
```

Los dos campos **ya vienen en `MascotaResumen`** (`obtenerMascotasDeFamilia`)
y en el perfil: **el perfil ya los sabe, que es exactamente lo que la letra
pide — no se le pregunta a nadie.**

⚠️ **Sin filtro devuelve TODO**, y es a propósito (el taller del prestador y
la galería lo necesitan). **Ausencia de filtro NO es «todas las especies»:
es «no filtres»** — dos cosas distintas que se confunden fácil, y confundirlas
acá le muestra «Ladró» a un gato.

## EL PUNTO FINO DEL ACUARIO

Un acuario **no tiene raza, no tiene sexo y no tiene conductas de individuo**.
Sus tres chips hablan del SISTEMA. Si la pantalla hereda el contexto entero
como pide la letra, esto sale gratis: `sujeto='acuario'` ya lo dice todo.

**Y lo que la enmienda del founder dejó sin cubrir, dicho para el gate:** su
glosa nombra «agua, mantenimiento, observación del conjunto» y **las tres
conductas construidas cubren agua y observación — mantenimiento no**.
Propuesta de A para el gate en dispositivo, **no construida**: «Le cambié
parte del agua», que es EL acto de mantenimiento de un acuario. Se firma
mirando los chips.

## LO QUE SÍ ES DE C

1. **La entrada desde el perfil** — pocos toques, cero formulario.
2. **Pasar el filtro** (las dos líneas de arriba).
3. **El gate en dispositivo con los tres casos**: Thor · un gato · el acuario.
   *Si los tres vieran lo mismo, el filtro no estaría rigiendo* — ese es el
   discriminador, no que «se vea bien».
4. **La voz**: los 19 chips ya tienen `nombre_familia` y `nombre_familia_en`
   firmados. **El gate de strings final es del founder sobre los chips
   vivos**, no sobre esta tabla.

## LO QUE SEDIMENTA (y ya funciona)

Cada entrada nace como evento del **Eje 6** del Bio-Expediente con el dueño
como productor — **no es feature nueva: es el eje cumpliéndose**, y el motor
ya lo hacía desde S63. Lo único que cambió es que ahora puede ocurrir sin un
programa de adiestramiento de por medio.
