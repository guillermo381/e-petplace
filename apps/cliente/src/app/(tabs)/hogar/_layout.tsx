/**
 * Stack del tab Hogar (S51 cierre, decisión founder (a)): el Perfil de
 * mascota vive DENTRO de la pila del Hogar — los tabs quedan visibles
 * y el back es natural (pop del stack, no salto de navigator).
 */

import { Stack } from 'expo-router';

export default function HogarStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
