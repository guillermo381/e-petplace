/**
 * Navegación raíz del prestador (S51-B3.1; letra P17 v1.1, S57-B):
 * CUATRO tabs, Hoy·Mascotas·Negocio·Cuenta. La v1.0 sacaba Mascotas de
 * la barra — era letra mal redactada, no decisión (veredicto founder en
 * el gate): la decisión real de S57 es UNA, separar Cuenta de Negocio.
 *
 * AUTH REAL EN EL RAÍZ (S54-B, D-290 — el bootstrap dev de S44 murió):
 * la misma máquina de estados dignos de S51, con dos estados nuevos.
 * Routing por estado REAL:
 *   verificando → Esqueleto ESTÁTICO (Ley 13)
 *   sin sesión  → invitación a entrar (el login vive en /login)
 *   con sesión SIN negocio de prestador → estado honesto + salida
 *     (la verdad operativa es la fila de `prestadores`, no user_roles
 *     — decisión S54-B: es lo que toda pantalla necesita para operar)
 *   con negocio → las tabs (HOY preside)
 *   error de red/config → detalle específico + reintentar (regla 36)
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Redirect, Tabs, useFocusEffect } from 'expo-router';
import {
  BarraTabs,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  spacing,
  useTheme,
  type BarraTabsItem,
  type IconoNombre,
} from '@epetplace/ui';
import {
  cerrarSesion,
  empleadoTieneRol,
  obtenerInvitacionPendiente,
  obtenerMiPosicionEnPrestador,
  obtenerMiPrestador,
  obtenerNegocioEmpleadoActivo,
  obtenerSesion,
  registrarPrimerIngreso,
} from '@epetplace/api';

import { apiLista } from '@/lib/api';
import { esRegistroReciente } from '@/lib/registro-reciente';
import { BienvenidaPrestador } from '@/components/bienvenida';
import { useTraduccion } from '@/i18n';
import { contextoVentas } from '@/lib/cuenta-ventas';
import { resolverCapacidadDeBarra } from '@/lib/barra-prestador-lectura';
import {
  KEY_ETIQUETA_TAB,
  ordenTabsPrestador,
  type ClaveTabPrestador,
} from '@/lib/barra-prestador';

/* ☠️ S86-B · `@/components/iconos-tabs` MURIÓ — LA BARRA CONSUME EL
 * REGISTRY (D-645 / D-546, el pedido que su propia cabecera dejaba
 * escrito: *"la cura es un pedido a B, no un refactor local: que
 * `Icono` acepte el eje de la barra"*). Los cuatro glifos de acá
 * estaban byte-idénticos al registry — **y eso no probaba que el clon
 * funcionara: probaba que alguien lo había vuelto a copiar a mano**,
 * tres veces en una sola sesión (S85). Ahora `Icono` resuelve la ley 6
 * adentro: la huella de ESTRUCTURA (`negocio` la pata, `mascotas` la
 * gráfica) recolorea; la de MARCA (`hoy`, `cuenta`) aparece. */

