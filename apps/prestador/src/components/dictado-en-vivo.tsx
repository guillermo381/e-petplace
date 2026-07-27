/**
 * EL DICTADO EN VIVO (S78-B — D-456, el tren de S73 por fin viaja).
 *
 * Boceto M1-M5 firmado en S73 (`2026-07-21-s73b-boceto-puerta-mic.md`),
 * construido acá con el acabado S78. Vara del founder, verbatim: *"creía
 * que iba a estar el ícono sobre la pantalla y automáticamente empezaba a
 * escuchar, como funciona en este chat."*
 *
 * TESIS: "tocás el mic y la nota se escribe sola mientras hablás."
 * FIRMA: el COMPORTAMIENTO — las palabras aterrizando en el campo.
 *
 * LOS ESTADOS DEL BOCETO, todos:
 * · REPOSO: el mic junto al campo. JAMÁS auto-graba al entrar (letra de
 *   mesa: consultorio = conversaciones con el dueño; grabar sin gesto
 *   explícito es problema de privacidad).
 * · PERMISO: el flujo del SO una vez; denegado → voz honesta, el teclado
 *   sigue siendo la vía.
 * · ESCUCHANDO: un toque arranca; estado VISIBLE con la gramática §7.1
 *   (anillo 1.5 + pill "● Escuchando" — claro; un solo vivo por
 *   pantalla); los parciales aterrizan por APPEND y lo tipeado JAMÁS se
 *   pisa (rebase si el vet editó en el medio); otro toque para.
 * · NO DISPONIBLE: el control NO SE DIBUJA (Ley 23) — cubre las DOS
 *   ausencias: el módulo nativo no horneado (los APK ≤1.0.2 no llevan el
 *   tren: require en try/catch, jamás crash) y el reconocedor del SO
 *   apagado (`isRecognitionAvailable()`).
 * · ERROR EN VIVO: la escucha para DICIENDO que paró; lo transcrito
 *   QUEDA (nada se pierde); reintento = volver a tocar.
 *
 * CERO PERSISTENCIA DE AUDIO (v1). El pipeline no cambia: el texto entra
 * al estado `dictado` existente — estructurar → muro §8.3 → sedimentar
 * siguen tal cual (la trampa L-139 que es PASS sigue rigiendo).
 *
 * El glifo mic es de CONTROL (como la campana del Encabezado, S43) — no
 * es ícono b′ de oficio (no porta huella: la regla madre es de los
 * oficios). Trazo 1.9, remates redondeados. Gate por ícono: en
 * dispositivo, con la build.
 */

import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Texto, radius, spacing, usePresionado, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

// El módulo NATIVO puede no estar horneado (build vieja, Expo Go, web):
// require guardado a nivel módulo — estable de por vida, jamás crash.
// eslint-disable-next-line @typescript-eslint/no-require-imports
let speech: typeof import('expo-speech-recognition') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  speech = require('expo-speech-recognition');
} catch {
  speech = null;
}

function unir(a: string, b: string): string {
  if (a.length === 0) return b;
  if (b.length === 0) return a;
  return a.endsWith(' ') || a.endsWith('\n') ? a + b : `${a} ${b}`;
}

export function DictadoEnVivo({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (texto: string) => void;
}) {
  // Módulo ausente: el control no existe. Constante de por vida del
  // proceso ⇒ el early-return antes de hooks es legal y estable.
  if (speech === null) return null;
  return <DictadoVivoInterno value={value} onChangeText={onChangeText} />;
}

