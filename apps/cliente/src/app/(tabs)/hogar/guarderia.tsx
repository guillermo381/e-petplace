/**
 * EL LOG DE GUARDERÍA — el hub, en el lugar que la casa le da (S107-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **ESTA PANTALLA NO EXISTÍA, Y ÉSA ERA LA MITAD QUE FALTABA.** Acá vivía
 * el buscador —el FLUJO puesto donde va el historial—, y por eso guardería
 * «no se parecía a sus hermanas». El flujo se mudó a `/explorar/guarderia/`;
 * este lugar recupera su papel: **dónde la familia ve sus estadías.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **El esqueleto es el de sus cuatro hermanas, censado y firmado:**
 * `Encabezado navegacion` → `FiltroMascotas` → `FiltroPills` (próximos /
 * historial) → filas → **CTA al pie** hacia el flujo.
 *
 * ── ⚠️ MITAD INERTE DECLARADA (molde S91) ────────────────────────────────
 * 🔴 **La lista NO se puede llenar todavía: no existe el lector.** Medido —
 * `obtenerEstadiasDelDia` es **del prestador y por día**, y **filtra los holds
 * a propósito**; la familia necesita lo contrario (ver su reserva **sin
 * pagar**, que es la que tiene que ir a pagar). Pedido autocontenido a A en
 * `docs/loop/S107-C-PEDIDO-A-A-LOG-FAMILIA.md`.
 *
 * **Lo que sí está y no es relleno:** el camino al flujo con la mascota
 * elegida, y un vacío que **dice la verdad** en vez de fingir que no hay
 * estadías. *Un «todavía no tienes estadías» sobre un lector que no existe
 * sería la pantalla mintiendo con cara de dato.*
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FiltroMascotas,
  Icono,
  CeldaNavegacion,
  FilaCita,
  Insignia,
  FiltroPills,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  obtenerMisEstadiasGuarderia,
  obtenerMisPaquetesGuarderia,
  obtenerMisPlanesGuarderia,
  reservarDiaDePaqueteGuarderia,
  resolverUrlsFotos,
  type EstadiaDeMiMascota,
  type PaqueteCompradoGuarderia,
  type PlanGuarderia,
} from '@epetplace/api';
import { fechaCortaMono, obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

/* ☠️ ACÁ VIVÍA `LISTA_DISPONIBLE = false`, y murió el 29-ago: **A publicó
   `obtenerMisEstadiasGuarderia`** y el enchufe se conectó. *La constante existía
   para que el día del lector fuera una línea — y lo fue.* (Ley 37: el andamio
   se retira en el mismo acto que su razón.) */

type Estadias =
  | { fase: 'cargando' }
  | { fase: 'error' }
  /** 🔴 Nadie preguntó todavía — **no es lo mismo que «no hay»**. */
  | { fase: 'sinSujeto' }
  | { fase: 'listo'; lista: EstadiaDeMiMascota[] };

type Mascotas =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; lista: Array<{ id: string; nombre: string; fotoUrl?: string }> };

