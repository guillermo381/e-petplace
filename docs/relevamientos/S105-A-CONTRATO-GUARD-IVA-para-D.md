# CONTRATO · EL GUARD DEL IVA, REDISEÑADO — pedido de A a D

**Territorio: D** (`supabase/functions/pagos-cobro/index.ts` y
`pagos-cobro-recurrente/index.ts`). **Escrito por A** (la regla de negocio es
de motor). **Firmado por el founder el 25-ago-2026.**

Este documento es autocontenido: no hace falta leer ningún reporte previo.

---

## §1 · EL ESTADO DE HOY, MEDIDO

`pagos-cobro/index.ts:197-217` y su gemela del recurrente hacen:

```ts
const pct = base > 0 ? Number(((iva / base) * 100).toFixed(2)) : 0;

if (iva > 0) {
  await db.from('pagos_intentos').insert({ …, estado: 'rechazado',
    motivo_rechazo: `iva_no_cero_sin_probar: iva=${iva} pct=${pct}`, … });
  return json({ ok: false, codigo: 'iva_no_probado' }, 409);
}
```

**El guard corta TODO `iva > 0`.** El `pct` es diagnóstico: no decide nada.

**Disparó por primera vez el 25-ago** con una compra real de $12,36
(`subtotal 10,75 · iva 1,61`) ⇒ `pct = 14.98`. **Nunca había disparado antes
porque todo el catálogo vivo es `EC_IVA_0`.**

---

## §2 · 🔴 LO QUE EL FOUNDER FIRMÓ, Y LO QUE **NO**

> **Firmado:** *«El guard acepta el valor aproximado. Que 14,997 % pase. El
> criterio: se verifica que el impuesto sea el redondeo correcto del nominal,
> con la tolerancia que el redondeo a dos decimales impone — no que el
> porcentaje recalculado dé 15,00 exacto.»*

> **Su razón de negocio, que va en la letra para que nadie la "corrija":** *«el
> cuadre no se hace por operación, se hace en la conciliación contable. Se toma
> el total de ventas con IVA, se aplica el porcentaje, y los centavos de
> diferencia se ajustan contra los ingresos de e-PetPlace. Perseguir el centavo
> por transacción es la decisión equivocada — produce rechazos de cobros
> legítimos para resolver algo que se resuelve una vez al mes.»*

🔴 **LO QUE NO ESTÁ FIRMADO Y NO SE ASUME:** mandarle a Nuvei `vat`,
`tax_percentage` y `taxable_amount` **con valores reales por primera vez**. El
propio comentario del guard lo dice: *«con IVA ≠ 0 estamos en territorio que
**nadie probó** contra esta cuenta»*.

**Son dos decisiones distintas y sólo una está tomada.** La segunda se le
pregunta a **Erick el jueves**: qué espera exactamente en esos tres campos.

---

## §3 · LA CONDICIÓN DE APERTURA, FIRMADA

> **La primera corrida con IVA real va contra la CUENTA DE PRUEBAS, nunca con
> un cliente esperando.**

*Un cobro que el proveedor rechaza por una forma que nunca le mandamos es un
cliente mirando una pantalla que no avanza.*

---

## §4 · EL CONTRATO — qué tiene que hacer el guard nuevo

### ① El impuesto se verifica contra el NOMINAL, no contra el recalculado

El desglose congelado guarda `subtotal` e `impuesto`. La tasa nominal vive en
el catálogo de tasas (`EC_IVA_15` = 15 %, `EC_IVA_0` = 0 %) — **no se teclea el
número: se lee del catálogo del ítem.**

La verificación es:

```
esperado = round(subtotal * tasa_nominal / 100, 2)
pasa  ⟺  impuesto == esperado
```

