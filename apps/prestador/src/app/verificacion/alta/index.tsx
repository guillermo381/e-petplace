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

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
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
  | { estado: 'error' }
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
  const [indice, setIndice] = useState(0);
  const [salteando, setSalteando] = useState<Paso | null>(null);
  const [guardandoSalto, setGuardandoSalto] = useState(false);
  const [destapando, setDestapando] = useState(false);

  const cargar = useCallback(async () => {
    const [cuenta, prestador] = await Promise.all([
      obtenerMiCuentaComercial(),
      obtenerMiPrestador(),
    ]);
    if (!cuenta.ok || cuenta.data === null) {
      setContexto({ estado: 'error' });
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

  function avanzar() {
    // La completitud NO se marca acá: se DERIVA en el motor. Recargamos
    // para que el contador diga la verdad de la base y no la nuestra.
    void cargar();
    if (esUltimo) {
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

  if (contexto.estado === 'error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}>
        <EstadoVacio
          titulo={t('alta.errorTitulo')}
          descripcion={t('alta.errorVoz')}
          accion={
            <Boton
              variante="compacto"
              etiqueta={t('alta.reintentar')}
              onPress={() => void cargar()}
            />
          }
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
    return (
      <Destape
        nombreNegocio={contexto.nombreNegocio}
        logo={null}
        tabsHabilitadas={[
          { key: 'index', etiqueta: t('tabs.hoy') },
          { key: 'mascotas', etiqueta: t('tabs.mascotas') },
          { key: 'negocio', etiqueta: t('tabs.negocio') },
          { key: 'cuenta', etiqueta: t('tabs.cuenta') },
        ]}
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
          />
        ) : paso === 'oferta' ? (
          <PasoOfreces
            prestadorId={contexto.prestadorId}
            cuentaComercialId={contexto.cuentaComercialId}
          />
        ) : paso === 'documentos' ? (
          <PasoDocumentos
            cuentaComercialId={contexto.cuentaComercialId}
            alSubir={() => void cargar()}
          />
        ) : (
          <PasoEquipo
            cuentaComercialId={contexto.cuentaComercialId}
            prestadorId={contexto.prestadorId}
            alSumar={() => void cargar()}
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
          etiqueta={esUltimo ? t('alta.terminar') : t('alta.continuar')}
          onPress={avanzar}
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
