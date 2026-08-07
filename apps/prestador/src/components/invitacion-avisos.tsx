/**
 * InvitacionAvisos — LA PANTALLA DE LA CASA ANTES DEL DIÁLOGO DEL SO
 * (S90-B · D-680; lámina FIRMADA `LAMINA_PERMISO_NOTIFICACIONES`).
 *
 * PORT DECLARADO de `apps/cliente/src/components/invitacion-avisos.tsx`
 * (S89-A). **Es COPIA con diferencias declaradas, no construcción nueva**
 * — la pieza es la misma; cambian el punto de montaje (HOY, la primera
 * pantalla con sesión de esta casa) y el acento, que NO cuesta código: el
 * raíz del prestador monta `ThemeProvider cta="oficio"`, así que el
 * `Boton` primario resuelve tealDark solo (Ley 21).
 *
 * POR QUÉ EXISTE: el SO da UN SOLO TIRO. Si la persona dice que no al
 * diálogo del sistema, no hay segunda oportunidad dentro de la app. La
 * invitación de la casa protege ese tiro: explica antes de pedir. Y esta
 * casa recibe avisos que le importan tanto o más — la reserva que le cae,
 * el registro que se completó (D-680).
 *
 * LO QUE LA LÁMINA EXIGE Y ACÁ SE CUMPLE (§2 guardas · §5 · §6):
 *  · La SONDA NATIVA apaga la invitación: sin el nativo, no existe —
 *    nunca aparece rota (§2, patrón D-579/L-187 · L-190).
 *  · Permiso ya CONCEDIDO: nada que pedir — solo se mantiene el token.
 *  · Permiso DENEGADO a nivel SO: el tiro ya se gastó; invitar sería
 *    mandar a un muro. El camino honesto vive en Preferencias con
 *    `notifPermisoNegado`, voz ya firmada.
 *  · «Ahora no» SIEMPRE visible, con la anatomía del secundario (jamás
 *    una ✕ chiquita, jamás pre-marcado nada) — anti-dark-patterns.
 *  · Re-invitación SOLO al cambiar la versión NATIVA (jamás por OTA: un
 *    OTA puede llegar cada día y eso sería nagging con otro nombre).
 *  · DOS «ahora no» acumulados = silencio definitivo.
 *  · «push» JAMÁS en la voz (LEY S89): se dice «avisos en el teléfono».
 *
 * ⚠️ LA DIFERENCIA DE MECANISMO, DECLARADA — y es la única: el cliente
 * hace `import * as Notifications from 'expo-notifications'` EN EL TOPE.
 * Acá el módulo se pide por la SONDA (`moduloAvisosSiHayNativo`), porque
 * un import estático evalúa la cadena entera del paquete en el arranque,
 * que es exactamente lo que L-190 midió como causa del crash del founder.
 * No es preferencia de estilo: es la guarda §2 de la lámina, que sin esto
 * no se puede cumplir.
 */

import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { Boton, Hoja, Texto, spacing } from '@epetplace/ui';
import { registrarTokenDeAparato } from '@epetplace/api';

import { moduloAvisosSiHayNativo } from '@/lib/permiso-push';
import { useTraduccion } from '@/i18n';

const CLAVE = 'epetplace.avisos.invitacion';

type Marca = { noes: number; ultimaVersionNativa: string | null; decidido: boolean };

async function leerMarca(): Promise<Marca> {
  try {
    const crudo = await AsyncStorage.getItem(CLAVE);
    if (crudo) return JSON.parse(crudo) as Marca;
  } catch {
    /* una marca ilegible se trata como ausente: la invitación es inocua */
  }
  return { noes: 0, ultimaVersionNativa: null, decidido: false };
}

/** El token viaja al motor. Se llama al conceder, y también en cada arranque
 *  con permiso ya concedido: el token del SO puede ROTAR y un token viejo es
 *  un aviso que no llega — sin ruido para nadie. */
