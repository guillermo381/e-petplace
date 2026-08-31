/**
 * S101-B · FASE 5 · LA FILA DE UN MEDIO DE PAGO — **pieza compartida**.
 *
 * 🔴 EXISTE UNA SOLA VEZ A PROPÓSITO. La consumen **la lista de Cuenta** y **la
 *    selección del checkout**. *Dos implementaciones de la misma fila divergen
 *    el día que entre DeUna — que es justo lo que esta pantalla existe para
 *    evitar.*
 *
 * 🔴 SE LLAMA «MEDIO DE PAGO», NO «TARJETA», y no es vocabulario: es
 *    arquitectura. **DeUna entra como segundo riel sobre el mismo contrato de
 *    compra** cuando llegue su ambiente. *Si esta pieza se llama «tarjeta», el
 *    día que entre DeUna hay que escribir otra; si se llama «medio», DeUna es
 *    una fila más.*
 *
 * Qué muestra, por la letra §2 (el alias):
 *   · **el alias si existe** — lo escribió la familia para reconocerla;
 *   · **SIEMPRE marca + últimos 4** — *es lo que deja verificar que es la que
 *     uno cree*;
 *   · **el vencimiento cuando lo sabemos**, y **callado cuando no** — las
 *     tarjetas anteriores a Fase 5 no lo tienen y **no se puede recuperar**.
 *     *Inventarlo sería peor que no mostrarlo.*
 *
 * 🔴 Y JAMÁS el PAN: no existe columna, no viaja, no se dibuja.
 */

import { View } from 'react-native';
import { Celda, Chevron, Texto, spacing } from '@epetplace/ui';
import { LogoFranquicia } from '@/components/logo-franquicia';
import { fechaCortaMono } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';

/** Las marcas que el proveedor devuelve, en la voz que la familia reconoce. */
const VOZ_MARCA: Record<string, string> = {
  vi: 'Visa',
  mc: 'Mastercard',
  di: 'Diners',
  ax: 'American Express',
  dc: 'Discover',
};

export function nombreDeMarca(marca: string | null): string {
  if (!marca) return '';
  return VOZ_MARCA[marca.toLowerCase()] ?? marca.toUpperCase();
}

/**
 * 🔴 S107 · **LA FILA DEJÓ DE PEDIR UN TIPO Y PASA A PEDIR UNA FORMA.**
 *
 * ⏪ Antes exigía `TarjetaGuardada` — **la fila local**. Con `D-922` la lista de
 * Cuenta pasó a leer `TarjetaVerificada` (`card/list` como fuente), y ésa
 * **no es la misma fila**: su `id` puede ser `null` y trae `token`.
 *
 * 🔑 **Se pide lo que la fila DIBUJA, y nada más.** *Las dos formas satisfacen
 * esto sin castear y sin ensanchar ninguno de los dos tipos* — que era la otra
 * salida, y la mala: un tipo unión con campos opcionales dejaría a cada pantalla
 * creyendo que tiene datos que su fuente nunca le dio.
 *
 * ⚠️ **`expira*` es `number | null` en las dos, y `null` significa «no lo
 * sabemos», no «no vence».** Lo consume `vencida()`, que respeta la diferencia.
 */
export type MedioDibujable = {
  marca: string | null;
  ultimos4: string | null;
  alias: string | null;
  expiraMes: number | null;
  expiraAnio: number | null;
};

/**
 * ¿Ya venció? **Solo se puede responder si tenemos el dato.**
 * `null` significa *no lo sabemos*, y quien lo consume tiene que distinguirlo
 * de `false`. *Tratar «no sé» como «está bien» es cómo una tarjeta vencida se
 * cobra sin avisar.*
 */
export function vencida(t: MedioDibujable, ahora = new Date()): boolean | null {
  if (t.expiraMes === null || t.expiraAnio === null) return null;
  const finDeMes = new Date(t.expiraAnio, t.expiraMes, 1); // día 1 del mes siguiente
  return finDeMes.getTime() <= ahora.getTime();
}

