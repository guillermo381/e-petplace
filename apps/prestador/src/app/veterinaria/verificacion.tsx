/**
 * VERIFICACIÓN PROFESIONAL — /veterinaria/verificacion (S68-B, P3).
 *
 * TESIS: "Subir tu título toma un minuto — y mientras se revisa,
 * sigues armando tu consultorio."
 * FIRMA: el estado honesto por documento — "En revisión" es el default
 * REAL de DB (estado 'pendiente'), no una promesa; la verificación
 * bloquea ABRIR, jamás construir (la voz lo dice).
 *
 * Chasis LEGACY VIVO relevado contra DB (S68-B, cero DDL):
 * prestador_documentos (tipos titulo_profesional/registro_senescyt,
 * CHECK de estados) + bucket privado 'prestador-documentos' con policy
 * por carpeta auth.uid(). Captura por la infra compartida capturaFoto
 * (packages/ui) y subida por lib/subir-documento (patrón S61-B10).
 */

import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Insignia,
  Separador,
  Tarjeta,
  Texto,
  capturarConCamara,
  capturarDeGaleria,
  radius,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  TIPOS_DOCUMENTO_VERIFICACION,
  obtenerDocumentosVerificacion,
  obtenerMiPrestador,
  resolverUrlDocumento,
  type DocumentoVerificacion,
  type TipoDocumentoVerificacion,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { subirDocumentoVerificacion } from '@/lib/subir-documento';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; prestadorId: string; documentos: DocumentoVerificacion[] };

// S68-B7 (hallazgo founder: "en revisión" sin mostrar NADA de lo
// subido): miniatura por URL firmada del bucket privado. Un archivo que
// no es imagen (PDF) cae al placeholder digno — jamás miniatura rota.
const esImagen = (path: string): boolean => /\.(jpe?g|png|webp|heic)$/i.test(path);
const nombreArchivo = (path: string): string => path.split('/').pop() ?? path;
const extension = (path: string): string => (path.includes('.') ? path.split('.').pop() ?? '' : '').toUpperCase();

