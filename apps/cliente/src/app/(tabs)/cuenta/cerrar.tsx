/**
 * Cuenta · CERRAR LA CUENTA — la salida, con motor (S104-C, TANDA 3).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ «Eliminar cuenta» dejó de ser voz sin motor. Doble paso, y la         │
 * │ pantalla dice EXACTAMENTE qué se va y qué queda ANTES de confirmar —   │
 * │ es la cláusula 4 de P15, en texto.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── EL TEXTO NO DICE «BORRAR TODO», Y NO ES SUAVIZAR: ES LA VERDAD ───────
 * El cierre NO destruye el registro — es SEUDONIMIZACIÓN, y la Política de
 * Privacidad ya PUBLICADA lo dice literal (§19.5). Así que la pantalla se
 * alinea a esa letra, no la contradice:
 *   · «Qué se va» = §19.3 — acceso, sesiones, identidades externas, archivos
 *     personales y foto de perfil (ahí entran las fotos del carnet de las
 *     impresiones ya generadas, que el founder pide nombrar explícito).
 *   · «Qué queda» = §19.4 — el registro de qué aceptaste · los pagos · los
 *     hechos del expediente de la mascota, «porque tu mascota puede cambiar
 *     de familia y su historia le pertenece a ella» (frase de la Política,
 *     casi verbatim: es la que vuelve entendible el punto).
 * Cero cifras del censo: la superficie cita la LETRA, jamás un número que la
 * propia tanda puede mover (A midió 64/26 hoy contra 62/24 el 22-ago).
 *
 * ── EL BORDE QUE VUELVE ESTA PANTALLA LA MÁS IMPORTANTE DE LA APP ─────────
 * Al confirmar, la persona PIERDE EL ACCESO EN EL ACTO (la anonimización
 * corre al día 30; el acceso se corta hoy — §19.2/§19.3, y el punto 3 del
 * founder). ⇒ la pantalla de CONFIRMAR es lo último que ve: no tiene segunda
 * oportunidad. Por eso el mensaje COMPLETO —la fecha límite Y que la vuelta
 * es por privacidad@epetplace.com— vive en la confirmación, ANTES del toque,
 * porque después ya no va a poder entrar a leerlo. La pantalla de éxito lo
 * repite con la fecha exacta, pero no se confía en que sobreviva a la muerte
 * de la sesión: lo garantizado es lo que se lee antes de tocar.
 *
 * ── EL MOTOR ES DE A (P15 cl.4/cl.5) ────────────────────────────────────
 * `solicitarCierreCuenta` programa el cierre a 30 días y devuelve la fecha +
 * `ya_estaba` (idempotencia hecha dato: repetir el toque da el mismo
 * resultado; el flag solo elige el TONO). Su rechazo `requiere_camino_asistido`
 * es el BACKSTOP servidor: si cerrar dejaría a otras personas sin acceso, no
 * borra — manda a contacto. La exportación (cl.5) se OFRECE acá, antes de irse.
 *
 * ── TESIS · FIRMA · CHANEL ───────────────────────────────────────────────
 * TESIS: irte es tu derecho, y te decimos la verdad de qué pasa cuando lo usás.
 * FIRMA: el doble paso — el mapa completo ANTES de tocar nada irreversible.
 * CHANEL: sin «borrar todo» (sería mentira), sin cifras, sin final mudo.
 */

import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  CeldaNavegacion,
  Encabezado,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { cerrarSesion, solicitarCierreCuenta } from '@epetplace/api';
import { fechaLargaHumana } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

const CORREO_PRIVACIDAD = 'privacidad@epetplace.com';

/** El desenlace del cierre — reemplaza el flujo cuando llega. */
type Resultado =
  | { tipo: 'listo'; programadoPara: string; yaEstaba: boolean }
  | { tipo: 'asistido' }
  | { tipo: 'error'; texto: string };

