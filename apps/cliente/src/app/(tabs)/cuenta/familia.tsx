/**
 * Cuenta · Tu familia (S55-B3 → S104-C: INVITAR deja de decir "Pronto").
 *
 * - Renombrar (solo el adulto titular; la RLS es la puerta).
 * - Miembros en LECTURA (el nombre de un miembro ajeno no es legible por RLS
 *   de profiles — null honesto, hueco P1).
 * - INVITAR (motor de A, tanda 2): solo el titular. Correo + nombre opcional →
 *   `invitarAFamilia` devuelve el token; la pantalla arma el ENLACE y ofrece
 *   COPIARLO — la casa no manda el WhatsApp, quien invita lo comparte.
 *   · **`avisoPorCorreo=false` ⇒ la pantalla dice "compartí el enlace", jamás
 *     promete un correo que no va a salir** (el invitado sin cuenta no es
 *     alcanzable por el motor de avisos).
 *   · **Quien entra es FAMILIAR AUTORIZADO** (firma 5.1) — la voz lo dice. NO
 *     se ofrece configurar permisos: en v1 el permiso ES el escalón (la
 *     columna existe y nadie la lee — deuda declarada, medida por A).
 *
 * ⚠️ EL ENLACE apunta al SITIO (`/invitacion?token=…`) con instrucciones — no a
 * un deep link ni a una descarga que no existe (firma founder). **La landing del
 * sitio vive en `epetplace-web/src/pages/invitacion.astro`** (S104-C): la app la
 * compone; el sitio la sirve. El parámetro es `?token=` (el de la baja es `?t=` —
 * cada emisor con el suyo).
 *
 * Escalera: no muestra datos del expediente (la familia humana no es el
 * expediente de la mascota).
 */

