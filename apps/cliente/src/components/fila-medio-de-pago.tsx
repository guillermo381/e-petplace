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
import type { TarjetaGuardada } from '@epetplace/api';
import { LogoFranquicia } from '@/components/logo-franquicia';
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
 * ¿Ya venció? **Solo se puede responder si tenemos el dato.**
 * `null` significa *no lo sabemos*, y quien lo consume tiene que distinguirlo
 * de `false`. *Tratar «no sé» como «está bien» es cómo una tarjeta vencida se
 * cobra sin avisar.*
 */
export function vencida(t: TarjetaGuardada, ahora = new Date()): boolean | null {
  if (t.expiraMes === null || t.expiraAnio === null) return null;
  const finDeMes = new Date(t.expiraAnio, t.expiraMes, 1); // día 1 del mes siguiente
  return finDeMes.getTime() <= ahora.getTime();
}

export type FilaMedioDePagoProps = {
  tarjeta: TarjetaGuardada;
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
};

export function FilaMedioDePago({
  tarjeta, zonaFin = 'ninguna', onPress, fin,
}: FilaMedioDePagoProps) {
  const { t } = useTraduccion();
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
