# S116-A · LOTE 8 — parte de la pista

**Rama:** `pista/s116-a-08` · **nace de** `main @ a3b8a257` · **worktree propio**
(`e-petplace-s116-a08`).
**Estado: armada, empujada, SIN MERGEAR.** Nada a `main`, nada publicado, nada
desplegado, nada construido.
**Qué contiene:** `docs/loop/S116-LOTE8-BUILD.md` (la build) · los nueve puntos,
un commit cada uno.

---

## Cómo se verificó

25 gates en verde corridos **con `node scripts/…` y no con `pnpm`**, por la razón
de §④bis del documento del lote (un `pnpm run` reescribe el lockfile en esta
rama). 4 typechecks en 0. Las dos rojas conocidas de C (`D-1088`, `D-1089`)
declaradas en cada commit con `SALTAR_GATE`.

Los gates nuevos de la tanda —`verify:costura-splash`,
`verify:icono-notificacion`— y el ensanche de los dos del 3b **tienen su rojo
probado brazo por brazo**, y en el caso del ensanche con el discriminador que
importa: **el mismo archivo da verde con el gate viejo y rojo con el nuevo**.

---

## 🔴 DOS MEDICIONES MÍAS QUE QUEDARON FALSAS DURANTE LA PROPIA TANDA

*Las dos son de la misma clase y ninguna fue un error de lectura: el mundo cambió
debajo del número, y nada avisó.*

### ① «`--frozen-lockfile` falla» (punto 5a)

Cierto al escribirlo. Diez minutos después, falso: **pnpm v11 verifica las
dependencias antes de correr un script**, así que el primer `pnpm -s verify:…`
resolvió `expo-crypto` y reescribió el lockfile. Reproducido a propósito.
Corregido en el addendum; el lockfile se entrega restaurado.

### ② «4 typechecks en 0» — cierto, y **más flojo de lo que suena**

`verify:diseno` se puso rojo al final de la tanda con **R63·C**: en este worktree
existía `apps/cliente/.expo/` **sin** su `types/router.d.ts`. Con
`typedRoutes: true` y ese archivo ausente, **`Href` degrada a `string` y toda
ruta inventada compila en verde**: *el typecheck no estaba midiendo rutas.*

⚠️ **Y no lo causó ningún cambio mío:** `.expo/dev` lo crea la herramienta al
correr, así que **cualquier worktree recién creado arranca con este punto ciego**
—el árbol principal sí tenía el archivo— y el gate sólo puede verlo *después* de
que la carpeta aparezca. **El primer typecheck de una pista nueva mide menos de
lo que dice, y su verde se ve idéntico.**

**Curado y re-medido:** se generó el archivo (`expo start` en un puerto libre),
`apps/cliente` vuelve a dar **0 errores — esta vez midiendo rutas**, y
`verify:diseno` vuelve a verde.

> ⚠️ **Y de paso cobró su propia trampa:** el primer intento de generarlo usó un
> puerto ocupado, y `expo start` **no falla**: pregunta *«¿usar 8098?»*, nadie
> contesta, y escribe `Skipping dev server`. El comando «funciona», el archivo no
> aparece, y el log lo dice en una línea que hay que ir a buscar.

---

## Lo que queda en manos de otros

| qué | dueño |
|---|---|
| Las cuatro firmas abiertas (Apple · Play · D-U-N-S · **APK o tienda**) y la sesión de diseño | founder / mesa |
| `emailRedirectTo` en `registrarse()` — **después** de que el dominio sirva `/auth/callback` | **A**, próxima tanda |
| El canje del `?code=` en frío · el cambio de una línea del badge | **C** (buzón) |
| Un monocromo propio del ícono · el color del plugin de push | **B** (buzón) |
| El prestador: `ios.icon` de plantilla, sin bundle id, ícono y splash sin rediseñar | mesa |
