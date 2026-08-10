/**
 * LA HOJA DEL SELECTOR DE PERSONA (LETRA_VITRINA, S78-A7) — ahora compartida.
 *
 * Vivía dentro de `explorar/veterinaria/disponibles`. Sube porque **ganó un
 * segundo consumidor**: desde D-730 la ficha del prestador reserva de verdad,
 * y una reserva de veterinaria puede tener que preguntar con quién. Dejarla
 * abajo habría obligado a la ficha a clonarla — y una segunda Hoja de la misma
 * pregunta diverge sola, que es la razón por la que `senal-reserva` existía.
 *
 * Es **presentacional pura**: no decide nada. Quién puede atender, si hay que
 * preguntar, y qué hacer con la respuesta lo resuelve `lib/reserva/veterinaria`.
 * Acá solo se dibuja lo que ese flujo ya decidió.
 *
 * Sus dos reglas firmadas se conservan verbatim:
 *  · «Cualquiera del equipo» viene PRESELECCIONADO — continuar sin tocar nada
 *    ES el camino de hoy (vara 3: el selector ofrece, no exige).
 *  · el rebote `persona_no_disponible` tiene **cara propia** y dos caminos,
 *    jamás la ropa de `slot_ocupado`: son dos verdades distintas.
 */

import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Boton, Hoja, SelectorOpcion, spacing, typography, useTheme } from '@epetplace/ui';
import type { PersonaQueAtiende, VeterinarioDisponible } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export function HojaPersonasVet({
  estado,
  onCerrar,
  personaElegida,
  onElegir,
  personaRebotada,
  creandoHold,
  onConfirmar,
}: {
  estado: { negocio: VeterinarioDisponible; personas: PersonaQueAtiende[] } | null;
  onCerrar: () => void;
  personaElegida: string;
  onElegir: (codigo: string) => void;
  personaRebotada: boolean;
  creandoHold: boolean;
  onConfirmar: (negocio: VeterinarioDisponible, persona?: PersonaQueAtiende) => void;
}) {
  const { t } = useTraduccion();
  const { theme } = useTheme();

  return (
    <Hoja visible={estado !== null} onCerrar={onCerrar} titulo={t('veterinaria.conQuienTitulo')} conCerrar>
      {estado !== null ? (
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: Math.round(typography.size.sm * 1.4),
              color: theme.text.secondary,
            }}
          >
            {t('veterinaria.conQuienVoz', { negocio: estado.negocio.prestador_nombre })}
          </Text>
          <SelectorOpcion
            etiqueta={t('veterinaria.conQuienTitulo')}
            etiquetaVisible={false}
            acento="control"
            disposicion="columnas"
            opciones={[
              { codigo: 'cualquiera', etiqueta: t('veterinaria.cualquieraEquipo') },
              ...estado.personas.map((per) => ({
                codigo: per.empleadoId,
                // null honesto → etiqueta genérica, jamás un nombre inventado (L-139)
                etiqueta: per.nombre ?? t('veterinaria.integranteEquipo'),
              })),
            ]}
            seleccionada={personaElegida}
            onSelect={onElegir}
          />
          {personaRebotada ? (
            /* VARA 2 — la cara PROPIA del rebote, con sus DOS caminos:
               soltar la elección (la reserva no se pierde) o volver al
               CUÁNDO. Jamás la ropa de slot_ocupado. */
            <View style={{ gap: spacing[2] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.sm,
                  lineHeight: Math.round(typography.size.sm * 1.4),
                  color: theme.status.warningText,
                }}
              >
                {t('veterinaria.personaNoPudo')}
              </Text>
              <Boton
                variante="primario"
                bloque
                etiqueta={t('veterinaria.dejarQueAsigne')}
                cargando={creandoHold}
                onPress={() => onConfirmar(estado.negocio)}
              />
              <Boton
                variante="ghost"
                bloque
                etiqueta={t('explorar.probarOtroHorario')}
                onPress={() => {
                  onCerrar();
                  router.back();
                }}
              />
            </View>
          ) : (
            <Boton
              variante="primario"
              bloque
              etiqueta={t('veterinaria.conQuienConfirmar')}
              cargando={creandoHold}
              onPress={() =>
                onConfirmar(
                  estado.negocio,
                  estado.personas.find((x) => x.empleadoId === personaElegida),
                )
              }
            />
          )}
        </View>
      ) : null}
    </Hoja>
  );
}
