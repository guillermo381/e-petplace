/**
 * Formulario de la dirección del HOGAR (S56-A, D-339) — compartido por
 * la pantalla Cuenta·Tu dirección y la Hoja del checkout (la captura es
 * UNA, jamás dos formularios que diverjan). Presentacional + guardar:
 * el padre decide qué pasa después (volver / cerrar la Hoja).
 * Escalera: no muestra datos del expediente (formulario puro).
 */

import { useState } from 'react';
import { View } from 'react-native';
import { Boton, Campo, spacing, useAviso } from '@epetplace/ui';
import { guardarDireccionHogar, type DireccionHogar } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export function DireccionHogarForm({
  inicial,
  onGuardada,
}: {
  inicial: DireccionHogar | null;
  onGuardada: (direccion: DireccionHogar) => void;
}) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [direccion, setDireccion] = useState(inicial?.direccion ?? '');
  const [ciudad, setCiudad] = useState(inicial?.ciudad ?? 'Quito');
  const [sector, setSector] = useState(inicial?.sector ?? '');
  const [referencias, setReferencias] = useState(inicial?.referencias ?? '');
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    const r = await guardarDireccionHogar({
      direccion,
      ciudad,
      sector: sector.trim() === '' ? null : sector,
      referencias: referencias.trim() === '' ? null : referencias,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('direccion.guardada'), variante: 'exito' });
    onGuardada({
      id: r.data.direccionId,
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      sector: sector.trim() === '' ? null : sector.trim(),
      referencias: referencias.trim() === '' ? null : referencias.trim(),
      telefono: inicial?.telefono ?? null,
    });
  }

  return (
    <View style={{ gap: spacing[2] }}>
      <Campo
        label={t('direccion.direccionLabel')}
        value={direccion}
        onChangeText={setDireccion}
        placeholder={t('direccion.direccionPlaceholder')}
        autoCapitalize="sentences"
      />
      <Campo label={t('direccion.ciudadLabel')} value={ciudad} onChangeText={setCiudad} autoCapitalize="words" />
      <Campo label={t('direccion.sectorLabel')} value={sector} onChangeText={setSector} autoCapitalize="words" />
      <Campo
        label={t('direccion.referenciasLabel')}
        value={referencias}
        onChangeText={setReferencias}
        ayuda={t('direccion.referenciasAyuda')}
        autoCapitalize="sentences"
      />
      <Boton
        etiqueta={t('direccion.guardar')}
        bloque
        cargando={guardando}
        deshabilitado={direccion.trim() === '' || ciudad.trim() === ''}
        onPress={() => void guardar()}
      />
    </View>
  );
}
