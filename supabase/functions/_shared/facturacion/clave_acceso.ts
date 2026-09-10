// ═══════════════════════════════════════════════════════════════════════════
// LA CLAVE DE ACCESO — 49 dígitos, del lado NUESTRO
//
// 🔴 LA CASA PONE EL NÚMERO. No es preferencia: la clave de acceso ES el número
//    de autorización del comprobante, y si la pone el proveedor, la casa depende
//    de él para saber cómo se llama su propio documento. Se calcula acá y se
//    persiste ANTES del POST — así un timeout no deja un documento sin nombre.
//
// Estructura (ficha técnica del SRI, esquema offline):
//   ddmmaaaa(8) · tipoComprobante(2) · ruc(13) · ambiente(1) · serie(6)
//   · secuencial(9) · codigoNumerico(8) · tipoEmision(1) · verificador(1) = 49
// ═══════════════════════════════════════════════════════════════════════════

export const TIPO_COMPROBANTE = {
  factura: '01',
  nota_credito: '04',
} as const;

/**
 * Módulo 11 con pesos 2..7 ciclando de DERECHA a IZQUIERDA.
 *
 * 🔴 Los dos bordes son de la ficha, no invenciones: resto 0 ⇒ verificador 0, y
 *    resto 1 ⇒ verificador 1. *Sin ellos el dígito sale 11 o 10 — dos caracteres
 *    donde el formato admite uno, y el comprobante rebota sin decir por qué.*
 */
export function digitoVerificador(cuarentaYOcho: string): number {
  if (!/^\d{48}$/.test(cuarentaYOcho)) {
    throw new Error('clave_acceso_base_invalida: se esperaban 48 dígitos');
  }
  let suma = 0;
  let peso = 2;
  for (let i = cuarentaYOcho.length - 1; i >= 0; i--) {
    suma += Number(cuarentaYOcho[i]) * peso;
    peso = peso === 7 ? 2 : peso + 1;
  }
  const resto = suma % 11;
  const d = 11 - resto;
  if (d === 11) return 0;
  if (d === 10) return 1;
  return d;
}

export interface PartesClave {
  fecha: Date;
  tipoComprobante: keyof typeof TIPO_COMPROBANTE;
  ruc: string;
  ambiente: 1 | 2;
  establecimiento: string;
  puntoEmision: string;
  secuencial: string;
  codigoNumerico: string;
}

export function construirClaveAcceso(p: PartesClave): string {
  const dd = String(p.fecha.getUTCDate()).padStart(2, '0');
  const mm = String(p.fecha.getUTCMonth() + 1).padStart(2, '0');
  const aaaa = String(p.fecha.getUTCFullYear());

  if (!/^\d{13}$/.test(p.ruc)) throw new Error('ruc_invalido');
  if (!/^\d{3}$/.test(p.establecimiento)) throw new Error('establecimiento_invalido');
  if (!/^\d{3}$/.test(p.puntoEmision)) throw new Error('punto_emision_invalido');
  if (!/^\d{9}$/.test(p.secuencial)) throw new Error('secuencial_invalido');
  if (!/^\d{8}$/.test(p.codigoNumerico)) throw new Error('codigo_numerico_invalido');

  const base =
    `${dd}${mm}${aaaa}` +
    TIPO_COMPROBANTE[p.tipoComprobante] +
    p.ruc +
    String(p.ambiente) +
    p.establecimiento + p.puntoEmision +
    p.secuencial +
    p.codigoNumerico +
    '1';                       // tipo de emisión: 1 = normal (el único vivo)

  if (base.length !== 48) {
    throw new Error(`clave_acceso_base_largo_${base.length}_esperaba_48`);
  }
  return base + String(digitoVerificador(base));
}

