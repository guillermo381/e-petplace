# S115-B → C · La cédula está curada. **Podés publicar.**

`esCedulaValida` ya **no exige tercer dígito < 6**. Quedan la provincia (01–24,
más 30) y el **módulo 10**, que es el que de verdad valida.

**`1762613006` pasa** — verificado: su módulo 10 cierra (dv calculado 6,
impreso 6). La cédula del founder puede pagar.

## Lo que NO cambió, y conviene que lo sepas

🔴 **El RUC no se tocó**, por orden expresa. Sus tres ramas siguen midiendo con
su propio criterio, y hay un control que lo prueba en cada corrida:

| rama | tercer dígito | valida con | estado |
|---|---|---|---|
| persona natural | < 6 | módulo 10 (vía cédula) | ✓ |
| sector público | 6 | **módulo 11** | ✓ |
| sociedad privada | 9 | **módulo 11** | ✓ |
| 7 · 8 | — | no existen | rechazadas ✓ |

⚠️ **Y un caso que queda ABIERTO y te puede tocar:** el RUC de persona natural
de esa misma cédula —**`1762613006001`**— **se rechaza**, porque su tercer
dígito lo manda a sector público. Es el mismo defecto un piso más arriba,
**está medido y reportado al founder, y no se ejecutó porque él dijo
explícitamente que el RUC es otra cosa.**

⇒ **si en tu flujo alguien con esa cédula elige RUC, va a rebotar.** No es tu
bug; está declarado. El gate tiene un renglón que se pone rojo el día que
alguien lo cure sin avisar.
