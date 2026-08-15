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
import { Pressable, ScrollView, View } from 'react-native';
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
  caraDeMascotaPorRuta,
  obtenerDatosNegocio,
  obtenerEquipoNegocio,
  obtenerMascotasAtendidas,
  obtenerMiPosicionEnPrestador,
  obtenerMiPrestador,
  resolverUrlsFotos,
  type DatosNegocio,
  type EquipoNegocio,
  type MascotaAtendida,
} from '@epetplace/api';

import { BarrasApiladas, type CapaGrafica, type DiaBarra } from '@/components/barras-apiladas';
import { DonaMix } from '@/components/dona-mix';

import { SeccionDesplegable } from '@/components/perfil-piezas';
import { useGateGestor } from '@/lib/gate-gestor';
import { montoCorto } from '@/lib/formato-techo';

import { diaSemanaCorto, fechaCortaMono } from '@epetplace/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  /* ⭐ S99-C · L1 — SIN NEGOCIO DE SERVICIOS NO ES UN ERROR: es el vendedor
     puro. Con la barra puesta (D-820) entra a este cuarto alguien que no
     tiene fila de prestador, y hasta hoy se lo recibía con el error
     genérico — **un dato que falta disfrazado de permiso denegado**
     (L-178). El precedente está a dos archivos: `negocio.tsx` ya
     distingue `sin_prestador` desde S96 y monta su sección honesta.
     *Nadie lo pensó mal acá: nadie había entrado todavía.* */
  | { estado: 'sinPrestador' }
  | { estado: 'listo'; mascotas: MascotaAtendida[] };

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

/* Suma días en fecha LOCAL por partes literales — jamás `new Date(iso)`
   ni `toISOString`, que corren el día en UTC-5 (D-312). */
