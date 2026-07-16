/**
 * ADIESTRAMIENTO — EL CUÁNDO (S63-A Bloque 3, MODELO_ADIESTRAMIENTO v1.1
 * §1/§8/§12.2 sobre el esqueleto del CUÁNDO del grooming S60-A1).
 * Gramática canónica v1.8: MASCOTA → QUÉ → DÍA → HORA. La diferencia de
 * fondo con sus hermanas: en el QUÉ vive SESIÓN-O-PROGRAMA (§8) — el
 * dueño elige la FORMA antes de ver adiestradores, y si elige programa,
 * la voz honesta le dice ACÁ que las sesiones se agendan solas a
 * cadencia semanal desde la fecha que elija (jamás lo descubre después).
 * Sin talla (el precio del oficio no varía por tamaño) y sin selector
 * de modalidad (default único del chasis — el trazado es S64-B0).
 *
 * TESIS: "Elegís qué forma de aprender —una sesión o el camino
 * completo— y cuándo empieza."
 * FIRMA: la voz honesta del programa (todas-al-comprar dicho ANTES del
 * precio) — comportamiento, no color.
 *
 * ESCALERA (§4b): peldaño 0 = sin adiestradores cobrables, vacío
 * honesto · peldaño 1 = inicios REALES (franjas menos ocupación, con la
 * duración del comprable) · peldaño 2 = la especie del PERFIL filtra
 * (guard mascota_no_elegible, hoy solo perros §2).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  SelectorOpcion,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerEspeciesElegibles,
  obtenerIniciosAdiestramiento,
  obtenerMascotasDeFamilia,
  resolverUrlFoto,
  type ComprableAdiestramiento,
  type MascotaResumen,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';

function fechaLocalISO(d: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(d);
}

export default function AdiestramientoCuando() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  // §2: especies elegibles de la DB — la UI filtra, la DB manda.
  const [especies, setEspecies] = useState<string[] | null>(null);
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  const [comprable, setComprable] = useState<ComprableAdiestramiento>('sesion');
  const [dia, setDia] = useState<string>(fechaLocalISO(new Date()));
  const [inicios, setInicios] = useState<string[] | 'cargando' | 'error'>('cargando');
  const [hora, setHora] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  const elegibles = useMemo(() => {
    if (!Array.isArray(mascotas)) return [];
    return especies === null ? mascotas : mascotas.filter((m) => especies.includes(m.especie));
  }, [mascotas, especies]);

  const mascota = elegibles.find((m) => m.id === mascotaId) ?? null;

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerEspeciesElegibles('adiestramiento').then((r) => {
        if (vigente && r.ok) setEspecies(r.data);
      });
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente) return;
        if (!estado.ok || !estado.data.familia_id) {
          setMascotas('error');
          return;
        }
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente) return;
        setMascotas(r.ok ? r.data : 'error');
        if (r.ok) {
          const conFoto = r.data.filter((m): m is MascotaResumen & { foto_url: string } => m.foto_url !== null);
          if (conFoto.length > 0) {
            const urls = await Promise.all(conFoto.map((m) => resolverUrlFoto(m.foto_url)));
            if (!vigente) return;
            const mapa: Record<string, string> = {};
            conFoto.forEach((m, idx) => {
              const u = urls[idx];
              if (u !== null) mapa[m.id] = u;
            });
            setFotos(mapa);
          }
        }
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  // Con UNA elegible, se elige sola (cero fricción — patrón de la casa).
  useEffect(() => {
    if (mascotaId === null && elegibles.length === 1) setMascotaId(elegibles[0].id);
  }, [elegibles, mascotaId]);

  // Próximos 14 días — la tira del paseo/grooming, tal cual. Para el
  // PROGRAMA la fecha es la de la PRIMERA sesión (§12.2) y arranca
  // desde mañana (el motor rebota hoy: slot_en_pasado).
  const dias = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', {
      weekday: 'short',
      day: 'numeric',
    });
    const desde = comprable === 'programa' ? 1 : 0;
    const lista: Array<{ iso: string; etiqueta: string; corta: string }> = [];
    for (let i = desde; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = fechaLocalISO(d);
      const corta = fmt.format(d).toLowerCase();
      const etiqueta = i === 0 ? t('explorar.cuandoHoy') : i === 1 ? t('explorar.cuandoManana') : corta;
      lista.push({ iso, etiqueta, corta });
    }
    return lista;
  }, [idioma, t, comprable]);

  // si el cambio de comprable dejó el día fuera de la tira (programa
  // arranca mañana), el día se corrige solo
  useEffect(() => {
    if (!dias.some((d) => d.iso === dia)) setDia(dias[0].iso);
  }, [dias, dia]);

  const diaSiguiente = useMemo(() => {
    const idx = dias.findIndex((d) => d.iso === dia);
    return idx >= 0 && idx + 1 < dias.length ? dias[idx + 1] : null;
  }, [dias, dia]);

  // La grilla recalcula VIVA con la duración del COMPRABLE (sesión =
  // oferta; programa = su sesión) — la resuelve el server, jamás viaja.
  useEffect(() => {
    if (mascota === null) return;
    let vigente = true;
    setInicios('cargando');
    void obtenerIniciosAdiestramiento(dia, mascota.id, comprable).then((r) => {
      if (!vigente) return;
      setInicios(r.ok ? r.data : 'error');
      if (r.ok) setHora((h) => (h !== null && r.data.includes(h) ? h : null));
    });
    return () => {
      vigente = false;
    };
  }, [dia, mascota, comprable, reintento]);

  const listo = mascota !== null && hora !== null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('adiestramiento.titulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[5] }}>
        {mascotas === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
            </View>
          </EsqueletoGrupo>
        ) : mascotas === 'error' ? (
          <EstadoVacio
            titulo={t('adiestramiento.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setMascotas('cargando')} />}
          />
        ) : elegibles.length === 0 ? (
          // §2 con camino: hoy solo perros — el vacío invita a actuar
          <EstadoVacio
            icono={<Icono nombre="training" tamano={48} />}
            titulo={t('adiestramiento.sinElegiblesTitulo')}
            descripcion={t('adiestramiento.sinElegiblesDetalle')}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('paquete.sinPerrosAccion')}
                onPress={() => {
                  if (router.canDismiss()) router.dismissAll();
                  router.navigate('/hogar/agregar');
                }}
              />
            }
          />
        ) : (
          <>
            {/* 0 · LA MASCOTA — presente en pantalla siempre (rasgo 1
                de la gramática canónica) */}
            <SelectorOpcion
              acento="control"
              etiqueta={t('adiestramiento.paraQuien')}
              opciones={elegibles.map((m) => ({
                codigo: m.id,
                etiqueta: m.nombre,
                adorno: <AvatarMascota nombre={m.nombre} fotoUrl={fotos[m.id]} tamano="xs" />,
              }))}
              seleccionada={mascotaId ?? undefined}
              onSelect={setMascotaId}
            />

            {/* 1 · EL QUÉ — sesión-o-programa (§8). La FIRMA de la
                pantalla: si es programa, la voz honesta dice ACÁ que
                las sesiones se agendan solas, antes de todo precio. */}
            <View style={{ gap: spacing[2] }}>
              <SelectorOpcion
                acento="control"
                etiqueta={t('adiestramiento.comprableEtiqueta')}
                opciones={[
                  { codigo: 'sesion', etiqueta: t('adiestramiento.comprableSesion') },
                  { codigo: 'programa', etiqueta: t('adiestramiento.comprablePrograma') },
                ]}
                seleccionada={comprable}
                onSelect={(c) => setComprable(c === 'programa' ? 'programa' : 'sesion')}
              />
              {comprable === 'programa' ? (
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.sm,
                    lineHeight: Math.round(typography.size.sm * 1.4),
                    color: theme.text.secondary,
                  }}
                >
                  {t('adiestramiento.comprableProgramaVoz')}
                </Text>
              ) : null}
            </View>

            {/* 2 · DÍA — la tira (programa: desde mañana, §12.2) */}
            <SelectorOpcion
              acento="control"
              etiqueta={t('explorar.cuandoDia')}
              disposicion="tira"
              opciones={dias.map((d) => ({ codigo: d.iso, etiqueta: d.etiqueta }))}
              seleccionada={dia}
              onSelect={setDia}
            />

            {/* 2b · GRILLA de inicios reales del comprable */}
            {mascota === null ? null : inicios === 'cargando' ? (
              <EsqueletoGrupo>
                <Esqueleto forma="bloque" ancho="100%" alto={100} />
              </EsqueletoGrupo>
            ) : inicios === 'error' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('adiestramiento.errorTitulo')}
                accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
              />
            ) : inicios.length === 0 ? (
              // §6ter heredado: camino tocable, jamás final mudo
              <EstadoVacio
                registro="seccion"
                titulo={t('adiestramiento.sinInicios')}
                accion={
                  diaSiguiente !== null ? (
                    <Boton
                      variante="compacto"
                      etiqueta={t('explorar.sinIniciosProbarDia', { dia: diaSiguiente.corta })}
                      onPress={() => setDia(diaSiguiente.iso)}
                    />
                  ) : undefined
                }
              />
            ) : (
              <SelectorOpcion
                acento="control"
                etiqueta={t('explorar.cuandoHora')}
                disposicion="grilla"
                opciones={inicios.map((h) => ({ codigo: h, etiqueta: h }))}
                seleccionada={hora ?? undefined}
                onSelect={setHora}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* rasgo 2 de la gramática: CTA abajo, FIJO, una sola primaria */}
      {Array.isArray(mascotas) && elegibles.length > 0 ? (
        <View
          style={{
            paddingHorizontal: spacing[4],
            paddingTop: spacing[3],
            paddingBottom: Math.max(insets.bottom, spacing[4]),
            backgroundColor: theme.bg.base,
            borderTopWidth: 1,
            borderTopColor: theme.border.subtle,
          }}
        >
          <Boton
            variante="primario"
            etiqueta={t('explorar.verQuienPuede')}
            deshabilitado={!listo}
            onPress={() => {
              if (!listo || mascota === null || hora === null) return;
              router.push({
                pathname: '/explorar/adiestramiento/disponibles',
                params: { fecha: dia, hora, comprable, mascotaId: mascota.id, mascotaNombre: mascota.nombre },
              });
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
