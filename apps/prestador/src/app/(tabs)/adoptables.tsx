/**
 * MIS ANIMALES — la tab Mascotas del refugio (§4.2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **VOZ DEL FOUNDER, literal:** *«Mis animales como animales: foto, nombre,
 * estado (en rescate · publicado · en proceso · adoptado). Publicar / pausar es
 * un interruptor en la tarjeta, apagado con razón cuando no puede ("adulto sin
 * esterilizar: se publica esterilizado").»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS (Ley 14):** *estos son tus animales, y cada uno dice en qué anda.*
 *
 * **FIRMA (Ley 15):** el interruptor **en la tarjeta** (N17: el espejo es un
 * interruptor, no otra pantalla). Publicar y pausar no exigen entrar a ningún
 * lado.
 *
 * ── 🔴 EL INTERRUPTOR APAGADO NO PUEDE QUEDAR MUDO, Y NO POR DISCIPLINA ──
 * `TarjetaMascotaRefugio.publicacion` es una **unión discriminada**: con
 * `onCambio` se mueve, con `razon` no se puede y se dice por qué, y los
 * `?: never` impiden mezclarlas u omitir las dos. ⇒ **un interruptor bloqueado
 * y mudo NO COMPILA.** Del otro lado, A garantiza el par: `motivoNoPublica` es
 * `null` **sólo** cuando `puedePublicar` es `true`. *Las dos mitades del
 * contrato se sostienen sin que ninguna pantalla tenga que acordarse.*
 *
 * ── LOS ESTADOS: SIETE Y SIETE, y no fue gratis ──────────────────────────
 * La unión de B y la del motor **no eran los mismos seis**: sobraba
 * `en_proceso` de un lado y `no_disponible` del otro.
 * · **`no_disponible` NO se mapea a `pausada`.** El catálogo dice que `pausada`
 *   es *«retirada temporalmente, **no es un rechazo**»*, y `no_disponible` es un
 *   retiro definitivo que la base **obliga** a tener fecha y motivo
 *   (`chk_no_disponible_coherente`). *Pintarlos igual le diría al refugio que
 *   puede volver a publicar algo que retiró.* B agregó el séptimo.
 * · **`en_proceso` existe en la unión y NINGUNA fila lo usa.** Medido: después
 *   de que el refugio acepta, la publicación sigue en `publicada` hasta el
 *   traspaso. `solicitudesVivas` cuenta *«hay gente escribiendo»*, no *«esta
 *   adopción está en curso»* — derivarlo de ahí pintaría «en proceso» sobre un
 *   animal que apenas recibió una consulta. **Su voz se escribe igual** porque
 *   `voces` es un `Record` y sacarlo hoy rompería a todos los consumidores el
 *   día que el motor lo produzca.
 *
 * ── ⚠️ LO QUE FALTA, CON SU BLOQUEANTE NOMBRADO ─────────────────────────
 * · **La ficha de edición: NO HAY LECTOR.** `obtener_adoptable` lee
 *   `v_adoptables_publicos` ⇒ rebota para un borrador, que es justo el caso que
 *   hay que poder editar, y `obtenerMisAdoptables` trae el resumen de esta
 *   lista. *Un formulario con los campos vacíos porque no pude leerlos, sobre
 *   una función que acepta `Partial`, borra la historia de un animal con un
 *   guardado.* Pedido a A. Los ESCRITORES ya están (`actualizarAdoptable` y las
 *   tres de fotos): falta la mitad que lee.
 * · **Publicar un animal nuevo** espera a que el refugio pueda listar SUS
 *   mascotas (N6, de A).
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  MarcaDeAgua,
  TarjetaMascotaRefugio,
  spacing,
  useAviso,
  useTheme,
  type EstadoMascotaRefugio,
  type PublicacionDeMascota,
} from '@epetplace/ui';
import {
  cambiarEstadoAdoptable,
  obtenerMisAdoptables,
  resolverUrlsFotos,
  type MiAdoptable,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; lista: MiAdoptable[]; caras: Map<string, string> };

/** El mapeo motor → pieza. **Explícito y exhaustivo**: el `satisfies` lo
 *  obliga, así que un estado nuevo del motor rompe acá — en la pantalla que
 *  tiene que decidir cómo se llama— y no en silencio. */
const ESTADO_PIEZA = {
  /* La palabra del founder para el borrador: §4.2 dice «en rescate», que es lo
     que el animal ESTÁ, no lo que la fila es. */
  borrador: 'en_rescate',
  publicada: 'publicada',
  pausada: 'pausada',
  adoptada: 'adoptada',
  no_disponible: 'no_disponible',
  memorial: 'memorial',
} as const satisfies Record<MiAdoptable['estado'], EstadoMascotaRefugio>;

