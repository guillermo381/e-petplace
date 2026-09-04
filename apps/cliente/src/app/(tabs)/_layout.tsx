/**
 * Navegación raíz del dueño (S51-B2.1) — decisión founder S50: TRES
 * tabs, Hogar·Explorar·Cuenta. La agenda NO es tab (las citas son
 * estado del hogar). El 4º slot NO existe hoy — ciclo del trono (§3
 * de DISEÑO_EXPERIENCIA): la Despensa entra por configuración en A6
 * y cede a Comunidad en F3; este array es esa configuración.
 *
 * 🔴 **S100c-D · PEDIDOS ENTRA COMO QUINTA TAB — FIRMA DEL FOUNDER, Y EL
 * NÚMERO QUE LA DECIDIÓ NO ES EL QUE LA MESA CREÍA.**
 *
 * `Hogar · Explorar · Despensa · Pedidos · Cuenta`. **Explorar NO se retira.**
 *
 * ── CÓMO SE LLEGÓ ACÁ, PORQUE LA HISTORIA ES LA LECCIÓN ─────────────────
 * ① Se firmó *«la barra queda en cuatro ⇒ Pedidos reemplaza a Explorar»*,
 * apoyado en que **el hombro de la cresta libraba por 1,3 dp** en el teléfono
 * del founder — *un margen de 1,3 dp no es holgura, es azar*. · ② **El
 * founder aportó el dato que dio vuelta la premisa: `e-PetPlace Negocios`
 * —nuestra propia app— TIENE CINCO TABS Y SE VEN BIEN, en el mismo
 * teléfono.** · ③ B midió **las dos barras lado a lado** y su propia
 * restricción resultó falsa.
 *
 * **Lo medido, que es lo que rige:**
 *   · **es LA MISMA PIEZA** (`BarraTabs` de `packages/ui` en las dos apps),
 *     **mismo ícono de 24,2 dp** y mismo largo de etiqueta ⇒ *el largo del
 *     texto no era la variable, aunque parecía.*
 *   · lo que difiere es **dónde cae el disco**: el prestador lo tiene **al
 *     borde y vive con 20,7 dp de hueco**; el cliente con cinco tendría
 *     **28,8 dp** — **MÁS AIRE QUE EL CASO QUE EL FOUNDER YA APRUEBA.**
 *
 * ⇒ **entra**, y con eso **`H-116` se disuelve sin necesidad de firma**: el
 * descubrimiento de los servicios se conserva porque Explorar se queda.
 *
 * 🔴 **LA LECCIÓN, Y NOS ALCANZA A LOS DOS:** yo medí el valle, B midió el
 * ícono — **dos mediciones buenas, ninguna mirada en pantalla.** Lo que
 * faltaba no era un tercer número: era **comparar con la otra barra**, que
 * vivía en el mismo teléfono desde antes de empezar. *Cuando dos pistas se
 * pasan números y la pregunta no cierra, lo que falta suele no ser otro
 * número — es el objeto que nadie miró.*
 *
 * ── EL ORDEN NO ES LIBRE: LO RESTRINGE UNA LETRA FIRMADA ────────────────
 * `DISEÑO_EXPERIENCIA` §7 (**ciclo del trono**): la Despensa ocupa el trono
 * y *«cuando llegue Comunidad, Comunidad va al CENTRO»*. **Con cinco tabs el
 * centro es la posición 3 exacta** —con cuatro no existía centro verdadero—,
 * así que **Pedidos va CUARTO** y la Despensa queda centrada. Meterlo segundo
 * la empujaría a la 4ª y **rompería el trono en la única barra que el dueño
 * ve todos los días**. Cuenta sigue cerrando, que es la convención medida en
 * las dos apps.
 *
 * ⚠️ **LO QUE EL NÚMERO NO RESUELVE Y VA AL OJO DEL FOUNDER:** el prestador
 * tiene **UN** hueco angosto; el cliente con cinco tiene **DOS** (los dos
 * lados del disco). **28,8 > 20,7 en cada uno, pero si dos huecos angostos se
 * leen peor que uno, eso es ojo y no número.** Declarado, no dado por bueno.
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import { StackActions } from 'expo-router/react-navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ALTO_FILA_TABS,
  BarraTabs,
  BurbujaPendientes,
  Icono,
  PresenciaCoach,
  useAviso,
  type AtajosCoach,
  type BarraTabsItem,
  type IconoNombre,
  type PendientesCoach,
  type Pendiente,
} from '@epetplace/ui';
import { useCarrito } from '@/lib/despensa/carrito';
import { clasesVisibles, escucharPendientes, usePendientesAdopcion } from '@/lib/pendientes-adopcion';
import { listarMisPedidos } from '@epetplace/api';

import { CoachHoja } from '@/components/coach';
import { ElegirMascotaHoja } from '@/components/nexo/elegir-mascota-hoja';
import { RegistrarPesoHoja } from '@/components/registrar-peso-hoja';
import {
  focoNexo,
  mascotasParaAtajo,
  razonDelDedo,
  ORDEN_DE_PATA,
  type AtajoNexo,
  type RazonApagado,
} from '@/lib/nexo/atajos';
import { estadoNexo, nexoVisibleEn } from '@/lib/nexo/estado';
import { recargarHogar, useHogarVivo } from '@/lib/nexo/hogar-vivo';
import type { MascotaResumen } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/* ☠️ S86-B · `@/components/iconos-tabs` MURIÓ — LA BARRA CONSUME EL
 * REGISTRY (D-645 / D-546). Los tres glifos de esta barra vivían
 * copiados a mano, y **los tres habían divergido del set firmado**:
 * la casa (dos paths donde el registry tiene uno), la brújula (r 8.8
 * contra 8.4, huella en otra posición y escala) y la CHAPITA DE
 * COLLAR — que el registry había reemplazado por la persona
 * (cabeza + hombros) en S85-B23 por orden del founder, *"algo que
 * realmente parezca cuenta"*. **Esa firma nunca llegó al cliente**,
 * y nada falló: una copia no se entera de que la fuente cambió.
 * Ahora hay UNA fuente, y `Icono` resuelve la ley 6 adentro. */

