/**
 * Cuenta · CERRAR LA CUENTA (prestador) — la salida, con motor (S104-C,
 * TANDA 3). Hermana del cliente, con DOS caminos que el cliente no tiene.
 *
 * ── LOS DOS CAMINOS, DISTINGUIDOS EN PANTALLA (punto 3 del founder) ──────
 * Un titular que llega acá tiene que ver que son DOS cosas distintas:
 *   · **Cerrar MI cuenta** (personal): el motor de A. Cierra tu usuario; el
 *     negocio sigue vivo si otras personas tienen acceso (LEY DE PARIDAD ③).
 *   · **Cerrar el NEGOCIO**: NO se hace desde la app, POR DECISIÓN, no por
 *     falta (excepción ② de la ley de paridad). Un negocio con citas pagadas
 *     de terceros, empleados con acceso y eventos sin liquidar no se cierra
 *     con un botón — es trámite asistido. La pantalla lo explica y da el
 *     camino de contacto. Sin botón muerto, sin «Pronto».
 *
 * ── SI ES EL ÚNICO CON ACCESO, SE LE DICE ANTES DE CONFIRMAR (punto 4) ───
 * Cerrar tu cuenta personal cuando sos el ÚNICO con acceso al negocio lo
 * dejaría acéfalo — y eso no se hace desde la app (③). Se computa acá con
 * lecturas que ya existen (posición + equipo) y se avisa ANTES; el servidor
 * lo enforca igual con `requiere_camino_asistido` (nadie se cree al cliente).
 *
 * ── EL TEXTO Y EL BORDE: igual que el cliente ────────────────────────────
 * El cierre es SEUDONIMIZACIÓN, no borrado (Política §19.5) — la pantalla
 * cita esa letra, no «borrar todo». Y al confirmar se pierde el acceso EN EL
 * ACTO: la pantalla de confirmar es lo último que ve, así que el mensaje va
 * completo ahí (fecha + correo de vuelta) antes del toque.
 */

import { useCallback, useState, type ReactNode } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  EsqueletoGrupo,
  Esqueleto,
  Separador,
  Tarjeta,
  Texto,
  CeldaNavegacion,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  cerrarSesion,
  obtenerEquipoNegocio,
  obtenerMiCuentaComercial,
  obtenerMiPosicionEnPrestador,
  obtenerMiPrestador,
  obtenerSesion,
  solicitarCierreCuenta,
} from '@epetplace/api';
import { fechaLargaHumana } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

const CORREO_PRIVACIDAD = 'privacidad@epetplace.com';

/** Quién es el que se quiere ir — decide si hay dos caminos o uno solo. */
type Contexto =
  | { tipo: 'cargando' }
  | { tipo: 'titular'; unicoConAcceso: boolean }
  | { tipo: 'persona' }; // empleado o vendedor: cierra su usuario, sin negocio propio

type Vista = 'elegir' | 'negocioAsistido' | 'info' | 'confirmar';

type Resultado =
  | { tipo: 'listo'; programadoPara: string; yaEstaba: boolean }
  | { tipo: 'asistido' }
  | { tipo: 'error'; texto: string };

