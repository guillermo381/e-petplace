/**
 * Cuenta · SEGURIDAD — LA CONTRASEÑA (S103-C).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ 🔴 NO FALTABA MOTOR: FALTABA LA PANTALLA.                            │
 * │                                                                      │
 * │ `packages/api/src/wrappers/seguridad.ts` existe desde S84 con las    │
 * │ cuatro funciones, y hoy **su único consumidor era el prestador**.    │
 * │ Una familia no tenía NINGÚN camino para cambiar su clave.            │
 * │                                                                      │
 * │ *Es `L-318` otra vez —motor sin puerta—, pero con una diferencia que │
 * │ importa: acá el motor sí tenía puerta, en la otra app. **Lo que      │
 * │ faltaba no era construir: era montar lo que ya existía en el segundo │
 * │ lugar donde el mismo humano lo necesita.***                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── PATRÓN HEREDADO, NO REDISEÑO ─────────────────────────────────────────
 * Es la misma función para el mismo humano, así que **la anatomía sale de
 * `apps/prestador/.../cuenta/seguridad.tsx` verbatim**: tres campos secure,
 * la confirmación validada ANTES de salir a la red, el rebote que se queda
 * en pantalla, y **no navegar al terminar**.
 *
 * ⚠️ **Y las voces también se heredan literales** porque ya estaban en tuteo
 * neutro (*«la clave con la que entras»*, *«Repite la nueva contraseña»*).
 * *Reescribirlas habría producido dos frases distintas para el mismo acto —
 * el defecto que la casa llama dos superficies desacordando sin síntoma.*
 *
 * ── 🔴 LAS DOS DIFERENCIAS MEDIDAS, Y NINGUNA ES COSMÉTICA ───────────────
 *
 * **① NO LLEVA EL CAMPO DEL CORREO, y omitirlo es aplicar el patrón, no
 * romperlo.** El prestador lo tiene **porque su pantalla ABSORBIÓ a
 * `cuenta/identidad`** (S85-C2) y ese correo es lo que sobrevivió de la
 * fusión. **En el cliente el correo ya vive en Tu perfil**
 * (`cuenta/perfil.tsx:196`, `cuenta.emailLabel`) — medido. *Copiarlo acá
 * habría creado las DOS PUERTAS PARA UNA COSA que la pantalla del prestador
 * existe para haber cerrado.*
 *
 * ⇒ **Y eso tiene una consecuencia buena que se declara:** sin el correo no
 * hay nada que leer, así que **esta pantalla no hace un solo viaje de red al
 * abrir**. Mueren el esqueleto y el estado de error del prestador — *no por
 * recorte: porque un estado de carga que no carga nada es un estado que
 * miente.*
 *
 * **② LA SALIDA DE LAS CUENTAS SOLO-GOOGLE ES SOPORTE, NO `/recuperar`.**
 * Medido: **`/recuperar` NO existe en el cliente** (`apps/cliente/src/app/`
 * no la tiene; el prestador sí). *Copiar el botón habría dado una puerta que
 * rebota — Ley 23 en su forma más barata de evitar.* El cliente **sí** tiene
 * camino a soporte (`lib/contacto.ts`, estrenado en `cuenta/ayuda`), y una
 * persona sin contraseña que llega por ahí sale con una respuesta humana.
 *
 * 🔴 **Esto NO cierra el hueco, lo puentea, y hay que decirlo:** la familia
 * solo-Google **sigue sin poder crearse una clave sola**. Lo correcto es que
 * el cliente tenga su `/recuperar` como el prestador — *es pantalla, no
 * motor: las cuatro funciones ya están*. **Queda declarado como lo que
 * falta, no disimulado con un botón que va a otro lado.**
 *
 * ── TESIS · FIRMA · CHANEL ───────────────────────────────────────────────
 * TESIS: tu cuenta es tuya, y podés cerrarle la puerta a cualquiera.
 * FIRMA: el rebote que **termina en una salida**, jamás en una pared —
 * incluso el caso que no podemos resolver solos.
 * CHANEL: sin correo repetido, sin esqueleto que no carga nada, sin
 * navegación al terminar. *Tres cosas que el patrón traía y acá sobran.*
 */

import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Encabezado,
  EvitaTeclado,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { cambiarContrasena, MIN_LARGO_CONTRASENA, segundosDeEspera } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { urlWhatsApp, WHATSAPP_EQUIPO_HUMANO } from '@/lib/contacto';

