/**
 * ADOPTAR — LA VIDRIERA (§4.1). *«Se presentan vidas, no inventario.»*
 *
 * **TESIS (Ley 14):** *estos animales existen, tienen nombre y están esperando.*
 *
 * **FIRMA (Ley 15):** la carta «Llevan más tiempo esperando», **con su porqué en
 * cada uno**. §4.1 la pide primero y no como ranking: es el bloque que le da a
 * la lista un criterio en vez de un orden.
 *
 * **CHANEL (Ley 16):** sin contador de resultados. *Saber que hay 34 no ayuda a
 * elegir a ninguno, y convierte una lista de vidas en un inventario.*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **LO QUE ESTA PANTALLA NO DECIDE, Y ES LA PARTE PENSADA.**
 *
 * · **No arma el cursor.** Se pasa **tal cual vino**: lleva la clave de orden
 *   completa (`rango|fecha|id`) y el orden CAMBIA cuando hay filtro de
 *   convivencia. *Un cursor armado en la pantalla saltea filas sin error y sin
 *   síntoma* — es lo que la línea de vida cobró en S99 (55 de 62, y el que
 *   falta no se ve).
 * · **No decide quiénes son los destacados ni por qué.** Los tres y su razón
 *   vienen del servidor; acá sólo se redacta el número de días.
 * · **No esconde a nadie por convivencia.** Los tres ejes filtran **sólo cuando
 *   se pide `'no'`**: pedir «convive con perros» ordena a los `no_se_sabe`
 *   abajo, con su título y **el mismo peso visual**. *Esconderlos dejaría
 *   animales sin ver por un dato que falta, que es lo contrario de lo que un
 *   filtro debería hacer.*
 * · 🔴 **SIN FILTRO DE RAZA, y es de piedra** (§4): *filtrar por raza empuja a
 *   buscar raza.* Se **muestra** cuando el refugio la sabe; no se ofrece como
 *   criterio. El motor tampoco lo acepta.
 * · **Sin swipe, sin descartes, sin score de match** (§10.8). No hay nada que
 *   deshabilitar: no se construyó.
 * · **Sin animaciones en la lista** (N15, §6). Ni entrada escalonada ni
 *   transición entre tandas.
 *
 * ── ⚠️ LOS DOS CHIPS DE §4.1 QUE NO SE DIBUJAN, CON SU RAZÓN ────────────
 * *«Un filtro que no filtra es una promesa rota a un toque de distancia»*
 * (Ley 23), así que se declara en vez de dibujarse apagado:
 * · **«cerca de mí»** — el motor toma `ciudadId`, pero **no hay lector de
 *   ciudades en esta app ni permiso de ubicación pedido**. Ordenar «por
 *   distancia a la ciudad» (N5) exige las dos cosas.
 * · **edad** — el motor toma `edadMinMeses`/`edadMaxMeses`, y traducir
 *   «cachorro / adulto / mayor» a meses **depende de la especie**: los umbrales
 *   viven en `cat_especies_perfil` y ningún lector de acá los trae. *Inventar un
 *   corte único para perro y gato sería la pantalla decidiendo una regla de
 *   producto* — el mismo error que esta pantalla evitó con los destacados.
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HojaFiltros,
  BloqueConCriterio,
  Boton,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FiltroPills,
  Hoja,
  Icono,
  TarjetaAdoptable,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerCatalogoCiudades,
  resolverUrlGenericaEspecie,
  obtenerAdoptables,
  obtenerSesion,
  resolverUrlsFotos,
  type Adoptable,
  type FiltrosAdoptables,
} from '@epetplace/api';
import { describirEdad, describirEspera } from '@epetplace/domain';

import { useTraduccion } from '@/i18n';

/** Las dos especies que la casa adopta hoy. **El día que el motor acepte otra,
 *  este arreglo se queda corto y hay que venir acá** — se declara en vez de
 *  derivarlo de un catálogo que este lector no trae. */
const ESPECIES = ['perro', 'gato'] as const;
/** Medido: `talla IN ('S','M','L')` (`chk` de `mascotas`, S95). */
const TALLAS = ['S', 'M', 'L'] as const;
const SEXOS = ['macho', 'hembra'] as const;

