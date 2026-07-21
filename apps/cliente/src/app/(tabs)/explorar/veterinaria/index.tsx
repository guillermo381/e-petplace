/**
 * VETERINARIA — EL CUÁNDO momento-primero (S68-A2, V2 del esqueleto vet:
 * MODELO_VETERINARIA §6/§17 sobre el chasis del grooming SIN talla). La
 * gramática canónica entera: MASCOTA → QUÉ → DÍA → HORA → QUIÉN → PAGAR.
 * La DURACIÓN es CONSECUENCIA (la declaró cada vet en su oferta) y JAMÁS
 * menú del dueño; la grilla de inicios llega resuelta server-side
 * (obtener_inicios_vet_disponibles).
 *
 * TESIS: la agenda del veterinario es real y tiene lugar para tu mascota
 * — y si es urgencia, es para HOY.
 * FIRMA: la urgencia declarada solo-hoy — el día no se elige, se dice
 * (comportamiento honesto, no color).
 *
 * URGENCIA (S68): el tipo con reserva_solo_hoy=true FIJA el día en HOY —
 * la tira de días no se pinta y la voz dice su porqué. La ley dura vive
 * en el motor (urgencia_solo_hoy en crear_bloqueo_agenda); la UI solo la
 * respeta antes.
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — sin vets cobrables con oferta reservable: vacío honesto
 *    (telemedicina/emergencia existen pero reservable=false: el motor
 *    las deja fuera SOLO — la UI no filtra listas).
 *  · Peldaño 1 — todo lo pintado es REAL: tipos con su "desde" agregado,
 *    inicios de franjas reales menos ocupación.
 *  · Peldaño 2 — el techo de especies del tipo gobierna la elegibilidad
 *    (especies_elegibles, §1bis — la DB manda).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  obtenerIniciosVet,
  obtenerMascotasDeFamilia,
  obtenerOfertaVet,
  resolverUrlFoto,
  type MascotaResumen,
  type OfertaVet,
  mascotasElegibles,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';

function fechaLocalISO(d: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(d);
}

export default function VeterinariaCuando() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  // S61-A4: la CARA del para-quién — URLs firmadas (patrón del QUIÉN).
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  const [oferta, setOferta] = useState<OfertaVet[] | 'cargando' | 'error' | null>(null);
  const [tipoServicio, setTipoServicio] = useState<string | null>(null);
  const [dia, setDia] = useState<string>(fechaLocalISO(new Date()));
  const [inicios, setInicios] = useState<string[] | 'cargando' | 'error'>('cargando');
  const [hora, setHora] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  // El techo de especie es POR TIPO (§1bis) y lo resuelve el motor por
  // fila — acá el hogar entero elige; la oferta de cada mascota ya
  // llega acotada server-side.
  // S73 (letra de elegibilidad): la vet pasa TODAS las especies POR DISEÑO
  // (multi-especie es decisión, no omisión) — pero el momento vital manda:
  // memorial/perdida NO reservan. La frontera única lo resuelve.
  const elegibles = mascotasElegibles(Array.isArray(mascotas) ? mascotas : [], null);
  const mascota = elegibles.find((m) => m.id === mascotaId) ?? null;
  const hoyISO = fechaLocalISO(new Date());

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
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

  // Con UNA mascota, se elige sola (cero fricción).
  useEffect(() => {
    if (mascotaId === null && elegibles.length === 1) setMascotaId(elegibles[0].id);
  }, [elegibles, mascotaId]);

  // La oferta reservable llega RESUELTA del server (jamás cálculo en
  // cliente) — recién con la mascota elegida (el "desde" es de SU techo).
  useEffect(() => {
    if (mascota === null) {
      setOferta(null);
      return;
    }
    let vigente = true;
    setOferta('cargando');
    void obtenerOfertaVet(mascota.id).then((r) => {
      if (!vigente) return;
      setOferta(r.ok ? r.data : 'error');
      if (r.ok && r.data.length > 0) {
        setTipoServicio((s) => (s !== null && r.data.some((o) => o.tipo_servicio === s) ? s : r.data[0].tipo_servicio));
      }
    });
    return () => {
      vigente = false;
    };
  }, [mascota, reintento]);

  const servicioElegido = Array.isArray(oferta) ? oferta.find((o) => o.tipo_servicio === tipoServicio) ?? null : null;
  const esSoloHoy = servicioElegido?.reserva_solo_hoy === true;

  // S68 — la firma: urgencia FIJA el día en HOY (la tira no se pinta).
  useEffect(() => {
    if (esSoloHoy && dia !== hoyISO) setDia(hoyISO);
  }, [esSoloHoy, dia, hoyISO]);

  // Próximos 14 días (hoy+13) — la tira canónica del CUÁNDO.
  const dias = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', {
      weekday: 'short',
      day: 'numeric',
    });
    const lista: Array<{ iso: string; etiqueta: string; corta: string }> = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = fechaLocalISO(d);
      const corta = fmt.format(d).toLowerCase();
      const etiqueta = i === 0 ? t('explorar.cuandoHoy') : i === 1 ? t('explorar.cuandoManana') : corta;
      lista.push({ iso, etiqueta, corta });
    }
    return lista;
  }, [idioma, t]);

  // §6ter: el día siguiente en la tira, o null en el último.
  const diaSiguiente = useMemo(() => {
    const idx = dias.findIndex((d) => d.iso === dia);
    return idx >= 0 && idx + 1 < dias.length ? dias[idx + 1] : null;
  }, [dias, dia]);

  // La grilla recalcula VIVA — la duración la resuelve el server por vet.
  useEffect(() => {
    if (mascota === null || tipoServicio === null || !Array.isArray(oferta) || oferta.length === 0) return;
    let vigente = true;
    setInicios('cargando');
    void obtenerIniciosVet({ fecha: dia, tipo_servicio: tipoServicio, mascota_id: mascota.id }).then((r) => {
      if (!vigente) return;
      setInicios(r.ok ? r.data : 'error');
      if (r.ok) setHora((h) => (h !== null && r.data.includes(h) ? h : null));
    });
    return () => {
      vigente = false;
    };
  }, [dia, tipoServicio, mascota, oferta, reintento]);

  const listo = mascota !== null && tipoServicio !== null && hora !== null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('veterinaria.titulo')} atras onAtras={() => router.back()} />
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[5] }}>
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
            titulo={t('veterinaria.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setMascotas('cargando')} />}
          />
        ) : elegibles.length === 0 ? (
          <EstadoVacio
            icono={<Icono nombre="veterinaria" tamano={48} />}
            titulo={t('veterinaria.sinMascotasTitulo')}
            descripcion={t('veterinaria.sinMascotasDetalle')}
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
            {/* 0 · LA MASCOTA — la gramática canónica: el para-quién
                VISIBLE siempre, con la cara (S61-A3/A4). */}
            <SelectorOpcion
              acento="control"
              etiqueta={t('veterinaria.paraQuien')}
              opciones={elegibles.map((m) => ({
                codigo: m.id,
                etiqueta: m.nombre,
                adorno: <AvatarMascota nombre={m.nombre} fotoUrl={fotos[m.id]} tamano="xs" />,
              }))}
              seleccionada={mascotaId ?? undefined}
              onSelect={setMascotaId}
            />

            {mascota === null ? (
              // sin mascota elegida no hay "desde" (el precio es de SU
              // techo de especie): invitación con camino, jamás mudo
              <EstadoVacio
                registro="seccion"
                titulo={t('veterinaria.eligeMascota')}
                accion={
                  <Boton
                    variante="compacto"
                    etiqueta={t('veterinaria.paraQuien')}
                    onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
                  />
                }
              />
            ) : oferta === 'cargando' || oferta === null ? (
              <EsqueletoGrupo>
                <View style={{ gap: spacing[3] }}>
                  <Esqueleto forma="bloque" ancho="100%" alto={56} />
                  <Esqueleto forma="bloque" ancho="100%" alto={100} />
                </View>
              </EsqueletoGrupo>
            ) : oferta === 'error' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('veterinaria.errorTitulo')}
                accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
              />
            ) : oferta.length === 0 ? (
              // Peldaño 0 — sin vets cobrables con oferta reservable.
              <EstadoVacio
                icono={<Icono nombre="veterinaria" tamano={48} />}
                titulo={t('veterinaria.vacioTitulo')}
                descripcion={t('veterinaria.vacioDetalle')}
              />
            ) : (
              <>
                {/* 1 · EL QUÉ — los tipos reservables del mundo vet, con
                    el "desde" agregado server-side */}
                <View style={{ gap: spacing[2] }}>
                  <SelectorOpcion
                    acento="control"
                    etiqueta={t('veterinaria.servicioEtiqueta')}
                    opciones={oferta.map((o) => ({
                      codigo: o.tipo_servicio,
                      etiqueta: vozServicio(t, o.tipo_servicio, o.servicio_nombre) ?? o.servicio_nombre,
                    }))}
                    seleccionada={tipoServicio ?? undefined}
                    onSelect={setTipoServicio}
                  />
                  {servicioElegido !== null ? (
                    <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                      {servicioElegido.varia
                        ? t('veterinaria.precioDesde', { nombre: mascota.nombre, precio: servicioElegido.desde_precio.toFixed(2) })
                        : t('veterinaria.precioExacto', { nombre: mascota.nombre, precio: servicioElegido.desde_precio.toFixed(2) })}
                    </Text>
                  ) : null}
                </View>

                {/* 2 · DÍA — urgencia es para HOY: el día no se elige, se
                    dice (la firma); el resto lleva la tira canónica */}
                {esSoloHoy ? (
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: Math.round(typography.size.sm * 1.4), color: theme.text.secondary }}>
                    {t('veterinaria.urgenciaSoloHoy')}
                  </Text>
                ) : (
                  <SelectorOpcion
                    acento="control"
                    etiqueta={t('explorar.cuandoDia')}
                    disposicion="tira"
                    opciones={dias.map((d) => ({ codigo: d.iso, etiqueta: d.etiqueta }))}
                    seleccionada={dia}
                    onSelect={setDia}
                  />
                )}

                {/* 2b · GRILLA de inicios reales — la duración la puso
                    cada vet en su oferta, jamás el dueño */}
                {inicios === 'cargando' ? (
                  <EsqueletoGrupo>
                    <Esqueleto forma="bloque" ancho="100%" alto={100} />
                  </EsqueletoGrupo>
                ) : inicios === 'error' ? (
                  <EstadoVacio
                    registro="seccion"
                    titulo={t('veterinaria.errorTitulo')}
                    accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
                  />
                ) : inicios.length === 0 ? (
                  // §6ter: camino tocable — espejo del paseo/grooming; la
                  // urgencia sin lugar HOY no ofrece "probar mañana"
                  // (mañana ya no es urgencia): dice su verdad serena.
                  <EstadoVacio
                    registro="seccion"
                    titulo={esSoloHoy ? t('veterinaria.urgenciaSinLugarHoy') : t('veterinaria.sinInicios')}
                    accion={
                      !esSoloHoy && diaSiguiente !== null ? (
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
          </>
        )}
      </ScrollView>

      {/* La gramática canónica: el CTA abajo, FIJO — una sola primaria. */}
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
              if (!listo || mascota === null) return;
              router.push({
                pathname: '/explorar/veterinaria/disponibles',
                params: { fecha: dia, hora, tipoServicio, mascotaId: mascota.id },
              });
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
