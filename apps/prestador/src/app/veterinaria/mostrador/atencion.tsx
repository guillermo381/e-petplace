// ─────────────────────────────────────────────────────────────────────
// M4 + M5 — LA ATENCIÓN DEL MOSTRADOR + EL COBRO-DATO (A1bis, S69-B).
// Desde el tap de una mascota en M2. Dos fases: (1) atención — servicio
// del menú VIVO (solo es_medico activos; el server lo garantiza) +
// persona (N=1 colapsa, sin picker) + precio editable → la cita nace
// FIRME hoy. (2) cobro — monto + medio, DATO puro (cero devengo, cero
// fee, cero checkout). Dosis §15b: densa y rápida.
//
// TESIS: en dos toques la clínica registra lo que pasó — y queda en la
// agenda de hoy y en el expediente.
// FIRMA: la cita aparece en el HOY al volver (comportamiento — el smoke
// de M0). Confirmación de dos mitades.
//
// Vacunación (D-434): cuando el servicio es vacunación, el registrable de
// la vacuna (selector cat_vacunas + "Otra") es la pieza FINAL declarada —
// el RPC/trigger de procedencia ya está (mesa), falta el wrapper de
// lectura cat_vacunas + confirmar el path de inserción del lado prestador.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  SelectorOpcion,
  SelectorSegmentado,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  MEDIOS_COBRO,
  obtenerCatalogoVacunas,
  obtenerCatalogoVeterinaria,
  obtenerDetalleMascotaPrestador,
  obtenerMiPrestador,
  obtenerMundoVeterinariaPropio,
  registrarAtencionMostrador,
  registrarCobroPresencial,
  registrarVacunaMostrador,
  resolverUrlFoto,
  type MedioCobro,
  type VacunaCatalogo,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { vozErrorVet } from '@/lib/voz-error-vet';
import { useTraduccion } from '@/i18n';

type ServicioActivo = { codigo: string; nombre: string; precio: number };

