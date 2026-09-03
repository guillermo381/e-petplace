/**
 * LA GUARDERÍA · TU DÍA (S107-C, tanda 8).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO: *«A la mañana veo la lista de hoy: seis animales, con su
 * franja y quién falta.»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 ES UNA VISTA, NO UNA «JORNADA» ───────────────────────────────────
 * Un día con seis animales son **seis estadías**. Esta pantalla **compone
 * leyendo**; no hay un objeto «jornada» que pedir ni que mutar — lo dice el
 * contrato de A y lo dice el wrapper en su cabecera.
 *
 * ── 🔴 SOLO VERDAD FIRME, Y ES LO QUE MÁS IMPORTA ACÁ ───────────────────
 * `obtenerEstadiasDelDia` **no trae holds sin pagar**, y esta pantalla no los
 * pide por otro lado. *Una lista que incluyera reservas que pueden evaporarse
 * en quince minutos haría salir al cuidador a buscar un animal que nadie
 * compró.* Es la misma ley que la agenda del prestador desde S51.
 *
 * ── LA DIRECCIÓN ES LA DEL PASEO, LA MISMA PIEZA ────────────────────────
 * Viene del **snapshot congelado al reservar** (D-339) y se pinta con
 * `SeccionDireccion`, la que ya usa la cita de paseo. *No se construye una
 * segunda forma de mostrar dónde hay que ir.*
 * ⚠️ El wrapper la entrega como `unknown` a propósito (es un jsonb), así que
 * **acá se estrecha con un guard de forma** — jamás con un `as`.
 *
 * ── LO QUE ESTA PANTALLA NO HACE, Y NO ES RECORTE ───────────────────────
 * 🔴 **No marca nada** —ni «a bordo», ni «entregado»—: medido, **los cuatro
 * wrappers de acción no existen** y las transiciones son **eventos server**
 * que llegan con el acta (⑤). *Un botón que no mueve el estado sería la
 * pantalla mintiendo sobre lo que puede hacer.*
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  abrirTramoGuarderia,
  caraDeMascota,
  cerrarTramoGuarderia,
  marcarLlegada,
  marcarRetorno,
  obtenerEstadiasDelDia,
  obtenerMaquinaEstadia,
  obtenerMiPrestador,
  resolverUrlsFotos,
  type EstadiaDelDia,
  type EstadoEstadia,
  type MaquinaEstadia,
  type MotivoNoRecogida,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useGateGestor } from '@/lib/gate-gestor';
import { GateAjeno } from '@/components/gate-ajeno';
import { GateRoto } from '@/components/gate-roto';
import { SeccionDireccion } from '@/components/seccion-direccion';
import { HojaActaGuarderia } from '@/components/hoja-acta-guarderia';
import { HojaNoEstaba } from '@/components/hoja-no-estaba';
import { HojaMediaGuarderia } from '@/components/hoja-media-guarderia';
import { HojaChipsGuarderia } from '@/components/hoja-chips-guarderia';
import type { DireccionActa } from '@/lib/cola-actas';
import {
  aplicarOrden,
  borrarViaje,
  guardarOrden,
  guardarViaje,
  leerOrden,
  leerViaje,
  type ViajeAbierto,
} from '@/lib/viaje-guarderia';
import { cablearEmitirPunto } from '@/lib/guarderia-cableado';
import { usePuntoVivo } from '@/lib/use-punto-vivo';
import { contarPresencia, vozDePresencia } from '@epetplace/domain';
import { ZONA_DE_LA_CASA, hoyEnZona, horaEnZona } from '@/lib/dia-local';

/* ☠️ **ACÁ VIVÍA UNA COPIA DE `hoyLocal`, Y ES LA RAÍZ DEL DÍA EQUIVOCADO.**
   Su comentario decía la verdad —`toISOString()` da UTC y a la tarde corre el
   día— y **curaba media clase**: dejaba de usar UTC y pasaba a usar **la zona
   del DISPOSITIVO**, que tampoco es la del negocio.

   *Una copia con su trampa documentada es más peligrosa que una sin comentario:
   el comentario dice que alguien lo pensó, así que nadie lo vuelve a mirar.*

   Muere (Ley 37) y la reemplaza `hoyEnZona(zonaRef.current)` de `@/lib/dia-local`, que pide el
   día **en la zona del negocio** — la misma que usa `hoy_local()` en la base,
   que es la única forma de que el día que se pide y el que se responde sean el
   mismo. */

/**
 * El snapshot llega como `unknown`. Se estrecha **mirando la forma**, no
 * afirmándola: si no tiene una dirección legible, es `null` honesto y la pieza
 * lo declara (L-124). *Un `as` acá produciría un objeto vacío con forma de
 * dirección, y el cuidador saldría a buscar a una casa en blanco.*
 */
function comoDireccion(d: unknown): {
  direccion: string; ciudad: string | null; sector: string | null;
  referencias: string | null; lat: number | null; lon: number | null;
} | null {
  if (typeof d !== 'object' || d === null) return null;
  const r = d as Record<string, unknown>;
  if (typeof r.direccion !== 'string' || r.direccion.length === 0) return null;
  const s = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : null);
  const n = (k: string) => (typeof r[k] === 'number' ? (r[k] as number) : null);
  return {
    direccion: r.direccion,
    ciudad: s('ciudad'),
    sector: s('sector'),
    referencias: s('referencias'),
    lat: n('lat'),
    lon: n('lon'),
  };
}

/**
 * `'07:00:00'` → `'07:00'`. El motor manda `HH:MM:SS`; los segundos de una
 * franja acordada son ruido — *nadie acuerda recoger a las 07:00:00.*
 *
 * ⚠️ **No se formatea con `Date`**: la franja es una hora del LUGAR, no un
 * instante. *Pasarla por `Date` la ataría al huso del teléfono y un cuidador
 * viajando la vería corrida.*
 */
function hhmm(hms: string): string {
  return hms.slice(0, 5);
}

