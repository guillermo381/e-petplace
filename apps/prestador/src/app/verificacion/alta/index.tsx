/**
 * EL WIZARD DE ALTA (S97-C · `LA_CASA_DEL_PRESTADOR` §4).
 *
 * ── TESIS ──────────────────────────────────────────────────────────────
 * «Tu negocio ya existe. Esto es abrirle la casa.»
 *
 * ── FIRMA ──────────────────────────────────────────────────────────────
 * **El salteo que dice a dónde fue lo que salteaste.** §4.2, literal: *un
 * paso salteable que no dice dónde vive eso no es salteable: es perdido.*
 * Es la firma porque es lo que convierte el wizard en PUERTA y no en peaje.
 *
 * ── CHANEL ─────────────────────────────────────────────────────────────
 * Se quitó: la barra de progreso porcentual, el «paso 3 de 4» y las tildes
 * de completado. Ley 18 — la estructura solo informa si codifica una
 * verdad, y el porcentaje de un wizard de cuatro pasos no codifica
 * ninguna. Queda la narrativa del contador, que sí dice algo.
 *
 * ── 🔴 EL WIZARD NO ES SUPERFICIE NUEVA (§4.0) ─────────────────────────
 * Es la PUERTA DE PRIMERA VEZ sobre el alta que ya existe. Lo único nuevo
 * son DOS cosas: el paso ② y el destape. Los cuatro huesos
 * (`registro` · `sala-espera` · `bienvenida-dia1` ·
 * `cuenta-comercial/nueva`) siguen vivos y NO se duplican.
 *
 * ── LA FRONTERA (§4.0bis) ──────────────────────────────────────────────
 * **EL WIZARD ACTIVA. LA CONFIGURACIÓN CONFIGURA.** Cortes, capacidad,
 * radio y familias viven en `ventas/configuracion.tsx` y no se copian acá.
 *
 * ⚠️ RUTA DE VERIFICACIÓN (skill §1b-bis): no reemplaza pantalla viva y no
 * entra a la navegación del producto hasta la firma en dispositivo.
 */

