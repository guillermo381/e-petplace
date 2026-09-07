/**
 * ⭐ **LA BÚSQUEDA — SU PROPIA PANTALLA** (S113-C · fase 3 · C3, corrección de
 * la mesa).
 *
 * ── QUÉ ESTABA MAL, Y NO ERA UN DETALLE ───────────────────────────────────
 * 🔴 La entrada del Hogar decía «Buscar en tu familia» **y abría el chat de
 * Nexo**. *Un control que promete un acto y hace otro no es un atajo: es una
 * promesa incumplida en el único lugar donde la familia iba a confiar.* Y el
 * chat resolvía la búsqueda **sólo si su router decidía que era una búsqueda**
 * — escribir «proplan» podía terminar en una conversación.
 *
 * ── POR QUÉ PANTALLA Y NO UN CAMPO EN EL HOGAR ────────────────────────────
 * Se probaron los dos. El Hogar ya lleva techo + tira de mascotas + entrada +
 * «Ponte al día» + recomendaciones: **un campo que al enfocarse tiene que
 * tapar todo eso es una pantalla con otro nombre**, y encima una que compite
 * con su propio contenido mientras se escribe.
 * Acá: **el teclado sale enfocado y en «buscar»**, los resultados tienen el
 * alto entero, y el atrás devuelve al Hogar tal como estaba.
 *
 * ── LO QUE NO CAMBIA ──────────────────────────────────────────────────────
 * **El chat de Nexo queda para preguntar.** Y desde los resultados sigue la
 * salida a él cuando no hay nada: *lo que el texto no encuentra puede ser una
 * pregunta, y ahí sí la IA aporta.*
 */
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Campo,
  Encabezado,
  PieDeCampo,
  ResultadosBusqueda,
  spacing,
} from '@epetplace/ui';

import { useBusqueda } from '@/components/busqueda';
import { useTraduccion } from '@/i18n';

export default function PantallaBuscar() {
  const { t } = useTraduccion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const busqueda = useBusqueda();

  return (
    <View style={{ flex: 1 }}>
      <Encabezado
        variante="navegacion"
        titulo={t('busqueda.entrada')}
        atras
        onAtras={() => router.back()}
      />
      <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[3] }}>
        {/* 🔴 **El teclado sale solo.** *Quien entró acá vino a escribir;
            pedirle un toque más para empezar es cobrarle el viaje dos veces.*
            `autoFocus` y no un `ref`: `Campo` hereda `TextInputProps` y no
            expone su ref — *se usa lo que la pieza da, no se la fuerza.*

            ⚠️ **Y este comentario va ACÁ y no entre las props**: `{/* … *​/}`
            adentro de una lista de atributos NO es JSX válido — me lo cobró el
            compilador **tres veces en esta sesión**, siempre por escribir la
            razón donde estaba mirando. Entre props va `/* … *​/` pelado; con
            llaves, sólo entre hijos. */}
        <Campo
          autoFocus
          label={t('busqueda.entrada')}
          etiquetaVisible={false}
          placeholder={t('busqueda.ejemplo')}
          value={busqueda.termino}
          onChangeText={busqueda.buscar}
          /* El teclado dice **«buscar»**, no «enviar»: *tiene que decir qué va
             a pasar al tocar su tecla.* */
          returnKeyType="search"
          sinPie
        />
        <PieDeCampo />
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing[8],
          paddingHorizontal: spacing[5],
        }}
        /* Al arrastrar la lista el teclado se va: *la familia ya escribió y
           ahora está mirando.* */
        keyboardDismissMode="on-drag"
      >
        {busqueda.termino.trim().length >= 2 ? (
          <ResultadosBusqueda
            termino={busqueda.termino}
            grupos={busqueda.grupos}
            vacio={{
              voz: t('busqueda.sinResultados', { q: busqueda.termino.trim() }),
              vozChip: t('busqueda.preguntarANexo'),
              /* 🔴 **La salida a Nexo, con la pregunta puesta.** *Hacer que la
                 familia la escriba de nuevo es pedirle que repita lo que la
                 pantalla acaba de leer.* */
              onPreguntar: () =>
                router.push({ pathname: '/nexo', params: { semilla: busqueda.termino.trim() } }),
            }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
