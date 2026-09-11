# A → C · El tope y la fecha de vigencia: los dos lectores, publicados

**`main @ …` (el commit de esta tanda) · `pnpm --filter @epetplace/api typecheck` verde.**

---

## ① El tope — **existía, y no lo podías ver**

Buscaste dos veces y no estaba. **La fila está desde la tanda 1** y el motor la
usa. Lo que pasaba es otra cosa, y la diferencia importa porque cambia qué hay
que arreglar:

```
app_config.fiscal_tope_consumidor_final = 50   ·  es_publico = FALSE
policy de lectura para authenticated:          USING (es_publico = true)
```

⇒ tu consulta devolvía **vacío, no «prohibido»**. *Una policy por bandera no
contesta «no tenés permiso»: contesta «no hay», y desde el otro lado las dos se
leen igual.* Perdiste dos búsquedas por eso y no por haber buscado mal.

**Ya está abierta** (`20260912640000`) y **sólo ésa**: las otras seis filas
`fiscal_*` son operación —proveedor, cupo, palanca de ensayo— y siguen
privadas. El cinturón de esa migración lo prueba por el camino real, con
`SET LOCAL ROLE authenticated`: ve el tope, no ve `fiscal_proveedor`.

**Tu lector:**

```ts
import { fiscalTopeConsumidorFinal } from '@epetplace/api';

const r = await fiscalTopeConsumidorFinal();
if (!r.ok) { /* 'no_se_pudo' | 'sin_configuracion' */ }
else { const tope = r.data; }   // 50
```

⚠️ **Es fail-closed a propósito: sin valor NO devuelve un default.** Un tope
inventado decide en cada compra si a alguien se le piden sus datos — de más es
fricción inútil, de menos es un comprobante que el SRI puede observar. Si
`sin_configuracion` llega a pantalla, mostralo como fallo; **no caigas a 50**.

**Y lo que ya podés dar por cerrado:** el valor **no está en dos lugares**.
Medido — `resolver_receptor_fiscal` es su único lector en el motor, y lee esta
misma fila. El tuyo y el suyo son el mismo número.

---

## ② La fecha de vigencia — **la pantalla no conoce ninguna fecha**

Tenías razón en no inventarla: `'2026-10-01'` escrito en una pantalla es una
**fecha de plata dentro de un bundle**, y un bundle no se corrige el día que la
apertura se mueve.

**`fechaVigencia` pasa a OPCIONAL en `tresNumerosDelPrestador`.** Si no se la
pasás, la puerta la resuelve sola:

```ts
// antes
await tresNumerosDelPrestador({ prestadorId, tipoServicio, precioNeto, fechaVigencia: '2026-10-01' });

// ahora — y así queda
await tresNumerosDelPrestador({ prestadorId, tipoServicio, precioNeto });
```

Sale de `app_config.fecha_apertura_comercial` y la regla es **`max(hoy,
apertura)`**: antes de abrir, lo que se configura rige **desde la apertura**;
después, **desde hoy**. El «hoy» es el de Guayaquil, que es donde se opera.

Si necesitás el valor para mostrarlo, está suelto: `fechaDeVigenciaPorDefecto()`.
**No lo uses para volver a pasárselo a `tresNumeros`** — sería reintroducir la
fecha en la pantalla por la puerta de atrás.

⚠️ Fail-closed igual: sin la fila, **no cae a hoy**. Caer a hoy daría la
comisión vigente ahora para un precio que se va a cobrar en octubre, y el
número equivocado se vería perfectamente normal.

---

## ③ Perfiles de facturación — **uno, y ya está firmado**

`fiscalObtenerTaxProfile()` **ya devuelve uno solo** (`TaxProfile | null`) — no
hay nada que cambiar de tu lado. «Cambiar» sobrescribe. Listar varios es
correcto y **no frena octubre**: queda en ficha (`D-1063`).

---

## Lo que NO se movió, para que no lo esperes

**El orden de medios de pago se queda donde está.** No migramos
`DEUNA_ELEGIBLE` a `configuracionPago()` — firma del founder, y tu argumento es
el que ganó: *meter una lectura fail-closed en el camino del pago a cambio de
reordenar sin deploy, cuando el orden cambia una vez cada varios meses y el
checkout corre todos los días.* Se migra cuando haya razón para cambiarlo
seguido, y ahí con su respaldo.
