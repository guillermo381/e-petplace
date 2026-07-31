/**
 * EL HUB DE ADIESTRAMIENTO DEL DUEÑO (S63-A Bloque 3, gemela del hub de
 * grooming S60-A4): entre el pago y la sesión, la cita tiene superficie.
 * Próximos · Historial (S82-C r31: FiltroPills — el eje convive con
 * otros de su familia y la gramática de la pantalla manda) — la cita futura
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
 *
 * S81 — LA BITÁCORA HABLA EL IDIOMA APROBADO (orden de mesa, sobre el
 * eje 19.8 firmado): el vocabulario (N=23) se muestra ENTERO en
 * SelectorOpcion estándar por grupo — murió el acordeón S65 (Celda
 * como encabezado plegable: anatomía que S71 mató — "plegar no es
 * navegar" — y chevron con gramática pre-S73). La densidad de los 23
 * se juzga EN DISPOSITIVO y se ajusta ahí (letra de la orden), no acá.
 * El filtro S65 sigue: reordena coincidencias PRIMERO dentro de cada
 * grupo (mostrar primero, no esconder — todo chip sigue alcanzable).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  CeldaNavegacion,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaCita,
  Hoja,
  HojaScroll,
  Icono,
  Insignia,
  Separador,
  SelectorOpcion,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
  useTraduccionUi,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerBitacora,
  obtenerMascotasDeFamilia,
  resolverUrlsFotos,
  obtenerMisAdiestramientos,
  obtenerVocabularioBitacora,
  registrarBitacoraFamilia,
  type AdiestramientoDelHogar,
  type ChipVocabularioAgrupado,
  type EntradaBitacora,
  type MascotaResumen,
} from '@epetplace/api';
import { fechaCortaMono } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';
import { FiltroMascotas, FiltroPills } from '@/components/filtro-pills';
import { esHistorial, esProxima } from '@/lib/corte-agenda';
import { DetalleCita } from '@/components/detalle-cita';

// §7 (S65) — matching compartido del vocabulario (el filtro de chips y
// el autocompletado del texto libre hablan IGUAL): minúsculas sin
// acentos, palabras de ≥4 letras.
const normalizarVoz = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
const palabrasDe = (s: string) =>
  normalizarVoz(s)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 4);
const vozDelChip = (v: ChipVocabularioAgrupado, idioma: string) =>
  normalizarVoz(idioma === 'en' ? v.nombre_familia_en : v.nombre_familia);

export default function HubAdiestramiento() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const { t: tUi } = useTraduccionUi();
  const { mostrar } = useAviso();

  // Ley 3 (voz FIRMADA S63, ui.programaEstado): mapa CERRADO estado→voz —
  // 'vencido' jamás se pinta crudo; desconocido = se omite, jamás el
  // código del motor.
  const vozEstadoPrograma = (estado: string | null): string | null => {
    switch (estado) {
      case 'activo':
        return tUi('programaEstado.activo');
      case 'completado':
        return tUi('programaEstado.completado');
      case 'vencido':
        return tUi('programaEstado.vencido');
      case 'cancelado':
        return tUi('programaEstado.cancelado');
      default:
        return null;
    }
  };
  const [vista, setVista] = useState<'proximos' | 'historial'>('proximos');
  const [citas, setCitas] = useState<AdiestramientoDelHogar[] | 'cargando' | 'error'>('cargando');
  const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  const [pidiendoMascota, setPidiendoMascota] = useState(false);
  const [fotosMascota, setFotosMascota] = useState<Map<string, string>>(new Map());
  const [abierta, setAbierta] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const cargar = useCallback(() => {
    setCitas('cargando');
    void obtenerMisAdiestramientos().then((r) => {
      setCitas(r.ok ? r.data : 'error');
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
      let vigente = true;
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente || !estado.ok || !estado.data.familia_id) return;
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente || !r.ok) return;
        setMascotas(r.data);
        // ⚠️ r43 · LAS FOTOS, AHORA SÍ. El lector trae `foto_url` (un PATH
        // del bucket privado), y pintarlo directo no muestra nada: hay que
        // pedir la URL FIRMADA. Sus tres hermanas lo hacen; ésta era la
        // única que no — y mi cura de r42 NUNCA ATERRIZÓ EN ESTE ARCHIVO
        // (el reemplazo falló en silencio y lo reporté por intención).
        const paths = r.data.map((m) => m.foto_url).filter((x): x is string => typeof x === 'string' && x.length > 0);
        if (paths.length === 0) return;
        const urls = await resolverUrlsFotos(paths);
        if (vigente) setFotosMascota(urls);
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

  // r39 · el corte por la FRONTERA — le faltaba el eje TIEMPO igual que
  // a sus dos hermanas. `cerrada` para adiestramiento = tiene parte.
  const cerradaA = (c: AdiestramientoDelHogar) => c.tiene_parte;
  const proximos = Array.isArray(citas) ? citas.filter((c) => esProxima(c.fecha, cerradaA(c))) : [];
  const historial = Array.isArray(citas)
    ? citas.filter((c) => esHistorial(c.fecha, cerradaA(c))).slice().reverse()
    : [];
  const visibles = vista === 'proximos' ? proximos : historial;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('adiestramiento.hubTitulo')} atras onAtras={() => router.back()} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[4] }}>

        {/* ① la MASCOTA — el PRIMER filtro (la pieza decide relleno vs
            barrido con L-b adentro). Entra SIN filtro: ninguna nace
            elegida. */}
        {mascotas.length > 1 ? (
          <View style={{ marginHorizontal: -spacing[4] }}>
            <FiltroMascotas
              mascotas={mascotas.map((m) => ({
                id: m.id,
                nombre: m.nombre,
                fotoUrl: m.foto_url !== null ? fotosMascota.get(m.foto_url) : undefined,
              }))}
              elegida={mascotaId}
              onElegir={(id) => {
                setMascotaId(id);
                if (id !== null) setPidiendoMascota(false);
              }}
            />
          </View>
        ) : null}
        {pidiendoMascota ? <Texto variante="apoyo" color="danger">{t('plan.elegiMascota')}</Texto> : null}

        {/* ✅ r33 · LA BITÁCORA SALIÓ DEL EJE — acceso propio, con la
            forma que el diccionario 19.1 le da a ENTRAR A UNA SECCIÓN:
            celda de navegación con glifo, título y chevron. Un control
            que filtra dos veces y navega la tercera enseña mal. */}
        {/* r34 · sobre superficie de tarjeta (venía sin fondo, flotando
            sobre la página) y con SU PROPIO glifo: B lo dibujó en r34 —
            hasta ayer pedía prestado el de VACUNA, que es la sustitución
            genérica que la Ley 12 prohíbe. */}
        <Tarjeta relleno="ninguno">
          <CeldaNavegacion
            icono="bitacora"
            titulo={t('adiestramiento.bitacoraTab')}
            detalle={t('adiestramiento.bitacoraAnotar')}
            onPress={() => router.push('/hogar/bitacora')}
          />
        </Tarjeta>

        {/* ② el ESTADO — FiltroPills, con `capa: null` (es ESTADO, no
            categoría: el color de capa pertenece a una CLASE DE SERVICIO,
            Ley 10, y este eje no tiene ninguna).

            ⚠️ HALLAZGO QUE DECLARO Y NO RESUELVO, porque es de producto:
            **este eje tiene TRES valores y el tercero no es un estado.**
            Próximos e Historial parten UN conjunto (las citas: las que
            vienen y las que pasaron); BITÁCORA es OTRO objeto entero —
            las observaciones que la familia registra, que no son citas y
            no tienen ni próximas ni pasadas. El eje no parte datos: en
            dos de sus posiciones filtra y en la tercera CAMBIA DE
            SUPERFICIE. Se conserva el comportamiento de hoy (no rompo lo
            que funciona por una lectura mía) y va al gate: si la bitácora
            es otra superficie, su lugar no es este eje. */}
        <View style={{ marginHorizontal: -spacing[4] }}>
          <FiltroPills
            activo={vista}
            onCambio={(v) => setVista(v)}
            opciones={[
              { codigo: 'proximos' as typeof vista, etiqueta: t('adiestramiento.hubProximos'), icono: 'hoy', capa: null },
              { codigo: 'historial' as typeof vista, etiqueta: t('adiestramiento.hubHistorial'), icono: 'training', capa: null },
            ]}
          />
        </View>

        {citas === 'cargando' ? (
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
          <View style={{ gap: spacing[2.5] }}>
            {visibles.map((c) => {
              // r34 · EL MISMO DISEÑO QUE LOS OTROS TRES: canto que pinta
              // la curva + despliegue en su lugar, UNA SOLA ABIERTA (dos
              // abiertas y el resumen deja de presidir). La identidad k
              // del programa sigue siendo estado PASIVO, jamás botón.
              const vozFinal =
                c.programa_estado !== null && c.programa_estado !== 'activo'
                  ? vozEstadoPrograma(c.programa_estado)
                  : null;
              const abierto = abierta === c.cita_id;
              const navegable = vista === 'historial' && c.tiene_parte;
              return (
                <FilaCita
                  key={c.cita_id}
                  oficio="adiestramiento"
                  // r41 · la variante + el criterio firmado: información
                  // DESPLIEGA. Esta fila no abre Hoja ni lleva: muestra
                  // su detalle en el lugar.
                  cara={false}
                  direccion={abierta === c.cita_id ? 'arriba' : 'abajo'}
                  titulo={c.mascota_nombre ?? t('adiestramiento.titulo')}
                  subtitulo={c.prestador_nombre ?? undefined}
                  metadataMono={`${fechaCortaMono(c.fecha, idioma)} · ${c.hora}`}
                  mascota={{ nombre: c.mascota_nombre ?? '' }}
                  fin={
                    c.sesion_numero !== null ? (
                      <Insignia
                        estado="info"
                        etiqueta={vozFinal ?? t('adiestramiento.sesionK', { k: String(c.sesion_numero) })}
                        tamaño="sm"
                      />
                    ) : undefined
                  }
                  acciones={
                    abierta === c.cita_id ? (
                      <DetalleCita
                        prestador={c.prestador_nombre}
                        costo={c.precio}
                        etiquetaPrestador={t('adiestramiento.paraQuien')}
                        etiquetaCosto={t('presupuesto.total')}
                        accion={
                          vista === 'historial' && c.tiene_parte
                            ? {
                                etiqueta: t('hogar.acordeonVerCompleto'),
                                onPress: () =>
                                  router.push({
                                    pathname: '/adiestramiento/[citaId]',
                                    params: { citaId: c.cita_id, mascotaNombre: c.mascota_nombre ?? '' },
                                  }),
                              }
                            : undefined
                        }
                      />
                    ) : undefined
                  }
                  onPress={() => setAbierta(abierta === c.cita_id ? null : c.cita_id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* r34 · AGENDAR baja al PIE FIJO, como los otros tres. Y con el
          CTA VIVO: apagado pero tocable, la razón señala la hilera, y la
          etiqueta nombra lo que falta además del hint (S63-B). Con UNA
          sola mascota se resuelve sola — la hilera no se monta con una. */}
      {(() => {
        const elegida = mascotas.find((m) => m.id === mascotaId) ?? (mascotas.length === 1 ? mascotas[0] : null);
        return (
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
              bloque
              etiqueta={elegida !== null ? t('adiestramiento.agendarDe', { nombre: elegida.nombre }) : t('plan.agendarFaltaMascota')}
              deshabilitado={elegida === null}
              razonDeshabilitado={t('plan.elegiMascota')}
              onRazon={() => {
                setPidiendoMascota(true);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              }}
              onPress={() => {
                if (elegida === null) return;
                router.navigate({ pathname: '/explorar/adiestramiento', params: { mascotaId: elegida.id } });
              }}
            />
          </View>
        );
      })()}

      {/* §7 — la Hoja de registro: chips + texto, guardar. Segundos,
          jamás un formulario. */}
    </SafeAreaView>
  );
}
