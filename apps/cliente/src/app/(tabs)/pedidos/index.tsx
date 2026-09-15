/**
 * ⭐ **ACTIVIDAD — la pantalla propia de la cuarta tab (S116-C · lote 6).**
 *
 * Letra §1.5 y firma **5(b)** del plan del rediseño: *«Actividad = citas +
 * pedidos + postventa, en curso / historial»*. Hasta hoy esta tab se llamaba
 * Actividad en la barra **y abría una lista de pedidos** — el hueco que el
 * lote 5 declaró literal (*«su pantalla propia llega en el lote 6»*).
 *
 * TESIS (Ley 14): **el estado en curso del hogar, en una sola lista.** *Una
 * familia no piensa «pedidos» y «citas» por separado: piensa qué está pasando
 * y qué ya pasó.* Por eso los dos se mezclan por fecha y el corte es temporal,
 * no de categoría.
 *
 * FIRMA (Ley 15): la **pastilla de estado con la palabra** en cada fila, y la
 * **pastilla ciruela de fecha** a la izquierda de las citas (`BadgeFecha` de
 * B, pieza nacida en el lote 2 para exactamente esto).
 *
 * CHANEL (Ley 16): sin número de orden (dato de máquina — vive en el detalle)
 * · sin acciones en la fila salvo la palanca de repetir compra · **sin relleno
 * en el vacío**: el vacío dice que no hay nada y ofrece el único camino real.
 *
 * ── 🔴 LO QUE ESTA PANTALLA PIERDE, Y NO SE PIERDE EN SILENCIO ─────────────
 * **La escalera compacta de la fila** (`TarjetaPedido` con `pasos`), firmada
 * en S100c con su tesis: *«dónde está y cuánto falta, sin abrir nada»*. El
 * encargo del founder para esta pantalla dice **pastilla** —*«cada una con una
 * pastilla de estado (En camino · Agendado · Entregado · Cancelado, con la
 * palabra)»*— y la pieza declara en su propio contrato que los dos juntos
 * *«dibujan dos veces lo mismo»*.
 *
 * **Por qué la pastilla gana acá y no es sólo que la firma sea más nueva:**
 * la escalera nació para una lista de **pedidos solos**, donde las cuatro
 * filas comparten el mismo recorrido. En una lista **mezclada**, una cita no
 * tiene escalera de cuatro nodos, así que la mitad de las filas tendría figura
 * y la otra mitad no — *el mismo «contraste de forma» que B midió cuando un
 * pedido sin recorrido convivía con uno que sí lo tenía, y que se leía como
 * «le falta algo» en vez de «está en otro estado»*.
 *
 * ⚠️ **La escalera NO muere: vive entera en el detalle** (`/pedidos/pedido/…`,
 * intacto). Lo que cambia es que ahora hay que abrir para verla. *Se declara
 * para que, si el recorrido dice que se extraña, volver sea una línea.*
 *
 * ── LOS TOPES, declarados (regla del 6-sep) ───────────────────────────────
 * Pedidos: **30** (el default del lector). Citas en curso: sin tope — el lector
 * hogar-wide trae lo vivo, que es acotado por naturaleza. Citas de historial:
 * **20 por mascota**, la primera página del lector con cursor; *no se pagina
 * todavía y se dice acá, porque un «ver más» que no existe es distinto de un
 * tope que nadie declaró.*
 *
 * ESCALERA (§4b): peldaño 0 = vacío honesto con el personaje · peldaño 1 = las
 * filas con su pastilla · peldaño 2 = el desvío dicho (sin cerrar, cancelada,
 * no llegó) sin drama ni error falso.
 */

import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import {
  HojaContenido,
  Cabecera,
  BadgeFecha,
  Boton,
  CeldaNavegacion,
  FiltroPills,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Personaje,
  Separador,
  TarjetaPedido,
  radius,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  listarMisPedidos,
  resumenDeItemsDePedidos,
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  obtenerCitasActivasHogar,
  obtenerHistorialCitasMascota,
  type PedidoEnLista,
  type ResumenItemsPedido,
  type CitaActivaHogar,
  type CitaHistorialMascota,
} from '@epetplace/api';
import {
  formatearPrecio,
  fechaLargaHumana,
  fechaYHoraHumana,
  fechaConDiaHumana,
  mesYDiaHumanos,
} from '@epetplace/i18n';
import { ventanaVencida } from '@/lib/despensa/ventana';
import { unidadesEnCarrito, useCarrito } from '@/lib/despensa/carrito';
import { vozServicio } from '@/lib/voz-servicio';
import { useTraduccion } from '@/i18n';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';

