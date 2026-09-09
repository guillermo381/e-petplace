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
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Campo,
  Encabezado,
  PieDeCampo,
  ResultadosBusqueda,
  spacing,
  useAviso,
} from '@epetplace/ui';

import { useBusqueda } from '@/components/busqueda';
import { ElegirMascotaHoja } from '@/components/nexo/elegir-mascota-hoja';
import { useTraduccion } from '@/i18n';
import { focoNexo } from '@/lib/nexo/atajos';
import { useHogarVivo } from '@/lib/nexo/hogar-vivo';

export default function PantallaBuscar() {
  const { t } = useTraduccion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const busqueda = useBusqueda();
  const aviso = useAviso();

  /* ═══ 🔴 LA SALIDA A NEXO NECESITA UNA MASCOTA, Y NO LA LLEVABA ═══════════
     **El founder lo caminó: la caja dejaba escribir y el envío no hacía nada.**
     Medido, y son dos defectos encadenados, los dos míos:

     ① esta pantalla empujaba `/nexo` **sólo con `semilla`** — sin `mascotaId`;
     ② `nexo.tsx` **exige** mascota: su `enviar` abre con
        `if (mascotaId === undefined … ) return`, y su botón sigue habilitado
        porque su `disabled` sólo mira el texto.

     ⇒ la familia llegaba, escribía, tocaba enviar **y el guard salía en
     silencio**. *No es «la superficie falla»: es que esta puerta nunca tuvo
     camino — invitaba y no abría, y del otro lado un botón encendido devolvía
     nada.*

     La cura reusa lo que la casa ya resolvió para la burbuja: `focoNexo` —una
     sola mascota entra directo, varias abren la hoja corta, **ninguna activa y
     la salida no se ofrece**—. *Nexo le habla a una mascota; ofrecer preguntar
     sin poder decirle de quién es la misma puerta rota con otra cara.* */
  const mascotas = useHogarVivo();
  const foco = focoNexo({ mascotaIdEnRuta: undefined, mascotas });
  const [eligiendo, setEligiendo] = useState(false);

  const irANexo = (m: { id: string; nombre: string }) => {
    setEligiendo(false);
    router.push({
      pathname: '/nexo',
      /* La `semilla` viaja **y Nexo ahora la lee**: hasta hoy la mandaba y del
         otro lado nadie la recibía, así que la familia reescribía lo que la
         pantalla acababa de leerle. */
      params: { mascotaId: m.id, nombre: m.nombre, semilla: busqueda.termino.trim() },
    });
  };

  /* 🔴 **El chip SIEMPRE tiene acto, y eso no es mío: lo exige la pieza.**
     `ResultadosBusqueda` pide voz **y** salida — *«un buscador que dice que no
     y no ofrece nada enseña a no volver a buscar»*—, y el criterio es correcto.
     Así que donde no hay mascota a la que preguntarle **no se apaga el chip:
     se contesta por qué**. *Callar acá sería el callejón que la pieza existe
     para impedir; llevarla a una pantalla que no puede responder sería la
     puerta rota que esta cura vino a cerrar. Decirlo es lo único honesto.* */
  const abrirNexo =
    foco.modo === 'directa'
      ? () => irANexo(foco.mascota)
      : foco.modo === 'elegir'
        ? () => setEligiendo(true)
        : () =>
            aviso.mostrar({
              variante: 'neutro',
              texto:
                foco.modo === 'cargando' ? t('busqueda.nexoCargando') : t('busqueda.nexoSinMascota'),
            });

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
        /* 🔴 **Y AL TOCAR, EL TOQUE LLEGA.** Medido en aparato: con el teclado
           arriba, el primer toque sobre «Preguntarle a Nexo» **sólo cerraba el
           teclado** y se lo tragaba — había que tocar dos veces. *Un control
           que necesita dos toques se lee como roto en el primero*, y es
           justamente el chip de la salida que esta pantalla acaba de curar.
           `"handled"` deja pasar el toque a quien lo maneja. */
        keyboardShouldPersistTaps="handled"
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
              onPreguntar: abrirNexo,
            }}
          />
        ) : null}
      </ScrollView>
      <ElegirMascotaHoja
        visible={eligiendo}
        titulo={t('nexo.elegirMascota')}
        mascotas={foco.modo === 'elegir' ? foco.entre : []}
        onElegir={irANexo}
        onCerrar={() => setEligiendo(false)}
      />
    </View>
  );
}
