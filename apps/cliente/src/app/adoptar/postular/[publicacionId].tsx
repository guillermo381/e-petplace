/**
 * EL FORMULARIO DE POSTULACIÓN (§4.1 «El formulario»).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **VOZ DEL FOUNDER, literal:** *«Pocas preguntas, una por bloque: quiénes
 * viven en casa (adultos, y menores por rangos 0-5 · 6-12 · 13-17, cantidades,
 * **nunca nombres**) · tipo de vivienda · otros animales · cuántas horas al día
 * estaría solo · experiencia · por qué este animal. Abajo, el consentimiento
 * tal cual el abogado, con su casilla; "Enviar" apagado con razón hasta
 * marcarla. Al enviar: "Enviada" y la promesa: "Si el refugio no responde en 5
 * días, te avisamos."»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔴 **ESTA PANTALLA REEMPLAZA UN PLACEHOLDER QUE ESCRIBÍA DECLARACIONES
 * FALSAS.** Cuando `crear_solicitud_adopcion` pasó a exigir `respuestas`, la
 * llamada de la ficha dejó de compilar y A la adaptó mecánicamente con un hogar
 * inventado y un motivo que decía «PENDIENTE». *Mientras esa línea vivió, lo que
 * se habría guardado no era lo que la persona declaró* — y del otro lado hay un
 * refugio decidiendo a quién le entrega un animal con esas respuestas a la
 * vista. Se declaró en el código y no se publicó así.
 *
 * ── 🔴 LOS MENORES: RANGOS Y CANTIDADES, JAMÁS NOMBRES ──────────────────
 * No es una preferencia de formulario: **el esquema del motor lo rebota**
 * (`respuesta_no_valida: hogar.nombre_menor`), y la pieza de B **no tiene campo
 * de nombre posible**. *Tres capas —letra, tipo y CHECK— diciendo lo mismo, que
 * es como esta casa hace inexpresable un estado en vez de documentarlo.*
 *
 * ── LA PROMESA DEL RELOJ, y por qué AHORA sí se escribe ──────────────────
 * *«Si el refugio no responde en 5 días, te avisamos»* — **el job existe y está
 * aplicado** (`barrer_adopcion_diario`, de D). En S111 esta frase no se escribió
 * a propósito: el reloj era motor sin puerta y prometerlo habría sido una
 * promesa que nadie iba a cumplir.
 *
 * ── LO QUE ESTA PANTALLA NO APORTA ──────────────────────────────────────
 * **La `aceptacionId` NO se manda.** Es opcional en el contrato y **el servidor
 * la resuelve solo**. *Si la pantalla eligiera cuál aceptación respalda esta
 * solicitud, el día que se publique una v2 de las condiciones seguiría
 * apuntando a la v1 y todo compilaría* (`L-166`) — el mismo viaje redondo que
 * la versión del documento.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FormularioPostulacion,
  Texto,
  spacing,
  useAviso,
  useTheme,
  type RespuestasPostulacion,
} from '@epetplace/ui';
import {
  crearSolicitudAdopcion,
  obtenerDocumentoVigente,
  type DocumentoVigente,
  type RespuestasPostulacion as RespuestasDelMotor,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** El enum del motor, medido en `20260908040000_s112a_formulario.sql:80`.
 *  **Se declara y no se deriva**: no hay catálogo que lo traiga, y el día que
 *  el motor acepte un quinto valor, el rebote `respuesta_no_valida` lo dice. */
const VIVIENDAS = ['casa_con_patio', 'casa_sin_patio', 'departamento', 'otro'] as const;

/**
 * 🔴 **LA COSTURA ENTRE LA PIEZA Y EL MOTOR, Y EL TYPECHECK LA ENCONTRÓ.**
 *
 * `RespuestasPostulacion` de B tiene `vivienda: string` —la pieza no puede
 * conocer el enum, sus opciones se las pasa la pantalla— y el wrapper de A lo
 * exige como unión cerrada. *Son dos verdades correctas y el que las junta es
 * el que tiene el dato: esta pantalla.*
 *
 * ⚠️ **Se estrecha MIRANDO, jamás con un `as`.** Un cast habría compilado y
 * mandado al motor cualquier cadena que un cambio futuro de la pieza dejara
 * pasar — y el rebote sería `respuesta_no_valida` en la cara de alguien que
 * llenó seis bloques. `null` = todavía no eligió, que es el caso que el botón
 * apagado ya está diciendo.
 */
