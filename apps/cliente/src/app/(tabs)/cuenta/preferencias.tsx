/**
 * Cuenta · Preferencias (S55-B3) — el idioma se muda acá (y CIERRA
 * D-316: el cambio persiste en DB además del dispositivo; la DB es la
 * verdad multi-dispositivo) + notificaciones por GRUPO en voz humana
 * (la DB guarda por tipo — contrato B4: fila ausente = habilitada) con
 * la voz honesta: hoy las push no llegan; cuando lleguen, se respeta.
 * Escalera: no muestra datos del expediente.
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  SelectorOpcion,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { cambiarIdioma, type IdiomaSoportado } from '@epetplace/i18n';
import {
  guardarIdiomaPreferido,
  guardarPreferenciaNotificacion,
  obtenerPreferencias,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

// Grupos en voz humana → tipos del vocabulario de notificaciones.tipo
// (Ley 3: el dueño jamás ve un código; B4 opera por tipo).
const GRUPOS = [
  { key: 'citas', tituloKey: 'cuenta.notifCitas', detalleKey: 'cuenta.notifCitasDetalle', tipos: ['cita_recordatorio', 'cita_confirmada', 'cita_completada'] },
  { key: 'cuidado', tituloKey: 'cuenta.notifCuidado', detalleKey: 'cuenta.notifCuidadoDetalle', tipos: ['vacuna_vencida'] },
  { key: 'novedades', tituloKey: 'cuenta.notifNovedades', detalleKey: null, tipos: ['promocion'] },
] as const;

export default function PreferenciasCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [apagados, setApagados] = useState<Record<string, boolean>>({});
  const [cambiando, setCambiando] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerPreferencias();
      if (!vigente) return;
      if (!r.ok) {
        setEstado('error');
        return;
      }
      const mapa: Record<string, boolean> = {};
      for (const [tipo, habilitada] of Object.entries(r.data.notificaciones)) {
        if (!habilitada) mapa[tipo] = true;
      }
      setApagados(mapa);
      setEstado('listo');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  async function alElegirIdioma(codigo: string) {
    if (cambiando || codigo === idioma || (codigo !== 'es' && codigo !== 'en')) return;
    setCambiando(true);
    try {
      await cambiarIdioma(codigo as IdiomaSoportado);
    } catch {
      mostrar({ texto: t('cuenta.idiomaError'), variante: 'error' });
    }
    // D-316: la preferencia viaja a DB (verdad multi-dispositivo); si
    // falla, se dice — el idioma local ya cambió (regla 36).
    const r = await guardarIdiomaPreferido(codigo as IdiomaSoportado);
    if (!r.ok) mostrar({ texto: t('cuenta.idiomaError'), variante: 'error' });
    setCambiando(false);
  }

  // grupo habilitado = ninguno de sus tipos está apagado
  const grupoHabilitado = (tipos: readonly string[]) => tipos.every((tp) => !apagados[tp]);

  async function alCambiarGrupo(tipos: readonly string[], habilitar: boolean) {
    // optimista con vuelta atrás dicha (regla 36)
    const previo = { ...apagados };
    const siguiente = { ...apagados };
    for (const tp of tipos) {
      if (habilitar) delete siguiente[tp];
      else siguiente[tp] = true;
    }
    setApagados(siguiente);
    const r = await guardarPreferenciaNotificacion([...tipos], habilitar);
    if (!r.ok) {
      setApagados(previo);
      mostrar({ texto: r.mensaje, variante: 'error' });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cuenta.preferencias')} atras onAtras={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[5] }}>
        <Tarjeta>
          <SelectorOpcion
            etiqueta={t('cuenta.idioma')}
            opciones={[
              { codigo: 'es', etiqueta: t('cuenta.idiomaEs') },
              { codigo: 'en', etiqueta: t('cuenta.idiomaEn') },
            ]}
            seleccionada={idioma}
            onSelect={(codigo) => void alElegirIdioma(codigo)}
          />
        </Tarjeta>

        <View style={{ gap: spacing[3] }}>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
          >
            {t('cuenta.notificaciones')}
          </Text>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
            {t('cuenta.notifVoz')}
          </Text>

          {estado === 'cargando' ? (
            <EsqueletoGrupo>
              <View style={{ gap: spacing[3] }}>
                <Esqueleto forma="bloque" ancho="100%" alto={88} />
                <Esqueleto forma="bloque" ancho="100%" alto={88} />
              </View>
            </EsqueletoGrupo>
          ) : estado === 'error' ? (
            <EstadoVacio
              registro="seccion"
              titulo={t('cuenta.errorCargar')}
              accion={<Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={() => { setEstado('cargando'); setIntento((n) => n + 1); }} />}
            />
          ) : (
            GRUPOS.map((g) => (
              <Tarjeta key={g.key}>
                <View style={{ gap: spacing[2] }}>
                  {g.detalleKey !== null ? (
                    <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                      {t(g.detalleKey)}
                    </Text>
                  ) : null}
                  <SelectorOpcion
                    etiqueta={t(g.tituloKey)}
                    opciones={[
                      { codigo: 'on', etiqueta: t('cuenta.notifActivadas') },
                      { codigo: 'off', etiqueta: t('cuenta.notifSilenciadas') },
                    ]}
                    seleccionada={grupoHabilitado(g.tipos) ? 'on' : 'off'}
                    onSelect={(codigo) => void alCambiarGrupo(g.tipos, codigo === 'on')}
                  />
                </View>
              </Tarjeta>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