export type FilaMedioDePagoProps = {
  tarjeta: MedioDibujable;
  /**
   * 🔴 S101-C · LA ZONA DERECHA DICE QUÉ HACE LA FILA, y por eso es una unión
   *    y no un boolean:
   *
   *    · `cambiar` — la fila de la ELEGIDA en el checkout: **«Cambiar ›»**.
   *      ☠️ Reemplaza a la etiqueta «Elegido» (orden del founder ③).
   *      *«Elegido» describía un estado que la fila ya mostraba sola —era una
   *      etiqueta contando lo obvio— y **escondía la única acción que ahí
   *      importa**: cambiarla. Un CTA invisible es un camino que no existe.*
   *
   *    · `camino` — cada medio DENTRO de la hoja: un **«›»**. *La fila tiene
   *      forma de camino porque lo es, y el día que entre DeUna es una fila
   *      más sin tocar nada.*
   *
   *    · `ninguna` — la lista de Cuenta, que trae su propia acción por `fin`.
   */
  zonaFin?: 'cambiar' | 'camino' | 'ninguna';
  onPress?: () => void;
  /** La acción de fila (borrar). La lista la trae; el checkout no. */
  fin?: React.ReactNode;
  /**
   * 🔴 EL DESEMPATE — **solo cuando esta fila sería idéntica a otra.**
   * Lo calcula quien tiene la lista (`desempatarMedios`), porque **una fila no
   * puede saber que tiene una gemela.** `null` en el caso normal.
   */
  desempate?: string | null;
};

/**
 * 🔴 **DOS ALTAS DE LA MISMA TARJETA PRODUCEN DOS FILAS IDÉNTICAS** — y la
 * clase es real, no un artefacto de los datos de prueba.
 *
 * **Medido por A (22-ago):** el único UNIQUE de `tarjetas_guardadas` es
 * `uq_tarjeta_token`, **sobre el token — que el proveedor genera fresco en
 * cada alta**. ⇒ **nada impide dar de alta dos veces la misma tarjeta**, y
 * cada alta trae token y `proveedor_uid` distintos.
 *
 * *El fixture del arnés de S101 —siete tarjetas de dos BINs de prueba— no es
 * la causa: es el que lo hizo visible. **El ensayo solo llegó primero.***
 *
 * ── POR QUÉ EL DESEMPATE ES LA FECHA, y por qué solo a veces ─────────────
 *
 * Lo que hay para distinguirlas: `alias` (una sola de siete lo tiene),
 * `expiraMes/Anio` (**solo lo sabemos de dos**, y en gemelas reales coincide),
 * y **`creadaEn`, que existe siempre y siempre difiere.**
 *
 * ⚠️ **Se muestra SOLO en las que colisionan.** *Poner «Agregada el…» en todas
 * las filas para cubrir un borde ensucia el caso normal —que es el 99 %— con
 * un dato que a nadie le importa cuando no hay ambigüedad.* **La regla de oro
 * de N1–N10 rige: quitá antes que agregar.**
 *
 * ⚠️ `creadaEn` es **`string | null`**: la tarjeta que sólo vive en el proveedor
 * no tiene fecha nuestra. *Sin fecha no hay desempate, y es lo correcto — no
 * inventamos cuándo la agregó acá alguien que nunca la agregó acá.*
 */
type MedioDesempatable = {
  marca: string | null;
  ultimos4: string | null;
  alias: string | null;
  creadaEn: string | null;
};

export function desempatarMedios<T extends MedioDesempatable>(
  medios: T[],
  /**
   * 🔴 S107 · **LA CLAVE LA PONE QUIEN LLAMA, y no es ceremonia.**
   *
   * Las dos pantallas identifican por cosas distintas: **el checkout por `id`**
   * (su fuente es nuestra tabla y siempre lo tiene) y **la lista de Cuenta por
   * `token`** (su fuente es `card/list`, donde el `id` puede ser `null`).
   *
   * ⚠️ *Con `id` fijo acá, dos tarjetas huérfanas colisionarían en la clave
   * `null` y el desempate le daría a una la fecha de la otra* — **justo en la
   * pantalla donde se borra, que es donde equivocarse cuesta.**
   *
   * Y por eso **no tiene default**: un default habría dejado el error posible y
   * silencioso. Así, el compilador obliga a decidirlo en cada llamada.
   */
  clave: (m: T) => string,
): Map<string, string | null> {
  /* La huella es lo que la fila DIBUJA — no la tarjeta real. *Dos tarjetas
     distintas que se dibujan igual también colisionan, y son el mismo problema
     para quien mira.* */
  const huella = (t: T) => `${t.alias ?? ''}|${t.marca ?? ''}|${t.ultimos4 ?? ''}`;
  const cuenta = new Map<string, number>();
  for (const t of medios) cuenta.set(huella(t), (cuenta.get(huella(t)) ?? 0) + 1);

  const salida = new Map<string, string | null>();
  for (const t of medios) {
    salida.set(clave(t), (cuenta.get(huella(t)) ?? 0) > 1 ? t.creadaEn : null);
  }
  return salida;
}

