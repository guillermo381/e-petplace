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

import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AvatarMascota, Hoja, Texto, spacing } from '@epetplace/ui';
import type { MascotaResumen } from '@epetplace/api';

import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

/** El ancho de cada chip. Es el que ya tenía la fila horizontal: se conserva
 *  para que el tamaño del avatar y el truncado del nombre no cambien con esta
 *  cura — **lo que cambia es cómo se acomodan, no cómo se ven**. */
const ANCHO_CHIP = 84;
/** Cuántas filas se ven sin desplazar. */
const FILAS_MAX = 3;
/** El aire entre chips, en el mismo token que usa el contenedor. */
const GAP = spacing[4];

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
  const [ancho, setAncho] = useState<number | null>(null);
  const [altoChip, setAltoChip] = useState<number | null>(null);

  /* Columnas que entran de verdad en el ancho disponible, y cuántas filas
     harían falta. Sin una de las dos medidas todavía, no hay tope: se prefiere
     una hoja alta a una lista recortada. */
  const columnas = ancho === null ? null : Math.max(1, Math.floor((ancho + GAP) / (ANCHO_CHIP + GAP)));
  const filas = columnas === null ? null : Math.ceil(mascotas.length / columnas);
  const desborda = filas !== null && filas > FILAS_MAX;
  const topeAlto = desborda && altoChip !== null ? altoChip * FILAS_MAX + GAP * (FILAS_MAX - 1) : null;

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={titulo} conCerrar>
      {/* 🔴 **ERA UN `ScrollView horizontal`, Y ÉSE ERA EL DEFECTO.** Con cinco
          mascotas los que no entraban en el ancho quedaban afuera de la vista
          y el indicador estaba apagado (`showsHorizontalScrollIndicator=false`),
          así que **había scroll y no se veía**: para la familia, la lista
          estaba cortada. *Un desplazamiento que no se anuncia es peor que no
          tenerlo: promete que eso es todo lo que hay.*

          Ahora se acomodan en FILAS. El tope de tres no es una preferencia:
          con más, la hoja se comería la pantalla y el gesto de cerrarla se
          pelearía con el de desplazar. Pasadas las tres, **la hoja crece con
          scroll vertical** —que sí se anuncia— y ahí el desplazamiento es
          esperable porque la lista ya se ve larga.

          ⚠️ **Las tres filas se MIDEN, no se teclean**: el alto sale del
          primer chip real (`onLayout`) y las columnas del ancho disponible.
          *Un `maxHeight` en píxeles fijos se rompe con el tamaño de fuente del
          sistema, y se rompe en silencio: recorta media fila.* Hasta que haya
          medida, no hay tope — la lista se ve entera, que es el estado seguro. */}
      <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)} style={{ paddingHorizontal: spacing[4] }}>
        <ScrollView
          showsVerticalScrollIndicator={desborda}
          scrollEnabled={desborda}
          style={topeAlto !== null ? { maxHeight: topeAlto } : undefined}
          contentContainerStyle={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[4],
            paddingBottom: spacing[4],
          }}
        >
          {mascotas.map((m, i) => (
            <Pressable
              key={m.id}
              onPress={() => onElegir(m)}
              accessibilityRole="button"
              accessibilityLabel={m.nombre}
              onLayout={i === 0 ? (e) => setAltoChip(e.nativeEvent.layout.height) : undefined}
              style={{ alignItems: 'center', gap: spacing[2], width: ANCHO_CHIP }}
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
        </ScrollView>
      </View>
    </Hoja>
  );
}