/* ☠️ `Marca` y `alternar` murieron con los chips inline (A1, Ley 37): sus
   seis ejes viven ahora dentro de `HojaFiltros`, con **tres estados** los de
   convivencia en vez de encendido/apagado — que es la corrección que trajo B y
   que este tipo binario no podía expresar. */

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | {
      fase: 'listo';
      destacados: Adoptable[];
      resto: Adoptable[];
      /** path → URL firmada. Ver la nota de `caras` en el efecto. */
      caras: Map<string, string>;
      cursor: string | null;
      hayMas: boolean;
      ordenPorConvivencia: boolean;
    };

export default function Adoptar() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  /**
   * ⭐ **A1 · UN SOLO OBJETO DE FILTROS, y es el que viaja al motor.**
   *
   * Antes eran cuatro variables (`especie`, `talla`, `sexo`, `marcas`) y un
   * bloque que las traducía a `FiltrosAdoptables` en cada render. **Ese bloque
   * era un mapa en el medio**, y un mapa entre dos vocabularios es la segunda
   * verdad que diverge sola: el día que el motor acepte un filtro nuevo, la
   * pantalla lo tiene que traducir dos veces —al entrar y al salir— y sólo una
   * de las dos se acuerda.
   *
   * `HojaFiltros` devuelve **exactamente esta forma**, con los nombres de la
   * lista blanca de `obtener_adoptables`, así que **no hay traducción**: lo que
   * sale de la hoja entra al lector tal cual.
   */
  const [filtros, setFiltros] = useState<FiltrosAdoptables>({});
  const [hojaFiltros, setHojaFiltros] = useState(false);
  const [explicandoEsterilizado, setExplicandoEsterilizado] = useState(false);
  /** El catálogo de ciudades. Ver la nota de su carga: **sin sesión llega
   *  vacío**, y por eso el grupo no se dibuja con la lista en cero. */
  const [ciudades, setCiudades] = useState<{ id: string; nombre: string }[]>([]);
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [trayendoMas, setTrayendoMas] = useState(false);
  /** `null` mientras no se sabe. **No se asume que no hay sesión**: con `false`
   *  por default, el primer render le ofrecería registrarse a alguien que ya
   *  entró. */
  const [conSesion, setConSesion] = useState<boolean | null>(null);
  const [hojaPorQueCuenta, setHojaPorQueCuenta] = useState(false);

  const llave = JSON.stringify(filtros);
  /** Cuántos ejes están puestos. Se cuenta sobre el objeto que viaja al motor
   *  —no sobre un espejo—, así que no puede desincronizarse con lo que la
   *  lista está aplicando de verdad. */
  const cuantosFiltros = Object.keys(filtros).length;

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        /* Las dos JUNTAS y no encadenadas: la sesión no es precondición de la
           lista (`L-223` — lo que se paga en reloj es la CADENA). Y se pregunta
           SIEMPRE, no sólo al postular: la línea de arriba tiene que decir la
           verdad desde el primer render. */
        /* 🔴 **`cat_ciudades` SIN SESIÓN LLEGA VACÍO, Y NO ES UN FALLO.**
           Medido: la tabla tiene RLS encendida y sus **dos policies son sólo
           para `authenticated`** — `anon` tiene el GRANT y **ninguna policy**,
           así que lee **cero filas sin error**. Esta vidriera se mira sin
           cuenta, o sea que **el caso normal es la lista vacía**.
           ⇒ El grupo de ciudad **no se le pasa a la hoja cuando está vacío**:
           un grupo de filtro con su rótulo y ninguna opción se lee como algo
           roto. *Un grant sin policy no da error: da silencio*, que es lo que
           lo vuelve difícil de ver. Reportado a A (la policy) y a B (que el
           grupo no dibuje con lista en cero). */
        const [ses, r, ciu] = await Promise.all([
          obtenerSesion(),
          obtenerAdoptables({ filtros: JSON.parse(llave) as FiltrosAdoptables }),
          obtenerCatalogoCiudades(),
        ]);
        if (!vigente) return;
        setConSesion(ses.ok && ses.data !== null);
        setCiudades(ciu.ok ? ciu.data.map((x) => ({ id: x.id, nombre: x.nombre })) : []);
        /* Ley 13: un fallo JAMÁS se disfraza de «no hay nadie en adopción».
           *Ese vacío diría que ningún animal espera, que es lo contrario de lo
           que pasa.* */
        if (!r.ok) {
          setEstado({ fase: 'error' });
          return;
        }
        /* 🔴 **LA LISTA TRAE LA RUTA; LA FICHA TRAE LA URL** — medido en el
           motor: `obtener_adoptables` devuelve `m.foto_url` **crudo**
           (`20260907900000:114`) mientras `obtener_adoptable` arma la URL con
           su base. *Por eso la portada sólo se veía al entrar al detalle: no
           era que la lista no tuviera foto, era que tenía un path donde la
           pantalla esperaba una URL.*
           ⇒ Se firma acá, con el resolvedor de la casa (`D-308`), que es lo que
           hacen las otras 25 pantallas que dibujan fotos. */
        const paths = [...r.data.destacados, ...r.data.resto]
          .map((a) => a.fotoUrl)
          .filter((x): x is string => typeof x === 'string' && x.length > 0);
        const caras = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
        if (!vigente) return;
        setEstado({ fase: 'listo', ...r.data, caras });
      })();
      return () => {
        vigente = false;
      };
    }, [llave]),
  );

  /**
   * CARGAR MÁS — keyset.
   *
   * ⚠️ **Los destacados NO se vuelven a pedir ni se acumulan**: el contrato dice
   * que vienen *«sólo en la primera página»* porque son una carta de portada.
   * *Repetirlos abajo los convertiría en una sección, que es justo lo que la
   * carta no es.*
   */
  const cargarMas = async () => {
    if (estado.fase !== 'listo' || !estado.hayMas || trayendoMas) return;
    setTrayendoMas(true);
    try {
      const r = await obtenerAdoptables({ filtros, cursor: estado.cursor });
      if (!r.ok) return;
      /* Las páginas nuevas firman sus propias portadas y se SUMAN al mapa: no
         se re-firma lo que ya está. */
      const nuevos = r.data.resto
        .map((a) => a.fotoUrl)
        .filter((x): x is string => typeof x === 'string' && x.length > 0);
      const masCaras = nuevos.length > 0 ? await resolverUrlsFotos(nuevos) : new Map<string, string>();
      setEstado((prev) =>
        prev.fase !== 'listo'
          ? prev
          : {
              ...prev,
              resto: [...prev.resto, ...r.data.resto],
              caras: new Map([...prev.caras, ...masCaras]),
              cursor: r.data.cursor,
              hayMas: r.data.hayMas,
            },
      );
    } finally {
      setTrayendoMas(false);
    }
  };

  /** La edad **redactada por el riel**, no por la pantalla: `describirEdad`
   *  devuelve `{clave, params}` y acá sólo se traduce. *Una frase de edad
   *  armada en la pantalla es una frase en un solo idioma* (`D-539`). */
  const edadDe = (a: Adoptable): string => {
    const v = describirEdad(a.fechaNacimiento, a.fechaNacimientoPrecision);
    return t(v.clave as 'edad.desconocida', v.params);
  };

  const tarjeta = (a: Adoptable, caras: Map<string, string>) => (
    <TarjetaAdoptable
      key={a.publicacionId}
      nombre={a.nombre}
      especie={t(`adoptar.especieVoz_${a.especie}` as 'adoptar.especieVoz_perro')}
      /* La raza se MUESTRA cuando el refugio la sabe. `null` no se rellena: la
         pieza lo trata como no declarado y no dice «mestizo» por nosotros. */
      raza={a.raza}
      sexo={a.sexo === null ? null : t(`adoptar.sexo_${a.sexo}` as 'adoptar.sexo_macho')}
      edad={a.fechaNacimiento === null ? null : edadDe(a)}
      /* ⭐ **A4 · LA FORMA CORRECTA (B, `90bebbfd`).** `fotoDeEspecie` va
         APARTE, y no es cosmético: **la foto propia lleva encuadre de retrato**
         —zoom + corrimiento, porque en una foto de mascota la cara queda alta—
         **y la ilustración de la casa va a sangre**, porque ya viene encuadrada.
         Mientras el contrato no estuvo en `main` la pasé por `fotoUrl`: eso le
         aplicaba un recorte pensado para otra cosa.

         `resolverUrlGenericaEspecie` y no `resolverUrlRaza`: el lector trae el
         NOMBRE de la raza, no su ruta, y **para un adoptable el caso normal es
         sin raza declarada**. Armar la URL slugificando texto acierta a veces —
         *y una URL que acierta a veces muestra una cara equivocada, que es peor
         que ninguna.* */
      fotoUrl={a.fotoUrl === null ? null : (caras.get(a.fotoUrl) ?? null)}
      fotoDeEspecie={resolverUrlGenericaEspecie(a.especie)}
      publicador={a.publicadorNombre}
      voces={{ edadNoInformada: t('adoptar.edadNoInformada') }}
      onPress={() =>
        router.push({
          pathname: '/adoptar/[publicacionId]',
          params: { publicacionId: a.publicacionId },
        })
      }
    />
  );

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('adoptar.titulo')}
        atras
        onAtras={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          gap: spacing[5],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        {/* LA VUELTA A LAS CONVERSACIONES. Sólo con sesión: sin cuenta no hay
            ninguna, y ofrecerla sería llevar a un vacío garantizado (Ley 23).
            🔴 **Sin contador, y sin pedirlas para saber si hay.** Contar
            exigiría un viaje más en CADA carga de la pantalla más visitada del
            vertical, y S94-PERF midió que el techo de esta casa son los viajes. */}
        {conSesion === true ? (
          <CeldaNavegacion
            titulo={t('misSolicitudes.entrada')}
            onPress={() => router.push('/adoptar/solicitudes')}
          />
        ) : null}

        {/* LA LÍNEA DE LA PUERTA SIN CUENTA (§4.1) — «nada más» que esto.
            🔴 `=== false` y no `!== true`: mientras la sesión se pregunta el
            valor es `null`, y `!== true` le diría a quien YA entró que va a
            necesitar una cuenta. */}
        {conSesion === false ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <View style={{ flex: 1 }}>
              <Texto variante="apoyo" color="tertiary">
                {t('adoptar.sinCuentaLinea')}
              </Texto>
            </View>
            <Pressable
              onPress={() => setHojaPorQueCuenta(true)}
              accessibilityRole="button"
              /* La etiqueta accesible es el TEXTO QUE ABRE, no «info». */
              accessibilityLabel={t('adoptar.sinCuentaPorQueTitulo')}
              hitSlop={12}
            >
              <Icono nombre="info" tamano={20} registro="aa" />
            </Pressable>
          </View>
        ) : null}

        {/* ═══ A1 · LOS FILTROS, EN UNA SOLA HOJA ═══════════════════════

            ☠️ **Acá vivían TRES `FiltroPills` con doce chips**, en cuatro ejes
            apilados sobre la lista. Se retiran enteros (Ley 37) y su razón se
            conserva: *un riel horizontal esconde parte de un eje sin decir
            cuánto esconde* — por eso eran `envuelve` y no una tira. **La hoja
            resuelve lo mismo mejor:** no compite con la lista por el alto de la
            pantalla, y al abrirse muestra los nueve ejes a la vez en vez de
            tres.

            🔑 **Y la hoja devuelve `FiltrosAdoptables` TAL CUAL** —los nombres
            de la lista blanca del motor, `snake_case` incluido—, así que lo que
            sale entra al lector sin traducción. *Ese pedido fue explícito: una
            hoja que devuelve su propio vocabulario obliga a un mapa en el
            medio, y ese mapa es la segunda verdad que diverge sola.* ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <Boton
            variante="secundario"
            tamaño="sm"
            etiqueta={
              /* El botón DICE CUÁNTOS filtros hay puestos. Sin el número, la
                 hoja esconde lo que la lista ya está aplicando: *una lista
                 filtrada que no se declara filtrada se lee como un catálogo
                 pobre.* */
              cuantosFiltros === 0
                ? t('adoptar.filtrar')
                : t('adoptar.filtrarConCuenta', { n: cuantosFiltros })
            }
            onPress={() => setHojaFiltros(true)}
          />
          {cuantosFiltros > 0 ? (
            <Boton
              variante="ghost"
              tamaño="sm"
              etiqueta={t('adoptar.limpiarFiltros')}
              onPress={() => setFiltros({})}
            />
          ) : null}
          {/* ⭐ **A6 · LA PUERTA AL BUSCADOR DE REFUGIOS** — segunda mitad del
              literal del founder: *«en adopción puedo buscar un refugio por
              nombre y ver sus animales»*.

              Va acá, al lado de filtrar, porque es la otra forma de acotar la
              vidriera: **una filtra animales, la otra entra por la casa que los
              cuida.** Y va `ghost`: la acción principal de esta pantalla sigue
              siendo mirar animales (Ley 5 — una superficie con dos acentos no
              tiene ninguno). */}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Boton
              variante="ghost"
              tamaño="sm"
              etiqueta={t('adoptar.verRefugios')}
              onPress={() => router.push('/adoptar/refugios')}
            />
          </View>
        </View>

        {estado.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={120} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        ) : estado.fase === 'error' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('adoptar.errorTitulo')}
            descripcion={t('adoptar.errorDetalle')}
          />
        ) : estado.destacados.length === 0 && estado.resto.length === 0 ? (
          /* Vacío DIGNO y verdadero. **Y distingue si hay filtros puestos**: con
             filtros el vacío no dice que no hay animales —dice que no hay con
             ESE criterio—, y ofrece el camino de vuelta. *Un vacío que culpa al
             catálogo cuando el que filtró fue el usuario le esconde la salida.* */
          <EstadoVacio
            registro="seccion"
            icono={<Icono nombre="refugio" tamano={48} />}
            titulo={llave === '{}' ? t('adoptar.vacioTitulo') : t('adoptar.vacioFiltradoTitulo')}
            descripcion={llave === '{}' ? t('adoptar.vacioDetalle') : t('adoptar.vacioFiltradoDetalle')}
            accion={
              llave === '{}' ? undefined : (
                <Boton
                  variante="secundario"
                  etiqueta={t('adoptar.limpiarFiltros')}
                  onPress={() => setFiltros({})}
                />
              )
            }
          />
        ) : (
          <>
            {/* LOS QUE MÁS ESPERAN — la carta con su criterio. §4.1 pide el
                porqué **en cada uno**, no sólo en la cabecera: la línea de
                arriba dice por qué el grupo va primero, y la de cada animal
                dice cuánto lleva él. */}
            {estado.destacados.length > 0 ? (
              <BloqueConCriterio
                titulo={t('adoptar.destacadosTitulo')}
                porque={t('adoptar.destacadosPorque')}
              >
                <View style={{ gap: spacing[4] }}>
                  {estado.destacados.map((a) => {
                    const e = describirEspera(a.esperaDias);
                    return (
                      <View key={a.publicacionId} style={{ gap: spacing[1] }}>
                        {tarjeta(a, estado.caras)}
                        <Texto variante="apoyo" color="tertiary">
                          {t('adoptar.esperaDesde', {
                            cuanto: t(e.clave as 'espera.dias', e.params),
                          })}
                        </Texto>
                      </View>
                    );
                  })}
                </View>
              </BloqueConCriterio>
            ) : null}

            {/* EL RESTO. Con filtro de convivencia activo, el servidor pone
                primero a los confirmados: la segunda tanda gana su título y
                **el mismo peso visual** — «todavía no se sabe» no es un
                descarte (§4.1). */}
            {estado.ordenPorConvivencia ? (
              <Texto variante="apoyo" color="tertiary">
                {t('adoptar.ordenConvivencia')}
              </Texto>
            ) : null}
            <View style={{ gap: spacing[4] }}>{estado.resto.map((a) => tarjeta(a, estado.caras))}</View>

            {estado.hayMas ? (
              <Boton
                variante="secundario"
                bloque
                etiqueta={t('adoptar.cargarMas')}
                cargando={trayendoMas}
                onPress={() => void cargarMas()}
              />
            ) : null}
          </>
        )}
      </ScrollView>

      {/* N22 · LA «i» EXPLICA — y lo que explica es POR QUÉ, no CÓMO. */}
      <Hoja
        visible={hojaPorQueCuenta}
        onCerrar={() => setHojaPorQueCuenta(false)}
        titulo={t('adoptar.sinCuentaPorQueTitulo')}
      >
        <View style={{ gap: spacing[3] }}>
          <Texto variante="cuerpo">{t('adoptar.sinCuentaPorQueCuerpo')}</Texto>
          <Boton
            etiqueta={t('adoptar.sinCuentaPorQueCierre')}
            bloque
            onPress={() => setHojaPorQueCuenta(false)}
          />
        </View>
      </Hoja>

      {/* ═══ A1 · LA HOJA ═══════════════════════════════════════════════════

          🔑 **`onAplicar` va DERECHO al estado de filtros** — la hoja devuelve
          `FiltrosAdoptables` con los nombres de la lista blanca del motor
          (`convive_perros`, `ciudad_id`, `con_pareja`, `snake_case` incluido),
          así que **no hay mapa en el medio**. Un mapa entre dos vocabularios es
          la segunda verdad que diverge sola.

          ⚠️ **El grupo de ciudad se pasa VACÍO cuando el catálogo llegó vacío**,
          y eso pasa **en el caso normal de esta pantalla**: se mira sin sesión y
          `cat_ciudades` tiene RLS con policies sólo para `authenticated`.
          *Un grant sin policy no da error: da silencio.* Pedido a A la policy y
          a B que el grupo no dibuje con la lista en cero. ── */}
      <HojaFiltros
        visible={hojaFiltros}
        onCerrar={() => setHojaFiltros(false)}
        filtros={filtros}
        onAplicar={setFiltros}
        opciones={{
          especies: ESPECIES.map((e) => ({
            codigo: e,
            etiqueta: t(`adoptar.especie_${e}` as 'adoptar.especie_perro'),
            icono: null,
          })),
          tallas: TALLAS.map((x) => ({
            codigo: x,
            etiqueta: t(`adoptar.talla_${x}` as 'adoptar.talla_S'),
            icono: null,
          })),
          sexos: SEXOS.map((x) => ({
            codigo: x,
            etiqueta: t(`adoptar.sexo_${x}` as 'adoptar.sexo_macho'),
            icono: null,
          })),
          ciudades: ciudades.map((c) => ({ codigo: c.id, etiqueta: c.nombre, icono: null })),
        }}
        /* 🔴 OBLIGATORIA, y la razón es de B: este filtro **angosta escondiendo
           una ausencia**. La persona pide esterilizados, recibe menos animales,
           y no tiene forma de saber que los perdió por un dato que falta y no
           por un hecho. *Un filtro que angosta en silencio es peor que uno que
           no existe.* */
        explicaEsterilizado={{
          texto: '',
          onExplicar: () => setExplicandoEsterilizado(true),
          etiquetaExplicacion: t('adoptar.esterilizadoEtiqueta'),
        }}
        voces={{
          titulo: t('adoptar.filtrosTitulo'),
          aplicar: t('adoptar.filtrosAplicar'),
          limpiar: t('adoptar.filtrosLimpiar'),
          grupos: {
            especie: t('adoptar.grupoEspecie'),
            talla: t('adoptar.grupoTalla'),
            sexo: t('adoptar.grupoSexo'),
            ciudad: t('adoptar.grupoCiudad'),
            convivePerros: t('adoptar.grupoPerros'),
            conviveGatos: t('adoptar.grupoGatos'),
            conviveNinos: t('adoptar.grupoNinos'),
            binarios: t('adoptar.grupoMarcas'),
          },
          /* Los tres estados, y **el tercero se dice con todas las letras**: es
             una opción elegible más, que es lo que dice sin palabras que
             filtrar no lo descarta. */
          convivencia: {
            si: t('adoptar.conviveSi'),
            no: t('adoptar.conviveNo'),
            no_se_sabe: t('adoptar.conviveNoSeSabe'),
          },
          binarios: {
            urgente: t('adoptar.filtroUrgente'),
            esterilizado: t('adoptar.filtroEsterilizado'),
            con_pareja: t('adoptar.filtroPareja'),
          },
        }}
      />

      <Hoja
        visible={explicandoEsterilizado}
        onCerrar={() => setExplicandoEsterilizado(false)}
        titulo={t('adoptar.filtroEsterilizado')}
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">{t('adoptar.esterilizadoExplicacion')}</Texto>
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
