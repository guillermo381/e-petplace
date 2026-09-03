/**
 * EL GRABADOR A PANTALLA COMPLETA (S112-C · G9).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL CLIP SE GRABABA A CIEGAS, Y LA CAUSA NO ERA NINGUNA DE LAS DOS QUE
 *    EL REPORTE SOSPECHABA.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El brief preguntaba si el picker estaba en modo sin preview o si la pieza no
 * recibía el ref de la cámara. **Medido: las dos son falsas.**
 * `EvidenciaClip` recibe la `CameraView` como slot, con su `ref`, su
 * `mode="video"` y su `facing`. La cámara **se monta y graba de verdad** — la
 * fila existe, que es lo que el founder vio.
 *
 * **Lo que fallaba es de LAYOUT:** la pieza renderiza `{vista}` como primer
 * hijo de un `View` que se dimensiona por su contenido, dentro de una `Hoja`.
 * La `CameraView` lleva `flex: 1`. **Un hijo `flex: 1` dentro de un contenedor
 * sin alto propio colapsa a CERO** — así que la cámara estaba ahí, encendida,
 * midiendo cero píxeles de alto.
 *
 * *Y por eso la foto sí se veía:* la foto **no usa una cámara en la app** —usa
 * `ImagePicker.launchCameraAsync`, o sea **la cámara del sistema**, que trae su
 * propio visor a pantalla completa—. Las dos superficies no eran «la misma cosa
 * con un bug en una»: eran dos mecanismos distintos, y sólo uno tenía que
 * resolver su propio visor.
 *
 * ── POR QUÉ UNA PANTALLA Y NO UN ALTO EN LA PIEZA ────────────────────────
 * Ponerle `height` al slot habría curado *«no veo nada»* y no lo que el founder
 * pidió: *«la cámara a pantalla completa, un punto y el tiempo corriendo
 * arriba, y un solo botón grande para parar»*. **Grabar es un acto de una sola
 * cosa por vez** — mientras corre, la guía de encuadre, los destinatarios y el
 * resto de la hoja no sirven para nada y compiten por el ojo.
 *
 * ⇒ La hoja conserva el **antes** (la guía) y el **después** (a quién le llega,
 * publicar); **el durante se va a pantalla completa**. `EvidenciaClip` no se
 * toca: sigue siendo la pieza del antes y el después.
 *
 * ── ⚠️ ESTA PANTALLA VIVE EN LA APP Y NO EN `packages/ui`, y no es capricho ──
 * `expo-camera` **no está en `packages/ui` ni en el cliente** — un import duro
 * allá rompería el bundle del cliente, y por nativo **ni siquiera se arregla
 * por OTA**. Es la misma razón por la que `EvidenciaClip` recibe la vista como
 * slot en vez de montarla.
 *
 * ── EL REVISADO, Y POR QUÉ EXISTE ────────────────────────────────────────
 * *«Al parar, veo el clip un segundo y elijo usar o repetir.»* Sin eso, el
 * cuidador manda un clip que **no vio**: la única forma de saber si salió bien
 * era publicarlo y mirarlo del otro lado. **Repetir descarta y vuelve a
 * encuadre** — no acumula, porque un clip descartado que sigue en disco es
 * basura que alguien va a mandar por error.
 */

import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContadorClip, palette, radius, spacing, typography } from '@epetplace/ui';

/* `Texto` de la casa resuelve su color del TEMA, y acá el fondo es la imagen de
   la cámara — no una superficie del tema. Por eso el texto va crudo con la
   tipografía de la casa, que es el mismo patrón que ya usa el muro del oficio
   en la Cuenta: *la escala del muro no está en el tema, así que sus piezas no
   pueden cruzar por ahí.* */
const sobreCamara = {
  fontFamily: typography.family.sans.medium,
  fontSize: typography.size.base,
} as const;

/** El momento del grabador. `revisando` es el que el founder pidió. */
export type MomentoGrabador =
  | { fase: 'encuadre' }
  | { fase: 'grabando'; inicioTs: number }
  | { fase: 'revisando'; uri: string; duracionS: number };

export interface GrabadorClipProps {
  visible: boolean;
  momento: MomentoGrabador;
  techoSeg: number;
  /** Del PERMISO, no de una preferencia: es prop de la vista, no del grabador. */
  sinAudio: boolean;
  /** Arranca la grabación. La pantalla no la maneja: sólo la pide. */
  onGrabar: (cam: CameraView) => void;
  onDetener: () => void;
  /** El techo lo corta el grabador; esto es el aviso al contador. */
  onTecho: () => void;
  /** Se queda con el clip revisado. */
  onUsar: () => void;
  /** Descarta y vuelve a encuadre. */
  onRepetir: () => void;
  onCerrar: () => void;
  voces: {
    /** Lo único que se lee mientras corre, además del reloj. */
    grabando: string;
    detener: string;
    grabar: string;
    usar: string;
    repetir: string;
    cerrar: string;
  };
}

