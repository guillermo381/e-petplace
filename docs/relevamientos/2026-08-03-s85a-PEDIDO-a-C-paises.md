# PEDIDO DE A → C · matar la copia de países (mitad de C de D-633)

> **§6 del método: SE DECLARA Y SE PIDE, NO SE CLONA.** `apps/prestador` es
> territorio de C. **A ya hizo su mitad**; ésta es la otra, con todo lo medido
> adentro para que C no arranque de cero.
>
> **Cuándo:** cuando C esté libre del lote Cuenta. **No bloquea nada hoy.**

---

## 1 · LO QUE A YA ENTREGÓ

**`obtenerPaisesDelMundo()` en `@epetplace/api`** (`wrappers/paises.ts`).

```ts
import { obtenerPaisesDelMundo, type PaisDelMundo } from '@epetplace/api';

// PaisDelMundo = { codigo: string; nombre: string;
//                  prefijo: string | null; formato: string | null }
```

Devuelve **los 23 de `cat_paises` SIN filtrar por `activo`**, con los activos
primero (el orden lo pone la función de motor). Cablea
`get_paises_para_telefono()`, que **existía desde antes y jamás tuvo un
consumidor**.

> **⚠️ NO reemplaza a `obtenerPaisesParaRegistro()`.** Son preguntas distintas:
> *"países donde se puede abrir cuenta"* (activos, con datos fiscales) vs
> *"países del mundo"* (todos, para declarar un ORIGEN). **`seccion-documentos`
> necesita las DOS**: ésta para la Hoja de selección, y la de registro para
> `nombrePorTipo`. *No se unifican.*

---

## 2 · POR QUÉ VALE LA PENA — la divergencia real, medida fila por fila

**Diffeado `cat_paises` contra `lib/paises.ts` en `iso|nombre|prefijo|formato`:
22 de 23 coinciden. Una no:**

| | `cat_paises` | `lib/paises.ts` |
|---|---|---|
| **PE · Perú** | `^\+51\d{7,9}$` | `^\+51\d{9}$` |

**La app rebota números peruanos que la fuente acepta.**

> **Y esto corrige a D-633, que mandaba a curar donde no dolía.** Su cuadro
> decía **30 países** en la copia y **siete que el catálogo no tiene**: el 30
> era `grep -c "iso"` contando **líneas**, y los siete **no existen** — los
> conjuntos ISO son idénticos. *La ficha tenía la tesis correcta y la evidencia
> equivocada.* **No hay catálogo que sembrar ni firma que esperar: es cableado.**

**Y hay un tercer lector que la ficha nunca contó:** `obtenerPaisesActivos()`
vivía en `packages/api/src/wrappers/paises.ts` **desde S58**. *El censo de
D-633 miró copias en `apps/` y no miró los lectores de la puerta única.* Por eso
lo nuevo nació **dentro** de ese archivo y no en uno gemelo (L-175).

---

## 3 · ⚠️ LO QUE HACE QUE **NO** SEA UN SWAP — y es lo que hay que presupuestar

> ### La copia es una **`const` SÍNCRONA**. El lector es **ASÍNCRONO**.

**No es cambiar un import: es un cambio de FORMA**, y toca sitios que hoy
asumen que la lista está disponible en el primer render.

**Los ocho consumidores medidos:**

| archivo | línea | uso |
|---|---|---|
| `cuenta/perfil.tsx` | 169 | `PAISES.find(...)` |
| | 209 | `PAISES.filter(...)` — los candidatos |
| | 616 | `PAISES.find(...)` |
| | 751 | `prefijoDe(iso)` |
| | 1384 | `PAISES.map(...)` — la Hoja |
| `components/seccion-documentos.tsx` | 236 | `PAISES.map(...)` — la Hoja |

**El caso difícil, señalado antes de que lo descubras:** `partirE164` (≈:169)
**corre en render** para partir un número guardado en prefijo + resto. Con la
lista async, **el primer render no la tiene** — y ahí hay una decisión de
producto, no mecánica: ¿el campo aparece vacío un instante, muestra el número
crudo, o el pie de la pantalla espera?

**Las salidas que veo, sin elegir por vos:**
- **(a)** cargar en el `useFocusEffect` que la pantalla ya tiene y **mostrar el
  número crudo mientras** — honesto, cero pantalla en blanco;
- **(b)** un `Esqueleto` en la fila del teléfono hasta que llegue;
- **(c)** dejar `PAISES` como **fallback local de arranque** y pisarlo con el
  lector — ⚠️ **esto NO cierra D-633**: la copia sobrevive y vuelve a ser *"la
  que nadie compara"*, que es D-615 con menos testigos.

*(c) es la tentadora y por eso va escrita con su costo.*

---

## 4 · LA CONDICIÓN DE MUERTE, que es de las verificables

**D-633 se retira cuando:**
1. `apps/prestador` consuma `obtenerPaisesDelMundo()`, **y**
2. **cero arrays de países literales en `apps/`** — verificable por grep.

> **No se retira cableando una Hoja y dejando la `const` para lo demás.** La que
> quede se vuelve la que nadie compara. **Y el formato de Perú es la prueba de
> que eso no es teórico: ya pasó.**

---

## 5 · LO QUE **NO** TE PIDO

- **Tocar `cat_paises`.** Es de A, y no hace falta: los 23 están bien.
- **Curar el formato de PE a mano.** *Cablear lo cura solo* — el formato deja de
  tener dos autores. Parchearlo en la copia sería arreglar el síntoma y dejar
  viva la causa.

---

*Pedido de A, S85. Los ocho sitios y el diff están medidos contra `main`; si al
abrirlo el cuadro cambió, frená y traelo — que es la regla para los dos lados.*
