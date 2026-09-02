/**
 * LA FICHA DEL ADOPTABLE (§4.1 «La ficha»). **Un viaje, y el orden es ley (N19).**
 *
 * **TESIS (Ley 14):** *este es Luna, y esto es todo lo que se sabe de ella.*
 *
 * **FIRMA (Ley 15):** la composición entera es de B (`FichaAdoptable`). Esta
 * pantalla **decide QUÉ va en cada bloque y no DÓNDE**: los slots tienen nombre
 * y no hay prop para reordenarlos, que es como N19 deja de depender de que cada
 * consumidor se acuerde.
 *
 * ── 🔴 LO QUE ESTA PANTALLA NO HACE ─────────────────────────────────────
 * · **No distingue por qué una publicación no está.** El motor rebota
 *   `publicacion_no_disponible` **sin decir** si no existe, es borrador, está
 *   pausada, adoptada o el animal falleció — *distinguirlo le contaría a un
 *   anónimo el estado interno de un refugio*. La pantalla respeta ese silencio.
 * · **No redacta la edad ni la espera.** Vienen como NÚMERO y las redacta el
 *   riel (`describirEdad` · `describirEspera`), que devuelve `{clave, params}`.
 *   *Una frase armada acá sería una frase en un solo idioma* (`D-539`).
 * · **No dice «no vacunado» cuando el dato es `null`.** `estadoVacunal: null`
 *   significa *«el refugio no lo declaró»*, y pintarlo como carencia sería
 *   **afirmar algo que nadie dijo** sobre un animal que alguien está por
 *   adoptar.
 * · **No pone la ubicación en su propio bloque.** Va DENTRO de `senales` como
 *   señal `zona`, que es donde la pieza la tiene: *dos lugares para el mismo
 *   dato es cómo se contradicen.*
 *
 * ── ⚠️ LOS TRES HUECOS, CON SU BLOQUEANTE NOMBRADO ──────────────────────
 * · 🔴 **LA GALERÍA ES UNA FOTO, Y NO ES UN RECORTE MÍO: ES UNA DECISIÓN QUE NO
 *   ME TOCA SOLO.** Escribí un `ScrollView horizontal pagingEnabled` acá y lo
 *   retiré antes de que viajara: **el carrusel de la casa ya existe** —vive
 *   dentro de `FichaPrestador`, con paginado, ciclo, ancho medido y puntos— y
 *   **su propiedad clave la cerró el ojo del founder en aparato** («no tironea
 *   en Android»), no la lectura del repo. *Escribir el segundo carrusel de la
 *   casa convierte una extracción pendiente en una duplicación consumada, y la
 *   decisión de extraerlo exige un gate que yo no puedo pedir.*
 *   ⚠️ **Y hoy el punto es discutible por otra razón medida: hay UNA sola foto
 *   por animal** (E: la vista resuelve por `mascotas.foto_url`, singular, y el
 *   bucket `adopcion-fotos` tiene INSERT en `is_admin()` ⇒ un refugio no puede
 *   subir). **Un carrusel de un elemento no es un carrusel.** Cuando el portal
 *   suba fotos de verdad, la decisión se toma con B y A juntos.
 * ✅ **EL SEMÁFORO SANITARIO (ítem 11) ESTÁ, y llegó por pedir en vez de
 *   copiar.** La pieza exigía `onResolver` cuando algo falta —correcto para la
 *   mascota de la familia, donde el camino existe— y acá el que mira no puede
 *   resolver nada. En vez de montarla con un `onResolver` de mentira o
 *   dibujarla a mano al lado (`D-645`), se le pidió el ensanche a B: hoy
 *   `lector="observador"` vuelve el camino **imposible de pasar**, no opcional.
 *   *Las dos garantías conviven y ninguna se ablandó.*
 *   Y B encontró un SEGUNDO hueco a partir del dato que iba al costado: nació
 *   `no_declarado`, porque **los tres campos de salud dicen «no se sabe» de
 *   tres formas distintas** y ninguna es una carencia.
 * · **«Reportar esta publicación»** — `reportar_publicacion` no existe todavía
 *   (medido: cero en `packages/api`). No se dibuja apagado: *un control que no
 *   hace nada es una promesa rota a un toque* (Ley 23).
 */

import { useCallback, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Convivencia,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FichaAdoptable as FichaDeAdopcion,
  Hoja,
  Icono,
  SemaforoSanitario,
  SenalesAdoptable,
  Texto,
  spacing,
  useAviso,
  useTheme,
  type ConvivenciaCon,
  type RequisitoSanitarioObservado,
  type SenalAdoptable,
} from '@epetplace/ui';
import {
  caraDeMascota,
  crearSolicitudAdopcion,
  obtenerAdoptable,
  obtenerSesion,
  type FichaAdoptable,
} from '@epetplace/api';
import { describirEdad, describirEspera } from '@epetplace/domain';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'noDisponible' }
  | { fase: 'listo'; ficha: FichaAdoptable };

