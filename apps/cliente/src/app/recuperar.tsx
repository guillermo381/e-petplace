/**
 * RECUPERAR LA CONTRASEÑA — la del CLIENTE (S103-C).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ 🔴 CIERRA EL HUECO QUE YO MISMA DECLARÉ AL MONTAR «SEGURIDAD».       │
 * │                                                                      │
 * │ Ahí escribí: *«esto PUENTEA el hueco, no lo cierra — la familia      │
 * │ solo-Google sigue sin poder crearse una clave sola»*, y por eso su   │
 * │ salida iba a soporte. **Hoy la salida apunta acá.**                  │
 * │                                                                      │
 * │ ⚠️ **Las dos puntas se cierran en el MISMO acto** (orden de mesa):   │
 * │ esta pantalla y el botón de `cuenta/seguridad` que la apunta. *Una   │
 * │ sola de las dos deja una promesa colgada — o una pantalla que nadie  │
 * │ alcanza, o un botón que va a una ruta que no existe.*                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── HEREDADA DEL PRESTADOR, VERBATIM DONDE APLICA ────────────────────────
 * `apps/prestador/src/app/recuperar.tsx` es el molde: **tres pasos**, la
 * sesión fantasma cerrada en el desmontaje, el campo que se limpia al pedir
 * otro código, y las voces —que ya estaban en tuteo neutro—.
 *
 * **Todo lo que sigue vale igual acá y no se re-deriva** (su porqué completo
 * vive en la cabecera del prestador, y se cita en vez de copiarse):
 * · **DOS PASOS Y NO UN FORMULARIO** (D-659): el token se verifica UNA vez y
 *   la clave se reintenta sin volver a tocarlo.
 * · **Nunca se declara si un correo existe** — la misma frase exista o no,
 *   **y el flujo avanza igual**: si se quedara en el paso 1 cuando el correo
 *   no existe, *el comportamiento delataría lo que el mensaje calla.*
 * · **`codigo_invalido` cubre «no existe» y «venció» con UNA voz.**
 * · **El largo se IMPORTA** (`LARGO_CODIGO_RECUPERACION`, `MIN_LARGO_CONTRASENA`)
 *   — el «6 vs 8» nació de dos pantallas hardcodeando su propia verdad.
 *
 * ── 🔴 LAS DIFERENCIAS CON EL PRESTADOR, Y CADA UNA CON SU MEDICIÓN ──────
 *
 * **① SIN `MarcaDeAgua`.** Medido: el cliente **no la usa en `login` ni en
 * `registro`** (grep = 0), que son sus pantallas hermanas fuera de tabs.
 * *Heredarla habría metido un elemento de la casa del prestador en una
 * superficie que no lo tiene — copiar el molde en vez de mirar el destino,
 * que es lo que `L-368` nombra.*
 *
 * **② LA ENTRADA DESDE EL LOGIN NACE CON ESTO, y no es un extra.** Medido:
 * `apps/cliente/src/app/login.tsx` **no ofrecía ninguna salida** —solo
 * «Entrar»—. **Y esta pantalla la usa justamente QUIEN NO PUDO ENTRAR:** sin
 * esa entrada, la única puerta sería Cuenta, alcanzable solo por quien ya
 * está adentro. *Una pantalla de recuperación que exige haber entrado no
 * recupera nada.*
 *
 * ⚠️ **③ EL AVISO DEL CORREO EN INGLÉS SE CONSERVA, y se declara por qué:**
 * `D-628` sigue **🟠 abierta** en el canon (medido: su ficha dice que las
 * plantillas las revisa el founder, y no hay registro de cierre). *No medí
 * el correo real desde el cliente — heredo la advertencia del prestador,
 * porque el costo de decirlo de más es una línea y el de callarlo es que la
 * persona crea que no llegó y gaste su cupo de 2-3 por hora.*
 * ☠️ Muere con `D-628`, no por su cuenta.
 */

