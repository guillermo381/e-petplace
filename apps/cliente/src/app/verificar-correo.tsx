/**
 * 05b · REVISA TU CORREO — entre crear cuenta y el hogar (S116-C lote 3d).
 * **Firmada por la mesa el 13-sep-2026.**
 *
 * ── POR QUÉ EXISTE, y es una medición antes que una pantalla ─────────────
 * `D-1099`: **el proyecto tiene la confirmación de correo ENCENDIDA.** Medido
 * por el camino real — una cuenta creada por API entra y la app dice *«Falta
 * confirmar tu email»*. ⇒ entre 05 y 06 hay un paso que el mock no dibujaba,
 * y que el primer día de F&F alguien iba a encontrar sin que nadie lo hubiera
 * decidido. **Esta pantalla es esa decisión.**
 *
 * ── ⚠️ ENLACE, NO CÓDIGO — el cambio respecto de lo que había ────────────
 * ⏪ Acá vivía una pantalla de **código de 8 dígitos** (`confirmarAltaConCodigo`
 * + su campo). La letra firmada dice **enlace**: *«Te enviamos un enlace…
 * Ábrelo para confirmar tu cuenta»*, y el botón es «Ya lo confirmé», no
 * «Confirmar».
 *
 * 🔴 **LO QUE ESTO ASUME Y NO ESTÁ MEDIDO, dicho acá para que se mida:** que
 * el correo que sale del alta trae un **enlace**. *Lo decide la plantilla del
 * proyecto, no esta pantalla* — y si trajera un código, esta pantalla le
 * pediría a la persona algo que su correo no le dio. **El founder lo ve en el
 * recorrido, abriendo el correo de prueba.** Si es código, volver cuesta una
 * pantalla: el camino viejo vive en git.
 * ✅ **Lo que NO se pierde**: el reenvío usa `reenviarCodigoAlta` —el mismo
 * `auth.resend({type:'signup'})` que ya estaba— porque *reenviar el correo de
 * alta es el mismo acto, mande lo que mande la plantilla*.
 *
 * ── LA FLECHA Y EL FONDO ─────────────────────────────────────────────────
 * **Sin cabecera ciruela** (firma): fondo lienzo y una flecha sola. *La
 * cabecera es para pantallas que pertenecen a una sección; ésta es una espera
 * — pertenece al acto que acaba de ocurrir.*
 *
 * ── SI EL ENLACE ABRE LA APP, ESTA PANTALLA NO SE VE ─────────────────────
 * El deep link entra por `auth/callback`, que deja la sesión puesta, y el
 * guard del raíz manda al onboarding. **Nadie pasa por acá si el enlace
 * funciona**, y por eso esta pantalla no intenta «detectar» nada: sólo ofrece
 * el camino de vuelta para quien confirmó en otro lado (la compu, otro
 * teléfono) y vuelve a mano.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { correoARuta, correoDeRuta } from '../lib/auth/correo-en-ruta';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  CampoCodigo,
  Celda,
  Chevron,
  Icono,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { confirmarAltaConCodigo, reenviarCodigoAlta } from '@epetplace/api';

import { destinoDeVuelta } from '@/lib/volver-a';
import { useTraduccion } from '@/i18n';

/** La espera del reenvío. **Un solo lugar**: el correo recién salió del alta,
 *  y ofrecer «reenviar» a los dos segundos invita a llenar la bandeja. */
const ESPERA_REENVIO = 60;

/** Ocho dígitos — medido del correo real, no supuesto. La pieza lo exige sin
 *  default: *un largo por default es un largo que alguien no decidió.* */
const LARGO_CODIGO = 8;

