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
  caraDeMascota,
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

/** Los ejes que se encienden y se apagan de a uno. */
type Marca = 'urgente' | 'esterilizado' | 'conPareja' | 'perros' | 'gatos' | 'ninos';

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

  const [especie, setEspecie] = useState<string | null>(null);
  const [talla, setTalla] = useState<string | null>(null);
  const [sexo, setSexo] = useState<string | null>(null);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [trayendoMas, setTrayendoMas] = useState(false);
  /** `null` mientras no se sabe. **No se asume que no hay sesión**: con `false`
   *  por default, el primer render le ofrecería registrarse a alguien que ya
   *  entró. */
  const [conSesion, setConSesion] = useState<boolean | null>(null);
  const [hojaPorQueCuenta, setHojaPorQueCuenta] = useState(false);

  /**
   * Los filtros, armados desde el estado de los chips.
   *
   * 🔴 **Los tres ejes de convivencia mandan `'si'`, jamás `'no_se_sabe'`.** El
   * chip dice «convive con perros»; pedir `'no'` sería el filtro contrario y
   * pedir `'no_se_sabe'` sería buscar a los que nadie probó. *Un chip cuya
   * etiqueta y cuyo valor no coinciden es un filtro que devuelve lo que nadie
   * pidió, y compila igual.*
   */
  const filtros: FiltrosAdoptables = {
    ...(especie === null ? {} : { especie }),
    ...(talla === null ? {} : { talla }),
    ...(sexo === null ? {} : { sexo }),
    ...(marcas.includes('urgente') ? { urgente: true } : {}),
    ...(marcas.includes('esterilizado') ? { esterilizado: true } : {}),
    ...(marcas.includes('conPareja') ? { conPareja: true } : {}),
    ...(marcas.includes('perros') ? { convivePerros: 'si' as const } : {}),
    ...(marcas.includes('gatos') ? { conviveGatos: 'si' as const } : {}),
    ...(marcas.includes('ninos') ? { conviveNinos: 'si' as const } : {}),
  };
  /** La llave que reinicia la paginación: **cualquier cambio de filtro empieza
   *  de cero**. Un cursor de la consulta anterior sobre un orden nuevo devuelve
   *  filas que no corresponden. */
  const llave = JSON.stringify(filtros);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        /* Las dos JUNTAS y no encadenadas: la sesión no es precondición de la
           lista (`L-223` — lo que se paga en reloj es la CADENA). Y se pregunta
           SIEMPRE, no sólo al postular: la línea de arriba tiene que decir la
           verdad desde el primer render. */
        const [ses, r] = await Promise.all([
          obtenerSesion(),
          obtenerAdoptables({ filtros: JSON.parse(llave) as FiltrosAdoptables }),
        ]);
        if (!vigente) return;
        setConSesion(ses.ok && ses.data !== null);
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
      /* ⭐ **A4 · sin foto, la cara de la casa; huella en ningún lado**
         (firma del founder, 2-sep). `razaSlug: null` porque el lector trae el
         NOMBRE de la raza y no su ruta: **slugificar texto es justo lo que la
         casa prohíbe** — la ruta sale de un LOOKUP contra `cat_razas`. Se cae
         al genérico de la especie, que es una cara igual.

         ⏳ **INTERINO CON FECHA, y se declara para que no se
         calcifique.** B entregó el contrato correcto en `90bebbfd`:
         `fotoDeEspecie` **aparte** de `fotoUrl`. La distinción no es
         cosmética — la foto propia lleva **encuadre de retrato** (zoom
         + corrimiento, porque en una foto de mascota la cara queda
         alta) y la ilustración de la casa **va a sangre**: pasarla por
         `fotoUrl`, como acá, *le aplica un recorte pensado para otra
         cosa*. Hoy no puedo consumirlo: ese commit vive en
         `origin/pista/s112-b` y **no está en `main`** (medido con
         `branch -r --contains`). **Migra a `fotoDeEspecie` en cuanto
         A lo mergee.***/
      fotoUrl={caraDeMascota({
        especie: a.especie,
        razaSlug: null,
        fotoUri: a.fotoUrl === null ? null : (caras.get(a.fotoUrl) ?? null),
      })}
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

  const alternar = (m: Marca) =>
    setMarcas((xs) => (xs.includes(m) ? xs.filter((x) => x !== m) : [...xs, m]));

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

        {/* ═══ LOS FILTROS ══════════════════════════════════════════════════
            `disposicion="envuelve"` y no la tira: son doce chips en cuatro
            ejes, y C midió en S100d que un riel horizontal esconde el 78 % de
            un eje **sin decir cuánto esconde**. Acá el peor caso es peor que
            aquél. */}
        <View style={{ gap: spacing[3] }}>
          <FiltroPills
            disposicion="envuelve"
            opciones={[
              { codigo: 'todas', etiqueta: t('adoptar.todas'), icono: null },
              ...ESPECIES.map((e) => ({
                codigo: e,
                etiqueta: t(`adoptar.especie_${e}` as 'adoptar.especie_perro'),
                icono: null,
                capa: 'identidad' as const,
              })),
            ]}
            activo={especie ?? 'todas'}
            onCambio={(c) => setEspecie(c === 'todas' ? null : c)}
          />
          <FiltroPills
            disposicion="envuelve"
            opciones={[
              { codigo: 'cualquiera', etiqueta: t('adoptar.tallaCualquiera'), icono: null },
              ...TALLAS.map((x) => ({
                codigo: x,
                etiqueta: t(`adoptar.talla_${x}` as 'adoptar.talla_S'),
                icono: null,
              })),
              ...SEXOS.map((x) => ({
                codigo: x,
                etiqueta: t(`adoptar.sexo_${x}` as 'adoptar.sexo_macho'),
                icono: null,
              })),
            ]}
            /* Dos ejes en una fila de chips, y **se comporta como uno**: elegir
               una talla no debería apagar el sexo. Por eso el estado son dos
               variables y el `activo` es el que corresponda al código tocado. */
            activo={talla ?? sexo ?? 'cualquiera'}
            onCambio={(c) => {
              if (c === 'cualquiera') {
                setTalla(null);
                setSexo(null);
                return;
              }
              if ((TALLAS as readonly string[]).includes(c)) setTalla(c === talla ? null : c);
              else setSexo(c === sexo ? null : c);
            }}
          />
          <FiltroPills
            disposicion="envuelve"
            opciones={[
              { codigo: 'urgente', etiqueta: t('adoptar.filtroUrgente'), icono: null, capa: 'cuidado' },
              { codigo: 'esterilizado', etiqueta: t('adoptar.filtroEsterilizado'), icono: null, capa: 'cuidado' },
              { codigo: 'conPareja', etiqueta: t('adoptar.filtroPareja'), icono: null, capa: 'cuidado' },
              { codigo: 'perros', etiqueta: t('adoptar.filtroPerros'), icono: null, capa: 'cuidado' },
              { codigo: 'gatos', etiqueta: t('adoptar.filtroGatos'), icono: null, capa: 'cuidado' },
              { codigo: 'ninos', etiqueta: t('adoptar.filtroNinos'), icono: null, capa: 'cuidado' },
            ]}
            activos={marcas}
            onAlternar={(c) => alternar(c as Marca)}
          />
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
                  onPress={() => {
                    setEspecie(null);
                    setTalla(null);
                    setSexo(null);
                    setMarcas([]);
                  }}
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
    </SafeAreaView>
  );
}
