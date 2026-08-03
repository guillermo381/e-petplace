/**
 * EL ESCRIBA — la IA que ayuda a escribir tu historia (S84-C15).
 *
 * LA CONDUCTA ES DE `MODELO_PRESENCIA` §5 y NO se inventa acá:
 * · MEJORA lo que ya está escrito, nunca escribe desde cero.
 * · Campo vacío ⇒ no ofrece mejorar: PREGUNTA.
 * · LA PROPUESTA NO PISA NADA. Se muestra AL LADO de lo suyo y él acepta
 *   o descarta. **Nada se publica solo** — es el muro, no una preferencia.
 *
 * ⚠️ LO QUE LA MEDICIÓN DEL CONTRATO AGREGÓ, y cambia la superficie:
 * el motor EXIGE `respuestas` SIEMPRE — su guard rebota
 * `faltan_respuestas` con la lista vacía, tenga o no `borradorPrevio`.
 * O sea que **"mejorar" también pide material humano**, y eso no es una
 * traba: es §5 al pie — *la IA no inventa un tono de prestador, se lo
 * pregunta*. Lo que cambia entre los dos casos es el ENCUADRE (mejorar
 * lo tuyo vs. escribir la primera versión), no si hay preguntas.
 *
 * ⚠️ EL REBOTE NO SE REIMPLEMENTA (aviso de A, y es la razón por la que
 * esta pieza no valida nada): el chequeo del wrapper existe solo para
 * ahorrar el viaje; **el guard vive en la function** y sigue ahí aunque
 * esa línea se borre. Esta superficie REACCIONA al código — si validara
 * por su cuenta, el día que el muro cambie tendríamos dos reglas y una
 * de ellas desactualizada en silencio.
 *
 * ⚠️ HUECO DECLARADO — EL BORRADOR NACE BILINGÜE Y LA COLUMNA ES UNA:
 * `BorradorPresencia` trae `{es, en}` (§5 + SOFTLAUNCH), pero
 * `prestadores.descripcion` es una sola columna. Hoy se aplica el `es` y
 * **el `en` se descarta**. No lo guardo en ningún lado inventado: un
 * segundo idioma sin columna sería dato sin casa.
 * ☠️ MUERTE: cuando exista `descripcion_en` (o su equivalente), esta
 * pieza ya lo tiene en la mano — es pasarlo, no re-generarlo.
 */