export default function Seguridad() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [cambiando, setCambiando] = useState(false);
  const [listo, setListo] = useState(false);
  /** El rebote se muestra EN LA PANTALLA y no solo en un toast: los de
   *  seguridad hay que poder releerlos, y un toast se va. */
  const [rebote, setRebote] = useState<{ texto: string; salida: 'soporte' | null } | null>(null);

  async function abrirSoporte() {
    const url = urlWhatsApp(t('seguridad.mensajeSoporte'));
    try {
      await Linking.openURL(url);
    } catch {
      /* Sin WhatsApp instalado el enlace no abre. **El número humano se dice
         en vez de dejar a la persona sin nada** — mismo fallback que
         `cuenta/ayuda`. */
      mostrar({
        variante: 'neutro',
        texto: t('seguridad.soporteFallback', { numero: WHATSAPP_EQUIPO_HUMANO }),
      });
    }
  }

  async function cambiarClave() {
    if (cambiando) return;
    setRebote(null);
    setListo(false);

    /* LA CONFIRMACIÓN SE COMPARA ANTES DE SALIR A LA RED, y ése es todo su
       punto: los tres campos son `secure`, así que se escribe A CIEGAS y un
       dedo torcido produce una clave que nadie conoce — ni la familia, que
       creyó escribir otra cosa, ni nosotros. **Es el único error de esta
       pantalla que el servidor NO puede cazar**: para él las dos son
       válidas. Por eso el rebote no gasta un viaje (Ley 23). */
    if (nueva !== confirmacion) {
      setRebote({ texto: t('seguridad.noCoinciden'), salida: null });
      return;
    }

    setCambiando(true);
    const r = await cambiarContrasena({ actual, nueva });
    setCambiando(false);
    if (!r.ok) {
      if (r.codigo === 'sin_contrasena') {
        /* ⚠️ LAS CUENTAS SOLO-GOOGLE. A alguien que NO TIENE contraseña
           decirle «la actual no coincide» es mandarlo a probar variantes de
           algo que no existe. **En el cliente la salida es soporte y no
           `/recuperar`, porque esa ruta no existe acá** (ver la cabecera):
           mejor una persona que responde que un botón que rebota. */
        setRebote({ texto: t('seguridad.soloGoogle'), salida: 'soporte' });
        return;
      }
      if (r.codigo === 'demasiados_intentos') {
        /* EL RATE LIMIT DICE CUÁNTO FALTA CUANDO SE SABE, y cuando no, calla
           el número en vez de inventarlo. La voz deja claro que ESPERAR ES LA
           ACCIÓN — si se leyera como falla nuestra, la persona seguiría
           reintentando y gastaría el cupo que le queda. */
        const s = segundosDeEspera(r.mensaje);
        setRebote({
          texto: s === null ? t('seguridad.esperaSinNumero') : t('seguridad.esperaConNumero', { s }),
          salida: null,
        });
        return;
      }
      setRebote({ texto: r.mensaje, salida: null });
      return;
    }

    /* NO SE NAVEGA, y la causa está medida en el wrapper (S84-C24):
       `cambiarContrasena` RE-AUTENTICA con `signInWithPassword`, y eso RENUEVA
       la sesión. Es la misma persona, así que no hay pérdida real — pero la
       renovación dispara el guard de sesión del raíz, y con un `router.back()`
       encima el resultado era irse a la pantalla de login. *Se leía como
       «cambié la clave y me echó», que es lo peor que puede pasar justo
       después de tocar la seguridad de tu cuenta: parece que salió mal cuando
       salió bien.* */
    setActual('');
    setNueva('');
    setConfirmacion('');
    setRebote(null);
    setListo(true);
    mostrar({ variante: 'exito', texto: t('seguridad.listo') });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('seguridad.tituloPantalla')}
        atras
        onAtras={() => router.back()}
      />

      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[8],
            gap: spacing[2],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Texto variante="seccion">{t('seguridad.titulo')}</Texto>
          {/* PIDE LA ACTUAL, y no es fricción de formulario: el wrapper
              RE-AUTENTICA con ella antes de escribir. Un teléfono desbloqueado
              y abierto no debería alcanzar para cambiarle la clave a alguien. */}
          <Texto variante="apoyo">{t('seguridad.ayuda')}</Texto>

          <Campo
            label={t('seguridad.actual')}
            value={actual}
            onChangeText={setActual}
            secure
            autoCapitalize="none"
          />
          <Campo
            label={t('seguridad.nueva')}
            value={nueva}
            onChangeText={setNueva}
            secure
            autoCapitalize="none"
            /* El mínimo se INTERPOLA desde la constante del motor, jamás se
               teclea: el hardcodeo ya parió una vez el «6 vs 8» (D-721). */
            ayuda={t('seguridad.largoMinimo', { n: MIN_LARGO_CONTRASENA })}
          />
          <Campo
            label={t('seguridad.confirmar')}
            value={confirmacion}
            onChangeText={setConfirmacion}
            secure
            autoCapitalize="none"
          />

          {listo && (
            <Texto variante="apoyo" color="success">
              {t('seguridad.listo')}
            </Texto>
          )}

          {rebote !== null && (
            <View style={{ gap: spacing[2], paddingTop: spacing[1] }}>
              <Texto variante="apoyo" color="danger">
                {rebote.texto}
              </Texto>
              {rebote.salida === 'soporte' && (
                <View style={{ alignSelf: 'flex-start' }}>
                  <Boton
                    variante="secundario"
                    etiqueta={t('seguridad.irASoporte')}
                    onPress={() => void abrirSoporte()}
                  />
                </View>
              )}
            </View>
          )}

          <View style={{ paddingTop: spacing[4] }}>
            <Boton
              etiqueta={t('seguridad.cambiar')}
              bloque
              cargando={cambiando}
              onPress={() => void cambiarClave()}
            />
          </View>
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
