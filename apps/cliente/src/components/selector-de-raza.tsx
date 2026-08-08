/**
 * S91-D · P3 — EL SELECTOR DE RAZA, UNA VEZ PARA LAS DOS CASAS.
 *
 * Lo montan el paso 2 del ALTA y la Hoja de edición del PERFIL. La lámina
 * pide para el perfil «la gramática del alta» y §6 dice cómo se cumple eso:
 * **compartiendo la pieza, no copiándola.** Un segundo selector con las
 * mismas reglas —el filtro de tres letras, los dos de primera clase al pie,
 * la pata sobre el elegido— es la clase de duplicado que se separa el día que
 * alguien afina una y no la otra, y las dos siguen compilando.
 *
 * Es CONTROLADO: el estado vive en quien lo monta, porque el alta lo lleva a
 * los params del borrador y el perfil lo lleva a una RPC. La pieza no sabe —
 * ni tiene por qué— qué se hace después con lo elegido.
 */

import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Campo, ChipEntidad, Texto, spacing, sugerir } from '@epetplace/ui';
import { obtenerRazasDeEspecie, type RazaCatalogo } from '@epetplace/api';

import { urlDeRutaGaleria, urlGenericaDeEspecie } from '@/lib/cara-mascota';
import { useTraduccion } from '@/i18n';

/** Los dos de primera clase. El `__` los aísla del espacio de slugs del
 *  catálogo: una raza llamada «mestizo» —que es plausible— habría secuestrado
 *  el chip. */
export const CODIGO_MESTIZO = '__mestizo';
export const CODIGO_NO_SE = '__no_se';

export interface RazaElegida {
  /** El TEXTO que se guarda. `undefined` = «no sé»: no saber no es un dato. */
  raza: string | undefined;
  /** Solo si eligió del catálogo — resuelve su cara. Escribir a mano NO lo
   *  deriva: un slug adivinado del texto trae la cara de otra raza. */
  slug: string | undefined;
  /** Qué chip lleva la pata. `undefined` = escribió libre. */
  elegido: string | undefined;
}

export function SelectorDeRaza({
  especie,
  valor,
  onCambio,
}: {
  especie: string;
  valor: RazaElegida;
  onCambio: (v: RazaElegida) => void;
}) {
  const { t } = useTraduccion();
  const [catalogo, setCatalogo] = useState<RazaCatalogo[] | null>(null);

  useEffect(() => {
    let vigente = true;
    void obtenerRazasDeEspecie(especie).then((r) => {
      // Un fallo NO se degrada a lista vacía (L-178): «no hay razas» y «no
      // pude preguntar» son dos cosas. Acá el fallo deja el campo de texto,
      // que es la respuesta que igual vale.
      if (vigente && r.ok) setCatalogo(r.data);
    });
    return () => {
      vigente = false;
    };
  }, [especie]);

  /**
   * EL TIPEO **FILTRA** (enmienda del founder en el gate). Con 44 razas, subir
   * la que coincide al primer lugar y dejar 43 abajo se lee igual que no haber
   * filtrado. Las dos perillas de B se mueven juntas: `minimoDeLetras: 3` +
   * `modo: 'empieza'` — con `'contiene'`, «lab» matchearía cualquier nombre
   * que lleve esas letras en el medio.
   */
  const sugerencias = useMemo(() => {
    const todas = catalogo ?? [];
    const texto = valor.raza ?? '';
    if (texto.trim().length === 0) return todas;
    const filtradas = sugerir(todas, {
      texto,
      vozDe: (r) => r.nombre,
      minimoDeLetras: 3,
      modo: 'empieza',
      tope: todas.length,
    });
    // Con menos de tres letras la perilla no filtra y `sugerir` devuelve
    // vacío: vaciar la pantalla por teclear una letra sería peor que no
    // filtrar.
    return filtradas.length === 0 && texto.trim().length < 3 ? todas : filtradas;
  }, [catalogo, valor.raza]);

  const chips = useMemo(() => {
    const generico = urlGenericaDeEspecie(especie);
    return [
      ...sugerencias.map((r) => ({
        codigo: r.slug,
        etiqueta: r.nombre,
        avatar: { nombre: r.nombre, fotoUrl: urlDeRutaGaleria(r.ruta_imagen) },
      })),
      // ⚠️ AL PIE, por enmienda del founder: arriba de una lista que se
      // angosta al teclear empujaban hacia abajo justo lo que se busca.
      // Abajo siguen siendo primera clase — no se filtran, no desaparecen.
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
  }, [sugerencias, especie, t]);

  return (
    <View style={{ gap: spacing[4] }}>
      <Campo
        label={t('alta.razaLabel')}
        placeholder={t('alta.razaPlaceholder')}
        value={valor.raza ?? ''}
        onChangeText={(v) =>
          // Tipear a mano DESHACE la elección: si el texto ya no es el de la
          // sugerencia, su slug tampoco es suyo, y la pata sobre un chip cuyo
          // texto cambió miente.
          onCambio({ raza: v.length > 0 ? v : undefined, slug: undefined, elegido: undefined })
        }
        autoCapitalize="words"
      />

      {/**
       * A2 · LA GRILLA LA ARMA ESTA CASA, EL CHIP LO PONE `packages/ui`.
       *
       * Es la letra de B al extraer `ChipEntidad`: **sube el chip, no el
       * contenedor.** `FiltroMascotas` es una hilera horizontal y esto es una
       * grilla de dos columnas; subir la hilera me habría obligado a
       * envolverla o clonarla, que es justo lo que la pieza única viene a
       * matar. Cada casa dispone sus chips; la unidad es la frontera.
       *
       * **El ancho lo pone el contenedor, y por eso está acá**: `flexBasis`
       * de media columna es lo que le da a `numberOfLines={2}` una línea que
       * llenar. Sin columna, el chip se estira al largo de su texto y la
       * segunda línea no existe — «Guacamayo Azul y Amarillo» (25 caracteres)
       * seguiría ilegible aunque la pieza permita envolver. **Esa es la mitad
       * de D-691 que me tocaba a mí.**
       *
       * `sujeto="cosa"` (firma de mesa): una raza no es una mascota. Cuando
       * el catálogo no trae cara, el fallback es su INICIAL — una huella
       * sobre «Mestizo» diría que ese chip ES un animal, y es una categoría.
       */}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('alta.razaSugerencias')}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}
      >
        {chips.map((c) => (
          <View key={c.codigo} style={{ flexBasis: '47%', flexGrow: 1 }}>
            <ChipEntidad
              nombre={c.etiqueta}
              {...(c.avatar.fotoUrl !== undefined ? { fotoUrl: c.avatar.fotoUrl } : null)}
              sujeto="cosa"
              tamano="general"
              elegido={valor.elegido === c.codigo}
              onPress={() => {
                if (c.codigo === CODIGO_MESTIZO) {
                  onCambio({ raza: t('alta.razaMestizoValor'), slug: undefined, elegido: c.codigo });
                  return;
                }
                if (c.codigo === CODIGO_NO_SE) {
                  onCambio({ raza: undefined, slug: undefined, elegido: c.codigo });
                  return;
                }
                const elegida = sugerencias.find((r) => r.slug === c.codigo);
                if (elegida === undefined) return;
                // Elegir PISA el texto con el nombre firmado, con su acento:
                // quien tipeó «aleman» ve escrito «Pastor alemán», no su typo.
                onCambio({ raza: elegida.nombre, slug: c.codigo, elegido: c.codigo });
              }}
            />
          </View>
        ))}
      </View>

      <Texto variante="apoyo">{t('alta.razaAyuda')}</Texto>
    </View>
  );
}