type EstadoSesionRaiz =
  | 'verificando'
  // S75-B: 'ok' pasa a portar esGestor — el gate del tab NEGOCIO lee de
  // acá (resuelto UNA vez en el guard, jamás por pantalla).
  // ⭐ S87-C — ACÁ DECÍA «Hoy inerte: el único que llega es el titular».
  // ERA VERDAD EN S75 y dejó de serlo sin que nada se pusiera rojo: la
  // puerta (R1) resuelve por titularidad O VÍNCULO ACTIVO, y D-651 midió
  // CINCO personas activas no-titulares. `esGestor=false` es el camino
  // NORMAL de esta rama, no un caso teórico.
  // ⭐ S98-C · `montaAtender` — LA QUINTA TAB, compuesta por CAPACIDAD
  // (`LA_CASA_DEL_PRESTADOR` §2 y §2.1bis, firmas del founder 13-ago).
  // Es un **Y**: rol (`esMostradorOGestion`, el predicado de §4ter que ya
  // gobierna la plata del día — NO nace uno nuevo) **Y** capacidad (algún
  // servicio con `atiende_local`, o la tienda activa).
  | {
      ok: true;
      esGestor: boolean;
      montaAtender: boolean;
      // ⭐ S99-D: `'vendedor-puro'` NO es un cuarto valor decorativo — es el
      // único que dice «la ceremonia no se preguntó porque no hay sujeto».
      // Reusar `'no-gestor'` habría afirmado algo falso (él SÍ es gestor) y
      // el forense habría mentido justo donde se lo lee para diagnosticar.
      ceremonia: 'consultada' | 'resuelta-para-este-usuario' | 'no-gestor' | 'vendedor-puro';
    }
  // S79-B (T2-B2, §2.3; T4-B1): primer ingreso del GESTOR según el MOTOR
  // (`registrar_primer_ingreso`, LETRA_PERFIL §4) → la carta preside
  // ANTES de las tabs (precedente /invitacion, L-161). El puente
  // AsyncStorage murió consumiendo esa RPC.
  | { bienvenida_pendiente: true }
  /* ☠️ S99-D · L1 · D-820 — MURIÓ EL ESTADO `vendedor_puro`.
     Lo escribió S96-C por orden del founder en la tanda del gate, y **hizo
     su trabajo**: sacó al vendedor puro del callejón `sin_rol`, que le pedía
     una invitación de EMPLEADO a alguien ya dado de alta como vendedor (el
     estado exacto del vendedor real de octubre, D-766). Su propia ficha
     D-819 dejó medido el límite: *«hoy NO TIENE BARRA EN ABSOLUTO»*.
     **La firma del 14-ago (§2.0) lo convirtió de diseño en defecto**, y hoy
     el vendedor puro cae en `ok` como cualquier dueño — con su barra
     compuesta por capacidad, que es lo que la letra pide.
     *No se pierde nada de aquella rama: la pregunta que hacía sigue viva
     tres líneas más arriba; lo que cambió es la respuesta.* */
  // S79-B (T3-B3): estado 'pendiente' → LA SALA DE ESPERA. La regla dura:
  // el pendiente NO entra al portal — y la carta §2.3 tampoco se le
  // muestra (primer_ingreso_en marca la fase 4, no la 1).
  | { sala_espera: true }
  // negocioEmpleado: si el user es EMPLEADO ACTIVO esperando la puerta,
  // el nombre de su negocio (voz honesta); null = user sin negocio alguno.
  | { sin_rol: true; email: string; negocioEmpleado: string | null }
  // S75-B1: hay una invitación de equipo SIN aceptar → el handshake vive
  // en el RAÍZ (/invitacion), fuera de las tabs (L-161). El guard redirige.
  | { invitacion_pendiente: true }
  | { sin_sesion: true }
  | { error: true; detalle: string };

