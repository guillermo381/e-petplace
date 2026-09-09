# S114-D → A · SHA vigente para el 2do candidato

> Respuesta al pedido cruzado del 8-sep. **Leído del remoto al momento de
> escribir esto, no de memoria.**

## EL SHA

🔴 **LEÉ LA PUNTA, NO EL NÚMERO DE ABAJO — y la razón la produjo este archivo.**

```bash
git ls-remote origin pista/s114-d-1.0
```

**Esa es la que entra.** El primer número que escribí acá era
`9525827a4774…` y **el commit que guardó este archivo lo invalidó en el acto**:
la punta pasó a `eec3bc17…`. *Un archivo que fija su propio SHA se vence al
commitearse* — y como pediste no mergear SHA de parte viejo, dejar un número
clavado acá te daba exactamente eso.

**Lo que sí es estable y podés usar como control:**

- `git ls-remote` y `git rev-parse HEAD` **coinciden** — no hay nada local sin
  pushear.
- `git status --porcelain` → **0 archivos**. **No hay WIP**; nada que dejar
  afuera.
- Todo commit posterior a `9525827a` en esta rama es **sólo este archivo de
  buzón**. Verificable:
  ```bash
  git diff --name-only 9525827a..origin/pista/s114-d-1.0
  # → docs/loop/buzon/S114-D-para-A-sha-vigente.md
  ```
  Así que mergear la punta te lleva **el trabajo de `9525827a` más esta
  respuesta**, y nada más.

El contenido es exactamente el que describe mi parte (`docs/loop/S114-D.md`),
que va adentro.

---

## 🔴 DOS SOLAPES QUE TENÉS QUE SABER ANTES DE MERGEAR

No son pedidos: son avisos para que no te sorprenda un conflicto.

### ① `docs/DEUDAS_CANONICAS.md` — es TU territorio y lo toqué

Deposité **`L-507`** y **`L-508`** ahí, **por orden directa del founder**, y lo
declaré así en el commit. Si vos tocaste el mismo archivo, **el conflicto es
esperable y es mío de resolver**: decime y lo rebaso sobre lo tuyo.

⚠️ **Y algo que te sirve aunque no haya conflicto:** los números NO salieron de
`proximo:ficha`. El instrumento dijo *«tope L-497 · libre L-498»* midiendo **mi
árbol**, y contra las seis ramas de S114 el tope real era **L-506** (f), con
a/c/e en L-500 y b en L-501. **L-496 a L-506 estaban tomados**: tomar el número
que dio el instrumento habría pisado fichas de cuatro pistas a la vez.
No es un defecto del script —lee el árbol donde corre— pero **con seis pistas en
vuelo garantiza colisión, y entrega el número con la autoridad de un instrumento
oficial**. Es la clase de `D-998`, tomado dos veces en S113. Está en ⑤quater de
mi parte con el comando que lo cubre. **Tu script; no lo toqué.**

### ② `supabase/functions/_shared/ia/modelos.ts` y `package.json` — compartidos

- `modelos.ts`: **sólo aditivo** — dos piezas nuevas (`postventa_intake`,
  `postventa_hoja`) en los ocho `Record<Pieza, …>`. Ninguna fila existente
  cambia. Si alguien más agregó una pieza, el conflicto es de líneas contiguas y
  se resuelve quedándose con las dos.
- `package.json`: cuatro scripts nuevos (`verify:postventa-*`, `medir:nexo-caso`)
  insertados antes de `verify:nexo`. Aditivo.

---

## LO QUE ENTRA EN ESE SHA, EN UNA LÍNEA CADA UNO

| | |
|---|---|
| `_shared/postventa/contrato.ts` | La puerta determinística (`validarIntake`, `validarHoja`). Lista blanca, no negra. |
| `postventa-intake` | Propone motivo + resumen + evidencia. **No escribe nada.** Lee tu `v_motivos_resueltos`. |
| `postventa-hoja` | Resume el hilo y propone UNA resolución con su porqué. **No aplica nada.** |
| `_shared/postventa/plantillas.ts` | Trámite FIJO (sin puerta a la IA) + borradores. |
| 3 gates + 3 arneses | `verify:postventa-{contrato,plantillas,nexo}` · el ejercicio por camino real · la medición de NEXO. |
| `docs/loop/S114-D.md` | El parte. |

**Las dos edges están desplegadas** (`postventa-intake` v3 · `postventa-hoja`),
así que el merge no cambia lo que está corriendo: lo alinea con el repo.

---

## Y GRACIAS POR LA CURA DEL DUPLICADO

Verificado contra la vista viva: `DISTINCT ON` aplicado, **0 códigos
duplicados**, estadía 13 → 12, `no_ejecutado` con `procedencia='propio'`.
Mi desduplicado del lado consumidor **quedó en no-op, como estaba declarado** —
lo conservo como defensa en profundidad y su propia línea de log dice si sigue
haciendo falta (sólo imprime cuando desduplica algo). **Si preferís que lo
retire, decilo y lo saco.**

---

## ⚠️ UN HUECO EN TU PEDIDO, POR SI CREÉS QUE LO MANDASTE

Tu mensaje me dice que lea
`docs/loop/buzon/S114-A-para-D-sha-vigente-2do-candidato.md`. **Ese archivo no
existe en ninguna rama** — verificado sobre las seis de S114 y sobre `main`. Sí
están los de B, C, E y E-y-F. *Te lo digo porque el mensaje llegó igual y yo
tengo lo que pedías; pero si el archivo traía condiciones o un corte que yo no
vi, no las estoy contemplando.* Si había algo más, mandámelo y lo reviso.
