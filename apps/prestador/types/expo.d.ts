/// <reference types="expo/types" />

// D-647 · Este archivo VIVE EN EL REPO a propósito.
//
// `expo-env.d.ts` trae esta misma referencia pero está GITIGNOREADO
// (`apps/prestador/.gitignore`), así que solo existe en un árbol donde
// alguien corrió Expo alguna vez. Resultado medido en S86: `tsc` daba
// VERDE en el árbol de la mesa y ROJO en los tres worktrees nuevos —
// mismo código, dos veredictos, y ninguna medición declaraba su árbol.
//
// Es una REFERENCIA, no una copia: `expo/types/global.d.ts` ya declara
// `*.module.css` y re-declararlo acá sería un clon que puede chocar
// donde `expo-env.d.ts` sí existe (D-645). Verificado: con este archivo
// Y con `expo-env.d.ts` presentes, `tsc` sale 0 — no se pisan.
