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
        /* Las dos JUNTAS y no encadenadas: ninguna depende de la otra
           (`L-223` — lo que se paga en reloj es la CADENA). */
        const [lista, cuenta] = await Promise.all([
          obtenerSolicitudesDeMisPublicaciones(),
          contarSolicitudesPorRevisar(),
        ]);
        if (!vigente) return;
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

  const porRevisar = estado.fase === 'listo' ? estado.lista.filter((s) => s.estado === 'recibida') : [];
  const resto = estado.fase === 'listo' ? estado.lista.filter((s) => s.estado !== 'recibida') : [];

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

          {/* ── ② LAS QUE YA ESTÁN EN CAMINO — sin contador ── */}
          {resto.length > 0 ? (
            <View style={{ gap: spacing[3] }}>
              <Texto variante="seccion">{t('portalAdopcion.enCurso')}</Texto>
              <Tarjeta>
                {resto.map((s, i) => (
                  <View key={s.solicitudId}>
                    {i > 0 ? <Separador /> : null}
                    <FilaSolicitud s={s} caras={estado.caras} />
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
function FilaSolicitud({ s, caras }: { s: SolicitudRecibida; caras: Map<string, string> }) {
  const { t } = useTraduccion();
  const cara = s.mascotaFotoUrl !== null ? (caras.get(s.mascotaFotoUrl) ?? null) : null;
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
      </View>
    </Pressable>
  );
}
