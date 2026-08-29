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
 *
 * ═══ S98-C · LA RECONSTRUCCIÓN POR LAS DOS NATURALEZAS ════════════════
 * Firma del founder, literal: *«en mi negocio aún faltan los cambios, a
 * rectángulos y las dos categorías de servicios que hablamos desde el
 * inicio»* (`LA_CASA_DEL_PRESTADOR` §6bis ⑤).
 *
 * ⇒ **Dos secciones con los NOMBRES FIRMADOS** (§1.2): «Tus servicios»
 * arriba, «Tu tienda» debajo. *No es vocabulario: es el primer candado
 * del cinturón de `MODELO_DESPENSA` §3.4* — la frontera que desde S95 se
 * sostiene solo en nuestra disciplina, y nombrarlas distinto es la mitad
 * gratis de esa disciplina.
 *
 * ⇒ **Los mundos pasan de fila a BALDOSA** (Acto II de B): *tarjetas para
 * lo que se ELIGE, filas para lo que se LEE*. Cuatro mundos entre los que
 * se salta no son una lista que se recorre.
 *
 * 🔴 **LA CONDICIÓN DE D, QUE NO ES OPCIONAL:** su cura de «Prepará tu
 * espacio» hace deep link a `/<oficio>/taller?seccion=…` y **cuando el
 * destino no es resoluble cae acá**, apoyándose en que **lo primero de
 * esta pantalla sea la lista de mundos**. Con «Tus servicios» arriba se
 * cumple. **Si algún día el orden cambia, se le avisa a D ANTES: el
 * fallback es de SU fila y se mueve de un solo lado.**
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Baldosa,
  Boton,
  CeldaNavegacion,
  Esqueleto,
  EsqueletoGrupo,
  Hoja,
  Insignia,
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
  obtenerNaturalezasDeCuenta,
  obtenerOfertaAdiestramientoPropia,
  obtenerOfertasGroomingPropias,
  obtenerOfertasPaseoPropias,
  obtenerResumenPendienteLiquidar,
  type EstadoNaturaleza,
  type MundoAdiestramientoPropio,
  type MundoVeterinariaPropio,
  type OfertaGroomingPropia,
  type OfertaPaseoPropia,
  type ResumenPendienteLiquidar,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { TarjetaVentas } from '@/components/tarjeta-ventas';
import { contextoVentas } from '@/lib/cuenta-ventas';
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

/* ⭐ S98-C · LA GRILLA DE BALDOSAS — **el patrón del PIE de `Baldosa.tsx`
   copiado tal cual, y ésa es toda la gracia.**

   `width: '50%'` + padding adentro de la celda y **SIN `gap`**: es lo
   único que cierra por construcción —`50 % + 50 % = 100 %` exacto en
   cualquier ancho, sin nada que sumarle—. El `marginHorizontal` negativo
   devuelve el padding de los bordes para que la grilla quede alineada con
   el resto de la pantalla.

   ⚠️ **NO se inventa un porcentaje acá.** El patrón ya se equivocó dos
   veces en un día (47 % frágil por 7 px · 48 % que no entra en NINGÚN
   teléfono, con la aritmética medida en cuatro anchos reales) y la cura
   fue justamente **sacar el gap de la cuenta del wrap**. Un tercer
   porcentaje inventado en esta pantalla sería la tercera vez. */
const ESTILO_GRILLA = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginHorizontal: -spacing[2],
} as const;
/* ⭐ S107-C · TRES COLUMNAS (firma del founder tras caminar el gate).
   Con cuatro mundos, dos columnas repartían parejo. Con el quinto, la última
   fila quedaba con UNA baldosa sola del doble de ancho que sus hermanas — y
   **una baldosa más grande se lee como más importante**, que es justo lo que
   la grilla no debe decir: los cinco oficios pesan igual.
   🔴 Tres columnas reparten 5 en 3+2 y **ninguna queda huérfana a lo ancho**:
   la fila corta se ve corta, no se ve inflada. */
