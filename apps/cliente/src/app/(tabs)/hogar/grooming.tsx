/**
 * EL HUB DE GROOMING DEL DUEÑO (S60-A4, hallazgo de gate founder):
 * entre el pago y el inicio de la atención, la cita ya tiene superficie.
 * DOS taps — Próximos (la sesión confirmada con verdad firme: servicio,
 * fecha, hora, groomer y EL DÓNDE) · Historial (los cerrados, navegando
 * al parte del cierre) — + Agendar arriba, que aterriza en el CUÁNDO.
 * SIN tap Agenda: no hay plan en v1 (§9); el solape Próximos/Agenda del
 * hub del paseo es defecto anotado en D-366 y NO se clona.
 *
 * S82-C r31 — EL PATRÓN DEL LOG, APLICADO (no copiado). Lo que viaja
 * de paseo porque está FIRMADO EN DISPOSITIVO: la hilera de mascota con
 * la HUELLA marcando la elegida · el eje de ESTADO en FiltroPills · el
 * de FECHA **solo en historial** · el CTA VIVO en pie fijo que nombra a
 * la mascota y, apagado, dice qué falta · y el historial con el canto
 * que pinta la curva.
 * LO QUE **NO** VIAJA, y es la mitad que importa: el cuerpo del paseo
 * (plan / paquete / P18) NO existe acá — grooming no tiene plan en v1
 * (§9). Aplicar el patrón es traer la GRAMÁTICA, no el contenido.
 *
 * ESCALERA (§4b): peldaño 0 = vacíos con camino (Agendar) · peldaño 1 =
 * todo lo pintado es REAL (citas pagadas, dirección de sede sembrada) ·
 * peldaño 2 = el parte del cierre (fotos + mensaje) vive en la historia.
 */

import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaCita,
  FilaDato,
  Icono,
  Insignia,
  Separador,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  obtenerMisGroomings,
  resolverUrlsFotos,
  type GroomingDelHogar,
  type EstadoVidaMascota,
} from '@epetplace/api';
import { fechaCortaMono } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';
import { ofrecibles, useEspeciesElegibles } from '@/lib/especies-elegibles';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';
import { vozServicio } from '@/lib/voz-servicio';
import { FiltroMascotas, FiltroPills } from '@/components/filtro-pills';
import { esHistorial, esProxima } from '@/lib/corte-agenda';
import { DetalleCita } from '@/components/detalle-cita';

type Tap = 'proximos' | 'historial';