export default function MisAdoptables() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [moviendo, setMoviendo] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        const r = await obtenerMisAdoptables();
        if (!vigente) return;
        /* Ley 13: un fallo NO se disfraza de «no tenés animales». *Decirle a un
           refugio que no tiene animales cuando lo que falló fue la red es la
           peor de las dos mentiras posibles acá.* */
        if (!r.ok) {
          setEstado({ fase: 'error' });
          return;
        }
        const paths = r.data
          .map((a) => a.fotoUrl)
          .filter((x): x is string => typeof x === 'string' && x.length > 0);
        const caras = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
        if (!vigente) return;
        setEstado({ fase: 'listo', lista: r.data, caras });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const mover = async (a: MiAdoptable, encender: boolean) => {
    if (moviendo !== null) return;
    setMoviendo(a.publicacionId);
    try {
      const r = await cambiarEstadoAdoptable({
        publicacionId: a.publicacionId,
        estado: encender ? 'publicada' : 'pausada',
      });
      if (!r.ok) {
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      /* Se relee del servidor en vez de mover el estado local: el motor puede
         haber cambiado más que el estado (la regla de los seis meses corre en
         la puerta). *Un espejo optimista sobre una puerta que valida es cómo la
         pantalla y la base terminan diciendo cosas distintas.* */
      setIntento((n) => n + 1);
    } finally {
      setMoviendo(null);
    }
  };

  /**
   * EL INTERRUPTOR, o su ausencia.
   *
   * **Ausente** en `adoptada`, `memorial` y `no_disponible`: el ciclo terminó y
   * ofrecer un control muerto es peor que no ofrecerlo.
   */
  const publicacionDe = (a: MiAdoptable): PublicacionDeMascota | undefined => {
    if (a.estado === 'adoptada' || a.estado === 'memorial' || a.estado === 'no_disponible') {
      return undefined;
    }
    const etiqueta = t('adoptables.interruptor');
    const encendido = a.estado === 'publicada';
    if (a.puedePublicar) {
      return { etiqueta, encendido, onCambio: (v) => void mover(a, v) };
    }
    /* La razón llega como CÓDIGO y se traduce acá: *una frase en español dentro
       de una RPC es una pantalla en un solo idioma* (`D-539`). El `?? ` no es
       un fallback decorativo — es el caso «el motor agregó un motivo que esta
       versión no conoce», y decir «no se puede publicar todavía» es más honesto
       que mostrar un código crudo. */
    const razon =
      a.motivoNoPublica === null
        ? t('adoptables.motivoDesconocido')
        : t(`adoptables.motivo_${a.motivoNoPublica}` as 'adoptables.motivo_adoptable_no_esterilizado');
    return { etiqueta, encendido, razon };
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="portada" saludo={t('adoptables.titulo')} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          gap: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        {estado.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={96} />
            <Esqueleto alto={96} />
          </EsqueletoGrupo>
        ) : estado.fase === 'error' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('adoptables.errorTitulo')}
            descripcion={t('adoptables.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('adoptables.reintentar')}
                onPress={() => setIntento((n) => n + 1)}
              />
            }
          />
        ) : estado.lista.length === 0 ? (
          <EstadoVacio
            registro="seccion"
            icono={<Icono nombre="familia" tamano={48} />}
            titulo={t('adoptables.vacioTitulo')}
            descripcion={t('adoptables.vacioDetalle')}
          />
        ) : (
          estado.lista.map((a) => (
            <TarjetaMascotaRefugio
              key={a.publicacionId}
              nombre={a.nombre}
              fotoUrl={a.fotoUrl === null ? undefined : (estado.caras.get(a.fotoUrl) ?? undefined)}
              estado={ESTADO_PIEZA[a.estado]}
              voces={{
                en_rescate: t('adoptables.estado_en_rescate'),
                publicada: t('adoptables.estado_publicada'),
                pausada: t('adoptables.estado_pausada'),
                en_proceso: t('adoptables.estado_en_proceso'),
                adoptada: t('adoptables.estado_adoptada'),
                no_disponible: t('adoptables.estado_no_disponible'),
                memorial: t('adoptables.estado_memorial'),
              }}
              publicacion={publicacionDe(a)}
              etiqueta={t('adoptables.abrirFicha', { nombre: a.nombre })}
              /* ✅ **EL TOQUE YA LLEVA, y llegó por frenar en vez de improvisar.**
                 Hasta hace un rato acá había un aviso honesto porque **no había
                 lector**: `obtener_adoptable` rebota los borradores, que son
                 justo los que hay que editar. *Abrir el formulario vacío sobre
                 una función que acepta `Partial` habría borrado la historia de
                 un animal con un guardado.* A entregó `obtenerMiAdoptable`, que
                 trae la ficha ENTERA aunque haya nulos. */
              onPress={() =>
                router.push({
                  pathname: '/adoptables/[publicacionId]',
                  params: { publicacionId: a.publicacionId },
                })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
