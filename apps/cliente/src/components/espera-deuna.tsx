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
 * el código **se muestra para copiarlo a otra app**, y sigue `seleccionable`
 * a mano: **`BotonCopiar` se suma, no reemplaza** el camino que la persona ya
 * conoce.
 *
 * ── ⚠️ COPIAR DEPENDE DE UNA BUILD, Y SE DECLARA ─────────────────────────
 * `BotonCopiar` (S103-B) usa **`expo-clipboard`, que es NATIVO y NO viaja por
 * OTA** (L-134). **Medido el 22-ago:** el JS resuelve (pnpm lo instaló), pero
 * el binario del aparato es **1.0.4 y no lo trae** ⇒ la llamada falla y la
 * pieza cae en **su segunda degradación**: se apaga y **no vuelve a
 * prometer**. *Eso es la conducta correcta, no un defecto — un botón
 * habilitado cuyo toque no hace nada es peor que uno apagado.*
 * ⇒ **La función de copiar llega con la próxima build nativa.** Hasta
 *   entonces el código **se copia a mano**, que es para lo que sigue siendo
 *   `seleccionable`.
 *
 * 🔒 **GATE DIFERIDO CON DISPARO EXPLÍCITO** (dictamen del founder, 22-ago):
 * el **pegado real con la pieza de B** se verifica en **la próxima build
 * nativa**. **No se simula y no se cuenta como verde.** *Lo que sí quedó
 * probado hoy, y conviene no confundirlo: que la pieza **nace apagada** de
 * verdad —cero píxeles cambiaron al tocarla— y que **el pegado real
 * funciona**, medido esta mañana con el `Clipboard` del core (`654321`, con
 * discriminador contra el `123456` previo). **Lo que falta no es «si se puede
 * copiar»: es «si copia la pieza».***
 *
 * ── 📐 EL ANCHO DE LA FILA — medido de dos capturas reales, no estimado ───
 *
 * Con **«Copiar código»** el botón es más ancho y **el código se comprime
 * hacia la izquierda, pero ENTRA**: los seis dígitos se dibujan completos en
 * la misma fila, sin truncar ni envolver. Comparado contra **«Copiar»**, el
 * código gana ~60 px de caja.
 *
 * ⇒ **Entra, y el founder tiene el dato para decidir si el costo le gusta**
 * (`scripts/capturas/s103-c-deuna-copiar-codigo.png` vs `…-copiar-corto.png`).
 * *Se declara en vez de resolverse acá: la letra dijo «si el ancho no entra,
 * declaralo» — entra, y aun así el trade-off es visible y es de mesa.*
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
import { Boton, BotonCopiar, Texto, spacing, typography, useTheme } from '@epetplace/ui';