/**
 * 🔴 LA MARCA DE «ESTA CASA YA COMPRÓ» — y no es caché, es ANTI-SALTO.
 *
 * La firma dice que Pedidos **aparece con el primer pedido**, y eso exige
 * saber si hay pedidos **antes de dibujar la barra**. La lectura tarda.
 *
 * **Sin la marca, cada arranque en frío dibujaría CUATRO tabs y saltaría a
 * CINCO cuando llegara la respuesta** — y como el ancho de cada pestaña es
 * `ancho / cantidad`, ese salto **re-acomoda la barra entera**, disco y valle
 * incluidos, en la superficie que el dueño toca todos los días. *No es un
 * parpadeo de contenido: es la barra cambiando de forma bajo el pulgar.*
 *
 * La marca es **monótona a propósito**: un pedido no se borra, así que «esta
 * casa ya compró» **no vuelve a ser falso**. Por eso se persiste y jamás se
 * limpia — *una marca que puede volver atrás reintroduce el salto que vino a
 * evitar.*
 *
 * ⚠️ **El salto ocurre UNA vez y es el bueno:** el día de la primera compra,
 * la barra gana su casa de postventa. Eso no se esconde.
 */
const CLAVE_YA_COMPRO = 'epp.cliente.tienePedidos.v1';


/**
 * ⭐ **LA BURBUJA DE PENDIENTES — UNA puerta a lo que te espera** (S112-C,
 * montaje; la pieza es de B, `BurbujaPendientes`).
 *
 * ☠️ **ACÁ VIVÍA `FlotanteDelCarrito`, Y MURIÓ EN ESTE MISMO COMMIT.** Su
 * lápida estaba escrita por B con su disparo: *el día que este archivo monte
 * `BurbujaPendientes`, `CarritoFlotante` y `COLA_CARRITO_FLOTANTE` se borran
 * en ese mismo commit.* **Y el intervalo es la razón:** *si se monta la nueva y
 * queda la vieja hay DOS DISCOS peleando el mismo píxel; si se retira la vieja
 * sin montar la nueva, no hay ninguna y la tienda no se puede pagar.* (`L-395`.)
 *
 * ── DOS CLASES, Y EL SILENCIO ES DE CADA UNA ────────────────────────────────
 * **Carrito** existe por sus unidades y se calla en `carrito`/`checkout` (N25).
 * **Mensajes** existe por sus conversaciones sin leer y se calla **en el
 * hilo** — que es su destino **y** donde el disco caería justo sobre la barra
 * de escribir (el rojo del founder).
 *
 * 🔴 **Y por eso el silencio es POR CLASE y no de la pieza:** *un mensaje
 * pendiente en el checkout sigue estando pendiente.* Con dos burbujas había que
 * apagar una entera; acá **la clase sale del arreglo y la otra sigue viva**.
 * La lista y su razón viven en `lib/pendientes-adopcion.ts`, con arnés.
 *
 * ⚠️ **La clase en CERO no se filtra acá**: la pieza lo hace con `clasesVivas`
 * — *una clase en cero no es una clase*, y decidirlo dos veces sería que dos
 * lugares tengan que estar de acuerdo.
 *
 * ⚠️ **CRUCE DE TERRITORIO DECLARADO (76(d)):** este archivo es del shell del
 * cliente, la pieza es de `packages/ui`, y el borrado de `CarritoFlotante`
 * toca `packages/ui` **con autorización explícita de B**. *El montaje ES la
 * decisión, no un detalle de implementación* (N28).
 */
