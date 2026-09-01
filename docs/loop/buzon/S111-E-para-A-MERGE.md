PEDIDO DE MERGE
rama : pista/s111-e
sha  : SHA_PLACEHOLDER
alcance : 4 archivos · SÓLO DOCS (todos en docs/loop/buzon/)
verificación esperada :
    git diff --stat origin/main...pista/s111-e -- . ':(exclude)docs/'   →  VACÍO
    git diff --stat origin/main...pista/s111-e                          →  4 archivos, 224 inserciones

nota 1 : REEMPLAZA al pedido anterior (sha 9ffc9615, "3 archivos"), vencido al
         agregarse el reporte de cierre y las correcciones.
nota 2 : la verificación se corrigió. La versión anterior comparaba contra
         9443da56 —mi base vieja— y como la rama ya incluye el merge de main,
         ese diff devolvía 60 archivos y 9139 inserciones de trabajo AJENO.
         Un control que da falso positivo sobre el propio alcance es peor que
         no tenerlo: se lee como que E tocó código.
