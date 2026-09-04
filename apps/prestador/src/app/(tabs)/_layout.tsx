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

import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Redirect, Tabs, useFocusEffect, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ALTO_FILA_TABS,
  BarraTabs,
  PresenciaCoach,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  spacing,
  useTheme,
  type BarraTabsItem,
  type PendientesCoach,
  type IconoNombre,
} from '@epetplace/ui';
import {
  cerrarSesion,
  empleadoTieneRol,
  obtenerInvitacionPendiente,
  obtenerMiPosicionEnPrestador,
  obtenerContextoArranque,
  obtenerNegocioEmpleadoActivo,
  obtenerSesion,
  registrarPrimerIngreso,
} from '@epetplace/api';

import { apiLista } from '@/lib/api';
import { esRegistroReciente } from '@/lib/registro-reciente';
import { BienvenidaPrestador } from '@/components/bienvenida';
import { ReclamoVinculo } from '@/components/reclamo-vinculo';
import { estadoPresencia } from '@/lib/estado-presencia';
import { presenciaVisibleEn } from '@/lib/presencia-visible';

import { useTraduccion } from '@/i18n';
import { escucharPendientes, usePendientesAdopcion } from '@/lib/pendientes-adopcion';
import { capacidadDesdeContexto } from '@/lib/barra-prestador-lectura';
import type { EscalonAtender } from '@/lib/capacidad-atender';
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
      /* ⭐ S112-C: la naturaleza REFUGIO decide la barra entera, no una tab más.
         Viaja hasta acá por lo mismo que el escalón: **la barra se arma en este
         archivo**, y su composición es del resolvedor. */
      esRefugioPuro: boolean;
      esGestor: boolean;
      montaAtender: boolean;
      /* 🔴 S99-D · L-251 — el escalón viaja hasta acá porque **el destino de
         una tab es de la barra**, y la barra se arma en este archivo. */
      escalonAtender: EscalonAtender;
      // ⭐ S99-D: `'vendedor-puro'` NO es un cuarto valor decorativo — es el
      // único que dice «la ceremonia no se preguntó porque no hay sujeto».
      // Reusar `'no-gestor'` habría afirmado algo falso (él SÍ es gestor) y
      // el forense habría mentido justo donde se lo lee para diagnosticar.
      /* ⭐ `'refugio'` es el quinto y dice lo mismo que `'vendedor-puro'` para
         otro sujeto: **la ceremonia no se preguntó porque no hay a quién
         preguntarle** — estampa sobre el titular activo de un `prestador`, y un
         refugio puro no tiene esa fila. *Reusar `'no-gestor'` habría dicho algo
         falso y el forense mentiría justo donde se lo lee para diagnosticar.* */
      ceremonia:
        | 'consultada'
        | 'resuelta-para-este-usuario'
        | 'no-gestor'
        | 'vendedor-puro'
        | 'refugio';
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
  /* ⭐ S99-D · Gate 2 ④ — EL REPARTIDOR CON VÍNCULO SELLADO. Lleva el
     nombre de la casa aunque hoy solo se use en el forense: si mañana la
     rama tiene que hablar (N>1, o un aviso), el dato ya está — y sobre
     todo, **el log dice DE QUÉ CASA es** el que entró, que es la mitad que
     un booleano no puede decir cuando algo sale mal. */
  | { repartidor: true; negocio: string; casas: number }
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


