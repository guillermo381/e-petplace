/**
 * ⭐ S98-C · LA PIZARRA, AHORA HOJA SOBRE `ATENDER` (firma del founder,
 * opción (a)). **Consultar no es navegar.**
 *
 * ⏪ VIVÍA EN `/pizarra` COMO PANTALLA (S86-C) y la ruta MURIÓ con esta
 * mudanza — no queda una segunda superficie para lo mismo (Ley 37). Su
 * única entrada era la portada de `ATENDER`, medido antes de borrarla.
 *
 * ═══ POR QUÉ HOJA Y NO PANTALLA ══════════════════════════════════════
 * La pizarra se CONSULTA: mirar qué hay sin dueño y volver a lo que uno
 * estaba haciendo. Una pantalla te saca del lugar y te obliga a volver;
 * una Hoja se levanta sobre la portada y la deja debajo, a la vista.
 * *Navegar es para ir a otro lado; acá no se va a ningún lado.*
 *
 * ═══ 🔴 LA ASIGNACIÓN ES INLINE, Y LA HOJA INTERNA MURIÓ ═════════════
 * Hasta S88 elegir persona abría **una segunda Hoja sobre la primera**.
 * Con la pizarra ya siendo Hoja, eso sería **una Hoja sobre otra Hoja** —
 * un `Modal` dentro de un `Modal`, con dos gestos de cierre encimados y
 * un swipe que nadie sabe cuál de las dos se lleva.
 *
 * **La selección pasa ADENTRO de la fila**: al tocar «Asignar», la fila
 * se expande con su selector y su confirmar. Y el cambio se lleva algo
 * mejor que un problema técnico: *ahora la persona se elige VIENDO la
 * cita*, en vez de en una superficie aparte que tenía que repetirle el
 * contexto arriba. **Muere también esa línea de contexto duplicada** — la
 * fila que la abre ya dice el día, la hora, el servicio y la mascota.
 *
 * ═══ LOS DOS FLUJOS SON SECUENCIALES, POR DISEÑO (firma) ═════════════
 * Si en medio de una asignación entra un walk-in, el camino es **cerrar
 * la Hoja, hacer el alta, y volver a abrirla**. No se soporta tenerlas
 * las dos al mismo tiempo, y no es una limitación: *el mostrador atiende
 * a UNA persona por vez, y una superficie que finge dos manos le miente
 * a quien tiene una.*
 *
 * ═══ LA DECISIÓN QUE GOBIERNA ESTA SUPERFICIE ══════════════════════════
 * **«Tomar te la asigna al instante. Si alguien la tomó primero, la
 * pizarra te lo dice — nunca te la saca en silencio.»**
 *
 * `tomar_cita` es atómico y SOLO rellena NULL. Cuando otro llegó antes,
 * el motor hace `RAISE EXCEPTION 'ya_tomada'` con ERRCODE 23505 ⇒ **llega
 * como ERROR de PostgREST, no adentro del dato** (corrección de A sobre
 * mi propio pedido: yo había supuesto lo contrario porque la función
 * devuelve `jsonb`; el `jsonb` solo carga la forma del ÉXITO).
 * ⇒ La fila NO desaparece: se marca TOMADA, con su voz, y deja de
 * ofrecer el botón. *Sacarla sin decir nada es exactamente lo que la
 * lámina prohíbe — el usuario tocó algo y tiene derecho a saber qué pasó.*
 *
 * ⚠️ LA VOZ SALE DE ACÁ, NO DEL WRAPPER. `packages/api` no tiene capa de
 * idioma (D-539) y sus mensajes están en VOSEO («No tenés acceso»,
 * «Probá de nuevo»), mientras la voz de producto es TUTEO NEUTRO (regla
 * 27 · L-148). Se mapea el CÓDIGO a las keys de esta casa; `r.mensaje`
 * no se pinta nunca.
 */

import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  AvatarMascota,
  Boton,
  Celda,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  Separador,
  SelectorOpcion,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
  type AvatarMascotaEspecie,
} from '@epetplace/ui';
import {
  caraDeMascota,
  asignarCitaAPersona,
  obtenerMiPrestador,
  obtenerPersonasParaAsignar,
  obtenerPizarra,
  puedoAsignarCitas,
  tomarCita,
  type CitaDePizarra,
  type CodigoAsignacionCita,
  type CodigoErrorTomarCita,
  type PersonaParaAsignar,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; citas: CitaDePizarra[] };

