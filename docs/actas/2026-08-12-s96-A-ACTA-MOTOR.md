# ACTA S96 · PISTA A — EL MOTOR DEL RECORRIDO COMPLETO (12-ago-2026)

> **Qué es:** el acta de la fase 1 de la pista A de S96-EJECUCIÓN — el motor
> de las dos letras (`LETRA_PANEL_VENDEDOR_S96` + `LETRA_RECORRIDO_DESPENSA_S96`)
> construido, aplicado y juzgado. **Se escribe ANTES de pasar a conducción**,
> porque la pista A es la única que escribe `docs/` y lo que no queda acá no
> queda en ninguna parte (L-217).
>
> **Las cinco decisiones del arranque (founder, 12-ago):** ① la entrega la
> asigna el SELLER al despachar · ② el cargador se construye GRANDE · ③ el
> código de mostrador se muestra en Negocios y el vet lo escribe en su
> factura · ④ la partición C/D firmada como choque declarado · ⑤ «vamos
> hacia vos» a mano en v1. **Las cinco ejecutadas o respetadas acá.**

---

## 0 · Las precondiciones (§1 del prompt), medidas antes de migrar

| P | resultado |
|---|---|
| **P1** censo B0.5 | ✅ EXISTE: `docs/relevamientos/2026-08-11-s95-censo-de-comercio.md`. Cero tablas al lado de una que ya existía |
| **P2** los 137 huérfanos (D-749) | ✅ BORRADOS en S95 (firma founder). `pedidos` = **2 filas**, los E2E de S95-K (clave `__e2e_real_g4…`, `entregado`). **Firma founder posterior: SE MARCAN, no se borran** — ejecutado en la M10 |
| **P3** D-774→D-779 | ✅ tomados por SUS PROPIAS fichas (S96-DOCS). Correspondencia, no colisión |

## 1 · Las nueve migraciones — todas aplicadas (271 → 280, local = remoto), reversa escrita ANTES, cinturón por camino real, 76(g) declarada en cada una

