/**
 * CÓMO SE PORTÓ — los chips del día (S111-C, ③).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO: *«Al final del día marco cómo se portó cada uno: durmió
 * tranquilo, comió normal, se escondió. **Toco chips, no escribo un informe.**»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS:** *contar cómo le fue cuesta cuatro toques, no un formulario.*
 *
 * **CHANEL:** sin contador de chips marcados. *«3 de 25» convierte una
 * observación en una meta, y la bitácora no es una lista para completar.*
 *
 * ── 🔴 SÓLO CONDUCTAS, Y ES LA TRAMPA QUE A NOMBRÓ ──────────────────────
 * `obtenerVocabularioBitacora` devuelve **conductas Y objetivos** —es el
 * vocabulario compartido con adiestramiento— y el escritor de guardería
 * **rechaza los objetivos** (`chip_invalido`). *Pintar todo haría que el
 * cuidador toque un objetivo y reciba un rebote que no puede entender: el chip
 * se veía igual que los demás.*
 *
 * ── EL RECORTE POR ESPECIE ES DEL SERVIDOR ──────────────────────────────
 * Se piden con `especie` y `sujeto`: *un gato jamás ve «Ladró»*. Y no es una
 * nota — A lo probó en rojo: `vomito` rebotó sobre un ave. **La pantalla no
 * filtra nada; pide bien.**
 *
 * ── LA IDEMPOTENCIA CAMBIA CÓMO SE MANDA ────────────────────────────────
 * Es por `(estadía, conducta)`, y **una estadía ES un día**. Por eso se manda
 * **el set completo cada vez** y no hace falta llevar cuenta de qué ya viajó:
 * el duplicado es **inexpresable**, no comparado. *Recordar qué mandé sería una
 * segunda verdad sobre algo que el servidor ya sabe.*
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Campo,
  Hoja,
  HojaScroll,
  SelectorOpcion,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import {
  obtenerVocabularioBitacora,
  registrarBitacoraGuarderia,
  type ChipVocabulario,
  type EstadiaDelDia,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export interface HojaChipsGuarderiaProps {
  /** `null` = la hoja no se monta. */
  estadia: EstadiaDelDia | null;
  onCerrar: () => void;
  /** Sólo tras un registro exitoso: quien la monta re-lee. */
  onRegistrada: () => void;
}

export function HojaChipsGuarderia({ estadia, onCerrar, onRegistrada }: HojaChipsGuarderiaProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [vocabulario, setVocabulario] = useState<ChipVocabulario[] | null>(null);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (estadia === null) return;
    let vivo = true;
    setVocabulario(null);
    void (async () => {
      const r = await obtenerVocabularioBitacora({
        especie: estadia.mascotaEspecie,
        /* La casa modela acuarios como sujeto propio; en guardería siempre es
           un individuo, y se dice en vez de omitirse: *omitir un filtro no es
           «todas» — es «no filtres», que trae de más.* */
        sujeto: 'individuo',
      });
      if (!vivo) return;
      if (!r.ok) {
        setVocabulario([]);
        return;
      }
      /* 🔴 SÓLO CONDUCTAS. Ver el encabezado: el escritor rechaza objetivos. */
      setVocabulario(r.data.filter((c) => c.tipo === 'conducta'));
    })();
    return () => {
      vivo = false;
    };
  }, [estadia]);

  if (estadia === null) return null;

  const registrar = async () => {
    if (enviando || (elegidas.length === 0 && texto.trim().length === 0)) return;
    setEnviando(true);
    try {
      const r = await registrarBitacoraGuarderia({
        estadiaId: estadia.estadiaId,
        /* El set COMPLETO, siempre. Ver el encabezado. */
        conductas: elegidas,
        texto: texto.trim().length > 0 ? texto.trim() : undefined,
      });
      if (!r.ok) {
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      /* 🔴 SE DICE LA VERDAD DE LO QUE PASÓ, y el motor la da separada:
         `chipsNuevos: 0` sobre un segundo toque **no es un error ni un
         guardado**. *Decir «guardado» ahí enseñaría que el botón siempre
         funciona, y el día que de verdad no guarde nadie lo va a notar.* */
      mostrar({
        variante: 'exito',
        texto:
          r.data.chipsNuevos === 0
            ? t('chipsGuarderia.sinCambios')
            : t('chipsGuarderia.guardado', { n: r.data.chipsNuevos }),
      });
      onRegistrada();
    } finally {
      setEnviando(false);
    }
  };

  const listo = elegidas.length > 0 || texto.trim().length > 0;

  return (
    <Hoja
      visible
      titulo={t('chipsGuarderia.titulo', { nombre: estadia.mascotaNombre })}
      onCerrar={onCerrar}
    >
      <HojaScroll contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[4] }}>
        {vocabulario === null ? (
          <Texto variante="apoyo" color="tertiary">
            {t('chipsGuarderia.cargando')}
          </Texto>
        ) : vocabulario.length === 0 ? (
          /* Ley 13: el fallo del lector y «esta especie no tiene conductas» se
             ven igual desde acá, así que la voz no afirma cuál fue — dice que
             no hay chips para mostrar y deja el texto libre, que sigue
             sirviendo. */
          <Texto variante="apoyo" color="tertiary">
            {t('chipsGuarderia.sinChips')}
          </Texto>
        ) : (
          <SelectorOpcion
            acento="oficio"
            disposicion="columnas"
            multiple
            etiqueta={t('chipsGuarderia.comoSePorto')}
            opciones={vocabulario.map((c) => ({
              codigo: c.codigo,
              /* La voz de FAMILIA, que es la que el catálogo trae para mostrar
                 — el `codigo` es del motor y no sale a pantalla. */
              etiqueta: c.nombre_familia,
            }))}
            seleccionadas={elegidas}
            onSelect={(codigo) =>
              setElegidas((prev) =>
                prev.includes(codigo) ? prev.filter((x) => x !== codigo) : [...prev, codigo],
              )
            }
          />
        )}

        {/* El texto SE AGREGA, no pisa lo anterior (contrato de A). Por eso el
            campo arranca vacío en cada apertura: lo que ya se escribió está
            guardado, y mostrarlo acá invitaría a editarlo — que es lo que este
            motor no hace. */}
        <Campo
          label={t('chipsGuarderia.algoMas')}
          value={texto}
          onChangeText={setTexto}
          multilinea={2}
        />
      </HojaScroll>

      <View style={{ gap: spacing[2], paddingTop: spacing[3] }}>
        {!listo ? (
          <Texto variante="apoyo" color="tertiary">
            {t('chipsGuarderia.faltaAlgo')}
          </Texto>
        ) : null}
        <Boton
          variante="primario"
          etiqueta={t('chipsGuarderia.registrar')}
          deshabilitado={!listo}
          cargando={enviando}
          onPress={() => void registrar()}
        />
      </View>
    </Hoja>
  );
}
