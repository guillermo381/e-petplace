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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
  coincidenciasPrimero,
  spacing,
  sugerir,
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
// S91-B — LA IMPLEMENTACIÓN SUBIÓ A `@epetplace/ui` (`sugerencias.ts`)
// porque el alta de mascota necesita el MISMO matching para la RAZA: se
// GENERALIZA, no se clona (§6 del método). Los DEFAULTS de la pieza son
// los que esta pantalla tenía, así que su conducta no cambió — hay un
// fixture de REGRESIÓN que lo prueba sobre el vocabulario VIVO
// (`scripts/verify-sugerencias.ts`, brazo ①: implementa la versión vieja
// verbatim y exige salida idéntica).
//
// Lo único que queda acá es la VOZ —qué texto del chip se compara, que
// depende del idioma—, y queda a propósito: §6 firma que se comparte la
// FORMA y jamás la voz. La pieza normaliza adentro, así que esto ya no
// normaliza: devuelve el literal.
const vozDelChip = (v: ChipVocabularioAgrupado, idioma: string) =>
  idioma === 'en' ? v.nombre_familia_en : v.nombre_familia;

export default function BitacoraFamilia() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();

  const [entradas, setEntradas] = useState<EntradaBitacora[] | 'cargando' | 'error'>('cargando');
  /** Las tres fases, como en `paseo/index.tsx` (P0 reabierto, 9-ago): era
   *  `useState<MascotaResumen[]>([])` y el fallo se degradaba a lista vacía
   *  en silencio. Ver la nota en el efecto de abajo. */
  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  /** La lista, ya resuelta a array para los usos de lectura. Se calcula UNA
   *  vez: repetir `Array.isArray(...) ? ... : []` en cada uso es la clase de
   *  copia que después diverge. */
  const listaMascotas = Array.isArray(mascotas) ? mascotas : [];
  /** Re-dispara la lectura del hogar al tocar «Reintentar» — sin esto el
   *  botón solo pondría el estado en `cargando` y nadie volvería a pedir. */
  const [reintento, setReintento] = useState(0);
  const [vocabulario, setVocabulario] = useState<ChipVocabularioAgrupado[]>([]);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  // S91-C · LA BITÁCORA NACE SABIENDO (letra madre del founder). Cuando
  // se entra DESDE EL PERFIL, la mascota llega en la ruta y el contexto
  // se HEREDA: la pantalla no vuelve a preguntar lo que el perfil ya
  // sabía. Entrando por adiestramiento (sin param) se comporta como
  // siempre — la entrada vieja no se rompe.
  const { mascotaId: mascotaDeRuta } = useLocalSearchParams<{ mascotaId?: string }>();
  const conContexto = typeof mascotaDeRuta === 'string' && mascotaDeRuta.length > 0;
  const [mascotaId, setMascotaId] = useState<string | null>(
    conContexto ? mascotaDeRuta : null,
  );
  const [chips, setChips] = useState<string[]>([]);
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState('');

  /**
   * 🔴 S91 · GATE — LA BITÁCORA MEZCLABA MASCOTAS, y la causa medida es ésta.
   *
   * `obtenerBitacora(mascotaId?)` SÍ filtra —`if (mascotaId !== undefined) q =
   * q.eq('mascota_id', mascotaId)`, línea 230 de su wrapper—; **la pantalla
   * nunca le pasaba el id.** Sin argumento, el lector devuelve las últimas 30
   * entradas de TODA la familia, y la pantalla las pintaba enteras cualquiera
   * fuera la mascota elegida. El defecto era del llamador, no del lector.
   *
   * Y el filtro tiene que ir A LA CONSULTA, no al arreglo ya traído: el
   * `limit(30)` es de la QUERY. Filtrando después, una mascota con entradas
   * más viejas que las últimas treinta de la casa se quedaría sin las suyas —
   * la misma pantalla se vería «vacía» y sería mentira.
   *
   * `cargar` depende de `mascotaId` a propósito: cambiar de mascota RE-CONSULTA.
   * Antes su lista de dependencias estaba vacía y por eso, aunque el id hubiera
   * viajado, la consulta no se repetía.
   */
  const cargar = useCallback(() => {
    if (mascotaId === null) {
      // Sin mascota resuelta no se pide «todo»: se pide NADA. Mostrar las
      // entradas de la casa mientras el selector está en blanco es
      // exactamente el bug que este comentario explica.
      setEntradas([]);
      return;
    }
    setEntradas('cargando');
    void obtenerBitacora(mascotaId).then((r) => {
      setEntradas(r.ok ? r.data : 'error');
    });
  }, [mascotaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
      let vigente = true;
      void (async () => {
        /* ☠️ LOS DOS `return` MUDOS, curados (P0 reabierto, 9-ago).
           Eran idénticos a los del último paso del paseo —misma forma, mismo
           archivo de origen— y tenían el mismo modo de falla: si la lectura
           del hogar fallaba, `mascotas` se quedaba en `[]` **sin decir nada**
           y sin reintento. Acá el daño es más callado que en el paseo: el
           selector de mascota simplemente no aparece, y la persona escribe su
           bitácora sin saber a quién se la está anotando.
           `!vigente` se separa del fallo real: irse de la pantalla no es un
           error y no debe pintar uno. */
        const estado = await getEstadoOnboardingDueno();
        if (!vigente) return;
        if (!estado.ok || !estado.data.familia_id) {
          setMascotas('error');
          return;
        }
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente) return;
        if (!r.ok) {
          setMascotas('error');
          return;
        }
        setMascotas(r.data);
        // ⚠️ EL VOCABULARIO SE PIDE DESPUÉS DE CONOCER A LA MASCOTA, y ése
        // es el punto entero: los chips llegan YA FILTRADOS por especie y
        // sujeto desde la puerta única (contrato de A,
        // `FiltroVocabularioBitacora`). El filtro NO se hace acá — si
        // viviera en la pantalla, la próxima superficie que lea el
        // catálogo volvería a mostrarlo entero.
        //
        // Sin mascota resuelta se pide SIN filtro, que en ese contrato
        // significa «no filtres» y no «todas las especies»: la pantalla
        // todavía no sabe de quién habla, y filtrar por una especie
        // adivinada sería peor que no filtrar.
        const suya = r.data.find((m) => m.id === mascotaId);
        const voc = await obtenerVocabularioBitacora(
          suya ? { especie: suya.especie, sujeto: suya.sujeto } : undefined,
        );
        if (vigente && voc.ok) setVocabulario(voc.data);
      })();
      return () => {
        vigente = false;
      };
      // `reintento` en las deps A PROPÓSITO: es lo que vuelve a disparar la
      // lectura del hogar cuando la persona toca «Reintentar».
    }, [cargar, mascotaId, reintento]),
  );

  // con UNA mascota, elegida sola (cero fricción). Con contexto de ruta
  // ya viene elegida y este efecto no tiene nada que hacer.
  useEffect(() => {
    if (mascotaId === null && listaMascotas.length === 1) setMascotaId(listaMascotas[0].id);
  }, [mascotas, mascotaId]);

  const nombrePorMascota = useMemo(() => new Map(listaMascotas.map((m) => [m.id, m.nombre])), [mascotas]);
  // §7 (S65) — los chips se agrupan por la convención VIVA de DB: las
  // conductas son su propio catálogo; los objetivos, el nivel que el
  // currículum ya les asigna. Grupo vacío no se monta (Ley 18: la
  // sección existe solo si existe para el usuario).
  /** El SUJETO de la mascota elegida — `MascotaResumen` lo trae (A lo sirvió
   *  con la cláusula del pez). Decide qué vocabulario tiene sentido ofrecer. */
  const sujetoActivo = useMemo(
    () => listaMascotas.find((m) => m.id === mascotaId)?.sujeto,
    [mascotas, mascotaId],
  );

  const gruposVocabulario = useMemo(() => {
    const definiciones: Array<{ clave: string; etiqueta: string; pertenece: (v: ChipVocabularioAgrupado) => boolean }> = [
      { clave: 'casa', etiqueta: t('adiestramiento.bitacoraGrupoCasa'), pertenece: (v) => v.tipo === 'conducta' },
      // 🔴 S91 · GATE DEL ACUARIO — **LA CONDICIÓN PROVISORIA SE RETIRÓ ACÁ**,
      // y su retiro es la mitad que faltaba de la cura.
      //
      // El síntoma: un acuario ofrecía «Camina pegado a tu paso». La causa
      // medida NO fue la que se sospechaba —no había seed viejo ni lista
      // inline; el catálogo de CONDUCTAS ya estaba universalizado—, sino el
      // OTRO catálogo del mismo wrapper: `cat_objetivos_adiestramiento` se
      // traía SIN filtro porque **no tenía columnas de aplicabilidad**, y sus
      // 23 filas de adiestramiento canino caían enteras sobre cualquier
      // sujeto. La pantalla lo tapó con una condición local, DECLARADA como
      // parcial y con su condición de muerte escrita: *el día que el catálogo
      // tenga aplicabilidad, esto se retira porque el filtro va a vivir en la
      // puerta.*
      //
      // Ese día llegó (S91-A, `20260808070000`). Medido antes de retirar:
      // `obj_acuario=0` **y `obj_gato=0`** — el cierre de A es más ancho que
      // el pedido, porque cubre también el caso general que mi parche dejaba
      // abierto (un gato sin programa veía los mismos 23). **Un filtro que
      // sobrevive a la puerta que lo hizo innecesario es una segunda frontera
      // esperando divergir** (Ley 37): el día que la mesa firme objetivos para
      // otro sujeto, la condición local los seguiría escondiendo y las dos
      // capas seguirían compilando.
      { clave: 'basico', etiqueta: t('adiestramiento.bitacoraGrupoBasico'), pertenece: (v) => v.tipo === 'objetivo' && v.nivel === 'basico' },
      { clave: 'medio', etiqueta: t('adiestramiento.bitacoraGrupoMedio'), pertenece: (v) => v.tipo === 'objetivo' && v.nivel === 'medio' },
      { clave: 'experto', etiqueta: t('adiestramiento.bitacoraGrupoExperto'), pertenece: (v) => v.tipo === 'objetivo' && v.nivel === 'experto' },
      { clave: 'otros', etiqueta: t('adiestramiento.bitacoraGrupoOtros'), pertenece: (v) => v.tipo === 'objetivo' && v.nivel === null },
    ];
    return definiciones
      .map((d) => ({ clave: d.clave, etiqueta: d.etiqueta, items: vocabulario.filter(d.pertenece) }))
      .filter((g) => g.items.length > 0);
  }, [vocabulario, t, sujetoActivo]);

  // §7 (S65) — el texto libre autocompleta sobre el vocabulario VIGENTE
  // (jamás propone vocabulario nuevo): las palabras escritas se comparan
  // sin acentos contra la voz de familia del idioma activo. "cuando
  // salimos lloró" sugiere "Lloró cuando salimos" aunque la frase no
  // coincida literal. Los defaults de la pieza (mínimo 4 · contiene ·
  // tope 4) son los que esta pantalla siempre tuvo: se omiten porque
  // escribirlos acá invitaría a "afinarlos" desde una pantalla.
  const sugerencias = useMemo(
    () => sugerir(vocabulario, { texto, vozDe: (v) => vozDelChip(v, idioma) }),
    [texto, vocabulario, idioma],
  );

  // S65→S81 — el filtro rápido sobre los chips (MISMO matching que el
  // autocompletado): mientras hay palabras, las coincidencias van
  // PRIMERO dentro de su grupo (mostrar primero, no esconder: todo
  // chip sigue alcanzable). El auto-expandir murió con el acordeón.
  const gruposRender = useMemo(
    () =>
      gruposVocabulario.map((g) => ({
        ...g,
        itemsRender: coincidenciasPrimero(g.items, {
          texto: filtro,
          vozDe: (v) => vozDelChip(v, idioma),
        }),
      })),
    [gruposVocabulario, filtro, idioma],
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
            {/* El selector SOLO cuando hay algo que elegir Y nadie lo
                eligió ya: entrando desde el perfil, preguntar «¿de quién?»
                sería pedir un dato que la pantalla anterior ya tenía en
                la mano (Ley 23 — la puerta no pregunta lo que sabe). */}
            {listaMascotas.length > 1 && !conContexto ? (
              <SelectorOpcion
                acento="control"
                etiqueta={t('adiestramiento.paraQuien')}
                opciones={listaMascotas.map((m) => ({ codigo: m.id, etiqueta: m.nombre }))}
                seleccionada={mascotaId ?? undefined}
                onSelect={setMascotaId}
              />
            ) : null}
            {/* 🔴 P0 reabierto (9-ago) — LA LECTURA DEL HOGAR FALLÓ, y se dice.
                Antes esto no existía: el selector simplemente **no se
                dibujaba**, y la persona escribía su bitácora sin saber a quién
                se la anotaba. La voz no culpa a las mascotas —dice que el dato
                no llegó— y ofrece reintentar sin salir de la pantalla. */}
            {mascotas === 'error' && !conContexto ? (
              <EstadoVacio
                titulo={t('paquete.misMascotasErrorTitulo')}
                descripcion={t('paquete.misMascotasErrorDetalle')}
                accion={
                  <Boton
                    variante="secundario"
                    etiqueta={t('hogar.reintentar')}
                    onPress={() => {
                      setMascotas('cargando');
                      setReintento((n) => n + 1);
                    }}
                  />
                }
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
