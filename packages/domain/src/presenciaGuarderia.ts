/**
 * CUÁNTOS HAY Y EN QUÉ ESTADO — la cuenta del día de guardería (S112-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **UN TOTAL ES CIERTO Y NO SIRVE.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * «5 animales hoy» no le dice al cuidador **nada de lo que decide qué hace
 * ahora**: cuántos ya llegaron, cuántos faltan buscar, cuántos no se
 * recogieron. *El total esconde exactamente la diferencia que importa* — y el
 * día que el founder encontró pegado decía «5 animales hoy» mientras la
 * pantalla no mostraba a ninguno.
 *
 * ── POR QUÉ VIVE EN `domain` ─────────────────────────────────────────────
 * La cuentan **dos superficies**: el HOY del prestador y el día de guardería.
 * *Dos copias serían dos criterios de qué cuenta como «adentro», y divergen el
 * día que el motor sume un estado.*
 *
 * ── LA REGLA QUE LO HACE ÚTIL ────────────────────────────────────────────
 * **Las partes en cero NO se dicen.** «0 adentro» es una línea que hay que leer
 * para descartar, y tres de ésas convierten una cuenta en un formulario.
 */

export interface PresenciaDelDia {
  reservadas: number;
  aBordo: number;
  adentro: number;
  volviendo: number;
  entregadas: number;
  noRecogidas: number;
  canceladas: number;
  total: number;
}

export function contarPresencia(
  estadias: readonly { estado: string | null }[],
): PresenciaDelDia {
  const n = (e: string) => estadias.filter((x) => x.estado === e).length;
  return {
    reservadas: n('reservada'),
    aBordo: n('recogida_en_curso'),
    adentro: n('en_guarderia'),
    volviendo: n('retorno_en_curso'),
    entregadas: n('entregada'),
    noRecogidas: n('no_recogida'),
    canceladas: n('cancelada'),
    total: estadias.length,
  };
}

/**
 * Arma la línea con **las partes que existen**, en el orden del día: quién
 * falta, quién va en camino, quién está, quién volvió, quién no se recogió.
 *
 * ⚠️ **Si ninguna parte existe, devuelve `null`** y no una cadena vacía: *un
 * `''` se dibuja como un renglón en blanco que nadie sabe leer.* Quien lo
 * recibe decide qué poner — normalmente el total.
 */
export function vozDePresencia(
  p: PresenciaDelDia,
  voces: {
    reservadas: (n: number) => string;
    aBordo: (n: number) => string;
    adentro: (n: number) => string;
    volviendo: (n: number) => string;
    entregadas: (n: number) => string;
    noRecogidas: (n: number) => string;
  },
): string | null {
  const partes = [
    p.reservadas > 0 ? voces.reservadas(p.reservadas) : null,
    p.aBordo > 0 ? voces.aBordo(p.aBordo) : null,
    p.adentro > 0 ? voces.adentro(p.adentro) : null,
    p.volviendo > 0 ? voces.volviendo(p.volviendo) : null,
    p.entregadas > 0 ? voces.entregadas(p.entregadas) : null,
    p.noRecogidas > 0 ? voces.noRecogidas(p.noRecogidas) : null,
  ].filter((x): x is string => x !== null);
  return partes.length > 0 ? partes.join(' · ') : null;
}
