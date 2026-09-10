// ═══════════════════════════════════════════════════════════════════════════
// EL DOCUMENTO CANÓNICO v1 — la fuente de la que sale el XML
//
// 🔴 SE PERSISTE. `documentos_fiscales.canonico` guarda esto tal cual se emitió,
//    con su `canonico_version`. *Un documento cuyo contenido hay que reconstruir
//    consultando cinco tablas vivas no se puede reemitir dos años después: para
//    entonces el precio, el nombre del servicio y la tarifa cambiaron.*
// ═══════════════════════════════════════════════════════════════════════════

export const CANONICO_VERSION = 1;

export interface EmisorCanonico {
  ruc: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion_matriz: string;
  establecimiento: string;
  punto_emision: string;
  obligado_contabilidad: boolean;
  leyenda_regimen: string | null;
  contribuyente_especial: string | null;
  ambiente: 1 | 2;
}

export interface ReceptorCanonico {
  tipo_identificacion: 'ruc' | 'cedula' | 'pasaporte' | 'consumidor_final';
  identificacion: string;
  razon_social: string;
  direccion: string | null;
  email: string | null;
}

export interface ItemCanonico {
  linea: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  codigo_iva: string;
  tarifa_pct: number;
  base: number;
  valor_iva: number;
}

export interface DocumentoCanonico {
  version: number;
  tipo: 'factura' | 'nota_credito';
  emisor: EmisorCanonico;
  receptor: ReceptorCanonico;
  items: ItemCanonico[];
  subtotales_por_tarifa: { codigo_iva: string; tarifa_pct: number; base: number; valor_iva: number }[];
  descuento_total: number;
  total: number;
  informacion_adicional: Record<string, string>;
  referencias: {
    pago_intento_id: string | null;
    origen_tipo: string | null;
    origen_id: string | null;
    clave_acceso_original?: string;   // nota de crédito → su factura
  };
}

/** El receptor por defecto cuando el pago no supera el tope y nadie eligió. */
export const CONSUMIDOR_FINAL: ReceptorCanonico = {
  tipo_identificacion: 'consumidor_final',
  identificacion: '9999999999999',
  razon_social: 'CONSUMIDOR FINAL',
  direccion: null,
  email: null,
};

/**
 * Agrupa las líneas por tarifa.
 *
 * 🔴 SUMA LAS LÍNEAS YA REDONDEADAS, jamás recalcula sobre el subtotal del grupo.
 *    La regla de la casa (CHECK `chk_iva_cuadra`) es: cada línea redondea a dos
 *    decimales y el total es la SUMA de las líneas. *Recalcular acá daría un
 *    número distinto del que la base guardó, y el que no cuadre lo va a descubrir
 *    el SRI, no nosotros.*
 */
export function subtotalesPorTarifa(items: ItemCanonico[]) {
  const m = new Map<string, { codigo_iva: string; tarifa_pct: number; base: number; valor_iva: number }>();
  for (const it of items) {
    const k = it.codigo_iva;
    const acc = m.get(k) ?? { codigo_iva: k, tarifa_pct: it.tarifa_pct, base: 0, valor_iva: 0 };
    acc.base += it.base;
    acc.valor_iva += it.valor_iva;
    m.set(k, acc);
  }
  return [...m.values()].map((g) => ({
    ...g,
    base: Math.round(g.base * 100) / 100,
    valor_iva: Math.round(g.valor_iva * 100) / 100,
  }));
}

export function construirCanonico(args: {
  tipo: 'factura' | 'nota_credito';
  emisor: EmisorCanonico;
  receptor: ReceptorCanonico;
  items: ItemCanonico[];
  descuento_total?: number;
  rucProveedorFacturacion?: string | null;
  razonSocialCuentaComercial?: string | null;
  referencias: DocumentoCanonico['referencias'];
}): DocumentoCanonico {
  const grupos = subtotalesPorTarifa(args.items);
  const base = grupos.reduce((a, g) => a + g.base, 0);
  const iva = grupos.reduce((a, g) => a + g.valor_iva, 0);

  const info: Record<string, string> = {};
  /* El RUC del proveedor de facturación viaja en el campo adicional de CADA XML
     — es requisito del registro obligatorio (Res. NAC-DGERCGC26-00000027). */
  if (args.rucProveedorFacturacion) info.rucProveedorFacturacion = args.rucProveedorFacturacion;
  /* 🔴 QUIÉN PRESTÓ EL SERVICIO, en el documento. En reventa Satori es el vendedor
     y responde por lo vendido (v0.3 §1.3): decir en la factura quién ejecutó no es
     un adorno, es parte de cómo se acota esa responsabilidad. */
  if (args.razonSocialCuentaComercial) info.servicioPrestadoPor = args.razonSocialCuentaComercial;

  return {
    version: CANONICO_VERSION,
    tipo: args.tipo,
    emisor: args.emisor,
    receptor: args.receptor,
    items: args.items,
    subtotales_por_tarifa: grupos,
    descuento_total: args.descuento_total ?? 0,
    total: Math.round((base + iva) * 100) / 100,
    informacion_adicional: info,
    referencias: args.referencias,
  };
}
