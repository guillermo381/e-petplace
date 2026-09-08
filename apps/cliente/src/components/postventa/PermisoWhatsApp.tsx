/**
 * S114-C · EL PERMISO DE WHATSAPP — firma del founder, 7-sep-2026.
 *
 * **Se le pide a la familia UNA VEZ, en contexto, al abrir su primer caso.**
 * No en Preferencias —nadie entra— y no en el onboarding —ahí no significa
 * nada—. *Un permiso que se pide donde no se entiende para qué es, es un sí
 * que no vale.*
 *
 * ── LO QUE ESTA PIEZA GARANTIZA ─────────────────────────────────────────
 *
 * 🔴 **El «ahora no» NO se registra como preferencia.** Se recuerda **por
 * caso**, en el dispositivo. *«Ahora no» no es «nunca»*: guardarlo como un
 * `habilitada: false` global apagaría el canal para siempre a partir de un
 * gesto que sólo dijo «acá no». Y el motor ya trata la ausencia de fila como
 * NO permiso, así que no hace falta escribir nada para que no le llegue.
 *
 * 🔴 **El sí se registra con su momento y su forma.** `guardarPreferenciaCanal`
 * exige `evidencia` para WhatsApp —quién, cuándo, por qué método y **el texto
 * exacto que se mostró**— y sin ella el motor rebota `opt_in_sin_evidencia`.
 * *La evidencia no es burocracia: es el requisito del canal, y por eso viaja
 * el texto y no un booleano.*
 *
 * ── POR QUÉ LA CATEGORÍA ES `operacion` ─────────────────────────────────
 * §10 manda WhatsApp **sólo en dos momentos**: cuando la familia tiene que
 * ACTUAR (`caso_elegir_devolucion`) y cuando la plata se movió
 * (`caso_resuelto` / `caso_saldo_acreditado`). Los dos son *«el estado de algo
 * que la persona contrató»*, que es la definición literal de `operacion` en
 * `cat_notificacion_categorias`. **Los mensajes del hilo son `relacional` y no
 * van por WhatsApp**, así que una sola categoría alcanza y pedir dos permisos
 * sería pedir de más.
 *
 * ⚠️ **Los tipos `caso_*` todavía no están sembrados** (§10 los lista con su
 * productor y A no llegó): el permiso se guarda igual y **queda esperando a
 * sus avisos**, que es el orden correcto — *el permiso primero, el aviso
 * después; al revés se manda antes de tener con qué justificarlo.*
 *
 * Sigue disponible en Preferencias para cambiarlo: acá no se decide para
 * siempre, se decide la primera vez.
 */

import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Boton, Texto, spacing } from '@epetplace/ui';
import { guardarPreferenciaCanal } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** «El estado de algo que la persona contrató» — ver la cabecera. */
const CATEGORIA = 'operacion';

/** El «ahora no» vive en el dispositivo y POR CASO. Nunca en el servidor. */
const clave = (casoId: string) => `postventa.whatsapp.ahoraNo.${casoId}`;

type Estado = 'preguntando' | 'guardando' | 'listo' | 'callado';

export function PermisoWhatsApp({ casoId }: { casoId: string }) {
  const { t } = useTraduccion();
  const [estado, setEstado] = useState<Estado>('callado');

  useEffect(() => {
    let vigente = true;
    void (async () => {
      /* Si ya dijo «ahora no» en ESTE caso, no se vuelve a preguntar acá.
         Si el almacenamiento falla, se pregunta: **preguntar de más es
         molesto; no preguntar nunca es perder el canal**. */
      let dijoQueNo = false;
      try {
        dijoQueNo = (await AsyncStorage.getItem(clave(casoId))) !== null;
      } catch {
        dijoQueNo = false;
      }
      if (vigente) setEstado(dijoQueNo ? 'callado' : 'preguntando');
    })();
    return () => {
      vigente = false;
    };
  }, [casoId]);

  const decirQueSi = useCallback(async () => {
    setEstado('guardando');
    const textoMostrado = t('postventa.whatsappPregunta');
    const r = await guardarPreferenciaCanal({
      categoria: CATEGORIA,
      canal: 'whatsapp',
      habilitada: true,
      /* 🔴 SU MOMENTO Y SU FORMA. El texto es **el que se mostró**, no una
         descripción de él: si mañana cambia la frase, la evidencia vieja
         sigue diciendo qué leyó esa persona. */
      evidencia: {
        textoMostrado,
        metodo: 'caso_postventa',
        en: new Date().toISOString(),
      },
    });
    /* Un fallo NO se disfraza de éxito: vuelve a preguntar. *Decirle que
       quedó activado cuando no se guardó es prometerle avisos que no van a
       llegar.* */
    setEstado(r.ok ? 'listo' : 'preguntando');
  }, [t]);

  const decirAhoraNo = useCallback(async () => {
    try {
      await AsyncStorage.setItem(clave(casoId), '1');
    } catch {
      /* Si no se pudo recordar, lo peor que pasa es que se vuelva a
         preguntar. No se escribe nada en el servidor. */
    }
    setEstado('callado');
  }, [casoId]);

  /* El acuse se retira solo. `4 s` alcanza para leer una línea y no tanto como
     para volverse parte de la pantalla; y se limpia al desmontar, porque un
     timer que sobrevive a su componente escribe estado en un fantasma. */
  useEffect(() => {
    if (estado !== 'listo') return;
    const t = setTimeout(() => setEstado('callado'), 4000);
    return () => clearTimeout(t);
  }, [estado]);

  if (estado === 'callado') return null;

  if (estado === 'listo') {
    /* 🔴 **LA CONFIRMACIÓN SE VA SOLA, y acá mi propio comentario mentía.**
       ⏪ Decía *«no se convierte en un cartel permanente»*… y eso es
       exactamente lo que era: `listo` no volvía nunca a `callado`, así que la
       línea quedaba fija en la pantalla del caso para siempre. **El founder la
       vio ahí y tenía razón.**

       *Una confirmación es un acuse: dice que el acto ocurrió y se retira.* El
       permiso se pide UNA vez; su recibo no puede vivir en la pantalla más que
       el momento en que confirma. Dónde se cambia sigue estando —Preferencias—
       y ahí no envejece.

       ⚠️ *Un comentario que afirma lo contrario de lo que hace el código es
       peor que ninguno: le dice al próximo que ya está resuelto.* */
    return <Texto variante="apoyo">{t('postventa.whatsappListo')}</Texto>;
  }

  return (
    <View style={{ gap: spacing[2] }}>
      <Texto variante="apoyo">{t('postventa.whatsappPregunta')}</Texto>
      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
        <View style={{ flex: 1 }}>
          <Boton
            etiqueta={t('postventa.whatsappSi')}
            bloque
            cargando={estado === 'guardando'}
            onPress={() => void decirQueSi()}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Boton
            variante="secundario"
            etiqueta={t('postventa.whatsappAhoraNo')}
            bloque
            onPress={() => void decirAhoraNo()}
          />
        </View>
      </View>
    </View>
  );
}
