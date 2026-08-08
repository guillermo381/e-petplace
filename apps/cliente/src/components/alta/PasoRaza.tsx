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
 * ── LO QUE HAY Y LO QUE FALTA, sin disimulo ─────────────────────────────────
 * **Las sugerencias YA VIVEN**: el catálogo de A (`obtenerRazasDeEspecie`,
 * D-379, 105 filas sembradas) se lee y se pinta con SU IMAGEN, que es el
 * círculo del que habla la lámina.
 *
 * **Lo que falta es FILTRAR MIENTRAS SE TIPEA.** El matching vive en
 * `packages/ui/src/components/sugerencias.ts` (B) y **medido en esta sesión NO
 * está en `origin/main`** — existe en `origin/pista/s91-b`, sin mergear
 * (`git ls-tree -r origin/main | grep sugerenc` → vacío; mi HEAD contiene
 * `origin/main` entero, verificado por `merge-base --is-ancestor`).
 *
 * Hasta que entre, la lista se muestra COMPLETA. **No se escribió un
 * normalizador local**: es exactamente el clon que §6 prohíbe, y el mismo
 * matching ya vive probado en `bitacora.tsx`. El día que B llegue, el cambio
 * es envolver `razas` en su filtro — una línea, en el `useMemo` marcado.
 *
 * Y la regla firmada rige igual en los dos estados: **el catálogo SUGIERE, el
 * dueño CONFIRMA.** Escribir algo que la lista no tiene sigue siendo una
 * respuesta válida y se guarda tal cual.
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
  spacing,
  useTheme,
} from '@epetplace/ui';
import { obtenerRazasDeEspecie, type RazaCatalogo } from '@epetplace/api';

import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';
import { caraDelAlta, urlDeRutaGaleria } from './imagen-raza';
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

  const [raza, setRaza] = useState(borrador.raza ?? '');
  const [slug, setSlug] = useState<string | undefined>(borrador.razaSlug);
  const [agua, setAgua] = useState<string | undefined>(
    (TIPOS_DE_AGUA as readonly string[]).includes(borrador.raza ?? '') ? borrador.raza : undefined,
  );
  const [catalogo, setCatalogo] = useState<RazaCatalogo[] | null>(null);

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

  /** ⬅ EL PUNTO EXACTO DONDE ENTRA EL FILTRO DE B.
   *  Hoy la lista se muestra ENTERA. Cuando `sugerencias.ts` esté en `main`,
   *  esto pasa a ser `filtrarSugerencias(catalogo, raza, …)` y nada más de
   *  este archivo cambia. */
  const sugerencias = useMemo(() => catalogo ?? [], [catalogo]);

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
              de acá — `caraDelAlta` ya resuelve los dos casos. */}
          <View style={{ alignItems: 'center', paddingTop: spacing[2] }}>
            <AvatarMascota
              nombre={nombre}
              especie={especieUi}
              fotoUrl={caraDelAlta({ especie: borrador.especie, razaSlug: slug })}
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
                  // iría la cara equivocada al paso 4.
                  setSlug(undefined);
                }}
                autoCapitalize="words"
              />

              {/* LAS SUGERENCIAS, CON SU CARA — selección única (lámina: «cada
                  sugerencia lleva SU IMAGEN en círculo de 32»; acá va `xs`=28,
                  que es la talla de la casa más cercana: un 32 crudo violaría
                  la Ley 1. Los 4px al gate).
                  Elegir PISA el texto con el nombre del catálogo, con su
                  acento — quien tipeó «aleman» ve escrito «Pastor alemán» y no
                  su propio typo. */}
              {sugerencias.length > 0 ? (
                <SelectorOpcion
                  acento="control"
                  etiqueta={t('alta.razaSugerencias')}
                  disposicion="columnas"
                  opciones={sugerencias.map((r) => ({
                    codigo: r.slug,
                    etiqueta: r.nombre,
                    adorno: (
                      <AvatarMascota
                        nombre={r.nombre}
                        especie={especieUi}
                        fotoUrl={urlDeRutaGaleria(r.ruta_imagen)}
                        tamano="xs"
                      />
                    ),
                  }))}
                  seleccionada={slug}
                  onSelect={(codigo) => {
                    const elegida = sugerencias.find((r) => r.slug === codigo);
                    if (elegida === undefined) return;
                    setSlug(codigo);
                    setRaza(elegida.nombre);
                  }}
                />
              ) : null}

              {/* «MESTIZO» Y «NO SÉ» SON BOTONES A LA VISTA (lámina, literal):
                  jamás la última fila de una lista. D-379 los declara respuesta
                  legítima de PRIMERA CLASE, y esconderlos los vuelve premio
                  consuelo — que es el punto entero.

                  Lo que escribe cada uno, declarado: «Mestizo» ES una respuesta
                  y se guarda. «No sé» NO inventa un valor de raza — avanza sin
                  dato. No saber no es un dato; que la pantalla lo trate como
                  una salida de un toque es lo que lo vuelve primera clase. */}
              <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                <View style={{ flex: 1 }}>
                  <Boton
                    variante="secundario"
                    bloque
                    etiqueta={t('alta.razaMestizo')}
                    onPress={() => avanzarCon(t('alta.razaMestizoValor'))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Boton
                    variante="secundario"
                    bloque
                    etiqueta={t('alta.razaNoSe')}
                    onPress={() => avanzarCon(undefined)}
                  />
                </View>
              </View>

              <Texto variante="apoyo">{t('alta.razaAyuda')}</Texto>

              <Boton
                etiqueta={t('alta.continuar')}
                bloque
                deshabilitado={raza.trim().length === 0}
                onPress={() => avanzarCon(raza.trim(), slug)}
              />
            </>
          )}
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
