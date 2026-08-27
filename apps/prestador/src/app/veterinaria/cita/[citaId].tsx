// ─────────────────────────────────────────────────────────────────────
// EL DETALLE DE UNA CITA DE VETERINARIA — /veterinaria/cita/[citaId]
// (S69-B, M0). El destino del tap de la jornada: la cita vet que aparece
// en el HOY (mostrador o reserva) es TAPEABLE y aterriza acá.
//
// TESIS: esta atención dice quién, qué y cuándo — y su expediente a un tap.
// FIRMA: la composición que preside (la mascota) + el salto al expediente
//   (comportamiento, patrón de la Zona 1 del HOY — no color).
// CHANEL: sin "próximamente" que grite — el Durante clínico llega en V4
//   y su ausencia no se decora; la pantalla solo dice la verdad de la cita.
//
// READ-ONLY por diseño: el motor de la atención clínica (el Durante con
// procedencia, el registro por puerta única) es la tanda V4. Acá vive lo
// mínimo para que la jornada tenga destino. Dosis baja (§15b: acento de
// oficio, sin gradiente). La RLS (cita_select_prestador) es el guard.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Insignia,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useTheme,
  type AvatarMascotaEspecie,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  caraDeMascota,
  obtenerCitaVetPorId,
  obtenerContactoReservaCita,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerPresupuestosPrestador,
  puedoAtenderClinico,
  resolverUrlFoto,
  type CitaAgendaPaseo,
  type ContactoReservaCita,
  type EstadoPresupuesto,
  type PresupuestoPrestador,
} from '@epetplace/api';
import { fechaDiaSemanaHumana, type IdiomaSoportado } from '@epetplace/i18n';

import { verificarSesion } from '@/lib/api';
import { vozCitaVet } from '@/lib/voz-cita-vet';
import { useTraduccion } from '@/i18n';
import { CitaNoDisponible } from '@/components/cita-no-disponible';
import { RecetaDeLaConsulta } from '@/components/receta-de-la-consulta';
import { EntradaVideollamada } from '@/components/entrada-videollamada';
import { vozErrorVet } from '@/lib/voz-error-vet';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'no_existe' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; cita: CitaAgendaPaseo; fotoUrl?: string };

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

