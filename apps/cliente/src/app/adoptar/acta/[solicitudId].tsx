/**
 * EL ACTA Y LA FIRMA — lado FAMILIA (§4.1 «El acta y la firma»).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **VOZ DEL FOUNDER:** *«El texto entero con mis datos y los del animal ya
 * puestos, scroll. Si falta algo mío (cédula, domicilio), arriba del botón una
 * lista con nombre: "Falta tu cédula" — y un campo para cargarla ahí mismo.
 * "Firmar" me manda un código de 8 dígitos al correo; lo escribo y firmo. Veo
 * "Firmaste · falta la firma del refugio" como estado. Con las dos firmas, el
 * hito "Una vida nueva empieza".»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 LO QUE ESTA PANTALLA NO DECIDE, Y CADA UNO IMPORTA ───────────────
 * · **La VERSIÓN no se escribe acá: viaja ida y vuelta.** Si el acta cambia
 *   entre que se pide el código y se firma, el motor rebota con
 *   `acta_cambio_de_version`. *Firmar con un código emitido sobre otro texto es
 *   firmar algo que no se leyó* — y una pantalla que eligiera la versión haría
 *   ese caso indistinguible del normal.
 * · **El código NO llega en la respuesta.** `solicitarCodigoFirma` devuelve **a
 *   dónde** se mandó, jamás **qué**. *Un segundo factor que viaja por el mismo
 *   canal que el primero no es un segundo factor: es un paso más.* La pantalla
 *   no lo tiene y no puede tenerlo.
 * · **El traspaso y el hito los hace la SEGUNDA FIRMA, en la misma
 *   transacción.** Esta pantalla no los llama: *si tuviera que hacerlo, una
 *   adopción quedaría firmada por los dos y sin ocurrir cada vez que se corte la
 *   red.* Sólo lee `completa` y celebra.
 * · **`cedula` y `domicilio` viajan CON la firma**, no en un guardado aparte: el
 *   motor los escribe **antes** de renderizar, así que el acta firmada no lleva
 *   los guiones que la persona acaba de completar.
 *
 * ── LOS FALTANTES ───────────────────────────────────────────────────────
 * Llegan como NOMBRES y van **arriba del botón, pegados a lo que bloquean** (el
 * slot de B se llama así por eso). Y `solicitarCodigoFirma` **no manda código
 * con el acta incompleta**: *pedirlo primero y descubrir después que faltaba la
 * cédula sería quemar un código para enterarse de algo que ya se sabía.*
 */

import { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Campo,
  CodigoFirmaInput,
  DocumentoLegalLectura,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  HitoUnaVidaNueva,
  MarcaDeAgua,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  firmarActaAdopcion,
  obtenerActaAdopcion,
  solicitarCodigoFirma,
  type ActaAdopcion,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; acta: ActaAdopcion }
  | { fase: 'completa'; folio: string };

/** Los faltantes que la persona puede resolver DESDE ACÁ. El resto se dice y
 *  no se ofrece: *un campo para algo que esta pantalla no escribe sería una
 *  promesa que el guardado no cumple.* */
const RESOLUBLES = ['cedula', 'domicilio'] as const;

