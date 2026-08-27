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

import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Boton, Hoja, Texto, radius, spacing, usePresionado, useTheme } from '@epetplace/ui';
import { consultarConsentimiento, decidirConsentimiento, VERSION_LEGAL } from '@epetplace/api';

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
  onEscuchandoCambia,
}: {
  value: string;
  onChangeText: (texto: string) => void;
  /**
   * 🔴 S106-C t3 · avisa cuándo está tomando el micrófono.
   *
   * Nace para la VIDEOCONSULTA: ahí LiveKit también tiene el micrófono, y
   * **dos consumidores del mic a la vez no conviven en Android**. La pantalla
   * usa esto para apagar el de la llamada mientras el vet dicta.
   *
   * *Y resulta ser mejor producto que un arreglo técnico: el vet está
   * dictando la NOTA CLÍNICA, no hablándole a la familia — que el dueño no
   * escuche «otitis bilateral, pronóstico reservado» es lo correcto.*
   */
  onEscuchandoCambia?: (escuchando: boolean) => void;
}) {
  // Módulo ausente: el control no existe. Constante de por vida del
  // proceso ⇒ el early-return antes de hooks es legal y estable.
  if (speech === null) return null;
  return <DictadoVivoInterno value={value} onChangeText={onChangeText} onEscuchandoCambia={onEscuchandoCambia} />;
}

function DictadoVivoInterno({
  value,
  onChangeText,
  onEscuchandoCambia,
}: {
  value: string;
  onChangeText: (texto: string) => void;
  onEscuchandoCambia?: (escuchando: boolean) => void;
}) {
  const s = speech!;
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { handlers, estiloPresionado } = usePresionado(0.97);

  const [escuchando, setEscuchando] = useState(false);
  /* El aviso al padre viaja por efecto y no dentro de cada handler: así hay
     UN solo lugar que lo emite y no puede quedar un camino de apagado que se
     olvide de avisar — que dejaría el micrófono de la llamada apagado para
     siempre. */
  useEffect(() => {
    onEscuchandoCambia?.(escuchando);
  }, [escuchando, onEscuchandoCambia]);
  const [voz, setVoz] = useState<string | null>(null);
  // §31.6 · el consentimiento del dictado. `consentidoRef` cachea que ya
  // consintió (no re-consulta en cada toque); `pidiendo` muestra la Hoja.
  const consentidoRef = useRef(false);
  const [pidiendo, setPidiendo] = useState(false);
  const [guardandoConsent, setGuardandoConsent] = useState(false);
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

  // El arranque real del reconocedor — separado del gate de consentimiento.
  async function arrancar() {
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

  async function alternar() {
    if (escuchando) {
      s.ExpoSpeechRecognitionModule.stop();
      setEscuchando(false);
      return;
    }
    setVoz(null);
    // §31.6: consentimiento PREVIO, específico y separado la 1ª vez. Avisar no
    // es consentir — el micro-copy no alcanza. Si ya consintió (fila vigente),
    // arranca directo; si no, se pide y NO arranca hasta que acepte.
    if (!consentidoRef.current) {
      const estado = await consultarConsentimiento('dictado_voz');
      if (estado.ok && estado.data.vigente) {
        consentidoRef.current = true;
      } else {
        setPidiendo(true);
        return;
      }
    }
    await arrancar();
  }

  async function aceptarDictado() {
    if (guardandoConsent) return;
    setGuardandoConsent(true);
    const r = await decidirConsentimiento({
      acto: 'dictado_voz',
      aceptado: true,
      // La versión del acto es la del T&C del que es cláusula (§31.6), jamás un
      // número tecleado.
      version: VERSION_LEGAL.terminos_professional,
    });
    setGuardandoConsent(false);
    if (!r.ok) {
      setVoz(r.mensaje);
      return;
    }
    consentidoRef.current = true;
    setPidiendo(false);
    await arrancar();
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
      {/* S104-C · D-899 — el aviso de privacidad del dictado (firma founder:
          DECLARAR, no forzar el modo local). La transcripción la hace el
          servicio de voz del SISTEMA (Google en Android, Apple en iOS) y puede
          procesarse en la nube del fabricante: es una transferencia que la
          persona no puede inferir de «dictar». Va VISIBLE en la pantalla, no
          escondido en un ícono; y como este componente retorna null cuando el
          dictado no está disponible, el aviso solo aparece cuando la voz de
          verdad puede salir del teléfono. */}
      <Texto variante="apoyo">{t('consulta.micPrivacidad')}</Texto>
      {voz !== null ? <Texto variante="apoyo">{voz}</Texto> : null}

      {/* §31.6 · el consentimiento PREVIO del dictado — se pide la 1ª vez, antes
          de arrancar. No arranca hasta que acepte; puede escribir la nota a
          mano y revocar después desde Cuenta. */}
      <Hoja visible={pidiendo} onCerrar={() => setPidiendo(false)} titulo={t('consulta.dictadoConsentTitulo')}>
        <View style={{ gap: spacing[4] }}>
          <Texto>{t('consulta.dictadoConsentCuerpo')}</Texto>
          <Texto variante="apoyo">{t('consulta.dictadoConsentOpcional')}</Texto>
          <Boton
            etiqueta={t('consulta.dictadoConsentAcepto')}
            bloque
            cargando={guardandoConsent}
            onPress={() => void aceptarDictado()}
          />
          <Boton
            variante="ghost"
            etiqueta={t('consulta.dictadoConsentAhoraNo')}
            bloque
            onPress={() => setPidiendo(false)}
          />
        </View>
      </Hoja>
    </View>
  );
}
