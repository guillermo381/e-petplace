/**
 * ADOPTAR — LA VIDRIERA (S111-C). *«Se presentan vidas, no inventario»* (§4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⏪ **ACÁ VIVÍA UN «PRÓXIMAMENTE HONESTO» (S73), Y SU LÁPIDA SE CUMPLIÓ.**
 * Decía *«cuando estén acá, vas a conocer a sus mascotas en adopción»* — era
 * cierto mientras no hubiera motor. **S111-A lo construyó**, así que el texto
 * pasó de honesto a falso **el mismo día**, y se retira en el acto que lo vuelve
 * falso (`L-395`): un puente que sobrevive a su río manda al próximo a construir
 * otro.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS (Ley 14):** *estos animales existen, tienen nombre y están esperando.*
 *
 * **FIRMA (Ley 15):** la cara, grande y presidiendo cada fila. §4 lo dice sin
 * rodeos —*se presentan vidas, no inventario*— y por eso el avatar es `lg` y no
 * un thumbnail al costado: **la foto no ilustra el dato, la foto ES el dato.**
 *
 * **CHANEL (Ley 16):** se quitó el contador de resultados. *Saber que hay 34 no
 * ayuda a elegir a ninguno, y convierte una lista de vidas en un inventario* —
 * exactamente lo que §4 prohíbe.
 *
 * ── 🔴 LO QUE ESTA PANTALLA NO HACE, Y NINGUNA ES UN RECORTE ────────────
 * · **No enumera estados.** El motor filtra por
 *   `cat_estados_adopcion.visible_en_vidriera`; si la pantalla listara estados,
 *   *se olvidaría del sexto el día que nazca.*
 * · **No ordena por antigüedad.** §4 pide un bloque «Llevan más tiempo
 *   esperando» y dice **explícito que NO es orden puro por antigüedad** —*los
 *   que más esperan suelen ser los más difíciles, y una primera pantalla de
 *   casos duros hace rebotar al que entró a mirar*—. Tengo `creadaEn` y
 *   **ordenar por él sería justo lo que la letra prohíbe.** El bloque entra
 *   cuando el criterio viva en el servidor; inventarlo acá es la pantalla
 *   decidiendo una regla de producto.
 * · **Sin swipe, sin descartes, sin score de match** (§10.8). No hay nada que
 *   deshabilitar: no se construyó.
 * · **Un solo filtro: especie.** Es lo único que el contrato acepta hoy. Los
 *   otros ocho de §4 —tamaño, edad, sexo, convivencia, urgentes, esterilizado,
 *   pareja, cerca de mí— **no se dibujan apagados**: un filtro que no filtra es
 *   una promesa rota a un toque de distancia (Ley 23).
 * · 🔴 **SIN FILTRO DE RAZA, y es de piedra** (§4): *filtrar por raza empuja a
 *   buscar raza.* La raza se **muestra** cuando el refugio la sabe; no se
 *   ofrece como criterio.
 *
 * ✅ **LA PUERTA SIN CUENTA DE §4 ESTÁ ABIERTA, y esta nota decía lo contrario.**
 * ⏪ Decía *«medido, `obtener_adoptables` está REVOKE de anon y exige
 * auth.uid(); cuando A abra la función…»*. **A la abrió** —medido en
 * `20260907520000_s111a_tres_destinos_actor_refugio.sql:345`,
 * `GRANT EXECUTE … TO authenticated, anon`, y la mitad que faltaba (las fotos)
 * en `20260907560000`—. *Una medición correcta se vuelve falsa el día que otra
 * pista cura lo que medía, y nada avisa: sigue leyéndose como un límite vivo*
 * (`L-166`). El botón vive en `login.tsx` y esta misma pantalla sirve a las dos
 * puertas sin tocarse, tal como la nota vieja anticipaba.
 *
 * ✅ **Y lo que la puerta sin cuenta agrega acá (§4.1): UNA LÍNEA, nada más.**
 * *«Para postular vas a necesitar una cuenta»* con su «i», sólo cuando la
 * sesión está medida y es `false`. No hay CTA de registro: el botón de cada
 * animal ya lo dice en el momento en que hace falta.
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Icono,
  SelectorOpcion,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  caraDeMascota,
  crearSolicitudAdopcion,
  obtenerAdoptables,
  obtenerSesion,
  resolverUrlsFotos,
  type Adoptable,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; lista: Adoptable[]; caras: Map<string, string> };

/** Las dos especies que la casa adopta hoy. **El día que el motor acepte otra,
 *  este arreglo se queda corto y hay que venir acá** — se declara en vez de
 *  derivarlo de un catálogo que este lector no trae. */