import { useState } from 'react';
import { View } from 'react-native';
import { Boton, Campo, CeldaNavegacion, Hoja, Texto, spacing } from '@epetplace/ui';
import { escribirPresencia, type HechoPresencia } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export function EscribaHistoria({
  historiaActual,
  hechos,
  onAceptar,
}: {
  /** Lo que el prestador tiene escrito HOY. Vacío ⇒ el encuadre cambia. */
  historiaActual: string;
  /** Lo que el sistema YA sabe, etiquetado: `verificado` se CITA, no se
   *  parafrasea (§5). Lo arma la pantalla, que es la que tiene el dato. */
  hechos: HechoPresencia[];
  /** El prestador ACEPTA: recién ahí el texto entra a su campo — y aun
   *  así queda como borrador suyo hasta que toque Guardar. Dos puertas
   *  antes de que nada sea público. */
  onAceptar: (texto: string) => void;
}) {
  const { t } = useTraduccion();

  const [abierta, setAbierta] = useState(false);
  const [porQue, setPorQue] = useState('');
  const [queSepan, setQueSepan] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [pensando, setPensando] = useState(false);
  const [propuesta, setPropuesta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 1-based, y el tope vive en el MOTOR: mandarlo mal no lo levanta. */
  const [intento, setIntento] = useState(1);

  const tieneHistoria = historiaActual.trim().length > 0;

  function cerrar() {
    setAbierta(false);
    setPropuesta(null);
    setError(null);
  }

  /**
   * @param modo S84-C20 — 'alternativa' es lo que hace que "Probar otra"
   * cumpla lo que promete. Sin él el motor MEJORA el borrador anterior, y
   * tocar el botón dos veces daba evoluciones del mismo texto en vez de
   * caminos distintos: el botón decía "otra" y entregaba "la misma, un
   * poco mejor".
   * El default del motor sigue siendo 'mejorar', así que la llamada normal
   * —la primera, la que compone— NO pasa nada y no cambió.
   */
  async function escribir(modo?: 'alternativa') {
    setPensando(true);
    setError(null);
    const r = await escribirPresencia({
      hechos,
      respuestas: [porQue, queSepan, experiencia],
      modo,
      /* ③ EL PREVIO ES LA ÚLTIMA PROPUESTA SI YA HAY UNA — y este era un
         BUG que la medición destapó: al tocar "probá otra" se mandaba la
         historia VIEJA, así que el escriba re-mejoraba el punto de
         partida en vez del borrador recién hecho. El founder habría
         visto variaciones del mismo original en vez de una evolución. */
      borradorPrevio: propuesta ?? (tieneHistoria ? historiaActual : undefined),
      intento,
    });
    setPensando(false);
    if (!r.ok) {
      /* LAS DOS CON VOZ PROPIA, y las otras cuatro comparten la de fallo
         — no porque den lo mismo, sino porque para QUIEN MIRA la salida
         es la misma: probar de nuevo. Distinguirlas en pantalla sería
         pedirle al prestador que entienda nuestra plomería. */
      setError(r.mensaje);
      return;
    }
    setPropuesta(r.data.es);
    setIntento((n) => n + 1);
  }

  return (
    <>
      {/* EL BOTÓN — junto a la historia, que es lo que ayuda a escribir.
          Glifo `ia` en registro TINTA (es la CHISPA de Kaxo desde S53,
          con su excepción de relleno firmada; NO nace glifo nuevo — B lo
          renombró de `coach`).
          ⚠️ VA COMO `CeldaNavegacion` Y NO COMO `Boton`, y es una
          medición: **`Boton` no tiene prop `icono`**. Antes que componer
          a mano una fila con glifo —que es exactamente la anatomía
          inventada que ya me costó una corrección con el subrayado del
          logo— se usa la pieza de la casa que SÍ lleva glifo, y su
          semántica encaja: esto ABRE una superficie (19.1).
          ☠️ CANDIDATA PARA B, sin apuro y sin consumidor todavía: si
          algún día un `Boton` necesita glifo, es una prop en la pieza —
          jamás una fila compuesta en cada pantalla. */}
      {/* ② S84-C25 — EL OCRE, con UNA palabra. B lo firmó (`e33e6ad`) y
          el glifo seguía en `tinta`: ese registro pinta con el color que
          le pasan, así que **la capa no se leía nunca**. Con `aa` toma
          los dos registros medidos —ochreDark 5.72 en claro, ochre 9.73
          en oscuro— y el color pasa a resolverse por TEMA en vez de por
          esta línea.
          EL DESTELLO SE VISTE DEL COMERCIO, ni marca ni control (firma
          del founder). El oro se cayó midiendo: 1.59 sobre papel verde.
          ⚠️ LOS DOS DEL HOGAR DEL CLIENTE NO SE TOCAN: uno vive SOBRE EL
          GRADIENTE, y ahí la tinta no es un override — es la respuesta
          correcta, porque sobre una superficie de marca el color
          funcional no tiene contraste que ganar. */}
      <CeldaNavegacion
        icono="ia"
        registro="aa"
        titulo={tieneHistoria ? t('perfilNegocio.iaMejorar') : t('perfilNegocio.iaEscribir')}
        onPress={() => setAbierta(true)}
      />

      <Hoja visible={abierta} onCerrar={cerrar} titulo={t('perfilNegocio.iaHojaTitulo')} altura="media">
        <View style={{ gap: spacing[4], paddingBottom: spacing[4] }}>
          {propuesta === null ? (
            <>
              {/* LAS DOS PREGUNTAS SON DE LA LETRA (§5), en tuteo. No se
                  reescriben "para que suenen mejor": son el material
                  humano que hace que el texto sea SUYO y no del modelo. */}
              <Texto variante="apoyo">
                {tieneHistoria ? t('perfilNegocio.iaIntroMejorar') : t('perfilNegocio.iaIntroEscribir')}
              </Texto>
              <Campo
                label={t('perfilNegocio.iaPorQue')}
                value={porQue}
                onChangeText={setPorQue}
                multilinea={3}
              />
              <Campo
                label={t('perfilNegocio.iaQueSepan')}
                value={queSepan}
                onChangeText={setQueSepan}
                multilinea={3}
              />
              {/* ① S84-C16 — LA TERCERA, del gate del founder. Las otras
                  dos preguntan por el PORQUÉ y por el LUGAR; ésta trae lo
                  único que ninguna de las dos alcanza: el oficio de quien
                  lo hace. Sin ella el borrador puede hablar bien de un
                  lugar sin decir nunca por qué confiarle una mascota. */}
              <Campo
                label={t('perfilNegocio.iaExperiencia')}
                value={experiencia}
                onChangeText={setExperiencia}
                multilinea={3}
              />
              {error !== null && <Texto variante="apoyo" color="danger">{error}</Texto>}
              <Boton
                etiqueta={t('perfilNegocio.iaComponer')}
                bloque
                cargando={pensando}
                onPress={() => void escribir()}
              />
            </>
          ) : (
            <>
              {/* LA PROPUESTA, AL LADO DE LO SUYO — no encima. Con historia
                  previa se muestran las DOS para que la comparación sea a
                  ojo y no de memoria; sin historia previa no hay con qué
                  comparar y la propuesta va sola. */}
              {tieneHistoria && (
                <View style={{ gap: spacing[1] }}>
                  <Texto variante="dato">{t('perfilNegocio.iaLoTuyo')}</Texto>
                  <Texto variante="cuerpo" color="secondary">{historiaActual}</Texto>
                </View>
              )}
              {/* ② S84-C16 — LA PROPUESTA SE LEE COMO FRASE, no como
                  párrafo. El motor lo acorta (A); la superficie lo
                  ACOMPAÑA: `voz` es el registro de lo humano en tamaño
                  grande —DM Sans light— y a esa escala una frase se lee
                  como una declaración, mientras un párrafo se rompe.
                  **Y ése es el punto de la variante, no un adorno:** si
                  el texto vuelve largo, la propia composición lo va a
                  hacer evidente en vez de disimularlo. Un `cuerpo` chico
                  aguanta cualquier largo — y por eso escondía el
                  defecto que el founder terminó cazando en pantalla. */}
              <View style={{ gap: spacing[1] }}>
                <Texto variante="dato">{t('perfilNegocio.iaPropuesta')}</Texto>
                <Texto variante="voz">{propuesta}</Texto>
              </View>
              {error !== null && <Texto variante="apoyo" color="danger">{error}</Texto>}
              <Boton
                etiqueta={t('perfilNegocio.iaUsar')}
                bloque
                onPress={() => {
                  onAceptar(propuesta);
                  cerrar();
                }}
              />
              <Boton
                variante="secundario"
                etiqueta={t('perfilNegocio.iaOtra')}
                bloque
                cargando={pensando}
                onPress={() => void escribir('alternativa')}
              />
              {/* DESCARTAR es un camino de primera clase y por eso está
                  escrito: sin él, cerrar la Hoja sería la única salida y
                  se leería como que aceptar es lo esperado. */}
              <Boton variante="ghost" etiqueta={t('perfilNegocio.iaDescartar')} bloque onPress={cerrar} />
            </>
          )}
        </View>
      </Hoja>
    </>
  );
}
