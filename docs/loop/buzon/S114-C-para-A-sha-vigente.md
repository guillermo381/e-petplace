# C → A · mi SHA vigente para el 2º candidato

## 🔴 EL SHA

```
beb69aeb7f784fd3ab02306dc23d3183ccbff213      pista/s114-c-1.0
```

**Verificado del OBJETO, no de memoria** (`git ls-remote origin`), y **local ==
remoto**. **No hay WIP: `git status --porcelain` vacío.** Nada que dejar afuera.

> ### ⚠️ Y UNA TRAMPA DE ESTE MISMO ARCHIVO, que casi te mando mal
> **La primera versión de esta línea decía `c6639b6b`** — la punta al momento
> de escribirla. **El commit que trae este parte la movió**, así que el parte
> nombraba un SHA que ya era intermedio.
>
> *Es la regla de la casa cobrándose en su forma más pura —«un parte nombra la
> PUNTA, jamás un intermedio»— sólo que acá el intermedio lo produce el propio
> acto de escribir el parte.* **Lo cacé releyendo el objeto después de
> commitear, no antes.**
>
> 🔴 **Por eso, y aunque este número esté bien: no lo uses de memoria.** El
> commit que corrige esta línea **también** mueve la punta. **Leé
> `git ls-remote origin pista/s114-c-1.0` en el momento de mergear** — es lo
> único que no envejece entre que escribo y que leés.

Gates en esa punta: `verify:diseno` **VERDE con 73 reglas** · **typechecks en 0**
(`apps/cliente` · `apps/prestador` · `packages/ui` · `packages/api` ·
`packages/i18n`).

---

## ⚠️ LO QUE HAY QUE SABER ANTES DE MERGEARLO: **arrastra a las otras pistas**

Mi punta **no es sólo lo mío**. Mergeé varias veces para consumir contratos, y
eso trae commits ajenos adentro. Medido con `git log origin/main..HEAD`:

| pista | commits que arrastro |
|---|---|
| **A** | 35 |
| **B** | 31 |
| **E** | 9 |
| **D** | 3 |
| **F** | 3 |

**Ninguna entra ENTERA** (ninguna punta es ancestro de la mía): son los SHAs
concretos que mergeé. **Lo mío son 53 archivos bajo `apps/`.**

*Te lo digo porque la regla del arrastre existe por esto: mergear una punta no
es traer un cambio, es traer todo lo que esa punta tenga adentro — y lo de
adentro no aparece en la orden.* **Si preferís mi trabajo sin el arrastre,
decime y te armo una punta con sólo `apps/` y `docs/loop`.**

## ⚠️ Y ALGO QUE VENCE SOLO: **B avanzó después de mi último merge**

Mergeé B hasta `ef995bb9`; su punta ahora es **`461c0645`**. Mi árbol **no
tiene** lo que B hizo después. *Si el candidato lleva a B por su propia rama, no
importa; si lo lleva por la mía, va desactualizado.*

---

## 🔴 Y UNA COSA MÁS: el pedido llegó ANTES que tu archivo

Fui a leer `docs/loop/buzon/S114-A-para-C-sha-vigente-2do-candidato.md` y **no
existe en ninguna rama** — lo censé en las seis (`a`…`f`). Contesto igual
porque lo que necesitás es el SHA y eso no depende de tu archivo, **pero si ahí
había condiciones o un corte, no las leí.** *Un pedido cuyo contenido no
llegó se responde con lo que uno tiene, diciendo qué no vio.*

---

*Pista C · S114 · todo verificado del objeto, con la hora de esta lectura.*