function BurbujaDelShell({ altoBarra }: { altoBarra: number }) {
  const { t } = useTraduccion();
  const router = useRouter();
  const items = useCarrito();
  const pendientes = usePendientesAdopcion();
  /* 🔴 `useSegments()` y NO `state.routes[state.index].name`: el guard viejo
     comparaba contra `'checkout'` un valor que su fuente **nunca puede
     producir** (devuelve el nombre del TAB). *Un guard así no falla: pasa
     siempre — y su comentario lo empeora, porque el que lo lee cree que está
     cubierto.* Vivió muerto por eso. */
  const visibles = clasesVisibles(useSegments() as string[]);

  const lista: Pendiente[] = [
    {
      clase: 'carrito',
      cuenta: visibles.carrito ? items.reduce((n, i) => n + i.cantidad, 0) : 0,
      onAbrir: () => router.push('/despensa/carrito'),
      etiqueta: t('burbuja.carritoEtiqueta'),
      titulo: t('burbuja.carritoTitulo'),
    },
    {
      clase: 'mensajes',
      cuenta: visibles.mensajes ? pendientes.conversaciones : 0,
      /* LA REGLA DEL TOQUE, y la decide el DOMINIO: con UNA conversación va al
         hilo; con varias, a la lista. `unica` ya trae el id **si y sólo si**
         corresponde — *si cada shell lo resolviera, alcanzaría con escribir
         `>= 1` en vez de `=== 1` para saltar al hilo equivocado.* */
      onAbrir: () =>
        pendientes.unica !== null
          ? router.push({ pathname: '/adoptar/solicitud/[solicitudId]', params: { solicitudId: pendientes.unica } })
          : router.push('/adoptar/solicitudes'),
      etiqueta: t('burbuja.mensajesEtiqueta'),
      titulo: t('burbuja.mensajesTitulo'),
    },
  ];

  return (
    <BurbujaPendientes pendientes={lista} etiquetaAbanico={t('burbuja.abanico')} aireInferior={altoBarra} />
  );
}

/**
 * ⭐ **NEXO EN EL SHELL — la presencia del Coach, montada** (S113-C · lote 0).
 *
 * ── QUÉ REEMPLAZA Y QUÉ CONSERVA ────────────────────────────────────────────
 * Reemplaza al disco de `BurbujaPendientes` **cuando hay hogar activo**, y
 * conserva sus dos destinos como pastillas: *«las pastillas de pendientes abren
 * lo mismo que abría la burbuja»* (§2.4).
 *
 * 🔴 **SE MONTA UNA DE LAS DOS, NUNCA LAS DOS** — es la regla que B dejó escrita
 * en su pieza y la razón es física: **ocupan exactamente el mismo píxel**
 * (`right: spacing[5] · bottom: spacing[5] + aireInferior`, medido en las dos
 * fuentes). *Dos discos peleando el mismo píxel es el defecto que `L-395` dejó
 * escrito.* En memorial manda la burbuja; en el resto, la presencia.
 *
 * 🔴 **Y MIENTRAS EL HOGAR NO CONTESTÓ TAMBIÉN QUEDA LA BURBUJA.** No es
 * timidez: la puerta del carrito es **firma del founder** (N28 — visible en TODA
 * la app) y **no puede parpadear**. Empezar por la burbuja y pasar a la
 * presencia cuando el dato llega nunca la pierde; al revés habría un instante de
 * pata sobre un hogar que resulta ser memorial. *Vacío por carga y vacío por
 * estado son dos hechos y no comparten guard.*
 *
 * ── DE DÓNDE SALEN LOS NÚMEROS ──────────────────────────────────────────────
 * **Del servidor, y del mismo lugar que ya los traía**: `contarPendientes` vía
 * `usePendientesAdopcion` (conversaciones sin leer) y `useCarrito` (unidades).
 * **No nació `obtenerPendientesHogar`** porque el conteo que hacía falta ya lo
 * contaba el servidor — *pedir un wrapper nuevo para leer dos veces el mismo
 * hecho es fabricar la divergencia.*
 *
 * ⚠️ **`avisos` VIAJA EN `null` Y ESO ES LETRA, NO HUECO:** el servidor expone
 * `hayAvisosSinLeer` —un BOOLEANO— porque `MODELO_LOYALTY` §3 manda que los no
 * leídos sean PRESENCIA y jamás número. El tipo de B ya distingue `null` de `0`,
 * así que el dato **no se tira en la puerta**.
 *
 * ── LA VOZ ES DE ACÁ (Ley 3) ────────────────────────────────────────────────
 * `voz.chat` y `voz.pedidos` **se pasan siempre, aunque la cuenta sea 0**: así
 * un número no puede existir sin su palabra, y la pieza nunca tiene que inventar
 * un plural. El singular y el plural salen de mis keys.
 *
 * ── EL AIRE LO MIDE LA BARRA ────────────────────────────────────────────────
 * `aireInferior` es el alto REAL de la barra de pestañas, medido con `onLayout`
 * en este mismo archivo. *Un número tecleado acá miente en el primer teléfono
 * distinto* — y la geometría de la pieza no se importa a propósito: B la dejó
 * sin exportar y lo único que la pantalla necesita es `COLA_PRESENCIA_COACH`.
 *
 * ── SOBRE QUÉ MASCOTA ACTÚA UN DEDO ─────────────────────────────────────────
 * `useGlobalSearchParams` — **el dato ya viaja**: las cuatro rutas de mascota
 * llevan `mascotaId` en la URL. *No hace falta inventar un estado de «mascota en
 * foco» cuando la ruta ya lo dice.* Con una sola candidata no se pregunta; con
 * varias, la hoja corta — y **la hoja ofrece sólo las que ese dedo puede tocar**,
 * porque un camino que después habría que rebotar no es un camino.
 */
