/**
 * PASEO — EL CUÁNDO tipo Teams (S55-B4, founder; reescribe el S54-B3.2).
 * Tres movimientos: DURACIÓN primero (bloques del menú canónico
 * realmente ofertados, server-side vía obtener_oferta_paseo — no se
 * oferta quien no puede cobrar, 7.13) → DÍA (tira horizontal hoy+13)
 * → GRILLA de inicios reales (obtener_inicios_paseo_disponibles: la
 * ventana entera cabe con cupo para ALGÚN paseador — motor S55-B2).
 * Slot sin cupo NO se pinta (silencio digno); día sin inicios = voz
 * honesta corta. El QUIÉN y el checkout quedan intactos (S54); el
 * camino de la plata NO se toca. Frecuencia dibujada APAGADA (el
 * paquete tiene candado: financiero v2.5 + P14, MODELO_PASEO §6).
 * CIERRA D-321: murió el rango horario hardcodeado.
 *
 * Piezas del sistema: SelectorOpcion en sus tres disposiciones
 * (enmienda S55-B4 — fila/tira/grilla), Celda para la frecuencia.
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — sin oferta activa: EstadoVacio honesto que educa.
 *  · Peldaño 1 — todo lo que se pinta es REAL: bloques de ofertas
 *    vivas con su precio, inicios de franjas reales menos ocupación.
 *  · Peldaño 2 — datos del expediente: HOY NINGUNO (explícito).
 *    Cuando el expediente sepa rutinas (B4+), la grilla podrá sugerir
 *    "su hora habitual" — por dato, no por versión.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerEspeciesElegibles,
  obtenerIniciosPaseo,
  obtenerMascotasDeFamilia,
  obtenerOfertaPaseo,
  resolverUrlFoto,
  type MascotaResumen,
  type OfertaPaseo,
  mascotasElegibles,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';

function fechaLocalISO(d: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(d);
}

// '30 min' · '1 h' · '2 h' — el menú habla en tiempo humano corto.
function etiquetaBloque(min: number): string {
  return min < 60 ? `${min} min` : `${min / 60} h`;
}

interface Bloque {
  duracion: number;
  /** Precio mínimo entre prestadores que lo ofertan. */
  desde: number;
  /** true si hay más de un precio distinto (la voz dice "desde"). */
  varia: boolean;
}

