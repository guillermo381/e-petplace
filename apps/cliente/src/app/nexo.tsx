/**
 * ⭐ **NEXO HABLA** (S113-C · 2.0 · C1).
 *
 * La misma caja hace dos cosas y **no le pregunta a la familia cuál**: el
 * router de D decide si lo que escribió es una búsqueda o una pregunta al
 * expediente. *Pedirle que elija «buscar» o «preguntar» sería mudarle a ella
 * una decisión que el sistema puede tomar solo.*
 *
 * ── EL REPARTO, medido en la fuente de D (`functions/coach/index.ts`) ───────
 *   ① memorial   → 404 · **cero modelo**
 *   ② router     → busqueda | dato | narrativa | fuera
 *   ③ dato       → PLANTILLA con el dato · **cero redacción**
 *   ④ narrativa  → modelo sobre el contexto + la memoria
 *
 * 🔴 **`intencion: 'busqueda'` vuelve con `respuesta: null`, y no es un fallo.**
 * La edge **no busca**: buscar es leer datos de la familia y eso pasa por la
 * puerta única con la sesión de quien pregunta — *hacerlo en la edge con
 * `service_role` sería reimplementar la RLS adentro de una edge de IA*. Así que
 * acá, con esa intención, se llama a `buscarEnMiFamilia`.
 *
 * ⚠️ **Memorial: esta pantalla no existe.** No se atenúa: la fila que lleva acá
 * tampoco se dibuja, y si alguien llega igual, se va con la voz serena de la
 * casa (`A3.9`).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Campo,
  ChipsSugerencia,
  Encabezado,
  EstadoVacio,
  EvitaTeclado,
  PanelMemoria,
  RespuestaNexo,
  ResultadosBusqueda,
  Texto,
  spacing,
  useAviso,
  type GrupoResultados,
  type SugerenciaNexo,
  type TipoResultado,
} from '@epetplace/ui';
import {
  agregarMemoriaCoach,
  borrarMemoriaCoach,
  buscarEnMiFamilia,
  editarMemoriaCoach,
  guardarTurnoCoach,
  leerHiloCoach,
  listarMemoriaCoach,
  obtenerContextoCoach,
  preguntarANexo,
  type ContextoCoach,
  type HechoDeMemoria,
  type ResultadoBusqueda,
  type TurnoCoach,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';

/** Un turno dibujado. El hilo mezcla **lo que se guardó** (viene del servidor)
 *  con **lo que acaba de pasar**, y por eso el id es local: dos fuentes en una
 *  lista necesitan una llave que no dependa de ninguna de las dos. */
type Linea = {
  id: string;
  rol: 'familia' | 'nexo';
  texto: string;
  hora: string;
  primera?: boolean;
  escalarAVet?: boolean;
  /** De dónde salió, para la fila «de su carnet» que abre el dato. */
  deDondeRuta?: string;
  deDondeVoz?: string;
};

const hora = () =>
  new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

