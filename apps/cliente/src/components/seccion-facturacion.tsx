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
 * **LOS TRES ESTADOS (firma ENMENDADA por el founder, 11-sep):**
 *
 * | hay perfil | total vs tope | qué se ve |
 * |---|---|---|
 * | **sí** | — | la línea compacta + «Cambiar». **No se vuelve a pedir.** |
 * | no | bajo el tope | **el selector: se PREGUNTA si quiere factura con sus datos** |
 * | no | **sobre** el tope | el selector con «Consumidor final» DESHABILITADA y su razón — **se le PIDEN**, y sin ellos no se cobra |
 *
 * ⏪ **ENMIENDA, y la letra vieja queda acá porque explica qué se probó:** hasta
 * hoy, bajo el tope **no se preguntaba nada** y quedaba un enlace discreto al
 * costado. La razón era buena —*ofrecer el formulario «por si acaso» en una
 * compra de $12 es fricción*— **y el founder la corrigió sobre el producto: el
 * enlace no alcanza.** Alguien que quiere su factura no debería tener que
 * descubrir un enlace para pedirla.
 *
 * ⇒ **Sin perfil, el selector se muestra SIEMPRE.** Lo único que cambia con el
 * tope es si «Consumidor final» está disponible — y eso ya lo resuelve la pieza
 * de B con su razón escrita. *Un solo camino en vez de dos, que además es menos
 * código.*
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Campo,
  esCorreoValido,
  useAviso,
  CampoIdentificacion,
  SelectorFacturacion,
  Texto,
  spacing,
  type DatosIdentificacion,
  type ModoFacturacion,
} from '@epetplace/ui';
import {
  fiscalTopeConsumidorFinal,
  fiscalObtenerTaxProfile,
  fiscalGuardarTaxProfile,
  obtenerMiPerfil,
  type TaxProfile,
} from '@epetplace/api';
import { formatearPrecio } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

const VACIO: DatosIdentificacion = {
  tipo: 'cedula',
  identificacion: '',
  razonSocial: '',
  direccion: '',
  email: '',
};

/* ☠️ ACÁ VIVÍA UN CUARTO REGEX DE CORREO. Murió con `esCorreoValido` de B
   (S115-B): **la validación de la casa es UNA**, y el suyo es más estricto que
   el mío — rechaza `a@b.` y `a@.b`, que el mío aceptaba. *Entre dos que ya
   viven, gana la que rechaza más: el costo de rebotar un correo raro es que la
   persona lo corrija; el de aceptarlo es que no le llegue la factura.*

   🔴 **`esCorreoValido` NO hace `trim()`, y es a propósito** (letra de B): un
   correo con espacios al borde **es** un correo mal escrito, y limpiarlo en
   silencio esconde el error donde la función existe para mostrarlo. ⇒ acá se
   limpia **ANTES y A LA VISTA**, al tipear: la persona ve que el espacio no
   quedó, en vez de que se lo perdonemos por dentro. */
export const correoSirve = esCorreoValido;

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
  /** 🔴 El correo al que va la factura. **Obligatorio para poder cobrar** — sin
   *  él la compra se paga y el comprobante no tiene a dónde ir. Se precarga con
   *  el de la cuenta y la persona puede cambiarlo. */
  correo: string;
  onCorreo: (v: string) => void;
}

