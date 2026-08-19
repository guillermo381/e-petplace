/**
 * PASEO — EL QUIÉN (S54-B3.2): paseadores disponibles para la ventana
 * elegida en el CUÁNDO. Recicla la anatomía de la lista B3.1 (que murió
 * como entrada) y le da el TAP VIVO: elegir paseador → (selector de
 * mascota si el hogar tiene más de una) → crear el hold de 15 min →
 * checkout. slot_ocupado en el tap (carrera real) → Aviso honesto +
 * refresh de la lista.
 *
 * ESCALERA (§4b, declarada):
 *  · Peldaño 0 — nadie puede a esa hora: vacío honesto con vuelta al
 *    CUÁNDO en un toque (jamás relleno).
 *  · Peldaño 1 — disponibles REALES: nombre + servicio + precio y
 *    duración de verdad (snapshot al crear el hold).
 *  · Peldaño 2 — datos del expediente del paseador (paseos cerrados con
 *    calidad, partes): HOY NO MUESTRA ninguno (explícito) — la fila se
 *    enriquece por dato cuando existan, no por versión.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerPaseadoresDisponibles,
  type PaseadorDisponible,
  obtenerPerfilesPublicos,
  type PerfilPublico,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';
import { useHogarPaseo } from '@/lib/reserva/paseo';
import { PreviewPrestador } from '@/components/preview-prestador';

export default function PaseoDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ fecha: string; hora: string; duracion: string; plan?: string; mascotaId?: string }>();
  const fecha = typeof params.fecha === 'string' ? params.fecha : '';
  const hora = typeof params.hora === 'string' ? params.hora : '';
  const duracion = Number(params.duracion ?? 0);
  // D-338: modo PLAN — el paseador elegido acá ancla el plan (§6.1 v1.2).
  const modoPlan = params.plan === '1';
  // S61-A3 (gramática canónica): la mascota YA viene elegida del paso 0
  // del CUÁNDO. La Hoja de elección de abajo queda de CINTURÓN (deep
  // link viejo sin param — el flujo no se rompe).
  const mascotaIdParam =
    typeof params.mascotaId === 'string' && params.mascotaId.length > 0 ? params.mascotaId : null;

  const [disponibles, setDisponibles] = useState<PaseadorDisponible[] | 'cargando' | 'error'>('cargando');
  /** S91-C · el enriquecimiento del preview, de `v_prestadores_publicos`
   *  (jamás la tabla). Carga SECUNDARIA: la fila se pinta con lo que el
   *  lector de disponibilidad ya trajo y se completa cuando llega. */
  const [perfiles, setPerfiles] = useState<Record<string, PerfilPublico>>({});

  // Los perfiles de los que SE ESTÁN OFRECIENDO — ni uno más.
  useEffect(() => {
    if (!Array.isArray(disponibles)) return;
    const ids = [...new Set(disponibles.map((x) => x.prestador_id))];
    if (ids.length === 0) return;
    let vigente = true;
    void obtenerPerfilesPublicos(ids).then((r) => {
      if (!vigente || !r.ok) return;
      setPerfiles(Object.fromEntries(r.data.map((pp) => [pp.id, pp])));
    });
    return () => {
      vigente = false;
    };
  }, [disponibles]);

  const cargar = useCallback(() => {
    setDisponibles('cargando');
    void obtenerPaseadoresDisponibles({ fecha, hora, duracion_minutos: duracion }).then((r) => {
      setDisponibles(r.ok ? r.data : 'error');
    });
  }, [fecha, hora, duracion]);

  /* ⚡ D-730 · ESTA PANTALLA YA NO RESERVA, Y RESULTA QUE HACE RATO QUE NO
     RESERVABA. Al mudar el flujo salió a la luz: `alElegir` tenía UN solo
     llamador —el efecto que consumía el pedido que volvía de la ficha—, porque
     desde la anatomía Airbnb de S91-C la fila **abre el perfil, no reserva**.
     *El flujo entero vivía acá para servirle a la ficha, que era la que de
     verdad reservaba y no podía.* Ahora puede, y lo único que queda de todo
     aquello es el HOGAR — y no para reservar: para poder decir «la ventana
     para {nombre}» arriba.
     ☠️ Murieron con el rebote: seis Hojas, once estados y `tomarPedido()`. */
  const { elegibles, fotos } = useHogarPaseo();

  useFocusEffect(
    useCallback(() => {
      // La DISPONIBILIDAD sí se re-pide en cada foco, y es correcto: los slots
      // se ocupan mientras mirás. El HOGAR no — lo guarda el hook.
      cargar();
    }, [cargar]),
  );

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('explorar.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[3] }}>
        {/* la ventana elegida, en voz de máquina — con el PARA QUIÉN
            visible (S61-A3, rasgo 1).
            ⚠️ D-727 — ACÁ SE REUSABA `grooming.ventanaPara`, y el reuso estaba
            DECLARADO a propósito («la misma voz del QUIÉN del grooming, Ley
            17.3»). **La decisión era sana; el literal no**: decía «Grooming
            para {nombre}» y esta pantalla es de PASEO — el founder lo leyó en
            su aparato. *Lo compartible era la FORMA («X para {nombre}»), no el
            texto, porque el texto nombra el oficio.* Ahora cada oficio tiene su
            key y comparten la forma. */}
        {(() => {
          // S73 (letra de elegibilidad, N=1 "no se pregunta pero SE DICE"):
          // sin param y con UNA sola elegible, la auto-elegida del tap
          // (:alElegirMascota) se DICE acá — avatar y nombre visibles ANTES
          // de tocar nada. Auto-seleccionar en silencio era magia (cura b).
          const paraQuien =
            elegibles.find((m) => m.id === mascotaIdParam) ??
            (elegibles.length === 1 ? elegibles[0] : null);
          return (
            <Celda
              inicio={
                paraQuien !== null ? (
                  // xs, no sm: la columna del metadataMono es intocable y con
                  // sm el titulo colapsaba a cero en 420 (hallazgo M3 S73).
                  <AvatarMascota nombre={paraQuien.nombre} fotoUrl={caraDeMascotaPorRuta({ especie: paraQuien.especie, rutaImagen: paraQuien.raza_ruta_imagen, fotoUri: fotos[paraQuien.id] })} tamano="xs" />
                ) : undefined
              }
              titulo={
                paraQuien !== null
                  ? t('paquete.ventanaPara', { nombre: paraQuien.nombre })
                  : t('explorar.paseoTitulo')
              }
              // La ventana APILADA en la zona fin (S44-B4.1): en una sola
              // línea el mono de 26 caracteres exprimía el título a cero
              // con el avatar presente (hallazgo M3 S73).
              metadataMono={fecha}
              fin={<Texto variante="dato">{`${hora} · ${duracion} min`}</Texto>}
            />
          );
        })()}
        {/* P19: la norma DECLARADA en el flujo de reserva — serena, no
            letra chica (la misma voz vive en la pregunta única) */}
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.sm,
            lineHeight: Math.round(typography.size.sm * typography.leading.normal),
            color: theme.text.secondary,
          }}
        >
          {t('paseoSocial.declaracion')}
        </Text>
        <Separador />

        {disponibles === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : disponibles === 'error' ? (
          <EstadoVacio
            titulo={t('explorar.paseadoresError')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : disponibles.length === 0 ? (
          // Peldaño 0 — nadie puede: vuelta barata al CUÁNDO.
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('explorar.nadiePuede')}
            descripcion={t('explorar.nadiePuedeDetalle')}
            accion={<Boton variante="primario" etiqueta={t('explorar.probarOtroHorario')} onPress={() => router.back()} />}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {disponibles.map((p, i) => (
              <View key={p.prestador_servicio_id}>
                {i > 0 ? <Separador /> : null}
                <PreviewPrestador
                  prestadorId={p.prestador_id}
                  ofertaId={p.prestador_servicio_id}
                  nombre={p.prestador_nombre}
                  oficio={t('hogar.railPaseos')}
                  contexto={p.servicio_nombre}
                  precio={`$${p.precio.toFixed(2)} · ${p.duracion_minutos} min`}
                  perfil={perfiles[p.prestador_id]}
                  /* ⚡ D-730 · la ventana viaja con el tap: la ficha la necesita
                     entera para reservar, y estos valores ya venían por la URL
                     de esta pantalla. `mascotaId` puede faltar y está bien —
                     el paseo es el único oficio donde la mascota se elige en el
                     último paso, y el flujo lo sabe. */
                  contextoReserva={{
                    oficio: 'paseo',
                    fecha,
                    hora,
                    duracion: String(duracion),
                    ...(modoPlan ? { plan: '1' } : {}),
                    ...(mascotaIdParam !== null ? { mascotaId: mascotaIdParam } : {}),
                  }}
                />
              </View>
            ))}
          </Tarjeta>
        )}

        {/* 🔴 LA TRAZA, TAMBIÉN EN LA PANTALLA (P0-C 2º síntoma, D-726).
            Estaba solo dentro de los modales, y **el síntoma nuevo no abre
            ningún modal: te saca de la pantalla**. Un instrumento que solo se
            ve cuando sale un cartel no puede medir un rebote silencioso —
            L-221 en chiquito, otra vez. */}
      </ScrollView>

    </SafeAreaView>
  );
}