export default function ActaDeAdopcion() {
  const { solicitudId } = useLocalSearchParams<{ solicitudId: string }>();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [vioTodo, setVioTodo] = useState(false);
  const [cedula, setCedula] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [codigo, setCodigo] = useState('');
  const [pidiendo, setPidiendo] = useState(false);
  const [firmando, setFirmando] = useState(false);
  /** A dónde se mandó el código. `null` = todavía no se pidió, y el campo del
   *  código **no se dibuja**: pedirlo antes de que exista es pedir a ciegas. */
  const [enviadoA, setEnviadoA] = useState<string | null>(null);
  const [mensajeCodigo, setMensajeCodigo] = useState<string | undefined>(undefined);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        const r = await obtenerActaAdopcion(solicitudId);
        if (!vigente) return;
        setEstado(r.ok ? { fase: 'listo', acta: r.data } : { fase: 'error' });
      })();
      return () => {
        vigente = false;
      };
    }, [solicitudId, intento]),
  );

  /** Lo que falta y esta pantalla PUEDE resolver, ya cargado en su campo. */
  const faltaResuelto = (n: string): boolean =>
    n === 'cedula' ? cedula.trim().length > 0 : n === 'domicilio' ? domicilio.trim().length > 0 : false;

  const pedirCodigo = async (acta: ActaAdopcion) => {
    if (pidiendo) return;
    setPidiendo(true);
    setMensajeCodigo(undefined);
    try {
      const r = await solicitarCodigoFirma(solicitudId);
      if (!r.ok) {
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      setEnviadoA(r.data.enviadoA);
      mostrar({ variante: 'neutro', texto: t('acta.codigoEnviado', { a: r.data.enviadoA }) });
    } finally {
      setPidiendo(false);
    }
    void acta;
  };

  const firmar = async () => {
    if (estado.fase !== 'listo' || firmando || codigo.length < 8) return;
    setFirmando(true);
    setMensajeCodigo(undefined);
    try {
      const r = await firmarActaAdopcion({
        solicitudId,
        codigo,
        /* Sólo lo que la persona cargó acá. **Mandar cadenas vacías escribiría
           un vacío sobre un dato que quizá ya existía.** */
        ...(cedula.trim() === '' ? {} : { cedula: cedula.trim() }),
        ...(domicilio.trim() === '' ? {} : { domicilio: domicilio.trim() }),
        dispositivo: `${Platform.OS} ${String(Platform.Version)}`,
      });
      if (!r.ok) {
        /* 🔴 Los rebotes del CÓDIGO se dicen EN EL CAMPO, no en un aviso que se
           va: la persona tiene que poder corregir mirando lo que escribió. Y
           **ninguno se pinta de alarma** (N23): vencido, equivocado y agotados
           son el ESTADO de un código, no un tipeo mal hecho. */
        setMensajeCodigo(r.mensaje);
        /* El cambio de versión NO es un problema del código: el texto cambió
           debajo. Se relee para que lea el acta nueva antes de volver a firmar. */
        if (r.codigo === 'acta_cambio_de_version') {
          setCodigo('');
          setEnviadoA(null);
          setIntento((n) => n + 1);
        }
        return;
      }
      if (r.data.completa) {
        setEstado({ fase: 'completa', folio: r.data.folio });
        return;
      }
      /* Firmó y falta el otro: se relee para que el estado de firmas lo diga
         con el dato del servidor y no con una suposición local. */
      setCodigo('');
      setEnviadoA(null);
      setIntento((n) => n + 1);
    } finally {
      setFirmando(false);
    }
  };

  const cuerpo = (acta: ActaAdopcion) => {
    const pendientes = acta.faltantes.filter((n) => !faltaResuelto(n));
    const listoParaFirmar = pendientes.length === 0 && vioTodo;
    const razon =
      pendientes.length > 0
        ? t('acta.faltaCargar')
        : !vioTodo
          ? t('acta.faltaLeer')
          : undefined;

    return (
      <DocumentoLegalLectura
        texto={acta.textoRenderizado}
        onVioTodo={() => setVioTodo(true)}
        /* EL ESTADO DE FIRMAS, arriba de todo el pie: es información, no
           obstáculo. */
        estadoFirmas={
          acta.firmas.length > 0 ? (
            <Texto variante="apoyo" color="tertiary">
              {t('acta.estadoFirmas', { n: acta.firmas.length })}
            </Texto>
          ) : undefined
        }
        /* LOS FALTANTES, PEGADOS AL BOTÓN — con su nombre y su campo. */
        faltantes={
          acta.faltantes.length === 0 ? undefined : (
            <View style={{ gap: spacing[3] }}>
              {acta.faltantes.map((n) =>
                (RESOLUBLES as readonly string[]).includes(n) ? (
                  <Campo
                    key={n}
                    label={t(`acta.falta_${n}` as 'acta.falta_cedula')}
                    value={n === 'cedula' ? cedula : domicilio}
                    onChangeText={n === 'cedula' ? setCedula : setDomicilio}
                  />
                ) : (
                  /* Lo que esta pantalla NO escribe se DICE y no se ofrece:
                     un campo que el guardado ignora es una promesa rota. */
                  <Texto key={n} variante="apoyo" color="tertiary">
                    {t('acta.faltaOtro', { que: n })}
                  </Texto>
                ),
              )}
            </View>
          )
        }
        pie={
          <>
            {enviadoA === null ? (
              <Boton
                variante="primario"
                bloque
                etiqueta={t('acta.pedirCodigo')}
                deshabilitado={!listoParaFirmar}
                razonDeshabilitado={razon}
                cargando={pidiendo}
                onPress={() => void pedirCodigo(acta)}
              />
            ) : (
              <>
                <CodigoFirmaInput
                  valor={codigo}
                  onCambio={setCodigo}
                  etiqueta={t('acta.codigoEtiqueta')}
                  ayuda={t('acta.codigoAyuda', { a: enviadoA })}
                  mensaje={mensajeCodigo}
                  /* ⏪ Acá el campo se apagaba mientras se firmaba, y
                     `verify:razon-muda` lo cazó como freno mudo. Tenía razón:
                     se apagaba y nada decía por qué. *La cura no era escribirle
                     una razón — era que no hiciera falta apagarlo.* El botón ya
                     queda en `cargando`, que bloquea el segundo toque, y el
                     valor que viaja se capturó al enviar: escribir mientras el
                     pedido vuela no rompe nada.
                     ⚠️ **Y este comentario NO puede nombrar la prop retirada**:
                     el gate cuenta por TEXTO y leería la palabra del comentario
                     como un freno vivo (`L-170` — un censo por patrón lee los
                     comentarios como código). *Me lo cobró a mí, en el
                     comentario que explicaba su propio hallazgo.* */
                />
                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('acta.firmar')}
                  deshabilitado={codigo.length < 8}
                  razonDeshabilitado={t('acta.faltaCodigo')}
                  cargando={firmando}
                  onPress={() => void firmar()}
                />
              </>
            )}
          </>
        }
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('acta.titulo')}
        atras
        onAtras={() => (router.canGoBack() ? router.back() : router.replace('/adoptar/solicitudes'))}
      />

      {estado.fase === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={18} />
            <Esqueleto alto={200} />
          </EsqueletoGrupo>
        </View>
      ) : estado.fase === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('acta.errorTitulo')}
            descripcion={t('acta.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('acta.reintentar')}
                onPress={() => setIntento((n) => n + 1)}
              />
            }
          />
        </View>
      ) : estado.fase === 'completa' ? (
        /* EL HITO. **No lo escribe esta pantalla**: lo escribió la segunda firma
           en su misma transacción, y acá sólo se celebra. */
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5], gap: spacing[5] }}>
          <HitoUnaVidaNueva
            titulo={t('acta.hitoTitulo')}
            fecha={t('acta.hitoHoy')}
          />
          <Texto variante="apoyo" color="tertiary">
            {t('acta.folio', { folio: estado.folio })}
          </Texto>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('acta.irAlHogar')}
            onPress={() => router.replace('/hogar')}
          />
        </View>
      ) : (
        cuerpo(estado.acta)
      )}
    </View>
  );
}
