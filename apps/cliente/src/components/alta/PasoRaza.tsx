/**
 * S91-D · PASO 2/4 — la raza, y para el acuario el TIPO DE AGUA.
 *
 * ── EL TÍTULO CAMBIA POR ESPECIE (firma founder, lámina) ────────────────────
 * «a alguien con un canario no se le pregunta la raza». Por eso el título no
 * es un string con un {{especie}} adentro: son preguntas distintas, y la que
 * le toca a cada especie se decide en un Record EXHAUSTIVO — el día que se
 * active una séptima especie, el typecheck la reclama en vez de darle la
 * pregunta del perro por descarte.
 *
 * ── LA CLÁUSULA DEL PEZ (firma de mesa, 7-ago-2026 · opción A) ──────────────
 * «pez» no describe un animal: describe un ACUARIO. Su campo dos es el tipo
 * de agua —dulce o marino—, **en espejo de la raza**: mismo lugar, mismo
 * momento, mismo destino. Y es una elección cerrada de dos, no texto libre:
 * no hay «mestizo» de agua.
 *
 * ── LAS TRES PIEZAS, YA JUNTAS ──────────────────────────────────────────────
 * El catálogo es de A (`obtenerRazasDeEspecie`, D-379 · 105 filas sembradas),
 * el matching es de B (`sugerencias.ts`) y el render del chip es de acá. Cada
 * una en su territorio y ninguna clonada.
 *
 * Y la regla firmada rige igual con lista o sin ella: **el catálogo SUGIERE,
 * el dueño CONFIRMA.** Escribir algo que la lista no tiene sigue siendo una
 * respuesta válida y se guarda tal cual — por eso el campo de texto no
 * desaparece cuando hay chips.
 */

import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Encabezado,
  EvitaTeclado,
  SelectorOpcion,
  spacing,
  useTheme,
} from '@epetplace/ui';

import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';
import { caraDeMascota } from '@/lib/cara-mascota';
import { CODIGO_NO_SE, SelectorDeRaza, type RazaElegida } from '@/components/selector-de-raza';
import { esAcuario, TIPOS_DE_AGUA, type BorradorAlta, type EspecieUi } from './tipos';

/**
 * La pregunta de cada especie. EXHAUSTIVO sobre el vocabulario ENTERO de la
 * UI (once códigos), no sobre las seis que hoy se ofrecen: el typecheck ya
 * cobró esa diferencia mientras se escribía esto, y tenía razón — una especie
 * que se active mañana no puede caer en la pregunta del perro por descarte.
 *
 * ⚠️ AL GATE: la lámina firma el CONCEPTO («EL TÍTULO CAMBIA POR ESPECIE») y
 * nombra dos casos —ave y pez—. `roedor` recibe acá la misma pregunta que
 * `ave` porque el principio firmado es idéntico («a alguien con un canario no
 * se le pregunta la raza»: a alguien con un hámster, tampoco). **Es una
 * extensión del principio, no una firma** — la forma fina se decide en
 * dispositivo, y esto se declara para que se decida a la vista.
 */
type ClaveTitulo =
  | 'alta.paso2Raza'
  | 'alta.paso2Tipo'
  | 'alta.paso2TipoAve'
  | 'alta.paso2TipoRoedor'
  | 'alta.paso2Agua';

const CLAVE_TITULO: Record<EspecieUi, ClaveTitulo> = {
  perro: 'alta.paso2Raza',
  gato: 'alta.paso2Raza',
  conejo: 'alta.paso2Raza',
  ave: 'alta.paso2TipoAve',
  roedor: 'alta.paso2TipoRoedor',
  pez: 'alta.paso2Agua',
  // Inactivas hoy en `cat_especies` (medido). Contestan igual porque el mapa
  // es total: si alguna se enciende, la pregunta que reciba es una decisión
  // escrita, no un descarte.
  cobaya: 'alta.paso2Raza',
  huron: 'alta.paso2Raza',
  equino: 'alta.paso2Raza',
  reptil: 'alta.paso2Tipo',
  otro: 'alta.paso2Tipo',
};

export function PasoRaza({
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
  const especieUi = esEspecieUi(borrador.especie) ? borrador.especie : undefined;

  const [agua, setAgua] = useState<string | undefined>(
    (TIPOS_DE_AGUA as readonly string[]).includes(borrador.raza ?? '') ? borrador.raza : undefined,
  );
  /** S91 · P3 — el estado del selector vive ACÁ y la pieza es controlada: el
   *  alta lo lleva a los params del borrador y el perfil a una RPC. La pieza
   *  no sabe —ni tiene por qué— qué se hace después con lo elegido. */
  const [eleccion, setEleccion] = useState<RazaElegida>({
    raza: borrador.raza,
    slug: borrador.razaSlug,
    elegido: borrador.razaSlug,
  });

  const titulo = t(especieUi ? CLAVE_TITULO[especieUi] : 'alta.paso2Raza', { nombre });

  /** Un solo lugar decide qué se guarda. Para el acuario el mismo slot lleva
   *  el tipo de agua (en espejo de la raza, firma de mesa) y el cierre lo
   *  parte hacia su parámetro. */
  const avanzarCon = (valor: string | undefined, slugElegido?: string) =>
    onAvanzar({
      raza: valor !== undefined && valor.length > 0 ? valor : undefined,
      razaSlug: slugElegido,
    });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={titulo} atras onAtras={onAtras} />
      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[6],
            gap: spacing[4],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* «Un elemento, dos trabajos» (lámina): el mismo círculo que
              acompaña a la elección es el que en el paso 4 ocupa el lugar de
              la foto. Hoy muestra el genérico de la especie; cuando exista el
              catálogo, mostrará la cara de la raza elegida sin tocar nada
              de acá — `caraDeMascota` ya resuelve los dos casos. */}
          <View style={{ alignItems: 'center', paddingTop: spacing[2] }}>
            <AvatarMascota
              nombre={nombre}
              fotoUrl={caraDeMascota({ especie: borrador.especie, razaSlug: eleccion.slug })}
              tamano="lg"
            />
          </View>

          {acuario ? (
            <>
              <SelectorOpcion
                acento="control"
                etiqueta={t('alta.aguaEtiqueta')}
                opciones={[
                  { codigo: 'dulce', etiqueta: t('alta.aguaDulce') },
                  { codigo: 'marino', etiqueta: t('alta.aguaMarino') },
                ]}
                seleccionada={agua}
                onSelect={setAgua}
              />
              <Boton
                etiqueta={t('alta.continuar')}
                bloque
                deshabilitado={agua === undefined}
                onPress={() => avanzarCon(agua)}
              />
            </>
          ) : (
            <>
              {/* §6 · LA MISMA PIEZA QUE EDITA LA RAZA EN EL PERFIL. La lámina
                  pide «la gramática del alta» para el perfil, y eso se cumple
                  compartiendo, no copiando: dos selectores con las mismas
                  reglas se separan el día que alguien afina uno. */}
              <SelectorDeRaza
                especie={borrador.especie ?? ''}
                valor={eleccion}
                onCambio={setEleccion}
              />

              <Boton
                etiqueta={t('alta.continuar')}
                bloque
                // «No sé» habilita el paso sin escribir nada: no saber ES una
                // respuesta. Sin esta segunda pata, el chip de primera clase
                // habría quedado tocable y mudo.
                deshabilitado={
                  (eleccion.raza ?? '').trim().length === 0 && eleccion.elegido !== CODIGO_NO_SE
                }
                onPress={() => avanzarCon(eleccion.raza, eleccion.slug)}
              />
            </>
          )}
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
