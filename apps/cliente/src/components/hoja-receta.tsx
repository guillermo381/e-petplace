/**
 * ¿DE QUÉ CONSULTA? — el selector de la receta (S91-C, prioridad 1 del brief).
 *
 * **TESIS (Ley 14):** *una receta pertenece a UNA consulta, y la elige la
 * familia — no el sistema.*
 *
 * **FIRMA (Ley 15):** cada fila **nombra a quién la firmó**. Eso es lo que
 * distingue esta lista de una lista de archivos: una receta tiene autor, y
 * el autor es el dato por el que la familia la reconoce («la que me dio la
 * Dra. Aurora»). La firma no suma acentos — es composición, no color.
 *
 * **CHANEL (Ley 16) — qué se quitó:** el CONTADOR DE MEDICAMENTOS. El
 * wrapper lo trae (`medicamentos`) y esta pantalla lo DESCARTA A PROPÓSITO
 * (contrato de datos, M4): no desambigua —en los datos vivos las dos
 * consultas tienen 2— y competía con la identidad de la fila. La `hora`
 * corre la misma suerte y por la misma razón: la letra del founder nombró
 * tres campos —fecha · profesional · negocio— y ésos son los que están.
 *
 * **Materiales:** `Celda interactiva` con `metadataMono` — la fecha es dato
 * de máquina y el componente le impone el mono solo (Ley 3, sin que esta
 * pantalla formatee nada a mano). Cero componente nuevo: la pieza existía.
 *
 * Estados: solo se monta con 2+ consultas — con una se descarga sola
 * (`resolverDescarga`) y con ninguna habla la voz neutra de la superficie.
 * Por eso acá no hay vacío ni carga: **esta Hoja no puede estar vacía.**
 */

import { View } from 'react-native';
import { Celda, Hoja, Texto, spacing } from '@epetplace/ui';
import type { ConsultaConReceta } from '@epetplace/api';
import { fechaCortaMono } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

export function HojaReceta({
  consultas,
  onElegir,
  onCerrar,
}: {
  /** `null` = cerrada. La lista JAMÁS llega vacía (ver cabecera). */
  consultas: ConsultaConReceta[] | null;
  onElegir: (citaId: string) => void;
  onCerrar: () => void;
}) {
  const { t, idioma } = useTraduccion();

  return (
    <Hoja
      visible={consultas !== null}
      titulo={t('documentos.recetaElegirTitulo')}
      onCerrar={onCerrar}
      conCerrar
    >
      <View style={{ paddingBottom: spacing[2] }}>
        <View style={{ paddingBottom: spacing[3] }}>
          <Texto variante="apoyo" color="secondary">
            {t('documentos.recetaElegirVoz')}
          </Texto>
        </View>

        {(consultas ?? []).map((c) => (
          <Celda
            key={c.citaId}
            interactiva
            accessibilityRole="button"
            titulo={c.negocio ?? t('documentos.recetaConsultaSinNegocio')}
            // Nulo HONESTO: sin nombre no se inventa un firmante — la fila
            // queda con una línea y lo dice callando, no rellenando.
            subtitulo={c.profesional ?? undefined}
            metadataMono={fechaCortaMono(c.fecha, idioma)}
            onPress={() => onElegir(c.citaId)}
          />
        ))}
      </View>
    </Hoja>
  );
}
