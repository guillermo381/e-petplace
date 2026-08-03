/** Stub de `@epetplace/api`: solo `registrarTrackPaseo`. Acumula por
 *  atención (que es lo que hace la RPC real) y permite forzar el rebote
 *  `atencion_no_en_curso` de UNA atención — el caso del hard-stop. */

export interface PuntoGpsPaseo {
  lat: number;
  lng: number;
  t: string;
}

export const espiaApi = {
  /** puntos acumulados por atención, tal como los contaría el server */
  totales: new Map<string, number>(),
  /** atenciones que el server va a rebotar como fuera de curso */
  rebotan: new Set<string>(),
  reset(): void {
    this.totales.clear();
    this.rebotan.clear();
  },
};

export async function registrarTrackPaseo(input: {
  evento_atencion_id: string;
  puntos: PuntoGpsPaseo[];
  append: boolean;
}): Promise<
  { ok: true; data: { puntos_total: number } } | { ok: false; codigo: string; mensaje: string }
> {
  if (espiaApi.rebotan.has(input.evento_atencion_id)) {
    return { ok: false, codigo: 'atencion_no_en_curso', mensaje: 'fuera de curso' };
  }
  const previo = espiaApi.totales.get(input.evento_atencion_id) ?? 0;
  const total = previo + input.puntos.length;
  espiaApi.totales.set(input.evento_atencion_id, total);
  return { ok: true, data: { puntos_total: total } };
}
