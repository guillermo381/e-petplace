/**
 * S91-D · PASO 3/4 — «Cuéntanos de su historia».
 *
 * Los tres campos hablan del PASADO del animal: fecha, sexo y origen son UNA
 * conversación, no tres formularios. Por eso viven juntos en un paso y no en
 * tres — la lámina mete seis campos en las MISMAS cuatro pantallas.
 *
 * ── EL ORIGEN, QUE ES EL CAMPO NUEVO Y EL QUE MÁS PESA ──────────────────────
 * Hasta hoy `mascotas.origen` se escribía HARDCODEADO en `'desconocido'`
 * dentro de las dos RPCs del dueño (leído con `pg_get_functiondef` en esta
 * sesión, no de un reporte). La columna admite nueve valores y su CHECK ya
 * existe: el dato nunca se pidió, no es que no cupiera.
 *
 * ⚠️ **HOY LO QUE SE ELIJA ACÁ NO SE GUARDA.** Las dos RPCs no tienen
 * `p_origen` — está pedido a A con su SQL literal. El campo se construye igual
 * porque el viaje ya queda armado punta a punta y el día que la firma exista
 * el dato llega solo. **Declarado, no disimulado**: es lo primero que hay que
 * verificar cuando A aplique.
 *
 * ── LA VOZ: «Cuéntanos», no «Contanos» (L-148) ──────────────────────────────
 * La lámina firmada dice «Contanos de su historia» — es el DICTADO del
 * founder, y los dictados viajan en voseo. La voz de producto de esta casa es
 * TUTEO neutro y está re-firmada por la pasada única de S89. Se conserva el
 * acento de la casa; si el gate quiere el voseo, es una línea.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  CampoFecha,
  Encabezado,
  SelectorOpcion,
  spacing,
  useTheme,
  type CampoFechaValor,
} from '@epetplace/ui';

import { useTraduccion } from '@/i18n';
import { esAcuario, type BorradorAlta } from './tipos';

export function PasoHistoria({
  borrador,
  onAvanzar,
  onAtras,
}: {
  borrador: BorradorAlta;
  onAvanzar: (parcial: BorradorAlta) => void;
  onAtras: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const nombre = borrador.nombre ?? t('alta.tuMascota');
  const acuario = esAcuario(borrador.especie);

  const [valor, setValor] = useState<CampoFechaValor | undefined>(
    borrador.fecha !== undefined &&
      (borrador.precision === 'exacta' ||
        borrador.precision === 'aproximada' ||
        borrador.precision === 'estimada')
      ? { fecha: borrador.fecha, precision: borrador.precision }
      : undefined,
  );
  const [sexo, setSexo] = useState<string | undefined>(borrador.sexo);
  const [origen, setOrigen] = useState<string | undefined>(borrador.origen);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('alta.paso3Titulo', { nombre })}
        atras
        onAtras={onAtras}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[6],
          gap: spacing[2],
        }}
      >
        {/* ⚠️ LA BIFURCACIÓN DE LA FECHA — freno declarado, no olvido.
            La lámina es literal: «ESTO YA ESTÁ CONSTRUIDO: CampoFecha tiene el
            botón y las 4 etapas […] NO SE CONSTRUYE, SE HACE VISIBLE».
            Medido en esta sesión: el botón «No sé la fecha» vive en
            `packages/ui/src/components/CampoFecha.tsx:406`, ADENTRO de la Hoja
            y debajo de las ruedas — por eso 0 de 20 lo encontraron.
            Hacerlo visible EN LA PANTALLA exige que la pantalla pueda abrir el
            componente en su modo de etapas, y eso es una prop de `CampoFecha`:
            `packages/ui` es territorio EXCLUSIVO de B. Está pedido.
            Clonar acá las cuatro etapas (con su aritmética 0/2/5/9 y su voz del
            namespace `ui`) era el atajo, y es exactamente lo que §6 prohíbe.
            MIENTRAS TANTO la ayuda NOMBRA la salida en vez de insinuarla: no
            es la forma de la lámina, y no finge serlo. */}
        <CampoFecha
          label={acuario ? t('alta.fechaAcuarioLabel') : t('alta.fechaLabel')}
          placeholder={t('alta.fechaPlaceholder')}
          valor={valor}
          onChange={setValor}
          ayuda={t('alta.fechaAyuda')}
        />

        {/* El acuario no tiene sexo — la pregunta no se le hace. Es el mismo
            criterio que el título por especie del paso 2: no se muestra
            deshabilitada ni con un «no aplica», simplemente no está. */}
        {acuario ? null : (
          <SelectorOpcion
            acento="control"
            etiqueta={t('alta.sexoEtiqueta')}
            opciones={[
              { codigo: 'macho', etiqueta: t('alta.sexoMacho') },
              { codigo: 'hembra', etiqueta: t('alta.sexoHembra') },
              { codigo: 'desconocido', etiqueta: t('alta.sexoNoSe') },
            ]}
            seleccionada={sexo}
            onSelect={setSexo}
          />
        )}

        {/* LOS CINCO ORÍGENES QUE EL ALTA OFRECE (lámina), de los nueve del
            CHECK. Sin elegir = no viaja, y la RPC cae a 'desconocido' — que es
            la verdad: nadie contestó. No hay opción «no sé» a propósito:
            agregarla escribiría 'desconocido' como si fuera una respuesta,
            cuando ya es lo que pasa al no contestar. */}
        {acuario ? null : (
          <SelectorOpcion
            acento="control"
            etiqueta={t('alta.origenEtiqueta')}
            disposicion="columnas"
            opciones={[
              { codigo: 'adoptado', etiqueta: t('alta.origenAdoptado') },
              { codigo: 'refugio', etiqueta: t('alta.origenRefugio') },
              { codigo: 'nacido_en_casa', etiqueta: t('alta.origenNacidoEnCasa') },
              { codigo: 'encontrado', etiqueta: t('alta.origenEncontrado') },
              { codigo: 'criadero', etiqueta: t('alta.origenCriadero') },
            ]}
            seleccionada={origen}
            onSelect={setOrigen}
          />
        )}

        <View style={{ height: spacing[2] }} />
        <Boton
          etiqueta={t('alta.continuar')}
          bloque
          onPress={() =>
            onAvanzar({
              ...(valor ? { fecha: valor.fecha, precision: valor.precision } : null),
              ...(sexo !== undefined ? { sexo } : null),
              ...(origen !== undefined ? { origen } : null),
            })
          }
        />
      </ScrollView>
    </View>
  );
}