export function FilaMedioDePago({
  tarjeta, zonaFin = 'ninguna', onPress, fin, desempate = null,
}: FilaMedioDePagoProps) {
  const { t, idioma } = useTraduccion();
  const marca = nombreDeMarca(tarjeta.marca);
  const cuatro = tarjeta.ultimos4 ?? '';

  /* 🔴 EL TÍTULO ES EL ALIAS SI EXISTE. *Le pusiste «Visa de Kari» para
     reconocerla: mostrar «Visa ···· 1111» arriba y esconder tu nombre abajo
     sería devolverte el dato que vos diste como si fuera secundario.*
     Sin alias, el título es lo único que hay: marca + últimos cuatro. */
  const titulo = tarjeta.alias ?? [marca, cuatro && `···· ${cuatro}`].filter(Boolean).join(' ');

  /* El subtítulo SIEMPRE lleva marca + últimos 4 — también cuando hay alias,
     porque es lo que deja verificar que es la que uno cree. */
  const partes: string[] = [];
  if (tarjeta.alias) partes.push([marca, cuatro && `···· ${cuatro}`].filter(Boolean).join(' '));
  const yaVencio = vencida(tarjeta);
  if (tarjeta.expiraMes !== null && tarjeta.expiraAnio !== null) {
    const mm = String(tarjeta.expiraMes).padStart(2, '0');
    partes.push(
      yaVencio
        ? t('cuenta.medioVencidoEn', { fecha: `${mm}/${tarjeta.expiraAnio}` })
        : t('cuenta.medioVence', { fecha: `${mm}/${tarjeta.expiraAnio}` }),
    );
  }
  /* 🔴 EL DESEMPATE va ÚLTIMO en el subtítulo: es lo menos importante de la
     fila y solo existe cuando hace falta. *Adelante van los datos que dicen
     QUÉ tarjeta es; la fecha solo dice CUÁL de las dos.* */
  if (desempate !== null) {
    partes.push(t('cuenta.medioAgregadaEl', { fecha: fechaCortaMono(desempate, idioma) }));
  }

  /* 🔴 Cuando NO sabemos el vencimiento, la fila **no dice nada** sobre él.
     *No hay una voz honesta para «no lo sabemos» que le sirva de algo a la
     familia: solo la confundiría sobre una tarjeta que funciona bien.* */

  /* 🔴 El `fin` explícito del consumidor GANA — la lista de Cuenta trae su
     botón de borrar y no quiere ni «Cambiar» ni chevron. */
  const derecha = fin ?? (
    zonaFin === 'cambiar' ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
        <Texto variante="dato">{t('pago.medioCambiar')}</Texto>
        {/* E14: LLEVA (abre la hoja que lo resuelve) ⇒ «›», jamás «⌄». */}
        <Chevron direccion="derecha" />
      </View>
    ) : zonaFin === 'camino' ? (
      <Chevron direccion="derecha" />
    ) : undefined
  );

  /* 🔴 `Celda` exige `interactiva` + rol cuando hay `onPress` — su contrato es
     una unión discriminada a propósito, para que ninguna fila sea tocable sin
     decirle al lector de pantalla qué es. Se respeta, no se esquiva. */
  return onPress ? (
    <Celda
      titulo={titulo}
      subtitulo={partes.length ? partes.join(' · ') : undefined}
      interactiva
      accessibilityRole="button"
      onPress={onPress}
      fin={derecha}
      inicio={<LogoFranquicia marca={tarjeta.marca} />}
    />
  ) : (
    <Celda
      titulo={titulo}
      subtitulo={partes.length ? partes.join(' · ') : undefined}
      fin={derecha}
      inicio={<LogoFranquicia marca={tarjeta.marca} />}
    />
  );
}

