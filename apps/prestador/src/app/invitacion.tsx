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
  AceptacionDeDocumentos,
  Boton,
  EstadoVacio,
  Esqueleto,
  EsqueletoGrupo,
  LogoNegocio,
  Texto,
  spacing,
  useAviso,
  useTheme,
  Entrada,
} from '@epetplace/ui';
import {
  VERSION_LEGAL,
  aceptarInvitacionEquipo,
  cerrarSesion,
  decidirConsentimiento,
  obtenerInvitacionPendiente,
  obtenerSesion,
  registrarConsentimiento,
  resolverUrlLogoNegocio,
  type InvitacionPendiente,
} from '@epetplace/api';

import {
  ACEPTACION_INICIAL,
  aceptacionCompleta,
  aplicarCambio,
  marcadasDe,
  urlTycProfesional,
  useDocumentosAceptacion,
} from '@/lib/aceptacion-prestador';
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
  // S104-C · aceptar la invitación ES aceptar el T&C profesional (firma
  // founder (a)): dos checks obligatorios + el arbitraje opcional, ANTES de
  // entrar. Acá hay sesión, así que todo se registra en el mismo acto.
  const [aceptacion, setAceptacion] = useState(ACEPTACION_INICIAL);
  const docs = useDocumentosAceptacion();

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
    if (aceptando || !aceptacionCompleta(aceptacion)) return;
    setAceptando(true);
    const r = await aceptarInvitacionEquipo(datos.empleadoId);
    if (!r.ok && r.codigo !== 'ya_activado') {
      // 'ya_activado' NO es falla (otro dispositivo / doble tap): la fila
      // ya está activa, así que entrar es correcto. El resto sí rebota.
      setAceptando(false);
      mostrar({ variante: 'error', texto: vozRebote(r.codigo) });
      return;
    }
    /* S104-C (LEY DE PARIDAD DE CUENTA, firma founder 23-ago): aceptar la
       invitación ES entrar al ecosistema, así que el consentimiento se
       registra acá, con tipo `acceso_prestador` (motor de A). Best-effort y
       DESPUÉS del `aceptar` exitoso: entrar es lo primario — si la traza del
       consentimiento fallara, no se le cierra la puerta a quien ya aceptó
       (los términos se mostraron y se aceptaron; el registro es evidencia,
       no un segundo gate). El userId sale de la sesión viva. */
    const sesion = await obtenerSesion();
    if (sesion.ok && sesion.data !== null) {
      // La URL de cada documento la resuelve `URL_LEGAL` en packages/api; el
      // 3er argumento se omite (su default ya es null → el motor la resuelve).
      await registrarConsentimiento(sesion.data.user_id, 'acceso_prestador');
    }
    // S104-C · el ARBITRAJE, en el mismo acto y con su fecha —true o false—:
    // aceptar la invitación es la puerta `acceso_prestador`, así que el
    // contexto lo dice (§38.10). Best-effort, DESPUÉS de aceptar: entrar es
    // lo primario. Versión y URL de packages/api (L-166).
    await decidirConsentimiento({
      acto: 'arbitraje',
      aceptado: aceptacion.arbitraje,
      version: VERSION_LEGAL.terminos_professional,
      url: urlTycProfesional(),
      contexto: 'acceso_prestador',
    });
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
        <LogoNegocio
          nombre={datos.negocioNombre ?? ''}
          logoUrl={resolverUrlLogoNegocio(datos.negocioLogoPath)}
        />
        {/* §5 firmada (S81) */}
        <Entrada>
          <View style={{ alignItems: 'center', gap: spacing[2] }}>
            <Texto variante="titulo">
              {datos.negocioNombre !== null
                ? t('invitacion.titulo', { negocio: datos.negocioNombre })
                : t('invitacion.tituloSinNombre')}
            </Texto>
            <Texto variante="apoyo">{t('invitacion.invitadoComo', { nombre: datos.nombreInvitado })}</Texto>
          </View>
        </Entrada>
        {/* S104-C · la aceptación EXPLÍCITA reemplaza la línea de términos
            implícita (firma founder (a)): dos checks obligatorios con enlace +
            el arbitraje opcional. `stretch` para que las casillas se alineen a
            la izquierda dentro de la composición centrada. */}
        <View style={{ alignSelf: 'stretch' }}>
          {/* ── S107-C · `D-645` MIGRADA: monta la pieza de la casa ──
              La forma es la misma; lo que cambió es de dónde viene. La lista
              de documentos entra por prop (voz + URLs los arma la app, que es
              quien las tiene), y `AceptacionDeDocumentos` sólo reporta qué se
              marcó: no valida ni registra. El gate del botón sigue acá abajo y
              el registro lo hace el motor (P23). */}
          <AceptacionDeDocumentos
            registro="oficio"
            documentos={docs.documentos}
            opcionales={docs.opcionales}
            rotuloOpcionales={docs.rotuloOpcionales}
            marcadas={marcadasDe(aceptacion)}
            onCambiar={(clave, m) => setAceptacion((a) => ({ ...a, ...aplicarCambio(clave, m) }))}
          />
          {/* La nota del arbitraje: dice qué pasa si NO se marca, y eso es
              contenido legal. La pieza rotula la SECCIÓN opcional pero no tiene
              ranura para una nota POR documento — con un solo opcional, acá
              debajo queda donde estaba. */}
          <Texto variante="apoyo">{docs.notaArbitraje}</Texto>
        </View>
        <Entrada orden={1}>
        <Boton
          etiqueta={t('invitacion.entrar')}
          bloque
          cargando={aceptando}
          deshabilitado={!aceptacionCompleta(aceptacion)}
          onPress={() => void aceptar(datos)}
        />
        </Entrada>
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