/** 'mm:ss' de lo que falta, en voz de máquina. Nunca negativo. */
function restanteMmSs(iso: string): string {
  const s = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function LogGuarderia() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const especies = useEspeciesElegibles('hospedaje');

  const [mascotas, setMascotas] = useState<Mascotas>({ fase: 'cargando' });
  const [elegida, setElegida] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const e = await getEstadoOnboardingDueno();
      if (!vigente) return;
      if (!e.ok || e.data.familia_id === null) {
        setMascotas({ fase: 'error' });
        return;
      }
      const r = await obtenerMascotasDeFamilia(e.data.familia_id);
      if (!vigente) return;
      if (!r.ok) {
        setMascotas({ fase: 'error' });
        return;
      }
      /* Las TRES fases de la elegibilidad, honradas (L-218 · R34): `ofrecibles`
         devuelve [] cargando, con error y de verdad vacío. */
      if (especies.fase === 'cargando') return;
      if (especies.fase === 'error') {
        setMascotas({ fase: 'error' });
        return;
      }
      const elegibles = ofrecibles(r.data, especies);
      /* 🔴 LAS FOTOS SE FIRMAN ANTES DE PINTARLAS. El bucket `mascotas` es
         PRIVADO desde S92-BIS: `foto_url` es un PATH, no una URL, y sin firmar
         no carga. `resolverUrlsFotos` las firma POR LOTE (una sola llamada). */
      const paths = elegibles
        .map((m) => m.foto_url)
        .filter((x): x is string => typeof x === 'string' && x.length > 0);
      const urls = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
      if (!vigente) return;
      setMascotas({
        fase: 'listo',
        lista: elegibles.map((m) => ({
          id: m.id,
          nombre: m.nombre,
          fotoUrl: caraDeMascotaPorRuta({
            especie: m.especie,
            /* ⏪ ACÁ ESTABA LA MITAD MÁS SILENCIOSA DEL DEFECTO: este parámetro
               recibía `m.foto_url`. `rutaImagen` es la ILUSTRACIÓN del catálogo
               (`cat_razas.ruta_imagen`, bucket PÚBLICO `especies`) — pasarle el
               path de la foto privada lo mandaba a resolver contra un bucket
               donde ese objeto no existe. *No fallaba: devolvía una URL que
               no carga, que es un 404 con forma de dato.* */
            rutaImagen: m.raza_ruta_imagen,
            /* ⏪ Y ÉSTA ERA LA MITAD VISIBLE: el escalón 0 —la foto real de la
               familia— **no se pasaba**, así que la escalera nunca podía
               llegar a ella. Las cuatro hermanas sí lo pasan. */
            fotoUri: m.foto_url ? urls.get(m.foto_url) : undefined,
          }),
        })),
      });
      if (elegibles.length === 1) setElegida(elegibles[0].id);
    })();
    return () => {
      vigente = false;
    };
  }, [especies.fase, intento]);

  const [pestana, setPestana] = useState<'proximas' | 'historial'>('proximas');
  const [estadias, setEstadias] = useState<Estadias>({ fase: 'cargando' });
  const [abierta, setAbierta] = useState<string | null>(null);
  const [paquetes, setPaquetes] = useState<PaqueteCompradoGuarderia[]>([]);
  /**
   * ⭐ **EL PLAN CONTRATADO VIVE ACÁ**, como el saldo del paquete.
   * Sin esto, la familia firmaba una mensualidad y **no la veía en ningún
   * lado** — *un compromiso que se cobra todos los meses y no aparece en
   * ninguna pantalla es un cobro que la familia va a descubrir en su tarjeta.*
   */
  const [planes, setPlanes] = useState<PlanGuarderia[]>([]);

  /**
   * ⏪ **UN BOTÓN POR LUGAR, NO POR BONO.** El founder vio **CUATRO** botones
   * «Reservar estadía de tu paquete» —tres con 5 de 5 y uno con 4 de 5— porque
   * esta lista pintaba `paquetes.map(...)`, y el hogar tenía cuatro bonos
   * vivos de la MISMA guardería. *La familia no compró cuatro cosas: compró
   * saldo cuatro veces en el mismo lugar.*
   *
   * **Letra firmada:** *«se suman o se muestra el que corresponde — pero es UN
   * botón»*. Se suman.
   *
   * 🔴 **El bono que viaja es el que VENCE PRIMERO**, no uno cualquiera: es la
   * regla FIFO de la casa para bonos. *Consumir el más nuevo dejaría vencer el
   * viejo con saldo adentro — plata de la familia perdida por un orden de
   * lista.*
   *
   * ⚠️ **Con dos guarderías distintas siguen siendo dos botones, y es
   * correcto:** son dos lugares, y el camino corto va «a la tira de días DE
   * ESA guardería». *Un botón que sumara saldos de lugares distintos no sabría
   * a cuál llevar.*
   */
  const paquetesPorLugar = useMemo(() => {
    const porLugar = new Map<string, { prestadorId: string; bonoId: string; quedan: number; total: number; vence: string | null }>();
    for (const p of paquetes) {
      /* 🔴 **S108-C · EL SALDO QUE SE PUEDE GASTAR ES EL PAGADO, y esto era una
         rotura viva.** Desde que el bono nace `pendiente` y cayó el filtro del
         lector, un paquete **no pagado** entraba acá con su saldo y su botón
         «Reservar estadía de tu paquete». *Ofrecerle a la familia gastar días
         que todavía no compró es peor que esconderlos: la manda a un rebote con
         la plata ya en la cabeza.* Y la cadena empeoraba sola — una compra
         cuyo cobro no entró dejaba saldo invitando a gastarse. */
      if (p.estadoPago !== 'pagado' || p.estado !== 'activo') continue;
      if (p.quedan <= 0) continue;
      const y = porLugar.get(p.prestadorId);
      if (y === undefined) {
        porLugar.set(p.prestadorId, {
          prestadorId: p.prestadorId, bonoId: p.bonoId,
          quedan: p.quedan, total: p.total, vence: p.venceEl ?? null,
        });
        continue;
      }
      y.quedan += p.quedan;
      y.total += p.total;
      /* FIFO: gana el que vence antes. Sin fecha, se conserva el que estaba
         —no se adelanta a uno cuyo vencimiento no conocemos—. */
      const nuevoVence = p.venceEl ?? null;
      if (nuevoVence !== null && (y.vence === null || nuevoVence < y.vence)) {
        y.vence = nuevoVence; y.bonoId = p.bonoId;
      }
    }
    return [...porLugar.values()];
  }, [paquetes]);

  /**
   * ⭐ **LOS PAQUETES QUE NO ESTÁN LISTOS — y que HABLAN (S108-C · T4).**
   *
   * 🔴 *Un paquete que sólo desaparece de una lista es el guard mudo que la
   * casa prohíbe, y acá tiene dos caras:* el que **falta pagar** —que se puede
   * completar— y el que **no se pagó a tiempo** —que ya no existe y hay que
   * volver a comprar—. **Los dos son plata que la familia intentó gastar**, y
   * ninguno de los dos puede quedar sin decirse.
   *
   * `noPagadoATiempo` lo distingue de un reverso: *«nunca llegaste a pagar» y
   * «te devolvimos la plata» son dos finales que se viven distinto*, y S108-A
   * les dio valores separados justo para que acá no se cuenten con la misma
   * frase.
   */
  /**
   * ⭐ **S109-C · EXPIRACIÓN PEREZOSA EN LA SUPERFICIE.** `expirar_bonos_sin_pago`
   * corre **cada minuto**, así que hay una ventana de hasta 60 s en la que el
   * bono **ya venció** y su fila todavía diría «toca para completar el pago» —
   * *un camino que el motor va a rebotar, ofrecido por una pantalla que tenía la
   * fecha en la mano.* Con `pagoExpiraEn` no se espera al reloj: **el que ya
   * pasó su hora se cuenta como vencido**, exactamente como los holds de cita.
   *
   * `tick` sólo existe para que esto se re-evalúe mientras la pantalla está
   * abierta: sin él, alguien mirando la lista cuando vence no ve nada cambiar.
   */
  const [tick, setTick] = useState(0);
  const hayPendienteConReloj = paquetes.some(
    (p) => p.estadoPago === 'pendiente' && !p.noPagadoATiempo && p.pagoExpiraEn !== null,
  );
  useEffect(() => {
    if (!hayPendienteConReloj) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [hayPendienteConReloj]);

  const paquetesPendientes = useMemo(
    () =>
      paquetes.filter(
        (p) =>
          p.estadoPago === 'pendiente' &&
          !p.noPagadoATiempo &&
          !(p.pagoExpiraEn !== null && new Date(p.pagoExpiraEn).getTime() <= Date.now()),
      ),
    /* `tick` es dependencia REAL: es lo que mueve una fila de un grupo al otro
       cuando el reloj pasa mientras la familia mira. */
    [paquetes, tick],
  );
  const paquetesNoPagados = useMemo(
    () =>
      paquetes.filter(
        (p) =>
          p.noPagadoATiempo ||
          (p.estadoPago === 'pendiente' &&
            p.pagoExpiraEn !== null &&
            new Date(p.pagoExpiraEn).getTime() <= Date.now()),
      ),
    [paquetes, tick],
  );

  /* ⭐ EL SALDO DEL PAQUETE — A publicó su lector (`768f8d86`) y con él nace el
     botón que el founder pidió hace varias tandas. **Sólo los VIGENTES**: un
     bono agotado o vencido no es un paquete con cero, es uno que ya no está, y
     mostrarlo en cero invita a tocarlo. */
  useEffect(() => {
    let vigente = true;
    void (async () => {
      /* Misma ola: el peaje es de la PETICIÓN, no del volumen (L-223). */
      const [r, pl] = await Promise.all([obtenerMisPaquetesGuarderia(), obtenerMisPlanesGuarderia()]);
      if (!vigente) return;
      /* ⭐ **S108-C · YA NO SE FILTRA ACÁ.** El lector devuelve todos los
         estados a propósito (S108-A), y **quién se muestra y cómo lo decide la
         superficie, abajo**. *Filtrar en el fetch fue lo que volvió invisible
         al paquete pendiente de pago el día que el bono dejó de nacer pagado.* */
      setPaquetes(r.ok ? r.data : []);
      setPlanes(pl.ok ? pl.data.filter((p) => p.estado === 'activa') : []);
    })();
    return () => { vigente = false; };
  }, [intento]);
  const idioma = obtenerIdiomaActual();

  /* 🔴 SE PIDE POR MASCOTA. El lector acepta `mascotaId?` y filtra del lado del
     server — *filtrar acá una lista que el server sabe filtrar es traerse de
     más para tirar la mitad.* */
  useEffect(() => {
    /* ⏪ ACÁ DECÍA `{ fase: 'listo', lista: [] }`, y era **la misma clase de
       defecto que esta pista anotó ayer**: con ninguna mascota elegida la
       pantalla pintaba *«Sin estadías agendadas»* — **una afirmación sobre algo
       que nadie preguntó**. Cazado con sesión real y tres mascotas: el vacío
       de la firma salía antes de que hubiera sujeto.
       *Cada mitad era correcta —el vacío dice bien lo suyo, el filtro también—
       y el defecto nacía de mostrarlas juntas.* */
    if (elegida === null) { setEstadias({ fase: 'sinSujeto' }); return; }
    let vigente = true;
    setEstadias({ fase: 'cargando' });
    void (async () => {
      const r = await obtenerMisEstadiasGuarderia({ mascotaId: elegida });
      if (!vigente) return;
      /* Un fallo JAMÁS se disfraza de «no tienes estadías» (Ley 13). */
      setEstadias(r.ok ? { fase: 'listo', lista: r.data } : { fase: 'error' });
    })();
    return () => { vigente = false; };
  }, [elegida, intento]);

  const alAtras = useCallback(() => router.back(), []);
  const mascota =
    mascotas.fase === 'listo' ? (mascotas.lista.find((m) => m.id === elegida) ?? null) : null;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('logGuarderia.titulo')} atras onAtras={alAtras} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: insets.bottom + spacing[8] }}>
        {mascotas.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={56} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        ) : mascotas.fase === 'error' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('logGuarderia.noCargoTitulo')}
            descripcion={t('logGuarderia.noCargoDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('hogar.reintentar')}
                onPress={() => setIntento((n) => n + 1)}
              />
            }
          />
        ) : (
          <>
            {mascotas.lista.length > 1 ? (
              <View style={{ marginHorizontal: -spacing[5] }}>
                <FiltroMascotas mascotas={mascotas.lista} elegida={elegida} onElegir={setElegida} />
              </View>
            ) : null}

            {/* ═══ 🔴 DOS BLOQUES CONSTRUIDOS E INERTES — su causa la manda
                    el SERVER, y por eso no se deducen acá ═══════════════════

                ① **ESPECIE SIN OFERTA** (hoy: gato). Firma del founder:
                *«Todavía no tenemos guarderías para gatos. Estamos trabajando
                en eso»* — **y es distinto de «no tienes estadías»: una es una
                carencia NUESTRA, la otra un estado suyo.**
                🔴 **No se deduce de una lista vacía.** Hoy no hay forma de
                distinguirlas: el catálogo dice que el gato es elegible y quien
                sabe que nadie lo recibe es el filtro de ofertas. *Deducirlo
                sería inventar un diagnóstico a partir de un silencio.*
                ⇒ llega con `especie_sin_oferta` del resumen de A.

                ② **PAQUETE CON SALDO** — botón «Reservar estadía de tu
                paquete» + «7 de 10 disponibles», directo al selector de fecha
                de ESA guardería (sin elegir lugar ni pagar: las dos ya están
                hechas).
                ⏪ **ESTABA VENCIDO Y DECÍA LO CONTRARIO DE LO QUE PASA:**
                *«no existe lector de saldo… y tampoco existe la compra que lo
                crearía»*. **Los dos existen** —`obtenerMisPaquetesGuarderia`
                y `comprarPaqueteGuarderia`— y esta pantalla ya los monta,
                acá abajo. *Un comentario que sobrevive a su propia carencia
                manda a la próxima pista a construir algo que ya está.*
                ═════════════════════════════════════════════════════════════ */}

            {/* LOS CHIPS DE LA LISTA — la estructura de las cuatro hermanas.
                Se montan ya: **son navegación, no dato**, y el día que la
                lista llegue no hay que reacomodar la pantalla. */}
            {/* ⭐ **EL PAQUETE CON SALDO — arriba de las pestañas** (firma del
                founder). *Es una acción, y las pestañas son un filtro: una
                acción debajo de un filtro parece filtrada por él.*

                🔴 **Y va DEBAJO de los chips de mascota, no encima, por una
                razón de motor:** con más de una mascota elegible
                `reservar_dia_de_paquete_guarderia` **rebota
                `mascota_no_determinada`** — *el bono es del hogar y a cuál
                animal se le agenda el martes lo decide la familia cada vez.*
                Los chips ya están arriba; poner el botón encima lo dejaría
                **sin sujeto**, y tendría que preguntar la mascota de nuevo en
                una Hoja propia. **Se declaró a la mesa y así quedó.** */}
            {/* ── EL PLAN MENSUAL CONTRATADO ─────────────────────────────
                ⏪ **Decía: «Informa, NO navega: no hay pantalla de plan y un
                chevron prometería una que no existe (Ley 19.7)».** La condición
                que ese comentario ponía **se cumplió**: S108-C construyó
                `/cuenta/recurrentes`, y con ella el chevron deja de prometer
                nada. *Una fila que se hunde sin llevar a ningún lado es una
                promesa rota — pero una que no se hunde teniendo a dónde ir es
                una puerta escondida*, y ésta es la puerta por la que la familia
                corta un cobro que se repite.

                🔴 Y la cancelación vive en UN SOLO LUGAR, no acá: *un
                interruptor de plata repartido por las pantallas donde cada cosa
                se contrató es un interruptor que no se encuentra el día que se
                necesita.* Esta fila LLEVA; no decide.

                Va ARRIBA del paquete porque es el compromiso que se cobra solo
                todos los meses: lo que se renueva sin que nadie lo toque tiene
                que verse antes que lo que se gasta a pulso. ── */}
            {planes.map((pl) => (
              <Tarjeta key={pl.suscripcionId} relleno="ninguno">
                <CeldaNavegacion
                  icono="mes"
                  titulo={t('logGuarderia.planTitulo')}
                  /* `CeldaNavegacion` no tiene subtítulo: el lugar y el precio
                     van juntos en el detalle, que es voz de la pantalla. */
                  detalle={`${pl.prestadorNombre} · ${t('logGuarderia.planDetalle', { precio: pl.precioMensual.toFixed(2) })}`}
                  onPress={() => router.push('/cuenta/recurrentes')}
                />
              </Tarjeta>
            ))}

            {paquetesPorLugar.map((pq) => (
              /* ⏪ **ERA UN `Boton` PRIMARIO Y COMPETÍA CON EL PIE.** Dos
                 amarillos peleando en la misma pantalla: *cuando todo grita,
                 nada dirige.* Firma del founder: **fondo blanco con chevron**
                 — la anatomía de FILA, que dice «hay un camino acá» sin
                 robarle el CTA al pie.

                 🔴 Es `CeldaNavegacion`, la fila canónica de la casa (Ley
                 19.7: el contorno transparente muere como acción de fila; por
                 superficie UN sólido, y el sólido es el del pie). El saldo va
                 en `detalle`, que es su lugar — no una línea suelta debajo. */
              <Tarjeta key={pq.bonoId} relleno="ninguno">
                <CeldaNavegacion
                  /* ⭐ **S108-C · LA REANUDACIÓN, y es la misma fila con otra
                     voz.** Firma del founder: *si cierro la app entre el cobro y
                     el agendamiento, al volver me recibe ahí.*

                     Un paquete pagado **sin una sola estadía usada** es
                     exactamente ese caso: la compra salió, el primer día no se
                     llegó a elegir. *Con la voz genérica de saldo, la familia
                     volvía a una lista que no le decía que le faltaba algo —
                     un paquete pagado sin primer día no puede quedar mudo.*

                     🔴 Y **no hace falta una pantalla nueva ni un estado
                     guardado**: el hecho vive en el dato (`quedan === total`),
                     así que la reanudación es cierta aunque la app se haya
                     matado, aunque se cambie de teléfono, y sin nada que
                     limpiar después. *Un flujo que se retoma leyendo el mundo
                     no se puede desincronizar del mundo.* */
                  titulo={
                    pq.quedan === pq.total
                      ? t('logGuarderia.paqueteListoPrimerDia')
                      : t('logGuarderia.reservarDePaquete')
                  }
                  detalle={
                    pq.quedan === pq.total
                      ? t('logGuarderia.paqueteListoPrimerDiaDetalle', { n: pq.total })
                      : pq.quedan === 1
                        ? t('logGuarderia.saldoUna', { total: pq.total })
                        : t('logGuarderia.saldo', { n: pq.quedan, total: pq.total })
                  }
                  onPress={() => {
                    if (elegida === null) return;
                    router.push({
                      pathname: '/explorar/guarderia',
                      params: {
                        prestadorId: pq.prestadorId,
                        mascotaId: elegida,
                        ...(mascota !== null ? { mascotaNombre: mascota.nombre } : {}),
                        modalidad: 'paquete',
                        bonoId: pq.bonoId,
                      },
                    });
                  }}
                />
              </Tarjeta>
            ))}

            {/* ═══ ⭐ LOS QUE NO ESTÁN LISTOS, Y LO DICEN (S108-C · paso 1 + T4)
                🔴 **Van DESPUÉS del saldo usable y ANTES del historial**: son
                acciones pendientes, no archivo. *Un pendiente al fondo de una
                lista es un pendiente que nadie ve.* ══════════════════════ */}
            {paquetesPendientes.map((pq) => (
              <Tarjeta key={pq.bonoId} relleno="ninguno">
                <CeldaNavegacion
                  icono="pagos"
                  titulo={t('logGuarderia.paqueteFaltaPagar')}
                  /* El saldo se nombra igual —**la familia compró esos días**, lo
                     que falta es el cobro— y ahora **con el tiempo que le
                     queda**: *un pendiente sin su reloj es un pendiente que se
                     vence mientras alguien lo mira.* Sin ventana declarada no se
                     inventa una cuenta regresiva. */
                  detalle={
                    pq.pagoExpiraEn === null
                      ? t('logGuarderia.paqueteFaltaPagarDetalle', { n: pq.total })
                      : t('logGuarderia.paqueteFaltaPagarConReloj', {
                          n: pq.total,
                          tiempo: restanteMmSs(pq.pagoExpiraEn),
                        })
                  }
                  onPress={() =>
                    router.push({
                      pathname: '/explorar/guarderia/checkout',
                      params: {
                        modalidad: 'paquete',
                        bonoId: pq.bonoId,
                        prestadorId: pq.prestadorId,
                        ...(elegida !== null ? { mascotaId: elegida } : {}),
                        ...(mascota !== null ? { mascotaNombre: mascota.nombre } : {}),
                      },
                    })
                  }
                />
              </Tarjeta>
            ))}

            {/* ⭐ **T4 · EL VENCIDO HABLA Y OFRECE VOLVER A COMPRARLO.**
                *Un vencimiento que sólo desaparece de una lista deja a la
                familia sin saber qué pasó con algo que ella tocó.* */}
            {paquetesNoPagados.map((pq) => (
              <Tarjeta key={pq.bonoId} relleno="ninguno">
                <CeldaNavegacion
                  icono="guarderia"
                  titulo={t('logGuarderia.paqueteNoPagadoATiempo')}
                  detalle={t('logGuarderia.paqueteNoPagadoATiempoDetalle')}
                  onPress={() =>
                    router.push({
                      pathname: '/explorar/guarderia',
                      params: {
                        prestadorId: pq.prestadorId,
                        ...(elegida !== null ? { mascotaId: elegida } : {}),
                        ...(mascota !== null ? { mascotaNombre: mascota.nombre } : {}),
                        modalidad: 'paquete',
                      },
                    })
                  }
                />
              </Tarjeta>
            ))}

            {/* Las etiquetas son las MISMAS keys que sus hermanas (`plan.seg*`)
                — *dos cadenas nuevas que dijeran lo mismo son dos lugares donde
                la voz puede divergir.* */}
            <FiltroPills
              activo={pestana}
              onCambio={(c) => setPestana(c)}
              opciones={[
                { codigo: 'proximas' as const, etiqueta: t('plan.segProximos'), icono: 'hoy', capa: null },
                { codigo: 'historial' as const, etiqueta: t('plan.segHistorial'), icono: 'guarderia', capa: null },
              ]}
            />

            {/* 🔴 DOS VACÍOS DISTINTOS, Y LA DIFERENCIA NO ES DE ESTILO.

                · **«Sin estadías agendadas»** (firma del founder) es la verdad
                  cuando el lector respondió y no había ninguna.
                · **«Todavía no podemos mostrarte»** es la verdad HOY: el lector
                  **no existe**, así que no sabemos si hay o no.

                *Decir el primero sobre un lector que no existe sería mentir con
                cara de dato — y el día que el lector llegue, nadie sabría que la
                pantalla estuvo mintiendo.* **El de la firma está construido y se
                enciende solo** cuando `cargarEstadias` devuelva una lista. */}
            {/* LA LISTA — el vacío de la firma del founder ya es el que se
                pinta: **el lector existe, así que decir «sin estadías» ES la
                verdad.** *El vacío honesto de «todavía no podemos mostrarte»
                murió con su razón.* */}
            {estadias.fase === 'cargando' ? (
              <EsqueletoGrupo>
                <Esqueleto alto={64} />
                <Esqueleto alto={64} />
              </EsqueletoGrupo>
            ) : estadias.fase === 'error' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('logGuarderia.estadiasNoCargoTitulo')}
                descripcion={t('logGuarderia.estadiasNoCargoDetalle')}
                accion={
                  <Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setIntento((n) => n + 1)} />
                }
              />
            ) : estadias.fase === 'sinSujeto' ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('logGuarderia.elegiMascotaTitulo')}
                descripcion={t('logGuarderia.elegiMascotaDetalle')}
              />
            ) : (() => {
              /* 🔴 `esProxima` LO DECIDE EL SERVER — la pantalla no compara
                 fechas. *Si se compararan en dos superficies podrían discrepar
                 sobre qué es «hoy», y una familia vería su estadía del lado
                 equivocado.* */
              const visibles = estadias.lista.filter((e) =>
                pestana === 'proximas' ? e.esProxima : !e.esProxima,
              );
              if (visibles.length === 0) {
                return (
                  <EstadoVacio
                    registro="seccion"
                    icono={<Icono nombre="guarderia" tamano={48} />}
                    titulo={t('logGuarderia.vacioTitulo')}
                    descripcion={t('logGuarderia.vacioDetalle')}
                  />
                );
              }
              return visibles.map((e) => (
                /* ⭐ `FilaCita`, LA PIEZA DE SUS CUATRO HERMANAS.
                   ⏪ **Acá vivía una `Celda`** porque medí que `FilaCitaOficio`
                   no conocía guardería. **B lo resolvió y mi dato quedó
                   vencido** — y no era hueco de datos: `metadataMono` nunca
                   exigió una hora, así que **no nació ninguna prop**; sólo
                   faltaba el oficio en el vocabulario cerrado.

                   🔴 **LA FILA DESPLIEGA, NO NAVEGA.** `onPress` y `direccion`
                   son obligatorios, y una estadía sin `estadiaId` **no tiene a
                   dónde llevar**: la cita se compró y el prestador todavía no
                   la ejecutó. *Un chevron que promete una pantalla vacía es
                   justo lo que 19.7 vino a matar.* ⇒ despliega, y la acción de
                   entrar al durante vive adentro, sólo cuando existe.

                   ⚠️ **LAS DOS VENTANAS NO VAN ACÁ — límite declarado por B:**
                   *no son metadata, son contenido, y su lugar es el despliegue
                   con `FichaFranja`.* **Y el log no las necesita**: la familia
                   ya reservó; las ventanas importan al ELEGIR, y ahí están, en
                   la vitrina de «quién puede». */
                <FilaCita
                  key={e.citaId}
                  oficio="guarderia"
                  cara={false}
                  direccion={abierta === e.citaId ? 'arriba' : 'abajo'}
                  titulo={e.prestadorNombre}
                  /* ⭐ **«Con tu paquete» — letra firmada.** Va pegada al
                     subtítulo y no en un slot nuevo: `FilaCita` no tiene uno
                     para marcas, y **pedirle una prop a B por una cadena sería
                     agrandar una pieza compartida por un caso de un oficio.**

                     🔴 El dato es un CAMPO PROPIO del lector (`dePaquete`), no
                     una deducción de `precio === null`: *deducir el origen de
                     un silencio es cómo una marca empieza a mentir sin que
                     nadie lo note* — y el día que el día suelto también venga
                     sin precio, la marca se vuelve falsa sola. */
                  subtitulo={
                    e.dePaquete
                      ? `${e.mascotaNombre} · ${t('logGuarderia.conTuPaquete')}`
                      : e.mascotaNombre
                  }
                  /* ⚠️ SIN HORA, y no es un olvido: **una estadía no tiene
                     hora** — tiene día y franja. *Un `00:00` se leería como
                     medianoche.* */
                  /* ⭐ **«Con tu paquete» — letra firmada.** El dato es un
                     campo propio del lector (`dePaquete`), **no una deducción
                     de `precio === null`**: *deducir el origen de un silencio
                     es cómo una marca empieza a mentir sin que nadie lo note*,
                     y el día que el día suelto también venga sin precio la
                     marca se vuelve falsa sola. */
                  metadataMono={fechaCortaMono(e.fecha, idioma)}
                  /* 🔴 `D-990` · QUE LA FAMILIA SE ENTERE SIN TENER QUE ENTRAR.
                     La voz de «no se pudo recoger» existía desde S107-C, pero
                     **sólo dentro del durante** — y la familia no tiene ninguna
                     razón para entrar ahí si no sabe que pasó algo. *Una voz
                     correcta en una pantalla a la que nadie va es la mitad que
                     no se ve.*

                     Va en `fin`, que es el slot de DATOS de la pieza, y como
                     `Insignia` porque es ESTADO y no acción (19.4). `atencion`
                     y no `danger`: es un hecho del día, no una alarma. */
                  fin={
                    e.estadoEstadia === 'no_recogida' ? (
                      <Insignia estado="atencion" etiqueta={t('logGuarderia.noRecogidaChip')} />
                    ) : undefined
                  }
                  mascota={{ nombre: e.mascotaNombre, fotoUrl: undefined }}
                  onPress={() => setAbierta(abierta === e.citaId ? null : e.citaId)}
                  acciones={
                    /* 🔴 EL RECORTE FIRMADO, ENTERO Y NADA MÁS (firma ②): «no se
                       pudo recoger · el día se cobró y no se repone». **Ni una
                       palabra de mora, aviso ni protocolo** — `LETRA_GUARDERIA`
                       §6 sigue frenada por riesgo penal.

                       ✅ Y la segunda frase se escribe porque se MIDIÓ que es
                       cierta, no porque esté firmada: `marcar_no_recogida_
                       guarderia` no toca `bono`, `saldo`, `reverso`,
                       `reembolso`, `precio` ni `cupo` — cero ocurrencias de las
                       siete sobre su cuerpo. *No devuelve plata y no repone el
                       día: es cierta por construcción.*

                       🔴 Y NO SE OFRECE «Ver su día»: no hubo día. Sin viaje,
                       sin fotos y sin acta, ese botón lleva a una pantalla que
                       repite esta misma frase sobre un expediente vacío
                       (Ley 23). */
                    abierta === e.citaId && e.estadoEstadia === 'no_recogida' ? (
                      <Texto variante="apoyo">
                        {t('logGuarderia.noRecogidaDetalle', { nombre: e.mascotaNombre })}
                      </Texto>
                    ) : abierta === e.citaId && e.estadiaId !== null ? (
                      <Boton
                        variante="secundario"
                        bloque
                        etiqueta={t('logGuarderia.verSuDia')}
                        onPress={() =>
                          router.push({
                            pathname: '/guarderia/[estadiaId]',
                            params: {
                              estadiaId: e.estadiaId ?? '',
                              mascotaId: e.mascotaId,
                              mascotaNombre: e.mascotaNombre,
                              fecha: e.fecha,
                            },
                          })
                        }
                      />
                    ) : undefined
                  }
                />
              ));
            })()}
          </>
        )}
      </ScrollView>

      {/* EL CTA AL PIE — el de sus cuatro hermanas: lleva al flujo con la
          mascota elegida, y dice POR QUÉ está apagado cuando lo está. */}
      {mascotas.fase === 'listo' && mascotas.lista.length > 0 ? (
        <View style={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[4] }}>
          <Boton
            variante="primario"
            bloque
            /* ⏪ ACÁ EL BOTÓN REPETÍA LA INSTRUCCIÓN DEL CUERPO. Sin mascota
               elegida decía «Elige de quién primero» **mientras el vacío decía
               «Elige de quién»** — la misma frase dos veces en una pantalla.
               *Cada mitad correcta por su cuenta; el defecto nacía de mostrarlas
               juntas* (la clase que esta pista viene cazando).

               🔴 **Firma de la mesa: el cuerpo instruye, el botón lleva la
               acción.** Y el rótulo sale de **una key propia de esta pantalla**:
               `plan.agendarFaltaMascota` es COMPARTIDA y cambiarla movería la
               voz de superficies ajenas. *No hizo falta tocar `Boton`: su
               `razonDeshabilitado` ya existía justo para esto.* */
            etiqueta={
              mascota !== null
                ? t('logGuarderia.reservarDe', { nombre: mascota.nombre })
                : t('logGuarderia.reservar')
            }
            deshabilitado={mascota === null}
            razonDeshabilitado={t('plan.elegiMascota')}
            onPress={() => {
              if (mascota === null) return;
              /* 🔴 EL NOMBRE VIAJA CON EL ID. Sin él, el flujo tendría que
                 volver a pedir la lista de mascotas sólo para escribir una
                 palabra en el cabezal — un viaje entero para un dato que la
                 pantalla que navega ya tiene en la mano. */
              router.navigate({
                pathname: '/explorar/guarderia',
                params: { mascotaId: mascota.id, mascotaNombre: mascota.nombre },
              });
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
