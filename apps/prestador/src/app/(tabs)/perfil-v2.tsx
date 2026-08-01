/**
 * PERFIL v2 — PANTALLA DE VERIFICACIÓN (S83-C10 · las CUATRO FIRMAS en
 * C13). Sigue en ruta de verificación: `cuenta/perfil` está viva.
 *
 * ═════ LAS CUATRO FIRMAS DEL FOUNDER EN DISPOSITIVO (S83-C13) ═════
 * ① LA BANDERA VA — emoji unicode desde `codigo_iso2`; su Android las
 *    dibuja. El defecto que reportó (no alineaba con el número) tenía
 *    causa de MÉTRICA y se curó en `SelectorPais`, no con un margen.
 * ② EL ESPEJO DEJA RASTRO — gate (a′) CERRADO: la fila compacta se pega
 *    al tope cuando el espejo se fue. Ya no se elige.
 * ③ AL ENTRAR SE ABRE LA PRIMERA INCOMPLETA — gate (d) CERRADO. Con la
 *    regla que ya rige: si TODO está completo, no se abre NINGUNA (la
 *    puerta no inventa trabajo que no hay — Ley 23).
 * ④ EL RÓTULO DE LO PERSONAL — gate (c) cerrado con "Tu cuenta" y
 *    ENMENDADO en C18 por la firma del tercer verbo: "Tu cuenta" pasó a
 *    ser el nombre de la TAB, así que la celda repetía a su contenedor.
 *    Hoy dice "Nombre y acceso" — provisional hasta el seccionado de
 *    Cuenta (S84).
 * Los cuatro rótulos de gate MURIERON con sus controles (Ley 37): ya no
 * se decide nada acá, y una pantalla que pregunta lo ya contestado
 * miente sobre su propio estado.
 *
 * ⑤ EL FOCUS (D-598) LLEGA POR TOKEN: `Campo` resuelve su borde de foco
 *    de `theme.accent.*`. Cuando B publique el sexto slot, esta pantalla
 *    NO cambia una línea — por eso no hay un solo color de foco acá.
 *
 * ① LA RUTA: molde de la galería (registrada, sin botón de tab). Su
 *    entrada vive al pie de Cuenta — `/gallery` del prestador es
 *    alcanzable solo por URL, y eso es L-161 exacta.
 * ② DATOS FALSOS PERO HONESTOS, del literal de la DB viva: `foto_url`
 *    NULL ⇒ el monograma REAL (PA) · `descripcion`/`telefono`/
 *    `email_contacto`/`sitio_web` NULL · `whatsapp` el ÚNICO cargado.
 *    CERO fetch, CERO wrappers, CERO escrituras.
 *
 * VOZ: textos LITERALES fuera del riel i18n — precedente exacto de la
 * entrada a la galería del cliente (herramienta de sesión con fecha de
 * retiro; las keys sobrevivirían a la deuda). El copy entra al lote
 * cuando la pantalla se firme y pase a producción.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  CeldaNavegacion,
  EvitaTeclado,
  Hoja,
  HojaScroll,
  Separador,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';

import { EspejoNegocio, RastroNegocio, SeccionDesplegable, SelectorPais } from '@/components/perfil-piezas';
import { useBarraEstadoClara } from '@/components/techo-oficio';

/* ─────────────────────────────────────────────────────────────────────
   cat_paises — las 23 filas MEDIDAS contra el proyecto vivo. EC es el
   único `activo`; los 22 restantes viajan con su prefijo real y su voz
   honesta. `formato` es el `formato_telefono` de la propia fila EC.
   ───────────────────────────────────────────────────────────────────── */