| M | archivo | qué | cinturón (lo que probó) |
|---|---|---|---|
| M1 | `20260812120000_s96_b1_repartidor_y_maquina` | `repartidores` (rol sin herencia, escritura solo por función) · estado `hacia_destino` · actor `repartidor` en los DOS CHECKs (transiciones + historia) · `despachar_pedido` ASIGNA (decisión ①) + código 4 dígitos + snapshot del destino al envío · `esperando_courier` APAGADO (courier v2) · `marcar_en_camino_a_destino` · `marcar_entrega_fallida` · rama repartidor en `_mover_estado_pedido`; la puerta pública LO RECHAZA (`actor_repartidor_no_invocable`: entregar exige evidencia y un RPC genérico no puede exigirla) | rol idempotente por documento · repartidor ajeno rebota · despacho genera código y mueve a `en_reparto` · puerta pública rechaza al actor · extraño rebota · fallida exige motivo y NO deposita · **el reintento conserva envío y código** · residuo 0 |
| M2 | `…130000_s96_b2_entrega_con_evidencia_y_destino` | `entregar_pedido(pedido, código, foto)` v2 — el cuarto escalón lo marca quien está en la puerta · **`pedido_item_destinos` LATERAL** (no columna: un `mascota_id` legible en `pedido_items` era EL HILO de §7.4 — el vendedor lee items para empacar) · destino validado AL COMPRAR con **`_user_es_familia_de_mascota`** (no `user_tiene_acceso…`, que incluye el acceso de PRESTADOR) · RETIRO encendido (caen `chk_retiro_apagado_v1` + gemelo de envios; el pago del retiro genera su código) · `atar_item_a_mascota` (la regla general de §4) · `_depositar_item_en_expediente` (una implementación, dos consumidores) · **cura del defecto de reserva por ítem (hallazgo ①)** | mascota ajena rebota al comprar · **el vendedor NO ve destinos (RLS con SET ROLE real)** · sin código no hay entrega · sin foto tampoco · deposita SOLO el ítem con mascota, procedencia `declarado_por_familia` · atar-después deposita en el acto · **`transacciones_puntos` sin moverse (la anti-fuente MEDIDA)** · residuo 0 (incl. restauración del `perfil_vigente` de la mascota real) |
| M3 | `…140000_s96_b3_cupo_ventana_fecha` | `recursos_reparto` (capacidad DEL RECURSO, patrón semanal regla 32) + `recurso_reparto_excepciones` (la excepción GANA en las dos direcciones) + `entrega_turnos` (cortes como DATO) + `cupo_reparto_del_dia` + `calcular_promesa_despensa` (turno siguiente al corte; el día lleno CORRE; fecha programada consume su día o rebota) + `cat_tipos_servicio_envio` (`urgente` modelado y APAGADO) + crear v3. ☠️ murió `calcular_promesa_entrega` (bodega — describía un courier). **Seeds que QUEDAN:** Moto de pruebas 20/día lun-sáb + turnos `manana` (corte 12:00 → 14-18 mismo día) y `tarde` (corte 23:59 → 09-13 siguiente) | capacidad = recurso confirmado (2) · 2 pedidos llenan el día y **el 3º corre al siguiente** · la excepción apaga la fecha programada · urgente rebota apagado · **sin recursos confirmados el despacho NO nace (L-139)** · residuo 0 |
| M4 | `…150000_s96_b4_foto_entrega_90_dias` | bucket privado `entregas` (5 MB, imágenes) · policies = §9.4 LITERAL (vendedor + equipo + el asignado que subió; **la familia NO está en la lista**) · borrado a 90 días **heredando la cola de D-731** (`encolar_fotos_entrega_vencidas` + cron `purgar-fotos-entrega` 08:30 UTC diario) · `foto_entrega_borrada_en` (P23: la purga se declara) | encola UNA vez · el envío declara su purga · bucket privado con techo · cron programado · residuo 0 |
| M5 | `…160000_s96_b7_direcciones` | `places_id` + `instrucciones_entrega` (≤280) + **punto obligatorio** (`chk_direccion_con_punto` NOT VALID — las 2 filas pre-letra no se inventan) + `uq_direccion_principal` | la fila sin punto rebota por el CHECK; las vivas siguen legales |
| M6 | `…170000_s96_b8_mostrador_y_reclamo` | `ventas_mostrador` + items · `registrar_venta_mostrador` (contra NADIE; código de 8 en alfabeto sin ambiguos; **en este archivo no hay búsqueda de personas y el juez lo vigila**) · `reclamar_compra_mostrador` (expiración perezosa, patrón hold S54) · **el ledger gana `venta_directa`** (hallazgo ②) · `evento_producto_asignacion.venta_mostrador_item_id` (idempotencia del depósito) | nace contra nadie y SIN evento · código inventado rebota · el reclamo ata y deposita con procedencia de familia · doble reclamo rebota · loyalty quieto · residuo 0 (stock compensado por la puerta, L-231) |
| M7 | `…180000_s96_b9_recurrencia` | `pedidos_recurrencias` (interruptor · frecuencia XOR día del mes · `aviso_dias` 2-3) · `configurar_recurrencia` / `alternar_recurrencia` · `avisar_recurrencias_proximas` (cron diario, tipo `pedido_recurrente` que YA existía) · **`ejecutar_recurrencias_vencidas` = esqueleto que rebota `pasarela_no_afiliada` y no crea NADA** (D-778: sin pasarela el medio de pago "falla" siempre, y la condición ③ de la letra dice qué hacer — se avisa y se espera) | una sola cadencia entra · el aviso nace UNA vez y respeta el interruptor · apagada NO avisa · **el ejecutor crea 0 pedidos** · residuo 0 |
| M8 | `…190000_s96_b10_cinco_avisos` | 5 tipos nuevos al vocabulario cerrado (`pedido_confirmado/_en_camino/_hacia_destino/_entregado/_entrega_fallida`, categoría `operacion`, EN VIVO) + trigger AFTER INSERT sobre `pedido_estados` (el sedimento ES la señal) · dedup por FILA de la historia (el re-despacho tras fallida avisa de nuevo — para la familia ES una novedad) · si registrar falla: WARNING, jamás aborta la transición (declarado: el motor de avisos no manda sobre el de pedidos) | nacen los 4 del camino feliz · **NADA por creado/picking/empacado** · la carga sin código ni mascota (ley de la pantalla bloqueada) · residuo 0 |
| M9 | `…200000_s96_b6_fotos_producto` | `adjuntar_fotos_producto` — compañera chica en vez de reescribir `proponer_sku_vendedor` (200 líneas). **Decide la forma de `imagenes` (D-767): array de strings, la primera es la portada; `imagen_url` se materializa con ella** para que ningún lector cambie | portada + galería · array vacío rebota hablado · el producto real restaurado exacto |

**Reversas:** `scripts/s96/2026-08-12-s96-m{1..9}-REVERSA.sql` — cada una
declara QUÉ NO deshace (la historia append-only jamás; los CHECK que rebotan
ante datos reales rebotan A PROPÓSITO). Los cuerpos pre-migración capturados
del objeto vivo: `functiondef-pre-m2/m3/m6/m9.sql`.

