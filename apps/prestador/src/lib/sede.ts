/**
 * S79-B (T3-B2): LA SEDE — lectura + escritura sobre el contrato T4.1.
 *
 * HISTORIA CORTA (para el acta): esta pieza nació ANTES de T4.1 con
 * lectura defensiva + tripwire de compilación; el tripwire DISPARÓ en la
 * misma tanda (A aterrizó `6f864e6`: la sede entró a la whitelist y al
 * SELECT de `obtenerMiPrestador`) y murió con su trabajo hecho — hoy
 * esto es un passthrough tipado.
 *
 * Las DOS leyes del contrato (LETRA_PERFIL_S79 §2.2) viven en el
 * WRAPPER (par-o-rebota; dirección sin lat/lon ⇒ coordenadas NULL) y la
 * superficie las respeta y LAS DICE (seccion-sede).
 *
 * RADIO: NULL = "no declaró" (firma founder T3-B1.1 — el DEFAULT murió
 * en el DDL y no resucita en la pantalla; el 15 sugerido vive en el
 * formulario, jamás acá).
 */

import { actualizarPerfilPrestador, type MiPrestador } from '@epetplace/api';

export const SEDE_GUARDABLE = true;

export interface SedeLeida {
  direccion: string | null;
  ciudad: string | null;
  /** T4-B4 (D-559): el barrio/zona — entró a la whitelist en T4.1. */
  sector: string | null;
  lat: number | null;
  lon: number | null;
  /** null = "no declaró". */
  radioKm: number | null;
}

export function leerSede(prestador: MiPrestador): SedeLeida {
  return {
    direccion: prestador.direccion,
    ciudad: prestador.ciudad,
    sector: prestador.sector,
    lat: prestador.lat,
    lon: prestador.lon,
    radioKm: prestador.radio_cobertura_km,
  };
}

/** DOS escrituras distintas a propósito: la dirección viaja como
 *  formulario (Guardar) y el radio SOLO por su toque explícito — una
 *  jamás arrastra a la otra. */
export type InputGuardarSede =
  | {
      tipo: 'direccion';
      direccion: string;
      ciudad: string | null;
      /** null = se borra en DB ('' → NULL honesto del wrapper). */
      sector: string | null;
      /** SOLO de un LugarResuelto vigente — la coordenada muere con el texto. */
      lat: number | null;
      lon: number | null;
    }
  | { tipo: 'radio'; radioKm: number };

export type ResultadoGuardarSede =
  | { ok: true }
  | { ok: false; mensaje: string };

export async function guardarSede(input: InputGuardarSede): Promise<ResultadoGuardarSede> {
  const r = await actualizarPerfilPrestador(
    input.tipo === 'direccion'
      ? {
          direccion: input.direccion,
          ciudad: input.ciudad ?? '',
          sector: input.sector ?? '',
          lat: input.lat,
          lon: input.lon,
        }
      : { radio_cobertura_km: input.radioKm },
  );
  if (!r.ok) return { ok: false, mensaje: r.mensaje };
  return { ok: true };
}