import { vozDeFallo, type EstadoDeUna } from '@/lib/pagos/deuna-estado';
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

  /* Los relojes solo existen en `esperando`. En las otras fases se pasan
     instantes ya vencidos: **los hooks se llaman siempre, en el mismo orden**
     (regla de React), y el early-return vive DESPUÉS. */
  const enEspera = estado.fase === 'esperando';
  const venceEn = enEspera ? estado.venceEn : new Date(0).toISOString();
  /* 🔴 `null` = **no sabemos cuándo vence el hold**, y es el caso REAL hoy:
     el contrato de la puerta (§3) dice que el hold lo declara el SUJETO, no
     el wrapper de DeUna. *Rellenarlo con el reloj del código mezclaría los
     dos relojes — la pantalla ofrecería «generá otro código» cuando lo que
     venció fue la reserva, y el código nuevo tampoco serviría.* */
  const holdVenceEn = enEspera ? estado.holdVenceEn : new Date(0).toISOString();

  const [restanteCodigo, setRestanteCodigo] = useState(() => segundosHasta(venceEn));
  const [restanteHold, setRestanteHold] = useState<number | null>(() =>
    holdVenceEn === null ? null : segundosHasta(holdVenceEn),
  );

  /* Los dos relojes se leen del MISMO tick — si corrieran en dos intervalos
     podrían reportar estados incoherentes por un segundo, y ese segundo es
     justo el que decide si se ofrece «generar otro». */
  useEffect(() => {
    const timer = setInterval(() => {
      setRestanteCodigo(segundosHasta(venceEn));
      setRestanteHold(holdVenceEn === null ? null : segundosHasta(holdVenceEn));
    }, 1000);
    return () => clearInterval(timer);
  }, [venceEn, holdVenceEn]);

  const mm = String(Math.floor(restanteCodigo / 60)).padStart(2, '0');
  const ss = String(restanteCodigo % 60).padStart(2, '0');

  /* ── CARGANDO — todavía no pedimos el código, o está en vuelo.
     Sin voz de error y sin código inventado: *una pantalla de pago que
     muestra un hueco donde va el código se lee como defecto del proveedor.* */
  if (estado.fase === 'cargando') {
    return (
      <View style={{ gap: spacing[3], alignItems: 'center' }}>
        <Texto variante="cuerpo">{t('pago.deunaPidiendoCodigo')}</Texto>
      </View>
    );
  }

  /* ── FALLO · LAS CINCO FAMILIAS (`CONTRATO_WRAPPER_DEUNA` §4) ────────────
     🔴 **La familia decide la voz, y confundir dos manda a la persona al
     lugar equivocado.** Las tres que no se pueden «mejorar»:

     ① **`compuerta` NO dice «no se pudo procesar el pago»** — llega con la
        causa real **y el proveedor nunca se enteró**: es la letra madre de
        §7, *primero se verifica que se pueda entregar, después se pide la
        plata*. **Decir que el pago falló ahí sería mentir: nunca se
        intentó**, y mandaría a soporte por algo que se resuelve rearmando.

     ② **`red` NO ES UN RECHAZO** ⇒ botón de REINTENTAR, jamás soporte. Y
        `sesion_no_verificable` **jamás dice «cerrá sesión»**: es un 503 de
        auth y la sesión probablemente esté bien.

     ③ **`ambiguo` NO SE AFINA.** «No existe o es de otro» dan la misma
        respuesta A PROPÓSITO — *distinguirlas convertiría la puerta en un
        oráculo de compras ajenas.*

     Y `nuestro` **no ofrece reintentar**: *pedirle que reintente algo que no
     va a cambiar es hacerle perder el tiempo con cara de ayuda.* */
  if (estado.fase === 'fallo') {
    /* 🔴 LA VOZ SALE DE LA COSTURA (`vozDeFallo`), NO DE ACÁ. La pantalla
       DIBUJA; **elegir qué se dice según la familia es lógica**, y vive donde
       un instrumento puede medirla sin reimplementarla. */
    const voz = vozDeFallo(estado.codigo);
    return (
      <View style={{ gap: spacing[3], alignItems: 'center' }}>
        <Texto variante="titulo">{t(voz.titulo)}</Texto>
        <Texto variante="cuerpo">{t(voz.cuerpo)}</Texto>
        <Boton
          variante="secundario"
          etiqueta={t(
            voz.accion === 'reintentar'
              ? 'pago.deunaReintentar'
              : voz.accion === 'volver'
                ? 'pago.deunaVolver'
                : 'cuenta.soporteBoton',
          )}
          /* 🔴 **`reintentar` vuelve a PEDIR EL CÓDIGO, no manda a soporte** —
             la red no es un rechazo. Las otras dos salen de la pantalla. */
          onPress={voz.accion === 'reintentar' ? onGenerarNuevo : onSoporte}
        />
      </View>
    );
  }

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
  /* 🔴 `null` NO entra acá, y es deliberado: **no saber cuándo vence el hold
     no es lo mismo que saber que venció.** Con `null` la pantalla sigue
     ofreciendo el código, que es lo único que sí conoce. *Tratar «no sé» como
     «venció» mandaría a rearmar una reserva que probablemente esté viva.* */
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
        {/* ✅ LA PIEZA DE B, ENCHUFADA — `BotonCopiar` (S103-B).
            ☠️ Murieron acá: el `Pressable` con label de texto, el `Clipboard`
            del core de RN y el `useAviso`. **Los tres los reemplaza el
            contrato**, y dos de ellos porque él los prohíbe:

            · **La confirmación es el propio botón, NO un toast** — desvío que
              B declara y que esta pantalla es la razón de que exista: *«un
              toast aparece SOBRE el contenido, y el contenido de esta pantalla
              ES el código que la persona está mirando mientras copia»*.
              *Mi `useAviso` hacía exactamente eso: tapaba el código en el
              único momento en que se lo está leyendo.*
            · **El módulo nativo lo carga la pieza**, con sus dos degradaciones.

            **`variante="secundario"` y NO el default `compacto`**, y no es
            gusto: `compacto` es **variante JUBILADA** y `R47` la vigila
            solo-baja (38 hoy, baseline 39). *Montar el default habría subido
            el contador y puesto en rojo a un juez de la casa.* → reportado a B.

            **`glifo`: encendido, con el argumento CORREGIDO por el founder.**
            B lo dejó opt-in porque *«un botón de copiar solo al pie de un
            código no tiene hermanos de los que distinguirse»* — **y eso sigue
            siendo cierto: acá el glifo NO distingue de vecinos.** Lo que el
            founder agregó es otra razón, que la regla de B no contemplaba:
            **es reconocible sin leer, con el reloj corriendo.**
            *La vecindad no es el único motivo por el que un glifo gana su
            lugar; la prisa también.* ⇒ **no es una excepción a su ley: es un
            caso que su ley no cubría**, y por eso su prop —que delega en la
            pantalla— fue el mecanismo correcto.

            **La etiqueta visible ES el nombre accesible** (contrato de B), y
            por eso murió `deunaCopiarA11y`. **Dictamen del founder: la visible
            dice el objeto** — *«la salida no es romper la pieza: es que la
            visible diga el objeto, así dice lo mismo para quien ve y para
            quien escucha»*. **Una sola cadena, los dos canales, sin costo.**

            **`vencido` es defensa en profundidad:** en esta rama el reloj
            siempre es > 0 (si no, el early-return de arriba ya se llevó el
            código). *Se pasa igual para que la intención esté escrita y no
            dependa del orden de dos ramas.* */}
        <BotonCopiar
          valor={estado.codigo}
          etiqueta={t('pago.deunaCopiar')}
          etiquetaCopiado={t('pago.deunaCopiado')}
          vencido={restanteCodigo === 0}
          razonVencido={t('pago.deunaCodigoVencido')}
          glifo
          variante="secundario"
        />
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
