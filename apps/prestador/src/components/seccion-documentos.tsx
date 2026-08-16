/**
 * SECCIÓN DOCUMENTOS — LAS TRES CAPAS (S85-C2, firma del founder), dentro
 * de Datos comerciales.
 *
 * ═══════ POR QUÉ TRES Y NO UNA LISTA ═══════
 * Las tres capas **no se distinguen por importancia sino por QUÉ HACEN CON
 * TU TIEMPO**, y por eso el rótulo de cada una lo dice:
 *
 *  ① **BASE — tu identificación.** Cédula o RUC según la FIGURA, que ya
 *     está declarada (`tipo_fiscal`): la puerta no pregunta lo que sabe
 *     (Ley 23). Es la que el equipo mira primero.
 *  ② **LEGALES POR OFICIO** — hoy solo veterinaria (`LETRA_VERIFICACION`
 *     §1: el eje ② va ENCIMA del ①, no lo reemplaza). Se **adjuntan para
 *     revisión**, y el copy **no promete encendido**: la activación de un
 *     servicio médico la hace el equipo desde el portal admin. *Decir
 *     "subilo y se activa" dejaría al prestador esperando un acto que
 *     esta app no ejecuta.*
 *  ③ **OPCIONALES — certificaciones y acreditaciones.** No gatean nada y
 *     lo dicen. Su tipo (`certificacion`) nació en la migración
 *     `20260803160000` de A: antes lo más cercano era `otro`, que sirve
 *     para guardar el archivo y no para saber qué es.
 *
 * ✅ **EL FRENO DE `permiso_funcionamiento` SE LEVANTÓ (S85-A10), y la
 * nota se reescribe en vez de dejarse.** Decía "NO SE OFRECE" y **hoy se
 * ofrece**: es la candidata #20 en carne — *una cadena que declara
 * NUESTRO estado envejece sola*, y esta cabecera es exactamente eso.
 * Lo que el freno midió, conservado porque explica la forma: la letra lo
 * nombraba en el eje ② y el CHECK de la DB lo aceptaba, **pero el lector
 * lo filtraba** (`.in('tipo', TIPOS_DOCUMENTO_VERIFICACION)`), así que el
 * documento **habría subido bien y desaparecido de la pantalla**. A lo
 * sumó al arreglo con su medición: **le da PANTALLA, no PODER** — el gate
 * vive en SQL y no lee esa constante.
 *
 * ⚠️ **P21 EN LAS TRES CAPAS: el país se DECLARA POR DOCUMENTO.** No hay
 * un país "de la sección": mi cédula puede ser ecuatoriana y mi título
 * colombiano — es el caso canónico que la letra usa. Por eso cada fila
 * lleva su propio selector y **ninguno arranca preseleccionado**.
 *
 * S85-C2 (D-633): la lista de países sale de `obtenerPaisesDelMundo()` —
 * la copia local murió. Ver `lib/paises.ts`.
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Celda,
  Hoja,
  HojaCaptura,
  Insignia,
  Separador,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import { useFocusEffect } from 'expo-router';
import {
  documentoDeFigura,
  obtenerDocumentosVerificacion,
  obtenerMundoVeterinariaPropio,
  obtenerPaisesDelMundo,
  obtenerPaisesParaRegistro,
  type DocumentoVerificacion,
  type PaisDelMundo,
  type TipoDocumentoVerificacion,
  type TipoFiscal,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { bandera, nombreDePais } from '@/lib/paises';
import { subirDocumentoVerificacion } from '@/lib/subir-documento';

/** Los del eje ② — LOS TRES. `permiso_funcionamiento` entró en S85-A10
 *  al arreglo del lector (era el freno de C: la DB lo aceptaba y el
 *  lector lo filtraba, así que el documento subía y desaparecía).
 *  ⚠️ **Le da PANTALLA, no PODER**, y está medido por A: el gate vive en
 *  SQL (`_trg_ps_verificacion_profesional` compara contra
 *  `('titulo_profesional','registro_senescyt')` literales) y **no lee
 *  esta constante**. Es `LETRA_PERFIL_S79` §6 al pie: la credencial de la
 *  PERSONA gatea la oferta médica, el permiso del establecimiento **se
 *  recolecta**. */