export default function DetalleCitaVet() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const router = useRouter();
  const { t, idioma } = useTraduccion();
  const { citaId = '' } = useLocalSearchParams<{ citaId: string }>();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  // Cura de gate: los presupuestos de esta mascota — la relectura de B3.
  const [presupuestos, setPresupuestos] = useState<PresupuestoPrestador[]>([]);
  // S74-B recepción v1 (decisión de mesa): el CONTACTO es propiedad de
  // la VISITA — nombre + teléfono de QUIEN RESERVÓ (lector angosto de A,
  // gate empleado_tiene_rol con recepción incluida). E4 generalizada: su
  // error se DICE — jamás se pinta como visita-sin-contacto.
  const [contacto, setContacto] = useState<ContactoReservaCita | 'cargando' | 'error'>('cargando');
  // S76-B2 (D-525, verbatim founder S75: "la recepción no debería poder
  // ni verlo"): GATE DE AUSENCIA de la entrada de atender. false hasta
  // confirmar — ante la duda la acción NO se monta (jamás deshabilitada,
  // jamás con candado: no existe para quien no atiende). Resuelve por
  // MOTOR (puedoAtenderClinico = el mismo gate de los 4 DEFINER D-490);
  // el flip por chip §6.2 es pedido de motor declarado en el wrapper.
  const [puedeAtender, setPuedeAtender] = useState(false);
  /* 🔴 EL CINTURÓN DE LOS CERO BOTONES (regresión del gate, 26-ago).
     `false` hasta que el SERVIDOR confirme que hay entrada. Mientras tanto
     «Iniciar consulta» **se queda**: *ante la duda, el vet tiene un botón —
     el error de que sobre uno es infinitamente más barato que el de que no
     quede ninguno y el profesional no pueda trabajar.* */
  const [hayEntradaVideo, setHayEntradaVideo] = useState(false);

  // Estado de la cita → Insignia (misma voz que el HOY — Ley 17.3).
  const INSIGNIA_POR_ESTADO: Record<string, { estado: InsigniaEstado; etiqueta: string }> = {
    en_curso: { estado: 'info', etiqueta: t('agenda.enCurso') },
    confirmada: { estado: 'info', etiqueta: t('agenda.estadoConfirmada') },
    completada: { estado: 'alDia', etiqueta: t('agenda.estadoCompletada') },
    no_show: { estado: 'atencion', etiqueta: t('agenda.estadoNoShow') },
  };

  // Estado del presupuesto → Insignia (vencido perezoso ya resuelto en el shape).
  const INSIGNIA_PRESUPUESTO: Record<EstadoPresupuesto, { estado: InsigniaEstado; etiqueta: string }> = {
    borrador: { estado: 'info', etiqueta: t('presupuesto.estadoBorrador') },
    enviado: { estado: 'proximo', etiqueta: t('presupuesto.estadoEnviado') },
    aprobado: { estado: 'alDia', etiqueta: t('presupuesto.estadoAprobado') },
    rechazado: { estado: 'atencion', etiqueta: t('presupuesto.estadoRechazado') },
    vencido: { estado: 'atencion', etiqueta: t('presupuesto.estadoVencido') },
  };

  const cargar = useCallback(async () => {
    setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const r = await obtenerCitaVetPorId(citaId);
    if (!r.ok) {
      setPantalla(r.codigo === 'cita_no_encontrada' ? { estado: 'no_existe' } : { estado: 'error', mensaje: vozErrorVet(t, 'citaVet', r) });
      return;
    }
    const fotoUrl = r.data.mascota?.foto_url ? await resolverUrlFoto(r.data.mascota.foto_url) : undefined;
    setPantalla({ estado: 'listo', cita: r.data, fotoUrl: fotoUrl ?? undefined });
    // S76-B2 (D-525): ¿quién mira puede ATENDER? — no bloquea el detalle
    // (Ley 13); mientras no se confirme, la entrada de atender no existe.
    void (async () => {
      const pr = await obtenerMiPrestador();
      if (!pr.ok) return; // el gate cierra ante la duda (patrón S75-B)
      setPuedeAtender(await puedoAtenderClinico(pr.data.id));
    })();
    // el contacto de la visita — su fallo NO tumba el detalle (Ley 13),
    // pero se dice en su bloque (E4: error ≠ ausencia).
    setContacto('cargando');
    void obtenerContactoReservaCita(citaId).then((c) => {
      setContacto(c.ok ? c.data : 'error');
    });
    // Los presupuestos de esta mascota (relectura de B3). Azúcar de vista:
    // su error NO tumba el detalle (Ley 13 — el detalle tiene su camino).
    const mascota = r.data.mascota;
    if (mascota) {
      const cta = await obtenerMiCuentaComercial();
      if (cta.ok && cta.data) {
        const ps = await obtenerPresupuestosPrestador(cta.data.id, { mascotaId: mascota.id });
        if (ps.ok) setPresupuestos(ps.data);
      }
    }
  }, [citaId]);

  // Refetch en focus (patrón del HOY): al volver, la verdad se re-lee.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const cita = pantalla.estado === 'listo' ? pantalla.cita : null;
  const nombre = cita?.mascota?.nombre ?? t('agenda.mascotaFallback');
  const hora = cita?.hora ? cita.hora.slice(0, 5) : '—';
  const dur = cita?.duracion_minutos;
  const ef = cita ? (cita.atencion?.estado ?? cita.estado) : null;
  const insignia = ef ? INSIGNIA_POR_ESTADO[ef] : undefined;
  /* S106-C t3 · ¿esta cita ocurre por video?
     ⚠️ **Se lee de `tipo_servicio` y no de `modalidad`, y es una derivación
     declarada, no un atajo:** `CONTRATOS-PARA-C.md` §—«la modalidad ya NO se
     manda desde el cliente para teleconsulta: se DERIVA del tipo de servicio,
     server-side»— ⇒ hoy los dos valores son el mismo hecho.
     🔴 El campo canónico es `modalidad`, y está pedido a A (§E1 del recorrido
     de la Obra 0). *El día que exista una cita presencial marcada como
     teleconsulta —o al revés— esta línea mentiría y nada avisaría*, así que
     cuando el campo llegue esto cambia por `cita.modalidad === 'telemedicina'`
     y se borra este comentario. */
  const esTeleconsulta = cita?.tipo_servicio === 'telemedicina';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('citaVet.titulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4], paddingBottom: insets.bottom + spacing[8] }}>
        {pantalla.estado === 'cargando' && (
          <Tarjeta elevacion="plana">
            <EsqueletoGrupo>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <Esqueleto forma="circulo" alto={56} />
                <View style={{ flex: 1, gap: spacing[2] }}>
                  <Esqueleto forma="linea" ancho="60%" />
                  <Esqueleto forma="linea" ancho="40%" />
                </View>
              </View>
            </EsqueletoGrupo>
          </Tarjeta>
        )}

        {pantalla.estado === 'no_existe' && (
          <CitaNoDisponible registro="pantalla" citaId={citaId} titulo={t('citaVet.noExiste')} />
        )}

        {pantalla.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.status.dangerText,
                }}
              >
                {pantalla.mensaje}
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        )}

        {pantalla.estado === 'listo' && cita && (
          <>
            {/* La mascota preside: cara + nombre + estado. */}
            <Tarjeta elevacion="reposo">
              <View style={{ gap: spacing[4] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                  <AvatarMascota
                    nombre={nombre}
                    /* S98-C · D-806 — porqué en `atender/pizarra-hoja`. */
                    fotoUrl={
                      caraDeMascota({
                        especie: cita.mascota?.especie,
                        razaSlug: null,
                        fotoUri: pantalla.fotoUrl,
                      }) ?? undefined
                    }
                    tamano="lg"
                  />
                  <View style={{ flex: 1, gap: spacing[1] }}>
                    <Texto variante="titulo">
                      {nombre}
                    </Texto>
                    {/* S106-C t3 · La insignia de ESTADO y la de MODALIDAD
                        conviven en la misma fila y **dicen cosas distintas**:
                        una es en qué punto está la cita, la otra es POR DÓNDE
                        ocurre. `flexWrap` porque con un nombre largo la
                        segunda tiene que bajar, no comprimir a la primera. */}
                    {(insignia || esTeleconsulta) && (
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: spacing[2],
                        }}
                      >
                        {insignia && (
                          <Insignia estado={insignia.estado} etiqueta={insignia.etiqueta} tamaño="sm" />
                        )}
                        {/* La etiqueta la arma la pieza (B): no se le escribe
                            texto — así las dos apps dicen lo mismo sin que
                            nadie tenga que acordarse de copiarlo. */}
                        {esTeleconsulta && <Insignia modalidad="teleconsulta" tamaño="sm" />}
                      </View>
                    )}
                  </View>
                  <Icono nombre="veterinaria" registro="aa" tamano={24} />
                </View>

                <Separador />

                {/* Servicio + cuándo — voz de máquina para la metadata. */}
                <View style={{ gap: spacing[3] }}>
                  {/* S72-B pieza 3: la MISMA voz que la celda de agenda —
                      un procedimiento coordinado dice su descripción, no el
                      genérico. Una superficie que contradice a la otra en el
                      mismo dato es peor que el genérico. */}
                  <Dato etiqueta={t('citaVet.servicio')} valor={vozCitaVet(cita.descripcionPresupuesto, cita.tipo.nombre, t)} />
                  <Dato
                    etiqueta={t('citaVet.cuando')}
                    valor={`${fechaDiaSemanaHumana(cita.fecha ?? '', idioma as IdiomaSoportado)} · ${hora}${dur ? ` · ${dur} min` : ''}`}
                    mono
                  />
                </View>
              </View>
            </Tarjeta>

            {/* ── S74-B · LA VISITA (recepción v1, decisión de mesa): quién
                reservó + su teléfono — propiedad de la CITA, no del animal
                (cero dependencia de D-485). Walk-in del mostrador: nulls
                honestos → el hueco SE DICE (la persona está enfrente). ── */}
            <Tarjeta elevacion="reposo">
              <View style={{ gap: spacing[3] }}>
                <Texto variante="seccion">{t('citaVet.visitaTitulo')}</Texto>
                {contacto === 'cargando' ? (
                  <EsqueletoGrupo>
                    <Esqueleto forma="linea" ancho="50%" />
                  </EsqueletoGrupo>
                ) : contacto === 'error' ? (
                  // E4 GENERALIZADA: el error del lector JAMÁS se pinta
                  // como visita-sin-contacto.
                  <Texto variante="apoyo">{t('citaVet.visitaError')}</Texto>
                ) : contacto.nombre === null && contacto.telefono === null ? (
                  // walk-in sin cita de reserva: fila de nulls del motor —
                  // la persona está enfrente, el dato no existe. Ni error,
                  // ni blanco (pase de mesa S74, caso 3).
                  <Texto variante="apoyo">{t('citaVet.visitaSinContacto')}</Texto>
                ) : (
                  <View style={{ gap: spacing[3] }}>
                    {contacto.nombre !== null ? (
                      <Dato etiqueta={t('citaVet.visitaReservo')} valor={contacto.nombre} />
                    ) : null}
                    {contacto.telefono !== null ? (
                      <Dato
                        etiqueta={t('citaVet.visitaTelefono')}
                        valor={`${contacto.telefonoCodigoPais !== null ? `+${contacto.telefonoCodigoPais} ` : ''}${contacto.telefono}`}
                      />
                    ) : (
                      // null honesto CON VOZ (pase de mesa S74, caso 2 — hay
                      // caso real en la data viva): SE DICE que falta, jamás
                      // "sin teléfono registrado" vestido de dato.
                      <Texto variante="apoyo">{t('citaVet.visitaSinTelefono')}</Texto>
                    )}
                  </View>
                )}
              </View>
            </Tarjeta>

            {/* ── S106-C t3 · LA PUERTA A LA VIDEOCONSULTA (D-938) ──────────
                🔴 **PRESIDE a «La consulta» a propósito.** En una teleconsulta
                el acto empieza entrando a la sala: el dictado sale del modal
                DURANTE la llamada y el borrador cae al Durante al colgar. Si
                el dictado se ofreciera primero, el vet entraría a escribir una
                nota de una consulta que todavía no pasó.

                «La consulta» se conserva abajo, sin tocar su gate: al re-abrir
                la cita días después, ahí es donde vive la nota.

                Hereda el MISMO gate clínico que atender (`puedeAtender`,
                D-525): entrar a una teleconsulta es acto clínico, no de
                mostrador. La recepción no ve esta tarjeta — gate de ausencia,
                jamás candado.

                El envoltorio es de la PIEZA: si el servidor no deja entrar y
                el motivo es uno de los dos silencios, **la tarjeta no se monta
                vacía** (ver `entrada-videollamada.tsx`). */}
            {cita.mascota && puedeAtender && esTeleconsulta && (
              <EntradaVideollamada
                citaId={cita.id}
                alEntrar={() =>
                  router.push({
                    pathname: '/videollamada/[citaId]',
                    params: {
                      citaId: cita.id,
                      /* Quién está del otro lado: la PERSONA que reservó, no
                         la mascota. `null` honesto ⇒ no se manda y la pantalla
                         cae a su propia voz genérica. */
                      familia:
                        contacto !== 'cargando' && contacto !== 'error' && contacto.nombre !== null
                          ? contacto.nombre
                          : '',
                    },
                  })
                }
                onVeredicto={setHayEntradaVideo}
                envolver={(contenido) => (
                  <Tarjeta elevacion="reposo">
                    <View style={{ gap: spacing[3] }}>
                      <Texto variante="seccion">{t('consulta.vcEntradaTitulo')}</Texto>
                      {contenido}
                    </View>
                  </Tarjeta>
                )}
              />
            )}

            {/* S70-B2-v2: LA CONSULTA (el Durante clínico) — la acción central
                de la cita vet: dictado → nota estructurada → sedimento. */}
            {/* S76-B2 (D-525): la acción de atender EXISTE solo para quien
                atiende (titular o chip clínico) — gate de ausencia, jamás
                candado. Para recepción, esta tarjeta no se monta. */}
            {/* 🔴 S106-C t3 · EN TELECONSULTA ESTE BOTÓN NO SE MONTA (hallazgo
                ⑦ del gate, firma de la mesa). Con la entrada arriba, «Iniciar
                consulta» quedaba como un SEGUNDO botón que hace lo mismo — y
                peor: *se lee como si hubiera un paso más que hacer*, cuando en
                una teleconsulta el acto empieza entrando y el dictado sale del
                modal DURANTE la llamada.

                🔴 **ENMENDADO EL MISMO DÍA — la v1 de esta condición decía
                `!esTeleconsulta` y produjo CERO BOTONES.** El choque: esta
                pantalla decidía por `tipo_servicio` y la RPC de entrada decide
                por `modalidad`; con la modalidad sin escribir, **una condición
                apagaba este botón y la otra no encendía el suyo.** *Dos
                condiciones distintas gobernando la misma decisión dejan un
                hueco entre las dos, y ahí no queda nada.*
                ⇒ Hoy el ocultamiento depende de que la entrada EXISTA de
                verdad (`hayEntradaVideo`, que lo dice el servidor), no de mi
                derivación. **Y arranca en `false`: ante la duda queda el botón
                viejo.** *Quitar un botón redundante es una condición nueva
                sobre algo que YA funcionaba — el costo de equivocarse no es
                que sobre uno, es que no quede ninguno.*

                ⚠️ **Consecuencia medida y declarada, no frenada:** este era el
                único camino de vuelta a la nota desde el detalle de la cita.
                Al colgar, el borrador viaja solo al Durante, así que el camino
                del día de la consulta está cubierto; **lo que queda sin puerta
                es volver a la nota de una teleconsulta días después**, cuando
                el `replace` del colgado ya no está. La receta y el certificado
                sí conservan la suya. *Se anota acá para que quien lo note
                después sepa que fue decidido y no olvidado.* */}
            {cita.mascota && puedeAtender && !hayEntradaVideo && (
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <CeldaNavegacion
                  icono="veterinaria"
                  registro="aa"
                  titulo={t('consulta.iniciarCta')}
                  detalle={t('consulta.iniciarDetalle')}
                  onPress={() =>
                    router.push({
                      pathname: '/veterinaria/consulta/[citaId]',
                      params: { citaId: cita.id, mascotaId: cita.mascota!.id, mascotaNombre: cita.mascota!.nombre },
                    })
                  }
                />
              </Tarjeta>
            )}

            {/* S90-D · EMITIR UN CERTIFICADO DE SALUD. Vive detrás del MISMO
                gate que atender: emitirlo es acto clínico y se gatea por
                CHIP, no por membresía (ley madre S76). Para recepción esta
                entrada NO SE MONTA — gate de ausencia, jamás candado (D-525).
                La pantalla vuelve a verificar por su cuenta: esto es la
                puerta, no el guard. */}
            {/* S91-B (firma founder 7-ago-2026) · LA RECETA ENTRA A ESTA
                MISMA TARJETA — los papeles de la consulta viven juntos.
                ⚠️ RATIFICABLE: la firma nombró «la consulta sedimentada», y
                ahí también se montó. Acá TAMBIÉN porque se midió que la
                consulta solo llega a su fase `despues` en la sesión del
                dictado (al re-entrar arranca en `antes`): sin este montaje
                el papel sería alcanzable unos minutos y nunca más, y el caso
                de uso es re-imprimir meses después. Si el founder quiso
                estrictamente un sitio, borrar este bloque es una línea.
                Hereda el gate clínico de la tarjeta: leer una receta es
                acto clínico igual que emitir un certificado. */}
            {cita.mascota && puedeAtender && (
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <RecetaDeLaConsulta
                  mascotaId={cita.mascota.id}
                  citaId={cita.id}
                  conSeparadorAbajo
                />
                <CeldaNavegacion
                  icono="documento"
                  registro="aa"
                  titulo={t('certificado.entradaTitulo')}
                  detalle={t('certificado.entradaDetalle')}
                  onPress={() =>
                    router.push({
                      pathname: '/veterinaria/certificado/[citaId]',
                      params: { citaId: cita.id, mascotaId: cita.mascota!.id },
                    })
                  }
                />
              </Tarjeta>
            )}

            {/* El expediente a un tap (patrón Zona 1 del HOY, Ley 19.1). */}
            {cita.mascota && (
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <CeldaNavegacion
                  icono="carnet"
                  registro="aa"
                  titulo={t('agenda.conocerMascota', { nombre })}
                  onPress={() =>
                    router.push({ pathname: '/mascota/[mascotaId]', params: { mascotaId: cita.mascota!.id } })
                  }
                />
              </Tarjeta>
            )}

            {/* B3 (S69-B) → S70-B1: armar un presupuesto es una acción de
                PRIMERA CLASE de esta pantalla (§15b, Ley 19.1) — celda de
                navegación con glifo y jerarquía, hermana de "conocer a la
                mascota", no un botón suelto. La cita viaja como origen (FK).
                Glifo `pagos` provisional: el set b′ aún no tiene un ícono
                propio de presupuesto (follow-up: gate founder por ícono). */}
            {cita.mascota && (
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <CeldaNavegacion
                  icono="pagos"
                  registro="aa"
                  titulo={t('presupuesto.crear')}
                  detalle={t('presupuesto.crearDetalle')}
                  onPress={() =>
                    router.push({
                      pathname: '/veterinaria/presupuesto/nuevo',
                      params: { mascotaId: cita.mascota!.id, citaId: cita.id },
                    })
                  }
                />
              </Tarjeta>
            )}

            {/* Cura de gate: la RELECTURA de los presupuestos armados —
                "¿qué pasó con lo que armé?". Estado por fila + total; sin
                destino v1 (el detalle rico es refinamiento). */}
            {presupuestos.length > 0 && (
              <View style={{ gap: spacing[2] }}>
                <Texto variante="seccion">
                  {t('presupuesto.listaTitulo', { nombre })}
                </Texto>
                <Tarjeta elevacion="reposo" relleno="ninguno">
                  {presupuestos.map((p, i) => {
                    const ins = INSIGNIA_PRESUPUESTO[p.estado];
                    return (
                      <View key={p.id}>
                        {i > 0 && <Separador />}
                        <Celda
                          titulo={`$${p.total.toFixed(2)}`}
                          subtitulo={p.items.map((it) => it.nombre).filter(Boolean).join(' · ') || undefined}
                          fin={<Insignia estado={ins.estado} etiqueta={ins.etiqueta} tamaño="sm" />}
                        />
                      </View>
                    );
                  })}
                </Tarjeta>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Una fila etiqueta/valor — composición local con la casa (no hay
// componente de "campo de solo lectura"; Celda es para listas tapeables).
function Dato({ etiqueta, valor, mono = false }: { etiqueta: string; valor: string; mono?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing[0.5] }}>
      <Texto variante="apoyo">
        {etiqueta}
      </Texto>
      <Text
        style={{
          fontFamily: mono ? typography.family.mono.regular : typography.family.sans.regular,
          fontSize: typography.size.base,
          color: theme.text.primary,
        }}
      >
        {valor}
      </Text>
    </View>
  );
}
