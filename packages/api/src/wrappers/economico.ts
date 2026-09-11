// ECONÓMICO — la tarifa de servicio y la comisión, para el checkout y el taller de precio.
// Letra: MODELO_ECONOMICO v1.1 · D-A, D-B, D-D.
//
// 🔴 NINGÚN PORCENTAJE, NINGÚN MÍNIMO Y NINGUNA FECHA VIVEN ACÁ. Todo se le pregunta al
// motor, que resuelve de `fee_configs` por vigencia. *El día que la comisión cambie, la
// pantalla dice la verdad sola — que es exactamente lo que la regla del §891 del modelo
// financiero pide desde S56.*

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export interface TarifaServicio {
  /** Lo que se COBRA. En promoción es 0 — y la línea SE MUESTRA igual. */
  base: number;
  /** Lo que se regala. Se muestra tachado o como descuento; nunca se esconde. */
  descuento: number;
  montoLista: number;
  codigoIva: string;
  tarifaPct: number;
  valorIva: number;
  promocionada: boolean;
}

export interface ComisionAplicable {
  /** La fecha con la que se preguntó. Se devuelve para que la pantalla pueda decirla. */
  fechaConsultada: string;
  pct: number;
  minimo: number;
  base: 'subtotal' | 'total_con_impuesto' | string;
  comisionLlevaIva: boolean;
  codigoIva: string | null;
  tarifaIvaPct: number | null;
  categoria: string;
}

export type CodigoEconomico =
  | 'sin_configuracion' | 'sin_tarifa_iva_vigente'
  | 'prestador_sin_cuenta_comercial' | 'tipo_servicio_no_existe'
  | 'sin_fee_vigente_para_esa_fecha' | 'no_se_pudo';

const fallo = (codigo: CodigoEconomico, mensaje: string): ResultadoWrapper<never> =>
  ({ ok: false, codigo, mensaje });

/**
 * La tarifa de servicio a la familia, para una fecha.
 *
 * 🔴 EN PROMOCIÓN DEVUELVE `base: 0` CON SU `descuento`, y la línea igual se dibuja.
 * *Una línea que se esconde mientras vale cero hay que construirla el día que se cobra,
 * y ese día el usuario ve aparecer un cargo que nunca estuvo.*
 */
export async function tarifaServicio(
  fecha?: string,
): Promise<ResultadoWrapper<TarifaServicio>> {
  const { data, error } = await getClient().rpc('tarifa_servicio_vigente',
    fecha ? { p_fecha: fecha } : {});
  if (error) return fallo('no_se_pudo', 'No pudimos leer la tarifa de servicio.');
  const d = (data ?? {}) as Record<string, unknown>;
  if (!d.vigente) {
    return fallo((d.motivo as CodigoEconomico) ?? 'no_se_pudo',
      'La tarifa de servicio no está configurada.');
  }
  return {
    ok: true,
    data: {
      base: Number(d.base), descuento: Number(d.descuento),
      montoLista: Number(d.monto_lista), codigoIva: String(d.codigo_iva),
      tarifaPct: Number(d.tarifa_pct), valorIva: Number(d.valor_iva),
      promocionada: Boolean(d.promocionada),
    },
  };
}

/**
 * Lo que el prestador va a recibir — **para la fecha en que su precio vaya a regir**.
 *
 * 🔴 LA FECHA LA PONE QUIEN PREGUNTA, y no es un detalle: hoy la comisión resuelve 10 %
 * y desde el 1-oct 18 %. Un prestador que configura hoy un precio para operar en octubre
 * vería «recibís el 90 %» y cobraría el 82 %. **Pasá la fecha en que el precio va a
 * regir, no la de hoy.** Ninguna capa tiene esa fecha escrita: vive en la vigencia de
 * `fee_configs`.
 */
export async function comisionAplicable(args: {
  prestadorId: string; tipoServicio: string; fechaVigencia: string;
}): Promise<ResultadoWrapper<ComisionAplicable>> {
  const { data, error } = await getClient().rpc('comision_aplicable', {
    p_prestador_id: args.prestadorId,
    p_tipo_servicio: args.tipoServicio,
    p_fecha: args.fechaVigencia,
  });
  if (error) return fallo('no_se_pudo', 'No pudimos calcular tu comisión.');
  const d = (data ?? {}) as Record<string, unknown>;
  if (!d.conocida) {
    /* Fail-closed: si el motor no sabe, la pantalla NO muestra 0 %. Decirle a un
       prestador «te queda el 100 %» es la mentira más cara que puede decir. */
    return fallo((d.motivo as CodigoEconomico) ?? 'no_se_pudo',
      'No pudimos calcular tu comisión para esa fecha.');
  }
  return {
    ok: true,
    data: {
      fechaConsultada: String(d.fecha_consultada),
      pct: Number(d.pct), minimo: Number(d.minimo),
      base: String(d.base), comisionLlevaIva: Boolean(d.comision_lleva_iva),
      codigoIva: (d.codigo_iva as string) ?? null,
      tarifaIvaPct: d.tarifa_iva_pct == null ? null : Number(d.tarifa_iva_pct),
      categoria: String(d.categoria),
    },
  };
}

