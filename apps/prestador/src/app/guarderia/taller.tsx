/**
 * LA GUARDERÍA · CONFIGURACIÓN (S107-C, tanda 3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EL RECORRIDO QUE ESTA PANTALLA TIENE QUE CUMPLIR (plan §6, verbatim):
 * *«Abro mi portal y doy de alta la guardería: cuántos animales recibo por día
 * (8), en qué franja recojo (7:00–9:00), en cuál devuelvo (16:30–18:30)…»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LO QUE ESTA PANTALLA HACE, Y LO QUE NO ───────────────────────────────
 * HACE: la **capacidad por día** y **las dos ventanas**. Las dos mitades
 * tienen su motor publicado por A (`guarderia-config`) y se guardan de verdad.
 *
 * 🔴 **NO HACE el precio, ni el paquete, ni la mensualidad, y no es un
 * recorte de diseño: no existe la puerta.** Medido — hay
 * `veterinaria-oferta` y `adiestramiento-oferta`, y **no hay
 * `guarderia-oferta`**; la oferta vive en `prestador_servicios` y ningún
 * wrapper la escribe para este oficio. *Montar un campo de precio que no
 * guarda sería la pantalla mintiendo.* Entra cuando A publique esa puerta —
 * y con ella entra el *«quedo visible para reservas»* del recorrido, que **es
 * la oferta, no la capacidad**.
 *
 * ── LOS DÍAS DE LA FRANJA NO SE EDITAN EN v1, Y LA RAZÓN ES DE MOTOR ─────
 * `definir_franja_guarderia` upserta por `(prestador, tipo, dias_semana)` y
 * **no hay camino para retirar una franja** (la tabla tiene `activo`, el
 * wrapper no lo expone). ⇒ si la pantalla dejara mover el patrón de días,
 * cambiar de L-V a L-S **crearía una segunda franja y dejaría viva la
 * primera**, sin forma de matarla. *Se usa el default del motor (L-V) para
 * que la clave del upsert sea estable.* **Hueco declarado, no inventado:
 * cuando exista el retiro, el patrón se abre.**
 *
 * ── EL ORDEN DE GUARDADO NO ES ARBITRARIO ───────────────────────────────
 * Recogida primero, devolución después. El motor valida que **la recogida
 * termine antes de que empiece la devolución** contra las filas VIVAS, así
 * que guardar al revés puede rebotar contra la franja vieja. El rebote es
 * correcto y su voz lo dice; el orden simplemente evita el falso choque.
 *
 * ── LA CAPACIDAD SE LEE DEL CUPO, PORQUE NO HAY LECTOR DE ESPACIOS ──────
 * ⚠️ A publicó `definirEspacioGuarderia` (escritura) y **ningún lector de
 * espacios**. La capacidad de hoy se deriva de `obtenerCupoGuarderia` — que
 * devuelve la SUMA de los espacios confirmados. Alcanza para v1 (un lugar,
 * un número, que es lo que el recorrido pide) y **se declara para que nadie
 * lea esto como el modelo final**: con dos salas hace falta el lector.
 *
 * El espacio se guarda siempre con el MISMO nombre (`NOMBRE_ESPACIO`), que es
 * la clave del upsert del motor: re-guardar edita, jamás duplica.
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  FichaFranja,
  Hoja,
  HojaScroll,
  SelectorOpcion,
  StepperCantidad,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  definirEspacioGuarderia,
  definirFranjaGuarderia,
  obtenerCupoGuarderia,
  obtenerFranjasGuarderia,
  obtenerMiPrestador,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useGateGestor } from '@/lib/gate-gestor';
import { GateAjeno } from '@/components/gate-ajeno';
import { GateRoto } from '@/components/gate-roto';
import { HORAS } from '@/components/seccion-horarios';

/** La clave del upsert del motor. Estable a propósito: re-guardar EDITA. */
const NOMBRE_ESPACIO = 'Principal';

const CAP_MIN = 1;
const CAP_MAX = 60;

/** 'HH:MM:SS' del motor → 'HH:MM' de la grilla. El motor manda la verdad; la
 *  pantalla sólo la recorta para mostrarla (jamás la reinterpreta). */
function aHoraCorta(h: string): string {
  return h.slice(0, 5);
}

type Estado =
  | { fase: 'cargando' }
  | { fase: 'roto' }
  | { fase: 'listo'; prestadorId: string; sobrevendidoHoy: boolean };

type QueHora = null | 'recogidaDesde' | 'recogidaHasta' | 'devolucionDesde' | 'devolucionHasta';

