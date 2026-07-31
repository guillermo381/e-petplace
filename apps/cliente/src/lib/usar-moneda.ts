/**
 * usarMoneda — el puente entre el riel de moneda (`packages/i18n`) y la
 * config del país (`packages/api`), para que ninguna pantalla tenga que
 * cablear las dos piezas a mano (S82-A r16).
 *
 * LA REGLA QUE HACE HONESTO ESTE HOOK: **formatea con el país que el
 * LECTOR trae, y si el lector no trae ninguno, NO INVENTA — devuelve
 * `null` y la pantalla decide.** Un monto con la moneda equivocada es
 * peor que uno formateado a mano (orden del founder, S82 r16).
 *
 * Por qué no cae a un default silencioso: hoy el producto asume Ecuador
 * en todos lados —hay hasta un `const PAIS_SOFT_LAUNCH = 'EC'`
 * hardcodeado en Explorar— y ese supuesto es invisible. Meterlo acá como
 * fallback lo volvería *más* invisible todavía: el día que Colombia se
 * active, 42 pantallas dirían USD sobre precios COP sin que nada avise.
 * **El fallback existe en el riel (`MONEDA_FALLBACK`) y se usa a la
 * vista, nunca por omisión.**
 */

import { useEffect, useState } from 'react';
import { monto as montoDelRiel, montoConCodigo as montoConCodigoDelRiel, type ConfigMoneda } from '@epetplace/i18n';
import { obtenerConfigMoneda } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** Cache de proceso: la config ya viene cacheada del wrapper, esto evita
 *  además el re-render por cada pantalla que pide el mismo país. */
const _porPais = new Map<string, ConfigMoneda>();

export function usarMoneda(countryCode: string | null | undefined) {
  const { idioma } = useTraduccion();
  const [config, setConfig] = useState<ConfigMoneda | null>(
    countryCode != null ? (_porPais.get(countryCode) ?? null) : null,
  );

  useEffect(() => {
    if (countryCode == null) {
      setConfig(null);
      return;
    }
    const cacheada = _porPais.get(countryCode);
    if (cacheada !== undefined) {
      setConfig(cacheada);
      return;
    }
    let vive = true;
    void obtenerConfigMoneda(countryCode).then((r) => {
      if (!vive || !r.ok) return;
      _porPais.set(countryCode, r.data);
      setConfig(r.data);
    });
    return () => {
      vive = false;
    };
  }, [countryCode]);

  return {
    /** El monto formateado, o `null` si todavía no se sabe la moneda —
     *  la pantalla decide qué hacer con el null (esperar, omitir la
     *  fila, decirlo). JAMÁS un número con la moneda de otro país. */
    monto: (valor: number): string | null => (config === null ? null : montoDelRiel(valor, config, idioma)),
    /** Con el código ISO, para superficies donde convivan países (EC y
     *  CO comparten el símbolo `$`, así que ahí el símbolo solo miente). */
    montoConCodigo: (valor: number): string | null =>
      config === null ? null : montoConCodigoDelRiel(valor, config, idioma),
    /** `true` cuando la moneda está resuelta y se puede pintar. */
    listo: config !== null,
  };
}