/** Cuál de las tres hojas está abierta. `null` = ninguna. **Una variable y no
 *  tres booleanos**: dos hojas abiertas a la vez es un estado que no existe, y
 *  con tres banderas sería expresable. */
type HojaAbierta = 'bono' | 'padrinazgo' | 'verificacion' | null;

export default function PantallaFichaAdoptable() {
  const { publicacionId } = useLocalSearchParams<{ publicacionId: string }>();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [conSesion, setConSesion] = useState<boolean | null>(null);
  const [hoja, setHoja] = useState<HojaAbierta>(null);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        /* Juntas: la sesión no es precondición de la ficha (`L-223`). */
        const [ses, r] = await Promise.all([obtenerSesion(), obtenerAdoptable(publicacionId)]);
        if (!vigente) return;
        setConSesion(ses.ok && ses.data !== null);
        if (r.ok) {
          setEstado({ fase: 'listo', ficha: r.data });
          return;
        }
        /* Ley 13: el fallo no se disfraza de «no está». Y «no disponible» no se
           disfraza de error: *reintentar no lo va a arreglar*. */
        setEstado({ fase: r.codigo === 'publicacion_no_disponible' ? 'noDisponible' : 'error' });
      })();
      return () => {
        vigente = false;
      };
    }, [publicacionId, intento]),
  );

  /**
   * POSTULAR. §4: *«Al postular, se pide crear cuenta.»*
   *
   * 🔴 **Sin sesión NO se intenta y se rebota al alta CON EL DESTINO PUESTO**:
   * *llamar al motor para que conteste «sin sesión» le hace pagar un viaje para
   * decirle algo que ya sabíamos*, y sin el destino volvería al Hogar en vez de
   * a este animal — lo que §4.1 prohíbe con todas las letras.
   */
  const postular = (f: FichaAdoptable) => {
    if (conSesion !== true) {
      router.push({ pathname: '/registro', params: { volverA: '/adoptar' } });
      return;
    }
    /* ⏪ **ACÁ VIVÍA UN PLACEHOLDER QUE HABRÍA ESCRITO DECLARACIONES FALSAS.**
       Cuando `crear_solicitud_adopcion` pasó a exigir `respuestas`, esta llamada
       dejó de compilar y se adaptó mecánicamente con un hogar inventado y un
       motivo que decía «PENDIENTE». *Del otro lado hay un refugio decidiendo a
       quién le entrega un animal con esas respuestas a la vista.* Se declaró en
       el código y no viajó así.

       ✅ **Postular ya no es un toque: es el formulario**, que es lo que §4.1
       pide. Esta pantalla lleva; la solicitud la crea la que recoge lo que la
       persona declaró. **El nombre viaja** para que el encabezado diga a quién
       postula — *un formulario sin sujeto se lee como un trámite.* */
    router.push({
      pathname: '/adoptar/postular/[publicacionId]',
      params: { publicacionId: f.publicacionId, nombre: f.nombre },
    });
  };

  const contenido = (f: FichaAdoptable) => {
    const edad = describirEdad(f.fechaNacimiento, f.fechaNacimientoPrecision);
    const espera = describirEspera(f.esperaDias);

    /* La voz de `no_se_sabe` viaja POR FILA porque la pieza la exige así: *sin
       voz, el tercer estado no compila* — así no puede quedar mudo. */
    const fila = (con: string, e: FichaAdoptable['convivePerros']): ConvivenciaCon =>
      e === 'si'
        ? { con, estado: 'si' }
        : e === 'no'
          ? { con, estado: 'no' }
          : { con, estado: 'no_se_sabe', voz: t('fichaAdoptable.noSeSabe') };

    /**
     * EL SEMÁFORO, con `lector="observador"`: acá el camino es **imposible de
     * pasar** (`?: never`), no opcional. Es el ítem 11 hecho tipo — *quien mira
     * no puede resolver nada, lo completa el refugio desde su portal*.
     *
     * 🔴 **LOS TRES CAMPOS DICEN «NO SE SABE» DE TRES FORMAS DISTINTAS**, y el
     * tercer estado de la pieza existe para eso: `esterilizado: null` ·
     * `desparasitado: 'no_se_sabe'` (o `null`) · `estadoVacunal: null` o
     * `'sin_datos'`. **Ninguna se pinta como carencia**: falta el DATO, no el
     * acto, y un «nadie lo dijo» dibujado como pendiente afirma que hay algo
     * que hacer sobre un animal que alguien está por adoptar.
     *
     * ⚠️ **`'sin_datos'` y `null` colapsan en la misma voz, a propósito.** El
     * primero se eligió de una lista y el segundo nunca se tocó — *pero para
     * quien decide adoptar el hecho es el mismo, y distinguirlos exigiría
     * afirmar una intención que el dato no trae.* Se declara el colapso en vez
     * de inventar dos frases.
     */
    const noDeclarado = (clave: string, etiqueta: string): RequisitoSanitarioObservado => ({
      clave,
      etiqueta,
      estado: 'no_declarado',
      voz: t('fichaAdoptable.saludSinDeclarar'),
    });
    const requisitos: RequisitoSanitarioObservado[] = [
      f.esterilizado === null
        ? noDeclarado('esterilizado', t('fichaAdoptable.saludEsterilizado'))
        : {
            clave: 'esterilizado',
            etiqueta: t('fichaAdoptable.saludEsterilizado'),
            estado: f.esterilizado ? 'al_dia' : 'falta',
          },
      f.estadoVacunal === 'al_dia' || f.estadoVacunal === 'incompleto'
        ? {
            clave: 'vacunas',
            etiqueta: t('fichaAdoptable.saludVacunas'),
            estado: f.estadoVacunal === 'al_dia' ? 'al_dia' : 'falta',
          }
        : noDeclarado('vacunas', t('fichaAdoptable.saludVacunas')),
      f.desparasitado === 'si' || f.desparasitado === 'no'
        ? {
            clave: 'desparasitado',
            etiqueta: t('fichaAdoptable.saludDesparasitado'),
            estado: f.desparasitado === 'si' ? 'al_dia' : 'falta',
          }
        : noDeclarado('desparasitado', t('fichaAdoptable.saludDesparasitado')),
    ];

    const senales: SenalAdoptable[] = [
      ...(f.urgente ? [{ tipo: 'urgente' as const, voz: t('fichaAdoptable.senalUrgente') }] : []),
      ...(f.pareja === null
        ? []
        : [
            {
              tipo: 'pareja_vinculada' as const,
              voz: t('fichaAdoptable.senalPareja', { nombre: f.pareja.nombre }),
            },
          ]),
      {
        tipo: 'tiempo_en_rescate' as const,
        voz: t('fichaAdoptable.senalEspera', { cuanto: t(espera.clave as 'espera.dias', espera.params) }),
      },
      /* LA UBICACIÓN APROXIMADA (N5): ciudad y zona, jamás dirección ni punto.
         Se compone acá porque la pieza no acepta coordenadas — y no las tiene
         de dónde sacar: el contrato no las trae, a propósito. */
      ...(f.ciudadNombre === null
        ? []
        : [
            {
              tipo: 'zona' as const,
              voz: f.zona === null ? f.ciudadNombre : `${f.ciudadNombre} · ${f.zona}`,
            },
          ]),
    ];

    return (
      <FichaDeAdopcion
        /* LA PORTADA, sin carrusel — ver el hueco ① de la cabecera. Si el bucket
           no la entrega (E lo midió con `anon`), cae a la cara genérica de su
           especie: honesto, y jamás un hueco gris. */
        galeria={
          <Image
            source={{
              uri:
                caraDeMascota({
                  especie: f.especie,
                  razaSlug: null,
                  fotoUri: f.fotos[0] ?? f.fotoUrl,
                }) ?? undefined,
            }}
            style={{ width: '100%', aspectRatio: 1 }}
            resizeMode="cover"
            accessibilityLabel={f.nombre}
          />
        }
        nombre={f.nombre}
        /* La edad se dice AUNQUE SEA ESTIMADA (§4.1); `null` lo DICE la pieza
           con `voces.edadNoInformada`, no un guion vacío. */
        edad={f.fechaNacimiento === null ? null : t(edad.clave as 'edad.desconocida', edad.params)}
        detalles={[
          t(`adoptar.especieVoz_${f.especie}` as 'adoptar.especieVoz_perro'),
          ...(f.raza === null || f.raza.length === 0 ? [] : [f.raza]),
          ...(f.sexo === null ? [] : [t(`adoptar.sexo_${f.sexo}` as 'adoptar.sexo_macho')]),
          ...(f.talla === null ? [] : [t(`adoptar.talla_${f.talla}` as 'adoptar.talla_S')]),
        ]}
        semaforo={<SemaforoSanitario lector="observador" requisitos={requisitos} />}
        convivencia={
          <Convivencia
            filas={[
              fila(t('fichaAdoptable.conPerros'), f.convivePerros),
              fila(t('fichaAdoptable.conGatos'), f.conviveGatos),
              fila(t('fichaAdoptable.conNinos'), f.conviveNinos),
            ]}
            voces={{
              si: t('fichaAdoptable.convSi'),
              no: t('fichaAdoptable.convNo'),
              sinObservar: t('fichaAdoptable.sinObservar'),
            }}
          />
        }
        /* Si el refugio no escribió la historia, no se rellena con una
           plantilla: la pieza no monta el bloque. */
        historia={f.historia ?? undefined}
        senales={<SenalesAdoptable senales={senales} />}
        publicador={
          f.publicadorNombre === null
            ? undefined
            : {
                nombre: f.publicadorNombre,
                fotoUrl: f.publicadorFoto,
                verificacion: {
                  texto: t('fichaAdoptable.verificado'),
                  onExplicar: () => setHoja('verificacion'),
                  etiquetaExplicacion: t('fichaAdoptable.verificadoTitulo'),
                },
              }
        }
        bono={
          f.bonoMonto === null
            ? undefined
            : {
                texto: t('fichaAdoptable.bono', {
                  monto: f.bonoMonto.toFixed(2),
                  destino: f.bonoDestino ?? t('fichaAdoptable.bonoDestinoSinDeclarar'),
                }),
                onExplicar: () => setHoja('bono'),
                etiquetaExplicacion: t('fichaAdoptable.bonoTitulo'),
              }
        }
        cta={{
          etiqueta:
            conSesion === false
              ? t('adoptar.postularSinCuenta')
              : t('adoptar.postular', { nombre: f.nombre }),
          onPress: () => postular(f),
        }}
        apadrinar={{
          texto: t('fichaAdoptable.apadrinar'),
          onExplicar: () => setHoja('padrinazgo'),
          etiquetaExplicacion: t('fichaAdoptable.apadrinar'),
        }}
        voces={{
          edadNoInformada: t('adoptar.edadNoInformada'),
          salud: t('fichaAdoptable.saludRotulo'),
          convivencia: t('fichaAdoptable.convivenciaRotulo'),
          historia: t('fichaAdoptable.historiaRotulo'),
          senales: t('fichaAdoptable.senalesRotulo'),
          publicador: t('fichaAdoptable.publicadorRotulo'),
          bono: t('fichaAdoptable.bonoRotulo'),
        }}
      />
    );
  };

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={estado.fase === 'listo' ? estado.ficha.nombre : t('fichaAdoptable.titulo')}
        atras
        onAtras={() => (router.canGoBack() ? router.back() : router.replace('/adoptar'))}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}>
        {estado.fase === 'cargando' ? (
          <View style={{ padding: spacing[5] }}>
            <EsqueletoGrupo>
              <Esqueleto alto={280} />
              <Esqueleto alto={24} />
              <Esqueleto alto={120} />
            </EsqueletoGrupo>
          </View>
        ) : estado.fase === 'noDisponible' ? (
          <View style={{ padding: spacing[5] }}>
            <EstadoVacio
              registro="seccion"
              icono={<Icono nombre="refugio" tamano={48} />}
              titulo={t('fichaAdoptable.noDisponibleTitulo')}
              descripcion={t('fichaAdoptable.noDisponibleDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('fichaAdoptable.verOtros')}
                  onPress={() => router.replace('/adoptar')}
                />
              }
            />
          </View>
        ) : estado.fase === 'error' ? (
          <View style={{ padding: spacing[5] }}>
            <EstadoVacio
              registro="seccion"
              titulo={t('fichaAdoptable.errorTitulo')}
              descripcion={t('fichaAdoptable.errorDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('fichaAdoptable.reintentar')}
                  onPress={() => setIntento((n) => n + 1)}
                />
              }
            />
          </View>
        ) : (
          contenido(estado.ficha)
        )}
      </ScrollView>

      <Hoja
        visible={hoja === 'verificacion'}
        onCerrar={() => setHoja(null)}
        titulo={t('fichaAdoptable.verificadoTitulo')}
      >
        <View style={{ gap: spacing[3] }}>
          <Texto variante="cuerpo">{t('fichaAdoptable.verificadoCuerpo')}</Texto>
          <Boton etiqueta={t('fichaAdoptable.cerrar')} bloque onPress={() => setHoja(null)} />
        </View>
      </Hoja>

      <Hoja visible={hoja === 'bono'} onCerrar={() => setHoja(null)} titulo={t('fichaAdoptable.bonoTitulo')}>
        <View style={{ gap: spacing[3] }}>
          <Texto variante="cuerpo">{t('fichaAdoptable.bonoCuerpo')}</Texto>
          <Boton etiqueta={t('fichaAdoptable.cerrar')} bloque onPress={() => setHoja(null)} />
        </View>
      </Hoja>

      <Hoja
        visible={hoja === 'padrinazgo'}
        onCerrar={() => setHoja(null)}
        titulo={t('fichaAdoptable.apadrinar')}
      >
        <View style={{ gap: spacing[3] }}>
          <Texto variante="cuerpo">{t('fichaAdoptable.apadrinarCuerpo')}</Texto>
          <Boton etiqueta={t('fichaAdoptable.cerrar')} bloque onPress={() => setHoja(null)} />
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
