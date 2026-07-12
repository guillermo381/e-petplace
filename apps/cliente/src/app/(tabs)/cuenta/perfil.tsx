/**
 * Cuenta · Tu perfil (S55-B3) — editar nombre/teléfono/foto; email
 * read-only con voz honesta. La foto usa la infra S45 (capturaFoto con
 * resize + subirAvatar a la carpeta propia del bucket; path en DB,
 * lectura firmada). Escalera: no muestra datos del expediente.
 */

import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  capturarConCamara,
  capturarDeGaleria,
  radius,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  actualizarMiPerfil,
  obtenerMiPerfil,
  obtenerSesion,
  resolverUrlFoto,
} from '@epetplace/api';

import { subirAvatar } from '@/lib/subir-avatar';
import { useTraduccion } from '@/i18n';

const DIAMETRO = 96;

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
  const [fotoPath, setFotoPath] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  /** uri local pendiente de subir al Guardar; null = quitar; undefined = sin cambio */
  const [fotoNueva, setFotoNueva] = useState<string | null | undefined>(undefined);
  const [hojaFoto, setHojaFoto] = useState(false);
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
      setFotoPath(r.data.foto_url);
      setEstado('listo');
      if (r.data.foto_url) {
        const url = await resolverUrlFoto(r.data.foto_url);
        if (vigente) setFotoUrl(url);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  async function elegirFoto(via: 'camara' | 'galeria') {
    setHojaFoto(false);
    const capturar = via === 'camara' ? capturarConCamara : capturarDeGaleria;
    const r = await capturar({ recorteCuadrado: true, redimensionarA: 800 });
    if (r.tipo === 'foto') {
      setFotoNueva(r.foto.uri);
      setFotoUrl(r.foto.uri);
    }
  }

  async function guardar() {
    if (guardando) return;
    setGuardando(true);

    let fotoParaGuardar: string | null | undefined = undefined;
    if (fotoNueva === null) {
      fotoParaGuardar = null;
    } else if (typeof fotoNueva === 'string') {
      const sesion = await obtenerSesion();
      if (!sesion.ok || sesion.data === null) {
        setGuardando(false);
        mostrar({ texto: t('cuenta.errorCargar'), variante: 'error' });
        return;
      }
      const subida = await subirAvatar({ uri: fotoNueva, userId: sesion.data.user_id });
      if (!subida.ok) {
        setGuardando(false);
        mostrar({ texto: subida.mensaje, variante: 'error' });
        return;
      }
      fotoParaGuardar = subida.path;
    }

    const r = await actualizarMiPerfil({
      nombre,
      telefono,
      ...(fotoParaGuardar !== undefined ? { foto_url: fotoParaGuardar } : null),
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('cuenta.perfilGuardado'), variante: 'exito' });
    router.back();
  }

  const inicial = nombre.trim().charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cuenta.perfil')} atras onAtras={() => router.back()} />

      {estado === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ alignItems: 'center', gap: spacing[4] }}>
              <Esqueleto forma="circulo" alto={DIAMETRO} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
            </View>
          </EsqueletoGrupo>
        </View>
      ) : estado === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.errorCargar')}
            accion={<Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={() => { setEstado('cargando'); setIntento((n) => n + 1); }} />}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[2] }}
          keyboardShouldPersistTaps="handled"
        >
          {/* La foto: círculo con la inicial como estado sin-foto digno */}
          <View style={{ alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
            {fotoUrl !== null && fotoNueva !== null ? (
              <View style={{ width: DIAMETRO, height: DIAMETRO, borderRadius: radius.full, overflow: 'hidden' }}>
                <Image source={{ uri: fotoUrl }} contentFit="cover" transition={0} style={{ width: '100%', height: '100%' }} />
              </View>
            ) : (
              <View
                style={{
                  width: DIAMETRO,
                  height: DIAMETRO,
                  borderRadius: radius.full,
                  backgroundColor: theme.bg.overlay,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: typography.family.sans.light, fontSize: typography.size['2xl'], color: theme.text.secondary }}>
                  {inicial}
                </Text>
              </View>
            )}
            <Boton variante="ghost" tamaño="sm" etiqueta={t('cuenta.fotoCambiar')} onPress={() => setHojaFoto(true)} />
          </View>

          <Campo label={t('cuenta.nombreLabel')} value={nombre} onChangeText={setNombre} autoCapitalize="words" />
          <Campo
            label={t('cuenta.telefonoLabel')}
            value={telefono}
            onChangeText={setTelefono}
            ayuda={t('cuenta.telefonoAyuda')}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <Campo
            label={t('cuenta.emailLabel')}
            value={email ?? ''}
            onChangeText={() => undefined}
            ayuda={t('cuenta.emailAyuda')}
            deshabilitado
          />
          <Boton etiqueta={t('cuenta.guardar')} bloque cargando={guardando} onPress={() => void guardar()} />
        </ScrollView>
      )}

      <Hoja visible={hojaFoto} onCerrar={() => setHojaFoto(false)} titulo={t('cuenta.fotoTitulo')}>
        <Celda interactiva accessibilityRole="button" onPress={() => void elegirFoto('camara')} titulo={t('cuenta.fotoTomar')} />
        <Celda interactiva accessibilityRole="button" onPress={() => void elegirFoto('galeria')} titulo={t('cuenta.fotoGaleria')} />
        {fotoPath !== null || typeof fotoNueva === 'string' ? (
          <Celda
            interactiva
            accessibilityRole="button"
            onPress={() => {
              setHojaFoto(false);
              setFotoNueva(null);
              setFotoUrl(null);
            }}
            titulo={t('cuenta.fotoQuitar')}
          />
        ) : null}
      </Hoja>
    </View>
  );
}