## 2 · La capa de wrappers (`packages/api`) — typecheck verde en api, cliente y prestador

- **`despensa-repartidor.ts` NUEVO** — la pantalla mínima de §9: `misEntregasAsignadas` (lee UNA tabla; cero mascota, cero pedidos) · `marcarEnCaminoADestino` · `subirFotoEntrega` · `entregarConEvidencia` · `marcarEntregaFallida`.
- **`despensa-vendedor.ts`** — `despacharPedido` (☠️ murió `marcarPedidoDespachado` con `esperando_courier`; **cero consumidores medidos por grep**) · `entregarRetiroEnMostrador` · repartidores CRUD · recursos/turnos/excepciones/cupo · `registrarVentaMostrador` · **`ajustarStockVendedor`** — el hueco que su propio comentario declaraba: la función existía desde S95-G2 y el comentario quedó viejo el mismo día que se escribió.
- **`despensa-pedido.ts`** — destino por ítem (`mascota_id`/`donacion`) · `metodo_entrega`/`fecha_programada`/`servicio_envio` · `calcularPromesaDespensa` (☠️ murió la de bodega) · `obtenerCodigoEntrega` · `atarItemAMascota` · `reclamarCompraMostrador` · `configurarRecurrencia`/`alternarRecurrencia`.
- **`_despensa-comun.ts`** — 45 códigos de error nuevos, cada uno con su voz.
- Tipos regenerados (+693 y +8 tras M9).

## 3 · El cargador EN GRANDE (decisión ②) — `tools/carga-catalogo/cargar.mjs`

CSV **o JSON** (mismo camino de validación) · columna `fotos` (la primera es
la portada, vía `adjuntar_fotos_producto`) · **TANDAS de 20 filas por viaje**
(VALUES + LATERAL sobre las MISMAS funciones de la puerta — la tanda no es un
atajo) con reintento fila-por-fila para aislar a la culpable · idempotente ·
ensayo por defecto. **Probado con APLICAR REAL:** fixture creado (sku +
oferta + 1 foto) → segunda corrida `actualizado` → deshecho por id, residuo
0, catálogo vivo intacto en 6. Hallazgo del ensayo: **un subquery del
statement no ve las filas que la función volátil acaba de insertar** (snapshot
de sentencia) — el `producto_id` se lee del RETORNO de `proponer`, jamás de
un subquery.

## 4 · El juez — `scripts/s96/juez-s96.mjs`: **39 VERDES · 1 ROJO heredado**

Hereda los 28 de S95 con **tres enmiendas, cada una con su letra fuente**
(inv. 13: el depósito gana las dos puertas de la letra — reclamo y atadura —
con lista CERRADA de escritores y callers, y la fallida jamás escribe ·
inv. 15: el actor `repartidor` · inv. 17: las funciones nuevas) + **12
invariantes nuevos (29-40)**, uno por regla dura de las dos letras, por
estructura. El juez de S95 queda INTACTO como registro.

**El rojo:** inv. 10 — `seller_perfil` y `resenas_productos` siguen vivas,
bloqueadas por `v_pitch_metrics`/`v_resenas_todas` (D-760, otro frente). Es
el mismo rojo declarado de S95: el pendiente, no un defecto del test.

**L-170 cobró DOS veces en el juez nuevo:** los invariantes 13 y 39 salieron
ROJOS leyendo mis COMENTARIOS como código (la función nombra la tabla para
decir que NO la toca). Se corrigió EL INSTRUMENTO — medir `INSERT INTO` y la
llamada con paréntesis — jamás el test. *Un rojo por la razón equivocada está
tan roto como un verde por la razón equivocada.*

## 5 · Los hallazgos (lo que se midió y nadie esperaba)

1. **🔴 Defecto real de S95, curado en M2:** `inventario_reservas` tiene
   `UNIQUE(pedido_id, sku_id)` y `reservar_stock_pedido` insertaba POR ÍTEM —
   un carrito con dos líneas de la misma oferta **rebotaba como `sin_stock`
   habiendo stock de sobra** (el UNIQUE violado se traducía al código
   equivocado). Y el consumo al entregar, en espejo, sub-registraba el
   ledger. Los dos agrupan por SKU ahora. **Lo cazó el cinturón de M2, no
   una lectura.**
