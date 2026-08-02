/**
 * EL ESPEJO — "Así te ven" a pantalla completa (S84-C11).
 *
 * MONTA `FichaPrestador` de packages/ui. NO DIBUJA UNA FICHA PROPIA, y
 * el porqué está medido en la pantalla de al lado: la copia a mano es lo
 * que hizo que el espejo del Perfil mintiera DOS veces —el oficio
 * inventado (`"paseador · quito"` clavado) y la visibilidad clavada en
 * "sí"—. Una segunda ficha no es "otra vista": es otra verdad que se
 * desincroniza sola. Acá se monta la pieza y nada más.
 *
 * LA PIEZA TIENE DOS CONSUMIDORES y ése es todo el punto: la familia
 * (cuando el directorio exista) y este espejo. El día que la ficha
 * cambie, cambia en los dos lados el mismo día.
 *
 * ⚠️ LA DIFERENCIA ENTRE LOS DOS CONSUMIDORES, resuelta por B y firmada:
 * el estado vacío de portada depende de `onAgregarFotos`. Con handler
 * —este espejo— sin fotos se muestra UNA invitación con su CTA; sin
 * handler —la familia— la portada NO SE MONTA, porque invitar a alguien
 * a subir fotos ajenas sería un final mudo.
 * **Eso levanta el freno de C10 por la vía correcta**: mi objeción era
 * que la portada a sangre dejaría una invitación vacía PERMANENTE en
 * lugar del muro ya gateado. Acá no ocupa el lugar de nada — es una
 * pantalla nueva — y la invitación es affordance DEL ESPEJO, no
 * contenido de la vitrina.
 *
 * ⚠️ EL PIE ES LO QUE HACE HONESTO AL ESPEJO. Sin él, el prestador vería
 * una ficha con su invitación adentro y creería que la familia también
 * la ve. El pie dice que esto es un anticipo, no la vitrina.
 *
 * HUECOS DECLARADOS (L-139 — se dicen, no se rellenan):
 * · `portadas` va sin datos: el pipeline múltiple es de A (S84-A5). La
 *   tabla YA existe (`prestador_fotos`: id · prestador_id · url · orden
 *   · creado_en, portada = MIN(orden), con UNIQUE que hace inexpresable
 *   "dos portadas"). Falta subir, reordenar y borrar.
 * · `oficio` va `undefined` A PROPÓSITO: `prestadores.tipo` es el eje
 *   MUERTO D-487 y sus valores no siguen a los servicios que el negocio
 *   ofrece hoy. La línea de la pieza lo acepta el día que tenga fuente
 *   viva, sin tocar ni esta ruta ni la pieza.
 * · `servicios` va sin datos y es el hueco que MÁS se nota: la familia
 *   sí los vería. Resolverlos pide los CUATRO lectores de oferta que
 *   `cuenta/index` ya usa para su voz de oficio — es una lectura de más
 *   en una pantalla que hoy no la hace. **Entra con el pipeline**, en el
 *   mismo lote que las fotos, para no pagar dos veces el viaje.
 *   Mientras tanto la ficha muestra de menos, jamás de más.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  EsqueletoGrupo,
  Esqueleto,
  EstadoVacio,
  FichaPrestador,
  MarcaDeAgua,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { obtenerMiPrestador, resolverUrlLogoNegocio, type MiPrestador } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function ComoTeVen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [prestador, setPrestador] = useState<MiPrestador | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerMiPrestador();
        if (!vigente) return;
        if (!r.ok) {
          // Ley 13: el fallo dice que es fallo, jamás se disfraza de vacío.
          setEstado('error');
          return;
        }
        setPrestador(r.data);
        setEstado('listo');
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('perfilNegocio.verComoTeVen')}
        atras
        onAtras={() => router.back()}
      />

      {estado === 'cargando' && (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={176} />
              <Esqueleto forma="linea" ancho="60%" />
              <Esqueleto forma="linea" ancho="80%" />
            </View>
          </EsqueletoGrupo>
        </View>
      )}

      {estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('perfilNegocio.errorTitulo')}
            descripcion={t('perfilNegocio.errorDetalle')}
            accion={
              <Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={() => setEstado('cargando')} />
            }
          />
        </View>
      )}

      {/* ⚠️ LOS DOS LÍMITES QUE B DECLARÓ, y los dos son MÍOS:
          ① LA PIEZA NO SCROLLEA (flex:1, sin ScrollView) — con historia
             larga el contenido se corta. B lo dejó afuera A PROPÓSITO,
             y tiene razón: solo el consumidor sabe si alrededor hay pie
             fijo, header o Hoja. Acá hay un `Encabezado` arriba y nada
             abajo, así que el scroll es simple y va con `flexGrow:1`
             para que la ficha siga ocupando la pantalla cuando el
             contenido es corto (sin eso, el fondo se corta a media
             altura y se ve un escalón).
          ② NO TOMA SAFE AREA — la portada SANGRA al borde a propósito.
             Acá el inset superior ya lo pone el `Encabezado`, y el de
             abajo va en el `contentContainerStyle`.
          Las dos son ensanchables y B prefiere ensanchar; hoy NO hacen
          falta, así que no se piden. Un ensanche sin consumidor es una
          prop que alguien va a tener que mantener sin saber por qué. */}
      {estado === 'listo' && prestador !== null && (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}>
        <FichaPrestador
          nombre={prestador.nombre_comercial}
          /* ⚠️ `foto_url` y NO `logo_url` — el aviso de B, y es de los
             que ahorran una hora: `logo_url` existe pero es de
             `seller_perfil`, otra tabla y otro actor. */
          logoUrl={resolverUrlLogoNegocio(prestador.foto_url)}
          ciudad={prestador.ciudad}
          oficio={undefined}
          historia={prestador.descripcion}
          /* CON handler ⇒ la invitación con su CTA. Hoy lleva a la
             sección de fotos del Perfil, que es donde va a vivir el
             pipeline cuando A lo entregue. */
          onAgregarFotos={() => router.back()}
          pie={<Texto variante="apoyo">{t('perfilNegocio.espejoPie')}</Texto>}
        />
        </ScrollView>
      )}
    </View>
  );
}