export default function Nexo() {
  const { t } = useTraduccion();
  const router = useRouter();
  const aviso = useAviso();
  const { mascotaId, nombre } = useLocalSearchParams<{ mascotaId: string; nombre?: string }>();

  const [contexto, setContexto] = useState<ContextoCoach | null | 'error'>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [memoria, setMemoria] = useState<readonly HechoDeMemoria[]>([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [grupos, setGrupos] = useState<readonly GrupoResultados[] | null>(null);
  const [termino, setTermino] = useState('');
  const scroll = useRef<ScrollView | null>(null);

  /* Contexto + hilo + memoria al abrir. **El hilo se lee**, no se empieza en
     blanco: una conversación que se olvida cada vez no es una conversación. */
  useEffect(() => {
    if (mascotaId === undefined) return;
    let vivo = true;
    void (async () => {
      const [c, h, m] = await Promise.all([
        obtenerContextoCoach(mascotaId),
        leerHiloCoach(mascotaId),
        listarMemoriaCoach(mascotaId),
      ]);
      if (!vivo) return;
      setContexto(c.ok ? c.data : 'error');
      if (h.ok) {
        setLineas(
          h.data.map((x: TurnoCoach) => ({
            id: `s${x.turno}`,
            rol: x.rol,
            texto: x.texto,
            hora: new Date(x.creado_en).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
          })),
        );
      }
      if (m.ok) setMemoria(m.data);
    })();
    return () => {
      vivo = false;
    };
  }, [mascotaId]);

  const enviar = useCallback(
    async (loQueDijo: string) => {
      const q = loQueDijo.trim();
      if (mascotaId === undefined || q === '' || pensando) return;
      setTexto('');
      setGrupos(null);
      const mio: Linea = { id: `l${Date.now()}`, rol: 'familia', texto: q, hora: hora() };
      setLineas((xs) => [...xs, mio]);
      setPensando(true);

      const r = await preguntarANexo(mascotaId, q);
      setPensando(false);
      if (!r.ok) {
        /* 🔴 **El memorial NO es un error y no se pinta como tal.** La edge lo
           devuelve con su voz; acá se muestra y se sale. */
        aviso.mostrar({ variante: r.codigo === 'memorial' ? 'neutro' : 'error', texto: r.mensaje });
        if (r.codigo === 'memorial') router.back();
        return;
      }

      /* El turno de la familia se guarda igual — también cuando la respuesta
         viene de una plantilla y no tocó modelo. */
      void guardarTurnoCoach(mascotaId, 'familia', q);

      if (r.data.intencion === 'busqueda') {
        const c = r.data.consulta ?? q;
        setTermino(c);
        const b = await buscarEnMiFamilia(c);
        if (!b.ok) {
          aviso.mostrar({ variante: 'error', texto: b.mensaje });
          return;
        }
        setGrupos(agrupar(b.data.resultados, router, t));
        return;
      }

      const dijo = r.data.respuesta;
      if (dijo === null || dijo.trim() === '') {
        aviso.mostrar({ variante: 'error', texto: t('nexo.sinRespuesta') });
        return;
      }
      setLineas((xs) => [
        ...xs,
        {
          id: `n${Date.now()}`,
          rol: 'nexo',
          texto: dijo,
          hora: hora(),
          /* 🔴 El aviso de IA lo decide **el servidor** (`aviso_ia`), no la
             pantalla: si lo contara la app, cambiar de dispositivo lo volvería
             a mostrar o —peor— dejaría de mostrarlo cuando corresponde. */
          primera: r.data.avisoIa,
          escalarAVet: r.data.escalarAVet,
          /* La fuente sale de la plantilla que respondió: *«de su carnet» sin
             saber de cuál carnet no abre nada, y una fuente que no lleva a
             ningún lado es una etiqueta.* */
          ...rutaDeFuente(r.data.plantilla, mascotaId, t),
        },
      ]);
      void guardarTurnoCoach(mascotaId, 'nexo', dijo);
    },
    [mascotaId, pensando, aviso, router, t],
  );

  if (contexto === 'error') {
    return (
      <View style={{ flex: 1 }}>
        <Encabezado variante="navegacion" titulo={t('nexo.titulo')} />
        <EstadoVacio titulo={t('nexo.sinContexto')} descripcion={t('nexo.sinContextoDetalle')} />
      </View>
    );
  }

  /* Tres chips que salen del CONTEXTO, no de una lista fija: si no tiene peso
     no se le ofrece preguntar por su peso. */
  const sugerencias: readonly SugerenciaNexo[] =
    contexto === null
      ? []
      : ([
          /* 🔴 **Cada chip cuelga del dato que la pregunta necesita.** Medido
             contra el tipo real de A: el plan vacunal viaja como lista y la
             salud como objeto, así que se pregunta por lo que hay, no por un
             campo que yo hubiera querido que existiera. *Ofrecer «¿cómo va su
             peso?» a una mascota que nunca se pesó es prometer una respuesta
             que no tenemos.* */
          contexto.plan_vacunal.length > 0
            ? { id: 'vac', texto: t('nexo.sugVacuna'), onPress: () => void enviar(t('nexo.sugVacuna')) }
            : null,
          typeof contexto.salud.peso_kg === 'number'
            ? { id: 'peso', texto: t('nexo.sugPeso'), onPress: () => void enviar(t('nexo.sugPeso')) }
            : null,
          { id: 'etapa', texto: t('nexo.sugEtapa'), onPress: () => void enviar(t('nexo.sugEtapa')) },
        ].filter((x) => x !== null) as SugerenciaNexo[]);

  return (
    <EvitaTeclado>
      <View style={{ flex: 1 }}>
        <Encabezado variante="navegacion" titulo={nombre ?? t('nexo.titulo')} />
        <ScrollView
          ref={scroll}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
        >
          {lineas.length === 0 && grupos === null ? (
            <Texto variante="apoyo">{t('nexo.invitacion', { nombre: nombre ?? '' })}</Texto>
          ) : null}

          {lineas.map((l) =>
            l.rol === 'familia' ? (
              <View key={l.id} style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
                <Texto variante="cuerpo">{l.texto}</Texto>
              </View>
            ) : l.primera === true ? (
              <RespuestaNexo
                key={l.id}
                primera
                notaIA={t('nexo.avisoIa')}
                texto={l.texto}
                hora={l.hora}
                autor={t('nexo.autor')}
                fuente={
                  l.deDondeRuta !== undefined && l.deDondeVoz !== undefined
                    ? { voz: l.deDondeVoz, onPress: () => router.push(l.deDondeRuta as never) }
                    : undefined
                }
                onVerVet={l.escalarAVet === true ? () => router.push('/explorar/veterinaria' as never) : undefined}
                vozVerVet={l.escalarAVet === true ? t('nexo.verVet') : undefined}
              />
            ) : (
              <RespuestaNexo
                key={l.id}
                texto={l.texto}
                hora={l.hora}
                autor={t('nexo.autor')}
                fuente={
                  l.deDondeRuta !== undefined && l.deDondeVoz !== undefined
                    ? { voz: l.deDondeVoz, onPress: () => router.push(l.deDondeRuta as never) }
                    : undefined
                }
                onVerVet={l.escalarAVet === true ? () => router.push('/explorar/veterinaria' as never) : undefined}
                vozVerVet={l.escalarAVet === true ? t('nexo.verVet') : undefined}
              />
            ),
          )}

          {grupos !== null ? (
            <ResultadosBusqueda
              termino={termino}
              grupos={grupos}
              vacio={{
                voz: t('nexo.sinResultados', { termino }),
                vozChip: t('nexo.preguntarIgual'),
                onPreguntar: () => void enviar(termino),
              }}
            />
          ) : null}

          {sugerencias.length > 0 && lineas.length === 0 ? (
            <ChipsSugerencia sugerencias={sugerencias} />
          ) : null}

          {/* «Lo que sé de {{mascota}}» — editable, porque **la memoria es de la
              familia**: lo que no puede corregirse deja de ser memoria y pasa a
              ser una afirmación nuestra sobre su mascota. */}
          <PanelMemoria
            titulo={t('nexo.memoriaTitulo', { nombre: nombre ?? '' })}
            /* 🔴 **Cada hecho trae sus propias salidas.** La pieza las pide por
               hecho y no en el panel, y tiene razón: *editar «le tiene miedo a
               los truenos» y editar «come dos veces al día» son dos actos, y un
               solo callback con un id obliga a la pieza a saber cuál es cuál.* */
            hechos={memoria.map((h) => ({
              id: h.id,
              texto: h.hecho,
              origen: h.fuente === 'confirmado_de_ia' ? ('confirmado' as const) : ('contado' as const),
              vozOrigen:
                h.fuente === 'confirmado_de_ia'
                  ? t('nexo.origenConfirmado')
                  : t('nexo.origenContado'),
              onEditar: (txt: string) => {
                void editarMemoriaCoach(h.id, txt).then((r) => {
                  if (r.ok) setMemoria((xs) => xs.map((x) => (x.id === h.id ? { ...x, hecho: txt } : x)));
                  else aviso.mostrar({ variante: 'error', texto: r.mensaje });
                });
              },
              onBorrar: () => {
                void borrarMemoriaCoach(h.id).then((r) => {
                  if (r.ok) setMemoria((xs) => xs.filter((x) => x.id !== h.id));
                  else aviso.mostrar({ variante: 'error', texto: r.mensaje });
                });
              },
            }))}
            vozVacia={t('nexo.memoriaVacia')}
            voz={{
              editar: t('nexo.memoriaEditar'),
              borrar: t('nexo.memoriaBorrar'),
              guardar: t('nexo.memoriaGuardar'),
              cancelar: t('nexo.memoriaCancelar'),
              campo: t('nexo.memoriaCampo'),
            }}
          />
        </ScrollView>

        <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[4] }}>
          <Campo
            label={t('nexo.caja')}
            etiquetaVisible={false}
            value={texto}
            onChangeText={setTexto}
            placeholder={t('nexo.cajaPlaceholder')}
            onSubmitEditing={() => void enviar(texto)}
            returnKeyType="send"
            deshabilitado={pensando}
          />
        </View>
      </View>
    </EvitaTeclado>
  );
}

