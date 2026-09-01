/**
 * LA PUERTA DEL ACTA — lo que pasó en la puerta, con su hora y sus fotos (S110-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO, en voz del founder: *«En la puerta de Thor toco su tarjeta.
 * La hoja del acta sube desde abajo. Adentro: Thor con su foto, el carnet para
 * mirar, el obturador para sus fotos de estado, y qué viaja con él. Saco dos
 * fotos, anoto la correa, y toco "Subió".»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS (Ley 14):** *lo que pasó en la puerta quedó registrado — con su hora,
 * sus fotos y quién lo dijo.*
 *
 * **FIRMA (Ley 15):** el obturador con su guía de encuadre. Es lo único que la
 * pantalla pide con insistencia, porque es lo único que el acta no puede
 * reconstruir después: *«sin foto de entrada, la pregunta de cuándo apareció la
 * lesión no tiene respuesta»* (criterio §4).
 *
 * **CHANEL (Ley 16):** se quitó el resumen de la estadía. La hoja se abre desde
 * la tarjeta del animal, que ya dice nombre, sala y dirección — repetirlo acá
 * es el elemento que hace doble turno (Ley 17.6). Queda sólo la cara y el
 * nombre, que son la confirmación de que se está por firmar el animal correcto.
 *
 * ── 🔴 EL ACTO ENTRA POR PROP, Y ES LA DECISIÓN DE DISEÑO DE ESTA PIEZA ──
 * `alLevantar` y `etiquetaActo` los inyecta la pantalla. **La hoja no sabe qué
 * hace el acto** — hoy levanta el acta en la cola local; el día que exista el
 * acto único de A (`marcarABordo`: acta + `reservada → recogida_en_curso` en
 * una transacción) se inyecta ése y **esta pieza no cambia una línea**.
 *
 * *Y no es prolijidad: es lo que hace IMPOSIBLE que el botón prometa lo que el
 * acto no hace.* Si la etiqueta viviera acá, «Subió» seguiría escrito el día
 * que el acto sólo levante el acta — y una pantalla que dice «Subió» sobre un
 * animal que el motor tiene en `reservada` es exactamente la clase de mentira
 * que ningún typecheck ve. **Quien inyecta el acto es quien escribe su
 * promesa** (L-222: el estado malo, inexpresable).
 *
 * ── LO QUE ESTA PIEZA NO HACE, Y NO ES RECORTE ──────────────────────────
 * 🔴 **No mueve estados.** El estado es evento de servidor y la UI lo LEE.
 * 🔴 **No dice una palabra de reparto de responsabilidad.** `LETRA_GUARDERIA`
 *    §3 está frenada por el abogado; el acta REGISTRA, jamás adjudica — la
 *    misma ley que `ActaDeEntrega` se puso a sí misma. Todo texto entra por el
 *    diccionario y lo lee el founder aparte.
 * 🔴 **No pide la conformidad del dueño.** Firma ⑥: la conformidad es SU
 *    sesión, no su dedo — *cualquiera garabatea una firma en el teléfono del
 *    cuidador; una sesión propia, no.* Acá sólo se dice que falta, y **no
 *    frena la recogida**.
 *
 * ── LO QUE FALTA Y SE DECLARA (no se fabrica) ───────────────────────────
 * ⚠️ **El microchip.** El criterio §4 pide *«identificación y microchip/
 * REMETFU»* en el acta, y `EstadiaDelDia` **no lo proyecta**. No se inventa un
 * campo ni se deja un hueco con cara de dato: la identidad que hay hoy es la
 * cara y el nombre. *Un acta que muestra un microchip vacío es peor que una
 * que no lo muestra: la primera afirma que se verificó.*
 * ⚠️ **«Qué viaja con él» vive FUERA de `ActaDeEntrega`**, en un `Campo` de
 * esta hoja: la pieza de B cubre checklist, media y observaciones, y `objetos`
 * es texto libre que su contrato no tiene. Se monta al lado en vez de
 * deformar la pieza — y queda como pedido a B, no como copia.
 */

import { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  ActaDeEntrega,
  Boton,
  Campo,
  EvidenciaFoto,
  type EvidenciaFotoEstado,
  Hoja,
  HojaScroll,
  Texto,
  AvatarMascota,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { caraDeMascota, type EstadiaDelDia } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { cablearLevantarActa, cablearPublicarMedia } from '@/lib/guarderia-cableado';
import {
  reglasSegunLugar,
  useCapturaMedia,
  type LugarDeCaptura,
  type ReglaEncuadre,
} from '@/lib/use-captura-media';
import type { DireccionActa } from '@/lib/cola-actas';

/** Lo que el acta lleva. Espejo EXACTO de lo que el motor persiste — ni un
 *  campo más: `guarderia_actas` guarda carnet, objetos, observaciones y su
 *  hora, y las fotos van por su propia cola. */
export interface DatosDelActa {
  direccion: DireccionActa;
  carnetVerificado: boolean;
  objetos?: string;
  observaciones?: string;
  /** ids LOCALES de la cola de media. Sin al menos uno, no hay acta. */
  fotosLocales: string[];
}

export interface HojaActaGuarderiaProps {
  /** `null` = la hoja no se monta. Quien la abre decide cuándo. */
  estadia: EstadiaDelDia | null;
  direccion: DireccionActa;
  prestadorId: string;
  /** El día de la estadía, `YYYY-MM-DD` local del lugar. */
  fecha: string;
  /** La cara ya resuelta por la pantalla (peldaño de la escalera de la casa). */
  cara: string | null;
  /**
   * 🔴 Dónde se dispara. Decide QUÉ REGLAS DE ENCUADRE se guían, y no es
   * cosmético: en el domicilio rige el primer plano —la fachada revela el
   * domicilio asociado a una identidad (criterio §5.3)—; en las instalaciones
   * esa regla no aplica, y *una guía que menciona lo que no puede pasar enseña
   * a ignorar la guía.*
   */
  lugar: LugarDeCaptura;
  onCerrar: () => void;
  /**
   * EL ACTO — **el único punto de enchufe**. Ver el encabezado.
   *
   * Ausente: el acta se levanta en la **cola local**, con la hora de la puerta,
   * y viaja sola cuando haya señal. Presente: se usa ÉSTE **en vez de** la cola
   * — es donde entra el acto único de A (`marcarABordo`), que levanta el acta y
   * mueve el estado en la misma transacción.
   *
   * 🔴 Nunca los dos: un acta que se levanta por dos caminos se duplica o se
   * contradice, y el motor no tiene a quién preguntarle cuál pasó.
   *
   * Lanza si falló — la hoja muestra el aviso y NO se cierra: lo escrito sigue
   * ahí y se puede reintentar sin volver a sacar las fotos.
   */
  alLevantar?: (datos: DatosDelActa) => Promise<void>;
  /** La promesa del acto, en la voz de quien lo inyectó. */
  etiquetaActo: string;
  /** Se llama SOLO tras un acto exitoso: quien la monta re-lee. */
  onLevantada: () => void;
}

export function HojaActaGuarderia({
  estadia,
  direccion,
  prestadorId,
  fecha,
  cara,
  lugar,
  onCerrar,
  alLevantar,
  etiquetaActo,
  onLevantada,
}: HojaActaGuarderiaProps) {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const { mostrar } = useAviso();

  const [carnet, setCarnet] = useState(false);
  const [objetos, setObjetos] = useState('');
  const [observaciones, setObservaciones] = useState('');
  /** ids locales de ESTA acta — devueltos por la cola al encolar. */
  const [fotos, setFotos] = useState<string[]>([]);
  const [levantando, setLevantando] = useState(false);

  /* El cableado se memoiza: sin esto, `cablearPublicarMedia` devuelve una
     función nueva en cada render y el hook rehace su motor cada vez. */
  const publicar = useMemo(() => cablearPublicarMedia(prestadorId), [prestadorId]);
  const levantarActa = useMemo(() => cablearLevantarActa(), []);

  const captura = useCapturaMedia({
    fecha,
    prestadorId,
    publicar,
    levantarActa,
    estadiaId: estadia?.estadiaId,
    /* Un solo bucket para foto y clip: `guarderia-media` admite los dos
       (relevado de su migración). No se inventa un segundo nombre. */
    bucketFoto: 'guarderia-media',
    bucketClip: 'guarderia-media',
  });

  if (estadia === null) return null;

  /* Sólo las fotos de ESTA acta, y por id — jamás por «las de esta mascota
     hoy», que mezclaría el acta de recogida con la de devolución. */
  const mias = captura.pendientes.filter((p) => fotos.includes(p.id));

  /** La cola habla cinco estados; la miniatura, tres. Se mapea por los DOS
   *  extremos y todo lo del medio es «subiendo» — así un estado nuevo de la
   *  cola no cae en un `else` que lo pinte como éxito. */
  const estadoMiniatura = (e: string): EvidenciaFotoEstado =>
    e === 'publicada' ? 'subida' : e === 'error' ? 'error' : 'subiendo';

  const vozRegla = (r: ReglaEncuadre): string =>
    t(`actaGuarderia.encuadre_${r}` as 'actaGuarderia.encuadre_animal_en_cuadro');

  const sacarFoto = async () => {
    const r = await captura.capturarFoto();
    if (r.estado === 'permiso_denegado') {
      mostrar({ variante: 'error', texto: t('actaGuarderia.sinPermisoCamara') });
      return;
    }
    if (r.estado !== 'capturada') return;
    try {
      /* La foto llega al expediente de ESTE animal. La firma ① del founder
         —etiquetar a todos los que salen en la foto— es de la captura del
         DURANTE en las instalaciones; el acta de la puerta es de UN animal, y
         ofrecer acá un selector de otros animales sería preguntar algo cuya
         respuesta ya sabemos (Ley 23, corolario S73). */
      const id = await captura.publicarCaptura({
        uri: r.uri,
        tipo: 'foto',
        mascotaIds: [estadia.mascotaId],
      });
      setFotos((f) => [...f, id]);
    } catch {
      /* La cola guarda en disco antes de subir: si esto falla, no es la red —
         es que no se pudo ni encolar, y el cuidador tiene que saberlo AHORA
         porque su foto no existe en ningún lado. */
      mostrar({ variante: 'error', texto: t('actaGuarderia.fotoNoGuardada') });
    }
  };

  const levantar = async () => {
    if (levantando || fotos.length === 0) return;
    setLevantando(true);
    try {
      const datos: DatosDelActa = {
        direccion,
        carnetVerificado: carnet,
        objetos: objetos.trim().length > 0 ? objetos.trim() : undefined,
        observaciones: observaciones.trim().length > 0 ? observaciones.trim() : undefined,
        fotosLocales: fotos,
      };
      if (alLevantar !== undefined) {
        await alLevantar(datos);
      } else {
        /* La cola local: devuelve al instante, no espera red ni fotos. La
           recogida no se frena (contrato de actas §④). */
        await captura.levantarActaEnLaPuerta({
          direccion: datos.direccion,
          carnetVerificado: datos.carnetVerificado,
          objetos: datos.objetos,
          observaciones: datos.observaciones,
          fotosLocales: datos.fotosLocales,
        });
      }
      /* 🔴 EL ACTO CONFIRMA, y dice la verdad ENTERA de lo que pasó.
         Sin esto, el cuidador toca, la hoja baja y **no cambia nada visible**:
         el acta no mueve el estado del día, así que la pantalla de atrás se ve
         idéntica. *Un acto sin acuse se lee como un acto que no ocurrió, y el
         segundo toque lo levanta de nuevo.*

         ⚠️ Y dice «se envían cuando haya conexión» SIEMPRE, no sólo sin señal:
         la publicación es asíncrona por diseño —la cola devuelve al instante—
         así que en el momento del toque **todavía no viajó ninguna**, haya red
         o no. *Detectar la red para elegir el mensaje sería prometer una
         medición que no hago.* */
      mostrar({ variante: 'exito', texto: t('actaGuarderia.actaGuardada') });
      onLevantada();
    } catch {
      /* No se cierra la hoja: lo escrito sigue ahí y se puede reintentar. */
      mostrar({ variante: 'error', texto: t('actaGuarderia.noSePudo') });
    } finally {
      setLevantando(false);
    }
  };

  const caraDeEsta = caraDeMascota({
    especie: estadia.mascotaEspecie,
    razaSlug: null,
    fotoUri: cara,
  });
  const titulo = t(
    direccion === 'recogida' ? 'actaGuarderia.tituloRecogida' : 'actaGuarderia.tituloDevolucion',
    { nombre: estadia.mascotaNombre },
  );

  return (
    <Hoja visible titulo={titulo} onCerrar={onCerrar}>
      <HojaScroll contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[4] }}>
        {/* QUIÉN — la confirmación de que se firma el animal correcto. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          {/* ⚠️ SIN `especie`: la prop está JUBILADA (`R62`) — su contrato
              declara que «hoy no cambia el render», reservada al set ilustrado
              de `D-288`. La cara ya viene resuelta por la escalera de la casa
              (`caraDeMascota`), que es de donde tiene que salir. *Pasarla se
              lee como cableado y no hace nada: el único que lo sabe es el
              archivo del componente.* */}
          <AvatarMascota
            nombre={estadia.mascotaNombre}
            fotoUrl={caraDeEsta ?? undefined}
            tamano="md"
          />
          <Texto variante="cuerpo">{estadia.mascotaNombre}</Texto>
        </View>

        <ActaDeEntrega
          modo="levantar"
          direccion={direccion}
          /* UN solo ítem, y es el que el motor persiste. `guarderia_actas`
             guarda `carnet_verificado` y nada más como booleano: un checklist
             de cinco casillas bonitas dejaría cuatro sin viajar, que es la
             fila verosímil-falsa de L-139. */
          items={[
            { clave: 'carnet', etiqueta: t('actaGuarderia.itemCarnet'), marcado: carnet },
          ]}
          rotuloItems={t('actaGuarderia.rotuloItems')}
          onAlternarItem={() => setCarnet((v) => !v)}
          rotuloMedia={t('actaGuarderia.rotuloMedia')}
          media={
            <View style={{ gap: spacing[3] }}>
              {/* LA GUÍA DE ENCUADRE — es ley de captura (criterio §5), y por
                  eso se lee ANTES del obturador y no después. Las reglas las
                  elige `reglasSegunLugar`; la voz la pone el diccionario. */}
              <View style={{ gap: spacing[1] }}>
                {reglasSegunLugar(lugar).map((r) => (
                  <Texto key={r} variante="apoyo">
                    {vozRegla(r)}
                  </Texto>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                {mias.map((m) => (
                  <EvidenciaFoto.Thumbnail
                    key={m.id}
                    uri={m.uri}
                    estado={estadoMiniatura(m.estado)}
                    onReintentar={() => void captura.reintentarPendiente(m.id)}
                  />
                ))}
                <EvidenciaFoto.Capturar onFoto={() => void sacarFoto()} deshabilitado={levantando} />
              </View>
            </View>
          }
          rotuloObservaciones={t('actaGuarderia.rotuloObservaciones')}
          observaciones={observaciones}
          onCambiarObservaciones={setObservaciones}
          etiquetaObservaciones={t('actaGuarderia.etiquetaObservaciones')}
          /* Al levantar, la conformidad SIEMPRE está pendiente: el dueño la deja
             desde su app. Se dice como HECHO —no como advertencia— y no frena. */
          conformidad="pendiente"
          vozConformidad={t('actaGuarderia.conformidadPendiente')}
        />

        {/* QUÉ VIAJA CON ÉL — fuera de la pieza; ver el encabezado. */}
        <Campo
          label={t(
            direccion === 'recogida'
              ? 'actaGuarderia.objetosRecogida'
              : 'actaGuarderia.objetosDevolucion',
          )}
          value={objetos}
          onChangeText={setObjetos}
          multilinea={2}
        />
      </HojaScroll>

      {/* EL PIE, FUERA DEL SCROLL — un botón apagado tiene que decir QUÉ FALTA
          a la vista, no debajo del pliegue (medido en aparato, S99-C). */}
      <View style={{ gap: spacing[2], paddingTop: spacing[3] }}>
        {fotos.length === 0 ? (
          <Texto variante="apoyo" color="tertiary">
            {t('actaGuarderia.faltanFotos')}
          </Texto>
        ) : null}
        <Boton
          variante="primario"
          etiqueta={etiquetaActo}
          onPress={() => void levantar()}
          deshabilitado={fotos.length === 0}
          cargando={levantando}
        />
      </View>
    </Hoja>
  );
}
