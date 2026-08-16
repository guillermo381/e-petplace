/**
 * PASO ③ DEL WIZARD — TUS DOCUMENTOS (S97-C · §4.1 y §4.4).
 *
 * ── TESIS ──────────────────────────────────────────────────────────────
 * «Los subís vos; el veredicto es nuestro.»
 *
 * ── FIRMA ──────────────────────────────────────────────────────────────
 * **El paso se completa al SUBIR, no al aprobarse.** Es la ley del
 * contador hecha pantalla (S91 · §4.3): *lo que depende de e-PetPlace no
 * entra al número.* Un documento en revisión ya no es trabajo suyo, y la
 * pantalla lo dice con el chip en vez de dejarlo contando algo que él no
 * puede bajar. Un RECHAZADO vuelve a sumar, porque volvió a ser suyo.
 *
 * ── CHANEL ─────────────────────────────────────────────────────────────
 * Se quitó el país emisor (el helper del prestador lo tiene; acá §4.4 no
 * lo pide y un campo de más en un alta es un campo que nadie llena) y la
 * fecha de vencimiento (§7 de `LETRA_PERFIL` sigue siendo PROPUESTA sin
 * gate — construirla acá sería adelantarme a una firma que no existe).
 *
 * ── §4.4: ESTE PASO ES EL ALTA DEL VENDEDOR PURO, ABSORBIDA ────────────
 * Por eso cuelga de la CUENTA COMERCIAL y no del prestador: un vendedor
 * puro no lleva fila de prestador, y fabricarle una vacía contaminaría el
 * motor de servicios (el cinturón de §3.4, del lado del alta).
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Entrada,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  HojaCaptura,
  Insignia,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import {
  listarDocumentosCuenta,
  obtenerDocumentosVerificacion,
  type DocumentoCuenta,
  type DocumentoVerificacion,
} from '@epetplace/api';

import { subirDocumentoCuenta, type TipoDocumentoCuenta } from '@/lib/subir-documento';
import { useTraduccion } from '@/i18n';

/** Claves LITERALES — el vocabulario de tipos es del motor. */
const CLAVE_TIPO = {
  cedula: 'alta.paso3.tipoCedula',
  ruc: 'alta.paso3.tipoRuc',
  permiso_funcionamiento: 'alta.paso3.tipoPermiso',
} as const satisfies Record<TipoDocumentoCuenta, string>;

const TIPOS: TipoDocumentoCuenta[] = ['cedula', 'ruc', 'permiso_funcionamiento'];

/* ══════════════════════════════════════════════════════════════════════
 * 🔴 LA LISTA ES COMPUESTA — Y LOS PREDICADOS SON LOS DEL MOTOR, LITERALES
 *
 * Adjudicación de mesa (S97): la pantalla lee LAS DOS tablas, con la misma
 * derivación que usa el contador ⇒ **contador y pantalla no se pueden
 * contradecir por construcción**, no por disciplina.
 *
 * El defecto que esto cura lo destapó una CAPTURA: el contador decía «te
 * falta 1 paso» mientras el paso mostraba tres casillas vacías, porque el
 * motor ya contaba los papeles del PRESTADOR y la pantalla solo miraba los
 * de la CUENTA. Le pedía a un prestador viejo subir lo que ya entregó —
 * la puerta preguntando lo que ya sabe (Ley 23, corolario S73).
 *
 * ⚠️ LOS DOS PREDICADOS NO SON EL MISMO, y copiar uno para los dos habría
 * reintroducido la divergencia en silencio. Medidos en
 * `20260814110000_s97a_onboarding_por_paso.sql`:
 *   · CUENTA    → `estado IN ('pendiente','aprobado')`
 *   · PRESTADOR → `estado <> 'rechazado'`
 * Un `vencido` del prestador CUENTA como hecho; uno de la cuenta NO.
 * ══════════════════════════════════════════════════════════════════════ */

