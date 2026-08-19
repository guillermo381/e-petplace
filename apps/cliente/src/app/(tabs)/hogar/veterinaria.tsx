/**
 * EL LOG DE VETERINARIA — el hub del oficio para el dueño (S82-A r9;
 * paga **D-493**, declarada desde S73: el rail vet navegaba a
 * `/citas/[mascotaId]` como destino prestado y en un hogar multi-mascota
 * aterrizaba en UNA sola).
 *
 * Replica el patrón que C fijó en el log del paseo (r12), con la
 * gramática de la casa: tres ejes con `FiltroPills` · el CTA vivo al pie
 * · la mascota filtrada VIAJANDO al agendar · `CantoCurva` sin banda de
 * color · el nulo honesto · el "desde" del precio.
 *
 * ── LA PREGUNTA DEL MANDATO, MEDIDA: ¿ES DISTINTO A PROPÓSITO O ES UN
 *    HUECO? **ES UN HUECO — pero con dos habitantes propios que el
 *    patrón del paseo no tiene, y por eso el patrón se adopta con
 *    diferencias declaradas, no calcado.**
 *
 * LO QUE LA MEDICIÓN DEVOLVIÓ (DB viva, 30-jul-2026):
 *  · **La cita vet es estructuralmente IDÉNTICA**: misma tabla, mismos
 *    estados (13 citas: 10 confirmada + 3 completada). Nada en su forma
 *    impedía el log — no había diseño distinto, había pantalla faltante.
 *  · **Habitante propio ①, el PRESUPUESTO** (4 vivos, los 4 aprobados):
 *    precede a la cita y es una DECISIÓN del dueño. No existe en paseo
 *    ni grooming. **NO se duplica acá**: su casa es "Ponte al día" del
 *    Hogar (S71), que es donde vive lo que espera respuesta. Duplicarlo
 *    sería pedirle al dueño que decida en dos lugares.
 *  · **Habitante propio ②, el CASO CLÍNICO** (2 vivos) — es el eje
 *    NATURAL del expediente vet ("cómo va la otitis", no "mostrame las
 *    vacunaciones"). **Y HOY NO SE DIBUJA, con su número:
 *    `caso_clinico_id` está en 0 de 13 citas** — el motor todavía no lo
 *    estampa al nacer la cita (nota viva desde S78). Un eje que
 *    devolvería 13 en "sin caso" y 0 en todo lo demás **no parte los
 *    datos, así que no se dibuja** (la regla del founder aplicada contra
 *    el eje que más me gustaba). El contrato ya lo trae para que el día
 *    que el motor lo estampe, agrupar no exija migrar nada.
 *  · **La cita puede nacer SIN FECHA** (`por_coordinar`, legal desde
 *    D-439 al aprobar un presupuesto): hoy 0 filas, pero el lector la
 *    admite y esta pantalla la PRESIDE — una cita que espera fecha es
 *    trabajo del dueño, no una fila más.
 *  · **Hay citas que el dueño NUNCA agendó**: las del MOSTRADOR (walk-in,
 *    S69) nacen en el negocio. Por eso el lector no exige
 *    `estado_reserva = 'pagada'` como el de grooming: ese filtro las
 *    borraría del hub de su propia mascota.
 *
 * EL EJE QUE SÍ PARTE — **TIPO DE CONSULTA, no duración** (el mandato
 * acertó y la medición lo sostiene): consulta general 8 · vacunación 3 ·
 * especializada 1 · procedimiento 1. La duración ni siquiera es del
 * dueño acá (la fija el negocio por menú curado, S68).
 *
 * CANTO: **SALUD** (`capa.identidad`) — el único de los cuatro oficios
 * que no es cuidado (Ley 10: paseo y adiestramiento comparten canto A
 * PROPÓSITO; grooming es cuidado; lo clínico es salud).
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaCita,
  Icono,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { fechaCortaMono } from '@epetplace/i18n';
import {
  getEstadoOnboardingDueno,
  obtenerMisConsultasVet,
  obtenerMascotasDeFamilia,
  resolverUrlsFotos,
  type ConsultaDelHogar,
  type EstadoVidaMascota,
} from '@epetplace/api';

import { CantoCurva } from '@/components/canto-curva';
import { FiltroMascotas, FiltroPills } from '@/components/filtro-pills';
import { esHistorial, esProxima } from '@/lib/corte-agenda';
import { DetalleCita } from '@/components/detalle-cita';
import { vozServicio } from '@/lib/voz-servicio';
import { useTraduccion } from '@/i18n';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

type Segmento = 'proximos' | 'historial';
type EjeTipo = 'todos' | string;

export default function LogVeterinaria() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();

  const [filas, setFilas] = useState<ConsultaDelHogar[] | 'cargando' | 'error'>('cargando');
  const [mascotas, setMascotas] = useState<{ id: string; nombre: string; fotoUrl?: string; especie: string; estado_vida: EstadoVidaMascota | null }[]>([]);
  const faseEspecies = useEspeciesElegibles('veterinario');
  // ① la MASCOTA — el PRIMER filtro (null = todas, sin chip activo)
  const [mascotaElegida, setMascotaElegida] = useState<string | null>(null);
  // r34 · el CTA vivo necesita señalar la hilera cuando falta la mascota
  const [pidiendoMascota, setPidiendoMascota] = useState(false);
  /** S91-C · EL FALLO CON NOMBRE Y CÓDIGO (orden de mesa, hallazgo de D).
   *  Las ramas de este hub caían en UNA frase —y dos de ellas ni eso:
   *  hacían `if (!r.ok) return` y desaparecían EN SILENCIO—. Un síntoma
   *  que no se puede accionar es tan caro como el defecto que oculta: el
   *  caso del founder llevó CINCO vueltas por esto. Cada rama dice cuál
   *  es y trae el código CRUDO del wrapper. */
  const [fallos, setFallos] = useState<{ rama: string; codigo: string }[]>([]);
  const sumarFallo = useCallback((rama: string, codigo: string) => {
    setFallos((prev) => (prev.some((f) => f.rama === rama) ? prev : [...prev, { rama, codigo }]));
  }, []);

  const [abierta, setAbierta] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // ② el ESTADO
  const [segmento, setSegmento] = useState<Segmento>('proximos');
  // ③ el TIPO DE CONSULTA — solo en historial (ver abajo)
  const [tipo, setTipo] = useState<EjeTipo>('todos');

  const cargar = useCallback(() => {
    setFilas('cargando');
    void obtenerMisConsultasVet().then((r) => setFilas(r.ok ? r.data : 'error'));
    // las mascotas del hogar alimentan el PRIMER filtro — patrón de C en
    // el log del paseo, copiado al vecino (incluida la resolución de
    // fotos EN BATCH: una firma por foto sería N+1)
    void getEstadoOnboardingDueno().then(async (e) => {
      // ⚠️ ANTES ERA `return` A SECAS — el lector fallaba y la pantalla
      // se callaba: el filtro de mascotas no aparecía y nadie decía por qué.
      if (!e.ok) return sumarFallo('mascotas', e.codigo);
      if (e.data.familia_id === null) return sumarFallo('mascotas', 'sin_familia');
      const r = await obtenerMascotasDeFamilia(e.data.familia_id);
      if (!r.ok) return sumarFallo('mascotas', r.codigo);
      const paths = r.data.map((m) => m.foto_url).filter((x): x is string => typeof x === 'string' && x.length > 0);
      const urls = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
      setMascotas(
        r.data.map((m) => ({
          id: m.id,
          nombre: m.nombre,
          especie: m.especie,
          estado_vida: m.estado_vida,
          fotoUrl: caraDeMascotaPorRuta({
            especie: m.especie,
            rutaImagen: m.raza_ruta_imagen,
            fotoUri: m.foto_url ? urls.get(m.foto_url) : undefined,
          }),
        })),
      );
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const lista = Array.isArray(filas) ? filas : [];
  const porMascota = mascotaElegida === null ? lista : lista.filter((c) => c.mascota_id === mascotaElegida);

  // "Próximos" incluye LO QUE ESPERA FECHA — una cita firme sin día es
  // trabajo pendiente del dueño, no historia.
  // r39 · el corte por la FRONTERA. ⚠️ Y ACÁ VIVE D-439: las citas
  // FIRMES SIN FECHA (presupuesto aprobado, coordinación pendiente)
  // tienen `fecha` null — un corte `fecha >= hoy` las hacía DESAPARECER
  // de las dos listas, que es el bug de S71 exacto. La frontera las
  // trata como PRÓXIMAS: todavía no ocurrió nada.
  const cerradaV = (c: (typeof porMascota)[number]) => c.atencion_id !== null || c.estado === 'completada';
  const proximos = porMascota.filter((c) => esProxima(c.fecha, cerradaV(c)));
  const historial = porMascota
    .filter((c) => esHistorial(c.fecha, cerradaV(c)))
    .sort((a, b) => ((a.fecha ?? '') > (b.fecha ?? '') ? -1 : 1));

  // El eje de TIPO se computa sobre lo que HAY en el historial: si un
  // solo tipo lo cubre entero, el eje no parte nada y NO se dibuja.
  const tiposPresentes = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of historial) m.set(c.tipo_servicio, vozServicio(t, c.tipo_servicio, c.servicio_nombre) ?? c.servicio_nombre);
    return [...m.entries()];
  }, [historial, t]);

  const historialFiltrado = tipo === 'todos' ? historial : historial.filter((c) => c.tipo_servicio === tipo);

  const cuando = (c: ConsultaDelHogar): string =>
    c.fecha === null
      ? t('logVet.esperaFecha') // el nulo honesto: no hay día, y se dice
      : `${fechaCortaMono(c.fecha, idioma)}${c.hora !== null ? ` · ${c.hora}` : ''}`;

  const visibles = segmento === 'proximos' ? proximos : historialFiltrado;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('logVet.titulo')} atras onAtras={() => router.back()} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[2],
          // el pie fijo no tapa la última fila
          paddingBottom: insets.bottom + spacing[20],
          gap: spacing[4],
        }}
      >
        {/* ① la MASCOTA — el primer filtro (con L-b adentro: la pieza de
            C decide relleno vs barrido según cuántos hermanos hay) */}
        {mascotas.length > 1 ? (
          <View style={{ marginHorizontal: -spacing[4] }}>
            <FiltroMascotas
              mascotas={ofrecibles(mascotas, faseEspecies)}
              elegida={mascotaElegida}
              onElegir={(id) => {
                setMascotaElegida(id);
                if (id !== null) setPidiendoMascota(false);
              }}
            />
          </View>
        ) : null}
        {/* el mensaje SEÑALA la hilera: vive pegado a ella, jamás flotando
            en el medio — el ojo sabe a dónde ir porque el texto está donde
            está la respuesta. */}
        {pidiendoMascota ? <Texto variante="apoyo" color="danger">{t('plan.elegiMascota')}</Texto> : null}

        {/* ② el ESTADO — sin capa: este eje no es una clase de servicio
            (Ley 10), así que no pide prestado ningún color */}
        <View style={{ marginHorizontal: -spacing[4] }}>
          <FiltroPills
            activo={segmento}
            onCambio={(c) => setSegmento(c)}
            opciones={[
              { codigo: 'proximos' as Segmento, etiqueta: t('plan.segProximos'), icono: 'hoy', capa: null },
              { codigo: 'historial' as Segmento, etiqueta: t('plan.segHistorial'), icono: 'veterinaria', capa: null },
            ]}
          />
        </View>

        {/* ③ el TIPO DE CONSULTA — SOLO en historial y SOLO si hay 2+
            tipos: con uno solo no parte los datos y no se dibuja. (El
            eje del CASO no se dibuja tampoco, y su porqué está medido en
            la cabecera: 0 de 13 citas lo tienen estampado.) */}
        {segmento === 'historial' && tiposPresentes.length > 1 ? (
          <View style={{ marginHorizontal: -spacing[4] }}>
            <FiltroPills
              activo={tipo}
              onCambio={(v) => setTipo(v)}
              opciones={[
                { codigo: 'todos', etiqueta: t('plan.filtroTodos'), icono: null, capa: null },
                ...tiposPresentes.map(([codigo, etiqueta]) => ({ codigo, etiqueta, icono: null, capa: null })),
              ]}
            />
          </View>
        ) : null}

        {filas === 'cargando' ? (
          <EsqueletoGrupo etiqueta={t('logVet.cargando')}>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : filas === 'error' ? (
          <EstadoVacio
            titulo={t('hogar.falloServicios', { servicio: t('hogar.railVet').toLowerCase() })}
            descripcion={`${t('hogar.falloDetalle')}\n${fallos.map((f) => `${f.rama}: ${f.codigo}`).join(' · ')}`}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : visibles.length === 0 ? (
          <EstadoVacio
            registro="seccion"
            icono={<Icono nombre="veterinaria" tamano={48} />}
            titulo={segmento === 'proximos' ? t('logVet.vacioProximos') : t('logVet.vacioHistorial')}
            descripcion={segmento === 'proximos' ? t('logVet.vacioProximosDetalle') : t('logVet.vacioHistorialDetalle')}
          />
        ) : (
          <View style={{ gap: spacing[2.5] }}>
            {visibles.map((c) => {
              // r41 · la variante + el criterio firmado. La fila del
              // HISTORIAL con parte NAVEGA a otra pantalla (›); la de
              // PRÓXIMOS no tiene a dónde ir y no abre nada, así que no
              // promete: despliega en su lugar (⌄).
              const navega = c.atencion_id !== null;
              return (
                <FilaCita
                  key={c.cita_id}
                  oficio="veterinaria"
                  cara={false}
                  direccion={navega ? 'derecha' : abierta === c.cita_id ? 'arriba' : 'abajo'}
                  titulo={c.mascota_nombre ?? t('veterinaria.titulo')}
                  // r41 · el subtítulo YA NO repite la mascota: con el
                  // título diciendo su nombre, `subtitulo(c)` la decía dos
                  // veces en la misma fila (regla Chanel). Queda el
                  // prestador, que es lo que el título no dice.
                  subtitulo={c.prestador_nombre ?? undefined}
                  metadataMono={cuando(c)}
                  mascota={{ nombre: c.mascota_nombre ?? '' }}
                  acciones={
                    !navega && abierta === c.cita_id ? (
                      <DetalleCita
                        prestador={c.prestador_nombre}
                        costo={c.precio}
                        etiquetaPrestador={t('veterinaria.paraQuien')}
                        etiquetaCosto={t('presupuesto.total')}
                        // ⚠️ en vet el costo PUEDE NO EXISTIR hasta que haya
                        // presupuesto. Ahí la fila dice lo que SABE con la
                        // voz honesta del oficio, en vez de un "$ 0,00" que
                        // sería mentira con formato de dato (L-139).
                        vozSinCosto={t('logVet.desdeNota')}
                      />
                    ) : undefined
                  }
                  onPress={() => {
                    if (navega && c.atencion_id !== null) {
                      router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: c.atencion_id } });
                      return;
                    }
                    setAbierta(abierta === c.cita_id ? null : c.cita_id);
                  }}
                />
              );
            })}
          </View>
        )}

        {/* EL "DESDE" — el precio de una consulta VARÍA por negocio y por
            tipo, así que acá jamás se afirma un número cerrado; la
            portada del oficio lo resuelve contra ofertas reales. */}
        {Array.isArray(filas) && visibles.length > 0 ? (
          <Texto variante="apoyo">{t('logVet.desdeNota')}</Texto>
        ) : null}
      </ScrollView>

      {/* EL CTA VIVO al pie, y LA MASCOTA FILTRADA VIAJA con él */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing[4],
          paddingTop: spacing[3],
          paddingBottom: insets.bottom + spacing[3],
          backgroundColor: theme.bg.base,
        }}
      >
        {(() => {
          // 🔴 r34 · EL CTA NAVEGABA SIN MASCOTA — y la reserva del otro
          // lado ya no la pregunta, así que el usuario aterrizaba en una
          // pantalla sin sujeto. Es el CTA VIVO que paseo tiene curado
          // desde r15, traído acá: nace APAGADO pero TOCABLE, la razón
          // señala la hilera, y la ETIQUETA NOMBRA lo que falta además
          // del hint (S63-B: el apagado dice qué falta SIEMPRE; una
          // razón que solo aparece al tocar está escondida).
          // Con UNA sola mascota se resuelve sola: la hilera no se monta
          // con una y atar el CTA a ella lo dejaría muerto para siempre
          // (Ley 23 — la puerta no pregunta lo que ya sabe). Es el mismo
          // defecto que en paseo vivió desde r12 sin que nadie lo viera.
          const elegida =
            mascotas.find((m) => m.id === mascotaElegida) ?? (mascotas.length === 1 ? mascotas[0] : null);
          return (
            <Boton
              variante="primario"
              bloque
              etiqueta={elegida !== null ? t('logVet.agendarDe', { nombre: elegida.nombre }) : t('plan.agendarFaltaMascota')}
              deshabilitado={elegida === null}
              razonDeshabilitado={t('plan.elegiMascota')}
              onRazon={() => {
                setPidiendoMascota(true);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              }}
              onPress={() => {
                if (elegida === null) return;
                router.navigate({ pathname: '/explorar/veterinaria', params: { mascotaId: elegida.id } });
              }}
            />
          );
        })()}
      </View>
    </SafeAreaView>
  );
}