/**
 * EL CÓDIGO NUMÉRICO SALE DEL SECUENCIAL — no de un dado.
 *
 * 🔴 La ficha del SRI deja los 8 dígitos a criterio del emisor, y por eso mismo
 *    la decisión es nuestra y tiene consecuencia: con un valor ALEATORIO la clave
 *    deja de poder recalcularse desde la fila y hay que ir a buscarla; derivada
 *    del secuencial, la clave es una FUNCIÓN de los datos del documento — se
 *    recalcula, se coteja, y una fila con la clave cambiada se nota.
 *
 * Es lo que hacen las facturas reales que medimos: Multicines secuencial 17078 →
 * código `00017078`; 227ITALY 126825 → `00126825`. *El secuencial sin su cero
 * inicial*, que sobre 9 dígitos son sus últimos 8.
 *
 * ⚠️ Con secuencial ≥ 100.000.000 se pierde el dígito de la izquierda. NO rompe
 *    nada: el secuencial COMPLETO ya viaja en la clave en su propio campo, así
 *    que la clave sigue siendo única y sigue siendo derivable — lo único que
 *    deja de ser es inyectiva en estos 8 dígitos, que no identifican nada.
 */
export function codigoNumericoDesdeSecuencial(secuencial: string): string {
  if (!/^\d{1,9}$/.test(secuencial)) throw new Error('secuencial_invalido');
  return secuencial.padStart(9, '0').slice(-8);
}

/**
 * La clave RECALCULADA desde una fila de `documentos_fiscales` + su emisor.
 *
 * Existe para que haya UNA sola implementación: la que emite y la que verifica.
 * *No es tautológico comparar contra la almacenada — la almacenada es un dato de
 * una corrida pasada; lo que este cotejo caza es la deriva entre lo que se emitió
 * y lo que hoy se puede reconstruir, que es exactamente el defecto que un código
 * aleatorio volvía invisible.*
 */
export function reconstruirClaveAcceso(fila: {
  fecha_emision: string;                       // date (YYYY-MM-DD) — de la FILA, no del reloj
  tipo: keyof typeof TIPO_COMPROBANTE;
  establecimiento: string;
  punto_emision: string;
  secuencial: string;
}, emisor: { ruc: string; ambiente: number }): string {
  return construirClaveAcceso({
    fecha: fechaDeFilaUTC(fila.fecha_emision),
    tipoComprobante: fila.tipo,
    ruc: emisor.ruc,
    ambiente: emisor.ambiente as 1 | 2,
    establecimiento: fila.establecimiento,
    puntoEmision: fila.punto_emision,
    secuencial: fila.secuencial,
    codigoNumerico: codigoNumericoDesdeSecuencial(fila.secuencial),
  });
}

/**
 * El ambiente, en sus DOS vocabularios — y no son intercambiables.
 *
 * 🔴 La columna `documentos_fiscales.sri_ambiente` es TEXTO con un CHECK
 *    heredado (`'pruebas' | 'produccion'`); la CLAVE de acceso lleva el DÍGITO
 *    (1 | 2). *Escribir el dígito en la columna rebota el UPDATE — y como nadie
 *    leía el error del `.update()`, el documento se quedaba en `borrador` y el
 *    siguiente pase consumía OTRO secuencial: huecos en la numeración, que es
 *    justo lo que el orden de esta función existe para impedir.*
 */
export const AMBIENTE_TEXTO = { 1: 'pruebas', 2: 'produccion' } as const;
export function ambienteTexto(d: number): 'pruebas' | 'produccion' {
  const t = AMBIENTE_TEXTO[d as 1 | 2];
  if (!t) throw new Error(`ambiente_invalido: ${d}`);
  return t;
}

/**
 * `YYYY-MM-DD` → Date en UTC.
 *
 * 🔴 `new Date('2026-09-10')` YA es medianoche UTC, pero `new Date()` en el
 *    emisor NO era eso: era el reloj de la edge. Un documento nacido 21:30 en
 *    Guayaquil (02:30 UTC del día siguiente) tenía `fecha_emision` de un día y
 *    clave de otro — *y nadie lo iba a notar, porque los dos valores son
 *    plausibles por separado.*
 */
export function fechaDeFilaUTC(fecha: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}/.test(fecha)) throw new Error('fecha_emision_invalida');
  return new Date(`${fecha.slice(0, 10)}T00:00:00.000Z`);
}

/** Valida una clave ajena (la de la clínica, en agencia). Local: el SRI es tanda 2. */
export function validarClaveAcceso(clave: string): { ok: boolean; motivo?: string } {
  if (!/^\d{49}$/.test(clave)) return { ok: false, motivo: 'largo_o_formato' };
  const esperado = digitoVerificador(clave.slice(0, 48));
  if (esperado !== Number(clave[48])) return { ok: false, motivo: 'digito_verificador' };
  return { ok: true };
}