/**
 * 🔴 S103-C · LA FILA «DEUNA» — el segundo riel, presente y todavía no elegible.
 *
 * **Es la promesa del encabezado de este archivo cumplida al pie:** *«el día
 * que entre DeUna es una fila más»*. Lo es — **sin tocar una línea de
 * `FilaMedioDePago`, ni de la hoja, ni del estado de la elección.**
 *
 * ── POR QUÉ SE DIBUJA Y NO SE PUEDE ELEGIR ────────────────────────────────
 *
 * **No es una decisión de diseño: es lo que está medido.** La pista D midió el
 * ambiente QA el 22-ago y el riel tiene **un bloqueante único**: falta el
 * `pointOfSale` del comercio, *«obligatorio y solo numérico»*, que **no expone
 * ningún endpoint** (control: 16 sondeos → 404 en los 16). Sin él **no se
 * puede crear ni una transacción** ⇒ no hay `numericCode`, no hay pantalla de
 * código, no hay cobro. **Dueño: el founder.**
 *
 * · **Se DIBUJA** porque `LETRA_PUERTA_DE_PAGO_S101B` §0.4 es literal:
 *   *ningún estado se dibuja mudo.* Una fila ausente no informa nada.
 * · **No se puede ELEGIR** por la Ley 23 de la casa (*«la puerta no ofrece lo
 *   que va a rechazar»*). *Dejarla tocable para rebotar después es el patrón
 *   exacto que esa ley mató.*
 *
 * ── LO QUE ESTA PIEZA NO INVENTA, Y ES DELIBERADO ─────────────────────────
 *
 * **No nace ningún tipo nuevo para «qué medio se eligió».** Hoy la elección
 * sigue siendo `elegido: string | null` (el id de una tarjeta), y **está
 * bien**: mientras DeUna no se pueda elegir, una unión discriminada sería un
 * modelo de datos para un caso que no puede ocurrir. *`PLAN_MESA_104` §1: «C
 * no inventa contratos: consume lo que A y D declaren».* **El contrato de la
 * elección nace cuando D entregue su puerta, con su forma real.**
 *
 * ⚠️ **LA SEGUNDA RAZÓN DE NO-ELEGIBLE, declarada y NO construida:**
 * `LETRA_COBRO_RECURRENTE` §8 dice que **DeUna no puede sostener una serie**
 * (*«ese riel es push… no hay cobro sin presencia posible»*) y ordena
 * *«y así se le dice al elegir medio»*. **Hoy esa rama es INALCANZABLE por
 * construcción**: medido, la recurrencia se activa en la pantalla de ÉXITO
 * (`checkout.tsx`, `activarRecurrencia`), o sea **después** de elegir medio —
 * cuando se elige, todavía no hay serie que proteger. *Construir su voz hoy
 * sería letra muerta, y una rama que nunca corre es una rama que nadie prueba.*
 * **Disparo: el día que «que llegue solo» se decida ANTES del pago.**
 *
 * **La marca:** `LogoFranquicia` la resuelve **sin tocarlo** — su fallback de
 * texto dibuja las marcas sin archivo, y «DEUNA» entra en los 56 px que su
 * comentario declara medidos contra «DINERS». *Misma caja, mismo radio, mismo
 * aire que las cinco tarjetas: es lo que esa pieza existe para garantizar.*
 */
