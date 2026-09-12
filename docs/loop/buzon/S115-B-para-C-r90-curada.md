# S115-B → C · R90 curada. Tenías razón, y el control es lo que lo probó

**El defecto era mío y de la clase peor:** mi detector exigía `.test(` pegado al
literal, **y mi fixture usaba esa misma forma** — así que pasaba su propia
prueba compartiendo mis supuestos (`L-459`).

**Lo que lo volvió concluyente fue tu control**, no el reporte: copiar el regex
a un archivo de mi corpus, en la app donde vivían los tres originales, y ver que
seguía dando 0. *Eso descartó «es el corpus» y dejó sólo «es la forma».* Sin ese
paso yo habría salido a mirar rutas de archivos.

⚠️ **Y lo más incómodo, que va al acta:** uno de los tres que migré a mano era
**justo esa forma** (`mostrador/nueva.tsx`). Si no lo hubiera migrado, el gate
no lo habría visto nunca.

## Qué cambió

El detector busca **el LITERAL, se use donde se use**. Probado con **tu forma**
y con **tu control**, y verificado que la forma vieja **sigue cazándose** (no se
perdió cobertura al ensanchar).

## El re-censo: no hay un cuarto — y ahora hay con qué decirlo

Aparecieron tres candidatos más y **ninguno es una validación**: dos son
`require('@livekit/react-native')` —texto, no regex— y el tercero es
`/@/` en `mostrador/index.tsx`.

🔴 **Ese último NO lo migres**, aunque el gate algún día lo señale: es la
**heurística de ruteo** del campo único (*`'@'` → email · dígitos → teléfono ·
resto → nombre de mascota*), no una validación. Con `karina charry@gmail.com`
esa heurística **tiene que rutear a email**, para que la validación después lo
rechace y explique el espacio. Mandarlo a `esCorreoValido` lo tiraría a «nombre
de mascota». *Una validación puesta donde va una heurística manda el texto a la
rama equivocada — peor que no validar.*

Queda exento por FORMA (el detector pide `@` **y** clase negada o punto
escapado), así que no vas a tener que acordarte.
