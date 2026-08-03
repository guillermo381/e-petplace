/**
 * SECCIÓN DOCUMENTOS — el eje ① de la verificación, dentro de Datos
 * comerciales (S84-C34 ②).
 *
 * ☠️ NACE DE UNA MUDANZA, y el costo está declarado y aceptado: en C33
 * esto era la pantalla `cuenta/documentos`. Con la firma de ② los datos
 * comerciales se unifican en TRES secciones hermanas y una pantalla
 * suelta habría sido la cuarta puerta al mismo lugar. **Muere el cromo
 * (encabezado, scroll, estados de carga propios); el cuerpo viaja
 * entero.** Ley 37: lo que sale de la UI sale del código.
 *
 * LO QUE NO CAMBIÓ AL MUDARSE, porque era lo que valía:
 *  · la FIGURA sale de `tipoFiscal` — Ley 23, no se pregunta.
 *  · el DOCUMENTO sale de `documentoDeFigura()` — la regla fiscal vive
 *    UNA vez, en el wrapper.
 *  · el NOMBRE sale del catálogo del país ELEGIDO, y **el genérico es el
 *    camino habitual**: solo EC declara nombres (1 de 23 — medido).
 *  · el PAÍS se DECLARA y arranca vacío (P21).
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Celda,
  Hoja,
  Insignia,
  Separador,
  Texto,
  capturarConCamara,
  capturarDeGaleria,
  spacing,
  useAviso,
} from '@epetplace/ui';
import { useFocusEffect } from 'expo-router';
import {
  documentoDeFigura,
  obtenerDocumentosVerificacion,
  obtenerPaisesParaRegistro,
  type DocumentoVerificacion,
  type TipoFiscal,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { PAISES, bandera, nombrePais } from '@/lib/paises';
import { subirDocumentoVerificacion } from '@/lib/subir-documento';

export function SeccionDocumentos({
  prestadorId,
  tipoFiscal,
}: {
  prestadorId: string;
  /** La figura ya resuelta por quien tiene la cuenta comercial en la
   *  mano — esta sección no la vuelve a leer ni la pregunta. */
  tipoFiscal: TipoFiscal;
}) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [documento, setDocumento] = useState<DocumentoVerificacion | null>(null);
  const [nombrePorPais, setNombrePorPais] = useState<
    Record<string, Partial<Record<TipoFiscal, string>>>
  >({});
  /** ⚠️ ARRANCA SIN DECLARAR (P21): preseleccionar el país del negocio
   *  sería declarar por el prestador justo en el dato más caro de
   *  inventar. `countryCode` está a mano y NO se toca. */
  const [pais, setPais] = useState<string | null>(null);
  const [hojaPais, setHojaPais] = useState(false);
  const [hojaCaptura, setHojaCaptura] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [intento, setIntento] = useState(0);

  const tipo = documentoDeFigura(tipoFiscal);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const [docs, paises] = await Promise.all([
          obtenerDocumentosVerificacion(prestadorId),
          obtenerPaisesParaRegistro(),
        ]);
        if (!vigente) return;
        /* el vigente es el primero: el lector ordena del más reciente al
           más viejo. Un fallo NO borra lo que había en pantalla. */
        if (docs.ok) setDocumento(docs.data.find((d) => d.tipo === tipo) ?? null);
        /* si el catálogo falla, la sección NO se cae: se queda sin
           nombres específicos y usa el genérico, que es verdadero igual.
           Un fallo de catálogo no puede bloquear una subida. */
        if (paises.ok) {
          const m: Record<string, Partial<Record<TipoFiscal, string>>> = {};
          for (const p of paises.data) m[p.codigoIso2] = p.nombrePorTipo;
          setNombrePorPais(m);
        }
      })();
      return () => {
        vigente = false;
      };
    }, [prestadorId, tipo, intento]),
  );

  /**
   * EL NOMBRE — del CATÁLOGO, con el genérico como CAMINO HABITUAL.
   * Se lee al derecho a propósito: *si este país declaró cómo se llama,
   * se dice; si no —que es lo normal, 22 de 23— se dice "tu
   * identificación fiscal"*, que es genérico y **verdadero en los 23** en
   * vez de específico y falso en 22.
   * Hardcodear "RUC" habría hecho mentir a la pantalla apenas alguien
   * elija Colombia, donde una persona jurídica tiene NIT.
   */
  const vozDocumento =
    pais === null
      ? t('documentos.generico')
      : (nombrePorPais[pais]?.[tipoFiscal] ?? t('documentos.generico'));

  async function capturar(camara: boolean) {
    if (pais === null) return;
    setHojaCaptura(false);
    const r = camara
      ? await capturarConCamara({ redimensionarA: 1600, calidad: 0.8 })
      : await capturarDeGaleria({ redimensionarA: 1600, calidad: 0.8 });
    if (r.tipo === 'cancelada') return;
    if (r.tipo === 'permiso_denegado') {
      mostrar({ variante: 'error', texto: t('documentos.permisoCamara') });
      return;
    }
    setSubiendo(true);
    const sub = await subirDocumentoVerificacion({
      uri: r.foto.uri,
      prestadorId,
      tipo,
      nombre: vozDocumento,
      paisEmisor: pais,
    });
    setSubiendo(false);
    if (!sub.ok) {
      mostrar({
        variante: 'error',
        texto: sub.causa === 'red' ? t('documentos.errorRed') : t('documentos.errorSubida'),
      });
      return;
    }
    mostrar({ variante: 'exito', texto: t('documentos.subido') });
    setIntento((n) => n + 1);
  }

  /** El estado en voz de quien espera — no el enum. */
  function vozEstado(doc: DocumentoVerificacion): string {
    switch (doc.estado) {
      case 'pendiente':
        return t('documentos.enRevision');
      case 'aprobado':
        return t('documentos.aprobado');
      case 'rechazado':
        /* el motivo REAL del admin si lo hay — un rechazo sin razón deja
           al prestador sin saber qué corregir. */
        return doc.notasRevision !== null && doc.notasRevision.trim() !== ''
          ? doc.notasRevision
          : t('documentos.rechazado');
      case 'vencido':
        return t('documentos.vencido');
    }
  }

  return (
    <View style={{ gap: spacing[3] }}>
      <Texto variante="seccion">{vozDocumento}</Texto>

      {/* EL PAÍS SE ELIGE — jamás se deriva del negocio (P21). Va ARRIBA
          del botón: es el que decide cómo se llama el documento, así que
          preguntarlo después sería pedir que suba algo que todavía no
          sabemos nombrar. */}
      <Celda
        titulo={t('documentos.paisLabel')}
        subtitulo={pais === null ? t('documentos.paisSinDeclarar') : undefined}
        fin={pais === null ? undefined : `${bandera(pais)}  ${nombrePais(pais)}`}
        interactiva
        accessibilityRole="button"
        onPress={() => setHojaPais(true)}
      />

      {documento !== null && (
        <>
          <Separador />
          <View style={{ gap: spacing[2] }}>
            <View style={{ flexDirection: 'row' }}>
              {/* 'alDia' para lo resuelto, 'info' para lo que espera. NO
                  se usa 'atencion' en el rechazo: el motivo ya se dice en
                  texto abajo, y una insignia de alarma encima repetiría
                  el mismo dato con más volumen (Chanel). */}
              <Insignia
                etiqueta={
                  documento.estado === 'aprobado'
                    ? t('documentos.insigniaVerificado')
                    : t('documentos.insigniaEnRevision')
                }
                estado={documento.estado === 'aprobado' ? 'alDia' : 'info'}
              />
            </View>
            <Texto variante="apoyo">{vozEstado(documento)}</Texto>
            {/* null es la verdad de los documentos previos a S84: no se
                preguntó. Se DICE en vez de dibujar un país inventado. */}
            <Texto variante="dato">
              {documento.paisEmisor === null
                ? t('documentos.paisNoDeclarado')
                : nombrePais(documento.paisEmisor)}
            </Texto>
          </View>
        </>
      )}

      {/* EL BOTÓN APAGADO DICE QUÉ FALTA, SIEMPRE (patrón de la casa
          desde S73-B): sin país no se sube —el documento quedaría sin
          saber quién lo emitió, que es justo lo que el admin necesita
          para verificarlo— y en vez de un control muerto que no explica
          nada, la línea de abajo lo dice. Ley 23. */}
      <Boton
        etiqueta={documento === null ? t('documentos.subir') : t('documentos.subirDeNuevo')}
        bloque
        cargando={subiendo}
        deshabilitado={pais === null}
        onPress={() => setHojaCaptura(true)}
      />
      {pais === null && <Texto variante="apoyo">{t('documentos.faltaPais')}</Texto>}

      {/* LOS 23 — la lista es más ancha que la de registro a propósito:
          un profesional colombiano en Quito tiene documento colombiano, y
          con la lista de países ACTIVOS ese caso real sería imposible de
          declarar (ver `lib/paises.ts`). */}
      <Hoja
        visible={hojaPais}
        onCerrar={() => setHojaPais(false)}
        titulo={t('documentos.paisHojaTitulo')}
      >
        <View>
          {PAISES.map((p, i) => (
            <View key={p.iso}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={`${bandera(p.iso)}  ${p.nombre}`}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  setPais(p.iso);
                  setHojaPais(false);
                }}
              />
            </View>
          ))}
        </View>
      </Hoja>

      <Hoja
        visible={hojaCaptura}
        onCerrar={() => setHojaCaptura(false)}
        titulo={t('documentos.capturaHojaTitulo')}
        altura="contenido"
      >
        <View style={{ gap: spacing[2] }}>
          <Boton etiqueta={t('documentos.camara')} bloque onPress={() => void capturar(true)} />
          <Boton
            variante="secundario"
            etiqueta={t('documentos.galeria')}
            bloque
            onPress={() => void capturar(false)}
          />
        </View>
      </Hoja>
    </View>
  );
}