export default function HubGrooming() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const [tap, setTap] = useState<Tap>('proximos');
  const [filas, setFilas] = useState<GroomingDelHogar[] | 'cargando' | 'error'>('cargando');
  // r31 · LOS TRES EJES DEL LOG. El de FECHA solo existe en historial:
  // en próximos no parte los datos y un eje que no parte NO SE DIBUJA.
  const [filtroMascota, setFiltroMascota] = useState<string | null>(null);
  const [ventanaFecha, setVentanaFecha] = useState<'todos' | 'semana' | 'mes'>('todos');
  const [mascotasHogar, setMascotasHogar] = useState<{ id: string; nombre: string; fotoUrl?: string; especie: string; estado_vida: EstadoVidaMascota | null }[]>([]);
  const faseEspecies = useEspeciesElegibles('grooming');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [pidiendoMascota, setPidiendoMascota] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const cargar = useCallback(() => {
    setFilas('cargando');
    void obtenerMisGroomings().then((r) => {
      setFilas(r.ok ? r.data : 'error');
    });
    void getEstadoOnboardingDueno().then(async (e) => {
      if (!e.ok || e.data.familia_id === null) return;
      const r = await obtenerMascotasDeFamilia(e.data.familia_id);
      if (!r.ok) return;
      const paths = r.data.map((m) => m.foto_url).filter((x): x is string => typeof x === 'string' && x.length > 0);
      const urls = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
      setMascotasHogar(
        r.data.map((m) => ({ id: m.id, nombre: m.nombre, especie: m.especie, estado_vida: m.estado_vida, fotoUrl: caraDeMascotaPorRuta({
            especie: m.especie,
            rutaImagen: m.raza_ruta_imagen,
            fotoUri: m.foto_url ? urls.get(m.foto_url) : undefined,
          }) })),
      );
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  // Próximos = lo confirmado por venir (verdad firme; el EN VIVO vive en
  // el Hogar como celda viva) · Historial = lo cerrado, del más reciente.
  const porMascota = (f: GroomingDelHogar) => filtroMascota === null || f.mascota_id === filtroMascota;
  const cortePorVentana = (iso: string) => {
    if (ventanaFecha === 'todos') return true;
    const d = new Date();
    d.setDate(d.getDate() - (ventanaFecha === 'semana' ? 7 : 30));
    return iso >= new Intl.DateTimeFormat('en-CA').format(d);
  };
  // r39 · el corte sale de la FRONTERA: le faltaba el eje TIEMPO (una
  // cita confirmada de ayer se quedaba en "próximos" para siempre).
  // `cerrada` para grooming = tiene atención cerrada o el motor la dio
  // por completada.
  const cerradaG = (f: GroomingDelHogar) => f.atencion_id !== null || f.estado === 'completada';
  const proximos = Array.isArray(filas)
    ? filas.filter((f) => porMascota(f) && esProxima(f.fecha, cerradaG(f)))
    : [];
  const historial = Array.isArray(filas)
    ? filas
        .filter((f) => porMascota(f) && esHistorial(f.fecha, cerradaG(f)) && cortePorVentana(f.fecha))
        .sort((a, b) => (a.fecha > b.fecha ? -1 : 1))
    : [];
  const hayAlgo = Array.isArray(filas) && filas.length > 0;
  // 🔴 EL CTA MUERTO DE UNA SOLA MASCOTA (el defecto que costó caro en
  // paseo, vivo desde r12 sin que nadie lo viera): la hilera NO se monta
  // con 1, así que atar el CTA a "hay una elegida en la hilera" lo deja
  // apagado PARA SIEMPRE en el hogar más común del producto. Con UNA no
  // hay nada que elegir — la puerta no pregunta lo que ya sabe (Ley 23).
  const elegida =
    mascotasHogar.find((m) => m.id === filtroMascota) ??
    (mascotasHogar.length === 1 ? mascotasHogar[0] : null);

  const subtituloDe = (f: GroomingDelHogar, conDonde: boolean): string =>
    [
      f.mascota_nombre,
      f.prestador_nombre,
      conDonde ? (f.direccion !== null ? [f.direccion, f.ciudad].filter(Boolean).join(', ') : t('grooming.enSuLocal')) : null,
    ]
      .filter(Boolean)
      .join(' · ');

  const filaHistorial = (f: GroomingDelHogar, cerrada: boolean) => {
    const abierto = abierta === f.cita_id;
    return (
      <FilaCita
        key={f.cita_id}
        oficio="grooming"
        // r41 · la variante: sin cara (el log ya filtra por mascota y la
        // fila la nombra) y DESPLIEGA — esta fila no abre Hoja ni lleva a
        // ningún lado: muestra información en su lugar, como su hermana
        // de historial. El criterio firmado, aplicado.
        cara={false}
        direccion={abierta === f.cita_id ? 'arriba' : 'abajo'}
        titulo={vozServicio(t, f.tipo_servicio, f.servicio_nombre) ?? f.servicio_nombre}
        subtitulo={f.mascota_nombre ?? undefined}
        metadataMono={`${fechaCortaMono(f.fecha, idioma)} · ${f.hora}`}
        mascota={{ nombre: f.mascota_nombre ?? '', fotoUrl: undefined }}
        fin={cerrada ? <Insignia estado="alDia" etiqueta={t('plan.salidaCompletada')} tamaño="sm" /> : undefined}
        acciones={
          abierta === f.cita_id ? (
            <DetalleCita
              prestador={f.prestador_nombre}
              costo={f.precio}
              etiquetaPrestador={t('grooming.dondeEtiqueta')}
              etiquetaCosto={t('presupuesto.total')}
              accion={
                f.atencion_id !== null
                  ? {
                      etiqueta: t('hogar.acordeonVerCompleto'),
                      onPress: () => {
                        if (f.atencion_id !== null) {
                          router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: f.atencion_id } });
                        }
                      },
                    }
                  : undefined
              }
            />
          ) : undefined
        }
        onPress={() => setAbierta(abierta === f.cita_id ? null : f.cita_id)}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('grooming.hubTitulo')} atras onAtras={() => router.back()} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[4] }}
      >
        {/* ① la MASCOTA — el PRIMER filtro. Entra SIN filtro y ninguna
            nace elegida (el chip "Todas" murió: el log sin filtro ES el
            estado inicial, no una opción que haya que tocar). */}
        {mascotasHogar.length > 1 ? (
          <View style={{ marginHorizontal: -spacing[4] }}>
            <FiltroMascotas
              mascotas={ofrecibles(mascotasHogar, faseEspecies)}
              elegida={filtroMascota}
              onElegir={(id) => {
                setFiltroMascota(id);
                if (id !== null) setPidiendoMascota(false);
              }}
            />
          </View>
        ) : null}
        {pidiendoMascota ? <Texto variante="apoyo" color="danger">{t('plan.elegiMascota')}</Texto> : null}

        {/* ② el ESTADO. `capa: null` — próximos/historial es ESTADO, no
            categoría: el color de capa es de una CLASE DE SERVICIO
            (Ley 10) y este eje no tiene ninguna. */}
        <View style={{ marginHorizontal: -spacing[4] }}>
          <FiltroPills
            activo={tap}
            onCambio={(c) => setTap(c)}
            opciones={[
              { codigo: 'proximos' as Tap, etiqueta: t('plan.segProximos'), icono: 'hoy', capa: null },
              { codigo: 'historial' as Tap, etiqueta: t('plan.segHistorial'), icono: 'grooming', capa: null },
            ]}
          />
        </View>

        {/* ③ la FECHA — SOLO en historial: en próximos no parte los datos */}
        {tap === 'historial' ? (
          <View style={{ marginHorizontal: -spacing[4] }}>
            <FiltroPills
              activo={ventanaFecha}
              onCambio={(v) => setVentanaFecha(v)}
              opciones={[
                { codigo: 'todos' as const, etiqueta: t('plan.filtroTodos'), icono: null, capa: null },
                { codigo: 'semana' as const, etiqueta: t('perfil.ventanaSemana'), icono: null, capa: null },
                { codigo: 'mes' as const, etiqueta: t('perfil.ventanaMes'), icono: null, capa: null },
              ]}
            />
          </View>
        ) : null}

        {filas === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : filas === 'error' ? (
          <EstadoVacio
            titulo={t('grooming.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : tap === 'proximos' ? (
          proximos.length === 0 ? (
            <EstadoVacio
              registro="seccion"
              icono={<Icono nombre="grooming" tamano={48} />}
              titulo={t('grooming.hubProximosVacio')}
              descripcion={t('grooming.hubProximosVacioDetalle')}
            />
          ) : (
            <View style={{ gap: spacing[2.5] }}>{proximos.map((f) => filaHistorial(f, false))}</View>
          )
        ) : historial.length === 0 ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('grooming.hubHistorialVacio')}
            descripcion={t('grooming.hubHistorialVacioDetalle')}
          />
        ) : (
          <View style={{ gap: spacing[2.5] }}>{historial.map((f) => filaHistorial(f, true))}</View>
        )}
      </ScrollView>

      {/* EL CTA VIVO, en PIE FIJO. Apagado SIGUE TOCABLE (razonDeshabilitado)
          y la ETIQUETA nombra lo que falta además del hint — S63-B: el
          apagado dice qué falta SIEMPRE; el hint no lo reemplaza. */}
      {/* 🔴 r35 · EL CTA YA NO DEPENDE DE QUE HAYA DATOS. Estaba
          condicionado a `hayAlgo`, así que EL LOG VACÍO SE QUEDABA SIN
          BOTÓN DE RESERVAR — desaparecía exactamente cuando es la única
          acción posible. Lo destapó la familia de CUATRO: con dos
          mascotas que ya tenían historia, el caso no existía. Es la
          misma clase que el resto del salvavidas (r34): lo que no se
          camina, no se ve. */}
      {filas !== 'cargando' && filas !== 'error' ? (
        <View
          style={{
            paddingHorizontal: spacing[4],
            paddingTop: spacing[3],
            paddingBottom: Math.max(insets.bottom, spacing[4]),
            backgroundColor: theme.bg.base,
            borderTopWidth: 1,
            borderTopColor: theme.border.subtle,
          }}
        >
          <Boton
            variante="primario"
            bloque
            etiqueta={
              elegida !== null
                ? t('grooming.agendarDe', { nombre: elegida.nombre })
                : t('plan.agendarFaltaMascota')
            }
            deshabilitado={elegida === null}
            razonDeshabilitado={t('plan.elegiMascota')}
            onRazon={() => {
              setPidiendoMascota(true);
              scrollRef.current?.scrollTo({ y: 0, animated: true });
            }}
            onPress={() => {
              if (elegida === null) return;
              router.navigate({ pathname: '/explorar/grooming', params: { mascotaId: elegida.id } });
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
