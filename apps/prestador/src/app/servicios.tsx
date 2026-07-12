/**
 * SERVICIOS Y PRECIOS — el prestador gobierna su oferta de paseo
 * (S55-B B2, modelo cerrado del founder: menú canónico de bloques
 * 30/60/120/180/240/300 y PRECIO POR BLOQUE; recurrencia/paquete =
 * capa posterior, NO vive acá).
 *
 * LA ESCALERA declarada (§4b):
 *   peldaño 0 — sin ofertas: invitación que educa ("tus clientes solo
 *     ven lo que tú actives") + CTA a la primera.
 *   peldaño 1 — la lista de bloques ofrecidos: editar precio/nombre/
 *     descripción, pausar/reactivar (jamás DELETE, regla 7.8).
 *   peldaño 2 — paquetes y recurrencia: hueco DECLARADO en voz, llega
 *     con MODELO_FINANCIERO v2.5 + política P14 + motor.
 *
 * GUARDA DE HONESTIDAD TEMPORAL: los bloques >30' se configuran pero NO
 * se ofertan (el wrapper los mantiene activo=false; las RPCs del dueño
 * filtran por activo) — la UI lo dice con voz honesta. Se levanta en el
 * mismo PR que el motor de ocupación por ventana de la Sesión A.
 *
 * Cuenta comercial NO activa = voz honesta (configurás ahora, te
 * ofertás cuando el equipo la active) — JAMÁS se activa desde acá
 * (misma ley que el wizard §6.5). Regla 7.13 sigue server-side.
 * Dosis baja (test 7): cero acento de capa, CTA en tinta, sin gradiente.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  BLOQUES_PASEO,
  BLOQUE_MAX_OFERTABLE,
  actualizarOfertaPaseo,
  crearOfertaPaseo,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerOfertasPaseoPropias,
  type BloquePaseo,
  type OfertaPaseoPropia,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      prestadorId: string;
      ofertas: OfertaPaseoPropia[];
      cuentaActiva: boolean | null; // null = no se pudo leer, no se afirma nada
    };

function monto(valor: number): string {
  return `$${valor.toFixed(2)}`;
}

function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size.md,
        color: theme.text.primary,
      }}
    >
      {texto}
    </Text>
  );
}

export default function Servicios() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  // Hoja de edición (oferta existente) y de creación (bloque nuevo)
  const [editando, setEditando] = useState<OfertaPaseoPropia | null>(null);
  const [creando, setCreando] = useState(false);
  const [bloqueNuevo, setBloqueNuevo] = useState<BloquePaseo | null>(null);
  const [precioTexto, setPrecioTexto] = useState('');
  const [nombreTexto, setNombreTexto] = useState('');
  const [descripcionTexto, setDescripcionTexto] = useState('');
  const [errorPrecio, setErrorPrecio] = useState<string | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const [rOfertas, rCuenta] = await Promise.all([
          obtenerOfertasPaseoPropias(prestador.data.id),
          obtenerMiCuentaComercial(),
        ]);
        if (!vigente) return;
        if (!rOfertas.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({
          estado: 'listo',
          prestadorId: prestador.data.id,
          ofertas: rOfertas.data,
          cuentaActiva: rCuenta.ok ? rCuenta.data?.estado === 'activa' : null,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const recargar = () => setIntento((n) => n + 1);

  const etiquetaBloque = (duracion: number): string => {
    switch (duracion) {
      case 30: return t('servicios.bloque30');
      case 60: return t('servicios.bloque60');
      case 120: return t('servicios.bloque120');
      case 180: return t('servicios.bloque180');
      case 240: return t('servicios.bloque240');
      case 300: return t('servicios.bloque300');
      default: return `${duracion} min`;
    }
  };

  const leerPrecio = (): number | null => {
    const v = Number.parseFloat(precioTexto.replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) return null;
    return Math.round(v * 100) / 100;
  };

  function abrirEdicion(oferta: OfertaPaseoPropia) {
    setEditando(oferta);
    setPrecioTexto(oferta.precio.toFixed(2));
    setNombreTexto(oferta.nombre ?? '');
    setDescripcionTexto(oferta.descripcion ?? '');
    setErrorPrecio(undefined);
  }

  function abrirCreacion() {
    setCreando(true);
    setBloqueNuevo(null);
    setPrecioTexto('');
    setNombreTexto('');
    setDescripcionTexto('');
    setErrorPrecio(undefined);
  }

  function cerrarHojas() {
    if (guardando) return;
    setEditando(null);
    setCreando(false);
  }

  async function guardarEdicion(cambioActivo?: boolean) {
    if (guardando || editando === null) return;
    const precio = leerPrecio();
    if (cambioActivo === undefined && precio === null) {
      setErrorPrecio(t('servicios.precioInvalido'));
      return;
    }
    setGuardando(true);
    const r = await actualizarOfertaPaseo(
      cambioActivo === undefined
        ? { id: editando.id, precio: precio ?? undefined, nombre: nombreTexto, descripcion: descripcionTexto }
        : { id: editando.id, activo: cambioActivo },
    );
    setGuardando(false);
    if (!r.ok) {
      mostrar({
        texto: r.codigo === 'bloque_pendiente_motor' ? t('servicios.bloquePendienteMotor') : r.mensaje,
        variante: 'error',
      });
      return;
    }
    mostrar({ texto: t('servicios.guardado'), variante: 'exito' });
    setEditando(null);
    recargar();
  }

  async function crearBloque() {
    if (guardando || pantalla.estado !== 'listo' || bloqueNuevo === null) return;
    const precio = leerPrecio();
    if (precio === null) {
      setErrorPrecio(t('servicios.precioInvalido'));
      return;
    }
    setGuardando(true);
    const r = await crearOfertaPaseo({
      prestadorId: pantalla.prestadorId,
      duracionMinutos: bloqueNuevo,
      precio,
      nombre: nombreTexto || undefined,
      descripcion: descripcionTexto || undefined,
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('servicios.creado'), variante: 'exito' });
    setCreando(false);
    recargar();
  }

  const bloquesDisponibles =
    pantalla.estado === 'listo'
      ? BLOQUES_PASEO.filter((b) => !pantalla.ofertas.some((o) => o.duracionMinutos === b))
      : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('servicios.titulo')} atras onAtras={() => router.back()} />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="40%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('servicios.error')}
            descripcion={t('servicios.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('servicios.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  recargar();
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.ofertas.length === 0 && (
        // peldaño 0 — la invitación que educa
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('servicios.vacioTitulo')}
            descripcion={t('servicios.vacioCuerpo')}
            accion={<Boton variante="primario" etiqueta={t('servicios.vacioCta')} onPress={abrirCreacion} />}
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.ofertas.length > 0 && (
        <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}>
          {pantalla.cuentaActiva === false && (
            // voz honesta: configurar sí, ofertarse recién con la cuenta activa
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: typography.size.sm * typography.leading.normal,
                color: theme.text.secondary,
              }}
            >
              {t('servicios.cuentaNoActiva')}
            </Text>
          )}

          <TituloBloque texto={t('servicios.bloquesTitulo')} />
          <Tarjeta relleno="ninguno">
            {pantalla.ofertas.map((o, i) => (
              <View key={o.id}>
                {i > 0 && <Separador />}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  onPress={() => abrirEdicion(o)}
                  titulo={o.nombre ?? etiquetaBloque(o.duracionMinutos)}
                  subtitulo={
                    o.pendienteMotor
                      ? t('servicios.pendienteMotor')
                      : o.activo
                        ? undefined
                        : t('servicios.pausada')
                  }
                  metadataMono={monto(o.precio)}
                />
              </View>
            ))}
          </Tarjeta>

          {bloquesDisponibles.length > 0 && (
            <Boton variante="secundario" etiqueta={t('servicios.agregarBloque')} bloque onPress={abrirCreacion} />
          )}

          {/* peldaño 2 — el hueco declarado, en voz serena */}
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.xs,
              color: theme.text.tertiary,
            }}
          >
            {t('servicios.paquetesHueco')}
          </Text>
        </ScrollView>
      )}

      {/* Hoja de edición */}
      <Hoja
        visible={editando !== null}
        onCerrar={cerrarHojas}
        titulo={editando?.nombre ?? (editando ? etiquetaBloque(editando.duracionMinutos) : t('servicios.editarTitulo'))}
      >
        {editando !== null && (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Campo
              label={t('servicios.precio')}
              value={precioTexto}
              onChangeText={(v) => {
                setPrecioTexto(v);
                setErrorPrecio(undefined);
              }}
              keyboardType="decimal-pad"
              ayuda={t('servicios.precioAyuda')}
              error={errorPrecio}
              deshabilitado={guardando}
            />
            <Campo
              label={t('servicios.nombre')}
              value={nombreTexto}
              onChangeText={setNombreTexto}
              ayuda={t('servicios.nombreAyuda')}
              deshabilitado={guardando}
            />
            <Campo
              label={t('servicios.descripcion')}
              value={descripcionTexto}
              onChangeText={setDescripcionTexto}
              deshabilitado={guardando}
            />
            <Boton
              variante="primario"
              etiqueta={t('servicios.guardar')}
              bloque
              cargando={guardando}
              onPress={() => void guardarEdicion()}
            />
            {editando.pendienteMotor ? (
              // guarda de honestidad: no hay toggle que mienta — la voz dice la verdad
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.sm,
                  color: theme.text.secondary,
                }}
              >
                {t('servicios.pendienteMotor')}
              </Text>
            ) : (
              <Boton
                variante="ghost"
                etiqueta={editando.activo ? t('servicios.pausar') : t('servicios.reactivar')}
                bloque
                onPress={() => void guardarEdicion(!editando.activo)}
              />
            )}
          </View>
        )}
      </Hoja>

      {/* Hoja de creación: primero el bloque del menú, después el precio */}
      <Hoja visible={creando} onCerrar={cerrarHojas} titulo={t('servicios.nuevoTitulo')} altura="media">
        {bloqueNuevo === null ? (
          <HojaScroll>
            {bloquesDisponibles.map((b, i) => (
              <View key={b}>
                {i > 0 && <Separador />}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  titulo={etiquetaBloque(b)}
                  subtitulo={b > BLOQUE_MAX_OFERTABLE ? t('servicios.pendienteMotor') : undefined}
                  onPress={() => setBloqueNuevo(b)}
                />
              </View>
            ))}
          </HojaScroll>
        ) : (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Celda
              interactiva
              accessibilityRole="button"
              titulo={t('servicios.duracion')}
              subtitulo={etiquetaBloque(bloqueNuevo)}
              onPress={() => setBloqueNuevo(null)}
            />
            <Campo
              label={t('servicios.precio')}
              value={precioTexto}
              onChangeText={(v) => {
                setPrecioTexto(v);
                setErrorPrecio(undefined);
              }}
              keyboardType="decimal-pad"
              ayuda={t('servicios.precioAyuda')}
              error={errorPrecio}
              deshabilitado={guardando}
            />
            <Campo
              label={t('servicios.nombre')}
              value={nombreTexto}
              onChangeText={setNombreTexto}
              ayuda={t('servicios.nombreAyuda')}
              deshabilitado={guardando}
            />
            {bloqueNuevo > BLOQUE_MAX_OFERTABLE && (
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.sm,
                  color: theme.text.secondary,
                }}
              >
                {t('servicios.pendienteMotor')}
              </Text>
            )}
            <Boton
              variante="primario"
              etiqueta={t('servicios.crear')}
              bloque
              cargando={guardando}
              onPress={() => void crearBloque()}
            />
          </View>
        )}
      </Hoja>
    </View>
  );
}
