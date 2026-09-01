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

import { useCallback, useEffect, useRef, useState } from 'react';
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
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useGateGestor } from '@/lib/gate-gestor';
import { GateAjeno } from '@/components/gate-ajeno';
import { GateRoto } from '@/components/gate-roto';
import { SeccionDireccion } from '@/components/seccion-direccion';
import { HojaActaGuarderia } from '@/components/hoja-acta-guarderia';
import type { DireccionActa } from '@/lib/cola-actas';
import {
  borrarViaje,
  guardarViaje,
  leerViaje,
  type ViajeAbierto,
} from '@/lib/viaje-guarderia';

/** Fecha LOCAL. 🔴 `toISOString()` da UTC y en Guayaquil, pasadas las 19:00,
 *  devuelve el día siguiente — la jornada saldría vacía a la tarde. */
function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
  const [intento, setIntento] = useState(0);
  /** La estadía cuya acta está abierta. `null` = la hoja no se monta. */
  const [acta, setActa] = useState<{ estadia: EstadiaDelDia; direccion: DireccionActa } | null>(
    null,
  );
  /** El viaje que este teléfono sigue. Se lee del disco al montar: **sobrevive
   *  a cerrar la app**, que es lo que el recorrido pide. */
  const [viaje, setViaje] = useState<ViajeAbierto | null>(null);
  const [enVuelo, setEnVuelo] = useState(false);

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
      const r = await obtenerEstadiasDelDia(p.data.id, hoyLocal());
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
      const v = await leerViaje(hoyLocal());
      /* La máquina es un CATÁLOGO: se pide una vez, con el día. Si falla, la
         pantalla sigue mostrando el roster y sólo pierde los actos — un
         catálogo caído no puede dejar al cuidador sin saber a quién buscar. */
      const maq = await obtenerMaquinaEstadia();
      if (!vigente) return;
      setViaje(v);
      setEstado({
        fase: 'listo',
        prestadorId: p.data.id,
        estadias: r.data,
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

  const relanzar = () => setIntento((n) => n + 1);

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
        fecha: hoyLocal(),
        direccion: 'recogida',
        estadias: porRecoger.map((e) => e.estadiaId),
      });
      if (!r.ok) return avisarFallo(r.mensaje);
      const v: ViajeAbierto = {
        tramoId: r.data.tramoId,
        direccion: 'recogida',
        fecha: hoyLocal(),
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
        fecha: hoyLocal(),
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
        fecha: hoyLocal(),
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
    if (viaje === null || enVuelo) return;
    setEnVuelo(true);
    try {
      const m = await marcarLlegada(aBordo.map((e) => e.estadiaId), ahora());
      if (!m.ok) return avisarFallo(m.mensaje);
      /* El tramo se cierra DESPUÉS de que llegaron, y cerrarlo borra el punto
         vivo: lo que ya no se mueve no se sigue mostrando. */
      await cerrarTramoGuarderia(viaje.tramoId);
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
   * queda nadie adentro ni volviendo, el viaje de devolución terminó. *Pedir un
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
  const cerrando = useRef(false);
  useEffect(() => {
    if (viaje === null || viaje.direccion !== 'devolucion') return;
    if (volviendo.length > 0 || adentro.length > 0) return;
    if (cerrando.current) return;
    cerrando.current = true;
    void (async () => {
      try {
        await cerrarTramoGuarderia(viaje.tramoId);
        await borrarViaje();
        setViaje(null);
        mostrar({ variante: 'exito', texto: t('diaGuarderia.diaCerrado') });
      } finally {
        cerrando.current = false;
      }
    })();
  }, [viaje, volviendo.length, adentro.length, mostrar, t]);

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
          que cierro el viaje.»*

          🔴 Vive FUERA del ScrollView a propósito: adentro se iría con el
          scroll, y el cuidador mira el teléfono con una mano mientras maneja o
          toca timbres. *Una barra que hay que ir a buscar no es una barra.* */}
      {viaje !== null ? (
        <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[3] }}>
          <Tarjeta relleno="normal" elevacion="reposo">
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
            >
              <View style={{ flex: 1 }}>
                <Texto variante="cuerpo">
                  {viaje.direccion === 'recogida'
                    ? t('diaGuarderia.viajeRecogida', {
                        aBordo: aBordo.length,
                        faltan: porRecoger.length,
                      })
                    : t('diaGuarderia.viajeDevolucion', { llevando: volviendo.length })}
                </Texto>
              </View>
              {/* «Llegamos» sólo en la recogida y sólo con alguien a bordo: en
                  la devolución el viaje se cierra cuando se entrega el último,
                  no con un botón. Ley 23 — la puerta no ofrece lo que va a
                  rechazar. */}
              {viaje.direccion === 'recogida' && aBordo.length > 0 ? (
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
            <Texto variante="titulo">
              {t('diaGuarderia.cuantos', { n: estado.estadias.length })}
            </Texto>

            {/* EL ARRANQUE. Un solo botón por vez y sólo si hay a quién ir a
                buscar o a quién devolver — con el día vacío de ese lado, el
                botón no existe en vez de rebotar. */}
            {viaje === null && porRecoger.length > 0 ? (
              <Boton
                variante="primario"
                etiqueta={t('diaGuarderia.salgoABuscar')}
                onPress={() => void salirABuscar()}
                cargando={enVuelo}
              />
            ) : null}
            {viaje === null && porRecoger.length === 0 && adentro.length > 0 ? (
              <Boton
                variante="primario"
                etiqueta={t('diaGuarderia.salgoADevolver')}
                onPress={() => void salirADevolver()}
                cargando={enVuelo}
              />
            ) : null}

            {estado.estadias.map((e) => {
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
                        {e.espacioNombre !== null ? (
                          <Texto variante="apoyo">{e.espacioNombre}</Texto>
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
                    {corresponde === null ? null : (
                      <View style={{ alignSelf: 'flex-start' }}>
                        <Boton
                          variante="apoyada"
                          etiqueta={t('actaGuarderia.guardarActa')}
                          onPress={() => setActa({ estadia: e, direccion: corresponde })}
                        />
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
      {estado.fase === 'listo' && acta !== null ? (
        <HojaActaGuarderia
          estadia={acta.estadia}
          direccion={acta.direccion}
          prestadorId={estado.prestadorId}
          fecha={hoyLocal()}
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
