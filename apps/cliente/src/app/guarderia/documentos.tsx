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
 * ── POR QUÉ NO ES UNA LISTA DE CASILLAS ──────────────────────────────────
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
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Interruptor,
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
         cambió mientras la pantalla estaba abierta, el motor lo va a saber. */
      aceptaciones: carga.docs.map((d) => ({ codigo: d.codigo, version: d.version })),
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
  }, [carga, enviando, tope, contactoNombre, contactoTel, redes, mostrar, t]);

  const montoValido = Number(tope) > 0;
  const contactoValido = contactoNombre.trim().length > 0 && contactoTel.trim().length > 0;
  const puedeAceptar =
    carga.fase === 'listo' && carga.estado !== 'documentos_no_disponibles' &&
    carga.docs.length > 0 && montoValido && contactoValido;

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
            {/* LOS DOCUMENTOS — su texto sale del server, versionado. */}
            {carga.docs.map((d) => (
              <Tarjeta key={`${d.codigo}-${d.version}`}>
                <View style={{ gap: spacing[2] }}>
                  <Texto variante="seccion">{t(`documentosGuarderia.doc_${d.codigo}` as 'documentosGuarderia.doc_contrato_custodia')}</Texto>
                  <Texto variante="cuerpo">{d.contenido}</Texto>
                  <Texto variante="dato" color="secondary">
                    {t('documentosGuarderia.version', { n: d.version })}
                  </Texto>
                </View>
              </Tarjeta>
            ))}

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

            {/* 🔴 NACE APAGADA. *Un default encendido publicaría la foto de un
                animal porque alguien no tocó un interruptor.* */}
            <Tarjeta>
              <View style={{ gap: spacing[2] }}>
                <Interruptor
                  etiqueta={t('documentosGuarderia.redesEtiqueta')}
                  encendido={redes}
                  onCambio={setRedes}
                />
                <Texto variante="apoyo">{t('documentosGuarderia.redesDetalle')}</Texto>
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
              !montoValido ? t('documentosGuarderia.faltaTope') : t('documentosGuarderia.faltaContacto')
            }
            cargando={enviando}
            onPress={() => void aceptar()}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
