/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LA PANTALLA DEL OFICIO — **qué hay acá adentro** (S116-C · lote 5 · ②)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TESIS (Ley 14): *qué se puede pedir en este oficio, y quién lo hace cerca.*
 *
 * ── POR QUÉ NACE UNA PANTALLA Y NO SE REUSA UNA ─────────────────────────────
 * **Medido:** `/explorar/paseo` y sus cuatro hermanas **son la pantalla de
 * AGENDAR** —duración, día, hora, «Ver quién puede»— y `/hogar/<oficio>` es **el
 * log de lo tuyo**. *Ninguna de las dos contesta «¿qué hay en paseo?»: una pide
 * un horario antes de decir qué se agenda, y la otra sólo habla de lo que ya
 * compraste.* Este es el escalón que faltaba entre Explorar y agendar.
 *
 * ── LA TARJETA DESTACADA ES EL ACTO, NO UNA PROMO ───────────────────────────
 * El encargo pide *«la tarjeta destacada con su CTA»*. **No hay lector de
 * promociones de la casa** (existe `cupones` en la base y cero puerta), así que
 * una destacada de promo hoy no podría dibujarse. *La destacada es el acto
 * principal del oficio* —agendar— que es lo que una pantalla de oficio tiene
 * que ofrecer primero. Cuando exista la promo, va acá con su propia forma.
 *
 * ── 🔴 EL GLIFO DE LOS SUBSERVICIOS, declarado ──────────────────────────────
 * `GrillaSubservicios` pide un glifo por ítem y **el registry no tiene uno por
 * subservicio**: son 41 glifos y ninguno es «vacunación», «baño» o «ecografía».
 * ⇒ **todos los subservicios de un oficio llevan el glifo del oficio**, y eso
 * choca contra la ley del glifo (*el mismo glifo repetido deja de distinguir*).
 * **No se inventa un préstamo** —un estetoscopio sobre «vacunación» diría otra
 * cosa— y **no se dibuja local**: va pedido a B con su hoja de contacto y con
 * la lista medida. *Lo que distingue hoy es el nombre, y la pieza lo admite en
 * dos líneas justamente porque «los subservicios se llaman como se llaman».*
 *
 * ⚠️ **Y el nombre sale del RIEL, no del motor:** medido contra la vista
 * pública, `servicios[].nombre` trae **el código crudo** en 8 de 12 casos
 * (`vacunacion`, `grooming_completo`, `urgencia_domicilio`…). `vozServicio`
 * prefiere la clave del riel y cae al nombre de DB sólo si no la conoce —
 * *sin eso, esta grilla le mostraría a la familia el vocabulario del motor.*
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  HojaContenido,
  Cabecera,
  AIRE_RAIZ,
  AvatarMascota,
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  GrillaSubservicios,
  Tarjeta,
  TarjetaPrestador,
  Texto,
  glifoDeOficio,
  esOficio,
  spacing,
  useTheme,
  type Oficio,
  type Subservicio,
} from '@epetplace/ui';
import {
  obtenerDireccionHogar,
  listarIdsPrestadoresPublicos,
  obtenerPerfilesPublicos,
  resolverUrlsFotos,
  type DireccionHogar,
  type PerfilPublico,
} from '@epetplace/api';
import { formatearPrecio } from '@epetplace/i18n';
import { oficioDeServicio, distanciaKm } from '@/lib/oficio-de-servicio';
import { vozServicio } from '@/lib/voz-servicio';
import { useTraduccion } from '@/i18n';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';

/** A dónde lleva «Agendar» en cada oficio. **Explícito y no compuesto**: las
 *  rutas son tipadas y armarlas con una plantilla las vuelve `string`, que es
 *  cómo una ruta que ya no existe deja de doler hasta que alguien la toca. */
function rutaDeAgendar(oficio: Oficio): '/explorar/paseo' | '/explorar/grooming' | '/explorar/veterinaria' | '/explorar/adiestramiento' | '/explorar/guarderia' | null {
  switch (oficio) {
    case 'paseo': return '/explorar/paseo';
    case 'grooming': return '/explorar/grooming';
    case 'veterinaria': return '/explorar/veterinaria';
    case 'adiestramiento': return '/explorar/adiestramiento';
    case 'guarderia': return '/explorar/guarderia';
    /* Hotel, despensa, telemedicina y seguros **no tienen pantalla de agendar
       propia** — la telemedicina se agenda dentro de veterinaria y los otros no
       se agendan. `null` ⇒ la destacada no se dibuja (Ley 23: la puerta no
       ofrece lo que va a rechazar). */
    default: return null;
  }
}