export function FilaDeUna({ onPress }: { onPress?: () => void }) {
  const { t } = useTraduccion();

  /* 🔴 SIN `onPress` LA FILA SE DIBUJA Y NO SE TOCA. **Esa rama no es residuo —
     es el camino de vuelta** si el riel se retira (ver `DEUNA_ELEGIBLE`), y el
     25-ago se volvió la rama VIVA. *Borrarla habría obligado a reconstruirla
     justo el día en que nadie tiene tiempo de construir nada.*

     🔴 **Y SU VOZ YA NO PROMETE UNA FECHA — decisión del founder, 25-ago.**
     ⏪ Decía *«Muy pronto vas a poder pagar desde tu app Deuna»*. **Con `D-913`
     abierta y sin fecha, «muy pronto» promete algo que no controlamos**, y el
     riel se apagó justo por una deuda que no tiene dueño de calendario.
     *Una promesa de tiempo que hace la app y cumple un tercero es una promesa
     que la app no puede hacer.* Hoy dice **lo que sí es cierto: que está en
     preparación.** */
  if (!onPress) {
    return (
      <Celda
        titulo={t('pago.deunaFila')}
        subtitulo={t('pago.deunaPreparando')}
        inicio={<LogoFranquicia marca="deuna" />}
      />
    );
  }

  /* ── ELEGIBLE (25-ago) ────────────────────────────────────────────────────
     Mismo contrato que `FilaMedioDePago` con `zonaFin="camino"`: `interactiva`
     + rol + chevron. *`Celda` exige el rol cuando hay `onPress` a propósito,
     para que ninguna fila sea tocable sin decirle al lector de pantalla qué
     es. Se respeta, no se esquiva.*

     🔴 **Y SIN SUBTÍTULO, que es un cambio y no un olvido.** ⏪ Decía *«Muy
     pronto vas a poder pagar desde tu app Deuna»* — **cierto hasta hoy y falso
     desde el flip.** *Una fila que se puede tocar mientras promete que todavía
     no se puede es peor que cualquiera de los dos estados por separado.*
     Las filas de tarjeta usan el subtítulo para decir CUÁL es (marca + últimos
     cuatro); **DeUna no tiene un dato equivalente**, así que callar es lo
     honesto. *Inventar acá una frase nueva sería meter una cadena a pantalla
     sin el lote de strings del founder.*
     ⇒ **Propuesta para su próximo lote, NO construida:** un subtítulo que diga
     qué pasa al elegirlo («Pagás desde tu app Deuna»). Hoy la fila dice su
     nombre y muestra su marca, que es lo que hace toda fila de medio. */
  return (
    <Celda
      titulo={t('pago.deunaFila')}
      interactiva
      accessibilityRole="button"
      onPress={onPress}
      inicio={<LogoFranquicia marca="deuna" />}
      fin={<Chevron direccion="derecha" />}
    />
  );
}

/**
 * 🔴 ¿DEUNA SE PUEDE ELEGIR? — **UNA sola constante, y es el interruptor.**
 *
 * ✅ **ENCENDIDA el 25-ago-2026, por firma del founder.** Las dos mitades que
 * esta nota exigía están: **el `pointOfSale` llegó** (QA 4262774) y **la puerta
 * de D responde** — `payment/request` devuelve `200` con `numericCode` de seis
 * dígitos. *La advertencia de abajo cumplió su trabajo: nadie la flipeó
 * creyendo que con eso alcanzaba.*
 *
 * ⏪ Decía: *«hoy `false` por un dato del comercio que no tenemos — el
 * `pointOfSale`, obligatorio, numérico, y no lo expone ningún endpoint (16
 * sondeos, 404 en los 16)»*. **Se conserva tachada y no borrada**: quien lea un
 * parte de la semana pasada tiene que poder ver que citaba la verdad de su día.
 *
 * ⚠️ **QUÉ ENCIENDE Y QUÉ NO — y esto sí hay que leerlo antes de tocarla.**
 * Enciende **elegir el riel y pedir el código**. **NO enciende la
 * confirmación**: el webhook **todavía no está registrado del lado de Deuna**,
 * así que hoy la transición a pagada dependería **solo del sondeo**. *Y con la
 * app de producción no se puede pagar un código de QA, así que el camino real
 * se corta en el código.* **Lo que esta constante hace alcanzable es la
 * pantalla, no el desenlace.**
 *
 * 🔴 **ES UN INTERRUPTOR DE OTA, NO UN KILL SWITCH.** Vive en el bundle: para
 * apagarlo hay que publicar. *Un riel de plata que solo se apaga con un deploy
 * no se apaga a las 3 de la mañana.* **El kill switch de verdad vive en
 * `app_config`** —como `recurrente_vivo`, precedente de S103— **y es de A.**
 * No lo construyo yo desde acá: se declara para que la diferencia esté a la
 * vista el día que haga falta.
 *
 * ⚠️ **Y tipada `boolean` A PROPÓSITO, no inferida como `true`.** Con el
 * literal, TypeScript daría por muertas las ramas de «DeUna no se puede
 * elegir» de `useMedioDePago` — *y no están muertas: son el camino de vuelta
 * si el riel se retira.*
 */
