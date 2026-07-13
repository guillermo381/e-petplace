/**
 * LA HOJA DEL PAQUETE (S57, enmienda v1.4): la compra, anclada al
 * paseador ELEGIDO — SIN mascota (el paquete es DEL HOGAR §6bis.1: la
 * mascota se elige en cada reserva) y SIN fecha/hora (comprar no es
 * reservar §6bis.2bis — esta Hoja jamás crea citas).
 *
 * La honestidad vive en la superficie (§6bis.2): vigencia MENSUAL
 * declarada; rollover declarado ANTES de comprar; pago simulado dicho.
 * Cero dark patterns (P16e): sin countdowns, sin urgencia.
 *
 * CRAFT: el precio llega CON el paseador elegido (PaseadorConPaquete) —
 * la Hoja no re-consulta nada más que el saldo previo (regla Chanel:
 * murió el fetch de precio que duplicaba un dato ya presente).
 *
 * ESCALERA (§4b): no muestra datos del expediente (compra pura) — lo
 * dice explícito.
 */

import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Boton,
  HojaScroll,
  SelectorOpcion,
  Separador,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  comprarPaqueteSalidas,
  obtenerSaldoPaquete,
  PRESETS_PAQUETE,
  type PaqueteComprado,
  type PaseadorConPaquete,
  type PresetPaquete,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';

export function PaqueteHoja({
  paseador,
  onComprado,
}: {
  paseador: PaseadorConPaquete;
  onComprado: (paquete: PaqueteComprado) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [saldoPrevio, setSaldoPrevio] = useState<number>(0);
  const [preset, setPreset] = useState<PresetPaquete>(5);
  const [comprando, setComprando] = useState(false);

  useEffect(() => {
    let vigente = true;
    void obtenerSaldoPaquete({
      prestador_id: paseador.prestador_id,
      prestador_servicio_id: paseador.prestador_servicio_id,
    }).then((r) => {
      if (vigente) setSaldoPrevio(r.ok && r.data !== null ? r.data.saldo : 0);
    });
    return () => {
      vigente = false;
    };
  }, [paseador.prestador_id, paseador.prestador_servicio_id]);

  async function comprar() {
    if (comprando) return;
    setComprando(true);
    const r = await comprarPaqueteSalidas({
      prestador_id: paseador.prestador_id,
      prestador_servicio_id: paseador.prestador_servicio_id,
      unidades: preset,
    });
    setComprando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    onComprado(r.data);
  }

  const total = paseador.precio_paquete * preset;

  return (
    <HojaScroll>
      <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
          {t('paquete.hojaVoz', { nombre: paseador.prestador_nombre, min: paseador.duracion_minutos })}
        </Text>

        <SelectorOpcion
          acento="control"
          disposicion="tira"
          etiqueta={t('paquete.presetsEtiqueta')}
          opciones={PRESETS_PAQUETE.map((n) => ({ codigo: String(n), etiqueta: t('paquete.presetSalidas', { n }) }))}
          seleccionada={String(preset)}
          onSelect={(codigo) => setPreset(Number(codigo) as PresetPaquete)}
        />

        {/* La VIGENCIA MENSUAL declarada en la superficie (§6bis.2) */}
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
          {t('paquete.vigenciaVoz')}
        </Text>

        {/* El rollover DECLARADO antes de comprar (P16e) */}
        {saldoPrevio > 0 ? (
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
            {t('paquete.rolloverVoz', { n: saldoPrevio })}
          </Text>
        ) : null}

        <Separador />

        {/* La plata, honesta */}
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {t('paquete.precioPorSalida')}
            </Text>
            <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: theme.text.primary, fontVariant: ['tabular-nums'] }}>
              ${paseador.precio_paquete.toFixed(2)} · {paseador.duracion_minutos} min
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.primary }}>
              {t('paquete.total')}
            </Text>
            <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: theme.text.primary, fontVariant: ['tabular-nums'] }}>
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* la superficie DICE que el pago es simulado (patrón checkout) */}
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.tertiary }}>
          {t('checkout.simuladoAviso')}
        </Text>

        <Boton
          etiqueta={t('paquete.comprar')}
          bloque
          cargando={comprando}
          onPress={() => void comprar()}
        />
      </View>
    </HojaScroll>
  );
}