type Pais = { iso: string; nombre: string; pre: string; activo: boolean; formato?: string };
const PAISES: Pais[] = [
  { iso: 'AR', nombre: 'Argentina', pre: '+54', activo: false },
  { iso: 'BO', nombre: 'Bolivia', pre: '+591', activo: false },
  { iso: 'BR', nombre: 'Brasil', pre: '+55', activo: false },
  { iso: 'CA', nombre: 'Canadá', pre: '+1', activo: false },
  { iso: 'CL', nombre: 'Chile', pre: '+56', activo: false },
  { iso: 'CO', nombre: 'Colombia', pre: '+57', activo: false },
  { iso: 'CR', nombre: 'Costa Rica', pre: '+506', activo: false },
  { iso: 'CU', nombre: 'Cuba', pre: '+53', activo: false },
  { iso: 'DO', nombre: 'República Dominicana', pre: '+1', activo: false },
  { iso: 'EC', nombre: 'Ecuador', pre: '+593', activo: true, formato: '^\\+593\\d{8,9}$' },
  { iso: 'ES', nombre: 'España', pre: '+34', activo: false },
  { iso: 'GT', nombre: 'Guatemala', pre: '+502', activo: false },
  { iso: 'HN', nombre: 'Honduras', pre: '+504', activo: false },
  { iso: 'MX', nombre: 'México', pre: '+52', activo: false },
  { iso: 'NI', nombre: 'Nicaragua', pre: '+505', activo: false },
  { iso: 'PA', nombre: 'Panamá', pre: '+507', activo: false },
  { iso: 'PE', nombre: 'Perú', pre: '+51', activo: false },
  { iso: 'PR', nombre: 'Puerto Rico', pre: '+1', activo: false },
  { iso: 'PY', nombre: 'Paraguay', pre: '+595', activo: false },
  { iso: 'SV', nombre: 'El Salvador', pre: '+503', activo: false },
  { iso: 'US', nombre: 'Estados Unidos', pre: '+1', activo: false },
  { iso: 'UY', nombre: 'Uruguay', pre: '+598', activo: false },
  { iso: 'VE', nombre: 'Venezuela', pre: '+58', activo: false },
];

/** ① FIRMADA: la bandera sale del `codigo_iso2` — cada letra a su
 *  indicador regional. El toggle de C10 murió con el gate: el Android
 *  del founder las dibuja, y lo que quedaba por resolver era la
 *  alineación (curada en `SelectorPais`). */
const bandera = (iso: string): string =>
  String.fromCodePoint(...[...iso].map((c) => (c.codePointAt(0) ?? 0) + 127397));

type Seccion = 'portada' | 'contacto' | 'donde';

/* ── los datos, falsos pero honestos (sin fetch) ── */
const NOMBRE = 'Paseos Andres';
const LOGO_URL = null; // prestadores.foto_url = NULL, medido
const DESCRIPCION_INICIAL = ''; // NULL en DB
const TEL_INICIAL = ''; // NULL en DB
const WA_INICIAL = '999000333'; // el ÚNICO cargado

/** ③ "INCOMPLETA" con la regla que ya rige: una sección está incompleta
 *  cuando le falta el dato que la hace servir para algo. `donde` no
 *  entra: su dirección y su radio existen. Si NINGUNA está incompleta
 *  devuelve null — y entonces no se abre ninguna. */
function primeraIncompleta(descripcion: string, tel: string, wa: string): Seccion | null {
  if (descripcion.trim().length === 0) return 'portada';
  if (tel.trim().length === 0 || wa.trim().length === 0) return 'contacto';
  return null;
}

