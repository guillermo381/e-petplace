/**
 * GUARDERÍA · **ELEGIR CÓMO Y CUÁNDO** — la pantalla que decide todo antes de
 * ver un solo lugar (S107-C, reestructura firmada 29-ago).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA SECUENCIA, firmada por el founder:
 *   ① modalidad → ② lo que ESA modalidad necesita → ③ el día
 *   → ④ el valor y si hay quién → ⑤ «Ver quién puede», que es UN BOTÓN
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⏪ **QUÉ ESTABA MAL ANTES, y es de secuencia, no de estilo:** esta pantalla
 * **mostraba la lista de lugares antes de que la familia hubiera elegido nada**.
 * *Una lista que aparece antes de la pregunta obliga a leerla dos veces: una
 * para entender qué es, otra cuando ya significa algo.* La lista se fue a
 * `disponibles`, que es su pantalla.
 *
 * ── 🔴 NADA SE MUESTRA HASTA QUE HAYA ELECCIÓN ───────────────────────────
 * Sin modalidad no hay día; sin día no hay valor ni botón. **Cada paso aparece
 * cuando el anterior se contestó** — *la revelación progresiva no es adorno:
 * es que una pantalla no puede preguntar cinco cosas a la vez sin que la
 * familia adivine cuál importa primero.*
 *
 * ── LOS REQUISITOS SON INFORMATIVOS, Y ESO ES UNA FIRMA ──────────────────
 * Viven **debajo del selector de fecha en los tres caminos** y **no habilitan
 * ni deshabilitan nada** mientras el gate esté apagado (`requisitos.bloquea`,
 * hoy `false` — `D-968`). *Lo único que gobierna el botón es que existan
 * prestadores para (modalidad, día, radio, especie).*
 *
 * ── 🔴 LEY 23: LA CAUSA SE VE SIN TOCAR EL BOTÓN ─────────────────────────
 * Cuando no hay ninguno, **el mensaje está a la vista** — no detrás de un
 * `razonDeshabilitado` que exige apretar una puerta cerrada para saber por qué
 * lo está.
 *
 * ⚠️ **UNA DIVERGENCIA DECLARADA:** el founder pidió el mensaje **debajo** del
 * botón. El botón vive en `PieReserva`, que es **fijo al borde inferior**, y
 * **debajo de él no hay lugar donde algo pueda vivir**. Queda **inmediatamente
 * encima**, que cumple lo que la firma persigue —*visible sin tocarlo*— y no
 * la letra. *Si la letra manda, el pie deja de ser fijo en esta pantalla; es
 * un cambio chico y no lo tomo por mi cuenta.*
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Esqueleto,
  EsqueletoGrupo,
  SelectorDia,
  SelectorOpcion,
  SelectorSegmentado,
  SemaforoSanitario,
  type RequisitoSanitario,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  evaluarRequisitosGuarderia,
  obtenerResumenGuarderias,
  type CausaSinGuarderias,
  type RequisitosGuarderia,
} from '@epetplace/api';
import { obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { CabezalOficio, PieReserva } from '@/components/reserva-piezas';
import {
  MODALIDADES_ABIERTAS,
  TAMANOS_PAQUETE,
  type ModalidadGuarderia,
  type TamanoPaqueteGuarderia,
} from '@/lib/guarderia-modalidad';

/** Fecha LOCAL. 🔴 Jamás `toISOString()`: en Guayaquil, después de las 19:00,
 *  devuelve el día siguiente. */
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * ✅ **EL RESUMEN DE A YA EXISTE** (`obtenerResumenGuarderias`) — *«una sola
 * consulta devuelve las tres cosas: el precio más bajo, si hay lugares, y la
 * causa si no hay»*.
 *
 * ── 🔴 LAS CUATRO CONDICIONES QUE A DEJÓ ESCRITAS, Y CÓMO SE HONRAN ──────
 *
 * ① **`cuantos > 0 ⟺ causa === null`. Nunca vienen los dos.** ⇒ acá **no se
 *    escribe lógica para el caso imposible**: se pregunta por la causa y basta.
 *    *Un `if` que contempla un estado que el motor no puede producir es código
 *    que nadie va a poder probar y que igual hay que leer para siempre.*
 *
 * ② **`precioDesde` es `null`, jamás `0`.** Si es `null`, **no se pinta nada** —
 *    *un cero se leería como GRATIS.*
 *
 * ③ 🔴 **LA VÍSPERA NO ES UNA CAUSA.** Con `fecha <= hoy` el lector **lanza
 *    `fecha_no_ofertable`**, y se trata **aparte del botón apagado**:
 *    *ofrecerle «prueba con otro día» a quien pidió HOY sería mandarlo a
 *    cambiar lo que estaba bien.* Se le explica **la regla** —se reserva con un
 *    día de anticipación—, que es lo que de verdad no sabía. El `SelectorDia`
 *    ya no ofrece hoy; esto es **el cinturón del server**.
 *
 * ④ **`sin_cobertura` sólo puede venir si se manda `lat`/`lon`.** Esta pantalla
 *    **no manda ubicación todavía**, así que esa etapa no descarta a nadie y
 *    **esa causa no puede aparecer**. Su voz está mapeada para el día que la
 *    ubicación viaje, y **se declara que hoy es inalcanzable** — *escribirla
 *    como si pudiera salir haría creer que ya cubrimos un caso que ni siquiera
 *    se evalúa.*
 */