function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('en-CA').format(new Date(a ?? 0, (m ?? 1) - 1, (d ?? 1) + dias));
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
       y `esDueno` es dueño-only.
       ⏪ S88-C — ACÁ DECÍA «Hoy es inerte —el administrador no tiene
       motor (D-513 v2)—». CADUCÓ EL 5-AGO-2026: D-660 le dio el motor y
       el founder lo gateó. **El delta dejó de ser teórico y está VIVO:**
       el admin ve el tab y estas franjas NO se le montan (`esDueno` es
       dueño-only). Si la derivación debe ensancharse a gestión es del
       MOTOR — medición pedida a A, jamás re-decidida acá.
       ⏪ Y LA MEDICIÓN VOLVIÓ (D-664, mismo día): la derivación daba
       TRUE PARA LOS CUATRO ROLES — peor que el delta. El gate pasó a
       `gestiona` del servidor (obtenerMiPosicionEnPrestador) y el delta
       se cerró: el admin que ve el tab ve la franja. */
  const [equipo, setEquipo] = useState<EquipoNegocio | null>(null);
  /** ⭐ S88-C (D-664): GESTIÓN dicha por el servidor — reemplaza la
   *  derivación `esDueno` («leí ≥1 fila»), que daba true para los
   *  CUATRO roles. null = sin confirmar ⇒ las franjas no se montan. */
  const [gestiona, setGestiona] = useState<boolean | null>(null);
  /* ⏪ S86-C: `equipoAbierto` propio MURIÓ — con cuatro secciones, un
     booleano por sección deja abrir todas a la vez y la portada se
     convierte en la lista larga que el plegado vino a evitar. Todas
     comparten `abierta` (acordeón de una). */
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
  /* ⭐ S86-C · EL DASHBOARD. `null` = no se pudo leer, y NO se disfraza:
     sin dato el bloque NO SE MONTA (§2.6 — jamás métricas en cero, y un
     cero fabricado no se distingue de un dato real). El cuerpo de la tab
     —las vidas— tiene su propio camino de error y no depende de esto. */
  const [datos, setDatos] = useState<DatosNegocio | null>(null);
  /* «Las vidas» abre por default: es el CUERPO de la tab, no una franja
     más. Plegarla de entrada dejaría la portada mostrando solo números
     sobre una lista que nadie pidió esconder. Acordeón de una sola
     abierta — así los tres números pueden LLEVAR a su sección (①). */
  const [abierta, setAbierta] = useState<string | null>('vidas');
  const alternar = (k: string) => setAbierta((a) => (a === k ? null : k));

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          // `sin_prestador` NO es un fallo de lectura: es un negocio de
          // productos. Se dice, no se rebota (ver el tipo `Pantalla`).
          setPantalla({
            estado: prestador.codigo === 'sin_prestador' ? 'sinPrestador' : 'error',
          });
          return;
        }
        /* El equipo va EN PARALELO con las vidas: son dos preguntas
           independientes y encadenarlas sumaría un viaje a la portada.
           Su fallo NO tumba la pantalla — la sección simplemente no se
           monta (Ley 13 aplica al CUERPO, y el cuerpo de esta tab son
           las vidas). */
        const [r, eq, dn, pos] = await Promise.all([
          obtenerMascotasAtendidas(prestador.data.id),
          prestador.data.cuenta_comercial_id !== null
            ? obtenerEquipoNegocio(prestador.data.cuenta_comercial_id)
            : Promise.resolve(null),
          /* ⚠️ SIN `hasta`: el día del negocio lo resuelve el MOTOR en su
             zona. Pasárselo desde el dispositivo sería volver a meter el
             huso del teléfono en un número del negocio (D-648). */
          obtenerDatosNegocio(prestador.data.id),
          obtenerMiPosicionEnPrestador(prestador.data.id),
        ]);
        if (!vigente) return;
        setEquipo(eq !== null && eq.ok ? eq.data : null);
        // D-664: el fallo NO abre — null deja las franjas sin montar (Ley 23).
        setGestiona(pos.ok ? pos.data.gestiona : null);
        setDatos(dn.ok ? dn.data : null);
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

  /* ⭐ S86-C · LA ESCALA DE SERIES, y su choque DECLARADO con Ley 10.
     La lámina firma «apilada POR SERVICIO». **Ley 10 colapsa los oficios
     en DOS colores** (SALUD = identidad · CUIDADO = paseo+grooming+
     adiestramiento juntos, medido en `FilaCita`), porque el CANTO dice
     CATEGORÍA a propósito: cerrada, tope 5.
     ⇒ Con la paleta del canto, un apilado por servicio pintaría dos
     series del mismo color y sería **ilegible**, que es peor que
     desobedecer una ley escrita para otro registro.
     LO QUE HAGO: uso los cuatro hexes del REGISTRO GRÁFICA como ESCALA
     DE SERIES, asignados por orden del mix (estable: el motor ya ordena
     por atenciones desc). **Acá el color significa "qué serie", NO "qué
     categoría"** — es otro registro, el mismo que `BarrasSemana` usa.
     ⚠️ SE NOMBRA PARA EL GATE, no se cierra sola: si el founder quiere
     que la gráfica hable el idioma del canto, la salida es apilar por
     CATEGORÍA (dos series) y la leyenda cambia con ella. */
  const ESCALA: CapaGrafica[] = ['cuidado', 'identidad', 'comunidad', 'comunidadAmplia'];
  const capaDe = new Map<string, CapaGrafica>(
    (datos?.mix.items ?? []).map((it, i) => [it.servicio, ESCALA[i % ESCALA.length]!]),
  );
  /** La voz de un servicio. `servicioVoz` es nullable de verdad (③ del
   *  wrapper) y el código de motor JAMÁS se pinta (Ley 3): sin voz, se
   *  dice «Otro servicio» — genérico digno, no un slug. */
  const vozServicio = (v: string | null) => v ?? t('mascotas.servicioSinVoz');

  /* La semana ISO completa, con los días que el motor NO emitió puestos
     en cero por la SUPERFICIE — el motor no fabrica ceros a propósito
     (un cero fabricado no se distingue de un dato real), así que
     completarla es trabajo de acá. */
  const dias: DiaBarra[] = (() => {
    if (datos === null) return [];
    const porFecha = new Map<string, { clave: string; capa: CapaGrafica; valor: number }[]>();
    for (const d of datos.diaPorDia) {
      const arr = porFecha.get(d.fecha) ?? [];
      arr.push({ clave: d.servicio, capa: capaDe.get(d.servicio) ?? 'cuidado', valor: d.atenciones });
      porFecha.set(d.fecha, arr);
    }
    return Array.from({ length: 7 }, (_, i) => {
      const iso = sumarDias(datos.semana.desde, i);
      return {
        etiqueta: diaSemanaCorto(iso, idioma),
        tramos: porFecha.get(iso) ?? [],
        // El motor trae la semana ISO ENTERA ⇒ hay días > `hasta`. Son
        // agenda, no jornada cumplida: se dibujan tenues (aviso de A).
        futuro: iso > datos.hasta,
      };
    });
  })();

  return (
    // S59-B1 (safe area): el Encabezado ya absorbe y PINTA el inset superior
    // — el SafeAreaView top lo duplicaba (doble banda de papel arriba).
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}>
        <Encabezado variante="portada" saludo={t('mascotas.titulo')} />

        {/* ═══ ⭐ S86-C · EL DASHBOARD (lámina firmada 4-ago) ═══════════
            ⚠️ REGLA DE EXISTENCIA: sin `datos` el bloque NO SE MONTA. No
            hay esqueleto ni ceros — §2.6 prohíbe la métrica en cero para
            el prestador, y un cero fabricado no se distingue de un dato
            real. El cuerpo de la tab (las vidas) tiene su propio camino
            de error y no depende de esto.

            ☠️ «PIDE TU OJO» NO SE DIBUJA, y es decisión firmada: sus dos
            líneas (vacuna vencida · registro profesional faltante) NO
            TIENEN LECTOR. **El lugar queda; el texto inventado no** — una
            sección que fabrica su contenido es peor que una que no está,
            porque la primera se cree. Nace cuando A entregue sus fuentes.
            Lo mismo con el «1 aviso» del resumen de equipo. */}
        {datos !== null && (
          <View style={{ gap: spacing[4] }}>
            <Texto variante="seccion">{t('mascotas.tuSemana')}</Texto>

            {/* ① LOS TRES NÚMEROS PRESIDEN Y SON PUERTAS.
                ⚠️ DOS de las tres tienen destino; la del medio NO, y se
                declara en vez de inventarse: la lámina manda «vidas
                nuevas → familias», pero **la letra firmada de esta misma
                pantalla dice que LA FAMILIA NO ES UNA FRANJA DE ACÁ** (el
                sujeto del producto es la MASCOTA, no el hogar — EL NORTE).
                No existe superficie de familias, y fabricarle una sería
                construir una feature para honrar una flecha. Va al gate. */}
            {/* ⏪ S86-C (cura del gate) · ERAN TRES COLUMNAS Y SE ROMPÍA POR
                DOS LADOS: las tarjetas no compartían altura y «$52.00» se
                partía en dos renglones a un tercio de ancho.
                LA CAUSA DE LA ALTURA, medida: `Tarjeta` NO acepta `style`
                —solo `tinte`/`elevacion`/`relleno`/`luz`—, así que estira
                el CONTENEDOR con `flex:1` pero la tarjeta se queda del alto
                de su contenido. Igualarlas por prop exigiría ensanchar la
                pieza, que es de B.
                LA SALIDA, sin pedirle nada a nadie y que arregla las dos a
                la vez: **dos arriba con estructura IDÉNTICA** (número,
                rótulo y SIEMPRE una tercera línea ⇒ misma altura por
                construcción, no por CSS) **y la plata a lo ANCHO abajo**,
                donde el monto entra entero y no hay que achicarle la
                tipografía. Era una de las dos salidas que la mesa nombró. */}
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('mascotas.kpiAtencionesA11y', { n: datos.semana.atenciones })}
                onPress={() => setAbierta('vidas')}
                style={{ flex: 1 }}
              >
                <Tarjeta elevacion="reposo">
                  <Texto variante="titulo">{String(datos.semana.atenciones)}</Texto>
                  <Texto variante="dato">{t('mascotas.kpiAtenciones')}</Texto>
                  {/* La tercera línea SIEMPRE existe, y nunca es relleno: el
                      delta compara la MISMA porción de la semana previa, y
                      «igual que la anterior» es un HECHO, no un hueco
                      tapado. Antes se omitía en cero y ahí nacía la
                      desigualdad de altura. */}
                  <Texto variante="apoyo">
                    {datos.semana.delta === 0
                      ? t('mascotas.kpiDeltaIgual')
                      : t('mascotas.kpiDelta', {
                          signo: datos.semana.delta > 0 ? '+' : '−',
                          n: Math.abs(datos.semana.delta),
                        })}
                  </Texto>
                </Tarjeta>
              </Pressable>

              <View style={{ flex: 1 }}>
                <Tarjeta elevacion="reposo">
                  <Texto variante="titulo">{String(datos.semana.vidasNuevas)}</Texto>
                  <Texto variante="dato">{t('mascotas.kpiVidasNuevas')}</Texto>
                  <Texto variante="apoyo">
                    {datos.semana.familiasNuevas === 0
                      ? t('mascotas.kpiSinFamilias')
                      : datos.semana.familiasNuevas === 1
                        ? t('mascotas.kpiFamilia1')
                        : t('mascotas.kpiFamilias', { n: datos.semana.familiasNuevas })}
                  </Texto>
                </Tarjeta>
              </View>
            </View>

            {/* LA PLATA, A LO ANCHO. Unión discriminada: NO se aplana. Con
                `visible:false` la tarjeta habla del PERMISO, no del dato —
                no falta información, sobra audiencia. */}
            {datos.plata.visible ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('mascotas.kpiPlataA11y')}
                onPress={() => setAbierta('plata')}
              >
                <Tarjeta elevacion="reposo">
                  <View
                    style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] }}
                  >
                    <Texto variante="titulo">{montoCorto(datos.plata.semana)}</Texto>
                    <Texto variante="dato">{t('mascotas.kpiSemana')}</Texto>
                  </View>
                  {/* ⑥ EL ASTERISCO DE S85: el número dice lo que sabe Y
                      declara lo que le falta. Un total redondo que esconde
                      citas no se puede desconfiar. */}
                  <Texto variante="apoyo">
                    {datos.plata.sinPrecioSemana > 0
                      ? t('mascotas.kpiPlataParcial', { n: datos.plata.sinPrecioSemana })
                      : t('mascotas.kpiMes', { monto: montoCorto(datos.plata.mes) })}
                  </Texto>
                </Tarjeta>
              </Pressable>
            ) : (
              <Tarjeta elevacion="reposo">
                <Texto variante="dato">{t('mascotas.kpiPlataSoloTitular')}</Texto>
              </Tarjeta>
            )}

            {/* ② DÍA POR DÍA — apilada por servicio. La leyenda va ARRIBA
                y con la voz del servicio: sin ella los colores no dicen
                nada, y el color es el único canal de la barra. */}
            {datos.diaPorDia.length > 0 && (
              <Tarjeta elevacion="reposo">
                <View style={{ gap: spacing[3] }}>
                  <Texto variante="cuerpo">{t('mascotas.diaPorDia')}</Texto>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
                    {datos.mix.items.map((it) => (
                      <View
                        key={it.servicio}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }}
                      >
                        <View
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 2,
                            backgroundColor: theme.capa[capaDe.get(it.servicio) ?? 'cuidado'],
                          }}
                        />
                        <Texto variante="dato">{vozServicio(it.servicioVoz)}</Texto>
                      </View>
                    ))}
                  </View>
                  <BarrasApiladas
                    dias={dias}
                    etiqueta={t('mascotas.graficaA11y', { n: datos.semana.atenciones })}
                  />
                </View>
              </Tarjeta>
            )}

            {/* ① EL MIX DEL MES — DONA, como firmó la lámina.
                ⏪ La primera pasada lo resolvió como BARRA proporcional
                argumentando que una dona en RN exigía librería. **Era
                falso y el gate lo mostró:** `react-native-svg` ya vive en
                esta app. La barra se retira con su porqué (L-198).
                El motor sirve CUENTAS y TOTAL, jamás porcentajes — el %
                lo hace UNA superficie (ésta) para que dos no redondeen
                distinto sobre el mismo dato.
                ⚠️ N=1 DIBUJA IGUAL (firma del founder): la dona muestra
                DE QUÉ está hecho el 100%, y un solo servicio también es
                una respuesta a esa pregunta. */}
            {datos.mix.total > 0 && (
              <Tarjeta elevacion="reposo">
                <View style={{ gap: spacing[3] }}>
                  <Texto variante="cuerpo">{t('mascotas.mixDelMes')}</Texto>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
                    <DonaMix
                      total={datos.mix.total}
                      tramos={datos.mix.items.map((it) => ({
                        clave: it.servicio,
                        color: theme.capa[capaDe.get(it.servicio) ?? 'cuidado'],
                        valor: it.atenciones,
                      }))}
                      etiqueta={t('mascotas.mixA11y')}
                    />
                    {/* La leyenda vive AL LADO y no debajo: la dona sin
                        nombres es un anillo de colores, y con N=1 es la
                        leyenda la que dice cuál es ese 100%. */}
                    <View style={{ flex: 1, gap: spacing[1] }}>
                      {datos.mix.items.map((it) => (
                        <View
                          key={it.servicio}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }}
                        >
                          <View
                            style={{
                              width: 9,
                              height: 9,
                              borderRadius: 2,
                              backgroundColor: theme.capa[capaDe.get(it.servicio) ?? 'cuidado'],
                            }}
                          />
                          <Texto variante="dato">
                            {t('mascotas.mixFila', {
                              servicio: vozServicio(it.servicioVoz),
                              pct: Math.round((it.atenciones / datos.mix.total) * 100),
                            })}
                          </Texto>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </Tarjeta>
            )}
          </View>
        )}

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

        {/* ⭐ S99-C · el vendedor puro: se le dice la VERDAD y dónde SÍ
            viven sus números. **No se le inventa el cuarto de venta acá**
            —§2.0 lo deja explícitamente abierto («las specs finas de cada
            cuarto del vendedor NO están firmadas»)— y prometer una
            pantalla que no existe sería el mismo defecto con mejor voz. */}
        {pantalla.estado === 'sinPrestador' && (
          <EstadoVacio
            titulo={t('mascotas.sinPrestadorTitulo')}
            descripcion={t('mascotas.sinPrestadorDetalle')}
          />
        )}

        {pantalla.estado === 'listo' && pantalla.mascotas.length === 0 && (
          // §2.6: en preparación, jamás fracasado
          <EstadoVacio titulo={t('mascotas.vacio')} descripcion={t('mascotas.vacioDetalle')} />
        )}

        {/* ④ «LAS VIDAS QUE CUIDÁS» — la lista de siempre, ahora con la
            forma de la lámina: se pliega y NUNCA se calla (su resumen es
            el conteo). Es el destino del primer número. */}
        {pantalla.estado === 'listo' && pantalla.mascotas.length > 0 && (
          <SeccionDesplegable
            titulo={t('mascotas.vidasTitulo')}
            resumen={
              pantalla.mascotas.length === 1
                ? t('mascotas.vidasResumen1')
                : t('mascotas.vidasResumen', { n: pantalla.mascotas.length })
            }
            abierta={abierta === 'vidas'}
            onAlternar={() => alternar('vidas')}
          >
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
                      /* ⭐ S98-C · D-806 — y acá se sube UN ESCALÓN sobre el
                         resto: A ensanchó este lector con `raza_ruta_imagen`
                         (lookup por lote contra `cat_razas`), así que esta
                         lista muestra **la cara de SU raza**, no la genérica
                         de su especie. Por eso usa `…PorRuta`: entra por el
                         PATH que el catálogo ya resolvió, no por un slug
                         armado de texto libre — que es lo que A advirtió que
                         acierta a veces y el resto miente.
                         Sin ruta, la escalera cae sola al genérico. */
                      fotoUrl={
                        caraDeMascotaPorRuta({
                          especie: m.especie,
                          rutaImagen: m.raza_ruta_imagen,
                          fotoUri: m.foto_url ? urlsFotos.get(m.foto_url) : undefined,
                        }) ?? undefined
                      }
                      especie={esEspecie(m.especie) ? m.especie : undefined}
                      tamano="sm"
                    />
                  }
                  metadataMono={m.ultima_atencion !== null ? fechaCortaMono((m.ultima_atencion).slice(0, 10), idioma) : undefined}
                />
              </View>
            ))}
          </Tarjeta>
          </SeccionDesplegable>
        )}

        {/* ④ LA PLATA — su propia sección, destino del tercer número.
            ⚠️ Existe SOLO con `plata.visible`: la unión discriminada del
            wrapper ya dice que sin permiso las claves NO EXISTEN, así que
            acá no hay nada que esconder — la sección simplemente no es.
            ⑥ El resumen lleva el asterisco: declara lo que le falta. */}
        {datos !== null && datos.plata.visible && (
          <SeccionDesplegable
            titulo={t('mascotas.plataTitulo')}
            resumen={
              datos.plata.sinPrecioMes > 0
                ? t('mascotas.plataResumenParcial', {
                    monto: montoCorto(datos.plata.mes),
                    n: datos.plata.sinPrecioMes,
                  })
                : t('mascotas.plataResumen', { monto: montoCorto(datos.plata.mes) })
            }
            abierta={abierta === 'plata'}
            onAlternar={() => alternar('plata')}
          >
            <CeldaNavegacion
              icono="negocio"
              registro="aa"
              titulo={t('mascotas.plataDetalle')}
              /* ⏪ S86-C: apuntaba a `/negocio/liquidaciones`, QUE NO EXISTE
                 — la ruta real es `/liquidaciones`, en la RAÍZ. Lo escribí
                 por analogía con las otras celdas de Negocio y nadie lo vio:
                 **un enlace a una ruta inexistente no rompe nada hasta que
                 alguien lo toca**, así que typecheck, lint y gate salieron
                 verdes sobre un camino muerto. Es la familia de la sesión. */
              onPress={() => router.push('/liquidaciones')}
            />
          </SeccionDesplegable>
        )}

        {/* ⑤ TU TRAYECTORIA — HECHOS, JAMÁS SCORE (§2.7 · MODELO_LOYALTY
            §3): desde cuándo, cuántas atenciones, cuántas familias. Sin
            barras, sin niveles, sin comparación con nadie.
            ⚠️ `desde === null` es NULL HONESTO del motor —nunca atendió—
            y ahí la sección NO se monta: una trayectoria de cero no es
            una trayectoria, es una métrica en cero (§2.6). */}
        {datos !== null && datos.trayectoria.desde !== null && (
          <SeccionDesplegable
            titulo={t('mascotas.trayectoriaTitulo')}
            resumen={t('mascotas.trayectoriaResumen', {
              desde: fechaCortaMono(datos.trayectoria.desde, idioma),
              n: datos.trayectoria.atenciones,
            })}
            abierta={abierta === 'trayectoria'}
            onAlternar={() => alternar('trayectoria')}
          >
            <View style={{ gap: spacing[1] }}>
              <Texto variante="cuerpo">
                {t('mascotas.trayectoriaAtenciones', { n: datos.trayectoria.atenciones })}
              </Texto>
              <Texto variante="cuerpo">
                {datos.trayectoria.familiasServidas === 1
                  ? t('mascotas.trayectoriaFamilia1')
                  : t('mascotas.trayectoriaFamilias', { n: datos.trayectoria.familiasServidas })}
              </Texto>
            </View>
          </SeccionDesplegable>
        )}

        {/* ⭐ S86-C · «TU EQUIPO» — la primera franja de la mudanza, en la
            forma que firmó la lámina (decisión ④): la sección se PLIEGA
            pero NUNCA se calla — su resumen se lee sin abrirla.
            ⚠️ Regla de existencia: sin `esDueno` NO se monta (el gate del
            lector, arriba). Y `equipo === null` cubre los dos casos que no
            deben inventar nada: negocio sin cuenta comercial, y lectura
            caída — ninguno se disfraza de "equipo vacío". */}
        {/* ⏪ S88-C (D-664, 5-ago-2026): gateaba `equipo.esDueno` — la
            derivación «leí ≥1 fila» que daba true para los CUATRO roles.
            Ahora GESTIÓN del servidor: el mismo predicado que el tab
            NEGOCIO (dueño|administrador) — el delta declarado en la
            cabecera se cierra: el admin que ve el tab ve la franja. */}
        {gestiona === true && equipo !== null && equipo.miembros.length > 0 && (
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
            abierta={abierta === 'equipo'}
            onAlternar={() => alternar('equipo')}
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
