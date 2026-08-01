/**
 * PERFIL v2 — PANTALLA DE VERIFICACIÓN (S83-C10). NO ES PRODUCCIÓN.
 *
 * ① Vive donde el founder la alcanza y NO reemplaza nada: el molde es
 *    `(tabs)/gallery` — ruta registrada en el layout SIN botón de tab.
 *    `cuenta/perfil` sigue intacta y funcionando hasta la firma.
 *    ⚠️ CORRECCIÓN AL MOLDE, medida: en el prestador `/gallery` está
 *    "viva por URL" y NO tiene entrada (el cliente sí la tiene, D-580 —
 *    `cuenta/index.tsx:148`). Copiar el molde al pie de la letra habría
 *    dejado esta pantalla INALCANZABLE, que es L-161 exacta. Por eso se
 *    agrega su entrada al pie de Cuenta, con su deuda de retiro.
 *
 * ② DATOS FALSOS PERO HONESTOS — del literal de la lámina v2, que salió
 *    de la DB viva: `foto_url` NULL ⇒ el monograma REAL (PA) ·
 *    `descripcion`/`telefono`/`email_contacto`/`sitio_web` NULL ·
 *    `whatsapp = 593999000333` es el ÚNICO cargado. CERO fetch, CERO
 *    wrappers, CERO escrituras: nada de acá toca la DB.
 *
 * ③ Piezas de `packages/ui` en todo lo que existe. LA QUE FALTA está
 *    declarada en `components/perfil-piezas.tsx`: no hay encabezado de
 *    sección que despliegue (⌄/⌃). La cura propuesta es ensanchar
 *    `CeldaNavegacion` con el `direccion` que `FilaCita` ya tiene.
 *
 * ④ FIRMADO Y NO SE REDISCUTE: el orden de las cuatro secciones ·
 *    desplegables ⌄/⌃ (E14) · pantalla desde arriba y todo scrolleable ·
 *    el espejo presidiendo · densidad de herramienta.
 *
 * ⑤/⑥ LOS GATES SE JUEGAN CON EL DEDO: (a′) el rastro · (d) qué abre al
 *    entrar · (c) el rótulo de lo personal · y el toggle de BANDERA, que
 *    en el teléfono del founder dice la verdad de una vez.
 *
 * VOZ: los textos van LITERALES, fuera del riel i18n — precedente
 * EXACTO de la entrada a la galería del cliente: *"es una herramienta de
 * sesión con fecha de retiro, y meterle keys al diccionario dejaría
 * basura que sobrevive a la deuda"*. Cuando la pantalla se firme y pase
 * a producción, su copy entra al lote de strings con su gate.
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
  SelectorOpcion,
  Separador,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';

import { EspejoNegocio, RastroNegocio, SeccionDesplegable } from '@/components/perfil-piezas';
import { useBarraEstadoClara } from '@/components/techo-oficio';

/* ─────────────────────────────────────────────────────────────────────
   cat_paises — las 23 filas MEDIDAS contra el proyecto vivo
   (zyltipqscdsdsxnjclhp). EC es el único `activo`; los 22 restantes
   viajan con su prefijo real y su voz honesta. El `formato` es el
   `formato_telefono` de la propia fila EC — no una regex escrita acá.
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

/** ⑥ La bandera SALE del `codigo_iso2` — el mismo cálculo que haría la
 *  app real: cada letra a su indicador regional. El GLIFO lo pone la
 *  fuente del SISTEMA (la app carga solo DM Sans y JetBrains Mono, y
 *  ninguna trae banderas): iOS las dibuja, Android históricamente
 *  muestra las dos letras. El toggle deja que el teléfono lo conteste. */
const banderaEmoji = (iso: string): string =>
  String.fromCodePoint(...[...iso].map((c) => (c.codePointAt(0) ?? 0) + 127397));

type Seccion = 'portada' | 'contacto' | 'donde';
type ModoApertura = 'cerradas' | 'incompleta';

const ROTULOS_PERSONAL = ['Tus datos personales', 'Vos', 'Tu cuenta'] as const;

