/**
 * PASO ② DEL WIZARD — QUÉ OFRECES (S97-C · `LA_CASA_DEL_PRESTADOR` §4.1).
 *
 * Es UNO de los dos únicos pedazos NUEVOS del wizard (§4.0: «lo único
 * nuevo son dos cosas — el paso ② y el destape»). Todo lo demás del alta
 * es reorganización de pantallas con tesis firmada.
 *
 * ── TESIS ──────────────────────────────────────────────────────────────
 * «Lo que ya hacés se prende acá; lo fino se configura después.»
 *
 * ── FIRMA ──────────────────────────────────────────────────────────────
 * **El toggle que no se puede apagar y DICE POR QUÉ.** Es la firma porque
 * es la única parte de la pantalla donde el producto demuestra que conoce
 * su propia regla en vez de dejar que el server la haga cumplir a los
 * golpes. Es de COMPORTAMIENTO, como pide la dosis del prestador.
 *
 * ── CHANEL ─────────────────────────────────────────────────────────────
 * Se quitó: el precio de cada servicio (vive en el taller — §4.0bis: «el
 * wizard ACTIVA, la configuración CONFIGURA»), el contador de servicios
 * por oficio (el número está a la vista, contarlo es decir dos veces lo
 * mismo) y el separador entre oficios (N3: separa el espacio + el título).
 *
 * ── 🔴 LA LEY DE LA PUERTA, APLICADA AL REVÉS (firmada de mesa S97) ────
 * **Lo imposible NI SE OFRECE.** El motor tiene `chk_ps_alguna_modalidad`
 * (`atiende_local OR atiende_domicilio`): un servicio sin ninguna
 * modalidad no puede existir. Entonces el ÚLTIMO encendido no se apaga y
 * la pantalla dice por qué — en vez de dejar mandar un guardado que la
 * base va a rechazar.
 *   · `sin_modalidad` de `fijarModalidadServicio` queda como RED, no como
 *     primera línea (orden de mesa, literal).
 *   · A lo hizo salir IGUAL del pre-check local y del rebote 23514 a
 *     propósito: si difirieran, el mismo problema tendría dos
 *     explicaciones.
 *
 * ── 🔴 «TU TIENDA» PROPONE, NO OTORGA (§4.2 de MODELO_DESPENSA) ────────
 * `otorgar_rol_vendedor` es admin-only por firma: *el vendedor PROPONE,
 * e-PetPlace PUBLICA*. El cinturón de A midió que **proponer NO habilita**
 * (`es_vendedor_de` sigue en `false` tras solicitar) ⇒ el chip dice «lo
 * pediste, lo estamos revisando», **jamás «ya podés vender»**.
 * Y `solicitada` NO entra al contador (ley S91): él llegó a cero al pedir.
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  CeldaNavegacion,
  Entrada,
  EstadoVacio,
  Esqueleto,
  EsqueletoGrupo,
  Hoja,
  Insignia,
  Interruptor,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import {
  fijarModalidadServicio,
  obtenerNaturalezasDeCuenta,
  obtenerOficiosNegocio,
  listarDocumentosCuenta,
  solicitarNaturalezaComercial,
  type EstadoNaturaleza,
  type OficioChip,
  type OficioNegocio,
  type ServicioDeOficio,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** Las claves van LITERALES — el diccionario tipado rompe con una key
 *  inexistente, y un template la apagaría con un cast (misma regla que el
 *  techo del HOY y que el estado de la configuración de la despensa). */
const CLAVE_OFICIO = {
  veterinaria: 'alta.oficioVeterinaria',
  grooming: 'alta.oficioGrooming',
  paseo: 'alta.oficioPaseo',
  adiestramiento: 'alta.oficioAdiestramiento',
  guarderia: 'alta.oficioGuarderia',
} as const satisfies Record<OficioChip, string>;

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; oficios: OficioNegocio[]; tienda: EstadoNaturaleza };

/** La fila de una modalidad: rótulo a la izquierda, interruptor a la
 *  derecha. Existe porque `Interruptor` no pinta su `etiqueta` (es su
 *  `accessibilityLabel`) — el texto visible siempre fue del consumidor. */