const ESTILO_CELDA = {
  width: '33.333%',
  paddingHorizontal: spacing[2],
  paddingBottom: spacing[4],
} as const;

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

  // ── S96-C · LA PUERTA DE OFICIO (LETRA_RECORRIDO §1 + §3) ───────────────
  // Dos naturalezas, dos nombres: «Venta de productos» NO es un mundo de
  // Servicios — es su propia sección, y solo existe para la cuenta que
  // tiene la naturaleza de venta (rol `seller_productos` activo, leído por
  // RLS vía el contexto cacheado). El barrido es SOLO color (el propio
  // componente lo advierte): los permisos ya cambiaron en el servidor.
  // TRES estados (hallazgo ① del gate): 'cargando' existe para que el
  // muro de titularidad no flashee GateAjeno mientras la naturaleza llega.
  const [naturalezaVentas, setNaturalezaVentas] = useState<'cargando' | 'vendedora' | 'no'>(
    'cargando',
  );

  /* ⭐ S98-C · EL ESTADO DE «Tu tienda», con sus TRES valores y no dos.
     `contextoVentas` solo sabe si la naturaleza está ACTIVA — y la firma
     pide distinguir al que YA PIDIÓ («lo estamos revisando») del que
     nunca pidió. El lector de los tres estados **ya existía**
     (`obtenerNaturalezasDeCuenta`, el mismo que usa el paso ② del
     wizard): se reusa, no se inventa uno paralelo.
     `null` = no se pudo leer o esta persona no tiene cuenta comercial. */
  const [tienda, setTienda] = useState<EstadoNaturaleza | null>(null);
  /** La Hoja de «esto llega en V2» — ver su excepción firmada abajo. */
  const [hojaV2, setHojaV2] = useState(false);

  /* 🔴 S98-C · ESTA PERSONA NO TIENE FILA DE PRESTADOR — y eso NO es un
     fallo: es el cinturón (§8.6bis). **El vendedor puro llega hasta acá**,
     medido: `useGateGestor` FALLA ABIERTO (`if (!prestador.ok) →
     'permitido'`), así que no lo ataja ningún muro.

     Sin esta distinción, la sección «Tus servicios» le mostraba **cuatro
     baldosas diciendo «No se pudo leer»** — un rótulo firmado sobre cuatro
     falsos fallos, a alguien que simplemente no vende servicios. *Confundir
     «no tiene» con «no se pudo» es la Ley 13 al revés: no disfraza el
     error de vacío, disfraza el vacío de error.*
     El wrapper ya distinguía los dos casos con su código `sin_prestador`;
     lo que faltaba era leerlo. */
  const [sinPrestador, setSinPrestador] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const [rPendientes, rPrestador, rVentas] = await Promise.all([
          obtenerResumenPendienteLiquidar(),
          obtenerMiPrestador(),
          contextoVentas(),
        ]);
        if (!vigente) return;
        // La puerta solo se dibuja con la naturaleza medida; si el contexto
        // no se pudo leer, NO se dibuja — una puerta que no se sabe si
        // corresponde es peor que su ausencia (y no es un fallo del tab:
        // el resto de Negocio no depende de esto).
        setNaturalezaVentas(
          rVentas.ok && rVentas.data !== null && rVentas.data.esVendedora ? 'vendedora' : 'no',
        );
        const caidos = new Set<BloqueNegocio>();
        if (rPendientes.ok) setPendientes(rPendientes.data);
        else caidos.add('liquidaciones');

        /* ⭐ S98-C · LA SEGUNDA OLA LLEVA LAS DOS NATURALEZAS JUNTAS, y la
           de la tienda **NO cuelga del prestador**: el vendedor puro no
           tiene fila de prestador —eso es el cinturón (§8.6bis), no un
           error— y su sección de tienda tiene que poder hablar igual.
           Colgarla del `if (rPrestador.ok)` la habría dejado muda justo
           para quien es SOLO tienda. Un viaje más en la ola que ya existe,
           cero esperas nuevas (D-738: lo caro es la petición encadenada). */
        const cuentaId =
          rVentas.ok && rVentas.data !== null ? rVentas.data.cuentaComercialId : null;
        const [mundos, rNaturalezas] = await Promise.all([
          rPrestador.ok
            ? Promise.all([
                obtenerOfertasPaseoPropias(rPrestador.data.id),
                obtenerOfertasGroomingPropias(rPrestador.data.id),
                obtenerOfertaAdiestramientoPropia(rPrestador.data.id),
                obtenerMundoVeterinariaPropio(rPrestador.data.id),
              ])
            : Promise.resolve(null),
          cuentaId === null ? Promise.resolve(null) : obtenerNaturalezasDeCuenta(cuentaId),
        ]);
        if (!vigente) return;

        if (mundos !== null) {
          const [rOfertas, rGrooming, rAdiestramiento, rVeterinaria] = mundos;
          if (rOfertas.ok) setOfertas(rOfertas.data);
          else caidos.add('paseo');
          if (rGrooming.ok) setOfertasGrooming(rGrooming.data);
          else caidos.add('grooming');
          if (rAdiestramiento.ok) setMundoAdiestramiento(rAdiestramiento.data);
          else caidos.add('adiestramiento');
          if (rVeterinaria.ok) setMundoVeterinaria(rVeterinaria.data);
          else caidos.add('veterinaria');
        } else if (!rPrestador.ok && rPrestador.codigo === 'sin_prestador') {
          // NO HAY NEGOCIO DE SERVICIOS, y eso es legal: la sección
          // «Tus servicios» no se monta. Cero fallos anotados — no falló
          // nada. (Ver el porqué arriba, en `sinPrestador`.)
          setSinPrestador(true);
        } else {
          // EL CASCADEO, declarado: sin el prestador las CUATRO lecturas de
          // mundo ni siquiera se disparan. No es que los mundos estén
          // vacíos — es que no se pudieron pedir. Los cuatro caen juntos.
          caidos.add('paseo');
          caidos.add('grooming');
          caidos.add('adiestramiento');
          caidos.add('veterinaria');
        }

        /* Sin cuenta o con la lectura caída queda `null` — y `null` NO se
           dibuja como «ninguna»: eso afirmaría «no pediste tienda» cuando
           lo cierto es que no pudimos preguntar (Ley 13 / L-197). */
        setTienda(
          rNaturalezas !== null && rNaturalezas.ok
            ? (rNaturalezas.data.find((n) => n.naturaleza === 'seller_productos')?.estado ??
                'ninguna')
            : null,
        );
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
  /** ⭐ S98-C · UN SOLO PREDICADO DE «VENDE» EN ESTA PANTALLA — el mismo
   *  que gobierna la sección «Tu tienda». La fila de facturación de ventas
   *  no puede existir para quien no vende, y derivarla de otra fuente sería
   *  reabrir D-821 en chiquito. */
  const vendeProductos = tienda === 'activa';

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

  /* ─────────────────────────────────────────────────────────────────────
     ⭐ S98-C · EL DETALLE DE LA BALDOSA: **UN CONTEO, UNA LÍNEA.**
     Y la razón NO es de gusto — está medida contra la pieza:

     `Baldosa` pinta su `detalle` con `numberOfLines={1}` sobre el ancho
     útil de una celda de media pantalla: **~155 px** (206 de celda − 16
     de padding de grilla − 32 del padding de la pieza − 3 del canto, con
     los 412 px de un Android real). En `apoyo` (14 px) eso son ~22
     caracteres.

     Las voces que estas filas traían fueron escritas para una FILA ANCHA
     y ninguna entra:
         «4 servicios activos · desde $25»  → 30 car.  ✗ trunca
         «Ábrelo y arma tu oferta en el taller.» → 37 car. ✗ trunca

     ⇒ Se acortan a lo que la pieza SÍ puede decir, que es además lo que
     su contrato nombra (*«el conteo, el precio, el estado»*). **El precio
     no sube a la baldosa**: con N servicios a precios distintos habría
     que decir «desde», y «desde $25» sin el conteo dice menos que el
     conteo solo. *El precio sigue vivo adentro del mundo, donde la
     escalera del precio honesto (S61) ya lo gobierna.*

     ⚠️ **ESTO ES UNA PÉRDIDA DE INFORMACIÓN EN LA PORTADA Y SE DECLARA**
     — la fila mostraba conteo Y precio. No se puede tener las dos cosas
     en una línea de 22 caracteres, y **truncar es peor que acortar**: un
     «4 servicios activo…» no informa y encima se ve roto. Va a la lista
     de diseño del reporte para que el founder lo mire con el ojo.
     ───────────────────────────────────────────────────────────────────── */

  /** El conteo de servicios ACTIVOS de cada mundo. `null` = todavía no se
   *  leyó — que **no es cero**: durante la carga la baldosa no dice nada
   *  en vez de afirmar «Sin configurar» sobre datos que no llegaron. */
  const conteoDeMundo = (b: BloqueNegocio, n: number | null): string | undefined => {
    if (fallos.has(b) && cargado) return t('negocio.baldosaNoCargo');
    if (!cargado || n === null) return undefined;
    return n === 0
      ? t('negocio.baldosaSinConfigurar')
      : n === 1
        ? t('negocio.baldosaUno')
        : t('negocio.baldosaN', { n });
  };

  // B1a paseo · S59-B5 grooming · S63-B adiestramiento · S68-B veterinaria.
  // Cada oficio cuenta SUS filas activas de oferta — la unidad es la misma
  // (`prestador_servicios`), por eso el sustantivo puede ser uno solo.
  const nPaseo = ofertas === null ? null : ofertas.filter((o) => o.activo).length;
  const nGrooming = ofertasGrooming === null ? null : ofertasGrooming.filter((o) => o.activo).length;
  const nVeterinaria =
    mundoVeterinaria === null ? null : mundoVeterinaria.servicios.filter((s) => s.activo).length;
  /* Adiestramiento cuenta distinto y a propósito: su oferta es UNA (la
     sesión), así que su conteo es 0 o 1. **Sus programas NO entran a la
     baldosa** — son paquetes de esa misma sesión, y meterlos acá obligaría
     a un segundo sustantivo en una línea que no tiene lugar para uno. */
  const nAdiestramiento =
    mundoAdiestramiento === null
      ? null
      : mundoAdiestramiento.oferta !== null &&
          mundoAdiestramiento.oferta.activo &&
          mundoAdiestramiento.oferta.precio !== null
        ? 1
        : 0;

  /* ⭐ S87-C (LÁMINA §3) — EL REBOTE MUDO MUERE. Acá decía
     `<Redirect href="/(tabs)" />`: al no-gestor que llegaba por deep link
     lo mandaba a Hoy SIN UNA PALABRA, y §3 lo prohíbe con literal
     («un rebote silencioso a Hoy deja a la persona creyendo que tocó mal»).
     ⚠️ La AUSENCIA de Ley 23 sigue intacta y no se confunde con esto: el
     tab NO se ofrece en la barra —eso es §2, y ahí no hay nada que
     explicar—. Esto es la otra mitad: cuando alguien YA preguntó por una
     ruta concreta, se le contesta. */
  if (gate === 'denegado') {
    // 🔴 S96-C (hallazgo ① del gate del founder): el muro de titularidad
    // es de LA GESTIÓN DEL NEGOCIO — no de la despensa del que llega. El
    // empleado no-titular que además es VENDEDOR (nuevo_test2: empleado
    // de Satori Y dueño de su cuenta seller) veía el muro de un negocio
    // AJENO tapándole LO SUYO. Acá conviven las dos verdades: la gestión
    // sigue siendo del titular (el muro de Satori, intacto — cero plata
    // ajena en pantalla) y su venta de productos entra por su tarjeta.
    // 'cargando' dibuja esqueleto para no flashear el rebote (Ley 13).
    if (naturalezaVentas === 'cargando') {
      return (
        <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: spacing[5], paddingTop: spacing[10] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="linea" ancho="60%" />
              <Esqueleto forma="bloque" ancho="100%" alto={88} />
            </View>
          </EsqueletoGrupo>
        </View>
      );
    }
    if (naturalezaVentas === 'vendedora') {
      return (
        <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
          <MarcaDeAgua />
          <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5], gap: spacing[4] }}>
            <View style={{ gap: spacing[1] }}>
              <Texto variante="seccion">{t('ventas.negocioAjeno.titulo')}</Texto>
              <Texto variante="apoyo">{t('ventas.negocioAjeno.detalle')}</Texto>
            </View>
            <TarjetaVentas
              etiqueta={t('ventas.entradaTitulo')}
              detalle={t('ventas.entradaDetalle')}
              onPress={() => router.push('/ventas')}
            />
          </View>
          {/* ☠️ S98-C · el barrido murió acá también — su porqué medido vive
              en la lápida gemela del HOY. */}
        </View>
      );
    }
    return <GateAjeno />;
  }
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
          {/* ── ① «Tus servicios» — LA PRIMERA NATURALEZA (§1.2) ─────────
              🔴 VA PRIMERA Y NO SE MUEVE SIN AVISARLE A D: el fallback de
              «Prepará tu espacio» aterriza acá contando con que lo primero
              sea la lista de mundos (ver el encabezado del archivo). */}
          {!sinPrestador && (
          <View style={{ gap: spacing[3] }}>
            {/* Los NOMBRES FIRMADOS de las dos naturalezas viven en UNA
                sola key cada uno y se leen desde donde estén: son
                vocabulario de plataforma, no voz de esta pantalla. *Una
                segunda copia del mismo nombre es la mitad del cinturón
                de §3.4 lista para divergir* — y ya hay una tercera en el
                wizard (`alta.paso2.*`), reportada y no ampliada acá. */}
            <Texto variante="seccion">{t('atender.tusServicios')}</Texto>
            {/* S81-C (composición): las cuatro tarjetas de mundo eran la
                MISMA anatomía copiada 4× inline (paseo S54 → grooming
                S59 → adiestramiento S63 → vet S68, cada gemela pegada a
                mano). Una sola forma, datos por fila — el drift entre
                gemelas ya no puede nacer. Historia de cada mundo: paseo
                S54 · grooming S59-B5 FASE 2 · adiestramiento S63/S65-B2 P1
                (entra por su PORTADA) · veterinaria S68 (glifo del lote
                S53).
                ⭐ S98-C: la anatomía pasa de `Tarjeta` en fila a `Baldosa`
                en grilla (firma del founder: *«a rectángulos»*). El canto
                dice CATEGORÍA y el glifo dice SERVICIO (Ley 10) — la
                veterinaria es la única de capa `identidad`; paseo,
                grooming y adiestramiento comparten `cuidado`, y eso es
                a propósito, no un descuido de la ley. */}
            <View style={ESTILO_GRILLA}>
              {(
                [
                  { etiqueta: t('negocio.paseo'), glifo: 'paseo', capa: 'cuidado', ruta: '/paseo', detalle: conteoDeMundo('paseo', nPaseo) },
                  { etiqueta: t('negocio.mundoGrooming'), glifo: 'grooming', capa: 'cuidado', ruta: '/grooming', detalle: conteoDeMundo('grooming', nGrooming) },
                  { etiqueta: t('negocio.mundoAdiestramiento'), glifo: 'training', capa: 'cuidado', ruta: '/adiestramiento', detalle: conteoDeMundo('adiestramiento', nAdiestramiento) },
                  { etiqueta: t('negocio.mundoVeterinaria'), glifo: 'veterinaria', capa: 'identidad', ruta: '/veterinaria', detalle: conteoDeMundo('veterinaria', nVeterinaria) },
                  /* ⭐ S107-C · LA GUARDERÍA. Capa `cuidado` como sus tres
                     hermanas (Ley 10: el canto dice CATEGORÍA), glifo propio.
                     🔴 `detalle: undefined` A PROPÓSITO y no por olvido: las
                     otras cuatro cuentan sus filas de oferta activas, y
                     guardería TODAVÍA NO TIENE OFERTA (no existe su wrapper).
                     Pasarle `conteoDeMundo` diría «sin configurar» a un
                     prestador que ya guardó su cupo y sus ventanas — un
                     número falso es peor que ninguno. Entra con la oferta. */
                  { etiqueta: t('negocio.mundoGuarderia'), glifo: 'guarderia', capa: 'cuidado', ruta: '/guarderia', detalle: undefined },
                ] as const
              ).map((mundo, i) => (
                <View key={mundo.ruta} style={ESTILO_CELDA}>
                  <Baldosa
                    /* 🔴 SIN ESTO EL GLIFO NO SE ENTERA DE QUE LA GRILLA
                       CAMBIÓ: `Baldosa` dimensiona su glifo con `columnas`
                       (48 a dos, 32 a tres) y su default es 2. La celda pasó a
                       33 % y el glifo seguía a 48 — por eso pisaba el label.
                       *Cambiar el ancho del contenedor no achica lo de
                       adentro; hay que decírselo a la pieza.* */
                    columnas={3}
                    glifo={mundo.glifo}
                    capa={mundo.capa}
                    titulo={mundo.etiqueta}
                    detalle={mundo.detalle}
                    orden={i}
                    onPress={() => router.push(mundo.ruta)}
                  />
                </View>
              ))}
            </View>
          </View>
          )}

          {/* ── ② «Tu tienda» — LA OTRA NATURALEZA ────────────────────────
              `MODELO_DESPENSA` §3.4: «Venta de productos» NO es un mundo
              de Servicios — por eso vive en su PROPIA sección y jamás
              adentro de la grilla de arriba. *Meterla ahí sería el primer
              paso hacia la tabla compartida que el cinturón prohíbe.*

              ⭐ **LA SECCIÓN SIEMPRE SE MONTA** (firma del founder, 14-ago),
              también para quien nunca pidió. Yo la había dejado sin dibujar
              en ese caso por miedo a duplicar el productor de
              `solicitar_naturaleza_comercial` — **el freno era correcto y
              la firma lo respeta**: la puerta de crecimiento **ENRUTA** al
              paso ② del wizard, donde el productor ya vive. *Se ofrece,
              pero no se activa hasta que se aprueba: el foso de §4.2 queda
              intacto (el vendedor propone, e-PetPlace publica).*

              ⚠️ `null` es el ÚNICO caso sin sección, y no es el tercer
              estado: significa «no se pudo leer» o «esta persona no tiene
              cuenta comercial». Dibujar la puerta ahí sería ofrecerle una
              tienda a quien no tiene negocio, o afirmar un estado que no
              medimos (Ley 13 / L-197). */}
          {tienda !== null && (
            <View style={{ gap: spacing[3] }}>
              <Texto variante="seccion">{t('atender.tuTienda')}</Texto>

              {/* ⭐ LA TIENDA ACTIVA TIENE **DOS VISTAS** — arquitectura
                  nueva, literal del founder: *«agregar los productos de mi
                  negocio»* (el inventario del local, que es SUYO y no sale
                  a ningún lado) y *«vender productos a través de
                  e-PetPlace»* (el catálogo y el inventario que ve el
                  cliente — la despensa que ya existe). **El catálogo los
                  debe diferenciar: uno es inventario local, el otro es la
                  vitrina.** Son dos baldosas porque son dos elecciones, no
                  dos vistas de la misma cosa. */}
              {tienda === 'activa' && (
                <View style={ESTILO_GRILLA}>
                  {/* 🔴 S99-C · LA PUERTA NO SE OFRECE AL VENDEDOR PURO
                      (adjudicación de mesa, 15-ago). Para quien NO tiene
                      negocio de servicios, `/ventas` es **la misma ventana
                      de pedidos que su HOY ya le muestra** — la caminata en
                      aparato lo hizo visible: dos pantallas, el mismo
                      pedido, el mismo «0 de 15 entregas hoy», dos títulos.
                      Su entrada es LA TAB, y su HOY ya lleva las cuatro
                      celdas del módulo desde este mismo lote.

                      Para el prestador que ADEMÁS vende, la baldosa
                      SE QUEDA y es su única entrada: su HOY es la jornada
                      de citas, no el panel. Por eso el gate es
                      `!sinPrestador` y no un apagado a secas — *cerrarla
                      para todos habría dejado sin panel justo a quien no
                      tiene otro camino.* */}
                  {!sinPrestador && (
                    <View style={ESTILO_CELDA}>
                      <Baldosa
                        /* Grilla de TRES (ESTILO_CELDA = 33.333%), como su hermana de arriba. */
                        columnas={3}
                        glifo="despensa"
                        capa="consumo"
                        titulo={t('negocio.tiendaVitrina')}
                        detalle={t('negocio.tiendaVitrinaDetalle')}
                        orden={0}
                        onPress={() => router.push('/ventas')}
                      />
                    </View>
                  )}
                  <View style={ESTILO_CELDA}>
                    {/* 🔴 EXCEPCIÓN DELIBERADA A LA LEY 23 («la puerta no
                        ofrece lo que va a rechazar»), **firmada por el
                        founder y no un default**: *«la vista local es V2,
                        pero se muestra — si alguien lo marca, modal
                        informando que saldrá en V2»*.
                        Acá la puerta **anuncia lo que viene** en vez de
                        callarlo. La razón que la sostiene: el inventario
                        local es la mitad que el vendedor ESPERA encontrar,
                        y no verla se lee como que el producto no la piensa.
                        *Una promesa fechada informa; una ausencia, no.*
                        ⚠️ El glifo `negocio` es STAND-IN declarado — no hay
                        glifo de inventario en el registry, y pedir uno se
                        firma (L-175), no se improvisa. */}
                    <Baldosa
                      /* Grilla de TRES (ESTILO_CELDA = 33.333%), como su hermana de arriba. */
                      columnas={3}
                      glifo="negocio"
                      capa="consumo"
                      titulo={t('negocio.tiendaLocal')}
                      detalle={t('negocio.tiendaLocalDetalle')}
                      orden={1}
                      onPress={() => setHojaV2(true)}
                    />
                  </View>
                </View>
              )}

              {/* PEDIDA Y NO APROBADA: no hay nada que elegir, así que NO
                  es baldosa — es información, y la información se LEE
                  (Acto II). La voz se reusa del wizard: misma frase, un
                  solo lugar, porque lo que se copia diverge. */}
              {tienda === 'solicitada' && (
                <Tarjeta elevacion="reposo">
                  <View style={{ gap: spacing[2] }}>
                    <Insignia estado="info" etiqueta={t('alta.estado.enRevision')} tamaño="sm" />
                    <Texto variante="apoyo">{t('alta.paso2.tiendaPropuesta')}</Texto>
                  </View>
                </Tarjeta>
              )}

              {/* LA PUERTA DE CRECIMIENTO. El botón **navega**, no pide:
                  el único productor de la solicitud sigue siendo el paso ②
                  del wizard. La voz y el CTA se reusan de allá por lo
                  mismo — si el día de mañana cambia la promesa, cambia en
                  un lugar. */}
              {tienda === 'ninguna' && (
                <Tarjeta elevacion="reposo">
                  <View style={{ gap: spacing[4] }}>
                    <Texto variante="cuerpo">{t('alta.paso2.tiendaVoz')}</Texto>
                    <Boton
                      variante="primario"
                      bloque
                      etiqueta={t('alta.paso2.tiendaCta')}
                      onPress={() =>
                        router.push({
                          pathname: '/verificacion/alta',
                          params: { paso: 'oferta' },
                        })
                      }
                    />
                  </View>
                </Tarjeta>
              )}
            </View>
          )}

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
              {/* ☠️ S98-C · MURIÓ EL `<Separador />` QUE ABRÍA ESTA TARJETA:
                  era el residuo de la celda de arriba —separaba de algo que
                  ya no está—, así que dibujaba una línea sobre la nada.
                  Ley 37 en su forma más chica: retirar una celda es
                  retirar TAMBIÉN lo que la separaba. */}
              {/* S55-B (B1): la vista completa existe — la celda navega;
                  el peldaño 0 de la pantalla educa cuando el ledger está vacío */}
              <CeldaNavegacion
                icono="pagos"
                registro="aa"
                titulo={t('negocio.liquidaciones')}
                detalle={detalleLiquidaciones}
                onPress={() => router.push('/liquidaciones')}
              />
              {/* ⭐ S98-C · «TU FACTURACIÓN» LLEGA A SU CASA (firma del
                  founder: *«deben ir donde corresponde, no es de acá»*).
                  Vivía en la configuración de VENTAS, entre turnos y
                  repartidores. **La facturación es del NEGOCIO, no del
                  canal de venta** — su vecino natural son las
                  liquidaciones, que es la otra cara de la misma plata.
                  ⚠️ Y hereda el gate de este tab (`useGateGestor`), que es
                  MÁS angosto que el de su casa vieja: allá alcanzaba con
                  operar la cuenta comercial. *Una mudanza que ensancha la
                  audiencia de una pantalla de plata no es una mudanza: es
                  un permiso nuevo sin firma.* */}
              {vendeProductos && (
                <>
                  <Separador />
                  <CeldaNavegacion
                    icono="fiscal"
                    registro="aa"
                    titulo={t('ventas.config.facturacionVistaTitulo')}
                    detalle={t('ventas.config.facturacionVistaDetalle')}
                    onPress={() => router.push('/ventas/facturacion')}
                  />
                </>
              )}
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

              ✅ **S106-C · VUELVE UNA SEÑAL, Y NO ES LA PUERTA QUE SE FUE**
              (firma del founder, 27-ago). El founder buscó su equipo acá
              —donde el nombre lo lleva— y **no encontró ni siquiera un
              puntero**: *que una pantalla no se pueda hallar donde su nombre
              promete es un defecto propio, aparte de dónde viva.*

              🔴 **LA DIFERENCIA ENTRE PUNTERO Y COPIA, escrita para que
              nadie la borre con el tiempo:** *una copia se llama IGUAL que su
              destino y no dice de dónde es — con los meses las dos se
              editan por separado y envejecen distinto, que es exactamente lo
              que la mudanza de S86 vino a evitar.* **Un puntero NOMBRA EL
              LUGAR**: su texto dice «se gestiona desde Datos», así que **no
              puede convertirse en la pantalla de equipo de este tab** — el
              día que alguien le agregue función acá, el texto lo delata.

              ⇒ Se conserva: **una sola pantalla, un solo dueño de
              contenido**, y este tab sólo sabe **dónde está**.

              ⚠️ **Y NO se toca la audiencia:** hereda el gate de este tab
              (`useGateGestor`), que es MÁS ANGOSTO que el de Datos — el
              puntero no puede ensanchar lo que S85-C32 midió.

              ⏪ La lápida original sigue abajo: lo que sigue vencido es la
              PUERTA, no esta señal. */}
          <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}>
            <Tarjeta relleno="ninguno" elevacion="reposo">
              <CeldaNavegacion
                icono="equipo"
                registro="aa"
                titulo={t('negocio.equipoPuntero')}
                detalle={t('negocio.equipoPunteroDetalle')}
                onPress={() => router.push('/negocio/equipo')}
              />
            </Tarjeta>
          </View>

          {/* ☠️ (la lápida de S86-C, conservada)
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

          {/* ☠️ S98-C · ACÁ VIVÍA LA `TarjetaVentas` DE S96, y SE MUDÓ a la
              sección «Tu tienda» de arriba (firma del founder: las dos
              categorías, con sus nombres). **Se retira en el mismo commit
              que la construye allá** — una mudanza que deja el origen
              puesto es una COPIA, y dos puertas a `/ventas` en la misma
              pantalla envejecen distinto.
              ⏪ Su nota decía «sin encabezado de sección: una sección de un
              solo habitante es rótulo decorativo (Ley 18)». Eso era cierto
              cuando el rótulo no existía; hoy el nombre «Tu tienda» **está
              firmado** y no es decoración: es el candado del cinturón.
              ⚠️ `TarjetaVentas` NO muere — conserva sus otros dos
              consumidores (el muro del no-titular vendedor de esta misma
              pantalla, y el HOY del no-gestor). */}
        </View>
      </ScrollView>

      {/* ⭐ S98-C · LA HOJA DE LA EXCEPCIÓN FIRMADA (①(iii) del founder).
          Va FUERA del ScrollView: una Hoja no es contenido de la pantalla
          — se levanta sobre ella y la deja debajo, a la vista.
          **Dice QUÉ llega y CUÁNDO**, y no promete una fecha que no
          tenemos: «la próxima versión» es lo que sabemos. *Un «muy pronto»
          sin sujeto es humo; con sujeto es una hoja de ruta.* */}
      <Hoja visible={hojaV2} onCerrar={() => setHojaV2(false)} titulo={t('negocio.tiendaV2Titulo')}>
        <View style={{ gap: spacing[4] }}>
          <Texto variante="cuerpo">{t('negocio.tiendaV2Voz')}</Texto>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('negocio.tiendaV2Cerrar')}
            onPress={() => setHojaV2(false)}
          />
        </View>
      </Hoja>

      {/* ☠️ S98-C · MURIÓ EL BARRIDO DE LA PUERTA A VENTAS (firma del
          founder): *«quedó un efecto de una línea marrón o café cuando le
          doy clic… simplemente quitala, con la transición estamos bien»*.
          El porqué medido —y la hipótesis que descarté, que era el canto
          de la baldosa y habría chocado con la Ley 10— está entero en la
          lápida gemela del HOY. **El canto en reposo queda.**
          ⏪ Su nota decía que `onFin` llegaba SIEMPRE «para que la
          navegación no se cuelgue»: era cierto y ya no hace falta —
          sin barrido, la navegación no depende de ninguna animación. */}
      {/* S59-B1: el velo de tinta — la zona de la barra de estado JAMÁS
          queda blanca, ni cuando el techo scrollea (regla del pedido). */}
      <VeloBarraEstadoOficio />
    </View>
  );
}

/* ☠️ S96-C: `TarjetaVentas` vivía acá y SE MUDÓ a
   `@/components/tarjeta-ventas` al ganar su tercer consumidor (el HOY del
   no-gestor, §0bis) — una mudanza que deja el origen puesto es una copia. */
