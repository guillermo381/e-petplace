# VARA DE COHERENCIA — S116 · app cliente

> Destino: `docs/VARA_COHERENCIA_S116.md`. Toda pantalla que una pista entregue en S116 responde estas diez preguntas en su parte, con sí/no y evidencia (captura o gate). Un «no» sin ficha no cierra el lote. La mesa usa la misma lista.

1. **Una sola cabecera.** ¿Es la `Cabecera` de la casa (raíz o empujada), sin círculos decorativos, marca de agua ni título propio?
2. **Tabs solo en raíz.** ¿Si es empujada, no hay barra de tabs y el único fijo abajo es el CTA? ¿Si es raíz, están las cinco y el asistente?
3. **Un acento.** ¿Hay UNA cosa magenta que grita (el CTA) y todo lo demás calla? Sin ocre, sin morado del coach, sin bordes negros.
4. **Baloo arriba, PJS abajo.** ¿Título de pantalla, título de sección y cifra en Baloo; todo lo demás en Plus Jakarta; nada en mono ni serif?
5. **Nada local.** ¿Cada cosa que se ve es una pieza del catálogo v5 con sus tokens? ¿Lo que faltó se pidió por buzón, no se dibujó?
6. **Plata y fecha por su riel.** ¿Toda cifra de dinero pasa por `moneda.ts` ($6,00) y toda fecha por el riel de fechas (sáb 13 sep · 3:00 p. m.)?
7. **Estado con palabra.** ¿Ningún estado se dice solo con color? ¿Las pastillas llevan texto?
8. **Vacío honesto.** ¿Cuando no hay dato, la pantalla lo dice y no rellena? ¿Lo que no se sabe viaja NULL y se dibuja como tal?
9. **Movimiento que dice algo.** ¿Cada animación pasa L-c (si se quita, la pantalla dice menos)? ¿Las transiciones son las del router, no propias?
10. **Voz.** ¿Tuteo neutro, sin género, sin motivo técnico, con las tres voces de «no cargó» donde corresponde?

Y una pregunta de cierre por lote, no por pantalla: **¿bajó el conteo de piezas locales de `apps/cliente`?** (`verify:piezas-locales`). Si no bajó, el lote absorbió cero y se dice por qué.