export default function CerrarCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();

  const [ctx, setCtx] = useState<Contexto>({ tipo: 'cargando' });
  const [vista, setVista] = useState<Vista>('info');
  const [cerrando, setCerrando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vivo) return;
        if (!prestador.ok) {
          // sin_prestador (vendedor puro) o sin negocio: solo cuenta personal.
          setCtx({ tipo: 'persona' });
          setVista('info');
          return;
        }
        const [pos, sesion] = await Promise.all([
          obtenerMiPosicionEnPrestador(prestador.data.id),
          obtenerSesion(),
        ]);
        if (!vivo) return;
        if (!pos.ok || !pos.data.esTitular) {
          // administrador/empleado: cerrar su usuario no toca la titularidad.
          setCtx({ tipo: 'persona' });
          setVista('info');
          return;
        }
        // Titular: hay dos caminos, y hay que saber si es el único con acceso.
        const miUid = sesion.ok && sesion.data !== null ? sesion.data.user_id : null;
        let unico = true;
        const cc = await obtenerMiCuentaComercial();
        if (!vivo) return;
        if (cc.ok && cc.data !== null) {
          const eq = await obtenerEquipoNegocio(cc.data.id);
          if (!vivo) return;
          if (eq.ok) {
            const otros = eq.data.miembros.filter(
              (m) => m.activo && m.userId !== null && m.userId !== miUid && m.roles.length > 0,
            );
            unico = otros.length === 0;
          }
        }
        setCtx({ tipo: 'titular', unicoConAcceso: unico });
        setVista('elegir');
      })();
      return () => {
        vivo = false;
      };
    }, []),
  );

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
    void cerrarSesion().then(() => router.replace('/login'));
  }

  /** El titular que elige «cerrar mi cuenta» siendo único con acceso NO puede:
   *  dejaría el negocio acéfalo (③). Va al mismo camino asistido que cerrar
   *  el negocio. */
  function elegirCerrarMiCuenta() {
    if (ctx.tipo === 'titular' && ctx.unicoConAcceso) {
      setVista('negocioAsistido');
      return;
    }
    setVista('info');
  }

  const marco = (contenido: ReactNode, atras?: () => void) => (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* Dos formas literales (no `atras={bool}`): el Encabezado es una unión
          discriminada — `atras` exige `onAtras`, y sin atrás no lleva ninguno. */}
      {atras !== undefined ? (
        <Encabezado variante="navegacion" titulo={t('cerrarCuenta.titulo')} atras onAtras={atras} />
      ) : (
        <Encabezado variante="navegacion" titulo={t('cerrarCuenta.titulo')} />
      )}
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[8],
          gap: spacing[5],
        }}
      >
        {contenido}
      </ScrollView>
    </View>
  );

  // ── EL DESENLACE (reemplaza todo) ──────────────────────────────────────
  if (resultado !== null) {
    return marco(
      <>
        {resultado.tipo === 'listo' && (
          <View style={{ gap: spacing[4] }}>
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
          </View>
        )}
        {resultado.tipo === 'asistido' && (
          <View style={{ gap: spacing[4] }}>
            <Texto variante="titulo">{t('cerrarCuenta.asistidoTitulo')}</Texto>
            <Texto variante="cuerpo" color="secondary">
              {t('cerrarCuenta.asistidoCuerpo', { correo: CORREO_PRIVACIDAD })}
            </Texto>
            <Boton variante="secundario" etiqueta={t('cerrarCuenta.escribir')} bloque onPress={escribirAPrivacidad} />
          </View>
        )}
        {resultado.tipo === 'error' && (
          <View style={{ gap: spacing[4] }}>
            <Texto variante="apoyo" color="danger">
              {t('cerrarCuenta.errorGenerico')}
            </Texto>
            <Boton
              variante="secundario"
              etiqueta={t('cerrarCuenta.reintentar')}
              bloque
              onPress={() => {
                setResultado(null);
                setVista('confirmar');
              }}
            />
          </View>
        )}
      </>,
    );
  }

  if (ctx.tipo === 'cargando') {
    return marco(
      <EsqueletoGrupo>
        <View style={{ gap: spacing[4] }}>
          <Esqueleto forma="linea" ancho="60%" />
          <Esqueleto forma="bloque" ancho="100%" alto={72} />
          <Esqueleto forma="bloque" ancho="100%" alto={72} />
        </View>
      </EsqueletoGrupo>,
    );
  }

  // ── EL NEGOCIO NO SE CIERRA DESDE LA APP (excepción ②) ─────────────────
  if (vista === 'negocioAsistido') {
    // El «atrás» vuelve a elegir si venía de ahí (titular); si el titular
    // único llegó por «cerrar mi cuenta», también vuelve a elegir.
    return marco(
      <View style={{ gap: spacing[4] }}>
        <Texto variante="titulo">{t('cerrarCuenta.negocioTitulo')}</Texto>
        <Texto variante="cuerpo" color="secondary">
          {t('cerrarCuenta.negocioCuerpo')}
        </Texto>
        {ctx.tipo === 'titular' && ctx.unicoConAcceso && (
          <Texto variante="apoyo">{t('cerrarCuenta.negocioUnico')}</Texto>
        )}
        <Texto variante="apoyo">{t('cerrarCuenta.negocioContacto', { correo: CORREO_PRIVACIDAD })}</Texto>
        <Boton variante="secundario" etiqueta={t('cerrarCuenta.escribir')} bloque onPress={escribirAPrivacidad} />
      </View>,
      () => setVista('elegir'),
    );
  }

  // ── ELEGIR CAMINO (solo titular) ───────────────────────────────────────
  if (vista === 'elegir') {
    return marco(
      <View style={{ gap: spacing[4] }}>
        <Texto variante="cuerpo" color="secondary">
          {t('cerrarCuenta.elegirIntro')}
        </Texto>
        <Tarjeta relleno="ninguno">
          <CeldaNavegacion
            icono="cuenta"
            registro="aa"
            titulo={t('cerrarCuenta.elegirMiCuenta')}
            detalle={t('cerrarCuenta.elegirMiCuentaDetalle')}
            onPress={elegirCerrarMiCuenta}
          />
          <Separador />
          <CeldaNavegacion
            icono="negocio"
            registro="aa"
            titulo={t('cerrarCuenta.elegirNegocio')}
            detalle={t('cerrarCuenta.elegirNegocioDetalle')}
            onPress={() => setVista('negocioAsistido')}
          />
        </Tarjeta>
      </View>,
      () => router.back(),
    );
  }

  // ── CONFIRMAR — lo último que ve; el mensaje va COMPLETO acá ────────────
  if (vista === 'confirmar') {
    return marco(
      <View style={{ gap: spacing[4] }}>
        <Texto variante="titulo">{t('cerrarCuenta.confirmarTitulo')}</Texto>
        <Texto variante="cuerpo" color="secondary">
          {t('cerrarCuenta.confirmarCuerpo', { correo: CORREO_PRIVACIDAD })}
        </Texto>
        <View style={{ paddingTop: spacing[4], gap: spacing[3] }}>
          <Boton
            variante="destructivo"
            etiqueta={t('cerrarCuenta.confirmarCta')}
            bloque
            cargando={cerrando}
            onPress={() => void confirmarCierre()}
          />
          <Boton variante="ghost" etiqueta={t('cerrarCuenta.volver')} bloque onPress={() => setVista('info')} />
        </View>
      </View>,
      () => setVista('info'),
    );
  }

  // ── PASO 1 · QUÉ SE VA / QUÉ QUEDA ─────────────────────────────────────
  const atrasInfo = ctx.tipo === 'titular' ? () => setVista('elegir') : () => router.back();
  return marco(
    <>
      <Texto variante="cuerpo" color="secondary">
        {t('cerrarCuenta.intro')}
      </Texto>

      {/* Qué se va (§19.3) */}
      <View style={{ gap: spacing[2] }}>
        <Texto variante="seccion">{t('cerrarCuenta.seVaTitulo')}</Texto>
        <Texto variante="apoyo">• {t('cerrarCuenta.seVaAcceso')}</Texto>
        <Texto variante="apoyo">• {t('cerrarCuenta.seVaExternas')}</Texto>
        <Texto variante="apoyo">• {t('cerrarCuenta.seVaArchivos')}</Texto>
      </View>

      {/* Qué queda (§19.4 — seudonimización §19.5), con la línea del prestador */}
      <View style={{ gap: spacing[2] }}>
        <Texto variante="seccion">{t('cerrarCuenta.quedaTitulo')}</Texto>
        <Texto variante="apoyo">• {t('cerrarCuenta.quedaConsentimientos')}</Texto>
        <Texto variante="apoyo">• {t('cerrarCuenta.quedaPagos')}</Texto>
        <Texto variante="apoyo">• {t('cerrarCuenta.quedaHitos')}</Texto>
        {ctx.tipo === 'titular' && <Texto variante="apoyo">• {t('cerrarCuenta.quedaNegocio')}</Texto>}
      </View>

      <Texto variante="apoyo">{t('cerrarCuenta.ventana', { correo: CORREO_PRIVACIDAD })}</Texto>

      {/* Exportar ANTES de irse (P15 cl.5) */}
      <Tarjeta relleno="ninguno">
        <CeldaNavegacion
          icono="documentos"
          registro="aa"
          titulo={t('cerrarCuenta.exportarCta')}
          detalle={t('cerrarCuenta.exportarDetalle')}
          onPress={() => router.push('/cuenta/exportar')}
        />
      </Tarjeta>

      <View style={{ paddingTop: spacing[2] }}>
        <Boton variante="secundario" etiqueta={t('cerrarCuenta.continuar')} bloque onPress={() => setVista('confirmar')} />
      </View>
    </>,
    atrasInfo,
  );
}
