/**
 * EL CARRITO — CADA PRODUCTO CON SU DESTINO (S96-D · D-B3/D-B6 ·
 * `LETRA_RECORRIDO_DESPENSA_S96` §6.3/§6.4/§5.2).
 *
 * TESIS (Ley 14): *el pago es tuyo; el producto es de quien lo consume.*
 *
 * FIRMA (Ley 15): EL DESTINO POR ÍTEM (`SelectorDestinoItem` de B) — el
 * carrito mezcla mascotas y lo dice fila por fila. Sin esa columna, al
 * entregar habría que adivinar a qué expediente depositar.
 *
 * CHANEL (Ley 16), lo que NO hay:
 *  · NINGÚN TOTAL. El total con envío e impuestos lo dice el MOTOR al
 *    crear el pedido (checkout) — una suma local seria un segundo
 *    calculador que un día discrepa. La pantalla lo dice honesto.
 *  · Cero urgencia: sin "te quedan X minutos", sin contador. El carrito
 *    espera lo que el dueño necesite (LOYALTY §7.5).
 *
 * ── LAS REGLAS DE LA LETRA QUE VIVEN ACÁ ────────────────────────────────
 *  · SIN DESTINO ES LEGAL (§4): la app nunca adivina de quién es una
 *    compra; ofrece atarla y el dueño decide — incluso después de
 *    entregada (`atarItemAMascota`).
 *  · LA DONACIÓN (§6.4): destino sin mascota. Sin destino elegible (el
 *    refugio lo elige e-PetPlace), jamás entra a un expediente, jamás
 *    otorga beneficio — el detalle lo dice en voz humana.
 *  · ESPECIE NO REGISTRADA (§5.2): "estás comprando comida para aves;
 *    todavía no tenés ninguna registrada — ¿querés hacerlo?" Se OFRECE
 *    con camino real (/hogar/agregar) y la compra SIGUE igual.
 *
 * ESCALERA (§4b): peldaño 0 = carrito vacío con camino a la despensa ·
 * peldaño 1 = ítems con destino elegible · peldaño 2 = familia
 * multi-mascota mezclando destinos y donación en la misma compra.
 *
 * TESTS (§10): voz de familia · L-139 (cero totales inventados) · vacío
 * con camino · cero dark patterns.
 */

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  EstadoVacio,
  SelectorDestinoItem,
  Separador,
  StepperCantidad,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  mascotasElegibles,
  obtenerMascotasDeFamilia,
  resolverUrlFoto,
  type MascotaResumen,
} from '@epetplace/api';
import { LienzoProducto } from '@/components/despensa-piezas';
import {
  fijarCantidad,
  fijarDestino,
  quitarDelCarrito,
  useCarrito,
} from '@/lib/despensa/carrito';
import { useTraduccion } from '@/i18n';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

/** Tres fases, jamás dos (L-218: `[]` es TRES situaciones distintas —
 *  cargando, error y de verdad no hay — y decidir con `length === 0`
 *  ya le dijo al founder que no tenía perros. DOS veces). */
type Fase<T> = T | 'cargando' | 'error';

