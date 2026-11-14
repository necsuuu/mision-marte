from PIL import Image, ImageFilter; import numpy as np; from scipy import ndimage as nd
OUT='src/assets/characters/walk/'
def gap_col(alpha, H):
    band=alpha[int(H*0.80):int(H*0.88)]
    col=(band>40).sum(0)
    W=alpha.shape[1]
    # buscar la corrida de columnas vacías más cercana al centro de masa inferior
    xs=np.where(col>0)[0]; cx=int(xs.mean())
    best=None
    for x in range(int(W*0.2),int(W*0.8)):
        if col[x]==0:
            d=abs(x-cx)
            if best is None or d<best[0]: best=(d,x)
    return best[1] if best else cx
for name in ['select_woman','select_man','skin_man','skin_woman']:
    im=Image.open(f'src/assets/characters/originales/{name}.png').convert('RGBA'); a=np.array(im).astype(np.int32)
    H,W=a.shape[:2]
    rgb=a[...,:3]; br=rgb.mean(2); sat=rgb.max(2)-rgb.min(2); al=a[...,3]
    # quitar la sombra del piso (gris, abajo)
    rows=np.arange(H)[:,None]
    shadow=(rows>H*0.9)&(sat<26)&(br>100)&(br<225)&(al>0)
    a[shadow,3]=0
    al=a[...,3]
    gx=gap_col(al,H)
    knee=int(H*0.70); lift=int(H*0.035)
    def lifted(left, dx):
        top=knee-90
        low=int(H*0.76)
        legmask=np.zeros((H,W),bool)
        if left: legmask[top:low,:gx]=True
        else: legmask[top:low,gx:]=True
        reg=a[low:,:,3]>20
        lab,n=nd.label(reg); sizes=nd.sum(reg,lab,range(1,n+1))
        order=np.argsort(sizes)[::-1][:2]+1
        if n>=2 and sizes[order[1]-1]>2000:
            cx=[np.where(lab==k)[1].mean() for k in order]
            k=order[0] if (cx[0]<cx[1])==left else order[1]
            legmask[low:]=lab==k
        else:
            if left: legmask[low:,:gx]=True
            else: legmask[low:,gx:]=True
        f=a.copy()
        f[legmask]=0
        for y in range(top,H):
            t=min(1,max(0,(y-top)/90)); t=t*t*(3-2*t)
            sy=int(round(y+lift*t))
            if sy<H:
                m=legmask[sy]
                f[y,m]=a[sy,m]
        # limpiar pixeles sueltos
        m=f[...,3]>20
        lab,n=nd.label(m); sizes=nd.sum(m,lab,range(1,n+1))
        small=np.isin(lab,[i+1 for i,z in enumerate(sizes) if z<600])
        f[small,3]=0
        return f
    frames=[a, lifted(True,0), a, lifted(False,0)]
    for i,f in enumerate(frames):
        img=Image.fromarray(f.astype('uint8'),'RGBA')
        img.save(f'{OUT}{name}_{i}.webp',quality=86,method=6)
    print(name,'gap',gx,'of',W)