/** Estado LOCAL de cada fila tras tocarla. `tomada` NO es lo mismo que
 *  `mia`: una la tomé yo, la otra me la ganaron — y la pantalla dice
 *  cosas distintas. Colapsarlas sería el silencio que la lámina prohíbe.
 *  ⭐ S88-C: `asignada` = recepción la ruteó a alguien — la fila SE QUEDA
 *  y lo dice (la decisión firmada de `ya_tomada`, mismo trato). */
type Resultado = 'mia' | 'tomada' | 'asignada';

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

export interface PizarraHojaProps {
  visible: boolean;
  onCerrar: () => void;
}

export function PizarraHoja({ visible, onCerrar }: PizarraHojaProps) {
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [resultados, setResultados] = useState<Map<string, Resultado>>(new Map());
  const [tomando, setTomando] = useState<string | null>(null);

  /* ⭐ S88-C (LÁMINA_HOME_POR_ROL punto 3/6) · EL VERBO DE RECEPCIÓN.
     `puedoAsignar` es el espejo del predicado del motor
     (`empleado_puede_asignar_citas`) y existe SOLO PARA PINTAR — el gate
     vive en `asignar_cita_a_persona` (una autorización que decide el
     cliente es decorativa). La Pizarra es LA CASA de las citas sin
     persona: el que puede tomar, toma; el que puede rutear, asigna. */
  const [puedoAsignar, setPuedoAsignar] = useState(false);
  /** La cita cuya Hoja de asignación está abierta. */
  const [asignando, setAsignando] = useState<CitaDePizarra | null>(null);
  /** ⏪ S88-C: el lector cambió a `obtenerPersonasParaAsignar` (pedido a A,
   *  contestado en 20260805260000) — POR CITA y espejando los gates ④/⑤
   *  byte a byte: la lista que la Hoja ofrece es la que el server acepta
   *  (Ley 23 SIN el límite declarado que traía el lector del vecino).
   *  null = sin pedir · 'error' = lectura caída (se dice, jamás «no hay
   *  nadie»). Se pide POR APERTURA: la lista depende de la cita. */
  const [personas, setPersonas] = useState<PersonaParaAsignar[] | 'error' | null>(null);
  const [personaElegida, setPersonaElegida] = useState<string | undefined>(undefined);
  const [confirmando, setConfirmando] = useState(false);

  /* ⏪ Era `useFocusEffect`: una Hoja no gana ni pierde FOCO de
     navegación — la pantalla de abajo lo conserva. Se lee AL ABRIR, que
     es el momento en que este contenido pasa a existir para quien mira.
     Y se relee en cada apertura a propósito: entre una y otra alguien del
     equipo pudo haber tomado una cita. */
  useEffect(() => {
      if (!visible) return;
      let vigente = true;
      void (async () => {
        const pr = await obtenerMiPrestador();
        if (!vigente) return;
        if (!pr.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const [r, pa] = await Promise.all([
          obtenerPizarra(pr.data.id),
          // el fallo del espejo NO tumba la pizarra: sin confirmación no
          // se pinta el verbo (Ley 23 — ante la duda, ausencia).
          puedoAsignarCitas(pr.data.id),
        ]);
        if (!vigente) return;
        /* L-197 / Ley 13: «no pude leer» y «no hay nada» son DOS cosas.
           El wrapper ya las separa (una forma inesperada NO degrada a
           lista vacía) y acá se conserva esa distinción. */
        if (!r.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPuedoAsignar(pa.ok && pa.data);
        setPantalla({ estado: 'listo', citas: r.data });
      })();
      return () => {
        vigente = false;
      };
  }, [visible]);

  /** El día en voz: hoy · mañana · el día corto. La pizarra mezcla
   *  fechas y sin esto todas las filas se leen igual. */
  function diaEnVoz(iso: string): string {
    const dia = iso.slice(0, 10);
    const [a, m, d] = dia.split('-').map(Number);
    if (!a || !m || !d) return dia;
    /* Fechas LOCALES por partes literales — jamás `new Date(iso)` ni
       `toISOString`, que corren el día en UTC-5 (D-312). */
    const hoy = new Intl.DateTimeFormat('en-CA').format(new Date());
    if (dia === hoy) return t('pizarra.hoy');
    const [ha, hm, hd] = hoy.split('-').map(Number);
    const manana = new Intl.DateTimeFormat('en-CA').format(
      new Date(ha ?? 0, (hm ?? 1) - 1, (hd ?? 1) + 1),
    );
    if (dia === manana) return t('pizarra.manana');
    return new Intl.DateTimeFormat(idioma === 'es' ? 'es' : 'en', { weekday: 'short' })
      .format(new Date(a, m - 1, d))
      .replace('.', '');
  }

  /** El CÓDIGO a la voz de esta casa — jamás `r.mensaje` (ver cabecera).
   *  ⚠️ `datos_inconsistentes` NO está en `CodigoErrorTomarCita` pero SÍ
   *  llega (lo agrega la frontera común del wrapper) — el typecheck lo
   *  cazó. Se NOMBRA en la firma en vez de ensanchar a `string`: con
   *  `string` el switch dejaría de ser exhaustivo y un código nuevo del
   *  motor entraría mudo por el default sin que nadie se entere. */
  function vozDelRebote(codigo: CodigoErrorTomarCita | 'datos_inconsistentes'): string {
    switch (codigo) {
      case 'ya_tomada':
        return t('pizarra.yaTomada');
      case 'cita_no_existe':
        return t('pizarra.yaNoEsta');
      case 'no_es_tu_especialidad':
        return t('pizarra.noEsTuEspecialidad');
      case 'no_sos_del_equipo':
        return t('pizarra.noSosDelEquipo');
      case 'sin_sesion':
        return t('sesion.sinSesion');
      default:
        return t('pizarra.noSePudo');
    }
  }

  async function tomar(cita: CitaDePizarra) {
    if (tomando !== null) return;
    setTomando(cita.citaId);
    const r = await tomarCita(cita.citaId);
    setTomando(null);
    if (r.ok) {
      setResultados((m) => new Map(m).set(cita.citaId, 'mia'));
      mostrar({ variante: 'exito', texto: t('pizarra.tuya', { nombre: cita.mascotaNombre }) });
      return;
    }
    /* ⚠️ ACÁ VIVE LA DECISIÓN FIRMADA: con `ya_tomada` la fila SE QUEDA y
       cambia de estado — nunca se saca en silencio. Con el resto, el
       aviso habla y la fila queda como estaba (se puede reintentar). */
    if (r.codigo === 'ya_tomada') {
      setResultados((m) => new Map(m).set(cita.citaId, 'tomada'));
    }
    mostrar({ variante: 'error', texto: vozDelRebote(r.codigo) });
  }

  /** Abre la Hoja de una cita; las personas se piden POR CITA (el lector
   *  es per-cita: espeja los gates del motor, incluido el chip). */
  function abrirAsignar(cita: CitaDePizarra) {
    setPersonaElegida(undefined);
    setPersonas(null);
    setAsignando(cita);
    void obtenerPersonasParaAsignar(cita.citaId).then((r) => {
      setPersonas(r.ok ? r.data : 'error');
    });
  }

  async function confirmarAsignar() {
    if (asignando === null || personaElegida === undefined || confirmando) return;
    setConfirmando(true);
    const r = await asignarCitaAPersona(asignando.citaId, personaElegida);
    setConfirmando(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: vozAsignar(r.codigo) });
      // `cita_ya_asignada` = alguien llegó antes: la fila se queda y lo
      // dice (misma decisión firmada que `ya_tomada`).
      if (r.codigo === 'cita_ya_asignada') {
        setResultados((m) => new Map(m).set(asignando.citaId, 'tomada'));
        setAsignando(null);
      }
      return;
    }
    const nombre =
      personas !== null && personas !== 'error'
        ? (personas.find((p) => p.empleadoId === personaElegida)?.nombre ??
          t('recepcion.personaFallback'))
        : t('recepcion.personaFallback');
    setResultados((m) => new Map(m).set(asignando.citaId, 'asignada'));
    setAsignando(null);
    mostrar({ variante: 'exito', texto: t('pizarra.asignada', { nombre }) });
  }

  /** Voz por código del verbo asignar — los tres esperables con voz
   *  propia; el resto cae al genérico digno (Ley 3, cero códigos). */
  function vozAsignar(codigo: CodigoAsignacionCita): string {
    switch (codigo) {
      case 'rol_sin_asignacion':
        return t('pizarra.asignarSinRol');
      case 'cita_ya_asignada':
        return t('pizarra.laTomaron');
      case 'persona_sin_oficio':
        return t('pizarra.asignarSinOficio');
      default:
        return t('pizarra.noSePudo');
    }
  }

  const citas = pantalla.estado === 'listo' ? pantalla.citas : [];

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={t('pizarra.titulo')} altura="media">
      <HojaScroll>
        <View style={{ gap: spacing[4] }}>
        <Texto variante="apoyo">{t('pizarra.subtitulo')}</Texto>

        {pantalla.estado === 'cargando' && (
          <Tarjeta elevacion="plana">
            <EsqueletoGrupo>
              <View style={{ gap: spacing[4] }}>
                {[0, 1].map((i) => (
                  <View key={i} style={{ gap: spacing[2] }}>
                    <Esqueleto forma="linea" ancho="55%" />
                    <Esqueleto forma="linea" ancho="35%" />
                  </View>
                ))}
              </View>
            </EsqueletoGrupo>
          </Tarjeta>
        )}

        {pantalla.estado === 'error' && (
          <EstadoVacio
            titulo={t('pizarra.errorTitulo')}
            descripcion={t('pizarra.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('agenda.reintentar')}
                onPress={() => setPantalla({ estado: 'cargando' })}
              />
            }
          />
        )}

        {/* La vacía DICE lo que pasa, y es buena noticia: no es un fracaso
            (§2.6), es que todo tiene dueño. */}
        {pantalla.estado === 'listo' && citas.length === 0 && (
          <EstadoVacio titulo={t('pizarra.vacia')} />
        )}

        {pantalla.estado === 'listo' && citas.length > 0 && (
          <Tarjeta elevacion="sm" relleno="ninguno">
            {citas.map((c, i) => {
              const res = resultados.get(c.citaId);
              return (
                <View key={c.citaId} style={{ opacity: res === 'tomada' ? 0.6 : 1 }}>
                  {i > 0 && <Separador />}
                  <Celda
                    titulo={`${diaEnVoz(c.fecha)} ${c.hora.slice(0, 5)} · ${
                      /* Ley 3: `servicioVoz` es nullable de verdad y el
                         código de motor JAMÁS se pinta. Sin voz, genérico
                         digno. */
                      c.servicioVoz ?? t('pizarra.servicioSinVoz')
                    }`}
                    subtitulo={c.mascotaNombre}
                    inicio={
                      <AvatarMascota
                        nombre={c.mascotaNombre}
                        especie={esEspecie(c.mascotaEspecie) ? c.mascotaEspecie : undefined}
                        /* ⭐ S98-C · LA CARA (D-806). Sin esto la pizarra
                           dibuja la huella genérica para TODAS — el defecto
                           que el founder vio navegando.
                           🔴 `especie` sola NO alcanza y hay que saberlo:
                           `AvatarMascota` la declara pero **no la usa en el
                           render** —es reserva de D-288 desde S44—, así que
                           las pantallas venían pasándola creyendo que hacía
                           algo. Lo que sí pinta es `fotoUrl`, y por eso la
                           cara se resuelve ACÁ AFUERA y se le entrega ya
                           hecha: *la pieza no aprende de buckets.*
                           `razaSlug: null` es DELIBERADO — ningún lector
                           del prestador trae el slug del catálogo, y una
                           URL armada de un texto libre acierta a veces y
                           el resto muestra la cara de otra raza. Con null
                           va el genérico de la especie, que siempre es
                           cierto. Y si el objeto no existiera, el `onError`
                           de la pieza devuelve la huella. */
                        fotoUrl={
                          caraDeMascota({ especie: c.mascotaEspecie, razaSlug: null }) ?? undefined
                        }
                        tamano="sm"
                      />
                    }
                    fin={
                      res === 'mia' ? (
                        <Texto variante="dato">{t('pizarra.esTuya')}</Texto>
                      ) : res === 'tomada' ? (
                        /* La fila SE QUEDA y lo dice — nunca desaparece
                           sin explicación (decisión firmada). */
                        <Texto variante="dato">{t('pizarra.laTomaron')}</Texto>
                      ) : res === 'asignada' ? (
                        <Texto variante="dato">{t('pizarra.asignadaFila')}</Texto>
                      ) : puedoAsignar ? (
                        /* ⭐ S88-C: quien RUTEA no toma — recepción no tiene
                           chips y «Tomar» le rebotaría seguro (Ley 23). El
                           verbo se pinta por el espejo del motor.
                           ⭐ S98-C: abre la asignación ADENTRO de esta fila.
                           El botón se apaga mientras SU propia fila está
                           abierta —no mientras hay otra abierta—: abrir la
                           de al lado cierra ésta, que es lo que uno espera
                           de un acordeón. */
                        <Boton
                          variante="secundario"
                          tamaño="sm"
                          etiqueta={t('pizarra.asignar')}
                          deshabilitado={asignando?.citaId === c.citaId}
                          onPress={() => abrirAsignar(c)}
                        />
                      ) : (
                        <Boton
                          variante="secundario"
                          tamaño="sm"
                          etiqueta={t('pizarra.tomar')}
                          cargando={tomando === c.citaId}
                          deshabilitado={tomando !== null && tomando !== c.citaId}
                          onPress={() => void tomar(c)}
                        />
                      )
                    }
                  />
                  {/* ⭐ S98-C · LA ASIGNACIÓN, INLINE — acá vivía la
                      apertura de una segunda Hoja (S88-C), y con la
                      pizarra ya siendo Hoja habría sido un `Modal` dentro
                      de otro. **Y la mudanza mejora lo que hacía:** la
                      persona se elige VIENDO la cita —la fila de arriba
                      dice día, hora, servicio y mascota—, así que muere
                      también la línea de contexto que la Hoja tenía que
                      repetir. */}
                  {asignando?.citaId === c.citaId && (
                    <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4], gap: spacing[3] }}>
                      {personas === null ? (
                        <EsqueletoGrupo>
                          <View style={{ gap: spacing[2] }}>
                            <Esqueleto forma="linea" ancho="70%" />
                            <Esqueleto forma="linea" ancho="55%" />
                          </View>
                        </EsqueletoGrupo>
                      ) : personas === 'error' ? (
                        /* La lectura caída SE DICE, jamás se disfraza de
                           «no hay nadie» (L-197). */
                        <Texto variante="apoyo" color="danger">{t('pizarra.asignarSinPersonas')}</Texto>
                      ) : personas.length === 0 ? (
                        <Texto variante="apoyo">{t('pizarra.asignarNadie')}</Texto>
                      ) : (
                        <SelectorOpcion
                          etiqueta={t('pizarra.asignarQuien')}
                          disposicion="columnas"
                          acento="oficio"
                          opciones={personas.map((p) => ({
                            codigo: p.empleadoId,
                            /* `tieneJornada` INFORMA, no filtra (contrato
                               del lector): una cita ya pactada puede
                               rutearse a quien no cargó horario — se dice
                               para que quien reparte decida sabiendo. */
                            etiqueta: `${p.nombre ?? t('recepcion.personaFallback')}${
                              p.tieneJornada ? '' : ` · ${t('pizarra.sinJornada')}`
                            }`,
                          }))}
                          seleccionada={personaElegida}
                          onSelect={setPersonaElegida}
                        />
                      )}
                      <Boton
                        etiqueta={t('pizarra.asignarConfirmar')}
                        bloque
                        cargando={confirmando}
                        deshabilitado={personaElegida === undefined}
                        onPress={() => void confirmarAsignar()}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </Tarjeta>
        )}
        </View>
      </HojaScroll>
    </Hoja>
  );
}