const ESPECIES = ['perro', 'gato'] as const;

export default function Adoptar() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [especie, setEspecie] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  /** `null` mientras no se sabe. **No se asume que no hay sesión**: con `false`
   *  por default, el primer render ofrecería registrarse a alguien que ya
   *  entró. */
  const [conSesion, setConSesion] = useState<boolean | null>(null);
  const [postulando, setPostulando] = useState<string | null>(null);
  const [hojaPorQueCuenta, setHojaPorQueCuenta] = useState(false);
  const { mostrar } = useAviso();

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        /* Se pregunta por la sesión SIEMPRE, no sólo al postular: el botón tiene
           que decir la verdad desde el primer render. */
        const ses = await obtenerSesion();
        if (vigente) setConSesion(ses.ok && ses.data !== null);
        /* ⚠️ ADAPTACION MECANICA DE A (S112-A2), PROVISIONAL Y DECLARADA.
           `obtenerAdoptables` paso a devolver `{destacados, resto, cursor,
           hayMas}` en vez de un array. Esto NO es la lista que §4.1 pide —es
           el minimo para que el arbol compile— y **C la reescribe en C2** con
           destacados, filtros y keyset. */
        const r = await obtenerAdoptables({
          filtros: especie != null ? { especie } : undefined,
        });
        if (!vigente) return;
        /* Ley 13: un fallo JAMÁS se disfraza de «no hay nadie en adopción».
           *Ese vacío diría que ningún animal espera, que es lo contrario de lo
           que pasa.* */
        if (!r.ok) {
          setEstado({ fase: 'error' });
          return;
        }
        const lista = [...r.data.destacados, ...r.data.resto];
        const paths = lista
          .map((a) => a.fotoUrl)
          .filter((x): x is string => typeof x === 'string' && x.length > 0);
        const caras = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
        if (!vigente) return;
        setEstado({ fase: 'listo', lista, caras });
      })();
      return () => {
        vigente = false;
      };
    }, [especie]),
  );

  /**
   * POSTULAR. §4: *«Al postular, se pide crear cuenta.»*
   *
   * 🔴 **Sin sesión NO se intenta y se rebota:** se lleva al registro. *Llamar
   * al motor para que conteste «sin sesión» y recién ahí mandar al alta es
   * hacerle pagar al usuario un viaje para decirle algo que ya sabíamos.*
   *
   * ⚠️ **Y no se pierde a quién estaba mirando** — pero NO por la pila. ⏪ Acá
   * decía *«la vidriera queda atrás en la pila, así que al volver del registro
   * sigue acá»*, **y es falso**: `registro.tsx` termina en
   * `router.replace('/onboarding')`, que borra la pila entera. *Una afirmación
   * verosímil sobre navegación es casi imposible de desmentir leyendo la
   * pantalla que la escribe: hay que ir a la otra.* El destino viaja como dato
   * (`lib/volver-a`) y cruza los dos `replace` del alta.
   */
  const postular = async (a: Adoptable) => {
    if (postulando !== null) return;
    if (conSesion !== true) {
      /* 🔴 **EL DESTINO VIAJA, porque la pila NO sobrevive.** `registro` hace
         `replace('/onboarding')` y con eso *volver acá deja de ser posible*: la
         nota vieja de este archivo decía «la vidriera queda atrás en la pila,
         así que al volver del registro sigue acá» y **era falsa** — medido en
         `registro.tsx`. §4.1 pide lo contrario: volver exactamente a donde
         estaba. Se declara el destino y él cruza los dos `replace`. */
      router.push({ pathname: '/registro', params: { volverA: '/adoptar' } });
      return;
    }
    setPostulando(a.publicacionId);
    try {
      const r = await crearSolicitudAdopcion({ publicacionId: a.publicacionId });
      if (!r.ok) {
        /* 🔴 **ACÁ HABÍA UN COMENTARIO QUE DESCRIBÍA UN CÓDIGO QUE NO EXISTÍA.**
           Decía: *«`solicitud_ya_viva` trae el id de la que existe: se lleva ahí
           en vez de decir que no (`L-424`)»* — **y debajo sólo mostraba el
           mensaje.** No llevaba a ningún lado. *Un comentario que afirma un
           comportamiento que su código no tiene es peor que no tenerlo: el
           próximo lector cree que el caso está resuelto y no lo mira.*

           **Y aunque hubiera querido llevar, no podía**: D lo midió contra el
           motor (`S112-D-para-C-CONTRATO-DEL-HILO` §2①). El motor **sí** manda
           el id (`RAISE 'solicitud_ya_viva: %', v_sol`), pero `fallo()` mapea
           por prefijo y **devuelve el mensaje estático, tirando el uuid**. Así
           que el id nunca llegó a esta pantalla.

           ✅ **Lo que sí se puede hoy, y es el espíritu de `L-424`: llevar a la
           LISTA.** No es la solicitud exacta, pero *deja de ser un «no» y pasa
           a ser un camino* — y la lista tiene una sola entrada por animal, así
           que la que busca está a un toque.
           **Cuando A publique la cura, el id viene en `detalle`** y esto pasa a
           llevar al hilo exacto: es cambiar el destino, nada más. */
        /* 🔴 **LA COMPUERTA NO SE MUESTRA: SE RESUELVE.** A la puso hoy
           (`crear_solicitud_adopcion` rebota `condiciones_no_aceptadas` si la
           persona no las aceptó) y su voz **no dice «error», dice qué falta**.
           *Mostrar el rebote y dejarla ahí sería contarle un requisito y no
           darle con qué cumplirlo* — el mismo defecto que `L-424` nombra para
           los guards que sólo saben negarse.

           Se lleva a la LECTURA, con `volverA` para que al aceptar caiga de
           vuelta acá y pueda postular. **No se re-postula sola al volver**, y
           es deliberado: postular es un acto de la persona, y encadenarlo a
           una aceptación convertiría «acepto las condiciones» en «acepto y de
           paso mando la solicitud». */
        if (r.codigo === 'condiciones_no_aceptadas') {
          router.push({
            pathname: '/legales/[codigo]',
            params: { codigo: 'condiciones_adopcion', volverA: '/adoptar' },
          });
          return;
        }
        if (r.codigo === 'solicitud_ya_viva') {
          mostrar({ variante: 'neutro', texto: r.mensaje });
          router.push('/adoptar/solicitudes');
          return;
        }
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      router.push({
        pathname: '/adoptar/solicitud/[solicitudId]',
        params: { solicitudId: r.data.solicitudId },
      });
    } finally {
      setPostulando(null);
    }
  };

  const especieDe = (x: string): 'perro' | 'gato' | undefined =>
    x === 'perro' || x === 'gato' ? x : undefined;

  /** El subtítulo del animal: sólo lo que el refugio SABE.
   *  🔴 `fechaNacimiento` null significa «no se sabe», y **no se infiere una
   *  edad que nadie declaró** — el contrato del lector lo dice y acá se cumple
   *  callando, no rellenando. */
  const rasgos = (a: Adoptable): string => {
    const partes: string[] = [];
    if (a.raza !== null && a.raza.length > 0) partes.push(a.raza);
    if (a.sexo !== null && a.sexo.length > 0) {
      partes.push(t(`adoptar.sexo_${a.sexo}` as 'adoptar.sexo_macho'));
    }
    return partes.join(' · ');
  };

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

            🔴 **Sin contador, y sin pedirlas para saber si hay.** Contar exigiría
            un viaje más en CADA carga de la vidriera, y S94-PERF midió que el
            techo de esta casa son los viajes, no las consultas. *Un número que
            cuesta una espera en la pantalla más visitada no vale lo que informa*
            — y el vacío del otro lado tiene su camino de vuelta. */}
        {conSesion === true ? (
          <CeldaNavegacion
            titulo={t('misSolicitudes.entrada')}
            onPress={() => router.push('/adoptar/solicitudes')}
          />
        ) : null}

        {/* ═══ LA LÍNEA DE LA PUERTA SIN CUENTA (§4.1) ═══════════════════════
            Literal del founder: *«Arriba de la lista, una línea: "Para postular
            vas a necesitar una cuenta" con la "i". **Nada más**.»*

            🔴 **`=== false` y no `!== true`**, y la diferencia es la pantalla
            entera: mientras la sesión se está preguntando el valor es `null`, y
            `!== true` pintaría la línea durante ese instante **para alguien que
            sí tiene cuenta**. *Decirle a quien ya entró que va a necesitar una
            cuenta es la app admitiendo que no sabe quién es.*

            🔴 **Y NO es un botón ni una carta.** §4.1 corta con «nada más»: acá
            no se ofrece crear la cuenta —eso ya lo dice el botón de cada
            animal, en el momento en que hace falta—. *Poner un CTA de registro
            arriba de la vidriera convierte «mirá» en «registrate»*, que es
            exactamente al que esta puerta viene a no espantar. */}
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
              /* La etiqueta accesible es el TEXTO QUE ABRE, no «info»: quien
                 navega con lector oye qué va a leer, no cómo se llama el
                 control. */
              accessibilityLabel={t('adoptar.sinCuentaPorQueTitulo')}
              hitSlop={12}
            >
              <Icono nombre="info" tamano={20} registro="aa" />
            </Pressable>
          </View>
        ) : null}

        {/* EL ÚNICO FILTRO QUE EL MOTOR ACEPTA. `null` = todas, y es la opción
            que preside: la vidriera se abre mostrando a todos. */}
        <SelectorOpcion
          acento="control"
          disposicion="fila"
          etiqueta={t('adoptar.filtroEspecie')}
          opciones={[
            { codigo: 'todas', etiqueta: t('adoptar.todas') },
            ...ESPECIES.map((e) => ({ codigo: e, etiqueta: t(`adoptar.especie_${e}` as 'adoptar.especie_perro') })),
          ]}
          seleccionada={especie ?? 'todas'}
          onSelect={(c) => setEspecie(c === 'todas' ? null : c)}
        />

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
        ) : estado.lista.length === 0 ? (
          /* Vacío DIGNO y verdadero: hoy hay 0 cuentas con rol `refugio` —las
             crea el admin—, así que esto es lo que se ve, y lo dice sin
             disfrazarlo de error ni de «pronto». */
          <EstadoVacio
            registro="seccion"
            icono={<Icono nombre="refugio" tamano={48} />}
            titulo={t('adoptar.vacioTitulo')}
            descripcion={t('adoptar.vacioDetalle')}
          />
        ) : (
          estado.lista.map((a) => {
            const foto = a.fotoUrl === null ? null : (estado.caras.get(a.fotoUrl) ?? null);
            /* La escalera de la casa: foto → genérico de su especie → huella.
               `razaSlug: null` A PROPÓSITO — el lector trae la raza como TEXTO
               libre, y `resolverUrlRaza` exige el slug de `cat_razas`: *una URL
               derivada del texto tipeado acierta a veces y muestra la cara
               equivocada el resto*. */
            const cara = caraDeMascota({ especie: a.especie, razaSlug: null, fotoUri: foto });
            const detalle = rasgos(a);
            return (
              <Tarjeta key={a.publicacionId} relleno="normal" elevacion="reposo">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
                  {/* LA FIRMA: la cara preside. §4 — se presentan VIDAS. */}
                  <AvatarMascota
                    nombre={a.nombre}
                    fotoUrl={cara ?? undefined}
                    tamano="lg"
                  />
                  <View style={{ flex: 1, gap: spacing[1] }}>
                    <Texto variante="titulo">{a.nombre}</Texto>
                    {detalle.length > 0 ? <Texto variante="apoyo">{detalle}</Texto> : null}
                    {/* El refugio es PROCEDENCIA, no un adorno (§5: queda como
                        procedencia permanente). Si el lector no lo trae, se
                        calla en vez de poner «desconocido». */}
                    {a.publicadorNombre !== null ? (
                      <Texto variante="apoyo" color="tertiary">
                        {t('adoptar.publicadoPor', { refugio: a.publicadorNombre })}
                      </Texto>
                    ) : null}
                  </View>
                </View>

                {/* POSTULAR — la única acción de la vidriera. §10.8: sin swipe,
                    sin descartes, sin score. *No hay nada que deshabilitar
                    porque no se construyó.* */}
                <View style={{ marginTop: spacing[3] }}>
                  <Boton
                    variante="primario"
                    bloque
                    etiqueta={
                      conSesion === false
                        ? t('adoptar.postularSinCuenta')
                        : t('adoptar.postular', { nombre: a.nombre })
                    }
                    cargando={postulando === a.publicacionId}
                    onPress={() => void postular(a)}
                  />
                </View>
              </Tarjeta>
            );
          })
        )}
      </ScrollView>

      {/* N22 · LA «i» EXPLICA — y lo que explica es POR QUÉ, no CÓMO. La
          persona no necesita instrucciones para registrarse: necesita saber que
          la cuenta es del refugio que va a conversar con ella, no un peaje
          nuestro. */}
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