function NexoDelShell({ altoBarra }: { altoBarra: number }) {
  const { t } = useTraduccion();
  const router = useRouter();
  const { mostrar } = useAviso();
  const items = useCarrito();
  const pendientesAdopcion = usePendientesAdopcion();
  const mascotas = useHogarVivo();
  const segmentos = useSegments() as string[];
  const { mascotaId: mascotaIdEnRuta } = useGlobalSearchParams<{ mascotaId?: string }>();

  const [abierta, setAbierta] = useState(false);
  const [hojaCoach, setHojaCoach] = useState<MascotaResumen | null>(null);
  const [hojaPeso, setHojaPeso] = useState<MascotaResumen | null>(null);
  /** El dedo que espera saber de quién habla. `'coach'` es la almohadilla. */
  const [esperandoElegir, setEsperandoElegir] = useState<AtajoNexo | 'coach' | null>(null);

  const foco = focoNexo({ mascotaIdEnRuta, mascotas });

  /* Nexo no existe en la cámara del carnet, en las llamadas, en los checkouts
     ni en la caja: la lista y su razón viven en `lib/nexo/estado.ts`. */
  if (!nexoVisibleEn(segmentos)) return null;

  /* MEMORIAL o hogar que todavía no contestó ⇒ la burbuja de siempre, y NUNCA
     las dos: ocupan el mismo píxel. */
  if (foco.modo !== 'directa' && foco.modo !== 'elegir') {
    return <BurbujaDelShell altoBarra={altoBarra} />;
  }

  /* Sobre quiénes puede actuar la pata acá: la del foco, o todas las activas. */
  const candidatas: MascotaResumen[] = foco.modo === 'directa' ? [foco.mascota] : foco.entre;

  const enCarrito = items.reduce((n, i) => n + i.cantidad, 0);
  const pendientes: PendientesCoach = {
    chat: pendientesAdopcion.conversaciones,
    /* La clase se llama `pedidos` en la pieza; **lo que abre es el carrito**,
       que es lo que abría la burbuja. Ver la cabecera de `lib/nexo/estado.ts`. */
    pedidos: enCarrito,
    avisos: null,
  };

  const ejecutar = (atajo: AtajoNexo | 'coach', m: MascotaResumen) => {
    if (atajo === 'coach') return setHojaCoach(m);
    if (atajo === 'peso') return setHojaPeso(m);
    if (atajo === 'vacuna') {
      router.push({ pathname: '/carnet', params: { mascotaId: m.id, nombre: m.nombre } });
      return;
    }
    if (atajo === 'antiparasitario') {
      router.push({ pathname: '/antiparasitario', params: { mascotaId: m.id, nombre: m.nombre } });
      return;
    }
    /* 'foto' no llega hasta acá: nace apagado con su razón — medido, no hay un
       solo escritor de `evento_hito_narrativo` en `packages/api`. */
  };

  /* Las mascotas entre las que este dedo puede elegir. La almohadilla las
     admite a todas: el Coach habla de cualquiera. */
  const candidatasDe = (atajo: AtajoNexo | 'coach') =>
    atajo === 'coach' ? candidatas : mascotasParaAtajo(atajo, candidatas);

  const tocar = (atajo: AtajoNexo | 'coach') => {
    setAbierta(false);
    const posibles = candidatasDe(atajo);
    /* 🔴 **UNA SOLA POSIBLE NO SE PREGUNTA**, aunque el hogar tenga varias: con
       un perro y un acuario, «Vacuna» ya sabe de quién habla. *Preguntar con una
       sola opción es un paso que no decide nada.* */
    if (posibles.length === 1) return ejecutar(atajo, posibles[0]);
    if (foco.modo === 'directa') return ejecutar(atajo, foco.mascota);
    if (posibles.length > 1) return setEsperandoElegir(atajo);
  };

  const vozAtajo: Record<AtajoNexo, string> = {
    peso: t('nexo.dedoPeso'),
    vacuna: t('nexo.dedoVacuna'),
    antiparasitario: t('nexo.dedoAntiparasitario'),
    foto: t('nexo.dedoFoto'),
  };

  /* 🔴 LOS TRES GLIFOS PRESTADOS, con su costo escrito en `lib/nexo/atajos.ts`:
     `datos` (barras que suben — el peso ES una serie) · `receta` · `ojo`. **No
     se inventó ninguno**: un glifo se firma con su estudio §6b y su gate. */
  const glifoAtajo: Record<AtajoNexo, IconoNombre> = {
    peso: 'datos',
    vacuna: 'vacuna',
    antiparasitario: 'receta',
    foto: 'ojo',
  };

  const vozRazon = (r: RazonApagado): string =>
    r === 'acuario' ? t('nexo.razonAcuario') : t('nexo.razonSinPuerta');

  /* 🔴 **LA TUPLA ES DE CUATRO Y EL COMPILADOR LO EXIGE.** `ORDEN_DE_PATA` tiene
     cuatro y el `as` lo afirma; si alguien le agrega un quinto, **rompe acá**,
     que es donde tiene que romper. */
  const atajos = ORDEN_DE_PATA.map((a) => {
    const razon = razonDelDedo(a, candidatas);
    const base = { id: a, icono: glifoAtajo[a], etiqueta: vozAtajo[a] };
    /* Vivo o apagado-con-razón: los dos a la vez no compilan (contrato de B), y
       un atajo apagado y mudo tampoco se puede escribir. */
    return razon === null
      ? { ...base, onPress: () => tocar(a) }
      : { ...base, razonApagado: vozRazon(razon) };
  }) as unknown as AtajosCoach;

  const nombre = t('coach.nombre');

  return (
    <>
      <PresenciaCoach
        estado={estadoNexo({ pendientes, huellaAbierta: abierta, hojaAbierta: hojaCoach !== null })}
        pendientes={pendientes}
        atajos={atajos}
        nombre={nombre}
        abierta={abierta}
        onAbrir={() => setAbierta(true)}
        onCerrar={() => setAbierta(false)}
        onPreguntar={() => tocar('coach')}
        onPendiente={(clase) => {
          setAbierta(false);
          /* LA REGLA DEL TOQUE LA DECIDE EL DOMINIO: con UNA conversación va al
             hilo; con varias, a la lista. `unica` ya trae el id si y sólo si
             corresponde — copiado del montaje que reemplaza, no reinventado. */
          if (clase === 'chat') {
            pendientesAdopcion.unica !== null
              ? router.push({ pathname: '/adoptar/solicitud/[solicitudId]', params: { solicitudId: pendientesAdopcion.unica } })
              : router.push('/adoptar/solicitudes');
            return;
          }
          router.push('/despensa/carrito');
        }}
        voz={{
          preguntar: t('nexo.almohadilla', { nombre }),
          orbe: t('nexo.etiqueta', { nombre }),
          /* ⚠️ **SIEMPRE, aunque la cuenta sea 0** — así un número no existe sin
             su palabra y la pieza nunca inventa un plural. */
          chat:
            pendientesAdopcion.conversaciones === 1
              ? t('nexo.vozChatUna')
              : t('nexo.vozChat', { n: pendientesAdopcion.conversaciones }),
          pedidos: enCarrito === 1 ? t('nexo.vozCarritoUno') : t('nexo.vozCarrito', { n: enCarrito }),
          cerrar: t('nexo.cerrar'),
        }}
        aireInferior={altoBarra}
        /* La razón se muestra acá, en UNA línea. La pieza no elige el vehículo;
           la casa ya tiene uno y es el aviso. */
        onRazonApagado={(razon) => mostrar({ texto: razon })}
      />

      <ElegirMascotaHoja
        visible={esperandoElegir !== null}
        titulo={t('nexo.elegirMascota')}
        /* Sólo las que este dedo puede tocar: **la hoja no ofrece un camino que
           después habría que rebotar.** */
        mascotas={esperandoElegir !== null ? candidatasDe(esperandoElegir) : []}
        onElegir={(m) => {
          const pendiente = esperandoElegir;
          setEsperandoElegir(null);
          if (pendiente !== null) ejecutar(pendiente, m);
        }}
        onCerrar={() => setEsperandoElegir(null)}
      />

      {hojaPeso !== null ? (
        <RegistrarPesoHoja
          visible
          nombre={hojaPeso.nombre}
          mascotaId={hojaPeso.id}
          onCerrar={() => setHojaPeso(null)}
          /* Desde el shell no hay perfil abierto que releer: la pantalla de la
             mascota lee su serie al recuperar el foco. */
          onRegistrado={() => setHojaPeso(null)}
        />
      ) : null}

      {hojaCoach !== null ? (
        <CoachHoja
          visible
          onCerrar={() => setHojaCoach(null)}
          mascotas={mascotas ?? []}
          mascotaInicial={hojaCoach.id}
        />
      ) : null}
    </>
  );
}