export async function sincronizarTokenSiHayPermiso(): Promise<void> {
  try {
    const modulo = moduloAvisosSiHayNativo();
    if (modulo === null) return;
    const { status } = await modulo.getPermissionsAsync();
    if (status !== 'granted') return;
    const t = await modulo.getDevicePushTokenAsync();
    if (typeof t?.data === 'string' && t.data.length > 0) {
      await registrarTokenDeAparato(t.data, Platform.OS === 'ios' ? 'ios' : 'android');
    }
  } catch {
    /* sin módulo nativo (Expo Go / web) esto no existe — y no es un fallo */
  }
}

export function InvitacionAvisos() {
  const { t } = useTraduccion();
  const [abierta, setAbierta] = useState(false);
  const [marca, setMarca] = useState<Marca | null>(null);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      // §2 — LA SONDA PRIMERO: sin el nativo, la invitación NO EXISTE.
      const modulo = moduloAvisosSiHayNativo();
      if (modulo === null) return;

      const m = await leerMarca();
      if (!vivo) return;
      setMarca(m);

      const { status } = await modulo
        .getPermissionsAsync()
        .catch(() => ({ status: 'undetermined' }));

      // El permiso ya concedido: nada que invitar — solo mantener el token.
      if (status === 'granted') {
        await sincronizarTokenSiHayPermiso();
        return;
      }
      // §2 — DENEGADO a nivel SO: el único tiro ya se gastó. Invitar acá
      // sería mandar a un muro; el camino vive en Preferencias.
      if (status === 'denied') return;

      // Las guardas de la lámina, en orden:
      if (m.decidido) return; // decidió con la puerta grande
      if (m.noes >= 2) return; // dos noes son una respuesta
      const versionNativa = Updates.runtimeVersion ?? 'sin-runtime';
      if (m.ultimaVersionNativa === versionNativa) return; // una por versión NATIVA

      if (vivo) setAbierta(true);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const guardar = async (parcial: Partial<Marca>) => {
    const base = marca ?? { noes: 0, ultimaVersionNativa: null, decidido: false };
    const nueva: Marca = {
      ...base,
      ...parcial,
      ultimaVersionNativa: Updates.runtimeVersion ?? 'sin-runtime',
    };
    setMarca(nueva);
    try {
      await AsyncStorage.setItem(CLAVE, JSON.stringify(nueva));
    } catch {
      /* la marca no bloquea */
    }
  };

  const aceptar = async () => {
    setAbierta(false);
    await guardar({});
    const modulo = moduloAvisosSiHayNativo();
    if (modulo === null) return;
    // El único tiro del SO — y recién después de que la casa explicó.
    const { status } = await modulo.requestPermissionsAsync();
    if (status === 'granted') await sincronizarTokenSiHayPermiso();
    // Si deniega: la casa NO insiste. Preferencias lo dice con
    // `notifPermisoNegado`, voz ya firmada.
  };

  const ahoraNo = async () => {
    setAbierta(false);
    await guardar({ noes: (marca?.noes ?? 0) + 1 });
  };

  if (!abierta) return null;

  return (
    <Hoja visible={abierta} onCerrar={() => void ahoraNo()} titulo={t('miCuenta.notifInvitacionTitulo')}>
      <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
        <Texto variante="cuerpo">{t('miCuenta.notifInvitacionCuerpo')}</Texto>
        <View style={{ gap: spacing[2], paddingTop: spacing[2] }}>
          <Boton etiqueta={t('miCuenta.notifInvitacionSi')} bloque onPress={() => void aceptar()} />
          {/* «Ahora no» con la anatomía del secundario — la lámina lo exige
              visible, nunca escondido (anti-dark-patterns) */}
          <Boton
            etiqueta={t('miCuenta.notifInvitacionNo')}
            variante="sinCaja"
            bloque
            onPress={() => void ahoraNo()}
          />
        </View>
      </View>
    </Hoja>
  );
}
