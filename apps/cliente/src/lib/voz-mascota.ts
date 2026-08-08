/**
 * S91-D · LA VOZ DE LOS DATOS DE UNA MASCOTA — en UN solo lugar.
 *
 * ── POR QUÉ VIVE ACÁ Y NO EN LA PANTALLA ────────────────────────────────────
 * Letra de mesa (8-ago): **dos pantallas que escriben la misma regla
 * divergen.** La edad honesta la consume el encabezado (P1) y la fila de
 * nacimiento de Identidad (P3); el origen lo consume el encabezado y —el día
 * que se edite— su propia Hoja. Escrita dos veces, la próxima sesión que
 * afine una deja la otra atrás y nadie se entera, porque las dos siguen
 * compilando y las dos siguen diciendo algo verosímil.
 *
 * El precedente es `voz-hecho.ts`, extraída de `hogar/index` cuando el perfil
 * necesitó el mismo diccionario (S82-C, regla 37).
 *
 * **Ley 3: acá viven las CLAVES y la aritmética; el texto vive en el riel.**
 */

import type { useTraduccion } from '@/i18n';

type Traductor = ReturnType<typeof useTraduccion>['t'];

/**
 * LA EDAD HONESTA POR PRECISIÓN (lámina del perfil, firmada).
 *
 * El alta captura CÓMO se supo la fecha, y hasta S91 ese matiz viajaba en el
 * `select` del lector y se perdía en el último metro: una fecha declarada «por
 * etapa de vida» se leía igual que un cumpleaños real. **Mostrar «7 años»
 * sobre un dato estimado es afirmar algo que nadie dijo.**
 *
 *   · `exacta`     → «7 años»      (el dueño supo el día)
 *   · `aproximada` → «~7 años»     (supo el mes y el año)
 *   · `estimada`   → «hacia 2019»  (solo dijo su etapa; el día y el mes los
 *                                   ancló el motor y no significan nada)
 *
 * ⚠️ `precision === null` se trata como EXACTA a propósito: son las filas
 * anteriores a que la columna existiera. Pintarles un «~» sería inventarles
 * una duda que nadie declaró — el mismo error en el sentido contrario.
 */
export function vozEdad(
  meses: number,
  precision: string | null,
  anioNacimiento: number | null,
  t: Traductor,
): string {
  if (precision === 'estimada' && anioNacimiento !== null) {
    return t('perfil.edadHacia', { anio: String(anioNacimiento) });
  }
  const base =
    meses < 12
      ? meses === 1
        ? t('perfil.edadUnMes')
        : t('perfil.edadMeses', { meses })
      : Math.floor(meses / 12) === 1
        ? t('perfil.edadUnAnio')
        : t('perfil.edadAnios', { anios: Math.floor(meses / 12) });
  return precision === 'aproximada' ? t('perfil.edadAprox', { edad: base }) : base;
}

/**
 * LA FECHA DE NACIMIENTO, con la misma honestidad que la edad.
 *
 * Existe porque Identidad muestra la FECHA y no la edad, y una fecha estimada
 * pintada como `01 ene 2019` es la peor versión del problema: el día y el mes
 * los puso el motor para poder ordenar, y ahí se leen como si alguien los
 * hubiera declarado.
 */
export function vozNacimiento(
  fechaIso: string,
  precision: string | null,
  t: Traductor,
  fechaCorta: (iso: string) => string,
): string {
  if (precision === 'estimada') return t('perfil.edadHacia', { anio: fechaIso.slice(0, 4) });
  const corta = fechaCorta(fechaIso);
  return precision === 'aproximada' ? t('perfil.edadAprox', { edad: corta }) : corta;
}

/**
 * EL ORIGEN EN VOZ HUMANA — las nueve claves del CHECK de `mascotas.origen`.
 *
 * `desconocido` NO tiene entrada, y es una decisión: **el silencio no se
 * comenta.** Escribir «origen desconocido» bajo el nombre de una mascota
 * convierte un dato que nadie cargó en una carencia que se le señala al dueño
 * cada vez que abre la ficha.
 */
const CLAVE_ORIGEN = {
  adoptado: 'perfil.origenAdoptado',
  refugio: 'perfil.origenRefugio',
  nacido_en_casa: 'perfil.origenNacidoEnCasa',
  encontrado: 'perfil.origenEncontrado',
  criadero: 'perfil.origenCriadero',
  comprado_particular: 'perfil.origenComprado',
  transferido: 'perfil.origenTransferido',
  alta_asistida: 'perfil.origenAltaAsistida',
} as const;

export function vozOrigen(origen: string | null, t: Traductor): string | null {
  if (origen === null) return null;
  const clave = (CLAVE_ORIGEN as Record<string, (typeof CLAVE_ORIGEN)[keyof typeof CLAVE_ORIGEN] | undefined>)[origen];
  return clave === undefined ? null : t(clave);
}
