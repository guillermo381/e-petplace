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
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Boton, Isotipo, Texto, palette, radius, spacing, useTheme } from '@epetplace/ui';
import { obtenerMiPerfil, obtenerMiPrestador, registrarPrimerIngreso } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/**
 * S81-C — EL CANTO DE MARCA de la carta (§9.1, con censo FIRMADO: la
 * bienvenida §2.3 es uno de los cinco sitios del canto de marca en el
 * portal). Turquesa→magenta SIEMPRE (§8.4, la dirección fijada), 3px,
 * ADENTRO (§9.2: voz única — acá no distingue hermanos, dice quién
 * habla: e-PetPlace). Es membrete de carta, no adorno: el único color
 * de la pantalla, y es la firma de la casa sobre su propia carta
 * (§8.3: la marca vive en la firma y en los momentos — este ES el
 * momento). Tokens de la rampa (`palette.teal`/`palette.pink`), local
 * a esta pantalla: la promoción a pieza de ui la decide B.
 */
function CantoDeMarca() {
  return (
    <Svg width={3} style={{ alignSelf: 'stretch', borderRadius: radius.full }}>
      <Defs>
        <LinearGradient id="cantoMarca" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.teal} />
          <Stop offset="1" stopColor={palette.pink} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={3} height="100%" fill="url(#cantoMarca)" />
    </Svg>
  );
}

type Carta = {
  nombre: string | null;
  /** S81-C (letra founder): el SEGUNDO nombre de la carta — el negocio
   *  entra en el cuerpo (es su decisión de traer SU casa al ecosistema,
   *  no la de una cuenta). null honesto = la frase se ACORTA (L-139:
   *  jamás un genérico inventado). */
  negocio: string | null;
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
        const [perfil, ingreso, prestador] = await Promise.all([
          obtenerMiPerfil(),
          registrarPrimerIngreso(),
          obtenerMiPrestador(),
        ]);
        if (!vigente) return;
        setCarta({
          nombre: perfil.ok ? perfil.data.nombre : null,
          negocio: prestador.ok ? prestador.data.nombre_comercial : null,
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
      {/* S81-C (lazo regla 80, orden founder): el PAPEL de la carta —
          fondo teal casi imperceptible (papel + tealAlpha16 → #D8F6F2)
          + el isotipo en MARCA DE AGUA (la pieza de ui, no redibujado;
          tinta al 3%, esquina inferior derecha con el centro fuera del
          lienzo — composición A4). Sin caja. CONTRASTE MEDIDO (L-131),
          peor caso texto SOBRE la marca: primary 14.05 · secondary
          4.56 (AA ✓) · marca vs fondo 1.058 (casi imperceptible). El
          5% original FALLÓ secondary (4.39 < 4.5) y se bajó a 3% por
          número, no a ojo. Tono-sobre-tono teal exigiría fill custom
          en Isotipo — pedido a B, no se toca ui. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: palette.tealAlpha16,
        }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', right: -70, bottom: -30, opacity: 0.03 }}
      >
        <Isotipo size={280} variant="tinta" />
      </View>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing[8],
          paddingBottom: insets.bottom + spacing[8],
          paddingHorizontal: spacing[6],
          gap: spacing[6],
        }}
      >
        {/* S81-C (composición de la carta): el canto de marca abraza el
            CUERPO de la carta — saludo, elección, propósito y firma. La
            línea del Día 90 y el CTA quedan FUERA del membrete: son
            información y acción, no la voz de la carta. El propósito
            (las palabras DEL PRESTADOR) gana su aire: sangría propia —
            sus palabras adentro de nuestra carta, distinguibles sin
            comillas de utilería. */}
        {/* S81-C (lazo founder: "la carta ocupa su hoja"): el cuerpo se
            CENTRA en el alto disponible y el aire interno sube a [8] —
            se reparte el aire, no se estiran tipografías. El flex:1 del
            wrapper reemplaza al spacer que empujaba todo arriba y
            dejaba media pantalla vacía abajo. */}
        <View style={{ flex: 1, justifyContent: 'center', flexDirection: 'row', gap: spacing[4] }}>
          <CantoDeMarca />
          <View style={{ flex: 1, justifyContent: 'center', gap: spacing[8] }}>
            <Texto variante="titulo">{saludo}</Texto>

            <Texto variante="cuerpo">{t('dia1.eleccion')}</Texto>

            {/* S81-C (letra founder): EL SEGUNDO NOMBRE — el negocio en
                el cuerpo de la carta. Sin nombre legible, la frase se
                acorta ("tu casa" es la letra del founder, no un genérico
                — L-139); la elección firmada de arriba no se toca. */}
            <Texto variante="cuerpo">
              {carta?.negocio
                ? t('dia1.casaConNegocio', { negocio: carta.negocio })
                : t('dia1.casaSinNegocio')}
            </Texto>

            {carta?.proposito !== null && carta?.proposito !== undefined && (
              <View style={{ gap: spacing[2] }}>
                <Texto variante="cuerpo">{t('dia1.propositoIntro')}</Texto>
                <View style={{ paddingLeft: spacing[4] }}>
                  <Texto variante="titulo">{`"${carta.proposito}"`}</Texto>
                </View>
                <Texto variante="cuerpo">{t('dia1.propositoCierre')}</Texto>
              </View>
            )}

            <View style={{ gap: spacing[1] }}>
              <Texto variante="cuerpo">{t('dia1.firmaNombre')}</Texto>
              <Texto variante="apoyo">{t('dia1.firmaRol')}</Texto>
            </View>
          </View>
        </View>

        <Texto variante="apoyo">{t('dia1.dia90')}</Texto>

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