export default function RevisaTuCorreo() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const aviso = useAviso();

  const params = useLocalSearchParams();
  const email = correoDeRuta(params.email);
  const volverA = destinoDeVuelta(params.volverA);

  const [codigo, setCodigo] = useState('');
  const [mirando, setMirando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [espera, setEspera] = useState(ESPERA_REENVIO);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);

  /* Sin correo no hay nada que mirar: se vuelve a pedirlo. */
  useEffect(() => {
    if (email === '') router.replace('/registro');
  }, [email, router]);

  /* La cuenta regresiva del reenvío. */
  useEffect(() => {
    if (espera <= 0) return;
    const id = setTimeout(() => setEspera((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  /**
   * CONFIRMAR — el acto de la pantalla.
   *
   * 🔴 ACÁ VIVIÓ «Ya lo confirmé», que volvía a mirar la sesión. **Se retira
   * con su razón medida, no por gusto:** el correo de esta casa valida **con
   * CÓDIGO, no con enlace** (firma del founder, 13-sep-2026), y con código
   * mirar la sesión no puede servir — *no hay nada que mirar: la sesión la
   * crea el canje, y el canje ocurre acá*. Un botón que re-consulta un estado
   * que nadie va a cambiar habría dicho «todavía no» para siempre, con cara
   * de estar funcionando.
   *
   * Y esto ADEMÁS esquiva `D-1100` entero: el enlace abre el navegador y la
   * app no se entera. Con código no hay vuelta que perder, porque nunca se
   * sale de la app.
   */
  async function confirmar() {
    if (mirando || codigo.trim() === '') return;
    setMirando(true);
    setErrorCodigo(null);
    const r = await confirmarAltaConCodigo({ email, codigo, contexto: 'registro' });
    if (!r.ok) {
      setMirando(false);
      /* El motor ya da UNA sola voz para «malo» y «vencido» a propósito —
         distinguirlos le confirma a un extraño que ese correo tiene cuenta.
         La pantalla la repite tal cual: no inventa un matiz que el motor
         eligió no dar. */
      setErrorCodigo(r.mensaje);
      return;
    }
    /* 🪦 `D-1101` · UN SOLO DESTINO. Antes se consultaba el estado para
       decidir entre hogar y onboarding; con el onboarding enterrado esa
       consulta **no puede cambiar la respuesta**, así que se retira con él:
       *un viaje de red cuyo resultado ya no decide nada es latencia pura, y
       además una segunda verdad esperando divergir del guard del raíz.* */
    setMirando(false);
    router.replace(volverA ?? '/hogar');
  }

  async function reenviar() {
    if (espera > 0 || reenviando) return;
    setReenviando(true);
    const r = await reenviarCodigoAlta(email);
    setReenviando(false);
    if (!r.ok) {
      aviso.mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    setEspera(ESPERA_REENVIO);
    setCodigo('');
    setErrorCodigo(null);
    aviso.mostrar({ variante: 'exito', texto: t('revisaCorreo.reenviado') });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, paddingTop: insets.top }}>
      {/* La flecha sola — sin cabecera ciruela (firma de la mesa).
          🔴 **NO se usa `FlechaVolver`, y es una medición:** esa pieza pinta
          con `text.onGradient` —*«lo que se lee sobre la marca»*— y **esta
          pantalla es lienzo**, así que la flecha habría salido blanca sobre
          claro: invisible, sin que nada fallara. Va `Chevron`, que resuelve
          por tema y es la pieza que el catálogo nombra para esto
          (*«Volver/Avanzar/Flecha no son del registry: son `Chevron`»*). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('revisaCorreo.volver')}
        onPress={() => router.back()}
        hitSlop={12}
        style={{ padding: spacing[3], alignSelf: 'flex-start' }}
      >
        <Chevron direccion="izquierda" />
      </Pressable>

      <ScrollView
        contentContainerStyle={{
          padding: spacing[6],
          paddingBottom: insets.bottom + spacing[8],
          gap: spacing[5],
        }}
      >
        <View style={{ alignItems: 'center', gap: spacing[4] }}>
          <Icono nombre="correo" tamano={40} registro="capa" />
          <Texto variante="titulo" centrado>
            {t('revisaCorreo.titulo')}
          </Texto>
          {/* 🔴 **DOS LÍNEAS, Y NO ES PREFERENCIA: es un defecto medido.**
              Con la frase entera en un `Texto`, el correo es **una palabra que
              no parte** —`guillo381+s116c3@gmail.com`— así que el salto caía
              justo después y **dejaba el punto final huérfano al principio de
              la línea siguiente**: «…@gmail.com ⏎ . Escríbelo aquí…».
              *No falla nada; se ve descuidado, que en la pantalla donde la
              persona verifica su propia dirección es justo lo que no se puede
              ver.* Separar la instrucción saca el punto del borde y además se
              lee mejor: primero a dónde fue, después qué hacer. */}
          <Texto variante="cuerpo" color="secondary" centrado>
            {t('revisaCorreo.apoyo', { correo: email })}
          </Texto>
          <Texto variante="cuerpo" color="secondary" centrado>
            {t('revisaCorreo.apoyoInstruccion')}
          </Texto>
        </View>

        {/* «QUÉ SIGUE» — el mismo patrón de 04: tres pasos numerados. */}
        <View style={{ gap: spacing[2] }}>
          <Texto variante="antetitulo">{t('revisaCorreo.queSigue')}</Texto>
          <Celda inicio={<Texto variante="enfasis">1</Texto>} titulo={t('revisaCorreo.paso1')} />
          <Celda inicio={<Texto variante="enfasis">2</Texto>} titulo={t('revisaCorreo.paso2')} />
          <Celda inicio={<Texto variante="enfasis">3</Texto>} titulo={t('revisaCorreo.paso3')} />
        </View>

        {/* ⭐ **`CampoCodigo` — la pieza de la casa, S116-C lote 3e.**
            ⏪ Acá había un `Campo` genérico con `keyboardType="number-pad"`:
            la pantalla estaba **componiendo** un campo de código en vez de
            montar el que ya existe. `CampoCodigo` trae lo que yo iba a tener
            que escribir —el saneo a dígitos, el corte al largo, las cajas, el
            pie con `liveRegion`— y además **el tono del pie**, que acá importa:
            un código vencido no es un tipeo equivocado.

            🔴 **`largo` NO tiene default y es a propósito**: la pieza no sabe
            cuánto mide un código. **El de esta casa es de OCHO**, medido del
            correo real del founder (`81250142`, `25746721`). */}
        <CampoCodigo
          largo={LARGO_CODIGO}
          valor={codigo}
          onCambio={(v) => {
            setCodigo(v);
            if (errorCodigo !== null) setErrorCodigo(null);
          }}
          etiqueta={t('revisaCorreo.etiquetaCodigo')}
          error={errorCodigo ?? undefined}
          /* El código malo y el vencido salen con la MISMA voz del motor, y
             ninguno de los dos es un error de tipeo: se dicen como estado. */
          tono="estado"
        />

        <Boton
          variante="primario"
          bloque
          etiqueta={t('revisaCorreo.confirmar')}
          cargando={mirando}
          deshabilitado={codigo.trim() === ''}
          razonDeshabilitado={t('revisaCorreo.faltaCodigo')}
          onPress={() => void confirmar()}
        />

        {/* Los dos caminos de abajo, en tinta apagada: son salidas, no la
            acción de la pantalla (Ley 5 — una sola primaria). */}
        <View style={{ gap: spacing[2] }}>
          <Boton
            variante="ghost"
            bloque
            etiqueta={espera > 0 ? t('revisaCorreo.reenviarEn', { n: espera }) : t('revisaCorreo.reenviar')}
            deshabilitado={espera > 0}
            /* 🔴 **SIN `razonDeshabilitado`, y es una cura de lo que se vio
               en el aparato.** Lo pasaba con el MISMO texto que la etiqueta
               «para que el lector de pantalla lo oiga» — y esa prop **también
               se dibuja**, así que la cuenta regresiva salía DOS VECES, una
               debajo de la otra. *La etiqueta ya dice el porqué; repetirlo no
               es accesibilidad, es ruido — y el lector lee la etiqueta.* */
            cargando={reenviando}
            onPress={() => void reenviar()}
          />
          <Boton
            variante="ghost"
            bloque
            etiqueta={t('revisaCorreo.cambiarCorreo')}
            /* Vuelve a 05 **con el correo puesto**, para corregir una letra en
               vez de escribirlo entero de nuevo. */
            onPress={() => router.replace({ pathname: '/registro', params: { email: correoARuta(email) } })}
          />
        </View>
      </ScrollView>
    </View>
  );
}
