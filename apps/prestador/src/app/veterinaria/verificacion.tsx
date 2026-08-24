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
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  HojaCaptura,
  Insignia,
  MarcaDeAgua,
  Tarjeta,
  Texto,
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

  /* 🔴 S99-C · R42 — LA PUERTA DEJA DE ESTAR RE-DIBUJADA (y acá SÍ
     cambia la forma, con su firma detrás). La hoja tenía dos `Celda
     interactiva`; la anatomía canónica son dos `Boton bloque`, y el
     porqué está firmado en la pieza: **Ley 22c — un comando con
     consecuencias viste de botón**. Abrir la cámara es un comando; una
     `Celda` es fila de lista, y una lista promete que tocar te LLEVA.
     *No es un gate de forma nuevo: es aplicar una ley que ya existía.*
     Lo que gana de paso es el cerrojo contra el doble tap. */
  async function capturar(uri: string) {
    const tipo = hojaTipo;
    if (tipo === null || pantalla.estado !== 'listo') return;
    setSubiendo(tipo);
    const sub = await subirDocumentoVerificacion({
      uri,
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
      <MarcaDeAgua />
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
                    <View style={{ flex: 1 }}>
                      <Texto variante="seccion">{vozTipo(tipo)}</Texto>
                    </View>
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
                      {/* 🔴 S104-A · `archivoPath` puede ser null y NO es un dato
                          faltante: §5.2 promete que la imagen se destruye al
                          concluir la verificación, y desde S104-A un trigger la
                          borra y limpia el puntero en el mismo acto. El caso cae
                          al placeholder de abajo. ⚠️ CURA MECÁNICA de A para
                          desbloquear el typecheck que su propia migración volvió
                          rojo — LA VOZ ES DE LA PISTA DE ESTA PANTALLA: hoy ese
                          placeholder dice «—», y lo honesto es decir que el
                          documento se verificó y su imagen se destruyó, jamás
                          dejar un guión que se lee como «falta subirlo». */}
                      {doc.archivoPath !== null && esImagen(doc.archivoPath) && previews[doc.archivoPath] != null ? (
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
                            {doc.archivoPath !== null ? extension(doc.archivoPath) || '—' : '—'}
                          </Texto>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Texto variante="dato" numberOfLines={2}>
                          {doc.archivoPath !== null ? nombreArchivo(doc.archivoPath).toLowerCase() : ''}
                        </Texto>
                      </View>
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
      <HojaCaptura
        visible={hojaTipo !== null}
        titulo={hojaTipo !== null ? vozTipo(hojaTipo) : ''}
        onCerrar={() => setHojaTipo(null)}
        onFoto={(foto) => void capturar(foto.uri)}
        onPermisoDenegado={() =>
          mostrar({ variante: 'error', texto: t('verificacionVet.permisoCamara') })
        }
        opciones={{ redimensionarA: 1600, calidad: 0.8 }}
      />
    </View>
  );
}
