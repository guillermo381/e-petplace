/**
 * LA HOJA DEL PAQUETE (S57-A2b, D-343 — MODELO_PASEO v1.3 §6bis): nace
 * en el QUIÉN con el paseador ELEGIDO (el paquete es ANCLADO — mismo
 * patrón de elección que el suelto). Presets 5/10/15 EN LETRA.
 *
 * La honestidad vive en la superficie de compra (§6bis.2): la VIGENCIA
 * MENSUAL se declara acá, no en letra chica; si hay salidas sin usar de
 * un paquete anterior, el rollover se declara ANTES de comprar; el pago
 * es simulado y la superficie LO DICE (patrón checkout S54). Comprar NO
 * es reservar — la Hoja lo dice y el éxito lleva al hub.
 *
 * Cero dark patterns (P16e): sin countdowns, sin urgencia.
 *
 * ESCALERA (§4b): no muestra datos del expediente (compra pura) — lo
 * dice explícito.
 */

import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Boton,
  Esqueleto,
  EsqueletoGrupo,
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
  obtenerPrecioPaqueteDeOferta,
  obtenerSaldoPaquete,
  PRESETS_PAQUETE,
  type PaqueteComprado,
  type PaseadorDisponible,
  type PresetPaquete,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';

export function PaqueteHoja({
  paseador,
  mascotaId,
  onComprado,
}: {
  paseador: PaseadorDisponible;
  mascotaId: string;
  onComprado: (paquete: PaqueteComprado) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [precioUnidad, setPrecioUnidad] = useState<number | null | 'cargando'>('cargando');
  const [saldoPrevio, setSaldoPrevio] = useState<number>(0);
  const [preset, setPreset] = useState<PresetPaquete>(5);
  const [comprando, setComprando] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const [precio, saldo] = await Promise.all([
        obtenerPrecioPaqueteDeOferta(paseador.prestador_servicio_id),
        obtenerSaldoPaquete({
          prestador_id: paseador.prestador_id,
          prestador_servicio_id: paseador.prestador_servicio_id,
          mascota_id: mascotaId,
        }),
      ]);
      if (!vigente) return;
      setPrecioUnidad(precio.ok ? precio.data.precio_paquete : null);
      setSaldoPrevio(saldo.ok && saldo.data !== null ? saldo.data.saldo : 0);
    })();
    return () => {
      vigente = false;
    };
  }, [paseador.prestador_servicio_id, paseador.prestador_id, mascotaId]);

  async function comprar() {
    if (comprando) return;
    setComprando(true);
    const r = await comprarPaqueteSalidas({
      prestador_id: paseador.prestador_id,
      prestador_servicio_id: paseador.prestador_servicio_id,
      mascota_id: mascotaId,
      unidades: preset,
    });
    setComprando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    onComprado(r.data);
  }

  if (precioUnidad === 'cargando') {
    return (
      <HojaScroll>
        <EsqueletoGrupo>
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            <Esqueleto forma="bloque" ancho="100%" alto={44} />
            <Esqueleto forma="bloque" ancho="100%" alto={88} />
          </View>
        </EsqueletoGrupo>
      </HojaScroll>
    );
  }

  // null honesto: el prestador no ofrece paquete en este bloque.
  if (precioUnidad === null) {
    return (
      <HojaScroll>
        <View style={{ paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
            {t('paquete.noOfrece', { nombre: paseador.prestador_nombre })}
          </Text>
        </View>
      </HojaScroll>
    );
  }

  const total = precioUnidad * preset;

  return (
    <HojaScroll>
      <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
          {t('paquete.hojaVoz', { nombre: paseador.prestador_nombre, min: paseador.duracion_minutos })}
        </Text>

        <SelectorOpcion
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
              ${precioUnidad.toFixed(2)} · {paseador.duracion_minutos} min
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
