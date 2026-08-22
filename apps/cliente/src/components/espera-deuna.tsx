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

import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Boton, Texto, spacing, typography, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export type EsperaDeUnaProps = {
  /** Los 6 dígitos, tal como los devolvió el proveedor. */
  codigo: string;
  /** 🔴 INSTANTE ISO del vencimiento **del código**, del servidor. */
  venceEn: string;
  /** INSTANTE ISO del vencimiento **del hold del sujeto** (stock o agenda). */
  holdVenceEn: string;
  /** Pide un código nuevo. Solo se ofrece mientras el hold viva (§5). */
  onGenerarNuevo: () => void;
};

function segundosHasta(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

export function EsperaDeUna({
  codigo, venceEn, holdVenceEn, onGenerarNuevo,
}: EsperaDeUnaProps) {
  const { t } = useTraduccion();
  const { theme } = useTheme();

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
        <Boton
          variante="secundario"
          etiqueta={t('pago.deunaCodigoNuevo')}
          onPress={onGenerarNuevo}
        />
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
      <Text
        selectable
        style={{
          fontFamily: typography.family.mono.regular,
          fontSize: typography.size['3xl'],
          letterSpacing: 4,
          color: theme.text.primary,
          fontVariant: ['tabular-nums'],
        }}
      >
        {codigo}
      </Text>

      <Texto variante="cuerpo">{t('pago.deunaEsperaCuerpo')}</Texto>

      {/* El reloj del código — voz de máquina, tono secundario: acompaña, no
          preside. *El protagonista de esta pantalla es el código.* */}
      <Texto variante="apoyo">
        {t('pago.deunaCodigoVence', { tiempo: `${mm}:${ss}` })}
      </Texto>
    </View>
  );
}
