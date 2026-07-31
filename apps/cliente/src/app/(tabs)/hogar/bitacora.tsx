/**
 * LA BITÁCORA DE LA FAMILIA (MODELO_ADIESTRAMIENTO §7) — SU PROPIA RUTA.
 *
 * S82-C r33 — POR QUÉ SE MUDÓ, que es lo que esta cabecera existe para
 * dejar escrito: vivía como TERCERA POSICIÓN del eje Próximos/Historial
 * del log, y ese eje no la podía contener. Próximos e Historial parten
 * UN conjunto —las citas: las que vienen y las que pasaron—; la bitácora
 * es OTRO OBJETO: observaciones que la familia registra, que no son
 * citas y no tienen ni próximas ni pasadas. Un control que en dos
 * posiciones FILTRA y en la tercera CAMBIA DE SUPERFICIE enseña mal:
 * el usuario aprende que ese control filtra, y una de cada tres veces
 * no filtra. Decisión del founder: se separa, no se arbitra.
 *
 * Y la separación paga de vuelta: con el conjunto otra vez UNO SOLO, los
 * ejes de mascota y fecha entran al log sin contradecirse.
 *
 * Registrar cuesta segundos: chips + texto, cero gamificación (sin
 * contador, sin racha — LOYALTY §5).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
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

export default function BitacoraFamilia() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();

  const [entradas, setEntradas] = useState<EntradaBitacora[] | 'cargando' | 'error'>('cargando');
  const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);
  const [vocabulario, setVocabulario] = useState<ChipVocabularioAgrupado[]>([]);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  const [chips, setChips] = useState<string[]>([]);
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState('');

  const cargar = useCallback(() => {
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

  const nombrePorMascota = useMemo(() => new Map(mascotas.map((m) => [m.id, m.nombre])), [mascotas]);
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

  // S65→S81 — el filtro rápido sobre los chips (MISMO matching que el
  // autocompletado): mientras hay palabras, las coincidencias van
  // PRIMERO dentro de su grupo (mostrar primero, no esconder: todo
  // chip sigue alcanzable). El auto-expandir murió con el acordeón.
  const palabrasFiltro = useMemo(() => palabrasDe(filtro), [filtro]);
  const filtrando = palabrasFiltro.length > 0;
  const gruposRender = useMemo(
    () =>
      gruposVocabulario.map((g) => {
        if (!filtrando) return { ...g, itemsRender: g.items };
        const con = g.items.filter((v) => {
          const voz = vozDelChip(v, idioma);
          return palabrasFiltro.some((p) => voz.includes(p));
        });
        if (con.length === 0) return { ...g, itemsRender: g.items };
        return { ...g, itemsRender: [...con, ...g.items.filter((v) => !con.includes(v))] };
      }),
    [gruposVocabulario, palabrasFiltro, filtrando, idioma],
  );

  const alternarChip = (codigo: string) =>
    setChips((prev) => (prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]));

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


  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('adiestramiento.bitacoraTab')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[4] }}>
        {/* §7 — registrar cuesta segundos, cero gamificación (LOYALTY §5) */}
        {
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
                      <Texto variante="dato" color="tertiary">
                        {`${nombrePorMascota.get(e.mascota_id)?.toLowerCase() ?? ''} · ${fechaCortaMono(e.created_at.slice(0, 10), idioma)}`}
                      </Texto>
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
                      {e.texto !== null ? <Texto variante="cuerpo">{e.texto}</Texto> : null}
                    </View>
                  </View>
                ))}
              </Tarjeta>
            </>
          )}
      </ScrollView>
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
            {/* S81 — el vocabulario ENTERO en el lenguaje aprobado: un
                SelectorOpcion estándar por grupo (grilla, multiple,
                tonal control — Ley 22), con la etiqueta PROPIA del
                componente como rótulo del grupo (Ley 18: el grupo es
                convención viva de DB). Los 23 a la vista; la densidad
                se juzga en dispositivo. */}
            {gruposRender.map((g) => (
              <SelectorOpcion
                key={g.clave}
                acento="control"
                etiqueta={g.etiqueta}
                disposicion="grilla"
                multiple
                opciones={g.itemsRender.map((v) => ({
                  codigo: v.codigo,
                  etiqueta: idioma === 'en' ? v.nombre_familia_en : v.nombre_familia,
                }))}
                seleccionadas={chips}
                onSelect={alternarChip}
              />
            ))}
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
    </View>
  );
}
