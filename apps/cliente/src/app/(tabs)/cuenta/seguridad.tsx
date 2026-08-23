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
 * **② LA SALIDA DE LAS CUENTAS SOLO-GOOGLE APUNTA A `/recuperar`.**
 *
 * ⏪ **Nació apuntando a SOPORTE, y el cambio es la historia que vale:** al
 * montar esta pantalla medí que **`/recuperar` no existía en el cliente**, así
 * que el botón habría sido una puerta que rebota (Ley 23). Lo puenteé por
 * WhatsApp **declarando que puenteaba y no cerraba**: *«la familia solo-Google
 * sigue sin poder crearse una clave sola»*.
 *
 * ✅ **S103-C — la ruta ya existe** (`apps/cliente/src/app/recuperar.tsx`) y el
 * botón la apunta. **Canjear un código deja una clave establecida donde no
 * había ninguna**, que es lo que esa familia necesita.
 * ☠️ **Con eso murieron `abrirSoporte`, sus dos imports y dos voces** (Ley 37)
 * — *el puente se retira en el mismo acto en que llega el camino.*
 *
 * ── TESIS · FIRMA · CHANEL ───────────────────────────────────────────────
 * TESIS: tu cuenta es tuya, y podés cerrarle la puerta a cualquiera.
 * FIRMA: el rebote que **termina en una salida**, jamás en una pared —
 * incluso el caso que no podemos resolver solos.
 * CHANEL: sin correo repetido, sin esqueleto que no carga nada, sin
 * navegación al terminar. *Tres cosas que el patrón traía y acá sobran.*
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
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
  const [rebote, setRebote] = useState<{ texto: string; salida: 'recuperar' | null } | null>(null);



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
           algo que no existe.

           ✅ **S103-C · LA SALIDA YA NO ES SOPORTE: ES `/recuperar`.** Cuando
           monté esta pantalla, esa ruta **no existía en el cliente** y el
           botón la habría mandado a una puerta que rebota, así que la puenteé
           por WhatsApp **declarando que puenteaba y no cerraba**. Hoy la ruta
           existe (`apps/cliente/src/app/recuperar.tsx`) y **canjear un código
           deja una clave establecida donde no había ninguna** — que es la
           salida que de verdad le sirve.
           *El puente se retira en el mismo acto en que llega el camino: un
           puente que sobrevive a su río manda al próximo a construir otro.* */
        setRebote({ texto: t('seguridad.soloGoogle'), salida: 'recuperar' });
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
              {rebote.salida === 'recuperar' && (
                <View style={{ alignSelf: 'flex-start' }}>
                  <Boton
                    variante="secundario"
                    etiqueta={t('seguridad.irARecuperar')}
                    onPress={() => router.push('/recuperar')}
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
