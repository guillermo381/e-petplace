# S107-A → C · **ENCENDÉ TU SELECTOR DE MODALIDAD. El filtro ya la acepta.**

*Depositado por A el 29-ago-2026. Medido contra el objeto.*

---

## LO QUE ESPERABAS, EN UNA LÍNEA

> ### **Tu selector de modalidad está construido entero detrás de una compuerta de una línea, y se enciende con este aviso — no antes.**
>
> **Ya podés abrirla.**

`obtenerGuarderiasDisponibles` **acepta `modalidad`** y devuelve **el precio de
esa modalidad ya resuelto por el server**.

```ts
obtenerGuarderiasDisponibles({
  fecha, mascotaId, lat?, lon?,
  modalidad: 'dia' | 'paquete' | 'mensual',   // ← el tipo es `ModalidadGuarderia`
})
```

**Dos campos nuevos en cada fila:** `modalidad` y **`precioModalidad`**.

🔴 **Usá `precioModalidad`, no elijas entre los tres precios.** *Si la pantalla
eligiera, podría mostrar uno y cobrar otro — y el día que difieran, la familia
ve un número y paga otro.* El server ya decidió.

**Qué es `fecha` según la modalidad** (firma del founder): para `dia` y
`paquete` es **el primer día a agendar**; para `mensual`, **el día de inicio**.

**Omitir `modalidad` sigue funcionando igual que hoy** — es *«el lugar ofrece
algo»*. Lo dejé compatible a propósito: *un contrato que obliga a mover dos
piezas a la vez es cómo se rompe una pantalla en producción.*

---

## 🔴 LA CURA QUE VIAJA ADENTRO, y te toca

`_guarderia_ofertas_cobrables` exigía **`ps.precio > 0`** — el precio del **día**.
Pero la mesa firmó que **el día suelto es opcional**.

> ### ⇒ Un lugar que venda **sólo paquete** o **sólo mensual** no aparecía en
> ninguna parte — **ni siquiera para la modalidad que sí ofrece.**
>
> *Y no fallaba: devolvía una lista más corta.* Hoy no se veía porque Aurora
> tiene los tres precios. **El defecto estaba esperando al segundo prestador.**

**Curado**, y el cinturón lo probó fabricando el caso: un lugar sin precio de día
**invisible para `dia` (0) y VISIBLE para `mensual`** — antes era invisible para
las tres.

### ⚠️ Y ESO CAMBIÓ UN TIPO QUE VOS CONSUMÍS

**`GuarderiaDisponible.precio` pasó de `number` a `number | null`.**

**Ya dejé tu pantalla compilando** (`explorar/guarderia/index.tsx`), con el
criterio escrito en el call site: **se muestra `precioModalidad`; si no hay, el
`precio` del día; si tampoco, NO se pinta nada.** *Sin precio no se escribe un
`$0,00`, que se leería como gratis — un hueco honesto es mejor que un número
inventado (Ley 13).*

🔴 **Revisalo igual: es tu pantalla y la vara es el render.** Yo garanticé que
compila y que no miente; **cómo se ve una baldosa sin precio no lo decide un
typecheck.**

⚠️ **Y el guard del wrapper tenía el MISMO defecto un piso arriba:**
`if (typeof r.precio !== 'number') → datos_inconsistentes` **habría rebotado la
lista ENTERA** por un solo lugar sin precio de día. *El motor se curó y el
wrapper lo habría rechazado en la otra punta del cable.* También curado.

---

## LO QUE **NO** CAMBIÓ, para que no lo busques

- **La víspera sigue igual:** jamás HOY.
- **El cupo sigue igual:** sólo lugares con `disponible > 0` y día operativo.
- **Los estados del cupo son CINCO** —`pasado · mismo_dia · no_opera ·
  sin_lugar · elegible`—. **`sobrevendido` no es un estado**: es un booleano
  aparte que puede venir `true` junto con cualquiera.
- **`reservar_dia_guarderia` no se tocó:** tiene su propio guard
  (`no_ofrece_dia_suelto`) y nunca dependió del helper. **Mover el guard no abrió
  ninguna puerta a «gratis»** — se midió antes de tocarlo.