export default function TabsLayout() {
  const { t } = useTraduccion();
  /** `null` = todavía no sabemos (primer arranque, sin marca): la tab NO se
   *  dibuja. *Ante la duda no se ofrece una casa vacía* — el acceso vive en
   *  Cuenta, que es exactamente lo que la firma dice. */
  const [tienePedidos, setTienePedidos] = useState<boolean | null>(null);

  /* 🔴 EL ALTO DE LA BARRA — **SE MIDE, Y ARRANCA EN EL VALOR DERIVADO.**
   *
   * Las dos mitades importan y la segunda es la lección de esta vuelta:
   *
   * ① **se mide** (`onLayout` sobre la barra real) porque su alto cambia con el
   *    inset del aparato, con el idioma de las etiquetas y con cuántas tabs
   *    hay —cuatro o cinco según haya pedidos—. *Un número tecleado acá miente
   *    en el primer teléfono distinto, y ya mintió en éste.*
   *
   * ② **arranca en `ALTO_FILA_TABS + insets.bottom`, que es la fórmula propia
   *    de `BarraTabs`** (`altoTotal = ALTO_FILA + insets.bottom`, leída de su
   *    fuente). ⚠️ **Y esto no es cinturón de más: es lo que separa esta
   *    medición de la que HOY está fallando en `Encabezado`.**
   *
   * *Medido en este mismo bundle: el techo deriva su inset con
   * `measureInWindow` y, contra un padre que aplica su padding del lado nativo,
   * **pierde la carrera y se queda con su valor de arranque — que ahí es el
   * EQUIVOCADO**, y por eso el defecto es invisible y lleva dos vueltas vivo.*
   *
   * ⇒ **la regla que dejo escrita: una medición asincrónica solo es segura si
   * su valor de arranque ya es correcto.** Con el arranque bueno, perder la
   * carrera no cuesta nada; con el arranque malo, perderla es el defecto. */
  const insets = useSafeAreaInsets();
  const [altoBarra, setAltoBarra] = useState(ALTO_FILA_TABS + insets.bottom);

  /* ⭐ **EL VIVO DE LA BURBUJA — UNA suscripción por SESIÓN, y vive acá.**
     Va en el shell y no en una pantalla porque *su condición de existencia es
     un dato, no una ruta* (N28): el número tiene que ser cierto en cualquier
     pantalla, incluidas las que no saben que la burbuja existe.

     ⭐ **Y NO hay un recuento de arranque aparte, a propósito.**
     `suscribirseAMisHilos` emite `'reconectado'` **también en la primera
     conexión** (contrato de A, escrito así para esto) ⇒ *la carga inicial y el
     refresco son el MISMO camino*: «llegó algo, pedí el contador». Dos caminos
     serían dos formas de estar de acuerdo, y una de las dos envejece.

     ⚠️ Sin deps: se monta con el shell y se desmonta con él. */
  useEffect(() => escucharPendientes(), []);

  /* ⭐ EL HOGAR QUE NEXO NECESITA — **una lectura por SESIÓN**, acá y no por
     pantalla. Su condición de existencia es un dato (¿hay mascotas activas?),
     no una ruta: tiene que ser cierto en cualquier pestaña. */
  useEffect(() => {
    void recargarHogar();
  }, []);

  useEffect(() => {
    let vive = true;
    void (async () => {
      // La marca primero: si ya compró, la barra nace con sus cinco tabs y la
      // red ni siquiera decide el primer frame.
      try {
        const marca = await AsyncStorage.getItem(CLAVE_YA_COMPRO);
        if (vive && marca === '1') setTienePedidos(true);
      } catch {
        /* la marca no bloquea — se cae a la lectura */
      }
      const r = await listarMisPedidos();
      if (!vive) return;
      // 🔴 UN FALLO DE LECTURA NO APAGA LA TAB. `r.ok === false` significa
      // «no pude preguntar», jamás «no tenés pedidos» — y apagar una tab por
      // un error de red la haría desaparecer bajo el dedo de alguien que sí
      // compró. *El silencio no es un no* (L-139).
      if (!r.ok) return;
      if (r.data.length > 0) {
        setTienePedidos(true);
        try {
          await AsyncStorage.setItem(CLAVE_YA_COMPRO, '1');
        } catch {
          /* sin marca, el próximo arranque paga el salto una vez más */
        }
      } else {
        setTienePedidos((previo) => previo ?? false);
      }
    })();
    return () => {
      vive = false;
    };
  }, []);

  const items: BarraTabsItem[] = [
    {
      key: 'hogar',
      etiqueta: t('tabs.hogar'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="hogar" tinta={color} huella={colorHuella} activa={activa} />
      ),
    },
    {
      key: 'explorar',
      etiqueta: t('tabs.explorar'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="explorar" tinta={color} huella={colorHuella} activa={activa} />
      ),
    },
    {
      key: 'despensa',
      etiqueta: t('tabs.despensa'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="despensa" tinta={color} huella={colorHuella} activa={activa} />
      ),
    },
    /* 🔴 PEDIDOS — LA CASA DEL POSTVENTA, CUARTA POR EL CICLO DEL TRONO.
     * *En curso arriba, historial abajo, y los accesos adentro: ahí crece sin
     * límite y sin esconder nada.* El founder evaluó un menú plegable y la
     * mesa lo desaconsejó — **esconde lo que contiene, que es la misma cura
     * que ya falló cuando «Tus pedidos» quedó enterrado al fondo de la
     * vitrina** (G-15).
     *
     * **Aparece con el primer pedido** (firma del founder): mientras no haya,
     * el acceso vive en Cuenta — donde ya está. */
    ...(tienePedidos === true
      ? [
          {
            key: 'pedidos',
            etiqueta: t('tabs.pedidos'),
            /* ✅ GLIFO PROPIO — el préstamo duró un commit. Yo había montado
             * `despensa` **declarando su costo** (dos tabs vecinas con el
             * mismo dibujo) en vez de inventar una forma, porque *un glifo se
             * firma por gate* (§2.9); **B lo construyó con el pedido en la
             * mano y su discriminador es LA TAPA** — una costura horizontal de
             * lado a lado que ni la bolsa (`despensa`) ni el carro (`carrito`)
             * tienen, y que **sobrevive a 21 px porque es una recta**, no un
             * detalle de trazo.
             *
             * Con esto los tres momentos de la compra se distinguen en la
             * misma barra: **bolsa = la sección · carro = lo que llevás sin
             * comprar · caja = lo que ya compraste y viene en camino.** Hereda
             * el ocre de `despensa`: misma familia, otro momento.
             *
             * ⚠️ **SIN GATE DE ÍCONO todavía** — B declaró que no hay
             * rasterizador SVG en su entorno, así que **nadie lo vio a 21 px**.
             * Va al ojo del founder junto con `carrito` y `papelera`. */
            icono: ({ color, activa, colorHuella }) => (
              <Icono nombre="pedido" tinta={color} huella={colorHuella} activa={activa} />
            ),
          } satisfies BarraTabsItem,
        ]
      : []),
    {
      key: 'cuenta',
      etiqueta: t('tabs.cuenta'),
      icono: ({ color, activa, colorHuella }) => (
        <Icono nombre="cuenta" tinta={color} huella={colorHuella} activa={activa} />
      ),
    },
  ];

  /* ☠️ MURIÓ `tabDeRuta` — mapeaba `pedidos` → `despensa` mientras Pedidos
   * era una ruta sin botón. **Con su tab propia, el mapeo mentiría.** Ley 37:
   * el puente muere con la orilla que lo justificaba. */

  return (
    <Tabs
      // D-402 (ENMENDADA S63, hallazgo founder): el reset a raíz se
      // dispara SOLO en el PRESS explícito del tab (abajo, en
      // onCambiar). El popToTopOnBlur anterior era el desvío: el blur
      // también dispara cuando una ruta de nivel raíz (el parte, el
      // detalle) se monta encima de los tabs o cuando un flujo cruza
      // de tab — vaciaba el stack A MITAD del flujo y la flecha de
      // atrás (goBack correcto) aterrizaba en la raíz del mundo
      // porque los pasos previos ya no existían.
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <>
          {/* 🔴 EL CARRITO FLOTANTE VIVE EN EL SHELL — S100d·bis, firma del
              founder: *«si salgo de Despensa, se pierde el carro; mientras
              tenga productos debe estar visible en TODA la app, y desaparece
              cuando no tiene productos»*.

              ⏪ **Vivía por PANTALLA** (vitrina y ficha), así que salir de la
              Despensa lo perdía. **Su condición de existencia es el CARRITO,
              no la ruta** — y por eso se monta acá, una vez, sobre las cinco
              tabs.

              **Dónde se CALLA, con su razón:** `carrito` y `checkout`. *Ahí el
              carrito no es un destino: es la pantalla en la que ya estás, y
              una puerta al cuarto donde estás parado es ruido con forma de
              atajo.* **La lista es por SUPERFICIE; la existencia, por dato.**

              **El aire lo MIDE la barra**, no lo teclea nadie: su alto cambia
              con el inset del aparato y con el idioma de las etiquetas. *Un
              número acá miente en el primer teléfono distinto.*

              ⚠️ **CRUCE DE TERRITORIO DECLARADO:** este archivo es del shell
              del cliente y la pieza es de `packages/ui`. Se toca acá porque el
              montaje ES la firma —el flotante deja de ser de una pantalla— y
              se declara en vez de hacerse callado. */}
          <NexoDelShell altoBarra={altoBarra} />
          <View
            onLayout={(e) => {
              const alto = e.nativeEvent.layout.height;
              // Se ignora el 0 del primer paso: un cero mediría "no hay barra"
              // y bajaría el flotante justo donde lo tapa. El umbral evita
              // re-render por ruido de sub-píxel.
              setAltoBarra((previo) => (alto > 0 && Math.abs(previo - alto) > 0.5 ? alto : previo));
            }}
          >
          <BarraTabs
          items={items}
          activo={state.routes[state.index].name}
            onCambiar={(key) => {
            const activa = state.routes[state.index];
            // D-402: el PRESS del tab lleva SIEMPRE a la raíz de ese
            // mundo — sea re-toque del activo o entrada a otro tab
            // con un flujo pendiente. Primero el pop (por target key,
            // funciona sin foco), después el navigate: se aterriza en
            // la raíz sin flash del stack viejo.
            const destino = state.routes.find((r) => r.name === key) ?? activa;
            if (destino.state?.type === 'stack' && destino.state.key && (destino.state.index ?? 0) > 0) {
              navigation.dispatch({ ...StackActions.popToTop(), target: destino.state.key });
            }
            if (key !== activa.name) {
              navigation.navigate(key);
            }
            }}
            // S53 (§2.6): el set b′ marca la tab activa con la HUELLA —
            // el pill muere; la huella hereda el rol de accent.active.
            estadoPorHuella
          />
          </View>
        </>
      )}
    >
      {/* ⚠️ EL MISMO ORDEN QUE `items`, Y NO POR PROLIJIDAD: son **dos listas
          que describen la misma barra**, y cuando dos listas de lo mismo
          divergen, el día que alguien lea una y edite la otra el defecto no
          tiene forma. *Acá el desorden no rompía nada hoy —la barra se dibuja
          de `items` y el activo sale de la ruta— y por eso es peor: una
          divergencia inofensiva es la que nadie corrige.* */}
      <Tabs.Screen name="hogar" />
      {/* ⚠️ EXPLORAR NO SE RETIRÓ, y de paso: acá viven **16 rutas — el flujo
          de reserva entero de los cuatro oficios**, al que empujan los cuatro
          `lib/reserva/*`. **Sacarla de esta lista habría roto las cuatro
          cadenas de reserva sin que ningún typecheck lo viera** — el modo de
          falla que esta casa llama silencioso. *Se deja escrito aunque el
          retiro ya no vaya a pasar: el próximo que quiera mover una tab tiene
          que leer que el botón y la ruta son dos cosas.* */}
      <Tabs.Screen name="explorar" />
      <Tabs.Screen name="despensa" />
      <Tabs.Screen name="pedidos" />
      <Tabs.Screen name="cuenta" />
    </Tabs>
  );
}
