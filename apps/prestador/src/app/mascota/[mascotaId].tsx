/**
 * DETALLE DE MASCOTA — la pantalla icónica, v1 vista prestador
 * (S51-B3.3, sobre el alma §6.4.4): la mascota como ser completo, no
 * ficha clínica. LA VISIBILIDAD PARCIAL MANDA (relevada S51 en RLS
 * viva): identidad ✓ (mascotas_select_prestador_con_acceso), señales
 * de cuidado ✓ (perfil_vigente/vacunas vía user_tiene_acceso_a_mascota),
 * historial SOLO con este prestador ✓ — y la FAMILIA HUMANA **YA SÍ**
 * (S85-C29). ⏪ Esta nota decía que su lugar nacía *"cuando exista el
 * canal interno (B5)"*, y era verdad hasta hoy: las policies de
 * `familia`/`familia_miembro`/`profiles` son solo-miembro, así que por
 * RLS no se alcanzaba. **A la abrió por RPC ANGOSTA** (A45) — nombres y
 * rol, nada más—, que es otra puerta y no el canal. *El porqué venció y
 * el texto se mueve con él (L-198): un porqué viejo se lee con la misma
 * autoridad que uno vigente.*
 * **Lo que NO cambió y sigue rigiendo: cero datos de contacto por esta
 * vía** (§6.4.5). El teléfono y el correo tienen su propio lector
 * gateado, en el detalle de la CITA — *un dato de contacto que viaja de
 * paso es el que nadie recuerda haber concedido.*
 * Las 5 dimensiones de identidad personal son D-110 (sin UI aún) — no se
 * inventan.
 *
 * Dosis baja (test 7): un acento, sin gradiente. Solo lo REAL (L-139).
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useTheme,
  type AvatarMascotaEspecie,
} from '@epetplace/ui';
import {
  obtenerDetalleMascotaPrestador,
  obtenerExpedienteModulado,
  obtenerFamiliaDeMascota,
  obtenerMiPrestador,
  obtenerUmbralesMomentoVital,
  resolverUrlFoto,
  type AporteExpediente,
  type DetalleMascotaPrestador,
  type FamiliaDeMascota,
  type UmbralesEspecie,
} from '@epetplace/api';
import { calcularMomentoVital, edadEnMeses } from '@epetplace/domain';

import { fechaCortaMono } from '@epetplace/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTraduccion } from '@/i18n';
import { vozAporte, vozDetalleAjeno } from '@/lib/voz-aporte';

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}


// S52-P4b sistémico: títulos humanizados — sentence case, sin eyebrow.

export default function DetalleMascota() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mascotaId } = useLocalSearchParams<{ mascotaId: string }>();

  const [detalle, setDetalle] = useState<DetalleMascotaPrestador | 'cargando' | 'error'>('cargando');
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);
  // S74-B recepción v1 (E5 de la vara): la ETAPA se computa client-side —
  // umbrales del catálogo + fecha de nacimiento; cero motor nuevo.
  const [umbrales, setUmbrales] = useState<UmbralesEspecie | 'error' | null>(null);
  /* S85-C28 · el expediente MODULADO (A3.5bis). `'error'` se distingue de la
     lista vacía a propósito: "no pudimos leer" y "todavía no hay aportes" son
     dos hechos y no comparten representación (Ley 13). */
  const [expediente, setExpediente] = useState<AporteExpediente[] | 'error' | null>(null);
  /* S85-C29 · quién cuida a ESTA vida (A45). `'error'` es su propio estado:
     un fallo llega como `ok:false` y JAMÁS como `familia:null` — degradarlo
     diría "esta mascota no tiene familia" cuando la verdad es "no pude
     leerla", y es lo más caro que puede decir esta pantalla. */
  const [familia, setFamilia] = useState<FamiliaDeMascota | 'error' | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (typeof mascotaId !== 'string') {
        router.back();
        return;
      }
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setDetalle('error');
          return;
        }
        const r = await obtenerDetalleMascotaPrestador(mascotaId, prestador.data.id);
        if (!vigente) return;
        if (!r.ok) {
          setDetalle('error');
          return;
        }
        setDetalle(r.data);
        /* Carga SECUNDARIA: va después de pintar la ficha. Si falla, la
           identidad y el historial siguen en pie — el expediente tiene su
           propio camino de error y no toma de rehén al resto (patrón D-531). */
        void obtenerExpedienteModulado(mascotaId).then((e) => {
          if (vigente) setExpediente(e.ok ? e.data : 'error');
        });
        void obtenerFamiliaDeMascota(mascotaId).then((f) => {
          if (vigente) setFamilia(f.ok ? f.data : 'error');
        });
        if (r.data.mascota.especie !== null) {
          void obtenerUmbralesMomentoVital(r.data.mascota.especie).then((u) => {
            // E4 GENERALIZADA: el error del catálogo JAMÁS se pinta como
            // "sin etapa" — se distingue del null honesto (catálogo sin
            // umbrales para la especie).
            if (vigente) setUmbrales(u.ok ? u.data : 'error');
          });
        }
        if (r.data.mascota.foto_url) {
          void resolverUrlFoto(r.data.mascota.foto_url).then((url) => {
            if (vigente) setFotoFirmada(url ?? undefined);
          });
        }
      })();
      return () => {
        vigente = false;
      };
    }, [mascotaId, router]),
  );

  if (detalle === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
        <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ alignItems: 'center', gap: spacing[3] }}>
              <Esqueleto forma="circulo" alto={96} />
              <Esqueleto forma="linea" ancho="40%" />
              <View style={{ height: spacing[6] }} />
              <Esqueleto forma="bloque" ancho="100%" alto={100} />
            </View>
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (detalle === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
        <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('detalleMascota.error')}
            descripcion={t('mascotas.errorDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('agenda.reintentar')} onPress={() => setDetalle('cargando')} />}
          />
        </View>
      </View>
    );
  }

  const { mascota, atenciones, vacunas_total } = detalle;

  // ── S74-B · LA ETAPA DESTILADA (recepción v1, alcance de mesa:
  // identidad completa + etapa — el destilado A3.4). Cálculo puro de
  // @epetplace/domain; es_memorial NO viaja en este wrapper → se pasa
  // false y M6 queda FUERA de v1 (declarado — la etapa de un memorial
  // la resuelve su superficie propia, no un falso "Años dorados").
  // LUGAR RESERVADO (E3 de la vara, cero píxel hoy): la banda de
  // CUIDADO ESPECIAL entra entre la etapa y lo operativo; el aviso de
  // emergencia (cuando D-502 le dé motor) entrará ENCIMA de la banda.
  // CONTACTO: es propiedad de la VISITA, no del animal (decisión de
  // mesa S74) — vive en el detalle de la CITA (obtenerContactoReservaCita),
  // jamás acá.
  const momento =
    umbrales !== null && umbrales !== 'error'
      ? calcularMomentoVital({
          edadMeses: mascota.fecha_nacimiento !== null ? edadEnMeses(mascota.fecha_nacimiento.slice(0, 10), new Date()) : null,
          tieneCondicionCronica: detalle.tiene_condicion_cronica,
          esMemorial: false,
          umbrales,
        })
      : null;
  const vozEtapa =
    momento === 'M1'
      ? t('detalleMascota.etapaM1')
      : momento === 'M2'
        ? t('detalleMascota.etapaM2')
        : momento === 'M3'
          ? t('detalleMascota.etapaM3')
          : momento === 'M4'
            ? t('detalleMascota.etapaM4')
            : momento === 'M5'
              ? t('detalleMascota.etapaM5')
              : null;

  // señales de cuidado: SOLO lo real del expediente.
  // HALLAZGO DECLARADO (S74-B, E1 de la vara de recepción): esta señal
  // LEE Y PINTA `tiene_emergencia_activa` desde S51 — y D-502 probó que
  // el flag es fiable solo por vacuidad (sin puerta de abrir/cerrar).
  // NO se retira acá (decisión de producto de mesa, D-502 la resuelve);
  // se deja de proponer en superficies NUEVAS.
  const senales: string[] = [];
  if (detalle.tiene_emergencia_activa) senales.push(t('detalleMascota.emergenciaActiva'));
  if (detalle.tiene_condicion_cronica) senales.push(t('detalleMascota.condicionCronica'));
  if (detalle.tiene_alergias) senales.push(t('detalleMascota.alergias'));

  const datosIdentidad: Array<{ etiqueta: string; valor: string }> = [];
  if (mascota.raza !== null && mascota.raza.length > 0) datosIdentidad.push({ etiqueta: t('detalleMascota.raza'), valor: mascota.raza });
  if (mascota.sexo === 'macho' || mascota.sexo === 'hembra') {
    datosIdentidad.push({
      etiqueta: t('detalleMascota.sexo'),
      valor: mascota.sexo === 'macho' ? t('detalleMascota.sexoMacho') : t('detalleMascota.sexoHembra'),
    });
  }
  if (mascota.fecha_nacimiento !== null) datosIdentidad.push({ etiqueta: t('detalleMascota.nacimiento'), valor: fechaCortaMono((mascota.fecha_nacimiento).slice(0, 10), idioma) });
  if (detalle.peso_clinico_kg !== null) datosIdentidad.push({ etiqueta: t('detalleMascota.peso'), valor: `${detalle.peso_clinico_kg} kg` });
  if (mascota.microchip !== null && mascota.microchip.length > 0) datosIdentidad.push({ etiqueta: t('detalleMascota.microchip'), valor: mascota.microchip });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[8], gap: spacing[6] }}>
        {/* ── cabecera con presencia (§6.4.4) ── */}
        <View style={{ alignItems: 'center', gap: spacing[2] }}>
          <AvatarMascota
            nombre={mascota.nombre}
            fotoUrl={fotoFirmada}
            especie={esEspecie(mascota.especie) ? mascota.especie : undefined}
            tamano="lg"
          />
          <Text
            accessibilityRole="header"
            style={{ fontFamily: typography.family.sans.light, fontSize: typography.size['2xl'], color: theme.text.primary }}
          >
            {mascota.nombre}
          </Text>
          {/* la etapa EN VOZ bajo el nombre (patrón S52-P4 del cliente);
              error del catálogo ≠ sin etapa (E4 generalizada) */}
          {vozEtapa !== null ? (
            <Texto variante="apoyo">{vozEtapa}</Texto>
          ) : umbrales === 'error' ? (
            <Texto variante="apoyo">{t('detalleMascota.etapaError')}</Texto>
          ) : null}
          {senales.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], justifyContent: 'center' }}>
              {senales.map((s) => (
                <Insignia key={s} estado="atencion" etiqueta={s} tamaño="sm" />
              ))}
            </View>
          ) : (
            <Texto variante="apoyo">
              {t('detalleMascota.sinSenales')}
            </Texto>
          )}
        </View>

        {/* ── carnet (señal de cuidado del expediente) ── */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('detalleMascota.carnet')}</Texto>
          <Tarjeta>
            <Texto variante="apoyo">
              {vacunas_total === 0
                ? t('detalleMascota.carnetVacio')
                : vacunas_total === 1
                  ? t('detalleMascota.unaVacuna')
                  : t('detalleMascota.vacunas', { n: vacunas_total })}
            </Texto>
          </Tarjeta>
        </View>

        {/* ── tu historial con la mascota (visibilidad parcial) ──
            S71 (hallazgo founder): con 0 atenciones la tarjeta se dibujaba
            VACÍA — una línea y nada debajo. Ley 13: el vacío habla — y acá
            además es dato útil del Antes (rima con la señal "Primera vez"
            de la jornada). */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('detalleMascota.historial', { nombre: mascota.nombre })}</Texto>
          {atenciones.length === 0 ? (
            <Texto variante="apoyo">
              {t('detalleMascota.historialVacio', { nombre: mascota.nombre })}
            </Texto>
          ) : (
            <Tarjeta relleno="ninguno">
              {atenciones.map((a, i) => (
                <View key={a.atencion_id}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={a.estado === 'en_curso' ? t('detalleMascota.atencionEnCurso') : t('detalleMascota.atencionCerrada')}
                    metadataMono={a.cerrada_en !== null ? fechaCortaMono((a.cerrada_en).slice(0, 10), idioma) : a.iniciada_en !== null ? fechaCortaMono((a.iniciada_en).slice(0, 10), idioma) : undefined}
                  />
                </View>
              ))}
            </Tarjeta>
          )}
        </View>

        {/* ═══ S85-C28 · EL EXPEDIENTE MODULADO (`BIO_EXPEDIENTE` A3.5bis) ═══

            **La superficie NO DECIDE NADA: pinta el nivel que llega.** El
            reparto lo hace la RPC —`detalle` · `existencia` · `familia`— y
            la pantalla que se pusiera a deducirlo estaría adivinando un
            PERMISO, que es la peor cosa que puede adivinar una vista.

            ⭐ EL NIVEL ③ ES LA MITAD QUE SE PIERDE AL IMPLEMENTAR. La
            opción cómoda —ocultar lo que no se puede ver— está mal en las
            dos direcciones: **esconder que el aporte EXISTE deja al
            prestador atendiendo contra un expediente que le miente por
            omisión** (no sabría que hay algo, así que no sabría que tiene
            que preguntar), y mostrar el contenido a todos convierte el
            expediente en un tablón.
            *Ver que existe y quién lo hizo no es una versión degradada de
            ver el contenido: es un dato distinto y suficiente.*

            ⚠️ Y NO SE DIBUJA «Pedir el detalle» (Ley 23): el canal entre
            prestadores NO EXISTE todavía. La ley que lo habilita está
            depositada (A3.5bis-b) y es precondición de encendido de S86.
            Un botón que no puede entregar es la puerta ofreciendo lo que
            va a rechazar; la voz habilita el handshake NOMBRANDO a quién
            buscar, que es lo que sí podemos cumplir hoy. */}
        {expediente !== null && (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('expediente.titulo')}</Texto>
            {expediente === 'error' ? (
              // Ley 13: el fallo dice fallo. JAMÁS se degrada a "sin aportes"
              // — un expediente vacío por un error de red es la mentira más
              // cara de esta pantalla.
              <Texto variante="apoyo">{t('expediente.error')}</Texto>
            ) : expediente.length === 0 ? (
              <Texto variante="apoyo">{t('expediente.vacio')}</Texto>
            ) : (
              <Tarjeta relleno="ninguno">
                {expediente.map((a, i) => (
                  <View key={a.id}>
                    {i > 0 ? <Separador /> : null}
                    <Celda
                      titulo={vozAporte(a.tipo, t)}
                      /* LA FRASE SOLO EN `'existencia'`. En `'familia'`
                         `autor` es null y significa **"no aplica"** —lo
                         declaró el dueño, no un prestador— y esas filas
                         llegan con su contenido entero: aplicarles el
                         template imprimiría «El detalle lo tiene null»
                         sobre algo que se está viendo completo. En
                         `'detalle'` el contenido es propio y la frase
                         sobraría. */
                      subtitulo={a.nivel === 'existencia' ? vozDetalleAjeno(a.autor, t) : undefined}
                      metadataMono={fechaCortaMono(a.fechaEvento.slice(0, 10), idioma)}
                    />
                  </View>
                ))}
              </Tarjeta>
            )}
          </View>
        )}

        {/* ═══ S85-C29 · QUIÉN CUIDA A ESTA VIDA (A3.5quater) ═══════════

            **La pregunta es por ESTA mascota, no por el hogar** — el
            sujeto del producto es la MASCOTA (EL NORTE). Por eso el
            lector es por mascota y no por prestador: *no le falta un
            bloque a la tab Datos; le faltaba un dato a esta ficha.*

            ⚠️ TRES HECHOS, TRES VOCES, y la cuarta vez que esta ley cobra
            hoy: `familia: null` (**no tiene familia** — las legadas del
            modelo viejo) · lista **vacía** (tiene familia, sin miembros
            vigentes) · **`'error'`** (no pudimos leer). *Un fallo llega
            como `ok:false` y JAMÁS como `familia:null`: degradarlo diría
            "esta mascota no tiene familia" cuando la verdad es "no pude
            leerla", y sobre una vida ajena eso no es un bug de UI.*

            EL ROL SE PINTA EN VOZ aunque hoy haya UNO SOLO
            (`adulto_titular`): el día que exista `familiar_autorizado`
            esta superficie ya lo distingue **sin tocar el motor**. Y el
            desconocido cae al genérico digno, jamás al código (Ley 3). */}
        {familia !== null && (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('quienCuida.titulo', { nombre: mascota.nombre })}</Texto>
            {familia === 'error' ? (
              <Texto variante="apoyo">{t('quienCuida.error')}</Texto>
            ) : familia.familia === null ? (
              <Texto variante="apoyo">{t('quienCuida.sinFamilia')}</Texto>
            ) : familia.miembros.length === 0 ? (
              <Texto variante="apoyo">{t('quienCuida.sinMiembros')}</Texto>
            ) : (
              <Tarjeta relleno="ninguno">
                {familia.miembros.map((m, i) => (
                  <View key={`${m.nombre}-${i}`}>
                    {i > 0 ? <Separador /> : null}
                    <Celda
                      titulo={m.nombre}
                      subtitulo={m.rol === 'adulto_titular' ? t('quienCuida.rolTitular') : t('quienCuida.rolMiembro')}
                    />
                  </View>
                ))}
              </Tarjeta>
            )}
          </View>
        )}

        {/* ── identidad (progresiva; las 5 dimensiones son D-110) ── */}
        {datosIdentidad.length > 0 ? (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('detalleMascota.identidad')}</Texto>
            <Tarjeta relleno="ninguno">
              {datosIdentidad.map((d, i) => (
                <View key={d.etiqueta}>
                  {i > 0 ? <Separador /> : null}
                  <Celda titulo={d.etiqueta} metadataMono={d.valor} />
                </View>
              ))}
            </Tarjeta>
          </View>
        ) : null}

        {/* ═══ FAMILIA HUMANA: hueco estructural. La RLS de hoy no le
            muestra la familia al prestador (relevado S51); cuando el
            canal interno (B5) exista, acá nace su lugar — nombre, rol
            y vínculo mediado, JAMÁS contacto directo (§6.4.5). ═══ */}
      </ScrollView>
    </View>
  );
}
