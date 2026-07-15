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
import { Boton, Encabezado, spacing, typography, useTheme } from '@epetplace/ui';

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
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing[6], gap: spacing[5] }}>
        <Text
          style={{
            fontFamily: typography.family.sans.light,
            fontSize: typography.size.xl,
            lineHeight: typography.size.xl * typography.leading.snug,
            color: theme.text.primary,
            textAlign: 'center',
          }}
        >
          {t('bienvenida.solicitarCuerpoTitulo')}
        </Text>
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.base,
            lineHeight: typography.size.base * typography.leading.normal,
            color: theme.text.secondary,
            textAlign: 'center',
          }}
        >
          {t('bienvenida.solicitarCuerpo')}
        </Text>
        <Boton
          variante="primario"
          etiqueta={t('bienvenida.escribenosWhatsApp')}
          bloque
          onPress={() => void abrirWhatsApp()}
        />
        {sinWhatsApp && (
          <Text
            selectable
            style={{
              fontFamily: typography.family.mono.regular,
              fontSize: typography.size.sm,
              letterSpacing: typography.tracking.mono,
              color: theme.text.secondary,
              textAlign: 'center',
            }}
          >
            {t('bienvenida.whatsappFallback', { numero: WHATSAPP_EQUIPO_HUMANO })}
          </Text>
        )}
        <Boton variante="ghost" etiqueta={t('bienvenida.volver')} bloque onPress={() => router.back()} />
      </View>
    </View>
  );
}
