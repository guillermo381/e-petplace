/**
 * Cuenta · **Ayuda y legales** — S103-C (mesa 104, tanda 1).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ☠️ MUERE «no se cobra dinero real».                                  │
 * │                                                                      │
 * │ La pantalla afirmaba, publicado: *«Esta app está en fase de pruebas: │
 * │ no se cobra dinero real…»*. **Era cierta cuando se escribió y dejó   │
 * │ de serlo sin que nadie la tocara** — S101 conectó el motor de cobro  │
 * │ de punta a punta.                                                    │
 * │                                                                      │
 * │ *No era una imprecisión de redacción: es la única pantalla donde la  │
 * │ app hace una afirmación legal sobre el dinero, y afirmaba lo         │
 * │ contrario de lo que el motor hace.*                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * **Los tres cambios de esta pasada, cada uno con su fuente:**
 *
 * · **El soporte dejó de ser una promesa y pasó a ser un botón.** Decía
 *   *«Pronto — un lugar digno para pedir ayuda»* mientras
 *   `LETRA_PUERTA_DE_PAGO_S101B` §3.1 manda a esta pantalla a **tres** de sus
 *   ocho compuertas (*«Ya lo estamos viendo»*). *La superficie de pago
 *   prometía un soporte que la superficie de ayuda declaraba inexistente.*
 *   Se resuelve con el **patrón del prestador** (`solicitar-acceso`, S61-B13):
 *   WhatsApp con mensaje pre-escrito, `openURL` en try/catch y el número
 *   humano como fallback — *`canOpenURL` miente en falso-negativo sin queries
 *   de intent en Android; el catch es la verdad.*
 *
 * · **`lib/contacto.ts` gana su PRIMER consumidor.** Existía desde S96-D y
 *   **nadie lo usaba**. Su regla de uso, que esta pantalla cumple: *«el botón
 *   DICE a dónde va»*. ⚠️ Lo que la letra pide y **no** se cumple: *«y en qué
 *   horario contestan»* — **no hay horario firmado y no se inventa uno**; la
 *   voz no promete plazo, que es la mitad honesta de esa regla.
 *
 * · **Los legales se NAVEGAN, no se transcriben** (N21 + N22): **UNA
 *   `CeldaNavegacion` al índice `/legales`**, y **la pantalla declara qué
 *   documento está abriendo**. *Una fila que diga «Política de privacidad» y
 *   lleve a un texto que se excluye a sí mismo de la app es peor que la
 *   ausencia: la ausencia se nota y esa fila no.*
 *
 *   🔴 **Y es UN índice, no N documentos — contrato de B, ratificado por el
 *   founder:** *«las páginas en preparación cambiarán de nombre con el abogado
 *   y el índice las absorbe»*. **La app no conoce el catálogo legal del sitio:
 *   conoce su puerta.** *Enlazar documentos sueltos obliga a tocar esta
 *   pantalla cada vez que nazca uno — y la pantalla que no se toca se queda
 *   vieja, que es el defecto que esta misma pasada vino a curar.*
 *
 * ⚠️ **NO GATEADO, y se declara:** `/legales` **da 404 en producción al
 * 22-ago** — las rutas de B están verificadas contra su build y esperan el
 * gate de despliegue del founder. *El enchufe se construye; su verde lo da el
 * juez de B en tanda 2 («ninguna URL del enchufe de C devuelve 404»), no esta
 * pantalla.*
 *
 * **Con esto D-336 queda cerrada del lado del producto** (el `grep
 * epetplace.com` en `apps/` daba CERO: ninguna app enlazaba a ningún legal).
 * *Lo que sigue abierto es el CONTENIDO, que es D-405 y va con abogado.*
 *
 * Escalera §4b: no muestra ningún dato del expediente.
 */

import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton, CeldaNavegacion, Encabezado, Tarjeta, Texto, spacing, useTheme,
} from '@epetplace/ui';

import { urlLegales } from '@/lib/legales';
import { WHATSAPP_EQUIPO_HUMANO, urlWhatsApp } from '@/lib/contacto';
import { useTraduccion } from '@/i18n';

export default function AyudaCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [sinWhatsApp, setSinWhatsApp] = useState(false);

  async function abrirWhatsApp() {
    try {
      await Linking.openURL(urlWhatsApp(t('cuenta.soporteMensaje')));
    } catch {
      setSinWhatsApp(true);
    }
  }

  /* Un enlace que no abre **no se dibuja como si hubiera abierto**: el
     fallback de WhatsApp no aplica acá (es otra causa), así que el fallo se
     traga en silencio y la fila queda tocable. *No hay estado intermedio que
     mentir: o abrió el navegador, o la persona sigue en la pantalla.* */
  async function abrirLegal(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      /* sin camino alternativo honesto — ver nota de arriba */
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('cuenta.ayuda')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[6],
          gap: spacing[4],
        }}
      >
        {/* ① EL SOPORTE PRESIDE — es lo que la persona vino a buscar, y es el
            destino de las tres compuertas de pago que hablan hacia soporte. */}
        <Tarjeta>
          <View style={{ gap: spacing[3] }}>
            <Texto variante="seccion">{t('cuenta.soporteTitulo')}</Texto>
            <Texto variante="apoyo">{t('cuenta.soporteCuerpo')}</Texto>
            <Boton
              etiqueta={t('cuenta.soporteBoton')}
              bloque
              onPress={() => void abrirWhatsApp()}
            />
            {sinWhatsApp ? (
              <Texto variante="dato" seleccionable>
                {t('cuenta.soporteFallback', { numero: WHATSAPP_EQUIPO_HUMANO })}
              </Texto>
            ) : null}
          </View>
        </Tarjeta>

        {/* ② LOS LEGALES — se navegan (N21: el grupo rotulado va en carta).

            🔴 **UNA fila, no dos.** ⏪ Nacieron dos («Términos» y
            «Privacidad», cada una a su documento) y **A las corrigió con la
            fuente de B: la app conoce UN índice.** *Con dos enlaces sueltos,
            el día que nazca el aviso de IA o la letra de custodia hay que
            volver a tocar esta pantalla — y la que no se toca se queda
            vieja.* */}
        <Tarjeta>
          <View style={{ gap: spacing[2] }}>
            <CeldaNavegacion
              icono="documento"
              titulo={t('cuenta.legalesTitulo')}
              onPress={() => void abrirLegal(urlLegales(idioma))}
            />
            {/* 🔴 QUÉ SE ESTÁ LEYENDO, dicho en voz alta. Sin esta línea la
                fila promete los documentos DE LA APP y entrega los DEL SITIO
                — que se excluye a sí mismo de ella con todas las letras. */}
            <Texto variante="apoyo">{t('cuenta.legalEstado')}</Texto>
          </View>
        </Tarjeta>
      </ScrollView>
    </View>
  );
}