2. **🔴 El `consumo` directo consumía reservas AJENAS:** el trigger
   materializador descuenta `consumo` de lo RESERVADO; la venta de mostrador
   no tiene reserva y se estaba llevando la de otro pedido. Nació el tipo
   **`venta_directa`** (descuenta del disponible) en CHECKs y trigger.
   **También lo cazó el cinturón.**
3. **`db push` corre como `cli_login_postgres` con `SET ROLE postgres`** ⇒
   ni `RESET ROLE` ni `session_user` restauran el rol tras una sonda RLS —
   los dos caen al rol del CLI, que no tiene EXECUTE sobre el motor. **La
   vuelta se hace contra el `current_user` capturado al inicio del fixture.**
   Costó tres corridas diagnosticarlo; queda escrito en la M2. ⚠️ Avisar a
   toda pista que sondee RLS dentro de una migración.
4. **El primer sujeto del test §7.4 era inválido:** el primer
   `familia_miembro` de la base es EL MISMO user del vendedor de pruebas —
   el test medía a un comprador mirando su propia compra. El fixture elige
   comprador ≠ vendedor y la mascota ajena POR EL MISMO PREDICADO que la
   función usa.
5. **⚠️ SIN CURAR → D-780:** `proponer_sku_vendedor` (S95-F) hace
   `stock_disponible = EXCLUDED.stock_disponible` en su ON CONFLICT —
   re-correr el cargador con columna `stock` sobre catálogo con ventas
   reales PISA el saldo materializado sin pasar por el ledger. Hoy
   inofensivo (carga inicial); con ventas vivas es un descuadre. Ficha en
   `DEUDAS_CANONICAS.md`.

## 6 · Las decisiones técnicas de esta pista, declaradas (regla 67)

- **`pedido_item_destinos` como tabla lateral** (no columna): la RLS del
  destino es del DUEÑO y el vendedor no tiene brazo — la privacidad de §7.4
  por estructura, no por disciplina.
- **El predicado del destino es LA FAMILIA** (`_user_es_familia_de_mascota`),
  jamás `user_tiene_acceso_a_mascota` (incluye prestadores y no mira
  `familia_miembro`).
- **Código de entrega: 4 dígitos** (se dice de viva voz en una puerta, una
  vez). **Código de mostrador: 8 caracteres sin ambiguos, ~40 bits** (viaja
  impreso en una factura). Expiración 90 días → **firmada por el founder
  COMO PARÁMETRO** (M10).
- **"Confirmado para el día" = patrón semanal + excepciones** (como la
  jornada del prestador): confirmar recurso por recurso cada día habría
  dejado el cupo muerto al primer olvido — L-139 en la otra dirección.
- **Sin turnos o sin recursos confirmados, el pedido de despacho NO nace.**
  Prometer sin corte ni capacidad es el dato plausible-falso.
- **`adjuntar_fotos_producto` como compañera** de `proponer` en vez de
  reescribirla: menos riesgo de transcripción sobre la puerta del catálogo.
- **Si el aviso falla, la transición NO aborta** (WARNING declarado): el
  motor de avisos no manda sobre el motor de pedidos.

## 7 · Contrato y territorio

**`docs/contratos/s96-contrato-motor.md` PUBLICADO — firmas CONGELADAS.**
B, C y D arrancan sobre él.

Territorio tocado (solo el propio): `supabase/migrations` (9) ·
`scripts/s96/` (juez 1.262 líneas + 9 reversas + 4 capturas) ·
`packages/api` (+~1.400/−112 con tipos) · `tools/carga-catalogo`
(+151/−32) · `docs/` (letras S96-DOCS + contrato + esta acta). **Cero
toques a `packages/ui`, `apps/` ni a los docs vedados.**

## 8 · Pendiente al cierre de la fase 1

- ✅ ~~Los 2 pedidos E2E de S95-K~~ → firmado SE MARCAN (M10).
- ✅ ~~Expiración del código de mostrador~~ → firmada 90 días COMO PARÁMETRO (M10).
- ✅ ~~Hallazgo 5~~ → ficha **D-780**.
- **D-776 no muere todavía:** el mecanismo existe (cola D-731 + cron); muere
  cuando el PRIMER barrido real corra y se mida.
- **El rojo heredado del juez** (inv. 10) espera a D-760 (otro frente).
- **El gate en dispositivo** de todo lo de esta tanda es del founder o
  Karina, desde `e-PetPlace Negocios` — esta pista no lo declara.

## Historial

- **v1.0 (12-ago-2026):** depositada al cerrar la fase 1 (motor), antes de
  pasar a conducción. Escrita por la pista A — la única que escribe `docs/`.