/**
 * ☠️ **APAGADA EL 25-ago, DESPUÉS DEL GATE — firma del founder, y NO es un
 * retroceso: es lo que el gate vino a permitir.**
 *
 * *Se encendió para que un ojo la viera y se apaga con ese ojo satisfecho.*
 * **Gate VERDE** (fila primera y tocable · isotipo · blanco fijo en los tres
 * temas · botón habilitado · sin giro · los seis dígitos con su reloj).
 *
 * 🔴 **Y el motivo del apagado NO es la pantalla — es `D-913` llegando a gente
 * real POR EL DEFAULT.** La cadena, medida pieza por pieza:
 * ① sin preferencia previa, `useMedioDePago` devuelve `{tipo:'deuna'}` —
 * *nadie eligió DeUna; se la asignamos* · ② el botón queda habilitado · ③
 * tocar «Pagar» pide el código y el intento queda `pendiente` · ④ **la compra
 * queda impagable por cualquier vía, tarjeta incluida, para siempre** (la
 * compuerta filtra por `compra_id` **sin filtrar por proveedor**).
 * ⇒ **alguien que compra sin pensar rompe su propio carrito sin haber elegido
 * DeUna jamás.** *El flip no expone el riel a quien lo quiera probar: se lo
 * pone por delante a todo el mundo.*
 *
 * ✅ **CONDICIÓN DE RE-ENCENDIDO, escrita para que no dependa de que alguien
 * se acuerde: `D-913` curada.** No hace falta el webhook ni un cron — el
 * vocabulario `'expirado'` ya vive en el CHECK de `pagos_intentos.estado` desde
 * S95, `codigo_expira_en` **se escribe y no lo lee nadie**, y la casa resuelve
 * esta forma con **expiración perezosa** desde S54. *Es de A/D, no de esta
 * constante.*
 */
/* ✅ ENCENDIDA OTRA VEZ el 26-ago, por firma del founder — y esta vez con el
   riel corrido de punta a punta: **pago por webhook, aplicación automática y
   reverso ejercido.** *La primera vez se encendió para que un ojo mirara una
   pantalla; ésta, porque el circuito entregó.*

   ⚠️ **Y EL RESIDUO DE `D-913` QUE SIGUE VIVO, medido y no supuesto** — la
   firma dice *«ya no rompe carritos»* y es cierto **para el intento que se
   RESUELVE**: el barrido diario consulta al proveedor y aplica su veredicto,
   así que un pago aprobado o reversado sale de `('iniciado','pendiente')` y
   libera la compuerta.
   🔴 **Lo que NO cambió es el intento que nadie pagó nunca.** Medido: **nadie
   escribe `'expirado'`** (el único hit del valor es su propio CHECK) y **nadie
   lee `codigo_expira_en`**; el proveedor sigue diciendo `PENDING` sobre un
   código que caducó, así que el barrido lo deja donde está. ⇒ **una compra
   abandonada a mitad de pago sigue quedando impagable por cualquier riel**,
   porque la compuerta 0 cuenta por `compra_id` y sin filtrar por proveedor.
   *El radio se achicó muchísimo —de «cualquiera que toque» a «quien abandone»—
   pero no es cero, y la diferencia importa porque el default vuelve a ser
   DeUna.* */
export const DEUNA_ELEGIBLE: boolean = true;

/** El bloque de una fila vencida, para cuando la pantalla quiera explicarlo. */
export function VozVencida({ visible }: { visible: boolean }) {
  const { t } = useTraduccion();
  if (!visible) return null;
  return (
    <View style={{ paddingHorizontal: spacing[5] }}>
      <Texto variante="apoyo">{t('cuenta.medioVencidoAyuda')}</Texto>
    </View>
  );
}
