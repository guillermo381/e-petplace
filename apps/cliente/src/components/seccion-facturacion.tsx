/**
 * S115-C · «DATOS PARA TU FACTURA» — **se pregunta UNA vez y se recuerda**
 * (firma del founder sobre la forma, 10-sep-2026).
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 🔴 LA REGLA MADRE: NADA DE VOLVER A PREGUNTAR EN CADA COMPRA.           │
 * │                                                                         │
 * │ Con datos guardados el checkout muestra UNA línea —«Factura a: … »— y  │
 * │ nada más. *Un formulario fiscal repetido en cada compra convierte un    │
 * │ trámite de una vez en un peaje permanente.*                             │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * **LOS TRES ESTADOS, y el tope decide entre dos de ellos:**
 *
 * | hay perfil | total vs tope | qué se ve |
 * |---|---|---|
 * | **sí** | — | la línea compacta + «Cambiar» |
 * | no | **sobre** el tope | el selector, con «Consumidor final» DESHABILITADA y su razón — no se puede pagar sin declararlos |
 * | no | **bajo** el tope | nada; se paga como consumidor final + enlace discreto |
 *
 * 🔴 **EL CASO BAJO EL TOPE NO PREGUNTA NADA.** Es la mitad que se olvida:
 * *ofrecer el formulario «por si acaso» en una compra de $12 es exactamente la
 * fricción que la regla madre viene a matar.* El enlace queda a un lado para
 * quien lo quiera, y no interrumpe a nadie.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ **EL TOPE VIENE POR PROPS Y ESO ES DELIBERADO.** No lo lee esta pieza ni
 * lo escribe: lo recibe. `app_config.fiscal_tope_consumidor_final` **todavía no
 * tiene lector en la puerta única** (pedido a A, sale en su tanda) — y hasta que
 * lo tenga, quien monte esto no tiene de dónde sacarlo. *Escribir `50` acá sería
 * el número de plata en el cliente que la casa prohíbe, y encima uno que la ley
 * mueve.* El día que exista el lector, el cableado es una línea en el checkout:
 * esta pieza no cambia.
 *
 * 🔴 **UN SOLO PERFIL, y «Cambiar» SOBRESCRIBE** (firma del founder). La puerta
 * devuelve uno (`TaxProfile | null`) y esta pieza no finge que hay varios.
 * *Listar perfiles es otro producto —y otra puerta— y dibujar una lista de uno
 * promete una elección que no existe.*
 *
 * **CHANEL (Ley 16):** se quitó el título de sección cuando hay perfil guardado.
 * Con una sola línea que ya dice «Factura a», un encabezado arriba sería el
 * elemento que rotula lo que el contenido ya dijo (Ley 17.6).
 */
import { useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  CampoIdentificacion,
  SelectorFacturacion,
  Texto,
  spacing,
  type DatosIdentificacion,
  type ModoFacturacion,
} from '@epetplace/ui';
import type { TaxProfile } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

const VACIO: DatosIdentificacion = {
  tipo: 'cedula',
  identificacion: '',
  razonSocial: '',
  direccion: '',
  email: '',
};

export interface SeccionFacturacionProps {
  /** El perfil guardado. `null` = todavía no declaró ninguno. */
  perfil: TaxProfile | null;
  /** El total de la compra, para compararlo con el tope. */
  total: number;
  /** 🔴 Por props: la ley lo mueve y esta pieza no lo lee. Ver la cabecera. */
  topeConsumidorFinal: number;
  /** El tope ya formateado — el formateo de plata es del riel, no de acá. */
  topeFormateado: string;
  /** Lo que el checkout necesita saber para cobrar y para emitir. */
  onCambiar: (v: { modo: ModoFacturacion; datos: DatosIdentificacion | null; guardar: boolean }) => void;
  /** ⚠️ Nace apagado: afirmar que un gasto es deducible es una afirmación fiscal. */
  mostrarDeducible?: boolean;
  /** Para la línea compacta: el nombre de la persona cuando el perfil no es RUC. */
  nombrePersona?: string | null;
}