export function GrabadorClip({
  visible,
  momento,
  techoSeg,
  sinAudio,
  onGrabar,
  onDetener,
  onTecho,
  onUsar,
  onRepetir,
  onCerrar,
  voces,
}: GrabadorClipProps) {
  const insets = useSafeAreaInsets();
  const camRef = useRef<CameraView>(null);
  const [listaCam, setListaCam] = useState(false);

  /* El reproductor se crea SIEMPRE (los hooks no pueden ser condicionales) y
     recibe `null` mientras no hay clip: `expo-video` lo admite y no carga nada.
     *Crearlo dentro de la rama de revisión habría sido un hook condicional, que
     es un error de React y no un detalle de estilo.* */
  const uriRevisando = momento.fase === 'revisando' ? momento.uri : null;
  const reproductor = useVideoPlayer(uriRevisando, (p) => {
    /* Arranca solo y en bucle: **son tres segundos y el cuidador está decidiendo
       si sirve**, no mirando una película. Un play manual acá sería un toque de
       más entre él y la decisión. */
    p.loop = true;
    p.muted = true;
    p.play();
  });

  /* Al cerrarse, la cámara deja de estar lista: si el flag quedara en `true`, al
     reabrir se ofrecería grabar contra un `ref` que todavía no montó. */
  useEffect(() => {
    if (!visible) setListaCam(false);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      /* `onRequestClose` es el back de Android. **Sin él, el gesto de volver no
         hace nada y la pantalla se siente trabada** — y acá cuesta más que en
         otras, porque tapa todo. */
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: palette.dark0 }}>
        {momento.fase === 'revisando' ? (
          /* EL REVISADO. `contentFit="contain"`: el clip se ve ENTERO aunque
             deje bandas — *recortar lo que alguien está por aprobar le esconde
             justo la parte que podría estar mal.* */
          <VideoView
            player={reproductor}
            style={{ flex: 1 }}
            contentFit="contain"
            nativeControls={false}
          />
        ) : (
          <CameraView
            ref={camRef}
            style={{ flex: 1 }}
            mode="video"
            facing="back"
            videoQuality="720p"
            videoBitrate={2_500_000}
            /* Sale del PERMISO. Pedirle audio al grabador es pedirle lo que el
               sistema ya negó. */
            mute={sinAudio}
            onCameraReady={() => setListaCam(true)}
          />
        )}

        {/* ── ARRIBA: el punto y el reloj, sólo mientras corre ────────────
            *Un indicador de grabación que se ve cuando NO se está grabando es
            peor que ninguno: enseña a no mirarlo.* */}
        {momento.fase === 'grabando' ? (
          <View
            style={{
              position: 'absolute',
              top: insets.top + spacing[4],
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[2],
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
              borderRadius: radius.full,
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: radius.full,
                backgroundColor: palette.pink,
              }}
            />
            <ContadorClip inicioTs={momento.inicioTs} techoSeg={techoSeg} onTecho={onTecho} />
          </View>
        ) : null}

        {/* ── ABAJO: UN SOLO botón grande mientras se graba ───────────────
            Es un obturador y no un `Boton` de la casa a propósito: **acá el
            control es la superficie**, redondo y del tamaño del pulgar, como en
            cualquier cámara. *Un botón rectangular con una etiqueta al pie de
            una cámara a pantalla completa se lee como un formulario.* */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: insets.bottom + spacing[6],
            alignItems: 'center',
            gap: spacing[4],
          }}
        >
          {momento.fase === 'revisando' ? (
            <View style={{ flexDirection: 'row', gap: spacing[4] }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={voces.repetir}
                onPress={onRepetir}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing[5],
                  paddingVertical: spacing[3],
                  borderRadius: radius.full,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ ...sobreCamara, color: palette.light0 }}>{voces.repetir}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={voces.usar}
                onPress={onUsar}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing[5],
                  paddingVertical: spacing[3],
                  borderRadius: radius.full,
                  backgroundColor: palette.light0,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ ...sobreCamara, color: palette.dark0 }}>{voces.usar}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={momento.fase === 'grabando' ? voces.detener : voces.grabar}
              /* 🔴 **No se ofrece grabar antes de que la cámara esté lista.**
                 `recordAsync` sobre un `ref` que todavía no montó falla, y ese
                 fallo se ve exactamente igual que el defecto que esta pantalla
                 viene a curar: se toca, no pasa nada visible. */
              disabled={momento.fase === 'encuadre' && !listaCam}
              onPress={() => {
                if (momento.fase === 'grabando') return onDetener();
                if (camRef.current !== null) onGrabar(camRef.current);
              }}
              style={({ pressed }) => ({
                width: 78,
                height: 78,
                borderRadius: radius.full,
                borderWidth: 4,
                borderColor: palette.light0,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : momento.fase === 'encuadre' && !listaCam ? 0.4 : 1,
              })}
            >
              {/* Círculo mientras espera · cuadrado mientras graba: es el
                  vocabulario que toda cámara usa, y no necesita palabra. */}
              <View
                style={{
                  width: momento.fase === 'grabando' ? 30 : 62,
                  height: momento.fase === 'grabando' ? 30 : 62,
                  borderRadius: momento.fase === 'grabando' ? radius.suave : radius.full,
                  backgroundColor: palette.pink,
                }}
              />
            </Pressable>
          )}
        </View>

        {/* Salir. Va arriba a la izquierda y NO mientras se graba: *ofrecer
            cerrar en medio de una grabación invita a perderla sin decirlo.* */}
        {momento.fase === 'encuadre' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voces.cerrar}
            onPress={onCerrar}
            hitSlop={12}
            style={{
              position: 'absolute',
              top: insets.top + spacing[4],
              left: spacing[4],
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
              borderRadius: radius.full,
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          >
            <Text style={{ ...sobreCamara, color: palette.light0 }}>{voces.cerrar}</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}