export default function PerfilV2() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  useBarraEstadoClara();

  const [descripcion, setDescripcion] = useState(DESCRIPCION_INICIAL);
  const [telNegocio, setTelNegocio] = useState(TEL_INICIAL);
  const [whatsapp, setWhatsapp] = useState(WA_INICIAL);
  const [emailContacto, setEmailContacto] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');

  /* ③ el estado inicial ES la primera incompleta — se computa UNA vez,
     al montar: si se recalculara en cada tecla, la sección se cerraría
     sola en el momento en que terminás de completarla. */
  const [abierta, setAbierta] = useState<Seccion | null>(() =>
    primeraIncompleta(DESCRIPCION_INICIAL, TEL_INICIAL, WA_INICIAL),
  );
  const [rastroVisible, setRastroVisible] = useState(false);
  const [paisDe, setPaisDe] = useState<'telNegocio' | 'whatsapp' | null>(null);
  const [paisTel, setPaisTel] = useState('EC');
  const [paisWa, setPaisWa] = useState('EC');

  /* ── la validación EN VIVO, contra el formato del catálogo ── */
  function estadoTelefono(valor: string, iso: string): { ok: boolean; voz: string } | null {
    const crudo = valor.replace(/[\s-]/g, '');
    if (crudo.length === 0) return null;
    const pais = PAISES.find((p) => p.iso === iso);
    if (pais === undefined) return null;
    const e164 = `${pais.pre}${crudo}`;
    if (pais.formato === undefined) {
      return { ok: true, voz: `${pais.nombre} no declara formato en el catálogo — no lo validamos.` };
    }
    const ok = new RegExp(pais.formato).test(e164);
    return {
      ok,
      voz: ok
        ? `se guarda ${e164}`
        : `Un número de ${pais.nombre} lleva 8 o 9 dígitos después de ${pais.pre}. Van ${crudo.length}.`,
    };
  }
  const vTel = estadoTelefono(telNegocio, paisTel);
  const vWa = estadoTelefono(whatsapp, paisWa);

  /* ── los resúmenes: la densidad de herramienta ── */
  const hayTel = telNegocio.trim().length > 0;
  const hayWa = whatsapp.trim().length > 0;
  const resumenContacto =
    hayTel && hayWa ? 'Teléfono y WhatsApp' : hayTel ? 'Solo teléfono' : hayWa ? 'Solo WhatsApp' : 'Sin contacto';
  const resumenPortada = descripcion.trim().length > 0 ? 'Con descripción' : 'Sin descripción';

  /* ── el vacío honesto: UNA línea con la consecuencia ── */
  const vacio =
    hayTel && hayWa
      ? null
      : !hayTel && !hayWa
        ? 'Una familia que te encuentra hoy no tiene cómo escribirte.'
        : hayTel
          ? 'Las familias pueden llamarte. Te falta el WhatsApp.'
          : 'Una familia que te encuentra hoy no tiene cómo escribirte: no cargaste teléfono, correo ni sitio. Tu WhatsApp sí está.';

  const alternar = (s: Seccion) => setAbierta((a) => (a === s ? null : s));
  const prefijoDe = (iso: string) => PAISES.find((p) => p.iso === iso)?.pre ?? '';
  const isoDe = paisDe === 'whatsapp' ? paisWa : paisTel;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* ② FIRMADO: el rastro. Vive FUERA del scroll — se pega al tope
          cuando el espejo se fue, y ya no se elige. */}
      {rastroVisible && <RastroNegocio nombre={NOMBRE} visible />}

      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={(e) => setRastroVisible(e.nativeEvent.contentOffset.y > 150)}
        >
          {/* EL ESPEJO — a sangre, arriba, y se va con el scroll */}
          <EspejoNegocio
            nombre={NOMBRE}
            logoUrl={LOGO_URL}
            tipo="paseador · quito"
            visible
            vacio={vacio}
            onEditarLogo={() => undefined}
          />

          <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
            {/* ── LAS CUATRO SECCIONES, en el orden firmado ── */}
            <SeccionDesplegable
              icono="negocio"
              titulo="Tu portada"
              resumen={resumenPortada}
              abierta={abierta === 'portada'}
              onAlternar={() => alternar('portada')}
            >
              <Texto variante="apoyo">Lo primero que lee una familia. Dos o tres líneas alcanzan.</Texto>
              <Campo
                label="Descripción"
                placeholder="Paseos tranquilos por el norte de Quito, grupos chicos y reporte con fotos."
                value={descripcion}
                onChangeText={setDescripcion}
                multilinea={3}
              />
            </SeccionDesplegable>

            <Separador />

            <SeccionDesplegable
              titulo="Cómo te contactan"
              resumen={resumenContacto}
              abierta={abierta === 'contacto'}
              onAlternar={() => alternar('contacto')}
            >
              {/* SIN GLIFO, decisión declarada: el registry no tiene
                  contacto/telefono/correo/sitio (medido). Antes que
                  prestar uno que miente, ninguno — el glifo se pide con
                  su gate por ícono a 21px (§6b). */}
              <Texto variante="apoyo">
                Son datos del negocio y los ven las familias. Tu teléfono personal vive en Cuenta.
              </Texto>

              <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-end' }}>
                <SelectorPais
                  bandera={bandera(paisTel)}
                  prefijo={prefijoDe(paisTel)}
                  onPress={() => setPaisDe('telNegocio')}
                />
                <View style={{ flex: 1 }}>
                  <Campo
                    label="Teléfono del negocio"
                    placeholder="99 123 4567"
                    value={telNegocio}
                    onChangeText={setTelNegocio}
                    keyboardType="phone-pad"
                    ayuda={vTel?.ok === true ? vTel.voz : undefined}
                    error={vTel?.ok === false ? vTel.voz : undefined}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-end' }}>
                <SelectorPais
                  bandera={bandera(paisWa)}
                  prefijo={prefijoDe(paisWa)}
                  onPress={() => setPaisDe('whatsapp')}
                />
                <View style={{ flex: 1 }}>
                  <Campo
                    label="WhatsApp"
                    placeholder="99 900 0333"
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                    keyboardType="phone-pad"
                    ayuda={vWa?.ok === true ? vWa.voz : undefined}
                    error={vWa?.ok === false ? vWa.voz : undefined}
                  />
                </View>
              </View>

              <Campo
                label="Correo de contacto"
                placeholder="hola@paseosandres.ec"
                value={emailContacto}
                onChangeText={setEmailContacto}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Campo
                label="Sitio web"
                placeholder="paseosandres.ec"
                value={sitioWeb}
                onChangeText={setSitioWeb}
                autoCapitalize="none"
              />
            </SeccionDesplegable>

            <Separador />

            <SeccionDesplegable
              icono="ubicacion"
              titulo="Dónde atendés"
              resumen="Quito · 5 km"
              abierta={abierta === 'donde'}
              onAlternar={() => alternar('donde')}
            >
              <Texto variante="apoyo">Se guarda sola: no espera al botón de abajo.</Texto>
              <Celda
                titulo="Av. República del Salvador y Suecia, local 3"
                subtitulo="Quito · Ecuador"
                interactiva
                accessibilityRole="button"
                onPress={() => undefined}
              />
              <Separador />
              <Celda
                titulo="Radio de cobertura"
                subtitulo="Fuera de ese radio no te ofrecemos."
                metadataMono="5 km"
                interactiva
                accessibilityRole="button"
                onPress={() => undefined}
              />
            </SeccionDesplegable>

            <Separador />

            {/* ④ EL RÓTULO, ENMENDADO POR LA FIRMA DEL TERCER VERBO
                (S83-C18). El gate (c) había elegido "Tu cuenta" — y con
                CUENTA firmada como verbo, ése pasó a ser el nombre de la
                TAB: la celda repetía el rótulo de su propio contenedor y
                no decía nada de su contenido.
                **"Nombre y acceso"** dice lo que hay adentro, medido
                contra el contenido real (nombre · correo de ingreso ·
                cambiar clave · cambiar correo): uno es identidad y tres
                son acceso, así que el rótulo nombra los dos ejes y
                ninguno de más. Cumple 17.6 —el label rotula, el detalle
                demuestra— y deja de competir con la tab.
                ⚠️ PROVISIONAL DECLARADO: el definitivo se firma con el
                seccionado de Cuenta en S84, donde este bloque va a tener
                vecinos (plata, preferencias) y el rótulo se elige contra
                ellos, no solo. */}
            <CeldaNavegacion
              icono="cuenta"
              titulo="Nombre y acceso"
              detalle="Tu nombre, tu correo de ingreso y tu contraseña. No los ven las familias."
              registro="aa"
              onPress={() => undefined}
            />

            <View style={{ paddingTop: spacing[5], gap: spacing[3] }}>
              <Boton etiqueta="Guardar" bloque onPress={() => undefined} />
              <Texto variante="dato">pantalla de verificación · datos falsos · nada se guarda</Texto>
              <Boton variante="compacto" etiqueta="Volver" onPress={() => router.back()} />
            </View>
          </View>
        </ScrollView>
      </EvitaTeclado>

      {/* ── La Hoja del país: 23 filas reales, EC único activo ── */}
      <Hoja visible={paisDe !== null} onCerrar={() => setPaisDe(null)} titulo="País del número">
        <View style={{ paddingBottom: spacing[2] }}>
          <Texto variante="apoyo">
            El indicativo es un dato aparte del número: su slot es profiles.telefono_codigo_pais. Hoy solo Ecuador está
            activo; los demás están cargados y apagados.
          </Texto>
        </View>
        <HojaScroll>
          {PAISES.map((p, i) => (
            <View key={p.iso}>
              {i > 0 ? <Separador /> : null}
              {/* Ley 23 — la puerta no ofrece lo que va a rechazar: el
                  país apagado NO es tocable, y lo dice en su subtítulo. */}
              {p.activo ? (
                <Celda
                  titulo={`${bandera(p.iso)}  ${p.nombre}`}
                  metadataMono={p.pre}
                  interactiva
                  accessibilityRole="button"
                  onPress={() => {
                    if (paisDe === 'whatsapp') setPaisWa(p.iso);
                    else setPaisTel(p.iso);
                    setPaisDe(null);
                  }}
                  fin={p.iso === isoDe ? <Texto variante="dato">elegido</Texto> : undefined}
                />
              ) : (
                <Celda titulo={`${bandera(p.iso)}  ${p.nombre}`} subtitulo="todavía no" metadataMono={p.pre} />
              )}
            </View>
          ))}
        </HojaScroll>
      </Hoja>
    </View>
  );
}
