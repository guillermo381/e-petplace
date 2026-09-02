/**
 * EL PORTAL DEL PUBLICADOR · HOME — «una sola cosa cuenta» (S112-C, §9).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **CONSTRUIDA Y DESCONECTADA, Y ESO ES EL ORDEN CORRECTO — NO UN A MEDIAS.**
 * La casa tiene la regla escrita desde S74: *«LA PUERTA VA ÚLTIMA — resolvedor,
 * gates por rol y voces se construyen en cualquier orden y quedan INERTES
 * mientras la puerta siga cerrada; abrirla es el interruptor.»*
 *
 * **Lo que falta para abrirla es UNA lectura, no una pantalla:** saber que esta
 * cuenta es un refugio. `_user_gestiona_cuenta_refugio` existe en el motor
 * (S111-A) y **no tiene lector de superficie**; se pidió a A como
 * `obtener_mi_cuenta_refugio` (`S112-C-para-A-PEDIDO-1` §⑥). El día que llegue,
 * esta ruta entra a la barra por la unión `QuienEntra` que **ya compone tabs
 * por naturaleza de cuenta sin bifurcar la app** (`barra-prestador-lectura.ts`
 * — el vendedor puro ya entra sin `prestador_id`), y eso contesta §12 ⑥ de la
 * letra en verde **sin construir nada nuevo**.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS (Ley 14):** *hay gente esperando tu respuesta, y son estas.*
 *
 * **FIRMA (Ley 15):** el CONTADOR de solicitudes por revisar. §9 lo pide sin
 * rodeos —*una sola cosa cuenta*— y es lo único que el refugio vino a saber.
 *
 * ── 🔴 EL CONTADOR ES DEL SERVIDOR, Y NO SE DERIVA DE LA LISTA ──────────
 * `contarSolicitudesPorRevisar()` cuenta en la base. Derivarlo del `.length`
 * de lo que trajo la pantalla lo ataría a cuántas páginas se pidieron — *y un
 * contador que miente hacia abajo dice que no hay trabajo pendiente*, que es
 * exactamente el error que §9 nombra. **Puede llegar a cero**, que es lo que
 * un contador tiene que poder hacer.
 *
 * ── POR QUÉ PADRINAZGOS Y DONACIONES VAN **SIN** CONTADOR ───────────────
 * §9, literal: *«un contador tiene que poder llegar a cero: las solicitudes
 * exigen respuesta, las novedades no, y mezclarlas es cómo se pierde la que
 * había que responder».* Hoy además **no existen sus lectores**, así que la
 * sección dice lo que es —un lugar hecho— y no finge estar vacía de datos.
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  contarSolicitudesPorRevisar,
  obtenerSolicitudesDeMisPublicaciones,
  resolverUrlsFotos,
  tengoAceptadoDocumento,
  type SolicitudRecibida,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; lista: SolicitudRecibida[]; porRevisar: number; caras: Map<string, string> };

export default function PortalAdopcionHome() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        /* Las tres JUNTAS y no encadenadas: ninguna depende de la otra
           (`L-223` — lo que se paga en reloj es la CADENA). La de los términos
           entra acá y no en un viaje aparte por la misma razón: *un guard que
           se paga con una espera propia se termina moviendo a donde no
           frena.* */
        const [lista, cuenta, acepto] = await Promise.all([
          obtenerSolicitudesDeMisPublicaciones(),
          contarSolicitudesPorRevisar(),
          tengoAceptadoDocumento('terminos_refugio'),
        ]);
        if (!vigente) return;
        /* ═══ LA PUERTA DEL PORTAL (§4.2) ═══════════════════════════════════
           *«La primera vez, mis términos (los del refugio) con "Acepto" apagado
           hasta ver todo. **Después**, tres tabs.»* — los términos van ANTES,
           no al costado.

           🔴 **`acepto.ok && acepto.data === false` y no `!acepto.data`.** Si la
           lectura FALLA, `data` no existe y la forma corta mandaría a firmar
           términos a alguien que quizá ya los firmó: *hacer firmar dos veces un
           documento legal por un error de red no es una molestia, es evidencia
           duplicada de un acto que ocurrió una vez.* Con el fallo se sigue de
           largo y el portal se dibuja — la compuerta dura de publicar vive en el
           motor, no acá. **Esta pantalla no es la defensa: es la cortesía de
           pedirlo en el momento correcto.** */
        if (acepto.ok && acepto.data === false) {
          router.replace({ pathname: '/legales/[codigo]', params: { codigo: 'terminos_refugio' } });
          return;
        }
        /* 🔴 Un fallo NO se disfraza de «no hay solicitudes» (Ley 13): al
           refugio le diría que nadie escribió cuando lo cierto es que no
           pudimos preguntar — y acá esa diferencia es una familia esperando. */
        if (!lista.ok) return setEstado({ fase: 'error' });
        const rutas = lista.data
          .map((s) => s.mascotaFotoUrl)
          .filter((u): u is string => typeof u === 'string' && u.length > 0);
        const caras = rutas.length > 0 ? await resolverUrlsFotos(rutas) : new Map<string, string>();
        if (!vigente) return;
        setEstado({
          fase: 'listo',
          lista: lista.data,
          /* Si el contador falla y la lista no, **no se inventa el número**:
             se muestra la lista sin contador. *Un número aproximado en el
             lugar donde §9 puso el único número exacto es peor que ninguno.* */
          porRevisar: cuenta.ok ? cuenta.data : -1,
          caras,
        });
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  /* ═══ A9 · LA SECCIÓN DECÍA «EN CONVERSACIÓN» Y GUARDABA TODO ═══════════

     🔴 **El rojo del founder, con nombre y apellido:** después del traspaso, la
     Home listaba a **Nube** —solicitud `aceptada`— bajo el título «En
     conversación». Medido antes de tocar nada: **hay UNA sola solicitud de
     Nube** (`8b747efd`, `aceptada`, 2 mensajes) y una de Bruno (`declinada`).
     *No eran dos filas: era una fila bajo un rótulo falso.*

     La causa es el complemento: `resto = estado !== 'recibida'` mete adentro
     **los cuatro estados terminales** —`aceptada`, `declinada`, `desistida`,
     `no_concretada_fallecimiento`— y el rótulo afirmaba de todos ellos que
     estaban conversando.

     ⚠️ **Filtrar por «lo que no es X» es lo que lo produjo**, y no es un detalle
     de estilo: un complemento **hereda cada estado nuevo que el motor invente**,
     sin que nadie lo revise. Este mes entraron dos (`desistida` y
     `no_concretada_fallecimiento`, S112-B) y cayeron acá solos. ⇒ **Los tres
     grupos se enumeran por INCLUSIÓN**, y lo que no entra en ninguno es un
     estado nuevo que alguien tiene que ubicar a mano — que es exactamente el
     momento en que hay que pensarlo.

     Y la mitad estructural: **las cerradas dicen su estado en la fila**. *Un
     rótulo de sección puede volver a mentir; una fila que lleva su propio
     estado, no.* ── */
  const lista = estado.fase === 'listo' ? estado.lista : [];
  const porRevisar = lista.filter((s) => s.estado === 'recibida');
  const conversando = lista.filter((s) => s.estado === 'en_conversacion');
  const cerradas = lista.filter(
    (s) =>
      s.estado === 'aceptada' ||
      s.estado === 'declinada' ||
      s.estado === 'desistida' ||
      s.estado === 'no_concretada_fallecimiento',
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="portada" saludo={t('portalAdopcion.titulo')} />

      {estado.fase === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={72} />
            <Esqueleto alto={72} />
          </EsqueletoGrupo>
        </View>
      ) : estado.fase === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('portalAdopcion.errorTitulo')}
            descripcion={t('portalAdopcion.errorDetalle')}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[6],
            gap: spacing[5],
          }}
        >
          {/* ── ① LAS QUE EXIGEN RESPUESTA — PRESIDEN, CON SU NÚMERO ── */}
          <View style={{ gap: spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <Texto variante="seccion">{t('portalAdopcion.porRevisar')}</Texto>
              {estado.porRevisar >= 0 ? (
                <Insignia
                  estado={estado.porRevisar > 0 ? 'proximo' : 'alDia'}
                  etiqueta={String(estado.porRevisar)}
                />
              ) : null}
            </View>

            {porRevisar.length === 0 ? (
              /* 🔴 **CERO ES UNA BUENA NOTICIA, y se dice así.** No es un vacío
                 que pide llenarse: es el trabajo al día. *Un «no hay nada» con
                 cara de error le enseña al refugio a temerle a esta pantalla.* */
              <EstadoVacio
                registro="seccion"
                titulo={t('portalAdopcion.alDiaTitulo')}
                descripcion={t('portalAdopcion.alDiaDetalle')}
              />
            ) : (
              <Tarjeta>
                {porRevisar.map((s, i) => (
                  <View key={s.solicitudId}>
                    {i > 0 ? <Separador /> : null}
                    <FilaSolicitud s={s} caras={estado.caras} />
                  </View>
                ))}
              </Tarjeta>
            )}
          </View>

          {/* ── ② LAS QUE YA ESTÁN EN CAMINO — sin contador.
              Ahora el rótulo dice la verdad: **sólo `en_conversacion`**. ── */}
          {conversando.length > 0 ? (
            <View style={{ gap: spacing[3] }}>
              <Texto variante="seccion">{t('portalAdopcion.enCurso')}</Texto>
              <Tarjeta>
                {conversando.map((s, i) => (
                  <View key={s.solicitudId}>
                    {i > 0 ? <Separador /> : null}
                    <FilaSolicitud s={s} caras={estado.caras} />
                  </View>
                ))}
              </Tarjeta>
            </View>
          ) : null}

          {/* ── ②bis LAS CERRADAS — y no se esconden.
              *El refugio quiere poder volver a la que aceptó* (es la puerta del
              acta), y una lista de trabajo que borra lo resuelto le deja la
              sensación de que la app se olvidó. Van abajo, sin contador, **y
              cada fila dice en qué terminó**. ── */}
          {cerradas.length > 0 ? (
            <View style={{ gap: spacing[3] }}>
              <Texto variante="seccion">{t('portalAdopcion.cerradas')}</Texto>
              <Tarjeta>
                {cerradas.map((s, i) => (
                  <View key={s.solicitudId}>
                    {i > 0 ? <Separador /> : null}
                    <FilaSolicitud s={s} caras={estado.caras} conEstado />
                  </View>
                ))}
              </Tarjeta>
            </View>
          ) : null}

          {/* ── ③ PADRINAZGOS Y DONACIONES — el lugar, dicho honesto ──
              §9 las pone acá abajo y SIN contador. Hoy sus lectores no
              existen: la sección **dice que todavía no llegan**, en vez de
              mostrar un cero que se leería como «nadie donó». */}
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('portalAdopcion.novedades')}</Texto>
            <EstadoVacio
              registro="seccion"
              titulo={t('portalAdopcion.novedadesTitulo')}
              descripcion={t('portalAdopcion.novedadesDetalle')}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/** Una solicitud en la lista. **El animal preside**: en la cabeza del refugio
 *  son animales, no publicaciones (§9). El solicitante va debajo. */
function FilaSolicitud({
  s,
  caras,
  conEstado = false,
}: {
  s: SolicitudRecibida;
  caras: Map<string, string>;
  /** A9 · Sólo las cerradas lo llevan: en las vivas el rótulo de la sección ya
   *  lo dice, y repetirlo en cada fila sería ruido. En las cerradas **el hecho
   *  vive en la fila** para que ningún rótulo pueda volver a mentir. */
  conEstado?: boolean;
}) {
  const { t } = useTraduccion();
  const cara = s.mascotaFotoUrl !== null ? (caras.get(s.mascotaFotoUrl) ?? null) : null;
  /* Texto, no pill: acá no es la escalera —esa vive en el hilo, y su lugar es
     arriba y ancho completo (A3)—. Es una nota al pie de un animal que ya no
     necesita atención. */
  const enQueTermino =
    s.estado === 'aceptada'
      ? t('portalAdopcion.cerradaAceptada')
      : s.estado === 'declinada'
        ? t('portalAdopcion.cerradaDeclinada')
        : s.estado === 'desistida'
          ? t('portalAdopcion.cerradaDesistida')
          : t('portalAdopcion.cerradaNoConcretada');
  return (
    /* `Pressable` y no un `View` con `onTouchEnd`: **el touch crudo no da rol,
       no da foco y no lo alcanza un lector de pantalla** — se ve igual y no se
       puede usar igual. */
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${s.mascotaNombre} — ${s.solicitanteNombre ?? t('portalAdopcion.alguienSinNombre')}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] }}
      onPress={() =>
        router.push({
          pathname: '/adopcion/solicitud/[solicitudId]',
          params: { solicitudId: s.solicitudId },
        })
      }
    >
      <AvatarMascota nombre={s.mascotaNombre} fotoUrl={cara ?? undefined} tamano="md" />
      <View style={{ flex: 1, gap: spacing[1] }}>
        <Texto variante="titulo">{s.mascotaNombre}</Texto>
        {/* `solicitanteNombre` puede ser `null` — **no se inventa un nombre**:
            se dice que hay alguien, que es lo cierto. */}
        <Texto variante="apoyo">
          {s.solicitanteNombre ?? t('portalAdopcion.alguienSinNombre')}
        </Texto>
        {conEstado ? (
          <Texto variante="dato" color="tertiary">
            {enQueTermino}
          </Texto>
        ) : null}
      </View>
    </Pressable>
  );
}
