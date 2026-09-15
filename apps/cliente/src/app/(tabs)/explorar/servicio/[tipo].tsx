/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EL DETALLE DEL SERVICIO — **qué es, con quién y cuánto** (S116-C · lote 5 · ③)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TESIS (Ley 14): *lo que estás por pedir, y qué te llevás con eso.*
 *
 * FIRMA (Ley 15): el **pie fijo** con el total en Baloo a la izquierda y
 * «Agendar» a la derecha — `PieReserva`, que gana la cifra en Baloo cuando la
 * casa es v5 y a la que el encargo describe exactamente.
 *
 * ── DE QUIÉN ES ESTE SERVICIO, y por qué se dice ────────────────────────────
 * El mismo `tipo` lo ofrecen varios negocios a distinto precio. **Cuando no
 * llega un `prestadorId`, esta pantalla abre la oferta MÁS BARATA y pone el
 * nombre de quien la hace en la cabecera** — que es lo que convierte «desde
 * $15» en «$15 con Clínica Los Shyris». *Una pantalla que muestra un precio sin
 * decir de quién es obliga a entrar al checkout para averiguarlo.*
 *
 * ── 🔴 DOS FILAS QUE EL ENCARGO PIDE Y EL DATO NO TIENE ─────────────────────
 * ① **La dirección exacta NO existe en la vista pública, y es por letra**: S84
 *    cerró `v_prestadores_publicos` para que no entregara `lat`/`lon` ni la
 *    dirección de negocios ajenos —*«la coordenada exacta no viaja al
 *    teléfono»*—. Lo que hay es **la zona**: ciudad y sector. ⇒ la fila dice la
 *    zona y no finge una calle. *Poner «Dirección» sobre una zona sería peor
 *    que no tenerla: la familia saldría a buscar una puerta que no dijimos.*
 * ② **El horario de atención tampoco viaja**: el motor lo sabe al resolver un
 *    día (`obtener_inicios_*`), no en la vitrina. ⇒ la fila lo dice: *se ve al
 *    elegir el día*, que es donde de verdad se sabe.
 *
 * ── ⚠️ «INCLUYE» ES DEL PRODUCTO, NO DEL NEGOCIO ────────────────────────────
 * **No hay columna de «qué incluye»** en ninguna tabla. Las líneas salen del
 * riel y describen **lo que la casa construyó y se cumple siempre** —el paseo
 * tiene GPS porque el motor lo graba; el parte existe porque cerrar sin él no
 * se puede—. *Listar acá una promesa del negocio sería afirmar algo que nadie
 * mide.* El día que el prestador pueda agregar las suyas, vienen del motor.
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HojaContenido,
  Cabecera,
  AvatarMascota,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaDato,
  FilaIncluye,
  PieReserva,
  Texto,
  esOficio,
  spacing,
  useTheme,
  type Oficio,
} from '@epetplace/ui';
import {
  listarIdsPrestadoresPublicos,
  obtenerPerfilesPublicos,
  resolverUrlsFotos,
  type PerfilPublico,
  type ServicioPublico,
} from '@epetplace/api';
import { formatearPrecio } from '@epetplace/i18n';
import { oficioDeServicio } from '@/lib/oficio-de-servicio';
import { vozServicio } from '@/lib/voz-servicio';
import { useTraduccion } from '@/i18n';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';

type Traductor = ReturnType<typeof useTraduccion>['t'];

/** Lo que el producto garantiza en cada oficio. Ver la cabecera: **es del
 *  producto y no del negocio**, y por eso vive en el riel y no en una columna.
 *  El `expediente` va en todos: es la promesa de la plataforma. */
function loQueIncluye(oficio: Oficio | null, t: Traductor): string[] {
  const comun = [t('incluyeV5.expediente')];
  switch (oficio) {
    case 'paseo':
      return [t('incluyeV5.paseoGps'), t('incluyeV5.paseoFotos'), t('incluyeV5.paseoParte'), ...comun];
    case 'grooming':
      return [t('incluyeV5.groomingEstado'), t('incluyeV5.groomingFotos'), t('incluyeV5.groomingParte'), ...comun];
    case 'veterinaria':
    case 'telemedicina':
      return [t('incluyeV5.vetHistoria'), t('incluyeV5.vetParte'), t('incluyeV5.vetReceta'), ...comun];
    case 'adiestramiento':
      return [t('incluyeV5.adiestramientoBitacora'), t('incluyeV5.adiestramientoClips'), t('incluyeV5.adiestramientoParte'), ...comun];
    case 'guarderia':
      return [t('incluyeV5.guarderiaDia'), t('incluyeV5.guarderiaFotos'), ...comun];
    /* Un oficio sin lista propia **no inventa una**: se queda con lo único que
       es cierto para todos. *Una lista genérica de tres líneas suena a relleno
       y le quita valor a las que sí dicen algo.* */
    default:
      return comun;
  }
}

