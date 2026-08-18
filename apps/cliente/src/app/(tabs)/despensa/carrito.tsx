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
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Hoja,
  EstadoVacio,
  SelectorDestinoItem,
  Separador,
  PantallaConPie,
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
import { destinoComunDelCarrito, destinosAdmitidos } from '@/lib/despensa/destinos';
import { useTraduccion } from '@/i18n';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

/** Tres fases, jamás dos (L-218: `[]` es TRES situaciones distintas —
 *  cargando, error y de verdad no hay — y decidir con `length === 0`
 *  ya le dijo al founder que no tenía perros. DOS veces). */
type Fase<T> = T | 'cargando' | 'error';

export default function DespensaCarrito() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
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
        especie: m.especie,
        fotoUrl: caraDeMascotaPorRuta({
          especie: m.especie,
          rutaImagen: m.raza_ruta_imagen,
          fotoUri: fotos[m.id],
        }),
      })),
    [elegibles, fotos],
  );

  /**
   * 🔴 G-03 · EL DESTINO NO OFRECE ESPECIES IMPOSIBLES.
   *
   * El gate lo vio con todas las letras: **alimento para perro ofreciendo
   * loro, hámster y pez.** El producto ya declara `especies_aplicables` —
   * lo que faltaba era que el selector lo mirara.
   *
   * `[]` = SIN RESTRICCIÓN, y se respeta: un producto que no declara especie
   * (una cama, un juguete) sirve para toda la casa. *Leer `[]` como «no
   * aplica a nadie» habría vaciado el selector de media vitrina* — la lista
   * vacía significa «no se declaró», jamás «ninguna».
   */
  const destinosPara = useCallback(
    (item: { especies_aplicables: string[] }) =>
      destinosAdmitidos(destinos, item.especies_aplicables),
    [destinos],
  );

  /**
   * 🔴 G-10 · LA PREGUNTA SE HACE UNA VEZ, NO UNA POR PRODUCTO.
   *
   * **La tensión que hubo que resolver, porque toca letra firmada:** §4 dice
   * que *«la app nunca adivina de quién es una compra»*, y la cabecera de
   * `SelectorDestinoItem` prohíbe preseleccionar. Heredar mal sería
   * exactamente eso. **La salida: no se hereda una respuesta que nadie dio
   * — se deja de REPETIR la pregunta.** Nada nace elegido; lo que cambia es
   * que la respuesta de la familia vale para la compra hasta que ella misma
   * decida repartirla. *La app sigue sin adivinar: pregunta una vez.*
   *
   * Y CUÁNDO NO SE PUEDE PREGUNTAR UNA SOLA VEZ — se DERIVA, no se decide:
   * si los productos no admiten las mismas mascotas (comida de perro + comida
   * de ave en el mismo carrito), una pregunta única mentiría, porque ninguna
   * respuesta sirve para los dos. Ahí el reparto no es una opción: es la
   * única forma honesta, y la pantalla se abre repartida sola.
   */
  const destinoComun = useMemo(
    () =>
      destinoComunDelCarrito(
        destinos,
        items.map((it) => it.especies_aplicables),
      ),
    [destinos, items],
  );

  /** Los ítems ya no coinciden en destino ⇒ la compra YA está repartida y la
   *  pantalla lo refleja. No es un modo que alguien prendió: es un hecho. */
  const yaRepartido = useMemo(() => {
    const clave = (d: typeof items[number]['destino']) =>
      d === null ? 'null' : d.tipo === 'donacion' ? 'donacion' : d.mascotaId;
    return new Set(items.map((it) => clave(it.destino))).size > 1;
  }, [items]);

  const [repartirPedido, setRepartirPedido] = useState(false);
  const repartir = repartirPedido || yaRepartido || destinoComun === null;

  /** G-09 · el detalle de la donación salió del bloque y vive detrás de la «i».
   *  La Hoja la monta la PANTALLA, no el selector: *un selector que además abre
   *  modales empieza a conocer la navegación de su pantalla* (B). */
  const [hojaDonacion, setHojaDonacion] = useState(false);

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
        /* 🔴 H-105 · EL PIE RESERVA SU PROPIO LUGAR (pieza de B, S100b).
           ☠️ Acá vivía `paddingBottom: insets.bottom + spacing[8] + 120`. Ese
           120 era una ESTIMACIÓN del alto del pie, y B lo midió en el aparato:
           el aviso del total quedaba **9.6 dp debajo del CTA**, inalcanzable.
           La cura no fue elegir mejor el número: es que ya no hay número. El
           pie se mide a sí mismo y esa misma medida reserva el scroll — dos
           cuentas que debían coincidir pasaron a ser una.
           Y el `insets.bottom` también se fue: vive adentro de la pieza (Ley 8,
           precedente `Hoja` S65). */
        <PantallaConPie
          contentContainerStyle={{ paddingTop: spacing[4], gap: spacing[5] }}
          pie={
            <Boton
              etiqueta={t('despensa.continuar')}
              bloque
              onPress={() => router.push('/despensa/checkout')}
            />
          }
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
                  {/* 🔴 G-08 · EL MENOS EN 1 ES LA PAPELERA, y el botón «Quitar»
                      MURIÓ con él. Eran DOS controles para la misma intención:
                      stepper (144 dp) + un botón aparte (89.6 dp), medidos por B.
                      El estándar es de eBay `[SPEC]` y trae su matiz: *la
                      papelera solo se usa cuando el stepper está pegado a un
                      tile que va a desaparecer* — o sea ACÁ, en el carrito. En
                      la grilla no se pasa `onBorrar`: allá bajar de 1 devuelve
                      la tarjeta a su «+», el producto sigue existiendo, y una
                      papelera prometería un borrado que no ocurre.
                      Y el menos en 1 BORRA, no se deshabilita: *«I tried minus
                      because I thought you could get it down to zero»*. Sin
                      diálogo de confirmación — acción inmediata. */}
                  <StepperCantidad
                    valor={item.cantidad}
                    min={1}
                    max={99}
                    onCambio={(n) => fijarCantidad(item.oferta_id, n)}
                    onBorrar={() => quitarDelCarrito(item.oferta_id)}
                    etiqueta={t('despensa.cantidadDe', { nombre: item.nombre })}
                  />
                </View>

                {/* EL DESTINO (§6.3) — la firma. null es legal y se ata después.
                    Con las mascotas en error NO se finge una familia vacía:
                    se dice, y el destino se puede atar después (§4).
                    G-10: por ÍTEM solo cuando la compra va repartida; si no,
                    la pregunta vive una sola vez debajo de la lista. */}
                {repartir ? (
                  <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
                    {mascotas === 'error' ? (
                      <Texto variante="apoyo" color="warning">
                        {t('despensa.errorMascotasDestino')}
                      </Texto>
                    ) : null}
                    <SelectorDestinoItem
                      mascotas={destinosPara(item)}
                      destino={item.destino}
                      onCambiar={(d) => fijarDestino(item.oferta_id, d)}
                      rotulo={t('despensa.paraQuien')}
                      etiquetaDonacion={t('despensa.donarEste')}
                      detalleDonacion={t('despensa.donacionDetalle')}
                      onExplicarDonacion={() => setHojaDonacion(true)}
                    />
                  </View>
                ) : null}

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

            {/* 🔴 G-10 · LA PREGUNTA ÚNICA. Vive acá abajo —una sola vez para
                toda la compra— y NO nace contestada: `destino` sale del primer
                ítem, que arranca en `null`. Al elegir, la respuesta se aplica a
                todos los ítems; §4 se cumple porque quien decide es la familia,
                una vez, en vez de N veces la misma cosa. */}
            {!repartir && destinoComun !== null ? (
              <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
                {mascotas === 'error' ? (
                  <Texto variante="apoyo" color="warning">
                    {t('despensa.errorMascotasDestino')}
                  </Texto>
                ) : null}
                <SelectorDestinoItem
                  mascotas={destinoComun}
                  destino={items[0].destino}
                  onCambiar={(d) => {
                    for (const it of items) fijarDestino(it.oferta_id, d);
                  }}
                  rotulo={t('despensa.paraQuien')}
                  etiquetaDonacion={t('despensa.donarEste')}
                  detalleDonacion={t('despensa.donacionDetalle')}
                  onExplicarDonacion={() => setHojaDonacion(true)}
                />
                {/* El reparto SE OFRECE solo cuando hay algo que repartir.
                    Con un producto la opción no existe: ofrecer «repartir» un
                    solo ítem es un control que no puede hacer nada.
                    EJECUTA (no navega) ⇒ label sin chevron: `ghost`. Ley 19.7
                    — el contorno transparente murió como acción de fila; el
                    único sólido de esta pantalla es «Continuar». */}
                {items.length > 1 ? (
                  <Boton
                    variante="ghost"
                    etiqueta={t('despensa.repartirEntreMascotas')}
                    onPress={() => setRepartirPedido(true)}
                  />
                ) : null}
              </View>
            ) : null}

            {/* La honestidad del total: lo dice el motor, no esta pantalla. */}
            <View style={{ paddingHorizontal: spacing[5] }}>
              <Texto variante="apoyo">{t('despensa.totalLoDiceElMotor')}</Texto>
            </View>
        </PantallaConPie>
      )}

      {/* G-09 · LO QUE LA «i» ABRE. El texto es el MISMO de siempre y no se
          recortó al mudarlo: los dos límites de §6.4 —la donación jamás entra a
          un expediente y jamás otorga beneficio— son la letra, no un adorno.
          Cambia dónde se lee, no qué dice. */}
      <Hoja
        visible={hojaDonacion}
        onCerrar={() => setHojaDonacion(false)}
        titulo={t('despensa.donarEste')}
      >
        <View style={{ gap: spacing[3] }}>
          <Texto variante="cuerpo">{t('despensa.donacionDetalle')}</Texto>
          <Boton
            etiqueta={t('despensa.listoDatos')}
            bloque
            onPress={() => setHojaDonacion(false)}
          />
        </View>
      </Hoja>
    </View>
  );
}
