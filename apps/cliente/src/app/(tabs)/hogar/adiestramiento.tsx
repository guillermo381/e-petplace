/**
 * EL HUB DE ADIESTRAMIENTO DEL DUEÑO (S63-A Bloque 3, gemela del hub de
 * grooming S60-A4): entre el pago y la sesión, la cita tiene superficie.
 * Próximos · Historial (SelectorSegmentado, Ley 19.3) — la cita futura
 * se PREPARA, no se toca (precedente S60-C1); la cerrada navega a SU
 * PARTE. La identidad k/N del programa se dice en cada fila (§1: la
 * sesión 3 no es la 7).
 *
 * TESIS: "Tus sesiones de adiestramiento viven acá — las que vienen y
 * lo que cada una dejó."
 * FIRMA: la identidad 'Sesión k de N' en la fila (el programa se LEE
 * como camino, no como lista de citas iguales).
 *
 * S63 §7 — LA BITÁCORA DE LA FAMILIA vive acá como tercer tap: dentro
 * del contexto del servicio activo (v1), sin gamificación alguna
 * (LOYALTY §5: cero contador, cero racha — la familia escribe porque
 * le importa su perro). Registrar cuesta segundos: chips + texto en
 * una Hoja.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  Icono,
  Insignia,
  Separador,
  SelectorOpcion,
  SelectorSegmentado,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerBitacora,
  obtenerMascotasDeFamilia,
  obtenerMisAdiestramientos,
  obtenerVocabularioBitacora,
  registrarBitacoraFamilia,
  type AdiestramientoDelHogar,
  type ChipVocabulario,
  type EntradaBitacora,
  type MascotaResumen,
} from '@epetplace/api';
import { fechaCortaMono } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';

export default function HubAdiestramiento() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const [vista, setVista] = useState<'proximos' | 'historial' | 'bitacora'>('proximos');
  const [citas, setCitas] = useState<AdiestramientoDelHogar[] | 'cargando' | 'error'>('cargando');
  // §7 — la bitácora
  const [entradas, setEntradas] = useState<EntradaBitacora[] | 'cargando' | 'error'>('cargando');
  const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);
  const [vocabulario, setVocabulario] = useState<ChipVocabulario[]>([]);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  const [chips, setChips] = useState<string[]>([]);
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    setCitas('cargando');
    void obtenerMisAdiestramientos().then((r) => {
      setCitas(r.ok ? r.data : 'error');
    });
    setEntradas('cargando');
    void obtenerBitacora().then((r) => {
      setEntradas(r.ok ? r.data : 'error');
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
      let vigente = true;
      void obtenerVocabularioBitacora().then((r) => {
        if (vigente && r.ok) setVocabulario(r.data);
      });
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente || !estado.ok || !estado.data.familia_id) return;
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (vigente && r.ok) setMascotas(r.data);
      })();
      return () => {
        vigente = false;
      };
    }, [cargar]),
  );

  // con UNA mascota, elegida sola (cero fricción)
  useEffect(() => {
    if (mascotaId === null && mascotas.length === 1) setMascotaId(mascotas[0].id);
  }, [mascotas, mascotaId]);

  const nombrePorMascota = useMemo(
    () => new Map(mascotas.map((m) => [m.id, m.nombre])),
    [mascotas],
  );

  const guardar = async () => {
    if (guardando || mascotaId === null) return;
    setGuardando(true);
    const r = await registrarBitacoraFamilia(
      mascotaId,
      texto.length > 0 ? texto : null,
      chips.map((codigo) => {
        const chip = vocabulario.find((v) => v.codigo === codigo);
        return { tipo: chip?.tipo ?? 'conducta', codigo };
      }),
    );
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('adiestramiento.bitacoraGuardada'), variante: 'exito' });
    setHojaAbierta(false);
    setChips([]);
    setTexto('');
    cargar();
  };

  const proximos = Array.isArray(citas)
    ? citas.filter((c) => c.estado === 'confirmada' || c.estado === 'en_curso')
    : [];
  const historial = Array.isArray(citas)
    ? citas.filter((c) => c.tiene_parte).slice().reverse()
    : [];
  const visibles = vista === 'proximos' ? proximos : historial;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('adiestramiento.hubTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[4] }}>
        <Boton
          variante="primario"
          etiqueta={t('adiestramiento.agendar')}
          onPress={() => router.push('/explorar/adiestramiento')}
        />

        <SelectorSegmentado
          etiqueta={t('adiestramiento.hubTitulo')}
          segmentos={[
            { codigo: 'proximos', etiqueta: t('adiestramiento.hubProximos') },
            { codigo: 'historial', etiqueta: t('adiestramiento.hubHistorial') },
            { codigo: 'bitacora', etiqueta: t('adiestramiento.bitacoraTab') },
          ]}
          activo={vista}
          onCambio={(v) => setVista(v === 'historial' ? 'historial' : v === 'bitacora' ? 'bitacora' : 'proximos')}
        />

        {vista === 'bitacora' ? (
          // §7 — LA BITÁCORA: registrar cuesta segundos, cero
          // gamificación (sin contador, sin racha — LOYALTY §5)
          entradas === 'cargando' ? (
            <EsqueletoGrupo>
              <View style={{ gap: spacing[3] }}>
                <Esqueleto forma="bloque" ancho="100%" alto={64} />
                <Esqueleto forma="bloque" ancho="100%" alto={64} />
              </View>
            </EsqueletoGrupo>
          ) : entradas === 'error' ? (
            <EstadoVacio
              titulo={t('adiestramiento.errorTitulo')}
              descripcion={t('hogar.errorHistoriaDetalle')}
              accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
            />
          ) : entradas.length === 0 ? (
            <EstadoVacio
              registro="seccion"
              icono={<Icono nombre="training" tamano={48} />}
              titulo={t('adiestramiento.bitacoraVacioTitulo')}
              descripcion={t('adiestramiento.bitacoraVacioDetalle')}
              accion={
                <Boton variante="primario" etiqueta={t('adiestramiento.bitacoraAnotar')} onPress={() => setHojaAbierta(true)} />
              }
            />
          ) : (
            <>
              <Boton variante="compacto" etiqueta={t('adiestramiento.bitacoraAnotar')} onPress={() => setHojaAbierta(true)} />
              <Tarjeta relleno="ninguno">
                {entradas.map((e, i) => (
                  <View key={e.bitacora_id}>
                    {i > 0 ? <Separador /> : null}
                    <View style={{ padding: spacing[3], gap: spacing[2] }}>
                      <Text
                        style={{
                          fontFamily: typography.family.mono.regular,
                          fontSize: typography.size.xs,
                          color: theme.text.tertiary,
                        }}
                      >
                        {`${nombrePorMascota.get(e.mascota_id)?.toLowerCase() ?? ''} · ${fechaCortaMono(e.created_at.slice(0, 10), idioma)}`}
                      </Text>
                      {e.chips.length > 0 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                          {e.chips.map((ch) => (
                            <Insignia
                              key={`${ch.tipo}-${ch.codigo}`}
                              estado="info"
                              etiqueta={idioma === 'en' ? ch.nombre_familia_en : ch.nombre_familia}
                            />
                          ))}
                        </View>
                      ) : null}
                      {e.texto !== null ? (
                        <Text
                          style={{
                            fontFamily: typography.family.sans.regular,
                            fontSize: typography.size.md,
                            lineHeight: Math.round(typography.size.md * 1.45),
                            color: theme.text.primary,
                          }}
                        >
                          {e.texto}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </Tarjeta>
            </>
          )
        ) : citas === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : citas === 'error' ? (
          <EstadoVacio
            titulo={t('adiestramiento.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : visibles.length === 0 ? (
          <EstadoVacio
            registro="seccion"
            icono={<Icono nombre="training" tamano={48} />}
            titulo={vista === 'proximos' ? t('adiestramiento.hubProximosVacioTitulo') : t('adiestramiento.hubHistorialVacioTitulo')}
            descripcion={
              vista === 'proximos' ? t('adiestramiento.hubProximosVacioDetalle') : t('adiestramiento.hubHistorialVacioDetalle')
            }
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {visibles.map((c, i) => {
              // la identidad k del programa (§1) — estado pasivo,
              // jamás botón (Ley 19.4)
              const fin =
                c.sesion_numero !== null ? (
                  <Insignia estado="info" etiqueta={t('adiestramiento.sesionK', { k: String(c.sesion_numero) })} />
                ) : undefined;
              const titulo = c.mascota_nombre ?? t('adiestramiento.titulo');
              const subtitulo = c.prestador_nombre ?? undefined;
              const metadataMono = `${fechaCortaMono(c.fecha, idioma)} · ${c.hora}`;
              const navegable = vista === 'historial' && c.tiene_parte;
              return (
                <View key={c.cita_id}>
                  {i > 0 ? <Separador /> : null}
                  {navegable ? (
                    <Celda
                      titulo={titulo}
                      subtitulo={subtitulo}
                      metadataMono={metadataMono}
                      fin={fin}
                      interactiva
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({
                          pathname: '/adiestramiento/[citaId]',
                          params: { citaId: c.cita_id, mascotaNombre: c.mascota_nombre ?? '' },
                        })
                      }
                    />
                  ) : (
                    // la cita futura se PREPARA, no se toca (S60-C1)
                    <Celda titulo={titulo} subtitulo={subtitulo} metadataMono={metadataMono} fin={fin} />
                  )}
                </View>
              );
            })}
          </Tarjeta>
        )}
      </ScrollView>

      {/* §7 — la Hoja de registro: chips + texto, guardar. Segundos,
          jamás un formulario. */}
      <Hoja
        visible={hojaAbierta}
        onCerrar={() => setHojaAbierta(false)}
        titulo={t('adiestramiento.bitacoraHojaTitulo')}
        conCerrar
      >
        <HojaScroll>
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            {mascotas.length > 1 ? (
              <SelectorOpcion
                acento="control"
                etiqueta={t('adiestramiento.paraQuien')}
                opciones={mascotas.map((m) => ({ codigo: m.id, etiqueta: m.nombre }))}
                seleccionada={mascotaId ?? undefined}
                onSelect={setMascotaId}
              />
            ) : null}
            <SelectorOpcion
              acento="control"
              etiqueta={t('adiestramiento.bitacoraChipsEtiqueta')}
              disposicion="grilla"
              multiple
              opciones={vocabulario.map((v) => ({
                codigo: v.codigo,
                etiqueta: idioma === 'en' ? v.nombre_familia_en : v.nombre_familia,
              }))}
              seleccionadas={chips}
              onSelect={(codigo) =>
                setChips((prev) => (prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]))
              }
            />
            <Campo
              label={t('adiestramiento.bitacoraTextoLabel')}
              placeholder={t('adiestramiento.bitacoraTextoPlaceholder')}
              value={texto}
              onChangeText={setTexto}
              multilinea={3}
            />
            <Boton
              variante="primario"
              etiqueta={t('adiestramiento.bitacoraGuardar')}
              deshabilitado={guardando || mascotaId === null || (chips.length === 0 && texto.trim().length === 0)}
              onPress={() => void guardar()}
            />
          </View>
        </HojaScroll>
      </Hoja>
    </SafeAreaView>
  );
}
