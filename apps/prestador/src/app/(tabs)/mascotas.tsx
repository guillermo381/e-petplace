/**
 * ⭐ **DATOS** — las vidas que cuidás (ex "Mascotas", S51-B3.3;
 * `DISEÑO_EXPERIENCIA` §14). Historial de mascotas ATENDIDAS —derivado
 * de atenciones cerradas con calidad; el relevamiento S51 midió que
 * cerrar la atención no promueve la cita, así que el derivador honesto
 * es la ATENCIÓN— con acceso directo al detalle icónico. Sin mascotas:
 * EstadoVacio *en preparación, jamás fracasado* (§2.6). Dosis baja.
 *
 * ═══════ S85-C25 · LA TAB SE LLAMA DATOS, Y NO CAMBIÓ DE CONTENIDO ═══
 *
 * **Su eje firmado es *"a quiénes cuido"*, y esta pantalla ya lo era.**
 * El renombre no le agrega nada: le pone el nombre que ya merecía —el
 * founder lo pidió con esas palabras—. **Solo cambió la etiqueta
 * visible**; el archivo y la ruta siguen en `mascotas` porque renombrar
 * la ruta toca el `_layout` y no le aporta NADA a quien la usa.
 *
 * ── ⚠️ LAS TRES FRANJAS QUE **NO** VIVEN ACÁ, Y ES A PROPÓSITO ───────
 * El plan de DATOS traía cinco franjas. **Tres ya tenían casa**, y la
 * medición lo encontró antes de construir:
 *
 * | franja | vive en |
 * |---|---|
 * | ③ **la plata** | NEGOCIO → *Cobros* → `/liquidaciones` |
 * | ④ **el equipo** | NEGOCIO → `/negocio/equipo` |
 * | ⑤ **la trayectoria** | NEGOCIO → `/negocio/estadisticas` |
 *
 * **Y no es un accidente de layout: hay letra que las pone ahí.**
 * `§15b` (*HOY acciona / NEGOCIO gestiona*) y sobre todo el argumento de
 * privacidad de **S72-P1a**: *plata donde no hay gate por rol = la
 * recepción ve los ingresos*. **Traerlas acá reabriría el agujero que
 * ese argumento cerró.** *La mesa no quiere dos tabs contestando la
 * misma pregunta.*
 *
 * ☠️ **Y MURIÓ `components/datos-piezas.tsx`** (S85-C12: `BloqueEquipo`
 * y `BloquePlata`), construido para dos de esas franjas. **Nacieron
 * sueltos —sin pantalla— y ahí está la lección: un bloque sin superficie
 * NO CHOCA CON NADA, así que nadie descubre que su lugar ya estaba
 * ocupado.** *Es el mecanismo de esta sesión en su forma más barata de
 * pagar: se retiró antes de que un usuario viera la duplicación.*
 *
 * ── ② LA FAMILIA: NO ES UNA FRANJA DE ACÁ (firmado) ──────────────────
 * La pregunta es *"quién cuida a ESTA vida"*, no *"qué familias tengo"*
 * — **el sujeto del producto es la MASCOTA, no el hogar** (EL NORTE).
 * ⇒ no le falta un bloque a esta tab: **le falta un dato a la ficha**.
 * El lector pedido a A es por MASCOTA, no por prestador — más angosto
 * que la primera versión del pedido.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  spacing,
  useTheme,
  type AvatarMascotaEspecie,
} from '@epetplace/ui';
import { obtenerMascotasAtendidas, obtenerMiPrestador, resolverUrlsFotos, type MascotaAtendida } from '@epetplace/api';

import { fechaCortaMono } from '@epetplace/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; mascotas: MascotaAtendida[] };

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}


export default function Mascotas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [urlsFotos, setUrlsFotos] = useState<Map<string, string>>(new Map());

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const r = await obtenerMascotasAtendidas(prestador.data.id);
        if (!vigente) return;
        if (!r.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const paths = r.data.map((m) => m.foto_url).filter((p): p is string => typeof p === 'string' && p.length > 0);
        if (paths.length > 0) setUrlsFotos(await resolverUrlsFotos(paths));
        if (vigente) setPantalla({ estado: 'listo', mascotas: r.data });
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  return (
    // S59-B1 (safe area): el Encabezado ya absorbe y PINTA el inset superior
    // — el SafeAreaView top lo duplicaba (doble banda de papel arriba).
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}>
        <Encabezado variante="portada" saludo={t('mascotas.titulo')} />

        {pantalla.estado === 'cargando' && (
          <Tarjeta elevacion="plana">
            <EsqueletoGrupo>
              <View style={{ gap: spacing[4] }}>
                {[0, 1].map((i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                    <Esqueleto forma="circulo" alto={40} />
                    <View style={{ flex: 1, gap: spacing[2] }}>
                      <Esqueleto forma="linea" ancho="50%" />
                      <Esqueleto forma="linea" ancho="30%" />
                    </View>
                  </View>
                ))}
              </View>
            </EsqueletoGrupo>
          </Tarjeta>
        )}

        {pantalla.estado === 'error' && (
          <EstadoVacio
            titulo={t('mascotas.error')}
            descripcion={t('mascotas.errorDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('agenda.reintentar')} onPress={() => setPantalla({ estado: 'cargando' })} />}
          />
        )}

        {pantalla.estado === 'listo' && pantalla.mascotas.length === 0 && (
          // §2.6: en preparación, jamás fracasado
          <EstadoVacio titulo={t('mascotas.vacio')} descripcion={t('mascotas.vacioDetalle')} />
        )}

        {pantalla.estado === 'listo' && pantalla.mascotas.length > 0 && (
          <Tarjeta elevacion="sm" relleno="ninguno">
            {pantalla.mascotas.map((m, i) => (
              <View key={m.mascota_id}>
                {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/mascota/[mascotaId]', params: { mascotaId: m.mascota_id } })}
                  titulo={m.nombre}
                  subtitulo={m.atenciones_total === 1 ? t('mascotas.unaAtencion') : t('mascotas.atenciones', { n: m.atenciones_total })}
                  inicio={
                    <AvatarMascota
                      nombre={m.nombre}
                      fotoUrl={m.foto_url ? urlsFotos.get(m.foto_url) : undefined}
                      especie={esEspecie(m.especie) ? m.especie : undefined}
                      tamano="sm"
                    />
                  }
                  metadataMono={m.ultima_atencion !== null ? fechaCortaMono((m.ultima_atencion).slice(0, 10), idioma) : undefined}
                />
              </View>
            ))}
          </Tarjeta>
        )}
      </ScrollView>
    </View>
  );
}
