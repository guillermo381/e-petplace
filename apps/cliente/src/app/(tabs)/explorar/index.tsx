/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXPLORAR — **quién puede cuidar a tu mascota, cerca** (S116-C · lote 5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TESIS (Ley 14): *dónde estás, qué oficios hay, y quién los hace cerca.*
 *
 * FIRMA (Ley 15): la **grilla de oficios cabalgando la costura** —discos
 * blancos con el glifo en ciruela, tres por fila— y debajo negocios REALES con
 * su distancia. *Hasta hoy esta pantalla mostraba cinco fichas informativas que
 * llevaban al hub de cada oficio: decía qué servicios EXISTEN, no quién los
 * hace.*
 *
 * ── LO QUE CAMBIA, y lo que NO ──────────────────────────────────────────────
 * **Cambia:** el buscador entra a la banda ciruela (misma firma que la
 * Despensa) · las cinco fichas se vuelven `GrillaOficios` en la costura · nace
 * «Cerca de ti» con `TarjetaPrestador` sobre `v_prestadores_publicos`.
 *
 * **NO cambia, y se conserva a propósito:** «Refugios y adopción» y
 * «Próximamente» siguen abajo, enteros. *El encargo describe lo que va arriba;
 * no dijo de sacar lo de abajo, y quitarlo sería estrechar el alcance por mi
 * cuenta.*
 *
 * ── LAS TRES COSAS QUE EL OBJETO DIJO Y HAY QUE SABER ───────────────────────
 * ① 🔴 **NINGÚN negocio tiene reseñas**: medido, los 11 de
 *    `v_prestadores_publicos` están en `total_resenas = 0`. El contrato de
 *    `TarjetaPrestador` dice *«sin reseñas la línea NO EXISTE, ni como “0
 *    reseñas”»* ⇒ **hoy ninguna tarjeta muestra calificación, y eso es lo
 *    correcto**: un cero con una estrella al lado diría «mal calificado» donde
 *    lo que pasa es «sin calificar».
 * ② ⚠️ **La tarjeta destacada NO se dibuja porque no hay promo**: existe
 *    `cupones` en la base y **cero lector de promociones de la casa**. La
 *    condición del encargo —*«si hay promo»*— hoy es falsa. Cuando exista el
 *    productor, la tarjeta entra entre la grilla y la lista (ley del nulo,
 *    19.9: el hueco no se reserva).
 * ③ ⚠️ **El buscador filtra lo que YA se trajo**, no consulta un motor de
 *    búsqueda: no existe uno de negocios (`buscarEnMiFamilia` busca en TU
 *    familia). *Se dice acá para que nadie lea la lupa como una promesa de
 *    buscar en todo el catálogo.*
 *
 * ESCALERA (§4b): peldaño 0 = sin dirección, «cerca» no se afirma y el
 * antetítulo no se dibuja · 1 = la grilla con sus oficios marcados · 2 = los
 * negocios con distancia real.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  HojaContenido,
  Cabecera,
  AIRE_RAIZ,
  AvatarMascota,
  Campo,
  Celda,
  CeldaNavegacion,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  GrillaOficios,
  Hoja,
  Icono,
  Separador,
  Tarjeta,
  TarjetaPrestador,
  Texto,
  glifoDeOficio,
  spacing,
  typography,
  useTheme,
  type Oficio,
  type OficioDeGrilla,
} from '@epetplace/ui';
import type { ReactNode } from 'react';
import {
  obtenerAdoptables,
  obtenerServiciosPais,
  obtenerDireccionHogar,
  listarIdsPrestadoresPublicos,
  obtenerPerfilesPublicos,
  type ServiciosPais,
  type DireccionHogar,
  type PerfilPublico,
} from '@epetplace/api';
import { oficioDeServicio, distanciaKm } from '@/lib/oficio-de-servicio';

// S58 (D-361): adiestramiento migró al set b′ — la estrella murió
// (violaba el set); el silbato canónico vive en el registry.
import { unidadesEnCarrito, useCarrito } from '@/lib/despensa/carrito';
import { useTraduccion } from '@/i18n';
import { ADOPCION_ALCANZABLE } from '@/lib/gate-adopcion';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';

// El soft launch es Ecuador (DEFINICION_SOFTLAUNCH); el país del
// usuario llega con el riel de país del ciclo B1.
const PAIS_SOFT_LAUNCH = 'EC';

// S52-P4b sistémico: títulos humanizados — sentence case, sin eyebrow.
function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size.md,
        color: theme.text.primary,
      }}
    >
      {texto}
    </Text>
  );
}