export default function VerificacionVeterinaria() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [hojaTipo, setHojaTipo] = useState<TipoDocumentoVerificacion | null>(null);
  const [subiendo, setSubiendo] = useState<TipoDocumentoVerificacion | null>(null);
  // las miniaturas firmadas, por path (null = no firmable → placeholder)
  const [previews, setPreviews] = useState<Record<string, string | null>>({});

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const r = await obtenerDocumentosVerificacion(prestador.data.id);
        if (!vigente) return;
        if (!r.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({ estado: 'listo', prestadorId: prestador.data.id, documentos: r.data });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  // firmar las miniaturas de los documentos VIGENTES (imagen solamente)
  useEffect(() => {
    if (pantalla.estado !== 'listo') return;
    let vigente = true;
    const paths = TIPOS_DOCUMENTO_VERIFICACION.map(
      (tipo) => pantalla.documentos.find((d) => d.tipo === tipo)?.archivoPath ?? null,
    ).filter((p): p is string => p !== null && esImagen(p));
    void (async () => {
      for (const path of paths) {
        if (previews[path] !== undefined) continue;
        const url = await resolverUrlDocumento(path);
        if (!vigente) return;
        setPreviews((prev) => ({ ...prev, [path]: url }));
      }
    })();
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pantalla]);

  const vozTipo = (tipo: TipoDocumentoVerificacion): string =>
    tipo === 'titulo_profesional' ? t('verificacionVet.tituloProfesional') : t('verificacionVet.registroSenescyt');

  // el documento MÁS RECIENTE por tipo manda (el wrapper ordena desc)
  const docDe = (tipo: TipoDocumentoVerificacion): DocumentoVerificacion | null =>
    pantalla.estado === 'listo' ? (pantalla.documentos.find((d) => d.tipo === tipo) ?? null) : null;

  const vozEstado = (doc: DocumentoVerificacion | null): string => {
    if (doc === null) return t('verificacionVet.sinDocumento');
    switch (doc.estado) {
      case 'pendiente':
        return t('verificacionVet.enRevision');
      case 'aprobado':
        return t('verificacionVet.aprobado');
      case 'rechazado':
        return doc.notasRevision !== null && doc.notasRevision.trim() !== ''
          ? doc.notasRevision
          : t('verificacionVet.rechazado');
      case 'vencido':
        return t('verificacionVet.vencido');
    }
  };

  async function capturar(camara: boolean) {
    const tipo = hojaTipo;
    if (tipo === null || pantalla.estado !== 'listo') return;
    setHojaTipo(null);
    const r = camara
      ? await capturarConCamara({ redimensionarA: 1600, calidad: 0.8 })
      : await capturarDeGaleria({ redimensionarA: 1600, calidad: 0.8 });
    if (r.tipo === 'cancelada') return;
    if (r.tipo === 'permiso_denegado') {
      mostrar({ variante: 'error', texto: t('verificacionVet.permisoCamara') });
      return;
    }
    setSubiendo(tipo);
    const sub = await subirDocumentoVerificacion({
      uri: r.foto.uri,
      prestadorId: pantalla.prestadorId,
      tipo,
      nombre: vozTipo(tipo),
    });
    setSubiendo(null);
    if (!sub.ok) {
      mostrar({
        variante: 'error',
        texto: sub.causa === 'red' ? t('verificacionVet.errorRed') : t('verificacionVet.errorSubida'),
      });
      return;
    }
    mostrar({ variante: 'exito', texto: t('verificacionVet.subido') });
    setIntento((n) => n + 1);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('verificacionVet.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="80%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('taller.error')}
            descripcion={t('taller.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('taller.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: spacing[10] + insets.bottom,
            gap: spacing[4],
          }}
        >
          {/* bloquea abrir, jamás construir — la voz lo dice arriba */}
          <Texto variante="apoyo">
            {t('verificacionVet.intro')}
          </Texto>

          {TIPOS_DOCUMENTO_VERIFICACION.map((tipo) => {
            const doc = docDe(tipo);
            const aprobado = doc?.estado === 'aprobado';
            const pendiente = doc?.estado === 'pendiente';
            return (
              <Tarjeta key={tipo} elevacion="reposo">
                <View style={{ gap: spacing[3] }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: spacing[3],
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: typography.family.sans.medium,
                        fontSize: typography.size.md,
                        color: theme.text.primary,
                      }}
                    >
                      {vozTipo(tipo)}
                    </Text>
                    {doc !== null && (
                      <Insignia
                        estado={aprobado ? 'alDia' : pendiente ? 'proximo' : 'atencion'}
                        etiqueta={
                          aprobado
                            ? t('verificacionVet.aprobado')
                            : pendiente
                              ? t('verificacionVet.enRevision')
                              : t('verificacionVet.revisar')
                        }
                        tamaño="sm"
                      />
                    )}
                  </View>
                  <Texto variante="apoyo">
                    {vozEstado(doc)}
                  </Texto>
                  {/* S68-B7: lo SUBIDO se ve — miniatura firmada del
                      bucket privado; no-imagen (PDF) = placeholder
                      digno con nombre y tipo, jamás miniatura rota */}
                  {doc !== null && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                      {esImagen(doc.archivoPath) && previews[doc.archivoPath] != null ? (
                        <Image
                          source={{ uri: previews[doc.archivoPath] as string }}
                          accessibilityLabel={vozTipo(tipo)}
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: radius.suave,
                            backgroundColor: theme.bg.overlay,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: radius.suave,
                            backgroundColor: theme.bg.overlay,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Texto variante="dato">
                            {extension(doc.archivoPath) || '—'}
                          </Texto>
                        </View>
                      )}
                      <Text
                        numberOfLines={2}
                        style={{
                          flex: 1,
                          fontFamily: typography.family.mono.regular,
                          fontSize: typography.size.sm,
                          color: theme.text.secondary,
                        }}
                      >
                        {nombreArchivo(doc.archivoPath).toLowerCase()}
                      </Text>
                    </View>
                  )}
                  {/* aprobado no re-sube (nada que reparar); el resto sí */}
                  {!aprobado && (
                    <View style={{ alignSelf: 'flex-start' }}>
                      {/* 19.7: una por tipo de documento — EJECUTA (abre la
                          Hoja de captura): label sin chevron. */}
                      <Boton
                        variante="ghost"
                        etiqueta={
                          doc === null ? t('verificacionVet.subir') : t('verificacionVet.subirDeNuevo')
                        }
                        cargando={subiendo === tipo}
                        onPress={() => setHojaTipo(tipo)}
                      />
                    </View>
                  )}
                </View>
              </Tarjeta>
            );
          })}
        </ScrollView>
      )}

      {/* Hoja: cámara / galería PARES (patrón SelectorAvatar) */}
      <Hoja
        visible={hojaTipo !== null}
        onCerrar={() => setHojaTipo(null)}
        titulo={hojaTipo !== null ? vozTipo(hojaTipo) : ''}
        altura="contenido"
      >
        <View style={{ paddingBottom: insets.bottom }}>
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('verificacionVet.tomarFoto')}
            onPress={() => void capturar(true)}
          />
          <Separador />
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('verificacionVet.elegirGaleria')}
            onPress={() => void capturar(false)}
          />
        </View>
      </Hoja>
    </View>
  );
}
