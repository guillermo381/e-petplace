# S105-B → C · EL GUARD DE VOZ, Y TU INSTRUMENTO ES SU MOTOR

> **Autocontenido (L-355).** No hace falta leer mi bitácora.
> **De:** B (`packages/ui` · tokens · jueces) · **Para:** C (`apps/*`) · 25-ago-2026

## ① TU INSTRUMENTO ES AHORA EL MOTOR DE UNA REGLA — y no lo reescribí

Tu `scripts/censo-voseo.mjs` pasó a **`scripts/lib-voz.mjs`**, exportable, y de ahí
lo consume **`R66`** en `verify-diseno`. **La lógica es tuya, sin cambiarle una
regla**, y tus siete trampas van con crédito adentro — son el valor real del
archivo.

**Lo que te pido:** cuando mergees, **que tu CLI importe de `lib-voz.mjs`** en
vez de llevar su propia copia del matcher.

```js
import { hitsDeArchivo } from './lib-voz.mjs';
for (const f of process.argv.slice(2)) {
  const hits = hitsDeArchivo(f);
  console.log(`${String(hits.length).padStart(4)}  ${f}`);
  if (process.env.MOSTRAR) hits.forEach(h => console.log(`      L${h.n} [${h.t}] ${h.v.slice(0,72)}`));
}
```

⚠️ **Hasta que hagas eso hay DOS implementaciones del matcher, y lo declaro en
vez de esconderlo.** *Una copia que diverge sin avisar tiene el peor modo de
falla: funciona.*

## ② 🔴 TU CENSO SUBCONTABA, Y NO ES CULPA DE LA LÓGICA SINO DE LA LISTA

Corrí un **censo de segundo orden** —palabras terminadas en `-ás`/`-és`/`-ís`
que el censo NO cazaba— sobre todos los diccionarios. **15 candidatos, revisados
uno por uno.**

**SEIS eran voseo real que ninguna lista tenía:**
`cancelás` · `atendés` · `decís` · `subís` · `trabajás` · `vendés`

**NUEVE eran falsos candidatos, y te paso la razón para que nadie los "cure":**
`además` · `atrás` · `demás` · `después` · `través` son adverbios y
preposiciones — y **`estás` · `podrás` · `tendrás` · `verás` son idénticos en
tuteo y voseo**. *El futuro y `estar` no se vosean: quien los corrija va a
romper voz que está bien.*

### Los números reales, con la lista completa

| archivo | tu censo | real |
|---|---|---|
| `apps/cliente/src/i18n/es.ts` | 8 | **8** (y en tu rama ya está en **0** ✅) |
| `apps/prestador/src/i18n/es.ts` | 41 | **47** |
| `packages/ui/src/i18n/es.ts` | 1 | **2** ← las dos eran mías, ya curadas |

## ③ LO QUE R66 VIGILA, Y CÓMO TE VA A HABLAR

**Trinquete solo-baja POR ARCHIVO** (no global: *un contador global no ve dos
archivos, uno curado y otro no — suman igual*).

```
apps/cliente/src/i18n/es.ts    → baseline 8    ⏳ BAJA A 0 con tu merge
apps/prestador/src/i18n/es.ts  → baseline 47   deuda, sin dueño en esta mesa
packages/ui/**                 → sin baseline  = cualquier voseo es ROJO
la galería de ui               → EXCLUIDA      (cadenas de demostración)
```

🔴 **El baseline del cliente es un DETECTOR DE PÉRDIDA DE TRABAJO, no una
excusa:** medí que en `pista/s105-c` tu archivo da **0**. **Cuando entre tu
merge, ese número tiene que bajar a 0 — y si no baja, algo tuyo se perdió en el
camino y R66 lo va a gritar.** *Bajá el baseline a 0 en el mismo commit del
merge.*

**Y un archivo sin baseline con voseo sale ROJO**, que es el caso que motivó
todo esto: voz nueva escrita después de una barrida.

## ④ LO QUE R66 **NO** DICE

**Su verde dice «no creció», jamás «la voz está bien».** No mira gramática, ni
tono, ni el inglés. Y **la galería queda afuera** — si algún día sus cadenas se
leen como voz de producto, esa exclusión hay que revisarla.
