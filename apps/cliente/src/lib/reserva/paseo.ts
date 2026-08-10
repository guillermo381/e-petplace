/**
 * EL FLUJO DE RESERVA DEL PASEO — una fuente, dos consumidores.
 *
 * ── POR QUÉ ÉSTE ES DISTINTO DE SUS TRES HERMANOS ──────────────────────────
 * Grooming, adiestramiento y veterinaria son `oferta → hold → checkout`, y sus
 * hooks no tienen estado propio salvo el del selector de persona. **El paseo
 * es el único oficio donde la mascota se elige en el ÚLTIMO paso**, y de ahí
 * sale todo lo demás: hay que saber qué mascotas tiene el hogar, cuáles pueden
 * pasear, si respondieron la pregunta social, si hay saldo de paquete y si esto
 * es un plan. **Seis Hojas y trece estados**, contra ninguno de los otros.
 *
 * Por eso D-730 midió y dijo, textual, *«el flujo pesado es SOLO DEL PASEO»* —
 * y por eso este archivo existe: para que ese peso viva UNA vez y no dos.
 *
 * ── 🔴 LO QUE ESTE ARCHIVO TIENE QUE CONSERVAR, Y ES LA CURA DE UN P0 ──────
 * Este flujo se cayó **tres veces** en S92-BIS, con síntoma distinto cada vez, y
 * su cura fue estructural. Al mudarlo, la cura se muda ENTERA:
 *
 *  ① **EL ESPEJO VIVO.** `alElegir` y `alElegirMascota` leen `mascotasRef.current`
 *     y `faseEspeciesRef.current`, refs que se pisan en CADA render — jamás el
 *     valor capturado en el closure. La causa medida del P0 fue exactamente eso:
 *     un efecto con deps `[disponibles]` capturaba un `alElegir` de un render
 *     donde `mascotas` todavía era `'cargando'`, y lo ejecutaba **con seis
 *     mascotas ya cargadas**. *Datos presentes, semáforo en rojo — y la falla no
 *     era el semáforo: era mirar la foto de un semáforo viejo.*
 *  ② **LOS TRES ESTADOS, NUNCA UN ARRAY.** `mascotas` es `[] | 'cargando' |
 *     'error'`, porque `ofrecibles()` devuelve `[]` en las tres situaciones y
 *     decidir por el largo le decía *«no tenés un perro registrado»* a alguien
 *     con dos perros vivos (L-218, y R34 de `verify:diseno` lo vigila).
 *  ③ **LOS MODALES SE DERIVAN, NO SE COPIAN.** `catalogoNoLlego` y
 *     `mascotasNoLlegaron` se calculan en cada render desde la fase VIVA. La
 *     versión que guardaba una copia de la fase dejó un cartel encendido para
 *     siempre. *Un estado derivado de otro estado es una copia, y toda copia
 *     diverge.*
 *  ④ **EL TECHO DE 8 s** y el `reintento` que de verdad re-pide.
 *
 * *Nada de esto es adorno del archivo viejo: es lo que costó tres tandas.
 * Quien toque este hook lo lee antes.*
 *
 * ── LA PROPIEDAD QUE COMPARTE CON SUS HERMANOS ─────────────────────────────
 * La oferta entra como ARGUMENTO de `alElegir(p)`. El hook **no lee la lista de
 * paseadores**: no la conoce. Lo que sí posee es el HOGAR, y lo posee porque el
 * flujo lo necesita — pero lo lee siempre por el espejo, que es la razón por la
 * que poseerlo dejó de ser peligroso.
 */

