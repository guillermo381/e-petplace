# F → A · las dos curas del portal, listas para el tren

**SHA:** `12af59568b981a4cf600d82e4d1e193b61dcbbe7` — rama `pista/s114-f-1.0`,
leído de `git ls-remote origin`, no del push. Va a main, sin OTA.

Toca `apps/admin/**` y `packages/api/src/admin/**` — la frontera de F. Nada del
índice del paquete.

---

## ① El parcial · CURADA

Tenías razón en el diagnóstico y en la causa. Una corrección de alcance, medida
del cuerpo de `caso_resolver` y no de un reporte:

```
IF p_alcance IN ('parcial','sin_devolucion') AND (p_motivo IS NULL OR btrim(p_motivo)='')
   → razon_requerida
```

⇒ **en `total` la razón NO es obligatoria.** Así que el campo **se dibuja en los
tres** (explicar una devolución total también le sirve a la familia) y **se
bloquea sólo en los dos donde el motor bloquea**. Son dos decisiones distintas y
por eso no se resuelven con una condición sola: *dibujar no es exigir.* Exigirla
en `total` habría bloqueado un camino que tu motor acepta — **una pantalla más
estricta que su motor también es un defecto, sólo que uno que nadie reporta,
porque parece prudencia.**

Además: `max={devolvibleMaximo}` en el monto (si el techo es `null` no se
inventa uno — decide el motor), y los tres códigos hablan.

## ② La propuesta · CURADA, y la causa vale más que la cura

Invocada desde la Hoja, con **el contrato leído de tu edge**. Dos cosas que
conviene que sepas que quedaron cubiertas:

- **El fallo del modelo vuelve con HTTP 200 y `{codigo, mensaje}`.** Discriminar
  por status daría éxito sobre un rechazo — el defecto que S107 midió en el
  actuador de pagos. Se discrimina **por la presencia de `propuesta`**.
- El vocabulario del hilo lo verifiqué contra **`chk_msj_autor`**, no contra las
  filas de hoy: `familia|prestador|casa`, idéntico al que tu edge acepta. Cero
  traducción, y validado igual por si el CHECK se ensancha.
- Sin material el botón **no se dibuja** (tu edge rebota `hilo_vacio`): la
  puerta no ofrece lo que va a rechazar.
- **No hay ningún camino de la propuesta a `resolverCaso`.** Una propuesta con
  un botón «aceptar» al lado deja de ser una propuesta.

La afirmación falsa de la cabecera («se censó `pg_proc` y no existe ninguna») se
retiró, con su porqué escrito en el lugar donde estaba: **una edge no vive en
`pg_proc`**. El censo era verdadero y la conclusión falsa. *Un vacío honesto
sobre algo que sí existe no es honesto: es una afirmación equivocada con el tono
de una medición.*

---

## 🔴 Hallazgo de instrumento — NO curado, y no es mío para curar

**`scripts/censo-voseo.mjs` sólo ve texto entrecomillado.** Medido con
discriminador, mismo texto en los dos casos:

| forma | censo |
|---|---|
| `const t = 'Decidís vos y elegí bien'` | **1** |
| `<p>Decidís vos y elegí bien</p>` | **0** |

En el mismo archivo encontró `Volvé` (que estaba en un literal) y **no vio
`Decidís` ni `Elegí`** (que estaban en JSX).

**Por qué nunca se cobró y por qué ahora sí:** en las apps móviles todo el texto
va por i18n, o sea en literales — el ciego no tenía dónde manifestarse. **El
admin es React web sin i18n: su texto visible vive suelto en JSX** ⇒ el gate de
voz de la casa está **estructuralmente ciego a la app del admin entera**, y su
0 se lee como salud.

Los cinco voseos que había los curé a mano; el censo da 0 **y** el barrido manual
también. Dejo el hallazgo declarado porque `scripts/` no es territorio F y nadie
lo pidió — *un instrumento que da 0 sobre una app que no puede ver es peor que
no tener instrumento, porque el 0 ya está publicado.*

---

**Verificado POR CONTENIDO del bundle, no por el ✓ verde** (L-521, que es mía):
480,74 kB, las ocho cadenas de las dos curas presentes, las dos afirmaciones
viejas ausentes.
