/**
 * CUENTA — el índice del ciclo §3.5 (S55-B3, sobre el stub S51-B2.5).
 * Mapa: Tu perfil · Tu familia · Preferencias · Pagos · Ayuda y
 * legales · Sesión y cuenta (cerrar sesión + eliminar cuenta con voz
 * honesta — letra (a): visible, espec P15 en docs, jamás borra hoy).
 * Escalera: esta pantalla no muestra datos del expediente (índice puro).
 */

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { abrirAltaDeTarjeta } from '@/lib/pagos/alta-tarjeta';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  useAviso,
  Encabezado,
  Hoja,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { cerrarSesion } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
    >
      {texto}
    </Text>
  );
}

/**
 * S101-B · P1 — LA CONFIG DE PAGOS.
 *
 * 🔴 La celda del gate se dibuja SOLO si esto existe (condición de mesa).
 *    Sin URL, `abrirAltaDeTarjeta()` devolvería `sin_url_configurada` DESPUÉS
 *    de que la persona ya tocó — y una entrada que se ofrece y no puede abrir
 *    nada es peor que ninguna: se toca, no pasa nada, y el que la tocó no sabe
 *    si falló él o la app.
 */
const HAY_CONFIG_PAGOS = Boolean(process.env.EXPO_PUBLIC_PAGOS_ALTA_URL);

