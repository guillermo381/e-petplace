/**
 * EL LOG DE VETERINARIA — el hub del oficio para el dueño (S82-A r9;
 * paga **D-493**, declarada desde S73: el rail vet navegaba a
 * `/citas/[mascotaId]` como destino prestado y en un hogar multi-mascota
 * aterrizaba en UNA sola).
 *
 * Replica el patrón que C fijó en el log del paseo (r12), con la
 * gramática de la casa: tres ejes con `FiltroPills` · el CTA vivo al pie
 * · la mascota filtrada VIAJANDO al agendar · `CantoCurva` sin banda de
 * color · el nulo honesto · el "desde" del precio.
 *
 * ── LA PREGUNTA DEL MANDATO, MEDIDA: ¿ES DISTINTO A PROPÓSITO O ES UN
 *    HUECO? **ES UN HUECO — pero con dos habitantes propios que el
 *    patrón del paseo no tiene, y por eso el patrón se adopta con
 *    diferencias declaradas, no calcado.**
 *
 * LO QUE LA MEDICIÓN DEVOLVIÓ (DB viva, 30-jul-2026):
 *  · **La cita vet es estructuralmente IDÉNTICA**: misma tabla, mismos
 *    estados (13 citas: 10 confirmada + 3 completada). Nada en su forma
 *    impedía el log — no había diseño distinto, había pantalla faltante.
 *  · **Habitante propio ①, el PRESUPUESTO** (4 vivos, los 4 aprobados):
 *    precede a la cita y es una DECISIÓN del dueño. No existe en paseo
 *    ni grooming. **NO se duplica acá**: su casa es "Ponte al día" del
 *    Hogar (S71), que es donde vive lo que espera respuesta. Duplicarlo
 *    sería pedirle al dueño que decida en dos lugares.
 *  · **Habitante propio ②, el CASO CLÍNICO** (2 vivos) — es el eje
 *    NATURAL del expediente vet ("cómo va la otitis", no "mostrame las
 *    vacunaciones"). **Y HOY NO SE DIBUJA, con su número:
 *    `caso_clinico_id` está en 0 de 13 citas** — el motor todavía no lo
 *    estampa al nacer la cita (nota viva desde S78). Un eje que
 *    devolvería 13 en "sin caso" y 0 en todo lo demás **no parte los
 *    datos, así que no se dibuja** (la regla del founder aplicada contra
 *    el eje que más me gustaba). El contrato ya lo trae para que el día
 *    que el motor lo estampe, agrupar no exija migrar nada.
 *  · **La cita puede nacer SIN FECHA** (`por_coordinar`, legal desde
 *    D-439 al aprobar un presupuesto): hoy 0 filas, pero el lector la
 *    admite y esta pantalla la PRESIDE — una cita que espera fecha es
 *    trabajo del dueño, no una fila más.
 *  · **Hay citas que el dueño NUNCA agendó**: las del MOSTRADOR (walk-in,
 *    S69) nacen en el negocio. Por eso el lector no exige
 *    `estado_reserva = 'pagada'` como el de grooming: ese filtro las
 *    borraría del hub de su propia mascota.
 *
 * EL EJE QUE SÍ PARTE — **TIPO DE CONSULTA, no duración** (el mandato
 * acertó y la medición lo sostiene): consulta general 8 · vacunación 3 ·
 * especializada 1 · procedimiento 1. La duración ni siquiera es del
 * dueño acá (la fija el negocio por menú curado, S68).
 *
 * CANTO: **SALUD** (`capa.identidad`) — el único de los cuatro oficios
 * que no es cuidado (Ley 10: paseo y adiestramiento comparten canto A
 * PROPÓSITO; grooming es cuidado; lo clínico es salud).
 */

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { fechaCortaMono } from '@epetplace/i18n';
import {
  getEstadoOnboardingDueno,
  obtenerMisConsultasVet,
  obtenerMascotasDeFamilia,
  resolverUrlsFotos,
  type ConsultaDelHogar,
} from '@epetplace/api';

import { CantoCurva } from '@/components/canto-curva';
import { FiltroMascotas, FiltroPills } from '@/components/filtro-pills';
import { vozServicio } from '@/lib/voz-servicio';
import { useTraduccion } from '@/i18n';