import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, Campo, CampoCodigo, Encabezado, EvitaTeclado, Texto, spacing, useAviso, useTheme } from '@epetplace/ui';
import {
  LARGO_CODIGO_RECUPERACION,
  MIN_LARGO_CONTRASENA,
  cerrarSesion,
  establecerContrasenaNueva,
  pedirCodigoRecuperacion,
  segundosDeEspera,
  verificarCodigoRecuperacion,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** El largo del código de recuperación.
 *
 *  ✅ **LA CONDICIÓN QUE ESTA MISMA PANTALLA DEJÓ ESCRITA SE CUMPLIÓ** (S92-BIS):
 *  decía *«si A la exporta algún día, este número y las tres voces se cuelgan de
 *  ahí»*, y hoy `LARGO_CODIGO_RECUPERACION` vive en `packages/api`, junto a
 *  `MIN_LARGO_CONTRASENA`. El número deja de estar en cuatro lugares (acá + las
 *  tres voces, ×2 idiomas) y pasa a estar en uno.
 *
 *  Se conserva el alias local **solo** para no reescribir los tres usos de
 *  abajo: la fuente es el import, no esta línea. */
const LARGO_CODIGO = LARGO_CODIGO_RECUPERACION;

export default function Recuperar() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();

  /** Tres pasos y no tres pantallas: el correo tiene que seguir visible
   *  cuando se tipea el código — es el dato que dice a dónde mirar. */
  const [paso, setPaso] = useState<'pedir' | 'codigo' | 'clave'>('pedir');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [rebote, setRebote] = useState<string | null>(null);

  /* LA SESIÓN FANTASMA, cerrada en el desmontaje: `verifyOtp` deja sesión
     al verificar (es la que autoriza el paso 2 — el diseño, no un
     accidente). Pero si la persona se va SIN completar, esa sesión no es
     de nadie: quedaría logueada sin haberlo pedido. Refs y no estado:
     el cleanup corre en el desmontaje y necesita el valor VIVO, no el de
     la clausura del primer render. */
  const verificadoRef = useRef(false);
  const completadoRef = useRef(false);
  useEffect(
    () => () => {
      if (verificadoRef.current && !completadoRef.current) void cerrarSesion();
    },
    [],
  );

  /** El rate limit es el ÚNICO rebote que puede salir al pedir, y NO
   *  habla del correo: habla de quien pide. Por eso su voz nunca puede
   *  leerse como "ese correo tiene algo raro". */
  function vozEspera(mensaje: string): string {
    const s = segundosDeEspera(mensaje);
    return s === null ? t('recuperar.esperaSinNumero') : t('recuperar.esperaConNumero', { s });
  }

  async function pedir() {
    if (trabajando) return;
    setRebote(null);
    setTrabajando(true);
    const r = await pedirCodigoRecuperacion({ email });
    setTrabajando(false);
    if (!r.ok) {
      setRebote(r.codigo === 'demasiados_intentos' ? vozEspera(r.mensaje) : r.mensaje);
      return;
    }
    /* ⭐ S88-C (D-659 🔴, literal founder): PEDIR UNO NUEVO LIMPIA EL CAMPO.
       El reenvío emite un código NUEVO que invalida el tipeado — dejarlo
       puesto arma el bucle: la persona ve el campo lleno, toca verificar,
       rebota «inválido», pide otro, y el campo sigue lleno del muerto.
       Con las cajas el amplificador es peor: OCHO llenas se leen como
       «ya está» y el botón se ofrece habilitado sobre un código que el
       servidor va a rechazar seguro. La voz del rebote la dice el wrapper
       (r.mensaje); acá se corta el bucle en la raíz: campo limpio. */
    setCodigo('');
    /* SE PASA AL SEGUNDO PASO EXISTA LA CUENTA O NO — y ése es el punto
       entero. Si la pantalla se quedara acá cuando el correo no existe,
       el propio FLUJO delataría lo que el mensaje calla. La ambigüedad
       tiene que estar en el comportamiento, no solo en las palabras.
       (El reenvío YA vive en este mismo paso — «Enviar otro código» no
       obliga a volver atrás, que es el otro brazo del bucle.) */
    setPaso('codigo');
  }

  /** PASO 1 → 2: el token se toca UNA vez, acá y nunca más. */
  async function verificar() {
    if (trabajando) return;
    setRebote(null);
    setTrabajando(true);
    const r = await verificarCodigoRecuperacion({ email, codigo });
    setTrabajando(false);
    if (!r.ok) {
      setRebote(r.codigo === 'demasiados_intentos' ? vozEspera(r.mensaje) : r.mensaje);
      return;
    }
    verificadoRef.current = true;
    setPaso('clave');
  }

  /** PASO 2: reintentable — un rebote de clave JAMÁS vuelve al código. */
  async function cambiar() {
    if (trabajando) return;
    setRebote(null);
    setTrabajando(true);
    const r = await establecerContrasenaNueva({ nueva });
    setTrabajando(false);
    if (!r.ok) {
      setRebote(r.codigo === 'demasiados_intentos' ? vozEspera(r.mensaje) : r.mensaje);
      return;
    }
    completadoRef.current = true;
    mostrar({ variante: 'exito', texto: t('recuperar.listo') });
    // la sesión del paso 1 es la que queda: se entra derecho, sin
    // pedirle que vuelva a escribir la clave que acaba de elegir.
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('recuperar.titulo')} atras onAtras={() => router.back()} />
      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[8], gap: spacing[2] }}
          keyboardShouldPersistTaps="handled"
        >
          {paso === 'pedir' ? (
            <>
              <Texto variante="apoyo">{t('recuperar.ayudaPedir', { n: LARGO_CODIGO })}</Texto>
              <Campo
                label={t('recuperar.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {rebote !== null && <Texto variante="apoyo" color="danger">{rebote}</Texto>}
              <View style={{ paddingTop: spacing[4] }}>
                <Boton etiqueta={t('recuperar.pedir')} bloque cargando={trabajando} onPress={() => void pedir()} />
              </View>
            </>
          ) : paso === 'codigo' ? (
            <>
              {/* LA MISMA FRASE EXISTA O NO LA CUENTA. El condicional está
                  en el "si", no en nuestro conocimiento. */}
              <Texto variante="cuerpo">{t('recuperar.siTieneCuenta', { email, n: LARGO_CODIGO })}</Texto>
              {/* D-628 — se dice ANTES de que lo busque, no después de que
                  crea que no llegó. */}
              <Texto variante="apoyo">{t('recuperar.avisoCorreo')}</Texto>

              {/* Las cajas por dígito (S88-B). El rebote viaja por su
                  prop `error` — PieDeCampo lo anuncia (liveRegion) y las
                  cajas se pintan danger sin gritar: la anatomía de B, no
                  una línea suelta abajo. */}
              <CampoCodigo
                largo={LARGO_CODIGO}
                valor={codigo}
                onCambio={setCodigo}
                etiqueta={t('recuperar.codigo', { n: LARGO_CODIGO })}
                error={rebote ?? undefined}
                deshabilitado={trabajando}
              />
              <View style={{ paddingTop: spacing[4], gap: spacing[2] }}>
                {/* `valor.length === largo` es de la pantalla (contrato de
                    la pieza): un código incompleto NO se ofrece a verificar
                    — el server lo va a rechazar seguro (Ley 23). */}
                <Boton
                  etiqueta={t('recuperar.verificar')}
                  bloque
                  cargando={trabajando}
                  deshabilitado={codigo.length !== LARGO_CODIGO}
                  onPress={() => void verificar()}
                />
                {/* Pedir otro NO vuelve al paso anterior: el correo ya
                    está bien y volver le haría re-tipearlo. */}
                <Boton
                  variante="secundario"
                  etiqueta={t('recuperar.otroCodigo')}
                  bloque
                  cargando={trabajando}
                  onPress={() => void pedir()}
                />
              </View>
            </>
          ) : (
            <>
              {/* El código ya quedó atrás: este paso habla SOLO de la
                  clave, y sus rebotes se resuelven acá — el token no
                  vuelve a tocarse (D-659, el punto de la partición). */}
              <Texto variante="cuerpo">{t('recuperar.codigoVerificado')}</Texto>
              <Campo
                label={t('recuperar.nueva')}
                value={nueva}
                onChangeText={setNueva}
                secure
                autoCapitalize="none"
                /* la regla viene del wrapper — el hardcodeo «Al menos 8»
                   murió con el «6 vs 8» de registro (regla única). */
                ayuda={t('recuperar.largoMinimo', { n: MIN_LARGO_CONTRASENA })}
              />
              {rebote !== null && <Texto variante="apoyo" color="danger">{rebote}</Texto>}
              <View style={{ paddingTop: spacing[4] }}>
                <Boton etiqueta={t('recuperar.cambiar')} bloque cargando={trabajando} onPress={() => void cambiar()} />
              </View>
            </>
          )}
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