export default function CerrarCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();

  const [paso, setPaso] = useState<'info' | 'confirmar'>('info');
  const [cerrando, setCerrando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  function escribirAPrivacidad() {
    void Linking.openURL(`mailto:${CORREO_PRIVACIDAD}`);
  }

  async function confirmarCierre() {
    if (cerrando) return;
    setCerrando(true);
    const r = await solicitarCierreCuenta();
    setCerrando(false);
    if (!r.ok) {
      setResultado(
        r.codigo === 'requiere_camino_asistido'
          ? { tipo: 'asistido' }
          : { tipo: 'error', texto: r.mensaje },
      );
      return;
    }
    setResultado({ tipo: 'listo', programadoPara: r.data.programado_para, yaEstaba: r.data.ya_estaba });
  }

  function salirDeLaApp() {
    void cerrarSesion().then(() => router.replace('/bienvenida'));
  }

  // ── EL DESENLACE (reemplaza el flujo) ──────────────────────────────────
  if (resultado !== null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('cerrarCuenta.titulo')} />
        <ScrollView
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[8],
            gap: spacing[4],
          }}
        >
          {resultado.tipo === 'listo' && (
            <>
              <Texto variante="titulo">
                {resultado.yaEstaba ? t('cerrarCuenta.yaEstabaTitulo') : t('cerrarCuenta.listoTitulo')}
              </Texto>
              <Texto variante="cuerpo" color="secondary">
                {t('cerrarCuenta.listoCuerpo', {
                  fecha: fechaLargaHumana(resultado.programadoPara, idioma),
                  correo: CORREO_PRIVACIDAD,
                })}
              </Texto>
              <Boton variante="secundario" etiqueta={t('cerrarCuenta.escribir')} bloque onPress={escribirAPrivacidad} />
              <Boton etiqueta={t('cerrarCuenta.salir')} bloque onPress={salirDeLaApp} />
            </>
          )}

          {resultado.tipo === 'asistido' && (
            <>
              <Texto variante="titulo">{t('cerrarCuenta.asistidoTitulo')}</Texto>
              <Texto variante="cuerpo" color="secondary">
                {t('cerrarCuenta.asistidoCuerpo', { correo: CORREO_PRIVACIDAD })}
              </Texto>
              <Boton variante="secundario" etiqueta={t('cerrarCuenta.escribir')} bloque onPress={escribirAPrivacidad} />
            </>
          )}

          {resultado.tipo === 'error' && (
            <>
              <Texto variante="apoyo" color="danger">
                {t('cerrarCuenta.errorGenerico')}
              </Texto>
              <Boton
                variante="secundario"
                etiqueta={t('cerrarCuenta.reintentar')}
                bloque
                onPress={() => {
                  setResultado(null);
                  setPaso('confirmar');
                }}
              />
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── PASO 2 · CONFIRMAR — lo último que ve; el mensaje va COMPLETO acá ───
  if (paso === 'confirmar') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('cerrarCuenta.titulo')} atras onAtras={() => setPaso('info')} />
        <ScrollView
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[8],
            gap: spacing[4],
          }}
        >
          <Texto variante="titulo">{t('cerrarCuenta.confirmarTitulo')}</Texto>
          {/* El mensaje COMPLETO antes del toque: pierde el acceso hoy, tiene
              30 días para volver por el correo, y después no podrá entrar a
              leerlo. Es la única pantalla sin segunda oportunidad. */}
          <Texto variante="cuerpo" color="secondary">
            {t('cerrarCuenta.confirmarCuerpo', { correo: CORREO_PRIVACIDAD })}
          </Texto>
          {/* S104-C · firma del founder (vía A): la imagen del carnet se
              REPRODUCE en las impresiones que la familia ya generó. Al borrarse
              (con el cierre definitivo, día 30) esas impresiones quedan sin
              ella — y quien cierra tiene que enterarse ANTES de confirmar, no
              después. Va acá, en el punto sin retorno, además de la lista del
              paso 1. */}
          <Texto variante="cuerpo" color="secondary">
            {t('cerrarCuenta.confirmarCarnet')}
          </Texto>
          <View style={{ paddingTop: spacing[4], gap: spacing[3] }}>
            <Boton
              variante="destructivo"
              etiqueta={t('cerrarCuenta.confirmarCta')}
              bloque
              cargando={cerrando}
              onPress={() => void confirmarCierre()}
            />
            <Boton variante="ghost" etiqueta={t('cerrarCuenta.volver')} bloque onPress={() => setPaso('info')} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── PASO 1 · QUÉ SE VA / QUÉ QUEDA ─────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cerrarCuenta.titulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[8],
          gap: spacing[5],
        }}
      >
        <Texto variante="cuerpo" color="secondary">
          {t('cerrarCuenta.intro')}
        </Texto>

        {/* Qué se va (§19.3) */}
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t('cerrarCuenta.seVaTitulo')}</Texto>
          <Texto variante="apoyo">• {t('cerrarCuenta.seVaAcceso')}</Texto>
          <Texto variante="apoyo">• {t('cerrarCuenta.seVaExternas')}</Texto>
          <Texto variante="apoyo">• {t('cerrarCuenta.seVaArchivos')}</Texto>
          <Texto variante="apoyo">• {t('cerrarCuenta.seVaCarnet')}</Texto>
        </View>

        {/* Qué queda (§19.4 — seudonimización §19.5) */}
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t('cerrarCuenta.quedaTitulo')}</Texto>
          <Texto variante="apoyo">• {t('cerrarCuenta.quedaConsentimientos')}</Texto>
          <Texto variante="apoyo">• {t('cerrarCuenta.quedaPagos')}</Texto>
          <Texto variante="apoyo">• {t('cerrarCuenta.quedaExpediente')}</Texto>
        </View>

        {/* La ventana de arrepentimiento (P15 cl.4) */}
        <Texto variante="apoyo">{t('cerrarCuenta.ventana', { correo: CORREO_PRIVACIDAD })}</Texto>

        {/* Exportar ANTES de irse (P15 cl.5) — se ofrece en el mismo flujo */}
        <Tarjeta relleno="ninguno">
          <CeldaNavegacion
            icono="documentos"
            titulo={t('cerrarCuenta.exportarCta')}
            detalle={t('cerrarCuenta.exportarDetalle')}
            onPress={() => router.push('/cuenta/exportar')}
          />
        </Tarjeta>

        <View style={{ paddingTop: spacing[2] }}>
          <Boton variante="secundario" etiqueta={t('cerrarCuenta.continuar')} bloque onPress={() => setPaso('confirmar')} />
        </View>
      </ScrollView>
    </View>
  );
}
