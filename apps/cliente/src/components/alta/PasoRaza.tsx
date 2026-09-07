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
  FichaRaza,
  SelectorOpcion,
  spacing,
  useTheme,
  SugerenciaRaza,
  leerBase64,
  Texto,
} from '@epetplace/ui';

import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';
import { caraDeMascota } from '@/lib/cara-mascota';
import { CODIGO_NO_SE, SelectorDeRaza, type RazaElegida } from '@/components/selector-de-raza';
import { obtenerRazasDeEspecie, sugerirRaza, type SugerenciaDeRaza,
  obtenerContenidoDeRaza,
  type ContenidoDeRaza,
} from '@epetplace/api';
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

  /* ⭐ **LA SUGERENCIA DE RAZA** (S113-C · 1.2 · C9). La foto ya pasó (el paso
     se corrió antes que éste), así que acá hay algo que mirar.
     🔴 **Nada se guarda solo**: `elegida` arranca en `null` y la raza del
     borrador no se toca hasta que un humano tope un chip. *Una IA que escribe
     el dato y después te lo muestra no está sugiriendo: está decidiendo y
     avisando.* */
  const [sugerencia, setSugerencia] = useState<SugerenciaDeRaza | 'cargando' | 'error' | null>(null);
  const [nombresRaza, setNombresRaza] = useState<Record<string, string>>({});
  const [elegidaIA, setElegidaIA] = useState<string | null>(null);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  /** ⭐ **EL MOMENTO DE LA RAZA** (S113-C · 1.2.1 · ①). `null` = no hay nada
   *  que contar: la ficha no está publicada, o la raza no casó. **Y ahí no se
   *  muestra nada** — *inventar dos líneas sobre una raza que no documentamos
   *  es exactamente lo que la ficha existe para no hacer.* */
  const [fichaRaza, setFichaRaza] = useState<ContenidoDeRaza | null>(null);
  /* 🔴 **EL DISPARO CUELGA DE LA RAZA ELEGIDA, NO DEL CHIP DE LA SUGERENCIA.**
     Primero lo colgué del `onElegir` de `SugerenciaRaza` y **no apareció nunca**:
     medido en web, el toque real había sido en el SELECTOR —la sugerencia no
     acertó la raza— y ese camino no pasaba por ahí. *Un disparo atado a una de
     las dos puertas se ve funcionar en la que uno probó.*
     Se pide con el NOMBRE, no con el slug: el servidor resuelve nombre,
     sinónimo y caída a la especie (`resolver_ficha_de_raza`) — un viaje, una
     verdad. */
  useEffect(() => {
    const nom = eleccion.raza;
    if (nom === undefined || nom === null || nom.trim() === '') {
      setFichaRaza(null);
      return;
    }
    let vivo = true;
    void obtenerContenidoDeRaza(borrador.especie ?? '', nom).then((r) => {
      if (vivo && r.ok) setFichaRaza(r.data);
    });
    return () => {
      vivo = false;
    };
  }, [eleccion.raza, borrador.especie]);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      if (borrador.fotoUri === undefined || especieUi === undefined || acuario) return;
      setSugerencia('cargando');
      const b64 = await leerBase64(borrador.fotoUri).catch(() => null);
      if (b64 === null) {
        if (vivo) setSugerencia('error');
        return;
      }
      const [r, cat] = await Promise.all([
        sugerirRaza({ imageBase64: b64, especie: borrador.especie ?? '' }),
        obtenerRazasDeEspecie(borrador.especie ?? ''),
      ]);
      if (!vivo) return;
      /* El catálogo da el NOMBRE del slug. Sin él la pregunta diría el código
         («¿Es un jack-rusell?»), que es la voz de la base y no la de la casa. */
      if (cat.ok) setNombresRaza(Object.fromEntries(cat.data.map((x) => [x.slug, x.nombre])));
      setSugerencia(r.ok ? r.data : 'error');
    })();
    return () => {
      vivo = false;
    };
  }, [borrador.fotoUri, borrador.especie, especieUi, acuario]);

  const VOZ_CONFIANZA = {
    alta: 'muyProbable',
    media: 'probable',
    baja: 'puedeSer',
  } as const;

  const datos = typeof sugerencia === 'object' && sugerencia !== null ? sugerencia : null;
  /* Sin animal, o sin candidatas, o si tocó «mestizo/otra»: el selector de
     siempre. **La sugerencia no reemplaza al selector, lo adelanta.** */
  const mostrarSelector =
    acuario || datos === null || datos.sin_animal || datos.candidatas.length === 0 || selectorAbierto;

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
              {/* ⭐ **LA SUGERENCIA, ARRIBA DEL SELECTOR** — lo adelanta, no lo
                  reemplaza. Con `sin_animal` o sin candidatas no se dibuja y
                  queda el camino de siempre. */}
              {datos !== null && !datos.sin_animal && datos.candidatas.length > 0 ? (
                <SugerenciaRaza
                  candidatas={datos.candidatas.slice(0, 3).map((c) => ({
                    id: c.raza_codigo,
                    pregunta: t('alta.sugEsUn', { raza: nombresRaza[c.raza_codigo] ?? c.raza_codigo }),
                    confianza: VOZ_CONFIANZA[c.confianza],
                    vozConfianza: t(`alta.sugConf_${VOZ_CONFIANZA[c.confianza]}` as 'alta.sugConf_probable'),
                  }))}
                  vioAnimal
                  vozSinAnimal={t('alta.sugSinAnimal')}
                  vozMestizo={t('alta.razaMestizoValor')}
                  vozOtra={t('alta.sugOtra')}
                  elegida={elegidaIA}
                  onElegir={(id) => {
                    setElegidaIA(id);
                    /* 🔴 Mestizo y «otra» NO escriben una raza: abren el
                       selector. *Un chip que dice «otra» y guarda algo es el
                       chip que menos se puede desandar.* */
                    if (id === 'mestizo' || id === 'otra') {
                      setSelectorAbierto(true);
                      return;
                    }
                    /* El toque del humano ES la escritura. */
                    setEleccion({ raza: nombresRaza[id] ?? id, slug: id, elegido: id });
                  }}
                />
              ) : null}

              {datos !== null && datos.sin_animal ? (
                <Texto variante="apoyo">{t('alta.sugSinAnimal')}</Texto>
              ) : null}

              {/* ⭐ **CONOCE AL {raza}** — la misma `FichaRaza` del perfil, no
                  una copia. Su modo cerrado **ya es** «dos líneas y ver más»
                  (L-175: se reusa, jamás se clona), y así lo que la familia lee
                  acá es literalmente lo que va a volver a encontrar en la
                  ficha. */}
              {fichaRaza !== null ? (
                <View style={{ gap: spacing[2] }}>
                  {/* La raza SIEMPRE está acá —el bloque cuelga de que la ficha
                      haya llegado, y la ficha se pide con el nombre elegido—
                      pero el tipo la deja opcional. Se cierra en el guard, no
                      con un `?? ''` que dibujaría «Conoce al ». */}
                  {eleccion.raza !== undefined && eleccion.raza !== '' ? (
                    <Texto variante="enfasis">{t('alta.conoceAl', { raza: eleccion.raza })}</Texto>
                  ) : null}
                  <FichaRaza
                    nombre={eleccion.raza ?? ''}
                    revisado
                    historia={fichaRaza.origen ?? ''}
                    caracteristicas={[
                      { etiqueta: t('perfil.razaTemperamento'), valor: fichaRaza.temperamento ?? undefined },
                      { etiqueta: t('perfil.razaTalla'), valor: fichaRaza.talla_adulta ?? undefined },
                      { etiqueta: t('perfil.razaVida'), valor: fichaRaza.esperanza_vida ?? undefined },
                    ]}
                    /* En el alta **no se marca etapa actual**: la fecha de
                       nacimiento se pregunta DESPUÉS, así que acá no sabemos en
                       cuál está. *Marcar una sería afirmar una edad que la
                       familia todavía no dijo.* */
                    cuidados={[
                      { id: 'cachorro', etapa: t('perfil.razaCachorro'), texto: fichaRaza.cuidados_por_etapa.cachorro ?? '', actual: false },
                      { id: 'adulto', etapa: t('perfil.razaAdulto'), texto: fichaRaza.cuidados_por_etapa.adulto ?? '', actual: false },
                      { id: 'senior', etapa: t('perfil.razaSenior'), texto: fichaRaza.cuidados_por_etapa.senior ?? '', actual: false },
                    ].filter((c) => c.texto.length > 0)}
                    vozRevision={t('perfil.razaRevision')}
                    vozAbrir={t('perfil.razaVer')}
                    vozCerrar={t('perfil.razaOcultar')}
                  />
                </View>
              ) : null}

              {mostrarSelector || elegidaIA === null ? (
                <SelectorDeRaza
                  especie={borrador.especie ?? ''}
                  valor={eleccion}
                  onCambio={setEleccion}
                />
              ) : null}

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
