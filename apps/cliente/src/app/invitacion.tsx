/**
 * LA PANTALLA DEL INVITADO DE FAMILIA — S104-C (motor de A).
 *
 * Vive en el RAÍZ (fuera de tabs), como `/recuperar` y `/baja`: se abre desde
 * el enlace `/invitacion?token=…` que comparte quien invita. Tres láminas
 * cortas (qué es · qué vas a ver · qué vas a hacer) y el paso de aceptar.
 *
 * ── LO QUE EL MOTOR IMPONE Y LA PANTALLA RESPETA ─────────────────────────
 * · **Aceptar exige SESIÓN con el correo que fue invitado** (el motor rebota
 *   `email_no_coincide`): el token solo no alcanza — un enlace se reenvía. Si
 *   no hay sesión, se guía a entrar/crear cuenta CON ESE CORREO; si hay sesión
 *   pero es otra dirección, se ofrece entrar con otra cuenta.
 * · **Quien entra es FAMILIAR AUTORIZADO** (firma 5.1). No se configura nada:
 *   el motor lo fija.
 *
 * ⚠️ RETOME v1, declarado: sin sesión se manda a login/registro y el invitado
 * vuelve a abrir el enlace después (sigue en su WhatsApp/correo). El retome
 * automático tras entrar es del guard raíz — deuda declarada, no se finge acá.
 *
 * TESIS: "una familia real te está esperando — con un toque quedás adentro."
 */

import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Entrada, Isotipo, Texto, spacing, useAviso, useTheme } from '@epetplace/ui';
import { aceptarInvitacionFamilia, cerrarSesion, obtenerSesion } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function InvitacionFamilia() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';

  const [lamina, setLamina] = useState(0);
  const [fase, setFase] = useState<'laminas' | 'sinSesion' | 'aceptando'>('laminas');
  const [rebote, setRebote] = useState<string | null>(null);
  /** El rebote `email_no_coincide` abre la salida «entrar con otra cuenta». */
  const [otraCuenta, setOtraCuenta] = useState(false);

  const LAMINAS = [
    { titulo: t('invitacionFamilia.lamina1Titulo'), cuerpo: t('invitacionFamilia.lamina1Cuerpo') },
    { titulo: t('invitacionFamilia.lamina2Titulo'), cuerpo: t('invitacionFamilia.lamina2Cuerpo') },
    { titulo: t('invitacionFamilia.lamina3Titulo'), cuerpo: t('invitacionFamilia.lamina3Cuerpo') },
  ];

  async function unirme() {
    if (fase === 'aceptando') return;
    setRebote(null);
    setOtraCuenta(false);
    const sesion = await obtenerSesion();
    if (!sesion.ok || sesion.data === null) {
      setFase('sinSesion');
      return;
    }
    setFase('aceptando');
    const r = await aceptarInvitacionFamilia(token);
    if (!r.ok) {
      setRebote(r.mensaje);
      // `email_no_coincide`: la sesión es de otra dirección — ofrecer cambiar.
      setOtraCuenta(r.codigo === 'email_no_coincide');
      setFase('laminas');
      return;
    }
    mostrar({ variante: 'exito', texto: t('invitacionFamilia.listo') });
    router.replace('/');
  }

  function cambiarDeCuenta() {
    void cerrarSesion().then(() => router.replace('/login'));
  }

  const contenido =
    token === '' ? (
      <Texto variante="cuerpo">{t('invitacionFamilia.sinToken')}</Texto>
    ) : fase === 'sinSesion' ? (
      <View style={{ gap: spacing[3] }}>
        <Texto variante="cuerpo">{t('invitacionFamilia.sinSesionCuerpo')}</Texto>
        <Boton etiqueta={t('invitacionFamilia.entrar')} bloque onPress={() => router.push('/login')} />
        <Boton variante="ghost" etiqueta={t('invitacionFamilia.crearCuenta')} bloque onPress={() => router.push('/registro')} />
      </View>
    ) : (
      <View style={{ gap: spacing[4] }}>
        {/* La lámina cambia con `key` para que `Entrada` la reanime al pasar. */}
        <Entrada key={lamina}>
          <View style={{ gap: spacing[2] }}>
            <Texto variante="titulo">{LAMINAS[lamina].titulo}</Texto>
            <Texto variante="cuerpo" color="secondary">{LAMINAS[lamina].cuerpo}</Texto>
          </View>
        </Entrada>

        {rebote !== null && <Texto variante="apoyo" color="danger">{rebote}</Texto>}

        <View style={{ gap: spacing[2] }}>
          {lamina < LAMINAS.length - 1 ? (
            <Boton etiqueta={t('invitacionFamilia.siguiente')} bloque onPress={() => setLamina((l) => l + 1)} />
          ) : (
            <Boton etiqueta={t('invitacionFamilia.unirme')} bloque cargando={fase === 'aceptando'} onPress={() => void unirme()} />
          )}
          {otraCuenta && (
            <Boton variante="ghost" etiqueta={t('invitacionFamilia.otraCuenta')} bloque onPress={cambiarDeCuenta} />
          )}
        </View>
      </View>
    );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg.base,
        paddingTop: insets.top + spacing[8],
        paddingBottom: insets.bottom + spacing[6],
        paddingHorizontal: spacing[5],
      }}
    >
      <View style={{ alignItems: 'center', marginBottom: spacing[6] }}>
        <Isotipo size={64} variant="gradiente" />
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>{contenido}</View>
    </View>
  );
}
