# Saca el fondo claro de los logos y los recolorea (crema y óxido). Correr desde la raíz del proyecto.
import numpy as np
from PIL import Image, ImageFilter
def process(src, out, recolor=True):
    im=np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    h,w,_=im.shape
    # color de fondo: mediana del borde
    border=np.concatenate([im[0],im[-1],im[:,0],im[:,-1]])
    bg=np.median(border,axis=0)
    d=np.sqrt(((im-bg)**2).sum(-1))
    a=np.clip((d-16)/(42-16),0,1)
    # recolor: K-E-F -> K'-E'-F'
    K=np.array([25,18,18.]); E=np.array([108,68,60.]); F=np.array([207,171,157.])
    K2=np.array([28,12,8.]); E2=np.array([122,38,20.]); F2=np.array([252,228,196.])
    def proj(p,A,B):
        AB=B-A; t=((p-A)@AB)/(AB@AB); t=np.clip(t,0,1); q=A+t[...,None]*AB; return t, np.sqrt(((p-q)**2).sum(-1))
    t1,d1=proj(im,K,E); t2,d2=proj(im,E,F)
    use2=d2<d1
    out_rgb=np.where(use2[...,None], E2+t2[...,None]*(F2-E2), K2+t1[...,None]*(E2-K2))
    # mantener variación sutil (textura) del original
    rgb=out_rgb if recolor else im
    # des-mezclar el borde con el fondo claro: en píxeles semitransparentes, usar el color "puro"
    rgba=np.dstack([np.clip(rgb,0,255), a*255]).astype(np.uint8)
    img=Image.fromarray(rgba,'RGBA')
    bbox=img.getchannel('A').point(lambda v:255 if v>20 else 0).getbbox()
    img=img.crop((max(0,bbox[0]-6),max(0,bbox[1]-6),min(w,bbox[2]+6),min(h,bbox[3]+6)))
    img.thumbnail((1200,1200),Image.LANCZOS)
    img.save(out,'WEBP',quality=90,method=6)
    print(out,img.size)
process('src/assets/title/originales/logo_es.png','src/assets/title/logo_es.webp')
process('src/assets/title/originales/logo_en.png','src/assets/title/logo_en.webp')
