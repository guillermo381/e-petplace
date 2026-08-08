/**
 * S91-D · P2 — LA PUERTA DEL PESO (lámina del perfil, firmada).
 *
 * ── EL PESO SE REGISTRA CON FECHA, JAMÁS SE PISA ────────────────────────────
 * Es la letra de la lámina y no es un detalle de implementación: el histórico
 * es la CURVA que después leen el Coach y el vet. Un campo editable que
 * sobrescribe el número anterior destruye exactamente el dato que da valor —
 * «pesa 12 kg» sirve poco; «pasó de 9 a 12 en cuatro meses» es medicina.
 *
 * Por eso esta Hoja **agrega un punto a la serie** (`registrarPesoMascota` →
 * `evento_peso_medicion`) y nunca actualiza un valor. El motor ya existía
 * completo desde S66/S70 con sus triggers de propagación al snapshot: lo
 * único que faltaba era la puerta. Su ausencia era la razón por la que «Cómo
 * está hoy» mostraba el peso y no dejaba tocarlo.
 *
 * ── EL MÉTODO SE PREGUNTA, y también es honestidad ──────────────────────────
 * `bascula_casa` y `estimacion` no valen lo mismo para quien después lee la
 * curva. El motor ya distingue los tres; acá se ofrecen los DOS del dueño —
 * `bascula_clinica` es del prestador y el dueño no puede declararla por él.
 */

import { useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Campo,
  Hoja,
  SelectorOpcion,
  Texto,
  spacing,
} from '@epetplace/ui';
import { registrarPesoMascota, type MetodoPeso } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export function RegistrarPesoHoja({
  visible,
  nombre,
  mascotaId,
  onCerrar,
  onRegistrado,
}: {
  visible: boolean;
  nombre: string;
  mascotaId: string;
  onCerrar: () => void;
  /** El perfil re-lee su serie: el dato nuevo tiene que verse sin recargar. */
  onRegistrado: () => void;
}) {
  const { t } = useTraduccion();
  const [texto, setTexto] = useState('');
  const [metodo, setMetodo] = useState<MetodoPeso>('bascula_casa');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // La coma decimal es lo que se teclea en es-EC; el motor quiere punto.
  const kg = Number(texto.replace(',', '.'));
  // El rango es el de la puerta del server (0–150). Se espeja acá para que el
  // rebote se lea antes del viaje, NO para reemplazarlo: la DB sigue mandando.
  const valido = Number.isFinite(kg) && kg > 0 && kg <= 150;

  const guardar = async () => {
    if (!valido || guardando) return;
    setGuardando(true);
    setError(undefined);
    const r = await registrarPesoMascota(mascotaId, { peso_kg: kg, metodo });
    setGuardando(false);
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    setTexto('');
    onRegistrado();
    onCerrar();
  };

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={t('perfil.pesoHojaTitulo', { nombre })}>
      <View style={{ gap: spacing[4] }}>
        <Texto variante="apoyo">{t('perfil.pesoHojaPorQue')}</Texto>

        <Campo
          label={t('perfil.pesoHojaLabel')}
          placeholder={t('perfil.pesoHojaPlaceholder')}
          value={texto}
          onChangeText={(v) => {
            setTexto(v);
            setError(undefined);
          }}
          keyboardType="decimal-pad"
          {...(error !== undefined ? { error } : null)}
        />

        <SelectorOpcion
          acento="control"
          etiqueta={t('perfil.pesoHojaMetodo')}
          opciones={[
            { codigo: 'bascula_casa', etiqueta: t('perfil.pesoMetodoBascula') },
            { codigo: 'estimacion', etiqueta: t('perfil.pesoMetodoEstimado') },
          ]}
          seleccionada={metodo}
          onSelect={(c) => setMetodo(c === 'estimacion' ? 'estimacion' : 'bascula_casa')}
        />

        <Boton
          etiqueta={t('perfil.pesoHojaGuardar')}
          bloque
          cargando={guardando}
          deshabilitado={!valido}
          onPress={() => void guardar()}
        />
      </View>
    </Hoja>
  );
}
