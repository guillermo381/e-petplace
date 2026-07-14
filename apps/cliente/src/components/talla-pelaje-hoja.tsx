/**
 * LA PREGUNTA ÚNICA DE TALLA Y PELAJE (S60-A1, MODELO_GROOMING §3) —
 * hermana de PaseoSocialHoja (P19), JAMÁS una parametrización de ella:
 * la social es booleana y su NO frena; acá se declara UNA vez y SIEMPRE
 * se continúa (declarar no tiene rama triste). "Editables siempre": la
 * usan DOS contextos — la reserva de grooming (talla/pelaje NULL) y la
 * edición desde el perfil de la mascota.
 *
 * Materiales por ley: la talla ELIGE entre pares → SelectorOpcion tonal
 * (Ley 22); el pelaje largo es BINARIO → Interruptor (Ley 22 — apagado
 * = normal, jamás error). Persiste vía declararTallaPelaje (RPC molde
 * P19, upsert semántico) y entrega por onDeclarada SOLO tras persistir.
 */

import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Boton,
  Celda,
  Hoja,
  Interruptor,
  SelectorOpcion,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  declararTallaPelaje,
  type PelajeMascota,
  type TallaMascota,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export function TallaPelajeHoja({
  visible,
  mascota,
  onCerrar,
  onDeclarada,
}: {
  visible: boolean;
  mascota: {
    id: string;
    nombre: string;
    talla: TallaMascota | null;
    pelaje: PelajeMascota | null;
  } | null;
  onCerrar: () => void;
  /** Se llama SOLO con la declaración ya persistida por la RPC. */
  onDeclarada: (talla: TallaMascota, pelaje: PelajeMascota) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const [talla, setTalla] = useState<TallaMascota | null>(null);
  const [pelajeLargo, setPelajeLargo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Edición: el perfil ya declarado pre-llena; declaración inicial parte
  // vacía (la talla se ELIGE, jamás se adivina un default).
  useEffect(() => {
    if (!visible || mascota === null) return;
    setTalla(mascota.talla);
    setPelajeLargo(mascota.pelaje === 'largo');
  }, [visible, mascota]);

  async function guardar() {
    if (mascota === null || talla === null || guardando) return;
    setGuardando(true);
    const r = await declararTallaPelaje(mascota.id, talla, pelajeLargo ? 'largo' : 'normal');
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    onDeclarada(r.data.talla, r.data.pelaje);
  }

  return (
    <Hoja visible={visible} titulo={t('grooming.tallaHojaTitulo')} onCerrar={onCerrar} conCerrar>
      {mascota !== null ? (
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          {/* el porqué, sereno: el precio justo sale del perfil (§2/§3) */}
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: Math.round(typography.size.sm * typography.leading.normal),
              color: theme.text.secondary,
            }}
          >
            {t('grooming.tallaHojaVoz', { nombre: mascota.nombre })}
          </Text>
          <SelectorOpcion
            acento="control"
            etiqueta={t('grooming.tallaEtiqueta')}
            opciones={[
              { codigo: 'S', etiqueta: t('grooming.tallaS') },
              { codigo: 'M', etiqueta: t('grooming.tallaM') },
              { codigo: 'L', etiqueta: t('grooming.tallaL') },
            ]}
            seleccionada={talla ?? undefined}
            onSelect={(codigo) => {
              if (codigo === 'S' || codigo === 'M' || codigo === 'L') setTalla(codigo);
            }}
          />
          <Celda
            titulo={t('grooming.pelajeLargo')}
            subtitulo={t('grooming.pelajeLargoDetalle')}
            fin={<Interruptor encendido={pelajeLargo} onCambio={setPelajeLargo} etiqueta={t('grooming.pelajeLargo')} />}
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('grooming.tallaGuardar')}
            cargando={guardando}
            deshabilitado={talla === null}
            onPress={() => void guardar()}
          />
        </View>
      ) : null}
    </Hoja>
  );
}
