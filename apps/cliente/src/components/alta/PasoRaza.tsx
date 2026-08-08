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
  Campo,
  Encabezado,
  EvitaTeclado,
  SelectorOpcion,
  Texto,
  sugerir,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { obtenerRazasDeEspecie, type RazaCatalogo } from '@epetplace/api';

import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';
import { caraDeMascota, urlDeRutaGaleria, urlGenericaDeEspecie } from '@/lib/cara-mascota';
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

/** Los dos de primera clase. El `__` los aísla del espacio de slugs del
 *  catálogo — ver el comentario de `chips`. */
const CODIGO_MESTIZO = '__mestizo';
const CODIGO_NO_SE = '__no_se';

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

  const [raza, setRaza] = useState(borrador.raza ?? '');
  const [slug, setSlug] = useState<string | undefined>(borrador.razaSlug);
  const [agua, setAgua] = useState<string | undefined>(
    (TIPOS_DE_AGUA as readonly string[]).includes(borrador.raza ?? '') ? borrador.raza : undefined,
  );
  const [catalogo, setCatalogo] = useState<RazaCatalogo[] | null>(null);
  /** Qué chip está marcado con la pata. Vive aparte de `raza` porque «No sé»
   *  es una elección SIN texto: sin este estado, el chip quedaría tocable y
   *  sin marca. */
  const [elegido, setElegido] = useState<string | undefined>(undefined);

  const titulo = t(especieUi ? CLAVE_TITULO[especieUi] : 'alta.paso2Raza', { nombre });

  // El catálogo de SU especie (D-379). El acuario no lo pide: su campo dos es
  // una elección cerrada de dos, no una lista.
  useEffect(() => {
    if (acuario || borrador.especie === undefined) return;
    let vigente = true;
    void (async () => {
      const r = await obtenerRazasDeEspecie(borrador.especie as string);
      if (!vigente) return;
      // Un fallo NO se degrada a lista vacía (L-178): «no hay razas» y «no
      // pude preguntar» son dos cosas, y la segunda no puede disfrazarse de
      // la primera. Acá el fallo deja `catalogo` en null y la pantalla sigue
      // ofreciendo escribir — que es la respuesta que igual vale.
      if (r.ok) setCatalogo(r.data);
    })();
    return () => {
      vigente = false;
    };
  }, [acuario, borrador.especie]);

  /**
   * EL TIPEO **FILTRA** — enmienda del founder en el gate.
   *
   * Antes usaba `coincidenciasPrimero`, que sube lo que coincide y deja el
   * resto abajo. La letra de B lo defiende con un argumento bueno («esconder
   * lo que no matchea castiga al que se equivocó de palabra») y para el filtro
   * de la bitácora es cierto: ahí el corpus son 33 chips que el dueño ya vio.
   *
   * Acá son 44 razas: quien teclea «lab» no está afinando una lista que
   * conoce — está BUSCANDO. Con 44 items debajo, subir Labrador al primer
   * lugar y dejar 43 abajo se lee igual que no haber filtrado nada.
   *
   * Por eso `sugerir`, que devuelve SOLO las que coinciden. Y con el campo
   * vacío devuelve `[]` a propósito («una lista que aparece sola no es una
   * sugerencia, es ruido»), así que el catálogo entero se muestra mientras
   * nadie tecleó y se angosta al primer trazo.
   *
   * Las dos perillas siguen moviéndose juntas: `minimoDeLetras: 3` +
   * `modo: 'empieza'` (con 'contiene', «lab» matchearía cualquier nombre con
   * esas letras en el medio).
   */
  const sugerencias = useMemo(() => {
    const todas = catalogo ?? [];
    if (raza.trim().length === 0) return todas;
    const filtradas = sugerir(todas, {
      texto: raza,
      vozDe: (r) => r.nombre,
      minimoDeLetras: 3,
      modo: 'empieza',
      tope: todas.length,
    });
    // Menos de 3 letras no filtra (la perilla): `sugerir` devuelve vacío y
    // vaciar la pantalla por teclear una letra sería peor que no filtrar.
    return filtradas.length === 0 && raza.trim().length < 3 ? todas : filtradas;
  }, [catalogo, raza]);

  /**
   * LOS CHIPS — los dos de primera clase primero, y después el catálogo.
   *
   * Sus códigos llevan `__` para que no puedan colisionar con un slug real:
   * el catálogo los genera desde el nombre del archivo y ninguno empieza así.
   * Sin ese cuidado, una raza llamada «mestizo» —que es plausible— habría
   * secuestrado el chip de primera clase.
   */
  const chips = useMemo(() => {
    const generico = urlGenericaDeEspecie(borrador.especie);
    const primeraClase = [
      {
        codigo: CODIGO_MESTIZO,
        etiqueta: t('alta.razaMestizo'),
        avatar: { nombre: t('alta.razaMestizo'), fotoUrl: generico },
      },
      {
        codigo: CODIGO_NO_SE,
        etiqueta: t('alta.razaNoSe'),
        avatar: { nombre: t('alta.razaNoSe'), fotoUrl: generico },
      },
    ];
    // ⚠️ ENMIENDA DEL FOUNDER (gate): los dos de primera clase van SIEMPRE
    // VISIBLES pero **ABAJO** del listado filtrado. Estaban arriba por la
    // letra anterior de mesa. Y el cambio tiene sentido con el filtro puesto:
    // arriba de una lista que se angosta al teclear, «Mestizo» empuja hacia
    // abajo justo lo que la persona está buscando. Abajo siguen siendo
    // primera clase —no se filtran, no desaparecen nunca— sin competir con
    // el resultado.
    return [
      ...sugerencias.map((r) => ({
        codigo: r.slug,
        etiqueta: r.nombre,
        avatar: { nombre: r.nombre, fotoUrl: urlDeRutaGaleria(r.ruta_imagen) },
      })),
      ...primeraClase,
    ];
  }, [sugerencias, borrador.especie, t]);

  /** Tocar un chip. Elegir del catálogo PISA el texto con el nombre firmado,
   *  con su acento: quien tipeó «aleman» ve escrito «Pastor alemán» y no su
   *  propio typo. */
  const elegirChip = (codigo: string) => {
    setElegido(codigo);
    if (codigo === CODIGO_MESTIZO) {
      setRaza(t('alta.razaMestizoValor'));
      setSlug(undefined);
      return;
    }
    if (codigo === CODIGO_NO_SE) {
      setRaza('');
      setSlug(undefined);
      return;
    }
    const elegida = sugerencias.find((r) => r.slug === codigo);
    if (elegida === undefined) return;
    setSlug(codigo);
    setRaza(elegida.nombre);
  };

  /** Un solo lugar decide qué se guarda.
   *  `razaSlug` SOLO se pone si la persona ELIGIÓ del catálogo — escribir a
   *  mano no lo deriva, porque un slug adivinado del texto trae la cara de
   *  otra raza (ver `imagen-raza.ts`). */
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
              especie={especieUi}
              fotoUrl={caraDeMascota({ especie: borrador.especie, razaSlug: slug })}
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
              <Campo
                label={t('alta.razaLabel')}
                placeholder={t('alta.razaPlaceholder')}
                value={raza}
                onChangeText={(v) => {
                  setRaza(v);
                  // Tipear a mano DESHACE la elección: si el texto ya no es el
                  // de la sugerencia, su slug tampoco es suyo — y con él se
                  // iría la cara equivocada al paso 4. La pata se apaga con él:
                  // un chip marcado sobre un texto que ya no es el suyo miente.
                  setSlug(undefined);
                  setElegido(undefined);
                }}
                autoCapitalize="words"
              />

              {/* EL CHIP DE MASCOTA, CON LA RAZA ADENTRO (firma de mesa,
                  8-ago-2026). No nace un componente: es el chip de entidad que
                  ya existe —foto + nombre, magenta y pata al seleccionar— con
                  otro contenido. `SelectorOpcionItem.avatar.fotoUrl` YA admitía
                  fuente externa (medido antes de pedir nada), así que no hubo
                  ni que generalizar la prop.

                  «MESTIZO» Y «NO SÉ» VAN PRIMEROS Y SIEMPRE, sin tipear, con su
                  imagen genérica: son respuesta de PRIMERA CLASE y jamás
                  resultado de búsqueda. Por eso viven DENTRO de la misma lista
                  y no en una fila de botones aparte — un chip al lado de los
                  otros dice «esto también es una respuesta»; dos botones abajo
                  decían «esto es lo que te queda».

                  El flujo firmado: tipeo filtra → chip presenta → pata cierra. */}
              <SelectorOpcion
                acento="control"
                entidad
                // G4 (gate founder): el elegido se SELLA con la pata de la
                // casa. `MarcaEleccion` ya marcaba en FiltroPills,
                // FiltroMascotas y SelectorSegmentado — este es el quinto
                // control y la importa, no la reinventa.
                marcaPata
                etiqueta={t('alta.razaSugerencias')}
                opciones={chips}
                seleccionada={elegido}
                onSelect={elegirChip}
              />

              <Texto variante="apoyo">{t('alta.razaAyuda')}</Texto>

              <Boton
                etiqueta={t('alta.continuar')}
                bloque
                // «No sé» habilita el paso sin escribir nada: no saber ES una
                // respuesta. Sin esta segunda pata, el chip de primera clase
                // habría quedado tocable y mudo.
                deshabilitado={raza.trim().length === 0 && elegido !== CODIGO_NO_SE}
                onPress={() =>
                  elegido === CODIGO_NO_SE ? avanzarCon(undefined) : avanzarCon(raza.trim(), slug)
                }
              />
            </>
          )}
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