export default function AtencionMostrador() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { mascotaId = '', nombre = '' } = useLocalSearchParams<{ mascotaId?: string; nombre?: string }>();

  // S73-B (M2 de A sobre el boceto S72-B §2): LA MÁQUINA DE ESTADOS de la
  // carga — espejo de coordinar/[citaId] (copiar-al-vecino). `null` ya no
  // significa dos cosas: cargando/error/listo son fases DISTINTAS, y un
  // fallo de CUALQUIERA de los cinco fetches (prestador + mundo + catálogo
  // + vacunas + detalle de mascota — el cuarto lo sumó a9b8686 y también
  // se tragaba en silencio) pasa a 'error' con voz y reintento (Ley 13:
  // el error jamás se disfraza de botón muerto).
  type Carga =
    | { fase: 'cargando' }
    | { fase: 'error' }
    | { fase: 'listo'; prestadorId: string; servicios: ServicioActivo[] };
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' });
  const [reintento, setReintento] = useState(0);
  // S73-B ítem 10 (b): el vet tiene que VER al animal que atiende — la
  // identidad se carga por mascotaId (puerta única, RLS; mismo patrón que
  // mascota/[mascotaId] + resolverUrlFoto), jamás foto por params.
  const [fotoFirmada, setFotoFirmada] = useState<string | null>(null);
  const [nombreMascota, setNombreMascota] = useState<string | null>(null);
  const [servicioCodigo, setServicioCodigo] = useState<string | undefined>(undefined);
  const [precio, setPrecio] = useState('');
  const [fase, setFase] = useState<'atencion' | 'cobro'>('atencion');
  const [citaId, setCitaId] = useState<string | null>(null);
  const [monto, setMonto] = useState('');
  const [medio, setMedio] = useState<MedioCobro>('efectivo');
  const [ocupado, setOcupado] = useState(false);
  // D-434: el registrable de vacuna (solo cuando el servicio es vacunación).
  const [catalogoVacunas, setCatalogoVacunas] = useState<VacunaCatalogo[]>([]);
  const [vacunaSel, setVacunaSel] = useState<string | undefined>(undefined);
  const [vacunaLibre, setVacunaLibre] = useState('');
  const OTRA = '__otra__';

  useEffect(() => {
    let vigente = true;
    setCarga({ fase: 'cargando' });
    void (async () => {
      const pr = await obtenerMiPrestador();
      if (!vigente) return;
      if (!pr.ok) {
        setCarga({ fase: 'error' });
        return;
      }
      const [mundo, cat, vac, detalle] = await Promise.all([
        obtenerMundoVeterinariaPropio(pr.data.id),
        obtenerCatalogoVeterinaria(),
        obtenerCatalogoVacunas(),
        obtenerDetalleMascotaPrestador(mascotaId, pr.data.id),
      ]);
      if (!vigente) return;
      // Un fallo de CUALQUIERA pasa a error — antes: mundo caído se
      // disfrazaba de "sin servicios", catálogo caído pintaba códigos
      // crudos (Ley 3), vacunas caídas apagaban el registrable en
      // silencio, y el detalle caído escondía a la mascota.
      if (!mundo.ok || !cat.ok || !vac.ok || !detalle.ok) {
        setCarga({ fase: 'error' });
        return;
      }
      setCatalogoVacunas(vac.data);
      setNombreMascota(detalle.data.mascota.nombre);
      // La foto es PATH (S47): se firma por la frontera. Sin foto o si la
      // firma falla, la huella digna de AvatarMascota es la cara válida.
      if (detalle.data.mascota.foto_url !== null) {
        void resolverUrlFoto(detalle.data.mascota.foto_url).then((url) => {
          if (vigente) setFotoFirmada(url);
        });
      }
      const nombres = new Map<string, string>(cat.data.map((c) => [c.codigo, c.nombre]));
      const activos: ServicioActivo[] = mundo.data.servicios
        .filter((s) => s.activo)
        .map((s) => ({ codigo: s.tipoServicio, nombre: nombres.get(s.tipoServicio) ?? s.tipoServicio, precio: s.precio }));
      setCarga({ fase: 'listo', prestadorId: pr.data.id, servicios: activos });
    })();
    return () => {
      vigente = false;
    };
  }, [mascotaId, reintento]);

  // Derivados de la máquina — el resto de la pantalla habla como antes.
  const prestadorId = carga.fase === 'listo' ? carga.prestadorId : null;
  const servicios = carga.fase === 'listo' ? carga.servicios : null;

  function elegirServicio(codigo: string) {
    setServicioCodigo(codigo);
    const s = servicios?.find((x) => x.codigo === codigo);
    if (s) setPrecio(String(s.precio));
  }

  const precioNum = Number(precio.replace(',', '.'));
  const puedeRegistrar =
    prestadorId !== null && servicioCodigo !== undefined && Number.isFinite(precioNum) && precioNum >= 0 && !ocupado;

  async function registrar() {
    if (!puedeRegistrar || prestadorId === null || servicioCodigo === undefined) return;
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      mostrar({ variante: 'error', texto: sesion.mensaje });
      return;
    }
    setOcupado(true);
    const r = await registrarAtencionMostrador({
      prestadorId,
      mascotaId,
      tipoServicioCodigo: servicioCodigo,
      precio: precioNum,
    });
    setOcupado(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: vozErrorVet(t, 'atencion', r) });
      return;
    }
    setCitaId(r.data);
    setMonto(precio);
    setFase('cobro');
  }

  const montoNum = Number(monto.replace(',', '.'));
  const puedeCobrar = citaId !== null && Number.isFinite(montoNum) && montoNum > 0 && !ocupado;
  const esVacunacion = servicioCodigo === 'vacunacion';
  // La verdad del server (RLS) preside; el param queda de puente de carga.
  const mascota = nombreMascota ?? (nombre || t('agenda.mascotaFallback'));

  // D-434: registra la vacuna si el servicio lo es y hay una elegida.
  // Devuelve false SOLO si el registro falló (frena el cierre).
  async function registrarVacunaSiCorresponde(): Promise<boolean> {
    if (!esVacunacion || citaId === null) return true;
    const codigo = vacunaSel && vacunaSel !== OTRA ? vacunaSel : undefined;
    const libre = vacunaSel === OTRA ? vacunaLibre.trim() : undefined;
    if (!codigo && !libre) return true; // sin vacuna elegida — no bloquea
    const r = await registrarVacunaMostrador(citaId, { vacunaCodigo: codigo, nombreLibre: libre });
    if (!r.ok) {
      mostrar({ variante: 'error', texto: vozErrorVet(t, 'vacuna', r) });
      return false;
    }
    mostrar({ variante: 'exito', texto: t('atencionMostrador.vacunaExito', { mascota }) });
    return true;
  }

  async function finalizar(conCobro: boolean) {
    if (citaId === null || ocupado) return;
    if (conCobro && !puedeCobrar) return;
    setOcupado(true);
    if (!(await registrarVacunaSiCorresponde())) {
      setOcupado(false);
      return;
    }
    if (conCobro) {
      const r = await registrarCobroPresencial(citaId, montoNum, medio);
      if (!r.ok) {
        setOcupado(false);
        mostrar({ variante: 'error', texto: vozErrorVet(t, 'cobro', r) });
        return;
      }
    }
    setOcupado(false);
    mostrar({ variante: 'exito', texto: t('atencionMostrador.exito', { mascota }) });
    router.back();
  }

  const medioSegmentos = useMemo(
    () =>
      MEDIOS_COBRO.map((m) => ({
        codigo: m,
        etiqueta:
          m === 'efectivo'
            ? t('atencionMostrador.medioEfectivo')
            : m === 'tarjeta'
              ? t('atencionMostrador.medioTarjeta')
              : t('atencionMostrador.medioTransferencia'),
      })),
    [t],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('atencionMostrador.titulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* S73-B ítem 10 (b): a quién se atiende, con su CARA — presente en
            las dos fases (atención y cobro). Foto → huella digna fallback. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <AvatarMascota nombre={mascota} fotoUrl={fotoFirmada ?? undefined} tamano="md" />
          <Texto variante="titulo">{mascota}</Texto>
        </View>
        {fase === 'atencion' ? (
          carga.fase === 'cargando' ? (
            // Ley 13: esqueleto ESTÁTICO — antes esta espera era una
            // pantalla con botón gris que parecía colgada.
            <EsqueletoGrupo etiqueta={t('atencionMostrador.titulo')}>
              <View style={{ gap: spacing[3] }}>
                <Esqueleto forma="linea" ancho="40%" />
                <Esqueleto forma="bloque" alto={120} />
                <Esqueleto forma="bloque" alto={56} />
              </View>
            </EsqueletoGrupo>
          ) : carga.fase === 'error' ? (
            // El error DIRIGE (17.4) — con su camino de reintento.
            <EstadoVacio
              registro="seccion"
              titulo={t('atencionMostrador.errorCarga')}
              descripcion={t('atencionMostrador.errorCargaDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('agenda.reintentar')}
                  onPress={() => setReintento((n) => n + 1)}
                />
              }
            />
          ) : servicios !== null && servicios.length === 0 ? (
            // El vacío termina en un CAMINO (17.5, M2 de A): el taller es
            // donde se prenden los servicios.
            <EstadoVacio
              registro="seccion"
              titulo={t('atencionMostrador.sinServicios')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('atencionMostrador.sinServiciosCta')}
                  onPress={() => router.push({ pathname: '/veterinaria/taller', params: { seccion: 'servicios' } })}
                />
              }
            />
          ) : (
            <>
              {servicios !== null && (
                <SelectorOpcion
                  etiqueta={t('atencionMostrador.servicioLabel')}
                  disposicion="grilla"
                  opciones={servicios.map((s) => ({ codigo: s.codigo, etiqueta: s.nombre }))}
                  seleccionada={servicioCodigo}
                  onSelect={elegirServicio}
                />
              )}
              <Campo
                label={t('atencionMostrador.precioLabel')}
                placeholder="0.00"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="decimal-pad"
              />
              <Boton
                variante="primario"
                bloque
                etiqueta={t('atencionMostrador.registrarAtencion')}
                cargando={ocupado}
                deshabilitado={!puedeRegistrar}
                onPress={() => void registrar()}
              />
            </>
          )
        ) : (
          <>
            {/* D-434: el registrable de vacuna, solo en vacunación */}
            {esVacunacion && (
              <View style={{ gap: spacing[2] }}>
                <SelectorOpcion
                  etiqueta={t('atencionMostrador.vacunaLabel')}
                  disposicion="grilla"
                  opciones={[
                    ...catalogoVacunas.map((v) => ({ codigo: v.codigo, etiqueta: v.nombre })),
                    { codigo: OTRA, etiqueta: t('atencionMostrador.vacunaOtra') },
                  ]}
                  seleccionada={vacunaSel}
                  onSelect={setVacunaSel}
                />
                {vacunaSel === OTRA && (
                  <Campo
                    label={t('atencionMostrador.vacunaLibreLabel')}
                    placeholder={t('atencionMostrador.vacunaLibrePlaceholder')}
                    value={vacunaLibre}
                    onChangeText={setVacunaLibre}
                  />
                )}
              </View>
            )}
            <Texto variante="seccion">
              {t('atencionMostrador.cobroTitulo')}
            </Texto>
            <Campo
              label={t('atencionMostrador.montoLabel')}
              placeholder="0.00"
              value={monto}
              onChangeText={setMonto}
              keyboardType="decimal-pad"
            />
            <SelectorSegmentado
              etiqueta={t('atencionMostrador.medioLabel')}
              segmentos={medioSegmentos}
              activo={medio}
              onCambio={(c) => setMedio(c as MedioCobro)}
            />
            <Boton
              variante="primario"
              bloque
              etiqueta={t('atencionMostrador.registrarCobro')}
              cargando={ocupado}
              deshabilitado={!puedeCobrar}
              onPress={() => void finalizar(true)}
            />
            <Boton
              variante="compacto"
              etiqueta={t('atencionMostrador.sinCobro')}
              deshabilitado={ocupado}
              onPress={() => void finalizar(false)}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