function paraElMotor(r: RespuestasPostulacion): RespuestasDelMotor | null {
  const v = VIVIENDAS.find((x) => x === r.vivienda);
  return v === undefined ? null : { ...r, vivienda: v };
}

const VACIO: RespuestasPostulacion = {
  hogar: { adultos: 1, menores_0_5: 0, menores_6_12: 0, menores_13_17: 0 },
  vivienda: '',
  otros_animales: '',
  horas_solo: 0,
  experiencia: '',
  motivo: '',
};

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; doc: DocumentoVigente }
  | { fase: 'enviada' };

export default function Postular() {
  const { publicacionId, nombre } = useLocalSearchParams<{
    publicacionId: string;
    nombre?: string;
  }>();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [respuestas, setRespuestas] = useState<RespuestasPostulacion>(VACIO);
  const [marcado, setMarcado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        /* EL CONSENTIMIENTO ES EL TEXTO DEL ABOGADO, y viene del servidor. La
           pieza de B no trae ninguno y no tiene default: *«no se inventa texto
           legal» es ley del loop, y la forma de cumplirla es no poder.* */
        const r = await obtenerDocumentoVigente('condiciones_adopcion');
        if (!vigente) return;
        /* Ley 13: si el documento no cargó, **no se ofrece el formulario sin
           consentimiento**. Un formulario que se puede enviar sin el texto que
           la persona tiene que aceptar es una solicitud sin respaldo. */
        setEstado(r.ok ? { fase: 'listo', doc: r.data } : { fase: 'error' });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  /**
   * QUÉ FALTA PARA PODER ENVIAR. `null` = nada.
   *
   * 🔴 **Una razón por vez y en orden de lectura**, no una lista: *«Enviar»
   * apagado con seis motivos apilados es una pared, no una guía.* El orden
   * sigue el de los bloques, así que la razón siempre apunta a lo primero que
   * falta yendo hacia abajo.
   */
  const faltaPara = (): string | null => {
    if (respuestas.hogar.adultos < 1) return t('postular.faltaAdultos');
    if (respuestas.vivienda === '') return t('postular.faltaVivienda');
    if (respuestas.motivo.trim().length === 0) return t('postular.faltaMotivo');
    if (!marcado) return t('postular.faltaConsentimiento');
    return null;
  };

  const enviar = async () => {
    if (estado.fase !== 'listo' || enviando || faltaPara() !== null) return;
    const paraEnviar = paraElMotor(respuestas);
    /* No debería poder pasar —`faltaPara` ya exige la vivienda— y por eso NO se
       le pone voz: *un mensaje para un estado inalcanzable es una frase que
       nadie va a leer y que igual hay que traducir a dos idiomas.* Si algún día
       pasa, el botón simplemente no envía y la razón sigue a la vista. */
    if (paraEnviar === null) return;
    setEnviando(true);
    try {
      const r = await crearSolicitudAdopcion({
        publicacionId,
        respuestas: paraEnviar,
        /* `aceptacionId` NO viaja: el servidor la resuelve. Ver la cabecera. */
      });
      if (!r.ok) {
        /* La compuerta de condiciones se RESUELVE, no se muestra: se lleva a la
           lectura con `volverA` para volver acá. **No se re-envía sola al
           volver** — enviar es un acto de la persona. */
        if (r.codigo === 'condiciones_no_aceptadas') {
          router.push({
            pathname: '/legales/[codigo]',
            params: { codigo: 'condiciones_adopcion', volverA: '/adoptar' },
          });
          return;
        }
        /* 🔴 N1 SE DIBUJA CON LA RAZÓN DEL MOTOR, no con una cuenta propia.
           *Contar solicitudes en la pantalla para adelantarme al tope daría un
           número que depende de lo que esta pantalla trajo, y el motor decide
           con todas.* Los dos rebotes son distintos y llevan a lugares
           distintos: `solicitud_ya_viva` es «ya postulaste a ÉSTE» y lleva a la
           conversación; `tope_de_solicitudes` es «tenés tres abiertas» y lleva
           a la lista para que cierre alguna. */
        if (r.codigo === 'solicitud_ya_viva') {
          mostrar({ variante: 'neutro', texto: r.mensaje });
          router.replace('/adoptar/solicitudes');
          return;
        }
        if (r.codigo === 'tope_de_solicitudes') {
          mostrar({ variante: 'neutro', texto: r.mensaje });
          router.replace('/adoptar/solicitudes');
          return;
        }
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      /* «ENVIADA» ES UNA PANTALLA, NO UN TOAST. Es el momento en que la persona
         entrega su declaración y quiere saber qué sigue; un aviso que se va en
         tres segundos deja esa pregunta sin contestar. */
      setEstado({ fase: 'enviada' });
    } finally {
      setEnviando(false);
    }
  };

  const falta = faltaPara();

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* 🔴 **DOS ENCABEZADOS Y NO UNA PROP BOOLEANA**, y lo obligó el tipo:
          `atras` es `true` literal y viene atado a `onAtras` — *la pieza hace
          inexpresable una flecha sin destino*. Y la distinción que dibuja es
          real: **enviada NO tiene vuelta atrás**. Volver dejaría el formulario
          lleno delante de alguien que ya lo mandó, y el segundo envío rebota
          con `solicitud_ya_viva` — *ofrecerle el camino a un rebote es peor que
          no ofrecerle camino*. Desde ahí se sigue a la conversación. */}
      {estado.fase === 'enviada' ? (
        <Encabezado variante="navegacion" titulo={t('postular.enviadaTitulo')} />
      ) : (
        <Encabezado
          variante="navegacion"
          titulo={
            typeof nombre === 'string' && nombre.length > 0
              ? t('postular.tituloCon', { nombre })
              : t('postular.titulo')
          }
          atras
          onAtras={() => router.back()}
        />
      )}

      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          gap: spacing[5],
          paddingBottom: insets.bottom + spacing[8],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {estado.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={80} />
            <Esqueleto alto={80} />
            <Esqueleto alto={160} />
          </EsqueletoGrupo>
        ) : estado.fase === 'error' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('postular.errorTitulo')}
            descripcion={t('postular.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('postular.reintentar')}
                onPress={() => setIntento((n) => n + 1)}
              />
            }
          />
        ) : estado.fase === 'enviada' ? (
          <View style={{ gap: spacing[4] }}>
            <Texto variante="titulo">{t('postular.enviadaTitulo')}</Texto>
            {/* LA PROMESA DEL RELOJ. Se escribe porque el job EXISTE. */}
            <Texto variante="cuerpo">{t('postular.enviadaPromesa')}</Texto>
            <Boton
              variante="primario"
              bloque
              etiqueta={t('postular.verConversacion')}
              onPress={() => router.replace('/adoptar/solicitudes')}
            />
          </View>
        ) : (
          <FormularioPostulacion
            respuestas={respuestas}
            onCambio={setRespuestas}
            opcionesVivienda={VIVIENDAS.map((c) => ({
              codigo: c,
              etiqueta: t(`postular.vivienda_${c}` as 'postular.vivienda_otro'),
            }))}
            consentimiento={{
              texto: estado.doc.contenido,
              marcado,
              onCambio: setMarcado,
            }}
            /* 🔴 `envio` es unión discriminada: **apagado sin razón NO
               COMPILA**. La razón la pone esta pantalla porque es la única que
               sabe qué falta (doctrina D-999). */
            envio={
              falta === null
                ? {
                    etiqueta: t('postular.enviar'),
                    onEnviar: () => void enviar(),
                    cargando: enviando,
                  }
                : { etiqueta: t('postular.enviar'), razon: falta }
            }
            voces={{
              hogar: {
                rotulo: t('postular.hogarRotulo'),
                adultos: t('postular.hogarAdultos'),
                menores_0_5: t('postular.hogarMenores05'),
                menores_6_12: t('postular.hogarMenores612'),
                menores_13_17: t('postular.hogarMenores1317'),
              },
              vivienda: t('postular.viviendaRotulo'),
              otrosAnimales: {
                rotulo: t('postular.otrosAnimalesRotulo'),
                ayuda: t('postular.otrosAnimalesAyuda'),
              },
              horasSolo: {
                rotulo: t('postular.horasSoloRotulo'),
                ayuda: t('postular.horasSoloAyuda'),
              },
              experiencia: {
                rotulo: t('postular.experienciaRotulo'),
                ayuda: t('postular.experienciaAyuda'),
              },
              motivo: {
                rotulo: t('postular.motivoRotulo'),
                ayuda: t('postular.motivoAyuda'),
              },
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