type Estado =
  | { fase: 'cargando' }
  | { fase: 'roto' }
  | {
      fase: 'listo';
      prestadorId: string;
      estadias: EstadiaDelDia[];
      caras: Map<string, string>;
      /** 🔴 La máquina, LEÍDA del motor — ver `actaQueCorresponde`. */
      maquina: MaquinaEstadia | null;
    };

export default function DiaGuarderia() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { gate, reintentarGate } = useGateGestor();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  /* ⭐ LA ZONA DEL NEGOCIO, en un ref y no en estado: la leen callbacks que no
     tienen por qué re-renderizar cuando llega. Arranca en la de la casa y se
     pisa con la del prestador apenas carga — el fallback está ACÁ, escrito y
     no en la firma del helper (ver `dia-local.ts`). */
  const zonaRef = useRef(ZONA_DE_LA_CASA);
  const [intento, setIntento] = useState(0);
  /** La estadía cuya acta está abierta. `null` = la hoja no se monta. */
  const [acta, setActa] = useState<{ estadia: EstadiaDelDia; direccion: DireccionActa } | null>(
    null,
  );
  /** El viaje que este teléfono sigue. Se lee del disco al montar: **sobrevive
   *  a cerrar la app**, que es lo que el recorrido pide. */
  const [viaje, setViaje] = useState<ViajeAbierto | null>(null);
  /** La estadía cuyo «no estaba» se está anotando. `null` = no se monta. */
  const [noEstaba, setNoEstaba] = useState<EstadiaDelDia | null>(null);
  const [mediaAbierta, setMediaAbierta] = useState(false);
  /** La estadía cuyos chips se están marcando. `null` = la hoja no se monta. */
  const [chips, setChips] = useState<EstadiaDelDia | null>(null);
  const [enVuelo, setEnVuelo] = useState(false);

  /**
   * EL PUNTO VIVO — lo que la familia ve mientras el vehículo va en camino.
   *
   * 🔴 **`activo` es el freno, y no es opcional:** `cerrarTramo` **borra** el
   * punto a propósito —*lo que ya no se mueve no se sigue mostrando*— y desde
   * S110-A el escritor **rebota `tramo_cerrado`**. Sin este freno, un emisor
   * rezagado resucitaría el punto y la familia vería moverse un vehículo que ya
   * llegó.
   *
   * ⚠️ **UN PUNTO O NADA, JAMÁS LA TRAZA**, y no se sostiene con disciplina:
   * el escritor es un UPSERT sobre `tramo_id`, así que cada punto pisa al
   * anterior. *Las paradas de una ruta son las casas de otras familias.*
   */
  const emitirPunto = useMemo(() => cablearEmitirPunto(), []);
  const punto = usePuntoVivo({
    tramoId: viaje?.tramoId ?? '',
    activo: viaje !== null,
    emitir: emitirPunto,
  });

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
      /* 🔴 SE FIJA ANTES DEL PRIMER USO. Si se fijara después, la primera
         lectura del roster pediría el día en la zona equivocada — y devolvería
         una lista plausible del día de al lado, que es el peor modo de falla:
         sin error y sin aviso. */
      zonaRef.current = p.data.zona_horaria ?? ZONA_DE_LA_CASA;
      const r = await obtenerEstadiasDelDia(p.data.id, hoyEnZona(zonaRef.current));
      if (!vigente) return;
      /* Un fallo JAMÁS se disfraza de «hoy no tenés animales» (Ley 13): el
         cuidador se quedaría en su casa creyendo que no hay jornada. */
      if (!r.ok) {
        setEstado({ fase: 'roto' });
        return;
      }
      const paths = r.data.map((e) => e.mascotaFotoUrl).filter((x): x is string => typeof x === 'string' && x.length > 0);
      const caras = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
      if (!vigente) return;
      /* El viaje se lee del disco con la MISMA fecha que el roster: dos formas
         de saber qué día es se contradicen justo a la tarde, que es cuando se
         devuelven los animales. */
      const v = await leerViaje(hoyEnZona(zonaRef.current));
      /* La máquina es un CATÁLOGO: se pide una vez, con el día. Si falla, la
         pantalla sigue mostrando el roster y sólo pierde los actos — un
         catálogo caído no puede dejar al cuidador sin saber a quién buscar. */
      const maq = await obtenerMaquinaEstadia();
      /* ⑨ · El orden que el cuidador dejó hoy. Lo guardado manda; lo nuevo
         cae al final por su orden natural. */
      const orden = await leerOrden(hoyEnZona(zonaRef.current));
      if (!vigente) return;
      setViaje(v);
      setEstado({
        fase: 'listo',
        prestadorId: p.data.id,
        estadias: aplicarOrden(r.data, orden),
        caras,
        maquina: maq.ok ? maq.data : null,
      });
    })();
    return () => {
      vigente = false;
    };
  }, [gate, intento]);

  const vozEstado = (e: EstadoEstadia): string =>
    t(`diaGuarderia.estado_${e}` as 'diaGuarderia.estado_reservada');

  /**
   * El estado de la estadía → la familia de `Insignia`. **No es decoración:**
   * `atencion` está reservado a lo que el cuidador tiene que MIRAR —el día que
   * no se pudo recoger y el cancelado—, y todo lo demás es curso normal. *Si
   * todo gritara, nada gritaría.*
   */
  const familiaDe = (e: EstadoEstadia): 'alDia' | 'atencion' | 'proximo' | 'info' => {
    if (e === 'entregada') return 'alDia';
    if (e === 'no_recogida' || e === 'cancelada') return 'atencion';
    if (e === 'reservada') return 'proximo';
    return 'info';
  };

  /* La especie llega como `string` del motor y el avatar la quiere de su
     vocabulario. Se estrecha mirando el valor: si no es una de las dos, el
     avatar cae a su fallback en vez de recibir algo que no entiende. */
  const especieDe = (x: string): 'perro' | 'gato' | undefined =>
    x === 'perro' || x === 'gato' ? x : undefined;

  const listo = estado.fase === 'listo' ? estado : null;

  /**
   * QUÉ ACTA CORRESPONDE — **derivada de la máquina que devuelve el motor**,
   * jamás repetida acá.
   *
   * ═══════════════════════════════════════════════════════════════════════
   * 🔴 **La primera versión la escribí de memoria y tenía DOS errores que
   * ningún typecheck ve**, los dos encontrados al leer la tabla del motor:
   *   · daba el acta de devolución colgando de `en_guarderia`, y **cuelga de
   *     `retorno_en_curso`** — el botón aparecía antes de salir a devolver, y
   *     el motor lo habría rebotado por transición ilegal;
   *   · **ignoraba que `a_bordo` exige tramo de recogida abierto**, así que
   *     ofrecía el acta sin viaje: rebote `sin_tramo_abierto`.
   * *Dos veces la pantalla ofreciendo lo que el motor iba a rechazar — Ley 23
   * rota en los dos sentidos, compilando perfecto.*
   * ═══════════════════════════════════════════════════════════════════════
   *
   * Por eso ahora **se lee**: la máquina trae `desde`, `exigeTramo`, `esLote` y
   * `levantaActa` como DATO. *El día que cambie, esta pantalla la sigue sin que
   * nadie se acuerde de tocarla.*
   *
   * Sin máquina (catálogo caído) **no se ofrece ninguna acta**: es preferible
   * que el cuidador no vea el botón a que lo vea y rebote.
   */
  const actaQueCorresponde = (e: EstadoEstadia): DireccionActa | null => {
    if (listo?.maquina == null) return null;
    const acto = listo.maquina.actos.find(
      (a) => a.desde === e && a.levantaActa !== null && !a.esLote,
    );
    if (acto?.levantaActa == null) return null;
    /* Si el acto exige tramo, exige EL SUYO: con el viaje de vuelta abierto no
       se levanta un acta de recogida. */
    if (acto.exigeTramo !== null && viaje?.direccion !== acto.exigeTramo) return null;
    return acto.levantaActa;
  };

  /* ── EL VIAJE ────────────────────────────────────────────────────────────
     Los conteos se DERIVAN del roster; nunca se guardan. El servidor ya tiene
     la verdad de cuántos subieron, y una copia local sería una segunda verdad
     que diverge el día que una subida falla. */
  const porRecoger = listo?.estadias.filter((e) => e.estado === 'reservada') ?? [];
  const aBordo = listo?.estadias.filter((e) => e.estado === 'recogida_en_curso') ?? [];
  const adentro = listo?.estadias.filter((e) => e.estado === 'en_guarderia') ?? [];
  const volviendo = listo?.estadias.filter((e) => e.estado === 'retorno_en_curso') ?? [];

  /* ═══ 🔴 EL VIAJE FANTASMA — el día quedaba pegado «en ruta» ═════════════

     **El rojo del founder:** «0 a bordo · faltan 0», «5 animales hoy», el botón
     de foto apagado con la razón del VIAJE, y **ni la lista ni los cinco
     actos**. Medido contra la base con el JWT de demo-vet: ese día tiene
     **3 `en_guarderia` y 2 `no_recogida`** — o sea que **el viaje terminó de
     hecho**: los tres subieron a las 18:37 y llegaron a las 18:38.

     🔴 **LA CAUSA SON DOS FUENTES DE VERDAD.** El viaje abierto vive **en el
     disco del teléfono** (`leerViaje`) y **sólo se borra si el cuidador toca
     «Llegamos»** — el único camino que llama a `borrarViaje()`. Si ese toque no
     ocurre, o la app muere entre `marcarLlegada` y `borrarViaje`, **el disco
     sigue diciendo «estoy en la calle» sobre animales que ya están adentro.**

     Y ahí se encadena todo lo reportado: con viaje abierto, ⑥ muestra **sólo a
     los que participan de ESE viaje** —ninguno— así que la lista queda vacía;
     los dos CTA de salir se apagan porque preguntan `viaje === null`; y el
     botón de foto muestra la razón del viaje.

     ⇒ **EL VIAJE SE DERIVA DE LOS DATOS, NO DEL DISCO.** Un viaje es real
     **si y sólo si hay alguien en su estado de tránsito**: `recogida_en_curso`
     para el de ida, `retorno_en_curso` para el de vuelta. *El disco pasa de ser
     la verdad a ser una pista: dice qué tramo era, y los datos dicen si sigue
     vivo.*

     ⚠️ **No se borra el registro acá.** Esto es render: borrar durante el
     dibujo sería un efecto escondido en una derivación. Se ignora el fantasma y
     el disco se limpia en su efecto —abajo—, que es donde se puede fallar sin
     dejar la pantalla a medias. */
  const viajeReal =
    viaje === null
      ? null
      : viaje.direccion === 'recogida'
        ? aBordo.length > 0
          ? viaje
          : null
        : volviendo.length > 0
          ? viaje
          : null;

  /**
   * ⑥ · QUIÉNES SE VEN. **Con un viajeReal abierto, sólo los que participan de ESE
   * viajeReal.**
   *
   * ═══════════════════════════════════════════════════════════════════════
   * 🔴 **`no_recogida` es TERMINAL y se arrastraba a la lista del retorno.**
   * Medí las tres afirmaciones por separado y **dos ya se cumplían**: no entra
   * al tramo (`salirADevolver` ata sólo `en_guarderia`) y no admite ningún
   * acto (la máquina la tiene como `hasta` y nunca como `desde`). **La que
   * fallaba era la lista**, que pintaba el día entero sin mirar el viajeReal.
   * ═══════════════════════════════════════════════════════════════════════
   *
   * **Se DERIVA de la máquina, no se enumeran estados:** participan los `desde`
   * y los `hasta` de los actos cuyo `exigeTramo` es esta dirección. Para
   * recogida da `reservada → recogida_en_curso`; para devolución,
   * `en_guarderia → retorno_en_curso`. *`entregada` queda afuera sola —su acto
   * no exige tramo— y eso es exactamente lo correcto: el que ya se entregó sale
   * del viajeReal.*
   *
   * ⚠️ **SIN viajeReal se ven TODAS, y no es una excepción:** ahí la lista es el
   * día completo, y ahí es donde `no_recogida` tiene que verse con su motivo y
   * su hora (el lector de `D-990` del lado del prestador). *Durante el viajeReal es
   * ruido; al mirar el día es el registro.*
   */
  const participanDelViaje = (e: EstadoEstadia): boolean => {
    if (viajeReal === null || listo?.maquina == null) return true;
    return listo.maquina.actos.some(
      (a) => a.exigeTramo === viajeReal.direccion && (a.desde === e || a.hasta === e),
    );
  };

  const relanzar = () => setIntento((n) => n + 1);

  /**
   * ⑨ · MOVER UNA TARJETA. **Ese orden es el viajeReal.**
   *
   * ⚠️ **Es subir/bajar y no arrastrar, y lo declaro porque mi recorrido decía
   * «con el dedo»:** el arrastre pide gesto + reanimated sobre una lista que ya
   * lleva tarjetas con acciones adentro, y **dos gestos en la misma superficie
   * pelean** —el que arrastra y el que toca un botón—. *Prefiero un control que
   * se entiende sin explicación a un gesto que a veces mueve y a veces dispara
   * otra cosa.* Si el founder quiere arrastre, es su firma y otra tanda.
   *
   * 🔴 **El orden se guarda ENTERO, no la posición del que se movió**: guardar
   * «Luna está tercera» se rompe con la primera cancelación. La lista completa
   * de ids sobrevive a que entren y salgan animales.
   */
  const mover = (estadiaId: string, delta: -1 | 1) => {
    if (listo === null) return;
    const lista = [...listo.estadias];
    const i = lista.findIndex((e) => e.estadiaId === estadiaId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    setEstado({ ...listo, estadias: lista });
    void guardarOrden(hoyEnZona(zonaRef.current), lista.map((e) => e.estadiaId));
  };

  /** La hora del TOQUE — la de la puerta. La del servidor existe para auditar
   *  y no se muestra: con cola offline sería la hora de la señal. */
  const ahora = () => new Date().toISOString();

  const avisarFallo = (mensaje: string) => mostrar({ variante: 'error', texto: mensaje });

  const salirABuscar = async () => {
    if (listo === null || enVuelo) return;
    setEnVuelo(true);
    try {
      const r = await abrirTramoGuarderia({
        prestadorId: listo.prestadorId,
        fecha: hoyEnZona(zonaRef.current),
        direccion: 'recogida',
        estadias: porRecoger.map((e) => e.estadiaId),
      });
      if (!r.ok) return avisarFallo(r.mensaje);
      const v: ViajeAbierto = {
        tramoId: r.data.tramoId,
        direccion: 'recogida',
        fecha: hoyEnZona(zonaRef.current),
        prestadorId: listo.prestadorId,
        abiertoEn: Date.now(),
      };
      await guardarViaje(v);
      setViaje(v);
      relanzar();
    } finally {
      setEnVuelo(false);
    }
  };

  const salirADevolver = async () => {
    if (listo === null || enVuelo) return;
    setEnVuelo(true);
    try {
      const ids = adentro.map((e) => e.estadiaId);
      const r = await abrirTramoGuarderia({
        prestadorId: listo.prestadorId,
        fecha: hoyEnZona(zonaRef.current),
        direccion: 'devolucion',
        estadias: ids,
      });
      if (!r.ok) return avisarFallo(r.mensaje);
      /* 🔴 LA ASIMETRÍA ES DECISIÓN, NO CONSECUENCIA (confirmada por A): en la
         recogida cada animal sube en SU puerta y se marca de a uno; en la
         devolución **salen todos juntos del local**, así que el retorno es un
         acto de LOTE en una transacción. *Seis animales que salen en la misma
         camioneta salen juntos o no salió ninguno.* */
      const m = await marcarRetorno(ids, ahora());
      if (!m.ok) return avisarFallo(m.mensaje);
      const v: ViajeAbierto = {
        tramoId: r.data.tramoId,
        direccion: 'devolucion',
        fecha: hoyEnZona(zonaRef.current),
        prestadorId: listo.prestadorId,
        abiertoEn: Date.now(),
      };
      await guardarViaje(v);
      setViaje(v);
      relanzar();
    } finally {
      setEnVuelo(false);
    }
  };

  const llegamos = async () => {
    if (viajeReal === null || enVuelo) return;
    setEnVuelo(true);
    try {
      const m = await marcarLlegada(aBordo.map((e) => e.estadiaId), ahora());
      if (!m.ok) return avisarFallo(m.mensaje);
      /* El tramo se cierra DESPUÉS de que llegaron, y cerrarlo borra el punto
         vivo: lo que ya no se mueve no se sigue mostrando. */
      await cerrarTramoGuarderia(viajeReal.tramoId);
      await borrarViaje();
      setViaje(null);
      relanzar();
    } finally {
      setEnVuelo(false);
    }
  };

  /**
   * EL CIERRE DEL DÍA. Del recorrido: *«Cuando entrego el último, el día se
   * cierra y me lo dice sin fanfarria.»*
   *
   * 🔴 Es automático y no un botón porque **no hay nada que decidir**: si no
   * queda nadie adentro ni volviendo, el viajeReal de devolución terminó. *Pedir un
   * toque para confirmar un hecho que ya ocurrió es preguntar algo cuya
   * respuesta ya sabemos* (Ley 23, corolario).
   *
   * El `ref` es el guard contra el re-disparo: `relanzar()` vuelve a correr el
   * efecto y sin él cerraría el tramo en cada vuelta.
   *
   * ⚠️ **Este bloque ya se perdió una vez** — una limpieza por RANGO DE ÍNDICES
   * se llevó al vecino de al lado, y **ningún gate lo vio**: nada lo
   * referenciaba, así que el typecheck quedó verde sobre una función que había
   * desaparecido. *Lo cazó un censo de piezas conocidas, no una relectura.*
   */
  /* ⭐ **EL DISCO SE LIMPIA DEL FANTASMA, en su propio efecto.**
     La derivación de arriba ya deja la pantalla correcta; esto saca la fila
     muerta para que el próximo arranque no vuelva a leerla. *Va en un efecto y
     no en el render porque escribir en disco durante el dibujo es un efecto
     escondido, y porque acá puede fallar sin dejar la pantalla a medias.*

     ⚠️ **Sólo con la pantalla EN `listo`.** Mientras carga, `aBordo` y
     `volviendo` están vacíos por ausencia de datos, no por ausencia de viaje —
     *borrar ahí destruiría un viaje legítimo justo mientras se está leyendo*, y
     el error sería invisible: la próxima vez simplemente no estaría. Es el
     mismo guard de dos hechos que produjo el defecto, del otro lado. */
  useEffect(() => {
    if (listo === null) return;
    if (viaje === null || viajeReal !== null) return;
    void (async () => {
      await borrarViaje();
      setViaje(null);
    })();
  }, [listo, viaje, viajeReal]);

  const cerrando = useRef(false);
  useEffect(() => {
    if (viajeReal === null || viajeReal.direccion !== 'devolucion') return;
    if (volviendo.length > 0 || adentro.length > 0) return;
    if (cerrando.current) return;
    cerrando.current = true;
    void (async () => {
      try {
        await cerrarTramoGuarderia(viajeReal.tramoId);
        await borrarViaje();
        setViaje(null);
        mostrar({ variante: 'exito', texto: t('diaGuarderia.diaCerrado') });
      } finally {
        cerrando.current = false;
      }
    })();
  }, [viajeReal, volviendo.length, adentro.length, mostrar, t]);

  const alAtras = useCallback(() => router.back(), [router]);

  if (gate === 'verificando' || estado.fase === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('diaGuarderia.titulo')} atras onAtras={alAtras} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={88} />
            <Esqueleto alto={88} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }
  if (gate === 'denegado') return <GateAjeno />;
  if (gate === 'roto') return <GateRoto onReintentar={reintentarGate} />;
  if (estado.fase === 'roto') return <GateRoto onReintentar={() => setIntento((n) => n + 1)} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('diaGuarderia.titulo')} atras onAtras={alAtras} />

      {/* ═══ EL VIAJE ═══════════════════════════════════════════════════════
          Del recorrido: *«arriba queda una barra fina, viva, que dice cuántos
          llevo a bordo y cuántos me faltan. Esa barra no se mueve de ahí hasta
          que cierro el viajeReal.»*

          🔴 Vive FUERA del ScrollView a propósito: adentro se iría con el
          scroll, y el cuidador mira el teléfono con una mano mientras maneja o
          toca timbres. *Una barra que hay que ir a buscar no es una barra.* */}
      {viajeReal !== null ? (
        <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[3] }}>
          <Tarjeta relleno="normal" elevacion="reposo">
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
            >
              <View style={{ flex: 1 }}>
                <Texto variante="cuerpo">
                  {viajeReal.direccion === 'recogida'
                    ? t('diaGuarderia.viajeRecogida', {
                        aBordo: aBordo.length,
                        faltan: porRecoger.length,
                      })
                    : t('diaGuarderia.viajeDevolucion', { llevando: volviendo.length })}
                </Texto>
              </View>
              {/* «Llegamos» sólo en la recogida y sólo con alguien a bordo: en
                  la devolución el viajeReal se cierra cuando se entrega el último,
                  no con un botón. Ley 23 — la puerta no ofrece lo que va a
                  rechazar. */}
              {/* 🔴 EL PERMISO DENEGADO SE DICE. Sin ubicación, la familia no
                  ve a dónde va su animal — y el único que puede arreglarlo es
                  quien tiene el teléfono en la mano. *Callarlo deja a las dos
                  puntas sin entender: la familia mirando un mapa vacío y el
                  cuidador creyendo que emite.* (Ley 13.) */}
              {punto.estado === 'permiso_denegado' ? (
                <Texto variante="apoyo" color="warning">
                  {t('diaGuarderia.puntoSinPermiso')}
                </Texto>
              ) : null}
              {viajeReal.direccion === 'recogida' && aBordo.length > 0 ? (
                <Boton
                  variante="primario"
                  tamaño="sm"
                  etiqueta={t('diaGuarderia.llegamos')}
                  onPress={() => void llegamos()}
                  cargando={enVuelo}
                />
              ) : null}
            </View>
          </Tarjeta>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: insets.bottom + spacing[8] }}>
        {estado.estadias.length === 0 ? (
          /* Vacío DIGNO: un día sin animales no es un negocio muerto. */
          <EstadoVacio
            registro="seccion"
            titulo={t('diaGuarderia.vacioTitulo')}
            descripcion={t('diaGuarderia.vacioDetalle')}
          />
        ) : (
          <>
            {/* ⏪ **DECÍA EL TOTAL** («5 animales hoy»), que es cierto y no
                sirve: *esconde justo la diferencia que decide qué hace el
                cuidador ahora*. Y en el día que quedó pegado decía «5» mientras
                la pantalla no mostraba a ninguno — el total sobrevive a
                cualquier defecto de la lista, así que **no puede ser lo único
                que se lee**.
                Mismo criterio que la baldosa del HOY, con el MISMO contador
                (`contarPresencia`): dos cuentas de «cuántos hay adentro» serían
                dos criterios que divergen. */}
            <Texto variante="titulo">
              {vozDePresencia(contarPresencia(estado.estadias), {
                reservadas: (count) => t('diaGuarderia.pReservadas', { count }),
                aBordo: (count) => t('diaGuarderia.pABordo', { count }),
                adentro: (count) => t('diaGuarderia.pAdentro', { count }),
                volviendo: (count) => t('diaGuarderia.pVolviendo', { count }),
                entregadas: (count) => t('diaGuarderia.pEntregadas', { count }),
                noRecogidas: (count) => t('diaGuarderia.pNoRecogidas', { count }),
              }) ?? t('diaGuarderia.cuantos', { count: estado.estadias.length })}
            </Texto>

            {/* EL ARRANQUE. Un solo botón por vez y sólo si hay a quién ir a
                buscar o a quién devolver — con el día vacío de ese lado, el
                botón no existe en vez de rebotar. */}
            {viajeReal === null && porRecoger.length > 0 ? (
              <Boton
                variante="primario"
                etiqueta={t('diaGuarderia.salgoABuscar')}
                onPress={() => void salirABuscar()}
                cargando={enVuelo}
              />
            ) : null}
            {viajeReal === null && porRecoger.length === 0 && adentro.length > 0 ? (
              <Boton
                variante="primario"
                etiqueta={t('diaGuarderia.salgoADevolver')}
                onPress={() => void salirADevolver()}
                cargando={enVuelo}
              />
            ) : null}

            {/* ⑧ · EL DURANTE, EN LAS INSTALACIONES. Sólo con animales
                ADENTRO: §5 dice que **las fotos de estadía se toman en las
                instalaciones**, así que ofrecerlo durante un viajeReal invitaría a
                sacarlas en la calle o en la puerta de una casa — justo donde la
                regla del primer plano existe para proteger la fachada.

                Es `apoyada` y no `primario`: el CTA del día es salir, y una
                superficie con dos acentos no tiene ninguno (Ley 5). */}
            {/* ⭐ **FIRMA DEL FOUNDER (2-sep): el recorte SE QUEDA, y ahora
                DICE POR QUÉ.**

                🔴 La medición que lo puso sobre la mesa: A midió que
                `publicar_media_guarderia` **NO exige `en_guarderia`** ⇒ el
                recorte es de ESTA pantalla, no del motor. Y las estadías del
                founder estuvieron adentro **68 segundos** ⇒ el botón se abría y
                se cerraba solo en poco más de un minuto. *Un control que
                aparece y desaparece sin decir nada se lee como que la app se
                rompió*, y ésa era la mitad real del reporte «sigue sin
                funcionar bien».

                ⇒ **No se ensancha la ventana** (§5: las fotos se toman en las
                instalaciones — durante un viajeReal se sacarían en la calle o en la
                puerta de una casa, justo donde la regla del primer plano existe
                para proteger la fachada). **Se ensancha la EXPLICACIÓN:** el
                botón deja de desaparecer y pasa a estar apagado con su razón
                debajo.

                *Desaparecer y estar apagado cuestan lo mismo de construir y no
                cuestan lo mismo de entender: uno deja al cuidador buscando algo
                que vio hace un minuto; el otro le dice cuándo vuelve.* ── */}
            {estado.estadias.length > 0 ? (
              <Boton
                variante="apoyada"
                etiqueta={t('diaGuarderia.sacarFoto')}
                deshabilitado={viajeReal !== null || adentro.length === 0}
                /* ⏪ **LA RAZÓN EXISTÍA Y DESCRIBÍA UN ESTADO, NO UN ACTO.**
                   Decía *«todavía no hay nadie adentro»*: cierto, y deja al
                   cuidador sin saber qué depende de él. La letra del founder la
                   corrige — *«se habilita cuando registrás la llegada de
                   ‹nombre›»*— y la diferencia es la que importa: **nombra el
                   acto que la destraba**, no la condición que falta.

                   *Una razón que describe el estado le dice a alguien que
                   espere; una que nombra el acto le dice qué hacer.*

                   Y **nombra al animal sólo cuando hay UNO esperando**: con
                   varios, elegir uno de los nombres sería arbitrario y mandaría
                   a registrar justo a ése. Con varios se dice «la primera
                   llegada», que es verdad para cualquiera. */
                razonDeshabilitado={
                  viajeReal !== null
                    ? t('diaGuarderia.fotoRazonViaje')
                    : porRecoger.length === 1
                      ? t('diaGuarderia.fotoRazonLlegadaDe', {
                          nombre: porRecoger[0].mascotaNombre,
                        })
                      : t('diaGuarderia.fotoRazonPrimeraLlegada')
                }
                onPress={() => setMediaAbierta(true)}
              />
            ) : null}

            {estado.estadias.filter((e) => participanDelViaje(e.estado)).map((e) => {
              const dir = comoDireccion(e.direccion);
              const foto = e.mascotaFotoUrl === null ? null : (estado.caras.get(e.mascotaFotoUrl) ?? null);
              /* ⭐ S109-D · LA CARA SALE DE LA ESCALERA DE LA CASA, no de la
                 pieza. Acá se pasaba `fotoUrl` crudo y sin foto salía LA
                 HUELLA — con 111 caras sembradas a dos carpetas de distancia.

                 🔴 Y leyendo el JSX parecía correcto: la llamada pasaba
                 `especie`, así que se veía cableado. **`AvatarMascota` declara
                 en su contrato que `especie` «hoy no cambia el render»** (está
                 reservada al set ilustrado de `D-288`). *Una prop que se acepta
                 y se ignora se lee como cableado, y el único que sabe que no
                 hace nada es el archivo del componente.*

                 ⚠️ `razaSlug: null` A PROPÓSITO: `EstadiaDelDia` no proyecta la
                 raza, y `resolverUrlRaza` exige el slug de `cat_razas` — jamás
                 uno derivado del texto tipeado, porque *una URL que acierta a
                 veces muestra una cara equivocada, que es peor que ninguna*.
                 Con esto se llega al peldaño ② (el genérico de su especie). El
                 ① llega cuando el lector traiga `raza_ruta_imagen`. */
              const cara = caraDeMascota({
                especie: e.mascotaEspecie,
                razaSlug: null,
                fotoUri: foto,
              });
              const corresponde = actaQueCorresponde(e.estado);
              return (
                <Tarjeta key={e.estadiaId} relleno="normal" elevacion="reposo">
                  <View style={{ gap: spacing[3] }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                      <AvatarMascota
                        nombre={e.mascotaNombre}
                        especie={especieDe(e.mascotaEspecie)}
                        fotoUrl={cara ?? undefined}
                        tamano="md"
                      />
                      <View style={{ flex: 1, gap: spacing[1] }}>
                        <Texto variante="cuerpo">{e.mascotaNombre}</Texto>
                        {/* El espacio sólo si el motor lo asignó: `null` no se
                            pinta como «sin sala», se calla. */}
                        {/* ⑨ · LA FRANJA — el dato que hace legible el orden.
                            🔴 **Sin ella la lista sale ordenada y el cuidador no
                            puede explicarse por qué**: vería un orden correcto
                            sin la razón a la vista, que es casi tan malo como
                            un orden equivocado.

                            ⚠️ `null` es INFORMACIÓN, no un dato que falta: las
                            terminales no tienen franja porque ya no les toca
                            nada, y por eso el motor las manda al final solas
                            (`NULLS LAST`). Acá simplemente **no se dibuja** —
                            escribir «sin franja» le pondría nombre a una
                            ausencia que ya se lee en su estado. */}
                        {e.franjaDesde !== null && e.franjaHasta !== null ? (
                          <Texto variante="dato">
                            {`${hhmm(e.franjaDesde)}–${hhmm(e.franjaHasta)}`}
                          </Texto>
                        ) : null}
                        {e.espacioNombre !== null ? (
                          <Texto variante="apoyo">{e.espacioNombre}</Texto>
                        ) : null}
                        {/* 🔴 EL LECTOR DE «NO SE PUDO RECOGER» — la mitad sin
                            la cual el escritor no se construye (`D-980` del
                            lado espejo). El día lo muestra CERRADO, con su
                            motivo y su hora.

                            El motivo llega como CÓDIGO del catálogo y la voz la
                            pone este diccionario: si el motor mandara la frase,
                            su vocabulario saldría a pantalla.

                            ⚠️ Y acá TERMINA: ni una palabra de mora, aviso ni
                            protocolo — `LETRA_GUARDERIA` §6 sigue frenada. */}
                        {e.estado === 'no_recogida' && e.noRecogidaMotivo !== null ? (
                          <Texto variante="apoyo">
                            {t('diaGuarderia.noRecogidaDetalle', {
                              motivo: t(
                                `noEstaba.motivo_${e.noRecogidaMotivo as MotivoNoRecogida}` as 'noEstaba.motivo_nadie_en_domicilio',
                              ),
                              /* ⏪ **DECÍA LA HORA DEL APARATO** (`horaCorta`,
                                 `Intl` sin `timeZone`). Un sello se guarda en
                                 UTC y **se lee donde ocurrió**: con el teléfono
                                 en otra zona, una llegada de las 13:38 en Quito
                                 se leía «18:38» y nada avisaba.
                                 ⚠️ Y acá pesa doble: A midió que `Kira Tres`
                                 tiene su `no_recogida_en` del 3 en una estadía
                                 del 2 —el acto se registró después de medianoche
                                 UTC—, así que **la hora sin su zona se lee como
                                 un acto del día equivocado**. */
                              hora: e.noRecogidaEn === null ? '' : horaEnZona(e.noRecogidaEn, zonaRef.current),
                            })}
                          </Texto>
                        ) : null}
                      </View>
                      <Insignia estado={familiaDe(e.estado)} etiqueta={vozEstado(e.estado)} />
                    </View>

                    {/* Dónde hay que ir a buscarlo — la MISMA pieza del paseo.
                        Con snapshot ausente o ilegible, `null` y la pieza lo
                        declara: nadie sale a buscar a una casa en blanco. */}
                    <SeccionDireccion direccion={dir} />

                    {/* LA PUERTA DEL ACTA.

                        🔴 **Por qué es un botón y no la tarjeta entera tocable**,
                        que es lo que el recorrido pide («toco su tarjeta»):
                        `SeccionDireccion` YA tiene un tocable adentro —el «cómo
                        llegar» que abre el mapa—, y un tocable dentro de otro
                        es la clase `D-311`: dos blancos superpuestos donde el
                        dedo decide por vos. *La tarjeta entera se vuelve tocable
                        el día que su contenido no tenga acciones propias, no
                        antes.*

                        Y es `apoyada` y no `primario` por la Ley 5: con seis
                        animales en pantalla, seis CTAs de acento serían seis
                        elementos peleando. El «cómo llegar» queda en `ghost`
                        debajo — la jerarquía entre las dos acciones se lee sin
                        leerlas.

                        ⚠️ **`compacto` NO**, aunque 22c lo avale como letra
                        viva: `R47` lo tiene jubilado POR POLÍTICA con trinquete
                        solo-baja hacia 0. Mi uso pasaba el baseline por uno —
                        *y hacer crecer un trinquete que todavía no rebota es
                        exactamente lo que el trinquete existe para evitar.* El
                        choque entre 22c y R47 está declarado en el propio lint;
                        acá se resuelve a favor del que mide. */}
                    {/* ③ · CÓMO SE PORTÓ — sólo con el animal ADENTRO.

                        🔴 **No se ofrece sobre una estadía terminal**, y es el
                        borde que A dejó nombrado: su guard rechaza `entregada`,
                        `no_recogida` y `cancelada`. *Ofrecerlo y rebotar sería
                        enseñarle al cuidador que el botón a veces no anda* —
                        Ley 23: la puerta no ofrece lo que va a rechazar.

                        ⚠️ Y `entregada` es el discutible —el animal SÍ estuvo, y
                        las manos del cuidador quedan libres justo después de
                        entregar—. Si el founder abre esa ventana, acá es
                        agregar un estado a esta condición y allá un valor a una
                        lista: **nada más**. */}
                    {e.estado === 'en_guarderia' ? (
                      <View style={{ alignSelf: 'flex-start' }}>
                        <Boton
                          variante="apoyada"
                          etiqueta={t('diaGuarderia.comoSePorto')}
                          onPress={() => setChips(e)}
                        />
                      </View>
                    ) : null}

                    {/* ⑨ · Mover, sólo ANTES de salir: con el viajeReal abierto el
                        orden ya está en la calle y reordenarlo no cambia nada
                        de lo que pasó. *Un control que no tiene efecto es peor
                        que no tenerlo.* */}
                    {viajeReal === null && estado.estadias.length > 1 ? (
                      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                        <Boton
                          variante="ghost"
                          tamaño="sm"
                          etiqueta={t('diaGuarderia.subir')}
                          onPress={() => mover(e.estadiaId, -1)}
                        />
                        <Boton
                          variante="ghost"
                          tamaño="sm"
                          etiqueta={t('diaGuarderia.bajar')}
                          onPress={() => mover(e.estadiaId, 1)}
                        />
                      </View>
                    ) : null}

                    {corresponde === null ? null : (
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}
                      >
                        <Boton
                          variante="apoyada"
                          etiqueta={t(
                            corresponde === 'recogida'
                              ? 'diaGuarderia.subio'
                              : 'diaGuarderia.entregado',
                          )}
                          onPress={() => setActa({ estadia: e, direccion: corresponde })}
                        />
                        {/* «No estaba» sólo en la RECOGIDA —`no_recogida` sale
                            de `reservada` y de ningún otro estado— y en `ghost`
                            porque es la EXCEPCIÓN: el camino normal pesa más
                            sin que nadie tenga que leer cuál es cuál. */}
                        {corresponde === 'recogida' ? (
                          <Boton
                            variante="ghost"
                            tamaño="sm"
                            etiqueta={t('diaGuarderia.noEstaba')}
                            onPress={() => setNoEstaba(e)}
                          />
                        ) : null}
                      </View>
                    )}
                  </View>
                </Tarjeta>
              );
            })}

            {/* ☠️ ACÁ VIVÍA LA TARJETA QUE DECÍA «todavía no puedes marcar
                la recogida ni la entrega». **Murió porque su condición de
                muerte se cumplió**, y estaba escrita en ella misma: *«MUERE
                cuando exista un escritor de `guarderia_estadias.estado` con
                puerta y esta pantalla lo llame»*. Los cinco actos existen
                (S110-A) y esta pantalla los llama.

                *Se retira en el MISMO acto que la vuelve falsa* — `L-395`: un
                texto honesto que sobrevive a su razón manda al próximo lector a
                construir un puente sobre un río que ya no está. Sus dos claves
                salieron del diccionario en el mismo commit. */}
          </>
        )}
      </ScrollView>

      {/* LA PUERTA DEL ACTA. Se monta con la estadía elegida y se desmonta al
          cerrar: su estado interno (fotos, carnet, observaciones) muere con
          ella a propósito — **un acta a medias de OTRO animal es el peor
          arrastre posible en el instrumento que existe para un litigio.**

          ⚠️ `lugar="domicilio"` en las DOS direcciones, y no es un descuido:
          las actas se levantan en la puerta de la casa —tanto la de recogida
          como la de devolución—, así que rige el primer plano del criterio
          §5.3. *Las fotos de la ESTADÍA se toman en las instalaciones; ésas
          son otras fotos y otra pantalla.*

          ⚠️ Sin `alLevantar`: hoy el acta se levanta en la COLA LOCAL con la
          hora de la puerta. Cuando exista el acto único de A —`marcarABordo`,
          que levanta el acta y mueve el estado en una transacción— se inyecta
          acá, **en esta línea y en ninguna otra**, y la etiqueta de abajo pasa
          a prometer lo que el acto entonces sí hace. */}
      {estado.fase === 'listo' ? (
        <HojaMediaGuarderia
          visible={mediaAbierta}
          prestadorId={estado.prestadorId}
          fecha={hoyEnZona(zonaRef.current)}
          /* El universo de etiquetado son los que HOY están adentro. */
          presentes={adentro}
          onCerrar={() => setMediaAbierta(false)}
        />
      ) : null}

      <HojaChipsGuarderia
        estadia={chips}
        onCerrar={() => setChips(null)}
        onRegistrada={() => {
          setChips(null);
          relanzar();
        }}
      />

      {/* «No estaba» — se monta con el catálogo del motor. Sin catálogo no se
          ofrece: un selector de motivos inventado acá sería el vocabulario del
          motor escrito a mano, y el CHECK lo rebotaría. */}
      {estado.fase === 'listo' && noEstaba !== null ? (
        <HojaNoEstaba
          estadia={noEstaba}
          motivos={estado.maquina?.motivosNoRecogida ?? []}
          onCerrar={() => setNoEstaba(null)}
          onMarcada={() => {
            setNoEstaba(null);
            relanzar();
          }}
        />
      ) : null}

      {estado.fase === 'listo' && acta !== null ? (
        <HojaActaGuarderia
          estadia={acta.estadia}
          direccion={acta.direccion}
          prestadorId={estado.prestadorId}
          fecha={hoyEnZona(zonaRef.current)}
          cara={
            acta.estadia.mascotaFotoUrl === null
              ? null
              : (estado.caras.get(acta.estadia.mascotaFotoUrl) ?? null)
          }
          lugar="domicilio"
          /* 🔴 SIN `alLevantar` A PROPÓSITO, y es lo contrario de lo que parece:
             el acto único NO se llama desde acá, se inyecta **a la cola** (ver
             `cablearActoUnico`). Así el acta se levanta en la puerta sin señal
             y el acto entero —acta + estado— viaja solo, con la hora del toque.
             *Llamarlo directo desde la pantalla lo ataba a tener red justo en
             la puerta de una casa, que es donde menos hay.*

             Y la etiqueta ya puede prometer lo que el acto hace: antes decía
             «Guardar el acta» porque eso era lo único que ocurría. */
          etiquetaActo={t(
            acta.direccion === 'recogida'
              ? 'diaGuarderia.subio'
              : 'diaGuarderia.entregado',
          )}
          onCerrar={() => setActa(null)}
          onLevantada={() => {
            setActa(null);
            /* Se re-lee el día: el acta puede haber cambiado lo que el motor
               devuelve, y la pantalla LEE el estado — nunca lo declara. */
            setIntento((n) => n + 1);
          }}
        />
      ) : null}
    </View>
  );
}
