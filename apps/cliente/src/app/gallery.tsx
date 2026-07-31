// Ruta de VERIFICACIÓN de tokens (S43-B2) — no es pantalla de producto.
// El candado S42 sigue vigente: las pantallas de app nacen en B3+ sobre el design system.
//
// S82-B: además del TokenGallery de `packages/ui`, esta ruta monta LA
// LÁMINA DE LA SEPARACIÓN EN OSCURO sobre las PIEZAS REALES que el
// founder nombró (la rueda del día, la duración, el horario).
//
// ⚠️ POR QUÉ VIVE ACÁ Y NO EN TokenGallery, declarado: esas piezas son
// `@/components/reserva-piezas` — de **apps/cliente**. `TokenGallery`
// vive en **packages/ui**, y un paquete NO puede importar de una app
// (invertiría la dependencia y rompería el build). Reimplementarlas ahí
// habría violado la regla dura del founder: *"la galería IMPORTA, jamás
// reimplementa — una galería que muestra un botón que no es EL botón
// hace firmar algo que no corre"*. Así que la lámina se monta donde las
// piezas SÍ se pueden importar: la galería del cliente.

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  palette,
  SelectorOpcion,
  Tarjeta,
  Texto,
  ThemeProvider,
  radius,
  spacing,
  useTheme,
  TokenGallery,
} from '@epetplace/ui';

import { GrillaElegir, SelectorDia, type DiaOpcion } from '@/components/reserva-piezas';

const DIAS: DiaOpcion[] = [
  { iso: '2026-07-30', dia: 'jue', numero: '30' },
  { iso: '2026-07-31', dia: 'vie', numero: '31' },
  { iso: '2026-08-01', dia: 'sáb', numero: '01' },
  { iso: '2026-08-02', dia: 'dom', numero: '02' },
  { iso: '2026-08-03', dia: 'lun', numero: '03' },
];
const HORAS = ['08:00', '09:30', '11:00', '14:00', '16:30', '18:00'].map((h) => ({ codigo: h, etiqueta: h }));
const DURACIONES = ['30 min', '1 h', '2 h'].map((d) => ({ codigo: d, etiqueta: d }));

/** Las TRES piezas que el founder nombró, juntas y en su orden real de
 *  reserva. `envoltorio` decide CÓMO existe la superficie: es lo ÚNICO
 *  que cambia entre las tres alternativas — las piezas son las mismas. */
function PiezasReales({ envoltorio }: { envoltorio: 'tarjeta' | 'halo' | 'haloRodea' | 'aire' }) {
  const { theme } = useTheme();
  const contenido = (
    <View style={{ gap: spacing[4] }}>
      <Texto variante="dato">el día</Texto>
      <SelectorDia dias={DIAS} elegido={DIAS[1].iso} etiquetaCerrado="cerrado" onElegir={() => {}} />
      <Texto variante="dato">la duración</Texto>
      <GrillaElegir opciones={DURACIONES} elegida={DURACIONES[1].codigo} onElegir={() => {}} voz="sans" />
      <Texto variante="dato">el horario</Texto>
      <GrillaElegir opciones={HORAS} elegida={HORAS[2].codigo} onElegir={() => {}} voz="mono" />
    </View>
  );
  if (envoltorio === 'aire') {
    // (c) SIN TARJETA: la superficie desaparece y agrupa el AIRE.
    return <View style={{ paddingVertical: spacing[5] }}>{contenido}</View>;
  }
  if (envoltorio === 'haloRodea') {
    // EL CONTRASTE (S82-B, pregunta del founder): la MISMA luz, pero en
    // los CUATRO lados. Existe para que la diferencia se VEA y no haya
    // que creerla: si rodea, es un borde con otro nombre y A6 muerde.
    return (
      <View
        style={{
          backgroundColor: theme.bg.card,
          borderRadius: radius.md,
          padding: spacing[4],
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
        }}
      >
        {contenido}
      </View>
    );
  }
  if (envoltorio === 'halo') {
    // (b) HALO: la elevación del oscuro expresada como LUZ. Línea de 1px
    // al 14% arriba — rinde 2.09 contra el fondo (medido r21) y NO mueve
    // el par superficie/fondo: separa por CONTORNO, no por masa.
    return (
      <View
        style={{
          backgroundColor: theme.bg.card,
          borderRadius: radius.md,
          padding: spacing[4],
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.14)',
        }}
      >
        {contenido}
      </View>
    );
  }
  // (a) COMO ESTÁ HOY — la referencia: Tarjeta separada solo por SOMBRA
  // (y en oscuro una sombra oscura sobre fondo oscuro es invisible).
  return <Tarjeta elevacion="reposo">{contenido}</Tarjeta>;
}

/** Los tres candidatos de tapiz oscuro (S82-B r26). El 3% es el VIVO.
 *  El techo está medido y va escrito al lado de cada uno: el halo
 *  direccional rinde 1.53 en negro y CAE bajo 1.50 desde el 5%. */