import { useEffect, useState } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  Boton,
  Campo,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
  EvitaTeclado,
} from '@epetplace/ui';
import {
  ENLACE_INVITACION_HABILITADO,
  invitarAFamilia,
  revocarInvitacionFamilia,
  obtenerMiFamilia,
  renombrarFamilia,
  urlInvitacion,
  type MiFamilia,
  type YaInvitada,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type TraductorCuenta = ReturnType<typeof useTraduccion>['t'];

/* ☠️ La constante local de la base y el `urlInvitacion` propio MURIERON (S104-C,
   freno de A): ahora se consumen de `@epetplace/api`. **`urlInvitacion` devuelve
   `string | null`** — null mientras el freno esté apagado (las páginas del sitio
   dan 404). La base (`www` directo) y el encendido viven en UN solo lugar
   (`_enlace-invitacion.ts`), no en cada pantalla — si no, vuelven a divergir. */

// rol del modelo → voz humana (Ley 3: el código jamás visible)
function vozRol(rol: string, t: TraductorCuenta): string {
  switch (rol) {
    case 'adulto_titular': return t('cuenta.rolAdultoTitular');
    case 'adulto_autorizado': return t('cuenta.rolAdultoAutorizado');
    case 'menor': return t('cuenta.rolMenor');
    case 'cuidador_externo': return t('cuenta.rolCuidadorExterno');
    default: return t('cuenta.familiaMiembroAjeno');
  }
}

/** El estado del flujo de invitar dentro de la Hoja. */
type Invitacion =
  | { fase: 'formulario' }
  | { fase: 'creando' }
  | { fase: 'listo'; enlace: string; email: string; avisoPorCorreo: boolean; correoSuprimido: boolean };

export default function FamiliaCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [familia, setFamilia] = useState<MiFamilia | 'cargando' | 'error'>('cargando');
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  // ── el flujo de invitar ──
  const [invitarAbierta, setInvitarAbierta] = useState(false);
  const [inv, setInv] = useState<Invitacion>({ fase: 'formulario' });
  const [emailInv, setEmailInv] = useState('');
  const [nombreInv, setNombreInv] = useState('');
  const [reboteInv, setReboteInv] = useState<string | null>(null);
  /* 🔴 S105-C · EL CASO «YA INVITADA» — un rebote con SALIDA, no una frase.
     `null` = no es ese caso. Trae el id porque **sin él la voz sabría el
     problema y no podría hacer nada con él**. */
  /* 🔴 El tipo sale del wrapper y NO se re-declara a mano: cuando `YaInvitada`
     creció con el token, una copia local habría seguido compilando sin él —
     que es exactamente cómo un dato nuevo se pierde en silencio. */
  const [yaInvitada, setYaInvitada] = useState<YaInvitada | null>(null);
  /* El enlace de la invitación ANTERIOR, derivado. `urlInvitacion` devuelve
     `null` con el freno de A encendido, y ese `null` decide si el botón existe. */
  const enlaceAnterior = yaInvitada === null ? null : urlInvitacion(yaInvitada.token);
  const [cancelandoInv, setCancelandoInv] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerMiFamilia();
      if (!vigente) return;
      if (!r.ok) {
        setFamilia('error');
        return;
      }
      setFamilia(r.data);
      setNombre(r.data.nombre ?? '');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  const esTitular = typeof familia === 'object' && familia.mi_rol === 'adulto_titular';

  async function guardar() {
    if (guardando || typeof familia !== 'object') return;
    setGuardando(true);
    const r = await renombrarFamilia(familia.familia_id, nombre);
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('cuenta.familiaGuardado'), variante: 'exito' });
    router.back();
  }

  function abrirInvitar() {
    setInv({ fase: 'formulario' });
    setEmailInv('');
    setNombreInv('');
    setReboteInv(null);
    setInvitarAbierta(true);
  }

  /* Cancela la invitación anterior y **devuelve el formulario a un estado
     usable**: la persona vuelve a tocar «invitar» con el correo ya escrito y
     esta vez pasa. *No re-invita sola: cancelar destruye un enlace que quizá
     ella compartió, y encadenar las dos acciones le sacaría la última
     oportunidad de arrepentirse.* */
  async function cancelarAnterior() {
    if (yaInvitada === null || cancelandoInv) return;
    setCancelandoInv(true);
    const r = await revocarInvitacionFamilia(yaInvitada.invitacionId);
    setCancelandoInv(false);
    if (!r.ok) {
      /* El fallo NO borra el rebote: si no se pudo cancelar, la invitación
         anterior SIGUE ABIERTA y decir otra cosa dejaría a la persona creyendo
         que puede reinvitar. */
      setReboteInv(r.mensaje);
      return;
    }
    setYaInvitada(null);
    setReboteInv(t('cuenta.familiaYaInvitadaCancelada'));
  }

  async function crearInvitacion() {
    if (inv.fase === 'creando' || typeof familia !== 'object') return;
    setReboteInv(null);
    setInv({ fase: 'creando' });
    const r = await invitarAFamilia({
      familiaId: familia.familia_id,
      email: emailInv.trim(),
      nombre: nombreInv.trim() === '' ? undefined : nombreInv.trim(),
    });
    if (!r.ok) {
      /* 🔴 `ya_invitada` NO cae en la voz genérica del wrapper, y la razón es
         medida: la invitación previa **no vence hasta el 22-sep**, así que
         «prueba de nuevo» mandaba a repetir algo imposible durante cuatro
         semanas. *Una voz que pide reintentar sobre un guard que no cede es la
         misma familia que «ya lo estamos viendo»: promete una salida que no
         existe.* Acá la salida SÍ existe y se ofrece. */
      /* ✅ DESCONGELADA (S105-A ensanchó el tipo, y de paso trajo el TOKEN).
         Acá estuvo el freno: el dato viajaba en runtime y la firma pública no
         lo declaraba. **No se casteó** — se pidió la línea y llegó, con las
         dos salidas que el founder dictó: *«compartile el enlace o cancelá esa
         invitación»*.

         ⚠️ Se exige `r.yaInvitada` PRESENTE, no `codigo === 'ya_invitada'` a
         secas: el código puede llegar sin sus datos si el `RAISE` cambia de
         formato, y ahí **la pantalla ofrecería dos acciones que no puede
         cumplir**. Sin datos cae a la voz de siempre, que es honesta. */
      if (r.codigo === 'ya_invitada' && r.yaInvitada) {
        setYaInvitada(r.yaInvitada);
        setReboteInv(null);   /* la tarjeta de acciones REEMPLAZA al rebote: dos voces sobre lo mismo compiten */
        setInv({ fase: 'formulario' });
        return;
      }
      // el resto: la voz la trae el wrapper (VOZ tipada por código).
      setReboteInv(r.mensaje);
      setYaInvitada(null);
      setInv({ fase: 'formulario' });
      return;
    }
    const enlace = urlInvitacion(r.data.token);
    if (enlace === null) {
      /* DEFENSA: la fila está gateada por `ENLACE_INVITACION_HABILITADO`, así
         que no deberíamos llegar acá con el freno apagado. Si igual pasa, NO se
         ofrece un enlace roto (el punto entero del freno de A). */
      setReboteInv(t('cuenta.familiaInvitarSinEnlace'));
      setInv({ fase: 'formulario' });
      return;
    }
    setInv({
      fase: 'listo',
      enlace,
      email: emailInv.trim(),
      // El `?? false` es la lectura honesta: si el wrapper no lo dice, se
      // asume que NO salió correo — el error seguro es prometer de menos.
      avisoPorCorreo: r.data.avisoPorCorreo ?? false,
      correoSuprimido: r.data.correoSuprimido ?? false,
    });
  }

  async function copiarEnlace(enlace: string) {
    await Clipboard.setStringAsync(enlace);
    mostrar({ texto: t('cuenta.familiaEnlaceCopiado'), variante: 'exito' });
  }

  /** «Enviar por…» — la hoja de compartir nativa (Share API). La casa NO manda
   *  nada: la persona elige el canal (WhatsApp, mensajes…). El texto lleva el
   *  enlace y a quién se cuida, JAMÁS el correo de quien invita (firma founder).
   *  Sujeto al mismo freno: solo se ofrece con enlace válido (fase 'listo'). */
  async function compartirEnlace(enlace: string) {
    try {
      await Share.share({ message: t('cuenta.familiaMensajeCompartir', { enlace }) });
    } catch {
      // el usuario canceló la hoja: no es un error que anunciar.
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cuenta.familia')} atras onAtras={() => router.back()} />

      {familia === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
            </View>
          </EsqueletoGrupo>
        </View>
      ) : familia === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.errorCargar')}
            accion={<Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={() => { setFamilia('cargando'); setIntento((n) => n + 1); }} />}
          />
        </View>
      ) : (
        <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
          keyboardShouldPersistTaps="handled"
        >
          <Campo
            label={t('cuenta.familiaNombreLabel')}
            placeholder={t('cuenta.familiaNombrePlaceholder')}
            value={nombre}
            onChangeText={setNombre}
            deshabilitado={!esTitular}
            ayuda={esTitular ? undefined : t('cuenta.familiaSoloTitular')}
            autoCapitalize="words"
          />
          {esTitular ? (
            <Boton etiqueta={t('cuenta.guardar')} bloque cargando={guardando} deshabilitado={nombre.trim().length === 0} onPress={() => void guardar()} />
          ) : null}

          <View style={{ gap: spacing[3], marginTop: spacing[2] }}>
            <Text
              accessibilityRole="header"
              style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
            >
              {t('cuenta.familiaMiembros')}
            </Text>
            <Tarjeta relleno="ninguno">
              {familia.miembros.map((m, i) => (
                <View key={m.familia_miembro_id}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={`${m.nombre ?? t('cuenta.familiaMiembroAjeno')}${m.es_yo ? ` ${t('cuenta.familiaTu')}` : ''}`}
                    subtitulo={vozRol(m.rol, t)}
                  />
                </View>
              ))}
              {/* INVITAR — solo el titular (Ley 23: no se ofrece lo que el
                  server va a rebotar con solo_titular_invita). El invitado
                  entra como familiar autorizado; el motor lo fija.
                  🔴 GATEADA por `ENLACE_INVITACION_HABILITADO` (freno de A):
                  mientras las páginas del sitio den 404, la fila dice «Pronto»
                  y no se crean invitaciones que no se pueden compartir. */}
              {esTitular ? (
                <>
                  <Separador />
                  {ENLACE_INVITACION_HABILITADO ? (
                    <CeldaNavegacion
                      icono="familia"
                      titulo={t('cuenta.familiaInvitar')}
                      detalle={t('cuenta.familiaInvitarAyuda')}
                      onPress={abrirInvitar}
                    />
                  ) : (
                    <Celda
                      titulo={t('cuenta.familiaInvitar')}
                      fin={
                        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                          {t('cuenta.familiaInvitarPronto')}
                        </Text>
                      }
                    />
                  )}
                </>
              ) : null}
            </Tarjeta>
          </View>
        </ScrollView>
        </EvitaTeclado>
      )}

      {/* LA HOJA DE INVITAR — dos fases: el formulario y el enlace listo. */}
      <Hoja visible={invitarAbierta} onCerrar={() => setInvitarAbierta(false)} titulo={t('cuenta.familiaInvitar')} conCerrar>
        <EvitaTeclado>
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            {inv.fase === 'listo' ? (
              <>
                {/* Tres estados, y ninguno promete un correo que no sale:
                    sale correo · suprimido (pidió no recibir) · sin cuenta. */}
                <Texto variante="cuerpo">
                  {inv.avisoPorCorreo
                    ? t('cuenta.familiaInvitarCorreoYEnlace', { email: inv.email })
                    : inv.correoSuprimido
                      ? t('cuenta.familiaInvitarSuprimido', { email: inv.email })
                      : t('cuenta.familiaInvitarSoloEnlace', { email: inv.email })}
                </Texto>
                <Texto variante="dato" seleccionable>
                  {inv.enlace}
                </Texto>
                <Boton etiqueta={t('cuenta.familiaEnviarPor')} bloque onPress={() => void compartirEnlace(inv.enlace)} />
                <Boton variante="secundario" etiqueta={t('cuenta.familiaCopiarEnlace')} bloque onPress={() => void copiarEnlace(inv.enlace)} />
                <Boton variante="ghost" etiqueta={t('cuenta.familiaInvitarOtra')} bloque onPress={abrirInvitar} />
                <Boton variante="ghost" etiqueta={t('cuenta.familiaInvitarListo')} bloque onPress={() => setInvitarAbierta(false)} />
              </>
            ) : (
              <>
                <Texto variante="apoyo">{t('cuenta.familiaInvitarComoFamiliar')}</Texto>
                <Campo
                  label={t('cuenta.familiaInvitarEmailLabel')}
                  value={emailInv}
                  onChangeText={setEmailInv}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                <Campo
                  label={t('cuenta.familiaInvitarNombreLabel')}
                  value={nombreInv}
                  onChangeText={setNombreInv}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                />
                {reboteInv !== null && (
                  <Texto variante="apoyo" color="danger">{reboteInv}</Texto>
                )}
                {/* 🔴 EL REBOTE CON SALIDA. Dice QUÉ pasó, CUÁNDO, y ofrece lo
                    único que destraba — con el costo ADELANTE: *cancelar
                    invalida el enlace que la persona quizá ya compartió, y eso
                    se sabe antes de tocar, no después.*
                    ✅ **YA SON LAS DOS SALIDAS** (S105-A trajo el token): la
                    de bajo costo PRIMERO —compartir el enlace que ya existe—
                    y cancelar debajo, que es la destructiva.
                    *El orden es la recomendación: quien vino a invitar quiere
                    que la persona entre, no borrar una invitación.*

                    ⚠️ `urlInvitacion` puede devolver `null` (la fila está
                    gateada por `ENLACE_INVITACION_HABILITADO`) ⇒ **el botón se
                    monta sólo si el enlace se pudo armar**. Un botón que no
                    puede armar su destino es una puerta sin destino, y con el
                    freno encendido cancelar sigue siendo camino completo. */}
                {yaInvitada !== null && (
                  <View style={{ gap: spacing[2] }}>
                    <Texto variante="apoyo" color="danger">
                      {t('cuenta.familiaYaInvitada', { fecha: yaInvitada.fecha })}
                    </Texto>
                    <Texto variante="apoyo">{t('cuenta.familiaYaInvitadaAviso')}</Texto>
                    {enlaceAnterior !== null && (
                      <Boton
                        etiqueta={t('cuenta.familiaYaInvitadaCompartir')}
                        onPress={() => void compartirEnlace(enlaceAnterior)}
                      />
                    )}
                    <Boton
                      variante="secundario"
                      etiqueta={t('cuenta.familiaYaInvitadaCancelar')}
                      cargando={cancelandoInv}
                      onPress={() => void cancelarAnterior()}
                    />
                  </View>
                )}
                <Boton
                  etiqueta={t('cuenta.familiaInvitarCrear')}
                  bloque
                  cargando={inv.fase === 'creando'}
                  deshabilitado={emailInv.trim().length === 0}
                  onPress={() => void crearInvitacion()}
                />
              </>
            )}
          </View>
        </EvitaTeclado>
      </Hoja>
    </View>
  );
}
