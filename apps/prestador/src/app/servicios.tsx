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
 * El motor de ocupación por ventana (S55-A B2) está vivo — verificado
 * literal contra DB antes de ofertar bloques >30': todos los bloques
 * del menú son ofertables; pausar/reactivar es la única compuerta.
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
  actualizarOfertaPaseo,
  crearOfertaPaseo,
  obtenerComisionVigenteCita,
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
      // S56-B TAREA 4 (financiero v2.6, regla 7.15): % que retiene e-PetPlace,
      // LEÍDO de fee_configs vía resolver. null = no se pudo leer → voz honesta.
      comisionPct: number | null;
    };

function monto(valor: number): string {
  return `$${valor.toFixed(2)}`;
}

/**
 * S56-B ACTO 2 — la voz del PRECIO DEL PLAN (D-338, contrato ratificado:
 * columna precio_plan, sin CHECK relacional). Vacío = sin plan en el
 * bloque (voz honesta); con valor = neto visible (mismo dato de fees.ts)
 * + comparación con el suelto SIN juzgar (dato, no CHECK).
 */
function VozPlan({ pct, planTexto, suelto }: { pct: number | null; planTexto: string; suelto: number | null }) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const estilo = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.leading.normal,
    color: theme.text.secondary,
  };
  if (planTexto.trim() === '') return <Text style={estilo}>{t('servicios.planVacio')}</Text>;
  const v = Number.parseFloat(planTexto.replace(',', '.'));
  if (!Number.isFinite(v) || v <= 0) return null;
  const plan = Math.round(v * 100) / 100;
  return (
    <View style={{ gap: spacing[1] }}>
      <VozComision pct={pct} precio={plan} />
      {suelto !== null ? (
        <Text style={estilo}>{t('servicios.planComparacion', { suelto: monto(suelto), plan: monto(plan) })}</Text>
      ) : null}
    </View>
  );
}

/**
 * S56-B TAREA 4 — la comisión visible donde se pone el precio (financiero
 * v2.6, regla 7.15): el % viene del dato leído de fee_configs, jamás
 * hardcodeado. Sin dato = voz honesta, jamás un número inventado.
 */