import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useAviso } from '@epetplace/ui';
import {
  crearBloqueoAgenda,
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  obtenerSaldoPaquete,
  reservarSalidaPaquete,
  resolverUrlFoto,
  type MascotaResumen,
  type PaseadorDisponible,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';

export interface ContextoPaseo {
  fecha: string;
  hora: string;
  duracion: number;
  /** D-338: modo PLAN — el paseador elegido ancla el plan (§6.1 v1.2). */
  modoPlan: boolean;
  /** S61-A3: la mascota puede venir elegida del paso 0 del CUÁNDO. */
  mascotaIdParam: string | null;
}

/**
 * EL HOGAR ELEGIBLE — la mitad que las dos superficies necesitan **por
 * separado**, y por eso es un hook aparte.
 *
 * ── POR QUÉ SE PARTIÓ EN DOS, y es un hallazgo de esta misma tanda ─────────
 * Al mudar el flujo salió a la luz algo que el archivo viejo escondía: **en la
 * lista, `alElegir` tenía UN solo llamador — el efecto que consumía el pedido
 * que volvía de la ficha.** Desde la anatomía Airbnb de S91-C la fila no
 * reserva: abre el perfil. *O sea que el flujo entero vivía en la lista para
 * servirle a la ficha, que era la que de verdad reservaba y no podía.*
 *
 * Con D-730, la ficha reserva sola ⇒ **la lista deja de necesitar el flujo**.
 * Lo único que le queda es el hogar, y no para reservar: para poder decir
 * «la ventana para {nombre}» en su encabezado.
 *
 * Dejarle el flujo entero habría sido más rápido y habría dejado seis Hojas
 * montadas que **ya no puede abrir nadie** — la clase de código que sigue
 * pareciendo vivo hasta que alguien lo toca.
 */
export function useHogarPaseo() {
  /** 🔴 LAS MASCOTAS TIENEN TRES ESTADOS (ver ② de la cabecera). Un array
   *  colapsaría el fallo en «no tenés perros», que es una afirmación sobre el
   *  hogar de alguien hecha sobre una lectura que falló. */
  const [mascotas, setMascotas] = useState<MascotaResumen[] | 'cargando' | 'error'>('cargando');
  const [fotos, setFotos] = useState<Record<string, string>>({});
  /** Qué INTENTÓ hacer la persona — jamás una copia de la fase (③). */
  const [intentoSinDatos, setIntentoSinDatos] = useState<'catalogo' | 'mascotas' | null>(null);
  /** Cambiarlo re-dispara la lectura del hogar: sin esto, «Reintentar» solo
   *  pondría el estado en `cargando` y nadie volvería a pedir nada. */
  const [reintento, setReintento] = useState(0);
  /** Marca que el hogar ya se leyó en esta visita. Es un `ref` y no estado A
   *  PROPÓSITO — meterlo en las dependencias del efecto sería fabricar el
   *  bucle que se está curando. */
  const hogarCargadoRef = useRef(false);

  // S73 (letra de elegibilidad): frontera única — momento vital + especie.
  const faseEspecies = useEspeciesElegibles('paseo');
  const elegibles = ofrecibles(Array.isArray(mascotas) ? mascotas : [], faseEspecies);

  /* ═══ EL ESPEJO VIVO (① de la cabecera) — se pisa en CADA render, así que
     quien lo lea ve la verdad de ahora sin importar de qué render venga su
     clausura. No hay segunda fuente de verdad: el estado sigue siendo uno y
     esto es su espejo, no una copia con vida propia. */
  const mascotasRef = useRef(mascotas);
  mascotasRef.current = mascotas;
  const faseEspeciesRef = useRef(faseEspecies);
  faseEspeciesRef.current = faseEspecies;

  /* LOS DOS MODALES DE ESPERA, DERIVADOS DE LA FASE VIVA (③): se calculan en
     cada render, así que **cuando el dato llega el modal se apaga solo**. */
  const catalogoNoLlego: 'cargando' | 'error' | null =
    intentoSinDatos === 'catalogo' && faseEspecies.fase !== 'listo' ? faseEspecies.fase : null;
  const mascotasNoLlegaron: 'cargando' | 'error' | null =
    intentoSinDatos === 'mascotas' && !Array.isArray(mascotas) ? mascotas : null;

  /* ═══ LA LECTURA DEL HOGAR ═══════════════════════════════════════════════
   * Vive acá y no en una pantalla porque **las dos la necesitan, para cosas
   * distintas**: la ficha para elegir mascota al reservar, y la lista solo para
   * decir «la ventana para {nombre}» en su encabezado.
   *
   * CURA 2 (S92-BIS): el hogar NO se vuelve a pedir si ya está. Tus mascotas no
   * cambian entre que abrís una hoja y la cerrás, y abrir un `Modal` de React
   * Native provoca blur del screen — que `useFocusEffect` lee como salida.
   * «Reintentar» limpia la marca y vuelve a pedir de verdad. */
  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      if (hogarCargadoRef.current) {
        return () => {
          vigente = false;
        };
      }

      /* TECHO DE ESPERA — convierte un cuelgue en un error VISIBLE. No es la
         cura: es la RED. Ocho segundos es holgado contra los ~650 ms que mide
         el camino real: si a los 8 s no llegó, no va a llegar. */
      const techo = setTimeout(() => {
        if (!vigente) return;
        setMascotas((prev) => (prev === 'cargando' ? 'error' : prev));
      }, 8000);

      void (async () => {
        /* ☠️ ACÁ VIVÍAN LOS DOS `return` MUDOS QUE REABRIERON EL P0: el fallo se
           degradaba a lista vacía en silencio. Ahora cada rama dice qué pasó, y
           `!vigente` se separa del fallo real — irse de la pantalla NO es un
           error y no debe pintar uno. */
        const estado = await getEstadoOnboardingDueno();
        if (!vigente) return;
        if (!estado.ok || !estado.data.familia_id) {
          setMascotas('error');
          return;
        }
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente) return;
        clearTimeout(techo);
        // Solo se marca como cargado si de verdad llegó: un fallo tiene que
        // poder reintentarse en el próximo foco.
        if (r.ok) hogarCargadoRef.current = true;
        setMascotas(r.ok ? r.data : 'error');
        if (r.ok) {
          const conFoto = r.data.filter((m): m is MascotaResumen & { foto_url: string } => m.foto_url !== null);
          if (conFoto.length > 0) {
            const urls = await Promise.all(conFoto.map((m) => resolverUrlFoto(m.foto_url)));
            if (!vigente) return;
            const mapa: Record<string, string> = {};
            conFoto.forEach((m, idx) => {
              const u = urls[idx];
              if (u !== null) mapa[m.id] = u;
            });
            setFotos(mapa);
          }
        }
      })();
      return () => {
        clearTimeout(techo);
        vigente = false;
      };
      // `reintento` está en las deps A PROPÓSITO: es lo que vuelve a disparar
      // la lectura del hogar cuando la persona toca «Reintentar».
    }, [reintento]),
  );

  /** Reintentar DE VERDAD el hogar: se limpia la marca de la cura 2. */
  const reintentarHogar = useCallback(() => {
    setIntentoSinDatos(null);
    hogarCargadoRef.current = false;
    setMascotas('cargando');
    setReintento((n) => n + 1);
  }, []);

  const reintentarCatalogo = useCallback(() => {
    setIntentoSinDatos(null);
    setReintento((n) => n + 1);
  }, []);

  return {
    mascotas,
    setMascotas,
    fotos,
    elegibles,
    mascotasRef,
    faseEspeciesRef,
    intentoSinDatos,
    setIntentoSinDatos,
    catalogoNoLlego,
    mascotasNoLlegaron,
    cerrarIntento: () => setIntentoSinDatos(null),
    reintentarHogar,
    reintentarCatalogo,
  };
}

