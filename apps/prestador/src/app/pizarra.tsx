/**
 * ⭐ S86-C · LA PIZARRA — las citas de tu especialidad SIN tratante
 * (lámina firmada del 4-ago). Superficie del PRESTADOR EMPLEADO.
 *
 * QUÉ ES: lo que el mostrador mandó a la pizarra a propósito (el chip de
 * `mostrador/atencion.tsx`) más lo que nació sin tratante.
 * `obtener_pizarra` ya filtra por ESPECIALIDAD con el predicado extraído
 * en S78 — acá no se inventa ningún filtro.
 *
 * ═══ LA DECISIÓN QUE GOBIERNA ESTA PANTALLA ══════════════════════════
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

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  MarcaDeAgua,
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

export default function Pizarra() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
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

  useFocusEffect(
    useCallback(() => {
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
    }, []),
  );

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
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('pizarra.titulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}
      >
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
                           verbo se pinta por el espejo del motor. */
                        <Boton
                          variante="secundario"
                          tamaño="sm"
                          etiqueta={t('pizarra.asignar')}
                          deshabilitado={asignando !== null}
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
                </View>
              );
            })}
          </Tarjeta>
        )}
      </ScrollView>

      {/* ⭐ S88-C · LA HOJA DEL VERBO — elegir quién atiende la huérfana.
          El día y el servicio de la cita presiden (contexto, no adorno);
          la lectura caída de personas SE DICE, jamás se disfraza de «no
          hay nadie» (L-197). */}
      <Hoja visible={asignando !== null} onCerrar={() => setAsignando(null)} titulo={t('pizarra.asignarQuien')}>
        {asignando !== null && (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="apoyo">
              {`${diaEnVoz(asignando.fecha)} ${asignando.hora.slice(0, 5)} · ${
                asignando.servicioVoz ?? t('pizarra.servicioSinVoz')
              } · ${asignando.mascotaNombre}`}
            </Texto>
            {personas === null ? (
              <EsqueletoGrupo>
                <View style={{ gap: spacing[2] }}>
                  <Esqueleto forma="linea" ancho="70%" />
                  <Esqueleto forma="linea" ancho="55%" />
                </View>
              </EsqueletoGrupo>
            ) : personas === 'error' ? (
              <Texto variante="apoyo" color="danger">{t('pizarra.asignarSinPersonas')}</Texto>
            ) : personas.length === 0 ? (
              <Texto variante="apoyo">{t('pizarra.asignarNadie')}</Texto>
            ) : (
              <SelectorOpcion
                etiqueta={t('pizarra.asignarQuien')}
                disposicion="tira"
                acento="oficio"
                opciones={personas.map((p) => ({
                  codigo: p.empleadoId,
                  /* `tieneJornada` INFORMA, no filtra (contrato del lector):
                     una cita ya pactada puede rutearse a quien no cargó
                     horario — se dice para que quien reparte decida
                     sabiendo. El nombre null cae al fallback digno. */
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
      </Hoja>
    </View>
  );
}