export default function DespensaCarrito() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const items = useCarrito();

  const [mascotas, setMascotas] = useState<Fase<MascotaResumen[]>>('cargando');
  const [fotos, setFotos] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente) return;
        if (!estado.ok || !estado.data.familia_id) {
          setMascotas('error');
          return;
        }
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente) return;
        setMascotas(r.ok ? r.data : 'error');
        if (!r.ok) return;
        const conFoto = r.data.filter(
          (m): m is MascotaResumen & { foto_url: string } => m.foto_url !== null,
        );
        if (conFoto.length === 0) return;
        const urls = await Promise.all(conFoto.map((m) => resolverUrlFoto(m.foto_url)));
        if (!vigente) return;
        const mapa: Record<string, string> = {};
        conFoto.forEach((m, i) => {
          const u = urls[i];
          if (u !== null) mapa[m.id] = u;
        });
        setFotos(mapa);
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  const listaMascotas = Array.isArray(mascotas) ? mascotas : [];

  // Elegibles como destino: memorial y perdida NO consumen alimento nuevo —
  // misma frontera que Descubrir (LOYALTY §7.1 estructural).
  const elegibles = useMemo(() => mascotasElegibles(listaMascotas, null), [listaMascotas]);
  const destinos = useMemo(
    () =>
      elegibles.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        fotoUrl: caraDeMascotaPorRuta({
          especie: m.especie,
          rutaImagen: m.raza_ruta_imagen,
          fotoUri: fotos[m.id],
        }),
      })),
    [elegibles, fotos],
  );

  /** Las especies que la familia YA tiene registradas (todas, no solo
   *  elegibles: un ave en memorial sigue probando que la familia registra
   *  aves — la invitación de §5.2 es para especies NUNCA registradas). */
  const especiesFamilia = useMemo(
    () => new Set(listaMascotas.map((m) => m.especie)),
    [listaMascotas],
  );

  /** §5.2 — el ítem es para una especie que la familia no registró. Solo
   *  se AFIRMA con la lista realmente cargada (Array): en 'cargando' o
   *  'error' no se puede afirmar nada sobre la familia y no se dice nada. */
  function especieNoRegistrada(item: { especies_aplicables: string[] }): boolean {
    if (!Array.isArray(mascotas) || mascotas.length === 0) return false;
    if (item.especies_aplicables.length === 0) return false;
    return !item.especies_aplicables.some((e) => especiesFamilia.has(e));
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('despensa.carritoTitulo')}
        atras
        onAtras={() => router.back()}
      />

      {items.length === 0 ? (
        <EstadoVacio
          titulo={t('despensa.carritoVacioTitulo')}
          descripcion={t('despensa.carritoVacioDetalle')}
          accion={
            <Boton
              variante="secundario"
              etiqueta={t('despensa.carritoVacioIr')}
              onPress={() => router.back()}
            />
          }
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingTop: spacing[4],
              paddingBottom: insets.bottom + spacing[8] + 120,
              gap: spacing[5],
            }}
          >
            {items.map((item, i) => (
              <View key={item.oferta_id} style={{ gap: spacing[3] }}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  inicio={<LienzoProducto lado={56} fotoUrl={item.foto_url} />}
                  titulo={item.nombre}
                  subtitulo={[item.marca, item.presentacion]
                    .filter((x) => x !== null && x !== '')
                    .join(' · ')}
                  metadataMono={`$ ${item.precio.toFixed(2)}`}
                />
                <View
                  style={{
                    paddingHorizontal: spacing[5],
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <StepperCantidad
                    valor={item.cantidad}
                    min={1}
                    max={99}
                    onCambio={(n) => fijarCantidad(item.oferta_id, n)}
                    etiqueta={t('despensa.cantidadDe', { nombre: item.nombre })}
                  />
                  {/* Acción de fila: label sin caja (19.7) — quitar EJECUTA. */}
                  <Boton
                    variante="secundario"
                    etiqueta={t('despensa.quitar')}
                    onPress={() => quitarDelCarrito(item.oferta_id)}
                  />
                </View>

                {/* EL DESTINO (§6.3) — la firma. null es legal y se ata después.
                    Con las mascotas en error NO se finge una familia vacía:
                    se dice, y el destino se puede atar después (§4). */}
                <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
                  {mascotas === 'error' ? (
                    <Texto variante="apoyo" color="warning">
                      {t('despensa.errorMascotasDestino')}
                    </Texto>
                  ) : null}
                  <SelectorDestinoItem
                    mascotas={destinos}
                    destino={item.destino}
                    onCambiar={(d) => fijarDestino(item.oferta_id, d)}
                    rotulo={t('despensa.paraQuien')}
                    etiquetaDonacion={t('despensa.donarEste')}
                    detalleDonacion={t('despensa.donacionDetalle')}
                  />
                </View>

                {/* §5.2 — especie no registrada: se ofrece, la compra sigue. */}
                {especieNoRegistrada(item) && item.destino === null ? (
                  <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
                    <Texto variante="apoyo">
                      {t('despensa.especieNoRegistrada')}
                    </Texto>
                    <Boton
                      variante="secundario"
                      etiqueta={t('despensa.registrarla')}
                      onPress={() => router.push('/hogar/agregar')}
                    />
                  </View>
                ) : null}
              </View>
            ))}

            {/* La honestidad del total: lo dice el motor, no esta pantalla. */}
            <View style={{ paddingHorizontal: spacing[5] }}>
              <Texto variante="apoyo">{t('despensa.totalLoDiceElMotor')}</Texto>
            </View>
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: spacing[5],
              paddingTop: spacing[3],
              paddingBottom: insets.bottom + spacing[3],
              backgroundColor: theme.bg.base,
            }}
          >
            <Boton
              etiqueta={t('despensa.continuar')}
              bloque
              onPress={() => router.push('/despensa/checkout')}
            />
          </View>
        </>
      )}
    </View>
  );
}
