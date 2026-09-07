/**
 * ⭐ **COMPORTAMIENTO Y RASGOS SON CHIPS, NO UNA CAJA** (S113-C · 2.2.1 · ④).
 *
 * Firma del founder: *«Comportamiento no es una caja: son los chips»*. Y la
 * razón se ve pidiendo: **una caja libre delante de alguien que no sabe qué
 * contar produce una caja vacía.** Los chips no piden que la familia redacte —
 * le muestran de qué se puede hablar, y ahí recién aparece lo que quiere contar.
 *
 * ── DE DÓNDE SALEN, Y POR QUÉ NO HAY LISTA ACÁ ────────────────────────────
 * De `cat_rasgos` (A, `20260910040000`), **medido contra la base viva**: cuatro
 * familias × 6 = **24 rasgos**. *Una copia local de ese vocabulario sería una
 * quinta verdad* — y esta casa ya pagó tres copias divergentes de una lista de
 * voseo esta misma sesión.
 *
 * 🔴 **El texto ACOMPAÑA a los chips, no los reemplaza.** Se pueden mandar los
 * dos juntos (`registrarRasgos` acepta `codigos` y `texto`): los chips dicen
 * *qué*, el texto dice *cómo* — «le tiene miedo a los truenos» **y** «se mete
 * abajo de la cama y no sale hasta la mañana». Lo segundo no cabe en un chip y
 * es lo que un veterinario necesita leer.
 *
 * ⚠️ Reusa `SelectorOpcion` con `multiple`, que **ya existía** con esa prop
 * (L-175: se ensancha lo que hay, no se clona). Cero componente nuevo.
 */
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Boton, Campo, Hoja, SelectorOpcion, Texto, spacing, useAviso } from '@epetplace/ui';
import { obtenerCatalogoRasgos, registrarRasgos, type FamiliaRasgo } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Rasgo = { codigo: string; familia: FamiliaRasgo; etiqueta: string };

/** El orden de las cuatro familias en pantalla. **Es una decisión, no el orden
 *  de la tabla**: se arranca por lo que más se cuenta —los miedos— y se
 *  termina por lo que exige haber visto a la mascota con alguien. */
const FAMILIAS: readonly FamiliaRasgo[] = ['miedos', 'manias', 'con_animales', 'con_ninos'];

export function useChipsRasgos(mascotaId: string, nombre: string, alGuardar: () => void) {
  const { t } = useTraduccion();
  const aviso = useAviso();
  const [visible, setVisible] = useState(false);
  const [catalogo, setCatalogo] = useState<Rasgo[] | null>(null);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);

  /* El catálogo se pide **al abrir**, no al montar la pantalla: es una Hoja que
     la mayoría de las visitas no abre, y pedirlo siempre son 24 filas de red
     por cada perfil que alguien mira. */
  useEffect(() => {
    if (!visible || catalogo !== null) return;
    let vivo = true;
    void obtenerCatalogoRasgos().then((r) => {
      if (vivo && r.ok) setCatalogo(r.data);
    });
    return () => {
      vivo = false;
    };
  }, [visible, catalogo]);

  const cerrar = useCallback(() => {
    setVisible(false);
    setElegidos([]);
    setTexto('');
  }, []);

  const guardar = useCallback(() => {
    if (guardando) return;
    /* 🔴 **Nada elegido y nada escrito ⇒ no se llama a la puerta.** Un guard
       que deja pasar el vacío escribe una fila sin contenido en la vida de la
       mascota, y esa fila después hay que explicarla. */
    if (elegidos.length === 0 && texto.trim() === '') {
      aviso.mostrar({ variante: 'neutro', texto: t('rasgos.elegiAlgo') });
      return;
    }
    setGuardando(true);
    void registrarRasgos({ mascotaId, codigos: elegidos, texto: texto.trim() })
      .then((r) => {
        setGuardando(false);
        if (!r.ok) {
          aviso.mostrar({ variante: 'error', texto: r.mensaje });
          return;
        }
        /* Dice DÓNDE quedó, como el «contanos»: es la respuesta a «¿y esto
           adónde fue?». */
        aviso.mostrar({ variante: 'exito', texto: t('bio.anotado', { nombre }) });
        cerrar();
        alGuardar();
      })
      .catch(() => {
        setGuardando(false);
        aviso.mostrar({ variante: 'error', texto: t('bio.noSePudo') });
      });
  }, [guardando, elegidos, texto, mascotaId, nombre, aviso, t, cerrar, alGuardar]);

  const alternar = useCallback((codigo: string) => {
    setElegidos((prev) => (prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]));
  }, []);

  const hoja = (
    <Hoja visible={visible} onCerrar={cerrar} titulo={t('rasgos.titulo', { nombre })}>
      <View style={{ gap: spacing[5] }}>
        {catalogo === null ? (
          <Texto variante="apoyo">{t('rasgos.cargando')}</Texto>
        ) : (
          FAMILIAS.map((f) => {
            const dela = catalogo.filter((r) => r.familia === f);
            /* Una familia sin rasgos **no dibuja su título vacío**: el catálogo
               puede filtrar por especie y dejar alguna sin nada. */
            if (dela.length === 0) return null;
            return (
              <SelectorOpcion
                key={f}
                etiqueta={t(`rasgos.familia_${f}` as 'rasgos.familia_miedos')}
                etiquetaVisible
                disposicion="fila"
                multiple
                seleccionadas={elegidos}
                opciones={dela.map((r) => ({ codigo: r.codigo, etiqueta: r.etiqueta }))}
                onSelect={alternar}
              />
            );
          })
        )}
        {/* 🔴 **El texto va DEBAJO de los chips y con su propia voz.** No es
            «otro»: es el detalle de lo que los chips ya nombraron. */}
        <Campo
          label={t('rasgos.contaMas')}
          placeholder={t('rasgos.contaMasEjemplo')}
          value={texto}
          onChangeText={setTexto}
          multilinea={3}
        />
        <Boton etiqueta={t('rasgos.guardar')} onPress={guardar} cargando={guardando} bloque />
      </View>
    </Hoja>
  );

  return { abrir: () => setVisible(true), cerrar, hoja, visible };
}
