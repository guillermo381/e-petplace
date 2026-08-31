# FICHA · LA TERCERA TRAMPA DE LA FORMA PATHSPEC (regla 84 ①)

> **Sin número a propósito.** El número se toma **en el acto de depositar en el
> archivo canónico** — releer el máximo y escribir el depósito son UN solo acto,
> en el mismo commit (enmienda de numeración FIRMADA en S107). `docs/` de canon
> es territorio de A: **acá va el contenido; el número lo pone quien deposita.**

**Origen:** S107-B, defecto propio. **Estado:** curado en `320bf589`; la
enmienda al canon **NO está hecha** — es lo que esta ficha pide.

---

## LO QUE EL CANON YA DICE

`CLAUDE.md` (regla 84 ①) declara la forma pathspec **con sus dos trampas
medidas**:

> ① `git commit -- <rutas>` **forma pathspec SIEMPRE** —el índice es UNO por
> repo y `git commit` se lleva el índice entero— con sus dos trampas medidas
> (**el `-m` va ANTES del `--`**; la forma pathspec **no ve archivos sin
> trackear**: `git add -N` primero)

**Son dos, y hay una tercera.**

## LA TERCERA: **LA FORMA PATHSPEC NO REGISTRA EL BORRADO QUE NO LE LISTÁS**

Al renombrar `FichaPaquete.tsx` → `FichaDeOferta.tsx` listé **el archivo nuevo**
y no el viejo. El commit **creó la pieza nueva y no registró el borrado de la
vieja**: para git el rename es *dos operaciones*, y la forma pathspec commitea
**exactamente lo que se le lista** — que es justo la propiedad por la que la
casa la eligió.

**El daño si pasaba:** `main` con **las dos piezas**, la vieja ya sin export en
`index.ts` ⇒ **código muerto que nada señala** — exactamente `D-645` (*una
promoción no es una migración*), cometida por quien venía declarándola en su
propio parte.

## 🔴 POR QUÉ ES DE LA MISMA FAMILIA QUE LAS OTRAS DOS, Y NO UN DESCUIDO

Las tres trampas comparten **un solo mecanismo**: *la forma pathspec obedece la
lista y nada más*. Eso es su virtud —**es inmune al índice de otra pista**— y es
su modo de falla. Y **las tres fallan hacia el mismo lado: en SILENCIO, con un
commit que sale verde.**

- El `-m` después del `--`: el mensaje se lee como ruta.
- El archivo sin trackear: no está en el índice, no viaja.
- **El borrado no listado: la operación existe en el disco y no en el commit.**

⇒ **Ninguna de las tres produce un error.** *Un commit que sale bien y se llevó
la mitad de lo que hiciste no tiene síntoma hasta que otro lo mergea* (`L-192`
en su forma más barata: **el modo de falla es una salida creíble**).

## CÓMO SE ENCONTRÓ — y esto es la mitad que importa

**No lo encontró una revisión: lo destapó `git merge` fallando por índice
sucio.** *Nadie audita lo que un commit NO se llevó — porque no hay nada que
mirar.*

## LA CURA, y por qué NO es «acordarse»

**Un archivo que se renombra o se borra se lista JUNTO con su reemplazo** —
`git commit -F <msg> -- <nuevo> <viejo>`. Y la verificación que lo prueba sin
depender de la memoria, **una línea, después de commitear**:

```sh
git status --porcelain    # tiene que salir VACÍO
```

*Un `D ` colgando ahí es exactamente este defecto, y es la única evidencia que
deja.* Es la misma disciplina que la regla ya exige en ② para la publicación:
**verificar contra el objeto, jamás declarar.**

## LO QUE SE PIDE AL CANON

Que `CLAUDE.md` regla 84 ① pase de *«sus dos trampas medidas»* a **TRES**,
sumando el borrado no listado con su verificación de una línea. **La forma no
se toca: sigue siendo obligatoria** — lo que cambia es que su tercera trampa
deje de descubrirse por un merge roto.
