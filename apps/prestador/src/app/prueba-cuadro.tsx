/**
 * LA PRUEBA BARATA DEL CUADRO CONGELADO — pantalla de gate, no de producto.
 *
 * ── EL ORDEN QUE LA MESA FIJÓ, Y POR QUÉ ─────────────────────────────────
 * **Contra el TRACK LOCAL de la cámara, antes del módulo completo.**
 * `getUserMedia` del fork da **el mismo `VideoTrack` y el mismo `addSink`**
 * que el remoto ⇒ **cero dependencias nuevas, sin LiveKit, sin sala, sin
 * cita, un solo aparato.**
 *
 * **Su límite, declarado por D y respetado acá:** *si no anda con el local no
 * va a andar con el remoto; si anda, falta confirmarlo con el remoto antes de
 * dar verde.* **Esta pantalla NO cierra el verde: lo destraba.**
 *
 * ── 🔴 EL CRITERIO, ESCRITO ANTES DE CORRER ──────────────────────────────
 * ① **La imagen tiene que ser LA DEL VIDEO** — por eso la pantalla pide
 *    apuntar la cámara **a algo escrito a mano** y muestra el PNG al lado del
 *    preview: *producir «una imagen» no es producir «la imagen»; un frame
 *    negro o del arranque también pesa, abre y se ve como una foto.* Y **un
 *    rectángulo negro en una historia clínica no es un bug de UI: es un dato
 *    clínico falso**, que alguien lee años después para decidir algo.
 * ② **Android Y iOS.** Si anda en una sola, es **descarte**, no verde
 *    parcial.
 *
 * ── ⚠️ ES DEV-ONLY Y SE RETIRA ───────────────────────────────────────────
 * No tiene entrada desde ninguna pantalla: se llega por deep link. *Una
 * pantalla de gate que queda alcanzable en producción es una puerta que nadie
 * volvió a mirar.* **Se retira cuando el botón real exista.**
 */

import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton, Encabezado, Texto, radius, spacing, useTheme } from '@epetplace/ui';
import { mediaDevices, type MediaStream } from '@livekit/react-native-webrtc';
import { capturarCuadro, cuadroDisponible } from '@epetplace/cuadro-video';

import { PreviewPropio } from '@/components/videollamada-piezas';

export default function PruebaCuadro() {
  const { theme } = useTheme();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ruta, setRuta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    let vigente = true;
    void mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((s) => {
        if (vigente) setStream(s as MediaStream);
        else (s as MediaStream).getTracks().forEach((t) => t.stop());
      })
      .catch((e: unknown) => {
        if (vigente) setError(`getUserMedia: ${String(e)}`);
      });
    return () => {
      vigente = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capturar = useCallback(async () => {
    const pista = stream?.getVideoTracks()[0];
    if (pista === undefined) {
      setError('No hay track de video.');
      return;
    }
    setTrabajando(true);
    setError(null);
    /* `-1` = track LOCAL. **El mismo argumento que va a llevar el remoto**:
       por eso probar con el local ejercita el camino real y no un atajo. */
    const r = await capturarCuadro(pista.id, -1);
    setTrabajando(false);
    /* El resultado pasó a discriminado: **el código tipado ya no se pierde**
       — antes `null` mezclaba «binario sin hornear», «track no encontrado» y
       «falló la conversión», que son tres cosas distintas de arreglar. */
    if (r.ok) setRuta(r.ruta);
    else setError(`${r.codigo}: ${r.mensaje}`);
  }, [stream]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={[]}>
      <Encabezado variante="navegacion" titulo="Prueba · cuadro congelado" />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        <Texto variante="cuerpo">
          Apuntá la cámara a algo escrito a mano y capturá. La imagen de abajo tiene
          que decir lo mismo que el video de arriba.
        </Texto>

        {!cuadroDisponible && (
          <Texto variante="apoyo">
            El módulo nativo NO está en este binario. Hace falta la build que lo hornea.
          </Texto>
        )}

        <View style={{ height: 220, backgroundColor: theme.bg.tinta, borderRadius: radius.md, overflow: 'hidden' }}>
          <PreviewPropio activa camara="environment" />
        </View>

        <Boton
          variante="primario"
          etiqueta={trabajando ? 'Capturando…' : 'Capturar cuadro'}
          onPress={() => void capturar()}
          cargando={trabajando}
        />

        {error !== null && <Texto variante="apoyo">{error}</Texto>}

        {ruta !== null && (
          <View style={{ gap: spacing[2] }}>
            <Texto variante="dato">{ruta}</Texto>
            <Image
              source={{ uri: `file://${ruta}` }}
              style={{ width: '100%', height: 220, borderRadius: radius.md }}
              resizeMode="contain"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
