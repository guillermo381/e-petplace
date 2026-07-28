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
 * GATE DE PRIMER INGRESO — DEL MOTOR (T4-B1; el puente AsyncStorage
 * MURIÓ): el guard raíz llama `registrar_primer_ingreso` (idempotente,
 * estampa SOLO al titular activo — LETRA_PERFIL §4) y redirige acá con
 * esPrimerIngreso=true. Esta pantalla LEE (segunda llamada = lectura) y
 * su única acción solo entra: la marca ya está en la DB, cualquier
 * dispositivo y cualquier gestor ven su carta exactamente una vez.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Boton, Texto, spacing, useTheme } from '@epetplace/ui';
import { obtenerMiPerfil, registrarPrimerIngreso } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Carta = {
  nombre: string | null;
  /** T4-B1: `registrarPrimerIngreso` es el LECTOR CANÓNICO del propósito
   *  (§3bis: no viaja por PostgREST). null honesto = el bloque "Tú nos
   *  dijiste" NO se dibuja (L-139 — hoy solo vet2 lo tiene con texto). */
  proposito: string | null;
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
        // T4-B1: la marca ya la estampó el guard raíz (RPC idempotente);
        // esta segunda llamada es LECTURA — el propósito llega por acá.
        const [perfil, ingreso] = await Promise.all([obtenerMiPerfil(), registrarPrimerIngreso()]);
        if (!vigente) return;
        setCarta({
          nombre: perfil.ok ? perfil.data.nombre : null,
          proposito: ingreso.ok ? ingreso.data.proposito : null,
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

  function entrar() {
    if (entrando) return;
    setEntrando(true);
    // T4-B1: la marca es del MOTOR y ya está estampada (el guard la
    // escribió al decidir mostrar la carta) — el loop del dedo rápido
    // murió de raíz: acá solo se entra.
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
          onPress={entrar}
        />
      </ScrollView>
    </View>
  );
}
