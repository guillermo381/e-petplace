/**
 * NEGOCIO — stub digno del ciclo B1/B2 (S51-B3.4, DISEÑO_EXPERIENCIA
 * §14 + alma §2.6): cada módulo tiene su LUGAR visible y dice qué lo
 * despierta — en términos de HITOS, jamás "$0" ni formularios muertos.
 * Los flujos del portal web (servicios/precios/horarios/equipo) se
 * portan en A4/B1.
 *
 * S54-B: los módulos de COBROS despertaron —
 *   · Cuenta comercial (wizard B2.3): Celda navegable con el estado
 *     honesto de la cuenta real (en revisión / activa / falta crearla).
 *   · Liquidaciones: peldaños 0/1 — sin eventos se conserva la
 *     invitación por hito; con eventos propios pendiente_liquidar, la
 *     verdad tal cual ("tienes N servicios cobrados esperando
 *     liquidación") leída del ledger por RLS. Verdad firme (test 8):
 *     solo estado pendiente_liquidar. La vista completa (B2.4) vive en
 *     /liquidaciones desde S55-B — la Celda navega.
 *
 * S57-B (letra P17): NEGOCIO QUEDA PURO OFICIO — la oferta y la plata.
 * El idioma y la salida de sesión se MUDARON a la tab Cuenta (mover =
 * mover, Ley 37: acá no queda ni el código).
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CeldaNavegacion,
  Icono,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerMiPrestador,
  obtenerMundoVeterinariaPropio,
  obtenerOfertaAdiestramientoPropia,
  obtenerOfertasGroomingPropias,
  obtenerOfertasPaseoPropias,
  obtenerResumenPendienteLiquidar,
  type MundoAdiestramientoPropio,
  type MundoVeterinariaPropio,
  type OfertaGroomingPropia,
  type OfertaPaseoPropia,
  type ResumenPendienteLiquidar,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { useGateGestor } from '@/lib/gate-gestor';
import { GateAjeno } from '@/components/gate-ajeno';
import { GateRoto } from '@/components/gate-roto';
import { TechoOficio, VeloBarraEstadoOficio } from '@/components/techo-oficio';

// hoy en ISO LOCAL (hallazgo harness S55: toISOString corre el día)
function hoyLocalISO(): string {
  const hoy = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${p(hoy.getMonth() + 1)}-${p(hoy.getDate())}`;
}

// S52-P4b sistémico: títulos humanizados — sentence case, sin eyebrow.

/** S77-B (D-541): los bloques que este tab lee, UNO POR LECTURA. Vocabulario
 *  CERRADO a propósito — el conjunto de fallos no acepta strings sueltos, así
 *  que una lectura nueva que se agregue sin su bloque rompe el typecheck en
 *  vez de quedar muda. */
type BloqueNegocio =
  /* ☠️ S85-C2: murió `'cuenta'` — su lectura se retiró con `detalleCuenta`.
     El vocabulario es CERRADO a propósito, así que dejarlo habría sido un
     miembro que ninguna lectura puede producir: letra muerta con forma de
     contrato. */
  | 'liquidaciones'
  | 'paseo'
  | 'grooming'
  | 'adiestramiento'
  | 'veterinaria';