export default function TallerGuarderia() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { gate, reintentarGate } = useGateGestor();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [guardando, setGuardando] = useState(false);

  // EL BORRADOR — sobrevive a los reintentos de carga.
  const [capacidad, setCapacidad] = useState(8);
  const [recogidaDesde, setRecogidaDesde] = useState('07:00');
  const [recogidaHasta, setRecogidaHasta] = useState('09:00');
  const [devolucionDesde, setDevolucionDesde] = useState('16:30');
  const [devolucionHasta, setDevolucionHasta] = useState('18:30');
  const [queHora, setQueHora] = useState<QueHora>(null);

  useEffect(() => {
    if (gate !== 'permitido') return;
    let vigente = true;
    setEstado({ fase: 'cargando' });
    void (async () => {
      const p = await obtenerMiPrestador();
      if (!vigente) return;
      if (!p.ok || p.data === null) {
        setEstado({ fase: 'roto' });
        return;
      }
      const prestadorId = p.data.id;

      /* Hoy en fecha LOCAL, jamás `toISOString()`: eso da UTC y después de las
         19:00 en Guayaquil devuelve el día siguiente (el defecto que S55 midió
         en su harness). El motor cuenta por fecha local del lugar. */
      const ahora = new Date();
      const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

      const [franjas, cupo] = await Promise.all([
        obtenerFranjasGuarderia(prestadorId),
        obtenerCupoGuarderia(prestadorId, hoy, hoy),
      ]);
      if (!vigente) return;

      /* 🔴 Un fallo de lectura JAMÁS se disfraza de «todavía no configuraste»
         (Ley 13 / L-178): si el servidor no contestó, la pantalla lo dice y
         ofrece reintentar — no pinta un formulario vacío que, al guardarse,
         pisaría una configuración que sí existe. */
      if (!franjas.ok || !cupo.ok) {
        setEstado({ fase: 'roto' });
        return;
      }

      const r = franjas.data.find((f) => f.tipo === 'recogida');
      const d = franjas.data.find((f) => f.tipo === 'devolucion');
      if (r !== undefined) {
        setRecogidaDesde(aHoraCorta(r.desde));
        setRecogidaHasta(aHoraCorta(r.hasta));
      }
      if (d !== undefined) {
        setDevolucionDesde(aHoraCorta(d.desde));
        setDevolucionHasta(aHoraCorta(d.hasta));
      }
      const hoyCupo = cupo.data[0];
      if (hoyCupo !== undefined && hoyCupo.capacidad > 0) setCapacidad(hoyCupo.capacidad);

      setEstado({
        fase: 'listo',
        prestadorId,
        sobrevendidoHoy: hoyCupo?.sobrevendido ?? false,
      });
    })();
    return () => {
      vigente = false;
    };
  }, [gate, intento]);

  const guardar = useCallback(async () => {
    if (estado.fase !== 'listo' || guardando) return;
    setGuardando(true);

    const espacio = await definirEspacioGuarderia({
      prestadorId: estado.prestadorId,
      nombre: NOMBRE_ESPACIO,
      capacidadPorDia: capacidad,
    });
    if (!espacio.ok) {
      mostrar({ texto: espacio.mensaje, variante: 'error' });
      setGuardando(false);
      return;
    }

    /* Recogida ANTES que devolución: ver el encabezado. */
    const rec = await definirFranjaGuarderia({
      prestadorId: estado.prestadorId,
      tipo: 'recogida',
      desde: recogidaDesde,
      hasta: recogidaHasta,
    });
    if (!rec.ok) {
      mostrar({ texto: rec.mensaje, variante: 'error' });
      setGuardando(false);
      return;
    }

    const dev = await definirFranjaGuarderia({
      prestadorId: estado.prestadorId,
      tipo: 'devolucion',
      desde: devolucionDesde,
      hasta: devolucionHasta,
    });
    if (!dev.ok) {
      /* 🔴 La capacidad y la recogida YA se guardaron. La voz lo dice en vez
         de sugerir que no pasó nada: *un «no se pudo guardar» sobre algo que
         se guardó a medias manda al prestador a re-hacer lo que ya está.* */
      mostrar({ texto: t('tallerGuarderia.devolucionNoGuardo', { motivo: dev.mensaje }), variante: 'error' });
      setGuardando(false);
      return;
    }

    setGuardando(false);
    mostrar({ texto: t('taller.guardado'), variante: 'exito' });
    setIntento((n) => n + 1);
  }, [estado, guardando, capacidad, recogidaDesde, recogidaHasta, devolucionDesde, devolucionHasta, mostrar, t]);

  if (gate === 'verificando' || estado.fase === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('tallerGuarderia.titulo')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={72} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }
  if (gate === 'denegado') return <GateAjeno />;
  if (gate === 'roto') return <GateRoto onReintentar={reintentarGate} />;
  if (estado.fase === 'roto') return <GateRoto onReintentar={() => setIntento((n) => n + 1)} />;

  const horaElegida =
    queHora === 'recogidaDesde' ? recogidaDesde
    : queHora === 'recogidaHasta' ? recogidaHasta
    : queHora === 'devolucionDesde' ? devolucionDesde
    : queHora === 'devolucionHasta' ? devolucionHasta
    : null;

  const elegirHora = (h: string) => {
    if (queHora === 'recogidaDesde') setRecogidaDesde(h);
    else if (queHora === 'recogidaHasta') setRecogidaHasta(h);
    else if (queHora === 'devolucionDesde') setDevolucionDesde(h);
    else if (queHora === 'devolucionHasta') setDevolucionHasta(h);
    setQueHora(null);
  };

  /* El mínimo de la grilla: una ventana no puede terminar antes de empezar.
     La puerta ya lo rebota (`franja_invertida`); acá la puerta NO OFRECE lo
     que va a rechazar (Ley 23 — el principio de la puerta, S72-B). */
  const minimoDeLaGrilla =
    queHora === 'recogidaHasta' ? recogidaDesde
    : queHora === 'devolucionHasta' ? devolucionDesde
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('tallerGuarderia.titulo')} atras onAtras={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ padding: spacing[5], gap: spacing[6], paddingBottom: insets.bottom + spacing[8] }}
      >
        {/* ── LA CAPACIDAD ── */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="titulo">{t('tallerGuarderia.capacidadTitulo')}</Texto>
          <Texto variante="apoyo">{t('tallerGuarderia.capacidadApoyo')}</Texto>
          <StepperCantidad
            etiqueta={t('tallerGuarderia.capacidadEtiqueta')}
            valor={capacidad}
            min={CAP_MIN}
            max={CAP_MAX}
            onCambio={setCapacidad}
            registro="oficio"
          />
          {/* 🔴 El día sobrevendido se DECLARA y no se resuelve solo: el motor
              nunca cancela una reserva por bajar la capacidad. Si no se
              mostrara, el prestador bajaría el número y no se enteraría de que
              hoy tiene más animales que lugares. */}
          {estado.sobrevendidoHoy ? (
            <Tarjeta relleno="normal" elevacion="reposo">
              <Texto variante="cuerpo">{t('tallerGuarderia.sobrevendido')}</Texto>
            </Tarjeta>
          ) : null}
        </View>

        {/* ── LAS DOS VENTANAS ── */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="titulo">{t('tallerGuarderia.franjasTitulo')}</Texto>
          <Texto variante="apoyo">{t('tallerGuarderia.franjasApoyo')}</Texto>

          {/* EL ESPEJO VIVO: la misma pieza que el dueño ve en el perfil del
              lugar, respondiendo al borrador — el estándar §15b. */}
          <FichaFranja
            recogida={{ rotulo: t('tallerGuarderia.recogida'), desde: recogidaDesde, hasta: recogidaHasta }}
            devolucion={{ rotulo: t('tallerGuarderia.devolucion'), desde: devolucionDesde, hasta: devolucionHasta }}
            conSuperficie
          />

          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('tallerGuarderia.recogidaDesde')}
            metadataMono={recogidaDesde}
            onPress={() => setQueHora('recogidaDesde')}
          />
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('tallerGuarderia.recogidaHasta')}
            metadataMono={recogidaHasta}
            onPress={() => setQueHora('recogidaHasta')}
          />
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('tallerGuarderia.devolucionDesde')}
            metadataMono={devolucionDesde}
            onPress={() => setQueHora('devolucionDesde')}
          />
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('tallerGuarderia.devolucionHasta')}
            metadataMono={devolucionHasta}
            onPress={() => setQueHora('devolucionHasta')}
          />
        </View>

        {/* 🔴 EL PRECIO NO ESTÁ, Y LA PANTALLA LO DICE. Un oficio configurado
            sin precio no recibe reservas, y callarlo dejaría al prestador
            esperando clientes que no pueden llegar. */}
        <Tarjeta relleno="normal" elevacion="reposo">
          <View style={{ gap: spacing[2] }}>
            <Texto variante="cuerpo">{t('tallerGuarderia.precioPendiente')}</Texto>
            <Texto variante="apoyo">{t('tallerGuarderia.precioPendienteApoyo')}</Texto>
          </View>
        </Tarjeta>

        <Boton
          etiqueta={t('tallerGuarderia.guardar')}
          bloque
          cargando={guardando}
          onPress={() => void guardar()}
        />
      </ScrollView>

      <Hoja visible={queHora !== null} onCerrar={() => setQueHora(null)} titulo={t('tallerGuarderia.elegiHora')}>
        <HojaScroll>
          <SelectorOpcion
            etiqueta={t('tallerGuarderia.elegiHora')}
            etiquetaVisible={false}
            acento="oficio"
            disposicion="grilla"
            opciones={HORAS.filter((h) => (minimoDeLaGrilla !== null ? h > minimoDeLaGrilla : true)).map((h) => ({
              codigo: h,
              etiqueta: h,
            }))}
            seleccionada={horaElegida ?? undefined}
            onSelect={elegirHora}
          />
        </HojaScroll>
      </Hoja>
    </View>
  );
}
