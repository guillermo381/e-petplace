/**
 * Guards de params de ruta (S45-B4) — las pantallas son URL-reconstruibles,
 * así que los params son entrada NO confiable: se validan por type guard,
 * jamás con `as` a ciegas (regla 34).
 */

import type { AvatarMascotaEspecie } from '@epetplace/ui';
import type { PrecisionFechaNacimiento } from '@epetplace/api';

// Espejo del TIPO del design system (los 11 códigos de cat_especies,
// S44-B2.3) — no es un catálogo de producto (regla 21: ese vive en DB).
const CODIGOS_UI: readonly AvatarMascotaEspecie[] = [
  'perro', 'gato', 'conejo', 'ave', 'roedor', 'cobaya', 'pez', 'huron', 'reptil', 'otro', 'equino',
];

export function esEspecieUi(codigo: string | undefined): codigo is AvatarMascotaEspecie {
  return codigo !== undefined && (CODIGOS_UI as readonly string[]).includes(codigo);
}

const PRECISIONES: readonly PrecisionFechaNacimiento[] = ['exacta', 'aproximada', 'estimada'];

export function esPrecision(v: string | undefined): v is PrecisionFechaNacimiento {
  return v !== undefined && (PRECISIONES as readonly string[]).includes(v);
}

export type SexoMascota = 'macho' | 'hembra' | 'desconocido';

const SEXOS: readonly SexoMascota[] = ['macho', 'hembra', 'desconocido'];

export function esSexo(v: string | undefined): v is SexoMascota {
  return v !== undefined && (SEXOS as readonly string[]).includes(v);
}
