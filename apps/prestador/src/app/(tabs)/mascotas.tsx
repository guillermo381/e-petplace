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
 * ── ⏪ LAS TRES FRANJAS: LO QUE DECÍA ACÁ QUEDÓ DEROGADO (S85-C32) ────
 *
 * **Hasta el gate de hoy esta nota decía que la plata, el equipo y la
 * trayectoria NO vivían acá "a propósito"**, porque ya tenían casa en
 * NEGOCIO y §15b las ponía ahí. **Era correcto y duró una sesión.**
 *
 * **FIRMA DEL FOUNDER (S86): NEGOCIO QUEDA SOLO CON EL TALLER.** Cobros,
 * equipo y estadísticas **se mudan acá**, y la frontera pasa a ser una
 * sola pregunta, mucho más limpia que la anterior:
 *
 * > **DATOS = todo lo que se CONSULTA · NEGOCIO = todo lo que se CONFIGURA.**
 *
 * *Eso disuelve el choque que la mesa planteó —"si Datos gana gráficas, dos
 * tabs contestan lo mismo"—: ya no se reparten por TEMA (que era lo que las
 * hacía chocar) sino por VERBO.*
 *
 * ⚠️ **Y SE DEROGA EN ESTE ARCHIVO, no solo en un acta:** la nota vieja
 * afirmaba con tabla y argumento que esas franjas **no vienen**. Quien la
 * leyera en S86 encontraría una regla que ya no rige, escrita con más
 * autoridad que el plan. *Un porqué vencido se lee igual que uno vigente*
 * (L-198).
 *
 * 🔴 **LO QUE LA MUDANZA TIENE QUE RESOLVER, MEDIDO Y NO OPINADO: EL GATE
 * NO VIAJA CON LA PANTALLA.** El tab NEGOCIO está gateado por
 * `sesion.esGestor` (`(tabs)/_layout.tsx`); **este tab NO tiene gate.**
 * ⇒ mover *Cobros* acá tal cual **pondría los ingresos frente a quien hoy
 * no los ve** — exactamente el agujero que S72-P1a cerró.
 * **No lo bloquea, y la salida ya está probada en esta misma sesión:** el
 * gate se mueve al LECTOR, como hizo `obtenerPlataDelDia` con su
 * `visible:false`. *Cada pieza que se mude tiene que traer su propio gate,
 * o queda expuesta —* y eso se verifica lector por lector, no tab por tab.
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
  CeldaNavegacion,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
  type AvatarMascotaEspecie,
} from '@epetplace/ui';
import {
  obtenerEquipoNegocio,
  obtenerMascotasAtendidas,
  obtenerMiPrestador,
  resolverUrlsFotos,
  type EquipoNegocio,
  type MascotaAtendida,
} from '@epetplace/api';

