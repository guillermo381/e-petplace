/**
 * TUS PROCEDIMIENTOS — /veterinaria/procedimientos (S68-B, P2).
 *
 * TESIS: "Lo que cotizas por presupuesto también tiene su lugar — con
 * nombre y precio de referencia, sin agenda."
 * FIRMA: la voz de la cabecera que dice la naturaleza del grupo: "se
 * cotizan por presupuesto — no se reservan" (comportamiento honesto,
 * no color).
 *
 * Contrato: filas prestador_servicios tipo_servicio='otro' con
 * nombre_custom + precio (CHECK de DB ya admite 'otro' — relevado
 * contra DB viva). CONECTAR-A: el flag reservable=false lo suma la
 * migración de la Sesión A (el wrapper lo declara — hasta entonces el
 * 'otro' no entra a ningún flujo de reserva porque el motor del oficio
 * no existe).
 */

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Insignia,
  Interruptor,
  Separador,
  SliderPrecio,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  eliminarProcedimientoVeterinaria,
  guardarProcedimientoVeterinaria,
  obtenerMiPrestador,
  obtenerMundoVeterinariaPropio,
  type ProcedimientoVeterinaria,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; prestadorId: string; procedimientos: ProcedimientoVeterinaria[] };

// riel de referencia (calibración founder pendiente — familia D-413)
const PASO_PRECIO = 5;
const PISO_PRECIO = 5;
const TECHO_PRECIO = 500;

interface DraftProcedimiento {
  procedimientoId: string | null;
  nombre: string;
  precioIndice: number;
  activo: boolean;
}