export default function PaseoCuando() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();

  // S61-A3 — LA GRAMÁTICA CANÓNICA (decisión founder): MASCOTA → QUÉ →
  // DÍA → HORA → QUIÉN → PAGAR. El paseo migra al patrón del grooming:
  // la mascota es el paso 0 y queda VISIBLE toda la reserva (rasgo 1);
  // el guard perro-only (§1bis) filtra ACÁ con voz honesta con camino.
  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  const [especies, setEspecies] = useState<string[] | null>(null);
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  // S61-A4: la CARA del para-quién — URLs firmadas (patrón del QUIÉN).
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [oferta, setOferta] = useState<OfertaPaseo[] | 'cargando' | 'error'>('cargando');
  const [duracion, setDuracion] = useState<number | null>(null);
  const [dia, setDia] = useState<string>(fechaLocalISO(new Date()));
  const [inicios, setInicios] = useState<string[] | 'cargando' | 'error'>('cargando');
  const [hora, setHora] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  // S73 (letra de elegibilidad): la frontera UNICA del motor decide —
  // momento vital primero (memorial/perdida NO reservan), especie después.
  // La pantalla jamás re-computa elegibilidad (Ley 37: el filtro artesanal murió).
  const elegibles = mascotasElegibles(Array.isArray(mascotas) ? mascotas : [], especies);

  const mascota = elegibles.find((m) => m.id === mascotaId) ?? null;

  // Con UNA elegible, se elige sola (cero fricción) — y el selector la
  // muestra igual: la mascota elegida PRESENTE en pantalla (rasgo 1).
  useEffect(() => {
    if (mascotaId === null && elegibles.length === 1) setMascotaId(elegibles[0].id);
  }, [elegibles, mascotaId]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerEspeciesElegibles('paseo').then((r) => {
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
      void obtenerOfertaPaseo().then((r) => {
        if (!vigente) return;
        setOferta(r.ok ? r.data : 'error');
        if (r.ok && r.data.length > 0) {
          // el bloque más corto ofertado arranca elegido
          const menor = Math.min(...r.data.map((o) => o.duracion_minutos));
          setDuracion((d) => d ?? menor);
        }
      });
      return () => {
        vigente = false;
      };
    }, []),
  );

  // Bloques del menú REALMENTE ofertados, con su precio mínimo.
  const bloques = useMemo<Bloque[]>(() => {
    if (!Array.isArray(oferta)) return [];
    const porDuracion = new Map<number, number[]>();
    for (const o of oferta) {
      const lista = porDuracion.get(o.duracion_minutos) ?? [];
      lista.push(o.precio);
      porDuracion.set(o.duracion_minutos, lista);
    }
    return [...porDuracion.entries()]
      .map(([d, precios]) => ({
        duracion: d,
        desde: Math.min(...precios),
        varia: new Set(precios).size > 1,
      }))
      .sort((a, b) => a.duracion - b.duracion);
  }, [oferta]);

  // Próximos 14 días (hoy+13) — la tira. `corta` = fecha corta SIEMPRE
  // (S61-A5 cura 1: el botón del día sin lugar dice la fecha real —
  // "Probar mié 15" — jamás un "Mañana" con mayúscula colada).
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

  // La grilla recalcula VIVA con cada cambio de día o duración.
  useEffect(() => {
    if (duracion === null || !Array.isArray(oferta) || oferta.length === 0) return;
    let vigente = true;
    setInicios('cargando');
    void obtenerIniciosPaseo({ fecha: dia, duracion_minutos: duracion }).then((r) => {
      if (!vigente) return;
      setInicios(r.ok ? r.data : 'error');
      if (r.ok) setHora((h) => (h !== null && r.data.includes(h) ? h : null));
    });
    return () => {
      vigente = false;
    };
  }, [dia, duracion, oferta, reintento]);

  const bloqueElegido = bloques.find((b) => b.duracion === duracion) ?? null;
  const listo = mascota !== null && duracion !== null && hora !== null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('explorar.paseoTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[5] }}>
        {oferta === 'cargando' || mascotas === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
            </View>
          </EsqueletoGrupo>
        ) : oferta === 'error' || mascotas === 'error' ? (
          <EstadoVacio
            titulo={t('explorar.paseadoresError')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('hogar.reintentar')}
                onPress={() => {
                  setOferta('cargando');
                  setMascotas('cargando');
                }}
              />
            }
          />
        ) : elegibles.length === 0 ? (
          // §1bis ACÁ (rasgo del patrón): el hogar sin perro no llega a
          // mitad de reserva — voz honesta CON camino, paso 0.
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('paquete.sinPerrosTitulo')}
            descripcion={t('paquete.sinPerrosDetalle')}
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
        ) : oferta.length === 0 ? (
          // Peldaño 0 — el vacío honesto que educa.
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('explorar.paseadoresVacio')}
            descripcion={t('explorar.paseadoresVacioDetalle')}
          />
        ) : (
          <>
            {/* 0 · LA MASCOTA — la gramática canónica (S61-A3): el
                para-quién abre y QUEDA VISIBLE (una sola = chip elegido;
                reuso declarado de la voz del grooming, Ley 17.3) */}
            <SelectorOpcion
              acento="control"
              // S73 — ENTITY CHIP (dictado founder, V2 provisional): la cara
              // es ANATOMÍA — overhang, lleno al elegir, cero borde.
              entidad
              etiqueta={t('grooming.paraQuien')}
              opciones={elegibles.map((m) => ({
                codigo: m.id,
                etiqueta: m.nombre,
                avatar: { nombre: m.nombre, fotoUrl: fotos[m.id] },
              }))}
              seleccionada={mascotaId ?? undefined}
              onSelect={setMascotaId}
            />

            {/* 1 · DURACIÓN — solo bloques ofertados de verdad */}
            <View style={{ gap: spacing[2] }}>
              <SelectorOpcion
              acento="control"
                etiqueta={t('explorar.cuandoDuracion')}
                disposicion="grilla"
                opciones={bloques.map((b) => ({ codigo: String(b.duracion), etiqueta: etiquetaBloque(b.duracion) }))}
                seleccionada={duracion !== null ? String(duracion) : undefined}
                onSelect={(codigo) => setDuracion(Number(codigo))}
              />
              {bloqueElegido !== null ? (
                <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                  {bloqueElegido.varia
                    ? t('explorar.cuandoDesde', { precio: bloqueElegido.desde.toFixed(2) })
                    : t('explorar.cuandoPrecio', { precio: bloqueElegido.desde.toFixed(2) })}
                  {bloqueElegido.duracion === 30 ? ` · ${t('explorar.cuandoSalidaBano')}` : ''}
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

            {/* 2b · GRILLA de inicios reales para ESA duración */}
            {inicios === 'cargando' ? (
              <EsqueletoGrupo>
                <Esqueleto forma="bloque" ancho="100%" alto={100} />
              </EsqueletoGrupo>
            ) : inicios === 'error' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('explorar.paseadoresError')}
                accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
              />
            ) : inicios.length === 0 ? (
              // §6ter (S61-A5 cura 1): el día sin lugar gana CAMINO
              // TOCABLE — avanza la tira al día siguiente. Decisión (b)
              // declarada: el motor es por-día (el "próximo día con
              // lugar" real costaría hasta 13 llamadas); el motor NO se
              // toca. En el último día de la tira, sin botón (honesto).
              <EstadoVacio
                registro="seccion"
                titulo={t('explorar.cuandoSinInicios')}
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

            {/* 4 · "Hacerlo frecuente" — el candado del plan MURIÓ (D-338,
                S56): el chip enciende el modo plan; la Hoja nace en el
                QUIÉN, con el paseador ELEGIDO (alcance v1 §6.1 v1.2). */}
            {/* S58 (adenda, Ley 19.1): la ENTRADA AL PLAN y al paquete son
                celdas de navegación CON ÍCONO — la celda dice a dónde va.
                No listas todavía: la misma anatomía sin navegación (el
                ícono se conserva por el slot de Celda). El PRECIO del plan
                del lado dueño sigue enterrado en la RPC del QUIÉN —
                enmienda propuesta al gate founder (ver reporte S58). */}
            <Tarjeta relleno="ninguno" elevacion="reposo">
              {listo ? (
                <CeldaNavegacion
                  icono="paseo"
                  titulo={t('plan.chip')}
                  detalle={t('plan.chipDetalle')}
                  onPress={() => {
                    router.push({
                      pathname: '/explorar/paseo/disponibles',
                      params: { fecha: dia, hora, duracion: String(duracion), plan: '1', mascotaId: mascota?.id ?? '' },
                    });
                  }}
                />
              ) : (
                <Celda inicio={<Icono nombre="paseo" />} titulo={t('plan.chip')} subtitulo={t('plan.chipElegiPrimero')} />
              )}
              <Separador />
              {/* 5 · el PAQUETE (v1.4 §6bis.2bis): comprar NO es reservar —
                  alcanza la DURACIÓN; el paseador se elige en su propia
                  pantalla, sin fecha ni hora. */}
              {duracion !== null ? (
                <CeldaNavegacion
                  icono="despensa"
                  titulo={t('paquete.chip')}
                  detalle={t('paquete.chipDetalle')}
                  onPress={() => {
                    router.push({
                      pathname: '/explorar/paseo/paquete',
                      params: { duracion: String(duracion) },
                    });
                  }}
                />
              ) : (
                <Celda inicio={<Icono nombre="despensa" />} titulo={t('paquete.chip')} subtitulo={t('paquete.chipElegiDuracion')} />
              )}
            </Tarjeta>
          </>
        )}
      </ScrollView>

      {/* S61-A3 (rasgo 2 del patrón): el CTA de reservar vive ABAJO,
          FIJO — fuera del scroll, una sola acción primaria (Ley 19.2). */}
      {Array.isArray(oferta) && oferta.length > 0 && elegibles.length > 0 ? (
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
              if (!listo) return;
              router.push({
                pathname: '/explorar/paseo/disponibles',
                params: { fecha: dia, hora, duracion: String(duracion), mascotaId: mascota.id },
              });
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
