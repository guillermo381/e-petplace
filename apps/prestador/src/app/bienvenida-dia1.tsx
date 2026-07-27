/**
 * S79-B (T2-B2): LA BIENVENIDA DIGITAL DEL DÍA 1 — PORTAL_PRESTADOR §2.3.
 *
 * Pantalla completa, no popup. Carta de 30-45 segundos: saludo por nombre ·
 * el reconocimiento de la elección (uno de los 15) · la devolución del
 * propósito (SOLO si el dato existe — §2.3 la condiciona; el motor es el
 * PEDIDO B→A #2, hoy el bloque está construido y apagado) · la firma del
 * founder · la línea del Día 90 (información transparente, sin énfasis) ·
 * UNA sola acción: "Entrar a mi espacio".
 *
 * Tono: carta, no banner. Cero íconos celebratorios (hasta el isotipo se
 * quitó — Chanel). Tipografía y aire hacen el trabajo.
 *
 * GATE DE PRIMER LOGIN — PUENTE DECLARADO (boceto M1 §2): AsyncStorage
 * `s79.bienvenida.vista:<userId>` hasta que llegue la marca durable del
 * PEDIDO B→A #1. Límites conocidos: reinstalar o cambiar de dispositivo la
 * muestra otra vez (aceptado, es una carta). La marca se escribe al tocar la
 * única acción — la carta se cierra por donde se entra al espacio.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Boton, Texto, spacing, useTheme } from '@epetplace/ui';
import { obtenerMiPerfil, obtenerMiPrestador, obtenerSesion } from '@epetplace/api';

import { marcarBienvenidaVista } from '@/lib/bienvenida';
import { useTraduccion } from '@/i18n';

type Carta = {
  nombre: string | null;
  /** PEDIDO B→A #2: hoy siempre null — el bloque queda construido y apagado. */
  proposito: string | null;
  userId: string | null;
};

export default function BienvenidaDia1() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [carta, setCarta] = useState<Carta | null>(null);
  const [entrando, setEntrando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const [sesion, perfil, prestador] = await Promise.all([
          obtenerSesion(),
          obtenerMiPerfil(),
          obtenerMiPrestador(),
        ]);
        if (!vigente) return;
        // La devolución del propósito lee el dato SI el motor ya lo trae
        // (PEDIDO #2); el acceso es defensivo a propósito — cuando la columna
        // exista y gen:types corra, esto la encuentra sin tocar esta pantalla.
        const prop =
          prestador.ok && 'proposito' in prestador.data
            ? (prestador.data as { proposito?: unknown }).proposito
            : null;
        setCarta({
          nombre: perfil.ok ? perfil.data.nombre : null,
          proposito: typeof prop === 'string' && prop.trim().length > 0 ? prop.trim() : null,
          userId: sesion.ok && sesion.data !== null ? sesion.data.user_id : null,
        });
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  // E5 (mecánica del saludo de la casa): primer nombre; sin nombre, el saludo
  // va solo — jamás inventado.
  const saludo = carta?.nombre
    ? t('dia1.saludoNombre', { nombre: carta.nombre.trim().split(' ')[0] })
    : t('dia1.saludoSinNombre');

  async function entrar() {
    if (entrando) return;
    setEntrando(true);
    if (carta?.userId) await marcarBienvenidaVista(carta.userId);
    router.replace('/(tabs)');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing[10],
          paddingBottom: insets.bottom + spacing[8],
          paddingHorizontal: spacing[6],
          gap: spacing[6],
        }}
      >
        <Texto variante="titulo">{saludo}</Texto>

        <Texto variante="cuerpo">{t('dia1.eleccion')}</Texto>

        {carta?.proposito !== null && carta?.proposito !== undefined && (
          <View style={{ gap: spacing[2] }}>
            <Texto variante="cuerpo">{t('dia1.propositoIntro')}</Texto>
            <Texto variante="cuerpo">{`"${carta.proposito}"`}</Texto>
            <Texto variante="cuerpo">{t('dia1.propositoCierre')}</Texto>
          </View>
        )}

        <View style={{ gap: spacing[1] }}>
          <Texto variante="cuerpo">{t('dia1.firmaNombre')}</Texto>
          <Texto variante="apoyo">{t('dia1.firmaRol')}</Texto>
        </View>

        <Texto variante="apoyo">{t('dia1.dia90')}</Texto>

        <View style={{ flex: 1 }} />

        <Boton
          variante="primario"
          bloque
          etiqueta={t('dia1.entrar')}
          cargando={entrando}
          onPress={() => void entrar()}
        />
      </ScrollView>
    </View>
  );
}
