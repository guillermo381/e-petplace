/**
 * Cuenta · Tu perfil (S57-B, P17) — nombre y teléfono editables; email
 * read-only con voz honesta. Calcado del cliente (S55-B3) en dosis
 * sobria. SIN foto en esta mudanza estructural: la infra subirAvatar es
 * del cliente y portarla es pulido — queda DECLARADO para la pasada de
 * acabados, no un hueco mudo.
 */

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { actualizarMiPerfil, obtenerMiPerfil } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function PerfilCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerMiPerfil();
      if (!vigente) return;
      if (!r.ok) {
        setEstado('error');
        return;
      }
      setNombre(r.data.nombre ?? '');
      setTelefono(r.data.telefono ?? '');
      setEmail(r.data.email);
      setEstado('listo');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    const r = await actualizarMiPerfil({ nombre, telefono });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('miCuenta.perfilGuardado'), variante: 'exito' });
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('miCuenta.perfil')} atras onAtras={() => router.back()} />

      {estado === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
            </View>
          </EsqueletoGrupo>
        </View>
      ) : estado === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('miCuenta.errorCargar')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('agenda.reintentar')}
                onPress={() => {
                  setEstado('cargando');
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}
          keyboardShouldPersistTaps="handled"
        >
          <Campo label={t('miCuenta.nombreLabel')} value={nombre} onChangeText={setNombre} autoCapitalize="words" />
          <Campo
            label={t('miCuenta.telefonoLabel')}
            value={telefono}
            onChangeText={setTelefono}
            ayuda={t('miCuenta.telefonoAyuda')}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <Campo
            label={t('miCuenta.emailLabel')}
            value={email ?? ''}
            onChangeText={() => undefined}
            ayuda={t('miCuenta.emailAyuda')}
            deshabilitado
          />
          <Boton etiqueta={t('miCuenta.guardar')} bloque cargando={guardando} onPress={() => void guardar()} />
        </ScrollView>
      )}
    </View>
  );
}
