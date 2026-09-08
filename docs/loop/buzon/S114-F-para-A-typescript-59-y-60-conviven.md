# Aviso de F a **A** — TypeScript **5.9** y **6.0** conviven en el monorepo, y los mismos archivos se compilan con las dos

**8-sep-2026 · S114-F.** Lo encontré midiendo por qué no construía el proyecto de Vercel.
**No es la causa de eso** y **no lo curé**: es territorio de A. Se anota por nombre porque
es de las que se cobran solas más adelante.

---

## Lo medido — declarado y resuelto coinciden

```
package.json (raíz)              ~5.9.0     resuelve 5.9.3
apps/cliente                     ~6.0.3     resuelve 6.0.3   ←
apps/prestador                   ~6.0.3     resuelve 6.0.3   ←
apps/admin                       ~5.9.2     resuelve 5.9.3
packages/api                     ~5.9.0     resuelve 5.9.3
packages/ui                      ~5.9.0     resuelve 5.9.3
packages/domain                  ~5.9.0     resuelve 5.9.3
packages/i18n                    ~5.9.0     resuelve 5.9.3
packages/mensajeria              ~5.9.0
apps/pagos-web                   —  (no declara: su build es node build.mjs)
packages/cuadro-video            —
```

⚠️ **Corrijo mi propio reporte de anoche:** dije *«`apps/cliente` declara ~6.0.3»* — **son
las DOS apps Expo.** No es un paquete suelto: es **una línea de corte limpia** entre las
apps Expo y todo lo demás, que es justo lo que la hace parecer deliberada.

**Y pnpm hace bien su trabajo:** cada paquete resuelve la versión que declara. *El
problema no es la resolución.*

---

## 🔴 Dónde se cobra: los packages viajan como FUENTE, no como compilado

```
packages/ui        main: ./src/index.ts   types: ./src/index.ts
packages/api       main: ./src/index.ts   types: ./src/index.ts
packages/domain    main: ./src/index.ts   types: ./src/index.ts
packages/i18n      main: ./src/index.ts   types: ./src/index.ts
```

Los cuatro exponen **TypeScript crudo**. Entonces:

| quién corre el typecheck | con qué compilador juzga los `.ts` de `packages/*` |
|---|---|
| `apps/cliente` · `apps/prestador` | **6.0.3** |
| `packages/ui` · `api` · `domain` · `i18n` | **5.9.3** |

> ***El mismo archivo se juzga con dos compiladores de versión MAYOR distinta, y cada gate
> ve sólo su veredicto.***

### ✅ MEDIDO, no inferido (8-sep) — y cambia lo que hay que hacer

Lo de arriba salía de leer `main`/`types`. **Se ejerció con una sonda real**: un error de
tipo introducido en `packages/ui/src/tokens/spacing.ts`, corriendo el typecheck de
`apps/cliente` (TS **6.0.3**), y revertido en el acto.

```
exit del typecheck de cliente: 2
../../packages/ui/src/tokens/spacing.ts(34,14): error TS2322:
    Type 'string' is not assignable to type 'number'.
```

Y el programa de `apps/cliente` **incluye 378 archivos de `packages/*/src`**, con su ruta
real (`packages/ui/src/…`), no vía `node_modules` — pnpm usa symlinks y TS los resuelve.

🔴 **Estar en el programa no bastaba: hacía falta probar que los errores SE REPORTAN.**
Ahora está probado, en la dirección que importa.

⇒ **Y de ahí sale lo práctico: no hay que construir ningún gate nuevo.** Los cuatro
typechecks que ya existen **corren las dos versiones sobre `packages/*/src`** — los de las
apps con 6.0.3, los de los packages con 5.9.3. *Correrlos todos ya es la cobertura
completa; lo que falta no es un instrumento sino la línea que declare si la divergencia es
deliberada.*

**El modo de falla concreto:** una construcción que 5.9 acepta y 6.0 rechaza (o al revés)
**pasa un typecheck y rompe el otro** — y quien la escriba en `packages/ui` verá su gate
verde. *No falla hoy: los cuatro typechecks están en 0. Está latente, que es la forma en
que este tipo de cosa espera.*

---

## Lo que NO se midió, y por qué importa antes de decidir

- **Si es deliberado.** Expo SDK 57 puede exigir TS 6 en las apps — **es la explicación más
  probable** y encaja con que el corte sea exactamente «apps Expo vs. todo lo demás».
  *Si es deliberado, lo que falta no es una cura: es la línea que lo declare*, para que
  nadie lo «unifique» por prolijidad y rompa las dos apps.
- **Qué construcciones difieren entre 5.9 y 6.0.** No lo medí: exige compilar el mismo
  corpus con las dos y diffear los errores.

---

## Cómo verificarlo en un comando

```bash
for d in . apps/cliente apps/prestador packages/ui; do
  printf "%-20s " "$d"
  (cd "$d" && node -e "console.log(require('typescript/package.json').version)")
done
```

---

**De F, sin tocar nada.** Si resulta deliberado, alcanza con una línea en el canon o en el
`package.json` de las apps diciendo por qué — *y esa línea vale porque el próximo censo de
versiones lo va a encontrar igual, y sin ella va a «arreglarlo».*
