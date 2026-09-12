/**
 * S115-C · LOS TRES NÚMEROS DEL PRECIO — «tu precio · lo que ve la familia ·
 * lo que recibes» (`MODELO_ECONOMICO` v1.1 **D-C**, literal).
 *
 * ☠️ **Reemplaza a `VozComision`**, que decía DOS números y uno de ellos con el
 * modelo viejo. Las tres diferencias, y ninguna es cosmética:
 *
 * ① **El mínimo.** `VozComision` mostraba «recibís el 82 %» sobre un paseo de
 *    $6 que en realidad paga el piso de $1,50 — o sea $4,50, no $4,92. *Un
 *    porcentaje sobre un ticket chico es una mentira con forma de dato.*
 * ② **El riel NO se descuenta** (D-C): el prestador recibe su precio menos la
 *    comisión, punto. `VozComision` venía del modelo donde la pasarela se le
 *    descontaba a él.
 * ③ **La comisión es la de la fecha en que el precio VA A REGIR**, no la de
 *    hoy. Medido: hoy resuelve 10 % y desde la apertura 18 %. Un prestador que
 *    configura hoy para operar en octubre vería «recibís el 90 %» y cobraría el
 *    82 %.
 *
 * ───────────────────────────────────────────────────────────────────────
 * 🔴 **NINGÚN NÚMERO SE CALCULA ACÁ.** `netoDelPrestador` es **la misma función
 * que usa el motor** (exportada por `@epetplace/api`), no una copia — que es
 * justamente lo que impide que la pantalla y la liquidación se separen un día.
 *
 * 🔴 **Y LA FECHA TAMPOCO SE ESCRIBE.** Sale de `fechaDeVigenciaPorDefecto()`
 * (`app_config.fecha_apertura_comercial`, regla `max(hoy, apertura)`).
 * *`'2026-10-01'` tecleado acá sería una fecha de plata adentro de un bundle, y
 * un bundle no se corrige el día que la apertura se mueve.*
 *
 * ⚠️ **Por qué UNA lectura y no una por precio:** el taller tiene varios campos
 * de plata (precio, plan, paquete) y el prestador los tipea. `comisionAplicable`
 * se pide **una vez al montar**; `netoDelPrestador` es **síncrona**, así que los
 * tres números se recalculan en vivo sin un viaje por tecla.
 *
 * 🔴 **FAIL-CLOSED, heredado de la puerta.** Si el motor no sabe la comisión, la
 * pantalla **lo dice** y no muestra los tres números. *Decirle a un prestador
 * «te queda el 100 %» es la mentira más cara que esta pantalla puede decir* — y
 * un 0 % por defecto se ve exactamente igual que un dato bueno.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { FilaDato, Texto, spacing } from '@epetplace/ui';
import {
  comisionAplicable,
  netoDelPrestador,
  fechaDeVigenciaPorDefecto,
  type ComisionAplicable,
} from '@epetplace/api';
import { formatearPrecio } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

/** La comisión, pedida UNA vez por taller. `null` mientras carga; `'noSePudo'`
 *  cuando el motor no sabe — y entonces no se muestra ningún número. */
export function useComisionDelTaller(prestadorId: string | null, tipoServicio: string) {
  const [c, setC] = useState<ComisionAplicable | null | 'noSePudo'>(null);

  useEffect(() => {
    if (prestadorId === null) return;
    let vigente = true;
    void (async () => {
      /* La fecha sale del servidor y se REENVÍA; la pantalla no la elige.
         (A pidió no pasarle fecha a `tresNumerosDelPrestador` — acá es
         `comisionAplicable`, que la exige por firma, y el valor es el suyo.) */
      const f = await fechaDeVigenciaPorDefecto();
      if (!vigente) return;
      if (!f.ok) { setC('noSePudo'); return; }
      const r = await comisionAplicable({ prestadorId, tipoServicio, fechaVigencia: f.data });
      if (!vigente) return;
      setC(r.ok ? r.data : 'noSePudo');
    })();
    return () => { vigente = false; };
  }, [prestadorId, tipoServicio]);

  return c;
}

export interface TresNumerosDelPrecioProps {
  /** Lo que el prestador tipeó, ya parseado. `null` = todavía no hay precio. */
  precioNeto: number | null;
  comision: ComisionAplicable | null | 'noSePudo';
}

export function TresNumerosDelPrecio({ precioNeto, comision }: TresNumerosDelPrecioProps) {
  const { t } = useTraduccion();

  /* Sin precio no hay nada que decir todavía: las tres filas aparecen cuando
     hay un número que descomponer (Ley 13 — no se dibuja un $0,00 de relleno). */
  if (precioNeto === null || comision === null) return null;
  if (comision === 'noSePudo') return <Texto variante="apoyo">{t('tresNumeros.noSePudo')}</Texto>;

  const { comision: cuanto, aplico, neto } = netoDelPrestador(precioNeto, comision);
  const iva = comision.tarifaIvaPct ?? 0;
  const loQueVeLaFamilia = Math.round(precioNeto * (100 + iva)) / 100;

  return (
    <View style={{ gap: spacing[2] }}>
      <FilaDato etiqueta={t('tresNumeros.tuPrecio')} valor={formatearPrecio(precioNeto)} mono />
      <FilaDato etiqueta={t('tresNumeros.loQueVeLaFamilia')} valor={formatearPrecio(loQueVeLaFamilia)} mono />
      <FilaDato etiqueta={t('tresNumeros.loQueRecibes')} valor={formatearPrecio(neto)} mono />
      {/* 🔴 La línea del mínimo sale del veredicto del MOTOR (`aplico`), jamás
          de comparar `cuanto` contra `comision.minimo` acá: eso sería una
          segunda cuenta que puede discrepar de la que se va a cobrar. */}
      {aplico === 'minimo' ? (
        <Texto variante="apoyo">
          {t('tresNumeros.minimoAplica', { monto: formatearPrecio(comision.minimo) })}
        </Texto>
      ) : null}
    </View>
  );
}

/**
 * La variante que lee SU PROPIA comisión — para talleres donde cada fila es un
 * tipo de servicio DISTINTO.
 *
 * 🔴 **Existe por una diferencia real, no por simetría:** en veterinaria el
 * menú mezcla `veterinario` (mínimo **$3,00**) con `telemedicina` (mínimo
 * **$2,00**). *Una sola lectura para todas las filas mostraría el mínimo de la
 * primera sobre un servicio que paga otro* — y el prestador no tendría cómo
 * saberlo. Los demás talleres tienen un solo tipo y usan el hook UNA vez.
 *
 * ⚠️ Cuesta una lectura por fila (seis en veterinaria). *Se paga a propósito:
 * la alternativa era un número plausible y equivocado.*
 */
export function TresNumerosPorTipo({
  prestadorId,
  tipoServicio,
  precioNeto,
}: {
  prestadorId: string | null;
  tipoServicio: string;
  precioNeto: number | null;
}) {
  const comision = useComisionDelTaller(prestadorId, tipoServicio);
  return <TresNumerosDelPrecio precioNeto={precioNeto} comision={comision} />;
}
