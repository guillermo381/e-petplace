/**
 * EL INTERRUPTOR DEL ESPEJO — `Administrar ⇄ Ver como cliente`
 * (receta B §2 · N17).
 *
 * ── 🔴 ES UN INTERRUPTOR DE MODO, NO UNA NAVEGACIÓN ──────────────────────
 * La razón no es de inventario y la receta la deja escrita: **si «Ver como
 * cliente» navega, el vendedor SALE de su trabajo y tiene que volver.** Un
 * interruptor conserva el lugar, el scroll y el producto que estaba
 * mirando — *y sin eso el espejo no se usa: se visita una vez.*
 *
 * Por eso es una PIEZA y no un `router.push`: la misma la monta el techo de
 * la vitrina y la monta la ficha. **Dos superficies, un solo control** — si
 * cada una armara el suyo, el día que cambie la voz cambiaría en una sola y
 * el vendedor leería dos nombres para el mismo modo.
 *
 * ── DÓNDE VIVE ──────────────────────────────────────────────────────────
 * **En el techo, FIJO** — no scrollea con el contenido. *Un interruptor que
 * se va con el scroll deja al vendedor sin saber en qué modo está justo
 * cuando más abajo llegó.* Esta pieza no se posiciona sola: la monta quien
 * tiene el techo, y ahí es donde se cumple lo de «fijo».
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * · **⛔ No dibuja marco de teléfono.** Es la vitrina de verdad, a tamaño
 *   real. *Un mockup dentro de la app dice «esto es una simulación», y N17
 *   pide lo contrario: que el vendedor no pueda NO saber cómo se ve.*
 * · **⛔ No cambia datos, solo lo que se muestra.**
 * · **⛔ No anima el viaje.** El cambio de modo NO es un desplazamiento
 *   direccional: *no fuiste a ningún lado — la misma cosa se mira de otra
 *   manera*. El fundido lo hace el CONTENIDO (quien lo monta), no el
 *   control.
 *
 * ── 🔴 POR QUÉ DEJÓ DE SER UN SEGMENTADO (dictamen de B, S99) ────────────
 * Con «Tu tienda» en dos segmentos (Tu local · Tu stock) quedaban **dos
 * controles segmentados anidados**, y el vendedor no sabía cuál mandaba.
 * **No competían por ser dos: competían por ser IGUALES** — uno cambia
 * QUÉ ves (navegación) y el otro CON QUÉ OJOS (lente), y dos controles con
 * la misma forma declaran que son la misma clase de elección.
 *
 * **Y decidió el modo de falla:** el estado peligroso es **estar en «ver
 * como cliente» sin darse cuenta** y no entender por qué nada se toca. Un
 * interruptor tiene un estado natural (apagado) y uno que se enciende —
 * *que es exactamente la relación entre administrar y asomarse*; un
 * segmentado con un lado activo se lee como «estoy en esta sección», que
 * es el mensaje equivocado.
 *
 * ⚠️ **La API no se movió**: entra `modo`, sale `modo`. Quien la monta no
 * se enteró del cambio, que es como tiene que ser.
 */

import { View } from 'react-native';
import { Interruptor, Texto, spacing } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** Los dos modos del espejo. Un tipo, para que nadie pase un string suelto. */
export type ModoEspejo = 'administrar' | 'cliente';

/** El modo se lee de la URL con esta puerta: **cualquier cosa que no sea
 *  `cliente` es `administrar`**. Un parámetro roto no puede dejar al
 *  vendedor en el modo donde NO están sus controles. */
export function modoDesdeParam(valor: string | string[] | undefined): ModoEspejo {
  return valor === 'cliente' ? 'cliente' : 'administrar';
}

export interface InterruptorEspejoProps {
  modo: ModoEspejo;
  onCambio: (modo: ModoEspejo) => void;
}

export function InterruptorEspejo({ modo, onCambio }: InterruptorEspejoProps) {
  const { t } = useTraduccion();
  return (
    /* 🔴 INTERRUPTOR Y NO SEGMENTADO — dictamen de B, y su API no cambió:
       esta pieza sigue recibiendo `modo` y devolviendo `modo`.
       **ENCENDIDO = lo estás viendo como la familia.** El sentido no es
       arbitrario: administrar es **la casa** (estado natural, apagado) y
       ver como cliente es **asomarse** (algo que se enciende y se apaga).
       *Un segmentado decía «estos dos son iguales» — y uno es la casa y el
       otro es la ventana.* */
    /* 🔴 LA FILA COMPLETA, no el interruptor pelado. `Interruptor` recibe
       `etiqueta` para el LECTOR DE PANTALLA —su propio contrato lo dice:
       *«el label VISIBLE es de la pantalla»*—, así que montarlo solo
       dejaría un control sin nombre a la vista. *Y acá eso sería
       exactamente el modo de falla que el dictamen quiso cerrar: un
       interruptor mudo se enciende sin que nadie sepa qué encendió.* */
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing[3],
      }}
    >
      <Texto variante="cuerpo">{t('espejo.verComoCliente')}</Texto>
      <Interruptor
        encendido={modo === 'cliente'}
        onCambio={(v) => onCambio(v ? 'cliente' : 'administrar')}
        etiqueta={t('espejo.verComoCliente')}
        registro="oficio"
      />
    </View>
  );
}