/** Espejo LITERAL del motor para los documentos de la CUENTA. */
function cuentaHecho(d: DocumentoCuenta): boolean {
  return d.estado === 'pendiente' || d.estado === 'aprobado';
}
/** Espejo LITERAL del motor para los documentos del PRESTADOR. */
function prestadorHecho(d: DocumentoVerificacion): boolean {
  return d.estado !== 'rechazado';
}

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      documentos: DocumentoCuenta[];
      /** Los del perfil profesional que YA cuentan — no se piden de nuevo. */
      heredados: DocumentoVerificacion[];
    };

export interface PasoDocumentosProps {
  cuentaComercialId: string;
  /** `null` = vendedor puro: no tiene fila de prestador, y por eso no
   *  puede tener documentos heredados. No es un error (§8.6bis). */
  prestadorId: string | null;
  alSubir: () => void;
}

export function PasoDocumentos({ cuentaComercialId, prestadorId, alSubir }: PasoDocumentosProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [eligiendo, setEligiendo] = useState<TipoDocumentoCuenta | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    const [cuenta, prestador] = await Promise.all([
      listarDocumentosCuenta(cuentaComercialId),
      prestadorId === null
        ? Promise.resolve({ ok: true as const, data: [] as DocumentoVerificacion[] })
        : obtenerDocumentosVerificacion(prestadorId),
    ]);
    if (!cuenta.ok) {
      setPantalla({ estado: 'error' });
      return;
    }
    setPantalla({
      estado: 'listo',
      documentos: cuenta.data,
      // Si la lectura del prestador falla NO se degrada a lista vacía:
      // mostraría «no tenés nada» y volvería a pedir lo ya entregado —
      // el defecto que este cableado vino a curar (L-139).
      heredados: prestador.ok ? prestador.data.filter(prestadorHecho) : [],
    });
  }, [cuentaComercialId, prestadorId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  /* 🔴 S99-C · R42 — LA PUERTA DEJA DE ESTAR RE-DIBUJADA.
     Acá vivía la captura entera: `capturarConCamara`/`capturarDeGaleria`
     detrás de una `<Hoja>` con dos botones escrita a mano. **La anatomía
     era ya la canónica** (dos `Boton bloque` + la X), así que migrar a
     `HojaCaptura` NO cambia la forma — cambia lo que no se ve: la pieza
     trae el **cerrojo sincrónico contra el doble tap**, que ninguna de
     las copias a mano tenía. *Dos toques antes del próximo render
     lanzaban dos pickers.* Es cura, no swap.

     Lo que esta función conserva es lo suyo: qué hacer con la foto ya
     capturada. La voz del permiso denegado la sigue diciendo la PANTALLA
     (contrato ① de la pieza), y las opciones —1600/0.8, medidas para un
     documento— pasan derecho (contrato ②). */
  async function subir(tipo: TipoDocumentoCuenta, uri: string) {
    setSubiendo(true);
    const res = await subirDocumentoCuenta({
      uri,
      cuentaComercialId,
      tipo,
      nombre: t(CLAVE_TIPO[tipo]),
    });
    setSubiendo(false);

    if (!res.ok) {
      // La voz sale de la CAUSA — «revisá tu conexión» queda RESERVADO a
      // la red (precedente S47), jamás como genérico de cualquier fallo.
      const voz =
        res.causa === 'red'
          ? t('alta.paso3.errorRed')
          : res.causa === 'lectura'
            ? t('alta.paso3.errorLectura')
            : res.mensaje;
      mostrar({ texto: voz, variante: 'error' });
      return;
    }
    mostrar({ texto: t('alta.paso3.subidoExito'), variante: 'exito' });
    void cargar();
    alSubir();
  }

  if (pantalla.estado === 'cargando') {
    return (
      <EsqueletoGrupo>
        <View style={{ gap: spacing[4] }}>
          <Esqueleto ancho="55%" alto={28} />
          <Esqueleto alto={72} />
          <Esqueleto alto={72} />
        </View>
      </EsqueletoGrupo>
    );
  }

  if (pantalla.estado === 'error') {
    return (
      <EstadoVacio
        registro="seccion"
        titulo={t('alta.errorTitulo')}
        descripcion={t('alta.errorVoz')}
        accion={
          <Boton variante="compacto" etiqueta={t('alta.reintentar')} onPress={() => void cargar()} />
        }
      />
    );
  }

  const porTipo = new Map(
    pantalla.documentos.filter(cuentaHecho).map((d) => [d.tipo, d] as const),
  );
  const hayHeredados = pantalla.heredados.length > 0;

  return (
    <View style={{ gap: spacing[8] }}>
      <Entrada orden={0}>
        <View style={{ gap: spacing[2] }}>
          <Texto variante="titulo">{t('alta.paso3.titulo')}</Texto>
          <Texto variante="apoyo">{t('alta.paso3.bajada')}</Texto>
        </View>
      </Entrada>

      <Entrada orden={1}>
        <Tarjeta elevacion="reposo" relleno="ninguno">
          <View>
            {TIPOS.map((tipo, i) => {
              const doc = porTipo.get(tipo);
              return (
                <View key={tipo}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={t(CLAVE_TIPO[tipo])}
                    fin={
                      doc === undefined ? (
                        <Boton
                          variante="compacto"
                          cargando={subiendo}
                          etiqueta={t('alta.paso3.subir')}
                          onPress={() => setEligiendo(tipo)}
                        />
                      ) : (
                        // El estado del veredicto — el chip DICE de quién
                        // es el turno. `pendiente` ya no es trabajo suyo.
                        <Insignia
                          estado={
                            doc.estado === 'aprobado'
                              ? 'alDia'
                              : doc.estado === 'rechazado'
                                ? 'atencion'
                                : 'info'
                          }
                          etiqueta={
                            doc.estado === 'aprobado'
                              ? t('alta.paso3.aprobado')
                              : doc.estado === 'rechazado'
                                ? t('alta.paso3.rechazado')
                                : t('alta.paso3.enRevision')
                          }
                          tamaño="sm"
                        />
                      )
                    }
                  />
                </View>
              );
            })}
          </View>
        </Tarjeta>
      </Entrada>

      {/* Lo que YA contamos del perfil profesional. No se pide de nuevo:
          la puerta no pregunta lo que ya sabe. */}
      {hayHeredados ? (
        <Entrada orden={2}>
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('alta.paso3.heredadosTitulo')}</Texto>
            <Texto variante="apoyo">{t('alta.paso3.heredadosVoz')}</Texto>
            <Tarjeta elevacion="reposo" relleno="ninguno">
              <View>
                {pantalla.heredados.map((d, i) => (
                  <View key={d.id}>
                    {i > 0 ? <Separador /> : null}
                    <Celda
                      titulo={d.nombre}
                      fin={
                        <Insignia
                          estado={d.estado === 'aprobado' ? 'alDia' : 'info'}
                          etiqueta={
                            d.estado === 'aprobado'
                              ? t('alta.paso3.aprobado')
                              : t('alta.paso3.enRevision')
                          }
                          tamaño="sm"
                        />
                      }
                    />
                  </View>
                ))}
              </View>
            </Tarjeta>
          </View>
        </Entrada>
      ) : null}

      <HojaCaptura
        visible={eligiendo !== null}
        titulo={t('alta.paso3.elegirArchivo')}
        onCerrar={() => setEligiendo(null)}
        onFoto={(foto) => {
          if (eligiendo !== null) void subir(eligiendo, foto.uri);
        }}
        /* Cancelar NO es un error y no dice nada. Permiso denegado SÍ
           habla: el usuario tocó una acción y no pasó nada — el silencio
           ahí se lee como que la app está rota (Ley 13). */
        onPermisoDenegado={() =>
          mostrar({ texto: t('alta.paso3.permisoDenegado'), variante: 'neutro' })
        }
        opciones={{ redimensionarA: 1600, calidad: 0.8 }}
      />
    </View>
  );
}
