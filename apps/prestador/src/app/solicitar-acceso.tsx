/**
 * SOLICITAR ACCESO (S61-B8; contacto S61-B13) — el destino HONESTO del
 * secundario de la bienvenida: el flujo de solicitud NO existe (alta
 * manual/admin, voto S54) y esta pantalla dice la verdad del grupo
 * curado. EL CONTACTO llegó (dato founder, D-399): WhatsApp del equipo
 * con mensaje pre-escrito por locale — la constante vive en UNA sola
 * parte (lib/contacto). Camino triste digno: si WhatsApp no abre, el
 * número se muestra para copiar — jamás botón muerto.
 */

import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, Encabezado, Texto, spacing, typography, useTheme } from '@epetplace/ui';

import { WHATSAPP_EQUIPO_HUMANO, urlWhatsApp } from '@/lib/contacto';
import { useTraduccion } from '@/i18n';

export default function SolicitarAcceso() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [sinWhatsApp, setSinWhatsApp] = useState(false);

  async function abrirWhatsApp() {
    const url = urlWhatsApp(t('bienvenida.whatsappMensaje'));
    try {
      // canOpenURL puede mentir falso-negativo sin queries de intent en
      // Android — se intenta abrir igual y el catch es la verdad.
      await Linking.openURL(url);
    } catch {
      setSinWhatsApp(true);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('bienvenida.solicitarTitulo')}
        atras
        onAtras={() => router.back()}
      />
      {/* S81-C (composición): de bloque centrado-vertical a CARTA
          arriba-izquierda — el mismo marco que sus vecinas del recorrido
          (bienvenida-dia1, sala-espera): la pantalla habla, no flota.
          Título y cuerpo por las piezas del sistema (jerarquía de
          Texto, no receta artesanal). CHANEL: murió el ghost "Volver"
          — el Encabezado ya tiene atrás; dos controles para el mismo
          trabajo era un tablero. */}
      <View style={{ flex: 1, padding: spacing[6], gap: spacing[6] }}>
        <View style={{ gap: spacing[3] }}>
          <Texto variante="titulo">{t('bienvenida.solicitarCuerpoTitulo')}</Texto>
          <Texto variante="cuerpo" color="secondary">
            {t('bienvenida.solicitarCuerpo')}
          </Texto>
        </View>
        <View style={{ gap: spacing[3] }}>
          <Boton
            variante="primario"
            etiqueta={t('bienvenida.escribenosWhatsApp')}
            bloque
            onPress={() => void abrirWhatsApp()}
          />
          {sinWhatsApp && (
            // Text crudo A PROPÓSITO: el número se COPIA (`selectable`)
            // y `Texto` no expone selectable — hueco reportado a B, no
            // se inventa acá (Ley 11).
            <Text
              selectable
              style={{
                fontFamily: typography.family.mono.regular,
                fontSize: typography.size.sm,
                letterSpacing: typography.tracking.mono,
                color: theme.text.secondary,
              }}
            >
              {t('bienvenida.whatsappFallback', { numero: WHATSAPP_EQUIPO_HUMANO })}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
