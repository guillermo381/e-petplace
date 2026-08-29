/**
 * EXPLORAR v1 — descubrimiento DELIBERADO (S51-B2.4, DISEÑO_EXPERIENCIA
 * §8): para cuando el dueño BUSCA. Tres bloques:
 *   1. Servicios ACTIVOS por country_config (la DB dice la verdad —
 *      regla 21; cero hardcode). v1 son fichas informativas SIN CTA
 *      muerta: agendar llega con A2 y se dice honesto.
 *   2. Refugios/adopción (M0, día 1): hoy 0 refugios en DB → vacío
 *      digno que dice la verdad.
 *   3. "Próximamente honesto" — sin fechas prometidas (hotel,
 *      guardería, seguros, telemedicina, Prime preparado-apagado).
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Celda,
  Boton,
  Chevron,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import type { ReactNode } from 'react';
import { obtenerServiciosPais, type ServiciosPais } from '@epetplace/api';

// S58 (D-361): adiestramiento migró al set b′ — la estrella murió
// (violaba el set); el silbato canónico vive en el registry.
import { useTraduccion } from '@/i18n';

// El soft launch es Ecuador (DEFINICION_SOFTLAUNCH); el país del
// usuario llega con el riel de país del ciclo B1.
const PAIS_SOFT_LAUNCH = 'EC';

// S52-P4b sistémico: títulos humanizados — sentence case, sin eyebrow.
function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size.md,
        color: theme.text.primary,
      }}
    >
      {texto}
    </Text>
  );
}

export default function Explorar() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [servicios, setServicios] = useState<ServiciosPais | 'cargando' | 'error'>('cargando');

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerServiciosPais(PAIS_SOFT_LAUNCH).then((r) => {
        if (vigente) setServicios(r.ok ? r.data : 'error');
      });
      return () => {
        vigente = false;
      };
    }, []),
  );

  // vertical activa → su ficha (ícono en el hex puro de su capa —
  // registro gráfico, Ley 12 — + nombre + voz); las inactivas van a
  // "próximamente" — la config es la verdad, el layout solo la lee.
  const fichasActivas: Array<{
    clave: string;
    titulo: string;
    detalle: string;
    icono: ReactNode;
    // S54-B3.1: la vertical con agendamiento VIVO navega; el resto sigue
    // informativo (cero CTA muerta — la card gana el tap con su flujo).
    onPress?: () => void;
  }> = [];
  /* La unión es CERRADA a propósito: un slot libre dejaría entrar cualquier
     glifo, y acá el ícono es lo único que distingue una promesa de otra.
     🔴 `guarderia` y `telemedicina` salieron: la primera subió a implementados
     y la segunda ya lo estaba. */
  const proximamente: Array<{
    nombre: string;
    icono: 'hotel' | 'seguros' | 'wearables' | 'certificaciones' | 'prime';
  }> = [];
  if (servicios !== 'cargando' && servicios !== 'error') {
    if (servicios.walking) fichasActivas.push({ clave: 'paseo', titulo: t('explorar.servicioPaseo'), detalle: t('explorar.servicioPaseoDetalle'), icono: <Icono nombre="paseo" tamano={26} />, onPress: () => router.navigate('/hogar/paseos') });
    // S60-A1: el grooming dejó el coming-soon; S60-A4: la card aterriza
    // en SU hub (doble-click, mismo patrón que el paseo) — el Agendar
    // del hub lleva al CUÁNDO.
    if (servicios.grooming) fichasActivas.push({ clave: 'grooming', titulo: t('explorar.servicioGrooming'), detalle: t('explorar.servicioGroomingDetalle'), icono: <Icono nombre="grooming" tamano={26} />, onPress: () => router.navigate('/hogar/grooming') });
    // S68-A2 (V2): la card vet despierta — va al CUÁNDO directo (el hub
    // del oficio queda declarado como resto de la tanda del Durante; la
    // cita pagada ya tiene superficie: /citas/[mascotaId] D-430 + Hogar).
    // S82-A r12 (CRUCE DE TERRITORIO declarado, UNA línea): vet entra a
    // SU LOG como los otros tres oficios — era la ÚNICA de las cuatro
    // que caía directo en la reserva, y por eso el log de r9 nacía sin
    // entrada (el founder cayó en reserva al tocar Veterinaria).
    if (servicios.veterinary) fichasActivas.push({ clave: 'vet', titulo: t('explorar.servicioVet'), detalle: t('explorar.servicioVetDetalle'), icono: <Icono nombre="veterinaria" tamano={26} />, onPress: () => router.navigate('/hogar/veterinaria') });
    if (servicios.training) fichasActivas.push({ clave: 'adiestramiento', titulo: t('explorar.servicioAdiestramiento'), detalle: t('explorar.servicioAdiestramientoDetalle'), icono: <Icono nombre="training" tamano={26} />, onPress: () => router.navigate('/hogar/adiestramiento') });
    /* ⭐ S107-C · «PRÓXIMAMENTE» — firma del founder: hotel · seguros ·
       wearables · certificaciones · Prime.
       **Salen dos, por razones opuestas:** telemedicina porque **YA está
       implementada** (vive dentro de veterinaria) — *anunciar como futuro algo
       que ya se usa hace dudar de toda la lista* — y guardería porque **subió
       a los implementados**.
       ⚠️ **Wearables y certificaciones NO están todavía: les falta su glifo**,
       y los glifos viven en `packages/ui` (censo: `IconoNombre` es el registry
       tipado; las apps sólo consumen por nombre) ⇒ **es pedido a B**, no
       territorio de esta pista. Ver `docs/loop/S107-C-PEDIDO-A-B-GLIFOS.md`.
       *No se listan con un glifo prestado: dos servicios con el ícono de un
       tercero se leen como ese tercero.* */
    if (!servicios.hotel) proximamente.push({ nombre: t('explorar.proxHotel'), icono: 'hotel' });
    if (!servicios.insurance) proximamente.push({ nombre: t('explorar.proxSeguros'), icono: 'seguros' });
    /* ⭐ S107-C · LOS DOS NUEVOS, con los glifos que B publicó.
       **No tienen bandera en `country_config`**: no son servicios que un país
       encienda todavía, son hoja de ruta. *Inventarles un flag apagado sería
       fingir un interruptor que nadie puede tocar.* Cuando existan, entran por
       su bandera como sus hermanos. */
    proximamente.push({ nombre: t('explorar.proxWearables'), icono: 'wearables' });
    proximamente.push({ nombre: t('explorar.proxCertificaciones'), icono: 'certificaciones' });
    /* ⭐ S107-C · GUARDERÍA DESACOPLADA DEL FLAG DE HOTEL — y no es prolijidad.
       Hasta hoy las dos colgaban del MISMO `if (!servicios.hotel)`, así que
       🔴 **el día que hotel abriera, guardería no pasaba a activa: DESAPARECÍA**
       —no tiene ficha propia—, y nadie se habría enterado hasta buscarla.
       Además la letra separa los dos servicios explícitamente (`LETRA_GUARDERIA`
       §5: *«la noche NO es guardería: es hotel, y es otro servicio con su propia
       letra»*), así que compartir bandera contradice una firma.
       Ver `GUARDERIA_ABIERTA` y su pedido a A. */
    /* ⭐ S107-C · GUARDERÍA ENCENDIDA POR SU FLAG PROPIO. La constante inerte
       murió en el mismo acto (Ley 37): `servicios.guarderia` existe desde
       S107-A, y hoy viene en `false` — la ficha aparece el día que la mesa lo
       encienda, con oferta viva. */
    if (servicios.guarderia) fichasActivas.push({ clave: 'guarderia', titulo: t('explorar.servicioGuarderia'), detalle: t('explorar.servicioGuarderiaDetalle'), icono: <Icono nombre="guarderia" tamano={26} />, onPress: () => router.navigate('/hogar/guarderia') });
    if (!servicios.prime) proximamente.push({ nombre: t('explorar.proxPrime'), icono: 'prime' });
    /* 🔴 Guardería NO cae a «Próximamente»: su camino está CONSTRUIDO y
       espera sólo el flag. Con el flag en `false` no aparece en ningún lado, y
       eso es correcto — anunciarla en próximamente diría que falta construirla
       cuando lo que falta es una guardería con oferta publicada. */
    /* ☠️ Telemedicina salió de «Próximamente»: **ya está implementada** y se
       agenda desde veterinaria. */
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}>
        <Encabezado variante="portada" saludo={t('explorar.titulo')} />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          {/* ── Servicios activos ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('explorar.servicios')} />
            {servicios === 'cargando' ? (
              <EsqueletoGrupo>
                <View style={{ gap: spacing[3] }}>
                  <Esqueleto forma="bloque" ancho="100%" alto={72} />
                  <Esqueleto forma="bloque" ancho="100%" alto={72} />
                </View>
              </EsqueletoGrupo>
            ) : servicios === 'error' ? (
              <EstadoVacio
                titulo={t('explorar.error')}
                descripcion={t('hogar.errorHistoriaDetalle')}
                accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setServicios('cargando')} />}
              />
            ) : (
              <View style={{ gap: spacing[3] }}>
                {/* QW2 (S53, decisión founder): grilla de 2 columnas,
                    cards cuadradas con el Icono b′ PRESIDIENDO. */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
                  {fichasActivas.map((f) => {
                    const contenido = (
                      <View style={{ aspectRatio: 1.05, justifyContent: 'space-between' }}>
                        <View style={{ paddingTop: spacing[1] }}>{f.icono}</View>
                        <View style={{ gap: 2 }}>
                          {/* ⭐ S107-C · el label baja de `base` a `sm` y se
                              acota a dos líneas: con la baldosa a 31 % el
                              texto se salía de su espacio. *El tamaño del
                              texto vive acá, en el consumidor — se midió antes
                              de pedírselo a B.* */}
                          <Text
                            numberOfLines={2}
                            style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.primary }}
                          >
                            {f.titulo}
                          </Text>
                          {/* ☠️ S107-C · LA DESCRIPCIÓN DEL PRODUCTO Y EL
                              «Toca para entrar» SALIERON (firma del founder).
                              La causa del desborde acá no era el tamaño del
                              texto: **era cuánta información cargaba la
                              baldosa**. Con tres columnas entraban glifo +
                              nombre + descripción + una llamada a la acción en
                              ~100 pt de ancho.
                              🔴 **El chevron reemplaza al texto porque dice lo
                              mismo ocupando una fila de nada** — y *«toca para
                              entrar» le explica a alguien que ya sabe tocar
                              una tarjeta*. */}
                          {f.onPress ? (
                            <View style={{ alignItems: 'flex-end', marginTop: 2 }}>
                              <Chevron direccion="derecha" />
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                    /* ⭐ S107-C · TRES COLUMNAS, igual que la grilla de
                       Negocio: con cinco servicios activos, dos columnas dejan
                       la última fila con una ficha del doble de ancho — y una
                       ficha más grande se lee como más importante.
                       `flexGrow: 0` para que la fila corta se vea corta y no
                       se estire a llenar. */
                    return (
                      <View key={f.clave} style={{ flexBasis: '31%', flexGrow: 0 }}>
                        {/* 🔴 SIN TEXTO, LA ETIQUETA CARGA EL DESTINO.
                            Un chevron no se anuncia: quien no ve la pantalla
                            oiría «botón» y nada más. La etiqueta dice **a
                            dónde entra**, que es lo que el texto retirado
                            decía peor. */}
                        {f.onPress ? (
                          <Tarjeta
                            relleno="amplio"
                            interactiva
                            onPress={f.onPress}
                            accessibilityRole="button"
                            etiqueta={t('explorar.entrarA', { servicio: f.titulo })}
                          >
                            {contenido}
                          </Tarjeta>
                        ) : (
                          <Tarjeta relleno="amplio">{contenido}</Tarjeta>
                        )}
                      </View>
                    );
                  })}
                </View>
                {/* ☠️ S107-C · «Agendar veterinaria llega pronto» RETIRADO.
                    No pertenecía acá: esta sección lista los servicios que YA
                    se agendan, y una nota que dice lo contrario debajo de
                    ellos contradice lo que la pantalla está mostrando. */}
              </View>
            )}
          </View>

          {/* ── Refugios / adopción (M0) — vacío SERENO (P5b) ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('explorar.refugios')} />
            <EstadoVacio
              registro="seccion"
              icono={<Icono nombre="refugio" tamano={48} />}
              titulo={t('explorar.refugiosVacio')}
              descripcion={t('explorar.refugiosVacioDetalle')}
            />
          </View>

          {/* ── Próximamente honesto — UNA sección, filas serenas en
              texto secundario (P5c: el muro de Insignias ochre murió;
              el título de la sección ya dice todo) ── */}
          {proximamente.length > 0 ? (
            <View style={{ gap: spacing[3] }}>
              <TituloBloque texto={t('explorar.proximamente')} />
              <Tarjeta relleno="ninguno">
                {/* S58 (D-361): la celda VISTE, no promete — ícono del
                    registry + fila informativa SIN chevron ni tap (un
                    coming soon no navega: no es CeldaNavegacion, Ley 19.4) */}
                {proximamente.map((p, i) => (
                  <View key={p.nombre}>
                    {i > 0 ? <Separador /> : null}
                    <Celda inicio={<Icono nombre={p.icono} tamano={24} registro="aa" />} titulo={p.nombre} />
                  </View>
                ))}
              </Tarjeta>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
