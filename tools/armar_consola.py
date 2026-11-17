# Arma src/assets/ui/console.webp a partir del dibujo de la computadora sobre fondo blanco:
# saca el fondo (todo lo claro conectado con los bordes), deja el brillo de la lamparita como halo
# semitransparente, recorta y lo lleva a 1600 px de ancho.
# Uso: python3 tools/armar_consola.py dibujo.png src/assets/ui/console.webp
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.int16)
h, w, _ = a.shape
mn, mx = a.min(axis=2), a.max(axis=2)
# "fondo": claro y casi sin color
bgish = (mn > 222) & (mx - mn < 22)
# relleno desde los bordes por los píxeles de fondo
seen = np.zeros((h, w), bool)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if bgish[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if bgish[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and bgish[ny, nx]:
            seen[ny, nx] = True; q.append((ny, nx))
# huecos encerrados entre cables y el resorte: blancos y sin color, fuera de las dos pantallas
# (las pantallas son crema o rosadas, nunca tan neutras)
from scipy import ndimage
hole = (~seen) & (mn > 232) & (mx - mn < 14)
lab, n = ndimage.label(hole)
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
sx, sy = w / 2560, h / 1428
screens = [(1075 * sx, 300 * sy, 1890 * sx, 1015 * sy), (1905 * sx, 860 * sy, 2070 * sx, 1040 * sy)]
for i, sl in enumerate(ndimage.find_objects(lab)):
    if sizes[i] < 25: continue
    cy, cx = (sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2
    if any(x0 < cx < x1 and y0 < cy < y1 for x0, y0, x1, y1 in screens): continue
    seen[sl] |= lab[sl] == i + 1
alpha = np.where(seen, 0, 255).astype(np.uint8)

# brillo de la lamparita: alrededor de la lamparita, el fondo amarillento queda como halo
# (más amarillo = más opaco), pintado de amarillo para que no se vea blanquecino sobre fondo oscuro
rgb = a.copy()
yy, xx = np.mgrid[0:h, 0:w]
bulb = (xx > 1120 * sx) & (xx < 1370 * sx) & (yy < 250 * sy)
yellow = np.clip((a[..., 0] - a[..., 2] - 6).astype(np.float32) / 60, 0, 1)
halo = seen & bulb
alpha[halo] = (yellow[halo] * 200).astype(np.uint8)
rgb[halo] = (255, 214, 110)
im = Image.fromarray(rgb.astype(np.uint8))

# borde suave: medio píxel de transición
al = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6))
rgba = im.copy(); rgba.putalpha(al)
bbox = Image.fromarray((np.asarray(al) > 8).astype(np.uint8) * 255).getbbox()
pad = 6
bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
rgba = rgba.crop(bbox)
W = 1600
rgba = rgba.resize((W, round(rgba.height * W / rgba.width)), Image.LANCZOS)
rgba.save(out, 'WEBP', quality=88, method=6)
print('bbox', bbox, 'size', rgba.size)