/**
 * Lo que el prestador RECIBE por un precio neto, en una fecha.
 *
 * 🔴 APLICA EL MÍNIMO. Sin esto la pantalla mostraría «18 %» sobre un ticket chico y
 * mentiría: un paseo de $6,00 al 18 % da $1,08, pero se cobra el mínimo de $1,50.
 * El cálculo es el MISMO que hace el motor (`comision_efectiva`), no una copia.
 */
export function netoDelPrestador(precioNeto: number, c: ComisionAplicable): {
  comision: number; aplico: 'porcentual' | 'minimo'; neto: number;
} {
  const porcentual = Math.round(precioNeto * c.pct) / 100;
  const comision = Math.max(porcentual, c.minimo);
  return {
    comision,
    aplico: porcentual >= c.minimo ? 'porcentual' : 'minimo',
    neto: Math.round((precioNeto - comision) * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LOS TRES NÚMEROS DEL PRESTADOR (MODELO_ECONOMICO · D-C)
// «tu precio sin IVA · lo que ve la familia · lo que recibes»
// ═══════════════════════════════════════════════════════════════════════════

export interface TresNumeros {
  /** Lo que el prestador declara. Es su precio, sin IVA. */
  neto: number;
  /** Lo que la familia ve y paga: neto + IVA. Nunca se le suma nada en el checkout. */
  loQueVeLaFamilia: number;
  /** Lo que el prestador recibe: neto − comisión. **Sin descuento de riel.** */
  loQueRecibis: number;
  comision: number;
  /** `minimo` cuando el piso mandó, `porcentual` cuando mandó el %, `base_cero` si no hay base. */
  aplico: 'porcentual' | 'minimo' | 'base_cero';
  comisionPct: number;
  comisionMinimo: number;
  ivaPct: number;
  fechaVigencia: string;
}


/**
 * El día en que un precio configurado HOY va a empezar a regir.
 *
 * 🔴 NACIÓ PORQUE UNA FECHA EN LA PANTALLA ES PLATA. `tresNumerosDelPrestador`
 *    tiene razón en exigir la fecha —pide la comisión del día en que el precio
 *    VA A REGIR, no la de hoy— y la pantalla tiene razón en no inventarla:
 *    `'2026-10-01'` escrito en un bundle es una fecha de plata que no se
 *    corrige el día que la apertura se mueve. Sale de `app_config`.
 *
 * `max(hoy, apertura)`: antes de abrir, lo que se configura rige desde la
 * apertura; después, desde hoy. Las dos son ISO, así que comparar texto es
 * comparar fechas.
 *
 * 🔴 FAIL-CLOSED: sin la fila NO cae a hoy. *Caer a hoy daría la comisión
 *    vigente ahora para un precio que se va a cobrar en octubre, y el número
 *    equivocado se vería perfectamente normal.*
 */
export async function fechaDeVigenciaPorDefecto(): Promise<ResultadoWrapper<string>> {
  const { data, error } = await getClient()
    .from('app_config').select('valor').eq('clave', 'fecha_apertura_comercial').maybeSingle();
  if (error) return fallo('no_se_pudo', 'No pudimos leer la fecha de apertura.');
  const apertura = data?.valor;
  if (!apertura || !/^\d{4}-\d{2}-\d{2}$/.test(apertura)) {
    return fallo('sin_configuracion', 'No hay fecha de apertura configurada.');
  }
  /* El «hoy» del negocio es el de Guayaquil, que es donde se opera — el mismo
     criterio con el que la casa fecha un comprobante. Si el aparato no soporta
     zonas en `Intl`, cae a su fecha local: se diferencia como mucho en un día
     y sólo alrededor de la medianoche, y se declara acá en vez de esconderse. */
  let hoy: string;
  try {
    hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());
  } catch {
    hoy = new Date().toISOString().slice(0, 10);
  }
  return { ok: true, data: hoy > apertura ? hoy : apertura };
}

/**
 * Los tres números, para la FECHA en que el precio va a regir.
 *
 * 🔴 TRES COSAS QUE ESTA PUERTA HACE Y LA VIEJA NO:
 *  ① aplica el **mínimo** — sin él la pantalla muestra «18 %» y cobra el piso;
 *  ② el riel **NO se descuenta** al prestador (D-C): recibe su precio menos la comisión;
 *  ③ pide la comisión de la **fecha en que el precio rige**, no la de hoy.
 *
 * ⚠️ `obtenerComisionVigenteCita()` sigue viva porque cuatro talleres publicados la
 * consumen, pero **devuelve el modelo viejo** (sólo el %, sin mínimo y con el riel
 * descontado). Migrá a ésta al tocar cada taller.
 */
export async function tresNumerosDelPrestador(args: {
  prestadorId: string; tipoServicio: string; precioNeto: number;
  /**
   * OPCIONAL desde S115-A (firma del founder). Sin ella, la puerta la resuelve
   * con `fechaDeVigenciaPorDefecto()`. **La pantalla no conoce ninguna fecha** —
   * y no debe: una fecha escrita en una pantalla es una fecha de plata dentro
   * de un bundle.
   */
  fechaVigencia?: string;
}): Promise<ResultadoWrapper<TresNumeros>> {
  let fecha = args.fechaVigencia;
  if (!fecha) {
    const f = await fechaDeVigenciaPorDefecto();
    if (!f.ok) return f;
    fecha = f.data;
  }
  const c = await comisionAplicable({
    prestadorId: args.prestadorId, tipoServicio: args.tipoServicio,
    fechaVigencia: fecha,
  });
  if (!c.ok) return c;

  const { comision, aplico, neto } = netoDelPrestador(args.precioNeto, c.data);
  const iva = c.data.tarifaIvaPct ?? 0;

  return {
    ok: true,
    data: {
      neto: args.precioNeto,
      loQueVeLaFamilia: Math.round(args.precioNeto * (100 + iva)) / 100,
      loQueRecibis: neto,
      comision, aplico,
      comisionPct: c.data.pct, comisionMinimo: c.data.minimo,
      ivaPct: iva, fechaVigencia: c.data.fechaConsultada,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LA CONFIGURACIÓN DEL CHECKOUT — orden de medios y diferido
// ═══════════════════════════════════════════════════════════════════════════

export interface ConfiguracionPago {
  /** El orden en que se OFRECEN. DeUna primero por costo de riel (D-D). */
  ordenMedios: string[];
  /** `false` hoy. Cuesta 7,7 %–15 %: encenderlo es una decisión, no un descuido. */
  diferidoVivo: boolean;
  /** El bono de recarga. Su encendido es `bonoRecargaVivo`, NO que el mínimo sea > 0. */
  bonoRecargaPct: number;
  bonoRecargaMinimo: number;
  bonoRecargaVivo: boolean;
}

/**
 * 🔴 EL ORDEN NO ES ESTÉTICO: ES PLATA. Crédito corriente cuesta 6,35 % + $0,05;
 * débito 2,9 %; **cada punto de mezcla que sale de crédito vale ~4 % del ticket.**
 * Por eso viene del servidor y no de un array en la pantalla: se reordena sin deploy.
 */
export async function configuracionPago(): Promise<ResultadoWrapper<ConfiguracionPago>> {
  const { data, error } = await getClient()
    .from('app_config').select('clave, valor')
    .in('clave', ['medios_pago_orden', 'pago_diferido_vivo',
                  'saldo_bono_recarga_pct', 'saldo_bono_recarga_minimo',
                  'saldo_bono_recarga_vivo']);
  if (error) return fallo('no_se_pudo', 'No pudimos leer la configuración de pago.');

  const m = new Map((data ?? []).map((r) => [r.clave as string, r.valor as string]));
  const orden = (m.get('medios_pago_orden') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (orden.length === 0) {
    /* Fail-closed: sin orden configurado NO se inventa uno. Un orden por defecto
       escrito en la pantalla es exactamente lo que esta clave existe para evitar. */
    return fallo('sin_configuracion', 'No hay orden de medios de pago configurado.');
  }
  const minimo = Number(m.get('saldo_bono_recarga_minimo') ?? 0);
  return {
    ok: true,
    data: {
      ordenMedios: orden,
      diferidoVivo: m.get('pago_diferido_vivo') === 'true',
      bonoRecargaPct: Number(m.get('saldo_bono_recarga_pct') ?? 0),
      bonoRecargaMinimo: minimo,
      /* 🔴 El encendido tiene BANDERA PROPIA, y no se deriva del mínimo. La v1 hacía
         `minimo > 0` — y cuando el mínimo pasó a su valor firmado ($50) el bono se
         habría leído como ENCENDIDO sin que nadie lo encendiera. *Un apagado que
         depende de que un valor sea cero se prende solo el día que alguien escribe
         el valor de verdad.* */
      bonoRecargaVivo: m.get('saldo_bono_recarga_vivo') === 'true',
    },
  };
}
