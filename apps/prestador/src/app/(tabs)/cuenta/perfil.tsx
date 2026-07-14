/**
 * Cuenta · Tu perfil (S57-B, P17; S60-B2 la sección de la ENTIDAD con
 * visto del arquitecto). Dosis §15b.
 *
 * TESIS: tu perfil dice quién eres — para la app y para las familias —
 * y qué de eso está en tus manos.
 * FIRMA: el solo-lectura DIGNO que dice su porqué en voz humana (el
 * nombre público espera su perfil público; la sede se cambia con el
 * equipo) — honestidad como comportamiento, no lápices muertos.
 * CHANEL: sin foto (identidad pública — la sesión del perfil público,
 * D-370, junto con el nombre), sin métricas, sin campos admin, sin
 * fiscal (regla 25), UN solo Guardar.
 *
 * Editable de la entidad: SOLO descripcion + contacto (whitelist del
 * wrapper actualizarPerfilPrestador — la RLS de prestadores es por
 * fila y no acota columnas; esta es la capa de producto). El estado
 * habla con la voz 7.13 de las portadas (misma key, mismo cómputo:
 * cuenta activa + ≥1 oferta activa + horarios).
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  actualizarMiPerfil,
  actualizarPerfilPrestador,
  obtenerFranjasHorario,
  obtenerMiCuentaComercial,
  obtenerMiPerfil,
  obtenerMiPrestador,
  obtenerOfertasGroomingPropias,
  obtenerOfertasPaseoPropias,
  type MiPrestador,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

// E.164 sin '+' (regla 28): validación SUAVE — se limpian espacios,
// guiones y el '+' inicial; los dígitos son los que viajan.
function normalizarTelefono(v: string): string {
  return v.trim().replace(/^\+/, '').replace(/[\s-]/g, '');
}

export default function PerfilCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  // — el user —
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  // — la entidad —
  const [prestador, setPrestador] = useState<MiPrestador | null>(null);
  const [visible, setVisible] = useState<boolean | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [telNegocio, setTelNegocio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const [rPerfil, rPrestador] = await Promise.all([obtenerMiPerfil(), obtenerMiPrestador()]);
      if (!vigente) return;
      if (!rPerfil.ok || !rPrestador.ok) {
        setEstado('error');
        return;
      }
      setNombre(rPerfil.data.nombre ?? '');
      setTelefono(rPerfil.data.telefono ?? '');
      setEmail(rPerfil.data.email);
      const p = rPrestador.data;
      setPrestador(p);
      setDescripcion(p.descripcion ?? '');
      setTelNegocio(p.telefono ?? '');
      setWhatsapp(p.whatsapp ?? '');
      setEmailContacto(p.email_contacto ?? '');
      setSitioWeb(p.sitio_web ?? '');
      // El estado 7.13 — mismo cómputo que las portadas de mundo:
      // cuenta activa + ≥1 oferta activa (de cualquier oficio) +
      // horarios. Si alguna pata no carga, null honesto (sin fila).
      const [rCuenta, rPaseo, rGrooming, rFranjas] = await Promise.all([
        obtenerMiCuentaComercial(),
        obtenerOfertasPaseoPropias(p.id),
        obtenerOfertasGroomingPropias(p.id),
        obtenerFranjasHorario(p.id),
      ]);
      if (!vigente) return;
      if (rCuenta.ok && rPaseo.ok && rGrooming.ok && rFranjas.ok) {
        const hayOferta =
          rPaseo.data.some((o) => o.activo) || rGrooming.data.some((o) => o.activo);
        const hayFranja = rFranjas.data.some((f) => f.activo);
        setVisible(rCuenta.data?.estado === 'activa' && hayOferta && hayFranja);
      } else {
        setVisible(null);
      }
      setEstado('listo');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    const rUser = await actualizarMiPerfil({ nombre, telefono: normalizarTelefono(telefono) });
    if (!rUser.ok) {
      setGuardando(false);
      mostrar({ texto: rUser.mensaje, variante: 'error' });
      return;
    }
    const rNegocio = await actualizarPerfilPrestador({
      descripcion,
      telefono: normalizarTelefono(telNegocio),
      whatsapp: normalizarTelefono(whatsapp),
      email_contacto: emailContacto,
      sitio_web: sitioWeb,
    });
    setGuardando(false);
    if (!rNegocio.ok) {
      mostrar({ texto: rNegocio.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('miCuenta.perfilGuardado'), variante: 'exito' });
    router.back();
  }

  // La voz del oficio (Ley 3: el slug del motor jamás se pinta; un
  // tipo aún sin voz cae al slug — se declara al agregar el 3er tipo).
  const vozTipo = (tipo: string): string => {
    if (tipo === 'paseador') return t('miCuenta.tipoPaseador');
    if (tipo === 'clinica_veterinaria') return t('miCuenta.tipoClinica');
    if (tipo === 'grooming') return t('miCuenta.tipoGrooming');
    return tipo;
  };

  const sede =
    prestador === null
      ? ''
      : [prestador.direccion, prestador.ciudad].filter((x): x is string => x !== null && x.length > 0).join(' · ');

  function TituloBloque({ texto }: { texto: string }) {
    return (
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.md,
          color: theme.text.primary,
          marginTop: spacing[4],
        }}
      >
        {texto}
      </Text>
    );
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
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
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

          {prestador !== null && (
            <>
              <TituloBloque texto={t('miCuenta.negocioTitulo')} />

              {/* El estado — la voz 7.13 de las portadas (misma key).
                  null honesto: si una pata no cargó, la fila no miente. */}
              {visible !== null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: visible ? theme.status.success : theme.status.warning,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {visible ? t('ofertaPaseo.visibleTitulo') : t('ofertaPaseo.noVisibleTitulo')}
                  </Text>
                </View>
              )}

              <Campo
                label={t('miCuenta.nombreComercialLabel')}
                value={prestador.nombre_comercial}
                onChangeText={() => undefined}
                ayuda={t('miCuenta.nombreComercialAyuda')}
                deshabilitado
              />
              <Campo
                label={t('miCuenta.tipoLabel')}
                value={vozTipo(prestador.tipo)}
                onChangeText={() => undefined}
                deshabilitado
              />
              <Campo
                label={t('miCuenta.sedeLabel')}
                value={sede.length > 0 ? sede : t('miCuenta.sinCargar')}
                onChangeText={() => undefined}
                ayuda={t('miCuenta.sedeAyuda')}
                deshabilitado
              />
              <Campo
                label={t('miCuenta.descripcionLabel')}
                value={descripcion}
                onChangeText={setDescripcion}
                ayuda={t('miCuenta.descripcionAyuda')}
                multilinea={3}
              />

              <TituloBloque texto={t('miCuenta.contactoTitulo')} />
              <Campo
                label={t('miCuenta.telefonoLabel')}
                value={telNegocio}
                onChangeText={setTelNegocio}
                ayuda={t('miCuenta.telefonoAyuda')}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
              <Campo
                label={t('miCuenta.whatsappLabel')}
                value={whatsapp}
                onChangeText={setWhatsapp}
                ayuda={t('miCuenta.telefonoAyuda')}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
              <Campo
                label={t('miCuenta.emailContactoLabel')}
                value={emailContacto}
                onChangeText={setEmailContacto}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Campo
                label={t('miCuenta.sitioWebLabel')}
                value={sitioWeb}
                onChangeText={setSitioWeb}
                autoCapitalize="none"
              />
            </>
          )}

          <Boton etiqueta={t('miCuenta.guardar')} bloque cargando={guardando} onPress={() => void guardar()} />
        </ScrollView>
      )}
    </View>
  );
}
