/**
 * Cuenta · TU IDENTIFICACIÓN — el eje ① de la verificación (S84-C33).
 *
 * EL HUECO QUE CIERRA, medido en C29 ④: había TRES llamadores a la
 * pantalla de documentos y **los tres gateados a veterinaria**
 * (`sala-espera:215` dentro de `{esVet && …}` · `veterinaria/index:212` y
 * `:255`). Un paseador, un groomer o un adiestrador tenía **CERO
 * caminos** — no escondidos: inexistentes.
 * Y eso no era una pantalla mal ubicada sino una promesa rota: **el sello
 * de verificación es de PLATAFORMA** —es lo que una familia lee para
 * confiar— y *un sello que solo puede ganarse un oficio no es un sello de
 * plataforma*.
 *
 * VIVE EN EL PERFIL Y NO EN AJUSTES porque el Perfil ES LA VITRINA: esto
 * no es configuración, es lo que decide si la familia te ve verificado.
 *
 * ⚠️ NO ENTRA LA CAPA VET (título profesional · registro SENESCYT): es el
 * eje ②, va en S85 y ENCIMA de éste — su pantalla actual sigue viva y sin
 * tocar. Acá solo el documento que TODO prestador tiene, sea cual sea su
 * oficio.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
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
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  capturarConCamara,
  capturarDeGaleria,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  documentoDeFigura,
  obtenerDocumentosVerificacion,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerPaisesParaRegistro,
  type DocumentoVerificacion,
  type TipoFiscal,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { PAISES, bandera, nombrePais } from '@/lib/paises';
import { subirDocumentoVerificacion } from '@/lib/subir-documento';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  /** SIN cuenta comercial no hay figura fiscal, y sin figura no se sabe
   *  qué documento pedir. **No se adivina ni se pregunta** (Ley 23): se
   *  dice qué falta y se da el camino. */
  | { estado: 'sin_cuenta' }
  | {
      estado: 'listo';
      prestadorId: string;
      tipoFiscal: TipoFiscal;
      documento: DocumentoVerificacion | null;
      /** Nombres fiscales por figura, SOLO de los países que los
       *  declaran. Medido por A: **1 de 23** (solo EC) — por eso el
       *  genérico es el camino habitual y no el plan B. */
      nombrePorPais: Record<string, Partial<Record<TipoFiscal, string>>>;
    };

