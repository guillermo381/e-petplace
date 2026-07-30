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
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  spacing,
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
import { CabezalOficio, DiaSinHorarios, GrillaElegir, PieReserva, SelectorDia } from '@/components/reserva-piezas';

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
  // r12-5: la mascota LLEGA ELEGIDA del log (param). El estado local
  // queda para el salvavidas del deep-link sin param.
  const { mascotaId: mascotaParam } = useLocalSearchParams<{ mascotaId?: string }>();
  const [mascotaId, setMascotaId] = useState<string | null>(
    typeof mascotaParam === 'string' && mascotaParam.length > 0 ? mascotaParam : null,
  );
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

  // r11 · el pie SOLO existe si hay algo que totalizar (tercera ley de
  // la lámina). Sin bloque elegido o sin horas del día, NO SE MONTA.
  const hayHoras = Array.isArray(inicios) && inicios.length > 0;
  const pieVive = bloqueElegido !== null && hayHoras;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* r14-6 · LA BANDA DE COLOR MURIÓ (decisión del founder mirando,
          dos rondas después de haber firmado cuál de las dos bandas
          ganaba). En su lugar, el cabezal: glifo del oficio + isotipo
          teñido + label. El desvío de Ley 4 y el retiro del precio
          duplicado están declarados en la pieza. */}
      <CabezalOficio
        oficio="paseo"
        titulo={t('explorar.agendaPaseos')}
        detalle={mascota !== null ? mascota.nombre : null}
        onAtras={() => router.back()}
        insetTop={insets.top}
      />

      <ScrollView contentContainerStyle={{ paddingTop: spacing[5], paddingBottom: spacing[8], gap: spacing[5] }}>
        {oferta === 'cargando' || mascotas === 'cargando' ? (
          <View style={{ paddingHorizontal: spacing[4] }}>
            <EsqueletoGrupo>
              <View style={{ gap: spacing[3] }}>
                <Esqueleto forma="bloque" ancho="100%" alto={56} />
                <Esqueleto forma="bloque" ancho="100%" alto={56} />
                <Esqueleto forma="bloque" ancho="100%" alto={120} />
              </View>
            </EsqueletoGrupo>
          </View>
        ) : oferta === 'error' || mascotas === 'error' ? (
          <View style={{ paddingHorizontal: spacing[4] }}>
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
          </View>
        ) : elegibles.length === 0 ? (
          <View style={{ paddingHorizontal: spacing[4] }}>
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
          </View>
        ) : oferta.length === 0 ? (
          <View style={{ paddingHorizontal: spacing[4] }}>
            <EstadoVacio
              icono={<Icono nombre="paseo" tamano={48} />}
              titulo={t('explorar.paseadoresVacio')}
              descripcion={t('explorar.paseadoresVacioDetalle')}
            />
          </View>
        ) : (
          <>
            {/* r12-5: EL PASO DE ELEGIR MASCOTA MURIÓ del camino normal
                — viene elegida del LOG (param) y el techo la muestra: un
                dato elegido no se vuelve a preguntar (Ley 23).
                ⚠️ HALLAZGO r12-11, declarado al verificar: sobrevive
                para DOS casos reales, no uno.
                  ① deep-link sin param.
                  ② EL VACÍO DEL LOG — un hogar sin ningún paseo muestra
                    su EstadoVacio y NO tiene hilera de mascotas; su CTA
                    "Explorar" entra acá sin param, y ahí preguntar es lo
                    correcto: la puerta pregunta lo que NO sabe (Ley 23
                    por su otra cara), y ahí sí parte los datos.
                O sea: en el gate, el paso NO debe aparecer viniendo de
                Agendar (que ya nunca se dispara sin mascota) pero SÍ
                aparece —y debe— viniendo del log vacío. */}
            {mascota === null ? (
              <View style={{ paddingHorizontal: spacing[4] }}>
                <SelectorOpcion
                  acento="control"
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
              </View>
            ) : null}

            {/* 1 · DURACIÓN — r14-4: SALE de `SelectorOpcion` y pasa a
                la MISMA grilla que la hora.
                EL PORQUÉ, en dos capas y las dos medidas:
                 ① `SelectorOpcion` dibuja el elegido con BORDE en el
                   acento — contorno magenta. A6 (SIN CAJA) lo prohíbe y
                   el founder lo rechazó cuatro veces; el borde vive en
                   el componente compartido, así que la cura no es
                   tocarlo (lo consumen veinte pantallas) sino no usarlo
                   para este trabajo.
                 ② Y el relleno tampoco: son CINCO bloques ofertados
                   —hermanos comparables— y L-b veta el pleno de 4 en
                   adelante. Acá corrijo mi propia r11: declaré
                   `naturaleza="existe"` como la solución "por ley", y
                   la 19.8 dice QUÉ se rellena mientras L-b dice CUÁNTO.
                   Leí la primera y me salteé la segunda.
                Queda lo que las dos leyes dejan en pie: elevación,
                escala y color de texto — la voz de su vecina la hora. */}
            <View style={{ gap: spacing[2] }}>
              <View style={{ paddingHorizontal: spacing[5] }}>
                <Texto variante="apoyo">{t('explorar.cuandoDuracion')}</Texto>
              </View>
              <GrillaElegir
                voz="sans"
                opciones={bloques.map((b) => ({ codigo: String(b.duracion), etiqueta: etiquetaBloque(b.duracion) }))}
                elegida={duracion !== null ? String(duracion) : null}
                onElegir={(codigo) => setDuracion(Number(codigo))}
              />
              {bloqueElegido !== null && bloqueElegido.duracion === 30 ? (
                <View style={{ paddingHorizontal: spacing[5] }}>
                  <Texto variante="apoyo">{t('explorar.cuandoSalidaBano')}</Texto>
                </View>
              ) : null}
            </View>

            {/* 2 · EL DÍA — RIEL o RUEDA (D3) por el switch. Ni relleno
                ni contorno: ELEVACIÓN + ESCALA + COLOR DE TEXTO (son
                catorce hermanos comparables — L-b).
                🔴 DÍAS CERRADOS: el dato NO EXISTE en el motor (medido
                por las dos pistas). No se pinta: todos nacen tocables y
                el nulo honesto de abajo sostiene el caso. La prop
                `cerrados` está lista para el lector cuando A lo dé. */}
            <View style={{ gap: spacing[2] }}>
              <View style={{ paddingHorizontal: spacing[5] }}>
                <Texto variante="apoyo">{t('explorar.cuandoDia')}</Texto>
              </View>
              <SelectorDia
                dias={dias.map((d) => ({ iso: d.iso, dia: d.corta.split(' ')[0] ?? '', numero: d.iso.slice(8, 10) }))}
                elegido={dia}
                onElegir={setDia}
              />
            </View>

            {/* 3 · LA HORA — misma gramática (elevación/escala/color) */}
            {inicios === 'cargando' ? (
              <View style={{ paddingHorizontal: spacing[4] }}>
                <EsqueletoGrupo>
                  <Esqueleto forma="bloque" ancho="100%" alto={100} />
                </EsqueletoGrupo>
              </View>
            ) : inicios === 'error' ? (
              <View style={{ paddingHorizontal: spacing[4] }}>
                <EstadoVacio
                  registro="seccion"
                  titulo={t('explorar.paseadoresError')}
                  accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setReintento((n) => n + 1)} />}
                />
              </View>
            ) : inicios.length === 0 ? (
              /* EL NULO HONESTO (tercera ley): dice que no hay, dice POR
                 QUÉ, ofrece la salida — jamás ocho celdas tachadas. Y el
                 PIE DESAPARECE (no hay total de algo que no existe). */
              <DiaSinHorarios
                titulo={t('explorar.cuandoSinInicios')}
                porque={t('explorar.cuandoSinIniciosPorque')}
                etiquetaSalida={diaSiguiente !== null ? t('explorar.sinIniciosProbarDia', { dia: diaSiguiente.corta }) : null}
                onSalida={() => {
                  if (diaSiguiente !== null) setDia(diaSiguiente.iso);
                }}
              />
            ) : (
              <View style={{ gap: spacing[2] }}>
                <View style={{ paddingHorizontal: spacing[5] }}>
                  <Texto variante="apoyo">{t('explorar.cuandoHora')}</Texto>
                </View>
                <GrillaElegir
                  opciones={inicios.map((h) => ({ codigo: h, etiqueta: h }))}
                  elegida={hora}
                  onElegir={setHora}
                />
              </View>
            )}

            {/* 4-5 · PLAN y PAQUETE — su ubicación es LETRA FIRMADA
                (P14 · §6bis.2bis: comprar ≠ reservar). Declarado en la
                auditoría r9 y NO tocado: moverlos es decisión de
                producto, va al gate. */}
            <View style={{ paddingHorizontal: spacing[4] }}>
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
                {duracion !== null ? (
                  <CeldaNavegacion
                    icono="despensa"
                    titulo={t('paquete.chip')}
                    detalle={t('paquete.chipDetalle')}
                    onPress={() => {
                      router.push({ pathname: '/explorar/paseo/paquete', params: { duracion: String(duracion) } });
                    }}
                  />
                ) : (
                  <Celda inicio={<Icono nombre="despensa" />} titulo={t('paquete.chip')} subtitulo={t('paquete.chipElegiDuracion')} />
                )}
              </Tarjeta>
            </View>
          </>
        )}
      </ScrollView>

      {/* EL PIE — el ÚNICO relleno pleno de la pantalla es su CTA, y va
          EN EL SLOT (Boton primario resuelve accent.cta): no se pinta
          acá; el ocre entra por token cuando el founder lo firme.
          DESAPARECE cuando no hay qué totalizar (tercera ley). */}
      {Array.isArray(oferta) && oferta.length > 0 && elegibles.length > 0 && pieVive ? (
        <PieReserva
          total={bloqueElegido !== null ? `$ ${bloqueElegido.desde.toFixed(2)}` : null}
          totalDesde={bloqueElegido?.varia ?? false}
          cuando={hora !== null ? `${dias.find((d) => d.iso === dia)?.corta ?? ''} · ${hora}` : null}
          etiqueta={t('explorar.verQuienPuede')}
          habilitado={listo}
          onPress={() => {
            if (!listo) return;
            router.push({
              pathname: '/explorar/paseo/disponibles',
              params: { fecha: dia, hora, duracion: String(duracion), mascotaId: mascota.id },
            });
          }}
          insetBottom={insets.bottom}
        />
      ) : null}
    </View>
  );
}
