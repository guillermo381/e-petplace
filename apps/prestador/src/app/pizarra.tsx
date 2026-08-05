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
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
  type AvatarMascotaEspecie,
} from '@epetplace/ui';
import {
  obtenerMiPrestador,
  obtenerPizarra,
  tomarCita,
  type CitaDePizarra,
  type CodigoErrorTomarCita,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; citas: CitaDePizarra[] };

/** Estado LOCAL de cada fila tras tocarla. `tomada` NO es lo mismo que
 *  `mia`: una la tomé yo, la otra me la ganaron — y la pantalla dice
 *  cosas distintas. Colapsarlas sería el silencio que la lámina prohíbe. */
type Resultado = 'mia' | 'tomada';

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
        const r = await obtenerPizarra(pr.data.id);
        if (!vigente) return;
        /* L-197 / Ley 13: «no pude leer» y «no hay nada» son DOS cosas.
           El wrapper ya las separa (una forma inesperada NO degrada a
           lista vacía) y acá se conserva esa distinción. */
        if (!r.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
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
    </View>
  );
}
