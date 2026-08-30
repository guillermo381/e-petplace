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
 * ── 🔴 POR QUÉ ESTA PANTALLA SE REHIZO SOBRE `AceptacionDeDocumentos` ────
 * La primera versión **volcaba el texto legal entero de los seis documentos**
 * en tarjetas y mandaba `aceptaciones: docs.map(...)` al tocar el botón — o
 * sea **las seis, hiciera lo que hiciera la familia**. *No había casilla, no
 * había acto, y sin acto no hay prueba* (P23). **Era peor que una casilla
 * pre-marcada**, que es justo el patrón que la cabecera de la pieza prohíbe.
 *
 * Ahora la pieza de la casa pone las seis casillas, **cada documento se abre
 * sin marcarse** (el enlace es el responder más interno) y el botón sólo se
 * enciende **con las seis marcadas**. *El texto completo vive en una `Hoja`,
 * como el original clínico de `parte/[eventoId]`: un muro de seis textos
 * legales arriba del botón no es leerlos, es enterrarlos.*
 *
 * ⚠️ **La autorización de imagen bajó a `opcionales`** — el lugar que la pieza
 * tiene hecho para ella, separada y **jamás pre-marcada**. Antes era un
 * `Interruptor` suelto entre obligatorios.
 *
 * ── POR QUÉ NO ES **SÓLO** UNA LISTA DE CASILLAS ─────────────────────────
 * El motor exige **el tope de urgencia y los contactos SIN default**: *no se
 * puede aceptar los documentos sin declarar hasta cuánto se autoriza gastar en
 * una urgencia y a quién llamar.* **El consentimiento y esos dos datos son un
 * solo acto** — separarlos dejaría familias aceptadas y sin contacto.
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
 * propósito: es la única que **no** es un documento, y mezclarla en `marcadas`
 * la volvería contable para el gate.
 */
