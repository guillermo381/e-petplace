# S107-A → C · **PODÉS MONTAR: el paquete 5·10·15 está completo**

> **Estado:** motor **aplicado** (`20260829020000`), wrappers **exportados**, `FichaPaquete` de B **mergeada** con `equivalenciaDePaquete()`. **Nada queda esperando.**
> **Contrato completo:** `docs/contratos/s107-contrato-paquetes-guarderia.md`.

---

## ① LO QUE CONSUMÍS

```ts
import {
  definirPaqueteGuarderia, obtenerPaquetesGuarderia,
  type PaqueteGuarderia, type TamanoPaquete,
} from '@epetplace/api';

// config del prestador
await definirPaqueteGuarderia({ prestadorId, tamano: 10, precio: 210 });      // upsert
await definirPaqueteGuarderia({ prestadorId, tamano: 10, precio: 210, activo: false }); // apagar

// las dos superficies
const r = await obtenerPaquetesGuarderia(prestadorId);   // PaqueteGuarderia[]
```

```ts
interface PaqueteGuarderia { tamano: 5 | 10 | 15; precio: number; activo: boolean }
```

**Rebotes tipados:** `tamano_de_paquete_invalido` · `precio_invalido` · `no_gestionas_este_prestador`.

---

## ② 🔴 LA DISTINCIÓN QUE VAS A NECESITAR, y no se puede inferir de otro lado

> ### **«No está en la respuesta» ≠ `activo: false`. Son DOS estados, no uno.**

| lo que ves | qué significa | qué pinta la config |
|---|---|---|
| el tamaño **no viene** en el array | **nunca se encendió** — no hay precio guardado | el campo **vacío**, listo para estrenar |
| viene con **`activo: false`** | **apagado, con su precio intacto** | el precio **a la vista** y el interruptor en off |
| viene con **`activo: true`** | vivo | encendido |

*Por eso apagar un paquete NO lo borra: el precio tiene que seguir estando el día que lo vuelva a encender.* **Si los colapsaras en uno solo, el prestador perdería su precio cada vez que apaga un tamaño** — y lo perdería en silencio.

**En la vitrina del dueño:** sólo los `activo: true`. 🔴 **Si no hay ninguno, la sección de paquetes NO se monta** — no se pinta vacía.

---

## ③ 🔴 LA ARITMÉTICA NO SE RE-IMPLEMENTA

**`equivalenciaDePaquete()` de `packages/ui` es la única cuenta**, en las dos superficies.

> *Si se duplicara, la config del prestador y la vitrina del dueño podrían dar números distintos — y el prestador estaría vendiendo un descuento que la familia no ve.* **Es la lección de los cuatro logs (19.9) aplicada a un número: lo que se copia, diverge.**

---

## ④ DOS COSAS MÁS QUE YA ESTÁN EN MAIN Y TE SIRVEN

**El cupo devuelve su MOTIVO** — tu firma, adoptada. `CupoDiaGuarderia` ahora trae `estado`:

```ts
type EstadoCupoDia = 'pasado' | 'mismo_dia' | 'no_opera' | 'sin_lugar' | 'elegible';
```

🔴 **Capacidad 0 ya no es «lleno»**: el server distingue *«ese día no abren»* de *«se llenó»*, y la pantalla **lo pinta, no lo deduce**.

**La compuerta de la víspera** está puesta en el server: ninguna reserva entra para HOY. Rebotes propios: **`reserva_mismo_dia`** (hoy) y **`fecha_pasada`** (ayer) — **son dos, a propósito**, para que puedas decir cosas distintas. Y `primer_dia_reservable_guarderia(prestadorId)` te da el primer día elegible si querés preseleccionarlo.

⚠️ **Feriados: hueco declarado.** No hay calendario laboral y no se inventó uno — hoy «no opera» sale de su patrón de franjas y de las excepciones que el prestador declara a mano.

---

## ⑤ LO QUE TODAVÍA NO ESTÁ, para que no lo busques

- **Consumir un día del paquete al reservar:** hoy `reservarDiaGuarderia` cobra el **día suelto**. El arco de reserva por paquete llega después.
- **El vencimiento del saldo:** hueco declarado — `bonos.fecha_vencimiento` existe, pero *tener ancestro no es tener letra*.
- **Las transiciones de estado de la estadía:** son eventos server y llegan con las actas (⑤).
