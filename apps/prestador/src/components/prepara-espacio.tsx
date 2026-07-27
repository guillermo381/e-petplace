/**
 * S79-B (T2-B1): "PREPARA TU ESPACIO" — la tercera presencia de §2.4, en el
 * HOME (cura aprobada por el founder sobre el audit s79b-audit-dia1 §1.1).
 *
 * Las CUATRO tareas que existen (servicios · horarios · precios · equipo),
 * cada una con su POR QUÉ en voz humana, cualquier orden, SIN wizard, check
 * SUTIL (Insignia soloPunto capa 'vida' — jamás animación celebratoria).
 * La quinta (condiciones operativas) NO tiene superficie: es deuda declarada
 * en el boceto, no una pantalla inventada.
 *
 * ANATOMÍA 19.1 COMPUESTA CON `Celda` (declarado en el boceto M1):
 * `CeldaNavegacion` cumple la letra pero no tiene slot `fin` para el check —
 * acá se monta la MISMA anatomía (Icono b′ + título + detalle + chevron) sobre
 * el ladrillo de fila, que sí lo tiene. El ensanche de CeldaNavegacion (slot
 * `fin`) queda como pedido a la mesa; NO se copia el componente (L-175).
 *
 * CHECKS = SEÑAL POSITIVA VERIFICADA (patrón S78/D-521): `null` significa
 * "no se pudo verificar" (lectura caída o sin cuenta) y NO dibuja check — un
 * fallo no fabrica estado. La tarea sigue navegable siempre.
 */

import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import {
  Celda,
  Icono,
  Insignia,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
  type IconoNombre,
} from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export type EstadoTareas = {
  serviciosOk: boolean;
  /** Derivado hoy de la misma data que servicios (declarado en el boceto M1). */
  preciosOk: boolean;
  /** null = no verificado (lectura caída) — sin check, sin afirmar pendiente. */
  horariosOk: boolean | null;
  /** null = no verificado (sin cuenta comercial o lectura caída). */
  equipoOk: boolean | null;
};

function Chevron() {
  const { theme } = useTheme();
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <Path
        d="M9 18l6-6-6-6"
        stroke={theme.text.tertiary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PreparaEspacio({ tareas }: { tareas: EstadoTareas }) {
  const router = useRouter();
  const { t } = useTraduccion();

  // Glifos del registry EXISTENTE (L-175, cero glifo nuevo): 'negocio' y
  // 'vacaciones' son STAND-IN declarados en el boceto (maletín para la oferta,
  // calendario para los horarios) — precedente del 'negocio' de cuenta
  // comercial (S59-B2).
  const filas: {
    clave: 'servicios' | 'horarios' | 'precios' | 'equipo';
    icono: IconoNombre;
    hecho: boolean | null;
    destino: () => void;
  }[] = [
    {
      clave: 'servicios',
      icono: 'negocio',
      hecho: tareas.serviciosOk,
      destino: () => router.navigate('/(tabs)/negocio'),
    },
    {
      clave: 'horarios',
      icono: 'vacaciones',
      hecho: tareas.horariosOk,
      destino: () => router.navigate('/(tabs)/negocio'),
    },
    {
      clave: 'precios',
      icono: 'pagos',
      hecho: tareas.preciosOk,
      destino: () => router.navigate('/(tabs)/negocio'),
    },
    {
      clave: 'equipo',
      icono: 'equipo',
      hecho: tareas.equipoOk,
      destino: () => router.push('/negocio/equipo'),
    },
  ];

  return (
    <View style={{ gap: spacing[2] }}>
      <Texto variante="seccion">{t('preparaEspacio.titulo')}</Texto>
      <Texto variante="apoyo">{t('preparaEspacio.subtitulo')}</Texto>
      <Tarjeta elevacion="reposo" relleno="ninguno">
        {filas.map((fila, i) => (
          <View key={fila.clave}>
            {i > 0 && <Separador />}
            <Celda
              interactiva
              accessibilityRole="button"
              onPress={fila.destino}
              titulo={t(`preparaEspacio.${fila.clave}Titulo`)}
              subtitulo={t(`preparaEspacio.${fila.clave}PorQue`)}
              inicio={<Icono nombre={fila.icono} registro="aa" tamano={24} />}
              fin={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  {fila.hecho === true && (
                    <Insignia capa="vida" soloPunto etiqueta={t('preparaEspacio.checkHecho')} />
                  )}
                  <Chevron />
                </View>
              }
            />
          </View>
        ))}
      </Tarjeta>
    </View>
  );
}