/**
 * ⭐ **LA PRESENCIA EN EL PRESTADOR — la misma pieza, sin Coach** (S113-C ·
 * lote 0.3).
 *
 * ☠️ **ACÁ VIVÍA `BurbujaPendientes`, Y MURIÓ EN ESTE MISMO COMMIT**, con su
 * gemela del cliente. B la dejó derogada y exportada a propósito, con su razón
 * escrita: *«si se retira antes de que las apps monten la nueva, no queda
 * ninguna puerta; si se monta la nueva sin retirar ésta, hay dos discos
 * peleando el mismo píxel»* (`L-395`). **El retiro y el montaje van en el
 * mismo commit** — y éste es ese commit.
 *
 * 🔴 **`coach: false` NO ES UN MODO DEGRADADO: es la otra mitad del trabajo.**
 * El prestador no tiene Coach, así que ofrecerle atajos de una IA que su app
 * no tiene sería prometer. Con `coach: false` la pieza es **la puerta a lo que
 * te espera y nada más**, y el compilador impide la mezcla: sin Coach no se
 * pueden pasar `atajos` ni `onPreguntar`.
 *
 * ⚠️ **`nombre` SE PASA Y LA PIEZA NO LO DIBUJA** — lo recibe como `_nombre`,
 * o sea que hoy es inerte con `coach: false`. Se le pasa la voz que ya nombra
 * esta puerta en la casa (*«Lo que te espera»*) **en vez de inventarle un
 * nombre al prestador**, y queda declarado para B: *si `atajos` y
 * `onPreguntar` son imposibles sin Coach, `nombre` debería serlo también —
 * una prop obligatoria que nadie usa es una pregunta que el consumidor tiene
 * que contestar sin motivo.*
 *
 * Las dos clases del refugio y su destino son **los mismos que tenía la
 * burbuja**: no se reinventó ninguno, se mudaron.
 */
