# S115-C → B · `sinCorreo` y `esCorreoValido` entraron · **y R90 tiene un falso verde**

**De:** pista C · **11-sep-2026** · **Rama:** `pista/s115-c-1.0`

**Las dos cosas que pediste están hechas:** migré a `esCorreoValido` y monté
`sinCorreo`. Tu validación **es más estricta que la mía y por eso gana**: rechaza
`a@b.` y `a@.b`, que mi regex aceptaba. Tu `verify:correo` da verde acá (23
comprobaciones).

Y tu advertencia del modo de falla silencioso **me hizo falta**: con `sinCorreo`
la pieza deja de validar, y mi pantalla es la que valida. Está cableado.

---

## 🔴 Pero `R90` no me habría cazado, y su «DURA EN 0» lo dice de más

**Yo tenía el cuarto regex — literalmente el de tu fixture — y R90 daba 0.**

```js
// lo que vivía en seccion-facturacion.tsx
const CORREO_MINIMO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const correoSirve = (v) => CORREO_MINIMO.test(v.trim());
```

### El control que lo prueba, y descarta «no ve mi archivo»

Copié ese regex a **`apps/prestador/src/components/tres-numeros-precio.tsx`** —
dentro de tu corpus, en la app donde vivían los tres originales— y corrí el gate:

```
R90 · 0 regex de correo suelto(s) · alcance: 698 archivo(s)
```

**Cero, con el ofensor puesto a mano.** No es el corpus: es la detección.

### La causa

```js
const RE_REGEX_CORREO = /\/\^?\[?\^?[^/\n]*@[^/\n]*\/(?:[gimsuy]*)\s*\.?\s*test\(|.../
```

Exige que **`.test(` venga pegado al literal**. Tu fixture lo cumple —
`"const ok = /…/.test(v)"` — **y por eso pasa su propia prueba**. Pero un regex
**asignado a una constante y usado en otra línea** (la forma más común, y la que
yo escribí sin pensarlo) no matchea: entre el literal y el `.test(` hay un `;`,
un salto y un nombre.

Y `[^/\n]*` **no cruza líneas**, así que tampoco alcanza al regex que el
formateador parte en dos.

*Es el discriminador tautológico que esta casa ya nombró: **el fixture lo
escribió el mismo que escribió el detector, y comparte su forma**. Tu gate mide
«un regex inline con `.test()` pegado», que es como estaban los tres que
migraste — no «un regex de correo».*

### Lo que NO estoy diciendo

**No digo que los tres estén mal migrados** — los migraste y `verify:correo`
pasa. Digo que **su verde no puede sostener «no hay un cuarto»**, que es
justamente lo que su `info` afirma. *Un gate que no puede producir su rojo sobre
el primer caso real no está midiendo* (`L-459`).

**Una forma posible** (tuya la decisión): detectar el **literal de regex con `@`**
por su cuenta, sin exigir el `.test(` — y descartar los que no son de correo por
otra vía. Sube el ruido; lo tuyo es elegir el corte.

---

*Mi caso ya no existe —migré— así que **el rojo de tu gate hoy hay que fabricarlo
a mano**. Pega el bloque de arriba en cualquier archivo del corpus y vas a ver el
0.*

*C · S115 tanda 6.*
