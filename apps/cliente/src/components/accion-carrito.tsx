/**
 * ⭐ **S116-C lote 8 · EL CARRITO DE LAS CABECERAS RAÍZ — una sola vez.**
 *
 * Firma del founder: *«el carrito en las cabeceras raíz (verificá que en
 * checkout no aparece)»*.
 *
 * ── 🔴 POR QUÉ ESTO EXISTE Y NO SE USA LA PROP DE B ────────────────────────
 * B entregó `carrito` como prop de `Cabecera` (lote 10), **con la adenda
 * resuelta por construcción**: se dibuja sólo en `variante="raiz"`, y
 * carrito/pago/confirmación son **empujadas** ⇒ *una lista de excepciones hay
 * que mantenerla; eso no.* Perfecto — y **alcanza a UNA sola raíz del cliente**.
 *
 * **Medido**: de las cinco raíces, **sólo Hogar monta `Cabecera`**
 * (`hogar/index.tsx:1135`, `variante="raiz"`). Explorar, Actividad, Cuenta y
 * Despensa montan **`Encabezado variante="portada"`**, que **no tiene la prop**.
 *
 * ⇒ Hogar usa la prop de B. Las otras cuatro usan su slot `accionDer` con esta
 * pieza, que es **el mismo montaje que la Despensa ya tenía desde el lote 3i**
 * — no se inventa un mecanismo: se deja de copiarlo cuatro veces.
 *
 * ⚠️ **Y esto muere el día que `Encabezado` gane `carrito`** (pedido a B en el
 * buzón): ahí las cuatro colapsan en la prop y este archivo se borra. *Se
 * escribe sabiendo que es un puente, y con el nombre de su orilla.*
 *
 * ── LO QUE CONSERVA DEL MONTAJE VIEJO, PORQUE YA ESTABA DECIDIDO ──────────
 * · **Permanente, con o sin unidades**: un carrito vacío sin puerta deja sin
 *   forma de ver qué hay adentro ni de volver.
 * · **El contador aparece sólo cuando hay algo**: *un «0» sobre la canasta es
 *   ruido con forma de dato.*
 */
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { GlifoConContador } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';
import { unidadesEnCarrito, useCarrito } from '@/lib/despensa/carrito';

export function AccionCarrito() {
  const { t } = useTraduccion();
  const carrito = useCarrito();
  const unidades = unidadesEnCarrito(carrito);
  return (
    <Pressable
      onPress={() => router.push('/despensa/carrito')}
      accessibilityRole="button"
      accessibilityLabel={t('despensa.abrirCarrito', { n: unidades })}
      hitSlop={8}
    >
      <GlifoConContador nombre="carrito" cuenta={unidades} dentroDeTocable />
    </Pressable>
  );
}
