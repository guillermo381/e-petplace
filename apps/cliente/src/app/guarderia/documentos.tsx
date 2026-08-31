/**
 * GUARDERÍA · **ACEPTAR LOS DOCUMENTOS** — el paso que le da a la familia
 * dónde resolver el rebote (S107-C).
 *
 * ═══ 🔴 LA REGLA DE PERÍMETRO QUE GOBIERNA ESTA PANTALLA ═══════════════════
 * **NI UNA PALABRA DE TEXTO LEGAL VIVE ACÁ — ni un placeholder.** Todo lo que
 * se lee sale de `obtenerDocumentosGuarderia()`: **el contenido versionado de
 * A**, tal cual está en la base.
 *
 * *Un texto legal escrito en una pantalla es un texto que nadie versiona, nadie
 * fecha y nadie puede probar que la familia aceptó.* Acá **se acepta una
 * VERSIÓN**, y por eso la versión viaja de vuelta al motor.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── ⚠️ UNO DE LOS SEIS DOCUMENTOS ES EL PROTOCOLO DE MORA — declarado ─────
 * El `CHECK` del motor incluye **`protocolo_no_retiro`**. Esta pantalla
 * **no lo trata distinto ni lo nombra**: lista lo que el server devuelve, con
 * el texto del server. *Construir un caso especial para él sería exactamente la
 * pantalla de mora que el perímetro prohíbe; esconderlo de la lista sería
 * pedirle a la familia que acepte algo que no le mostramos.*
 * 🔴 **Se declara para que la mesa decida** — no lo resuelvo por mi cuenta.
 *
 * ── 🔴 UNA CASILLA, NO OCHO — firma del founder (30-ago) ─────────────────
 * > *«Ningún servicio pide ocho aceptaciones para agendar.»*
 *
 * La pantalla pedía **seis casillas + el tope + el contacto** antes de dejar
 * agendar un día de guardería. **Hoy pide UNA**, con el enlace a leer los seis
 * textos completos.
 *
 * **Lo que NO cambió, y es lo que importa:** *el acto de aceptación sigue
 * siendo real* — una casilla que la familia marca, **jamás pre-marcada**, con
 * su texto accesible completo, y **las seis versiones viajan al motor** en ese
 * único acto. *Lo que se colapsó es la ceremonia, no la prueba* (P23).
 *
 * · **El contacto de emergencia es OPCIONAL** — medido: `p_contactos` acepta
 *   `NULL` y la aceptación queda `al_dia`.
 * · **El tope de gasto SE RETIRÓ** — firma: *«para eso está el contacto de
 *   emergencia y el seguro del prestador»*.
 *
 * ✅ **EL TOPE SALIÓ DEL FLUJO ENTERO** (A, 30-ago): dejó de ser un dato que
 * la familia teclea y pasó a ser **un TÉRMINO del documento — USD 150** que se
 * edita después desde la cuenta. *La pantalla no lo pide, no lo manda y no lo
 * sabe.* Con él murió el `null as unknown as number` que ayer era puente.
 *
 * ── POR QUÉ NO ES **SÓLO** UNA LISTA DE CASILLAS ─────────────────────────
 * ⏪ **Esto decía que el motor exige el tope Y los contactos.** Medido el
 * 30-ago: **los contactos aceptan `NULL`** y la aceptación queda `al_dia`.
 * *La mitad de la premisa era falsa, y por esa mitad el contacto era
 * obligatorio.* Lo que sí exige —y espera cura— es el tope.
 *
 * ── LO QUE FALLA CERRADO ─────────────────────────────────────────────────
 * · **La autorización de imagen nace APAGADA.** *Un default encendido
 *   publicaría la foto de un animal porque alguien no tocó un interruptor.*
 * · **`documentos_no_disponibles` NO deja continuar** y lo dice: no hay nada
 *   que aceptar, y el problema es NUESTRO.
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AceptacionDeDocumentos,
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  SeccionPlegable,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  aceptarDocumentosGuarderia,
  evaluarDocumentosGuarderia,
  getEstadoOnboardingDueno,
  obtenerDocumentosGuarderia,
  type DocumentoGuarderia,
  type EstadoDocumentos,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/**
 * La clave de la casilla OPCIONAL. Vive aparte de los códigos del server a
 * propósito: es la única que **no** es un documento — mezclarla con la
 * aceptación la volvería contable para el gate.
 */
