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
  Hoja,
  Insignia,
  Separador,
  Tarjeta,
  Texto,
  capturarConCamara,
  capturarDeGaleria,
  spacing,
  useAviso,
} from '@epetplace/ui';
import { listarDocumentosCuenta, type DocumentoCuenta } from '@epetplace/api';

import { subirDocumentoCuenta, type TipoDocumentoCuenta } from '@/lib/subir-documento';
import { useTraduccion } from '@/i18n';

/** Claves LITERALES — el vocabulario de tipos es del motor. */
const CLAVE_TIPO = {
  cedula: 'alta.paso3.tipoCedula',
  ruc: 'alta.paso3.tipoRuc',
  permiso_funcionamiento: 'alta.paso3.tipoPermiso',
} as const satisfies Record<TipoDocumentoCuenta, string>;

const TIPOS: TipoDocumentoCuenta[] = ['cedula', 'ruc', 'permiso_funcionamiento'];

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; documentos: DocumentoCuenta[] };

export interface PasoDocumentosProps {
  cuentaComercialId: string;
  alSubir: () => void;
}

export function PasoDocumentos({ cuentaComercialId, alSubir }: PasoDocumentosProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [eligiendo, setEligiendo] = useState<TipoDocumentoCuenta | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    const res = await listarDocumentosCuenta(cuentaComercialId);
    if (!res.ok) {
      setPantalla({ estado: 'error' });
      return;
    }
    setPantalla({ estado: 'listo', documentos: res.data });
  }, [cuentaComercialId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  async function subir(tipo: TipoDocumentoCuenta, camara: boolean) {
    setEligiendo(null);
    const captura = camara
      ? await capturarConCamara({ redimensionarA: 1600, calidad: 0.8 })
      : await capturarDeGaleria({ redimensionarA: 1600, calidad: 0.8 });
    // Cancelar NO es un error y no dice nada. Permiso denegado SÍ habla:
    // el usuario tocó una acción y no pasó nada — el silencio ahí se lee
    // como que la app está rota (Ley 13).
    if (captura.tipo === 'permiso_denegado') {
      mostrar({ texto: t('alta.paso3.permisoDenegado'), variante: 'neutro' });
      return;
    }
    if (captura.tipo !== 'foto') return;

    setSubiendo(true);
    const res = await subirDocumentoCuenta({
      uri: captura.foto.uri,
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

  const porTipo = new Map(pantalla.documentos.map((d) => [d.tipo, d] as const));

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

      <Hoja
        visible={eligiendo !== null}
        onCerrar={() => setEligiendo(null)}
        titulo={t('alta.paso3.elegirArchivo')}
        altura="media"
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('alta.paso3.subir')}
            onPress={() => {
              if (eligiendo !== null) void subir(eligiendo, true);
            }}
          />
          <Boton
            variante="compacto"
            bloque
            etiqueta={t('alta.paso3.elegirArchivo')}
            onPress={() => {
              if (eligiendo !== null) void subir(eligiendo, false);
            }}
          />
        </View>
      </Hoja>
    </View>
  );
}