const LEGALES_VET = ['titulo_profesional', 'registro_senescyt', 'permiso_funcionamiento'] as const;

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

  const [docs, setDocs] = useState<DocumentoVerificacion[]>([]);
  const [paises, setPaises] = useState<PaisDelMundo[]>([]);
  const [nombrePorPais, setNombrePorPais] = useState<
    Record<string, Partial<Record<TipoFiscal, string>>>
  >({});
  /** El eje ② solo aplica a veterinaria (LETRA_VERIFICACION §1). Se LEE en
   *  vez de suponerse: un paseador no tiene por qué ver "Registro
   *  SENESCYT" en su pantalla. */
  const [esVet, setEsVet] = useState(false);
  const [intento, setIntento] = useState(0);

  const tipoBase = documentoDeFigura(tipoFiscal);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const [rDocs, rPaisesReg, rPaises, rVet] = await Promise.all([
          obtenerDocumentosVerificacion(prestadorId),
          obtenerPaisesParaRegistro(),
          obtenerPaisesDelMundo(),
          obtenerMundoVeterinariaPropio(prestadorId),
        ]);
        if (!vigente) return;
        /* Un fallo NO borra lo que había en pantalla ni tumba la sección:
           cada lectura degrada sola. */
        if (rDocs.ok) setDocs(rDocs.data);
        if (rPaises.ok) setPaises(rPaises.data);
        if (rVet.ok) setEsVet(rVet.data.servicios.some((s) => s.activo));
        /* si el catálogo fiscal falla, la sección NO se cae: se queda sin
           nombres específicos y usa el genérico, que es verdadero igual. */
        if (rPaisesReg.ok) {
          const m: Record<string, Partial<Record<TipoFiscal, string>>> = {};
          for (const p of rPaisesReg.data) m[p.codigoIso2] = p.nombrePorTipo;
          setNombrePorPais(m);
        }
      })();
      return () => {
        vigente = false;
      };
    }, [prestadorId, intento]),
  );

  const recargar = (): void => setIntento((n) => n + 1);

  /**
   * EL NOMBRE DEL DOCUMENTO BASE — del CATÁLOGO, con el genérico como
   * CAMINO HABITUAL. Se lee al derecho a propósito: *si este país declaró
   * cómo se llama, se dice; si no —que es lo normal, 22 de 23— se dice
   * "tu identificación fiscal"*, genérico y **verdadero en los 23** en vez
   * de específico y falso en 22. Hardcodear "RUC" haría mentir a la
   * pantalla apenas alguien elija Colombia, donde una persona jurídica
   * tiene NIT.
   */
  const nombreBase = (pais: string | null): string =>
    pais === null
      ? t('documentos.generico')
      : (nombrePorPais[pais]?.[tipoFiscal] ?? t('documentos.generico'));

  const vozTipo = (tipo: TipoDocumentoVerificacion): string => {
    switch (tipo) {
      case 'titulo_profesional':
        return t('documentos.tipoTituloProfesional');
      case 'registro_senescyt':
        return t('documentos.tipoRegistroSenescyt');
      case 'permiso_funcionamiento':
        return t('documentos.tipoPermisoFuncionamiento');
      case 'certificacion':
        return t('documentos.tipoCertificacion');
      default:
        return t('documentos.generico');
    }
  };

  return (
    <View style={{ gap: spacing[5] }}>
      {/* ── ① LA BASE ── */}
      <View style={{ gap: spacing[3] }}>
        <Texto variante="seccion">{t('documentos.capaBase')}</Texto>
        <FilaDocumento
          prestadorId={prestadorId}
          tipo={tipoBase}
          paises={paises}
          docs={docs}
          onSubido={recargar}
          nombreDe={nombreBase}
        />
      </View>

      {/* ── ② LOS LEGALES DEL OFICIO — hoy solo veterinaria ── */}
      <View style={{ gap: spacing[3] }}>
        <Texto variante="seccion">{t('documentos.capaLegales')}</Texto>
        {esVet ? (
          <>
            <Texto variante="apoyo">{t('documentos.capaLegalesAyuda')}</Texto>
            {LEGALES_VET.map((tipo, i) => (
              <View key={tipo} style={{ gap: spacing[3] }}>
                {i > 0 ? <Separador /> : null}
                <FilaDocumento
                  prestadorId={prestadorId}
                  tipo={tipo}
                  paises={paises}
                  docs={docs}
                  onSubido={recargar}
                  nombreDe={() => vozTipo(tipo)}
                />
              </View>
            ))}
          </>
        ) : (
          /* Ley 13 + 17.5: no se dibuja un control que no le toca, y se
             dice POR QUÉ no está en vez de dejar el hueco mudo. */
          <Texto variante="apoyo">{t('documentos.capaLegalesSoloVet')}</Texto>
        )}
      </View>

      {/* ── ③ LOS OPCIONALES — no gatean nada, y varios son legales ── */}
      <View style={{ gap: spacing[3] }}>
        <Texto variante="seccion">{t('documentos.capaOpcionales')}</Texto>
        <Texto variante="apoyo">{t('documentos.capaOpcionalesAyuda')}</Texto>
        <FilaDocumento
          prestadorId={prestadorId}
          tipo="certificacion"
          paises={paises}
          docs={docs}
          onSubido={recargar}
          nombreDe={() => vozTipo('certificacion')}
          /** La única capa donde varios documentos son la norma: un
           *  prestador puede tener tres cursos. Las otras dos tienen UNO
           *  vigente por tipo. */
          varios
        />
      </View>
    </View>
  );
}