type Segmento = 'proximos' | 'historial';
type EjeTipo = 'todos' | string;

export default function LogVeterinaria() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();

  const [filas, setFilas] = useState<ConsultaDelHogar[] | 'cargando' | 'error'>('cargando');
  const [mascotas, setMascotas] = useState<{ id: string; nombre: string; fotoUrl?: string }[]>([]);
  // ① la MASCOTA — el PRIMER filtro (null = todas, sin chip activo)
  const [mascotaElegida, setMascotaElegida] = useState<string | null>(null);
  // ② el ESTADO
  const [segmento, setSegmento] = useState<Segmento>('proximos');
  // ③ el TIPO DE CONSULTA — solo en historial (ver abajo)
  const [tipo, setTipo] = useState<EjeTipo>('todos');

  const cargar = useCallback(() => {
    setFilas('cargando');
    void obtenerMisConsultasVet().then((r) => setFilas(r.ok ? r.data : 'error'));
    // las mascotas del hogar alimentan el PRIMER filtro — patrón de C en
    // el log del paseo, copiado al vecino (incluida la resolución de
    // fotos EN BATCH: una firma por foto sería N+1)
    void getEstadoOnboardingDueno().then(async (e) => {
      if (!e.ok || e.data.familia_id === null) return;
      const r = await obtenerMascotasDeFamilia(e.data.familia_id);
      if (!r.ok) return;
      const paths = r.data.map((m) => m.foto_url).filter((x): x is string => typeof x === 'string' && x.length > 0);
      const urls = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
      setMascotas(
        r.data.map((m) => ({
          id: m.id,
          nombre: m.nombre,
          fotoUrl: m.foto_url ? urls.get(m.foto_url) : undefined,
        })),
      );
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const lista = Array.isArray(filas) ? filas : [];
  const porMascota = mascotaElegida === null ? lista : lista.filter((c) => c.mascota_id === mascotaElegida);

  // "Próximos" incluye LO QUE ESPERA FECHA — una cita firme sin día es
  // trabajo pendiente del dueño, no historia.
  const proximos = porMascota.filter((c) => c.estado !== 'completada' && c.atencion_id === null);
  const historial = porMascota
    .filter((c) => c.atencion_id !== null || c.estado === 'completada')
    .sort((a, b) => ((a.fecha ?? '') > (b.fecha ?? '') ? -1 : 1));

  // El eje de TIPO se computa sobre lo que HAY en el historial: si un
  // solo tipo lo cubre entero, el eje no parte nada y NO se dibuja.
  const tiposPresentes = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of historial) m.set(c.tipo_servicio, vozServicio(t, c.tipo_servicio, c.servicio_nombre) ?? c.servicio_nombre);
    return [...m.entries()];
  }, [historial, t]);

  const historialFiltrado = tipo === 'todos' ? historial : historial.filter((c) => c.tipo_servicio === tipo);

  const cuando = (c: ConsultaDelHogar): string =>
    c.fecha === null
      ? t('logVet.esperaFecha') // el nulo honesto: no hay día, y se dice
      : `${fechaCortaMono(c.fecha, idioma)}${c.hora !== null ? ` · ${c.hora}` : ''}`;

  const subtitulo = (c: ConsultaDelHogar): string =>
    [c.mascota_nombre, c.prestador_nombre].filter(Boolean).join(' · ');

  const visibles = segmento === 'proximos' ? proximos : historialFiltrado;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('logVet.titulo')} atras onAtras={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[2],
          // el pie fijo no tapa la última fila
          paddingBottom: insets.bottom + spacing[20],
          gap: spacing[4],
        }}
      >
        {/* ① la MASCOTA — el primer filtro (con L-b adentro: la pieza de
            C decide relleno vs barrido según cuántos hermanos hay) */}
        {mascotas.length > 1 ? (
          <View style={{ marginHorizontal: -spacing[4] }}>
            <FiltroMascotas mascotas={mascotas} elegida={mascotaElegida} onElegir={setMascotaElegida} />
          </View>
        ) : null}

        {/* ② el ESTADO — sin capa: este eje no es una clase de servicio
            (Ley 10), así que no pide prestado ningún color */}
        <View style={{ marginHorizontal: -spacing[4] }}>
          <FiltroPills
            activo={segmento}
            onCambio={(c) => setSegmento(c)}
            opciones={[
              { codigo: 'proximos' as Segmento, etiqueta: t('plan.segProximos'), icono: 'hoy', capa: null },
              { codigo: 'historial' as Segmento, etiqueta: t('plan.segHistorial'), icono: 'veterinaria', capa: null },
            ]}
          />
        </View>

        {/* ③ el TIPO DE CONSULTA — SOLO en historial y SOLO si hay 2+
            tipos: con uno solo no parte los datos y no se dibuja. (El
            eje del CASO no se dibuja tampoco, y su porqué está medido en
            la cabecera: 0 de 13 citas lo tienen estampado.) */}
        {segmento === 'historial' && tiposPresentes.length > 1 ? (
          <View style={{ marginHorizontal: -spacing[4] }}>
            <FiltroPills
              activo={tipo}
              onCambio={(v) => setTipo(v)}
              opciones={[
                { codigo: 'todos', etiqueta: t('plan.filtroTodos'), icono: null, capa: null },
                ...tiposPresentes.map(([codigo, etiqueta]) => ({ codigo, etiqueta, icono: null, capa: null })),
              ]}
            />
          </View>
        ) : null}

        {filas === 'cargando' ? (
          <EsqueletoGrupo etiqueta={t('logVet.cargando')}>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : filas === 'error' ? (
          <EstadoVacio
            titulo={t('logVet.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : visibles.length === 0 ? (
          <EstadoVacio
            registro="seccion"
            icono={<Icono nombre="veterinaria" tamano={48} />}
            titulo={segmento === 'proximos' ? t('logVet.vacioProximos') : t('logVet.vacioHistorial')}
            descripcion={segmento === 'proximos' ? t('logVet.vacioProximosDetalle') : t('logVet.vacioHistorialDetalle')}
          />
        ) : (
          <View style={{ gap: spacing[2.5] }}>
            {visibles.map((c) => {
              const titulo = vozServicio(t, c.tipo_servicio, c.servicio_nombre) ?? c.servicio_nombre;
              const atencionId = c.atencion_id;
              return (
                // el CANTO es SALUD — el único de los cuatro oficios
                <CantoCurva key={c.cita_id} color={theme.capa.identidad}>
                  {/* `Celda` es unión discriminada: interactiva exige su
                      par onPress+role. Dos ramas explícitas, jamás un
                      spread condicional que rompa el discriminante —
                      solo la visita CERRADA tiene parte que abrir
                      (principio de la puerta: no se ofrece lo que no
                      lleva a ningún lado). */}
                  {atencionId !== null ? (
                    <Celda
                      titulo={titulo}
                      subtitulo={subtitulo(c)}
                      metadataMono={cuando(c)}
                      interactiva
                      accessibilityRole="button"
                      onPress={() => router.push({ pathname: '/paseo/[atencionId]', params: { atencionId } })}
                    />
                  ) : (
                    <Celda titulo={titulo} subtitulo={subtitulo(c)} metadataMono={cuando(c)} />
                  )}
                </CantoCurva>
              );
            })}
          </View>
        )}

        {/* EL "DESDE" — el precio de una consulta VARÍA por negocio y por
            tipo, así que acá jamás se afirma un número cerrado; la
            portada del oficio lo resuelve contra ofertas reales. */}
        {Array.isArray(filas) && visibles.length > 0 ? (
          <Texto variante="apoyo">{t('logVet.desdeNota')}</Texto>
        ) : null}
      </ScrollView>

      {/* EL CTA VIVO al pie, y LA MASCOTA FILTRADA VIAJA con él */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing[4],
          paddingTop: spacing[3],
          paddingBottom: insets.bottom + spacing[3],
          backgroundColor: theme.bg.base,
        }}
      >
        <Boton
          variante="primario"
          bloque
          etiqueta={t('logVet.agendar')}
          onPress={() =>
            router.navigate({
              pathname: '/explorar/veterinaria',
              ...(mascotaElegida !== null ? { params: { mascotaId: mascotaElegida } } : null),
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}