/** Agrupa por tipo **conservando el orden del servidor** y usando la `ruta` que
 *  él ya armó: *la app no sabe dónde vive cada cosa, y adivinarlo acá sería una
 *  segunda tabla de rutas que envejece sola.* */
function agrupar(
  rs: readonly ResultadoBusqueda[],
  router: ReturnType<typeof useRouter>,
  t: ReturnType<typeof useTraduccion>['t'],
): GrupoResultados[] {
  const orden: TipoResultado[] = ['citas', 'pedidos', 'recuerdos', 'despensa', 'prestadores'];
  const mapa: Record<string, TipoResultado> = {
    cita: 'citas',
    pedido: 'pedidos',
    recuerdo: 'recuerdos',
    producto: 'despensa',
    prestador: 'prestadores',
    /* `mascota` no tiene grupo propio en la pieza: cae en «recuerdos», que es
       donde la familia buscaría a su animal por nombre. Declarado. */
    mascota: 'recuerdos',
  };
  const por = new Map<TipoResultado, GrupoResultados['resultados'][number][]>();
  for (const r of rs) {
    const tipo = mapa[r.tipo] ?? 'recuerdos';
    const lista = por.get(tipo) ?? [];
    lista.push({
      id: r.id,
      tipo,
      titulo: r.titulo,
      subtitulo: r.subtitulo ?? undefined,
      fecha: r.fecha ?? undefined,
      onPress: () => router.push(r.ruta as never),
    });
    por.set(tipo, lista);
  }
  return orden
    .filter((tp) => por.has(tp))
    .map((tp) => ({ tipo: tp, rotulo: t(`nexo.grupo_${tp}` as 'nexo.grupo_citas'), resultados: por.get(tp) ?? [] }));
}

/** De qué plantilla salió ⇒ a qué pantalla lleva su «de su carnet».
 *  **Sin plantilla no hay ruta**, y sin ruta no se dibuja la fuente: *una
 *  etiqueta de origen que no abre nada es decoración.* */
function rutaDeFuente(
  plantilla: string | null,
  mascotaId: string,
  t: ReturnType<typeof useTraduccion>['t'],
): { deDondeRuta?: string; deDondeVoz?: string } {
  if (plantilla === null) return {};
  if (plantilla.includes('vacuna')) {
    return { deDondeRuta: `/hogar/mascota/${mascotaId}`, deDondeVoz: t('nexo.deSuCarnet') };
  }
  if (plantilla.includes('peso')) {
    return { deDondeRuta: `/hogar/mascota/${mascotaId}`, deDondeVoz: t('nexo.deSuPeso') };
  }
  return {};
}
