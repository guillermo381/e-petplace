/**
 * LA FICHA DE EDICIÓN DEL ADOPTABLE (§4.2 «Mascotas»).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **VOZ DEL FOUNDER:** *«Toco uno y edito su ficha: especie, sexo, edad
 * estimada, tamaño, esterilizado, vacunas, convivencia en tres estados (tres
 * botones del mismo peso), historia del rescate, microchip, REMETFU, origen
 * (rescate / cesión con fecha), ciudad y zona, urgente, pareja vinculada, bono
 * opcional (monto y destino).»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔴 **POR QUÉ ESTA PANTALLA NO EXISTIÓ HASTA QUE HUBO LECTOR, Y NO FUE
 * PRUDENCIA DE MÁS.** `actualizarAdoptable` toma `Partial<FichaEditable>`, así
 * que **un campo ausente y uno vacío se guardan igual, y uno de los dos borra**.
 * Abrir el formulario con los campos en blanco porque el lector público rebota
 * los borradores habría **borrado la historia de un animal con un solo
 * guardado**. El lector llegó (`obtenerMiAdoptable`) y trae la ficha ENTERA
 * aunque haya nulos, que es la mitad que faltaba.
 *
 * ── LO QUE SE MANDA: SÓLO LO QUE CAMBIÓ ─────────────────────────────────
 * El guardado compara contra lo que vino del servidor y envía **las claves
 * tocadas y nada más**. *Mandar la ficha entera en cada guardado convertiría
 * cualquier lectura vieja en una escritura: dos personas del refugio editando a
 * la vez y la última pisa lo que la otra acababa de cambiar, sin conflicto y
 * sin aviso.*
 *
 * ── ⚠️ LOS TRES CAMPOS DE §4.2 QUE NO SE EDITAN ACÁ, CON SU RAZÓN ───────
 * · **especie · sexo · edad · tamaño · esterilizado · microchip · REMETFU** son
 *   de la MASCOTA, no de la publicación: `FichaEditable` no los tiene. Se
 *   muestran **en lectura** para que el refugio vea con qué está publicando, y
 *   *inventar un escritor acá sería un segundo camino de escritura a la misma
 *   fila* (el defecto que la casa nombró como «dos puertas al mismo dato»).
 * · **ciudad** — `ciudadId` es un uuid y **no hay lector de `cat_ciudades`** en
 *   esta app. La zona sí se escribe (es texto libre). *Un selector de ciudades
 *   sobre un catálogo que no puedo leer sería un campo que adivina.*
 * · **pareja vinculada** — `parejaId` exige elegir otra publicación del mismo
 *   refugio, y eso es un selector propio. Se declara.
 *
 * ── LAS FOTOS ───────────────────────────────────────────────────────────
 * Van en su propio tramo: **subir exige redimensionar en el cliente a ≤1600 px**
 * (§6) y el path tiene que caer en `<publicacionId>/`, que es lo que la policy
 * del bucket mira. Los escritores existen (`agregarFotoAdoptable`,
 * `reordenarFotosAdoptable`, `borrarFotoAdoptable`); acá se **muestran** las que
 * hay, para que la ficha no mienta sobre lo que el animal tiene.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  ConvivenciaInput,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaDato,
  Interruptor,
  MarcaDeAgua,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
  type EstadoConvivencia,
} from '@epetplace/ui';
import {
  actualizarAdoptable,
  obtenerMiAdoptable,
  type FichaEditable,
  type MiAdoptableFicha,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; original: MiAdoptableFicha };

type Eje = 'perros' | 'gatos' | 'ninos';

/** Los cuatro del enum, medidos en `20260908040000:80`. */
const VACUNAL = ['al_dia', 'incompleto', 'sin_datos'] as const;
const ORIGENES = ['rescate', 'cesion'] as const;