export default function Explorar() {
  const cabecera = useAltoDeCabecera('raiz');
  const unidadesCarrito = unidadesEnCarrito(useCarrito());
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [servicios, setServicios] = useState<ServiciosPais | 'cargando' | 'error'>('cargando');
  /* ¿HAY ALGUIEN ESPERANDO? — `null` mientras no sabemos.

     🔴 **Se PREGUNTA, y no se ofrece a ciegas, porque esta sección AFIRMA.**
     Su vacío dice «todavía no hay refugios publicados»: sin medir, o se borra
     esa frase o se la deja mintiendo. Midiendo, la sección dice la verdad en
     los dos casos y **la entrada sólo aparece cuando lleva a alguien**.

     ⚠️ `limite: 1` **a propósito**: la pregunta es «¿hay alguno?», no «¿cuáles?».
     Traer la lista acá sería pagar la vidriera dos veces — y su contenido lo
     decide ella, que es la que sabe ordenarlo (§4). */
  const [hayAdoptables, setHayAdoptables] = useState<boolean | null>(null);

  /* ── LO QUE EL LOTE 5 AGREGA ────────────────────────────────────────────
     La dirección manda DOS cosas: el barrio del antetítulo y el punto contra
     el que se mide la distancia. **Sin ella no se afirma «cerca»** — ni en el
     antetítulo ni en las filas — y la lista igual se muestra: *no saber dónde
     vive la familia no es razón para esconderle quién hay.* */
  const [direccion, setDireccion] = useState<DireccionHogar | null | 'cargando'>('cargando');
  const [perfiles, setPerfiles] = useState<PerfilPublico[] | 'cargando' | 'error'>('cargando');
  const [busqueda, setBusqueda] = useState('');
  /** El oficio que se tocó sin tener a nadie cerca. `null` = la hoja cerrada. */
  const [sinNadie, setSinNadie] = useState<Oficio | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      /* Las dos lecturas van JUNTAS y no encadenadas: ninguna depende de la
         otra, y encadenarlas sumaría un viaje entero al foco de Explorar
         (`L-223` — el peaje es la PETICIÓN, y lo que se paga en reloj es la
         CADENA). */
      void obtenerServiciosPais(PAIS_SOFT_LAUNCH).then((r) => {
        if (vigente) setServicios(r.ok ? r.data : 'error');
      });
      /* La dirección, para el barrio y para la distancia. Un fallo NO es «no
         tiene dirección»: se distinguen porque una cosa es no saber y la otra
         es saber que no hay (`L-178`). Acá los dos caen en `null` y la
         consecuencia es la misma —no se afirma «cerca»—, así que no se
         inventa un tercer estado que nadie usaría. */
      void obtenerDireccionHogar().then((r) => {
        if (vigente) setDireccion(r.ok ? r.data : null);
      });
      /* ⚠️ **DOS VIAJES ENCADENADOS, y el porqué está en el lector prestado:**
         no hay forma de pedir los perfiles sin tener antes sus ids. Es el costo
         declarado de `listarIdsPrestadoresPublicos` y la cura es de A. */
      void listarIdsPrestadoresPublicos().then(async (ids) => {
        if (!vigente) return;
        if (!ids.ok) { setPerfiles('error'); return; }
        if (ids.data.length === 0) { setPerfiles([]); return; }
        const ps = await obtenerPerfilesPublicos(ids.data);
        if (!vigente) return;
        setPerfiles(ps.ok ? ps.data : 'error');
      });
      /* El gate corta ANTES de la petición: una lectura para decidir algo que
         no se va a dibujar es un viaje pagado para nada. */
      if (ADOPCION_ALCANZABLE) void obtenerAdoptables({ limite: 1 }).then((r) => {
        /* 🔴 Un fallo NO se lee como «no hay ninguno» (Ley 13). Con `null` la
           sección se queda quieta en vez de afirmar que nadie espera —
           *decirle a alguien que no hay animales en adopción porque se cayó la
           red es la peor de las dos mentiras posibles acá.* */
        /* ✅ **REVISADA Y CONFIRMADA (C, S112).** A la adaptó mecánicamente
           cuando el lector cambió de forma y la marcó como provisional; la
           medición dice que era correcta y se queda: la pregunta de esta
           pantalla no es «cuántos hay» sino **«hay alguno»**, y la respuesta es
           la suma de las dos listas.

           ⚠️ **Y `limite: 1` NO trae una fila: trae hasta cuatro.** El límite
           gobierna `resto`; los tres destacados vienen igual, porque son una
           carta de portada y no una página. *Se declara para que nadie lo lea
           como una consulta de una fila y lo copie a otro lado esperando eso.*
           Aun así es la forma más barata de preguntar «hay alguno», porque los
           destacados el servidor los computa de todos modos. */
        if (vigente && r.ok) setHayAdoptables(r.data.destacados.length + r.data.resto.length > 0);
      });
      return () => {
        vigente = false;
      };
    }, []),
  );

  // vertical activa → su ficha (ícono en el hex puro de su capa —
  // registro gráfico, Ley 12 — + nombre + voz); las inactivas van a
  // "próximamente" — la config es la verdad, el layout solo la lee.
  const fichasActivas: Array<{
    clave: string;
    titulo: string;
    detalle: string;
    icono: ReactNode;
    // S54-B3.1: la vertical con agendamiento VIVO navega; el resto sigue
    // informativo (cero CTA muerta — la card gana el tap con su flujo).
    onPress?: () => void;
  }> = [];
  /* La unión es CERRADA a propósito: un slot libre dejaría entrar cualquier
     glifo, y acá el ícono es lo único que distingue una promesa de otra.
     🔴 `guarderia` y `telemedicina` salieron: la primera subió a implementados
     y la segunda ya lo estaba. */
  const proximamente: Array<{
    nombre: string;
    icono: 'hotel' | 'seguros' | 'wearables' | 'certificaciones' | 'prime';
  }> = [];
  if (servicios !== 'cargando' && servicios !== 'error') {
    if (servicios.walking) fichasActivas.push({ clave: 'paseo', titulo: t('explorar.servicioPaseo'), detalle: t('explorar.servicioPaseoDetalle'), icono: <Icono nombre="paseo" tamano={26} />, onPress: () => router.navigate('/hogar/paseos') });
    // S60-A1: el grooming dejó el coming-soon; S60-A4: la card aterriza
    // en SU hub (doble-click, mismo patrón que el paseo) — el Agendar
    // del hub lleva al CUÁNDO.
    if (servicios.grooming) fichasActivas.push({ clave: 'grooming', titulo: t('explorar.servicioGrooming'), detalle: t('explorar.servicioGroomingDetalle'), icono: <Icono nombre="grooming" tamano={26} />, onPress: () => router.navigate('/hogar/grooming') });
    // S68-A2 (V2): la card vet despierta — va al CUÁNDO directo (el hub
    // del oficio queda declarado como resto de la tanda del Durante; la
    // cita pagada ya tiene superficie: /citas/[mascotaId] D-430 + Hogar).
    // S82-A r12 (CRUCE DE TERRITORIO declarado, UNA línea): vet entra a
    // SU LOG como los otros tres oficios — era la ÚNICA de las cuatro
    // que caía directo en la reserva, y por eso el log de r9 nacía sin
    // entrada (el founder cayó en reserva al tocar Veterinaria).
    if (servicios.veterinary) fichasActivas.push({ clave: 'vet', titulo: t('explorar.servicioVet'), detalle: t('explorar.servicioVetDetalle'), icono: <Icono nombre="veterinaria" tamano={26} />, onPress: () => router.navigate('/hogar/veterinaria') });
    if (servicios.training) fichasActivas.push({ clave: 'adiestramiento', titulo: t('explorar.servicioAdiestramiento'), detalle: t('explorar.servicioAdiestramientoDetalle'), icono: <Icono nombre="training" tamano={26} />, onPress: () => router.navigate('/hogar/adiestramiento') });
    /* ⭐ S107-C · «PRÓXIMAMENTE» — firma del founder: hotel · seguros ·
       wearables · certificaciones · Prime.
       **Salen dos, por razones opuestas:** telemedicina porque **YA está
       implementada** (vive dentro de veterinaria) — *anunciar como futuro algo
       que ya se usa hace dudar de toda la lista* — y guardería porque **subió
       a los implementados**.
       ⚠️ **Wearables y certificaciones NO están todavía: les falta su glifo**,
       y los glifos viven en `packages/ui` (censo: `IconoNombre` es el registry
       tipado; las apps sólo consumen por nombre) ⇒ **es pedido a B**, no
       territorio de esta pista. Ver `docs/loop/S107-C-PEDIDO-A-B-GLIFOS.md`.
       *No se listan con un glifo prestado: dos servicios con el ícono de un
       tercero se leen como ese tercero.* */
    if (!servicios.hotel) proximamente.push({ nombre: t('explorar.proxHotel'), icono: 'hotel' });
    if (!servicios.insurance) proximamente.push({ nombre: t('explorar.proxSeguros'), icono: 'seguros' });
    /* ⭐ S107-C · LOS DOS NUEVOS, con los glifos que B publicó.
       **No tienen bandera en `country_config`**: no son servicios que un país
       encienda todavía, son hoja de ruta. *Inventarles un flag apagado sería
       fingir un interruptor que nadie puede tocar.* Cuando existan, entran por
       su bandera como sus hermanos. */
    proximamente.push({ nombre: t('explorar.proxWearables'), icono: 'wearables' });
    proximamente.push({ nombre: t('explorar.proxCertificaciones'), icono: 'certificaciones' });
    /* ⭐ S107-C · GUARDERÍA DESACOPLADA DEL FLAG DE HOTEL — y no es prolijidad.
       Hasta hoy las dos colgaban del MISMO `if (!servicios.hotel)`, así que
       🔴 **el día que hotel abriera, guardería no pasaba a activa: DESAPARECÍA**
       —no tiene ficha propia—, y nadie se habría enterado hasta buscarla.
       Además la letra separa los dos servicios explícitamente (`LETRA_GUARDERIA`
       §5: *«la noche NO es guardería: es hotel, y es otro servicio con su propia
       letra»*), así que compartir bandera contradice una firma.
       Ver `GUARDERIA_ABIERTA` y su pedido a A. */
    /* ⭐ S107-C · GUARDERÍA ENCENDIDA POR SU FLAG PROPIO. La constante inerte
       murió en el mismo acto (Ley 37): `servicios.guarderia` existe desde
       S107-A, y hoy viene en `false` — la ficha aparece el día que la mesa lo
       encienda, con oferta viva. */
    if (servicios.guarderia) fichasActivas.push({ clave: 'guarderia', titulo: t('explorar.servicioGuarderia'), detalle: t('explorar.servicioGuarderiaDetalle'), icono: <Icono nombre="guarderia" tamano={26} />, onPress: () => router.navigate('/hogar/guarderia') });
    if (!servicios.prime) proximamente.push({ nombre: t('explorar.proxPrime'), icono: 'prime' });
    /* 🔴 Guardería NO cae a «Próximamente»: su camino está CONSTRUIDO y
       espera sólo el flag. Con el flag en `false` no aparece en ningún lado, y
       eso es correcto — anunciarla en próximamente diría que falta construirla
       cuando lo que falta es una guardería con oferta publicada. */
    /* ☠️ Telemedicina salió de «Próximamente»: **ya está implementada** y se
       agenda desde veterinaria. */
  }

  /* ══════════════════════════════════════════════════════════════════════════
   *  LO QUE LA PANTALLA DERIVA — y por qué acá y no en un `useMemo`
   *  ─────────────────────────────────────────────────────────────────────────
   *  Son listas de a lo sumo 11 elementos sobre datos que ya están en memoria.
   *  *Memoizar esto costaría más lectura que el cálculo que ahorra* — la casa
   *  ya midió que el costo vive en los VIAJES, no en el render (`L-223`).
   * ═════════════════════════════════════════════════════════════════════════ */

  const listaPerfiles = Array.isArray(perfiles) ? perfiles : [];
  const puntoCasa =
    direccion !== 'cargando' && direccion !== null && direccion.lat !== null && direccion.lon !== null
      ? { lat: direccion.lat, lon: direccion.lon }
      : null;

  /** El barrio del antetítulo: el sector si lo hay, si no la ciudad. **Sin
   *  dirección no se dibuja** — un antetítulo vacío deja un renglón mudo. */
  const barrio =
    direccion !== 'cargando' && direccion !== null
      ? ((direccion.sector ?? '').trim() || (direccion.ciudad ?? '').trim() || null)
      : null;

  /** Qué oficios tiene cada negocio, ya traducidos del vocabulario del motor. */
  const oficiosDe = (p: PerfilPublico): Oficio[] => {
    const vistos: Oficio[] = [];
    for (const sv of p.servicios) {
      const o = oficioDeServicio(sv);
      if (o !== null && !vistos.includes(o)) vistos.push(o);
    }
    return vistos;
  };

  /** La distancia a la ZONA del negocio, o `null` si falta alguna de las dos
   *  puntas. *`null` viaja y la fila deja de decir «a X km»; no se rellena con
   *  un cero, que diría «está acá mismo».* */
  const kmDe = (p: PerfilPublico): number | null =>
    puntoCasa !== null && p.zona_lat !== null && p.zona_lon !== null
      ? distanciaKm(puntoCasa, { lat: p.zona_lat, lon: p.zona_lon })
      : null;

  /* 🔴 **LA GRILLA SALE DE LA CONFIG DEL PAÍS, y `disponible` DE LOS DATOS.**
     Son dos preguntas distintas, y tenerlas separadas es lo que permite el caso
     que el encargo pide: *el país ofrece el oficio* (por eso está en la grilla)
     y *nadie lo hace todavía cerca* (por eso sale marcado). Si la grilla se
     armara con los oficios que hay, ese caso sería inexpresable. */
  const conAlguien = new Set<Oficio>();
  for (const p of listaPerfiles) for (const o of oficiosDe(p)) conAlguien.add(o);

  /** `vet` es la clave vieja de esta pantalla; el oficio se llama
   *  `veterinaria`. Se traduce acá y NO se renombra la ficha: esa clave viaja a
   *  las rutas del hub, y renombrarla es otro lote. */
  const oficioDeFicha = (clave: string): Oficio => (clave === 'vet' ? 'veterinaria' : (clave as Oficio));

  /** La voz LARGA de un oficio, del riel — jamás la clave del motor. */
  const vozOficio = (o: Oficio): string =>
    (fichasActivas.find((x) => oficioDeFicha(x.clave) === o)?.titulo ?? o).replace(/­/g, '');

  /** La palabra CORTA, la del disco. **Sin entrada cae a la larga**: *un disco
   *  con la palabra larga se ve apretado; uno vacío no se ve.* */
  const palabraDeOficio = (o: Oficio): string => {
    const corta: Partial<Record<Oficio, string>> = {
      paseo: t('explorarV5.oficioPaseo'),
      grooming: t('explorarV5.oficioGrooming'),
      veterinaria: t('explorarV5.oficioVeterinaria'),
      adiestramiento: t('explorarV5.oficioAdiestramiento'),
      guarderia: t('explorarV5.oficioGuarderia'),
      hotel: t('explorarV5.oficioHotel'),
    };
    return corta[o] ?? vozOficio(o);
  };

  /* 🔴 **LAS DOS VOCES VAN ANTES DE `oficiosDeGrilla`, y no es estilo.**
     `oficiosDeGrilla` es un `const` que se construye EN EL RENDER, así que usar
     acá una función declarada más abajo es **TDZ: revienta al montar**. Es la
     misma clase que `verify:ref-antes-de-uso` vigila desde S112 —el `useRef`
     leído antes de declararse que crasheaba el hilo de adopción—, y acá la
     cazó mover el código, no un gate: *el orden de dos `const` no lo mira
     nadie hasta que la pantalla no abre.* */
  const oficiosDeGrilla: OficioDeGrilla[] = fichasActivas.map((f) => {
    const oficio = oficioDeFicha(f.clave);
    return {
      clave: oficio,
      glifo: glifoDeOficio(oficio),
      /* 🔴 **LA PALABRA CORTA, no el título del riel de servicios.** Aquél es la
         voz larga («Estética y baño») y la pieza declara que *«si necesita dos,
         el disco NO crece: se cambia la palabra»*. **Medido en la captura:** con
         el título largo la grilla dibujaba tres palabras en un disco de un
         tercio de ancho. La voz larga sigue viva donde hay lugar —la ficha del
         oficio, la línea de la tarjeta—: son dos registros, no una corrección. */
      etiqueta: palabraDeOficio(oficio),
      disponible: conAlguien.has(oficio),
    };
  });

  /** «Cerca de ti»: los negocios que hacen alguno de los oficios de la grilla,
   *  ordenados por distancia —los que no la tienen, al final— y filtrados por
   *  lo que se escribió arriba. */
  const cercaDeTi = listaPerfiles
    .flatMap((p) => {
      /* Un negocio sin oficio de vitrina NO se lista: un refugio, o una cuenta
         sin servicios publicados, no es un resultado de esta lista. */
      if (oficiosDe(p).length === 0) return [];
      /* 🔴 **EL OFICIO DE LA FILA ES EL DEL SERVICIO MÁS BARATO, y no el
         primero que aparezca.** Es lo que hace que la línea y el precio digan
         lo mismo: *«Veterinaria · desde $10» sobre un negocio cuyo servicio de
         $10 es un paseo describe otra cosa.* ⏪ La primera versión tomaba
         `oficios[0]` —el orden en que el motor devolvió los servicios— y la
         captura lo mostró: **tres negocios distintos, los tres rotulados
         «Veterinaria»**, uno de ellos con paseo más barato. */
      let barato: { oficio: Oficio; precio: number } | null = null;
      for (const sv of p.servicios) {
        const o = oficioDeServicio(sv);
        if (o === null || typeof sv.precio !== 'number' || sv.precio <= 0) continue;
        if (barato === null || sv.precio < barato.precio) barato = { oficio: o, precio: sv.precio };
      }
      /* Sin ningún servicio con precio, la fila conserva su primer oficio y el
         bloque de precio no se dibuja (contrato de la pieza). */
      const primero = oficiosDe(p)[0];
      if (primero === undefined) return [];
      return [{
        perfil: p,
        oficio: barato?.oficio ?? primero,
        km: kmDe(p),
        desde: barato?.precio ?? null,
      }];
    })
    .filter((r) => {
      const q = busqueda.trim().toLowerCase();
      if (q === '') return true;
      /* Se busca por el nombre del negocio y por el de sus servicios: son las
         dos formas en que alguien nombra lo que busca. */
      return (
        r.perfil.nombre_comercial.toLowerCase().includes(q) ||
        r.perfil.servicios.some((sv) => sv.nombre.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (a.km === null && b.km === null) return 0;
      if (a.km === null) return 1;
      if (b.km === null) return -1;
      return a.km - b.km;
    });


  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
              {/* ⭐ **S116-C lote 3b · LA PORTADA PASA A `Cabecera variante="raiz"`.**
            `saludo` → `titulo` y **el carrito deja de ser un `ReactNode` en
            `accionDer` y pasa a la prop `carrito`**, que la pieza ya trae. ☠️ Con
            eso muere el montaje de `AccionCarrito` acá: *un `ReactNode` suelto
            deja que cada pantalla arme su disco, y ahí vuelve la copia que
            `DiscoVidrio` acaba de terminar* (la razón es de B, en el catálogo). */}
        {/* ⭐ **LA ESTRUCTURA FIRMADA — S116-C lote 3b (precisión del founder).**
          *Migrar no es cambiar `Encabezado` por `Cabecera`.* El ciruela es el
          FONDO —`presentacion="fondo"`: sin radio inferior, sin sombra— y el
          contenido vive en una hoja de lienzo que lo tapa al scrollear. **La
          curva es de la HOJA y mira hacia ARRIBA**; la cabecera-tarjeta con las
          esquinas de abajo redondeadas muere en el cliente.
          ⚠️ **Los `ScrollView` verticales que había adentro se volvieron
          `View`**: la hoja ya scrollea, y dos scrolls verticales anidados
          dejan al de adentro sin alto propio. Su `contentContainerStyle` pasa
          a `style` — *el relleno era del contenido, no del scroll.* El
          `paddingBottom` con `insets.bottom` SE RETIRA: lo paga la hoja
          (`R53`). */}
        <HojaContenido
          arranque={cabecera.arranque}
          /* ⭐ **LA GRILLA CABALGA LA COSTURA**, que es el slot que
             `HojaContenido` tiene para eso y lo que `GrillaOficios` espera: su
             contrato dice que se desplaza `DISCO / 2` y que **sólo la primera
             fila pisa la costura**. *Montarla adentro de la hoja la dejaría
             apoyada, no cabalgando, y el desplazamiento lo tendría que
             adivinar la pantalla.* */
          costura={
            servicios === 'cargando' || servicios === 'error' ? null : (
              <GrillaOficios
                oficios={oficiosDeGrilla}
                vozSinDisponibles={t('explorarV5.vozSinDisponibles')}
                /* 🔴 **UN OFICIO SIN NADIE CERCA NO SE ESCONDE Y SE TOCA** —
                   firma de la mesa, y la pieza lo deja tocable justamente para
                   que la pantalla pueda explicarlo. Acá está la otra mitad de
                   ese contrato: *un control apagado no puede decir por qué lo
                   está.* */
                onElegir={(clave) => {
                  const oficio = clave as Oficio;
                  if (!conAlguien.has(oficio)) { setSinNadie(oficio); return; }
                  const ficha = fichasActivas.find((f) => oficioDeFicha(f.clave) === oficio);
                  ficha?.onPress?.();
                }}
              />
            )
          }
          fondo={
            <View onLayout={cabecera.alMedir}>
              <Cabecera
                variante="raiz"
                /* ⭐ **EL ANTETÍTULO DICE DÓNDE ESTÁS PARADO.** Es lo que vuelve
                   «cerca de ti» un dato y no una figura: sin él la lista de
                   abajo afirma una cercanía contra un punto que nadie declaró.
                   **Sin dirección guardada NO se dibuja** — `undefined`, no una
                   cadena vacía: la pieza no reserva renglón para un dato que no
                   existe (19.9). */
                antetitulo={barrio ?? undefined}
                titulo={t('explorarV5.titulo')}
                carrito={{ cantidad: unidadesCarrito, onPress: () => router.push('/despensa/carrito'), etiqueta: t('despensa.abrirCarrito', { count: unidadesCarrito }) }}
                presentacion="fondo"
                contenido={
                  /* ⭐ **EL BUSCADOR EN LA BANDA — la misma firma que la
                     Despensa**, y el encargo lo dice literal: *«lo mismo en
                     Explorar»*. Sin el disco del filtro al lado: acá no hay
                     facetas que abrir, y reservarle el lugar a un control que
                     no existe dejaría un hueco a la derecha.

                     ⚠️ **Sin `paddingHorizontal`**: los lados los paga la
                     cabecera. Sumarlos acá los pagaría dos veces (`R53`). */
                  /* 🔴 **CON SU ETIQUETA ADENTRO Y SIN TEXTO DE EJEMPLO — N11″.**
                     ⏪ La primera versión copiaba el buscador de la Despensa
                     —apagaba la etiqueta y ponía un ejemplo en su lugar— y
                     **`verify:etiqueta-dentro` la paró con razón**: ésas son las
                     dos puertas de atrás por las que la etiqueta vuelve a
                     salirse del campo, y la letra de §N11″ —firmada el 15-sep—
                     dice que *«el nombre del campo va DENTRO del campo,
                     flotando… el placeholder de ejemplo muere»*.

                     ⚠️ **Y ESTE COMENTARIO NO PUEDE NOMBRAR ESAS DOS PROPS.** La
                     primera redacción las citaba literales y **volvió a encender
                     el gate sobre la línea que las cura**: un censo por patrón
                     no distingue una CITA de un montaje. *Tercera vez en esta
                     tanda —antes `verify:moneda` y `verify:techos-locales`—, así
                     que la regla es de clase y no un descuido: **se describe el
                     marcador, jamás se escribe.***
                     *El de la Despensa es deuda conocida con dueño; copiarlo
                     habría sido heredar el defecto en vez de la forma.*
                     ⚠️ **La etiqueta es corta a propósito**: flotando al borde
                     comparte renglón con el glifo, y «Busca un servicio o un
                     negocio» ahí no entra. La frase larga muere con el
                     placeholder — su trabajo lo hace la lupa. */
                  <Campo
                    label={t('explorarV5.buscarEtiqueta')}
                    value={busqueda}
                    onChangeText={setBusqueda}
                    autoCapitalize="none"
                    iconoIzq={<Icono nombre="lupa" tamano={20} registro="glifo" montaje="control" />}
                  />
                }
              />
            </View>
          }
        >
          {/* 🔴 **EL RELLENO VA ADENTRO DE LA HOJA, NO EN EL SCROLL.** Traduje
            `contentContainerStyle` del `ScrollView` viejo a su HOMÓNIMO en la
            hoja, y no son lo mismo: **en la hoja ese estilo envuelve A LA HOJA**,
            no a su contenido. ⇒ el padding lateral dejaba una franja de ciruela
            a cada lado, el de arriba pegaba el contenido al borde redondeado
            —«Tu paseo» salía cortado— y el de abajo separaba la hoja del piso.
            *Medido en el aparato: hoja de 996 px en pantalla de 1080 = 42 px de
            ciruela por lado, que es `spacing[4]` exacto.* */}
          <View style={{ paddingBottom: AIRE_RAIZ }}>

          <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
            {/* ══════════════════════════════════════════════════════════════
                ⭐ **CERCA DE TI — negocios REALES, no fichas de servicio.**

                ⏪ **ACÁ VIVÍAN LAS CINCO FICHAS INFORMATIVAS** (una tarjeta por
                oficio con su glifo y su voz, en grilla de tres). Murieron con
                la grilla de la costura, que hace su trabajo mejor: *decían qué
                servicios EXISTEN; esta lista dice QUIÉN los hace y a qué
                distancia*, que es la pregunta con la que alguien abre Explorar.

                🔴 **LA CALIFICACIÓN NO SE DIBUJA HOY, Y NO ES UN OLVIDO.**
                Medido contra la base: los 11 negocios públicos están en
                `total_resenas = 0`. El contrato de la pieza dice *«sin reseñas
                la línea NO EXISTE, ni como “0 reseñas”»* — *un negocio nuevo no
                está peor calificado: está sin calificar.* ⇒ se pasa `null`
                explícito y la línea desaparece sola el día que alguien reseñe.

                ⚠️ **La tarjeta destacada de la casa NO está montada porque no
                hay qué montar**: existe `cupones` en la base y **cero lector de
                promociones**. La condición del encargo —*«si hay promo»*— hoy
                es falsa, así que el lugar queda vacío en vez de reservado.
                ═══════════════════════════════════════════════════════════ */}
            <View style={{ gap: spacing[3] }}>
              <TituloBloque texto={t('explorarV5.cercaDeTi')} />
              {perfiles === 'cargando' ? (
                <EsqueletoGrupo>
                  <View style={{ gap: spacing[3] }}>
                    <Esqueleto forma="bloque" ancho="100%" alto={96} />
                    <Esqueleto forma="bloque" ancho="100%" alto={96} />
                  </View>
                </EsqueletoGrupo>
              ) : perfiles === 'error' ? (
                <EstadoVacio
                  registro="seccion"
                  titulo={t('explorarV5.error')}
                  descripcion={t('hogar.errorHistoriaDetalle')}
                  accion={
                    <Boton
                      variante="secundario"
                      etiqueta={t('hogar.reintentar')}
                      onPress={() => setPerfiles('cargando')}
                    />
                  }
                />
              ) : cercaDeTi.length === 0 ? (
                /* 🔴 **DOS VACÍOS DISTINTOS, y confundirlos sería mentir:** no
                   hay ninguno, o no hay ninguno QUE COINCIDA con lo escrito.
                   *«No hay negocios cerca» sobre una búsqueda de tres letras es
                   falso, y el que lo lee no tiene cómo saberlo.* */
                busqueda.trim() !== '' ? (
                  <EstadoVacio
                    registro="seccion"
                    titulo={t('explorarV5.sinResultados', { texto: busqueda.trim() })}
                    descripcion={t('explorarV5.sinResultadosDetalle')}
                  />
                ) : (
                  <EstadoVacio
                    registro="seccion"
                    titulo={t('explorarV5.vacioTitulo')}
                    descripcion={t('explorarV5.vacioDetalle')}
                  />
                )
              ) : (
                <View style={{ gap: spacing[3] }}>
                  {cercaDeTi.map((r) => (
                    <TarjetaPrestador
                      key={r.perfil.id}
                      nombre={r.perfil.nombre_comercial}
                      /* El retrato sale de `AvatarMascota`, que es la pieza que
                         la casa ya usa para una cara con su respaldo de
                         iniciales. **Sin foto no queda un hueco**: dibuja el
                         monograma del nombre. */
                      retrato={<AvatarMascota nombre={r.perfil.nombre_comercial} fotoUrl={r.perfil.foto_url ?? undefined} tamano="md" />}
                      /* La distancia entra a la línea **sólo si existe**: sin
                         dirección guardada la fila dice el oficio y nada más,
                         en vez de afirmar una cercanía que nadie midió. */
                      lineaOficio={
                        r.km === null
                          ? t('explorarV5.lineaOficioSinDistancia', { oficio: vozOficio(r.oficio) })
                          : t('explorarV5.lineaOficioDistancia', {
                              oficio: vozOficio(r.oficio),
                              km: r.km.toFixed(1),
                            })
                      }
                      calificacion={null}
                      vozResenas={null}
                      desde={r.desde}
                      vozDesde={t('explorarV5.desde')}
                      vozVer={t('explorarV5.ver')}
                      /* La vitrina del negocio, que ya existe y es a sangre por
                         letra firmada de S91. */
                      onPress={() =>
                        router.push({
                          pathname: '/prestador/[prestadorId]',
                          params: { prestadorId: r.perfil.id },
                        })
                      }
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ── Refugios / adopción — LA ENTRADA (S112-C) ──────────────────

                **POR QUÉ ACÁ Y NO EN EL HOGAR**, que era la otra opción sobre la
                mesa: `DISEÑO_EXPERIENCIA` §3 ya la ubicó —*«Refugios: adopción y
                donaciones, día 1»* vive en EXPLORAR en el mapa firmado— y la
                razón sigue en pie: **el Hogar es el estado de TU casa** y la
                adopción es descubrimiento deliberado (§6). Además **el lugar ya
                estaba hecho**: montarla acá retira, en el mismo acto, un texto
                que había quedado falso (`L-395`).

                ⚠️ **La excepción es el hogar SIN mascotas**, y no contradice
                esto: ahí la adopción **sí** es el estado del hogar —no hay nadie
                de quien contar— y por eso el founder la pidió en esa pantalla.
                Son dos entradas porque son dos preguntas distintas.

                🔴 **Sin contador, y no es un olvido:** §4 prohíbe convertir la
                lista en inventario, y S111-C ya quitó el contador de resultados
                de la vidriera por eso mismo. *Saber que hay 34 no ayuda a elegir
                a ninguno.* */}
            <View style={{ gap: spacing[3] }}>
              <TituloBloque texto={t('explorar.refugios')} />
              {ADOPCION_ALCANZABLE && hayAdoptables === true ? (
                /* `CeldaNavegacion` y no `Celda`: **navega**, y la Ley 19.1 le
                   da su anatomía —glifo del set b′ + chevron de entrada—. Lo
                   cazó el typecheck, que exige `interactiva` explícito en la
                   Celda cruda: *la pieza correcta no era la que estaba a mano.* */
                <Tarjeta>
                  <CeldaNavegacion
                    icono="refugio"
                    titulo={t('explorar.adopcionEntrada')}
                    detalle={t('explorar.adopcionEntradaDetalle')}
                    onPress={() => router.push('/adoptar')}
                  />
                </Tarjeta>
              ) : hayAdoptables === false ? (
                <EstadoVacio
                  registro="seccion"
                  icono={<Icono nombre="refugio" tamano={48} />}
                  titulo={t('explorar.refugiosVacio')}
                  descripcion={t('explorar.refugiosVacioDetalle')}
                />
              ) : (
                /* Todavía no sabemos: **no se afirma ninguna de las dos cosas.**
                   Un esqueleto acá sería honesto pero ruidoso en una pantalla que
                   ya tiene el suyo arriba; el silencio de una sección que aún no
                   respondió no promete nada. */
                null
              )}
            </View>

            {/* ── Próximamente honesto — UNA sección, filas serenas en
                texto secundario (P5c: el muro de Insignias ochre murió;
                el título de la sección ya dice todo) ── */}
            {proximamente.length > 0 ? (
              <View style={{ gap: spacing[3] }}>
                <TituloBloque texto={t('explorar.proximamente')} />
                <Tarjeta relleno="ninguno">
                  {/* S58 (D-361): la celda VISTE, no promete — ícono del
                      registry + fila informativa SIN chevron ni tap (un
                      coming soon no navega: no es CeldaNavegacion, Ley 19.4) */}
                  {proximamente.map((p, i) => (
                    <View key={p.nombre}>
                      {i > 0 ? <Separador /> : null}
                      <Celda inicio={<Icono nombre={p.icono} tamano={24} registro="aa" />} titulo={p.nombre} />
                    </View>
                  ))}
                </Tarjeta>
              </View>
            ) : null}
          </View>
          </View>
        </HojaContenido>

        {/* ══════════════════════════════════════════════════════════════════
            ⭐ **EL OFICIO QUE TODAVÍA NO TIENE A NADIE — la otra mitad del
            contrato de `GrillaOficios`.**

            La pieza deja tocable el oficio apagado *«porque un control apagado
            no puede explicar por qué lo está»*, y deja explícito que **lo que
            sigue es de quien monta**. Esto es eso: la explicación.

            ⚠️ **LA SEGUNDA LÍNEA ES UNA PROMESA SIN PRODUCTOR, y se declara.**
            «Te avisamos apenas llegue el primero» es la copia del encargo, y
            **no existe el motor que lo dispare**: no hay suscripción a «oficio
            + zona» en ningún lado. *Se monta porque es la palabra de la casa y
            se declara porque una promesa que nadie va a cumplir es peor que no
            hacerla* — el pedido vive en el buzón.
            ═══════════════════════════════════════════════════════════════ */}
        <Hoja
          visible={sinNadie !== null}
          onCerrar={() => setSinNadie(null)}
          titulo={sinNadie === null ? '' : t('explorarV5.sinNadieTitulo', { oficio: vozOficio(sinNadie).toLowerCase() })}
          conCerrar
        >
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Texto variante="cuerpo">{t('explorarV5.sinNadieDetalle')}</Texto>
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('explorarV5.sinNadieCerrar')}
              onPress={() => setSinNadie(null)}
            />
          </View>
        </Hoja>
    </SafeAreaView>
  );
}