export default function Cuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  /**
   * S101-B · ANDAMIO DEL GATE. Corre el alta y **dice lo que leyó del
   * SERVIDOR**, jamás lo que trajo la URL de retorno.
   *
   * 🔴 El caso ③ vive en el `pendiente`: al volver sin completar, el alta
   *    SIGUE ABIERTA y eso es lo que se muestra. *Decir «abandonada» acá
   *    sería deducirla del retorno del navegador — y eso confundiría que la
   *    persona cerró la ventana con que el alta de verdad venció.*
   */
  async function correrAltaDeTarjeta() {
    const r = await abrirAltaDeTarjeta();
    if (!r.ok) mostrar({ texto: t('cuenta.altaNoAbrio'), variante: 'error' });
    /* 🔴 El desenlace NO se resuelve acá: lo dice la pantalla del WebView
       releyendo el servidor cuando la vista se cierra. *Esperarlo en este
       punto obligaría a aguardar un evento que puede no llegar nunca — el
       cuelgue que esta sesión ya pagó una vez.* */
  }


  const [salirAbierta, setSalirAbierta] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [eliminarAbierta, setEliminarAbierta] = useState(false);

  // S58 (D-361): el freno del grupo se LEVANTA — el lote 3 trae los
  // íconos y las entradas hablan la Ley 19.1 (perfil usa la chapita
  // 'cuenta'; la dirección usa el pin 'ubicacion').
  const lugares = [
    { etiqueta: t('cuenta.perfil'), ruta: '/cuenta/perfil' as const, icono: 'cuenta' as const },
    { etiqueta: t('direccion.titulo'), ruta: '/cuenta/direccion' as const, icono: 'ubicacion' as const },
    { etiqueta: t('cuenta.familia'), ruta: '/cuenta/familia' as const, icono: 'familia' as const },
    // S89-D orden 7 ②: la casa de los papeles de TODA la familia (el
    // perfil de cada mascota conserva los suyos, plegados).
    // S91-B (firma founder 8-ago-2026): esta fila deja de prestar
    // `documento` y consume el suyo. `documento` es UNA cédula con retrato
    // y acá se entra a DÓNDE VIVEN LOS PAPELES — el plural es la
    // diferencia, y el glifo apilado la dibuja. Con esto `documento` baja
    // de TRIPLE a doble turno (le quedan `historia_clinica` y
    // `ficha_identidad` en `lib/papeles.ts`, que es otra decisión abierta).
    { etiqueta: t('documentos.titulo'), ruta: '/cuenta/documentos' as const, icono: 'documentos' as const },
    /* 🔴 S100c-D · «TUS PEDIDOS» GANA SU ENTRADA ACÁ — deuda abierta desde
     * S100b, declarada sin dueño (*«la tabla de B era exacta: ahí no
     * está»*), y el founder la nombró de nuevo en este gate: **mientras no
     * haya pedidos, el acceso vive en Cuenta.**
     *
     * **Va SIN condición, y se declara:** ofrecerla solo con pedidos exige
     * que Cuenta cuente pedidos —una petición más en una pantalla que hoy
     * no lee nada— y **el peldaño 0 de «Tus pedidos» ya está construido**:
     * su estado vacío tiene voz, camino a la despensa y la entrada al
     * reclamo del local. *Una puerta que abre a un vacío que sabe hablar no
     * es una puerta que rebota* (Ley 23). Si la mesa firma la quinta tab,
     * esta fila puede quedarse igual: Cuenta es el cajón de todo. */
    { etiqueta: t('despensa.tusPedidos'), ruta: '/pedidos' as const, icono: 'despensa' as const },
    { etiqueta: t('cuenta.preferencias'), ruta: '/cuenta/preferencias' as const, icono: 'preferencias' as const },
    { etiqueta: t('cuenta.pagos'), ruta: '/cuenta/pagos' as const, icono: 'pagos' as const },
    /* 🔴 «Medios de pago» es OTRA cosa que «Pagos»: aquélla es el historial de
       lo que pagaste; ésta es CON QUÉ pagás. *Meterlas en una sola pantalla
       mezclaría un registro con una configuración.*

       🔴 `D-877` · **Y HASTA HOY LAS DOS COSAS DISTINTAS SE VEÍAN IGUAL QUE
       UNA TERCERA:** esta fila llevaba `preferencias`, el mismo glifo que
       «Preferencias» — *el comentario de arriba se toma el trabajo de
       explicar que son cosas distintas y el glifo decía lo contrario*.
       `bancario` es el dato: **con qué pagás**. La distinción queda en los
       tres: `pagos` = el historial · `bancario` = el instrumento ·
       `preferencias` = cómo querés que se comporte la app. */
    { etiqueta: t('cuenta.medios'), ruta: '/cuenta/medios' as const, icono: 'bancario' as const },
    /* 🔴 S103-C · LA PUERTA QUE FALTABA. El motor de contraseña vive en
       `packages/api` desde S84 y **su único consumidor era el prestador**:
       una familia no tenía NINGÚN camino para cambiar su clave. *No faltaba
       motor, faltaba esta fila.*
       Mismo glifo (`seguros`) y misma ruta relativa que en el prestador —
       **la misma función para el mismo humano se busca en el mismo lugar.** */
    { etiqueta: t('seguridad.tituloPantalla'), ruta: '/cuenta/seguridad' as const, icono: 'seguros' as const },
    { etiqueta: t('cuenta.ayuda'), ruta: '/cuenta/ayuda' as const, icono: 'ayuda' as const },
    /* S74 — ENTRADA TEMPORAL del gate de la fusión del avatar (la lámina
       se juzga en DISPOSITIVO: Chromium aplica borderCurve y no puede
       desmentir el engaño que produjo). MUERE con la firma del founder,
       junto a la lámina (Ley 37 — precedente lámina S73).

       🔴 `D-878` · **SE DECLARA COMO LO QUE ES, igual que la galería.** Vive
       en la superficie real sin `__DEV__`, y **no se mató**: su comentario
       ata su muerte a una firma del founder que **no puedo verificar desde
       acá** — *retirar un instrumento de gate antes de su gate es peor que
       dejarlo visible un día más*. Lo que sí se cura hoy es que **no decía
       que no era producto**.

       🔴 `D-877` · **Y LLEVA EL MISMO GLIFO QUE LA GALERÍA A PROPÓSITO** —
       no es la repetición que la ley prohíbe: **es la marca de una CLASE**.
       Las dos son herramientas de sesión con fecha de retiro, las dos lo
       dicen en su `detalle`, y **que se vean iguales entre sí y distintas
       del resto es exactamente lo que hay que comunicar.** *Buscarle un
       cuarto glifo por prolijidad las habría disfrazado de filas de
       producto, que es el defecto que `D-878` nombra.* */
    {
      etiqueta: t('cuenta.laminaFusion'),
      ruta: '/lamina-fusion' as const,
      icono: 'lapiz' as const,
      detalle: 'herramienta de sesión — no es pantalla de producto',
    },
  ];

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}>
        <Encabezado variante="portada" saludo={t('cuenta.titulo')} />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          <Tarjeta relleno="ninguno">
            {lugares.map((lugar, i) => (
              <View key={lugar.ruta}>
                {i > 0 ? <Separador /> : null}
                <CeldaNavegacion
                  icono={lugar.icono}
                  titulo={lugar.etiqueta}
                  /* `D-878`: solo las herramientas de sesión traen `detalle`,
                     y por eso se pregunta por presencia en vez de agregarle
                     `undefined` a las nueve filas de producto. */
                  detalle={'detalle' in lugar ? lugar.detalle : undefined}
                  onPress={() => router.push(lugar.ruta)}
                />
              </View>
            ))}
          </Tarjeta>

          {/* ☠️ S101-B · FASE 5 — LA CELDA DEL GATE MURIÓ ACÁ (Ley 37).
              Existió para que el founder pudiera ejercitar el mecanismo del
              alta antes de que hubiera pantalla, y **nació declarando que
              moría con el gate**. El gate pasó y la pantalla real existe:
              «Medios de pago» vive en el grupo de arriba, con su lista, su
              alta al tocar y su borrado con doble confirmación.
              *Un andamio que sobrevive a su obra deja de ser andamio y pasa a
              ser una segunda puerta que nadie mantiene.* ── */}

          {/* ── Sesión y cuenta ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('cuenta.sesion')} />
            {/* 🔴 `D-879` · **19.7 APLICADA: por superficie UNA caja, el resto
                baja a label.** Acá había dos botones apilados y el de abajo
                era `compacto` — **borde + fondo transparente**, que es
                literalmente *la caja vacía del medio* que la 19.7 mató.

                **Cerrar sesión conserva la caja** porque es la acción real de
                esta zona. **Eliminar cuenta baja a label** — y no es solo
                obediencia a la ley: *es una acción destructiva e
                irreversible, y darle el mismo peso visual que a cerrar sesión
                la invitaba.* **Sin chevron, porque EJECUTA y no navega.**

                ✅ **De paso muere un uso de la variante jubilada `compacto`**
                ⇒ `R47` baja de 38 a 37. *La regla es solo-baja y muere en 0.* */}
            <Boton variante="secundario" etiqueta={t('ajustes.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
            <Boton variante="ghost" etiqueta={t('cuenta.eliminarCuenta')} bloque onPress={() => setEliminarAbierta(true)} />
          </View>

          {/* ── S74-A · EL MARCADOR RENDERIZADO (L-160 enmendada / L-161):
              el [update] era SOLO console.log — logcat-only, inalcanzable
              para el founder sin cable. La identidad del build gana
              PANTALLA (receta de B, 0225701 — las dos apps no divergen).
              Voz de máquina (Ley 3); id corto = primeros 8 del updateId
              (único por publicación); embebido/dev se dice honesto.
              Camino literal: tab Cuenta → el pie. ── */}
          {/* S81-B2 (pedido a A, espejo del prestador): el lanzamiento
              EMBEBIDO de un release tiene updateId NO-nulo (el id de
              assets/app.manifest — acá sería "update 05fe7534"). El
              discriminador es isEmbeddedLaunch, no la nulidad (L-160). */}
          <Texto variante="dato">
            {/* S89 orden 7: EL SELLO — id corto + canal + FECHA del update.
                Verificar un bundle = leer este código; ningún diagnóstico de
                OTA vuelve a empezar por «¿qué bundle corre?». */}
            {!Updates.isEmbeddedLaunch && Updates.updateId !== null
              ? `update ${Updates.updateId.slice(0, 8)} · ${Updates.channel ?? 'sin canal'}${
                  Updates.createdAt
                    ? ` · ${String(Updates.createdAt.getDate()).padStart(2, '0')}/${String(
                        Updates.createdAt.getMonth() + 1,
                      ).padStart(2, '0')} ${String(Updates.createdAt.getHours()).padStart(2, '0')}:${String(
                        Updates.createdAt.getMinutes(),
                      ).padStart(2, '0')}`
                    : ''
                }`
              /* 🔴 S103-C · LOS DOS CASOS SE SEPARAN — antes decían lo mismo.
               *
               * ⏪ Este fallback era **`'bundle embebido / dev'` para los dos**:
               * el bundle horneado en la APK **y** Metro sirviendo una rama
               * cualquiera. *El discriminador ya existía en la línea de arriba
               * (`isEmbeddedLaunch`) y el pie lo tiraba a la basura.*
               *
               * **Y costó casi un veredicto falso, medido hoy:** la pista A
               * tomó el aparato mientras C tenía Metro corriendo desde su
               * worktree, leyó `bundle embebido / dev` e **iba a reportar que
               * su gate corría sobre el bundle de la APK. Era el de C.**
               *
               * *`L-336`: un objeto verosímil del origen equivocado no se caza
               * leyendo mejor — A leyó bien, y el pie contestó bien una
               * pregunta más angosta que la que el gate necesita.* **El
               * marcador nació (L-160) para decir QUÉ corre sin cable, y en el
               * único caso peligroso decía lo mismo que en el inocente.** */
              : Updates.isEmbeddedLaunch
                ? 'bundle embebido'
                : 'metro · dev'}
          </Texto>

          {/* ── S82-B r13 · LA ENTRADA A LA GALERÍA DE TOKENS ──
              CRUCE DE TERRITORIO DECLARADO: esta pantalla es del cliente
              (A/C) y la toca B con AUTORIZACIÓN EXPLÍCITA del founder,
              citada: *"La entrada en Cuenta va, SIN __DEV__ — el founder
              gatea en preview y con __DEV__ no llegaría justo donde la
              necesita… Cruce declarado en el commit con mi autorización
              citada."* (S82, orden r12bis/r13.)

              SIN `__DEV__` A PROPÓSITO: el gate corre en el APK PREVIEW,
              donde `__DEV__` es false — un guard ahí la haría
              inalcanzable exactamente donde se la necesita. Es la misma
              lección que el marcador de arriba: L-161 (una superficie de
              gate se verifica ALCANZABLE en el build del founder).

              POR QUÉ ES LA ÚNICA VÍA, medido en r13: el scheme SÍ está
              horneado (el APK hermano trae `android:scheme="prestador"` +
              `"exp+prestador"` en su intent filter, y el del cliente vive
              en app.json desde el scaffold) — así que el deep link
              funciona, pero **exige cable/adb**: Chrome no abre schemes
              custom tipeados y WhatsApp no los linkea (D-509②, medido en
              S79). Sin cable no hay forma de disparar el intent. La
              entrada no es comodidad: es la vía.

              🔴 DEUDA: se RETIRA o se esconde tras un gesto ANTES del
              soft launch (1-oct-2026) — una herramienta de sesión en la
              superficie real también la alcanza un usuario. ── */}
          {/* `icono` es TIPADO (IconoNombre), jamás slot libre — el
              contrato de CeldaNavegacion lo dice en su propio JSDoc.
              Los textos van LITERALES y no por el riel i18n a propósito:
              es una herramienta de sesión con fecha de retiro, y meterle
              keys al diccionario dejaría basura que sobrevive a la deuda. */}
          <CeldaNavegacion
            /* `D-877`: `lapiz`, el mismo que la lámina — **la repetición acá
               es deliberada y marca CLASE**: las dos son herramientas de
               sesión, no filas de producto, y las dos lo dicen en su
               `detalle`. Lo que la ley prohíbe es que dos cosas DISTINTAS se
               vean iguales; esto es lo contrario. */
            icono="lapiz"
            titulo="Galería de tokens"
            detalle="herramienta de sesión — no es pantalla de producto"
            onPress={() => router.push('/gallery')}
          />
        </View>
      </ScrollView>

      <Hoja visible={salirAbierta} onCerrar={() => setSalirAbierta(false)} titulo={t('ajustes.titulo')}>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.secondary }}>
            {t('ajustes.confirmacionCierre')}
          </Text>
          <Boton
            variante="destructivo"
            etiqueta={t('ajustes.cerrarSesion')}
            bloque
            cargando={cerrando}
            onPress={() => {
              if (cerrando) return;
              setCerrando(true);
              void (async () => {
                await cerrarSesion();
                setCerrando(false);
                setSalirAbierta(false);
                router.replace('/bienvenida');
              })();
            }}
          />
          <Boton variante="ghost" etiqueta={t('ajustes.cancelar')} bloque onPress={() => setSalirAbierta(false)} />
        </View>
      </Hoja>

      {/* Eliminar cuenta — letra (a): la voz honesta; la política P15
          (destino del expediente, co-dueños, hitos) se firma ANTES de
          que esto ejecute nada. */}
      <Hoja visible={eliminarAbierta} onCerrar={() => setEliminarAbierta(false)} titulo={t('cuenta.eliminarCuenta')} conCerrar>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary }}>
            {t('cuenta.eliminarVoz')}
          </Text>
          <Boton variante="secundario" etiqueta={t('cuenta.entendido')} bloque onPress={() => setEliminarAbierta(false)} />
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
