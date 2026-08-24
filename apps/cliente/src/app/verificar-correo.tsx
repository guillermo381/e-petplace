/**
 * Verificar correo — EL PASO QUE APARECE SOLO SI EL PROYECTO EXIGE CONFIRMAR
 * EL CORREO (S104-C, tanda 2).
 *
 * ── DETRÁS DEL FLAG, SIN UN FLAG PROPIO ──────────────────────────────────
 * No hay constante que encienda esta pantalla: la enciende el SERVIDOR.
 * Cuando «Confirm signup» está apagado (hoy), `registrarse()` devuelve
 * `sesion_activa=true` y el registro va derecho al onboarding — esta pantalla
 * nunca se monta. Cuando D lo prenda, `registrarse` devuelve `sesion_activa
 * =false` y el registro navega acá. Se construye AHORA para que el día del
 * flip no falte la mitad de la puerta.
 *
 * ── EL CONSENTIMIENTO SE MUESTRA EN EL FORMULARIO Y SE PERSISTE ACÁ ───────
 * (D-893). Con el correo por confirmar, `signUp` no devuelve sesión ⇒ el
 * consentimiento no se puede escribir en el alta (la policy es `auth.uid()
 * = user_id`). `confirmarAltaConCodigo` lo registra en el MISMO acto que canjea
 * el código, cuando la sesión por fin existe. La URL de cada documento la
 * resuelve `URL_LEGAL` en packages/api (S104-A); la pantalla NO la aporta.
 *
 * ── LA DOSIS DEL RITUAL (cliente) ──
 * Ceremonia entera, igual que el registro: tapiz + senda + isotipo recogido +
 * la huella de llegada al confirmar. La confirmación del correo ES entrar.
 */

import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  CampoCodigo,
  Encabezado,
  Entrada,
  EvitaTeclado,
  HuellaDeLlegada,
  Isotipo,
  MarcaDeAgua,
  PaseoDeHuellas,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { confirmarAltaConCodigo, reenviarCodigoAlta } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

const LARGO_CODIGO = 8;
const ESPERA_REENVIO = 60; // s — el correo recién salió del alta
const ISOTIPO_ESQUINA = 28;

export default function VerificarCorreo() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const aviso = useAviso();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();

  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [reenviando, setReenviando] = useState(false);
  const [esperaReenvio, setEsperaReenvio] = useState(ESPERA_REENVIO);
  const [llegando, setLlegando] = useState(false);

  // Sin email no hay nada que verificar: se vuelve al registro sin adivinar.
  useEffect(() => {
    if (!email) router.replace('/registro');
  }, [email, router]);

  // La cuenta regresiva del reenvío. Vive en la pantalla; el wrapper solo
  // dispara. Se limpia al desmontar para no dejar un intervalo colgado.
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

    // `confirmarAltaConCodigo` registra terminos + privacidad; la URL de cada
    // uno la resuelve `URL_LEGAL` en packages/api — la pantalla NO la aporta.
    const r = await confirmarAltaConCodigo({
      /* S104-A · contexto OBLIGATORIO: sin él, el prestador quedaba registrado
         con el T&C del CLIENTE. El valor lo sabe el binario, no se infiere. */
      contexto: 'registro',
      email,
      codigo,
    });

    if (!r.ok) {
      setCargando(false);
      if (r.codigo === 'codigo_invalido') {
        setError(r.mensaje);
        setCodigo('');
      } else {
        aviso.mostrar({ variante: 'error', texto: r.mensaje });
      }
      return;
    }

    // Igual que el registro con sesión viva: la huella de llegada y recién ahí
    // el onboarding. Confirmar el correo ES entrar.
    setLlegando(true);
    setTimeout(() => router.replace('/onboarding'), 460);
  }

  async function reenviar() {
    if (esperaReenvio > 0 || reenviando) return;
    setReenviando(true);
    const r = await reenviarCodigoAlta(email);
    setReenviando(false);
    if (!r.ok) {
      aviso.mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setEsperaReenvio(ESPERA_REENVIO);
    aviso.mostrar({ variante: 'neutro', texto: t('verificarCorreo.reenviado') });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
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

          {/* El espaciador empuja las acciones al pie cuando el contenido es
              corto; con el teclado numérico arriba, las acciones viven DENTRO
              del scroll y suben con él (keyboardShouldPersistTaps) — un pie
              fijo afuera de EvitaTeclado quedaría tapado por el teclado. */}
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

      {/* R53-DECLARADO: NO es un pie fijo — es el overlay de LLEGADA a pantalla
          completa (top:0 Y bottom:0); cubre todo durante la celebración y la
          pantalla se desmonta al navegar. Nada debajo que reservar. */}
      {llegando && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.bg.base,
          }}
        >
          <HuellaDeLlegada tamano={64} />
        </View>
      )}
    </View>
  );
}