export function useReservaPaseo(ctx: ContextoPaseo, alConflicto?: () => void) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const hogar = useHogarPaseo();
  const { mascotasRef, faseEspeciesRef, setMascotas, setIntentoSinDatos } = hogar;

  const [eligiendoMascota, setEligiendoMascota] = useState<PaseadorDisponible | null>(null);
  const [sinElegibles, setSinElegibles] = useState(false);
  const [creandoHold, setCreandoHold] = useState(false);
  const [plan, setPlan] = useState<{ paseador: PaseadorDisponible; mascotaId: string } | null>(null);
  /** §6bis.3: con saldo del ancla, el dueño ELIGE — reservar contra el paquete
   *  o pagar suelto. Opciones PAREJAS, cero dark patterns. */
  const [conSaldo, setConSaldo] = useState<{ paseador: PaseadorDisponible; mascotaId: string; saldo: number } | null>(null);
  const [reservando, setReservando] = useState(false);
  /** P19: la pregunta única salta ANTES del checkout cuando la mascota aún no
   *  respondió (null); el NO frena con voz honesta con camino — el guard
   *  server (`paseo_social_no`) es el cinturón. */
  const [preguntaSocial, setPreguntaSocial] = useState<{ paseador: PaseadorDisponible; mascota: MascotaResumen } | null>(null);
  const [socialNo, setSocialNo] = useState<string | null>(null);

  // El hold nace acá: invisible al prestador hasta que el pago confirme.
  const crearHold = useCallback(
    async (p: PaseadorDisponible, mascotaId: string) => {
      if (creandoHold) return;
      setCreandoHold(true);
      const r = await crearBloqueoAgenda({
        prestador_id: p.prestador_id,
        prestador_servicio_id: p.prestador_servicio_id,
        mascota_id: mascotaId,
        fecha: ctx.fecha,
        hora: ctx.hora,
      });
      setCreandoHold(false);
      setEligiendoMascota(null);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') alConflicto?.();
        return;
      }
      router.push({
        pathname: '/explorar/paseo/checkout',
        params: {
          citaId: r.data.cita_id,
          expiraEn: r.data.expira_en,
          precio: String(r.data.precio),
          prestadorNombre: p.prestador_nombre,
          servicioNombre: p.servicio_nombre,
          fecha: r.data.fecha,
          hora: r.data.hora,
          duracion: String(p.duracion_minutos),
        },
      });
    },
    [creandoHold, ctx.fecha, ctx.hora, alConflicto, mostrar],
  );

  // Reservar CONTRA SALDO: la cita nace firme sin pago (el pago fue el del
  // paquete — invariante ampliado S57). Éxito → Go home (D-430: la salida de
  // reserva aterriza en el Hogar como el suelto, NO en el hub).
  const reservarConSaldo = useCallback(
    async (p: PaseadorDisponible, mascotaId: string) => {
      if (reservando) return;
      setReservando(true);
      const r = await reservarSalidaPaquete({
        prestador_id: p.prestador_id,
        prestador_servicio_id: p.prestador_servicio_id,
        mascota_id: mascotaId,
        fecha: ctx.fecha,
        hora: ctx.hora,
      });
      setReservando(false);
      setConSaldo(null);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') alConflicto?.();
        return;
      }
      mostrar({ texto: t('paquete.reservada', { n: r.data.saldo_restante }), variante: 'exito' });
      if (router.canDismiss()) router.dismissAll();
      router.navigate('/hogar');
    },
    [reservando, ctx.fecha, ctx.hora, alConflicto, mostrar, t],
  );

  // La continuación real (plan / saldo / hold) — P19 ya resuelta.
  const continuarConMascota = useCallback(
    (p: PaseadorDisponible, mascotaId: string) => {
      if (ctx.modoPlan) {
        // S79 + Ley 23: la puerta no ofrece lo que el server va a rechazar —
        // sin precio mensual declarado, contratar rebota `plan_no_ofrecido`;
        // la Hoja no se abre y la voz da el camino.
        if (p.precio_mensual_plan === null) {
          mostrar({ texto: t('plan.noOfrecido'), variante: 'error' });
          return;
        }
        setPlan({ paseador: p, mascotaId });
        return;
      }
      // ¿hay saldo de paquete DEL HOGAR con este ancla? El dueño elige (§6bis.3).
      void (async () => {
        const saldo = await obtenerSaldoPaquete({
          prestador_id: p.prestador_id,
          prestador_servicio_id: p.prestador_servicio_id,
        });
        if (saldo.ok && saldo.data !== null && saldo.data.saldo > 0) {
          setConSaldo({ paseador: p, mascotaId, saldo: saldo.data.saldo });
        } else {
          void crearHold(p, mascotaId);
        }
      })();
    },
    [ctx.modoPlan, crearHold, mostrar, t],
  );

  // P19 — la puerta: sin responder = pregunta única; NO = voz honesta con
  // camino y la reserva NO avanza (el guard server es el cinturón).
  const alElegirMascota = useCallback(
    (p: PaseadorDisponible, mascotaId: string) => {
      /* Del ESPEJO VIVO, por la misma razón que `alElegir`. Esta función
         además **usaba `elegibles` sin declararlo** en sus dependencias: leía
         un valor del render capturado mientras decía depender de `mascotas`.
         *Una dependencia que no se declara es una foto vieja esperando su
         turno.* */
      const vivas = mascotasRef.current;
      const m = ofrecibles(Array.isArray(vivas) ? vivas : [], faseEspeciesRef.current).find(
        (x) => x.id === mascotaId,
      );
      if (m !== undefined && m.paseo_social_ok === null) {
        setPreguntaSocial({ paseador: p, mascota: m });
        return;
      }
      if (m !== undefined && m.paseo_social_ok === false) {
        setSocialNo(m.nombre);
        return;
      }
      continuarConMascota(p, mascotaId);
    },
    [continuarConMascota],
  );

  const alElegir = useCallback(
    (p: PaseadorDisponible) => {
      /* ⚠️ TODO lo que decide se lee del ESPEJO VIVO, jamás del closure — ver
         ① de la cabecera. `elegiblesVivos` se DERIVA acá de esos dos valores:
         con el `elegibles` del render capturado, la cura duraría hasta el
         próximo camino que llegue con una clausura vieja.
         ⚠️ Los tres guards van SEGUIDOS y sin comentarios en el medio a
         propósito: R34 mira las 12 líneas previas para reconocer el guard de
         fase, y un comentario largo entre un guard y su consecuencia rompe la
         lectura — la del humano y la del instrumento. */
      const mascotasVivas = mascotasRef.current;
      const faseViva = faseEspeciesRef.current;
      const elegiblesVivos = ofrecibles(Array.isArray(mascotasVivas) ? mascotasVivas : [], faseViva);
      if (faseViva.fase === 'cargando' || faseViva.fase === 'error') {
        setIntentoSinDatos('catalogo');
        return;
      }
      if (!Array.isArray(mascotasVivas)) {
        setIntentoSinDatos('mascotas');
        return;
      }
      if (elegiblesVivos.length === 0) {
        setSinElegibles(true);
        return;
      }
      // S61-A3: la gramática canónica ya trae la mascota del paso 0.
      if (ctx.mascotaIdParam !== null && elegiblesVivos.some((m) => m.id === ctx.mascotaIdParam)) {
        alElegirMascota(p, ctx.mascotaIdParam);
        return;
      }
      if (elegiblesVivos.length === 1) {
        alElegirMascota(p, elegiblesVivos[0].id);
      } else {
        setEligiendoMascota(p);
      }
    },
    /* ⚠️ `mascotas`, `faseEspecies` y `elegibles` NO son dependencias: se leen
       del espejo vivo, así que esta función **no envejece**. Eso es la cura, no
       una optimización — antes cambiaba de identidad con cada carga y cualquier
       efecto que la hubiera capturado se quedaba con la foto vieja. */
    [ctx.mascotaIdParam, alElegirMascota],
  );

  /** P19: el SÍ actualiza la mascota en memoria y sigue; el NO frena.
   *  Solo se actualiza si HAY lista: con el estado en `cargando`/`error` no hay
   *  nada que parchear y fabricar un array acá inventaría datos. */
  const responderSocial = useCallback(
    (ok: boolean) => {
      if (preguntaSocial === null) return;
      const { paseador, mascota } = preguntaSocial;
      setMascotas((prev) =>
        Array.isArray(prev) ? prev.map((m) => (m.id === mascota.id ? { ...m, paseo_social_ok: ok } : m)) : prev,
      );
      setPreguntaSocial(null);
      if (ok) continuarConMascota(paseador, mascota.id);
      else setSocialNo(mascota.nombre);
    },
    [preguntaSocial, continuarConMascota],
  );

  return {
    // el hogar, tal cual lo entrega su hook (las Hojas lo pintan)
    ...hogar,
    // la puerta
    alElegir,
    alElegirMascota,
    // estado de las Hojas
    eligiendoMascota,
    cerrarEligiendoMascota: () => setEligiendoMascota(null),
    plan,
    cerrarPlan: () => setPlan(null),
    conSaldo,
    cerrarConSaldo: () => setConSaldo(null),
    preguntaSocial,
    cerrarPreguntaSocial: () => setPreguntaSocial(null),
    responderSocial,
    socialNo,
    cerrarSocialNo: () => setSocialNo(null),
    sinElegibles,
    cerrarSinElegibles: () => setSinElegibles(false),
    // acciones
    crearHold,
    reservarConSaldo,
    creandoHold,
    reservando,
  };
}