🔴 **Y NO ASÍ:** `round(impuesto / subtotal * 100, 2) == 15.00`.
*Esa forma invierte la operación y arrastra el error del redondeo al
porcentaje, que es de dónde salió el 14,98 que rompió todo.* **El redondeo se
aplica una vez, sobre el impuesto, y se compara contra el impuesto.**

### ② Con varias líneas, la tolerancia es de ±1 centavo POR LÍNEA

Si el desglose tiene N líneas y cada una redondea su propio impuesto, la suma
puede diferir del `round(subtotal_total * tasa)` hasta en N centavos.

```
|impuesto_total − round(subtotal_total * tasa / 100, 2)|  ≤  0.01 * n_lineas
```

*Exigir igualdad exacta sobre la suma es exactamente el «perseguir el centavo
por transacción» que el founder descartó.*

⚠️ **PREGUNTA ABIERTA AL CONTADOR (no la resuelvas vos):** si el redondeo va
**por línea** o **sobre el total**. Afecta a la FACTURA, no a este guard — el
guard tolera las dos formas. Está anotada y es del founder.

### ③ El rebote sigue existiendo, y dice otra cosa

El guard **no desaparece**: cambia de pregunta.

| caso | código | qué significa |
|---|---|---|
| impuesto coincide con el nominal (± tolerancia) | — pasa | |
| impuesto **no** coincide | `iva_no_coincide_con_nominal` | 🔴 el desglose está mal armado: hay un defecto de cálculo aguas arriba |
| el ítem no tiene código de tasa | `iva_sin_tasa_declarada` | no se adivina |

*El código viejo `iva_no_probado` **muere**: describía un estado del mundo
—«esto nunca se probó»— y ese estado deja de ser cierto cuando se pruebe.*

### ④ El `order` a Nuvei

```
vat             = impuesto (del desglose congelado)
taxable_amount  = subtotal  (del desglose congelado)
tax_percentage  = la tasa NOMINAL del catálogo   ← 15, no 14.98
```

🔴 **`tax_percentage` es el nominal, jamás el recalculado.** *Mandarle 14,98 al
proveedor sería declararle una tasa que no existe en Ecuador.* El desvío está
en los centavos del impuesto, no en la tasa.

⚠️ **Los tres valores están sujetos a lo que Erick confirme el jueves.** Si su
respuesta contradice esto, gana su respuesta y este §4.④ se enmienda.

---

## §5 · EL DISCRIMINADOR — verde exige los tres

```
① un desglose con IVA 15 % correcto        → PASA
② un desglose con IVA adulterado (+$1)     → rebota `iva_no_coincide_con_nominal`
③ un desglose con IVA 0                    → PASA (no se rompió lo que funciona)
```

**El ③ no es decorativo:** todo el catálogo vivo es `EC_IVA_0` y **es el único
camino que hoy cobra de verdad**. Romperlo para habilitar el gravado sería
cambiar un frente cerrado por uno abierto.

---

## §6 · LO QUE ESTE CONTRATO **NO** DECIDE

- El cuerpo, los nombres de las variables, ni dónde exactamente va el bloque.
- Si las dos edges comparten la función o cada una lleva la suya *(sugerencia
  de A, no orden: una sola pieza — **son el mismo cálculo y dos copias divergen
  el día que una se corrija**)*.
- La forma final de los tres campos del `order` (pendiente de Erick).
- El redondeo por línea vs sobre el total (pendiente del contador).

---

## §7 · DATO DE CONTEXTO QUE TE AHORRA UNA MEDICIÓN

**El comprobante ya lleva el impuesto desglosado** desde
`20260826040000` (A): `subtotal`, `impuesto` y —en compras— `envio`, todos
**leídos del desglose congelado**. Antes no existía el campo: **0 de 27
comprobantes emitidos lo llevaban**, y ni el actuador ni `confirmar_pago_compra`
mencionaban la palabra.

⇒ **Cuando levantes el guard, el correo va a mostrar el IVA sin que toques
nada.** No hace falta que lo agregues del lado de la edge.
