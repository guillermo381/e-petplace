// ═══════════════════════════════════════════════════════════════════════════
// EL DOCUMENTO CANÓNICO v3 — la fuente de la que sale el XML
//
// 🔴 SE PERSISTE. `documentos_fiscales.canonico` guarda esto tal cual se emitió,
//    con su `canonico_version`. *Un documento cuyo contenido hay que reconstruir
//    consultando cinco tablas vivas no se puede reemitir dos años después: para
//    entonces el precio, el nombre del servicio y la tarifa cambiaron.*
// ═══════════════════════════════════════════════════════════════════════════

export const CANONICO_VERSION = 3;   // v3: dirEstablecimiento · propina · formaPago · esquema

/**
 * Los catálogos traducidos, tal como salen de la base.
 *
 * 🔴 Entran como ARGUMENTO y no se leen acá adentro: el canónico es una función
 *    pura de lo que recibe, y por eso se puede reconstruir en un test sin base.
 *    *Y falla si le falta una entrada — jamás cae a un default: un
 *    `codigoPorcentaje` inventado produce un XML que el SRI rechaza, y el rechazo
 *    aparece semanas después, en otro sistema, sin decir de dónde vino.*
 */
export interface CatalogosSri {
  /** codigo_iva de la casa → { codigo, codigoPorcentaje } del SRI */
  tasas: Record<string, { codigo_sri: string; codigo_porcentaje_sri: string }>;
  /** tipo_identificacion de la casa → codigo del SRI */
  identificacion: Record<string, string>;
}

/** `YYYY-MM-DD` → `dd/mm/aaaa`, que es como el SRI quiere la fecha en el XML. */
export function fechaSri(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new Error(`fecha_emision_invalida: ${iso}`);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export interface EmisorCanonico {
  ruc: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion_matriz: string;
  /** La dirección del LOCAL. Cae a la matriz si nadie la declaró, y se ve. */
  direccion_establecimiento: string;
  establecimiento: string;
  punto_emision: string;
  obligado_contabilidad: boolean;
  leyenda_regimen: string | null;
  contribuyente_especial: string | null;
  ambiente: 1 | 2;
  /**
   * La versión del esquema del comprobante (1.0.0 | 2.1.0), como DATO.
   *
   * 🔴 Conviven las dos en producción. Manda la que exija el proveedor que se
   *    elija; hasta entonces 2.1.0 — la más nueva, y la que trae
   *    `agenteRetencion`, que hace falta si el SRI designa a Satori.
   *    *Un literal en el generador obliga a un deploy para cambiar de esquema.*
   */
  version_esquema: string;
  /**
   * El número de RESOLUCIÓN con que el SRI designa agente de retención — no un
   * booleano. Va en `<agenteRetencion>` del 2.1.0, y sólo si existe: *el campo
   * no admite un valor inventado.*
   */
  agente_retencion_resolucion: string | null;
}

/* ⚠️ LA MONEDA NO ESTÁ ACÁ A PROPÓSITO: la pone el generador de XML de cada
   proveedor, no nosotros. Guardarla como decisión propia crearía dos fuentes
   para el mismo valor, y la nuestra envejecería sin que nadie la mire. */

export interface ReceptorCanonico {
  tipo_identificacion: 'ruc' | 'cedula' | 'pasaporte' | 'consumidor_final';
  /** El código del SRI (05|04|06|07). Se CONGELA acá: el catálogo puede cambiar. */
  tipo_identificacion_sri?: string;
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
  /** Los dos códigos del SRI, traducidos del catálogo y congelados en el documento. */
  codigo_sri?: string;              // tipo de impuesto: 2 = IVA
  codigo_porcentaje_sri?: string;   // tarifa: 0 = 0 % · 4 = 15 % · 5 = 5 %
}

export interface DocumentoCanonico {
  version: number;
  tipo: 'factura' | 'nota_credito';
  /** La fecha del documento, en los dos formatos: el nuestro y el del SRI. */
  fecha_emision: string;        // ISO, de la FILA (zona del emisor), no del reloj
  fecha_emision_sri: string;    // dd/mm/aaaa — lo que va en <fechaEmision>
  emisor: EmisorCanonico;
  receptor: ReceptorCanonico;
  items: ItemCanonico[];
  subtotales_por_tarifa: { codigo_iva: string; tarifa_pct: number; base: number; valor_iva: number }[];
  descuento_total: number;
  total: number;
  /**
   * 🔴 VA AUNQUE SEA CERO, y el porqué queda escrito para que nadie lo
   *    «arregle»: **nosotros no cobramos propina.** Nuestra tarifa de servicio
   *    NO es una propina — es una LÍNEA DE VENTA con su IVA, que va en el
   *    detalle y tributa. *Ponerla acá la sacaría de la base imponible.*
   */
  propina: number;
  /** Código del catálogo del SRI (tabla 24), derivado del riel del pago. */
  forma_pago_sri: string;
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
  fecha_emision: string;              // ISO, de la fila
  emisor: EmisorCanonico;
  receptor: ReceptorCanonico;
  items: ItemCanonico[];
  catalogos: CatalogosSri;
  /** Código del SRI ya resuelto. Es obligatorio: sin él no hay XML válido. */
  forma_pago_sri: string;
  descuento_total?: number;
  rucProveedorFacturacion?: string | null;
  razonSocialCuentaComercial?: string | null;
  referencias: DocumentoCanonico['referencias'];
}): DocumentoCanonico {
  /* ── LA TRADUCCIÓN, FAIL-CLOSED ──────────────────────────────────────────
     🔴 Medido en el simulador antes de esto: escribía nuestro `EC_IVA_15`
     dentro de `<codigoPorcentaje>` y nuestro `cedula` en
     `<tipoIdentificacionComprador>`. *El XML se armaba igual y el simulador lo
     aceptaba: el rechazo sólo aparecía el día que del otro lado hubiera un web
     service de verdad.* Por eso acá se LANZA en vez de caer a un default —
     un código inventado produce el mismo XML plausible que el defecto original. */
  const items: ItemCanonico[] = args.items.map((it) => {
    const t = args.catalogos.tasas[it.codigo_iva];
    if (!t) throw new Error(`tasa_sin_codigo_sri: ${it.codigo_iva}`);
    return { ...it, codigo_sri: t.codigo_sri, codigo_porcentaje_sri: t.codigo_porcentaje_sri };
  });

  if (!args.forma_pago_sri) {
    throw new Error('forma_pago_sin_codigo_sri: el riel del pago no resolvió a un código');
  }
  const idSri = args.catalogos.identificacion[args.receptor.tipo_identificacion];
  if (!idSri) throw new Error(`identificacion_sin_codigo_sri: ${args.receptor.tipo_identificacion}`);
  const receptor: ReceptorCanonico = { ...args.receptor, tipo_identificacion_sri: idSri };

  const grupos = subtotalesPorTarifa(items);
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
    fecha_emision: args.fecha_emision,
    fecha_emision_sri: fechaSri(args.fecha_emision),
    emisor: args.emisor,
    receptor,
    items,
    subtotales_por_tarifa: grupos,
    descuento_total: args.descuento_total ?? 0,
    total: Math.round((base + iva) * 100) / 100,
    propina: 0,                       // ver el comentario del campo: es 0 A PROPÓSITO
    forma_pago_sri: args.forma_pago_sri,
    informacion_adicional: info,
    referencias: args.referencias,
  };
}