import { useCallback, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Destape,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import {
  obtenerEstadoOnboardingWizard,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  saltarPasoOnboarding,
  type PasoOnboarding,
} from '@epetplace/api';

import { ProgresoAlta } from '@/components/alta/ProgresoAlta';
import { PasoNegocio } from '@/components/alta/PasoNegocio';
import { PasoOfreces } from '@/components/alta/PasoOfreces';
import { PasoDocumentos } from '@/components/alta/PasoDocumentos';
import { PasoEquipo } from '@/components/alta/PasoEquipo';
import {
  KEY_ETIQUETA_TAB,
  ordenTabsPrestador,
  type ClaveTabPrestador,
} from '@/lib/barra-prestador';
import { resolverCapacidadDeBarra } from '@/lib/barra-prestador-lectura';
import { useTraduccion } from '@/i18n';

/** Los cuatro pasos de §4.1, en su orden firmado. **El vocabulario es el
 *  del MOTOR** (`PasoOnboarding` de A): un paso que la pantalla llamara
 *  distinto que la base sería un mapeo más que se puede desincronizar. */
const PASOS = ['negocio', 'oferta', 'documentos', 'equipo'] as const satisfies readonly PasoOnboarding[];
type Paso = PasoOnboarding;

/** Claves LITERALES por paso — jamás armadas por concatenación. */
const TITULO_PASO = {
  negocio: 'alta.paso1.titulo',
  oferta: 'alta.paso2.titulo',
  documentos: 'alta.paso3.titulo',
  equipo: 'alta.paso4.titulo',
} as const satisfies Record<Paso, string>;

/** La voz del salto — nombra EL BENEFICIO y EL LUGAR (§4.2). El paso ①
 *  no figura: es el único que no se saltea (sin nombre el destape no
 *  tiene qué mostrar y la casa no tiene título). */
const SALTEO = {
  oferta: 'alta.salteo.paso2',
  documentos: 'alta.salteo.paso3',
  equipo: 'alta.salteo.paso4',
} as const;

type Contexto =
  | { estado: 'cargando' }
  /* ⭐ S98-C · D-799 — TRES CAUSAS, TRES ESTADOS. Acá había UNO
     (`'error'`) con la voz «puede ser la conexión», y **el wrapper
     siempre supo distinguirlas**: `sin_sesion` · un fallo real ·
     `data === null`, que ni siquiera es un error (es el peldaño 0
     declarado en el JSDoc de `obtenerMiCuentaComercial`).
     *Colapsarlas mandaba a mirar el WiFi a alguien cuya sesión caducó, y
     le decía «no pudimos cargar» a quien simplemente todavía no tiene un
     negocio.* Y las tres tienen SALIDAS distintas —reintentar, entrar,
     crear el negocio—: una sola voz obliga a una sola salida, y ésa es la
     parte que no se arregla escribiendo mejor el texto. */
  | { estado: 'error' }
  | { estado: 'sin_sesion' }
  | { estado: 'sin_negocio' }
  | {
      estado: 'listo';
      cuentaComercialId: string;
      prestadorId: string | null;
      nombreNegocio: string;
      /** EL CONTADOR VIENE DEL MOTOR (A, S97). No se calcula acá: la
       *  completitud se DERIVA de la base y solo el SALTO se guarda, así
       *  que no hay marca que pueda desincronizarse. Y la ley S91 ya vive
       *  adentro — un documento EN REVISIÓN cuenta como hecho (él ya hizo
       *  lo suyo); uno rechazado vuelve a sumar. */
      contador: number;
    };

export default function WizardAlta() {
  const { t } = useTraduccion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [contexto, setContexto] = useState<Contexto>({ estado: 'cargando' });

  /* ⭐ S98-C · EL WIZARD ACEPTA EN QUÉ PASO ABRIR — y nace por una razón
     concreta, no por completitud: la firma de «Tu tienda» pide que el
     Negocio ofrezca la puerta de crecimiento **enrutando a la solicitud
     que ya existe, jamás con un segundo productor** de
     `solicitar_naturaleza_comercial`. Esa solicitud vive en el paso ②.
     Sin esto, la única forma de honrar la firma era mandar a la persona
     al paso ① a que buscara sola — o clonar el botón, que es lo prohibido.

     Se lee UNA vez, al montar: el wizard sigue siendo dueño de su avance
     y la URL no lo gobierna después. Un valor que no sea un paso conocido
     cae al ① en silencio — un deep link mal escrito no es una pantalla
     rota. */
  const { paso: pasoPedido } = useLocalSearchParams<{ paso?: string }>();
  const [indice, setIndice] = useState(() => {
    const i = (PASOS as readonly string[]).indexOf(pasoPedido ?? '');
    return i >= 0 ? i : 0;
  });
  const [salteando, setSalteando] = useState<Paso | null>(null);
  const [guardandoSalto, setGuardandoSalto] = useState(false);
  const [destapando, setDestapando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  /** ⭐ S98-C (D-819) · Las tabs que esta persona va a tener DE VERDAD.
   *  `null` = todavía no se resolvió. Se pide **al disparar el destape** y
   *  no en cada `cargar()`: el wizard recarga en cada foco y en cada paso,
   *  y esto se necesita UNA vez, al final. */
  const [tabsDelDestape, setTabsDelDestape] = useState<ClaveTabPrestador[] | null>(null);

  const cargar = useCallback(async () => {
    const [cuenta, prestador] = await Promise.all([
      obtenerMiCuentaComercial(),
      obtenerMiPrestador(),
    ]);
    if (!cuenta.ok) {
      setContexto({ estado: cuenta.codigo === 'sin_sesion' ? 'sin_sesion' : 'error' });
      return;
    }
    if (cuenta.data === null) {
      // NO es un error: es el peldaño 0. El wizard abre la casa de un
      // negocio que ya existe — si no existe, el camino es crearlo.
      setContexto({ estado: 'sin_negocio' });
      return;
    }
    const onboarding = await obtenerEstadoOnboardingWizard(cuenta.data.id);
    if (!onboarding.ok) {
      setContexto({ estado: 'error' });
      return;
    }
    setContexto({
      estado: 'listo',
      cuentaComercialId: cuenta.data.id,
      // El vendedor puro NO tiene fila de prestador, y eso no es un error:
      // es el cinturón de §8.6bis. `null` es un valor legal acá.
      prestadorId: prestador.ok && prestador.data !== null ? prestador.data.id : null,
      nombreNegocio: cuenta.data.nombreComercial ?? '',
      contador: onboarding.data.contador,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const paso = PASOS[indice] ?? 'negocio';
  const esUltimo = indice === PASOS.length - 1;

  /* ⭐ S98-C · ☠️ «GUARDAR» MUERE — CONTINUAR VALIDA Y GUARDA (firma de la
     mesa, 14-ago). **UN PASO, UN BOTÓN.**

     El defecto que cura: el paso ① tenía su «Guardar» Y el «Continuar» del
     pie. *Dos botones para un solo acto no son dos caminos: son la
     pregunta «¿cuál de los dos guarda?» hecha pantalla* — y el que
     adivinaba mal perdía lo tipeado, porque Continuar avanzaba sin
     guardar nada.

     CÓMO, sin que el contenedor sepa de campos ajenos: cada paso REGISTRA
     su confirmación —validar, guardar, y decir si se puede avanzar—, y el
     pie la ejecuta. El contenedor no valida nada suyo (no conoce los
     campos de nadie) y ningún paso navega (no conoce el orden). *Cada uno
     sabe una sola cosa, que es lo que hace que el próximo paso no tenga
     que tocar este archivo.*

     Un paso SIN confirmación registrada avanza directo — y eso no es un
     hueco: los pasos ② y ③ guardan EN EL ACTO (el toggle escribe al
     tocarlo, el documento sube al elegirlo), así que no tienen nada
     pendiente que confirmar. */
  const confirmarPaso = useRef<(() => Promise<boolean>) | null>(null);
  const registrarConfirmacion = useCallback((fn: (() => Promise<boolean>) | null) => {
    confirmarPaso.current = fn;
  }, []);

  async function alContinuar() {
    if (confirmando) return;
    const fn = confirmarPaso.current;
    if (fn !== null) {
      setConfirmando(true);
      const ok = await fn();
      setConfirmando(false);
      // Si no validó o no guardó, NO se avanza: la voz ya la dijo el paso
      // en su campo. Avanzar igual sería perder lo tipeado en silencio.
      if (!ok) return;
    }
    avanzar();
  }

  function avanzar() {
    // La completitud NO se marca acá: se DERIVA en el motor. Recargamos
    // para que el contador diga la verdad de la base y no la nuestra.
    void cargar();
    if (esUltimo) {
      /* ⭐ S98-C (D-819) · La ceremonia nombra las tabs REALES, resueltas
         con la misma fuente que la barra.

         ⏪ S99-D · L1 · D-820 — **LA PREMISA DE ESTE BLOQUE CADUCÓ, Y SE
         CORRIGE ACÁ EN VEZ DE DEJARLA.** Decía, literal: *«EL VENDEDOR PURO
         NO ENUMERA NINGUNA… no tiene fila de prestador, o sea que no usa
         esta barra: su casa es `/ventas`»*, y por eso su tira quedaba
         VACÍA. **Era cierto el 14-ago a la mañana y dejó de serlo esa misma
         tarde**, con la firma de §2.0: el vendedor puro es un dueño y tiene
         la casa entera. Su razonamiento seguía siendo impecable —no
         prometerle `Hoy` a quien no lo tiene— pero la premisa cambió por un
         acto en OTRO archivo, y **ningún typecheck, lint ni gate podía
         verlo: un comentario no es un guard** (L-193 en su forma limpia).

         **Hoy enumera las suyas, y por la MISMA composición que arma su
         barra** — que es textualmente el discriminador de cierre de L1 en
         `PLAN_S99` §2: *«el destape sale de la misma composición que la
         arma, no de una lista a mano»*. La tira vacía habría pasado de
         honesta a mentira el día que la barra apareciera.

         ⚠️ Lo que NO cambia y sigue siendo la razón de este bloque: la
         ceremonia jamás nombra una tab que después no está. Antes eso se
         cumplía con el silencio; ahora se cumple con la verdad. */
      /* ⚠️ EL DISCRIMINADOR ES EL `prestadorId`, NO EL ESTADO — y lo cazó el
         typecheck al estrechar el tipo, que es para lo que la unión existe
         (L-222: el estado equivocado se vuelve inexpresable, no se
         documenta). `contexto.prestadorId` es `string | null` INCLUSO con
         `estado === 'listo'`: el vendedor puro llega hasta acá listo y sin
         fila. La guarda vieja los mezclaba en un solo `null` porque los dos
         caían en la misma tira vacía; ahora que cada uno tiene salida
         propia, mezclarlos habría mandado al que todavía carga por el
         camino del vendedor. */
      const idDestape = contexto.estado === 'listo' ? contexto.prestadorId : null;
      const quienDestapa =
        idDestape !== null
          ? ({ tipo: 'prestador', prestadorId: idDestape } as const)
          : ({ tipo: 'vendedorPuro' } as const);
      void resolverCapacidadDeBarra(quienDestapa)
        .then(ordenTabsPrestador)
        .then(setTabsDelDestape);
      setDestapando(true);
      return;
    }
    setIndice((i) => i + 1);
  }

  function pedirSalto() {
    const actual = PASOS[indice];
    if (actual === undefined || actual === 'negocio') return;
    setSalteando(actual);
  }

  /** El salto SÍ se guarda (es lo único que se guarda). Si el guardado
   *  falla NO avanzamos en silencio: un salto que la base no registró
   *  volvería a pedirse y el contador diría otra cosa que la pantalla. */
  async function confirmarSalto(paso: Exclude<Paso, 'negocio'>) {
    if (contexto.estado !== 'listo') return;
    setGuardandoSalto(true);
    const res = await saltarPasoOnboarding(contexto.cuentaComercialId, paso);
    setGuardandoSalto(false);
    if (!res.ok) {
      mostrar({ texto: res.mensaje, variante: 'error' });
      return;
    }
    setSalteando(null);
    avanzar();
  }

  if (contexto.estado === 'cargando') {
    return (
      <View style={{ flex: 1, padding: spacing[4] }}>
        <EsqueletoGrupo>
          <View style={{ gap: spacing[4] }}>
            <Esqueleto ancho="50%" alto={28} />
            <Esqueleto alto={120} />
            <Esqueleto alto={120} />
          </View>
        </EsqueletoGrupo>
      </View>
    );
  }

  if (contexto.estado === 'error' || contexto.estado === 'sin_sesion' || contexto.estado === 'sin_negocio') {
    // Cada causa con SU voz y SU salida (D-799). El reintento solo
    // aparece donde sirve: volver a preguntar no crea un negocio ni
    // devuelve una sesión.
    const voz =
      contexto.estado === 'sin_sesion'
        ? {
            titulo: t('alta.sinSesionTitulo'),
            detalle: t('alta.sinSesionVoz'),
            etiqueta: t('alta.sinSesionAccion'),
            ir: () => router.replace('/login'),
          }
        : contexto.estado === 'sin_negocio'
          ? {
              titulo: t('alta.sinNegocioTitulo'),
              detalle: t('alta.sinNegocioVoz'),
              etiqueta: t('alta.sinNegocioAccion'),
              ir: () => router.push('/cuenta-comercial/nueva'),
            }
          : {
              titulo: t('alta.errorTitulo'),
              detalle: t('alta.errorVoz'),
              etiqueta: t('alta.reintentar'),
              ir: () => void cargar(),
            };
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
        <EstadoVacio
          titulo={voz.titulo}
          descripcion={voz.detalle}
          accion={<Boton variante="compacto" etiqueta={voz.etiqueta} onPress={voz.ir} />}
        />
      </View>
    );
  }

  // ── EL DESTAPE (§5) — la ceremonia del cierre ──────────────────────────
  // La navegación sale de `alTerminar`, JAMÁS de un reloj propio: la pieza
  // lo dispara desde el callback de su último `withTiming` real, así que
  // si cambia una duración o el reduce-motion colapsa la secuencia, el
  // aviso se mueve con ella. Dos relojes contando lo mismo se desfasan.
  if (destapando) {
    /* ⭐ S98-C (D-819) · EL DESTAPE COMPONE, YA NO ENUMERA.
       Acá vivía una lista escrita a mano —`Hoy·Datos·Negocio·Cuenta`,
       fija— mientras la barra se compone por capacidad en CINCO casos
       (§2 de la letra). Dos consecuencias medidas: **nunca nombraba
       `ATENDER`**, la tab que nació en esta misma sesión, y **le prometía
       `Hoy` y `Negocio` a quien no los tiene** — el vendedor puro ni
       siquiera usa esta barra: su casa es `/ventas`.

       *La ceremonia que le enseña la app a alguien es el peor lugar
       posible para una lista desincronizada: es lo primero que ve, y es
       exactamente lo que va a buscar después.*

       La cura NO fue sincronizar dos copias —eso deja la deuda viva, solo
       que dormida— sino **dejar una**: `lib/barra-prestador` es la fuente
       y ésta es su segunda consumidora. `null` mientras resuelve; el
       destape espera a tenerla en vez de mostrar una lista provisoria que
       después cambie. */
    return (
      <Destape
        nombreNegocio={contexto.nombreNegocio}
        logo={null}
        tabsHabilitadas={(tabsDelDestape ?? []).map((key) => ({
          key,
          etiqueta: t(KEY_ETIQUETA_TAB[key]),
        }))}
        alTerminar={() => router.replace('/(tabs)')}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {indice === 0 ? (
        <Encabezado variante="navegacion" titulo={t(TITULO_PASO[paso])} />
      ) : (
        <Encabezado
          variante="navegacion"
          titulo={t(TITULO_PASO[paso])}
          atras
          onAtras={() => setIndice((i) => Math.max(0, i - 1))}
        />
      )}

      <ScrollView
        contentContainerStyle={{
          padding: spacing[4],
          gap: spacing[8],
          // La ley chica de la cola de scroll + la altura del CTA fijo.
          paddingBottom: insets.bottom + spacing[8] + 96,
        }}
      >
        <ProgresoAlta restantes={contexto.contador} />

        {paso === 'negocio' ? (
          <PasoNegocio
            cuentaComercialId={contexto.cuentaComercialId}
            nombreInicial={contexto.nombreNegocio}
            alGuardar={() => void cargar()}
            registrarConfirmacion={registrarConfirmacion}
          />
        ) : paso === 'oferta' ? (
          <PasoOfreces
            prestadorId={contexto.prestadorId}
            cuentaComercialId={contexto.cuentaComercialId}
          />
        ) : paso === 'documentos' ? (
          <PasoDocumentos
            cuentaComercialId={contexto.cuentaComercialId}
            prestadorId={contexto.prestadorId}
            alSubir={() => void cargar()}
          />
        ) : (
          <PasoEquipo
            cuentaComercialId={contexto.cuentaComercialId}
            prestadorId={contexto.prestadorId}
            alSumar={() => void cargar()}
            registrarConfirmacion={registrarConfirmacion}
          />
        )}
      </ScrollView>

      {/* CTA fijo al pie */}
      <View
        style={{
          padding: spacing[4],
          paddingBottom: insets.bottom + spacing[4],
          gap: spacing[2],
        }}
      >
        <Boton
          variante="primario"
          bloque
          cargando={confirmando}
          etiqueta={esUltimo ? t('alta.terminar') : t('alta.continuar')}
          onPress={() => void alContinuar()}
        />
        {paso === 'negocio' ? null : (
          <Boton variante="ghost" bloque etiqueta={t('alta.saltar')} onPress={pedirSalto} />
        )}
      </View>

      {/* ── EL SALTO CON SU VOZ (§4.2) — la firma de la pantalla ──────── */}
      <Hoja
        visible={salteando !== null}
        onCerrar={() => setSalteando(null)}
        titulo={t('alta.saltar')}
        altura="media"
      >
        <View style={{ gap: spacing[6], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">
            {salteando !== null && salteando !== 'negocio' ? t(SALTEO[salteando]) : ''}
          </Texto>
          <Boton
            variante="primario"
            bloque
            cargando={guardandoSalto}
            etiqueta={t('alta.entendido')}
            onPress={() => {
              if (salteando !== null && salteando !== 'negocio') void confirmarSalto(salteando);
            }}
          />
        </View>
      </Hoja>
    </View>
  );
}