// S82-B r29: los candidatos MURIERON con su trabajo hecho — el founder
// firmó el 8% mirando (Ley 37). La lámina deja de OFRECER tinte y pasa a
// mostrar el firmado, que es el fondo real del tema.
const TINTES = [{ codigo: palette.tapizDark, etiqueta: '8% (FIRMADO)', nota: 'card/base 1.009 — card y base son el mismo color: por eso el agrupamiento pasó al AIRE (sin tarjeta)' }];

function LaminaSeparacionOscuro() {
  const { theme } = useTheme();
  const [tinte, setTinte] = useState<string>(TINTES[0].codigo);
  const elegido = TINTES.find((t) => t.codigo === tinte) ?? TINTES[0];
  const OPCIONES = [
    {
      k: 'halo' as const,
      titulo: '(b) HALO DIRECCIONAL — LA PROPUESTA POR DEFECTO',
      linea:
        'DIRECCIONAL, verificado en el literal: `borderTopWidth` — la luz entra por arriba y NO rodea, por eso A6 (SIN CAJA) no aplica. Cuesta: una línea de 1px al 14% arriba de la superficie (rinde 2.09 contra el fondo: el ojo la ve, y es justo lo que la sombra no puede dar en oscuro). NO mueve el par superficie/fondo — separa por CONTORNO, no por masa: cero textos tocados, cero de los 178 pares. Toca: A6 dice SIN CAJA (un halo no es caja: no rodea, es el borde donde pegaría la luz) y Ley 20 manda la sombra por token (no sería artesanal si nace como token de elevación oscura). Las dos son de mesa.',
    },
    {
      k: 'tarjeta' as const,
      titulo: '(a) COMO ESTÁ HOY — la referencia',
      linea:
        'Cuesta: nada. Toca: ninguna ley. Es el estado que el founder cazó TRES veces (los chips del 2×2, sinCaja, y ahora el día/duración/horario) — la tarjeta se separa solo por SOMBRA, y en oscuro una sombra oscura sobre fondo oscuro es invisible por física.',
    },
    {
      k: 'haloRodea' as const,
      titulo: '(b′) EL CONTRASTE — la misma luz, RODEANDO',
      linea:
        'NO es una propuesta: está montada para que la diferencia se vea. Si el halo rodea, es un BORDE con otro nombre y A6 muerde — haría falta enmienda de mesa. La (b) de arriba es direccional (solo el canto superior, `borderTopWidth`), que es lo que sostiene el argumento: no rodea, es el borde donde pegaría la luz. La diferencia entre esta y la de arriba es la diferencia entre una enmienda y ninguna.',
    },
    {
      k: 'aire' as const,
      titulo: '(c) SIN TARJETA — agrupa el aire',
      linea:
        'Cuesta: la superficie desaparece como pieza y hay que re-componer con espaciado; el CONTENIDO no pierde nada (el texto ya vive sobre el fondo con 17.73). Toca: nada firmado — pero cambia la gramática del tema, y eso es decisión de producto, no de token.',
    },
  ];
  return (
    <View style={{ gap: spacing[6], padding: spacing[4], backgroundColor: tinte }}>
      <View style={{ gap: spacing[1] }}>
        <Texto variante="seccion">LA SEPARACIÓN EN OSCURO — sobre las piezas reales</Texto>
        <Texto variante="apoyo" color="danger">
          LOS DOS LADOS DEL PAR ESTÁN CERRADOS POR MEDICIÓN: subir bg.card rompe SEIS pares AA firmados (el techo lo pone el texto de capa) · bajar bg.base no rompe nada pero NO ALCANZA (con el fondo en negro absoluto el par llega a 1.083 — el +0.05 de WCAG aplana el extremo oscuro). Por eso lo que se elige acá no es un valor: son tres MANERAS de que una superficie exista.
        </Texto>
        <Texto variante="apoyo">
          LA OPCIÓN CARA, declarada como tal: subir los textos de capa del oscuro (violetText/pinkDark) ANTES, después las superficies, y re-medir los 178 pares. Es una tanda propia con su gate — se elige sabiendo que lo es.
        </Texto>
      </View>
      {/* EL EJE DEL TINTE — se juzga JUNTO con la separación, porque
          subir el tinte EMPEORA el par y el halo es lo que lo compensa. */}
      <View style={{ gap: spacing[2] }}>
        <SelectorOpcion
          etiqueta="Tapiz del oscuro"
          disposicion="tira"
          acento="control"
          opciones={TINTES.map((t) => ({ codigo: t.codigo, etiqueta: t.etiqueta }))}
          seleccionada={tinte}
          onSelect={setTinte}
        />
        <Texto variante="dato">{`${elegido.codigo} · ${elegido.nota}`}</Texto>
      </View>
      {OPCIONES.map((o) => (
        <View key={o.k} style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{o.titulo}</Texto>
          <PiezasReales envoltorio={o.k} />
          <Texto variante="apoyo">{o.linea}</Texto>
        </View>
      ))}
    </View>
  );
}

export default function GalleryRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <ScrollView>
        {/* La lámina va PRIMERA: es la decisión más grande que queda abierta. */}
        <ThemeProvider defaultMode="dark">
          <LaminaSeparacionOscuro />
        </ThemeProvider>
        <TokenGallery />
      </ScrollView>
    </SafeAreaView>
  );
}
