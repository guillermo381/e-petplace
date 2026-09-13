/**
 * 02 · BENEFICIOS — tres tarjetas, UNA sola vez (S116-C lote 3, letra §1.6).
 *
 * ── CUÁNDO SE VE, Y DÓNDE VIVE ESA MARCA ─────────────────────────────────
 * Sólo la primera vez que alguien toca «Crear cuenta» **en este aparato**;
 * después, nunca más. **La marca va en el almacenamiento local y NO en la
 * base**, y no es una comodidad: en este punto del recorrido **todavía no hay
 * cuenta** — no hay dónde guardarla del lado del servidor ni a quién
 * atribuírsela. *Una preferencia de alguien que aún no existe sólo puede vivir
 * en su teléfono.*
 *
 * ⚠️ **Consecuencia declarada:** quien reinstale la app la vuelve a ver. Es el
 * comportamiento correcto para lo que esta pantalla es (una presentación), y
 * el costo de evitarlo sería atarla a una identidad que todavía no hay.
 *
 * ── 🔴 EL CONTEO QUE EL ENCARGO PIDE — MEDIDO, Y NO EXISTE LA PUERTA ──────
 * El encargo dice: *«Contá dos cosas: cuántos tocan "Saltar" y cuántos llegan
 * a "Comenzar", por la puerta de eventos que la casa ya use; si no hay
 * ninguna, lo decís y queda NULL — no inventes una»*.
 *
 * **Medido: la casa NO tiene puerta de eventos.** Cero en `apps/cliente/src/lib`
 * y cero en `packages/api` (`registrarEvento`/`analitica`/`telemetria`/`track`).
 * ⇒ **queda NULL, como el encargo manda.** Los dos toques quedan marcados en
 * el código con `CONTEO_PENDIENTE` para que el día que exista la puerta, los
 * dos sitios se encuentren con un grep y no haya que volver a leer la pantalla.
 *
 * *La letra §1.6 dice «en octubre se decide con dato». Este comentario existe
 * para que ese día se sepa que el dato no se está juntando.*
 *
 * ── LA TERCERA TARJETA ES LA ÚNICA CON ACCIÓN ────────────────────────────
 * «Comenzar» aparece sólo en la última: una acción por vista (Ley 5), y poner
 * el CTA en las tres invitaría a saltear el contenido que la pantalla existe
 * para mostrar. **«Saltar» está siempre**, arriba — *una presentación de la
 * que no se puede salir deja de ser una presentación.*
 */

import { useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Boton, Personaje, Texto, spacing, useTheme, type EspeciePersonaje } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** La marca de «ya la vio». Monótona: una presentación vista no se desve. */
export const CLAVE_BENEFICIOS_VISTOS = 'epp.cliente.beneficiosVistos.v1';

/** ¿Hay que mostrarla? La lee quien decide el camino, no esta pantalla. */
export async function yaVioBeneficios(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLAVE_BENEFICIOS_VISTOS)) === '1';
  } catch {
    /* Sin almacenamiento la presentación se ve de nuevo. *Preferir mostrarla
       de más antes que romper el camino a crear la cuenta.* */
    return false;
  }
}

/* 🔴 **EL CONTEO QUE NO EXISTE.** Ver la cabecera: la casa no tiene puerta de
   eventos, así que esto NO llama a nada. Marca los dos sitios para el día que
   la haya. *Escribir un `console.log` acá sería fabricar un dato que nadie
   junta y que igual se leería como si se estuviera midiendo.* */
function CONTEO_PENDIENTE(_cual: 'salto' | 'completo'): void {
  /* sin puerta de eventos en la casa — medido, S116-C lote 3 */
}

type Tarjeta = { especie: EspeciePersonaje; titulo: string; apoyo: string };

export default function Beneficios() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [actual, setActual] = useState(0);
  const scroll = useRef<ScrollView>(null);

  const tarjetas: Tarjeta[] = [
    { especie: 'perro', titulo: t('beneficios.unoTitulo'), apoyo: t('beneficios.unoApoyo') },
    { especie: 'gato', titulo: t('beneficios.dosTitulo'), apoyo: t('beneficios.dosApoyo') },
    { especie: 'conejo', titulo: t('beneficios.tresTitulo'), apoyo: t('beneficios.tresApoyo') },
  ];

  /** Marca y sigue. La marca no bloquea el camino: si falla, se pasa igual. */
  const seguir = async (cual: 'salto' | 'completo') => {
    CONTEO_PENDIENTE(cual);
    try {
      await AsyncStorage.setItem(CLAVE_BENEFICIOS_VISTOS, '1');
    } catch {
      /* sin marca, la próxima vez la ve de nuevo — no es motivo para frenar */
    }
    router.replace('/registro');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, paddingTop: insets.top }}>
      {/* «Saltar», arriba y siempre. */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing[4], paddingTop: spacing[2] }}>
        <Boton
          variante="ghost"
          tamaño="sm"
          etiqueta={t('beneficios.saltar')}
          onPress={() => void seguir('salto')}
        />
      </View>

      {/* Las tres, con el dedo. El paginado lo hace el ScrollView; acá sólo se
          lee en cuál quedó — *el índice se DERIVA del scroll y no se guarda en
          paralelo: dos fuentes para la misma posición divergen.* */}
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setActual(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width)))
        }
        style={{ flex: 1 }}
      >
        {tarjetas.map((c) => (
          <View
            key={c.titulo}
            style={{
              width,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[5],
              paddingHorizontal: spacing[6],
            }}
          >
            <Personaje especie={c.especie} tamano="grande" fondo="rosa" />
            <Texto variante="titulo">{c.titulo}</Texto>
            <Texto variante="cuerpo" color="secondary">
              {c.apoyo}
            </Texto>
          </View>
        ))}
      </ScrollView>

      {/* Los puntos + la acción. El CTA sólo en la última (ver cabecera). */}
      <View style={{ paddingHorizontal: spacing[6], paddingBottom: insets.bottom + spacing[6], gap: spacing[5] }}>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('beneficios.paso', { actual: actual + 1, total: tarjetas.length })}
          style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing[2] }}
        >
          {tarjetas.map((c, i) => (
            <View
              key={c.titulo}
              style={{
                width: i === actual ? spacing[5] : spacing[2],
                height: spacing[2],
                borderRadius: spacing[2],
                backgroundColor: i === actual ? theme.accent.cta : theme.border.subtle,
              }}
            />
          ))}
        </View>

        {actual === tarjetas.length - 1 ? (
          <Boton
            variante="primario"
            etiqueta={t('beneficios.comenzar')}
            bloque
            onPress={() => void seguir('completo')}
          />
        ) : null}
      </View>
    </View>
  );
}