export default function PerfilV2() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  useBarraEstadoClara();

  /* ── los datos, falsos pero honestos (② — sin fetch) ── */
  const NOMBRE = 'Paseos Andres';
  const LOGO_URL = null; // prestadores.foto_url = NULL, medido
  const [descripcion, setDescripcion] = useState(''); // NULL en DB
  const [telNegocio, setTelNegocio] = useState(''); // NULL en DB
  const [whatsapp, setWhatsapp] = useState('999000333'); // el ÚNICO cargado
  const [emailContacto, setEmailContacto] = useState(''); // NULL en DB
  const [sitioWeb, setSitioWeb] = useState(''); // NULL en DB

  /* ── estado de la pantalla ── */
  const [abierta, setAbierta] = useState<Seccion | null>(null);
  const [modoApertura, setModoApertura] = useState<ModoApertura>('cerradas');
  const [conRastro, setConRastro] = useState(true);
  const [rastroVisible, setRastroVisible] = useState(false);
  const [rotuloPersonal, setRotuloPersonal] = useState<string>(ROTULOS_PERSONAL[0]);
  const [banderaReal, setBanderaReal] = useState(true);
  const [paisDe, setPaisDe] = useState<'telNegocio' | 'whatsapp' | null>(null);
  const [paisTel, setPaisTel] = useState('EC');
  const [paisWa, setPaisWa] = useState('EC');

  const pintarBandera = (iso: string) => (banderaReal ? banderaEmoji(iso) : iso);

  /* ── la validación EN VIVO, contra el formato del catálogo ── */
  function estadoTelefono(valor: string, iso: string): { e164: string; ok: boolean; voz: string } | null {
    const crudo = valor.replace(/[\s-]/g, '');
    if (crudo.length === 0) return null;
    const pais = PAISES.find((p) => p.iso === iso);
    if (pais === undefined) return null;
    const e164 = `${pais.pre}${crudo}`;
    if (pais.formato === undefined) {
      return { e164, ok: true, voz: `${pais.nombre} no declara formato en el catálogo — no lo validamos.` };
    }
    const ok = new RegExp(pais.formato).test(e164);
    return {
      e164,
      ok,
      voz: ok
        ? `se guarda ${e164}`
        : `Un número de ${pais.nombre} lleva 8 o 9 dígitos después de ${pais.pre}. Van ${crudo.length}.`,
    };
  }
  const vTel = estadoTelefono(telNegocio, paisTel);
  const vWa = estadoTelefono(whatsapp, paisWa);

  /* ── los resúmenes: la densidad de herramienta (⑤) ── */
  const hayTel = telNegocio.trim().length > 0;
  const hayWa = whatsapp.trim().length > 0;
  const resumenContacto = hayTel && hayWa ? 'teléfono · whatsapp' : hayTel ? 'solo teléfono' : hayWa ? 'solo whatsapp' : 'sin contacto';
  const resumenPortada = descripcion.trim().length > 0 ? 'con descripción' : 'sin descripción';

  /* ── el vacío honesto: UNA línea con la consecuencia ── */
  const vacio =
    hayTel && hayWa
      ? null
      : !hayTel && !hayWa
        ? 'Una familia que te encuentra hoy no tiene cómo escribirte.'
        : hayTel
          ? 'Las familias pueden llamarte. Te falta el WhatsApp.'
          : 'Una familia que te encuentra hoy no tiene cómo escribirte: no cargaste teléfono, correo ni sitio. Tu WhatsApp sí está.';

  function alternar(s: Seccion) {
    setAbierta((a) => (a === s ? null : s));
  }
  function aplicarApertura(modo: ModoApertura) {
    setModoApertura(modo);
    if (modo === 'cerradas') setAbierta(null);
    else setAbierta(descripcion.trim().length === 0 ? 'portada' : hayTel && hayWa ? null : 'contacto');
  }

  const isoDe = paisDe === 'whatsapp' ? paisWa : paisTel;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* ② el rastro (gate a′) — sobre el scroll, no dentro */}
      {conRastro && rastroVisible && <RastroNegocio nombre={NOMBRE} visible />}

      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={(e) => setRastroVisible(e.nativeEvent.contentOffset.y > 150)}
        >
          {/* ① ② EL ESPEJO — a sangre, arriba, y se va con el scroll */}
          <EspejoNegocio
            nombre={NOMBRE}
            logoUrl={LOGO_URL}
            tipo="paseador · quito"
            visible
            vacio={vacio}
            onEditarLogo={() => undefined}
          />

          <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
            {/* ⑤ LOS GATES, primeros y jugables con el dedo */}
            <View style={{ gap: spacing[3], paddingBottom: spacing[4] }}>
              <Texto variante="seccion">Gates abiertos</Texto>

              <View style={{ gap: spacing[1] }}>
                <Texto variante="apoyo">
                  (a′) El espejo scrollea — eso ya lo firmaste. ¿Deja un rastro pegado al tope, o se va del todo?
                </Texto>
                <SelectorOpcion
                  etiqueta="El rastro"
                  etiquetaVisible={false}
                  acento="oficio"
                  opciones={[
                    { codigo: 'si', etiqueta: 'Deja rastro' },
                    { codigo: 'no', etiqueta: 'Se va del todo' },
                  ]}
                  seleccionada={conRastro ? 'si' : 'no'}
                  onSelect={(c) => setConRastro(c === 'si')}
                />
              </View>

              <View style={{ gap: spacing[1] }}>
                <Texto variante="apoyo">(d) Al entrar: ¿todas cerradas, o se abre sola la primera incompleta?</Texto>
                <SelectorOpcion
                  etiqueta="Qué abre al entrar"
                  etiquetaVisible={false}
                  acento="oficio"
                  opciones={[
                    { codigo: 'cerradas', etiqueta: 'Todas cerradas' },
                    { codigo: 'incompleta', etiqueta: 'La incompleta' },
                  ]}
                  seleccionada={modoApertura}
                  onSelect={(c) => aplicarApertura(c === 'incompleta' ? 'incompleta' : 'cerradas')}
                />
              </View>

              <View style={{ gap: spacing[1] }}>
                <Texto variante="apoyo">
                  (⑥) La bandera: tu teléfono contesta si el emoji se dibuja o salen las dos letras.
                </Texto>
                <SelectorOpcion
                  etiqueta="La bandera"
                  etiquetaVisible={false}
                  acento="oficio"
                  opciones={[
                    { codigo: 'emoji', etiqueta: 'Bandera' },
                    { codigo: 'letras', etiqueta: 'Dos letras' },
                  ]}
                  seleccionada={banderaReal ? 'emoji' : 'letras'}
                  onSelect={(c) => setBanderaReal(c === 'emoji')}
                />
              </View>
            </View>

            <Separador />

            {/* ── LAS CUATRO SECCIONES, en el orden firmado ── */}
            <SeccionDesplegable
              icono="negocio"
              titulo="Tu portada"
              resumen={resumenPortada}
              pendiente={descripcion.trim().length === 0}
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
              pendiente={!(hayTel && hayWa)}
              abierta={abierta === 'contacto'}
              onAlternar={() => alternar('contacto')}
            >
              {/* ④ SIN GLIFO, y es decisión declarada: el registry NO
                  tiene glifo de contacto/teléfono/correo/sitio (32
                  nombres, medido). Antes que prestar uno que miente, la
                  sección va sin glifo — un glifo nuevo se pide con su
                  gate por ícono a 21px (§6b), no se improvisa. */}
              <Texto variante="apoyo">
                Son datos del negocio y los ven las familias. Tu teléfono personal vive en Cuenta.
              </Texto>

              <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-end' }}>
                <View style={{ flex: 0 }}>
                  <Boton
                    variante="compacto"
                    etiqueta={`${pintarBandera(paisTel)}  ${PAISES.find((p) => p.iso === paisTel)?.pre ?? ''}`}
                    onPress={() => setPaisDe('telNegocio')}
                  />
                </View>
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
                <View style={{ flex: 0 }}>
                  <Boton
                    variante="compacto"
                    etiqueta={`${pintarBandera(paisWa)}  ${PAISES.find((p) => p.iso === paisWa)?.pre ?? ''}`}
                    onPress={() => setPaisDe('whatsapp')}
                  />
                </View>
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
              resumen="quito · 5 km"
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

            {/* ④ LO PERSONAL: NAVEGA ⇒ `CeldaNavegacion` con su `›`.
                El contraste de E14 se ve en una sola pantalla: las tres
                de arriba despliegan ⌄, ésta lleva ›. */}
            <CeldaNavegacion
              icono="cuenta"
              titulo={rotuloPersonal}
              detalle="Tu nombre, tu teléfono y tu correo de ingreso. No los ven las familias."
              registro="aa"
              onPress={() => undefined}
            />

            <View style={{ gap: spacing[1], paddingTop: spacing[3] }}>
              <Texto variante="apoyo">(c) El rótulo de esa fila cuando aterrice en Cuenta:</Texto>
              <SelectorOpcion
                etiqueta="El rótulo"
                etiquetaVisible={false}
                acento="oficio"
                disposicion="grilla"
                opciones={ROTULOS_PERSONAL.map((r) => ({ codigo: r, etiqueta: r }))}
                seleccionada={rotuloPersonal}
                onSelect={(c) => setRotuloPersonal(c)}
              />
            </View>

            <View style={{ paddingTop: spacing[5], gap: spacing[3] }}>
              <Boton etiqueta="Guardar" bloque onPress={() => undefined} />
              <Texto variante="dato">
                pantalla de verificación · datos falsos · nada se guarda
              </Texto>
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
                  país apagado NO es tocable (no es un tap que "no hace
                  nada"), y lo dice con voz honesta en su subtítulo. */}
              {p.activo ? (
                <Celda
                  titulo={`${pintarBandera(p.iso)}  ${p.nombre}`}
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
                <Celda
                  titulo={`${pintarBandera(p.iso)}  ${p.nombre}`}
                  subtitulo="todavía no"
                  metadataMono={p.pre}
                />
              )}
            </View>
          ))}
        </HojaScroll>
      </Hoja>
    </View>
  );
}
