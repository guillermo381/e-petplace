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
                <View style={{ gap: spacing[4] }}>
                  <Texto variante="cuerpo">{t('alta.paso2.tiendaVoz')}</Texto>
                  <Boton
                    variante="primario"
                    bloque
                    cargando={pidiendoTienda}
                    etiqueta={t('alta.paso2.tiendaCta')}
                    onPress={() => void pedirTienda()}
                  />
                </View>
              )}
            </View>
          </Tarjeta>
        </View>
      </Entrada>

      {/* ── el enlace amable del §4.0bis: el paso que SÍ se completó ── */}
      <Entrada orden={4}>
        <Tarjeta elevacion="reposo" relleno="ninguno">
          <CeldaNavegacion
            registro="tinta"
            titulo={t('alta.paso2.configuracionTitulo')}
            detalle={t('alta.paso2.configuracionDetalle')}
            onPress={() => router.push('/ventas/configuracion')}
          />
        </Tarjeta>
      </Entrada>

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