/** La única casilla obligatoria: los términos del servicio, todos juntos. */
const CLAVE_TERMINOS = 'terminos_del_servicio';

type Carga =
  | { fase: 'cargando' }
  | { fase: 'noPudimos' }
  | { fase: 'listo'; familiaId: string; docs: DocumentoGuarderia[]; estado: EstadoDocumentos };

export default function DocumentosGuarderia() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' });
  /* 🔴 EL ACTO. Vacío al arrancar — «el arranque de una aceptación es vacío»
     (literal de la pieza). Sin esto se volvía a mandar las seis por default. */
  const [acepto, setAcepto] = useState(false);
  /** La Hoja con los seis textos completos. */
  const [leyendo, setLeyendo] = useState(false);
  const [contactoAbierto, setContactoAbierto] = useState(false);
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoTel, setContactoTel] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const e = await getEstadoOnboardingDueno();
      if (!vigente) return;
      if (!e.ok || e.data.familia_id === null) { setCarga({ fase: 'noPudimos' }); return; }
      const familiaId = e.data.familia_id;
      const [docs, ev] = await Promise.all([
        obtenerDocumentosGuarderia(),
        evaluarDocumentosGuarderia(familiaId),
      ]);
      if (!vigente) return;
      /* Un fallo JAMÁS se disfraza de «no hay documentos» (Ley 13): la familia
         leería que no tiene nada que aceptar y seguiría sin poder reservar. */
      if (!docs.ok || !ev.ok) { setCarga({ fase: 'noPudimos' }); return; }
      setCarga({ fase: 'listo', familiaId, docs: docs.data, estado: ev.data.estado });
    })();
    return () => { vigente = false; };
  }, [intento]);

  const aceptar = useCallback(async () => {
    if (carga.fase !== 'listo' || enviando) return;
    setEnviando(true);
    const r = await aceptarDocumentosGuarderia({
      /* ⭐ **UN SOLO ARGUMENTO.** A cerró el acto el 30-ago: la familia y nada
         más. Las seis versiones vigentes **las resuelve el motor** — *y es
         mejor así: la pantalla mandaba las que había leído, y entre leerlas y
         aceptar podía haber pasado una versión nueva.*

         ☠️ Con esto mueren de esta llamada: `aceptaciones` (las resuelve el
         server), `urgenciaTopeMonto`/`urgenciaTopeMoneda` —**el tope salió del
         flujo: es un TÉRMINO del documento (USD 150) y se edita después desde
         la cuenta**— y el `null as unknown as number` que quedó ayer como
         puente declarado. *El puente murió con su río* (`L-395`). */
      familiaId: carga.familiaId,
      /* Lo único que sigue viajando, porque sigue siendo una decisión de la
         familia en ESTA pantalla: el contacto (opcional) y la imagen. */
      ...(contactoNombre.trim().length > 0 || contactoTel.trim().length > 0
        ? { contactos: [{ nombre: contactoNombre.trim(), telefono: contactoTel.trim() }] }
        : {}),
      /* Sin superficie que lo encienda, **no se manda**: el motor es
         fail-closed y su default es no autorizar. *Mandar `false` explícito
         sería lo mismo; no mandarlo dice mejor que la pantalla no pregunta.* */
    });
    setEnviando(false);
    if (!r.ok) { mostrar({ texto: r.mensaje, variante: 'error' }); return; }
    /* 🔴 **SE LEE `alDia`, NO EL CONTADOR** — orden de A y tiene razón:
       `aceptadas` cuenta lo que se escribió AHORA, y una familia que ya tenía
       cinco de seis vuelve con `aceptadas: 1` estando perfectamente al día.
       *Un contador se lee como progreso y no lo es: el veredicto es `alDia`.* */
    if (!r.data.alDia) {
      mostrar({ texto: t('documentosGuarderia.noQuedoAlDia'), variante: 'error' });
      return;
    }
    mostrar({ texto: t('documentosGuarderia.aceptado'), variante: 'exito' });
    router.back();
  }, [carga, enviando, contactoNombre, contactoTel, mostrar, t]);

  /* 🔴 UNA SOLA CONDICIÓN: que la familia haya marcado. El contacto es
     opcional y el tope ya no se pide — *un CTA que espera datos que la
     pantalla dejó de pedir es una pared muda.* */
  const puedeAceptar =
    carga.fase === 'listo' && carga.estado !== 'documentos_no_disponibles' &&
    carga.docs.length > 0 && acepto;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" atras titulo={t('documentosGuarderia.titulo')} onAtras={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: insets.bottom + spacing[8] }}>
        {carga.fase === 'cargando' ? (
          <EsqueletoGrupo><Esqueleto alto={120} /><Esqueleto alto={120} /></EsqueletoGrupo>
        ) : carga.fase === 'noPudimos' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('documentosGuarderia.noCargoTitulo')}
            descripcion={t('documentosGuarderia.noCargoDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setIntento((n) => n + 1)} />}
          />
        ) : carga.estado === 'documentos_no_disponibles' || carga.docs.length === 0 ? (
          /* 🔴 EL PROBLEMA ES NUESTRO Y SE DICE ASÍ. **Sin «prueba de nuevo»**:
             no hay nada que la familia pueda reintentar. */
          <EstadoVacio
            registro="seccion"
            titulo={t('documentosGuarderia.sinDocsTitulo')}
            descripcion={t('documentosGuarderia.sinDocsDetalle')}
          />
        ) : (
          <>
            {/* ── LA ACEPTACIÓN · UNA CASILLA ────────────────────────────
                `AceptacionDeDocumentos` con **un solo obligatorio**. El enlace
                abre los seis textos completos **sin marcar la casilla** — es
                el responder más interno. *Si abrirlos marcara, la prueba diría
                que alguien aceptó cuando lo único que hizo fue leer.*

                ⚠️ El texto de la casilla es de la app; **el contenido legal
                sale del server**. El perímetro sigue entero. */}
            <Tarjeta>
              <View style={{ gap: spacing[3] }}>
                <AceptacionDeDocumentos
                  marcadas={acepto ? [CLAVE_TERMINOS] : []}
                  onCambiar={(_, m) => setAcepto(m)}
                  documentos={[{
                    clave: CLAVE_TERMINOS,
                    texto: t('documentosGuarderia.leiYAcepto'),
                    etiquetaEnlace: t('documentosGuarderia.terminosDelServicio'),
                    onAbrir: () => setLeyendo(true),
                  }]}
                  /* ☠️ **ACÁ VIVÍA UNA SEGUNDA CASILLA —la de publicar
                     fotos— Y SE RETIRA POR FIRMA:** *«la pantalla de términos
                     pide dos checks y debe ser uno solo»*.

                     Medido antes de tocar: **la segunda no era una segunda
                     aceptación** —era la autorización OPCIONAL de imagen, que
                     la pieza aloja aparte y rotula «Opcional»—. Aun así son
                     dos casillas en pantalla, y la firma cuenta casillas.

                     🔴 **Y su consecuencia se declara en vez de esconderse:
                     la autorización de imagen se queda SIN NINGUNA
                     SUPERFICIE.** `p_redes_autorizadas` es fail-closed, así
                     que nadie va a publicar una foto por accidente —pero
                     tampoco hay dónde permitirlo—. *No es uno de los seis
                     documentos: es una preferencia, y su casa natural es
                     Cuenta → Preferencias.* **No la construyo sin firma.** */
                />
              </View>
            </Tarjeta>

            {/* ── EL CONTACTO DE EMERGENCIA · **OPCIONAL, EN ACORDEÓN** ──
                Firma del founder: un acordeón «Agregar contacto de
                emergencia» antes de pagar. **Sigue sin gobernar el botón** —
                se puede aceptar y seguir sin llenarlo.

                🔴 `SeccionPlegable`, la pieza de la casa. *Iba a montar un
                plegable propio y el censo lo frenó: existe y la usa el taller
                del prestador.*

                ⚠️ **La firma dice «visible cuando NO hay ninguno cargado» y
                eso HOY NO SE PUEDE SABER:** los contactos viven en
                `guarderia_autorizaciones_familia.contactos` y **no hay
                lector** (el único que se llama «contacto» es
                `obtener_contacto_reserva_cita`, que es del prestador).
                ⇒ se muestra SIEMPRE, cerrado. *Un acordeón cerrado no estorba
                a quien ya tiene uno, y no invento un «no tiene» que no puedo
                medir.* Pedido a A. */}
            <SeccionPlegable
              titulo={t('documentosGuarderia.contactoTitulo')}
              abierta={contactoAbierto}
              onCambiar={setContactoAbierto}
            >
              <Texto variante="apoyo">{t('documentosGuarderia.contactoOpcional')}</Texto>
              <Campo label={t('documentosGuarderia.contactoNombre')} value={contactoNombre} onChangeText={setContactoNombre} />
              <Campo
                label={t('documentosGuarderia.contactoTelefono')}
                value={contactoTel}
                onChangeText={setContactoTel}
                keyboardType="phone-pad"
              />
            </SeccionPlegable>
          </>
        )}
      </ScrollView>

      {carga.fase === 'listo' && carga.estado !== 'documentos_no_disponibles' && carga.docs.length > 0 ? (
        <View style={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[4] }}>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('documentosGuarderia.aceptar')}
            deshabilitado={!puedeAceptar}
            /* El CTA apagado DICE qué falta, en vez de ser una pared muda. */
            razonDeshabilitado={t('documentosGuarderia.faltaAceptar')}
            cargando={enviando}
            onPress={() => void aceptar()}
          />
        </View>
      ) : null}

      {/* ── LOS SEIS TEXTOS, EN UNA SOLA HOJA ─────────────────────────────
             *«Con el enlace a leerlos completos»* — firma del founder. Van
             los seis, cada uno con su título y su versión: **lo que se acepta
             con una casilla tiene que poder leerse entero de una**.

             `altura="completa"` porque un documento legal no se lee en media
             pantalla — canon `parte/[eventoId]`. ── */}
      <Hoja
        visible={leyendo}
        onCerrar={() => setLeyendo(false)}
        titulo={t('documentosGuarderia.terminosDelServicio')}
        altura="completa"
        conCerrar
      >
        <HojaScroll contentContainerStyle={{ padding: spacing[5], gap: spacing[5] }}>
          {carga.fase !== 'listo' ? null : carga.docs.map((d) => (
            <View key={`${d.codigo}-${d.version}`} style={{ gap: spacing[2] }}>
              <Texto variante="seccion">
                {t(`documentosGuarderia.doc_${d.codigo}` as 'documentosGuarderia.doc_contrato_custodia')}
              </Texto>
              <Texto variante="cuerpo">{d.contenido}</Texto>
              <Texto variante="dato" color="secondary">
                {t('documentosGuarderia.version', { n: d.version })}
              </Texto>
              <Separador />
            </View>
          ))}
        </HojaScroll>
      </Hoja>
    </SafeAreaView>
  );
}