export default function Documentos() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);
  /** ⚠️ ARRANCA SIN DECLARAR, y es la firma de P21: preseleccionar el
   *  país del negocio sería DECLARAR POR EL PRESTADOR justo en el dato
   *  que más caro sale inventar. El `countryCode` de la cuenta está a
   *  mano y NO se toca — el mismo error que el teléfono ya nos cobró. */
  const [pais, setPais] = useState<string | null>(null);
  const [hojaPais, setHojaPais] = useState(false);
  const [hojaCaptura, setHojaCaptura] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        setPantalla({ estado: 'cargando' });
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok || prestador.data === null) {
          setPantalla({ estado: 'error' });
          return;
        }
        const cuenta = await obtenerMiCuentaComercial();
        if (!vigente) return;
        if (!cuenta.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        /* data null = NO tiene cuenta. Es estado legítimo (peldaño 0 del
           módulo), no error — y por eso tiene pantalla propia con camino
           en vez de un rebote. */
        if (cuenta.data === null) {
          setPantalla({ estado: 'sin_cuenta' });
          return;
        }
        const [docs, paises] = await Promise.all([
          obtenerDocumentosVerificacion(prestador.data.id),
          obtenerPaisesParaRegistro(),
        ]);
        if (!vigente) return;
        if (!docs.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const tipo = documentoDeFigura(cuenta.data.tipoFiscal);
        /* el vigente es el primero: el lector ya ordena del más reciente
           al más viejo. */
        const propio = docs.data.find((d) => d.tipo === tipo) ?? null;
        /* Si el catálogo de países falla, la pantalla NO se cae: se queda
           sin nombres específicos y usa el genérico, que es verdadero
           igual. Un fallo de catálogo no puede bloquear una subida. */
        const nombrePorPais: Record<string, Partial<Record<TipoFiscal, string>>> = {};
        if (paises.ok) for (const p of paises.data) nombrePorPais[p.codigoIso2] = p.nombrePorTipo;
        setPantalla({
          estado: 'listo',
          prestadorId: prestador.data.id,
          tipoFiscal: cuenta.data.tipoFiscal,
          documento: propio,
          nombrePorPais,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  /**
   * EL NOMBRE DEL DOCUMENTO — del CATÁLOGO, y el genérico es el CAMINO
   * HABITUAL (corrección de la mesa sobre mi propio reporte: **solo EC
   * declara nombres, 1 de 23**).
   * Por eso la lógica se lee al derecho: *si este país declaró cómo se
   * llama, se dice; si no —que es lo normal— se dice "tu identificación
   * fiscal", que es **genérico y verdadero en los 23** en vez de
   * específico y falso en 22.
   * Hardcodear "RUC" habría hecho mentir a la pantalla apenas alguien
   * elija Colombia, donde una persona jurídica tiene NIT.
   */
  function vozDocumento(p: Pantalla & { estado: 'listo' }): string {
    if (pais === null) return t('documentos.generico');
    return p.nombrePorPais[pais]?.[p.tipoFiscal] ?? t('documentos.generico');
  }

  async function capturar(camara: boolean) {
    if (pantalla.estado !== 'listo' || pais === null) return;
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
      prestadorId: pantalla.prestadorId,
      tipo: documentoDeFigura(pantalla.tipoFiscal),
      nombre: vozDocumento(pantalla),
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

  /** El estado del documento, en voz de quien espera — no el enum. */
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
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('documentos.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="80%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <EstadoVacio
          titulo={t('documentos.errorTitulo')}
          descripcion={t('documentos.errorCuerpo')}
          accion={<Boton etiqueta={t('cuenta.reintentar')} onPress={() => setIntento((n) => n + 1)} />}
        />
      )}

      {/* SIN CUENTA COMERCIAL — el rebote DICE qué falta y LLEVA. La
          figura fiscal vive ahí; sin ella no se sabe si va cédula o RUC,
          y preguntarla acá crearía una segunda respuesta que puede
          contradecir a la primera (y ese día ninguna es la verdad). */}
      {pantalla.estado === 'sin_cuenta' && (
        <EstadoVacio
          titulo={t('documentos.sinCuentaTitulo')}
          descripcion={t('documentos.sinCuentaCuerpo')}
          accion={
            <Boton
              etiqueta={t('documentos.sinCuentaAccion')}
              onPress={() => router.push('/cuenta-comercial')}
            />
          }
        />
      )}

      {pantalla.estado === 'listo' && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[8],
            gap: spacing[4],
          }}
        >
          <Texto variante="apoyo">{t('documentos.porQue')}</Texto>

          <Tarjeta elevacion="reposo">
            <View style={{ gap: spacing[3] }}>
              <Texto variante="seccion">{vozDocumento(pantalla)}</Texto>

              {/* ① EL PAÍS SE ELIGE — jamás se deriva del negocio (P21).
                  Va ARRIBA del botón de subir a propósito: es el que
                  decide cómo se llama el documento, así que preguntarlo
                  después sería pedirle al prestador que suba algo que
                  todavía no sabemos nombrar. */}
              <Celda
                titulo={t('documentos.paisLabel')}
                subtitulo={pais === null ? t('documentos.paisSinDeclarar') : undefined}
                fin={pais === null ? undefined : `${bandera(pais)}  ${nombrePais(pais)}`}
                interactiva
                accessibilityRole="button"
                onPress={() => setHojaPais(true)}
              />

              {pantalla.documento !== null && (
                <>
                  <Separador />
                  <View style={{ gap: spacing[2] }}>
                    <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'center' }}>
                      {/* El eje de `Insignia` es `estado`, y los cuatro
                          valores son de la casa: 'alDia' para lo que ya
                          está resuelto, 'info' para lo que espera. NO se
                          usa 'atencion' en el rechazo a propósito — el
                          motivo ya se dice en texto abajo, y una insignia
                          de alarma encima repetiría el mismo dato con más
                          volumen (Chanel). */}
                      <Insignia
                        etiqueta={
                          pantalla.documento.estado === 'aprobado'
                            ? t('documentos.insigniaVerificado')
                            : t('documentos.insigniaEnRevision')
                        }
                        estado={pantalla.documento.estado === 'aprobado' ? 'alDia' : 'info'}
                      />
                    </View>
                    <Texto variante="apoyo">{vozEstado(pantalla.documento)}</Texto>
                    {/* EL PAÍS DEL DOCUMENTO YA SUBIDO — null es la
                        verdad de los 9 previos a S84: no se preguntó.
                        Se DICE en vez de dibujar un país inventado. */}
                    <Texto variante="dato">
                      {pantalla.documento.paisEmisor === null
                        ? t('documentos.paisNoDeclarado')
                        : nombrePais(pantalla.documento.paisEmisor)}
                    </Texto>
                  </View>
                </>
              )}

              {/* ② EL BOTÓN APAGADO DICE QUÉ FALTA, SIEMPRE (patrón de la
                  casa desde S73-B): sin país no se sube —el documento
                  quedaría sin saber quién lo emitió, que es justo lo que
                  el admin necesita para verificarlo—, y en vez de un
                  control muerto que no explica nada, la línea de abajo
                  lo dice. Ley 23: la puerta no ofrece lo que va a
                  rechazar, y cuando no ofrece, habla. */}
              <Boton
                etiqueta={
                  pantalla.documento === null ? t('documentos.subir') : t('documentos.subirDeNuevo')
                }
                bloque
                cargando={subiendo}
                deshabilitado={pais === null}
                onPress={() => setHojaCaptura(true)}
              />
              {pais === null && <Texto variante="apoyo">{t('documentos.faltaPais')}</Texto>}
            </View>
          </Tarjeta>
        </ScrollView>
      )}

      {/* LOS 23 — la lista es más ancha que la de registro a propósito:
          un profesional colombiano en Quito tiene documento colombiano, y
          con la lista de países ACTIVOS ese caso real sería imposible de
          declarar (ver `lib/paises.ts`). */}
      <Hoja visible={hojaPais} onCerrar={() => setHojaPais(false)} titulo={t('documentos.paisHojaTitulo')}>
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