/** A dónde lleva «Agendar». Explícito, por el mismo motivo que en ②. */
function rutaDeAgendar(oficio: Oficio | null) {
  switch (oficio) {
    case 'paseo': return '/explorar/paseo' as const;
    case 'grooming': return '/explorar/grooming' as const;
    case 'veterinaria': return '/explorar/veterinaria' as const;
    case 'adiestramiento': return '/explorar/adiestramiento' as const;
    case 'guarderia': return '/explorar/guarderia' as const;
    default: return null;
  }
}

export default function DetalleDeServicio() {
  const { tipo, oficio: oficioCrudo, prestadorId } = useLocalSearchParams<{
    tipo?: string;
    oficio?: string;
    prestadorId?: string;
  }>();
  const cabecera = useAltoDeCabecera('empujada');
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [perfiles, setPerfiles] = useState<PerfilPublico[] | 'cargando' | 'error'>('cargando');
  /**
   * Las URLs FIRMADAS de los logos. `foto_url` de la vista pública es **un
   * PATH** (bucket privado desde S47); crudo, el avatar cae al monograma como
   * si no hubiera foto. *Lo avisa la propia pieza por consola.*
   */
  const [logos, setLogos] = useState<Map<string, string>>(new Map());

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void listarIdsPrestadoresPublicos().then(async (ids) => {
        if (!vigente) return;
        if (!ids.ok) { setPerfiles('error'); return; }
        if (ids.data.length === 0) { setPerfiles([]); return; }
        const ps = await obtenerPerfilesPublicos(ids.data);
        if (!vigente) return;
        setPerfiles(ps.ok ? ps.data : 'error');
        if (!ps.ok) return;
        const paths = ps.data
          .map((x) => x.foto_url)
          .filter((x): x is string => typeof x === 'string' && x !== '');
        if (paths.length === 0) return;
        void resolverUrlsFotos(paths).then((m) => { if (vigente) setLogos(m); });
      });
      return () => { vigente = false; };
    }, []),
  );

  const oficio: Oficio | null =
    typeof oficioCrudo === 'string' && esOficio(oficioCrudo) ? oficioCrudo : null;
  const listaPerfiles = Array.isArray(perfiles) ? perfiles : [];

  /** La oferta que esta pantalla describe: la del prestador pedido, o **la más
   *  barata** si nadie lo dijo. `null` = el servicio ya no está publicado. */
  const oferta: { perfil: PerfilPublico; servicio: ServicioPublico } | null = (() => {
    if (typeof tipo !== 'string' || tipo === '') return null;
    let mejor: { perfil: PerfilPublico; servicio: ServicioPublico } | null = null;
    for (const p of listaPerfiles) {
      if (typeof prestadorId === 'string' && prestadorId !== '' && p.id !== prestadorId) continue;
      for (const sv of p.servicios) {
        if (sv.tipo !== tipo) continue;
        if (mejor === null) { mejor = { perfil: p, servicio: sv }; continue; }
        /* Con precio gana el más barato; **sin precio no desplaza a uno que sí
           lo tiene** — una oferta sin precio no es «más barata». */
        const a = sv.precio;
        const b = mejor.servicio.precio;
        if (typeof a === 'number' && (typeof b !== 'number' || a < b)) mejor = { perfil: p, servicio: sv };
      }
    }
    return mejor;
  })();

  const nombreServicio =
    oferta === null ? '' : (vozServicio(t, oferta.servicio.tipo, oferta.servicio.nombre) ?? '');
  const oficioDeLaOferta = oferta === null ? oficio : (oficioDeServicio(oferta.servicio) ?? oficio);
  const ruta = rutaDeAgendar(oficioDeLaOferta);

  /* La zona, que es lo que la vista pública SÍ entrega. Sin ninguna de las dos
     la fila no se dibuja (19.9). */
  const zona =
    oferta === null
      ? null
      : [oferta.perfil.sector, oferta.perfil.ciudad].filter((x): x is string => !!x && x.trim() !== '').join(' · ') || null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <HojaContenido
        arranque={cabecera.arranque}
        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera
              variante="empujada"
              /* La cabecera lleva **al prestador**, que es de quién es esto.
                 ⚠️ **Su calificación no se dibuja porque no la hay**: los once
                 negocios están en `total_resenas = 0`, y un «0,0 ★» diría «mal
                 calificado» donde lo que pasa es «sin calificar». Cuando haya
                 reseñas, entra en el `apoyo`. */
              titulo={oferta?.perfil.nombre_comercial ?? ''}
              presentacion="fondo"
              onVolver={() => router.back()}
              etiquetaVolver={t('comun.volver')}
            />
          </View>
        }
        pie={
          /* ⭐ **EL PIE FIJO — `PieReserva`.** `rotuloTotal` sin default por
             contrato: *«un pie cuyo precio varía por prestador no dice "Total"
             — dice "desde"»*. Acá el precio **es el de ESTA oferta**, así que
             dice Total; el «desde» vive en las listas, donde el precio todavía
             no tiene dueño. */
          oferta === null ? undefined : (
            <PieReserva
              total={typeof oferta.servicio.precio === 'number' ? formatearPrecio(oferta.servicio.precio) : null}
              rotuloTotal={t('servicioV5.total')}
              cuando={
                typeof oferta.servicio.duracion_minutos === 'number'
                  ? t('servicioV5.duracion', { min: oferta.servicio.duracion_minutos })
                  : null
              }
              etiqueta={t('servicioV5.agendar')}
              habilitado={ruta !== null}
              onPress={() => { if (ruta !== null) router.push(ruta); }}
              insetBottom={insets.bottom}
            />
          )
        }
      >
        <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4], gap: spacing[6] }}>
          {perfiles === 'cargando' ? (
            <EsqueletoGrupo>
              <View style={{ gap: spacing[3] }}>
                <Esqueleto forma="bloque" ancho="100%" alto={120} />
                <Esqueleto forma="bloque" ancho="100%" alto={160} />
              </View>
            </EsqueletoGrupo>
          ) : perfiles === 'error' ? (
            <EstadoVacio titulo={t('servicioV5.error')} descripcion={t('hogar.errorHistoriaDetalle')} />
          ) : oferta === null ? (
            /* 🔴 El servicio que ya no está **lo dice y ofrece la salida** (Ley
               23): sin esto la pantalla quedaría muda con un pie sin precio. */
            <EstadoVacio
              titulo={t('servicioV5.sinOferta')}
              descripcion={t('servicioV5.sinOfertaDetalle')}
              accion={<Boton variante="secundario" etiqueta={t('servicioV5.verOtros')} onPress={() => router.back()} />}
            />
          ) : (
            <>
              {/* ── LA CARA, EL NOMBRE Y LA DURACIÓN ── */}
              <View style={{ alignItems: 'center', gap: spacing[3] }}>
                {/* «Foto o personaje»: `AvatarMascota` resuelve las dos —con
                    foto la pinta, sin foto dibuja el monograma— y es la pieza
                    que la casa ya usa para una cara con respaldo. */}
                <AvatarMascota
                  nombre={oferta.perfil.nombre_comercial}
                  fotoUrl={oferta.perfil.foto_url === null ? undefined : logos.get(oferta.perfil.foto_url)}
                  tamano="lg"
                />
                <View style={{ alignItems: 'center', gap: spacing[1] }}>
                  <Texto variante="seccion">{nombreServicio}</Texto>
                  {typeof oferta.servicio.duracion_minutos === 'number' ? (
                    <Texto variante="apoyo">
                      {t('servicioV5.duracion', { min: oferta.servicio.duracion_minutos })}
                    </Texto>
                  ) : null}
                </View>
              </View>

              {/* ── DÓNDE Y CUÁNDO, como filas ── */}
              <View style={{ gap: spacing[2] }}>
                <Texto variante="seccion">{t('servicioV5.dondeYCuando')}</Texto>
                {zona === null ? null : (
                  <FilaDato disposicion="horizontal" etiqueta={t('servicioV5.direccion')} valor={zona} />
                )}
                <FilaDato
                  disposicion="horizontal"
                  etiqueta={t('servicioV5.horario')}
                  valor={t('servicioV5.horarioAlAgendar')}
                />
              </View>

              {/* ── INCLUYE ── */}
              <View style={{ gap: spacing[2] }}>
                <Texto variante="seccion">{t('servicioV5.incluye')}</Texto>
                <FilaIncluye items={loQueIncluye(oficioDeLaOferta, t)} />
              </View>
            </>
          )}
        </View>
      </HojaContenido>
    </View>
  );
}
