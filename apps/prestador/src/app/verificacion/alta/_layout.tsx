/**
 * RUTA DE VERIFICACIÓN — el wizard de alta (S97-C).
 *
 * Vive acá y NO en la navegación del producto por la cláusula 1 del ciclo
 * de pantalla nueva (skill §1b-bis, enmienda S83 a la regla 80):
 * **UI real sin cablear → gate en dispositivo → cableado.**
 *
 * Las otras dos cláusulas, cumplidas y declaradas:
 *  · NO reemplaza pantalla viva — `registro`, `sala-espera`,
 *    `bienvenida-dia1` y `cuenta-comercial/nueva` siguen sirviendo al
 *    usuario tal cual hasta la firma.
 *  · NO se cablea hasta la firma. Los datos de esta rama son de MUESTRA
 *    y están marcados; el motor existe y está medido (ver el M1).
 */

import { Stack } from 'expo-router';

export default function LayoutAlta() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
