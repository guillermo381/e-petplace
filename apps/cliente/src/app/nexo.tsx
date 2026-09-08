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
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvisoAnticipacion,
  BurbujaMensaje,
  Campo,
  ChipsSugerencia,
  Encabezado,
  EstadoVacio,
  EvitaTeclado,
  Icono,
  PieDeCampo,
  PanelMemoria,
  PresentacionNexo,
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
  marcarAvisoCoachLeido,
  obtenerAvisosCoach,
  obtenerContextoCoach,
  preguntarANexo,
  type AvisoCoach,
  type ContextoCoach,
  type HechoDeMemoria,
  type ResultadoBusqueda,
  type TurnoCoach,
} from '@epetplace/api';
import { fechaCortaMono, type IdiomaSoportado } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';
import { esMemorial } from '@/lib/memorial';
import { useEstadoVida } from '@/lib/postventa/useEstadoVida';

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
  const { t, idioma } = useTraduccion();
  const router = useRouter();
  const aviso = useAviso();
  const { mascotaId, nombre } = useLocalSearchParams<{ mascotaId: string; nombre?: string }>();

  /* 🔴 S114-C · EL PISO DE MEMORIAL DE LAS CINCO PIEZAS DE ESTA PANTALLA.
     Sus guards colgaban de `theme.mode === 'memorial'`, **que no se enciende
     nunca** (`D-1021`), así que Nexo le hablaba igual a quien perdió a su
     animal. La señal real es `estado_vida`, y `mascotaId` ya viaja por la URL.
     ⚠️ Mientras no se sabe, `esMemorial(undefined)` da `false` y las piezas se
     dibujan: es la ventana de un instante entre el montaje y la respuesta, y
     **la salida contraria —esconder Nexo hasta saber— dejaría la pantalla en
     blanco en el caso normal**, que es el de casi todas las mascotas. */
  const estadoVida = useEstadoVida(mascotaId);
  const enMemorial = esMemorial(estadoVida);

  const [contexto, setContexto] = useState<ContextoCoach | null | 'error'>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [memoria, setMemoria] = useState<readonly HechoDeMemoria[]>([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [grupos, setGrupos] = useState<readonly GrupoResultados[] | null>(null);
  const [termino, setTermino] = useState('');
  const scroll = useRef<ScrollView | null>(null);
  /** Los avisos de anticipación de ESTA mascota, para la Hoja (C4). */
  const [avisos, setAvisos] = useState<readonly AvisoCoach[]>([]);

  /** ⭐ **EL NOMBRE SALE DEL CONTEXTO, Y EL PARÁMETRO ES SÓLO UN ADELANTO.**
   *  🔴 A lo vio en aparato: «Pregúntame algo de ,» y «Lo que sé de» **sin
   *  nombre**. El `mascotaId` sí llegaba —Nexo hablaba de Thor— y el `nombre`
   *  no, porque viaja aparte en la URL y hay caminos que no lo ponen.
   *  Y la culpa no era del que no lo pasó: era mía, del `nombre ?? ''` que
   *  **rellenaba el hueco con vacío** en vez de buscar el dato donde ya estaba.
   *  *Un `?? ''` sobre una interpolación no es un default: es una frase rota
   *  que compila.*
   *  El contexto trae `mascota.nombre` y es la fuente buena: viene del
   *  servidor, para ESA mascota, y no depende de cómo se llegó a la pantalla.
   *  El parámetro se conserva **sólo** para pintar el encabezado en los
   *  milisegundos antes de que el contexto llegue. */
  const nombreVivo =
    contexto !== null && contexto !== 'error' ? contexto.mascota.nombre : (nombre ?? null);

  /* Contexto + hilo + memoria al abrir. **El hilo se lee**, no se empieza en
     blanco: una conversación que se olvida cada vez no es una conversación. */
  useEffect(() => {
    if (mascotaId === undefined) return;
    let vivo = true;
    void (async () => {
      const [c, h, m, av] = await Promise.all([
        obtenerContextoCoach(mascotaId),
        leerHiloCoach(mascotaId),
        listarMemoriaCoach(mascotaId),
        obtenerAvisosCoach(),
      ]);
      /* 🔴 **`'anticipacion'` NO está en `TipoAviso`, y aun así llega.** El
         lector hace `o.avisos as AvisoCoach[]` —un cast, sin angostar— así que
         el tipo dice tres y la base tiene cuatro (18 filas de anticipación,
         medidas). *Un `switch` exhaustivo acá compilaría diciendo que cubrí
         todo y en runtime caería sin rama.* Se compara la cadena y se filtra
         por mascota. Pedido a A: que el tipo diga lo que la tabla tiene. */
      if (av.ok) {
        /* 🔴 **UNO, EL MÁS RECIENTE — no todos los no leídos.** Medido en
           pantalla: llegaban CUATRO y se apilaban encima de la presentación,
           cuatro tarjetas idénticas con el mismo botón. *Cuatro avisos juntos
           no informan cuatro veces mejor: informan como una alarma*, y el brief
           dice «nunca como alarma».
           El motor ya dosifica —A los limita a uno por mascota cada 7 días—,
           pero lo NO LEÍDO se acumula: la dosis del que nace no es la dosis del
           que se muestra. */
        const suyos = av.data
          .filter((a) => a.mascota_id === mascotaId && String(a.tipo) === 'anticipacion')
          .sort((x, y) => (x.fecha < y.fecha ? 1 : -1));
        setAvisos(suyos.slice(0, 1));
      }
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
        setGrupos(agrupar(b.data.resultados, router, t, idioma));
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
        <Encabezado variante="navegacion" titulo={nombreVivo ?? t('nexo.titulo')} />
        <ScrollView
          ref={scroll}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
        >
          {/* 🔴 Sin nombre **no se dibuja la invitación**: «Pregúntame algo de
              ,» es peor que no decir nada. Cuando el contexto llega, la frase
              aparece entera. */}
          {/* ⭐ **C4 · LOS AVISOS, EN LA HOJA CON SU ACTO A LA VISTA.** Forma
              `tarjeta` y no `fila`: acá ya se entró a leer, y esconder el paso
              siguiente detrás de otro toque es hacer que la familia lo busque
              (la pieza lo dice y tiene razón). */}
          {avisos.map((a) => (
            <AvisoAnticipacion enMemorial={enMemorial}
              key={a.id}
              forma="tarjeta"
              contexto={String(a.detalle.contexto ?? '')}
              sugerencia={String(a.detalle.sugerencia ?? '')}
              vozVerVet={t('nexo.hablarloConMiVet')}
              onVerVet={() => {
                /* Marcar leído AL ACTUAR, no al mostrar: *un aviso que se
                   apaga por haber pasado por delante no se leyó.* */
                void marcarAvisoCoachLeido(a.id);
                router.push('/explorar/veterinaria' as never);
              }}
            />
          ))}

          {/* ⭐ **C3 · LA PRESENTACIÓN, UNA VEZ POR MASCOTA.** Se muestra
              cuando el hilo está vacío: *el hilo ES la memoria de que ya nos
              presentamos* — un flag aparte se desincroniza del hilo el día que
              alguien borra la conversación. */}
          {lineas.length === 0 && grupos === null && typeof contexto === 'object' ? (
            <PresentacionNexo enMemorial={enMemorial}
              autor={t('nexo.autor')}
              hora={hora()}
              burbujas={[
                t('nexo.presenta1', { nombre: nombreVivo ?? '' }),
                t('nexo.presenta2', { nombre: nombreVivo ?? '' }),
                t('nexo.presenta3'),
              ]}
            />
          ) : null}

          {lineas.length === 0 && grupos === null && nombreVivo !== null ? (
            <Texto variante="apoyo">{t('nexo.invitacion', { nombre: nombreVivo })}</Texto>
          ) : null}

          {lineas.map((l) =>
            l.rol === 'familia' ? (
              /* ⭐ **LA MISMA BURBUJA DEL CHAT DE ADOPCIÓN**, no una nueva.
                 Medido: `apps/cliente/src/app/adoptar/solicitud/[solicitudId]`
                 monta `BurbujaMensaje` con `mio` · `texto` · `hora` ·
                 `posicion` · `estado`. *Dibujar otra burbuja acá haría que dos
                 conversaciones de la misma app se vieran distinto sin que nadie
                 lo hubiera decidido* — y la pieza ya trae el radio que cierra
                 el grupo y el color que marca de quién es.
                 `posicion: 'solo'` porque el hilo de Nexo alterna familia y
                 Nexo en cada turno: no hay grupos que cerrar. */
              <BurbujaMensaje
                key={l.id}
                mio
                texto={l.texto}
                hora={l.hora}
                posicion="solo"
                estado="enviado"
              />
            ) : l.primera === true ? (
              <RespuestaNexo enMemorial={enMemorial}
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
              <RespuestaNexo enMemorial={enMemorial}
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
            <ChipsSugerencia enMemorial={enMemorial} sugerencias={sugerencias} />
          ) : null}

          {/* «Lo que sé de {{mascota}}» — editable, porque **la memoria es de la
              familia**: lo que no puede corregirse deja de ser memoria y pasa a
              ser una afirmación nuestra sobre su mascota. */}
          <PanelMemoria enMemorial={enMemorial}
            titulo={
              nombreVivo !== null
                ? t('nexo.memoriaTitulo', { nombre: nombreVivo })
                : /* Sin nombre, el panel se titula sin él en vez de dejar el
                     hueco: «Lo que sé de» a secas está roto; «Lo que sé» no. */
                  t('nexo.memoriaTituloSinNombre')
            }
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

        {/* 🔴 **EL BOTÓN DE ENVIAR, A LA VISTA** (pasada del founder). Antes
            sólo se enviaba con la tecla del teclado: *en un teclado sin «enviar»
            visible —o con el teclado cerrado— no había forma de mandar el
            mensaje, y la caja se leía como un campo que no hace nada.*
            ⚠️ Y el **aire de abajo sube a `spacing[6]`**: con el teclado cerrado
            la caja quedaba pegada al borde inferior. */}
        <View
          style={{
            flexDirection: 'row',
            /* 🔴 **`center` + `sinPie`, y la segunda es la que cura de verdad**
               (ojo del founder: *«el botón quedó un renglón más abajo»*).
               Primero probé sólo `center` y quedó Δ13px: **`Campo` RESERVA el
               renglón de su pie aunque esté vacío**, así que la caja mide más
               de lo que se ve y centrarse contra ella deja el botón bajo.
               Su propia cabecera lo dice: *«el pie crece y el delta con él; por
               eso la cura correcta es `sinPie`»*. */
            alignItems: 'center',
            gap: spacing[2],
            paddingHorizontal: spacing[5],
            paddingBottom: spacing[6],
          }}
        >
          <View style={{ flex: 1 }}>
            {/* 🔴 **`sinPie` NO VIAJA SOLO** (R29, y el gate lo frenó acá): el
                compuesto que le quita el pie a su hijo tiene que montarlo él,
                *o el borde de error queda sin su mensaje y la caja se pone roja
                sin decir por qué.* Acá el pie está siempre vacío —una búsqueda
                no valida nada— pero se monta igual: **el día que esta caja
                tenga un error, su mensaje ya tiene dónde ir.** */}
            <Campo
              label={t('nexo.caja')}
              etiquetaVisible={false}
              value={texto}
              onChangeText={setTexto}
              placeholder={t('nexo.cajaPlaceholder')}
              onSubmitEditing={() => void enviar(texto)}
              /* 🔴 **«buscar», no «enviar»** (ojo del founder): la caja de
                 Nexo es también el buscador, y *el teclado tiene que decir qué
                 va a pasar al tocar su tecla.* */
              returnKeyType="search"
              deshabilitado={pensando}
              sinPie
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nexo.enviar')}
            disabled={texto.trim() === '' || pensando}
            onPress={() => void enviar(texto)}
            /* ⚠️ Y con él se va su `paddingBottom`, que existía para compensar
               el desalineo de arriba. *Un ajuste que corrige un síntoma
               sobrevive a su causa y desalinea al revés.* */
            style={{ opacity: texto.trim() === '' || pensando ? 0.4 : 1 }}
          >
            <Icono nombre="enviar" tamano={24} />
          </Pressable>
        </View>
        {/* 🔴 **EL PIE VA FUERA DE LA FILA, y esto lo enseñó medir.** Montado
            adentro del `View flex:1` del campo, ese View pasaba a medir caja +
            pie, y `alignItems: center` centraba el botón contra ESA suma:
            13px abajo, que es exactamente `(50 − 24) / 2`. *El arreglo estaba
            causando el defecto que venía a arreglar.*
            Afuera, la fila mide lo que mide la caja y el pie conserva su lugar
            para el día que haya un error que decir (R29). */}
        <View style={{ paddingHorizontal: spacing[5] }}>
          <PieDeCampo />
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
  /** 🔴 **Para decir la fecha, no volcarla** (ojo del founder). Entra el
   *  idioma porque el formato es suyo: *un `2026-09-07T17:30` en una lista de
   *  resultados no es un dato, es el interior de la app asomando.* */
  idioma: IdiomaSoportado,
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
      /* ⚠️ Se recorta a 10 antes: el helper espera una FECHA, no un instante,
         y con la hora pegada devuelve la cadena entera. */
      fecha: r.fecha === null ? undefined : fechaCortaMono(r.fecha.slice(0, 10), idioma),
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
