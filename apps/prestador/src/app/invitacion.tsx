/**
 * EL HANDSHAKE DE EQUIPO — S75-B1 (D-514 (a)).
 *
 * Vive en el RAÍZ (hermana de /login), FUERA de (tabs): el invitado no
 * resuelve prestador, así que toda superficie bajo la puerta le nace
 * inalcanzable (L-161). El guard del raíz sondea la invitación inactiva y
 * redirige acá antes de la voz "sin negocio" (que para el invitado es
 * mentira: sí tiene, lo invitaron).
 *
 * TESIS: "un negocio real te está esperando, y con un toque quedas adentro."
 * FIRMA: el LogoNegocio presidiendo — la cara del negocio que te sumó
 *   (firma de COMPOSICIÓN, dosis baja §15b; sin logo → monograma, jamás
 *   huella: la huella es de MASCOTA, Ley 12). Es su primera pantalla
 *   consumidora real (gate founder de LogoNegocio pendiente desde S74).
 * CHANEL: se quitó la fecha de invitación (no cambia la decisión), el
 *   email (ya entraste con él), el rol (la invitación v1 es sin rol) y el
 *   chip de estado (la pantalla entera ES el estado).
 * TESTS §15: dosis baja (CTA tealDark, cero gradiente, un acento); voz
 *   humana tuteo; sin Encabezado (no hay atrás — Ley 23).
 *
 * LA PUERTA YA ESTÁ ABIERTA (S75, hallazgo B): `obtenerMiPrestador`
 * resuelve el vínculo ACTIVO en HEAD (R1, `3591db2`) — no hubo B3 que
 * escribir, lo absorbió ese wrapper. Consecuencia: al ACEPTAR, el
 * vínculo pasa a activo y la persona YA PUEDE entrar. Por eso al aceptar
 * se hace `router.replace('/')` → el guard re-resuelve → entra a las tabs
 * (sin rol aún → sin NEGOCIO por el gate S75-B2). El "final honesto" de
 * puerta-cerrada murió con su supuesto (Ley 37): habría ATRAPADO al
 * empleado en un mensaje que dejó de ser verdad.
 */
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  EstadoVacio,
  Esqueleto,
  EsqueletoGrupo,
  LogoNegocio,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  aceptarInvitacionEquipo,
  cerrarSesion,
  obtenerInvitacionPendiente,
  type InvitacionPendiente,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'invitacion'; datos: InvitacionPendiente }
  | { estado: 'sin_invitacion' } // el guard no debería traernos, pero es honesto
  | { estado: 'error' };

export default function Invitacion() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [aceptando, setAceptando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerInvitacionPendiente();
        if (!vigente) return;
        if (!r.ok) return setPantalla({ estado: 'error' });
        if (r.data === null) return setPantalla({ estado: 'sin_invitacion' });
        setPantalla({ estado: 'invitacion', datos: r.data });
      })();
      return () => {
        vigente = false;
      };
      // intento fuerza el re-fetch tras "Probar de nuevo"
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intento]),
  );

  // el codigo del !ok incluye los base de ResultadoWrapper — el default
  // los cubre (Ley 13: jamás mudo). Solo distinguimos los dos que cambian
  // qué hacer decir; el resto es la voz genérica honesta.
  function vozRebote(codigo: string): string {
    switch (codigo) {
      case 'ya_activado':
        return t('invitacion.errorYaActivado');
      case 'no_es_tuya':
        return t('invitacion.errorNoEsTuya');
      default:
        return t('invitacion.errorGenerico');
    }
  }

  async function aceptar(datos: InvitacionPendiente) {
    if (aceptando) return;
    setAceptando(true);
    const r = await aceptarInvitacionEquipo(datos.empleadoId);
    if (!r.ok && r.codigo !== 'ya_activado') {
      // 'ya_activado' NO es falla (otro dispositivo / doble tap): la fila
      // ya está activa, así que entrar es correcto. El resto sí rebota.
      setAceptando(false);
      mostrar({ variante: 'error', texto: vozRebote(r.codigo) });
      return;
    }
    // La puerta está abierta (R1): el vínculo ya es activo → entrar. El
    // guard re-resuelve y lleva a las tabs (sin rol → sin NEGOCIO).
    router.replace('/');
  }

  function salir() {
    if (saliendo) return;
    setSaliendo(true);
    void cerrarSesion().then(() => {
      setSaliendo(false);
      router.replace('/');
    });
  }

  // el guard no nos trajo con invitación (o desapareció): volvemos al raíz,
  // que re-decide por estado real — jamás una pantalla muerta acá (Ley 23)
  if (pantalla.estado === 'sin_invitacion') return <Redirect href="/" />;

  const contenido = (() => {
    if (pantalla.estado === 'cargando') {
      return (
        <EsqueletoGrupo>
          <View style={{ alignItems: 'center', gap: spacing[4] }}>
            <Esqueleto forma="bloque" ancho={96} alto={96} />
            <Esqueleto forma="linea" ancho="70%" />
            <Esqueleto forma="linea" ancho="50%" />
            <Esqueleto forma="bloque" ancho="100%" alto={52} />
          </View>
        </EsqueletoGrupo>
      );
    }

    if (pantalla.estado === 'error') {
      return (
        <EstadoVacio
          titulo={t('invitacion.errorCarga')}
          accion={
            <Boton
              variante="secundario"
              etiqueta={t('invitacion.reintentar')}
              onPress={() => {
                setPantalla({ estado: 'cargando' });
                setIntento((n) => n + 1);
              }}
            />
          }
        />
      );
    }

    // estado 'invitacion' — la composición
    const { datos } = pantalla;
    return (
      <View style={{ alignItems: 'center', gap: spacing[5] }}>
        <LogoNegocio nombre={datos.negocioNombre ?? ''} />
        <View style={{ alignItems: 'center', gap: spacing[2] }}>
          <Texto variante="titulo">
            {datos.negocioNombre !== null
              ? t('invitacion.titulo', { negocio: datos.negocioNombre })
              : t('invitacion.tituloSinNombre')}
          </Texto>
          <Texto variante="apoyo">{t('invitacion.invitadoComo', { nombre: datos.nombreInvitado })}</Texto>
        </View>
        <Boton
          etiqueta={t('invitacion.entrar')}
          bloque
          cargando={aceptando}
          onPress={() => void aceptar(datos)}
        />
        <Boton
          variante="compacto"
          etiqueta={t('sesion.cerrarSesion')}
          cargando={saliendo}
          onPress={salir}
        />
      </View>
    );
  })();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg.base,
        paddingHorizontal: spacing[6],
        paddingTop: insets.top + spacing[6],
        paddingBottom: insets.bottom + spacing[6],
        justifyContent: 'center',
      }}
    >
      {contenido}
    </View>
  );
}
