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

/** Valida una clave ajena (la de la clínica, en agencia). Local: el SRI es tanda 2. */
export function validarClaveAcceso(clave: string): { ok: boolean; motivo?: string } {
  if (!/^\d{49}$/.test(clave)) return { ok: false, motivo: 'largo_o_formato' };
  const esperado = digitoVerificador(clave.slice(0, 48));
  if (esperado !== Number(clave[48])) return { ok: false, motivo: 'digito_verificador' };
  return { ok: true };
}
