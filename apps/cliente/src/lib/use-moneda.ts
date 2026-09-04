/**
 * useMoneda — el puente entre el riel de moneda (`packages/i18n`) y la
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
 *
 * ── ⏪ SE LLAMABA `usarMoneda`, EN `usar-moneda.ts` (S113-C · D-1017) ────────
 * 🔴 **El nombre en español lo volvía invisible para la regla de hooks, que
 * reconoce POR PREFIJO** (`use…` o mayúscula inicial). Medido con
 * `verify:hooks` de E: tres violaciones, las tres acá, y todas del mismo
 * tenor — *«React Hook "useState" is called in function "usarMoneda" that is
 * neither a React function component nor a custom React Hook function»*.
 *
 * ⚠️ **Y lo que se pierde no es un aviso cosmético: es la regla entera.** Sin
 * el prefijo, el día que alguien llame a este hook **después de un return** —
 * exactamente el defecto que acaba de dejar al prestador sin abrir— **el gate
 * no lo ve**, porque no sabe que la función de la que cuelga obedece las
 * reglas de hooks. *Un nombre que apaga un guard cuesta más que la
 * consistencia de idioma que compra.*
 *
 * ⚠️ **Medido al renombrar: CERO llamadores.** Dos ocurrencias en todo el
 * monorepo y las dos son de este archivo (su encabezado y su declaración);
 * nadie importa `usar-moneda`. **Se renombra igual** —el nombre estaba
 * apagando un gate ya— *pero queda dicho: este hook está escrito, documentado
 * y no lo usa nadie.* Su primer consumidor va a ser la primera pantalla que
 * tenga que mostrar plata de un país que no sea Ecuador.
 */

import { useEffect, useState } from 'react';
import { monto as montoDelRiel, montoConCodigo as montoConCodigoDelRiel, type ConfigMoneda } from '@epetplace/i18n';
import { obtenerConfigMoneda } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** Cache de proceso: la config ya viene cacheada del wrapper, esto evita
 *  además el re-render por cada pantalla que pide el mismo país. */
const _porPais = new Map<string, ConfigMoneda>();

export function useMoneda(countryCode: string | null | undefined) {
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