export default function Negocio() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // S75-B: la pantalla NEGOCIO cierra la ausencia del tab también ante
  // deep-link — el tab se oculta del bar (layout) y la ruta responde acá
  // (el gate de ESCRITURA es del server — hoy el helper único de D-660,
  // ⏪ S88-C: la referencia decía D-513, cerrada el 5-ago-2026).
  // ⭐ S87-C — ACÁ DECÍA «inerte hasta la puerta». La puerta abrió en S75:
  // este gate CORRE de verdad para las cinco personas de D-651. Y desde
  // esta sesión ya no expulsa mudo (§3 de la lámina).
  const { gate, reintentarGate } = useGateGestor();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();

  // el estado real de los cobros — null mientras carga o si falla la
  // lectura: la fila degrada a su detalle por hito, jamás inventa
  const [pendientes, setPendientes] = useState<ResumenPendienteLiquidar | null>(null);
  // B1a: el resumen VIVO del mundo Paseo — null mientras carga/falla:
  // la tarjeta degrada a su invitación, jamás inventa
  const [ofertas, setOfertas] = useState<OfertaPaseoPropia[] | null>(null);
  // S59-B5: el resumen VIVO del mundo Grooming — misma degradación
  const [ofertasGrooming, setOfertasGrooming] = useState<OfertaGroomingPropia[] | null>(null);
  // S63-B: el resumen VIVO del mundo Adiestramiento — misma degradación
  const [mundoAdiestramiento, setMundoAdiestramiento] = useState<MundoAdiestramientoPropio | null>(null);
  // S68-B: el resumen VIVO del mundo Veterinaria — misma degradación
  const [mundoVeterinaria, setMundoVeterinaria] = useState<MundoVeterinariaPropio | null>(null);

  // ── S77-B · D-541: FALLO ≠ AUSENCIA, BLOQUE POR BLOQUE ──────────────────
  // El patrón viejo era `if (r.ok) setX(...)` SIN rama de fallo en las siete
  // lecturas: los estados nacían en `null` y ahí se quedaban, así que con la
  // red caída este tab —que es PRINCIPAL— se veía IDÉNTICO a un negocio sin
  // nada configurado. Ley 13 rota (*el error jamás se disfraza de vacío*)
  // sobre la superficie donde el prestador gestiona su vida comercial.
  //
  // POR QUÉ UN CONJUNTO Y NO UN BOOLEANO: son siete lecturas independientes
  // y el caso real es MIXTO — que caiga una y las otras seis lleguen. Un
  // booleano obligaría a elegir entre tapar todo el tab por un bloque caído
  // o callar el bloque caído: las dos mienten. Cada bloque dice SU verdad.
  //
  // `cargado` separa CARGANDO de FALLÓ, que era la otra mitad de la mentira:
  // antes `null` significaba las dos cosas. Mientras carga NADA cambia
  // respecto de hoy — solo el caso FALLO estrena voz.
  const [cargado, setCargado] = useState(false);
  const [fallos, setFallos] = useState<ReadonlySet<BloqueNegocio>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const [rPendientes, rPrestador] = await Promise.all([
          obtenerResumenPendienteLiquidar(),
          obtenerMiPrestador(),
        ]);
        if (!vigente) return;
        const caidos = new Set<BloqueNegocio>();
        if (rPendientes.ok) setPendientes(rPendientes.data);
        else caidos.add('liquidaciones');
        if (rPrestador.ok) {
          const [rOfertas, rGrooming, rAdiestramiento, rVeterinaria] = await Promise.all([
            obtenerOfertasPaseoPropias(rPrestador.data.id),
            obtenerOfertasGroomingPropias(rPrestador.data.id),
            obtenerOfertaAdiestramientoPropia(rPrestador.data.id),
            obtenerMundoVeterinariaPropio(rPrestador.data.id),
          ]);
          if (!vigente) return;
          if (rOfertas.ok) setOfertas(rOfertas.data);
          else caidos.add('paseo');
          if (rGrooming.ok) setOfertasGrooming(rGrooming.data);
          else caidos.add('grooming');
          if (rAdiestramiento.ok) setMundoAdiestramiento(rAdiestramiento.data);
          else caidos.add('adiestramiento');
          if (rVeterinaria.ok) setMundoVeterinaria(rVeterinaria.data);
          else caidos.add('veterinaria');
        } else {
          // EL CASCADEO, declarado: sin el prestador las CUATRO lecturas de
          // mundo ni siquiera se disparan. No es que los mundos estén
          // vacíos — es que no se pudieron pedir. Los cuatro caen juntos.
          caidos.add('paseo');
          caidos.add('grooming');
          caidos.add('adiestramiento');
          caidos.add('veterinaria');
        }
        setFallos(caidos);
        setCargado(true);
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  /** Voz de fallo del bloque, o `null` si ese bloque está sano (o cargando).
   *  Se consulta ANTES de la lógica de detalle de cada bloque: lo que no se
   *  pudo leer no se cuenta como "todavía no lo configuraste". */
  const fallo = (b: BloqueNegocio): string | null =>
    cargado && fallos.has(b) ? t('negocio.bloqueNoCargo') : null;

  /* ☠️ S85-C2 — MURIÓ `detalleCuenta` (Ley 37). C34 retiró de acá la celda
     de cuenta comercial (firma del founder: *no es normal tenerlo en dos
     lugares*) y **dejó viva toda su cadena de alimentación**: el censo de
     S85-C midió `grep detalleCuenta` = UNA sola ocurrencia, su propia
     definición. Con ella se van `cuenta`, `cuentaCargada` y la lectura
     `obtenerMiCuentaComercial()` del arranque — **un viaje de red por
     carga de Negocio que alimentaba código que nadie renderizaba.**
     *Retirar una celda no es retirar su dato: eso es lo que la Ley 37
     exige y lo que aquella tanda no cerró.* */
  // liquidaciones: peldaño 1 SOLO con eventos reales; 0 conserva el hito
  const detalleLiquidaciones =
    fallo('liquidaciones') ??
    (pendientes !== null && pendientes.cantidad > 0
      ? pendientes.cantidad === 1
        ? t('negocio.liquidacionesPendientesUno')
        : t('negocio.liquidacionesPendientes', { cantidad: pendientes.cantidad })
      : t('negocio.liquidacionesDetalle'));

  // B1a: el detalle vivo del mundo Paseo — verdad de DB o invitación
  const activas = ofertas?.filter((o) => o.activo) ?? [];
  const desde = activas.length > 0 ? Math.min(...activas.map((o) => o.precio)) : null;
  // S59-B5: detalle vivo del mundo Grooming — verdad de DB o invitación
  const activasGrooming = ofertasGrooming?.filter((o) => o.activo) ?? [];
  const preciosGrooming = activasGrooming.flatMap((o) =>
    (['S', 'M', 'L'] as const).map((tl) => o.tallas[tl]?.precio).filter((v): v is number => v !== undefined),
  );
  const detalleMundoGrooming =
    fallo('grooming') ??
    (ofertasGrooming === null || activasGrooming.length === 0 || preciosGrooming.length === 0
      ? t('negocio.mundoGroomingVacio')
      : t('ofertaGrooming.serviciosDetalle', {
          lista: activasGrooming
            .map((o) => (o.tipoServicio === 'grooming' ? t('tallerGrooming.servicioBano') : t('tallerGrooming.servicioBanoCorte')))
            .join(' · '),
          precio: `$${Math.min(...preciosGrooming).toFixed(2)}`,
        }));

  const detalleMundoPaseo =
    fallo('paseo') ??
    (ofertas === null || activas.length === 0
      ? t('negocio.mundoPaseoVacio')
      : activas.length === 1
        ? t('ofertaPaseo.duracionesDetalleUna', { precio: `$${(desde as number).toFixed(2)}` })
        : t('ofertaPaseo.duracionesDetalle', { n: activas.length, precio: `$${(desde as number).toFixed(2)}` }));

  // S63-B: detalle vivo del mundo Adiestramiento — verdad de DB o invitación
  const ofertaAdiestramiento = mundoAdiestramiento?.oferta ?? null;
  const programasActivos = mundoAdiestramiento?.programas.filter((p) => p.activo).length ?? 0;
  const detalleMundoAdiestramiento =
    fallo('adiestramiento') ??
    (ofertaAdiestramiento === null || !ofertaAdiestramiento.activo || ofertaAdiestramiento.precio === null
      ? t('negocio.mundoAdiestramientoVacio')
      : t('negocio.mundoAdiestramientoDetalle', {
          precio: `$${ofertaAdiestramiento.precio.toFixed(2)}`,
          n: programasActivos,
        }));

  // S68-B: detalle vivo del mundo Veterinaria — verdad de DB o invitación
  const serviciosVet = mundoVeterinaria?.servicios.filter((s) => s.activo) ?? [];
  const detalleMundoVeterinaria =
    fallo('veterinaria') ??
    (mundoVeterinaria === null || serviciosVet.length === 0
      ? t('negocio.mundoVeterinariaVacio')
      : serviciosVet.length === 1
        ? t('negocio.mundoVeterinariaDetalleUno', {
            precio: `$${Math.min(...serviciosVet.map((s) => s.precio)).toFixed(2)}`,
          })
        : t('negocio.mundoVeterinariaDetalle', {
            n: serviciosVet.length,
            precio: `$${Math.min(...serviciosVet.map((s) => s.precio)).toFixed(2)}`,
          }));

  /* ⭐ S87-C (LÁMINA §3) — EL REBOTE MUDO MUERE. Acá decía
     `<Redirect href="/(tabs)" />`: al no-gestor que llegaba por deep link
     lo mandaba a Hoy SIN UNA PALABRA, y §3 lo prohíbe con literal
     («un rebote silencioso a Hoy deja a la persona creyendo que tocó mal»).
     ⚠️ La AUSENCIA de Ley 23 sigue intacta y no se confunde con esto: el
     tab NO se ofrece en la barra —eso es §2, y ahí no hay nada que
     explicar—. Esto es la otra mitad: cuando alguien YA preguntó por una
     ruta concreta, se le contesta. */
  if (gate === 'denegado') return <GateAjeno />;
  // S79-B: datos del gate CONTRADICTORIOS (rol=false + titular=null) —
  // jamás expulsión muda: la superficie habla y reintenta (el blanco del
  // gate del founder nacía acá).
  if (gate === 'roto') return <GateRoto onReintentar={reintentarGate} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}>
        {/* B2 §15b.2: el techo de tinta — el dato de trabajo es la plata
            real esperando liquidación; sin eventos, la fecha del día */}
        <TechoOficio
          titulo={t('negocio.titulo')}
          dato={
            pendientes !== null && pendientes.cantidad > 0
              ? detalleLiquidaciones
              : fechaDiaSemanaHumana(hoyLocalISO(), idioma as IdiomaSoportado)
          }
        />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[4] }}>
          {/* B1a — NEGOCIO COMO MUNDOS (§15b.5): cada mundo con sus dos
              caras; el que no está en la app es puerta honesta por hito,
              jamás decoración muerta */}
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('negocio.oferta')}</Texto>
            {/* S81-C (composición): las cuatro tarjetas de mundo eran la
                MISMA anatomía copiada 4× inline (paseo S54 → grooming
                S59 → adiestramiento S63 → vet S68, cada gemela pegada a
                mano). Una sola forma, datos por fila — el drift entre
                gemelas ya no puede nacer. Cero cambio visual. Historia
                de cada mundo: paseo S54 · grooming S59-B5 FASE 2 ·
                adiestramiento S63/S65-B2 P1 (entra por su PORTADA) ·
                veterinaria S68 (glifo del lote S53). */}
            {(
              [
                { etiqueta: t('negocio.paseo'), icono: 'paseo', ruta: '/paseo', detalle: detalleMundoPaseo },
                { etiqueta: t('negocio.mundoGrooming'), icono: 'grooming', ruta: '/grooming', detalle: detalleMundoGrooming },
                { etiqueta: t('negocio.mundoAdiestramiento'), icono: 'training', ruta: '/adiestramiento', detalle: detalleMundoAdiestramiento },
                { etiqueta: t('negocio.mundoVeterinaria'), icono: 'veterinaria', ruta: '/veterinaria', detalle: detalleMundoVeterinaria },
              ] as const
            ).map((mundo) => (
              <Tarjeta
                key={mundo.ruta}
                interactiva
                elevacion="reposo"
                accessibilityRole="button"
                etiqueta={mundo.etiqueta}
                onPress={() => router.push(mundo.ruta)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                  <Icono nombre={mundo.icono} registro="aa" tamano={28} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Texto variante="seccion">{mundo.etiqueta}</Texto>
                    <Texto variante="apoyo">{mundo.detalle}</Texto>
                  </View>
                </View>
              </Tarjeta>
            ))}
          </View>

          {/* cobros — los módulos vivos de S54 */}
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('negocio.cobros')}</Texto>
            <Tarjeta relleno="ninguno">
              {/* ☠️ S84-C34 ③ — ACÁ VIVÍA LA ENTRADA A LA CUENTA COMERCIAL,
                  y se retira por firma del founder: *no es normal tenerlo
                  en dos lugares*. Con "Datos comerciales" en el Perfil,
                  ésta era la segunda puerta al mismo sitio.
                  ⚠️ MEDIDO ANTES DE SACARLA, porque las otras dos
                  entradas NO alcanzan: `liquidaciones:210` solo se dibuja
                  si `faltaCuentaActiva` y `sala-espera:205` solo antes de
                  activarse — **las dos están gateadas a "todavía no
                  tenés cuenta activa"**. Ésta era la única permanente, y
                  por eso sacarla sin el Perfil habría dejado al prestador
                  YA ACTIVO sin ninguna forma de editar sus datos.
                  Las otras dos NO se tocan: son contextos, no duplicados
                  (cobrar · entrar). */}
              <Separador />
              {/* S55-B (B1): la vista completa existe — la celda navega;
                  el peldaño 0 de la pantalla educa cuando el ledger está vacío */}
              <CeldaNavegacion
                icono="pagos"
                registro="aa"
                titulo={t('negocio.liquidaciones')}
                detalle={detalleLiquidaciones}
                onPress={() => router.push('/liquidaciones')}
              />
              {/* ☠️ S86-C · «EL MOVIMIENTO» SE MUDÓ A CUENTA (firma de mesa):
                  es PLATA DE LA CUENTA COMERCIAL, no configuración del
                  oficio. ⏪ Su nota de S70-B2-v2 decía que migraba ACÁ por
                  «HOY acciona, NEGOCIO gestiona» — cierto entonces, vencido
                  ahora: la frontera pasó a *DATOS consulta · NEGOCIO
                  configura*, y un ledger no se configura.
                  ⚠️ SUS DOS GATES VIAJARON CON ELLA: el de rol (el del tab,
                  vía `useGateGestor`) y **el de oficio vet** que vivía acá
                  (`serviciosVet.length > 0`) — los presupuestos son
                  clínicos. Perder el segundo habría ofrecido la pantalla a
                  negocios sin nada que mostrar.
                  ⚠️ Y NO SE PARTIÓ: «Lo que te espera» en HOY sigue
                  apuntando al mismo destino — dos vistas, una fuente. */}
            </Tarjeta>
          </View>

          {/* ☠️ S86-C · ACÁ VIVÍA LA ENTRADA A EQUIPO, y SE MUDÓ A DATOS
              (firma del founder: *DATOS consulta · NEGOCIO configura*).
              Se retira en el MISMO commit que la construye allá — una
              mudanza que deja el origen puesto es una COPIA, y dos puertas
              a la misma pantalla envejecen distinto.
              ⏪ Su nota decía que la celda se dibujaba para quien opera y
              que la PANTALLA gateaba por rol (S74-B). Eso NO cambió: la
              pantalla `/negocio/equipo` sigue igual y sigue siendo el
              destino. Lo que cambió es DESDE DÓNDE se llega.
              ⚠️ Y en DATOS la sección gatea por `esDueno` DEL LECTOR: este
              tab tiene gate de gestor y aquél NO, así que mudarla sin su
              gate habría ensanchado la audiencia (🔴 medida en S85-C32). */}
          {/* ── S79-B (T2-B5) · "SE DESPIERTA CON EL USO" — los tres mudos
              del audit ganan sección + voz + disparo (§2.6: la navegación
              muestra el módulo; el detalle NOMBRA qué lo despierta).
              Patrón replicado de Liquidaciones — cero patrón nuevo.
              Glifos: 'caso' es propio; 'negocio' y 'refugio' son STAND-IN
              declarados (sin glifo de estadísticas/reseñas en el registry;
              L-175 — el pedido nace si el founder lo firma). ── */}
          {/* ☠️ S86-C · DE LOS TRES «SE DESPIERTA CON EL USO», DOS SE
              MUDARON A DATOS (firma de mesa) y queda ESTADÍSTICAS solo:
               · **RESEÑAS** — una reseña no se CONFIGURA: es evidencia
                 sobre el negocio. Cae del lado «consulta».
               · **CASOS HEREDADOS** — el caso es del PET PARENT. Tenerlo
                 en NEGOCIO afirmaba algo falso contra letra firmada, y
                 ése es el argumento que lo mueve: no es acomodo, es que
                 acá decía una cosa que no es.
              ⏳ **ESTADÍSTICAS SE QUEDA, y es a propósito**: muere junto
              con el dashboard que la reemplaza (firma ①), jamás antes —
              retirarla hoy dejaría un hueco donde hay una promesa
              honesta. Su celda es el único habitante que le queda a esta
              sección; cuando se vaya, la sección se va con ella (Ley 37). */}
          {/* ☠️ S86-C · MURIÓ LA SECCIÓN «SE DESPIERTA CON EL USO» ENTERA,
              con su último habitante: **ESTADÍSTICAS**.
              La firma decía que muere EN EL MISMO COMMIT que el dashboard
              que la reemplaza — y el dashboard existe: DATOS ya tiene la
              semana, el día por día, el mix y la trayectoria sobre datos
              REALES. La promesa honesta («se despierta con el uso») cumplió
              su trabajo el día que lo despertado apareció (Ley 37).
              ⚠️ Se retira TAMBIÉN la sección, no solo la celda: era su
              único habitante, y un encabezado sin filas es un rótulo que
              promete una lista vacía. */}

        </View>
      </ScrollView>
      {/* S59-B1: el velo de tinta — la zona de la barra de estado JAMÁS
          queda blanca, ni cuando el techo scrollea (regla del pedido). */}
      <VeloBarraEstadoOficio />
    </View>
  );
}
