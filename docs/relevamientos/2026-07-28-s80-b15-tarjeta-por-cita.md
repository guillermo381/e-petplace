# S80-B15 · las dos firmas ejecutadas + la mordida resuelta

## La medición que B15 pedía (antes de componer)

**① ¿View absoluto o borde propio?** Era lo primero: un View absoluto
de 3px dentro del `overflow: 'hidden'` de la Tarjeta (literal
Tarjeta.tsx:101-103, radio 16) — por eso la curva lo MORDÍA (~7-16px
sin canto en cada punta) en vez de acompañarlo.

**② ¿Qué cuesta pasarlo a borde propio? RN LO PERMITE, con una
condición:** el borde tiene que vivir en el ELEMENTO PORTADOR del
radio. Un `borderLeftWidth` + `borderRadius` se dibuja entre el
rounded-rect exterior y el interior — **se adelgaza acompañando la
curva por construcción** (lo que la lámina muestra); la mordida muere.
El costo: `FilaCita` deja de envolver `Tarjeta` y compone su superficie
con los TOKENS EXACTOS de Tarjeta reposo (`bg.card` · `radius.lg` 16 ·
`elevacion.reposo` · sin hairline — regla Chanel del marco).
**Duplicación ACOTADA a un componente del design system, declarada en
su encabezado.** La alternativa rechazada: darle a `Tarjeta` una prop
de borde de color — API genérica con la que cualquier pantalla pinta
bordes y rompe la ley que FilaCita existe para custodiar.

## Lo ejecutado (las firmas)

1. **Canto SÓLIDO** — el degradado y el piso 33% salieron de FilaCita
   (B3 re-acotada a la tarjeta suelta, NO derogada: si esa superficie
   nace, trae su degradado consigo). Una línea en el componente; todas
   las pantallas heredan.
2. **UNA TARJETA = UNA CITA** en las CUATRO listas del HOY (destacada ·
   día · atendidas · semana): cada cita con su tarjeta, su canto de
   punta a punta contra SU curva, y sus acciones ("Conocer a {n}")
   ADENTRO por el slot `acciones`. La salida grupal (D-385) queda como
   SU tarjeta y sus miembros expandidos son TARJETAS HERMANAS — dos
   citas jamás comparten tarjeta, ni dentro de la salida. El vivo real
   envuelve SU tarjeta con CitaEnVivo. Los Separadores entre citas
   murieron con la Tarjeta compartida (pila con gap).
3. **LA LÍNEA VIAJERA en el filtro** (enmienda con frontera: en TABS la
   huella marca estado — Ley 6 intacta; en FILTROS la huella está
   SIEMPRE como identidad del glifo y la línea marca el estado): 2px,
   puntas redondas, al ancho del segmento, color = AA de la capa del
   oficio activo (primaria en "Todos"); viaja con
   `motion.duration.fast` + bezier(.32,.72,0,1); memorial = reemplazo
   directo; primer render sin viaje (no hay origen que mostrar). LAS
   CINCO CON ETIQUETA (B14 ②: nada comparable entre texto y glifos
   sueltos) — riesgo declarado al gate: con 4+ segmentos el ancho va
   justo en pantallas angostas (numberOfLines={1}; si trunca en
   dispositivo, la salida es tira scrolleable, no achicar tipografía).

## Para el gate (además de lo de B12 que sigue sin gatear)

- El canto sólido llegando a las puntas de CADA tarjeta, adelgazándose
  con la curva — Thor·Adiestramiento y Thor·Paseo ahora en tarjetas
  separadas, cada una con su canto entero.
- La línea viajando entre opciones del filtro.
- La densidad nueva del HOY (tarjetas con gap vs las filas apiladas de
  antes): más aire vertical — es consecuencia declarada de ①, el
  founder la juzga en la misma pasada.
