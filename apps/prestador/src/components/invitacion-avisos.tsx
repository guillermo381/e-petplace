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
/* ═══════════════════════════════════════════════════════════════════════════
   🔴 EL LAZO CERRADO QUE MATABA LA APP — `D-1074`, medido el 12-sep-2026.

   **`getDevicePushTokenAsync()` DISPARA `addPushTokenListener`.** Pedir el
   token ES un evento de token. Y el listener de `token-avisos.ts` respondía
   volviendo a llamar a esta función ⇒ **pedir → evento → pedir**, a velocidad
   de CPU.

   **Medido en el aparato, no deducido:** `11.100` llamadas a
   `registrar_push_token` en 10 segundos, con dos `getSession()` cada una
   (`22.220` cruces a AsyncStorage). El heap de Java llegaba al techo de 256 MB
   y la app moría por `OutOfMemoryError` a los **2 min 12 s**.

   ⚠️ **Y explica el síntoma exacto que describió el founder —«la app está viva,
   sólo falla lo que viene de la base»— sin ninguna hipótesis de memoria:** con
   11 mil peticiones por segundo el pool de OkHttp queda saturado (28 hilos
   `OkHttp Dispatcher` medidos), así que **las consultas legítimas nunca
   llegan**. El OOM no era la causa: era la consecuencia.
   *También explica el cero de DNS: HTTP/2 multiplexa sobre las 5 conexiones
   que ya estaban abiertas, así que un bucle de consultas no resuelve un
   nombre más.*

   ── LA CURA, y son DOS guardas porque hacen cosas distintas ───────────────
   ① **El listener ya no pide un token: registra el del evento**
      (`registrarTokenConocido`). *Cortar el lazo en su origen es lo único que
      lo cierra; cualquier freno que igual llame a `getDevicePushTokenAsync`
      sigue disparando el evento.*
   ② **No se re-registra un token que no cambió.** Mata el trabajo redundante
      por cualquier otro camino, presente o futuro.
   ③ Y un cerrojo de re-entrada, como cinturón: el arranque y la vuelta del
      fondo pueden coincidir.

   🔴 **LO QUE LA CURA CONSERVA, porque era el motivo del diseño original:** el
   permiso **se re-verifica igual** antes de registrar. *Registrar el token de
   un evento sin confirmar que el permiso sigue dado escribiría una dirección
   que el SO ya no atiende* — esa razón sigue siendo cierta y por eso
   `registrarTokenConocido` pregunta por el permiso; lo que NO hace es volver a
   pedir el token.
   ═══════════════════════════════════════════════════════════════════════════ */

/** El último token que ESTE proceso registró con éxito. Se reinicia en cada
 *  arranque frío ⇒ **el arranque siempre sincroniza una vez**, que es lo que
 *  `D-1056` vino a garantizar. */
let ultimoTokenRegistrado: string | null = null;
/** Cerrojo de re-entrada del camino que PIDE token. */
let pidiendoToken = false;

/**
 * Registra un token **YA CONOCIDO** — jamás pide uno nuevo.
 *
 * 🔴 Es la puerta del listener de rotación: **no puede llamar a
 * `getDevicePushTokenAsync`**, porque esa llamada es justo lo que dispara el
 * evento que lo trajo hasta acá.
 */
export async function registrarTokenConocido(token: string): Promise<void> {
  if (typeof token !== 'string' || token.length === 0) return;
  if (token === ultimoTokenRegistrado) return;
  try {
    const modulo = moduloAvisosSiHayNativo();
    if (modulo === null) return;
    const { status } = await modulo.getPermissionsAsync();
    if (status !== 'granted') return;
    await registrarTokenDeAparato(token, Platform.OS === 'ios' ? 'ios' : 'android');
    ultimoTokenRegistrado = token;
  } catch {
    /* sin módulo nativo (Expo Go / web) esto no existe — y no es un fallo */
  }
}

export async function sincronizarTokenSiHayPermiso(): Promise<void> {
  if (pidiendoToken) return;
  pidiendoToken = true;
  try {
    const modulo = moduloAvisosSiHayNativo();
    if (modulo === null) return;
    const { status } = await modulo.getPermissionsAsync();
    if (status !== 'granted') return;
    const t = await modulo.getDevicePushTokenAsync();
    if (typeof t?.data === 'string' && t.data.length > 0) {
      if (t.data === ultimoTokenRegistrado) return;
      await registrarTokenDeAparato(t.data, Platform.OS === 'ios' ? 'ios' : 'android');
      ultimoTokenRegistrado = t.data;
    }
  } catch {
    /* sin módulo nativo (Expo Go / web) esto no existe — y no es un fallo */
  } finally {
    pidiendoToken = false;
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
