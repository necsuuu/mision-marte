# Arma el fondo de la pantalla de inicio: extiende la ilustración hacia arriba (cielo con estrellas) y a los costados (colinas). Correr desde la raíz del proyecto.
import numpy as np, random
from PIL import Image, ImageFilter, ImageDraw
src=Image.open('src/assets/title/originales/fondo_tripulacion.png').convert('RGB')
W,H=2560,1440; s=0.85
ow,oh=int(src.width*s),int(src.height*s)
orig=src.resize((ow,oh),Image.LANCZOS)
O=np.asarray(orig).astype(np.float32)
ox=(W-ow)//2; oy=H-oh+170
def smooth1d(a,k=41):
    ker=np.exp(-np.linspace(-2.5,2.5,k)**2); ker/=ker.sum()
    pad=np.pad(a,((k//2,k//2),(0,0)),mode='edge')
    return np.stack([np.convolve(pad[:,c],ker,'valid') for c in range(3)],1)
Lc=smooth1d(np.median(O[:, :30],axis=1)); Rc=smooth1d(np.median(O[:, -30:],axis=1))
topc=(Lc[0]+Rc[0]+O[:15].reshape(-1,3).mean(0))/3
dark=np.array([66,12,10.])
C=np.zeros((H,W,3),np.float32)
for y in range(H):
    if y<oy:
        t=(y/oy)**0.85; C[y,:]=dark*(1-t)+topc*t
    else:
        yy=y-oy
        # mezcla horizontal suave entre el color de cielo del costado y el centro
        C[y,:ox+30]=Lc[yy]; C[y,ox+ow-30:]=Rc[yy]
        C[y,ox:ox+ow]=O[yy]
# ruido suave en el cielo
nz=np.asarray(Image.effect_noise((W//10,H//10),30).resize((W,H),Image.BICUBIC)).astype(np.float32)-128
C+=nz[...,None]*0.06
canvas=Image.fromarray(np.clip(C,0,255).astype(np.uint8))
dr=ImageDraw.Draw(canvas)
# horizonte de los costados: colinas lejanas oscuras + suelo en sombra
random.seed(7)
def hills(x0,x1,base,side):
    pts=[]; amp=[60,28,12]; fr=[0.004,0.013,0.04]; ph=[random.random()*9 for _ in amp]
    for x in range(x0,x1+1,4):
        h=sum(a*np.sin(x*f+p) for a,f,p in zip(amp,fr,ph))
        # sube un poco hacia el centro para unirse con el suelo del original
        d=(x-x0)/(x1-x0) if side=='L' else 1-(x-x0)/(x1-x0)
        pts.append((x, base-40+h-30*d))
    return pts
for side in ('L','R'):
    x0,x1=(0,ox+260) if side=='L' else (ox+ow-260,W)
    g=oy+(int(oh*0.70))
    far=hills(x0,x1,g-30,side)
    dr.polygon(far+[(x1,H),(x0,H)],fill=(92,34,26))
    near=hills(x0,x1,g+40,side)
    dr.polygon(near+[(x1,H),(x0,H)],fill=(56,52,60))
    near2=hills(x0,x1,g+110,side)
    dr.polygon(near2+[(x1,H),(x0,H)],fill=(40,40,48))
# piedritas
for i in range(500):
    side=random.random()<0.5
    x=random.randrange(0,ox+40) if side else random.randrange(ox+ow-40,W)
    y=random.randrange(oy+int(oh*0.75),H)
    r=random.randint(2,9); c=random.randint(55,95)
    dr.ellipse((x-r,y-r*0.6,x+r,y+r*0.6),fill=(c,c,c+8),outline=(25,25,30))
canvas=canvas.filter(ImageFilter.GaussianBlur(0.6))
# el original arriba, con bordes laterales fundidos
xs=np.arange(ow); ys=np.arange(oh); F=90
arr=np.minimum(np.clip(np.minimum(xs,ow-1-xs)/F,0,1)[None,:],np.clip(ys/160,0,1)[:,None])
canvas.paste(orig,(ox,oy),Image.fromarray((arr*255).astype(np.uint8)))
# estrellas en el cielo nuevo
dr=ImageDraw.Draw(canvas); random.seed(4)
for i in range(340):
    x=random.randrange(W); y=random.randrange(int(oy+oh*0.55))
    if ox-10<x<ox+ow+10 and y>oy: continue
    r=random.choice([1,1,1,2,2,3]); col=random.choice([(255,226,140),(255,240,200),(255,205,120)])
    dr.ellipse((x-r,y-r,x+r,y+r),fill=col)
# viñeta
yy,xx=np.mgrid[0:H,0:W]
v=1-0.62*np.clip(((xx-W/2)/(W/2))**2*0.9+((yy-H*0.45)/(H*0.7))**2*0.45-0.32,0,1)
c=np.asarray(canvas).astype(np.float32)*v[...,None]
canvas=Image.fromarray(np.clip(c,0,255).astype(np.uint8))
canvas.save('src/assets/title/title_bg.webp','WEBP',quality=82,method=6)