function DictadoVivoInterno({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (texto: string) => void;
}) {
  const s = speech!;
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { handlers, estiloPresionado } = usePresionado(0.97);

  const [escuchando, setEscuchando] = useState(false);
  const [voz, setVoz] = useState<string | null>(null);
  // El texto CONFIRMADO (base) y el parcial en vuelo. Si el valor del
  // campo no coincide con base+parcial, el vet TIPEÓ en el medio: se
  // rebasa — lo tipeado jamás se pisa (letra del boceto).
  const baseRef = useRef('');
  const parcialRef = useRef('');
  const valueRef = useRef(value);
  valueRef.current = value;

  // ¿El reconocedor del SO existe? (sin Google Speech = false). Se
  // evalúa una vez; false ⇒ el control no se dibuja (Ley 23).
  const disponibleRef = useRef<boolean | null>(null);
  if (disponibleRef.current === null) {
    try {
      disponibleRef.current = s.ExpoSpeechRecognitionModule.isRecognitionAvailable();
    } catch {
      disponibleRef.current = false;
    }
  }

  s.useSpeechRecognitionEvent('result', (e) => {
    const transcript = e.results?.[0]?.transcript ?? '';
    if (transcript.length === 0) return;
    const esperado = unir(baseRef.current, parcialRef.current);
    if (valueRef.current !== esperado) {
      // el vet editó mientras escuchaba: lo suyo es la nueva base
      baseRef.current = valueRef.current;
      parcialRef.current = '';
    }
    if (e.isFinal) {
      baseRef.current = unir(baseRef.current, transcript);
      parcialRef.current = '';
      onChangeText(baseRef.current);
    } else {
      parcialRef.current = transcript;
      onChangeText(unir(baseRef.current, transcript));
    }
  });

  s.useSpeechRecognitionEvent('error', () => {
    // la escucha para DICIENDO que paró; lo transcrito QUEDA
    setEscuchando(false);
    setVoz(t('consulta.micCorte'));
  });

  s.useSpeechRecognitionEvent('end', () => {
    setEscuchando(false);
  });

  async function alternar() {
    if (escuchando) {
      s.ExpoSpeechRecognitionModule.stop();
      setEscuchando(false);
      return;
    }
    setVoz(null);
    const permiso = await s.ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permiso.granted) {
      // denegado: voz honesta con camino; el teclado sigue siendo la vía
      setVoz(t('consulta.micPermisoDenegado'));
      return;
    }
    baseRef.current = valueRef.current;
    parcialRef.current = '';
    s.ExpoSpeechRecognitionModule.start({
      // es-EC primario (el idioma del reconocedor se releva en gate)
      lang: 'es-EC',
      interimResults: true,
      continuous: true,
    });
    setEscuchando(true);
  }

  if (disponibleRef.current !== true) return null;

  const teal = theme.accent.primary;

  return (
    <View style={{ gap: spacing[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        {/* el control de dictado — comando con estado vivo (patrón nuevo
            del boceto S73; §7.1: en claro el vivo es anillo + pill) */}
        <Pressable
          onPress={() => void alternar()}
          onPressIn={handlers.onPressIn}
          onPressOut={handlers.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={escuchando ? t('consulta.micParar') : t('consulta.micCta')}
          accessibilityState={{ busy: escuchando }}
        >
          <Animated.View
            style={[
              {
                width: 44,
                height: 44,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.bg.card,
                borderWidth: escuchando ? 1.5 : theme.border.width,
                borderColor: escuchando ? teal : theme.border.default,
                boxShadow: theme.elevacion.reposo,
              },
              estiloPresionado,
            ]}
          >
          {/* glifo mic — control, trazo 1.9, remates redondeados */}
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path
              d="M12 3.2a2.9 2.9 0 0 1 2.9 2.9v5a2.9 2.9 0 0 1-5.8 0v-5A2.9 2.9 0 0 1 12 3.2Z"
              stroke={escuchando ? teal : theme.text.primary}
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M5.8 11.1a6.2 6.2 0 0 0 12.4 0M12 17.3v3.2"
              stroke={escuchando ? teal : theme.text.primary}
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
          </Animated.View>
        </Pressable>
        {escuchando ? (
          <Texto variante="apoyo">{t('consulta.micEscuchando')}</Texto>
        ) : (
          <Texto variante="apoyo">{t('consulta.micHint')}</Texto>
        )}
      </View>
      {voz !== null ? <Texto variante="apoyo">{voz}</Texto> : null}
    </View>
  );
}