// S79-B (T4-B1): la ceremonia se pregunta UNA vez por sesión de JS — la
// RPC es idempotente, pero el guard corre en cada focus y no hace falta
// repetirle la pregunta al server (costo declarado en cero).
// S81 (hallazgo del vehículo Shyris): el flag booleano era POR PROCESO,
// no por usuario — el founder consumió la ceremonia de Aurora, cambió a
// vet1 SIN reiniciar la app, y la ceremonia de vet1 se saltó MUDA (ni
// RPC, ni redirect, ni log distintivo — L-192). La cura: el flag guarda
// EL user_id que ya resolvió; otro usuario en el mismo proceso vuelve a
// preguntar. Y el skip HABLA (el forense lo distingue — puede salir rojo).
let ceremoniaResueltaPara: string | null = null;

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [sesion, setSesion] = useState<EstadoSesionRaiz>('verificando');
  const [intento, setIntento] = useState(0);
  const [saliendo, setSaliendo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async (): Promise<EstadoSesionRaiz> => {
        if (!apiLista) {
          return { error: true, detalle: 'Faltan EXPO_PUBLIC_SUPABASE_URL / ANON_KEY en .env.local.' };
        }
        const s = await obtenerSesion();
        if (!s.ok) return { error: true, detalle: s.mensaje };
        if (s.data === null) return { sin_sesion: true };
        const p = await obtenerMiPrestador();
        if (p.ok) {
          // S79-B (T3-B3; T4-B3 · D-560): LISTA BLANCA — al portal entra
          // SOLO 'activo'; TODO lo demás (pendiente, en_revision,
          // suspendido, rechazado, y el sexto estado que nazca mañana)
          // aterriza en la sala de espera por default. La lista negra
          // vieja ('pendiente' solo) dejaba colar tres estados por
          // omisión. El titular lee su propia fila sea cual sea el
          // estado (RLS prestadores_public, brazo user_id).
          if (p.data.estado !== 'activo') return { sala_espera: true };
          /* ⭐ S98-C (D-819) · LAS DOS PREGUNTAS DE LA BARRA SALIERON DE ACÁ.
             Vivían inline —tres lecturas en una ola, más la asimetría de
             sus fallos (el rol cierra, la capacidad abre)— y **el destape
             del wizard necesitaba lo mismo**. Antes de copiarlas, se
             mudaron: `lib/barra-prestador-lectura`, con su porqué entero.
             *Dos copias no divergen algún día: divergen la primera vez que
             alguien cura una sola.* */
          const { esGestor, montaAtender } = await resolverCapacidadDeBarra({
            tipo: 'prestador',
            prestadorId: p.data.id,
          });
          // S79-B (T4-B1, §2.3): la ceremonia del primer ingreso es del
          // MOTOR (LETRA_PERFIL §4) — el puente AsyncStorage MURIÓ entero
          // (era por dispositivo: en una tablet de clínica el segundo
          // gestor jamás veía su carta). La RPC estampa SOLO al titular
          // activo y es idempotente; ante fallo de lectura NO se
          // interrumpe (la carta es ceremonia, no candado).
          if (esGestor && ceremoniaResueltaPara !== s.data.user_id) {
            const ingreso = await registrarPrimerIngreso();
            if (ingreso.ok) {
              ceremoniaResueltaPara = s.data.user_id;
              if (ingreso.data.esPrimerIngreso) return { bienvenida_pendiente: true };
            }
            return { ok: true, esGestor, montaAtender, ceremonia: 'consultada' as const };
          }
          return {
            ok: true,
            esGestor,
            montaAtender,
            ceremonia: esGestor ? ('resuelta-para-este-usuario' as const) : ('no-gestor' as const),
          };
        }
        if (p.codigo === 'sin_prestador') {
          // S75-B1: ¿handshake pendiente? (invitación INACTIVA) → el raíz
          // lo intercepta ANTES de la voz "sin negocio" (que para el
          // invitado es mentira). La sonda mira solo inactivas; el roce
          // del re-login lo absorbe B3 (confirmado por A y mesa).
          const inv = await obtenerInvitacionPendiente();
          if (inv.ok && inv.data !== null) return { invitacion_pendiente: true };
          // S96-C: ¿VENDEDOR PURO? Se pregunta ANTES de la sonda de
          // empleado: un panel donde puede TRABAJAR HOY gana a una voz
          // de espera (si además es empleado de un negocio no-activo, el
          // día que el negocio active, `obtenerMiPrestador` resuelve y
          // esta rama ni se toca). `contextoVentas` **deduplica en vuelo**
          // (S98-C): tres consumidores simultáneos comparten un viaje.
          const ventas = await contextoVentas();
          if (ventas.ok && ventas.data !== null && ventas.data.esVendedora) {
            /* ⭐ S99-D · L1 · D-820 — EL VENDEDOR PURO ENTRA A LA CASA.
               `LA_CASA_DEL_PRESTADOR` §2.0 (firma del founder, 14-ago):
               *«el vendedor puro deja de ser el caso sin barra: es un DUEÑO
               y tiene la casa entera»*.

               ☠️ ACÁ DEVOLVÍA `{ vendedor_puro: true }`, que abajo se
               resolvía en `<Redirect href="/ventas" />`. **La redirección
               muere; la RUTA `/ventas` NO** — y esa mitad es la que hay que
               no perder de vista: `/ventas` sigue siendo la casa de una
               población que NO tiene barra propia, el **empleado-vendedor
               no-gestor** de §0bis, que entra por su puerta del HOY
               (`(tabs)/index.tsx`). *Matar la ruta con el Redirect le
               sacaría el piso al mismo actor al que S96 ya se lo sacó una
               vez* — medición de C, costura 1 de `PLAN_S99` §5.
               Su condición de muerte, acordada con C y escrita en los dos
               partes: la ruta muere cuando ① la pieza de la ventana de
               pedidos esté montada en el HOY del dual (L4) **y** ② las tres
               puertas vivas tengan destino nuevo POR POBLACIÓN.

               ⚠️ La ceremonia del primer ingreso NO se le pregunta: estampa
               sobre el TITULAR ACTIVO de un prestador y él no tiene fila.
               Llamarla sería pedirle al motor un veredicto sobre un sujeto
               que no existe; su literal en el forense lo dice. */
            const { esGestor, montaAtender } = await resolverCapacidadDeBarra({
              tipo: 'vendedorPuro',
            });
            return { ok: true, esGestor, montaAtender, ceremonia: 'vendedor-puro' as const };
          }
          // ¿empleado ACTIVO esperando la puerta, o user sin negocio?
          // La sonda distingue la voz (cero motor — policy empleados_self).
          const neg = await obtenerNegocioEmpleadoActivo();
          return {
            sin_rol: true,
            email: s.data.email ?? '',
            negocioEmpleado: neg.ok ? neg.data : null,
          };
        }
        return { error: true, detalle: p.mensaje };
      })().catch((e: unknown): EstadoSesionRaiz => {
        // S96-C (cura (b) del gate): la cadena NO tenía .catch — un throw
        // inesperado (no un !ok: una excepción) dejaba 'verificando' PARA
        // SIEMPRE: esqueleto eterno, la clase exacta del «fallo que no
        // dice nada» que el founder vetó. Ahora degrada a la rama de
        // error, que habla y reintenta. Forense antes de dibujar (L-138).
        const detalle = e instanceof Error ? e.message : String(e);
        console.error(`[sesion] raíz prestador: EXCEPCIÓN — ${detalle}`, e);
        return { error: true, detalle };
      }).then((r) => {
        // Forense L-138: el resultado del guard raíz queda LITERAL en
        // el log de Metro/logcat — el gate empieza confirmándolo.
        const voz =
          typeof r === 'string' ? r
            : 'ok' in r ? `ok — gestor=${r.esGestor} · atender=${r.montaAtender} · ceremonia=${r.ceremonia}`
              : 'sala_espera' in r ? "estado 'pendiente' → /sala-espera"
                : 'bienvenida_pendiente' in r ? 'primer login → /bienvenida-dia1'
                  : 'invitacion_pendiente' in r ? 'invitación pendiente → /invitacion'
                    : 'sin_sesion' in r ? 'sin sesión'
                      : 'sin_rol' in r ? `sin rol prestador — ${r.email}${r.negocioEmpleado ? ` (empleado de ${r.negocioEmpleado})` : ''}${esRegistroReciente(r.email) ? ' (recién registrado)' : ''}`
                        : `error — ${r.detalle}`;
        console.log(`[sesion] raíz prestador: ${voz}`);
        if (vigente) setSesion(r);
      });
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  if (sesion === 'verificando') {
    // Esqueleto estático de la jornada (Ley 13): el vacío jamás es carga.
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: spacing[5], paddingTop: spacing[10] }}>
        <EsqueletoGrupo>
          <View style={{ gap: spacing[4] }}>
            <Esqueleto forma="linea" ancho="55%" />
            <Esqueleto forma="bloque" ancho="100%" alto={88} />
            <Esqueleto forma="bloque" ancho="100%" alto={220} />
          </View>
        </EsqueletoGrupo>
      </View>
    );
  }

  /* ☠️ S99-D · L1 · D-820 — MURIÓ EL `<Redirect href="/ventas" />`.
     Era la única línea que le negaba la casa al vendedor puro: entraba, y
     antes de ver una tab lo mandaban a una pantalla suelta.
     **⚠️ LA RUTA `/ventas` NO MUERE CON ÉL, y la distinción es la costura 1
     de `PLAN_S99` §5:** sigue siendo la casa de una población que no tiene
     barra propia —el empleado-vendedor no-gestor de §0bis, que entra por su
     puerta del HOY—. Su condición de muerte, acordada con C y escrita en
     los dos partes: la ruta muere cuando ① la pieza de la ventana de
     pedidos esté montada en el HOY del dual (L4) **y** ② las tres puertas
     vivas tengan destino nuevo POR POBLACIÓN. */

  if ('sala_espera' in sesion) {
    // S79-B (T3-B3): el pendiente NO entra al portal.
    return <Redirect href="/sala-espera" />;
  }

  if ('bienvenida_pendiente' in sesion) {
    // S79-B (§2.3): la carta del Día 1 — fuera de tabs, una sola vez.
    return <Redirect href="/bienvenida-dia1" />;
  }

  if ('invitacion_pendiente' in sesion) {
    // S75-B1: handshake pendiente → la pantalla del raíz (fuera de tabs).
    return <Redirect href="/invitacion" />;
  }

  if ('sin_sesion' in sesion) {
    // sin sesión CONFIRMADO → LA BIENVENIDA (S61-B8, letra founder):
    // el landing con la voz del grupo curado; el EstadoVacio de S51
    // murió — error y sin-rol conservan el suyo.
    return <BienvenidaPrestador />;
  }

  if ('sin_rol' in sesion) {
    // sesión válida pero SIN negocio propio. S75-B: DOS voces —
    //  · EMPLEADO ACTIVO de un negocio NO-'activo' (negocioEmpleado
    //    presente): la puerta abierta (R1) NO lo deja entrar porque
    //    `prestadores_public` exige estado='activo' y no es el titular
    //    → `obtenerMiPrestador` cae en `sin_prestador` (BORDE declarado
    //    por A1). VERIFICADO S75-B: existe 1 caso vivo en DB.
    //    NO SE RETIRA (mesa S75): la rama cambió de caso, no murió.
    //    LÍMITE HONESTO — hoy DEGRADA a la voz `sinRol`: para leer el
    //    nombre de un negocio no-'activo' hace falta un lector que
    //    saltee la RLS (lógica nueva, territorio A) → DEUDA declarada
    //    (candidata, ver doc de circuito). Cuando ese lector exista,
    //    `obtenerNegocioEmpleadoActivo` devolverá el nombre y esta rama
    //    hablará. S76: NO la "limpies" — está esperando su lector.
    //  · user SIN negocio alguno: la voz de siempre.
    //  · S80-B1 (D-509 ①) — LA TERCERA VOZ: el que se acaba de registrar
    //    en ESTA sesión de JS (lib/registro-reciente, patrón
    //    ceremoniaResuelta) no es un callejón: su cuenta está lista y el
    //    paso siguiente se dice ("que el negocio te invite con este
    //    correo"). Tras reiniciar la app cae a la voz genérica, que
    //    desde S80 dice EL MISMO camino (degradación honesta declarada
    //    en el M1). sala-espera NO se ensancha: su contrato de datos ES
    //    MiPrestador y sin fila rebota en cadena (L-178).
    const negocio = sesion.negocioEmpleado; // narrowing: null = user sin negocio
    const recienRegistrado = negocio === null && esRegistroReciente(sesion.email);
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5], gap: spacing[4] }}>
        <EstadoVacio
          titulo={
            negocio !== null
              ? t('sesion.empleadoTitulo', { negocio })
              : recienRegistrado
                ? t('sesion.registradoTitulo')
                : t('sesion.sinRol')
          }
          descripcion={
            negocio !== null
              ? t('sesion.empleadoDetalle')
              : recienRegistrado
                ? t('sesion.registradoDetalle', { email: sesion.email })
                : t('sesion.sinRolDetalle', { email: sesion.email })
          }
          accion={
            <Boton
              variante="secundario"
              etiqueta={t('sesion.cerrarSesion')}
              cargando={saliendo}
              onPress={() => {
                if (saliendo) return;
                setSaliendo(true);
                void cerrarSesion().then(() => {
                  setSaliendo(false);
                  setSesion('verificando');
                  setIntento((n) => n + 1);
                });
              }}
            />
          }
        />
      </View>
    );
  }

  if ('error' in sesion) {
    // error de config/red/permisos — el detalle específico jamás se traga
    // (regla 36). 🔴 S96-C (cura (b) del gate, D-538/L-178): acá decía
    // `sinSesion` — MENTIRA para un 403 con la sesión viva (el gate del
    // founder lo encontró: el vendedor puro veía «No hay sesión activa»
    // con su sesión andando). El título nuevo no afirma la causa que no
    // midió, el detalle dice la del servidor, y cerrar sesión es la
    // salida de escape — un error sin salida es un callejón con voz.
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo={t('sesion.falloTitulo')}
          descripcion={sesion.detalle}
          accion={
            <View style={{ gap: spacing[3], alignItems: 'center' }}>
              <Boton
                variante="secundario"
                etiqueta={t('sesion.reintentar')}
                onPress={() => {
                  setSesion('verificando');
                  setIntento((n) => n + 1);
                }}
              />
              <Boton
                variante="ghost"
                etiqueta={t('sesion.cerrarSesion')}
                cargando={saliendo}
                onPress={() => {
                  if (saliendo) return;
                  setSaliendo(true);
                  void cerrarSesion().then(() => {
                    setSaliendo(false);
                    setSesion('verificando');
                    setIntento((n) => n + 1);
                  });
                }}
              />
            </View>
          }
        />
      </View>
    );
  }

  // S75-B: el tab NEGOCIO gatea por AUSENCIA (Ley 23) — la gestión (oferta,
  // plata, equipo) es de quien puede TOCARLA (dueño/administrador). HOY y
  // Mascotas y Cuenta las ve todo el equipo (operan / se identifican).
  /* ⭐ S87-C · LA BARRA DE TRES ES DISEÑO, Y ACÁ ESTABA LA PREMISA CADUCADA.
     ACÁ DECÍA: «INERTE hoy: solo el titular llega, y el titular es gestor →
     el tab aparece siempre. Cuando la puerta abra, …».
     **La puerta YA abrió — en S75, en el mismo commit que escribió esto**,
     y el comentario siguió diciendo lo contrario dos sesiones. D-651 lo
     midió: CINCO personas activas no-titulares ven esta barra, y su diseño
     no existía porque el archivo decía que no hacía falta.
     ☠️ Es L-193 en su forma limpia: **un comentario no es un guard.** La
     premisa caducó por un INSERT en otra tabla y ningún typecheck, lint ni
     gate podía verlo.
     HOY la barra de tres está FIRMADA (`docs/laminas/LAMINA_BARRA_DE_TRES.md`):
     `Hoy · Datos · Cuenta` es la casa del no-gestor, no el descarte de la
     del titular. La ausencia del tab NO se explica ni se insinúa (§2); lo
     que sí habla es la RUTA cuando alguien navega a ella (§3, GateAjeno). */
  /* ⭐ S98-C (D-819) · EL ORDEN Y LOS PREDICADOS YA NO VIVEN ACÁ — salieron
     a `lib/barra-prestador` porque **el destape del wizard los necesitaba
     y los había copiado a mano**: enumeraba `Hoy·Datos·Negocio·Cuenta`
     fijo, sin `ATENDER` y prometiéndole `Hoy` a quien no lo tiene.
     *La cura no fue sincronizar dos copias —eso deja la deuda viva— sino
     dejar UNA: acá quedan los GLIFOS, que son de esta superficie y de
     ninguna otra.*

     Lo que la mudanza NO se llevó y sigue rigiendo:
      · **`ATENDER` va entre DATOS y NEGOCIO**, y con las cinco barras de
        la letra el centro cae solo (titular con local →
        `Hoy·Datos·ATENDER·Negocio·Cuenta`).
      · **Destacada por FORMA, no por coordenada** (contrato de B): gana
        superficie y un paso de tamaño, jamás un acento propio — N5 manda
        un acento por pantalla y acá ya lo tiene la huella de la tab
        activa, que es la que dice DÓNDE ESTOY.
      · La tab se llama «Datos» y su glifo es `datos`; la RUTA sigue
        siendo `mascotas` — el nombre de archivo no es el del glifo. */
  const GLIFO_TAB = {
    index: 'hoy',
    mascotas: 'datos',
    atender: 'atender',
    negocio: 'negocio',
    cuenta: 'cuenta',
  } as const satisfies Record<ClaveTabPrestador, IconoNombre>;

  const items: BarraTabsItem[] = ordenTabsPrestador({
    esGestor: sesion.esGestor,
    montaAtender: sesion.montaAtender,
  }).map((key) => ({
    key,
    etiqueta: t(KEY_ETIQUETA_TAB[key]),
    ...(key === 'atender' ? { destacada: true } : null),
    icono: ({ color, activa, colorHuella }) => (
      <Icono nombre={GLIFO_TAB[key]} tinta={color} huella={colorHuella} activa={activa} />
    ),
  }));

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BarraTabs
          items={items}
          activo={state.routes[state.index].name}
          // D-402 (S62): tocar una tab lleva SIEMPRE a su raíz. Re-tocar
          // la activa con stack anidado profundo = POP_TO_TOP dirigido al
          // stack hijo (objeto plano de acción — StackActions.popToTop()
          // es exactamente { type: 'POP_TO_TOP' }); cambiar de tab lo
          // resuelve popToTopOnBlur (abajo). En el prestador el único
          // tab con stack anidado es Cuenta (relevamiento S62-B).
          onCambiar={(key) => {
            const activa = state.routes[state.index];
            if (activa.name === key) {
              const hijo = activa.state;
              if (hijo?.type === 'stack' && (hijo.index ?? 0) > 0 && hijo.key) {
                navigation.dispatch({ type: 'POP_TO_TOP', target: hijo.key });
              }
              return;
            }
            navigation.navigate(key);
          }}
          // S58 (§2.6 + §15b.1): las 4 tabs ya hablan b′ — el pill muere,
          // la tab activa se marca porque su huella APARECE
          estadoPorHuella
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="mascotas" />
      {/* S98-C: la pantalla se declara SIEMPRE aunque la barra no la
          monte — un `Tabs.Screen` condicional deja la ruta inexistente y
          un `router.push('/atender')` de cualquier pantalla se caería sin
          decir por qué. Quién la VE lo decide `items`; que EXISTA es del
          navegador. (Mismo trato que `negocio`, que ya era condicional en
          la barra y fijo acá desde S75.) */}
      <Tabs.Screen name="atender" />
      <Tabs.Screen name="negocio" />
      {/* D-402: al salir del tab, su stack vuelve a la raíz — la próxima
          entrada jamás encuentra pegada una pantalla interna. */}
      <Tabs.Screen name="cuenta" options={{ popToTopOnBlur: true }} />
      {/* galería de tokens: fuera de la barra, viva por URL (/gallery) */}
      <Tabs.Screen name="gallery" />
    </Tabs>
  );
}
