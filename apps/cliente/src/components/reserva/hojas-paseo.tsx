/**
 * LAS SEIS HOJAS DEL FLUJO DE RESERVA DEL PASEO — ahora compartidas.
 *
 * Vivían dentro de `explorar/paseo/disponibles`. Suben porque **ganaron un
 * segundo consumidor**: desde D-730 la ficha del prestador reserva de verdad, y
 * reservar un paseo puede tener que elegir mascota, preguntar la norma social,
 * ofrecer el saldo del paquete o abrir el plan. Dejarlas abajo habría obligado a
 * la ficha a clonarlas — y seis Hojas clonadas divergen solas.
 *
 * ── LO QUE ESTE ARCHIVO **NO** ES ──────────────────────────────────────────
 * No es «el flujo». Es su cara. **La unidad que se extrajo es el FLUJO**
 * (`lib/reserva/paseo`), y esa distinción es la letra de D-730: montar las Hojas
 * en otro lado siempre fue trivial —son componentes—, lo caro era de dónde
 * sacan su estado y quién decide abrirlas. Acá no se decide nada: se dibuja lo
 * que el hook ya decidió.
 *
 * Por eso recibe el flujo entero en vez de doce props sueltas: **el hook es la
 * fuente, y partirlo en pedazos para pasarlo sería reabrir la puerta a que una
 * superficie reciba la mitad.**
 */

import { Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  Hoja,
  HojaScroll,
  Separador,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';

import { PlanHoja } from '@/components/plan-hoja';
import { PaseoSocialHoja } from '@/components/paseo-social-hoja';
import { useTraduccion } from '@/i18n';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';
import type { useReservaPaseo } from '@/lib/reserva/paseo';

export type FlujoPaseo = ReturnType<typeof useReservaPaseo>;

export function HojasPaseo({
  flujo,
  fecha,
  hora,
  duracion,
}: {
  flujo: FlujoPaseo;
  fecha: string;
  hora: string;
  duracion: number;
  /** Qué hacer cuando el plan se contrató. Lo decide cada superficie porque
   *  el destino puede no ser el mismo — hoy las dos van al hub, pero eso es
   *  una coincidencia de producto, no una regla de esta pieza. */
}) {
  const { t } = useTraduccion();
  const { theme } = useTheme();

  return (
    <>
      {/* La cita es de UNA mascota: con más de una en el hogar, se elige. */}
      <Hoja
        visible={flujo.eligiendoMascota !== null}
        titulo={t('explorar.elegirMascota')}
        onCerrar={flujo.cerrarEligiendoMascota}
      >
        <HojaScroll>
          {flujo.elegibles.map((m, i) => (
            <View key={m.id}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={m.nombre}
                inicio={
                  <AvatarMascota
                    nombre={m.nombre}
                    fotoUrl={caraDeMascotaPorRuta({
                      especie: m.especie,
                      rutaImagen: m.raza_ruta_imagen,
                      fotoUri: flujo.fotos[m.id],
                    })}
                    tamano="sm"
                  />
                }
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  const p = flujo.eligiendoMascota;
                  if (p !== null) {
                    flujo.cerrarEligiendoMascota();
                    flujo.alElegirMascota(p, m.id);
                  }
                }}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>

      {/* D-338: la Hoja del plan — nace con el paseador ELEGIDO */}
      <Hoja visible={flujo.plan !== null} titulo={t('plan.hojaTitulo')} onCerrar={flujo.cerrarPlan} conCerrar>
        {flujo.plan !== null ? (
          <PlanHoja
            paseador={flujo.plan.paseador}
            mascotaId={flujo.plan.mascotaId}
            fecha={fecha}
            hora={hora}
            /* ⭐ S109-C · La Hoja cierra y **el pago vive en su propia
               pantalla**: una Hoja se arrastra hacia abajo, y esto es una
               espera que cambia sola. */
            onIrAPagar={(config) => {
              const p = flujo.plan;
              if (p === null) return;
              flujo.cerrarPlan();
              router.push({
                pathname: '/explorar/paseo/checkout-plan',
                params: {
                  prestadorId: p.paseador.prestador_id,
                  prestadorServicioId: p.paseador.prestador_servicio_id,
                  prestadorNombre: p.paseador.prestador_nombre,
                  mascotaId: p.mascotaId,
                  dias: config.dias.join(','),
                  hora,
                  frecuencia: config.frecuencia,
                  renueva: config.renueva ? '1' : '0',
                  precioMensual: String(p.paseador.precio_mensual_plan ?? 0),
                },
              });
            }}
          />
        ) : null}
      </Hoja>

      {/* P0: el catálogo de especies no llegó. Es OTRA cosa que no tener
          perros, y por eso tiene su propia voz — decirle «no tenés un perro
          registrado» a alguien que tiene dos es peor que no decir nada
          (Ley 13: el error se dice, y se dice lo que ES). */}
      <Hoja
        visible={flujo.catalogoNoLlego !== null}
        titulo={t(
          flujo.catalogoNoLlego === 'cargando' ? 'paquete.catalogoCargandoTitulo' : 'paquete.catalogoErrorTitulo',
        )}
        onCerrar={flujo.cerrarIntento}
        conCerrar
      >
        <HojaScroll>
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Celda
              titulo={t(
                flujo.catalogoNoLlego === 'cargando'
                  ? 'paquete.catalogoCargandoDetalle'
                  : 'paquete.catalogoErrorDetalle',
              )}
            />
            {/* Reintentar tiene que existir también acá: sin él, el modal del
                catálogo es un callejón — se cierra y vuelve a salir al tocar. */}
            <Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={flujo.reintentarCatalogo} />
          </View>
        </HojaScroll>
      </Hoja>

      {/* 🔴 LA HERMANA DE LA ANTERIOR, para las MASCOTAS. Antes este caso no
          tenía voz: se caía en «no tenés un perro registrado», que es una
          afirmación sobre el HOGAR de alguien hecha sobre una lectura que
          falló. **La voz no culpa a las mascotas** — dice que el dato no
          llegó — y **ofrece reintentar**. */}
      <Hoja
        visible={flujo.mascotasNoLlegaron !== null}
        titulo={t(
          flujo.mascotasNoLlegaron === 'cargando'
            ? 'paquete.misMascotasCargandoTitulo'
            : 'paquete.misMascotasErrorTitulo',
        )}
        onCerrar={flujo.cerrarIntento}
        conCerrar
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          <Celda
            titulo={t(
              flujo.mascotasNoLlegaron === 'cargando'
                ? 'paquete.misMascotasCargandoDetalle'
                : 'paquete.misMascotasErrorDetalle',
            )}
          />
          {flujo.mascotasNoLlegaron === 'error' ? (
            <Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={flujo.reintentarHogar} />
          ) : null}
        </View>
      </Hoja>

      {/* §1bis: hogar sin mascotas elegibles — voz honesta CON CAMINO */}
      <Hoja
        visible={flujo.sinElegibles}
        titulo={t('paquete.sinPerrosTitulo')}
        onCerrar={flujo.cerrarSinElegibles}
        conCerrar
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          <Celda titulo={t('paquete.sinPerrosDetalle')} />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('paquete.sinPerrosAccion')}
            onPress={() => {
              flujo.cerrarSinElegibles();
              if (router.canDismiss()) router.dismissAll();
              router.navigate('/hogar/agregar');
            }}
          />
        </View>
      </Hoja>

      {/* P19: la pregunta única — SÍ sigue al flujo; NO frena con la voz */}
      <PaseoSocialHoja
        visible={flujo.preguntaSocial !== null}
        mascota={flujo.preguntaSocial?.mascota ?? null}
        onCerrar={flujo.cerrarPreguntaSocial}
        onRespondida={flujo.responderSocial}
      />

      {/* P19: el NO — voz honesta CON CAMINO, jamás final mudo. La respuesta
          queda registrada y es editable desde el perfil. */}
      <Hoja
        visible={flujo.socialNo !== null}
        titulo={t('paseoSocial.celdaTitulo')}
        onCerrar={flujo.cerrarSocialNo}
        conCerrar
      >
        {flujo.socialNo !== null ? (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Text
              style={{
                fontFamily: typography.family.sans.light,
                fontSize: typography.size.lg,
                lineHeight: Math.round(typography.size.lg * typography.leading.snug),
                color: theme.text.primary,
              }}
            >
              {t('paseoSocial.noVoz', { nombre: flujo.socialNo })}
            </Text>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: Math.round(typography.size.sm * typography.leading.normal),
                color: theme.text.secondary,
              }}
            >
              {t('paseoSocial.noVozCamino')}
            </Text>
            <Boton
              variante="primario"
              bloque
              etiqueta={t('paseoSocial.entendido')}
              onPress={flujo.cerrarSocialNo}
            />
          </View>
        ) : null}
      </Hoja>

      {/* §6bis.3: hay saldo con este paseador — el dueño ELIGE, parejo */}
      <Hoja
        visible={flujo.conSaldo !== null}
        titulo={t('paquete.eleccionTitulo')}
        onCerrar={flujo.cerrarConSaldo}
        conCerrar
      >
        {flujo.conSaldo !== null ? (
          <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
            <Celda
              titulo={t('paquete.eleccionVoz', { n: flujo.conSaldo.saldo })}
              metadataMono={`${fecha} · ${hora} · ${duracion} min`}
            />
            <Boton
              variante="primario"
              bloque
              etiqueta={t('paquete.reservarConPaquete')}
              cargando={flujo.reservando}
              onPress={() => {
                const elegido = flujo.conSaldo;
                if (elegido !== null) void flujo.reservarConSaldo(elegido.paseador, elegido.mascotaId);
              }}
            />
            <Boton
              variante="secundario"
              bloque
              etiqueta={t('paquete.pagarSuelto')}
              deshabilitado={flujo.reservando}
              onPress={() => {
                const elegido = flujo.conSaldo;
                flujo.cerrarConSaldo();
                if (elegido !== null) void flujo.crearHold(elegido.paseador, elegido.mascotaId);
              }}
            />
          </View>
        ) : null}
      </Hoja>
    </>
  );
}
