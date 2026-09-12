#!/usr/bin/env python3
"""
Lee un .hprof (convertido con `hprof-conv`) y dice QUÉ hay en el heap.

🔴 POR QUÉ EXISTE Y NO SE USA UNA HERRAMIENTA: no hay ninguna instalada, y
   bajar un profiler entero para contestar «qué clase ocupa el heap» es más
   caro que parsear el formato, que está documentado y es simple. Lo que hace
   falta son DOS números por clase —cuántas instancias y cuántos bytes— y eso
   sale de contar INSTANCE_DUMP y PRIMITIVE_ARRAY_DUMP.

⚠️ LO QUE NO HACE, declarado: NO calcula retenido (haría falta recorrer el
   grafo de referencias). Dice quién OCUPA, no quién RETIENE. Para «qué asigna
   20 MB/s» alcanza: el que llena aparece arriba igual.
"""
import struct, sys, collections

TAG_STRING, TAG_LOAD_CLASS = 0x01, 0x02
TAG_HEAP_DUMP, TAG_HEAP_SEG = 0x0C, 0x1C
SZ = {2:1,4:2,5:2,6:4,7:8,8:1,9:2,10:4,11:8}   # bool,char,float,double,byte,short,int,long
NOM = {2:'obj',4:'boolean[]',5:'char[]',6:'float[]',7:'double[]',8:'byte[]',9:'short[]',10:'int[]',11:'long[]'}

def leer(path):
    d = open(path,'rb').read()
    i = d.index(b'\0')+1
    idsz, = struct.unpack_from('>I', d, i); i += 4 + 8
    S = {}          # stringId -> texto
    CLS = {}        # classObjId -> stringId
    inst = collections.Counter()
    byts = collections.Counter()
    arr  = collections.Counter()
    arrb = collections.Counter()
    rid = lambda o: int.from_bytes(d[o:o+idsz],'big')

    while i < len(d) - 9:
        tag = d[i]; ln = struct.unpack_from('>I', d, i+5)[0]; cuerpo = i+9; fin = cuerpo+ln
        if tag == TAG_STRING:
            S[rid(cuerpo)] = d[cuerpo+idsz:fin].decode('utf-8','replace')
        elif tag == TAG_LOAD_CLASS:
            CLS[rid(cuerpo+4)] = rid(cuerpo+4+idsz+4)
        elif tag in (TAG_HEAP_DUMP, TAG_HEAP_SEG):
            p = cuerpo
            while p < fin:
                st = d[p]; p += 1
                if   st in (0xFF,):            p += idsz
                elif st in (0x01,):            p += idsz*2
                elif st in (0x02,0x03):        p += idsz+8
                elif st in (0x04,):            p += idsz+4
                elif st in (0x05,0x06,0x07):   p += idsz + (4 if st==0x06 else 0)
                elif st in (0x08,):            p += idsz+8
                elif st in (0x89,0x8a,0x8b,0x8d,0x8e): p += idsz
                elif st == 0x8c:               p += idsz+8
                elif st == 0x20:               # CLASS DUMP
                    q = p + idsz+4+idsz*6+4+4
                    n, = struct.unpack_from('>H', d, q); q += 2
                    for _ in range(n):
                        t = d[q+2]; q += 2+1+ (idsz if t==2 else SZ.get(t,4))
                    n, = struct.unpack_from('>H', d, q); q += 2; q += n*(idsz+1)
                    n, = struct.unpack_from('>H', d, q); q += 2; q += n*(idsz+1)
                    p = q
                elif st == 0x21:               # INSTANCE DUMP
                    c = rid(p+idsz+4); nb, = struct.unpack_from('>I', d, p+idsz+4+idsz)
                    inst[c] += 1; byts[c] += nb + idsz
                    p += idsz+4+idsz+4+nb
                elif st == 0x22:               # OBJECT ARRAY
                    ne, = struct.unpack_from('>I', d, p+idsz+4); c = rid(p+idsz+4+4)
                    arr[('obj',c)] += 1; arrb[('obj',c)] += ne*idsz
                    p += idsz+4+4+idsz+ne*idsz
                elif st == 0x23:               # PRIMITIVE ARRAY
                    ne, = struct.unpack_from('>I', d, p+idsz+4); t = d[p+idsz+4+4]
                    arr[('prim',t)] += 1; arrb[('prim',t)] += ne*SZ.get(t,1)
                    p += idsz+4+4+1+ne*SZ.get(t,1)
                else:
                    break
        i = fin
    return S, CLS, inst, byts, arr, arrb

S, CLS, inst, byts, arr, arrb = leer(sys.argv[1])
nom = lambda c: S.get(CLS.get(c,0), f'?{c:x}').replace('/', '.')

print('\n═══ TOP 25 POR BYTES (instancias) ═══')
print('  %-58s %10s %12s' % ('clase','instancias','MB'))
for c, b in byts.most_common(25):
    print('  %-58s %10d %12.2f' % (nom(c)[:56], inst[c], b/1048576))

print('\n═══ ARRAYS ═══')
todo = [(NOM.get(k[1],'obj[]') if k[0]=='prim' else 'Object[] '+nom(k[1])[:40], v, arr[k])
        for k, v in arrb.items()]
for n, b, q in sorted(todo, key=lambda x: -x[1])[:12]:
    print('  %-58s %10d %12.2f' % (n[:56], q, b/1048576))

tot = sum(byts.values()) + sum(arrb.values())
print('\n  TOTAL contabilizado: %.1f MB · %d clases · %d instancias'
      % (tot/1048576, len(inst), sum(inst.values())))
print('  ⚠️ Es lo que OCUPA, no lo que RETIENE: no recorre el grafo de referencias.\n')
