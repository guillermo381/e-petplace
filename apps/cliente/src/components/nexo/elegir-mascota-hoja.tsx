/**
 * NEXO · LA HOJA CORTA DE «¿DE QUIÉN?» (S113-C · lote 0, §2.5).
 *
 * Aparece **sólo** cuando hay varias mascotas activas y ninguna pantalla de
 * mascota abierta. Un toque elige y cierra; **nada más** — sin buscador, sin
 * subtítulos, sin estado. *Una hoja que pregunta una cosa y ofrece cinco deja
 * de ser un paso y pasa a ser una pantalla.*
 *
 * Las caras salen de `caraDeMascotaPorRuta` —la cara de su especie cuando no
 * hay foto—, el mismo criterio que ya usa la Hoja del Coach: **una «J» sobre
 * un círculo dice que falta un dato; la cara de su especie dice de quién
 * estamos hablando.**
 */

import { Pressable, ScrollView, View } from 'react-native';
import { AvatarMascota, Hoja, Texto, spacing } from '@epetplace/ui';
import type { MascotaResumen } from '@epetplace/api';

import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

export function ElegirMascotaHoja({
  visible,
  titulo,
  mascotas,
  onElegir,
  onCerrar,
}: {
  visible: boolean;
  titulo: string;
  mascotas: readonly MascotaResumen[];
  onElegir: (m: MascotaResumen) => void;
  onCerrar: () => void;
}) {
  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={titulo} conCerrar>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing[4], paddingHorizontal: spacing[4], paddingBottom: spacing[4] }}
      >
        {mascotas.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => onElegir(m)}
            accessibilityRole="button"
            accessibilityLabel={m.nombre}
            style={{ alignItems: 'center', gap: spacing[2], width: 84 }}
          >
            <AvatarMascota
              nombre={m.nombre}
              fotoUrl={caraDeMascotaPorRuta({ especie: m.especie, rutaImagen: m.raza_ruta_imagen })}
              tamano="md"
            />
            <Texto variante="apoyo" numberOfLines={1}>
              {m.nombre}
            </Texto>
          </Pressable>
        ))}
        <View />
      </ScrollView>
    </Hoja>
  );
}