export default function EditarAdoptable() {
  const { publicacionId } = useLocalSearchParams<{ publicacionId: string }>();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  /** El borrador de edición. `null` mientras no cargó. */
  const [ficha, setFicha] = useState<FichaEditable | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        const r = await obtenerMiAdoptable(publicacionId);
        if (!vigente) return;
        /* Ley 13: el fallo no se disfraza de ficha vacía. *Una ficha en blanco
           sobre una función que acepta `Partial` es un borrado esperando el
           botón de guardar.* */
        if (!r.ok) {
          setEstado({ fase: 'error' });
          return;
        }
        setEstado({ fase: 'listo', original: r.data });
        setFicha(r.data.ficha);
      })();
      return () => {
        vigente = false;
      };
    }, [publicacionId, intento]),
  );

  /**
   * LO QUE CAMBIÓ, y sólo eso.
   *
   * 🔴 Comparación por valor contra lo que trajo el servidor. *Mandar la ficha
   * entera convertiría cada guardado en una escritura de todo lo leído, y dos
   * personas del refugio editando a la vez se pisarían sin conflicto y sin
   * aviso.*
   */
  const cambios = (original: FichaEditable, actual: FichaEditable): Partial<FichaEditable> => {
    const d: Partial<FichaEditable> = {};
    for (const k of Object.keys(actual) as (keyof FichaEditable)[]) {
      if (original[k] !== actual[k]) {
        // `as never` sobre el VALOR, no sobre el tipo del campo: TS no puede
        // ligar la clave con su valor en un bucle, y el par ya viene del mismo
        // objeto — no hay conversión posible, sólo una limitación del bucle.
        d[k] = actual[k] as never;
      }
    }
    return d;
  };

  const guardar = async () => {
    if (estado.fase !== 'listo' || ficha === null || guardando) return;
    const d = cambios(estado.original.ficha, ficha);
    if (Object.keys(d).length === 0) {
      mostrar({ variante: 'neutro', texto: t('editarAdoptable.sinCambios') });
      return;
    }
    setGuardando(true);
    try {
      const r = await actualizarAdoptable({ publicacionId, ficha: d });
      if (!r.ok) {
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      mostrar({ variante: 'exito', texto: t('editarAdoptable.guardado') });
      /* Se relee: el motor puede haber derivado cosas (el veredicto de
         publicación depende de la edad y de la esterilización). */
      setIntento((n) => n + 1);
    } finally {
      setGuardando(false);
    }
  };

  const poner = <K extends keyof FichaEditable>(k: K, v: FichaEditable[K]) =>
    setFicha((f) => (f === null ? f : { ...f, [k]: v }));

  const cuerpo = (o: MiAdoptableFicha, f: FichaEditable) => {
    const ejeDe = (e: Eje): EstadoConvivencia =>
      e === 'perros' ? f.convivePerros : e === 'gatos' ? f.conviveGatos : f.conviveNinos;

    return (
      <>
        {/* LO QUE NO SE EDITA ACÁ — se muestra para que la ficha no mienta
            sobre con qué está publicando el refugio. Ver la cabecera. */}
        <Tarjeta relleno="normal" elevacion="reposo">
          <View style={{ gap: spacing[2] }}>
            <Texto variante="titulo">{o.nombre}</Texto>
            <FilaDato etiqueta={t('editarAdoptable.especie')} valor={o.especie} />
            {o.sexo !== null ? (
              <FilaDato etiqueta={t('editarAdoptable.sexo')} valor={o.sexo} />
            ) : null}
            {o.talla !== null ? (
              <FilaDato etiqueta={t('editarAdoptable.talla')} valor={o.talla} />
            ) : null}
            {o.microchip !== null ? (
              <FilaDato etiqueta={t('editarAdoptable.microchip')} valor={o.microchip} />
            ) : null}
            {o.remetfu !== null ? (
              <FilaDato etiqueta={t('editarAdoptable.remetfu')} valor={o.remetfu} />
            ) : null}
            <Separador />
            {/* EL VEREDICTO DE PUBLICACIÓN, dicho acá y no sólo en la lista: es
                el lugar donde el refugio puede hacer algo al respecto. */}
            <Texto variante="apoyo" color="tertiary">
              {o.veredictoPublicacion.puede
                ? t('editarAdoptable.puedePublicar')
                : t(
                    `adoptables.motivo_${o.veredictoPublicacion.motivo ?? 'desconocido'}` as 'adoptables.motivo_adoptable_no_esterilizado',
                  )}
            </Texto>
          </View>
        </Tarjeta>

        {/* LA CONVIVENCIA — tres botones del mismo peso por eje (§4.2). */}
        <ConvivenciaInput<Eje>
          ejes={[
            { eje: 'perros', etiqueta: t('editarAdoptable.conPerros'), estado: ejeDe('perros') },
            { eje: 'gatos', etiqueta: t('editarAdoptable.conGatos'), estado: ejeDe('gatos') },
            { eje: 'ninos', etiqueta: t('editarAdoptable.conNinos'), estado: ejeDe('ninos') },
          ]}
          voces={{
            si: t('editarAdoptable.convSi'),
            no: t('editarAdoptable.convNo'),
            no_se_sabe: t('editarAdoptable.convNoSeSabe'),
          }}
          onCambio={(eje, v) =>
            poner(
              eje === 'perros' ? 'convivePerros' : eje === 'gatos' ? 'conviveGatos' : 'conviveNinos',
              v,
            )
          }
        />

        <Campo
          label={t('editarAdoptable.historia')}
          value={f.historia ?? ''}
          onChangeText={(v) => poner('historia', v === '' ? null : v)}
          multilinea={4}
        />
        <Campo
          label={t('editarAdoptable.senas')}
          value={f.senas ?? ''}
          onChangeText={(v) => poner('senas', v === '' ? null : v)}
        />
        <Campo
          label={t('editarAdoptable.zona')}
          value={f.zona ?? ''}
          onChangeText={(v) => poner('zona', v === '' ? null : v)}
        />

        <SelectorOpcion
          acento="control"
          disposicion="fila"
          etiqueta={t('editarAdoptable.origen')}
          opciones={ORIGENES.map((c) => ({
            codigo: c,
            etiqueta: t(`editarAdoptable.origen_${c}` as 'editarAdoptable.origen_rescate'),
          }))}
          seleccionada={f.origenRescate ?? ''}
          onSelect={(c) => poner('origenRescate', c === 'rescate' ? 'rescate' : 'cesion')}
        />
        <SelectorOpcion
          acento="control"
          disposicion="fila"
          etiqueta={t('editarAdoptable.vacunal')}
          opciones={VACUNAL.map((c) => ({
            codigo: c,
            etiqueta: t(`editarAdoptable.vacunal_${c}` as 'editarAdoptable.vacunal_al_dia'),
          }))}
          seleccionada={f.estadoVacunal ?? ''}
          onSelect={(c) =>
            poner('estadoVacunal', c === 'al_dia' || c === 'incompleto' ? c : 'sin_datos')
          }
        />

        {/* `Interruptor` NO dibuja su etiqueta: la prop es el
            `accessibilityLabel` y el rótulo visible es de la pantalla (fila
            título + control). Su cabecera lo dice, y el typecheck me hizo ir a
            leerla. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <View style={{ flex: 1 }}>
            <Texto variante="cuerpo">{t('editarAdoptable.urgente')}</Texto>
          </View>
          <Interruptor
            registro="oficio"
            etiqueta={t('editarAdoptable.urgente')}
            encendido={f.urgente}
            onCambio={(v) => poner('urgente', v)}
          />
        </View>

        {/* EL BONO. Se guarda como número; el campo es texto porque el teclado
            numérico de RN devuelve texto y **parsear al guardar y no al tipear**
            deja escribir «12.» sin que el valor salte a 12 mientras se escribe. */}
        <Campo
          label={t('editarAdoptable.bonoMonto')}
          value={f.bonoMonto === null ? '' : String(f.bonoMonto)}
          onChangeText={(v) => {
            const n = Number(v.replace(',', '.'));
            poner('bonoMonto', v.trim() === '' || Number.isNaN(n) ? null : n);
          }}
          keyboardType="decimal-pad"
        />
        <Campo
          label={t('editarAdoptable.bonoDestino')}
          value={f.bonoDestino ?? ''}
          onChangeText={(v) => poner('bonoDestino', v === '' ? null : v)}
        />

        {/* LAS FOTOS, en lectura. Subirlas es su propio tramo (ver cabecera). */}
        <Texto variante="apoyo" color="tertiary">
          {t('editarAdoptable.fotos', { n: o.fotos.length })}
        </Texto>

        <Boton
          variante="primario"
          bloque
          etiqueta={t('editarAdoptable.guardar')}
          cargando={guardando}
          onPress={() => void guardar()}
        />
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={estado.fase === 'listo' ? estado.original.nombre : t('editarAdoptable.titulo')}
        atras
        onAtras={() => (router.canGoBack() ? router.back() : router.replace('/adoptables'))}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          gap: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {estado.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={120} />
            <Esqueleto alto={80} />
            <Esqueleto alto={160} />
          </EsqueletoGrupo>
        ) : estado.fase === 'error' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('editarAdoptable.errorTitulo')}
            descripcion={t('editarAdoptable.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('editarAdoptable.reintentar')}
                onPress={() => setIntento((n) => n + 1)}
              />
            }
          />
        ) : ficha === null ? null : (
          cuerpo(estado.original, ficha)
        )}
      </ScrollView>
    </View>
  );
}
