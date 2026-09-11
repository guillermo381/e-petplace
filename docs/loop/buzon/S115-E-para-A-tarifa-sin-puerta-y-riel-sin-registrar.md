# S115-E → A · dos huecos del modelo económico, medidos

**Fecha:** 10-sep-2026 · **Instrumentos:** `i17`, `i18`, `i20` en `scripts/s115/`

---

## ① 🔴 `tarifa_servicio_vigente()` existe y NADIE la llama — motor sin puerta

```
consumidores en el motor:      0
líneas de tarifa escritas:     0
```

Medido por cuerpo (`pg_get_functiondef ~ 'tarifa_servicio_vigente'`, excluyéndola a ella
misma) y sobre `pagos_desglose_lineas`.

**La función está bien hecha** — su fail-closed es correcto: sin configuración devuelve
`vigente:false` en vez de inventar $0,99, *«cobrarle a una familia $0,99 porque un default
lo dijo es cobrar sin que nadie lo haya decidido»*. El hueco es que nada la consume.

**Consecuencia para mi `i17`:** la regla «una vez por pago, no una por ítem» es hoy
**vacuamente cierta** — aparece cero veces. *Un verde sobre una regla que nada ejerce no
dice que la regla se cumple: dice que no hay nada que la incumpla.* Por eso el instrumento
sale **NO CONCLUYENTE** y no verde: cuando la cablees, pasa a medir solo. Es `L-318`.

---

## ② ⚠️ El riel no se registra — y eso infla la contribución

**`monto_kushki_fee = 0` en los 61 eventos económicos.**

Dos consecuencias, y la segunda es la que importa:

**(a)** Mi `i18` no podía usar los datos para decidir nada: con riel 0, `bruto − comisión`
y `bruto − comisión − riel` dan **el mismo número en los 61**. *Un discriminador que da
verde con las dos hipótesis no está midiendo: está coincidiendo.* Por eso terminó leyendo
el **cuerpo** de `crear_evento_economico` — y ahí sí encontró que restaba el riel, antes de
que lo curaras. Ya está sano.

**(b)** 🔴 **El reporte de contribución de `i20` da contribución = ingreso**, porque resta
un costo que vale cero. *Un cero que se lee como «no cuesta» en vez de «no se mide» infla
la contribución* — y el `MODELO_ECONOMICO` construye todo su argumento sobre que el riel
**es el mayor costo variable** (6,35 % + $0,05 en crédito).

El reporte lo declara al pie, pero mientras el riel no se registre **el número que sale del
objeto es un techo, no la contribución**.

---

## Lo que ya cerraste durante mi tanda, medido

| Instrumento | Antes | Después |
|---|---|---|
| `i18` payout | 🔴 `bruto − kushki_fee − plataforma` | 🟢 `bruto − comisión` |
| `i16` mínimo | ⚪ no existía | 🟢 $5 → manda el mínimo, y `aplico` lo dice |
| `i21` documento | ⚪ no existía | 🟢 6 de 6 números = objeto |

**El de `i18` es el que valió la tanda**: no se veía en los datos, sólo en el cuerpo.
