/**
 * GROOMING — EL CUÁNDO momento-primero ADAPTADO (S60-A1, MODELO_GROOMING
 * §2/§3/§6/§7 sobre el esqueleto del CUÁNDO del paseo S55-B4). La
 * diferencia de fondo: el dueño elige SERVICIO (Baño / Baño y corte) y
 * CUÁNDO — la DURACIÓN es CONSECUENCIA (servicio × talla del perfil,
 * declarada por cada groomer) y JAMÁS menú del dueño. El motor de
 * ventana no se toca: la grilla de inicios ya viene resuelta por
 * groomer server-side (obtener_inicios_grooming_disponibles).
 *
 * LA MASCOTA VA PRIMERO (desvío declarado de la letra del visto, por
 * realidad del motor L-141: la grilla necesita la talla — sin mascota
 * no hay duración ni precio). Talla o pelaje NULL → TallaPelajeHoja
 * ANTES de pintar precios personalizados; declarar SIEMPRE continúa
 * (el rebote server talla_no_declarada queda de red, no de flujo).
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — sin groomers cobrables con oferta: vacío honesto.
 *  · Peldaño 1 — todo lo pintado es REAL: los dos comprables con su
 *    "desde" YA resuelto por la talla de ESTA mascota, inicios de
 *    franjas reales menos ocupación.
 *  · Peldaño 2 — datos del expediente: la talla y el pelaje del PERFIL
 *    gobiernan el precio (declarados una vez, editables siempre).
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
  obtenerEspeciesElegibles,
  obtenerIniciosGrooming,
  obtenerMascotasDeFamilia,
  obtenerOfertaGrooming,
  obtenerOfertaGroomingPublica,
  resolverUrlFoto,
  type MascotaResumen,
  type OfertaGrooming,
  type OfertaGroomingPublica,
} from '@epetplace/api';
import { TallaPelajeHoja } from '@/components/talla-pelaje-hoja';
import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';

function fechaLocalISO(d: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(d);
}

export default function GroomingCuando() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  // §5: especies elegibles de la DB — la UI filtra, la DB manda.
  const [especies, setEspecies] = useState<string[] | null>(null);
  // S61-A4: la CARA del para-quién — URLs firmadas (patrón del QUIÉN).
  const [fotos, setFotos] = useState<Record<string, string>>({});
  // S61-A5 cura 3 (letra founder): la oferta PÚBLICA del peldaño 0 —
  // los comprables con su "desde" real, visibles SIN mascota.
  const [ofertaPublica, setOfertaPublica] = useState<OfertaGroomingPublica[] | 'cargando' | 'error'>('cargando');
  const scrollRef = useRef<ScrollView>(null);
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  const [tallaHoja, setTallaHoja] = useState(false);
  const [oferta, setOferta] = useState<OfertaGrooming[] | 'cargando' | 'error' | null>(null);
  const [tipoServicio, setTipoServicio] = useState<string | null>(null);
  const [dia, setDia] = useState<string>(fechaLocalISO(new Date()));
  const [inicios, setInicios] = useState<string[] | 'cargando' | 'error'>('cargando');
  const [hora, setHora] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  const elegibles = useMemo(() => {
    if (!Array.isArray(mascotas)) return [];
    return especies === null ? mascotas : mascotas.filter((m) => especies.includes(m.especie));
  }, [mascotas, especies]);

  const mascota = elegibles.find((m) => m.id === mascotaId) ?? null;
  // la pregunta única de §3: sin talla o pelaje no hay precio personal
  const perfilCompleto = mascota !== null && mascota.talla !== null && mascota.pelaje !== null;

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerEspeciesElegibles('grooming').then((r) => {
        if (vigente && r.ok) setEspecies(r.data);
      });
      void obtenerOfertaGroomingPublica().then((r) => {
        if (vigente) setOfertaPublica(r.ok ? r.data : 'error');
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

  // Con UNA elegible, se elige sola (cero fricción); la pregunta de
  // talla salta al quedar elegida (abajo), jamás antes de tiempo.
  useEffect(() => {
    if (mascotaId === null && elegibles.length === 1) setMascotaId(elegibles[0].id);
  }, [elegibles, mascotaId]);

  // La puerta de §3: mascota elegida sin talla/pelaje → la Hoja. Se
  // declara UNA vez, queda en el PERFIL, editable siempre.
  useEffect(() => {
    if (mascota !== null && !perfilCompleto) setTallaHoja(true);
  }, [mascota, perfilCompleto]);

  // La oferta personalizada llega RESUELTA del server (jamás cálculo
  // en cliente): recién cuando el perfil está completo.
  useEffect(() => {
    if (mascota === null || !perfilCompleto) {
      setOferta(null);
      return;
    }
    let vigente = true;
    setOferta('cargando');
    void obtenerOfertaGrooming(mascota.id).then((r) => {
      if (!vigente) return;
      setOferta(r.ok ? r.data : 'error');
      if (r.ok && r.data.length > 0) {
        setTipoServicio((s) => (s !== null && r.data.some((o) => o.tipo_servicio === s) ? s : r.data[0].tipo_servicio));
      }
    });
    return () => {
      vigente = false;
    };
  }, [mascota, perfilCompleto, reintento]);

  // Próximos 14 días (hoy+13) — la tira del paseo, tal cual. `corta` =
  // fecha corta SIEMPRE (S61-A5 cura 1: el botón del día sin lugar).
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

  // S61-A5 cura 1 (§6ter): el día siguiente en la tira, o null en el último.
  const diaSiguiente = useMemo(() => {
    const idx = dias.findIndex((d) => d.iso === dia);
    return idx >= 0 && idx + 1 < dias.length ? dias[idx + 1] : null;
  }, [dias, dia]);

  // La grilla recalcula VIVA — la duración NO viaja: la resuelve el
  // server por groomer (servicio × talla del perfil).
  useEffect(() => {
    if (mascota === null || !perfilCompleto || tipoServicio === null || !Array.isArray(oferta) || oferta.length === 0) return;
    let vigente = true;
    setInicios('cargando');
    void obtenerIniciosGrooming({ fecha: dia, tipo_servicio: tipoServicio, mascota_id: mascota.id }).then((r) => {
      if (!vigente) return;
      setInicios(r.ok ? r.data : 'error');
      if (r.ok) setHora((h) => (h !== null && r.data.includes(h) ? h : null));
    });
    return () => {
      vigente = false;
    };
  }, [dia, tipoServicio, mascota, perfilCompleto, oferta, reintento]);

  const servicioElegido = Array.isArray(oferta) ? oferta.find((o) => o.tipo_servicio === tipoServicio) ?? null : null;
  const listo = mascota !== null && tipoServicio !== null && hora !== null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('grooming.titulo')} atras onAtras={() => router.back()} />
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
            titulo={t('grooming.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setMascotas('cargando')} />}
          />
        ) : elegibles.length === 0 ? (
          // §5 con camino: el hogar no tiene mascotas elegibles (perro/gato)
          <EstadoVacio
            icono={<Icono nombre="grooming" tamano={48} />}
            titulo={t('grooming.sinElegiblesTitulo')}
            descripcion={t('grooming.sinElegiblesDetalle')}
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
            {/* 0 · LA MASCOTA — el precio es SUYO (con una sola, elegida).
                S61-A3 (rasgo 1 de la gramática canónica): el selector se
                pinta SIEMPRE — la mascota elegida queda presente en
                pantalla, no es un paso que se olvida. */}
            <SelectorOpcion
              acento="control"
              etiqueta={t('grooming.paraQuien')}
              opciones={elegibles.map((m) => ({
                codigo: m.id,
                etiqueta: m.nombre,
                // S61-A4: la cara — foto real primero, huella digna de
                // fallback (AvatarMascota lo resuelve; memorial adentro).
                adorno: <AvatarMascota nombre={m.nombre} fotoUrl={fotos[m.id]} tamano="xs" />,
              }))}
              seleccionada={mascotaId ?? undefined}
              onSelect={setMascotaId}
            />

            {mascota === null ? (
              // S61-A5 cura 3 (letra founder): SIN mascota, la oferta se
              // VE igual — comprables con su "desde" real (peldaño 0 de
              // la misma verdad: la tesis "el precio de SU talla" no se
              // contradice, se escalona) + la tira de días; los horarios
              // dicen su porqué CON CAMINO (tap → el paso 0, arriba).
              <>
                {ofertaPublica === 'cargando' ? (
                  <EsqueletoGrupo>
                    <Esqueleto forma="bloque" ancho="100%" alto={56} />
                  </EsqueletoGrupo>
                ) : Array.isArray(ofertaPublica) && ofertaPublica.length > 0 ? (
                  <View style={{ gap: spacing[2] }}>
                    <SelectorOpcion
                      acento="control"
                      etiqueta={t('grooming.servicioEtiqueta')}
                      opciones={ofertaPublica.map((o) => ({
                        codigo: o.tipo_servicio,
                        etiqueta: vozServicio(t, o.tipo_servicio) ?? o.tipo_servicio,
                      }))}
                      seleccionada={tipoServicio ?? undefined}
                      onSelect={setTipoServicio}
                    />
                    {(() => {
                      const elegida = ofertaPublica.find((o) => o.tipo_servicio === tipoServicio) ?? null;
                      return elegida !== null ? (
                        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                          {t('grooming.precioDesdePublico', { precio: elegida.desde_precio.toFixed(2) })}
                        </Text>
                      ) : null;
                    })()}
                  </View>
                ) : null}

                <SelectorOpcion
                  acento="control"
                  etiqueta={t('explorar.cuandoDia')}
                  disposicion="tira"
                  opciones={dias.map((d) => ({ codigo: d.iso, etiqueta: d.etiqueta }))}
                  seleccionada={dia}
                  onSelect={setDia}
                />

                <EstadoVacio
                  registro="seccion"
                  titulo={t('grooming.horariosSinMascotaTitulo')}
                  descripcion={t('grooming.horariosSinMascotaDetalle')}
                  accion={
                    <Boton
                      variante="compacto"
                      etiqueta={t('grooming.paraQuien')}
                      onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
                    />
                  }
                />
              </>
            ) : !perfilCompleto ? (
              // la Hoja está abierta; si la cerró sin declarar, la
              // invitación honesta queda con su camino (jamás precio
              // adivinado, jamás final mudo)
              <EstadoVacio
                registro="seccion"
                titulo={t('grooming.tallaFaltaTitulo')}
                descripcion={t('grooming.tallaFaltaDetalle', { nombre: mascota.nombre })}
                accion={<Boton variante="primario" etiqueta={t('grooming.tallaDeclarar')} onPress={() => setTallaHoja(true)} />}
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
                titulo={t('grooming.errorTitulo')}
                accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
              />
            ) : oferta.length === 0 ? (
              // Peldaño 0 — sin groomers cobrables con oferta activa.
              <EstadoVacio
                icono={<Icono nombre="grooming" tamano={48} />}
                titulo={t('grooming.vacioTitulo')}
                descripcion={t('grooming.vacioDetalle')}
              />
            ) : (
              <>
                {/* 1 · EL SERVICIO — los dos comprables del menú (§1),
                    con el "desde" YA resuelto por la talla del perfil */}
                <View style={{ gap: spacing[2] }}>
                  <SelectorOpcion
                    acento="control"
                    etiqueta={t('grooming.servicioEtiqueta')}
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
                        ? t('grooming.precioDesde', { nombre: mascota.nombre, precio: servicioElegido.desde_precio.toFixed(2) })
                        : t('grooming.precioExacto', { nombre: mascota.nombre, precio: servicioElegido.desde_precio.toFixed(2) })}
                    </Text>
                  ) : null}
                </View>

                {/* 2 · DÍA — la tira horizontal (hoy+13) */}
                <SelectorOpcion
                  acento="control"
                  etiqueta={t('explorar.cuandoDia')}
                  disposicion="tira"
                  opciones={dias.map((d) => ({ codigo: d.iso, etiqueta: d.etiqueta }))}
                  seleccionada={dia}
                  onSelect={setDia}
                />

                {/* 2b · GRILLA de inicios reales — la duración la puso
                    cada groomer (servicio × talla), jamás el dueño */}
                {inicios === 'cargando' ? (
                  <EsqueletoGrupo>
                    <Esqueleto forma="bloque" ancho="100%" alto={100} />
                  </EsqueletoGrupo>
                ) : inicios === 'error' ? (
                  <EstadoVacio
                    registro="seccion"
                    titulo={t('grooming.errorTitulo')}
                    accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
                  />
                ) : inicios.length === 0 ? (
                  // §6ter (S61-A5 cura 1): camino tocable — espejo del paseo.
                  <EstadoVacio
                    registro="seccion"
                    titulo={t('grooming.sinInicios')}
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
          </>
        )}
      </ScrollView>

      {/* S61-A3 (rasgo 2 de la gramática canónica): el CTA de reservar
          vive ABAJO, FIJO — fuera del scroll, una sola acción primaria. */}
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
                pathname: '/explorar/grooming/disponibles',
                params: { fecha: dia, hora, tipoServicio, mascotaId: mascota.id },
              });
            }}
          />
        </View>
      ) : null}

      {/* §3 — la pregunta única: se declara UNA vez, queda en el PERFIL,
          editable siempre; declarar SIEMPRE continúa */}
      <TallaPelajeHoja
        visible={tallaHoja}
        mascota={mascota}
        onCerrar={() => setTallaHoja(false)}
        onDeclarada={(talla, pelaje) => {
          setMascotas((prev) =>
            Array.isArray(prev) ? prev.map((m) => (m.id === mascota?.id ? { ...m, talla, pelaje } : m)) : prev,
          );
          setTallaHoja(false);
        }}
      />
    </SafeAreaView>
  );
}
