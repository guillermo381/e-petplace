/**
 * LA HOJA DEL PRECIO — §4 de la receta de la ficha Administrar.
 *
 * ── LA LEY QUE LA ORDENA ────────────────────────────────────────────────
 * > **ES UN CONTROL CON DOS RESULTADOS, JAMÁS DOS CONTROLES.**
 *
 * Firmado por mesa: **libre dentro de ±15 % de la referencia · fuera de la
 * banda, propone y espera.** *Si el vendedor tuviera que elegir entre
 * «cambiar» y «proponer», le estaríamos pidiendo que sepa de antemano de
 * qué lado de la banda cae — que es justo la cuenta que la app tiene que
 * hacer por él.*
 *
 * ── LOS TRES ESTADOS, Y NINGUNO SE VE IGUAL QUE OTRO ────────────────────
 * · **dentro de la banda** → cambia YA, y el rango se dice **antes de
 *   tocar**: *«podés moverte entre $X y $Y»*.
 * · **fuera de la banda** → queda PROPUESTO, **y se avisa ANTES de
 *   confirmar** (Ley 23). *No rechaza: cambia de resultado, y eso se
 *   avisa* — por eso el CTA cambia de palabra al cruzar el borde, en vez
 *   de dejar que el vendedor descubra el resultado al apretar.
 * · **sin referencia (`null`)** → todo va a aprobación, **y se dice**.
 *   ⚠️ Es la trampa exacta de `AvisoAlergia`: **el silencio se lee como
 *   permiso**. Un control que se ve «libre» y después manda todo a
 *   revisión miente dos veces — al ofrecer y al confirmar.
 *
 * ── LO QUE FALTA, Y NO ES OPCIONAL ──────────────────────────────────────
 * 📬 **Pedido a A: `precio_propuesto` en `SkuDelVendedor`** (medido: el
 * lector no lo trae). Sin él **no se puede pintar la propuesta pendiente
 * sobre el precio**, que la receta declara obligatoria: *un cambio que se
 * acepta y desaparece se lee como que se perdió, y la segunda vez el
 * vendedor deja de pedir.* El rebote del servidor sí lo dice al confirmar;
 * lo que falta es que **quede** dicho.
 */

import { useState } from 'react';
import { View } from 'react-native';
import { Boton, Campo, Hoja, HojaScroll, Texto, spacing, useAviso } from '@epetplace/ui';
import { actualizarPrecioOferta, type SkuDelVendedor } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export interface HojaPrecioProps {
  /** `null` = la Hoja no se monta. */
  ofertaId: string | null;
  /** De acá salen la referencia y la banda. `null` = sin SKU propio. */
  sku: SkuDelVendedor | null;
  /** Formateador de moneda del riel — la Hoja NO arma plata a mano. */
  plata: (n: number) => string;
  onCerrar: () => void;
  onGuardado: () => void;
}

export function HojaPrecio({ ofertaId, sku, plata, onCerrar, onGuardado }: HojaPrecioProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);

  const min = sku?.banda_min ?? null;
  const max = sku?.banda_max ?? null;
  const hayBanda = min !== null && max !== null;

  const valor = Number(texto.replace(',', '.'));
  const valido = Number.isFinite(valor) && valor > 0;
  /* 🔴 EL CÁLCULO QUE LA APP HACE POR ÉL. Sin banda **todo** cae afuera —
     fail-closed: *«todavía no calibramos» no puede leerse como «no hay
     límite»*. */
  const afuera = !hayBanda || (valido && (valor < min || valor > max));

  function limpiar() {
    setTexto('');
  }

  async function guardar() {
    if (guardando || ofertaId === null || !valido) return;
    setGuardando(true);
    const r = await actualizarPrecioOferta(ofertaId, valor);
    setGuardando(false);
    if (!r.ok) {
      /* El wrapper YA habla: `fuera_de_banda` trae la referencia y los dos
         extremos, y `sin_referencia_de_precio` dice que la propuesta quedó
         guardada. **No se compone una segunda voz acá** — el día que las
         dos divergieran nadie sabría cuál rige. */
      mostrar({ texto: r.mensaje, variante: 'error' });
      limpiar();
      onGuardado();
      return;
    }
    mostrar({ texto: t('ventas.precio.exito'), variante: 'exito' });
    limpiar();
    onGuardado();
  }

  return (
    <Hoja
      visible={ofertaId !== null}
      onCerrar={() => {
        if (guardando) return;
        limpiar();
        onCerrar();
      }}
      titulo={t('ventas.precio.titulo')}
      altura="media"
      pie={
        <>
          {/* LA VOZ CAMBIA ANTES DE CONFIRMAR, no después: el CTA dice qué
              va a pasar de este lado del borde. */}
          <Texto variante="apoyo">
            {hayBanda
              ? afuera && valido
                ? t('ventas.precio.avisoFuera')
                : t('ventas.precio.rango', { min: plata(min), max: plata(max) })
              : t('ventas.precio.sinReferencia')}
          </Texto>
          <Boton
            variante="primario"
            bloque
            cargando={guardando}
            deshabilitado={!valido}
            etiqueta={afuera ? t('ventas.precio.proponerCta') : t('ventas.precio.guardarCta')}
            onPress={() => void guardar()}
          />
        </>
      }
    >
      <HojaScroll>
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          {sku?.precio_referencia !== null && sku?.precio_referencia !== undefined && (
            <Texto variante="apoyo" color="secondary">
              {t('ventas.precio.referencia', { monto: plata(sku.precio_referencia) })}
            </Texto>
          )}
          <Campo
            label={t('ventas.precio.campo')}
            value={texto}
            onChangeText={setTexto}
            keyboardType="decimal-pad"
            deshabilitado={guardando}
          />
        </View>
      </HojaScroll>
    </Hoja>
  );
}
