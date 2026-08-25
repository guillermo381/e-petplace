// ═══════════════════════════════════════════════════════════════════════════
// EL GUARD DEL IVA — una sola pieza para las dos edges de cobro
//
// Contrato: `docs/relevamientos/S105-A-CONTRATO-GUARD-IVA-para-D.md` (A),
// firmado por el founder el 25-ago-2026.
//
// 🔴 UNA SOLA PIEZA, y es sugerencia de A que se toma: **son el mismo cálculo
//    y dos copias divergen el día que una se corrija.** `pagos-cobro` y
//    `pagos-cobro-recurrente` la importan; ninguna la reimplementa.
//
// ── LO QUE ESTE MÓDULO **NO** DECIDE ───────────────────────────────────────
// Si el redondeo va por línea o sobre el total (pregunta al contador, del
// founder) — **tolera las dos formas a propósito**. Ni la forma final de los
// tres campos del `order`, que espera la respuesta de Erick.
// ═══════════════════════════════════════════════════════════════════════════

export interface LineaIva {
  subtotal: number;
  impuesto: number;
  /** El NOMINAL congelado en el ítem (15.00), jamás el recalculado. */
  pct: number | null;
  /** `EC_IVA_15` · `EC_IVA_0` — para el diagnóstico, no para el cálculo. */
  codigo: string | null;
}

export type VeredictoIva =
  | { ok: true; vat: number; taxable_amount: number; tax_percentage: number }
  | { ok: false; codigo: 'iva_no_coincide_con_nominal' | 'iva_sin_tasa_declarada';
      detalle: string };

/** Redondeo a 2 decimales, una sola vez y sobre el impuesto. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * 🔴 EL CRITERIO, FIRMADO: se verifica que el impuesto sea el REDONDEO CORRECTO
 * DEL NOMINAL, con la tolerancia que el redondeo impone — **no** que el
 * porcentaje recalculado dé 15,00 exacto.
 *
 * Y NO ASÍ: `round(impuesto / subtotal * 100, 2) == 15.00`. *Esa forma invierte
 * la operación y arrastra el error del redondeo al porcentaje, que es de dónde
 * salió el `14.98` que rompió todo el 25-ago.*
 *
 * La razón de negocio del founder, escrita para que nadie la «corrija»:
 * *el cuadre no se hace por operación, se hace en la conciliación contable;
 * perseguir el centavo por transacción produce rechazos de cobros legítimos
 * para resolver algo que se resuelve una vez al mes.*
 */
export function verificarIva(lineas: LineaIva[]): VeredictoIva {
  const subtotal = r2(lineas.reduce((a, l) => a + Number(l.subtotal || 0), 0));
  const impuesto = r2(lineas.reduce((a, l) => a + Number(l.impuesto || 0), 0));

  /* ✅ IVA 0 PASA SIEMPRE Y SE RESUELVE ANTES QUE NADA.
     No es una optimización: **es el único camino que hoy cobra de verdad**
     (medido: 70 de 81 ítems son `EC_IVA_0`). *Romperlo para habilitar el
     gravado sería cambiar un frente cerrado por uno abierto.*
     Y se decide por el IMPUESTO, no por la tasa: si no hay impuesto, no hay
     nada que verificar — aunque el ítem no declare código. */
  if (impuesto === 0) {
    return { ok: true, vat: 0, taxable_amount: subtotal, tax_percentage: 0 };
  }

  /* 🔴 Con impuesto > 0 la tasa es OBLIGATORIA y no se adivina.
     *Inferirla dividiendo daría exactamente el 14,98 que este guard existe
     para no volver a producir.* */
  const conTasa = lineas.filter((l) => l.pct != null);
  if (conTasa.length === 0) {
    return { ok: false, codigo: 'iva_sin_tasa_declarada',
      detalle: `impuesto=${impuesto} y ninguna linea declara su tasa nominal` };
  }

  /* Una sola tasa por cobro: mezclar 0 % y 15 % en un `tax_percentage` único
     es indecidible, y el proveedor recibe UN campo. Se rechaza en vez de
     elegir por mayoría. */
  const tasas = [...new Set(conTasa.filter((l) => Number(l.impuesto || 0) > 0)
    .map((l) => Number(l.pct)))];
  if (tasas.length > 1) {
    return { ok: false, codigo: 'iva_sin_tasa_declarada',
      detalle: `el cobro mezcla tasas distintas (${tasas.join(', ')}) y el `
             + `proveedor recibe una sola: se resuelve aguas arriba` };
  }
  const nominal = tasas[0] ?? Number(conTasa[0].pct);

  /* La base gravada es el SUBTOTAL de las líneas que tributan. *No se suma el
     envío: el contrato dice `taxable_amount = subtotal`, y si el flete tributa
     es una decisión de letra que hoy no está tomada.* */
  const baseGravada = r2(lineas
    .filter((l) => Number(l.impuesto || 0) > 0)
    .reduce((a, l) => a + Number(l.subtotal || 0), 0));

  const esperado = r2(baseGravada * nominal / 100);

  /* ± 1 centavo POR LÍNEA: con N líneas que redondean su propio impuesto, la
     suma puede diferir hasta en N centavos del redondeo del total. Exigir
     igualdad exacta sobre la suma es «perseguir el centavo por transacción». */
  const tolerancia = 0.01 * Math.max(1, lineas.length);
  const desvio = Math.abs(impuesto - esperado);

  if (desvio > tolerancia + 1e-9) {
    return { ok: false, codigo: 'iva_no_coincide_con_nominal',
      detalle: `impuesto=${impuesto} esperado=${esperado} nominal=${nominal}% `
             + `base=${baseGravada} desvio=${r2(desvio)} tolerancia=${r2(tolerancia)}` };
  }

  return {
    ok: true,
    /* Los tres al proveedor, DERIVADOS y no literales. */
    vat: impuesto,
    taxable_amount: baseGravada,
    /* 🔴 EL NOMINAL, JAMÁS EL RECALCULADO. *Mandarle 14,98 sería declararle
       una tasa que no existe en Ecuador.* El desvío vive en los centavos del
       impuesto, no en la tasa. */
    tax_percentage: nominal,
  };
}
