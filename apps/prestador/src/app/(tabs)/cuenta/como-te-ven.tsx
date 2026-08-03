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
 * LO QUE YA LLEGA (S84-C12, con el pipeline de A):
 * · `portadas` — de `listarFotosGaleria`, que devuelve ORDENADAS: la
 *   portada es `[0]` y no se pregunta aparte, porque el orden y la
 *   portada son el MISMO dato.
 * · `servicios` — en VOZ DE FAMILIA, con los cuatro lectores de oferta
 *   que `cuenta/index` ya usa y su mismo criterio de "activo".
 *
 * HUECO QUE QUEDA (L-139 — se dice, no se rellena):
 * · `oficio` va `undefined` A PROPÓSITO: `prestadores.tipo` es el eje
 *   MUERTO D-487 y sus valores no siguen a los servicios que el negocio
 *   ofrece hoy. La línea de la pieza lo acepta el día que tenga fuente
 *   viva, sin tocar ni esta ruta ni la pieza.
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
import {
  listarFotosGaleria,
  obtenerMiPrestador,
  obtenerMundoVeterinariaPropio,
  obtenerOfertaAdiestramientoPropia,
  obtenerOfertasGroomingPropias,
  obtenerOfertasPaseoPropias,
  resolverUrlLogoNegocio,
  type MiPrestador,
} from '@epetplace/api';
import { resolverUrlFotoGaleria } from '@/lib/subir-galeria';

import { useTraduccion } from '@/i18n';

export default function ComoTeVen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [prestador, setPrestador] = useState<MiPrestador | null>(null);
  const [portadas, setPortadas] = useState<string[]>([]);
  const [servicios, setServicios] = useState<string[]>([]);

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

        /* S84-C12 — LAS FOTOS Y LOS SERVICIOS, en la carga SECUNDARIA.
           Van DESPUÉS de pintar la ficha y no antes: la identidad ya se
           puede mostrar con el primer viaje, y hacerla esperar cinco
           lecturas más sería el mismo defecto que D-531 curó en el
           header de Cuenta —contenido secundario tomando de rehén al
           principal—. Si alguna falla, la ficha muestra de menos.

           LOS CUATRO LECTORES son EXACTAMENTE los que `cuenta/index` ya
           usa para su voz de oficio, con el MISMO criterio de "activo".
           No se toca ningún wrapper: leer no es escribir, y esto es
           composición. */
        const [rFotos, rPaseo, rGrooming, rAdiestramiento, rVet] = await Promise.all([
          listarFotosGaleria(r.data.id),
          obtenerOfertasPaseoPropias(r.data.id),
          obtenerOfertasGroomingPropias(r.data.id),
          obtenerOfertaAdiestramientoPropia(r.data.id),
          obtenerMundoVeterinariaPropio(r.data.id),
        ]);
        if (!vigente) return;
        if (rFotos.ok) setPortadas(rFotos.data.map((f) => resolverUrlFotoGaleria(f.url)));
        /* VOZ DE FAMILIA, JAMÁS EL ENUM (Ley 3 · aviso de B: la pieza no
           traduce códigos de motor). El orden es FIJO y no por lo que
           tenga cargado: si se ordenara por presencia, la misma ficha
           cambiaría de forma al activar un oficio. */
        const voces: string[] = [];
        if (rPaseo.ok && rPaseo.data.some((o) => o.activo)) voces.push(t('miCuenta.oficioPaseos'));
        if (rGrooming.ok && rGrooming.data.some((o) => o.activo)) voces.push(t('miCuenta.oficioEstetica'));
        if (rAdiestramiento.ok && (rAdiestramiento.data.oferta?.activo ?? false))
          voces.push(t('miCuenta.oficioAdiestramiento'));
        if (rVet.ok && rVet.data.servicios.some((s) => s.activo)) voces.push(t('miCuenta.oficioVeterinaria'));
        setServicios(voces);
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
          portadas={portadas}
          servicios={servicios}
          /* S84-C23 — LA ZONA, y NUNCA la sede.
             `MiPrestador` trae `lat`/`lon` —la coordenada EXACTA— a un
             tipeo de distancia, y pasarlas compilaría y se vería MEJOR
             en pantalla: un mapa centrado en el negocio parece más
             correcto que uno desplazado. Ese es justo el peligro — el
             defecto sería invisible al ojo y solo legible en el código.
             Y acá pesa doble por lo que ESTA pantalla es: el espejo
             muestra lo que ve la familia. Con la sede exacta, el
             prestador creería que la familia ve su ubicación real
             cuando la vista fue angostada para que NO (D-624) — el
             espejo pasaría de mostrar la verdad a certificar una
             mentira.
             A las expuso por el camino (a): la fila propia lee la MISMA
             derivación que la familia, así que las dos no pueden
             divergir. Las tres viajan juntas; si falta una, la pieza no
             monta el bloque. */
          zonaLat={prestador.zona_lat}
          zonaLon={prestador.zona_lon}
          zonaRadioM={prestador.zona_radio_m}
          /* ① S84-C24 — SIN ZONA, LA PIEZA NO MONTA EL MAPA, y está
             BIEN: la familia tampoco lo vería. La explicación NO va acá
             —sería una prop nueva en la pieza de B, inventada por mí—
             sino en el PERFIL, que es donde está la cura: el mapa falta
             porque la sede nunca se capturó. El mensaje vive junto al
             control que lo arregla, no junto al hueco. */
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