type Resumen =
  | { fase: 'ocioso' }
  | { fase: 'cargando' }
  | { fase: 'error' }
  /** ③ — su propio estado, no una causa. */
  | { fase: 'vispera' }
  | { fase: 'listo'; cuantos: number; precioDesde: number | null; causa: CausaSinGuarderias | null };

export default function ElegirGuarderia() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const idioma = obtenerIdiomaActual();
  const params = useLocalSearchParams<{ mascotaId?: string; mascotaNombre?: string }>();

  const mascotaId = typeof params.mascotaId === 'string' && params.mascotaId.length > 0
    ? params.mascotaId
    : null;

  /* 🔴 NACEN SIN ELEGIR — no hay default oscuro. Con una sola modalidad abierta
     el selector no se dibuja (N=1 colapsa) y se preselecciona la única. */
  const unica = MODALIDADES_ABIERTAS.length === 1 ? MODALIDADES_ABIERTAS[0] : null;
  const [modalidad, setModalidad] = useState<ModalidadGuarderia | null>(unica);
  const [tamano, setTamano] = useState<TamanoPaqueteGuarderia | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [requisitos, setRequisitos] = useState<RequisitosGuarderia | null>(null);
  const [resumen, setResumen] = useState<Resumen>({ fase: 'ocioso' });

  /* Los requisitos son de la MASCOTA, no del día: se piden una vez. */
  useEffect(() => {
    if (mascotaId === null) return;
    let vigente = true;
    void (async () => {
      const r = await evaluarRequisitosGuarderia(mascotaId);
      if (vigente && r.ok) setRequisitos(r.data);
    })();
    return () => { vigente = false; };
  }, [mascotaId]);

  /** Paquete exige tamaño antes de preguntar por el día. */
  const listoParaDia = modalidad !== null && (modalidad !== 'paquete' || tamano !== null);

  useEffect(() => {
    if (!listoParaDia || fecha === null || mascotaId === null) {
      setResumen({ fase: 'ocioso' });
      return;
    }
    let vigente = true;
    setResumen({ fase: 'cargando' });
    void (async () => {
      const r = await obtenerResumenGuarderias({ modalidad, fecha, mascotaId });
      if (!vigente) return;
      if (!r.ok) {
        /* ③ LA VÍSPERA SE APARTA ACÁ, antes que cualquier otra cosa.
           🔴 **`String(...)` NO ES UN ATAJO — es un hecho medido.** El motor
           LANZA `fecha_no_ofertable` (`20260830020000_s107a_resumen_filtro.sql:86`)
           y **el wrapper no lo tiene en su `MENSAJES`**, así que el código no
           está en la unión y hoy llega como `error_desconocido`.
           *Comparar contra la unión daría rojo por una razón falsa: el código
           existe, lo que falta es que esté tipado.* **Pedido a A**; el día que
           entre, esta línea pierde el `String(...)` y nada más cambia. */
        setResumen(
          String(r.codigo) === 'fecha_no_ofertable' ? { fase: 'vispera' } : { fase: 'error' },
        );
        return;
      }
      setResumen({
        fase: 'listo',
        cuantos: r.data.cuantos,
        precioDesde: r.data.precioDesde,
        causa: r.data.causa,
      });
    })();
    return () => { vigente = false; };
  }, [listoParaDia, fecha, mascotaId, modalidad]);

  const dias = useMemo(() => {
    const corto = new Intl.DateTimeFormat(idioma, { weekday: 'short' });
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + 1 + i);
      return { iso: iso(d), dia: corto.format(d).replace('.', '').toLowerCase(), numero: String(d.getDate()) };
    });
  }, [idioma]);

  const vozCausa = useCallback(
    (c: CausaSinGuarderias): string =>
      t(
        c === 'sin_cupo_ese_dia' ? 'elegirGuarderia.causaSinCupo'
        : c === 'nadie_vende_esa_modalidad' ? 'elegirGuarderia.causaSinModalidad'
        /* ④ Mapeada, **hoy inalcanzable**: sin `lat`/`lon` esa etapa no
           descarta a nadie y el server no puede devolverla. */
        : c === 'sin_cobertura' ? 'elegirGuarderia.causaSinCobertura'
        : c === 'especie_sin_oferta' ? 'elegirGuarderia.causaEspecie'
        : 'elegirGuarderia.causaIndeterminada',
      ),
    [t],
  );

  /* ① Se pregunta por la causa y basta: `cuantos > 0 ⟺ causa === null`. */
  const puedeSeguir = resumen.fase === 'listo' && resumen.causa === null;
  /* ② `null` ⇒ nada. Jamás un `0` que se lea como gratis. */
  const total = resumen.fase === 'listo' && resumen.precioDesde !== null
    ? `$ ${resumen.precioDesde.toFixed(2)}`
    : null;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <CabezalOficio
        oficio="guarderia"
        capa="cuidado"
        titulo={t('hubGuarderia.titulo')}
        detalle={params.mascotaNombre ?? t('hubGuarderia.cabezalDetalle')}
        onAtras={() => router.back()}
        insetTop={insets.top}
      />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: insets.bottom + spacing[8] }}>
        {/* ── ① LA MODALIDAD. Con una sola abierta no se dibuja (N=1 colapsa). ── */}
        {MODALIDADES_ABIERTAS.length > 1 ? (
          <SelectorSegmentado
            proposito="eleccion"
            etiqueta={t('modalidadGuarderia.etiqueta')}
            segmentos={MODALIDADES_ABIERTAS.map((m) => ({
              codigo: m,
              etiqueta: t(m === 'dia' ? 'modalidadGuarderia.dia' : m === 'paquete' ? 'modalidadGuarderia.paquete' : 'modalidadGuarderia.mensual'),
            }))}
            activo={modalidad ?? ''}
            onCambio={(c) => { setModalidad(c as ModalidadGuarderia); setFecha(null); setTamano(null); }}
          />
        ) : null}

        {/* ── ② LO QUE ESA MODALIDAD NECESITA ── */}
        {modalidad === 'paquete' ? (
          <SelectorOpcion
            acento="control"
            disposicion="tira"
            etiqueta={t('hubGuarderia.cuantasEstadias')}
            opciones={TAMANOS_PAQUETE.map((n) => ({ codigo: String(n), etiqueta: t('hubGuarderia.tamanoEstadias', { n }) }))}
            seleccionada={tamano === null ? '' : String(tamano)}
            onSelect={(c) => { setTamano(Number(c) as TamanoPaqueteGuarderia); setFecha(null); }}
          />
        ) : null}

        {/* ── ③ EL DÍA, con el rótulo de SU modalidad ── */}
        {listoParaDia ? (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">
              {modalidad === 'paquete' ? t('elegirGuarderia.primeraEstadia')
                : modalidad === 'mensual' ? t('elegirGuarderia.primerDia')
                : t('hubGuarderia.queDia')}
            </Texto>
            <SelectorDia
              dias={dias}
              elegido={fecha ?? ''}
              cerrados={new Set()}
              etiquetaCerrado={t('hubGuarderia.diaCerrado')}
              onElegir={setFecha}
            />
          </View>
        ) : null}

        {/* ── ⑤ LOS REQUISITOS — bajo el día, en los tres caminos, INFORMATIVOS ── */}
        {listoParaDia && requisitos !== null ? (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="titulo">{t('lugarGuarderia.requisitosTitulo')}</Texto>
            <SemaforoSanitario
              requisitos={requisitos.faltantes.length === 0
                ? [{ clave: 'todo', etiqueta: t('lugarGuarderia.requisitosAlDia'), estado: 'al_dia' }]
                : requisitos.faltantes.map((f): RequisitoSanitario => ({
                    clave: f.codigo,
                    etiqueta: f.nombre,
                    estado: 'falta',
                    detalle: t(`lugarGuarderia.estado_${f.estado}` as 'lugarGuarderia.estado_sin_carnet'),
                    onResolver: () => router.push('/carnet'),
                    etiquetaResolver: t('lugarGuarderia.cargarCarnet'),
                  }))}
            />
            {/* 🔴 LO DICE, para que nadie lea el semáforo como una puerta: hoy
                informa y no frena (`bloquea === false`). */}
            {!requisitos.bloquea ? (
              <Texto variante="apoyo">{t('elegirGuarderia.requisitosInforman')}</Texto>
            ) : null}
          </View>
        ) : null}

        {/* ── ⑦ LA CAUSA, VISIBLE SIN TOCAR EL BOTÓN (Ley 23) ── */}
        {resumen.fase === 'cargando' ? (
          <EsqueletoGrupo><Esqueleto alto={44} /></EsqueletoGrupo>
        ) : resumen.fase === 'vispera' ? (
          /* ③ NO dice «prueba con otro día»: explica LA REGLA, que es lo que
             la familia no sabía. */
          <Texto variante="apoyo">{t('elegirGuarderia.vispera')}</Texto>
        ) : resumen.fase === 'error' ? (
          <Texto variante="apoyo">{t('hubGuarderia.listaNoCargoDetalle')}</Texto>
        ) : resumen.fase === 'listo' && resumen.causa !== null ? (
          <Texto variante="apoyo">{vozCausa(resumen.causa)}</Texto>
        ) : null}
      </ScrollView>

      {/* ── ④+⑤ EL VALOR Y EL BOTÓN. «Ver quién puede» es UN BOTÓN, no una lista. ── */}
      {listoParaDia && fecha !== null ? (
        <PieReserva
          total={total}
          /* El resumen da UN número —el más bajo entre los que van a
             aparecer—, así que siempre es un «desde». *A lo calcula después de
             filtrar: un «desde $8» de un lugar que no aparece promete de más.* */
          totalDesde={resumen.fase === 'listo' && resumen.cuantos > 1}
          etiqueta={t('elegirGuarderia.verQuienPuede')}
          habilitado={puedeSeguir}
          insetBottom={insets.bottom}
          onPress={() =>
            router.push({
              pathname: '/explorar/guarderia/disponibles',
              params: {
                ...params,
                modalidad: modalidad ?? 'dia',
                fecha,
                ...(modalidad === 'paquete' && tamano !== null ? { tamano: String(tamano) } : {}),
              },
            })
          }
        />
      ) : null}
    </SafeAreaView>
  );
}
