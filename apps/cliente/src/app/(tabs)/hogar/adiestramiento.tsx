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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import Svg, { Path } from 'react-native-svg';
import { fechaCortaMono } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';

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

// El chevron del acordeón (glifo de la casa, CeldaNavegacion §19.1):
// affordance decorativa en text.tertiary — el canal semántico es el rol
// button del header. Rota a "abajo" cuando el grupo está abierto; giro
// por reemplazo directo, sin animación (patrón D-385).
function ChevronAcordeon({ abierto, color }: { abierto: boolean; color: string }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ transform: [{ rotate: abierto ? '90deg' : '0deg' }] }}
    >
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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
  const [vista, setVista] = useState<'proximos' | 'historial' | 'bitacora'>('proximos');
  const [citas, setCitas] = useState<AdiestramientoDelHogar[] | 'cargando' | 'error'>('cargando');
  // §7 — la bitácora
  const [entradas, setEntradas] = useState<EntradaBitacora[] | 'cargando' | 'error'>('cargando');
  const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);
  const [vocabulario, setVocabulario] = useState<ChipVocabularioAgrupado[]>([]);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  const [chips, setChips] = useState<string[]>([]);
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  // S65 (gate founder): el acordeón de grupos — todos nacen CERRADOS;
  // el set de abiertos es memoria MANUAL del usuario (vista, jamás
  // persiste). El filtro no la pisa: al vaciarse, vuelve lo que el
  // usuario dejó tocado.
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState('');

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

  // §7 (S65) — los chips se agrupan por la convención VIVA de DB: las
  // conductas son su propio catálogo; los objetivos, el nivel que el
  // currículum ya les asigna. Grupo vacío no se monta (Ley 18: la
  // sección existe solo si existe para el usuario).
  const gruposVocabulario = useMemo(() => {
    const definiciones: Array<{ clave: string; etiqueta: string; pertenece: (v: ChipVocabularioAgrupado) => boolean }> = [
      { clave: 'casa', etiqueta: t('adiestramiento.bitacoraGrupoCasa'), pertenece: (v) => v.tipo === 'conducta' },
      { clave: 'basico', etiqueta: t('adiestramiento.bitacoraGrupoBasico'), pertenece: (v) => v.tipo === 'objetivo' && v.nivel === 'basico' },
      { clave: 'medio', etiqueta: t('adiestramiento.bitacoraGrupoMedio'), pertenece: (v) => v.tipo === 'objetivo' && v.nivel === 'medio' },
      { clave: 'experto', etiqueta: t('adiestramiento.bitacoraGrupoExperto'), pertenece: (v) => v.tipo === 'objetivo' && v.nivel === 'experto' },
      { clave: 'otros', etiqueta: t('adiestramiento.bitacoraGrupoOtros'), pertenece: (v) => v.tipo === 'objetivo' && v.nivel === null },
    ];
    return definiciones
      .map((d) => ({ clave: d.clave, etiqueta: d.etiqueta, items: vocabulario.filter(d.pertenece) }))
      .filter((g) => g.items.length > 0);
  }, [vocabulario, t]);

  // §7 (S65) — el texto libre autocompleta sobre el vocabulario VIGENTE
  // (jamás propone vocabulario nuevo): las palabras escritas se comparan
  // sin acentos contra la voz de familia del idioma activo.
  const sugerencias = useMemo(() => {
    // palabras de ≥4 letras del texto entero: "cuando salimos lloró"
    // sugiere "Lloró cuando salimos" aunque la frase no coincida literal
    const palabras = palabrasDe(texto);
    if (palabras.length === 0) return [];
    // ranking por palabras coincidentes: una palabra común ("cuando")
    // no desplaza a la coincidencia específica dentro del tope de 4
    return vocabulario
      .map((v) => {
        const voz = vozDelChip(v, idioma);
        return { v, puntaje: palabras.filter((p) => voz.includes(p)).length };
      })
      .filter((s) => s.puntaje > 0)
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, 4)
      .map((s) => s.v);
  }, [texto, vocabulario, idioma]);

  // S65 — el filtro rápido sobre los chips (MISMO matching que el
  // autocompletado): mientras hay palabras, (a) solo los grupos con
  // coincidencia se auto-expanden, (b) adentro las coincidencias van
  // PRIMERO (mostrar primero, no esconder: todo chip sigue alcanzable).
  const palabrasFiltro = useMemo(() => palabrasDe(filtro), [filtro]);
  const filtrando = palabrasFiltro.length > 0;
  const gruposRender = useMemo(
    () =>
      gruposVocabulario.map((g) => {
        if (!filtrando) return { ...g, itemsRender: g.items, coincide: false };
        const con = g.items.filter((v) => {
          const voz = vozDelChip(v, idioma);
          return palabrasFiltro.some((p) => voz.includes(p));
        });
        if (con.length === 0) return { ...g, itemsRender: g.items, coincide: false };
        return { ...g, itemsRender: [...con, ...g.items.filter((v) => !con.includes(v))], coincide: true };
      }),
    [gruposVocabulario, palabrasFiltro, filtrando, idioma],
  );

  const alternarChip = (codigo: string) =>
    setChips((prev) => (prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]));

  const alternarGrupo = (clave: string) =>
    setAbiertos((prev) => {
      const n = new Set(prev);
      if (n.has(clave)) n.delete(clave);
      else n.add(clave);
      return n;
    });

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
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[4] }}>
        <Boton
          variante="primario"
          bloque
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
            {/* S65 (gate founder) — el filtro rápido: busca ENTRE los
                chips existentes (el texto libre de abajo es otra cosa:
                narra lo que ningún chip cubre). */}
            <Campo
              label={t('adiestramiento.bitacoraFiltroLabel')}
              placeholder={t('adiestramiento.bitacoraFiltroPlaceholder')}
              value={filtro}
              onChangeText={setFiltro}
            />
            {/* S65 (gate founder) — el ACORDEÓN: cada grupo nace
                cerrado (nombre + contador); filtrando, solo los grupos
                con coincidencia se abren. Patrón D-385: header tocable
                + render condicional, sin animación. */}
            <Tarjeta relleno="ninguno">
              {gruposRender.map((g, i) => {
                const abierto = filtrando ? g.coincide : abiertos.has(g.clave);
                const marcadas = g.items.filter((v) => chips.includes(v.codigo)).length;
                return (
                  <View key={g.clave}>
                    {i > 0 ? <Separador /> : null}
                    <Celda
                      interactiva
                      onPress={() => alternarGrupo(g.clave)}
                      accessibilityRole="button"
                      titulo={`${g.etiqueta} (${g.items.length})`}
                      subtitulo={marcadas > 0 ? t('adiestramiento.bitacoraGrupoMarcadas', { n: String(marcadas) }) : undefined}
                      fin={<ChevronAcordeon abierto={abierto} color={theme.text.tertiary} />}
                    />
                    {abierto ? (
                      <View style={{ paddingHorizontal: spacing[3], paddingBottom: spacing[3] }}>
                        <SelectorOpcion
                          acento="control"
                          etiqueta={g.etiqueta}
                          etiquetaVisible={false}
                          disposicion="grilla"
                          multiple
                          opciones={g.itemsRender.map((v) => ({
                            codigo: v.codigo,
                            etiqueta: idioma === 'en' ? v.nombre_familia_en : v.nombre_familia,
                          }))}
                          seleccionadas={chips}
                          onSelect={alternarChip}
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </Tarjeta>
            <Campo
              label={t('adiestramiento.bitacoraTextoLabel')}
              placeholder={t('adiestramiento.bitacoraTextoPlaceholder')}
              value={texto}
              onChangeText={setTexto}
              multilinea={3}
            />
            {sugerencias.length > 0 ? (
              // el autocompletado: mismo gesto de selección que los
              // grupos (marcar/desmarcar el chip del catálogo)
              <SelectorOpcion
                acento="control"
                etiqueta={t('adiestramiento.bitacoraSugerencias')}
                disposicion="grilla"
                multiple
                opciones={sugerencias.map((v) => ({
                  codigo: v.codigo,
                  etiqueta: idioma === 'en' ? v.nombre_familia_en : v.nombre_familia,
                }))}
                seleccionadas={chips}
                onSelect={alternarChip}
              />
            ) : null}
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