export default function PantallaDeOficio() {
  const { oficio: crudo } = useLocalSearchParams<{ oficio?: string }>();
  const cabecera = useAltoDeCabecera('empujada');
  const { theme } = useTheme();
  const { t } = useTraduccion();

  const [direccion, setDireccion] = useState<DireccionHogar | null | 'cargando'>('cargando');
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
      void obtenerDireccionHogar().then((r) => {
        if (vigente) setDireccion(r.ok ? r.data : null);
      });
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

  /* 🔴 **EL OFICIO SE VERIFICA, NO SE CASTEA.** Llega de la URL —un string que
     cualquiera puede escribir— y `esOficio` es el guard que la casa ya tiene
     para este borde. *Un `as Oficio` acá compilaría y pintaría un glifo
     indefinido tres pantallas más adelante.* */
  const oficio: Oficio | null = typeof crudo === 'string' && esOficio(crudo) ? crudo : null;

  const listaPerfiles = Array.isArray(perfiles) ? perfiles : [];
  const puntoCasa =
    direccion !== 'cargando' && direccion !== null && direccion.lat !== null && direccion.lon !== null
      ? { lat: direccion.lat, lon: direccion.lon }
      : null;

  /** Los negocios que hacen ESTE oficio, con su distancia y su precio desde
   *  **de este oficio** — no el mínimo de todo su catálogo. *Un «desde $1» que
   *  sale de otra cosa describe otra cosa.* */
  const deEsteOficio = listaPerfiles
    .flatMap((p) => {
      if (oficio === null) return [];
      const suyos = p.servicios.filter((sv) => oficioDeServicio(sv) === oficio);
      if (suyos.length === 0) return [];
      const precios = suyos
        .map((sv) => sv.precio)
        .filter((x): x is number => typeof x === 'number' && x > 0);
      const km =
        puntoCasa !== null && p.zona_lat !== null && p.zona_lon !== null
          ? distanciaKm(puntoCasa, { lat: p.zona_lat, lon: p.zona_lon })
          : null;
      return [{ perfil: p, km, desde: precios.length > 0 ? Math.min(...precios) : null }];
    })
    .sort((a, b) => {
      if (a.km === null && b.km === null) return 0;
      if (a.km === null) return 1;
      if (b.km === null) return -1;
      return a.km - b.km;
    });

  /** Los subservicios: un `tipo` distinto por tarjeta, con el precio más bajo
   *  que alguien publicó. **Se agrupan por `tipo` y no por `nombre`**: dos
   *  negocios llaman distinto a la misma consulta, y agrupar por el nombre
   *  dibujaría la misma cosa dos veces. */
  const subservicios: Array<Subservicio & { desde: number | null }> = (() => {
    if (oficio === null) return [];
    const porTipo = new Map<string, { nombre: string; desde: number | null }>();
    for (const p of listaPerfiles) {
      for (const sv of p.servicios) {
        if (oficioDeServicio(sv) !== oficio) continue;
        /* La voz del riel manda; el nombre de DB es el respaldo. Sin ninguno de
           los dos **se omite**: jamás se pinta el código del motor. */
        const nombre = vozServicio(t, sv.tipo, sv.nombre);
        if (nombre === null) continue;
        const previo = porTipo.get(sv.tipo);
        const precio = typeof sv.precio === 'number' && sv.precio > 0 ? sv.precio : null;
        if (previo === undefined) {
          porTipo.set(sv.tipo, { nombre, desde: precio });
        } else if (precio !== null && (previo.desde === null || precio < previo.desde)) {
          previo.desde = precio;
        }
      }
    }
    return [...porTipo.entries()].map(([clave, v]) => ({
      clave,
      /* Ver la cabecera: **el glifo del OFICIO, repetido, y declarado.** */
      glifo: glifoDeOficio(oficio),
      nombre: v.nombre,
      desde: v.desde,
    }));
  })();

  /* 🔴 **SIN `as never`, y no es prolijidad: es la regla 34.** Un cast acá
     compilaría con una clave que no existe y la pantalla pintaría el nombre de
     la clave en la cabecera. Este `Record` es explícito y **el compilador lo
     obliga a estar completo** para los oficios que esta pantalla puede recibir. */
  const vozDelOficio = ((): string => {
    switch (oficio) {
      case 'paseo': return t('explorar.servicioPaseo');
      case 'grooming': return t('explorar.servicioGrooming');
      case 'veterinaria': return t('explorar.servicioVet');
      case 'adiestramiento': return t('explorar.servicioAdiestramiento');
      case 'guarderia': return t('explorar.servicioGuarderia');
      case 'telemedicina': return t('servicioVoz.telemedicina');
      /* Los que Explorar muestra y no se agendan: sin voz propia acá, la
         cabecera se queda con la clave vacía y la destacada no se dibuja. */
      default: return '';
    }
  })();
  const ruta = oficio === null ? null : rutaDeAgendar(oficio);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <HojaContenido
        arranque={cabecera.arranque}
        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera
              variante="empujada"
              titulo={vozDelOficio}
              presentacion="fondo"
              onVolver={() => router.back()}
              etiquetaVolver={t('comun.volver')}
            />
          </View>
        }
      >
        <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: AIRE_RAIZ, gap: spacing[6] }}>
          {/* ── LA DESTACADA: el acto principal del oficio ── */}
          {ruta === null ? null : (
            <Tarjeta relleno="amplio">
              <View style={{ gap: spacing[3] }}>
                <Texto variante="seccion">{t('oficioV5.destacadaTitulo', { oficio: vozDelOficio.toLowerCase() })}</Texto>
                <Texto variante="apoyo">{t('oficioV5.destacadaDetalle')}</Texto>
                <Boton
                  bloque
                  etiqueta={t('oficioV5.destacadaCta')}
                  onPress={() => router.push(ruta)}
                />
              </View>
            </Tarjeta>
          )}

          {/* ── QUÉ NECESITAS ── */}
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('oficioV5.queNecesitas')}</Texto>
            {perfiles === 'cargando' ? (
              <EsqueletoGrupo>
                <Esqueleto forma="bloque" ancho="100%" alto={120} />
              </EsqueletoGrupo>
            ) : subservicios.length === 0 ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('oficioV5.sinSubservicios')}
                descripcion={t('oficioV5.sinSubserviciosDetalle')}
              />
            ) : (
              <GrillaSubservicios
                subservicios={subservicios}
                /* El subservicio lleva a su detalle. **La clave es el `tipo`**,
                   que es lo que identifica el servicio en todo el motor. */
                onElegir={(clave) => {
                  if (oficio === null) return;
                  router.push({
                    pathname: '/explorar/servicio/[tipo]',
                    params: { tipo: clave, oficio },
                  });
                }}
              />
            )}
          </View>

          {/* ── QUIÉN LO HACE ── */}
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('oficioV5.quienLoHace')}</Texto>
            {perfiles === 'cargando' ? (
              <EsqueletoGrupo>
                <View style={{ gap: spacing[3] }}>
                  <Esqueleto forma="bloque" ancho="100%" alto={96} />
                  <Esqueleto forma="bloque" ancho="100%" alto={96} />
                </View>
              </EsqueletoGrupo>
            ) : perfiles === 'error' ? (
              <EstadoVacio registro="seccion" titulo={t('oficioV5.error')} descripcion={t('hogar.errorHistoriaDetalle')} />
            ) : deEsteOficio.length === 0 ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('oficioV5.sinPrestadores')}
                descripcion={t('oficioV5.sinPrestadoresDetalle')}
              />
            ) : (
              <View style={{ gap: spacing[3] }}>
                {deEsteOficio.map((r) => (
                  <TarjetaPrestador
                    key={r.perfil.id}
                    nombre={r.perfil.nombre_comercial}
                    retrato={
                      <AvatarMascota
                        nombre={r.perfil.nombre_comercial}
                        fotoUrl={r.perfil.foto_url === null ? undefined : logos.get(r.perfil.foto_url)}
                        tamano="md"
                      />
                    }
                    lineaOficio={
                      r.km === null
                        ? vozDelOficio
                        : t('explorarV5.lineaOficioDistancia', { oficio: vozDelOficio, km: r.km.toFixed(1) })
                    }
                    /* Sin reseñas la línea NO existe — contrato de la pieza, y
                       hoy los once negocios están en cero. */
                    calificacion={null}
                    vozResenas={null}
                    desde={r.desde}
                    vozDesde={t('explorarV5.desde')}
                    vozVer={t('explorarV5.ver')}
                    onPress={() =>
                      router.push({ pathname: '/prestador/[prestadorId]', params: { prestadorId: r.perfil.id } })
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </HojaContenido>
    </View>
  );
}