function VozComision({ pct, precio }: { pct: number | null; precio: number | null }) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const texto =
    pct === null
      ? t('servicios.comisionNoDisponible')
      : precio === null
        ? t('servicios.comisionRetiene', { pct })
        : t('servicios.comisionNeto', { pct, neto: monto(precio * (1 - pct / 100)) });
  return (
    <Text
      style={{
        fontFamily: typography.family.sans.regular,
        fontSize: typography.size.sm,
        lineHeight: typography.size.sm * typography.leading.normal,
        color: theme.text.secondary,
      }}
    >
      {texto}
    </Text>
  );
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
  const [planTexto, setPlanTexto] = useState('');
  const [nombreTexto, setNombreTexto] = useState('');
  const [descripcionTexto, setDescripcionTexto] = useState('');
  const [errorPrecio, setErrorPrecio] = useState<string | undefined>(undefined);
  const [errorPlan, setErrorPlan] = useState<string | undefined>(undefined);
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
        const [rOfertas, rCuenta, rComision] = await Promise.all([
          obtenerOfertasPaseoPropias(prestador.data.id),
          obtenerMiCuentaComercial(),
          obtenerComisionVigenteCita(),
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
          comisionPct: rComision.ok ? rComision.data.porcentaje : null,
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

  // El plan distingue tres estados: vacío = SIN plan (null honesto),
  // número válido, o inválido (bloquea el guardado con voz).
  const leerPrecioPlan = (): number | null | 'invalido' => {
    if (planTexto.trim() === '') return null;
    const v = Number.parseFloat(planTexto.replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) return 'invalido';
    return Math.round(v * 100) / 100;
  };

  function abrirEdicion(oferta: OfertaPaseoPropia) {
    setEditando(oferta);
    setPrecioTexto(oferta.precio.toFixed(2));
    setPlanTexto(oferta.precioPlan !== null ? oferta.precioPlan.toFixed(2) : '');
    setNombreTexto(oferta.nombre ?? '');
    setDescripcionTexto(oferta.descripcion ?? '');
    setErrorPrecio(undefined);
    setErrorPlan(undefined);
  }

  function abrirCreacion() {
    setCreando(true);
    setBloqueNuevo(null);
    setPrecioTexto('');
    setPlanTexto('');
    setNombreTexto('');
    setDescripcionTexto('');
    setErrorPrecio(undefined);
    setErrorPlan(undefined);
  }

  function cerrarHojas() {
    if (guardando) return;
    setEditando(null);
    setCreando(false);
  }

  async function guardarEdicion(cambioActivo?: boolean) {
    if (guardando || editando === null) return;
    const precio = leerPrecio();
    const precioPlan = leerPrecioPlan();
    if (cambioActivo === undefined && precio === null) {
      setErrorPrecio(t('servicios.precioInvalido'));
      return;
    }
    if (cambioActivo === undefined && precioPlan === 'invalido') {
      setErrorPlan(t('servicios.precioPlanInvalido'));
      return;
    }
    setGuardando(true);
    const r = await actualizarOfertaPaseo(
      cambioActivo === undefined
        ? {
            id: editando.id,
            precio: precio ?? undefined,
            precioPlan: precioPlan === 'invalido' ? undefined : precioPlan,
            nombre: nombreTexto,
            descripcion: descripcionTexto,
          }
        : { id: editando.id, activo: cambioActivo },
    );
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('servicios.guardado'), variante: 'exito' });
    setEditando(null);
    recargar();
  }

  async function crearBloque() {
    if (guardando || pantalla.estado !== 'listo' || bloqueNuevo === null) return;
    const precio = leerPrecio();
    const precioPlan = leerPrecioPlan();
    if (precio === null) {
      setErrorPrecio(t('servicios.precioInvalido'));
      return;
    }
    if (precioPlan === 'invalido') {
      setErrorPlan(t('servicios.precioPlanInvalido'));
      return;
    }
    setGuardando(true);
    const r = await crearOfertaPaseo({
      prestadorId: pantalla.prestadorId,
      duracionMinutos: bloqueNuevo,
      precio,
      precioPlan,
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
                  subtitulo={o.activo ? undefined : t('servicios.pausada')}
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
            <VozComision
              pct={pantalla.estado === 'listo' ? pantalla.comisionPct : null}
              precio={leerPrecio()}
            />
            <Campo
              label={t('servicios.precioPlan')}
              value={planTexto}
              onChangeText={(v) => {
                setPlanTexto(v);
                setErrorPlan(undefined);
              }}
              keyboardType="decimal-pad"
              ayuda={t('servicios.precioPlanAyuda')}
              error={errorPlan}
              deshabilitado={guardando}
            />
            <VozPlan
              pct={pantalla.estado === 'listo' ? pantalla.comisionPct : null}
              planTexto={planTexto}
              suelto={leerPrecio()}
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
            <Boton
              variante="ghost"
              etiqueta={editando.activo ? t('servicios.pausar') : t('servicios.reactivar')}
              bloque
              onPress={() => void guardarEdicion(!editando.activo)}
            />
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
            <VozComision
              pct={pantalla.estado === 'listo' ? pantalla.comisionPct : null}
              precio={leerPrecio()}
            />
            <Campo
              label={t('servicios.precioPlan')}
              value={planTexto}
              onChangeText={(v) => {
                setPlanTexto(v);
                setErrorPlan(undefined);
              }}
              keyboardType="decimal-pad"
              ayuda={t('servicios.precioPlanAyuda')}
              error={errorPlan}
              deshabilitado={guardando}
            />
            <VozPlan
              pct={pantalla.estado === 'listo' ? pantalla.comisionPct : null}
              planTexto={planTexto}
              suelto={leerPrecio()}
            />
            <Campo
              label={t('servicios.nombre')}
              value={nombreTexto}
              onChangeText={setNombreTexto}
              ayuda={t('servicios.nombreAyuda')}
              deshabilitado={guardando}
            />
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