export function SeccionFacturacion({
  perfil,
  total,
  topeConsumidorFinal,
  topeFormateado,
  onCambiar,
  mostrarDeducible = false,
  nombrePersona,
}: SeccionFacturacionProps) {
  const { t } = useTraduccion();

  /* `editando` es lo que separa «ya lo dijo» de «lo está diciendo». Con perfil
     guardado nace en false —la línea compacta— y «Cambiar» lo abre. */
  const [editando, setEditando] = useState(false);
  const [modo, setModo] = useState<ModoFacturacion>(perfil ? 'misDatos' : 'consumidorFinal');
  const [guardar, setGuardar] = useState(true);
  const [datos, setDatos] = useState<DatosIdentificacion>(
    /* El perfil precargado, cuando se puede representar. `consumidor_final` vive
       en `TaxProfile` y NO en `TipoIdentificacion`: ahí significa «no declaró
       identificación propia» ⇒ el formulario arranca en blanco, que es la
       verdad. */
    perfil && perfil.tipoIdentificacion !== 'consumidor_final'
      ? {
          tipo: perfil.tipoIdentificacion,
          identificacion: perfil.identificacion,
          razonSocial: perfil.razonSocial ?? '',
          direccion: perfil.direccion ?? '',
          email: perfil.email ?? '',
        }
      : VACIO,
  );

  const sobreElTope = total > topeConsumidorFinal;

  const avisar = (parche: Partial<{ modo: ModoFacturacion; datos: DatosIdentificacion; guardar: boolean }>) => {
    const m = parche.modo ?? modo;
    const d = parche.datos ?? datos;
    const g = parche.guardar ?? guardar;
    onCambiar({ modo: m, datos: m === 'misDatos' ? d : null, guardar: g });
  };

  /* ① YA LO DIJO — una línea y nada más. */
  if (perfil && !editando) {
    /* El nombre: la razón social manda cuando existe (es el nombre fiscal); si
       no, el de la persona. Ninguno de los dos se inventa — si faltan los dos,
       la línea muestra sólo la identificación, que es el dato que sí existe. */
    const nombre = perfil.razonSocial ?? nombrePersona ?? null;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <View style={{ flex: 1 }}>
          <Texto variante="apoyo">{t('facturacionCheckout.facturaA')}</Texto>
          <Texto variante="cuerpo">
            {nombre === null ? perfil.identificacion : `${nombre} · ${perfil.identificacion}`}
          </Texto>
        </View>
        <Boton
          variante="compacto"
          etiqueta={t('facturacionCheckout.cambiar')}
          onPress={() => setEditando(true)}
        />
      </View>
    );
  }

  /* ③ BAJO EL TOPE Y SIN DATOS — no se pregunta nada. */
  if (!perfil && !sobreElTope && !editando) {
    return (
      <Boton
        variante="ghost"
        etiqueta={t('facturacionCheckout.quieresFactura')}
        onPress={() => {
          setEditando(true);
          setModo('misDatos');
          avisar({ modo: 'misDatos' });
        }}
      />
    );
  }

  /* ② EL SELECTOR — primera compra sobre el tope, o «Cambiar», o el enlace.
     🔴 Sobre el tope, `SelectorFacturacion` apaga «Consumidor final» y DICE su
     razón con el número que le pasamos. No se puede pagar sin declararlos, y la
     pieza lo explica en vez de dejar un control muerto. */
  return (
    <SelectorFacturacion
      elegido={modo}
      onElegir={(m) => {
        setModo(m);
        avisar({ modo: m });
      }}
      total={total}
      topeConsumidorFinal={topeConsumidorFinal}
      topeFormateado={topeFormateado}
      guardar={guardar}
      onGuardar={(g) => {
        setGuardar(g);
        avisar({ guardar: g });
      }}
      mostrarDeducible={mostrarDeducible}
      acento="control"
    >
      <CampoIdentificacion
        valor={datos}
        onCambiar={(d) => {
          setDatos(d);
          avisar({ datos: d });
        }}
        acento="control"
      />
    </SelectorFacturacion>
  );
}