const CLAVE_REDES = 'redes_autorizadas';

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
  const [marcadas, setMarcadas] = useState<string[]>([]);
  /** El documento cuyo texto completo está abierto en la Hoja. */
  const [abierto, setAbierto] = useState<DocumentoGuarderia | null>(null);
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoTel, setContactoTel] = useState('');
  const [tope, setTope] = useState('');
  const [redes, setRedes] = useState(false);
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
      familiaId: carga.familiaId,
      /* 🔴 SE ACEPTA LA VERSIÓN QUE SE LEYÓ, no «el documento»: si el texto
         cambió mientras la pantalla estaba abierta, el motor lo va a saber.

         ⏪ **Y SÓLO LO QUE LA FAMILIA MARCÓ.** Antes acá iba `carga.docs`
         entero — las seis viajaban hiciera lo que hiciera. *El botón ya no se
         enciende sin las seis, así que el filtro no cambia lo que llega al
         motor; cambia que lo que llega sea consecuencia de un acto.* */
      aceptaciones: carga.docs
        .filter((d) => marcadas.includes(d.codigo))
        .map((d) => ({ codigo: d.codigo, version: d.version })),
      urgenciaTopeMonto: Number(tope),
      /* ⚠️ USD viene del país del prestador, y esta pantalla todavía no lo
         tiene. **Se declara**: hoy el único país operativo es EC/USD. El día
         que haya dos, este literal es una mentira y hay que traer la moneda
         del lugar — no del teléfono. */
      urgenciaTopeMoneda: 'USD',
      /* La forma de `contactos` la decide esta pantalla: **el motor la recibe
         como `jsonb` sin validar** (medido). Se declara acá para que el día que
         alguien la cambie sepa que no hay nada que lo frene. */
      contactos: [{ nombre: contactoNombre.trim(), telefono: contactoTel.trim() }],
      redesAutorizadas: redes,
    });
    setEnviando(false);
    if (!r.ok) { mostrar({ texto: r.mensaje, variante: 'error' }); return; }
    mostrar({ texto: t('documentosGuarderia.aceptado'), variante: 'exito' });
    router.back();
  }, [carga, enviando, tope, contactoNombre, contactoTel, redes, marcadas, mostrar, t]);

  const montoValido = Number(tope) > 0;
  const contactoValido = contactoNombre.trim().length > 0 && contactoTel.trim().length > 0;
  /* 🔴 LAS SEIS, SIN EXCEPCIÓN. La pieza reporta el estado de cada casilla y
     **no valida** (literal de su cabecera) — el gate es de la pantalla. Y el
     motor lo confirma del otro lado: `evaluar_documentos_guarderia` devuelve
     `faltan` con que falte una. */
  const todosMarcados =
    carga.fase === 'listo' && carga.docs.every((d) => marcadas.includes(d.codigo));
  const puedeAceptar =
    carga.fase === 'listo' && carga.estado !== 'documentos_no_disponibles' &&
    carga.docs.length > 0 && todosMarcados && montoValido && contactoValido;

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
            {/* ── LOS DOCUMENTOS · **LA PIEZA DE LA CASA** ──────────────────
                `AceptacionDeDocumentos` (S107-B). El texto de cada uno vive
                detrás de su enlace, en una `Hoja` — canon de `parte`.

                🔴 **El enlace abre SIN marcar**: es un responder aparte
                adentro del label, así que ir a leer no firma nada. *Si abrirlo
                marcara, la prueba diría que alguien aceptó cuando lo único que
                hizo fue leer.*

                ⚠️ **El nombre del documento sale del riel; su CONTENIDO sale
                del server.** El perímetro sigue entero: acá no vive una
                palabra de texto legal. */}
            <Tarjeta>
              <View style={{ gap: spacing[3] }}>
                <Texto variante="seccion">{t('documentosGuarderia.aceptacionTitulo')}</Texto>
                <AceptacionDeDocumentos
                  marcadas={redes ? [...marcadas, CLAVE_REDES] : marcadas}
                  onCambiar={(clave, m) => {
                    /* La opcional NO entra a `marcadas`: ese arreglo es el que
                       gatea el botón, y una autorización de imagen jamás puede
                       contar como uno de los documentos obligatorios. */
                    if (clave === CLAVE_REDES) { setRedes(m); return; }
                    setMarcadas((p) => (m ? [...p, clave] : p.filter((c) => c !== clave)));
                  }}
                  documentos={carga.docs.map((d) => ({
                    clave: d.codigo,
                    texto: t('documentosGuarderia.leiYAcepto'),
                    etiquetaEnlace: t(`documentosGuarderia.doc_${d.codigo}` as 'documentosGuarderia.doc_contrato_custodia'),
                    onAbrir: () => setAbierto(d),
                  }))}
                  /* 🔴 NACE APAGADA, y el lugar es de la pieza: separada abajo
                     y rotulada. *Un default encendido publicaría la foto de un
                     animal porque alguien no tocó un interruptor.* */
                  opcionales={[{ clave: CLAVE_REDES, texto: t('documentosGuarderia.redesEtiqueta') }]}
                  rotuloOpcionales={t('documentosGuarderia.opcional')}
                />
                <Texto variante="apoyo">{t('documentosGuarderia.redesDetalle')}</Texto>
              </View>
            </Tarjeta>

            {/* EL TOPE Y LOS CONTACTOS — **parte del mismo acto**, no un paso
                aparte: el motor los exige sin default y la razón es de fondo. */}
            <Tarjeta>
              <View style={{ gap: spacing[3] }}>
                <Texto variante="seccion">{t('documentosGuarderia.urgenciaTitulo')}</Texto>
                <Texto variante="apoyo">{t('documentosGuarderia.urgenciaDetalle')}</Texto>
                <Campo
                  label={t('documentosGuarderia.topeEtiqueta')}
                  value={tope}
                  onChangeText={setTope}
                  keyboardType="numeric"
                />
                <Separador />
                <Texto variante="seccion">{t('documentosGuarderia.contactoTitulo')}</Texto>
                <Texto variante="apoyo">{t('documentosGuarderia.contactoDetalle')}</Texto>
                <Campo label={t('documentosGuarderia.contactoNombre')} value={contactoNombre} onChangeText={setContactoNombre} />
                <Campo
                  label={t('documentosGuarderia.contactoTelefono')}
                  value={contactoTel}
                  onChangeText={setContactoTel}
                  keyboardType="phone-pad"
                />
              </View>
            </Tarjeta>
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
            razonDeshabilitado={
              !todosMarcados
                ? t('documentosGuarderia.faltaAceptar')
                : !montoValido
                  ? t('documentosGuarderia.faltaTope')
                  : t('documentosGuarderia.faltaContacto')
            }
            cargando={enviando}
            onPress={() => void aceptar()}
          />
        </View>
      ) : null}

      {/* ── EL TEXTO COMPLETO, EN SU HOJA ──────────────────────────────────
             Canon `parte/[eventoId]`: el registro largo se abre entero, no se
             apila arriba del botón. `altura="completa"` porque un documento
             legal no se lee en media pantalla.

             🔴 **El contenido es el del server, tal cual.** La versión se
             muestra al pie: lo que se acepta es UNA VERSIÓN, y la familia
             tiene que poder verla. ── */}
      <Hoja
        visible={abierto !== null}
        onCerrar={() => setAbierto(null)}
        titulo={
          abierto === null
            ? ''
            : t(`documentosGuarderia.doc_${abierto.codigo}` as 'documentosGuarderia.doc_contrato_custodia')
        }
        altura="completa"
        conCerrar
      >
        <HojaScroll contentContainerStyle={{ padding: spacing[5], gap: spacing[3] }}>
          {abierto === null ? null : (
            <>
              <Texto variante="cuerpo">{abierto.contenido}</Texto>
              <Texto variante="dato" color="secondary">
                {t('documentosGuarderia.version', { n: abierto.version })}
              </Texto>
            </>
          )}
        </HojaScroll>
      </Hoja>
    </SafeAreaView>
  );
}
