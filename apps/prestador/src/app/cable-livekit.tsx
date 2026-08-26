/**
 * ☠️ **LA PRUEBA DE CABLE DE LIVEKIT** — andamio dev-only, S106-C tanda 1.
 * Aplica `docs/relevamientos/2026-08-25-s106-d-SPEC-CABLE-C.md` (pista D).
 *
 * **Su condición de muerte vive en `lib/livekit-cable.ts`** — los dos se
 * borran en el mismo commit.
 *
 * 🔴 **`__DEV__` — NO VIAJA A PREVIEW NI A PRODUCCIÓN.** Precedente de la casa
 * para andamios de ensayo (`pagos/deuna-ensayo.tsx`, S103-C).
 * ⚠️ **Y de ahí sale una condición de build que A tiene que saber: esta
 * pantalla SOLO se dibuja con `__DEV__ === true`, o sea con el perfil
 * `development`.** Con `preview` el módulo nativo viaja igual pero la pantalla
 * se niega a montarse, y el gate no se puede correr.
 *
 * **Lo que esta prueba NO es** (spec §7): no es la pantalla de teleconsulta ·
 * no toca citas reales · no prueba autorización (eso es `video-token` + la RPC
 * de A) · **no graba nada** — la letra no menciona grabación.
 *
 * **El criterio de verde lo fija la spec §5 y son CINCO cosas juntas:** build
 * compila · dos aparatos entran · **se ven en AMBOS sentidos** · **se oyen en
 * AMBOS sentidos** · en la red real de Quito. *Falta una ⇒ rojo, y el rojo
 * sube con su literal.*
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, Campo, Encabezado, EstadoVacio, Tarjeta, Texto, radius, spacing, useTheme } from '@epetplace/ui';

import { LIVEKIT_URL_DEFECTO, SALA_CABLE, livekit, livekitMotivoFallo } from '@/lib/livekit-cable';

export default function CableLiveKit() {
  const router = useRouter();
  const { theme } = useTheme();
  const [conectar, setConectar] = useState(false);
  /* El token se PEGA acá, uno distinto por aparato (spec §4). No vive en el
     repo: ver el porqué en `lib/livekit-cable.ts`. */
  const [url, setUrl] = useState(LIVEKIT_URL_DEFECTO);
  const [token, setToken] = useState('');
  const listo = url.trim().length > 0 && token.trim().length > 0;

  // El gate del andamio, idéntico al de `deuna-ensayo`.
  if (!__DEV__) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="—" atras onAtras={() => router.back()} />
        <EstadoVacio registro="pantalla" titulo="—" descripcion="—" />
      </View>
    );
  }

  const cabecera = (
    <Encabezado
      variante="navegacion"
      titulo="Cable · LiveKit"
      atras
      onAtras={() => router.back()}
    />
  );

  /* ── ① EL MÓDULO NATIVO NO ESTÁ ────────────────────────────────────────
     Expo Go, o un binario horneado antes de esta build. **Se dice con su
     literal**, porque la spec §6 pide el mensaje textual y no una paráfrasis:
     un rojo sin literal obliga a repetir la prueba entera. */
  if (livekit === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        {cabecera}
        <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
          <EstadoVacio
            registro="pantalla"
            titulo="El módulo nativo de video no está en este binario"
            descripcion="LiveKit es módulo nativo: no corre en Expo Go ni en una build anterior a esta. Hace falta una development build nueva."
          />
          {livekitMotivoFallo !== null && (
            <Tarjeta elevacion="reposo">
              <Texto variante="apoyo">Literal del fallo (va al reporte, sin parafrasear):</Texto>
              <Texto variante="dato">{livekitMotivoFallo}</Texto>
            </Tarjeta>
          )}
        </ScrollView>
      </View>
    );
  }

  const { LiveKitRoom } = livekit;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {cabecera}
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        <Tarjeta elevacion="reposo">
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">Sala {SALA_CABLE}</Texto>
            <Texto variante="apoyo">
              Los dos aparatos tienen que usar esta misma sala y esta misma URL. Si cada uno entra
              a una sala distinta, se ve igual que un cable roto: cada uno solo y sin error.
            </Texto>
          </View>
        </Tarjeta>

        {!conectar ? (
          <Tarjeta elevacion="reposo">
            <View style={{ gap: spacing[3] }}>
              <Campo label="URL del servidor" value={url} onChangeText={setUrl} autoCapitalize="none" />
              <Campo
                label="Token de este aparato"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                multilinea={3}
              />
              {/* 🔴 El aviso que evita el falso verde: dos aparatos con el
                  MISMO token no prueban los dos sentidos. */}
              <Texto variante="apoyo">
                Pegá el token A en un aparato y el B en el otro. El mismo token en los dos no prueba
                nada. Duran 4 horas.
              </Texto>
              <Boton
                variante="primario"
                etiqueta="Conectar"
                onPress={() => setConectar(true)}
                deshabilitado={!listo}
              />
            </View>
          </Tarjeta>
        ) : (
          <LiveKitRoom serverUrl={url.trim()} token={token.trim()} connect audio video>
            <CuadritosDeCable />
          </LiveKitRoom>
        )}
      </ScrollView>
    </View>
  );
}

/* ── LOS DOS CUADRITOS ────────────────────────────────────────────────────
   La spec §7 lo dice literal: *«no hay que diseñar nada: dos cuadritos de
   video alcanzan»*. Uno propio y uno del otro — y **están separados a
   propósito**: el criterio ③ es «se ven en AMBOS sentidos», y un SFU mal
   configurado deja pasar un sentido solo. *El que publica se ve a sí mismo y
   cree que anduvo.* */
function CuadritosDeCable() {
  const { theme } = useTheme();
  if (livekit === null) return null;
  const { VideoTrack, useLocalParticipant, useRemoteParticipants, useParticipantTracks } = livekit;

  const { localParticipant } = useLocalParticipant();
  const remotos = useRemoteParticipants();
  // 'camera' es el valor de `Track.Source.Camera` en livekit-client.
  const propias = useParticipantTracks(['camera' as never], localParticipant.identity);
  const ajenas = useParticipantTracks(['camera' as never], remotos[0]?.identity);

  const marco = {
    height: 200,
    borderRadius: radius.suave,
    overflow: 'hidden' as const,
    backgroundColor: theme.bg.elevated,
  };

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ gap: spacing[2] }}>
        <Texto variante="seccion">Vos</Texto>
        <View style={marco}>
          <VideoTrack trackRef={propias[0]} style={{ flex: 1 }} />
        </View>
      </View>

      <View style={{ gap: spacing[2] }}>
        <Texto variante="seccion">El otro aparato</Texto>
        {remotos.length === 0 ? (
          <Texto variante="apoyo">
            Todavía no entró nadie más. Con un solo aparato conectado esta prueba no dice nada.
          </Texto>
        ) : (
          <View style={marco}>
            <VideoTrack trackRef={ajenas[0]} style={{ flex: 1 }} />
          </View>
        )}
      </View>

      <Texto variante="apoyo">
        Verde exige las cinco: build, los dos adentro, verse en los dos sentidos, oírse en los dos
        sentidos, y en la red real de Quito. Falta una y es rojo.
      </Texto>
    </View>
  );
}
