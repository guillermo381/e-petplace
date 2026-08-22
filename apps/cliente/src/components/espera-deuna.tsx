/**
 * S103-C · **LA ESPERA DE DEUNA** — el código de 6 dígitos.
 * `LETRA_DEUNA` §5 (firma ① del founder) y la tabla de estados de §6.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ NO ES UNA PANTALLA NUEVA. Es el CUERPO de la fase `confirmando` que  │
 * │ ya existe en las dos puertas.                                        │
 * │                                                                      │
 * │ §6, firma ② del founder: *«funciona exactamente igual que si fuera   │
 * │ tarjeta»* — misma pantalla, misma salida, misma transición sola a    │
 * │ pagada. **Lo único que cambia es el cuerpo.** *El cliente jamás      │
 * │ aprende un circuito distinto por cambiar de medio.*                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── 🔴 POR QUÉ EL RELOJ NO DICE «3 MINUTOS» EN NINGUNA PARTE ─────────────
 *
 * **Es la advertencia literal de la pista D, y evita que esta pantalla mienta
 * un tiempo que nadie iría a verificar.** `LETRA_DEUNA` §5 afirma *«3 minutos
 * FIJOS, no configurables (literal del proveedor)»* — **pero D midió que el
 * `payment/request` tiene un campo `expiredTime`, y es un número.** *Un campo
 * que se manda es, por definición, algo que se elige.* D no pudo resolver la
 * tensión (no puede crear la transacción que la probaría: falta el
 * `pointOfSale`), y la dejó declarada para que C no construyera encima.
 *
 * ⇒ **El vencimiento entra como INSTANTE del servidor (`venceEn`), jamás como
 *   duración de esta pantalla.** Si el proveedor da 3 minutos, muestra 3
 *   minutos; si da otro número, muestra el otro. **La pantalla no puede
 *   equivocarse porque no sabe la regla** — solo sabe leer un reloj.
 *   *Es el patrón que el hold del checkout de reserva ya usa (`expiraEn`), y
 *   deriva en vez de emparejar.*
 *
 * ✅ **LA MESA RESOLVIÓ LA TENSIÓN A FAVOR DE ESTO** (firma del founder,
 * 22-ago-2026): *«el vencimiento del código sigue leyéndose del servidor —
 * correcto, la letra se enmienda»*. **Este código no cambia: ya era la
 * conducta firmada.**
 *
 * ⚠️ **Y la distinción que hay que conservar, porque no es la misma cosa:
 * está FIRMADO, NO DEPOSITADO.** Medido contra `origin/main` el 22-ago:
 * `LETRA_DEUNA` sigue en **v1.1** y su §5 sigue diciendo *«3 minutos FIJOS,
 * no configurables»*. **El depósito es de A** (`docs/` es su territorio).
 * *Hasta que llegue, quien lea la letra va a encontrar la versión vieja — por
 * eso este comentario NO afirma que la letra ya dice otra cosa: dice qué se
 * firmó y qué falta. Una firma que vive solo en un parte no está firmada
 * (N11′), y un comentario que le atribuye a un documento algo que el
 * documento no dice es la otra mitad del mismo defecto.*
 *
 * ── LOS DOS RELOJES, QUE JAMÁS SE CONFUNDEN (§6) ─────────────────────────
 *
 * **Solo el del CÓDIGO se dibuja como reloj.** El del hold **no**: se dibuja
 * cuando muere, con su voz. *Dos cuentas regresivas en una pantalla de pago es
 * la forma más rápida de que la familia no sepa cuál la apura.*
 *
 * ── LA ANIMACIÓN, Y POR QUÉ ACÁ NO VA ────────────────────────────────────
 *
 * **`EsperaDeTrabajo` NO se monta mientras el código está vivo**, y es N15
 * (*el movimiento se calla donde hay apuro*): en tarjeta la familia **espera**;
 * acá la familia **tiene que hacer algo**. *Una rampa que dice «estamos
 * trabajando» mientras la persona teclea afirma algo falso — la que trabaja es
 * ella.* Lo que ocupa ese lugar es la cuenta regresiva, que es **información,
 * no adorno**. La rampa de la casa vuelve cuando el código se consumió y la
 * espera pasa a ser nuestra.
 *
 * ── VOZ DE MÁQUINA PARA LOS DÍGITOS ──────────────────────────────────────
 *
 * `LETRA_PUERTA_DE_PAGO_S101B` §8ter: *«voz de máquina para los dígitos, voz
 * de la casa para lo que le habla a la persona»*. El código va en la mono
 * tabular; todo lo demás, en la voz normal.
 *
 * ⚠️ **NO es `CampoCodigo`** — esa pieza existe para INGRESAR un código. Acá
 * el código **se muestra para copiarlo a otra app**. Por eso es
 * `seleccionable`: *un código de 6 dígitos que no se puede copiar obliga a
 * memorizarlo mientras se cambia de aplicación.*
 *
 * ═══ 🔴 ENCHUFE PENDIENTE CON NOMBRE ══════════════════════════════════════
 * **Esta pieza todavía NO tiene consumidor, y es deliberado.** `numericCode` y
 * su vencimiento salen de un `payment/request` exitoso, **bloqueado por el
 * `pointOfSale`** (dueño: el founder). *`PLAN_MESA_104` §1 ordena: «mientras no
 * exista, C trabaja contra el contrato de la letra y marca el enchufe como
 * pendiente con nombre».* **Se monta en la fase `confirmando` de las dos
 * puertas el día que D entregue su contrato — y es una condición, no una
 * pantalla nueva.**
 */