import { SeccionDesplegable } from '@/components/perfil-piezas';
import { useGateGestor } from '@/lib/gate-gestor';

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
  /* ⭐ S86-C · LA MUDANZA DE «TU EQUIPO» — primera franja que baja de
     NEGOCIO a DATOS (firma del founder: *DATOS consulta · NEGOCIO
     configura*).

     ⚠️ **EL GATE VIAJA CON EL LECTOR, y ésa era la 🔴 que esta pantalla
     tenía escrita desde S85-C32:** el tab NEGOCIO gatea por `esGestor`
     (`_layout`), y **este tab NO tiene gate**. Mudar la franja tal cual
     habría ensanchado la audiencia sin que nadie lo notara.
     La salida NO es re-decidir el permiso acá —una autorización que
     resuelve el cliente es decorativa— sino usar la que el lector YA
     trae: `esDueno` lo deriva el servidor de una policy dueño-only
     (`empleado_roles`), igual que `visible:false` en la plata. Sin
     `esDueno`, la sección **no se monta**.
     · Medido, y se declara: el gate del RPC (`obtener_empleados_cuenta`)
       es MEMBRESÍA (`_user_opera_cuenta_comercial`) — más ancho que el
       del tab. Por eso el gate de la SECCIÓN es `esDueno` y no el hecho
       de que el lector conteste.
     · Delta declarado: el tab NEGOCIO admite `['dueño','administrador']`
       y `esDueno` es dueño-only. **Hoy es inerte** —el administrador no
       tiene motor (D-513 v2)— y se anota para el día que lo tenga. */
  const [equipo, setEquipo] = useState<EquipoNegocio | null>(null);
  const [equipoAbierto, setEquipoAbierto] = useState(false);
  /* ⭐ S86-C · el gate de las DOS franjas que llegan sin datos (reseñas y
     casos heredados). Es el MISMO predicado que gatea el tab NEGOCIO
     (`dueño|administrador`), y por eso mudarlas con él es el CAMBIO NULO:
     ve exactamente la misma gente que las veía ayer.
     ⚠️ **Esto NO contesta la pregunta de permiso de reseñas** —quién ve la
     reputación completa— que la mesa dejó declarada y abierta. Solo se
     niega a ensancharla POR ACCIDENTE mientras se decide: mudarlas sin
     gate habría respondido «todos» sin que nadie lo firmara.
     ☠️ Y cuando cada una gane su LECTOR, el gate se muda ADENTRO del
     lector (como `esDueno` en equipo y `visible:false` en la plata) y
     este gate de pantalla muere: un gate de cliente es decorativo en
     cuanto hay un dato que proteger. */
  const { gate } = useGateGestor();

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
        /* El equipo va EN PARALELO con las vidas: son dos preguntas
           independientes y encadenarlas sumaría un viaje a la portada.
           Su fallo NO tumba la pantalla — la sección simplemente no se
           monta (Ley 13 aplica al CUERPO, y el cuerpo de esta tab son
           las vidas). */
        const [r, eq] = await Promise.all([
          obtenerMascotasAtendidas(prestador.data.id),
          prestador.data.cuenta_comercial_id !== null
            ? obtenerEquipoNegocio(prestador.data.cuenta_comercial_id)
            : Promise.resolve(null),
        ]);
        if (!vigente) return;
        setEquipo(eq !== null && eq.ok ? eq.data : null);
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

        {/* ⭐ S86-C · «TU EQUIPO» — la primera franja de la mudanza, en la
            forma que firmó la lámina (decisión ④): la sección se PLIEGA
            pero NUNCA se calla — su resumen se lee sin abrirla.
            ⚠️ Regla de existencia: sin `esDueno` NO se monta (el gate del
            lector, arriba). Y `equipo === null` cubre los dos casos que no
            deben inventar nada: negocio sin cuenta comercial, y lectura
            caída — ninguno se disfraza de "equipo vacío". */}
        {equipo !== null && equipo.esDueno && equipo.miembros.length > 0 && (
          <SeccionDesplegable
            icono="equipo"
            titulo={t('mascotas.equipoTitulo')}
            /* El resumen cuenta ACTIVAS, que es la pregunta real ("¿con
               cuánta gente cuento?"). Las inactivas existen en la lista de
               adentro; sumarlas acá inflaría el número con gente que ya no
               atiende. */
            resumen={
              equipo.miembros.filter((m) => m.activo).length === 1
                ? t('mascotas.equipoResumen1')
                : t('mascotas.equipoResumen', { n: equipo.miembros.filter((m) => m.activo).length })
            }
            abierta={equipoAbierto}
            onAlternar={() => setEquipoAbierto((v) => !v)}
          >
            <View style={{ gap: spacing[3] }}>
              <Tarjeta elevacion="sm" relleno="ninguno">
                {equipo.miembros.map((m, i) => (
                  <View key={m.empleadoId}>
                    {i > 0 && <Separador />}
                    {/* ⚠️ El subtítulo dice SOLO lo inactivo. Los oficios
                        vienen del lector como CÓDIGOS (`OficioChip` es un
                        union de strings, medido) y pintarlos crudos rompe la
                        Ley 3; darles voz acá sería fabricar un diccionario
                        que ya existe en otra casa. La lista de nombres es lo
                        que la lámina pide, y el detalle vive un tap más
                        adentro. */}
                    <Celda
                      titulo={m.nombre}
                      subtitulo={m.activo ? undefined : t('mascotas.equipoInactiva')}
                    />
                  </View>
                ))}
              </Tarjeta>
              {/* La gestión sigue viviendo en su pantalla: DATOS consulta,
                  y el camino a CONFIGURAR se ofrece, no se duplica. La ruta
                  conserva su nombre (`/negocio/equipo`) — renombrarla no le
                  aporta nada a quien la usa y sí toca el árbol entero. */}
              <CeldaNavegacion
                icono="equipo"
                registro="aa"
                titulo={t('mascotas.equipoGestionar')}
                onPress={() => router.push('/negocio/equipo')}
              />
            </View>
          </SeccionDesplegable>
        )}

        {/* ⭐ S86-C · LAS DOS QUE LLEGAN SIN DATOS. Vienen de NEGOCIO por
            firma de mesa, y el argumento de cada una es distinto:
             · **Reseñas** — una reseña no se CONFIGURA: es evidencia sobre
               el negocio, y cae del lado «consulta».
             · **Casos heredados** — el caso es del PET PARENT. Tenerlo en
               NEGOCIO afirmaba algo falso contra letra firmada.
            ⚠️ Las DOS pantallas destino siguen siendo `EstadoVacio` en
            preparación (medido: cero lectores). Se mudan con su voz
            intacta — el «se despierta con el uso» sigue siendo la verdad.
            ☠️ Mueren de acá el día que tengan lector: ahí dejan de ser
            promesas y pasan a ser secciones con su resumen (decisión ④). */}
        {gate === 'permitido' && (
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('mascotas.despiertaSeccion')}</Texto>
            <Tarjeta relleno="ninguno">
              <CeldaNavegacion
                icono="refugio"
                registro="aa"
                titulo={t('mascotas.resenas')}
                detalle={t('mascotas.resenasDetalle')}
                onPress={() => router.push('/negocio/resenas')}
              />
              <Separador />
              {/* Glifo 'caso' — propio del registry, no stand-in. */}
              <CeldaNavegacion
                icono="caso"
                registro="aa"
                titulo={t('mascotas.casosHeredados')}
                detalle={t('mascotas.casosHeredadosDetalle')}
                onPress={() => router.push('/negocio/casos-heredados')}
              />
            </Tarjeta>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
