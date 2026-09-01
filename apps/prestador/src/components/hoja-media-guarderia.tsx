/**
 * EL DURANTE EN LAS INSTALACIONES — una foto, varias familias (S111-C, ⑧).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO: *«Son las once y están todos en el patio. Saco el teléfono,
 * una foto, y ahí mismo toco quiénes salen en ella — Thor, Luna y Kira. Una
 * foto, tres familias, un solo toque de envío.»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS:** *lo que pasó en el patio llega a las familias sin sacarte de él.*
 *
 * **FIRMA:** el orden — **primero se dispara, después se etiqueta.** El hook lo
 * tenía diseñado así desde S107 (`capturarFoto` NO publica) y acá se usa tal
 * cual: *pedir los animales antes de la foto haría elegir a ciegas quién va a
 * salir en una foto que todavía no existe.*
 *
 * **CHANEL:** sin previsualización grande ni edición. *El cuidador está con los
 * animales, no con el teléfono* — la foto se ve en la miniatura y se descarta
 * si salió mal.
 *
 * ── 🔴 MULTI-DESTINO ES **UN ENVÍO**, NO N ENVÍOS ───────────────────────
 * `publicarCaptura({ mascotaIds: [a, b, c] })` publica **una sola vez** con tres
 * etiquetas — el motor lo resuelve así desde S107 (`p_mascota_ids`). *Tres
 * llamadas con un id cada una serían tres fotos distintas en la base y tres
 * avisos, que es exactamente lo que la regla de agrupación prohíbe.*
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * · **No avisa.** Los avisos de contenido van **agrupados** y los compone el
 *   digest del servidor (`encolar_resumen_media_guarderia`, cron cada 15 min).
 *   *La forma más segura de no mandar ocho push por ocho fotos es no tener
 *   dónde escribirlas* — esta pantalla no compone ninguna voz.
 * · **No graba clips todavía.** Medido: la infra compartida tiene
 *   `capturarVideoDeGaleria` pero **no captura video con CÁMARA**
 *   (`capturarConCamara` no toma `mediaTypes` y su `normalizar` siempre
 *   devuelve `foto`). Pedido a B; la cola ya acepta clips con su techo de 30 s.
 * · **No pone chips de comportamiento todavía** — y **la razón que escribí
 *   primero era falsa**: dije que el vocabulario del adiestramiento no servía
 *   porque «describe avances de un currículum». **Medido: `cat_conductas_bitacora`
 *   es la bitácora UNIVERSAL** y sus códigos son exactamente *«cómo se portó»*
 *   (`durmio_tranquilo`, `comio_normal`, `se_escondio`…). *Miré la tabla de al
 *   lado — el currículum vive en otras dos.*
 *
 *   ⇒ **El vocabulario SIRVE.** Lo que falta es el **escritor del prestador**
 *   (procedencia `declarado_por_prestador`, colgando del acto y no de la
 *   familia), y está en la cola de A. *Frené por la razón correcta —`D-976`, no
 *   trasplantar un criterio— sobre un hecho falso: la disciplina valía, la
 *   premisa no.*
 */

import { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  EvidenciaFoto,
  type EvidenciaFotoEstado,
  Hoja,
  HojaScroll,
  SelectorOpcion,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import type { EstadiaDelDia } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { cablearPublicarMedia } from '@/lib/guarderia-cableado';
import { reglasSegunLugar, useCapturaMedia, type ReglaEncuadre } from '@/lib/use-captura-media';

export interface HojaMediaGuarderiaProps {
  /** `false` = la hoja no se monta. */
  visible: boolean;
  prestadorId: string;
  /** `YYYY-MM-DD` local del lugar. */
  fecha: string;
  /** 🔴 **El universo de etiquetado es el ROSTER DEL DÍA** (firma ①): sólo se
   *  puede etiquetar a animales que hoy están acá. *Una lista de todas las
   *  mascotas de la casa dejaría mandar la foto de un patio a una familia cuyo
   *  animal no estuvo.* */
  presentes: EstadiaDelDia[];
  onCerrar: () => void;
}

export function HojaMediaGuarderia({
  visible,
  prestadorId,
  fecha,
  presentes,
  onCerrar,
}: HojaMediaGuarderiaProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [capturada, setCapturada] = useState<string | null>(null);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  /** Lo enviado en ESTA sesión de la hoja: id local + uri, para que la
   *  miniatura no dependa de la cola (misma lección que la puerta del acta:
   *  salir de la cola es el ÉXITO, no la desaparición). */
  const [enviadas, setEnviadas] = useState<{ id: string; uri: string }[]>([]);

  const publicar = useMemo(() => cablearPublicarMedia(prestadorId), [prestadorId]);
  const captura = useCapturaMedia({
    fecha,
    prestadorId,
    publicar,
    bucketFoto: 'guarderia-media',
    bucketClip: 'guarderia-media',
  });

  if (!visible) return null;

  const estadoDe = (id: string): EvidenciaFotoEstado => {
    const enCola = captura.pendientes.find((p) => p.id === id);
    if (enCola === undefined) return 'subida';
    return enCola.estado === 'error' ? 'error' : 'subiendo';
  };

  /* 🔴 `instalaciones`, no `domicilio`: acá NO rige la regla del primer plano
     —no hay fachada que proteger— y **una guía que menciona lo que no puede
     pasar enseña a ignorar la guía**. Las otras tres rigen siempre. */
  const vozRegla = (r: ReglaEncuadre): string =>
    t(`mediaGuarderia.encuadre_${r}` as 'mediaGuarderia.encuadre_animal_en_cuadro');

  const sacarFoto = async () => {
    const r = await captura.capturarFoto();
    if (r.estado === 'permiso_denegado') {
      mostrar({ variante: 'error', texto: t('mediaGuarderia.sinPermiso') });
      return;
    }
    if (r.estado !== 'capturada') return;
    setCapturada(r.uri);
  };

  const enviar = async () => {
    if (capturada === null || elegidas.length === 0 || enviando) return;
    setEnviando(true);
    try {
      /* UNA llamada con TODAS las etiquetas. Ver el encabezado. */
      const id = await captura.publicarCaptura({
        uri: capturada,
        tipo: 'foto',
        mascotaIds: elegidas,
      });
      setEnviadas((e) => [...e, { id, uri: capturada }]);
      /* Se limpia para la siguiente: la hoja queda lista para otra foto sin
         cerrarse — el cuidador saca varias seguidas. */
      setCapturada(null);
      setElegidas([]);
    } catch {
      mostrar({ variante: 'error', texto: t('mediaGuarderia.noSeGuardo') });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Hoja visible titulo={t('mediaGuarderia.titulo')} onCerrar={onCerrar}>
      <HojaScroll contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[4] }}>
        {/* LA GUÍA DE ENCUADRE — ley de captura (criterio §5), antes del
            obturador y no después. */}
        <View style={{ gap: spacing[1] }}>
          {reglasSegunLugar('instalaciones').map((r) => (
            <Texto key={r} variante="apoyo">
              {vozRegla(r)}
            </Texto>
          ))}
        </View>

        {/* LO YA ENVIADO en esta sesión, con su estado. */}
        {enviadas.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {enviadas.map((f) => (
              <EvidenciaFoto.Thumbnail
                key={f.id}
                uri={f.uri}
                estado={estadoDe(f.id)}
                onReintentar={() => void captura.reintentarPendiente(f.id)}
              />
            ))}
          </View>
        ) : null}

        {/* EL OBTURADOR — o la foto recién sacada esperando sus etiquetas. */}
        {capturada === null ? (
          <View style={{ alignSelf: 'flex-start' }}>
            <EvidenciaFoto.Capturar onFoto={() => void sacarFoto()} deshabilitado={enviando} />
          </View>
        ) : (
          <View style={{ gap: spacing[3] }}>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <EvidenciaFoto.Thumbnail uri={capturada} estado="subida" />
              <View style={{ justifyContent: 'center' }}>
                {/* Descartar existe y es de primera clase: el encuadre manda
                    descartar lo incidental ANTES de enviar, y sin este control
                    esa regla no se puede cumplir. */}
                <Boton
                  variante="ghost"
                  tamaño="sm"
                  etiqueta={t('mediaGuarderia.descartar')}
                  onPress={() => {
                    setCapturada(null);
                    setElegidas([]);
                  }}
                />
              </View>
            </View>

            {/* QUIÉNES SALEN — multi-selección sobre el roster del día. */}
            <SelectorOpcion
              acento="oficio"
              disposicion="columnas"
              multiple
              etiqueta={t('mediaGuarderia.quienesSalen')}
              opciones={presentes.map((p) => ({
                codigo: p.mascotaId,
                etiqueta: p.mascotaNombre,
              }))}
              seleccionadas={elegidas}
              onSelect={(codigo) =>
                setElegidas((prev) =>
                  prev.includes(codigo) ? prev.filter((x) => x !== codigo) : [...prev, codigo],
                )
              }
            />
          </View>
        )}
      </HojaScroll>

      {capturada !== null ? (
        <View style={{ gap: spacing[2], paddingTop: spacing[3] }}>
          {elegidas.length === 0 ? (
            <Texto variante="apoyo" color="tertiary">
              {t('mediaGuarderia.faltaElegir')}
            </Texto>
          ) : null}
          <Boton
            variante="primario"
            etiqueta={t('mediaGuarderia.enviar', { n: elegidas.length })}
            deshabilitado={elegidas.length === 0}
            cargando={enviando}
            onPress={() => void enviar()}
          />
        </View>
      ) : null}
    </Hoja>
  );
}
