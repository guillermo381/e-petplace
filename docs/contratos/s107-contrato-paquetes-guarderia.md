# S107 · CONTRATO — LOS PAQUETES DE GUARDERÍA 5·10·15 (pista A → C, B)

> **Publicado:** 29-ago-2026. **El motor YA EXISTE y está aplicado** (`20260829020000`) — esto no es una promesa, es la transcripción de lo que hay en la base.
> **Fuente:** ajuste de mesa tras el gate del founder en el aparato (29-ago) sobre `PLAN_S107_GUARDERIA` §4.5 y firma ④.
> **Desbloquea:** la config del prestador y la vitrina del dueño (C), montadas sobre `FichaPaquete` (B, con `equivalenciaDePaquete` exportada).

---

## ⓪ LA FORMA, en una línea

> ### **Tres tamaños FIJOS — 5, 10 y 15 estadías — y el prestador enciende los que quiera: ninguno, uno, dos o los tres, cada uno con su precio propio.**

🔴 **Es DATO, no tres columnas.** *`precio_paquete_5`, `_10` y `_15` habrían hecho que agregar un cuarto tamaño sea una migración; una fila por tamaño lo vuelve un `INSERT`.* El techo de hoy vive en un `CHECK`, que es donde una lista cerrada **se puede leer y ampliar con una decisión** — no repartido en cinco funciones.

---

## ① EL MOTOR — lo que hay en la base

```
guarderia_paquetes
  id            uuid pk
  prestador_id  uuid not null
  tamano        integer not null  CHECK (tamano IN (5, 10, 15))
  precio        numeric not null  CHECK (precio > 0)
  activo        boolean not null default true
  UNIQUE (prestador_id, tamano)
```

**RLS:** lectura pública para prestador activo + lectura propia del titular. **Escritura sólo por RPC** (patrón S95-G2).

---

## ② LOS WRAPPERS — `@epetplace/api`

| función | firma | rebotes tipados |
|---|---|---|
| `definirPaqueteGuarderia({ prestadorId, tamano, precio, activo? })` | → `{ paqueteId }` | `tamano_de_paquete_invalido` · `precio_invalido` · `no_gestionas_este_prestador` |
| `obtenerPaquetesGuarderia(prestadorId)` | → `PaqueteGuarderia[]` | — |

```ts
interface PaqueteGuarderia { tamano: 5 | 10 | 15; precio: number; activo: boolean }
```

**Es un upsert por `(prestador_id, tamano)`:** llamarlo dos veces con el mismo tamaño **actualiza**, no duplica. Apagar uno es `activo: false` — **no se borra**, para que el precio siga estando el día que lo vuelva a encender.

> **Para C · config del prestador:** los tres tamaños se pintan siempre; el que no está en la respuesta **no existe todavía** (nunca se encendió) y el que está con `activo:false` **está apagado con su precio guardado**. *Son dos estados distintos y la pantalla los puede distinguir sin preguntar.*
>
> **Para C · vitrina del dueño:** sólo los `activo: true`. **Si no hay ninguno, la sección de paquetes no se monta** — no se pinta vacía.

---

## ③ LA ARITMÉTICA VIVE EN LA PIEZA, UNA SOLA VEZ

**B exportó `equivalenciaDePaquete()` y ésa es la única cuenta.** 🔴 **Ninguna pantalla la re-implementa.**

> *Si la cuenta se duplicara, las dos superficies podrían dar números distintos — y el prestador estaría vendiendo un descuento que la familia no ve.* **Es la lección de los cuatro logs (19.9) aplicada a un número: lo que se copia, diverge.**

---

## ④ LO QUE PASA AL COMPRAR

**Cada compra nombra su tamaño y congela su precio** — el catálogo puede cambiar después; **lo vendido no**.

- El bono nace con `unidades_total = tamano` y `precio_total = precio del paquete ese día`.
- 🔴 **`bono_desglose` congela POR COMPRA**, jamás la suma de N desgloses de cita: *el congelado por cita describe UN día y el paquete se cobra UNA vez.*
- `bono_id` es el **quinto sujeto** de `pagos_intentos` (`chk_intento_un_solo_sujeto`), así que el motor de pagos lo cobra por el mismo camino que todo lo demás.

---

## ⑤ ⚠️ EL PRECIO ÚNICO DE PAQUETE **SE DESCARTA** — firma de la mesa

`prestador_servicios.precio_paquete` **deja de usarse en guardería**, y el valor que hubiera quedado guardado **se descarta declarándolo**.

> ### **Nadie sabe si ese número era por 5, por 10 o por 15. Mapearlo a un tamaño sería inventar la oferta de su dueño.**

⇒ **Al prestador se le pide reconfigurar sus paquetes.** *Hoy sólo afecta datos de prueba del founder — y se escribe igual, porque el día que afecte a un prestador real nadie va a acordarse de por qué su precio desapareció.*

🔴 **Y `definir_oferta_guarderia` PERDIÓ su parámetro `p_precio_paquete`** — la firma vieja se DROPeó explícitamente (L-119: `CREATE OR REPLACE` con firma distinta no reemplaza; crea una sobrecarga y deja la vieja zombi). **La nueva es `(prestadorId, precioDia, precioMensual?, activo?)`.**

---

## ⑥ LO QUE ESTE CONTRATO **NO** CUBRE

- **Consumir un día del paquete al reservar** — llega con el arco de la reserva por paquete; hoy `reservarDiaGuarderia` cobra el día suelto.
- **El vencimiento del saldo** — hueco declarado desde el plan: `bonos.fecha_vencimiento` existe, pero **tener ancestro no es tener letra**.
- **La mensualidad** — vive en `prestador_servicios.precio_mensual_plan`, es otro camino.
