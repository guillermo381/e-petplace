/**
 * GUARDERÍA · **QUIÉN PUEDE** — la lista de lugares, ya filtrada (S107-C).
 *
 * ⏪ **ESTA PANTALLA ADELGAZÓ, y ése era el defecto.** Antes traía el selector
 * de mascota, el de día **y** la lista — o sea **mostraba los lugares antes de
 * que la familia hubiera elegido nada**. *Una lista que aparece antes de la
 * pregunta obliga a leerla dos veces: una para entender qué es, otra cuando ya
 * significa algo.* Ahora llega con **todo decidido** y sólo responde
 * **quién puede**.
 *
 * 🔴 **NO VUELVE A PREGUNTAR NADA.** Mascota, modalidad, día y tamaño **viajan
 * por parámetro**. *Volver a ofrecerlos acá los haría re-editables en una
 * pantalla donde ya están decididos* (Ley 23).
 *
 * ── EL PRECIO, SIN UNA SOLA CUENTA ───────────────────────────────────────
 * Cada lugar muestra **el número del server para la modalidad pedida**. Si no
 * tiene precio para ella, **se muestra sin número** — *no se lo filtra (filtrar
 * es del server) ni se le inventa uno.*
 */

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Celda,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { obtenerGuarderiasDisponibles, type GuarderiaDisponible } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { CabezalOficio } from '@/components/reserva-piezas';
import { esModalidad, type ModalidadGuarderia } from '@/lib/guarderia-modalidad';

type Lista =
  | { fase: 'cargando' }
  /** Ley 13: se cayó algo. *No es que no haya: no pudimos preguntar.* */
  | { fase: 'noPudimos' }
  /** 🔴 El motor DIAGNOSTICÓ, y su voz ya dice el hecho (A tipó 17 códigos). */
  | { fase: 'causaDelMotor'; mensaje: string }
  | { fase: 'listo'; lugares: GuarderiaDisponible[] };

export default function QuienPuedeGuarderia() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    mascotaId?: string;
    mascotaNombre?: string;
    modalidad?: string;
    fecha?: string;
    tamano?: string;
  }>();

  const modalidad: ModalidadGuarderia = esModalidad(params.modalidad) ? params.modalidad : 'dia';
  const mascotaId = typeof params.mascotaId === 'string' && params.mascotaId.length > 0 ? params.mascotaId : null;
  const fecha = typeof params.fecha === 'string' && params.fecha.length > 0 ? params.fecha : null;

  const [lista, setLista] = useState<Lista>({ fase: 'cargando' });

  useEffect(() => {
    if (mascotaId === null || fecha === null) { setLista({ fase: 'noPudimos' }); return; }
    let vigente = true;
    setLista({ fase: 'cargando' });
    void (async () => {
      /* ✏️ CORRECCIÓN DE A (S107, `d483cf8c`) — **la modalidad VIAJA al
         server**. Escribí esta llamada cuando el filtro todavía no la aceptaba;
         mandarla no es cosmético: *es lo que hace que la lista sean los lugares
         que ofrecen ESA modalidad*, y lo que trae `precioModalidad` resuelto. */
      const r = await obtenerGuarderiasDisponibles({ fecha, mascotaId, modalidad });
      if (!vigente) return;
      /* Un fallo JAMÁS se disfraza de «no hay lugares» (Ley 13). */
      if (r.ok) { setLista({ fase: 'listo', lugares: r.data }); return; }
      /* Un fallo JAMÁS se disfraza de «no hay lugares» (Ley 13) — **y un
         diagnóstico del motor jamás se disfraza de fallo.** */
      setLista(
        r.codigo === 'mascota_no_elegible' || r.codigo === 'no_access_to_mascota'
          ? { fase: 'causaDelMotor', mensaje: r.mensaje }
          : { fase: 'noPudimos' },
      );
    })();
    return () => { vigente = false; };
  }, [mascotaId, fecha]);

  /* ✏️ CRUCE DE A, y su hallazgo corrige el mío: **mi criterio era correcto y
     la fuente estaba equivocada.** Leer el campo de SU modalidad evitaba el peor
     caso —mostrar el precio del día bajo el rótulo de paquete—, pero medido el
     29-ago, `precioPaquete` sale de `prestador_servicios.precio_paquete`, que
     está **NULL**, mientras el motor resuelve desde la tabla `guarderia_paquetes`
     (5d/$40). ⇒ **habría dicho «sin precio» sobre algo que sí se vende, y sin
     un solo error.** Manda `precioModalidad`, que el server ya resolvió.
     🔴 Y el respaldo **nunca cae a `precio`** cuando la modalidad no es día:
     *la ausencia es preferible al precio de otra cosa.* */
  const precioDe = (g: GuarderiaDisponible): number | null =>
    g.precioModalidad ??
    (modalidad === 'dia' ? g.precio : modalidad === 'paquete' ? null : g.precioMensual);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <CabezalOficio
        oficio="guarderia"
        capa="cuidado"
        titulo={t('hubGuarderia.lugaresTitulo')}
        detalle={params.mascotaNombre ?? null}
        onAtras={() => router.back()}
        insetTop={insets.top}
      />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[3], paddingBottom: insets.bottom + spacing[8] }}>
        {lista.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={64} />
            <Esqueleto alto={64} />
          </EsqueletoGrupo>
        ) : lista.fase === 'causaDelMotor' ? (
          /* Sin título de fallo: **no falló nada.** El motor contestó y su
             respuesta es el contenido de la pantalla. */
          <EstadoVacio registro="seccion" titulo={lista.mensaje} />
        ) : lista.fase === 'noPudimos' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('hubGuarderia.listaNoCargoTitulo')}
            descripcion={t('hubGuarderia.listaNoCargoDetalle')}
          />
        ) : lista.lugares.length === 0 ? (
          /* 🔴 NO DEBERÍA VERSE NUNCA: la pantalla anterior no habilita el
             botón sin lugares (Ley 23 — la puerta no ofrece lo que va a
             rechazar). Existe porque **el cupo puede cambiar entre las dos
             pantallas**, y ahí la verdad es de acá. */
          <EstadoVacio
            registro="seccion"
            titulo={t('hubGuarderia.sinLugaresTitulo')}
            descripcion={t('hubGuarderia.sinLugaresDetalle')}
          />
        ) : (
          lista.lugares.map((g) => {
            const precio = precioDe(g);
            return (
              <Celda
                key={g.prestadorId}
                interactiva
                accessibilityRole="button"
                titulo={g.prestadorNombre}
                /* 🔴 `sobrevendido` NO se pinta: para la familia, un lugar que
                   puede recibirla es un lugar que puede recibirla. La
                   sobreventa es problema operativo del prestador. */
                subtitulo={g.ciudad ?? undefined}
                metadataMono={
                  precio === null ? undefined
                  : modalidad === 'dia' ? t('hubGuarderia.porDia', { precio: precio.toFixed(2) })
                  : modalidad === 'mensual' ? t('hubGuarderia.porMes', { precio: precio.toFixed(2) })
                  : t('hubGuarderia.porPaquete', { precio: precio.toFixed(2) })
                }
                onPress={() =>
                  router.push({
                    pathname: '/explorar/guarderia/[prestadorId]',
                    params: { ...params, prestadorId: g.prestadorId, prestadorNombre: g.prestadorNombre },
                  })
                }
              />
            );
          })
        )}

        {/* El día que se está mirando, a la vista: la lista sola no lo dice. */}
        {fecha !== null ? <Texto variante="apoyo">{fecha}</Texto> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