export default function ProcedimientosVeterinaria() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [hoja, setHoja] = useState(false);
  const [draft, setDraft] = useState<DraftProcedimiento | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false);

  const pasos = useMemo(() => {
    const r: number[] = [];
    for (let v = PISO_PRECIO; v <= TECHO_PRECIO + 1e-9; v += PASO_PRECIO) r.push(v);
    return r;
  }, []);
  const etiquetas = useMemo(() => pasos.map((p) => `$${p.toFixed(2)}`), [pasos]);
  const indiceEn = (valor: number): number => {
    let mejor = 0;
    for (let i = 1; i < pasos.length; i++) {
      if (Math.abs(pasos[i] - valor) < Math.abs(pasos[mejor] - valor)) mejor = i;
    }
    return mejor;
  };

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
        const r = await obtenerMundoVeterinariaPropio(prestador.data.id);
        if (!vigente) return;
        if (!r.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({ estado: 'listo', prestadorId: prestador.data.id, procedimientos: r.data.procedimientos });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const abrirAlta = () => {
    setDraft({ procedimientoId: null, nombre: '', precioIndice: indiceEn(50), activo: true });
    setConfirmandoQuitar(false);
    setHoja(true);
  };

  const abrirEdicion = (p: ProcedimientoVeterinaria) => {
    setDraft({ procedimientoId: p.id, nombre: p.nombre, precioIndice: indiceEn(p.precio), activo: p.activo });
    setConfirmandoQuitar(false);
    setHoja(true);
  };

  // S68-B7 (hallazgo founder: "Ecografía abdominal" creada DOS veces
  // porque la lista no se refrescaba sola): tras alta/edición/baja la
  // lista se actualiza DIRECTO con la fila que el wrapper devuelve —
  // determinista, sin depender del ciclo de foco; el refetch-en-focus
  // sigue cubriendo el "volver" desde otra pantalla.
  async function guardar() {
    if (pantalla.estado !== 'listo' || draft === null || guardando || draft.nombre.trim() === '') return;
    setGuardando(true);
    const r = await guardarProcedimientoVeterinaria({
      prestadorId: pantalla.prestadorId,
      procedimientoId: draft.procedimientoId,
      nombre: draft.nombre,
      precio: pasos[draft.precioIndice],
      activo: draft.activo,
    });
    setGuardando(false);
    if (!r.ok) return mostrar({ variante: 'error', texto: r.mensaje });
    setPantalla((prev) => {
      if (prev.estado !== 'listo') return prev;
      const existe = prev.procedimientos.some((p) => p.id === r.data.id);
      return {
        ...prev,
        procedimientos: existe
          ? prev.procedimientos.map((p) => (p.id === r.data.id ? r.data : p))
          : [...prev.procedimientos, r.data],
      };
    });
    setHoja(false);
    mostrar({ variante: 'exito', texto: t('procedimientosVet.guardado') });
  }

  async function quitar() {
    if (draft?.procedimientoId == null || guardando) return;
    const id = draft.procedimientoId;
    setGuardando(true);
    const r = await eliminarProcedimientoVeterinaria(id);
    setGuardando(false);
    if (!r.ok) return mostrar({ variante: 'error', texto: r.mensaje });
    setPantalla((prev) =>
      prev.estado !== 'listo' ? prev : { ...prev, procedimientos: prev.procedimientos.filter((p) => p.id !== id) },
    );
    setHoja(false);
    mostrar({ variante: 'exito', texto: t('procedimientosVet.quitado') });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('procedimientosVet.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="70%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={160} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('taller.error')}
            descripcion={t('taller.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('taller.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: spacing[10] + insets.bottom,
            gap: spacing[4],
          }}
        >
          {/* la naturaleza del grupo — la voz firmada del pedido */}
          <Texto variante="apoyo">
            {t('procedimientosVet.intro')}
          </Texto>

          {pantalla.procedimientos.length === 0 ? (
            <EstadoVacio
              registro="seccion"
              titulo={t('procedimientosVet.vacioTitulo')}
              descripcion={t('procedimientosVet.vacioCuerpo')}
            />
          ) : (
            <Tarjeta relleno="ninguno">
              {pantalla.procedimientos.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Separador />}
                  <Celda
                    interactiva
                    accessibilityRole="button"
                    titulo={p.nombre}
                    metadataMono={`$${p.precio.toFixed(2)}`}
                    fin={
                      p.activo ? undefined : (
                        <Insignia estado="proximo" etiqueta={t('procedimientosVet.oculto')} tamaño="sm" />
                      )
                    }
                    onPress={() => abrirEdicion(p)}
                  />
                </View>
              ))}
            </Tarjeta>
          )}

          <Boton variante="primario" bloque etiqueta={t('procedimientosVet.agregar')} onPress={abrirAlta} />
        </ScrollView>
      )}

      {/* Hoja: alta/edición — nombre + precio de referencia + visibilidad */}
      <Hoja
        visible={hoja}
        onCerrar={() => {
          if (!guardando) setHoja(false);
        }}
        titulo={
          draft?.procedimientoId == null
            ? t('procedimientosVet.nuevoTitulo')
            : t('procedimientosVet.editarTitulo')
        }
      >
        {draft !== null && (
          <View style={{ padding: spacing[4], paddingBottom: spacing[4] + insets.bottom, gap: spacing[4] }}>
            <Campo
              label={t('procedimientosVet.nombre')}
              value={draft.nombre}
              onChangeText={(v) => setDraft((d) => (d === null ? d : { ...d, nombre: v }))}
              placeholder={t('procedimientosVet.nombrePlaceholder')}
            />

            <View style={{ gap: spacing[2] }}>
              {/* S68-B7: el valor vive dentro del slider (Chanel) */}
              <Texto variante="apoyo">
                {t('procedimientosVet.precioReferencia')}
              </Texto>
              <SliderPrecio
                etiqueta={t('procedimientosVet.precioReferencia')}
                pasos={etiquetas}
                indice={draft.precioIndice}
                onCambio={(i) => setDraft((d) => (d === null ? d : { ...d, precioIndice: i }))}
                registro="aa"
              />
              <Texto variante="apoyo">
                {t('procedimientosVet.precioAyuda')}
              </Texto>
            </View>

            {draft.procedimientoId !== null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.base,
                    color: theme.text.primary,
                  }}
                >
                  {t('procedimientosVet.visible')}
                </Text>
                <Interruptor
                  encendido={draft.activo}
                  onCambio={(v) => setDraft((d) => (d === null ? d : { ...d, activo: v }))}
                  etiqueta={t('procedimientosVet.visible')}
                  registro="oficio"
                />
              </View>
            )}

            <Boton
              variante="primario"
              bloque
              etiqueta={t('procedimientosVet.guardar')}
              cargando={guardando && !confirmandoQuitar}
              deshabilitado={draft.nombre.trim() === ''}
              onPress={() => void guardar()}
            />

            {draft.procedimientoId !== null &&
              (confirmandoQuitar ? (
                <Boton
                  variante="destructivo"
                  bloque
                  etiqueta={t('procedimientosVet.quitarConfirma')}
                  cargando={guardando}
                  onPress={() => void quitar()}
                />
              ) : (
                <Boton
                  variante="ghost"
                  bloque
                  etiqueta={t('procedimientosVet.quitar')}
                  onPress={() => setConfirmandoQuitar(true)}
                />
              ))}
          </View>
        )}
      </Hoja>
    </View>
  );
}
