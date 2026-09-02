/**
 * LOS TÉRMINOS DEL REFUGIO — la pantalla de lectura del portal (§4.2, ítem 12).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **VOZ DEL FOUNDER, literal:** *«Mismo login de siempre. La primera vez, mis
 * términos (los del refugio) con "Acepto" apagado hasta ver todo. Después, tres
 * tabs.»* Y del ítem 11, que rige igual acá: *«**No es un modal, no es un
 * popup: es una pantalla con su título.**»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔴 **ESTA NO ES LA GEMELA DE `legales/[codigo]` DEL CLIENTE, Y LA DIFERENCIA
 * ES DÓNDE ESTÁ LO COMPARTIDO.** Lo que las dos comparten —el texto entero, el
 * scroll, y sobre todo la cuenta de «vio todo» con su caso que rompe— vive en
 * **una sola pieza de B** (`DocumentoLegalLectura`), no en dos copias. *Lo que
 * queda acá es lo único que de verdad difiere: qué documento acepta esta app y
 * a dónde vuelve al aceptar.*
 *
 * ⚠️ **Y el corte no es un detalle de prolijidad.** Cuando esta pantalla se
 * escribió a mano en el cliente, su mecánica tenía adentro el defecto que la
 * rompe entera: **un documento corto que entra sin scroll nunca dispara
 * `onScroll`, y el botón queda apagado para siempre**. Con dos copias, curar
 * una deja la otra rota — y nada la señala. `terminos_refugio` tiene 12 324
 * caracteres, así que **acá el defecto no se vería**: es exactamente la mitad
 * que se quedaría con el bug seis meses.
 *
 * ── LO QUE ESTA APP ACEPTA, Y NADA MÁS ──────────────────────────────────
 * Sólo `terminos_refugio`. **Las condiciones del adoptante NO se aceptan desde
 * el portal**: son de la familia, y ofrecerlas acá sería dejar que un refugio
 * firme un documento que no le corresponde. Un código fuera de la lista **no es
 * «error»: es que alguien llegó con un código que esta pantalla no acepta**, y
 * decirlo distinto importa porque reintentar no lo va a arreglar.
 *
 * ── LO QUE LA APP NO APORTA (idéntico al cliente, y por las mismas razones) ─
 * · **La VERSIÓN no viaja al aceptar**: la resuelve el servidor de la fila
 *   vigente. *Si la pantalla la eligiera, el día que se publique la v2 seguiría
 *   aceptando la v1 y todo compilaría* (`L-166`).
 * · **El `sha256` tampoco**: lo lee el servidor del documento. *Si lo aportara
 *   el cliente, la evidencia diría lo que el cliente quiso decir.*
 * · **La IP no se manda**: la app no la conoce, y hashear algo que no conozco
 *   sería inventar evidencia. La pone el servidor del header, o queda NULL.
 */

import { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  DocumentoLegalLectura,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { aceptarDocumentoAdopcion, obtenerDocumentoVigente, type DocumentoVigente } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** El único documento que el portal acepta. Ver la cabecera. */
const ACEPTABLES = ['terminos_refugio'] as const;
type CodigoAceptable = (typeof ACEPTABLES)[number];

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'codigoInvalido' }
  | { fase: 'listo'; doc: DocumentoVigente };

export default function LecturaDeDocumentoDelPortal() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const aviso = useAviso();
  const params = useLocalSearchParams<{ codigo?: string }>();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [vioTodo, setVioTodo] = useState(false);
  const [aceptando, setAceptando] = useState(false);

  const codigo = ACEPTABLES.includes(params.codigo as CodigoAceptable)
    ? (params.codigo as CodigoAceptable)
    : null;

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      if (codigo === null) {
        setEstado({ fase: 'codigoInvalido' });
        return;
      }
      setEstado({ fase: 'cargando' });
      void (async () => {
        const r = await obtenerDocumentoVigente(codigo);
        if (!vigente) return;
        /* Ley 13: un fallo JAMÁS se disfraza de «no hay documento». *Un texto
           legal que no aparece porque falló la red, mostrado como si no
           existiera, deja a alguien aceptando la nada.* */
        setEstado(r.ok ? { fase: 'listo', doc: r.data } : { fase: 'error' });
      })();
      return () => {
        vigente = false;
      };
    }, [codigo]),
  );

  async function aceptar() {
    if (estado.fase !== 'listo' || codigo === null || aceptando || !vioTodo) return;
    setAceptando(true);
    const r = await aceptarDocumentoAdopcion({
      codigo,
      /* `dispositivo` sí es dato DE LA APP y por eso lo aporta la app. */
      dispositivo: `${Platform.OS} ${String(Platform.Version)}`,
    });
    setAceptando(false);
    if (!r.ok) {
      aviso.mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    /* `yaEstaba` no cambia el destino ni se celebra distinto: *aceptar algo que
       ya estaba aceptado no es un error ni un logro — es seguir.*
       Y se vuelve al portal con `replace`: **la pantalla de términos no es un
       lugar al que se vuelve**, y dejarla en la pila pondría el «Acepto» a un
       gesto de atrás de distancia de alguien que ya aceptó. */
    router.replace('/adopcion');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      {/* «Una pantalla con su título» — el founder lo dijo por oposición al
          modal, así que el título va en el Encabezado y no adentro del scroll.
          🔴 **SIN flecha de atrás**: los términos son la puerta del portal, y
          una salida los volvería opcionales (Ley 23). Quien no acepta, no
          entra; el camino para irse es cerrar la app, no esquivar la puerta. */}
      <Encabezado variante="navegacion" titulo={t('legalesPortal.titulo')} />

      {estado.fase === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={18} />
            <Esqueleto alto={18} />
            <Esqueleto alto={200} />
          </EsqueletoGrupo>
        </View>
      ) : estado.fase === 'codigoInvalido' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('legalesPortal.codigoInvalidoTitulo')}
            descripcion={t('legalesPortal.codigoInvalidoDetalle')}
          />
        </View>
      ) : estado.fase === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('legalesPortal.errorTitulo')}
            descripcion={t('legalesPortal.errorDetalle')}
            accion={
              <Boton
                etiqueta={t('legalesPortal.reintentar')}
                onPress={() => setEstado({ fase: 'cargando' })}
              />
            }
          />
        </View>
      ) : (
        <DocumentoLegalLectura
          texto={estado.doc.contenido}
          onVioTodo={() => setVioTodo(true)}
          /* 🔴 EL PIE VA COMO CONTROL SUELTO, JAMÁS envuelto en un `View` propio:
             es la trampa documentada de `PantallaConPie` — un `View` intermedio
             captura el gesto en todo su rectángulo y reabre la zona muerta. */
          pie={
            <Boton
              variante="primario"
              bloque
              etiqueta={t('legalesPortal.aceptar')}
              deshabilitado={!vioTodo}
              /* La razón se DIBUJA (D-999): sin ella el botón sería una pared
                 muda justo donde la persona no sabe qué le falta. */
              razonDeshabilitado={t('legalesPortal.razonFaltaLeer')}
              cargando={aceptando}
              onPress={() => void aceptar()}
            />
          }
        />
      )}
    </View>
  );
}