function FilaModalidad({
  etiqueta,
  encendido,
  onCambio,
}: {
  etiqueta: string;
  encendido: boolean;
  onCambio: (v: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing[3],
      }}
    >
      <View style={{ flex: 1 }}>
        <Texto variante="apoyo">{etiqueta}</Texto>
      </View>
      <Interruptor
        encendido={encendido}
        onCambio={onCambio}
        etiqueta={etiqueta}
        registro="oficio"
      />
    </View>
  );
}

export interface PasoOfrecesProps {
  prestadorId: string | null;
  cuentaComercialId: string;
}

export function PasoOfreces({ prestadorId, cuentaComercialId }: PasoOfrecesProps) {
  const { t } = useTraduccion();
  const router = useRouter();
  const { mostrar } = useAviso();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [guardando, setGuardando] = useState<string | null>(null);
  const [pidiendoTienda, setPidiendoTienda] = useState(false);
  const [modalTienda, setModalTienda] = useState(false);
  /** ⭐ S98-C · el modal de la cara LOCAL, que llega en V2 (firma). */
  const [modalLocalV2, setModalLocalV2] = useState(false);
  /** ⭐ S98-C (④) · el aviso de documentación. **La solicitud SIEMPRE
   *  entra**: esto avisa qué falta y dónde, y el gate de documentos vive
   *  en la APROBACIÓN (quien activa valida que estén), no en la puerta de
   *  pedir. *Frenar la solicitud por documentos convertiría un aviso en un
   *  muro, y el founder firmó lo contrario.* */
  const [modalDocs, setModalDocs] = useState(false);

  const cargar = useCallback(async () => {
    // El vendedor puro NO tiene fila de prestador — y eso NO es un error:
    // es el cinturón (§8.6bis). Sin prestador no hay servicios que listar,
    // y la sección de tienda igual tiene que poder hablar.
    const [oficiosRes, naturalezasRes] = await Promise.all([
      prestadorId === null
        ? Promise.resolve({ ok: true as const, data: [] as OficioNegocio[] })
        : obtenerOficiosNegocio(prestadorId),
      obtenerNaturalezasDeCuenta(cuentaComercialId),
    ]);

    if (!oficiosRes.ok || !naturalezasRes.ok) {
      setPantalla({ estado: 'error' });
      return;
    }
    const tienda =
      naturalezasRes.data.find((n) => n.naturaleza === 'seller_productos')?.estado ?? 'ninguna';
    setPantalla({ estado: 'listo', oficios: oficiosRes.data, tienda });
  }, [prestadorId, cuentaComercialId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  /** El toggle. `otra` es la modalidad que NO se está tocando: si está
   *  apagada, ésta es la última y no se puede apagar (la puerta al revés). */
  async function alternar(
    servicio: ServicioDeOficio,
    cual: 'local' | 'domicilio',
    valor: boolean,
  ) {
    if (guardando !== null || pantalla.estado !== 'listo') return;

    const otra = cual === 'local' ? servicio.atiendeDomicilio : servicio.atiendeLocal;
    if (!valor && !otra) {
      // 🔴 LO IMPOSIBLE NI SE OFRECE: no se manda el guardado, se explica.
      // `neutro` y no `error`: apagar el último no es una falla del
      // prestador — es una regla del producto. Un rojo acá lo trataría de
      // torpe por intentar algo razonable.
      mostrar({ texto: t('alta.paso2.ultimaModalidad'), variante: 'neutro' });
      return;
    }

    setGuardando(servicio.servicioId);
    const modalidad = {
      atiendeLocal: cual === 'local' ? valor : servicio.atiendeLocal,
      atiendeDomicilio: cual === 'domicilio' ? valor : servicio.atiendeDomicilio,
    };
    const res = await fijarModalidadServicio(servicio.servicioId, modalidad);
    setGuardando(null);

    if (!res.ok) {
      // La red del pre-check. `servicio_no_alcanzable` NO se degrada a ok
      // (L-139: reportar un guardado que no ocurrió).
      mostrar({ texto: res.mensaje, variante: 'error' });
      void cargar();
      return;
    }
    // Reemplazo directo del estado real que devolvió el motor (Ley 13: sin
    // layout shift animado, y sin optimismo que pueda mentir).
    setPantalla((prev) =>
      prev.estado !== 'listo'
        ? prev
        : {
            ...prev,
            oficios: prev.oficios.map((o) => ({
              ...o,
              servicios: o.servicios.map((s) =>
                s.servicioId === res.data.servicioId
                  ? { ...s, atiendeLocal: res.data.atiendeLocal, atiendeDomicilio: res.data.atiendeDomicilio }
                  : s,
              ),
            })),
          },
    );
  }

  async function pedirTienda() {
    if (pidiendoTienda) return;
    setPidiendoTienda(true);
    const res = await solicitarNaturalezaComercial(cuentaComercialId, 'seller_productos');
    setPidiendoTienda(false);
    if (!res.ok) {
      mostrar({ texto: res.mensaje, variante: 'error' });
      return;
    }
    setPantalla((prev) => (prev.estado !== 'listo' ? prev : { ...prev, tienda: res.data.estado }));

    /* ④ · EL AVISO DE DOCUMENTACIÓN — DESPUÉS de que la solicitud entró,
       nunca antes. Se lee acá y no al montar para no pagar el viaje a
       quien no va a pedir nada. Si la lectura falla NO se avisa: un modal
       que dice «te faltan documentos» sobre una lectura caída manda a
       alguien a subir lo que ya subió. */
    const docs = await listarDocumentosCuenta(cuentaComercialId);
    if (docs.ok && docs.data.length === 0) setModalDocs(true);
  }

  if (pantalla.estado === 'cargando') {
    return (
      <EsqueletoGrupo>
        <View style={{ gap: spacing[4] }}>
          <Esqueleto ancho="60%" alto={28} />
          <Esqueleto alto={96} />
          <Esqueleto alto={96} />
        </View>
      </EsqueletoGrupo>
    );
  }

  if (pantalla.estado === 'error') {
    // Ley 13: el error jamás se disfraza de vacío.
    return (
      <EstadoVacio
        registro="seccion"
        titulo={t('alta.errorTitulo')}
        descripcion={t('alta.errorVoz')}
        accion={
          <Boton
            variante="compacto"
            etiqueta={t('alta.reintentar')}
            onPress={() => void cargar()}
          />
        }
      />
    );
  }

  const sinServicios = pantalla.oficios.length === 0;

  return (
    <View style={{ gap: spacing[8] }}>
      <Entrada orden={0}>
        <View style={{ gap: spacing[2] }}>
          <Texto variante="titulo">{t('alta.paso2.titulo')}</Texto>
          <Texto variante="apoyo">{t('alta.paso2.bajada')}</Texto>
        </View>
      </Entrada>

      {/* ── «Tus servicios» ──
          ⚠️ El vacío vive FUERA de `Entrada`: Ley 13 — el vacío JAMÁS se
          anima (veto L-c, S81). El título sí entra al orden de lectura;
          el `EstadoVacio` aparece CON la pantalla, no después.
          (Lo cazó `verify:diseno` R-Ley13 antes del commit — el ratchet
          hizo exactamente su trabajo.) */}
      <View style={{ gap: spacing[3] }}>
        <Entrada orden={1}>
          <Texto variante="seccion">{t('alta.paso2.servicios')}</Texto>
        </Entrada>

        {sinServicios ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('alta.paso2.serviciosVacioTitulo')}
            descripcion={t('alta.paso2.serviciosVacioVoz')}
            accion={
              <Boton
                variante="compacto"
                etiqueta={t('alta.paso2.serviciosVacioCta')}
                onPress={() => router.push('/(tabs)/negocio')}
              />
            }
          />
        ) : (
          <Entrada orden={2}>
            <View style={{ gap: spacing[3] }}>
              {pantalla.oficios.map((oficio) => (
              <View key={oficio.oficio} style={{ gap: spacing[2] }}>
                <Texto variante="apoyo">{t(CLAVE_OFICIO[oficio.oficio])}</Texto>
                <Tarjeta elevacion="reposo">
                  <View style={{ gap: spacing[4] }}>
                    {oficio.servicios.map((s) => (
                      <View key={s.servicioId} style={{ gap: spacing[3] }}>
                        <Texto variante="cuerpo">{s.nombre}</Texto>
                        {/* 🔴 EL TEXTO VISIBLE ES DEL CONSUMIDOR — medido:
                            `Interruptor` usa `etiqueta` SOLO como
                            `accessibilityLabel`, no la pinta. Sin esta fila
                            salían dos toggles idénticos sin decir cuál era
                            cuál. Lo cazó la CAPTURA, no el typecheck: el
                            código compilaba y la a11y estaba bien puesta —
                            lo que faltaba solo se ve mirando. */}
                        <FilaModalidad
                          etiqueta={t('alta.paso2.enMiLocal')}
                          encendido={s.atiendeLocal}
                          onCambio={(v) => void alternar(s, 'local', v)}
                        />
                        <FilaModalidad
                          etiqueta={t('alta.paso2.aDomicilio')}
                          encendido={s.atiendeDomicilio}
                          onCambio={(v) => void alternar(s, 'domicilio', v)}
                        />
                      </View>
                    ))}
                  </View>
                </Tarjeta>
              </View>
              ))}
            </View>
          </Entrada>
        )}
      </View>

      {/* ── «Tu tienda» — PROPONE, no otorga ── */}
      <Entrada orden={3}>
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('alta.paso2.tienda')}</Texto>
          <Tarjeta elevacion="reposo">
            <View style={{ gap: spacing[4] }}>
              {pantalla.tienda === 'activa' ? (
                <Insignia
                  estado="alDia"
                  etiqueta={t('alta.estado.activa')}
                  tamaño="sm"
                  onPress={() => setModalTienda(true)}
                />
              ) : pantalla.tienda === 'solicitada' ? (
                <View style={{ gap: spacing[2] }}>
                  <Insignia
                    estado="info"
                    etiqueta={t('alta.estado.enRevision')}
                    tamaño="sm"
                    onPress={() => setModalTienda(true)}
                  />
                  {/* 🔴 la voz que el cinturón obliga: pedido ≠ habilitado */}
                  <Texto variante="apoyo">{t('alta.paso2.tiendaPropuesta')}</Texto>
                </View>
              ) : (
                /* ⭐ S98-C · LOS DOS TOGGLES DE LA SOLICITUD (firma del
                   founder): *«al pedir activar la tienda, dos preguntas:
                   ¿vendés en tu local? y ¿vendés a través de ePetPlace?»*.

                   **No son dos configuraciones: son la DECLARACIÓN DE
                   INTENCIÓN de cada una de las dos caras** que §8.6ter ya
                   firmó —el inventario del local y el catálogo de
                   e-PetPlace—. Por eso viven en la solicitud y no en la
                   configuración: se declaran ANTES de tener la tienda.

                   ⚠️ **Solo el segundo tiene motor hoy.** El primero
                   declara una cara que llega en V2, y **lo dice al
                   tocarlo** en vez de guardar en silencio algo que nadie
                   va a leer — misma excepción firmada que la baldosa del
                   inventario en Negocio: *la puerta anuncia lo que viene.*
                   *Un toggle que se prende y no hace nada es peor que uno
                   que no está: promete estado.* */
                <View style={{ gap: spacing[4] }}>
                  <Texto variante="cuerpo">{t('alta.paso2.tiendaVoz')}</Texto>

                  <FilaModalidad
                    etiqueta={t('alta.paso2.tiendaLocalPregunta')}
                    encendido={false}
                    onCambio={() => setModalLocalV2(true)}
                  />
                  <FilaModalidad
                    etiqueta={t('alta.paso2.tiendaCanalPregunta')}
                    encendido={false}
                    onCambio={() => void pedirTienda()}
                  />
                  {pidiendoTienda ? (
                    <Texto variante="apoyo">{t('alta.paso2.tiendaPidiendo')}</Texto>
                  ) : null}
                </View>
              )}
            </View>
          </Tarjeta>
        </View>
      </Entrada>

      {/* ── el enlace amable del §4.0bis: el paso que SÍ se completó ──
          🔴 S98-C · **RESUELVE POR NATURALEZA, y antes no lo hacía.**

          Reporte del founder: pidió «Quiero vender productos» y «se
          habilitó un botón de entrar a configurar que mostraba también
          servicios de salud». **Medido: el botón no se habilitaba — estaba
          SIEMPRE**, incondicional, y llevaba a `/ventas/configuracion`, que
          es la config del VENDEDOR (turnos · reparto · recursos ·
          facturación). Lo que sí desapareció al reentrar fue el CTA
          «Quiero vender productos», y desapareció BIEN: la naturaleza había
          pasado a `solicitada`.

          Reproducido con `duenovet` —una cuenta sin tienda y que nunca la
          pidió—: el enlace aparecía igual. *No era un estado transitorio:
          era de AUDIENCIA.*

          Y el diagnóstico fino, que es lo que ordena la cura: **la voz
          decía servicios y la puerta llevaba a la tienda.** «Precios,
          horarios y cobertura» describe con precisión el taller de un
          oficio; describe mal la config de una despensa. Los dos lados
          existen y cada uno tiene su casa, así que el enlace no se apaga:
          **se rutea**.

          ⚠️ Y con la tienda `solicitada` va al lado de SERVICIOS, no al de
          la tienda — la firma del founder es literal: *«se ofrece, pero no
          se activa hasta que se aprueba»* (Ley 23: la puerta no ofrece lo
          que va a rechazar). */}
      <Entrada orden={4}>
        <Tarjeta elevacion="reposo" relleno="ninguno">
          {pantalla.tienda === 'activa' ? (
            <CeldaNavegacion
              registro="tinta"
              titulo={t('alta.paso2.configuracionTiendaTitulo')}
              detalle={t('alta.paso2.configuracionTiendaDetalle')}
              onPress={() => router.push('/ventas/tienda')}
            />
          ) : (
            <CeldaNavegacion
              registro="tinta"
              titulo={t('alta.paso2.configuracionTitulo')}
              detalle={t('alta.paso2.configuracionDetalle')}
              onPress={() => router.push('/(tabs)/negocio')}
            />
          )}
        </Tarjeta>
      </Entrada>

      {/* ⭐ S98-C · LA CARA LOCAL LLEGA EN V2 — misma excepción firmada que
          la baldosa del inventario en Negocio: la puerta ANUNCIA lo que
          viene en vez de callarlo. El toggle vuelve solo a apagado: no
          guarda nada, y decirlo es más honesto que dejarlo prendido
          fingiendo estado. */}
      <Hoja
        visible={modalLocalV2}
        onCerrar={() => setModalLocalV2(false)}
        titulo={t('alta.paso2.tiendaLocalV2Titulo')}
        altura="media"
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">{t('alta.paso2.tiendaLocalV2Voz')}</Texto>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('alta.paso2.tiendaLocalV2Cerrar')}
            onPress={() => setModalLocalV2(false)}
          />
        </View>
      </Hoja>

      {/* ⭐ S98-C (④) · EL AVISO DE DOCUMENTACIÓN (firma del founder).
          **La solicitud YA ENTRÓ** cuando esto aparece: el modal no frena
          nada, dice qué falta y DÓNDE. El gate de documentos vive en la
          aprobación —quien activa valida que estén—, y por eso acá no hay
          un «no podés pedir»: *frenar la solicitud por documentos
          convertiría un aviso en un muro.* */}
      <Hoja
        visible={modalDocs}
        onCerrar={() => setModalDocs(false)}
        titulo={t('alta.paso2.docsFaltanTitulo')}
        altura="media"
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">{t('alta.paso2.docsFaltanVoz')}</Texto>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('alta.paso2.docsFaltanCta')}
            onPress={() => setModalDocs(false)}
          />
        </View>
      </Hoja>

      <Hoja
        visible={modalTienda}
        onCerrar={() => setModalTienda(false)}
        titulo={t('alta.estado.modalTitulo')}
        altura="media"
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">{t('alta.estado.modalVoz')}</Texto>
        </View>
      </Hoja>
    </View>
  );
}
