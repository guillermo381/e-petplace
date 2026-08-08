/**
 * S91-D · PASO 1/4 — «¿Quién se suma a tu casa?»
 *
 * ── EL ORDEN SE INVIRTIÓ, y es la decisión de la lámina ─────────────────────
 * Hasta S90 se preguntaba el NOMBRE primero. Ahora va la ESPECIE, y el porqué
 * está firmado: **la especie cambia el vocabulario y las opciones de todo lo
 * que sigue.** Preguntar el nombre antes obliga a la pantalla siguiente a
 * cambiarle el título a algo que la persona ya contestó.
 *
 * Y con la cláusula del pez (firma de mesa, 7-ago) el orden dejó de ser
 * preferencia: elegir «pez» cambia QUÉ NOMBRE se pide. Preguntar el nombre
 * primero sería preguntarlo sin saber de quién.
 */

import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EvitaTeclado,
  SelectorOpcion,
  Texto,
  spacing,
  useTheme,
  type SelectorEspecieOpcion,
} from '@epetplace/ui';
import {
  obtenerEspeciesActivas,
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
} from '@epetplace/api';

import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';
import { urlGenericaDeEspecie } from './imagen-raza';
import { esAcuario, type BorradorAlta, type ModoAlta } from './tipos';

export function PasoEspecie({
  modo,
  borrador,
  onAvanzar,
  onAtras,
  onReintentar,
}: {
  modo: ModoAlta;
  borrador: BorradorAlta;
  onAvanzar: (parcial: BorradorAlta) => void;
  onAtras: () => void;
  onReintentar: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [nombre, setNombre] = useState(borrador.nombre ?? '');
  const [especie, setEspecie] = useState<string | undefined>(borrador.especie);
  const [opciones, setOpciones] = useState<SelectorEspecieOpcion[] | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState<string | undefined>(undefined);
  /** Las especies que ya viven en la casa, de la más frecuente a la menos. */
  const [frecuentes, setFrecuentes] = useState<string[]>([]);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerEspeciesActivas();
      if (!vigente) return;
      if (!r.ok) {
        setErrorCatalogo(r.mensaje);
        return;
      }
      const validas: SelectorEspecieOpcion[] = [];
      for (const e of r.data) {
        if (!esEspecieUi(e.codigo)) continue;
        // (4) FIRMA FOUNDER: la tile de `pez` dice «Acuario».
        // La voz se cambia ACÁ y no en `cat_especies.nombre` a propósito: esa
        // columna la leen otras superficies (Explorar, los filtros de oficio,
        // la ficha) donde «pez» sigue siendo la especie correcta. Lo que la
        // cláusula firmó es que EN EL ALTA el sujeto es el acuario — y una
        // voz de contexto se resuelve en su contexto, no renombrando el dato.
        validas.push({
          codigo: e.codigo,
          nombre: esAcuario(e.codigo) ? t('alta.especieAcuario') : e.nombre,
        });
      }
      setOpciones(validas);
    })();
    return () => {
      vigente = false;
    };
  }, [t]);

  /**
   * LA SEGUNDA MASCOTA OFRECE PRIMERO LA ESPECIE MÁS FRECUENTE DEL HOGAR
   * (lámina: «Es UX, no herencia»).
   *
   * ── POR QUÉ ESTO NO BLOQUEA NADA, y es a propósito ─────────────────────────
   * Son DOS viajes para ORDENAR una grilla de seis. D-497 🟠 (el piso de
   * performance) está vivo y no se paga un spinner por un adorno: la grilla se
   * pinta YA en el orden del catálogo y se re-ordena sola si el dato llega.
   *
   * Y el silencio acá SÍ es legítimo, que es lo que L-178 vigila: si esto
   * falla, el usuario ve la grilla en orden de catálogo — **un orden válido,
   * no un dato ausente disfrazado.** No hay nada que decirle porque no perdió
   * nada. (El caso contrario —fallar y mostrar la grilla VACÍA— sería el que
   * la ley prohíbe, y por eso el catálogo de arriba sí habla cuando cae.)
   */
  useEffect(() => {
    if (modo !== 'adicional') return;
    let vigente = true;
    void (async () => {
      // `getEstadoOnboardingDueno` CACHEA por user (packages/api/src/wrappers/
      // onboarding.ts:241): en el modo `adicional` la app ya lo llamó al
      // arrancar, así que el viaje real suele ser UNO solo, no dos.
      const estado = await getEstadoOnboardingDueno();
      if (!vigente || !estado.ok || estado.data.familia_id === null) return;
      const mascotas = await obtenerMascotasDeFamilia(estado.data.familia_id);
      if (!vigente || !mascotas.ok) return;
      const cuenta = new Map<string, number>();
      for (const m of mascotas.data) cuenta.set(m.especie, (cuenta.get(m.especie) ?? 0) + 1);
      setFrecuentes([...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([cod]) => cod));
    })();
    return () => {
      vigente = false;
    };
  }, [modo]);

  const ordenadas = useMemo(() => {
    if (opciones === null || frecuentes.length === 0) return opciones;
    const peso = (c: string) => {
      const i = frecuentes.indexOf(c);
      return i === -1 ? frecuentes.length : i;
    };
    return [...opciones].sort((a, b) => peso(a.codigo) - peso(b.codigo));
  }, [opciones, frecuentes]);

  const acuario = esAcuario(especie);
  const puedeContinuar = nombre.trim().length > 0 && especie !== undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {modo === 'primera' ? (
        <Encabezado variante="portada" saludo={t('alta.paso1Titulo')} isotipo="ninguno" />
      ) : (
        <Encabezado variante="navegacion" titulo={t('alta.paso1Titulo')} atras onAtras={onAtras} />
      )}
      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[6],
            gap: spacing[4],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {opciones === null && errorCatalogo === undefined ? (
            // Ley 13: esqueleto ESTÁTICO imitando el grid 3×2 del selector
            <EsqueletoGrupo etiqueta={t('alta.cargandoEspecies')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
                {Array.from({ length: 6 }, (_, i) => (
                  <View key={i} style={{ flexBasis: '30%', flexGrow: 1 }}>
                    <Esqueleto forma="bloque" alto={120} />
                  </View>
                ))}
              </View>
            </EsqueletoGrupo>
          ) : null}

          {/* MISMA GRAMÁTICA EN LOS DOS PASOS (firma de mesa, 8-ago): el chip
              de entidad —cara + nombre, magenta y pata al elegir— es el mismo
              en el paso 1 y en el paso 2. Antes acá vivía `SelectorEspecie`,
              y salir de él cura DE UNA las dos observaciones del gate:

              (2) cada tile muestra la imagen de su especie — el genérico de la
                  galería, que es exactamente la cara que después acompaña a la
                  raza y termina en el lugar de la foto. Un elemento, tres
                  trabajos.
              (3) MUERE EL FONDO VERDE, y su origen quedó medido:
                  `SelectorEspecie.tsx:87-88` pinta `theme.capaBg.identidad`
                  —verdeVital al 15%, `rgba(43,232,107,0.15)` leído del DOM—
                  como `rellenoCatalogo` en las tiles NO seleccionadas. No era
                  un accidente: era la ley 19.8 del relleno. Pero con la cara
                  adentro el tinte pelea con la foto, y la foto gana.

              ⚠️ `SelectorEspecie` NO se toca ni se retira: sigue vivo en las
              dos pantallas del mostrador del prestador (`nueva.tsx`,
              `autorizar.tsx`), que el gate no miró. Si el verde molesta
              también ahí, es cura de B en su archivo — declarado, no supuesto. */}
          {ordenadas !== null ? (
            <SelectorOpcion
              acento="control"
              entidad
              etiqueta={t('alta.especieEtiqueta')}
              opciones={ordenadas.map((o) => ({
                codigo: o.codigo,
                etiqueta: o.nombre,
                avatar: { nombre: o.nombre, fotoUrl: urlGenericaDeEspecie(o.codigo) },
              }))}
              seleccionada={especie}
              onSelect={setEspecie}
            />
          ) : null}

          {errorCatalogo !== undefined ? (
            <Boton variante="secundario" etiqueta={t('alta.reintentar')} onPress={onReintentar} />
          ) : null}

          {/* LA CLÁUSULA DEL PEZ (firma de mesa, 7-ago-2026 · opción A): con
              «pez» elegido, el sujeto es EL ACUARIO. El nombre que se pide es
              el del acuario, no el de un individuo — y se dice por qué, en una
              línea, porque pedir «el nombre del acuario» sin explicarlo se lee
              como un error de la app.
              ⚠️ VOZ = PROPUESTA AL GATE, no letra firmada (orden de mesa). */}
          <Campo
            label={acuario ? t('alta.nombreAcuarioLabel') : t('alta.nombreLabel')}
            placeholder={acuario ? t('alta.nombreAcuarioPlaceholder') : t('alta.nombrePlaceholder')}
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />
          {acuario ? (
            <Texto variante="apoyo">{t('alta.acuarioPorQue')}</Texto>
          ) : null}

          {/* S82 (vara ALTA: presentar, no formulario): el CTA cobra vida —
              con quién y cómo se llama, el acto deja de ser "continuar" y
              pasa a ser la PRESENTACIÓN. Deshabilitado conserva el verbo
              neutro (nada que presentar todavía). */}
          <Boton
            etiqueta={
              puedeContinuar
                ? acuario
                  ? t('alta.registrarAcuario')
                  : t('alta.presentar', { nombre: nombre.trim() })
                : t('alta.continuar')
            }
            bloque
            deshabilitado={!puedeContinuar}
            onPress={() => {
              if (!puedeContinuar || especie === undefined) return;
              onAvanzar({ nombre: nombre.trim(), especie });
            }}
          />
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