type Fase<T> = T | 'cargando' | 'error';

/** Citas de historial: la primera página por mascota. Ver el tope declarado
 *  en la cabecera. */
const TOPE_HISTORIAL_POR_MASCOTA = 20;

/** Una cita del historial sabiendo de quién es — el lector es POR MASCOTA y
 *  su shape no trae `mascota_id`, así que se lo pone quien la pidió. */
type CitaHistorialConMascota = CitaHistorialMascota & { mascota_id: string };

/** Lo que la lista dibuja, venga de donde venga. **La mezcla se hace sobre
 *  ESTE tipo y no sobre los dos originales**: *si cada rama ordenara con su
 *  propio campo, «el más próximo arriba» querría decir dos cosas.* */
type Fila = {
  clave: string;
  /** Milisegundos, o `null` cuando la fila NO TIENE fecha todavía (la cita
   *  por coordinar). El nulo **no se rellena con `Date.now()`**: se ordena
   *  aparte, ver `ordenar`. */
  instante: number | null;
  nodo: React.ReactElement;
};

export default function Actividad() {
  const cabecera = useAltoDeCabecera('raiz');
  const { theme } = useTheme();
  const unidadesCarrito = unidadesEnCarrito(useCarrito());
  const { t, idioma } = useTraduccion();

  /* ⭐ EL CORTE ES TEMPORAL Y NO DE CATEGORÍA — los dos chips del encargo.
     `FiltroPills` **sin `onLimpiar`**, que es lo que lo convierte de filtro en
     interruptor: su contrato dice que sin esa prop *«un eje donde algo SIEMPRE
     está activo no debe poder quedarse sin nada»*. *Acá no hay estado «ninguno
     de los dos»: la pantalla siempre está mostrando algo.* */
  const [vista, setVista] = useState<'curso' | 'historial'>('curso');

  const [pedidos, setPedidos] = useState<Fase<PedidoEnLista[]>>('cargando');
  /** Qué trae cada pedido (segunda ola, no encadenada — S100c-D). */
  const [resumen, setResumen] = useState<Record<string, ResumenItemsPedido>>({});
  const [mascotas, setMascotas] = useState<{ id: string; nombre: string }[]>([]);
  const [citas, setCitas] = useState<Fase<CitaActivaHogar[]>>('cargando');
  /**
   * 🔴 EL HISTORIAL DE CITAS SE PIDE TARDE Y A PROPÓSITO — `'sinPedir'` es un
   * estado de verdad, no un `null` cómodo.
   *
   * **El lector unificado NO EXISTE** (pedido a A por buzón): hay
   * `obtenerCitasActivasHogar(ids)` —UNA query hogar-wide— y
   * `obtenerHistorialCitasMascota(id)` **por mascota**. ⇒ el historial cuesta
   * **N viajes**, uno por animal. *Pagarlos al montar castigaría a toda
   * familia que entra a ver lo que está en curso, que es el caso normal.*
   *
   * ⚠️ **Y su primer consumidor es éste**: medido, `estado_historial` tenía
   * **cero menciones** en la app — el lector que A construyó en S114 a pedido
   * de C llevaba dos sesiones sin puerta (`L-318`).
   */
  const [historialCitas, setHistorialCitas] = useState<Fase<CitaHistorialConMascota[]> | 'sinPedir'>(
    'sinPedir',
  );
  /** 🔴 **SI YA SE PIDIÓ, Y EN UNA REF — NO EN EL ESTADO.**
   *
   * La primera versión tenía `historialCitas` en las dependencias del efecto
   * que lo trae, y **se cancelaba a sí mismo**: el efecto ponía `'cargando'`,
   * eso cambiaba una dependencia, el cleanup corría, `vigente` pasaba a falso
   * y la respuesta se descartaba ⇒ **la pantalla quedaba en «Buscando las
   * citas anteriores…» para siempre.**
   *
   * ⚠️ *No fallaba: cargaba.* Ningún typecheck ni gate lo ve — **lo encontró
   * la captura en el aparato**, que es exactamente para lo que la captura es
   * obligatoria. */
  const historialPedido = useRef(false);
  const [reintento, setReintento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setPedidos('cargando');
      setCitas('cargando');
      setResumen({});
      /* El historial vuelve a `sinPedir` y NO se re-pide solo: si la familia
         estaba mirándolo, el efecto de abajo lo trae de nuevo al entrar. */
      historialPedido.current = false;
      setHistorialCitas('sinPedir');

      void listarMisPedidos().then((r) => {
        if (!vigente) return;
        setPedidos(r.ok ? r.data : 'error');
        if (!r.ok || r.data.length === 0) return;
        void resumenDeItemsDePedidos(r.data.map((p) => p.pedido_id)).then((s) => {
          if (!vigente || !s.ok) return;
          const mapa: Record<string, ResumenItemsPedido> = {};
          for (const x of s.data) mapa[x.pedido_id] = x;
          setResumen(mapa);
        });
      });

      void getEstadoOnboardingDueno().then(async (e) => {
        if (!vigente) return;
        /* 🔴 Un FALLO de lectura NO es «no tiene familia» (`L-178`): uno se
           dibuja como error, el otro como hogar que todavía no empezó.
           Confundirlos le diría «no tenés nada» a alguien que sí. */
        if (!e.ok) {
          setMascotas([]);
          setCitas('error');
          return;
        }
        const familiaId = e.data.tiene_familia ? e.data.familia_id : null;
        if (familiaId === null) {
          setMascotas([]);
          setCitas([]);
          return;
        }
        const m = await obtenerMascotasDeFamilia(familiaId);
        if (!vigente) return;
        if (!m.ok) {
          setMascotas([]);
          setCitas('error');
          return;
        }
        const lista = m.data.map((x) => ({ id: x.id, nombre: x.nombre }));
        setMascotas(lista);
        if (lista.length === 0) {
          setCitas([]);
          return;
        }
        const c = await obtenerCitasActivasHogar(lista.map((x) => x.id));
        if (!vigente) return;
        setCitas(c.ok ? c.data : 'error');
      });

      return () => {
        vigente = false;
      };
    }, [reintento]),
  );

  /* El historial de citas: N viajes, uno por mascota, **sólo cuando la vista
     lo pide**. `Promise.all` y no en serie — son independientes.
     🔴 **Un fallo NO tumba la lista**: los pedidos del historial se dibujan
     igual y la pantalla DICE que las citas no llegaron (Ley 13: el fallo se
     dice, jamás se disfraza de «no hay»). */
  useFocusEffect(
    useCallback(() => {
      if (vista !== 'historial' || historialPedido.current || mascotas.length === 0) return;
      historialPedido.current = true;
      let vigente = true;
      setHistorialCitas('cargando');
      void Promise.all(
        mascotas.map((m) =>
          obtenerHistorialCitasMascota(m.id, { limite: TOPE_HISTORIAL_POR_MASCOTA }).then((r) =>
            r.ok ? r.data.citas.map((c) => ({ ...c, mascota_id: m.id })) : null,
          ),
        ),
      ).then((partes) => {
        if (!vigente) return;
        /* Si ALGUNA mascota falló, la lista sería incompleta sin decirlo —
           y una lista incompleta que parece completa es peor que un error
           (`L-139`). Se declara el fallo entero. */
        if (partes.some((p) => p === null)) {
          setHistorialCitas('error');
          return;
        }
        setHistorialCitas(partes.flat() as CitaHistorialConMascota[]);
      });
      return () => {
        vigente = false;
      };
    }, [vista, mascotas]),
  );

  const nombreDe = (mascotaId: string): string =>
    mascotas.find((m) => m.id === mascotaId)?.nombre ?? '';

  // ── LAS VOCES ────────────────────────────────────────────────────────────

  /** La pastilla del pedido. **Sale de las MISMAS voces de la escalera** —son
   *  las siete narrativas del catálogo, ya escritas— así que la palabra que
   *  esta fila muestra es literalmente la que el detalle dibuja en su nodo.
   *  *Un segundo diccionario para el mismo estado diverge el día que alguien
   *  cambie uno.* */
  const pastillaDePedido = (
    p: PedidoEnLista,
  ): { etiqueta: string; tono: 'info' | 'proximo' | 'atencion' } => {
    switch (p.narrativa) {
      /* `pagando` es la ÚNICA de las siete donde la persona tiene algo que
         hacer ⇒ `atencion`; las otras informan (S105-C). */
      case 'pagando':
        return { etiqueta: t('despensa.estadoPendientePago'), tono: 'atencion' };
      case 'confirmado':
        return { etiqueta: t('despensa.pasoConfirmado'), tono: 'info' };
      case 'preparando':
        return { etiqueta: t('despensa.pasoPreparando'), tono: 'info' };
      case 'en_camino':
        return { etiqueta: t('despensa.pasoEnCamino'), tono: 'proximo' };
      case 'entregado':
        return { etiqueta: t('despensa.pasoEntregado'), tono: 'info' };
      case 'no_llego':
        return { etiqueta: t('despensa.desvioNoLlego'), tono: 'atencion' };
      case 'cancelado':
        return { etiqueta: t('despensa.desvioCancelado'), tono: 'info' };
    }
  };

  /** El nombre visible de la cita — la voz del comprable manda; si el código
   *  no está en el mapa cae a la descripción del presupuesto, y sin ninguna
   *  de las dos **se omite** (jamás se pinta el vocabulario del motor: el
   *  fallback del dueño difiere del vet a propósito, D-474). */
  const nombreDeCita = (c: { tipo_servicio: string | null; descripcion_presupuesto: unknown }): string | null => {
    const voz = vozServicio(t, c.tipo_servicio);
    if (voz !== null) return voz;
    const d = c.descripcion_presupuesto as { primera: string | null; extras: number } | null;
    if (d === null || d.primera === null) return null;
    return d.extras > 0
      ? t('citasMascota.procedimientoConExtras', { primera: d.primera, n: d.extras })
      : d.primera;
  };

  // ── LAS FILAS ────────────────────────────────────────────────────────────

  const filaDePedido = (p: PedidoEnLista): Fila => {
    const res = resumen[p.pedido_id];
    const queTrae =
      res === undefined || res.primer_item === null
        ? null
        : res.cuantos_items > 1
          ? t('despensa.pedidoTraeVarios', { producto: res.primer_item, n: res.cuantos_items - 1 })
          : res.primer_item;
    const pastilla = pastillaDePedido(p);
    const nodo = (
      <TarjetaPedido
        key={p.pedido_id}
        /* La miniatura del primer producto — con nueve pedidos del mismo día
           es lo primero que el ojo distingue (S100c-B). **Sin foto no se
           dibuja nada**: un cuadrado vacío en 1 de cada 5 filas se lee como
           caja rota, y el hueco honesto es que no esté. */
        miniatura={
          res?.portada == null ? undefined : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.sm,
                overflow: 'hidden',
                backgroundColor: theme.bg.card,
              }}
            >
              <Image
                source={{ uri: res.portada }}
                contentFit="contain"
                style={{ width: 44, height: 44 }}
                transition={0}
                accessibilityRole="image"
              />
            </View>
          )
        }
        titulo={queTrae ?? t('despensa.pedidoDel', { dia: fechaLargaHumana(p.creado_en, idioma) })}
        detalle={
          [
            queTrae === null
              ? undefined
              : t('despensa.pedidoDel', { dia: fechaLargaHumana(p.creado_en, idioma) }),
            ventanaVencida(p.promesa_hasta, p.narrativa) ? t('despensa.ventanaTardando') : undefined,
          ]
            .filter((x): x is string => x !== undefined)
            .join(' · ') || undefined
        }
        estado={pastilla}
        monto={formatearPrecio(p.total)}
        acento="control"
        etiqueta={t('despensa.verPedido')}
        onPress={() =>
          router.push({ pathname: '/pedidos/pedido/[pedidoId]', params: { pedidoId: p.pedido_id } })
        }
      />
    );
    /* EN CURSO se ordena por CUÁNDO LLEGA (la promesa); el historial, por
       cuándo se movió por última vez. *Ordenar un pedido entregado por su
       promesa lo pondría en el lugar equivocado el día que la promesa no se
       haya cumplido.* */
    const ancla = p.es_terminal ? p.actualizado_en : (p.promesa_desde ?? p.creado_en);
    const ms = Date.parse(ancla);
    return { clave: p.pedido_id, instante: Number.isNaN(ms) ? null : ms, nodo };
  };

  const filaDeCitaActiva = (c: CitaActivaHogar): Fila => {
    const mascota = nombreDe(c.mascota_id);
    const nombre = nombreDeCita(c);
    const cuando = c.fecha === null ? null : fechaYHoraHumana(c.fecha, c.hora, idioma);
    const pastilla: { etiqueta: string; tono: 'info' | 'proximo' | 'atencion' } =
      c.estado === 'en_vivo'
        ? /* 🔴 **NO SE INVENTA UNA SEGUNDA VOZ PARA «En vivo».** §7.1 dice que
             esa voz es ÚNICA y vive en el pill de `CitaEnVivo` (namespace de
             la pieza). Escribir el literal acá sería un segundo lugar donde
             decir lo mismo, que es exactamente lo que §7.1 prohíbe. ⇒ la
             pastilla lleva **la invitación que la casa ya tiene** —«Ver cómo
             va»— y el tono de algo que pide el pulgar. *Dice la verdad sin
             duplicar la palabra.* */
          { etiqueta: t('hogar.verEnVivo'), tono: 'atencion' }
        : c.estado === 'por_coordinar'
          ? { etiqueta: t('actividad.estadoPorCoordinar'), tono: 'atencion' }
          : c.estado === 'hold'
            ? { etiqueta: t('actividad.estadoReservando'), tono: 'proximo' }
            : { etiqueta: t('actividad.estadoAgendado'), tono: 'proximo' };
    const nodo = (
      <TarjetaPedido
        key={c.cita_id}
        /* ⭐ LA PASTILLA CIRUELA DE FECHA — `BadgeFecha` de B, que nació en el
           lote 2 para esto (*«vive a la izquierda de una cita»*). **Sin fecha
           no se dibuja**: una cita por coordinar no tiene día, y un badge con
           el mes vacío sería dibujar un dato que no existe. El slot de la
           tarjeta admite el hueco por contrato. */
        miniatura={
          c.fecha === null ? undefined : (() => {
            const { mes, dia } = mesYDiaHumanos(c.fecha, idioma);
            return <BadgeFecha mes={mes} dia={dia} />;
          })()
        }
        titulo={nombre ?? t('actividad.titulo')}
        detalle={
          cuando === null
            ? [mascota, c.negocio_nombre].filter((x): x is string => !!x).join(' · ') || undefined
            : t('actividad.filaCita', { mascota, cuando })
        }
        estado={pastilla}
        acento="control"
        etiqueta={t('actividad.verCita', { mascota })}
        onPress={() =>
          router.push({
            pathname: '/citas/[mascotaId]',
            params: { mascotaId: c.mascota_id, nombre: mascota, citaId: c.cita_id },
          })
        }
      />
    );
    const ms = c.fecha === null ? null : Date.parse(`${c.fecha}T${(c.hora ?? '12:00').slice(0, 5)}`);
    return { clave: c.cita_id, instante: ms === null || Number.isNaN(ms) ? null : ms, nodo };
  };

  const filaDeCitaPasada = (c: CitaHistorialConMascota): Fila => {
    const mascota = nombreDe(c.mascota_id);
    const nombre = nombreDeCita(c);
    const cuando = c.fecha === null ? null : fechaYHoraHumana(c.fecha, c.hora, idioma);
    const pastilla: { etiqueta: string; tono: 'info' | 'proximo' | 'atencion' } =
      c.estado_historial === 'completada'
        ? { etiqueta: t('actividad.estadoAtendida'), tono: 'info' }
        : c.estado_historial === 'cancelada'
          ? { etiqueta: t('actividad.estadoCancelada'), tono: 'info' }
          : c.estado_historial === 'no_show'
            ? { etiqueta: t('actividad.estadoNoSeRealizo'), tono: 'info' }
            : c.estado_historial === 'pendiente'
              ? { etiqueta: t('actividad.estadoSinConfirmar'), tono: 'info' }
              : /* `confirmada` y pasada: la app **no sabe** si ocurrió. Ver la
                   nota del diccionario — es la fila más común del historial. */
                { etiqueta: t('actividad.estadoSinCerrar'), tono: 'atencion' };
    const nodo = (
      <TarjetaPedido
        key={c.cita_id}
        miniatura={
          c.fecha === null ? undefined : (() => {
            const { mes, dia } = mesYDiaHumanos(c.fecha, idioma);
            return <BadgeFecha mes={mes} dia={dia} />;
          })()
        }
        titulo={nombre ?? t('actividad.titulo')}
        detalle={cuando === null ? (mascota || undefined) : t('actividad.filaCita', { mascota, cuando })}
        estado={pastilla}
        acento="control"
        etiqueta={t('actividad.verCita', { mascota })}
        onPress={() =>
          router.push({
            pathname: '/citas/[mascotaId]',
            params: { mascotaId: c.mascota_id, nombre: mascota, citaId: c.cita_id },
          })
        }
      />
    );
    /* `cerrada_en` es el instante REAL de fin (motor-consistente); la fecha
       suelta es el respaldo cuando la cita no llegó a tener atención. */
    const ancla = c.cerrada_en ?? (c.fecha === null ? null : `${c.fecha}T12:00`);
    const ms = ancla === null ? null : Date.parse(ancla);
    return { clave: c.cita_id, instante: ms === null || Number.isNaN(ms) ? null : ms, nodo };
  };

  /**
   * 🔴 EL ORDEN, y las dos vistas ordenan al revés a propósito.
   *
   * **En curso: lo más próximo arriba** (ascendente) — es lo que el founder
   * pidió y es lo que una familia busca: *qué es lo siguiente.*
   * **Historial: lo más reciente arriba** (descendente) — *«el más próximo»*
   * mirando hacia atrás es lo último que pasó.
   *
   * **Las filas SIN fecha presiden y no se hunden al final**, y eso NO es una
   * excepción nueva: es `§10ter.1` firmada para «Ponte al día» — *las por
   * coordinar no tienen tiempo, presiden y no colapsan, porque colapsar
   * acciones esconde trabajo pendiente.* Rellenar su nulo con `Date.now()`
   * las habría mezclado entre las fechadas, que es la forma silenciosa del
   * mismo error.
   */
  const ordenar = (filas: Fila[], sentido: 'asc' | 'desc'): Fila[] =>
    [...filas].sort((a, b) => {
      if (a.instante === null && b.instante === null) return 0;
      if (a.instante === null) return -1;
      if (b.instante === null) return 1;
      return sentido === 'asc' ? a.instante - b.instante : b.instante - a.instante;
    });

  // ── EL CUERPO ────────────────────────────────────────────────────────────

  const cargando = pedidos === 'cargando' || citas === 'cargando';
  /**
   * 🔴 **LOS DOS GRADOS DE FALLO, Y EL HUECO QUE HABÍA ENTRE ELLOS.**
   *
   * La primera versión sólo tenía `todoFallo` y dibujaba el vacío en cuanto
   * quedaban cero filas ⇒ **con los pedidos en cero y las citas caídas, la
   * pantalla decía «Todavía no tienes nada en curso»** — una afirmación sobre
   * algo que no pudo leer. *«No hay» y «no pude ver» son dos hechos distintos,
   * y el que se dibuja es el que la familia cree.*
   *
   * ⚠️ **Lo destapó la captura, no un gate**: el emulador se quedó sin DNS a
   * mitad de la sesión y la pantalla salió perfecta y mintiendo. Ningún
   * typecheck ve esto — el estado `'error'` existía y se estaba ignorando.
   */
  const todoFallo = pedidos === 'error' && citas === 'error';
  const algoFallo = pedidos === 'error' || citas === 'error';

  const listaPedidos = Array.isArray(pedidos) ? pedidos : [];
  const listaCitas = Array.isArray(citas) ? citas : [];

  const filasCurso = ordenar(
    [
      ...listaPedidos.filter((p) => !p.es_terminal).map(filaDePedido),
      ...listaCitas.map(filaDeCitaActiva),
    ],
    'asc',
  );

  const pedidosTerminales = listaPedidos.filter((p) => p.es_terminal);
  const citasPasadas = Array.isArray(historialCitas) ? historialCitas : [];
  const filasHistorial = ordenar(
    [...pedidosTerminales.map(filaDePedido), ...citasPasadas.map(filaDeCitaPasada)],
    'desc',
  );

  const filas = vista === 'curso' ? filasCurso : filasHistorial;

  const cuerpo = () => {
    if (cargando) {
      return (
        <EsqueletoGrupo>
          <View style={{ gap: spacing[3], paddingHorizontal: spacing[5] }}>
            <Esqueleto forma="bloque" ancho="100%" alto={96} />
            <Esqueleto forma="bloque" ancho="100%" alto={96} />
          </View>
        </EsqueletoGrupo>
      );
    }
    /* Con algo caído y nada que mostrar, **manda el fallo**: es lo único
       cierto que se puede decir. */
    if (todoFallo || (algoFallo && filas.length === 0)) {
      return (
        <EstadoVacio
          titulo={t('actividad.errorTitulo')}
          descripcion={t('actividad.errorDetalle')}
          accion={
            <Boton
              variante="secundario"
              etiqueta={t('hogar.reintentar')}
              onPress={() => setReintento((n) => n + 1)}
            />
          }
        />
      );
    }
    /* 🔴 **EL VACÍO NO SE DIBUJA MIENTRAS FALTA UNA FUENTE.** Sin esto, el
       historial decía «Todavía no hay nada para mirar atrás» **al lado de**
       «Buscando las citas anteriores…»: una afirmación y su desmentido en la
       misma pantalla. *«No hay» y «todavía no sé» son dos cosas distintas, y
       la que se dibuja primero es la que la familia cree.* */
    if (vista === 'historial' && historialCitas === 'cargando' && filas.length === 0) {
      return null;
    }
    if (filas.length === 0) {
      /* ⭐ EL VACÍO HONESTO CON EL PERSONAJE — encargo del founder, *«sin
         relleno»*: dice qué no hay, y ofrece UN camino, el que existe.
         ⚠️ **La especie es fija y no la de la mascota, y es un préstamo
         declarado**: la tabla que traduce las ONCE especies del catálogo a
         las SEIS del personaje vive dentro de `AvatarMascota` (`CARA_LOCAL`)
         y **no está exportada** — pedido a B ya en el buzón del lote 8.
         *Escribirla acá sería la TERCERA copia, y tres tablas de lo mismo
         divergen.* Mismo criterio que el vacío del Hogar. */
      return (
        <EstadoVacio
          icono={<Personaje especie="perro" tamano="grande" fondo="rosa" />}
          titulo={
            vista === 'curso' ? t('actividad.vacioCursoTitulo') : t('actividad.vacioHistorialTitulo')
          }
          descripcion={
            vista === 'curso'
              ? t('actividad.vacioCursoDetalle')
              : t('actividad.vacioHistorialDetalle')
          }
          accion={
            vista === 'curso' ? (
              <Boton
                variante="secundario"
                etiqueta={t('explorar.titulo')}
                onPress={() => router.push('/explorar')}
              />
            ) : undefined
          }
        />
      );
    }
    return (
      <View style={{ paddingHorizontal: spacing[5], gap: spacing[4] }}>
        {filas.map((f) => (
          <View key={f.clave} style={{ gap: spacing[2] }}>
            {f.nodo}
            {/* 🔴 PEDIR DE NUEVO — la palanca comercial de esta casa, firmada
                por el founder (S100d): *en comida de mascota la compra es
                CÍCLICA*. **Sólo en entregados** —ofrecer repetir un pedido
                cancelado sería ofrecer repetir algo que no pasó— y **sólo con
                `producto_id`**: su `null` significa que el producto ya no está
                publicado, y una puerta que rebota es peor que ninguna
                (Ley 23). */}
            {(() => {
              const p = pedidosTerminales.find((x) => x.pedido_id === f.clave);
              const pid = p === undefined ? null : (resumen[p.pedido_id]?.producto_id ?? null);
              return p !== undefined && p.narrativa === 'entregado' && pid !== null ? (
                <Boton
                  variante="secundario"
                  etiqueta={t('despensa.pedirDeNuevo')}
                  onPress={() =>
                    router.push({
                      pathname: '/despensa/producto/[productoId]',
                      params: { productoId: pid },
                    })
                  }
                />
              ) : null;
            })()}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* LA ESTRUCTURA FIRMADA: fondo ciruela (`presentacion="fondo"`, sin
          radio inferior ni sombra) + `HojaContenido` encima con las esquinas
          de ARRIBA redondeadas, que desliza sobre el fondo al scrollear. */}
      <HojaContenido
        arranque={cabecera.arranque}
        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera
              variante="raiz"
              /* El antetítulo del día, la misma voz del Hogar — y desde este
                 lote la misma FUNCIÓN, que subió al riel en vez de clonarse. */
              antetitulo={fechaConDiaHumana(new Date(), idioma)}
              antetituloVoz="dato"
              titulo={t('actividad.titulo')}
              /* El carrito SE CONSERVA: firma S100d-bis —*«mientras tenga
                 productos debe estar visible en TODA la app»*—. La tab dejó de
                 llamarse Pedidos; esa firma no cambió. */
              carrito={{
                cantidad: unidadesCarrito,
                onPress: () => router.push('/despensa/carrito'),
                etiqueta: t('despensa.abrirCarrito', { count: unidadesCarrito }),
              }}
              presentacion="fondo"
            />
          </View>
        }
      >
        {/* El relleno va ADENTRO de la hoja: en `HojaContenido` el estilo del
            contenedor envuelve A LA HOJA, no a su contenido. */}
        <View style={{ paddingTop: spacing[2], paddingBottom: spacing[8], gap: spacing[4] }}>
          <FiltroPills
            opciones={[
              { codigo: 'curso' as const, etiqueta: t('actividad.chipEnCurso'), icono: null },
              { codigo: 'historial' as const, etiqueta: t('actividad.chipHistorial'), icono: null },
            ]}
            activo={vista}
            onCambio={(c: 'curso' | 'historial') => setVista(c)}
            disposicion="envuelve"
          />

          {/* El historial de citas tarda o falla sin tumbar la lista — y lo
              DICE (Ley 13). */}
          {vista === 'historial' && historialCitas === 'cargando' ? (
            <View style={{ paddingHorizontal: spacing[5] }}>
              <Texto variante="apoyo">{t('actividad.historialCitasCargando')}</Texto>
            </View>
          ) : null}
          {/* Fallo PARCIAL con filas dibujadas: se muestran las que llegaron
              y se dice que falta el resto. */}
          {algoFallo && filas.length > 0 ? (
            <View style={{ paddingHorizontal: spacing[5] }}>
              <Texto variante="apoyo">{t('actividad.parcialFallo')}</Texto>
            </View>
          ) : null}
          {vista === 'historial' && historialCitas === 'error' ? (
            <View style={{ paddingHorizontal: spacing[5] }}>
              <Texto variante="apoyo">{t('actividad.historialCitasFallo')}</Texto>
            </View>
          ) : null}

          {cuerpo()}

          {/* EL ACCESO DEL LOCAL — el founder lo pidió adentro de esta casa, y
              vive acá y no sólo en el vacío: *una entrada que existe sólo
              cuando no tenés nada es una entrada que nadie encuentra el día
              que la necesita.* */}
          <View style={{ paddingTop: spacing[2] }}>
            <Separador />
            <CeldaNavegacion
              titulo={t('despensa.reclamoEntrada')}
              detalle={t('despensa.reclamoEntradaDetalle')}
              onPress={() => router.push('/despensa/reclamo')}
            />
          </View>
        </View>
      </HojaContenido>
    </View>
  );
}
