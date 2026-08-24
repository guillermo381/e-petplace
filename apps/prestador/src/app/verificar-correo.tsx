/**
 * Verificar correo (prestador) — el mismo paso que en el cliente, en la
 * DOSIS del ritual del prestador (§7): senda quieta, sin huella de llegada.
 *
 * Aparece solo cuando el proyecto exige confirmar el correo: `registrarse()`
 * devuelve `sesion_activa=false` y el registro navega acá. Se construye AHORA,
 * detrás del flag del SERVIDOR (S104-C).
 *
 * El consentimiento se muestra en el registro y se persiste al confirmar el
 * código (D-893): con el correo por confirmar, `signUp` no da sesión y el
 * consentimiento no se puede escribir en el alta. La traza legal viaja por
 * parámetro. Documento profesional + privacidad los resuelve el wrapper por
 * el contexto (`registro`).
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  CampoCodigo,
  Encabezado,
  Entrada,
  EvitaTeclado,
  Isotipo,
  MarcaDeAgua,
  PaseoDeHuellas,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  VERSION_LEGAL,
  confirmarAltaConCodigo,
  decidirConsentimiento,
  reenviarCodigoAlta,
} from '@epetplace/api';

import { marcarRegistroReciente } from '@/lib/registro-reciente';
import { urlTycProfesional } from '@/components/aceptacion-terminos';
import { useTraduccion } from '@/i18n';

const LARGO_CODIGO = 8;
const ESPERA_REENVIO = 60;
const ISOTIPO_ESQUINA = 28;

export default function VerificarCorreo() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  // `arbitraje` ('si'|'no') viaja desde el registro: el acto NO se pudo
  // escribir sin sesión (§38.10), y acá SÍ hay sesión tras confirmar.
  const { email = '', arbitraje } = useLocalSearchParams<{ email?: string; arbitraje?: string }>();

  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [reenviando, setReenviando] = useState(false);
  const [esperaReenvio, setEsperaReenvio] = useState(ESPERA_REENVIO);

  useEffect(() => {
    if (!email) router.replace('/registro');
  }, [email, router]);

  useEffect(() => {
    if (esperaReenvio <= 0) return;
    const id = setInterval(() => setEsperaReenvio((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [esperaReenvio]);

  const completo = codigo.length === LARGO_CODIGO;

  async function confirmar() {
    if (!completo || cargando) return;
    setCargando(true);
    setError(undefined);

    // La URL de cada documento la resuelve `URL_LEGAL` en packages/api — la
    // pantalla NO la aporta.
    const r = await confirmarAltaConCodigo({
      /* S104-A · contexto OBLIGATORIO: sin él, el prestador quedaba registrado
         con el T&C del CLIENTE. El valor lo sabe el binario, no se infiere. */
      contexto: 'registro_profesional',
      email,
      codigo,
    });

    if (!r.ok) {
      setCargando(false);
      if (r.codigo === 'codigo_invalido') {
        setError(r.mensaje);
        setCodigo('');
      } else {
        mostrar({ variante: 'error', texto: r.mensaje });
      }
      return;
    }

    // El ARBITRAJE se registra ACÁ, que es donde hay sesión — con su fecha,
    // true o false (el «no» es un valor legítimo, §38.10). Best-effort: la
    // cuenta ya existe; si esta traza fallara, no se le cierra la puerta a
    // quien ya confirmó. La versión y la URL salen de packages/api (L-166).
    await decidirConsentimiento({
      acto: 'arbitraje',
      aceptado: arbitraje === 'si',
      version: VERSION_LEGAL.terminos_professional,
      url: urlTycProfesional(),
      contexto: 'registro_profesional',
    });

    // Dosis prestador: sin celebración. La sesión está viva y la cuenta VACÍA;
    // el guard raíz re-decide y la rama sin_rol habla con la tercera voz.
    marcarRegistroReciente(email);
    router.replace('/');
  }

  async function reenviar() {
    if (esperaReenvio > 0 || reenviando) return;
    setReenviando(true);
    const r = await reenviarCodigoAlta(email);
    setReenviando(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setEsperaReenvio(ESPERA_REENVIO);
    mostrar({ variante: 'neutro', texto: t('verificarCorreo.reenviado') });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* Ritual en dosis prestador (§7): senda + isotipo, sin celebración. */}
      <MarcaDeAgua />
      <PaseoDeHuellas />

      <Encabezado variante="navegacion" titulo={t('verificarCorreo.titulo')} atras onAtras={() => router.back()} />
      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + spacing[2], right: spacing[5] }}>
        <Isotipo size={ISOTIPO_ESQUINA} variant="gradiente" />
      </View>

      <EvitaTeclado>
        <ScrollView
          style={{ backgroundColor: 'transparent' }}
          contentContainerStyle={{
            flexGrow: 1,
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[6],
            gap: spacing[6],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Entrada>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.base,
                lineHeight: Math.round(typography.size.base * typography.leading.relaxed),
                color: theme.text.secondary,
              }}
            >
              {t('verificarCorreo.intro', { email })}
            </Text>

            <View style={{ marginTop: spacing[6] }}>
              <CampoCodigo
                largo={LARGO_CODIGO}
                valor={codigo}
                onCambio={(v) => {
                  setCodigo(v);
                  if (error) setError(undefined);
                }}
                etiqueta={t('verificarCorreo.codigoLabel')}
                ayuda={t('verificarCorreo.codigoAyuda')}
                error={error}
                deshabilitado={cargando}
              />
            </View>
          </Entrada>

          {/* El espaciador ancla las acciones al pie cuando el contenido es
              corto; viven DENTRO del scroll para subir con el teclado numérico
              (un pie fijo afuera de EvitaTeclado quedaría tapado). */}
          <View style={{ flex: 1 }} />

          <View style={{ gap: spacing[3] }}>
            <Boton
              etiqueta={t('verificarCorreo.confirmar')}
              bloque
              onPress={() => void confirmar()}
              cargando={cargando}
              deshabilitado={!completo}
            />
            <Boton
              variante="ghost"
              etiqueta={
                esperaReenvio > 0
                  ? t('verificarCorreo.reenviarEn', { n: esperaReenvio })
                  : t('verificarCorreo.reenviar')
              }
              bloque
              onPress={() => void reenviar()}
              cargando={reenviando}
              deshabilitado={esperaReenvio > 0}
            />
          </View>
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
