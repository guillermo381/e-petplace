// FISCAL — la puerta única al libro de comprobantes (S115-A · tanda 1).
//
// 🔴 NADA FISCAL LLEGA AL BUNDLE. Este wrapper no conoce el RUC del emisor, ni el
// certificado, ni la API key del proveedor: sólo llama RPCs DEFINER que devuelven
// lo que cada quien puede ver. Los datos del emisor viven en `fiscal_emisor`, que
// no tiene policy para `authenticated`.
//
// 🔴 `borrador` y `emitiendo` NO se distinguen en pantalla: los dos son
// «preparando». El estado interno del pipeline no es asunto de la familia — y
// mostrarlo invita a preguntar por qué su factura está «en borrador».
// El mapeo lo hace el SERVIDOR (`fiscal_mis_documentos`), no esta capa: si viviera
// acá, cada superficie podría decidir distinto y el mismo documento se llamaría
// de dos formas.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/** Lo que la familia VE. Jamás el estado crudo del motor. */
export type EstadoVisibleFiscal =
  | 'preparando' | 'faltan_tus_datos' | 'lista' | 'con_problema' | 'anulada';

export interface DocumentoFiscalMio {
  id: string;
  tipo: 'factura' | 'nota_credito';
  estadoVisible: EstadoVisibleFiscal;
  total: number;
  moneda: string;
  fechaEmision: string;
  claveAcceso: string | null;
  numero: string | null;
  tieneXml: boolean;
  tieneRide: boolean;
}

export interface TaxProfile {
  id: string;
  tipoIdentificacion: 'ruc' | 'cedula' | 'pasaporte' | 'consumidor_final';
  identificacion: string;
  razonSocial: string | null;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  esPredeterminado: boolean;
}

export type CodigoFiscal =
  | 'sin_sesion' | 'no_es_tuyo' | 'archivo_no_existe' | 'archivo_desconocido'
  | 'tipo_identificacion_invalido' | 'ruc_invalido' | 'cedula_invalida'
  | 'ruc_sin_razon_social' | 'no_sos_admin' | 'documento_no_existe'
  | 'documento_no_esta_pendiente_manual' | 'clave_acceso_formato'
  | 'clave_acceso_digito_verificador' | 'no_se_pudo';

const fallo = (codigo: CodigoFiscal, mensaje: string): ResultadoWrapper<never> =>
  ({ ok: false, codigo, mensaje });

/** Normaliza por PREFIJO: las RPC levantan `codigo` y a veces `codigo: detalle`. */
function codigoDe(msg: string | undefined): CodigoFiscal {
  const m = (msg ?? '').trim();
  const conocidos: CodigoFiscal[] = [
    'sin_sesion', 'no_es_tuyo', 'archivo_no_existe', 'archivo_desconocido',
    'tipo_identificacion_invalido', 'ruc_invalido', 'cedula_invalida',
    'ruc_sin_razon_social', 'no_sos_admin', 'documento_no_existe',
    'documento_no_esta_pendiente_manual', 'clave_acceso_formato',
    'clave_acceso_digito_verificador',
  ];
  return conocidos.find((c) => m.startsWith(c)) ?? 'no_se_pudo';
}

export async function misDocumentos(): Promise<ResultadoWrapper<DocumentoFiscalMio[]>> {
  const { data, error } = await getClient().rpc('fiscal_mis_documentos');
  if (error) return fallo(codigoDe(error.message), 'No pudimos traer tus comprobantes.');
  const filas = (data ?? []) as Array<Record<string, unknown>>;
  return {
    ok: true,
    data: filas.map((f) => ({
      id: String(f.id),
      tipo: f.tipo as 'factura' | 'nota_credito',
      estadoVisible: f.estado_visible as EstadoVisibleFiscal,
      total: Number(f.total),
      moneda: String(f.moneda ?? 'USD'),
      fechaEmision: String(f.fecha_emision),
      claveAcceso: (f.clave_acceso as string) ?? null,
      numero: (f.numero as string) ?? null,
      tieneXml: Boolean(f.tiene_xml),
      tieneRide: Boolean(f.tiene_ride),
    })),
  };
}

/**
 * URL firmada del XML o del RIDE.
 *
 * 🔴 DOS PASOS Y NO UNO: primero la RPC decide si podés verlo (el gate vive en el
 * SERVIDOR), y recién con su ruta se pide la firma. *Firmar primero y preguntar
 * después sería dejar que el cliente elija qué archivo firmar.*
 */
export async function urlFirmada(
  documentoId: string, cual: 'xml' | 'ride', segundos = 300,
): Promise<ResultadoWrapper<string>> {
  const cli = getClient();
  const { data: ruta, error } = await cli.rpc('fiscal_ruta_archivo', {
    p_documento_id: documentoId, p_cual: cual,
  });
  if (error) return fallo(codigoDe(error.message), 'No pudimos abrir ese archivo.');
  if (!ruta) return fallo('archivo_no_existe', 'Ese comprobante todavía no tiene archivo.');

  const { data, error: e2 } = await cli.storage.from('fiscal')
    .createSignedUrl(String(ruta), segundos);
  if (e2 || !data?.signedUrl) {
    return fallo('no_se_pudo', 'No pudimos preparar el enlace del comprobante.');
  }
  return { ok: true, data: data.signedUrl };
}