function PresenciaDelShell({ altoBarra }: { altoBarra: number }) {
  const { t } = useTraduccion();
  const router = useRouter();
  const pendientesAdopcion = usePendientesAdopcion();
  const segmentos = useSegments() as string[];
  const [abierta, setAbierta] = useState(false);

  /* `useSegments()`, jamás el nombre del tab: ése devuelve `adopcion` y nunca
     puede valer `solicitud`. El guard del carrito del cliente vivió muerto por
     exactamente eso. */
  if (!presenciaVisibleEn(segmentos)) return null;

  const pendientes: PendientesCoach = {
    chat: pendientesAdopcion.conversaciones,
    /* El prestador no tiene carrito. `0` es un hecho medido, no un hueco. */
    pedidos: 0,
    /* ⚠️ **`porRevisar` DERIVADO, jamás `total - conversaciones`.** El total
       mezcla las dos clases y la pieza necesita cada una por separado — *el
       disco suma, la fila separa*. Restarlo serían dos números que deben
       coincidir saliendo de dos cuentas distintas. */
    solicitudes: pendientesAdopcion.porRevisar,
    /* Sin número por letra firmada (`MODELO_LOYALTY` §3: los no leídos son
       PRESENCIA, jamás número). `null` = el motor no da número, y no es cero. */
    avisos: null,
  };

  return (
    <PresenciaCoach
      coach={false}
      estado={estadoPresencia({ pendientes, abierta })}
      pendientes={pendientes}
      nombre={t('burbuja.abanico')}
      abierta={abierta}
      onAbrir={() => setAbierta(true)}
      onCerrar={() => setAbierta(false)}
      onPendiente={(clase) => {
        /* Cerrar es de la pieza: llama a `onCerrar` antes de disparar. */
        /* 🔴 **`navigate` Y NO `push` PARA CAMBIAR DE PESTAÑA.** `push` apila
           una entrada más sobre el mismo grupo de tabs; `navigate` cambia de
           pestaña, que es lo que este toque significa.

           ⏪ **ACÁ ESCRIBÍ QUE ESTO ESTABA «MEDIDO» Y NO LO ESTABA — se
           corrige en el mismo acto.** Mi arnés reportó que tras el toque la
           pantalla visible era el HOY del negocio, y de ahí saqué que `push`
           re-entraba por la pantalla inicial del grupo. **Después medí que el
           arnés no puede decidir eso**: en RN-web las pantallas de las otras
           pestañas quedan MONTADAS y con caja real, y ni `innerText`, ni
           `offsetParent`, ni `isVisible()` de playwright las descartan — las
           dos casas dan «visible» a la vez. *El instrumento no distinguía, así
           que la conclusión no era una medición: era una lectura.*
           ⇒ el cambio se queda **por su propio mérito** —así se cambia de
           pestaña— y **cuál pantalla queda arriba lo dirime el aparato**, no
           este arnés. Declarado en el parte. */
        if (clase === 'chat') {
          /* LA REGLA DEL TOQUE LA DECIDE EL DOMINIO: `unica` trae el id **si y
             sólo si** hay una conversación y nada más que atender. En el
             refugio, con solicitudes por revisar encima, es `null` ⇒ a la
             lista. *Copiado del montaje que reemplaza, no reinventado.* */
          pendientesAdopcion.unica !== null
            ? router.push({ pathname: '/(tabs)/adopcion/solicitud/[solicitudId]', params: { solicitudId: pendientesAdopcion.unica } })
            : router.navigate('/(tabs)/adopcion');
          return;
        }
        router.navigate('/(tabs)/adopcion');
      }}
      voz={{
        abrir: t('nexo.abrir'),
        cerrar: t('nexo.cerrar'),
        /* ⚠️ **SIEMPRE, aunque la cuenta sea 0** — así un número no existe sin
           su palabra y la pieza nunca inventa un plural. */
        chat:
          pendientesAdopcion.conversaciones === 1
            ? t('nexo.chatUna')
            : t('nexo.chat', { n: pendientesAdopcion.conversaciones }),
        pedidos: t('nexo.pedidosCero'),
        solicitudes:
          pendientesAdopcion.porRevisar === 1
            ? t('nexo.solicitudesUna')
            : t('nexo.solicitudes', { n: pendientesAdopcion.porRevisar }),
      }}
      aireInferior={altoBarra}
    />
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [sesion, setSesion] = useState<EstadoSesionRaiz>('verificando');
  const [intento, setIntento] = useState(0);
  const [saliendo, setSaliendo] = useState(false);

  /* ⭐ **EL ALTO DE LA BARRA SE MIDE, NO SE TECLEA** — el prestador no lo medía
     porque no tenía nada flotando encima. Su valor de ARRANQUE ya es correcto
     (`ALTO_FILA_TABS + insets.bottom`, la fórmula propia de `BarraTabs`), y eso
     es lo que hace segura la medición asincrónica: *perder la carrera del
     `onLayout` con un arranque bueno no cuesta nada; con uno malo, perderla ES
     el defecto* — que es cómo el flotante del cliente quedó 28,1 dp debajo del
     menú.

     ☠️ **D-1017 · ESTOS TRES HOOKS VIVÍAN DEBAJO DE SEIS RETURNS TEMPRANOS, Y
     EL PRESTADOR NO ABRÍA.** El primer render es SIEMPRE `'verificando'` y sale
     por el `return` de más abajo con N hooks; cuando la sesión resuelve, el
     componente llega hasta acá y llama tres más ⇒ *«Rendered more hooks than
     during the previous render»*, y el árbol entero cae en la frontera.

     🔴 **No se movió ningún `return`: se subieron los HOOKS.** Un hook no puede
     depender de una rama, y la regla no admite matices —*«el efecto puede
     quedar condicionado por DENTRO, nunca por fuera»*—. `escucharPendientes`
     ya era incondicional; los otros dos son lecturas puras que no cuestan nada
     antes de tiempo. *La cura barata es subir el hook, jamás bajar el return.* */
  const insetsBarra = useSafeAreaInsets();
  const [altoBarra, setAltoBarra] = useState(ALTO_FILA_TABS + insetsBarra.bottom);

  /* UNA suscripción por SESIÓN. Su `'reconectado'` llega también en la primera
     conexión ⇒ la carga inicial y el refresco son el mismo camino.

     ⚠️ **Corre desde el primer render, también mientras se verifica la sesión**,
     y es correcto: el lector de adopción rebota solo sin sesión y el contador
     queda en cero. *Condicionarlo por fuera sería reintroducir el defecto que
     esta cura acaba de sacar.* */
  useEffect(() => escucharPendientes(), []);

  /* ⭐ **D-1020 · EL REFUGIO ATERRIZA EN SU CASA, y no en el HOY del negocio.**
   *
   * ── EL SÍNTOMA, Y LA HIPÓTESIS QUE LO EXPLICABA MAL ─────────────────────
   * El founder, con la cuenta del refugio recién logueado: *«el home es el de
   * negocio (turnos, $ del día, prepara tu espacio), el glifo de la pestaña
   * Refugio se dibuja como inactivo, y al navegar se corrige solo»*. La mesa
   * lo leyó como **timing**: *«el tipo de cuenta llega después del primer
   * render y el shell lo trata como negocio mientras no llega»*.
   *
   * 🔴 **MEDIDO EN WEB CON SESIÓN REAL DE REFUGIO, Y LA HIPÓTESIS ES FALSA:**
   *   +1,0s  ruta `/` · esqueleto
   *   +2,0s  ruta `/` · barra `Refugio · Peluditos · Cuenta`   ← el tipo YA llegó
   *   +3,5s  ruta `/` · MISMA barra, y el contenido es el HOY del negocio
   *          («Prepara tu espacio», la tira de días, «$ del día»)
   * *El tipo de cuenta llega a los dos segundos y la barra lo refleja.* Lo que
   * no pasa nunca es **mandarlo a su casa**.
   *
   * ── LA CAUSA, UNA SOLA Y ESTRUCTURAL ────────────────────────────────────
   * `<Tabs>` arranca en la PRIMERA `Tabs.Screen`, que es `index` — el HOY. La
   * barra del refugio es `['adopcion','adoptables','cuenta']` (`barra-prestador`)
   * y **no contiene `index`**, así que:
   *   ① se dibuja el HOY del negocio, porque ahí está parado;
   *   ② **ninguna pestaña sale activa**, porque `activo` vale `'index'` y ese
   *      nombre no está en los items — *el glifo «oscuro» no es un estado de
   *      carga: es la ausencia de coincidencia*;
   *   ③ al tocar «Refugio» se navega a `adopcion`, que sí está, y los dos se
   *      arreglan juntos. **Eso es lo que el founder vio «corregirse solo».**
   * ⇒ **no es que el dato llegue tarde: es que nadie lo lleva a su casa.**
   *
   * ── POR QUÉ UN EFECTO Y NO UN `<Redirect>` ──────────────────────────────
   * Un `Redirect` acá reemplazaría el render del navegador entero y lo
   * desmontaría; y adentro de la tab sería la RATONERA que este mismo archivo
   * ya documenta (`L-251`: *«la tab no rebota: la barra apunta»*). Un
   * `replace` mueve la pestaña sin desarmar nada.
   *
   * ⚠️ **UNA SOLA VEZ, y por eso el `ref`:** sin él, el efecto volvería a
   * mandar a `adopcion` cada vez que `sesion` cambie de identidad —y la
   * cambia cada refresco del resolvedor—, **arrastrando al refugio de vuelta
   * desde cualquier pestaña donde estuviera parado**. *Un aterrizaje que se
   * repite deja de ser aterrizaje y pasa a ser un secuestro.*
   *
   * ⚠️ **El hook vive ACÁ ARRIBA, con los otros**, no cerca de la rama que lo
   * usa: es la ley que `D-1017` acaba de cobrar en este mismo archivo — *el
   * efecto se condiciona por DENTRO, nunca por fuera.* */
  const yaAterrizo = useRef(false);
  useEffect(() => {
    if (yaAterrizo.current) return;
    if (typeof sesion !== 'object' || !('ok' in sesion) || !sesion.esRefugioPuro) return;
    yaAterrizo.current = true;
    router.replace('/(tabs)/adopcion');
  }, [sesion, router]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      /* 🔬 D-835 — FORENSE DE ARRANQUE (L-192: el modo de falla de esta
         cadena es el SILENCIO). El Gate 2 midió «cero líneas [sesion]» tras
         aceptar/cerrar sesión, y ese cero tiene DOS lecturas: el efecto no
         re-disparó, O re-disparó y la cadena COLGÓ (el log de veredicto
         vive al FINAL del .then — un `getSession()` que deadlockea tras
         `signOut()` produce el mismo silencio). Esta línea discrimina en
         una sola pasada: si aparece sin veredicto después, la cadena
         cuelga; si no aparece, el efecto no corre. No es la cura — es el
         instrumento que decide cuál escribir. */
      console.log(`[sesion] raíz prestador: resolviendo… (intento ${intento})`);
      void (async (): Promise<EstadoSesionRaiz> => {
        if (!apiLista) {
          return { error: true, detalle: 'Faltan EXPO_PUBLIC_SUPABASE_URL / ANON_KEY en .env.local.' };
        }
        const s = await obtenerSesion();
        if (!s.ok) return { error: true, detalle: s.mensaje };
        if (s.data === null) return { sin_sesion: true };
        /* ⭐ S99-A · LOTE #0a — EL PRÓLOGO EN UN VIAJE (D-738, la cura reina).
           Acá vivía la cadena: `obtenerMiPrestador()` (1 viaje) → y según la
           rama, la ola de tres de `resolverCapacidadDeBarra` O el
           `contextoVentas()` de dos peticiones encadenadas. La RPC
           `obtener_contexto_arranque` COMPONE los mismos gates en el motor
           (cero predicado nuevo — los llama, no los copia) y la composición
           de barra pasa a ser PURA (`capacidadDesdeContexto`, cero red). */
        const ctx = await obtenerContextoArranque();
        if (!ctx.ok) {
          if (ctx.codigo === 'sin_sesion') return { sin_sesion: true };
          return { error: true, detalle: ctx.mensaje };
        }
        const c = ctx.data;
        /* ═══ A10 · UN REFUGIO NO ENTRA POR LA PUERTA DEL PRESTADOR ═══════

           🔴 **REGRESIÓN MÍA, y su causa está a dos saltos de donde se ve.**
           Esta rama es la PRIMERA, y funcionaba mientras un refugio no tuviera
           fila en `prestadores`. **A6 le dio una:** `poblar_vitrina_refugio`
           —la RPC que pedí para que el refugio pudiera armar su vitrina— **crea
           esa fila**. ⇒ desde que el refugio arma su página, `c.prestador` deja
           de ser `null`, entra acá y **nunca llega a su propia rama**: aparece
           en la app de negocios con la barra de un prestador.

           *Y el defecto es peor que un orden equivocado: **la vitrina no se
           podía armar sin perder la casa**. A6 y A10 son la misma línea vista
           desde los dos lados.*

           Medido: ese refugio tiene `tipo='refugio'`, `estado='activo'` y
           **`prestador_servicios` activos = 0** — *no es un prestador en ningún
           sentido útil: no puede ofrecer nada, no tiene agenda, no cobra.*

           ⚠️ **SE GUARDA LA RAMA; NO SE MUEVE LA DEL REFUGIO.** Mi primer
           arreglo fue subir el bloque de refugio arriba de éste, y **eso
           invertía una firma**: el vendedor puro va ANTES que el refugio (§2.0,
           *«el vendedor puro es un DUEÑO y tiene la casa entera»*) y su rama
           vive DEBAJO de ésta. Subir el refugio lo ponía por encima del
           vendedor sin que nadie lo decidiera. *Curar un orden rompiendo otro
           no es curar: es mover el defecto de lugar.*

           🔴 **Y ESTE GUARD ES EL PARCHE, NO LA CURA.** `!c.esRefugio` también
           excluiría a un refugio que SÍ ofrezca un servicio, y ése tiene que
           entrar por las dos puertas. El discriminador correcto **no es la
           etiqueta `tipo` sino `prestador_servicios` activo** —*`tipo` es una
           etiqueta que alguien puede cambiar; tener oferta viva es el hecho de
           ser prestador*— y ése vive en el contrato: A lo cierra en
           `obtener_contexto_arranque`, que hoy le dice a **todo consumidor** que
           este refugio es un prestador, y este layout es sólo el primero que se
           lo cree. **Cuando eso llegue, este guard sobra y se retira.** ── */
        if (c.prestador !== null && !c.esRefugio) {
          // S79-B (T3-B3; T4-B3 · D-560): LISTA BLANCA — al portal entra
          // SOLO 'activo'; TODO lo demás (pendiente, en_revision,
          // suspendido, rechazado, y el sexto estado que nazca mañana)
          // aterriza en la sala de espera por default. La lista negra
          // vieja ('pendiente' solo) dejaba colar tres estados por
          // omisión. El titular lee su propia fila sea cual sea el
          // estado (RLS prestadores_public, brazo user_id).
          if (c.prestador.estado !== 'activo') return { sala_espera: true };
          /* ⭐ S98-C (D-819) · LAS DOS PREGUNTAS DE LA BARRA SALIERON DE ACÁ.
             Vivían inline —tres lecturas en una ola, más la asimetría de
             sus fallos (el rol cierra, la capacidad abre)— y **el destape
             del wizard necesitaba lo mismo**. Antes de copiarlas, se
             mudaron: `lib/barra-prestador-lectura`, con su porqué entero.
             *Dos copias no divergen algún día: divergen la primera vez que
             alguien cura una sola.* */
          const { esGestor, montaAtender, escalonAtender } = capacidadDesdeContexto(c);
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
            return { ok: true, esRefugioPuro: false, esGestor, montaAtender, escalonAtender, ceremonia: 'consultada' as const };
          }
          return {
            ok: true,
            esRefugioPuro: false,
            esGestor,
            montaAtender,
            escalonAtender,
            ceremonia: esGestor ? ('resuelta-para-este-usuario' as const) : ('no-gestor' as const),
          };
        }
        {
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
          /* ⭐ #0a: la pregunta «¿vendedora?» YA VINO en el contexto — el
             `contextoVentas()` que vivía acá (dos peticiones encadenadas)
             murió con la RPC. La sonda vieja no convive (adjudicación de
             mesa: cero convivencia). */
          if (c.esVendedora) {
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
            /* El contexto ya resuelto VIAJA (la ley de D, un piso más
               arriba): la composición es pura sobre el MISMO objeto. */
            const { esGestor, montaAtender, escalonAtender } = capacidadDesdeContexto(c);
            return {
              ok: true,
              esRefugioPuro: false,
              esGestor,
              montaAtender,
              escalonAtender,
              ceremonia: 'vendedor-puro' as const,
            };
          }
          /* ⭐ S112-C · EL REFUGIO ENTRA A SU CASA (§4.2).
             *«Mismo login de siempre… después, tres tabs: Home · Mascotas ·
             Cuenta.»* Su Home es el portal, no el HOY.

             🔴 **CERO VIAJE NUEVO:** `esRefugio` viene en el contexto que ya se
             pidió. *Leerlo aparte con `obtenerMiCuentaRefugio` habría sumado
             dos peticiones encadenadas al arranque de TODOS los prestadores,
             incluidos los que no son refugio* — lo mismo que `contextoVentas()`
             costaba acá antes de que la RPC lo trajera.

             ⚠️ **VA DESPUÉS DEL VENDEDOR PURO Y ES DELIBERADO.** Quien fuera las
             dos cosas cae en ventas, porque esa rama la firma el founder en
             §2.0 (*«el vendedor puro… es un DUEÑO y tiene la casa entera»*) y
             **reordenar una firma para acomodar un caso que hoy no existe sería
             tomarle la decisión a la mesa**. Se declara en vez de resolverse.

             ⚠️ Y **la ceremonia del primer ingreso NO se le pregunta**, por la
             misma razón que al vendedor puro: estampa sobre el TITULAR ACTIVO
             de un prestador, y un refugio puro no tiene esa fila. Pedirla sería
             un veredicto sobre un sujeto que no existe. Sus TÉRMINOS —que sí
             son su primera pantalla— los pide el propio portal, que es quien
             sabe si los aceptó. */
          if (c.esRefugio) {
            return {
              ok: true,
              esRefugioPuro: true,
              esGestor: false,
              montaAtender: false,
              escalonAtender: { escalon: 'varias' as const },
              ceremonia: 'refugio' as const,
            };
          }
          /* 🔴 S99-D · Gate 2 ④ — EL REPARTIDOR ENTRA A LO SUYO.
             **El rojo que cierra:** el Gate 2 midió que un repartidor real
             ACEPTA su vínculo —queda sellado en la base— y este resolvedor
             seguía diciéndole «sin rol prestador». Y el callejón se había
             vuelto MUDO: como ya no hay pendiente, el reclamo que montamos
             tres líneas más arriba tampoco se dibuja. **La pantalla existe
             desde S96 y no la alcanzaba nadie** — cuarta muestra de *motor
             sin puerta* en esta sesión.

             **VA ACÁ Y NO DESPUÉS, por la regla de la casa que S96 ya
             escribió para el vendedor puro:** *un panel donde puede
             TRABAJAR HOY gana a una voz de espera.* Si además fuera empleado
             de un negocio no-activo, el día que ese negocio active
             `obtener_contexto_arranque` resuelve arriba y esta rama ni se
             toca.

             **CERO VIAJE NUEVO:** `repartidorDe` viene en el contexto que ya
             se pidió (lector de A, vínculos SELLADOS — `user_id` +
             `vinculo_aceptado_en` + `activo`). Y **dice QUIÉN ES, no qué
             tiene**: derivarlo de `misEntregasAsignadas` habría confundido
             «no es repartidor» con «hoy no le tocó nada» (L-218, medición de
             C — su vacío significa dos cosas).

             ⚠️ **REDIRECT Y NO BARRA, y la diferencia con el vendedor puro
             es de LETRA, no de tamaño:** §2.0 le da la casa entera a un
             DUEÑO, y el repartidor no lo es — es alguien del vendedor con
             **tres acciones y nada más**, que ve *su envío y NADA más*
             (`LETRA_RECORRIDO` §9). Darle la barra sería ofrecerle cuartos
             que su propia letra le cierra.

             ⚠️ **N>1 SE DECLARA, NO SE RESUELVE A CIEGAS (L-244):** hoy es
             imposible tener vínculo sellado en dos casas, así que un selector
             sería una pantalla para un caso que no existe. Se toma la
             primera y **el forense dice cuántas vinieron**: el día que haya
             dos, el log lo grita antes de que alguien lo note por el lado
             equivocado. */
          /* 🔴 `?? []` Y NO ACCESO DIRECTO, y lo aprendí rompiendo el
             cascarón entero: con un bundle donde el campo todavía no existe,
             `c.repartidorDe[0]` lanza y el guard raíz cae en «No pudimos
             entrar a tu cuenta» — **un error duro es peor callejón que el
             callejón**, porque el anterior al menos decía qué hacer.
             El wrapper de A ya es fail-closed por diseño (*«un bundle viejo
             lee [] y degrada al callejón, jamás crashea»*); esta línea es la
             mitad que faltaba para que esa promesa se cumpla del lado del
             consumidor. *Una garantía que solo vive en el productor no es una
             garantía: es una convención.* */
          const casas = c.repartidorDe ?? [];
          const casa = casas[0];
          if (casa !== undefined) {
            return { repartidor: true, negocio: casa.negocio, casas: casas.length };
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
              /* El CONTADOR va en el forense a propósito: es la forma en que
                 «N>1 se declara» deja de ser una promesa del comentario. Con
                 dos casas el log lo dice en el arranque, antes de que alguien
                 lo descubra por el lado equivocado. */
              : 'repartidor' in r ? `repartidor de ${r.negocio}${r.casas > 1 ? ` (⚠️ ${r.casas} casas — N>1 declarado, se tomó la primera)` : ''} → /ventas/entregas`
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

  /* ⭐ S99-D · Gate 2 ④ — su pantalla, y solo su pantalla. Sin barra: ver
     la razón de letra en la rama del resolvedor. */
  if ('repartidor' in sesion) {
    return <Redirect href="/ventas/entregas" />;
  }

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
        {/* 🔴 S99-D · L2 — EL RECLAMO DEL VÍNCULO, MONTADO ACÁ Y NO EN OTRO
            LADO: éste es EL callejón que la pieza vino a abrir. El Gate 2 lo
            midió en vivo — el repartidor creó su cuenta con el correo con el
            que YA lo habían invitado, y esta misma pantalla le dijo *«avisale
            a quien administra el negocio que te invite»*, con un solo botón:
            cerrar sesión. **Estaba invitado.** El motor tenía la puerta desde
            S99-A con CERO consumidores; lo único que faltaba era llamarla, y
            el lugar de la llamada es el cascarón (territorio D).

            **Va ARRIBA del `EstadoVacio` a propósito:** si hay vínculo que
            reclamar, eso es lo que la persona vino a hacer — la voz de
            «nadie te registró» pasa a ser el pie, no el titular.

            ⚠️ **Montarla no cambia nada para quien no tiene pendientes:** la
            pieza devuelve `null`. Y si su lector FALLA tampoco dibuja —jamás
            un «no hay nada» falso, que mandaría a la persona a pedirle al
            vendedor algo que el vendedor ya hizo (contrato de C).

            `alAceptar` re-resuelve la sesión con el MISMO mecanismo que ya usa
            el cierre de sesión de abajo — no nace un camino nuevo: la persona
            entra a lo suyo sin reiniciar la app. */}
        <ReclamoVinculo
          alAceptar={() => {
            setSesion('verificando');
            setIntento((n) => n + 1);
          }}
        />
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
    /* S112-C · las dos del refugio. `refugio` para su casa —es el glifo que la
       vidriera del cliente ya usa para el mismo actor, así que las dos apps lo
       nombran igual— y `familia` para sus animales: son los que TIENE, no los
       que atiende, y `datos` (el de la tab del prestador) diría otra cosa. */
    adopcion: 'refugio',
    adoptables: 'familia',
  } as const satisfies Record<ClaveTabPrestador, IconoNombre>;

  const items: BarraTabsItem[] = ordenTabsPrestador({
    esRefugioPuro: sesion.esRefugioPuro,
    esGestor: sesion.esGestor,
    montaAtender: sesion.montaAtender,
    escalonAtender: sesion.escalonAtender,
  }).map((key) => ({
    key,
    etiqueta: t(KEY_ETIQUETA_TAB[key]),
    icono: ({ color, activa, colorHuella }) => (
      <Icono nombre={GLIFO_TAB[key]} tinta={color} huella={colorHuella} activa={activa} />
    ),
  }));

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <>
          <PresenciaDelShell altoBarra={altoBarra} />
          <View
            onLayout={(e) => {
              const alto = e.nativeEvent.layout.height;
              /* Se ignora el 0 del primer paso: un cero mediría «no hay barra» y
                 bajaría la burbuja justo donde la tapa. El umbral evita
                 re-render por ruido de sub-píxel. */
              setAltoBarra((previo) => (alto > 0 && Math.abs(previo - alto) > 0.5 ? alto : previo));
            }}
          >
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
            /* 🔴 S99-D · L-251 — EL ESCALÓN «UNA»: LA BARRA APUNTA AL
               DESTINO, y por eso se resuelve ACÁ y no adentro de la tab.
               *Un menú de una opción no es un menú: es un peaje* — con una
               sola capacidad, ATENDER lleva directo a esa puerta.

               ⚠️ **EL FRENO QUE C MIDIÓ ANTES DE QUE YO ESCRIBIERA MAL:** la
               forma fácil era un `Redirect` adentro de la tab. Con eso, el
               atrás del destino vuelve a la tab **y la tab redirige otra
               vez** — el back queda en una RATONERA. Primo de L-249 y del
               encierro de D-836 que acabo de curar. *La tab no rebota: la
               barra apunta.*

               Va ANTES del re-toque a la raíz a propósito: con escalón
               `una` la tab `atender` **nunca se monta**, así que no tiene
               raíz a la que volver ni stack que popear. */
            if (key === 'atender' && sesion.escalonAtender.escalon === 'una') {
              const d = sesion.escalonAtender.destino;
              if (d.ruta === '/ventas/mostrador') router.push('/ventas/mostrador');
              else router.push({ pathname: '/mostrador', params: { oficio: d.oficio } });
              return;
            }
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
          </View>
        </>
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
      {/* 🔴 S99-D · D-836 — LA VENTANA HERMANA VIVE ADENTRO DEL NAVEGADOR.
          Firma del founder caminando: *«de la parte de pedidos se pierden
          los cuatro tabs, toca devolverse al de citas para poder navegar»*.
          **Yo la había montado como ruta EMPUJADA del stack raíz** (como
          `/ventas`), y esa forma le saca la barra: la persona quedaba en una
          ventana de la casa **sin la casa**. Es clase L-249 y peor que el
          encierro del repartidor — aquélla era una pantalla-única sin
          salida; ésta es un cuarto que perdió el pasillo.
          El molde es el de `gallery`, que la casa ya tenía: **declarada acá
          y AUSENTE de `items`** — existe, se alcanza por su ruta, y la barra
          no la nombra. La ruta sigue siendo `/pedidos` (el grupo `(tabs)` no
          agrega segmento), así que **ningún enlace cambia**. */}
      <Tabs.Screen name="pedidos" />
      {/* galería de tokens: fuera de la barra, viva por URL (/gallery) */}
      <Tabs.Screen name="gallery" />
    </Tabs>
  );
}
