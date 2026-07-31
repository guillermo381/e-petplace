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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
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
import { FiltroPills } from '@/components/filtro-pills';

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
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[4] }}>
        <Boton
          variante="primario"
          bloque
          etiqueta={t('adiestramiento.agendar')}
          onPress={() => router.push('/explorar/adiestramiento')}
        />

        {/* ✅ r33 · LA BITÁCORA SALIÓ DEL EJE — acceso propio, con la
            forma que el diccionario 19.1 le da a ENTRAR A UNA SECCIÓN:
            celda de navegación con glifo, título y chevron. Un control
            que filtra dos veces y navega la tercera enseña mal. */}
        <CeldaNavegacion
          icono="carnet"
          titulo={t('adiestramiento.bitacoraTab')}
          detalle={t('adiestramiento.bitacoraAnotar')}
          onPress={() => router.push('/hogar/bitacora')}
        />

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
          <Tarjeta relleno="ninguno">
            {visibles.map((c, i) => {
              // la identidad k del programa (§1) — estado pasivo,
              // jamás botón (Ley 19.4). Mientras la matrícula está EN
              // MARCHA el chip dice la sesión (el estado no agrega —
              // Chanel); cuando el programa terminó, el chip dice su
              // destino con la voz firmada (ui.programaEstado).
              const vozFinal =
                c.programa_estado !== null && c.programa_estado !== 'activo'
                  ? vozEstadoPrograma(c.programa_estado)
                  : null;
              const fin =
                c.sesion_numero !== null ? (
                  <Insignia
                    estado="info"
                    etiqueta={vozFinal ?? t('adiestramiento.sesionK', { k: String(c.sesion_numero) })}
                  />
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
    </SafeAreaView>
  );
}