export async function obtenerTaxProfile(): Promise<ResultadoWrapper<TaxProfile | null>> {
  const { data, error } = await getClient().rpc('fiscal_tax_profile_mio');
  if (error) return fallo(codigoDe(error.message), 'No pudimos traer tus datos de facturación.');
  if (!data) return { ok: true, data: null };
  const f = data as Record<string, unknown>;
  return {
    ok: true,
    data: {
      id: String(f.id),
      tipoIdentificacion: f.tipo_identificacion as TaxProfile['tipoIdentificacion'],
      identificacion: String(f.identificacion),
      razonSocial: (f.razon_social as string) ?? null,
      direccion: (f.direccion as string) ?? null,
      email: (f.email as string) ?? null,
      telefono: (f.telefono as string) ?? null,
      esPredeterminado: Boolean(f.es_predeterminado),
    },
  };
}

export async function guardarTaxProfile(args: {
  tipoIdentificacion: TaxProfile['tipoIdentificacion'];
  identificacion: string;
  razonSocial?: string | null;
  direccion?: string | null;
  email?: string | null;
  telefono?: string | null;
  predeterminado?: boolean;
}): Promise<ResultadoWrapper<TaxProfile>> {
  const { data, error } = await getClient().rpc('fiscal_tax_profile_upsert', {
    p_tipo_identificacion: args.tipoIdentificacion,
    p_identificacion: args.identificacion,
    p_razon_social: args.razonSocial ?? undefined,
    p_direccion: args.direccion ?? undefined,
    p_email: args.email ?? undefined,
    p_telefono: args.telefono ?? undefined,
    p_predeterminado: args.predeterminado ?? true,
  });
  if (error) return fallo(codigoDe(error.message), 'No pudimos guardar tus datos de facturación.');
  const f = data as Record<string, unknown>;
  return {
    ok: true,
    data: {
      id: String(f.id),
      tipoIdentificacion: f.tipo_identificacion as TaxProfile['tipoIdentificacion'],
      identificacion: String(f.identificacion),
      razonSocial: (f.razon_social as string) ?? null,
      direccion: (f.direccion as string) ?? null,
      email: (f.email as string) ?? null,
      telefono: (f.telefono as string) ?? null,
      esPredeterminado: Boolean(f.es_predeterminado),
    },
  };
}

// ── ADMIN ────────────────────────────────────────────────────────────────────
export async function adminListar(filtro: {
  estado?: string; desde?: string; hasta?: string;
} = {}): Promise<ResultadoWrapper<Array<Record<string, unknown>>>> {
  const { data, error } = await getClient().rpc('fiscal_admin_listar', {
    /* `?? undefined` y no `?? null`: los tipos generados declaran estos
       argumentos como opcionales (`string | undefined`). Mandar `null` explícito
       compila mal y, si el tipo fuera laxo, PostgREST recibiría un `null` donde
       la RPC espera «no lo mandes» — dos cosas distintas. */
    p_estado: filtro.estado ?? undefined,
    p_desde: filtro.desde ?? undefined,
    p_hasta: filtro.hasta ?? undefined,
  });
  if (error) return fallo(codigoDe(error.message), 'No pudimos listar los comprobantes.');
  return { ok: true, data: (data ?? []) as Array<Record<string, unknown>> };
}

/**
 * Cierra a mano un documento que emitió un tercero (la clínica, en agencia).
 *
 * 🔴 VALIDA EL MÓDULO 11 LOCALMENTE, y eso es todo lo que valida. Que la clave
 * esté bien FORMADA no dice que el SRI la haya autorizado — la validación contra
 * el SRI es tanda 2. El retorno lo declara (`contraSri: false`) en vez de dejar
 * que quien lo lea suponga.
 */
export async function adminCerrarManual(args: {
  documentoId: string; claveAcceso: string;
  numeroAutorizacion?: string | null; autorizadoEn?: string | null;
}): Promise<ResultadoWrapper<{ documentoId: string; contraSri: false }>> {
  const { data, error } = await getClient().rpc('fiscal_admin_cerrar_manual', {
    p_documento_id: args.documentoId,
    p_clave_acceso: args.claveAcceso,
    p_numero_autorizacion: args.numeroAutorizacion ?? undefined,
    p_autorizado_en: args.autorizadoEn ?? new Date().toISOString(),
  });
  if (error) return fallo(codigoDe(error.message), 'No pudimos cerrar ese comprobante.');
  const f = (data ?? {}) as Record<string, unknown>;
  return { ok: true, data: { documentoId: String(f.documento_id ?? args.documentoId), contraSri: false } };
}