import { useCallback, useEffect, useState } from 'react';
import { Clipboard, Pressable, Text, View } from 'react-native';
import { Boton, Texto, spacing, typography, useAviso, useTheme } from '@epetplace/ui';

import type { EstadoDeUna } from '@/lib/pagos/deuna-estado';
import { useTraduccion } from '@/i18n';

export type EsperaDeUnaProps = {
  /** 🔴 El estado viene YA RESUELTO de la costura única
   *  (`lib/pagos/deuna-estado`). **La pantalla no sabe de dónde sale**, y ésa
   *  es exactamente la propiedad que hace que conectarla sea una línea. */
  estado: EstadoDeUna;
  /** Pide un código nuevo. Solo se ofrece mientras el hold viva (§5). */
  onGenerarNuevo: () => void;
  /** El camino a soporte del hallazgo — jamás una pantalla sin salida. */
  onSoporte: () => void;
};

function segundosHasta(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

export function EsperaDeUna({ estado, onGenerarNuevo, onSoporte }: EsperaDeUnaProps) {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const { mostrar } = useAviso();

  /**
   * 🔴 COPIAR — **sin dependencia nueva y por lo tanto sin build nativa.**
   *
   * `Clipboard` del core de React Native **sigue existiendo y funciona**
   * (medido: `node_modules/react-native/index.js:217`). Está **deprecado** —
   * su propio warning dice *«will be removed in a future release»*— y el
   * reemplazo tiene nombre: **`expo-clipboard`**.
   *
   * **Por qué NO se agrega `expo-clipboard` hoy:** es un módulo nativo, y
   * L-134 es literal — *módulo nativo nuevo = build nueva*. Eso volvería esta
   * pantalla **no gateable hoy** y no viajaría por OTA. *El precedente de la
   * casa es D-456, el micrófono: la pieza espera el tren que otra cosa
   * obligue, jamás pide un build para ella sola.*
   *
   * ☠️ **Condición de muerte:** la próxima build nativa se lleva
   * `expo-clipboard` y esta línea. **Disparo declarado, no descubierto.**
   *
   * **Copiar NO toca ningún reloj** (pedido del founder): no hay `setState`
   * de tiempo acá, así que ni la cuenta regresiva ni el hold se enteran.
   */
  const copiar = useCallback(() => {
    if (estado.fase !== 'esperando') return;
    Clipboard.setString(estado.codigo);
    mostrar({ texto: t('pago.deunaCopiado'), variante: 'exito' });
  }, [estado, mostrar, t]);

  /* Los relojes solo existen en `esperando`. En las otras fases se pasan
     instantes ya vencidos: **los hooks se llaman siempre, en el mismo orden**
     (regla de React), y el early-return vive DESPUÉS. */
  const enEspera = estado.fase === 'esperando';
  const venceEn = enEspera ? estado.venceEn : new Date(0).toISOString();
  const holdVenceEn = enEspera ? estado.holdVenceEn : new Date(0).toISOString();

  const [restanteCodigo, setRestanteCodigo] = useState(() => segundosHasta(venceEn));
  const [restanteHold, setRestanteHold] = useState(() => segundosHasta(holdVenceEn));

  /* Los dos relojes se leen del MISMO tick — si corrieran en dos intervalos
     podrían reportar estados incoherentes por un segundo, y ese segundo es
     justo el que decide si se ofrece «generar otro». */
  useEffect(() => {
    const timer = setInterval(() => {
      setRestanteCodigo(segundosHasta(venceEn));
      setRestanteHold(segundosHasta(holdVenceEn));
    }, 1000);
    return () => clearInterval(timer);
  }, [venceEn, holdVenceEn]);

  const mm = String(Math.floor(restanteCodigo / 60)).padStart(2, '0');
  const ss = String(restanteCodigo % 60).padStart(2, '0');

  /* ── APROBADA (§6: `APPROVED` / webhook verificado) ──────────────────────
     La voz del éxito. **Esta pantalla NO la declara por su cuenta**: llega
     porque la costura leyó verdad verificada del servidor. *La pantalla pasa
     sola a pagada, jamás decide que lo está* (§3.4). */
  if (estado.fase === 'aprobada') {
    return (
      <View style={{ gap: spacing[3], alignItems: 'center' }}>
        <Texto variante="titulo">{t('pago.deunaAprobada')}</Texto>
        <Texto variante="cuerpo">{t('pago.deunaAprobadaCuerpo')}</Texto>
      </View>
    );
  }

  /* ── HALLAZGO (§6: `NOT_FOUND` en ventana · `REVERSED_FAILED`) ───────────
     🔴 *«Hallazgo con nombre — jamás voz de éxito ni silencio»*, y
     `REVERSED_FAILED` **jamás se resuelve solo**.

     **El nombre técnico NO se le muestra a la familia**: `nombre` es para el
     registro y para soporte. *A la persona se le dice que el problema es
     nuestro y se le da el camino — decirle «huerfano_deuna_vencido» sería
     mostrarle nuestra taxonomía en vez de resolverle el problema.*

     Y **tiene salida**: es la misma regla que las tres compuertas de
     `LETRA_PUERTA_DE_PAGO_S101B` §3.1 que hablan hacia soporte. */
  if (estado.fase === 'hallazgo') {
    return (
      <View style={{ gap: spacing[3], alignItems: 'center' }}>
        <Texto variante="titulo">{t('pago.deunaHallazgo')}</Texto>
        <Texto variante="cuerpo">{t('pago.deunaHallazgoCuerpo')}</Texto>
        <Boton
          variante="secundario"
          etiqueta={t('cuenta.soporteBoton')}
          onPress={onSoporte}
        />
      </View>
    );
  }

  /* 🔴 EL HOLD MANDA SOBRE EL CÓDIGO. Muerto el hold no nacen más códigos
     (§5: «Hold muerto → no nacen más códigos, compuerta 1»), así que se
     evalúa PRIMERO: ofrecer «generar otro» sobre un hold vencido sería
     ofrecer lo que el servidor va a rechazar. */
  if (restanteHold === 0) {
    return (
      <View style={{ gap: spacing[3], alignItems: 'center' }}>
        <Texto variante="titulo">{t('pago.deunaCodigoVencido')}</Texto>
        <Texto variante="cuerpo">{t('pago.deunaHoldVencido')}</Texto>
      </View>
    );
  }

  if (restanteCodigo === 0) {
    return (
      <View style={{ gap: spacing[3], alignItems: 'center' }}>
        <Texto variante="titulo">{t('pago.deunaCodigoVencido')}</Texto>
        {/* 🔴 CENTRADO — pedido del founder (22-ago), y hacía falta el
            envoltorio: **`Boton` sin `bloque` fuerza `alignSelf:'flex-start'`
            en su PROPIO estilo** (`Boton.tsx:446`), que gana sobre el
            `alignItems:'center'` del padre. *Por eso quedaba pegado a la
            izquierda aunque su contenedor centrara.*
            El wrapper se centra a sí mismo y el botón conserva su ancho
            natural adentro — **sin `bloque`**, que lo estiraría de punta a
            punta y es otra cosa que la que se pidió. */}
        <View style={{ alignSelf: 'center' }}>
          <Boton
            variante="secundario"
            etiqueta={t('pago.deunaCodigoNuevo')}
            onPress={onGenerarNuevo}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing[4], alignItems: 'center' }}>
      <Texto variante="titulo">{t('pago.deunaEsperaTitulo')}</Texto>

      {/* EL CÓDIGO — voz de máquina, y copiable.
          🔴 Va en `Text` crudo y NO en `Texto`, **por el contrato de esa
          pieza**: `Texto` no expone `style` a propósito (controla su propia
          tipografía) y ninguna de sus variantes es «mono grande». *Es el mismo
          camino que la casa ya usa para el contador del hold en
          `checkout-reserva`: voz de máquina = `typography.family.mono` +
          `tabular-nums`, inline y declarado.*

          El `letterSpacing` es lo que lo vuelve legible de un vistazo al
          cambiar de app: seis dígitos pegados se leen como un número, y lo que
          la persona tiene que hacer es transcribirlos de a uno. */}
      {/* 🔴 EL CÓDIGO Y SU BOTÓN DE COPIAR VIVEN EN LA MISMA FILA
          (pedido del founder, 22-ago): *«el affordance vive junto al código,
          no debajo ni en el pie: el pulgar tiene que llegar sin buscar»*. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Text
          /* Sigue seleccionable a mano — **el botón se suma, no reemplaza**:
             copiar con el dedo es el camino que la persona ya conoce. */
          selectable
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size['3xl'],
            letterSpacing: 4,
            color: theme.text.primary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {estado.codigo}
        </Text>
        {/* 🔴 SIN CAJA — corrección de craft del founder (22-ago): *«la caja
            compite con el código, que es la única pieza que la pantalla vino
            a mostrar»*.

            **El pulgar necesita blanco; la vista no necesita caja** — por eso
            el área táctil se declara con `hitSlop` y no agrandando el dibujo:
            **48×48 efectivos** sobre un affordance visualmente mínimo.

            ⚠️ **PUENTE DECLARADO — esto todavía NO es lo que el founder pidió.**
            Pidió **el glifo de copiar** (dos hojas superpuestas, trazo, sin
            relleno). **Medido: ese glifo NO existe en el registry**, y los
            cercanos tienen su semántica ocupada y escrita — `documentos` es
            *«dónde viven los papeles»* (una carpeta) y `documento` es *«una
            cédula con retrato»*. **Reusar cualquiera sería un glifo con dos
            sentidos**, que es lo que la Ley 12 prohíbe.
            ⇒ **`packages/ui` es de B y el glifo se le PIDE, no se escribe**
            (orden del founder). Hasta que llegue, la palabra hace el trabajo
            **sin caja**: cumple *«sin caja ni borde, al lado del código»* y
            deja de competir. **Cuando el glifo exista, se cambia esta línea.**

            El toast **no mueve el layout**: es overlay de la casa (`useAviso`),
            no empuja al código. *Verificado en el aparato.* */}
        <Pressable
          onPress={copiar}
          accessibilityRole="button"
          accessibilityLabel={t('pago.deunaCopiarA11y')}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Texto variante="apoyo">{t('pago.deunaCopiar')}</Texto>
        </Pressable>
      </View>

      <Texto variante="cuerpo">{t('pago.deunaEsperaCuerpo')}</Texto>

      {/* El reloj del código — voz de máquina, tono secundario: acompaña, no
          preside. *El protagonista de esta pantalla es el código.* */}
      <Texto variante="apoyo">
        {t('pago.deunaCodigoVence', { tiempo: `${mm}:${ss}` })}
      </Texto>
    </View>
  );
}
