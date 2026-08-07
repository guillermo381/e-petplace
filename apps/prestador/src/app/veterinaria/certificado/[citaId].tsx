// ─────────────────────────────────────────────────────────────────────
// EMITIR UN CERTIFICADO DE SALUD — /veterinaria/certificado/[citaId] (S90-D)
//
// LA PIEZA QUE NO EXISTÍA. Los otros cuatro papeles del producto se arman con
// datos que YA ESTÁN; éste no: certifica un JUICIO PROFESIONAL («esta mascota
// está apta») que hoy nadie captura. Esta pantalla es esa captura.
//
// TESIS: el vet DECLARA con sus palabras y elige PARA QUÉ; el papel dice
//   exactamente eso y nada más.
// FIRMA: la declaración es un campo VACÍO que espera al profesional — la casa
//   no le pone las palabras en la boca (comportamiento, no color).
// CHANEL: no hay «apto/no apto» de un toque, no hay resumen autogenerado del
//   expediente, no hay checklist de síntomas. Todo eso se veía bien y todo
//   eso habría fabricado una firma que nadie dio.
//
// ── LAS TRES LEYES QUE GOBIERNAN ESTA PANTALLA ────────────────────────────
// ① LO EMITE UNA PERSONA CON MATRÍCULA, jamás un negocio. A diferencia de la
//    receta (que cae al negocio como fallback), acá NO hay fallback: un
//    certificado de aptitud firmado por «el negocio» no certifica nada.
// ② EL VET DECLARA, EL MOTOR NO INFIERE. Prohibido derivar «apto» de la
//    ausencia de condiciones en el expediente: un silencio clínico no es un
//    diagnóstico.
// ③ EL ALCANCE SE ELIGE Y SE IMPRIME. Un certificado sin alcance promete todo.
//
// ── LA DISTINCIÓN QUE ORDENA LOS DOS GATES (L-178) ────────────────────────
// · Sin capacidad clínica (recepción) → la entrada NO EXISTE aguas arriba
//   (gate de AUSENCIA, patrón D-525). Acá se rebota con voz por si se llega
//   por deep link.
// · CON capacidad clínica y SIN matrícula → NO es un permiso denegado: es un
//   DATO QUE FALTA, y se dice cuál y dónde se carga. Disfrazarlo de «no
//   podés» mandaría al vet a pedirle permiso a alguien por un campo vacío.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  MarcaDeAgua,
  SelectorOpcion,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  emitirCertificadoSalud,
  obtenerCertificadosMascota,
  obtenerMiFirmaClinica,
  obtenerMiPrestador,
  obtenerPerfilMascota,
  puedoAtenderClinico,
  urlDocumento,
  type AlcanceCertificado,
  type CertificadoEmitido,
} from '@epetplace/api';

import { EvitaTeclado } from '@/components/evita-teclado';
import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

/** Los cuatro alcances. Los tres primeros miran HACIA ADELANTE (prometen que
 *  la mascota puede hacer algo); `constancia` mira hacia atrás. Esa distinción
 *  es la que decide el gate de memorial, y por eso vive acá y no en un if. */
const ALCANCES: { codigo: AlcanceCertificado; prospectivo: boolean; clave: ClaveAlcance }[] = [
  { codigo: 'viaje', prospectivo: true, clave: 'certificado.alcance_viaje' },
  { codigo: 'hospedaje', prospectivo: true, clave: 'certificado.alcance_hospedaje' },
  { codigo: 'guarderia', prospectivo: true, clave: 'certificado.alcance_guarderia' },
  { codigo: 'constancia', prospectivo: false, clave: 'certificado.alcance_constancia' },
];

type ClaveAlcance =
  | 'certificado.alcance_viaje'
  | 'certificado.alcance_hospedaje'
  | 'certificado.alcance_guarderia'
  | 'certificado.alcance_constancia';

/** Las claves EXHAUSTIVAS por alcance: un alcance nuevo sin voz rompe el
 *  typecheck en vez de imprimir su código crudo en un papel. */
const CLAVE_POR_ALCANCE: Record<AlcanceCertificado, ClaveAlcance> = {
  viaje: 'certificado.alcance_viaje',
  hospedaje: 'certificado.alcance_hospedaje',
  guarderia: 'certificado.alcance_guarderia',
  constancia: 'certificado.alcance_constancia',
};

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'sin_permiso' }
  | {
      estado: 'listo';
      nombre: string;
      /** El momento vital SE CONSULTA ANTES DE OFRECER, no después: el
       *  apagado es estructural. */
      viva: boolean;
      /** El dato que falta para poder firmar (jamás un permiso). */
      faltaMatricula: boolean;
      emitidos: CertificadoEmitido[];
    };