/**
 * UNA FILA DE DOCUMENTO — su país, su estado y su subida.
 *
 * Nace como pieza LOCAL y no en `packages/ui` porque tiene **exactamente
 * tres consumidores y los tres viven en este archivo**: promoverla ahora
 * sería inventar un contrato para un solo cliente (mismo criterio que
 * `ControlTelefono` en `perfil-piezas`). Su día llega con el primer
 * consumidor de otra pantalla.
 */
function FilaDocumento({
  prestadorId,
  tipo,
  paises,
  docs,
  onSubido,
  nombreDe,
  varios = false,
}: {
  prestadorId: string;
  tipo: TipoDocumentoVerificacion;
  paises: PaisDelMundo[];
  docs: DocumentoVerificacion[];
  onSubido: () => void;
  /** El nombre humano del documento, que puede depender del país (la
   *  base) o no (los otros dos). */
  nombreDe: (pais: string | null) => string;
  varios?: boolean;
}) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  /** ⚠️ ARRANCA SIN DECLARAR (P21): preseleccionar el país del negocio
   *  sería declarar por el prestador justo en el dato más caro de
   *  inventar. `countryCode` está a mano y NO se toca. */
  const [pais, setPais] = useState<string | null>(null);
  const [hojaPais, setHojaPais] = useState(false);
  const [hojaCaptura, setHojaCaptura] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  /* el lector ordena del más reciente al más viejo: el vigente es el
     primero de su tipo. */
  const mios = docs.filter((d) => d.tipo === tipo);
  const vigente = mios[0] ?? null;
  const nombre = nombreDe(pais);

  /* 🔴 S99-C · R42 — LA PUERTA DEJA DE ESTAR RE-DIBUJADA. Su anatomía YA
     era la canónica (dos `Boton bloque`), así que migrar no cambió la
     forma: le dio el CERROJO sincrónico contra el doble tap, que es lo
     que no se ve y lo que faltaba. Es cura, no swap. */
  async function capturar(uri: string) {
    if (pais === null) return;
    setSubiendo(true);
    const sub = await subirDocumentoVerificacion({
      uri,
      prestadorId,
      tipo,
      nombre,
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
    onSubido();
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
      {/* EL PAÍS SE ELIGE — jamás se deriva del negocio (P21). Va ARRIBA
          del botón: es el que decide cómo se llama el documento, así que
          preguntarlo después sería pedir que suba algo que todavía no
          sabemos nombrar. */}
      <Celda
        titulo={t('documentos.paisLabel')}
        subtitulo={pais === null ? t('documentos.paisSinDeclarar') : undefined}
        fin={pais === null ? undefined : `${bandera(pais)}  ${nombreDePais(paises, pais)}`}
        interactiva
        accessibilityRole="button"
        onPress={() => setHojaPais(true)}
      />

      {/* LO YA SUBIDO. En la capa de VARIOS se listan todos: una
          certificación no reemplaza a otra. En las otras dos, el vigente
          es uno. */}
      {(varios ? mios : vigente === null ? [] : [vigente]).map((doc) => (
        <View key={doc.id} style={{ gap: spacing[2] }}>
          <View style={{ flexDirection: 'row' }}>
            {/* 'alDia' para lo resuelto, 'info' para lo que espera. NO se
                usa 'atencion' en el rechazo: el motivo ya se dice en texto
                abajo, y una insignia de alarma encima repetiría el mismo
                dato con más volumen (Chanel). */}
            <Insignia
              etiqueta={
                doc.estado === 'aprobado'
                  ? t('documentos.insigniaVerificado')
                  : t('documentos.insigniaEnRevision')
              }
              estado={doc.estado === 'aprobado' ? 'alDia' : 'info'}
            />
          </View>
          <Texto variante="apoyo">{vozEstado(doc)}</Texto>
          {/* null es la verdad de los documentos previos a S84: no se
              preguntó. Se DICE en vez de dibujar un país inventado. */}
          <Texto variante="dato">
            {doc.paisEmisor === null
              ? t('documentos.paisNoDeclarado')
              : nombreDePais(paises, doc.paisEmisor)}
          </Texto>
        </View>
      ))}

      {varios && mios.length === 0 && <Texto variante="apoyo">{t('documentos.capaSinDocumentos')}</Texto>}

      {/* EL BOTÓN APAGADO DICE QUÉ FALTA, SIEMPRE (patrón de la casa desde
          S73-B): sin país no se sube —el documento quedaría sin saber
          quién lo emitió, que es justo lo que el admin necesita para
          verificarlo— y en vez de un control muerto que no explica nada,
          la línea de abajo lo dice. Ley 23. */}
      <Boton
        etiqueta={mios.length === 0 ? t('documentos.subir') : t('documentos.subirDeNuevo')}
        bloque
        cargando={subiendo}
        deshabilitado={pais === null}
        onPress={() => setHojaCaptura(true)}
      />
      {pais === null && <Texto variante="apoyo">{t('documentos.faltaPais')}</Texto>}

      {/* LOS 23 DEL CATÁLOGO — la lista es más ancha que la de registro a
          propósito: un profesional colombiano en Quito tiene documento
          colombiano, y con la lista de países ACTIVOS ese caso real sería
          imposible de declarar. S85-C2: sale del motor, no de una copia. */}
      <Hoja visible={hojaPais} onCerrar={() => setHojaPais(false)} titulo={t('documentos.paisHojaTitulo')}>
        <View>
          {paises.map((p, i) => (
            <View key={p.codigo}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={`${bandera(p.codigo)}  ${p.nombre}`}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  setPais(p.codigo);
                  setHojaPais(false);
                }}
              />
            </View>
          ))}
        </View>
      </Hoja>

      <HojaCaptura
        visible={hojaCaptura}
        titulo={t('documentos.capturaHojaTitulo')}
        onCerrar={() => setHojaCaptura(false)}
        onFoto={(foto) => void capturar(foto.uri)}
        onPermisoDenegado={() =>
          mostrar({ variante: 'error', texto: t('documentos.permisoCamara') })
        }
        opciones={{ redimensionarA: 1600, calidad: 0.8 }}
      />
    </View>
  );
}
