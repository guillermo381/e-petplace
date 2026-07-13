/**
 * LA PREGUNTA ÚNICA DE P19 (S59-A4) — "¿{nombre} se lleva bien paseando
 * con otros perros?" con la declaración de la norma arriba ("Los paseos
 * suelen ser con más de un perro a la vez."), en Hoja.
 *
 * La usan DOS contextos: la primera reserva (disponibles — el SÍ sigue
 * al checkout, el NO frena con la voz honesta) y la edición en el
 * perfil de la mascota. El componente responde vía la RPC
 * responder_socializacion_paseo (el NO se registra SIEMPRE, server-side)
 * y entrega el resultado por onRespondida — el contexto decide qué
 * sigue. Ley 22c: las dos respuestas visten de Boton (primario/compacto).
 */

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Boton, Hoja, spacing, typography, useAviso, useTheme } from '@epetplace/ui';
import { responderSocializacionPaseo } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export function PaseoSocialHoja({
  visible,
  mascota,
  onCerrar,
  onRespondida,
}: {
  visible: boolean;
  mascota: { id: string; nombre: string } | null;
  onCerrar: () => void;
  /** Se llama SOLO con la respuesta ya persistida por la RPC. */
  onRespondida: (seLlevabien: boolean) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const [guardando, setGuardando] = useState<boolean | null>(null);

  async function responder(ok: boolean) {
    if (mascota === null || guardando !== null) return;
    setGuardando(ok);
    const r = await responderSocializacionPaseo(mascota.id, ok);
    setGuardando(null);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    onRespondida(ok);
  }

  return (
    <Hoja visible={visible} titulo={t('paseoSocial.celdaTitulo')} onCerrar={onCerrar} conCerrar>
      {mascota !== null ? (
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          {/* la norma, declarada serena (P19) */}
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: Math.round(typography.size.sm * typography.leading.normal),
              color: theme.text.secondary,
            }}
          >
            {t('paseoSocial.declaracion')}
          </Text>
          {/* la pregunta, en voz humana */}
          <Text
            style={{
              fontFamily: typography.family.sans.light,
              fontSize: typography.size.lg,
              lineHeight: Math.round(typography.size.lg * typography.leading.snug),
              color: theme.text.primary,
            }}
          >
            {t('paseoSocial.pregunta', { nombre: mascota.nombre })}
          </Text>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('paseoSocial.si')}
            cargando={guardando === true}
            deshabilitado={guardando === false}
            onPress={() => void responder(true)}
          />
          <Boton
            variante="secundario"
            bloque
            etiqueta={t('paseoSocial.no')}
            cargando={guardando === false}
            deshabilitado={guardando === true}
            onPress={() => void responder(false)}
          />
        </View>
      ) : null}
    </Hoja>
  );
}