export default function EmitirCertificado() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTraduccion();
  const { mostrar: mostrarAviso } = useAviso();
  const { citaId = '', mascotaId = '' } = useLocalSearchParams<{
    citaId: string;
    mascotaId: string;
  }>();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [alcance, setAlcance] = useState<AlcanceCertificado | undefined>(undefined);
  const [declaracion, setDeclaracion] = useState('');
  const [emitiendo, setEmitiendo] = useState(false);

  const cargar = useCallback(async () => {
    setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const pr = await obtenerMiPrestador();
    if (!pr.ok) {
      setPantalla({ estado: 'error', mensaje: pr.mensaje });
      return;
    }
    // Gate de ROL: emitir un certificado es acto clínico — se gatea por CHIP,
    // no por membresía (ley madre S76). Ante la duda, NO se ofrece.
    if (!(await puedoAtenderClinico(pr.data.id))) {
      setPantalla({ estado: 'sin_permiso' });
      return;
    }

    const perfil = await obtenerPerfilMascota(mascotaId);
    if (!perfil.ok) {
      setPantalla({ estado: 'error', mensaje: perfil.mensaje });
      return;
    }
    // La firma de quien mira, ANTES de ofrecer: si falta la matrícula hay que
    // decirlo acá, no después de que el vet escriba su declaración entera.
    const firma = await obtenerMiFirmaClinica(pr.data.id);
    const previos = await obtenerCertificadosMascota(mascotaId);

    setPantalla({
      estado: 'listo',
      nombre: perfil.data.mascota.nombre,
      // El momento vital SE CONSULTA ANTES DE OFRECER. `estado_vida` es
      // nullable en el contrato: null se trata como NO viva a propósito —
      // ante la duda no se ofrece una promesa hacia adelante.
      viva: perfil.data.mascota.estado_vida === 'activa',
      // Si el lector falla o no hay vínculo, se trata como falta: un botón
      // vivo sobre una firma que no se pudo confirmar promete de más.
      faltaMatricula: !firma.ok || firma.data === null || firma.data.matricula === null,
      emitidos: previos.ok ? previos.data : [],
    });
  }, [mascotaId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const abrirPapel = async (certificadoId: string) => {
    const r = await urlDocumento(mascotaId, 'certificado_salud', certificadoId);
    if (r.ok) await Linking.openURL(r.data);
    else mostrarAviso({ texto: r.mensaje, variante: 'error' });
  };

  const emitir = async () => {
    if (!alcance || declaracion.trim().length === 0) return;
    setEmitiendo(true);
    const r = await emitirCertificadoSalud({
      mascotaId,
      alcance,
      declaracion: declaracion.trim(),
      citaId: citaId || null,
    });
    setEmitiendo(false);
    if (!r.ok) {
      mostrarAviso({ texto: r.mensaje, variante: 'error' });
      return;
    }
    // Emitido: el papel se abre en el acto. El certificado ya quedó guardado
    // (es INMUTABLE), así que si el visor falla el documento no se perdió —
    // vive en la lista de abajo.
    setDeclaracion('');
    setAlcance(undefined);
    await cargar();
    await abrirPapel(r.data.certificadoId);
  };

  const listo = pantalla.estado === 'listo' ? pantalla : null;
  // Sin matrícula NO se emite: el botón no puede estar vivo. Y la razón se
  // DICE (abajo), jamás se deja adivinando.
  const puedeEmitir =
    listo !== null &&
    !listo.faltaMatricula &&
    alcance !== undefined &&
    declaracion.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('certificado.titulo')}
        atras
        onAtras={() => router.back()}
      />
      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            gap: spacing[4],
            paddingBottom: insets.bottom + spacing[8],
          }}
        >
          {pantalla.estado === 'cargando' && (
            <Tarjeta elevacion="plana">
              <EsqueletoGrupo>
                <Esqueleto forma="linea" ancho="60%" />
                <Esqueleto forma="linea" ancho="40%" />
              </EsqueletoGrupo>
            </Tarjeta>
          )}

          {pantalla.estado === 'error' && (
            <Tarjeta tinte="danger" relleno="amplio">
              <View style={{ gap: spacing[3] }}>
                <Texto variante="cuerpo">{pantalla.mensaje}</Texto>
                <View style={{ alignSelf: 'flex-start' }}>
                  <Boton
                    variante="secundario"
                    tamaño="sm"
                    etiqueta={t('agenda.reintentar')}
                    onPress={() => void cargar()}
                  />
                </View>
              </View>
            </Tarjeta>
          )}

          {/* Deep link de alguien sin chip clínico: se dice lo que es —
              un rol que no emite — y no se disfraza de otra cosa. */}
          {pantalla.estado === 'sin_permiso' && (
            <EstadoVacio
              registro="pantalla"
              titulo={t('certificado.sinPermisoTitulo')}
              descripcion={t('certificado.sinPermisoDetalle')}
            />
          )}

          {listo && (
            <>
              {/* ① LO QUE ESTE PAPEL **NO** ES — antes de que el vet escriba
                  nada. Un certificado que se deja confundir con el oficial le
                  arruina un viaje a una familia en un mostrador de frontera,
                  y quien lo firma tiene que saber qué está firmando. */}
              <Tarjeta elevacion="reposo">
                <View style={{ gap: spacing[2] }}>
                  <Texto variante="seccion">{t('certificado.limiteTitulo')}</Texto>
                  <Texto variante="apoyo">{t('certificado.limiteDetalle')}</Texto>
                </View>
              </Tarjeta>

              {/* ② EL DATO QUE FALTA — jamás un permiso denegado (L-178). */}
              {listo.faltaMatricula && (
                <Tarjeta tinte="danger" relleno="amplio">
                  <View style={{ gap: spacing[2] }}>
                    <Texto variante="seccion">{t('certificado.faltaMatriculaTitulo')}</Texto>
                    <Texto variante="apoyo">{t('certificado.faltaMatriculaDetalle')}</Texto>
                  </View>
                </Tarjeta>
              )}

              {/* ③ EL ALCANCE. El apagado de memorial es ESTRUCTURAL: los
                  alcances que no aplican NO SE MONTAN — no se dibujan
                  apagados ni con candado. Y se dice por qué, porque esto no
                  es un permiso: es el estado de la mascota. */}
              <View style={{ gap: spacing[2] }}>
                <SelectorOpcion
                  etiqueta={t('certificado.alcanceLabel')}
                  disposicion="columnas"
                  opciones={ALCANCES.filter((a) => listo.viva || !a.prospectivo).map((a) => ({
                    codigo: a.codigo,
                    etiqueta: t(a.clave),
                  }))}
                  seleccionada={alcance}
                  onSelect={(c) => setAlcance(c as AlcanceCertificado)}
                />
                {!listo.viva && (
                  <Texto variante="apoyo">
                    {t('certificado.memorialDetalle', { nombre: listo.nombre })}
                  </Texto>
                )}
              </View>

              {/* ④ LA DECLARACIÓN — el campo nace VACÍO y se queda vacío hasta
                  que el profesional escriba. El placeholder guía la FORMA
                  («qué examinaste, qué concluís»), jamás el VEREDICTO: un
                  ejemplo con «apta» adentro sería el motor poniéndole las
                  palabras en la boca por la puerta de atrás. */}
              <View style={{ gap: spacing[2] }}>
                <Campo
                  label={t('certificado.declaracionLabel')}
                  placeholder={t('certificado.declaracionPlaceholder')}
                  value={declaracion}
                  onChangeText={setDeclaracion}
                  multilinea={6}
                />
                <Texto variante="apoyo">{t('certificado.declaracionAyuda')}</Texto>
              </View>

              {/* El botón apagado DICE QUÉ FALTA, siempre (S73-B, Ley 23). */}
              {!emitiendo && !puedeEmitir && (
                <View style={{ gap: spacing[1] }}>
                  {listo.faltaMatricula && (
                    <Texto variante="apoyo">{t('certificado.faltaMatriculaCorto')}</Texto>
                  )}
                  {alcance === undefined && (
                    <Texto variante="apoyo">{t('certificado.faltaAlcance')}</Texto>
                  )}
                  {declaracion.trim().length === 0 && (
                    <Texto variante="apoyo">{t('certificado.faltaDeclaracion')}</Texto>
                  )}
                </View>
              )}
              <Boton
                variante="primario"
                bloque
                etiqueta={t('certificado.emitir')}
                cargando={emitiendo}
                deshabilitado={!puedeEmitir}
                onPress={() => void emitir()}
              />

              {/* ⑤ LA RELECTURA. Un certificado es INMUTABLE: corregir es
                  emitir otro. Por eso la lista crece y nada se edita — y por
                  eso cada fila se puede volver a abrir. */}
              {listo.emitidos.length > 0 && (
                <View style={{ gap: spacing[2] }}>
                  <Texto variante="seccion">
                    {t('certificado.emitidosTitulo', { nombre: listo.nombre })}
                  </Texto>
                  <Tarjeta elevacion="reposo" relleno="ninguno">
                    {listo.emitidos.map((c, i) => (
                      <View key={c.id}>
                        {i > 0 && <Separador />}
                        <Celda
                          interactiva
                          accessibilityRole="button"
                          titulo={t(CLAVE_POR_ALCANCE[c.alcance])}
                          subtitulo={t('certificado.emitidoPor', {
                            nombre: c.emisorNombre,
                            matricula: c.emisorMatricula,
                          })}
                          metadataMono={c.fechaExamen}
                          fin={
                            <Insignia
                              estado="info"
                              etiqueta={t('certificado.abrir')}
                              tamaño="sm"
                            />
                          }
                          onPress={() => void abrirPapel(c.id)}
                        />
                      </View>
                    ))}
                  </Tarjeta>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