export function SeccionFacturacion({
  perfil,
  total,
  topeConsumidorFinal,
  topeFormateado,
  onCambiar,
  mostrarDeducible = false,
  nombrePersona,
  correo,
  onCorreo,
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

  /* `tocado` separa «todavía no lo escribió» de «lo escribió mal»: sin él el
     campo nace en rojo al montarse vacío (mismo criterio que la pieza de B). */
  const [correoTocado, setCorreoTocado] = useState(false);
  const correoMal = correoTocado && !correoSirve(correo);

  /* 🔴 VA SIEMPRE, ELIJA LO QUE ELIJA — y ése es el punto entero. El email que
     `CampoIdentificacion` trae adentro vive DENTRO de «Con mis datos»: quien
     paga como consumidor final no pasa por él y se quedaría sin comprobante.
     *El correo no es un dato fiscal: es la dirección a la que va el papel.*

     ⚠️ Con «Con mis datos» elegido, la pieza de B dibuja su propio campo de
     correo y se ve dos veces. **No divergen** —los dos escriben el mismo
     estado— pero es redundancia visible: pedido a B una prop para apagar el
     suyo, y el día que llegue esta nota se borra con ella. */
  const campoCorreo = (
    <View style={{ gap: spacing[2] }}>
      <Texto variante="seccion">{t('correoFactura.pregunta')}</Texto>
      <Campo
        label={t('correoFactura.etiqueta')}
        placeholder={t('correoFactura.formato')}
        value={correo}
        /* Saneo A LA VISTA: los espacios no entran, y la persona lo ve
           mientras escribe. Es lo que la letra de B pide de quien tolere el
           pegado — limpiar ANTES, nunca por dentro al validar. */
        onChangeText={(v) => onCorreo(v.replace(/\s/g, ''))}
        onBlur={() => setCorreoTocado(true)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={correoMal ? t('correoFactura.invalido') : undefined}
        ayuda={correoMal ? undefined : t('correoFactura.ayuda')}
      />
    </View>
  );

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
      <View style={{ gap: spacing[5] }}>
      {campoCorreo}
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
      </View>
    );
  }

  /* ② EL SELECTOR — toda primera compra, y «Cambiar».
     🔴 Sobre el tope, `SelectorFacturacion` apaga «Consumidor final» y DICE su
     razón con el número que le pasamos. No se puede pagar sin declararlos, y la
     pieza lo explica en vez de dejar un control muerto. */
  return (
    <View style={{ gap: spacing[5] }}>
    {campoCorreo}
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
        /* 🔴 `sinCorreo` (B, S115-B): apaga SU campo porque el correo ya vive
           arriba y hace falta elija lo que elija. **Su modo de falla es
           silencioso —también deja de validarlo—** y por eso la validación de
           esta pantalla es `esCorreoValido`, la misma de la casa. */
        sinCorreo
        valor={datos}
        onCambiar={(d) => {
          setDatos(d);
          avisar({ datos: d });
        }}
        acento="control"
      />
    </SelectorFacturacion>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EL HOOK — porque son SEIS pantallas de cobro, no una.

   🔴 **El censo encontró seis puertas al mismo hueco**, y el mandato nombraba
   una: despensa, paquete de paseo, plan de paseo, guardería (×2), programa de
   adiestramiento, y las citas de los cuatro oficios. *Curar la que se reportó y
   no censar la clase es media cura — y la otra mitad se descubre con plata de
   por medio.*

   Cablear seis veces el mismo estado, la misma carga y el mismo freno es la
   receta exacta de la divergencia que esta casa ya se cobró con los cuatro logs
   (19.9: «lo que se copia, diverge»). ⇒ **una pieza, seis consumidores.**

   Lo que la pantalla hace es: `const f = useFacturacion(activo)` · montar
   `<SeccionFacturacion {...f.props} />` · y llamar `await f.validarYGuardar()`
   antes de cobrar. Nada más.
   ═════════════════════════════════════════════════════════════════════════ */

export interface FacturacionLista {
  /** `null` mientras el tope no se sepa: la sección NO se monta (fail-closed). */
  props: Omit<SeccionFacturacionProps, 'total'> | null;
  /** 🔴 Se llama ANTES de cobrar. `false` = no se cobra, y ya avisó por qué. */
  validarYGuardar: () => Promise<boolean>;
}

export function useFacturacion(activo: boolean): FacturacionLista {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const [tope, setTope] = useState<number | null>(null);
  const [perfil, setPerfil] = useState<TaxProfile | null>(null);
  const [nombrePersona, setNombrePersona] = useState<string | null>(null);
  const [correo, setCorreo] = useState('');
  const [eleccion, setEleccion] = useState<Parameters<SeccionFacturacionProps['onCambiar']>[0] | null>(null);

  /* ═══ 🔴 EL ESPEJO VIVO — la cura del defecto que el founder encontró pagando
     ═══ (11-sep-2026). **El correo estaba en pantalla y el guard lo veía vacío.**

     La causa NO era la precarga: el estado se escribía bien y el campo lo
     pintaba. Era un **closure capturado**. `pagar` de la pantalla es un
     `useCallback` que no lista `facturacion` en sus deps, así que conserva el
     `validarYGuardar` del PRIMER render — el que cerró sobre `correo = ''`. La
     precarga llega después, el estado cambia, el campo se repinta… *y el guard
     sigue mirando la foto del primer render.*

     ⇒ **Los guards leen un espejo vivo, jamás el render capturado** (la cura
     que S92 firmó para el P0 del paseo, misma clase). Con el `ref`, la función
     es inmune a quién la haya capturado y cuándo.

     *Se cura acá y no pidiéndole deps a cinco pantallas: una regla que hay que
     recordar en cada consumidor es una regla que alguien va a olvidar — y su
     modo de falla es que no se puede cobrar.* */
  const correoVivo = useRef('');
  const eleccionVivo = useRef<Parameters<SeccionFacturacionProps['onCambiar']>[0] | null>(null);
  correoVivo.current = correo;
  eleccionVivo.current = eleccion;

  useEffect(() => {
    if (!activo) return;
    let vigente = true;
    void (async () => {
      const [rTope, rPerfil, rYo] = await Promise.all([
        fiscalTopeConsumidorFinal(),
        fiscalObtenerTaxProfile(),
        obtenerMiPerfil(),
      ]);
      if (!vigente) return;
      /* Fail-closed: sin tope NO se cae a 50. Un tope inventado decide en cada
         compra si a alguien se le piden sus datos. */
      if (rTope.ok) setTope(rTope.data);
      if (rPerfil.ok) setPerfil(rPerfil.data);
      if (rYo.ok) setNombrePersona(rYo.data.nombre);
      /* La precarga NO pisa lo ya escrito si la lectura llega tarde, y el correo
         del perfil FISCAL manda sobre el de la cuenta: es el que la persona
         eligió para sus facturas. */
      const sugerido = (rPerfil.ok && rPerfil.data?.email) || (rYo.ok && rYo.data.email) || '';
      if (sugerido) setCorreo((v) => (v.trim().length > 0 ? v : sugerido));
    })();
    return () => { vigente = false; };
  }, [activo]);

  const validarYGuardar = useCallback(async () => {
    /* ① El correo, siempre. Sin él la compra se paga y el comprobante no tiene
       a dónde ir. */
    const correoAhora = correoVivo.current;
    if (!correoSirve(correoAhora)) {
      mostrar({ variante: 'error', texto: t('correoFactura.falta') });
      return false;
    }
    /* ② El perfil, sólo si lo declaró en ESTA compra y pidió recordarlo. Se
       guarda ANTES de cobrar porque el motor resuelve el receptor al confirmar
       el pago: después sería emitir con lo viejo. */
    const eleccionAhora = eleccionVivo.current;
    if (eleccionAhora?.modo === 'misDatos' && eleccionAhora.datos && eleccionAhora.guardar) {
      const g = await fiscalGuardarTaxProfile({
        tipoIdentificacion: eleccionAhora.datos.tipo,
        identificacion: eleccionAhora.datos.identificacion,
        razonSocial: eleccionAhora.datos.razonSocial.trim() || null,
        direccion: eleccionAhora.datos.direccion.trim() || null,
        email: correoAhora.trim(),
        predeterminado: true,
      });
      /* Si el servidor rebota NO se cobra: la familia pidió factura con sus
         datos y cobrar igual emitiría a consumidor final sin avisarle. */
      if (!g.ok) {
        mostrar({ variante: 'error', texto: g.mensaje });
        return false;
      }
    }
    return true;
    /* Sin `correo` ni `eleccion` en deps A PROPÓSITO: se leen del espejo. Si
       estuvieran, la función se recrearía y volveríamos a depender de que cada
       pantalla la vuelva a capturar — que es exactamente el defecto. */
  }, [mostrar, t]);

  return {
    props:
      tope === null
        ? null
        : {
            perfil,
            topeConsumidorFinal: tope,
            topeFormateado: formatearPrecio(tope),
            nombrePersona,
            correo,
            onCorreo: setCorreo,
            onCambiar: setEleccion,
          },
    validarYGuardar,
  };
}
